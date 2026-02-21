import { createServer } from 'node:http';
import { createClient } from '@supabase/supabase-js';
import webPush from 'web-push';

const env = {
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  webPushPublicKey: process.env.WEB_PUSH_PUBLIC_KEY || '',
  webPushPrivateKey: process.env.WEB_PUSH_PRIVATE_KEY || '',
  webPushSubject: process.env.WEB_PUSH_SUBJECT || 'mailto:admin@example.com',
  port: Number(process.env.PORT || 3001),
  runOnStartup: process.env.RUN_ON_STARTUP !== 'false',
  runOnce: process.env.RUN_ONCE === 'true',
  autoRun: process.env.AUTO_RUN !== 'false',
  intervalMs: Number(process.env.REMINDER_CHECK_INTERVAL_MS || 60_000),
  lookbackHours: Number(process.env.APPOINTMENT_LOOKBACK_HOURS || 24),
  lookaheadHours: Number(process.env.APPOINTMENT_LOOKAHEAD_HOURS || 168),
  dispatchWindowMs: Number(process.env.DISPATCH_WINDOW_MS || 10 * 60 * 1000),
  runToken: process.env.RUN_TRIGGER_TOKEN || '',
};

const assertRequiredEnv = () => {
  const missing = [];
  if (!env.supabaseUrl) missing.push('SUPABASE_URL');
  if (!env.supabaseServiceRoleKey) missing.push('SUPABASE_SERVICE_ROLE_KEY');
  if (!env.webPushPublicKey) missing.push('WEB_PUSH_PUBLIC_KEY');
  if (!env.webPushPrivateKey) missing.push('WEB_PUSH_PRIVATE_KEY');
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
};

assertRequiredEnv();

const supabase = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

webPush.setVapidDetails(env.webPushSubject, env.webPushPublicKey, env.webPushPrivateKey);

let runInProgress = false;
let lastRunAt = null;
let lastResult = null;

const parseReminderMinutes = (value) => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => Number(item?.minutes_before))
    .filter((minutes) => Number.isFinite(minutes) && minutes > 0);
};

const toUniqueUserIds = (appointment) => {
  const recipients = new Set();
  if (Array.isArray(appointment.examiner_ids)) {
    for (const examinerId of appointment.examiner_ids) {
      if (typeof examinerId === 'string' && examinerId.length > 0) {
        recipients.add(examinerId);
      }
    }
  }

  if (typeof appointment.created_by === 'string' && appointment.created_by.length > 0) {
    recipients.add(appointment.created_by);
  }

  return [...recipients];
};

const formatDateTime = (isoValue) => {
  try {
    return new Intl.DateTimeFormat('hr-HR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(isoValue));
  } catch {
    return isoValue;
  }
};

const createPushPayload = (appointment, minutesBefore) => {
  const startLabel = formatDateTime(appointment.start);
  const parts = [`Početak: ${startLabel}`];
  if (appointment.location) {
    parts.push(`Lokacija: ${appointment.location}`);
  }

  return JSON.stringify({
    title: `Podsjetnik: ${appointment.title}`,
    body: `${minutesBefore} min prije termina • ${parts.join(' • ')}`,
    tag: `appointment-${appointment.id}-${minutesBefore}`,
    data: {
      url: '/calendar',
      appointmentId: appointment.id,
      minutesBefore,
    },
  });
};

const deactivateSubscription = async (subscriptionId) => {
  const { error } = await supabase
    .from('push_subscriptions')
    .update({ is_active: false, last_seen_at: new Date().toISOString() })
    .eq('id', subscriptionId);

  if (error) {
    console.error('[push-worker] Failed to deactivate subscription:', subscriptionId, error.message);
  }
};

const markDeliveryStatus = async (deliveryId, status, errorMessage = null) => {
  const updatePayload = {
    status,
    error: errorMessage,
    sent_at: status === 'sent' ? new Date().toISOString() : null,
  };

  const { error } = await supabase
    .from('push_reminder_deliveries')
    .update(updatePayload)
    .eq('id', deliveryId);

  if (error) {
    console.error('[push-worker] Failed to update delivery status:', deliveryId, error.message);
  }
};

const createDeliveryRecord = async (appointmentId, subscriptionId, minutesBefore, scheduledFor) => {
  const payload = {
    appointment_id: appointmentId,
    subscription_id: subscriptionId,
    reminder_minutes_before: minutesBefore,
    scheduled_for: new Date(scheduledFor).toISOString(),
    status: 'failed',
    error: 'pending',
  };

  const { data, error } = await supabase
    .from('push_reminder_deliveries')
    .insert(payload)
    .select('id')
    .single();

  if (!error) {
    return { deliveryId: data.id, duplicate: false };
  }

  // 23505 = unique violation; this reminder was already processed.
  if (error.code === '23505') {
    return { deliveryId: null, duplicate: true };
  }

  console.error('[push-worker] Failed to create delivery record:', error.message);
  return { deliveryId: null, duplicate: false };
};

const fetchCandidateAppointments = async (nowMs) => {
  const rangeStart = new Date(nowMs - (env.lookbackHours * 60 * 60 * 1000)).toISOString();
  const rangeEnd = new Date(nowMs + (env.lookaheadHours * 60 * 60 * 1000)).toISOString();

  const { data, error } = await supabase
    .from('calendar_events')
    .select('id,title,start,location,created_by,examiner_ids,reminder_enabled,reminder_times')
    .eq('reminder_enabled', true)
    .gte('start', rangeStart)
    .lte('start', rangeEnd);

  if (error) {
    throw new Error(`Failed to fetch candidate appointments: ${error.message}`);
  }

  return data || [];
};

const sendPushToSubscription = async (subscription, payload) => {
  return webPush.sendNotification(
    {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.p256dh,
        auth: subscription.auth,
      },
    },
    payload,
    {
      TTL: 60,
      urgency: 'high',
    },
  );
};

const dispatchDueReminders = async (trigger) => {
  if (runInProgress) {
    return {
      ok: true,
      skipped: true,
      reason: 'already_running',
      trigger,
    };
  }

  runInProgress = true;
  const startedAt = new Date().toISOString();
  const nowMs = Date.now();

  const stats = {
    trigger,
    startedAt,
    processedAppointments: 0,
    dueReminders: 0,
    attemptedDeliveries: 0,
    sentDeliveries: 0,
    failedDeliveries: 0,
    duplicateDeliveries: 0,
    deactivatedSubscriptions: 0,
  };

  try {
    const appointments = await fetchCandidateAppointments(nowMs);
    stats.processedAppointments = appointments.length;

    for (const appointment of appointments) {
      const appointmentStartMs = new Date(appointment.start).getTime();
      if (!Number.isFinite(appointmentStartMs)) {
        continue;
      }

      const reminderMinutes = parseReminderMinutes(appointment.reminder_times);
      if (reminderMinutes.length === 0) {
        continue;
      }

      const recipients = toUniqueUserIds(appointment);
      if (recipients.length === 0) {
        continue;
      }

      const { data: subscriptions, error: subscriptionsError } = await supabase
        .from('push_subscriptions')
        .select('id,user_id,endpoint,p256dh,auth,is_active')
        .in('user_id', recipients)
        .eq('is_active', true);

      if (subscriptionsError) {
        console.error('[push-worker] Failed to fetch subscriptions:', subscriptionsError.message);
        continue;
      }

      if (!subscriptions || subscriptions.length === 0) {
        continue;
      }

      for (const minutesBefore of reminderMinutes) {
        const scheduledForMs = appointmentStartMs - (minutesBefore * 60 * 1000);
        if (scheduledForMs > nowMs) {
          continue;
        }

        if (nowMs - scheduledForMs > env.dispatchWindowMs) {
          continue;
        }

        stats.dueReminders += 1;
        const pushPayload = createPushPayload(appointment, minutesBefore);

        for (const subscription of subscriptions) {
          const { deliveryId, duplicate } = await createDeliveryRecord(
            appointment.id,
            subscription.id,
            minutesBefore,
            scheduledForMs,
          );

          if (duplicate) {
            stats.duplicateDeliveries += 1;
            continue;
          }

          if (!deliveryId) {
            continue;
          }

          stats.attemptedDeliveries += 1;

          try {
            await sendPushToSubscription(subscription, pushPayload);
            await markDeliveryStatus(deliveryId, 'sent', null);
            stats.sentDeliveries += 1;
          } catch (error) {
            const statusCode = Number(error?.statusCode || error?.status || 0);
            const errorMessage = String(error?.body || error?.message || 'Unknown push error').slice(0, 500);

            await markDeliveryStatus(deliveryId, 'failed', errorMessage);
            stats.failedDeliveries += 1;

            if (statusCode === 404 || statusCode === 410) {
              await deactivateSubscription(subscription.id);
              stats.deactivatedSubscriptions += 1;
            }
          }
        }
      }
    }

    return {
      ok: true,
      skipped: false,
      ...stats,
      finishedAt: new Date().toISOString(),
    };
  } catch (error) {
    return {
      ok: false,
      skipped: false,
      ...stats,
      error: String(error?.message || error || 'Unknown error'),
      finishedAt: new Date().toISOString(),
    };
  } finally {
    runInProgress = false;
    lastRunAt = new Date().toISOString();
  }
};

const runAndStoreResult = async (trigger) => {
  const result = await dispatchDueReminders(trigger);
  lastResult = result;
  if (result.ok) {
    console.log('[push-worker] run completed:', JSON.stringify(result));
  } else {
    console.error('[push-worker] run failed:', JSON.stringify(result));
  }
  return result;
};

const getHealthPayload = () => {
  return {
    status: 'ok',
    now: new Date().toISOString(),
    runInProgress,
    lastRunAt,
    lastResult,
  };
};

const isAuthorizedRunRequest = (req) => {
  if (!env.runToken) return true;
  const headerToken = req.headers['x-run-token'];
  return typeof headerToken === 'string' && headerToken === env.runToken;
};

const server = createServer(async (req, res) => {
  if (!req.url) {
    res.writeHead(400, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ error: 'Invalid request URL' }));
    return;
  }

  const url = new URL(req.url, `http://localhost:${env.port}`);

  if (url.pathname === '/health' && req.method === 'GET') {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify(getHealthPayload()));
    return;
  }

  if (url.pathname === '/run' && (req.method === 'POST' || req.method === 'GET')) {
    if (!isAuthorizedRunRequest(req)) {
      res.writeHead(401, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ error: 'Unauthorized run trigger' }));
      return;
    }

    const result = await runAndStoreResult('manual_http');
    res.writeHead(result.ok ? 200 : 500, { 'content-type': 'application/json' });
    res.end(JSON.stringify(result));
    return;
  }

  res.writeHead(404, { 'content-type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

const startServer = () => new Promise((resolve) => {
  server.listen(env.port, () => {
    console.log(`[push-worker] listening on :${env.port}`);
    resolve();
  });
});

const startInterval = () => {
  if (!env.autoRun) return;
  setInterval(() => {
    void runAndStoreResult('interval');
  }, env.intervalMs);
};

const main = async () => {
  if (env.runOnce) {
    const result = await runAndStoreResult('run_once');
    process.exit(result.ok ? 0 : 1);
    return;
  }

  await startServer();

  if (env.runOnStartup) {
    void runAndStoreResult('startup');
  }

  startInterval();
};

main().catch((error) => {
  console.error('[push-worker] fatal error:', error);
  process.exit(1);
});
