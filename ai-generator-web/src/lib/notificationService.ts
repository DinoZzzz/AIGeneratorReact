import { supabase } from './supabase';

const NOTIFICATIONS_ENABLED_STORAGE_KEY = 'app.notifications.enabled';
const REMINDER_HISTORY_STORAGE_KEY = 'app.notifications.reminder-history';
const NOTIFICATIONS_CHANGED_EVENT = 'app-notifications-changed';
const REMINDER_HISTORY_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 14; // 14 days
const REMINDER_HISTORY_MAX_ENTRIES = 500;
const WEB_PUSH_PUBLIC_KEY = import.meta.env.VITE_WEB_PUSH_PUBLIC_KEY;

type NotificationSupportStatus = NotificationPermission | 'unsupported';
type ReminderHistoryMap = Record<string, number>;
type PushSubscriptionFailureReason =
  | 'unsupported'
  | 'permission_denied'
  | 'missing_public_key'
  | 'service_worker_not_ready'
  | 'supabase_error'
  | 'subscription_error';

export interface PushSubscriptionResult {
  success: boolean;
  reason?: PushSubscriptionFailureReason;
}

interface PushSubscriptionRow {
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  expiration_time: string | null;
  user_agent: string;
  is_active: boolean;
  last_seen_at: string;
}

export interface AppNotificationOptions {
  title: string;
  body?: string;
  tag?: string;
  data?: Record<string, unknown>;
  icon?: string;
  badge?: string;
  requireInteraction?: boolean;
}

const hasWindow = () => typeof window !== 'undefined';

const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from(rawData, (char) => char.charCodeAt(0));
};

const buildPushSubscriptionRow = (userId: string, subscription: PushSubscription): PushSubscriptionRow => {
  const serialized = subscription.toJSON();
  const p256dh = serialized.keys?.p256dh;
  const auth = serialized.keys?.auth;
  if (!serialized.endpoint || !p256dh || !auth) {
    throw new Error('Invalid push subscription payload');
  }

  return {
    user_id: userId,
    endpoint: serialized.endpoint,
    p256dh,
    auth,
    expiration_time: serialized.expirationTime ? new Date(serialized.expirationTime).toISOString() : null,
    user_agent: navigator.userAgent,
    is_active: true,
    last_seen_at: new Date().toISOString(),
  };
};

const readReminderHistory = (): ReminderHistoryMap => {
  if (!hasWindow()) return {};
  const raw = localStorage.getItem(REMINDER_HISTORY_STORAGE_KEY);
  if (!raw) return {};

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {};
    }

    return Object.fromEntries(
      Object.entries(parsed).filter(
        ([key, value]) => typeof key === 'string' && typeof value === 'number' && Number.isFinite(value),
      ),
    );
  } catch {
    return {};
  }
};

const writeReminderHistory = (history: ReminderHistoryMap): void => {
  if (!hasWindow()) return;
  localStorage.setItem(REMINDER_HISTORY_STORAGE_KEY, JSON.stringify(history));
};

const compactReminderHistory = (history: ReminderHistoryMap, now: number): ReminderHistoryMap => {
  const activeEntries = Object.entries(history)
    .filter(([, timestamp]) => now - timestamp <= REMINDER_HISTORY_MAX_AGE_MS)
    .sort((left, right) => right[1] - left[1])
    .slice(0, REMINDER_HISTORY_MAX_ENTRIES);

  return Object.fromEntries(activeEntries);
};

export const isNotificationSupported = (): boolean => {
  if (!hasWindow()) return false;
  return 'Notification' in window;
};

export const isPushSupported = (): boolean => {
  if (!hasWindow()) return false;
  return isNotificationSupported() && 'serviceWorker' in navigator && 'PushManager' in window;
};

export const isWebPushConfigured = (): boolean => {
  return typeof WEB_PUSH_PUBLIC_KEY === 'string' && WEB_PUSH_PUBLIC_KEY.trim().length > 0;
};

export const getNotificationPermissionStatus = (): NotificationSupportStatus => {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
};

export const isNotificationsEnabled = (): boolean => {
  if (!hasWindow()) return false;
  return localStorage.getItem(NOTIFICATIONS_ENABLED_STORAGE_KEY) === 'true';
};

export const setNotificationsEnabled = (enabled: boolean): void => {
  if (!hasWindow()) return;
  localStorage.setItem(NOTIFICATIONS_ENABLED_STORAGE_KEY, enabled ? 'true' : 'false');
  window.dispatchEvent(new CustomEvent(NOTIFICATIONS_CHANGED_EVENT, { detail: { enabled } }));
};

export const requestNotificationPermission = async (): Promise<NotificationSupportStatus> => {
  if (!isNotificationSupported()) return 'unsupported';

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  try {
    return await Notification.requestPermission();
  } catch {
    return Notification.permission;
  }
};

export const registerPushSubscription = async (userId: string): Promise<PushSubscriptionResult> => {
  if (!isPushSupported()) {
    return { success: false, reason: 'unsupported' };
  }

  if (!isWebPushConfigured()) {
    return { success: false, reason: 'missing_public_key' };
  }

  if (Notification.permission !== 'granted') {
    return { success: false, reason: 'permission_denied' };
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    if (!registration.pushManager) {
      return { success: false, reason: 'service_worker_not_ready' };
    }

    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(WEB_PUSH_PUBLIC_KEY),
      });
    }

    const payload = buildPushSubscriptionRow(userId, subscription);
    const { error } = await supabase
      .from('push_subscriptions')
      .upsert(payload, { onConflict: 'endpoint' });

    if (error) {
      console.error('Failed to upsert push subscription:', error);
      return { success: false, reason: 'supabase_error' };
    }

    return { success: true };
  } catch (error) {
    console.error('Failed to register push subscription:', error);
    return { success: false, reason: 'subscription_error' };
  }
};

export const unregisterPushSubscription = async (userId: string): Promise<void> => {
  if (!isPushSupported()) return;

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) return;

    const endpoint = subscription.endpoint;
    await subscription.unsubscribe();

    const { error } = await supabase
      .from('push_subscriptions')
      .delete()
      .eq('endpoint', endpoint)
      .eq('user_id', userId);

    if (error) {
      console.error('Failed to remove push subscription from Supabase:', error);
    }
  } catch (error) {
    console.error('Failed to unregister push subscription:', error);
  }
};

export const syncPushSubscriptionIfEnabled = async (userId: string): Promise<void> => {
  if (!isNotificationsEnabled()) return;
  if (getNotificationPermissionStatus() !== 'granted') return;
  if (!isWebPushConfigured()) return;
  await registerPushSubscription(userId);
};

export const buildAppointmentReminderNotificationKey = (
  appointmentId: string,
  startIso: string,
  minutesBefore: number,
): string => `${appointmentId}:${startIso}:${minutesBefore}`;

export const pruneStoredReminderHistory = (): void => {
  const now = Date.now();
  const compacted = compactReminderHistory(readReminderHistory(), now);
  writeReminderHistory(compacted);
};

export const claimReminderNotification = (key: string, now: number = Date.now()): boolean => {
  const currentHistory = compactReminderHistory(readReminderHistory(), now);
  if (currentHistory[key]) {
    return false;
  }

  currentHistory[key] = now;
  writeReminderHistory(currentHistory);
  return true;
};

export const showSystemNotification = async (options: AppNotificationOptions): Promise<boolean> => {
  if (!isNotificationSupported()) return false;
  if (Notification.permission !== 'granted') return false;

  const payload: NotificationOptions = {
    body: options.body,
    tag: options.tag,
    data: options.data,
    icon: options.icon || '/icon-192x192.png',
    badge: options.badge || '/icon-192x192.png',
    requireInteraction: options.requireInteraction ?? false,
  };

  try {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(options.title, payload);
      return true;
    }
  } catch (error) {
    console.debug('Falling back to Notification constructor:', error);
  }

  try {
    const notification = new Notification(options.title, payload);
    notification.onclick = () => {
      notification.close();
      const target = options.data?.url;
      if (typeof target === 'string') {
        window.focus();
        window.location.assign(target);
      }
    };
    return true;
  } catch {
    return false;
  }
};

export const notificationEvents = {
  changed: NOTIFICATIONS_CHANGED_EVENT,
};
