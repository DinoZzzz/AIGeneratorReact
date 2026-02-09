# Offline Release Monitoring Checklist

## Immediate (0-1h after deploy)

1. Confirm `npm run test:e2e:staging` passes against production-like environment.
2. Validate key routes manually on mobile Safari and desktop Chrome.
3. Check Sentry for fresh `TypeError: Importing a module script failed` events.

## Short Window (24-48h)

1. Watch Sentry issues for sync/offline tags:
   - `transaction:/customers/*/constructions/*/reports`
   - `environment:production`
   - `level:error`
2. Verify new sync telemetry breadcrumbs are present on failures:
   - `Offline sync operation telemetry`
   - `Offline sync operation failed`
3. Confirm no new weak-password/offline-examiner regression errors.

## Rollback Signals

1. Repeated module import failures on iOS Safari after deployment.
2. Rising `History save failed` with new `sync_operation` upload failures.
3. Significant increase in conflict retries not resolving within 24h.

## Exit Criteria

1. No critical/High-priority regressions in Sentry for 48h.
2. Offline create/edit/delete flows validated on iOS Safari + Android Chrome.
3. Queue depth stabilizes and does not grow unbounded for active users.
