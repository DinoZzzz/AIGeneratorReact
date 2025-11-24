import { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { ChevronDown, ChevronUp, FileText, Upload, Settings, Database, HelpCircle } from 'lucide-react';
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

type TabType = 'faq' | 'support';

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
            title: "Izvještaji i Ispitivanja",
            items: [
                {
                    question: "Kako stvoriti novi izvještaj?",
                    answer: "1. Odaberite kupca iz popisa\n2. Odaberite gradilište\n3. Kliknite na 'Novi izvještaj'\n4. Odaberite metodu (Voda ili Zrak)\n5. Ispunite sva potrebna polja\n6. Kliknite 'Spremi'"
                },
                {
                    question: "Koja je razlika između metode vode i metode zraka?",
                    answer: "Metoda vode (W): Ispitivanje vodonepropusnosti punjenje sustava vodom i praćenjem pada razine vode tijekom 30 minuta.\n\nMetoda zraka (L): Ispitivanje punjenje sustava zrakom pod tlakom i praćenjem pada tlaka tijekom određenog vremena."
                },
                {
                    question: "Kako urediti postojeći izvještaj?",
                    answer: "1. Pronađite izvještaj na stranici gradilišta\n2. Kliknite ikonu olovke (Uredi)\n3. Izmijenite potrebna polja\n4. Kliknite 'Spremi' za spremanje promjena"
                },
                {
                    question: "Kako obrisati izvještaj?",
                    answer: "1. Pronađite izvještaj na stranici gradilišta\n2. Kliknite ikonu kante za smeće\n3. Potvrdite brisanje u dijalog prozoru\n\nNapomena: Brisanje je trajno i ne može se poništiti."
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
                    answer: "1. Na stranici gradilišta, odaberite izvještaje (ili ostavite neoznačeno za sve)\n2. Kliknite 'Generiraj izvještaj'\n3. Ispunite metadata:\n   - Dio gradilišta\n   - Odvodnja\n   - Napomene i odstupanja\n   - Ime ovlaštene osobe\n4. Dodajte fotografije/dokumente u 'Prilozi' sekciju (opcionalno)\n5. Kliknite 'Export Report'\n\nWord dokument će se automatski preuzeti."
                },
                {
                    question: "Kako dodati fotografije u izvještaj?",
                    answer: "1. Kliknite 'Generiraj izvještaj'\n2. U dijalogu exporta, pronađite 'Prilozi' sekciju na dnu\n3. Povucite i ispustite fotografije ili kliknite za odabir\n4. Dodajte opis za svaku fotografiju (opcionalno)\n5. Podržani formati: JPG, PNG, PDF\n6. Fotografije će biti dodane na kraju Word dokumenta\n\nNapomena: Fotografije se čuvaju u originalnom formatu (JPG ostaje JPG)."
                },
                {
                    question: "Kako izvesti PDF izvještaj?",
                    answer: "1. Na stranici gradilišta, pronađite izvještaj\n2. Kliknite ikonu 'Izvoz PDF' pokraj izvještaja\n3. PDF će se automatski preuzeti\n\nZa više izvještaja:\n1. Odaberite izvještaje checkboxima\n2. Kliknite 'Izvoz odabranih' ili 'Izvoz svih'\n3. PDF bundle će se preuzeti"
                },
                {
                    question: "Koji podaci se uključuju u Word izvještaj?",
                    answer: "Word izvještaj uključuje:\n- Opće podatke (temperatura, datum ispitivanja)\n- Podatke o kupcu i gradilištu\n- Skicu ispitivanja\n- Ulazne podatke (dimenzije, materijali)\n- Rezultate ispitivanja\n- Tablice s rezultatima\n- Zaključak (zadovoljava/ne zadovoljava)\n- Napomene i odstupanja\n- Potpis ovlaštene osobe\n- Priloge (fotografije/PDF-ove)"
                }
            ]
        },
        {
            icon: <Database className="h-6 w-6" />,
            title: "Kupci i Gradilišta",
            items: [
                {
                    question: "Kako dodati novog kupca?",
                    answer: "1. Idite na stranicu 'Kupci'\n2. Kliknite 'Novi kupac'\n3. Ispunite podatke:\n   - Ime kupca *\n   - Adresa\n   - Lokacija\n   - Poštanski broj\n   - OIB\n   - Kontakt osoba\n   - Email\n   - Telefon\n4. Kliknite 'Spremi'\n\n* Obavezno polje"
                },
                {
                    question: "Kako dodati gradilište kupcu?",
                    answer: "1. Odaberite kupca iz popisa\n2. Kliknite 'Novo gradilište'\n3. Ispunite podatke:\n   - Ime gradilišta *\n   - Radni nalog\n   - Lokacija\n   - Status (Aktivno/Neaktivno)\n4. Kliknite 'Spremi'\n\n* Obavezno polje"
                },
                {
                    question: "Kako urediti podatke kupca?",
                    answer: "1. Na stranici 'Kupci', pronađite kupca\n2. Kliknite ikonu olovke (Uredi)\n3. Izmijenite potrebna polja\n4. Kliknite 'Spremi'\n\nSve promjene će se odmah primijeniti."
                },
                {
                    question: "Što se događa kad obrišem kupca?",
                    answer: "Brisanje kupca će također obrisati:\n- Sva gradilišta povezana s kupcem\n- Sve izvještaje vezane uz ta gradilišta\n- Povijest izvoza\n\nOvo je trajna akcija i ne može se poništiti. Sustav će vas upozoriti prije brisanja."
                }
            ]
        },
        {
            icon: <Settings className="h-6 w-6" />,
            title: "Korisnici i Dozvole",
            items: [
                {
                    question: "Koje korisničke uloge postoje?",
                    answer: "Admin: Pun pristup svim funkcijama, može upravljati korisnicima\n\nKorisnik: Može stvarati i uređivati izvještaje, ali ne može upravljati drugim korisnicima"
                },
                {
                    question: "Što su akreditacije?",
                    answer: "Akreditacije određuju koje metode ispitivanja korisnik može koristiti:\n\n- Metoda vode (Tip 1): Za vodna ispitivanja\n- Metoda zraka (Tip 2): Za ispitivanja zrakom\n\nKorisnik mora imati odgovarajuću akreditaciju da bi stvorio izvještaj te metode."
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
                    question: "Ne mogu stvoriti izvještaj određene metode",
                    answer: "Vjerojatno nemate akreditaciju za tu metodu.\n\nRješenje:\n1. Kontaktirajte administratora\n2. Tražite da vam dodijeli odgovarajuću akreditaciju (Metoda vode ili Metoda zraka)"
                },
                {
                    question: "Izvještaj pokazuje 'Ne zadovoljava' ali mislim da bi trebao proći",
                    answer: "Provjerite:\n1. Jesu li svi ulazni podaci točni (dimenzije, visine vode/tlakovi)\n2. Je li odabrana ispravna shema ispitivanja\n3. Je li trajanje ispitivanja ispravno\n\nSustav automatski izračunava rezultate prema normi HRN EN 1610:2015. Ako podaci ne zadovoljavaju kriterije norme, izvještaj će biti označen kao 'Ne zadovoljava'."
                },
                {
                    question: "Ne vidim gumb za generiranje Word izvještaja",
                    answer: "Provjerite:\n1. Imate li izvještaje na gradilištu\n2. Jeste li na pravoj stranici (Gradilište → Izvještaji)\n3. Osvježite stranicu (F5)\n\nAko problem i dalje postoji, odjavite se i ponovno se prijavite."
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
        }
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
            ) : (
                <SupportRequestForm />
            )}
        </div>
    );
};
