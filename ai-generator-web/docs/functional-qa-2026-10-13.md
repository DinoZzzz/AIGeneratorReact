# Funkcionalno testiranje - 13. listopada 2026.

Nastavak pregleda nakon `test` commita `4b1f660`. Izdanje `2.36.2` proširuje provjere s učitavanja ekrana na stvarne korisničke postupke. API fixture pamti promjene i provjerava dopuštene stupce, pa ponovno učitavanje potvrđuje rezultat spremanja, a ne samo trenutačno stanje React komponente.

## Potvrđene i ispravljene greške

- Uređivanje izvještaja slalo je `_synced` i povezane objekte kao stupce baze. Spremanje sada uklanja lokalne metapodatke i pridružene podatke. Globalni „Spremi i novi” za zrak i vodu više ne stvara rute s `undefined` identifikatorima.
- Kalendar je pri uređivanju slao pridružene naručitelje/gradilišta kao stupce baze. Zajednički normalizator sada šalje dopuštena polja i pretvara prazne opcionalne veze u `null`; koristi se i za stare offline operacije. Prikazuju se termini koji preklapaju vidljivo razdoblje. Nevaljan raspon vremena se odbija, a neuspjelo spremanje/brisanje zadržava dijalog i omogućava ponovni pokušaj.
- Ponovno otvaranje naručitelja ili gradilišta nakon povratka veze moglo je prepisati neposlane lokalne vrijednosti. Učitavanje sada poštuje red sinkronizacije. Popis naručitelja uključuje poštanski broj i vrijeme izmjene potrebno za offline uređivanje i zaštitu od sukoba.
- Starija neuspjela operacija mogla je prepisati noviju online izmjenu. Spremanje naručitelja, gradilišta i chat poruka sada dijeli zaključavanje sa sinkronizacijom, razrješava privremene identifikatore i uklanja zamijenjene operacije tek nakon uspješnog spremanja. Odbijene ovlasti čuvaju postojeći red; privremeni zapisi zadržavaju operaciju stvaranja.
- Mrežne greške servisa bile su pretvarane u općenite greške, zbog čega offline fallback nije radio dok preglednik još prijavljuje vezu. Stvarna mrežna greška sada ostaje prepoznatljiva.
- Chat čuva neposlane poruke i kada online dohvat vrati praznu listu. Uređivanje/brisanje prije i nakon sinkronizacije koristi odgovarajući identifikator, a odbijena prijava ne stvara anonimnu poruku. Kontrole imaju dostupne nazive, ograničenje 5000 znakova, vidljive mobilne akcije i prevedene potvrde.
- Administratorske rute čekaju profil umjesto preuranjenog preusmjeravanja. Profil učitava titulu i spol; postavke koriste istu trenutačnu ulogu. Obrisani naručitelji/gradilišta uklanjaju se iz nedavnih stavki i u istoj kartici preglednika.
- Brisanje povijesti prethodno je prvo brisalo veze s izvještajima. Sada se izvodi jedno brisanje roditelja uz postojeći `ON DELETE CASCADE`; ako baza odbije brisanje, roditelj i veze ostaju sačuvani. Izvorni izvještaji se ne brišu.

## Obuhvat browser scenarija

- Naručitelji i gradilišta: stvaranje, uređivanje, ponovno učitavanje, brisanje, otkazivanje i nedavne stavke.
- Izvještaji: zrak LD/PVC, voda s oknima i cijevima, granične izmjerene vrijednosti, spremanje/uređivanje/dupliciranje, globalni „Spremi i novi” i mobilni unos.
- Izvoz: PDF pregled i skupni PDF, tekst metode/materijala/dionica; Word s uključenim i isključenim PDF prilozima, stvarne PNG stranice unutar DOCX te veze povijesti na oba odabrana izvještaja.
- Kalendar: stvaranje, uređivanje, brisanje, pogrešno vrijeme, odbijeni upisi, preklapanje razdoblja i uklanjanje opcionalnih veza.
- Profil, postavke, izravan ulaz administratora, materijali i ovjeritelji.
- Chat: slanje, uređivanje, otkazano/potvrđeno brisanje, gubitak veze, privremeni ID-jevi, ponovno učitavanje i sinkronizacija.
- Instalirani PWA: stvarni offline reload, stvaranje naručitelja bez veze i točno jedna sinkronizacija, offline profil/admin u štedljivom načinu, otkazana/neuspjela odjava, uspješna odjava, druga kartica i drugi račun.
- Postojeći testovi prijave, 14 glavnih ekrana na desktopu/mobitelu, pristupačnosti i kontrasta tema ostaju dio regresije.

## Rezultati provjera

- Unit: **318/318**, 36 testnih datoteka.
- Push worker: **3/3**.
- Playwright kroz produkcijski build i lokalni nginx: **53/53**, bez preskočenih testova; Word scenariji koriste stvarni aktivni predložak. Nakon korekcije pripreme offline rute i čekanja završetka animacije teme ponovljen je cijeli paket.
- `npm run build:check`, `npm run lint`, dodatni TypeScript pregled novih E2E datoteka i `git diff --check`: prolaze.
- Izolirani PostgreSQL: prava profila i atomsko brisanje povijesti prolaze; security advisors na istom izoliranom fixtureu ne prijavljuje probleme.
- `npm audit`: **0** prijavljenih ranjivosti aplikacije i push workera.
- nginx provjera JavaScript MIME tipa, cachea, sigurnosnih zaglavlja i SPA ruta: prolazi.

## Ponovljive provjere

Sve naredbe pokreću se iz `ai-generator-web/`:

```sh
npm test -- --run
npm run lint
npm run build:check
node --test ../push-worker/tests/runtimeHelpers.test.js
node scripts/test-profile-security.mjs --advisors
E2E_BASE_URL=http://127.0.0.1:4185 npx playwright test --workers=2
node scripts/check-hosting.mjs http://127.0.0.1:4185
```

PostgreSQL provjera koristi izolirani privremeni cluster i sintetičke zapise. Za opcionalni Supabase advisors potreban je CLI. nginx mora posluživati aktualni `dist`; Docker daemon nije dostupan pa su aplikacija i nginx provjereni zasebno.

Za provjeru aktivnog Word predloška dodatno se postavlja `E2E_REPORT_TEMPLATE_PATH` na lokalnu kopiju javnog predloška. Završni run koristi neizmijenjeni predložak dohvaćen read-only iz stvarnog Storagea; datoteka nije uključena u Git. Bez te varijable test koristi kontrolirani predložak iz fixturea.

## Granice i vanjsko okruženje

Browser promjene podataka koriste lokalne sintetičke API odgovore. Nisu stvarani ni brisani stvarni računi, naručitelji ili izvještaji. Nisu potvrđeni stvarna e-mail/push isporuka, svi korisnički privici i potpisi ni vizualni raspored DOCX-a u Microsoft Wordu/LibreOfficeu.

Read-only provjere potvrdile su staging hosting i postojeći cascade FK. Pripremljena sigurnosna migracija i administratorske Edge funkcije iz prethodnog pregleda još nisu primijenjene na aktivni Supabase. Git/Railway deployment ih ne primjenjuje automatski; postupak i poznato pravilo pristupa profilu opisani su u [prethodnom pregledu](review-2026-10-13.md#supabase-promjene-koje-zahtijevaju-zasebnu-primjenu).
