# Offline QA Matrix

## Target Platforms

| Platform | Browser | Device Class | Notes |
| --- | --- | --- | --- |
| iOS 18+ | Safari | iPhone | Validate PWA install + background sync behavior |
| Android 14+ | Chrome | Phone | Validate install prompt + reconnect sync |
| Windows 11 | Edge | Desktop | Validate long offline sessions |
| macOS 14+ | Safari/Chrome | Desktop | Validate service worker update paths |

## Core Offline Scenarios

| Area | Scenario | Expected Result |
| --- | --- | --- |
| Customers | Create/update/delete offline | Operations queued, UI updates immediately, sync completes after reconnect |
| Constructions | Create/update/delete offline | Operations queued and replayed in order, dependency deletes remain safe |
| Reports | Create/update/delete/reorder offline | Local state persists, no data loss after refresh, sync reconciles server IDs |
| Examiners | Offline create | Examiner is queued without plain password persistence; sync sends reset-password email flow |
| Materials | Offline create/update/delete | Changes persist locally and sync on reconnect |
| Certifiers | Offline signature upload/delete | Signature preview persists across refresh, upload/delete syncs later |
| Schemes | Offline image upload + metadata edit | New image preview persists across refresh, sync applies when online |
| Profile | Offline avatar upload | Avatar preview persists across refresh and syncs on reconnect |
| Report files | Offline attachment upload/delete | Attachment preview persists across refresh, queued upload/delete resolves on reconnect |
| Template | Offline template upload queue | Active template shows pending state and sync completes once online |

## Sync/Conflict Scenarios

| Scenario | Expected Result |
| --- | --- |
| Network drop during sync | Failed operation is retried with backoff and status remains visible |
| Conflict: use server | Local queued operation removed, server state is restored locally |
| Conflict: keep local | Operation either force-applies local data or is queued for retry with clear status |
| Upload queue limits exceeded | Old/stale upload operations are evicted and stale temp report-file rows are cleaned |

## Regression Checklist

1. PWA install works and service worker activates without module import failures.
2. Background sync (`offline-sync` / periodic) posts completion messages to the app.
3. No plain-text examiner password exists in IndexedDB queued operations.
4. Sentry receives telemetry breadcrumbs for upload sync outcomes and conflict outcomes.
5. Offline queue panel counts remain accurate after cleanup and reconnect.

## Automated Baseline

1. Run local smoke suite: `npm run test:e2e`
2. Run staging smoke suite: `npm run test:e2e:staging`
3. Run unit/logic coverage: `npm test -- --run`
