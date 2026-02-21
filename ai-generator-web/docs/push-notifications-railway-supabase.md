# Push Notifications (Railway + Supabase)

Ovaj dokument pokriva "prave" Web Push notifikacije koje rade i kada aplikacija nije otvorena.

## 1) Supabase SQL migracija

Pokreni SQL iz:

`ai-generator-web/supabase/migrations/20260221_add_push_notifications.sql`

To dodaje:
- `push_subscriptions` (pretplate korisnika po uređaju/browseru)
- `push_reminder_deliveries` (deduplikacija i audit slanja)
- RLS politike za sigurnost

## 2) VAPID ključevi

Generiraj VAPID par:

```bash
cd push-worker
npm install
npm run generate:vapid
```

Spremi izlaz:
- `publicKey` -> frontend varijabla
- `privateKey` -> Railway worker tajna

## 3) Frontend (Railway web service) varijabla

U Railway service koji deploya `ai-generator-web` dodaj:

- `VITE_WEB_PUSH_PUBLIC_KEY=<publicKey>`

Napomena: ova varijabla je javna i smije biti u frontendu.

## 4) Push worker (Railway dodatni service)

Kreiraj novi Railway service iz istog repozitorija koji koristi:

- `push-worker/railway.json`
- `push-worker/Dockerfile`

Obavezne varijable:

- `SUPABASE_URL=https://<project-ref>.supabase.co`
- `SUPABASE_SERVICE_ROLE_KEY=<service-role-key>`
- `WEB_PUSH_PUBLIC_KEY=<publicKey>`
- `WEB_PUSH_PRIVATE_KEY=<privateKey>`
- `WEB_PUSH_SUBJECT=mailto:you@example.com`

Opcionalne varijable:

- `REMINDER_CHECK_INTERVAL_MS=60000`
- `DISPATCH_WINDOW_MS=600000`
- `APPOINTMENT_LOOKBACK_HOURS=24`
- `APPOINTMENT_LOOKAHEAD_HOURS=168`
- `RUN_TRIGGER_TOKEN=<secret>` (za zaštitu `/run` endpointa)

## 5) Test

1. U aplikaciji: `Postavke -> Notifikacije -> Uključi`.
2. Dozvoli browser permission.
3. Klikni `Pošalji test`.
4. Kreiraj termin s uključenim podsjetnikom (npr. 1 min prije).
5. Provjeri da worker log prikazuje `sentDeliveries > 0`.

## 6) Operativno

- Health endpoint workera: `GET /health`
- Ručno okidanje slanja: `GET/POST /run` (ako je postavljen `RUN_TRIGGER_TOKEN`, pošalji ga kao `x-run-token` header)
