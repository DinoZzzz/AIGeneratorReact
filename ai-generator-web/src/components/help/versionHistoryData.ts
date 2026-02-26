export interface VersionHistoryItem {
    version: string;
    date: string;
    changes: string[];
}

export function getVersionHistory(language: string): VersionHistoryItem[] {
    return language === 'hr' ? [
        {
            version: '2.29.0',
            date: '2026-02-26',
            changes: [
                'Globalna pretraga: CommandPalette sada pretražuje i izvještaje (po dionici), s kategorijskim zaglavljima i offline fallbackom',
                'Traka za pretragu dodana u desktop zaglavlje i mobilnu navigaciju za brži pristup pretazi (⌘K)',
                'Popravljeno dupliciranje izvještaja: obrasci vode i zraka sada čitaju ?duplicate= parametar i kopiraju sve podatke',
                'Skupne operacije: dodana mogućnost skupnog PDF izvoza na stranici svih izvještaja',
                'Anotacija fotografija: novi alat za crtanje na slikama (olovka, pravokutnik, krug, strelica, tekst) s izvozom u punoj rezoluciji',
                'Prikvačene stavke: novo sučelje za prikvačivanje omiljenih naručitelja i gradilišta na dashboard',
                'Automatsko spremanje: obrasci vode i zraka automatski spremaju skicu svakih 30 sekundi s mogućnošću obnove',
                'Push obavijesti: dodan server-side worker za slanje push notifikacija putem Railwaya',
            ]
        },
        {
            version: '2.28.0',
            date: '2026-02-20',
            changes: [
                'PDF metoda zrak: LA/LB sada mapira sheme F/G/H iz administracije i prikazuje naziv sheme iz admina',
                'PDF materijali (zrak + voda) sada koriste admin lookup za okno/slivnik i cijevi, uključujući LC',
                'U metodi zrak uklonjeno je trajanje iz desnog stupca; EN 1610 tablica je preuređena (DN [mm] + red “Vrijeme ispitivanja”)',
                'Metoda voda: shema C skriva polja okna i H2, slivnik koristi “Visina slivnika”, a ΔV znak je ispravljen',
                'Water forma: uklonjeni duplikati materijala, odstupanje ostaje ručno izmjenjivo (soft suggestion), saturacija je samo za betonsko okno/slivnik',
                'Word izvoz: sekcije su stabilno vidljive (uključujući selektivni export), a redni broj metode zrak je formatiran kao 1.',
                'Word: “Dio građevine” ima default “Sustav odvodnje odpadnih voda” (editabilno), datumi su sanitizirani i standardizirani',
                'Word: napomene se preuzimaju iz dijaloga, navode se nezadovoljene dionice, odstupanje vode je dropdown (2 opcije), a slike koriste naslov “Situacija”',
            ]
        },
        {
            version: '2.27.0',
            date: '2026-02-20',
            changes: [
                'Ispravljen PDF prikaz za ispitivanja samo cjevovoda: podaci o oknu se više ne prikazuju kada nisu primjenjivi',
                'Ojačana prisilna konverzija tipova u PDF generiranju radi stabilnijeg prikaza vrijednosti',
            ]
        },
        {
            version: '2.26.0',
            date: '2026-02-10',
            changes: [
                'Metoda zrak usklađena s traženim shemama: Shema 1 (cjevovod), Shema 2 (okno i cjevovod), Shema 3 (okno)',
                'Za ispitivanje samo okna ograničeni postupci na LA/LB; vrijeme ispitivanja računa se po promjeru i postupku, a za samo okno koristi se pola vremena',
                'PDF za metodu zrak sada koristi ispravno mapiranje shema i skica; kod cjevovoda više ne prikazuje podatke o oknu',
                'U PDF obrascu pojašnjena EN 1610 tablica (DN [mm], p0, dp, vrijeme t [min]) i postavljen fiksni datum obrasca umjesto datuma izrade zapisa',
                'Word/history spremanje dodatno ojačano za 409 konflikt: pronalazak postojećeg export zapisa i sigurno relinkanje formi',
                'Sentry filtrira benigni DOM NotFoundError (insertBefore/removeChild) uzrokovan vanjskim DOM mutacijama (npr. translate/extension alati)',
                'Dodana no-translate zaštita u root HTML-u i prošireni prijevodi za nove opcije shema metode zraka',
            ]
        },
        {
            version: '2.25.0',
            date: '2026-02-09',
            changes: [
                'Offline kreiranje ispitivača više ne sprema plain-text lozinku u IndexedDB red; sync koristi sigurni privremeni password i reset-link tok',
                'Preview uploadanih blobova sada se obnavlja nakon refresh-a za privitke izvještaja, avatar, potpise certifikatora i slike shema',
                'Dodan automatski cleanup upload reda (limit broja, ukupne veličine i starosti blob operacija) uz čišćenje zastarjelih temp privitaka',
                'Proširen sync telemetry za ishode upload sinkronizacije i conflict resolution akcije (server/local/retry)',
                'Dodani novi prijevodi za offline queue poruke bez hardcoded fallback stringova',
                'Dodana QA matrica za offline scenarije i reconnect/sync regresiju',
                'Dodani Playwright e2e smoke testovi za PWA/offline prijelaz i deep-link reports rutu bez module import greške',
            ]
        },
        {
            version: '2.24.0',
            date: '2026-02-09',
            changes: [
                'Ispitivači i materijali sada podržavaju i offline kreiranje (create) uz sync kad se veza vrati',
                'Dodan offline queue za upload datoteka (privitci izvještaja, avatar, potpis certifikatora, sheme i Word predložak)',
                'Privitci izvještaja sada rade offline: upload i delete se spremaju lokalno i sinkroniziraju kasnije',
                'Sinkronizacija sada mapira i numeričke reference ID-jeva (npr. materijali u obrascima) nakon zamjene temp ID-jeva',
                'Dodan “keep local” conflict action koji pokušava primijeniti lokalnu verziju na server',
                'PWA je prebačen na custom service worker (injectManifest) s background sync handlerom i runtime cache pravilima',
            ]
        },
        {
            version: '2.23.0',
            date: '2026-02-09',
            changes: [
                'Povijest izvoza sada radi offline: lista i detalji se učitavaju iz lokalnog cachea, a brisanja se stavljaju u sync red',
                'Detalji izvoza sada mogu preuzeti i ponovno izvesti obrasce iz lokalnog cachea kada mreža nije dostupna',
                'Ispitivači i profil sada podržavaju offline uređivanje (update/delete kroz sync red), dok kreiranje novih korisnika ostaje online-only',
                'Materijali sada podržavaju offline pregled i uređivanje/brisanje kroz sync red; dodavanje novih materijala ostaje online-only',
                'Sheme i predlošci sada koriste lokalni cache za čitanje; upload/reset/rollback akcije su jasno označene kao online-only',
                'Dodani dodatni foreground/periodic sync okidači i proširena offline baza/sync mapiranje za nove entitete',
            ]
        },
        {
            version: '2.22.0',
            date: '2026-02-09',
            changes: [
                'Kalendar sada radi offline: dohvat, kreiranje, uređivanje i brisanje termina spremaju se lokalno i sinkroniziraju pri povratku veze',
                'Chat sada podržava offline poruke (slanje, uređivanje, brisanje) uz red sinkronizacije po povratku online',
                'Upravljanje certifikatorima radi offline za CRUD i postavljanje zadanog certifikatora; promjene potpisa ostaju online-only',
                'Word izvoz sada stavlja spremanje povijesti u offline red kada mreža nije dostupna, pa se history sinkronizira kasnije',
                'Dodan eksplicitan conflict-resolution tok: za konfliktne sinkronizacije moguće je odabrati server verziju direktno iz offline panela',
                'Prošireni offline testovi za conflict detekciju, server-resolution i red povijesti izvoza',
            ]
        },
        {
            version: '2.21.0',
            date: '2026-02-09',
            changes: [
                'Dodana napredna offline podrška za rad s naručiteljima, gradilištima i obrascima, uz sinkronizaciju promjena nakon povratka na mrežu',
                'Uveden queue compaction za offline sinkronizaciju (spajanje create/update operacija i uklanjanje redundantnih create/delete parova)',
                'Dodani local-only (discarded) tokovi: pregled, odbacivanje i vraćanje neuspjelih promjena bez gubitka lokalnih podataka',
                'Dodan lookup prewarm pri prijavi i povratku online radi stabilnijeg rada u sporim i mobilnim mrežnim uvjetima',
                'Mobilni status sinkronizacije proširen akcijama za retry/discard/restore uz sigurnosnu potvrdu pri odjavi kad postoje nesinkronizirane promjene',
                'Dodani novi testovi za offline bazu, sinkronizaciju i sign-out guard logiku',
            ]
        },
        {
            version: '2.20.0',
            date: '2026-02-09',
            changes: [
                'Dodan oporavak od greške učitavanja modula (automatski reload) i prilagođena PWA aktivacija radi manje chunk grešaka na iOS/Safari',
                'Word izvoz sada sigurno sprema povijest: fallback na postojeći report_exports zapis kod konflikta i osvježavanje report_export_forms veza',
                'Dodana korisnička poruka kada je izvoz uspješan uz ažuriranje postojećeg history zapisa',
                'Brisanje gradilišta sada briše povezane zapise prije samog gradilišta (report_export_forms, report_exports, report_files, report_forms, appointments)',
                'Pri izradi novog obrasca dionica se automatski kopira s posljednjeg obrasca istog naručitelja i gradilišta (water i air)',
                'Pojačana validacija lozinke za ispitivače (minimalno 8 znakova + detekcija slabih lozinki) uz jasnije poruke greške',
            ]
        },
        {
            version: '2.19.0',
            date: '2026-02-09',
            changes: [
                'Ispravljeno učitavanje shema u PDF izvozu prema metodi i odabranoj shemi (water/air + A-E)',
                'U admin postavkama upload, reset i uređivanje shema sada ciljaju točno zapis po metodi',
                'Spriječeno prepisivanje water i air slika za isti broj sheme',
            ]
        },
        {
            version: '2.18.0',
            date: '2026-02-09',
            changes: [
                'Ispravljen dozvoljeni gubitak u Word tablici za metodu zraka (koristi izračunatu vrijednost umjesto statičke)',
                'Automatsko popunjavanje trajanja ispitivanja iz EN 1610 tablice prema promjeru i metodi',
                'Vrijeme stabilizacije: +/- kontrola s default 5 min',
                'Prijenos dionice na sljedeći obrazac pri spremanju',
                'Poboljšan unos na mobitelu: polje se čisti kad ima vrijednost 0',
                'Uklonjene decimale iz PDF izvoza (osim za kritične vrijednosti)',
                'Podaci o cijevima prikazuju se u PDF-u za metodu zraka',
                'Promijenjena "mokra površina" u "omočena površina" u svim prijevodima',
                'Promijenjena "ro visina" u "visina okna", bez decimala',
                'Vrijeme zasićenja prikazuje se samo za betonske materijale',
                'Ispravljen broj okana u rekapitulaciji Word dokumenta (Schema B)',
            ]
        },
        {
            version: '2.17.0',
            date: '2026-02-08',
            changes: [
                'Uklonjeni build warningi za miješanje statičkih i dinamičkih importa (Calendar i Sentry)',
                'Calendar stranica prebačena na lazy import radi konzistentnijeg chunkanja',
                'Refaktoriran analytics izračun u testabilan utility modul (lib/analytics.ts)',
                'Dodan novi test paket za analitiku s više scenarija i rubnih slučajeva',
                'Povećana ukupna test pokrivenost kroz dodatne unit testove',
            ]
        },
        {
            version: '2.16.0',
            date: '2026-02-08',
            changes: [
                'Redizajnirana Analitika stranica s novim KPI rasporedom i modernijim vizualnim prikazom',
                'Dodani novi grafovi: 30-dnevni trend prolaza/pada, raspodjela metoda, raspodjela trajanja i aktivnost po danima',
                'Proširen useAnalytics hook s naprednim metrikama (weekly momentum, pass/fail rate, prosjek po danu)',
                'Dodano više novih prijevoda za Analitika sekciju (HR/EN)',
                'Dodano prazno stanje za analitiku kada nema dostupnih obrazaca',
            ]
        },
        {
            version: '2.15.0',
            date: '2026-02-08',
            changes: [
                'Ispravljene sve ESLint greške i upozorenja u kritičnim stranicama i komponentama',
                'Refaktoriran ConfirmDialog kontekst: izdvojen store i useConfirm hook radi Fast Refresh kompatibilnosti',
                'Stabiliziran produkcijski PWA build (Workbox service worker više ne ruši build)',
                'Ispravljen type-only import za RecentItem u CommandPalette',
                'Usklađene React hook dependencije i uklonjeni neiskorišteni importi/varijable',
            ]
        },
        {
            version: '2.14.0',
            date: '2026-02-05',
            changes: [
                'Novi useHandleError hook — konsolidirana obrada grešaka u 5 stranica',
                'Aria-label na gumbu za sažimanje bočne trake, gumbima ispitivača i ručki za povlačenje',
                'Poboljšani prazni prikazi za građevine i naručitelje s ikonama i opisima',
                'Zamjena console.error s toast obavijestima u ConstructionForm',
                'Dodano 8 novih prijevoda (HR/EN) za pristupačnost i prazna stanja',
            ]
        },
        {
            version: '2.13.0',
            date: '2026-02-05',
            changes: [
                'Ljepljivi zaglavlja tablica — zaglavlja ostaju vidljiva pri skrolanju',
                'Skraćeni dugački tekstovi u stupcima s tooltip prikazom punog teksta',
                'Fade-in animacija za overlay dijaloga',
                'Tranzicija prozirnosti tablice tijekom pozadinskog osvježavanja podataka',
                'Aria-label na svim checkboxovima za bolju pristupačnost',
                'Oznaka aria-disabled na arhiviranim građevinama',
                'Focus-visible prstenovi na akcijskim gumbima i linkovima u tablicama',
            ]
        },
        {
            version: '2.12.0',
            date: '2026-02-05',
            changes: [
                'Generički useOnlineQuery hook — eliminiran duplicirani online/offline kod u 3 hooka',
                'Novi useDebouncedCallback hook za validaciju formi (CustomerForm, ConstructionForm)',
                'Dodana zaštita od zastarjelih ažuriranja stanja u AppointmentDialog (cancelled flag)',
                'Uklonjeni console.log iz produkcijskog koda',
                'Ekstrahirani magični brojevi u imenovane konstante (debounce, sync timeout)',
            ]
        },
        {
            version: '2.11.0',
            date: '2026-02-05',
            changes: [
                'Poboljšana pristupačnost dijaloga: Escape tipka, zaključavanje fokusa, aria atributi',
                'Ispravljeni TypeScript tipovi za kalendarske termine (uklonjeni @ts-expect-error)',
                'Lazy-loading Word export biblioteka — smanjeno inicijalno učitavanje',
            ]
        },
        {
            version: '2.10.0',
            date: '2026-02-05',
            changes: [
                'Konsolidirana detekcija mrežnih grešaka u errorHandler.ts',
                'Zamijenjene hardkodirane boje s theme tokenima u 13 datoteka',
                'Dodano useMemo/useCallback u useReportsFiltering za bolje performanse',
                'API cache s React Query za certifikatore (30 min) i dashboard statistiku (5 min)',
            ]
        },
        {
            version: '2.9.0',
            date: '2026-02-05',
            changes: [
                'Konsolidirana 4 duplicirana dijaloga za potvrdu u generički ConfirmDialog',
                'Poboljšana pristupačnost: aria-live, role="alertdialog", aria-label na gumbima',
                'Ispravljeni hardkodirani stringovi — dodano 17+ novih prijevoda (HR/EN)',
                'Ujednačeno upravljanje greškama s errorHandler u 12+ datoteka',
                'Uklonjeni any tipovi u 8 datoteka, zamijenjeni konkretnim TypeScript tipovima',
            ]
        },
        {
            version: '2.8.0',
            date: '2026-02-05',
            changes: [
                'Zamjena nativnih alert() dijaloga s toast notifikacijama',
                'Zamjena nativnih confirm() dijaloga s custom modalnim dijalogom',
                'Novi ConfirmDialog komponent s podrškom za tamni način rada',
                'Poboljšan UX na mobilnim uređajima za potvrde i obavijesti',
            ]
        },
        {
            version: '2.7.0',
            date: '2026-02-05',
            changes: [
                'Refaktoriranje velikih komponenata za bolju čitljivost i održavanje koda',
                'Razdvojene stranice: ConstructionReports, Settings, Help, HistoryDetails',
                'Razdvojen wordExportService u modularne datoteke',
                'Uklonjeno dupliciranje koda u tablicama izvješća (Air/Water)',
            ]
        },
        {
            version: '2.6.0',
            date: '2026-02-04',
            changes: [
                'Ispravljen izračun dozvoljenog pada tlaka za metodu zraka (LB/LC/LD)',
                'Ispravljen prikaz promjera u Word dokumentu (krive mjerne jedinice)',
                'Ispravljen font u Word dokumentu - sada koristi Times New Roman',
                'Dodana zaštita od dvostrukog klika pri spremanju obrasca',
                'Poboljšano hvatanje Supabase grešaka u Sentry',
            ]
        },
        {
            version: '2.5.0',
            date: '2026-02-03',
            changes: [
                'Dodano Sentry praćenje verzija za bolje dijagnosticiranje grešaka',
                'UX poboljšanja: debounce pretraga, prečaci, nedavne stavke, dupliciranje obrasca, poništavanje',
            ]
        },
        {
            version: '2.4.0',
            date: '2026-01-30',
            changes: [
                'Dodano Sentry praćenje grešaka u svim servisima',
                'Optimizacija bundlea za brže učitavanje',
                'Poboljšanja performansi i sigurnosti',
            ]
        },
        {
            version: '2.3.0',
            date: '2026-01-27',
            changes: [
                'Nove FAQ kategorije: Dashboard, Kalendar, Povijest',
                'Poboljšan sadržaj pomoći',
                'Ispravljen horizontalni scroll u tablici obrazaca',
                'Ispravljena paginacija na stranici Gradilišta',
            ]
        },
        {
            version: '2.2.0',
            date: '2026-01-23',
            changes: [
                'Dodana validacija docx slika tagova u predlošku',
                'Ispravljen bug s učitavanjem predloška',
                'Upozorenje za pogrešno postavljene tagove',
            ]
        },
        {
            version: '2.1.0',
            date: '2026-01-14',
            changes: [
                'Dodana mogućnost učitavanja potpisa certifikatora',
                'Integracija potpisa u Word dokument',
                'Novi prijevodi za značajku potpisa',
            ]
        },
        {
            version: '2.0.0',
            date: '2026-01-09',
            changes: [
                'Potpuna implementacija upravljanja certifikatorima',
                'Dodavanje, uređivanje i brisanje certifikatora',
                'Postavljanje zadanog certifikatora',
                'Integracija s dijalogom izvoza',
            ]
        },
        {
            version: '1.9.0',
            date: '2025-12-17',
            changes: [
                'Implementirano upravljanje timovima',
                'Dodani tipkovnički prečaci',
                'Ispravljen scroll u modalu Decision forme',
            ]
        },
        {
            version: '1.8.0',
            date: '2025-12-09',
            changes: [
                'Poboljšana analitika napuštanja',
                'Dodana WSPay analiza uzoraka',
                'Dinamički prikaz metrika i uzoraka',
            ]
        },
        {
            version: '1.7.0',
            date: '2025-11-26',
            changes: [
                'Poboljšana upotrebljivost kalendara na mobilnim uređajima',
                'Ispravci prijevoda u dijalogu i izvještajima',
                'Dodan gumb za zatvaranje dijaloga termina',
            ]
        },
        {
            version: '1.6.0',
            date: '2025-11-20',
            changes: [
                'Prikaz svih materijala cijevi iz postavki u obrascu zraka',
                'Odvajanje kreatora i certifikatora u Word izvozu',
                'Ispravci unosa u obrascima',
            ]
        },
        {
            version: '1.5.0',
            date: '2025-11-15',
            changes: [
                'Kopiranje podataka s prethodnih obrazaca',
                'Ispravci naziva izvještaja u obrazac',
                'Poboljšan PDF izvoz',
            ]
        },
        {
            version: '1.4.0',
            date: '2025-11-10',
            changes: [
                'Implementiran uređivač shema u PDF-u',
                'Ažurirane postavke sustava',
                'Testiranje predložaka',
            ]
        },
        {
            version: '1.3.0',
            date: '2025-11-05',
            changes: [
                'Ispravci kritičnih problema',
                'Ispravci problema visokog prioriteta',
                'Ispravci problema srednjeg prioriteta',
            ]
        },
        {
            version: '1.2.0',
            date: '2025-10-30',
            changes: [
                'Ispravci avatara korisnika',
                'Ispravljena 404 greška',
                'Ispravci brisanja termina iz kalendara',
            ]
        },
        {
            version: '1.1.0',
            date: '2025-10-25',
            changes: [
                'Razdvajanje metode vode i zraka',
                'Ispravci predmemorije',
                'Kopiranje podataka s prethodnih izvještaja',
            ]
        },
        {
            version: '1.0.0',
            date: '2025-10-20',
            changes: [
                'Inicijalna struktura web aplikacije s PWA podrškom',
                'Dashboard za naručitelje',
                'Upravljanje gradilištima i obrascima',
                'Metode ispitivanja vodom i zrakom',
                'Generiranje Word i PDF izvještaja',
                'Sustav korisnika i autentifikacija',
                'Timski chat u stvarnom vremenu',
                'Kalendar ispitivanja',
            ]
        },
        {
            version: '0.9.0',
            date: '2025-10-15',
            changes: [
                'Implementiran sustav prijave i registracije',
                'Dodana autentifikacija putem Supabase',
                'Kreirana osnovna navigacija i layout',
                'Postavljen React Router za navigaciju',
            ]
        },
        {
            version: '0.8.0',
            date: '2025-10-10',
            changes: [
                'Dodana podrška za tamni način rada',
                'Implementiran sustav tema',
                'Poboljšana responzivnost na mobilnim uređajima',
                'Optimizacija učitavanja resursa',
            ]
        },
        {
            version: '0.7.0',
            date: '2025-10-05',
            changes: [
                'Kreiran sustav za upravljanje materijalima',
                'Dodana mogućnost definiranja materijala okna i cijevi',
                'Implementirana validacija obrazaca',
                'Poboljšano upravljanje greškama',
            ]
        },
        {
            version: '0.6.0',
            date: '2025-09-30',
            changes: [
                'Implementiran izvoz u Word format',
                'Dodana podrška za prilagodljive predloške',
                'Kreiran sustav tagova za predloške',
                'Automatsko popunjavanje podataka u dokumentima',
            ]
        },
        {
            version: '0.5.0',
            date: '2025-09-25',
            changes: [
                'Dodana analitika i statistike',
                'Implementirani grafikoni za prikaz podataka',
                'Kreiran dashboard s pregledom aktivnosti',
                'Dodano filtriranje po vremenskom periodu',
            ]
        },
        {
            version: '0.4.0',
            date: '2025-09-20',
            changes: [
                'Implementiran kalendar s FullCalendar bibliotekom',
                'Dodana mogućnost kreiranja i uređivanja termina',
                'Povezivanje termina s gradilištima',
                'Prikaz termina po danima, tjednima i mjesecima',
            ]
        },
        {
            version: '0.3.0',
            date: '2025-09-15',
            changes: [
                'Kreiran sustav obrazaca za ispitivanje',
                'Implementirani izračuni prema normi HRN EN 1610:2015',
                'Dodane sheme za različite tipove ispitivanja',
                'Automatsko određivanje rezultata (zadovoljava/ne zadovoljava)',
            ]
        },
        {
            version: '0.2.0',
            date: '2025-09-10',
            changes: [
                'Implementirano upravljanje naručiteljima',
                'Dodana funkcionalnost gradilišta',
                'Kreirana stranica za pregled i uređivanje podataka',
                'Povezivanje naručitelja i gradilišta',
            ]
        },
        {
            version: '0.1.0',
            date: '2025-09-01',
            changes: [
                'Inicijalizacija projekta s Vite i React',
                'Postavljanje TypeScript konfiguracije',
                'Integracija Tailwind CSS-a',
                'Kreiranje osnovne strukture komponenata',
                'Povezivanje sa Supabase bazom podataka',
            ]
        },
    ] : [
        // English version
        {
            version: '2.29.0',
            date: '2026-02-26',
            changes: [
                'Global search: CommandPalette now searches reports (by section name), with category headers and offline fallback',
                'Search bar added to desktop header and mobile navigation for quick access to search (⌘K)',
                'Fixed report duplication: water and air method forms now read the ?duplicate= parameter and copy all fields',
                'Batch operations: added bulk PDF export on the all-reports page',
                'Photo annotation: new canvas-based drawing tool (pen, rectangle, circle, arrow, text) with full-resolution export',
                'Pinned items: new widget to pin favorite customers and constructions to the dashboard',
                'Auto-save: water and air forms now auto-save drafts every 30 seconds with restore capability',
                'Push notifications: added server-side Railway worker for sending push notifications',
            ]
        },
        {
            version: '2.28.0',
            date: '2026-02-20',
            changes: [
                'Air PDF: LA/LB now maps to F/G/H schemes from admin configuration and shows admin scheme names',
                'PDF materials (air + water) now resolve from admin lookup for shaft/gully and pipe materials, including LC',
                'Air PDF no longer shows duration in the right column; EN 1610 table layout was updated (DN [mm] + centered “Test time” row)',
                'Water method: schema C hides shaft fields and H2, gully uses “Visina slivnika”, and ΔV rendering is fixed',
                'Water form: material duplicates removed, deviation remains manually editable (soft suggestion), saturation shows only for concrete shaft/gully material',
                'Word export: sections are reliably included (including selective export), and air method ordinals are formatted as 1.',
                'Word: “Construction Part” defaults to “Sustav odvodnje odpadnih voda” (editable), and dates are sanitized/standardized',
                'Word: remarks come from export dialog input, unsatisfied sections are listed, water deviation is a 2-option dropdown, and image captions use “Situacija”',
            ]
        },
        {
            version: '2.27.0',
            date: '2026-02-20',
            changes: [
                'Fixed PDF rendering for pipeline-only inspections so shaft data is no longer shown when not applicable',
                'Hardened type coercion in PDF generation to prevent invalid value rendering',
            ]
        },
        {
            version: '2.26.0',
            date: '2026-02-10',
            changes: [
                'Air method now follows requested schema mapping: Scheme 1 (pipeline), Scheme 2 (shaft and pipeline), Scheme 3 (shaft)',
                'Shaft-only tests are now restricted to LA/LB; required test time is calculated from diameter + procedure, with shaft-only using half-time',
                'Air PDF export now resolves the correct scheme/image mapping and no longer shows shaft data for pipeline-only tests',
                'EN 1610 table labels in PDF were clarified (DN [mm], p0, dp, test time t [min]) and a fixed form issue date is shown instead of report creation date',
                'Word/history saving was hardened for 409 conflicts by reusing an existing export row and safely relinking export forms',
                'Sentry now drops benign DOM NotFoundError (insertBefore/removeChild) events caused by external DOM mutations (e.g. translate/extension tools)',
                'Added no-translate protection in root HTML and translations for new air-method schema labels',
            ]
        },
        {
            version: '2.25.0',
            date: '2026-02-09',
            changes: [
                'Offline examiner create no longer stores plain-text passwords in IndexedDB queue; sync now uses a secure temporary password + reset-link flow',
                'Queued blob previews now rehydrate after refresh for report attachments, profile avatar, certifier signatures, and scheme images',
                'Added automatic upload-queue cleanup limits (count, total bytes, and age) with stale temp-attachment cleanup',
                'Expanded sync telemetry for upload outcomes and conflict resolution actions (server/local/retry)',
                'Added missing i18n keys for offline queue messages and removed hardcoded fallback strings',
                'Added an offline QA matrix for reconnect/sync regression coverage',
                'Added Playwright e2e smoke coverage for PWA offline transition and deep-link reports route without module import failure',
            ]
        },
        {
            version: '2.24.0',
            date: '2026-02-09',
            changes: [
                'Examiners and materials now support offline create flows with deferred sync when back online',
                'Added offline binary upload queue for report attachments, avatars, certifier signatures, scheme images, and Word template',
                'Report attachment upload/delete now work offline by storing local state and syncing later',
                'Sync mapping now remaps numeric ID references (e.g. material IDs inside reports) after temp ID replacement',
                'Added a “keep local” conflict action that attempts to force local payload onto server state',
                'PWA moved to custom injectManifest service worker with background sync handler and runtime caching routes',
            ]
        },
        {
            version: '2.23.0',
            date: '2026-02-09',
            changes: [
                'Export history now works offline: history list/details read from local cache, and delete actions are queued for sync',
                'Export details can now download and re-export reports from cached local data when the network is unavailable',
                'Examiners and profile now support offline editing (update/delete through sync queue); creating new examiner accounts remains online-only',
                'Materials now support offline read and queued update/delete operations; creating new materials remains online-only',
                'Schemes and template screens now use local cache for reads; upload/reset/rollback actions are clearly marked as online-only',
                'Added additional foreground/periodic sync triggers and expanded offline DB/sync mapping for the new entities',
            ]
        },
        {
            version: '2.22.0',
            date: '2026-02-09',
            changes: [
                'Calendar now works offline: loading, creating, editing, and deleting appointments are stored locally and synced on reconnect',
                'Chat now supports offline message flows (send, edit, delete) with deferred sync once back online',
                'Certifier management now supports offline CRUD and default selection; signature changes remain online-only',
                'Word export now queues history save operations when offline, then syncs report history later',
                'Added explicit conflict-resolution flow: conflict operations can be resolved using server state directly from offline panels',
                'Extended offline test coverage for conflict detection, server-resolution, and export-history queue syncing',
            ]
        },
        {
            version: '2.21.0',
            date: '2026-02-09',
            changes: [
                'Added robust offline support for working with customers, constructions, and reports, with deferred sync once the network is back',
                'Implemented sync-queue compaction (merge create/update chains and remove redundant create/delete pairs)',
                'Introduced local-only (discarded) flows: inspect, discard, and restore failed operations without losing local data',
                'Added lookup prewarm on login and reconnect for more stable behavior on slow and mobile networks',
                'Extended mobile sync status actions with retry/discard/restore and added sign-out protection when unsynced changes exist',
                'Added dedicated tests for offline DB behavior, sync flows, and sign-out guard logic',
            ]
        },
        {
            version: '2.20.0',
            date: '2026-02-09',
            changes: [
                'Added module-load error recovery (automatic reload) and adjusted PWA activation behavior to reduce chunk loading failures on iOS/Safari',
                'Word export history save is now conflict-safe: fallback to an existing report_exports row and refresh report_export_forms links',
                'Added user feedback when export succeeds by updating an existing history entry',
                'Construction deletion now removes dependent records before deleting the construction (report_export_forms, report_exports, report_files, report_forms, appointments)',
                'When creating a new form, section name is auto-copied from the latest form on the same customer and construction (water and air)',
                'Strengthened examiner password validation (minimum 8 characters + weak-password detection) with clearer error messages',
            ]
        },
        {
            version: '2.19.0',
            date: '2026-02-09',
            changes: [
                'Fixed scheme loading in PDF export by method and selected scheme (water/air + A-E)',
                'In admin settings, scheme upload/reset/metadata updates now target the exact method-specific record',
                'Prevented water and air images from overwriting each other for the same scheme number',
            ]
        },
        {
            version: '2.18.0',
            date: '2026-02-09',
            changes: [
                'Fixed allowed loss in Word table for air method (uses calculated value instead of static)',
                'Auto-populate test duration from EN 1610 table based on diameter and method',
                'Stabilization time: +/- control with default 5 min',
                'Section name carries over to next form when saving',
                'Improved mobile input: field clears when value is 0',
                'Removed decimals from PDF export (except for critical values)',
                'Pipe data now shows in PDF for air method',
                'Changed "wet surface" to "soaked surface" in all translations',
                'Changed "ro height" to "shaft height", no decimals',
                'Saturation time only shows for concrete materials',
                'Fixed shaft count in Word document recapitulation (Schema B)',
            ]
        },
        {
            version: '2.17.0',
            date: '2026-02-08',
            changes: [
                'Removed build warnings caused by mixed static and dynamic imports (Calendar and Sentry)',
                'Migrated Calendar page to lazy import for consistent chunking behavior',
                'Refactored analytics calculations into a testable utility module (lib/analytics.ts)',
                'Added a dedicated analytics test suite with multiple scenarios and edge cases',
                'Improved overall test coverage through additional unit tests',
            ]
        },
        {
            version: '2.16.0',
            date: '2026-02-08',
            changes: [
                'Redesigned Analytics page with a new KPI layout and improved visual hierarchy',
                'Added new charts: 30-day pass/fail trend, method mix, duration distribution, and weekday activity',
                'Extended useAnalytics hook with richer metrics (weekly momentum, pass/fail rates, daily average volume)',
                'Added multiple new translations for the Analytics section (HR/EN)',
                'Added an empty-state experience when no reports are available',
            ]
        },
        {
            version: '2.15.0',
            date: '2026-02-08',
            changes: [
                'Fixed all ESLint errors and warnings across critical pages and components',
                'Refactored ConfirmDialog context: extracted store and useConfirm hook for Fast Refresh compatibility',
                'Stabilized production PWA build (Workbox service worker no longer crashes the build)',
                'Fixed type-only import for RecentItem in CommandPalette',
                'Aligned React hook dependencies and removed unused imports/variables',
            ]
        },
        {
            version: '2.14.0',
            date: '2026-02-05',
            changes: [
                'New useHandleError hook — consolidated error handling across 5 pages',
                'Aria-labels on sidebar collapse button, examiner buttons, and drag handle',
                'Improved empty states for constructions and customers with icons and descriptions',
                'Replaced console.error with toast notifications in ConstructionForm',
                'Added 8 new translations (HR/EN) for accessibility and empty states',
            ]
        },
        {
            version: '2.13.0',
            date: '2026-02-05',
            changes: [
                'Sticky table headers — headers stay visible when scrolling',
                'Truncated long text in table columns with full-text tooltip on hover',
                'Fade-in animation for dialog overlays',
                'Table opacity transition during background data refetch',
                'Aria-labels on all report checkboxes for better accessibility',
                'aria-disabled attribute on archived construction links',
                'Focus-visible rings on table action buttons and links',
            ]
        },
        {
            version: '2.12.0',
            date: '2026-02-05',
            changes: [
                'Generic useOnlineQuery hook — eliminated duplicate online/offline code across 3 hooks',
                'New useDebouncedCallback hook for form validation (CustomerForm, ConstructionForm)',
                'Added stale state update protection in AppointmentDialog (cancelled flag)',
                'Removed console.log from production code',
                'Extracted magic numbers into named constants (debounce, sync timeout)',
            ]
        },
        {
            version: '2.11.0',
            date: '2026-02-05',
            changes: [
                'Improved dialog accessibility: Escape key, focus trap, aria attributes',
                'Fixed TypeScript types for calendar appointments (removed @ts-expect-error)',
                'Lazy-loaded Word export libraries — reduced initial bundle size',
            ]
        },
        {
            version: '2.10.0',
            date: '2026-02-05',
            changes: [
                'Consolidated network error detection into errorHandler.ts',
                'Replaced hardcoded colors with theme tokens across 13 files',
                'Added useMemo/useCallback to useReportsFiltering for better performance',
                'API caching with React Query for certifiers (30 min) and dashboard stats (5 min)',
            ]
        },
        {
            version: '2.9.0',
            date: '2026-02-05',
            changes: [
                'Consolidated 4 duplicate confirm dialogs into generic ConfirmDialog',
                'Improved accessibility: aria-live, role="alertdialog", aria-label on buttons',
                'Fixed hardcoded strings — added 17+ new translations (HR/EN)',
                'Consistent error handling with errorHandler across 12+ files',
                'Eliminated any types in 8 files, replaced with concrete TypeScript types',
            ]
        },
        {
            version: '2.8.0',
            date: '2026-02-05',
            changes: [
                'Replaced native alert() dialogs with toast notifications',
                'Replaced native confirm() dialogs with custom styled modal',
                'New ConfirmDialog component with dark mode support',
                'Improved mobile UX for confirmations and notifications',
            ]
        },
        {
            version: '2.7.0',
            date: '2026-02-05',
            changes: [
                'Refactored large components for better readability and maintainability',
                'Split pages: ConstructionReports, Settings, Help, HistoryDetails',
                'Split wordExportService into modular files',
                'Eliminated code duplication in report tables (Air/Water)',
            ]
        },
        {
            version: '2.6.0',
            date: '2026-02-04',
            changes: [
                'Fixed allowed pressure drop calculation for air method (LB/LC/LD)',
                'Fixed diameter display in Word document (wrong measurement units)',
                'Fixed font in Word document - now uses Times New Roman',
                'Added double-click protection when saving forms',
                'Improved Supabase error capture in Sentry',
            ]
        },
        {
            version: '2.5.0',
            date: '2026-02-03',
            changes: [
                'Added Sentry release tracking for better error diagnostics',
                'UX improvements: debounce search, shortcuts, recent items, duplicate form, undo',
            ]
        },
        {
            version: '2.4.0',
            date: '2026-01-30',
            changes: [
                'Added Sentry error tracking to all services',
                'Bundle optimization for faster loading',
                'Performance and security improvements',
            ]
        },
        {
            version: '2.3.0',
            date: '2026-01-27',
            changes: [
                'New FAQ categories: Dashboard, Calendar, History',
                'Improved help content',
                'Fixed horizontal scroll in reports table',
                'Fixed pagination on Constructions page',
            ]
        },
        {
            version: '2.2.0',
            date: '2026-01-23',
            changes: [
                'Added docx image tag validation in template',
                'Fixed template upload bug',
                'Warning for incorrectly placed tags',
            ]
        },
        {
            version: '2.1.0',
            date: '2026-01-14',
            changes: [
                'Added certifier signature upload capability',
                'Signature integration in Word document',
                'New translations for signature feature',
            ]
        },
        {
            version: '2.0.0',
            date: '2026-01-09',
            changes: [
                'Complete implementation of certifier management',
                'Add, edit and delete certifiers',
                'Set default certifier',
                'Integration with export dialog',
            ]
        },
        {
            version: '1.9.0',
            date: '2025-12-17',
            changes: [
                'Implemented team management',
                'Added keyboard shortcuts',
                'Fixed scroll in Decision form modal',
            ]
        },
        {
            version: '1.8.0',
            date: '2025-12-09',
            changes: [
                'Enhanced abandonment analytics',
                'Added WSPay pattern analysis',
                'Dynamic display of metrics and patterns',
            ]
        },
        {
            version: '1.7.0',
            date: '2025-11-26',
            changes: [
                'Improved calendar usability on mobile devices',
                'Translation fixes in dialog and reports',
                'Added close button to appointment dialog',
            ]
        },
        {
            version: '1.6.0',
            date: '2025-11-20',
            changes: [
                'Show all pipe materials from settings in air form',
                'Separate creator and certifier in Word export',
                'Form input fixes',
            ]
        },
        {
            version: '1.5.0',
            date: '2025-11-15',
            changes: [
                'Copy data from previous forms',
                'Report name fixes',
                'Improved PDF export',
            ]
        },
        {
            version: '1.4.0',
            date: '2025-11-10',
            changes: [
                'Implemented scheme editor in PDF',
                'Updated system settings',
                'Template testing',
            ]
        },
        {
            version: '1.3.0',
            date: '2025-11-05',
            changes: [
                'Critical issues fixes',
                'High priority issues fixes',
                'Medium priority issues fixes',
            ]
        },
        {
            version: '1.2.0',
            date: '2025-10-30',
            changes: [
                'User avatar fixes',
                'Fixed 404 error',
                'Fixed calendar appointment deletion',
            ]
        },
        {
            version: '1.1.0',
            date: '2025-10-25',
            changes: [
                'Water and Air method separation',
                'Cache fixes',
                'Copy data from previous reports',
            ]
        },
        {
            version: '1.0.0',
            date: '2025-10-20',
            changes: [
                'Initial web application structure with PWA support',
                'Customer dashboard',
                'Construction site and form management',
                'Water and air testing methods',
                'Word and PDF report generation',
                'User system and authentication',
                'Real-time team chat',
                'Testing calendar',
            ]
        },
        {
            version: '0.9.0',
            date: '2025-10-15',
            changes: [
                'Implemented login and registration system',
                'Added authentication via Supabase',
                'Created base navigation and layout',
                'Set up React Router for navigation',
            ]
        },
        {
            version: '0.8.0',
            date: '2025-10-10',
            changes: [
                'Added dark mode support',
                'Implemented theming system',
                'Improved mobile responsiveness',
                'Resource loading optimization',
            ]
        },
        {
            version: '0.7.0',
            date: '2025-10-05',
            changes: [
                'Created materials management system',
                'Added ability to define shaft and pipe materials',
                'Implemented form validation',
                'Improved error handling',
            ]
        },
        {
            version: '0.6.0',
            date: '2025-09-30',
            changes: [
                'Implemented Word format export',
                'Added support for customizable templates',
                'Created template tag system',
                'Automatic data population in documents',
            ]
        },
        {
            version: '0.5.0',
            date: '2025-09-25',
            changes: [
                'Added analytics and statistics',
                'Implemented charts for data visualization',
                'Created dashboard with activity overview',
                'Added time period filtering',
            ]
        },
        {
            version: '0.4.0',
            date: '2025-09-20',
            changes: [
                'Implemented calendar with FullCalendar library',
                'Added ability to create and edit appointments',
                'Linking appointments to construction sites',
                'Display appointments by day, week, and month',
            ]
        },
        {
            version: '0.3.0',
            date: '2025-09-15',
            changes: [
                'Created testing report form system',
                'Implemented calculations per HRN EN 1610:2015 standard',
                'Added schemes for different test types',
                'Automatic result determination (satisfies/fails)',
            ]
        },
        {
            version: '0.2.0',
            date: '2025-09-10',
            changes: [
                'Implemented customer management',
                'Added construction site functionality',
                'Created page for viewing and editing data',
                'Linking customers and construction sites',
            ]
        },
        {
            version: '0.1.0',
            date: '2025-09-01',
            changes: [
                'Project initialization with Vite and React',
                'TypeScript configuration setup',
                'Tailwind CSS integration',
                'Created basic component structure',
                'Connected to Supabase database',
            ]
        },
    ];
}
