import { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { ChevronDown, ChevronUp, FileText, Upload, Settings, Database, HelpCircle, Calendar, LayoutDashboard, History, GitBranch } from 'lucide-react';
import { SupportRequestForm } from '../components/help/SupportRequestForm';
import { cn } from '../lib/utils';

interface FAQItem {
    question: string;
    answer: string;
}

interface FAQCategory {
    icon: React.ReactNode;
    title: string;
    items: FAQItem[];
}

type TabType = 'faq' | 'support' | 'version';

interface VersionHistoryItem {
    version: string;
    date: string;
    changes: string[];
}

export const Help = () => {
    const { t, language } = useLanguage();
    const [activeTab, setActiveTab] = useState<TabType>('faq');
    const [openCategories, setOpenCategories] = useState<Set<number>>(new Set([0]));
    const [openQuestions, setOpenQuestions] = useState<Set<string>>(new Set());

    const toggleCategory = (index: number) => {
        const newOpen = new Set(openCategories);
        if (newOpen.has(index)) {
            newOpen.delete(index);
        } else {
            newOpen.add(index);
        }
        setOpenCategories(newOpen);
    };

    const toggleQuestion = (id: string) => {
        const newOpen = new Set(openQuestions);
        if (newOpen.has(id)) {
            newOpen.delete(id);
        } else {
            newOpen.add(id);
        }
        setOpenQuestions(newOpen);
    };

    const faqCategories: FAQCategory[] = language === 'hr' ? [
        {
            icon: <FileText className="h-6 w-6" />,
            title: "Obrasci i Ispitivanja",
            items: [
                {
                    question: "Kako stvoriti novi obrazac?",
                    answer: "1. Odaberite naručitelja iz popisa\n2. Odaberite gradilište\n3. Kliknite na 'Novi obrazac'\n4. Odaberite metodu (Voda ili Zrak)\n5. Ispunite sva potrebna polja\n6. Kliknite 'Spremi'"
                },
                {
                    question: "Koja je razlika između metode vode i metode zraka?",
                    answer: "Metoda vode (W): Ispitivanje vodonepropusnosti punjenje sustava vodom i praćenjem pada razine vode tijekom 30 minuta.\n\nMetoda zraka (L): Ispitivanje punjenje sustava zrakom pod tlakom i praćenjem pada tlaka tijekom određenog vremena."
                },
                {
                    question: "Kako urediti postojeći obrazac?",
                    answer: "1. Pronađite obrazac na stranici gradilišta\n2. Kliknite ikonu olovke (Uredi)\n3. Izmijenite potrebna polja\n4. Kliknite 'Spremi' za spremanje promjena"
                },
                {
                    question: "Kako obrisati obrazac?",
                    answer: "1. Pronađite obrazac na stranici gradilišta\n2. Kliknite ikonu kante za smeće\n3. Potvrdite brisanje u dijalog prozoru\n\nNapomena: Brisanje je trajno i ne može se poništiti."
                },
                {
                    question: "Što znače statusi 'Zadovoljava' i 'Ne zadovoljava'?",
                    answer: "'Zadovoljava' znači da sustav prolazi test vodonepropusnosti prema normi HRN EN 1610:2015.\n\n'Ne zadovoljava' znači da je izmjereni gubitak veći od dopuštenog prema normi i sustav ne prolazi test."
                }
            ]
        },
        {
            icon: <Upload className="h-6 w-6" />,
            title: "Generiranje i Izvoz Dokumenata",
            items: [
                {
                    question: "Kako generirati Word izvještaj?",
                    answer: "1. Na stranici gradilišta, odaberite obrasce (ili ostavite neoznačeno za sve)\n2. Kliknite 'Generiraj izvještaj'\n3. Ispunite metadata:\n   - Dio gradilišta\n   - Odvodnja\n   - Napomene i odstupanja\n   - Ime ovlaštene osobe\n4. Dodajte fotografije/dokumente u 'Prilozi' sekciju (opcionalno)\n5. Kliknite 'Export Report'\n\nWord dokument će se automatski preuzeti."
                },
                {
                    question: "Kako dodati fotografije u izvještaj?",
                    answer: "1. Kliknite 'Generiraj izvještaj'\n2. U dijalogu exporta, pronađite 'Prilozi' sekciju na dnu\n3. Povucite i ispustite fotografije ili kliknite za odabir\n4. Dodajte opis za svaku fotografiju (opcionalno)\n5. Podržani formati: JPG, PNG, PDF\n6. Fotografije će biti dodane na kraju Word dokumenta\n\nNapomena: Fotografije se čuvaju u originalnom formatu (JPG ostaje JPG)."
                },
                {
                    question: "Kako izvesti PDF?",
                    answer: "1. Na stranici gradilišta, pronađite obrazac\n2. Kliknite ikonu 'Izvoz PDF' pokraj obrasca\n3. PDF će se automatski preuzeti\n\nZa više obrazaca:\n1. Odaberite obrasce checkboxima\n2. Kliknite 'Izvoz odabranih' ili 'Izvoz svih'\n3. PDF bundle će se preuzeti"
                },
                {
                    question: "Koji podaci se uključuju u Word izvještaj?",
                    answer: "Word izvještaj uključuje:\n- Opće podatke (temperatura, datum ispitivanja)\n- Podatke o naručitelju i gradilištu\n- Skicu ispitivanja\n- Ulazne podatke (dimenzije, materijali)\n- Rezultate ispitivanja\n- Tablice s rezultatima\n- Zaključak (zadovoljava/ne zadovoljava)\n- Napomene i odstupanja\n- Potpis ovlaštene osobe\n- Priloge (fotografije/PDF-ove)"
                }
            ]
        },
        {
            icon: <Database className="h-6 w-6" />,
            title: "Naručitelji i Gradilišta",
            items: [
                {
                    question: "Kako dodati novog naručitelja?",
                    answer: "1. Idite na stranicu 'Naručitelji'\n2. Kliknite 'Novi naručitelj'\n3. Ispunite podatke:\n   - Ime naručitelja *\n   - Adresa\n   - Lokacija\n   - Poštanski broj\n   - OIB\n   - Kontakt osoba\n   - Email\n   - Telefon\n4. Kliknite 'Spremi'\n\n* Obavezno polje"
                },
                {
                    question: "Kako dodati gradilište naručitelju?",
                    answer: "1. Odaberite naručitelja iz popisa\n2. Kliknite 'Novo gradilište'\n3. Ispunite podatke:\n   - Ime gradilišta *\n   - Radni nalog\n   - Lokacija\n   - Status (Aktivno/Neaktivno)\n4. Kliknite 'Spremi'\n\n* Obavezno polje"
                },
                {
                    question: "Kako urediti podatke naručitelja?",
                    answer: "1. Na stranici 'Naručitelji', pronađite naručitelja\n2. Kliknite ikonu olovke (Uredi)\n3. Izmijenite potrebna polja\n4. Kliknite 'Spremi'\n\nSve promjene će se odmah primijeniti."
                },
                {
                    question: "Što se događa kad obrišem naručitelja?",
                    answer: "Brisanje naručitelja će također obrisati:\n- Sva gradilišta povezana s naručiteljem\n- Sve obrasce vezane uz ta gradilišta\n- Povijest izvoza\n\nOvo je trajna akcija i ne može se poništiti. Sustav će vas upozoriti prije brisanja."
                }
            ]
        },
        {
            icon: <Settings className="h-6 w-6" />,
            title: "Korisnici i Dozvole",
            items: [
                {
                    question: "Koje korisničke uloge postoje?",
                    answer: "Admin: Pun pristup svim funkcijama, može upravljati korisnicima\n\nKorisnik: Može stvarati i uređivati obrasce, ali ne može upravljati drugim korisnicima"
                },
                {
                    question: "Što su akreditacije?",
                    answer: "Akreditacije određuju koje metode ispitivanja korisnik može koristiti:\n\n- Metoda vode (Tip 1): Za vodna ispitivanja\n- Metoda zraka (Tip 2): Za ispitivanja zrakom\n\nKorisnik mora imati odgovarajuću akreditaciju da bi stvorio obrazac te metode."
                },
                {
                    question: "Kako dodati novog korisnika? (Samo Admin)",
                    answer: "1. Idite na 'Postavke' → 'Korisnici'\n2. Kliknite 'Dodaj korisnika'\n3. Unesite email adresu\n4. Odaberite ulogu (Admin/Korisnik)\n5. Odaberite akreditacije\n6. Korisnik će dobiti email s linkom za postavljanje lozinke"
                },
                {
                    question: "Kako promijeniti lozinku?",
                    answer: "1. Kliknite na svoj profil u gornjem desnom kutu\n2. Odaberite 'Postavke'\n3. Kliknite 'Promijeni lozinku'\n4. Unesite staru i novu lozinku\n5. Kliknite 'Spremi'"
                }
            ]
        },
        {
            icon: <HelpCircle className="h-6 w-6" />,
            title: "Najčešći Problemi",
            items: [
                {
                    question: "Ne mogu stvoriti obrazac određene metode",
                    answer: "Vjerojatno nemate akreditaciju za tu metodu.\n\nRješenje:\n1. Kontaktirajte administratora\n2. Tražite da vam dodijeli odgovarajuću akreditaciju (Metoda vode ili Metoda zraka)"
                },
                {
                    question: "Obrazac pokazuje 'Ne zadovoljava' ali mislim da bi trebao proći",
                    answer: "Provjerite:\n1. Jesu li svi ulazni podaci točni (dimenzije, visine vode/tlakovi)\n2. Je li odabrana ispravna shema ispitivanja\n3. Je li trajanje ispitivanja ispravno\n\nSustav automatski izračunava rezultate prema normi HRN EN 1610:2015. Ako podaci ne zadovoljavaju kriterije norme, obrazac će biti označen kao 'Ne zadovoljava'."
                },
                {
                    question: "Ne vidim gumb za generiranje Word izvještaja",
                    answer: "Provjerite:\n1. Imate li obrasce na gradilištu\n2. Jeste li na pravoj stranici (Gradilište → Obrasci)\n3. Osvježite stranicu (F5)\n\nAko problem i dalje postoji, odjavite se i ponovno se prijavite."
                },
                {
                    question: "Fotografije nisu dodane u Word dokument",
                    answer: "Provjerite:\n1. Jeste li dodali fotografije u 'Prilozi' sekciju tijekom exporta\n2. Je li Word predložak pravilno konfiguriran (treba sadržavati {#attachments}{%image}{/attachments} oznake)\n3. Je li Supabase storage bucket 'report-files' stvoren i javno dostupan\n\nAko fotografije nisu vidljive, provjerite browser konzolu za greške."
                },
                {
                    question: "Kako resetirati zaboravljenu lozinku?",
                    answer: "1. Na stranici prijave, kliknite 'Zaboravljena lozinka?'\n2. Unesite vašu email adresu\n3. Provjerite email za link za resetiranje\n4. Kliknite na link i unesite novu lozinku\n5. Prijavite se s novom lozinkom"
                }
            ]
        },
        {
            icon: <LayoutDashboard className="h-6 w-6" />,
            title: "Dashboard i Analitika",
            items: [
                {
                    question: "Što prikazuje Dashboard?",
                    answer: "Dashboard prikazuje pregled aktivnosti:\\n\\n- Ukupan broj naručitelja, gradilišta i obrazaca\\n- Grafikon obrazaca po mjesecima\\n- Nedavna aktivnost (zadnjih 5 obrazaca)\\n- Status gradilišta (aktivna/neaktivna)\\n- Brzi pristup čestim radnjama"
                },
                {
                    question: "Kako filtrirati podatke na Dashboardu?",
                    answer: "1. Koristite padajući izbornik za odabir vremenskog raspona\\n2. Kliknite na grafikon za detaljniji prikaz\\n3. Koristite tablicu za sortiranje po stupcima\\n\\nDashboard se automatski osvježava pri svakom učitavanju."
                },
                {
                    question: "Što znače boje u grafikonu?",
                    answer: "Zelena: Obrasci koji zadovoljavaju kriterije\\nCrvena: Obrasci koji ne zadovoljavaju\\nPlava: Ukupan broj obrazaca\\n\\nGrafikon prikazuje trend kroz odabrano vremensko razdoblje."
                },
                {
                    question: "Kako pristupiti detaljima iz Dashboarda?",
                    answer: "Kliknite na:\\n- Broj naručitelja → otvara listu naručitelja\\n- Broj gradilišta → otvara listu gradilišta\\n- Obrazac u tablici → otvara detalje obrasca\\n- Ime naručitelja → otvara profile naručitelja"
                }
            ]
        },
        {
            icon: <Calendar className="h-6 w-6" />,
            title: "Kalendar i Termini",
            items: [
                {
                    question: "Kako dodati novi termin u kalendar?",
                    answer: "1. Otvorite stranicu 'Kalendar'\\n2. Kliknite na željeni datum ili '+' gumb\\n3. Ispunite podatke:\\n   - Naslov termina\\n   - Naručitelj i gradilište\\n   - Datum i vrijeme\\n   - Opis (opcionalno)\\n4. Kliknite 'Spremi'\\n\\nTermin će se pojaviti u kalendaru."
                },
                {
                    question: "Kako urediti ili obrisati termin?",
                    answer: "1. Kliknite na termin u kalendaru\\n2. U pop-up prozoru odaberite:\\n   - 'Uredi' za izmjenu podataka\\n   - 'Obriši' za brisanje termina\\n3. Potvrdite akciju\\n\\nNapomena: Obrisani termini se ne mogu vratiti."
                },
                {
                    question: "Kako promijeniti prikaz kalendara?",
                    answer: "Koristite gumbe u gornjem dijelu kalendara:\\n- 'Mjesec': Mjesečni prikaz\\n- 'Tjedan': Tjedni prikaz\\n- 'Dan': Dnevni prikaz\\n- 'Raspored': Lista termina\\n\\nStrelice lijevo/desno mijenjaju period."
                },
                {
                    question: "Mogu li povezati termin s gradilištem?",
                    answer: "Da! Prilikom stvaranja termina:\\n1. Odaberite naručitelja iz padajućeg izbornika\\n2. Odaberite gradilište\\n\\nTermin će biti povezan s gradilištem i vidljiv u detaljima gradilišta."
                },
                {
                    question: "Kako vidjeti samo svoje termine?",
                    answer: "Kalendar automatski prikazuje termine koje ste vi stvorili ili koji su vam dodijeljeni.\\n\\nAdministratori mogu vidjeti sve termine svih korisnika."
                }
            ]
        },
        {
            icon: <History className="h-6 w-6" />,
            title: "Povijest i Praćenje Promjena",
            items: [
                {
                    question: "Gdje mogu vidjeti povijest promjena?",
                    answer: "1. Otvorite stranicu 'Povijest'\\n2. Koristite filtere za pretragu:\\n   - Po korisniku\\n   - Po tipu akcije (kreiranje, uređivanje, brisanje)\\n   - Po datumu\\n3. Kliknite na stavku za detalje promjene"
                },
                {
                    question: "Koje se akcije bilježe u povijesti?",
                    answer: "Sustav bilježi:\\n- Kreiranje obrazaca, naručitelja, gradilišta\\n- Uređivanje postojećih zapisa\\n- Brisanje zapisa\\n- Generiranje izvještaja\\n- Promjene korisničkih postavki\\n\\nSvaka akcija uključuje vrijeme, korisnika i detalje promjene."
                },
                {
                    question: "Mogu li vratiti obrisani zapis?",
                    answer: "Ne, obrisani zapisi se ne mogu automatski vratiti.\\n\\nMeđutim, povijest čuva informacije o obrisanim zapisima, pa možete:\\n1. Pogledati detalje obrisanog zapisa\\n2. Ručno ponovno unijeti podatke\\n\\nPreporučamo redovito backup podataka."
                },
                {
                    question: "Koliko dugo se čuva povijest?",
                    answer: "Povijest se čuva trajno za sve akcije.\\n\\nMožete filtrirati po datumu za lakše pronalaženje starijih zapisa."
                },
                {
                    question: "Kako izvesti povijest promjena?",
                    answer: "Trenutno nije podržano automatsko izvoz povijesti.\\n\\nZa izvoz podataka kontaktirajte administratora sustava."
                }
            ]
        }
    ] : [
        // English version
        {
            icon: <FileText className="h-6 w-6" />,
            title: "Reports and Testing",
            items: [
                {
                    question: "How to create a new report?",
                    answer: "1. Select a customer from the list\n2. Select a construction site\n3. Click 'New Report'\n4. Choose method (Water or Air)\n5. Fill in all required fields\n6. Click 'Save'"
                },
                {
                    question: "What's the difference between Water and Air method?",
                    answer: "Water Method (W): Tests watertightness by filling the system with water and monitoring water level drop over 30 minutes.\n\nAir Method (L): Tests by filling the system with pressurized air and monitoring pressure drop over a specified time."
                },
                {
                    question: "How to edit an existing report?",
                    answer: "1. Find the report on the construction site page\n2. Click the pencil icon (Edit)\n3. Modify the required fields\n4. Click 'Save' to save changes"
                },
                {
                    question: "How to delete a report?",
                    answer: "1. Find the report on the construction site page\n2. Click the trash icon\n3. Confirm deletion in the dialog\n\nNote: Deletion is permanent and cannot be undone."
                },
                {
                    question: "What do 'Satisfies' and 'Does Not Satisfy' statuses mean?",
                    answer: "'Satisfies' means the system passes the watertightness test according to HRN EN 1610:2015 standard.\n\n'Does Not Satisfy' means the measured loss exceeds the allowed limit per standard and the system fails the test."
                }
            ]
        },
        {
            icon: <Upload className="h-6 w-6" />,
            title: "Document Generation and Export",
            items: [
                {
                    question: "How to generate a Word report?",
                    answer: "1. On the construction site page, select reports (or leave unselected for all)\n2. Click 'Generate Report'\n3. Fill in metadata:\n   - Construction Part\n   - Drainage\n   - Remarks and deviations\n   - Certifier name\n4. Add photos/documents in 'Attachments' section (optional)\n5. Click 'Export Report'\n\nThe Word document will download automatically."
                },
                {
                    question: "How to add photos to a report?",
                    answer: "1. Click 'Generate Report'\n2. In the export dialog, find 'Prilozi' (Attachments) section at the bottom\n3. Drag and drop photos or click to select\n4. Add a description for each photo (optional)\n5. Supported formats: JPG, PNG, PDF\n6. Photos will be added at the end of the Word document\n\nNote: Photos are preserved in original format (JPG stays JPG)."
                },
                {
                    question: "How to export a PDF report?",
                    answer: "1. On the construction site page, find the report\n2. Click the 'Export PDF' icon next to the report\n3. PDF will download automatically\n\nFor multiple reports:\n1. Select reports using checkboxes\n2. Click 'Export Selected' or 'Export All'\n3. PDF bundle will download"
                },
                {
                    question: "What data is included in the Word report?",
                    answer: "The Word report includes:\n- General data (temperature, examination date)\n- Customer and construction site data\n- Testing sketch\n- Input data (dimensions, materials)\n- Test results\n- Result tables\n- Conclusion (satisfies/does not satisfy)\n- Remarks and deviations\n- Certifier signature\n- Attachments (photos/PDFs)"
                }
            ]
        },
        {
            icon: <Database className="h-6 w-6" />,
            title: "Customers and Construction Sites",
            items: [
                {
                    question: "How to add a new customer?",
                    answer: "1. Go to 'Customers' page\n2. Click 'New Customer'\n3. Fill in details:\n   - Customer name *\n   - Address\n   - Location\n   - Postal code\n   - OIB (Tax ID)\n   - Contact person\n   - Email\n   - Phone\n4. Click 'Save'\n\n* Required field"
                },
                {
                    question: "How to add a construction site to a customer?",
                    answer: "1. Select a customer from the list\n2. Click 'New Construction'\n3. Fill in details:\n   - Construction name *\n   - Work order\n   - Location\n   - Status (Active/Inactive)\n4. Click 'Save'\n\n* Required field"
                },
                {
                    question: "How to edit customer data?",
                    answer: "1. On the 'Customers' page, find the customer\n2. Click the pencil icon (Edit)\n3. Modify the required fields\n4. Click 'Save'\n\nAll changes will be applied immediately."
                },
                {
                    question: "What happens when I delete a customer?",
                    answer: "Deleting a customer will also delete:\n- All construction sites linked to the customer\n- All reports related to those construction sites\n- Export history\n\nThis is a permanent action and cannot be undone. The system will warn you before deletion."
                }
            ]
        },
        {
            icon: <Settings className="h-6 w-6" />,
            title: "Users and Permissions",
            items: [
                {
                    question: "What user roles exist?",
                    answer: "Admin: Full access to all functions, can manage users\n\nUser: Can create and edit reports, but cannot manage other users"
                },
                {
                    question: "What are accreditations?",
                    answer: "Accreditations determine which testing methods a user can use:\n\n- Water Method (Type 1): For water testing\n- Air Method (Type 2): For air testing\n\nA user must have the appropriate accreditation to create a report of that method."
                },
                {
                    question: "How to add a new user? (Admin only)",
                    answer: "1. Go to 'Settings' → 'Users'\n2. Click 'Add User'\n3. Enter email address\n4. Select role (Admin/User)\n5. Select accreditations\n6. User will receive an email with a link to set password"
                },
                {
                    question: "How to change password?",
                    answer: "1. Click on your profile in the top right corner\n2. Select 'Settings'\n3. Click 'Change Password'\n4. Enter old and new password\n5. Click 'Save'"
                }
            ]
        },
        {
            icon: <HelpCircle className="h-6 w-6" />,
            title: "Common Issues",
            items: [
                {
                    question: "I cannot create a report of a specific method",
                    answer: "You probably don't have accreditation for that method.\n\nSolution:\n1. Contact the administrator\n2. Request the appropriate accreditation (Water Method or Air Method)"
                },
                {
                    question: "Report shows 'Does Not Satisfy' but I think it should pass",
                    answer: "Check:\n1. Are all input data correct (dimensions, water heights/pressures)\n2. Is the correct testing schema selected\n3. Is the examination duration correct\n\nThe system automatically calculates results according to HRN EN 1610:2015 standard. If data doesn't meet standard criteria, the report will be marked as 'Does Not Satisfy'."
                },
                {
                    question: "I don't see the button to generate Word report",
                    answer: "Check:\n1. Do you have reports on the construction site\n2. Are you on the correct page (Construction Site → Reports)\n3. Refresh the page (F5)\n\nIf the problem persists, log out and log back in."
                },
                {
                    question: "Photos are not added to Word document",
                    answer: "Check:\n1. Did you add photos in the 'Attachments' section during export\n2. Is the Word template properly configured (must contain {#attachments}{%image}{/attachments} tags)\n3. Is the Supabase storage bucket 'report-files' created and publicly accessible\n\nIf photos aren't visible, check the browser console for errors."
                },
                {
                    question: "How to reset a forgotten password?",
                    answer: "1. On the login page, click 'Forgot Password?'\n2. Enter your email address\n3. Check email for reset link\n4. Click the link and enter new password\n5. Log in with new password"
                }
            ]
        },
        {
            icon: <LayoutDashboard className="h-6 w-6" />,
            title: "Dashboard & Analytics",
            items: [
                {
                    question: "What does the Dashboard show?",
                    answer: "The Dashboard displays an activity overview:\\n\\n- Total number of customers, construction sites, and reports\\n- Monthly reports chart\\n- Recent activity (last 5 reports)\\n- Construction site status (active/inactive)\\n- Quick access to common actions"
                },
                {
                    question: "How to filter data on the Dashboard?",
                    answer: "1. Use the dropdown menu to select a time range\\n2. Click on the chart for a detailed view\\n3. Use the table to sort by columns\\n\\nThe Dashboard refreshes automatically on each page load."
                },
                {
                    question: "What do the chart colors mean?",
                    answer: "Green: Reports that satisfy criteria\\nRed: Reports that don't satisfy\\nBlue: Total number of reports\\n\\nThe chart shows trends over the selected time period."
                },
                {
                    question: "How to access details from the Dashboard?",
                    answer: "Click on:\\n- Customer count → opens customer list\\n- Construction site count → opens site list\\n- Report in table → opens report details\\n- Customer name → opens customer profile"
                }
            ]
        },
        {
            icon: <Calendar className="h-6 w-6" />,
            title: "Calendar & Appointments",
            items: [
                {
                    question: "How to add a new appointment to the calendar?",
                    answer: "1. Open the 'Calendar' page\\n2. Click on the desired date or '+' button\\n3. Fill in the details:\\n   - Appointment title\\n   - Customer and construction site\\n   - Date and time\\n   - Description (optional)\\n4. Click 'Save'\\n\\nThe appointment will appear in the calendar."
                },
                {
                    question: "How to edit or delete an appointment?",
                    answer: "1. Click on the appointment in the calendar\\n2. In the popup, select:\\n   - 'Edit' to modify details\\n   - 'Delete' to remove the appointment\\n3. Confirm the action\\n\\nNote: Deleted appointments cannot be restored."
                },
                {
                    question: "How to change the calendar view?",
                    answer: "Use the buttons at the top of the calendar:\\n- 'Month': Monthly view\\n- 'Week': Weekly view\\n- 'Day': Daily view\\n- 'Agenda': List of appointments\\n\\nLeft/right arrows change the period."
                },
                {
                    question: "Can I link an appointment to a construction site?",
                    answer: "Yes! When creating an appointment:\\n1. Select a customer from the dropdown\\n2. Select a construction site\\n\\nThe appointment will be linked to the site and visible in site details."
                },
                {
                    question: "How to see only my appointments?",
                    answer: "The calendar automatically shows appointments you created or that are assigned to you.\\n\\nAdministrators can see all appointments from all users."
                }
            ]
        },
        {
            icon: <History className="h-6 w-6" />,
            title: "History & Change Tracking",
            items: [
                {
                    question: "Where can I see the change history?",
                    answer: "1. Open the 'History' page\\n2. Use filters to search:\\n   - By user\\n   - By action type (create, edit, delete)\\n   - By date\\n3. Click on an item for change details"
                },
                {
                    question: "What actions are recorded in history?",
                    answer: "The system records:\\n- Creating reports, customers, construction sites\\n- Editing existing records\\n- Deleting records\\n- Generating reports\\n- User setting changes\\n\\nEach action includes time, user, and change details."
                },
                {
                    question: "Can I restore a deleted record?",
                    answer: "No, deleted records cannot be automatically restored.\\n\\nHowever, history keeps information about deleted records, so you can:\\n1. View details of the deleted record\\n2. Manually re-enter the data\\n\\nWe recommend regular data backups."
                },
                {
                    question: "How long is history kept?",
                    answer: "History is kept permanently for all actions.\\n\\nYou can filter by date to find older records more easily."
                },
                {
                    question: "How to export change history?",
                    answer: "Automatic history export is not currently supported.\\n\\nFor data export, contact the system administrator."
                }
            ]
        }
    ];

    const versionHistory: VersionHistoryItem[] = language === 'hr' ? [
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

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold text-foreground">{t('help.title')}</h1>
                <p className="text-muted-foreground mt-2">
                    {language === 'hr'
                        ? 'Pronađite odgovore na najčešća pitanja o korištenju sustava'
                        : 'Find answers to frequently asked questions about using the system'}
                </p>
            </div>

            {/* Tabs */}
            <div className="border-b border-border">
                <div className="flex space-x-8">
                    <button
                        onClick={() => setActiveTab('faq')}
                        className={cn(
                            "py-3 px-1 border-b-2 font-medium text-sm transition-colors",
                            activeTab === 'faq'
                                ? "border-primary text-primary"
                                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                        )}
                    >
                        {t('help.tabs.faq')}
                    </button>
                    <button
                        onClick={() => setActiveTab('support')}
                        className={cn(
                            "py-3 px-1 border-b-2 font-medium text-sm transition-colors",
                            activeTab === 'support'
                                ? "border-primary text-primary"
                                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                        )}
                    >
                        {t('help.tabs.support')}
                    </button>
                    <button
                        onClick={() => setActiveTab('version')}
                        className={cn(
                            "py-3 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2",
                            activeTab === 'version'
                                ? "border-primary text-primary"
                                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                        )}
                    >
                        <GitBranch className="h-4 w-4" />
                        {t('help.tabs.version')}
                    </button>
                </div>
            </div>

            {/* Tab Content */}
            {activeTab === 'faq' ? (
                <>
                    <div className="space-y-4">
                        {faqCategories.map((category, categoryIndex) => (
                            <div key={categoryIndex} className="bg-card border border-border rounded-lg shadow">
                                {/* Category Header */}
                                <button
                                    onClick={() => toggleCategory(categoryIndex)}
                                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-muted/50 transition-colors rounded-t-lg"
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className="text-primary">
                                            {category.icon}
                                        </div>
                                        <h2 className="text-lg font-semibold text-foreground">
                                            {category.title}
                                        </h2>
                                    </div>
                                    {openCategories.has(categoryIndex) ? (
                                        <ChevronUp className="h-5 w-5 text-muted-foreground" />
                                    ) : (
                                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                                    )}
                                </button>

                                {/* Category Content */}
                                {openCategories.has(categoryIndex) && (
                                    <div className="border-t border-border">
                                        {category.items.map((item, itemIndex) => {
                                            const questionId = `${categoryIndex}-${itemIndex}`;
                                            const isOpen = openQuestions.has(questionId);

                                            return (
                                                <div key={itemIndex} className="border-b border-border last:border-b-0">
                                                    <button
                                                        onClick={() => toggleQuestion(questionId)}
                                                        className="w-full px-6 py-4 text-left hover:bg-muted/30 transition-colors flex items-center justify-between"
                                                    >
                                                        <span className="font-medium text-foreground pr-4">
                                                            {item.question}
                                                        </span>
                                                        {isOpen ? (
                                                            <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                                        ) : (
                                                            <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                                        )}
                                                    </button>
                                                    {isOpen && (
                                                        <div className="px-6 py-4 bg-muted/20">
                                                            <div className="text-muted-foreground whitespace-pre-line">
                                                                {item.answer}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Contact Support */}
                    <div className="bg-primary/10 border border-primary/20 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                            {language === 'hr' ? 'Trebate dodatnu pomoć?' : 'Need Additional Help?'}
                        </h3>
                        <p className="text-muted-foreground mb-4">
                            {language === 'hr'
                                ? 'Ako niste pronašli odgovor na svoje pitanje, pošaljite nam zahtjev za podršku.'
                                : 'If you haven\'t found the answer to your question, send us a support request.'}
                        </p>
                        <button
                            onClick={() => setActiveTab('support')}
                            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                        >
                            {t('help.tabs.support')}
                        </button>
                    </div>
                </>
            ) : activeTab === 'support' ? (
                <SupportRequestForm />
            ) : (
                <div className="space-y-6">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary font-medium">
                            <GitBranch className="h-5 w-5" />
                            {language === 'hr' ? 'Verzija' : 'Version'} {versionHistory[0]?.version}
                        </div>
                        <p className="text-muted-foreground mt-2">
                            {language === 'hr'
                                ? 'Pregled svih značajnih promjena i poboljšanja'
                                : 'Overview of all significant changes and improvements'}
                        </p>
                    </div>

                    <div className="relative">
                        {/* Timeline line */}
                        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />

                        {versionHistory.map((item, index) => (
                            <div key={item.version} className="relative pl-16 pb-8 last:pb-0">
                                {/* Timeline dot */}
                                <div className={cn(
                                    "absolute left-4 w-5 h-5 rounded-full border-2 bg-background",
                                    index === 0 ? "border-primary bg-primary" : "border-border"
                                )} />

                                <div className="bg-card border border-border rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className={cn(
                                            "text-lg font-bold",
                                            index === 0 ? "text-primary" : "text-foreground"
                                        )}>
                                            v{item.version}
                                        </span>
                                        <span className="text-sm text-muted-foreground">
                                            {new Date(item.date).toLocaleDateString(language === 'hr' ? 'hr-HR' : 'en-US', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </span>
                                    </div>
                                    <ul className="space-y-2">
                                        {item.changes.map((change, changeIndex) => (
                                            <li key={changeIndex} className="flex items-start gap-2 text-muted-foreground">
                                                <span className="text-primary mt-1">•</span>
                                                <span>{change}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
