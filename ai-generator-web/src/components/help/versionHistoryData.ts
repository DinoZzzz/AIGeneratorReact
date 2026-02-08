export interface VersionHistoryItem {
    version: string;
    date: string;
    changes: string[];
}

export function getVersionHistory(language: string): VersionHistoryItem[] {
    return language === 'hr' ? [
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
