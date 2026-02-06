import { FileText, Upload, Settings, Database, HelpCircle, Calendar, LayoutDashboard, History } from 'lucide-react';

export interface FAQItem {
    question: string;
    answer: string;
}

export interface FAQCategory {
    icon: React.ReactNode;
    title: string;
    items: FAQItem[];
}

export function getFaqCategories(language: string): FAQCategory[] {
    return language === 'hr' ? [
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
                    answer: "1. Na stranici gradilišta, pronađite obrazac\n2. Kliknite ikonu 'Izvoz PDF' pokraj obrasca\n3. PDF će se automatski preuzeti\n\nZa više obrazaca:\n1. Odaberite obrasce checkboxovima\n2. Kliknite 'Izvoz odabranih' ili 'Izvoz svih'\n3. PDF bundle će se preuzeti"
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
}
