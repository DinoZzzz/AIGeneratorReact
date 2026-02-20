# Plan popravaka PDF/Word i formi (Metoda zrak + metoda voda)

Datum: 2026-02-20  
Projekt: `ai-generator-web`

## 1) Što je potvrđeno u kodu (nalazi)

1. PDF i dalje koristi hardkodirana mapiranja za materijale umjesto materijala iz administracije.
- `ai-generator-web/src/lib/pdfGenerator.ts:332-337`
- `ai-generator-web/src/lib/pdfGenerator.ts:395-397`
- `ai-generator-web/src/lib/pdfGenerator.ts:414-416`
- Posljedica: custom materijali (ID-ovi koje korisnik doda) često padaju na fallback (`PVC`).

2. Air shema i naziv sheme su hardkodirani, bez direktnog oslanjanja na naziv iz administracije.
- `ai-generator-web/src/lib/pdfGenerator.ts:46-57`
- `ai-generator-web/src/lib/pdfGenerator.ts:108-114`
- `ai-generator-web/src/lib/pdfGenerator.ts:156-158`
- Posljedica: teško je isporučiti F/G/H semantiku i prikaz naziva iz admina.

3. U metodi voda forma učitava sve materijale i u okno i u cijev, bez filtriranja po tipu.
- `ai-generator-web/src/pages/WaterMethodForm.tsx:545-548`
- `ai-generator-web/src/pages/WaterMethodForm.tsx:696-699`
- Posljedica: korisniku se materijali čine duplirani i miješani.

4. Polje `deviation` se auto-upisuje i prepisuje ručni unos dok uvjet vrijedi.
- `ai-generator-web/src/pages/WaterMethodForm.tsx:184-201`
- Posljedica: korisnik ne može stabilno ručno mijenjati odstupanje.

5. Saturacija je vezana na beton u oknu ili cijevi, a zahtjev kaže samo beton okna/slivnika.
- `ai-generator-web/src/pages/WaterMethodForm.tsx:670-673`

6. Word sekcije se oslanjaju na uvjet `section_name && !type_id`; to je fragilno.
- `ai-generator-web/src/services/wordExport/tableBuilder.ts:62-63`
- `ai-generator-web/src/services/wordExport/tableBuilder.ts:69`
- `ai-generator-web/src/services/wordExport/tableBuilder.ts:108-109`
- Posljedica: sekcije mogu nestati ako `type_id` nije točno kako kod očekuje.

7. Kod Word eksporta “nezadovoljene dionice” koristi samo `stock`, ne i `dionica`.
- `ai-generator-web/src/services/wordExport/wordExportService.ts:234-236`
- Posljedica: tekst može ostati prazan i ne navede stvarne dionice.

8. Datumi u Word-u se formatiraju preko `toLocaleDateString('hr-HR')` na više mjesta.
- `ai-generator-web/src/services/wordExport/helpers.ts:3-5`
- `ai-generator-web/src/services/wordExport/wordExportService.ts:197`
- Posljedica: mogući razmaci/special znakovi u prikazu datuma.

9. `constructionPart` default za Word trenutno dolazi iz naziva gradilišta.
- `ai-generator-web/src/pages/ConstructionReports.tsx:484-486`
- Zahtjev traži default tekst “Sustav odvodnje odpadnih voda” (uredivo).

10. U PDF vodi je labela `ΔV` prisutna u kodu, ali korisnik vidi apostrof (font/glyph problem).
- `ai-generator-web/src/lib/pdfGenerator.ts:516`

11. Input komponenta već čisti nule na focus za `type='number'`.
- `ai-generator-web/src/components/ui/Input.tsx:14-34`
- Ipak treba audit svih numeričkih polja (i non-`Input` kontrole) da se ponašaju jednako.

## 2) Detaljan plan po zahtjevima

## A) Metoda zrak (PDF)

### A1. Shema F/G/H (LA/LB) i admin slike

Zahtjev:
- LA/LB + okno => Shema F
- LA/LB + okno+cjevovod => Shema H
- LA/LB + cjevovod => Shema G
- koristiti sheme koje je korisnik dodao u administraciji

Plan:
1. Uvesti helper `resolveAirSchemeForPdf(report)` u `pdfGenerator.ts` koji vraća internu shemu (`F|G|H`) i `scheme_number` za dohvat slike.
2. U helper ugraditi mapiranje po `draft_id` i `examination_procedure` tako da se F/G/H logika primjenjuje eksplicitno za LA/LB, a LC/LD ostaju na postojećoj shemi po draftu.
3. Refaktorirati `resolveSchemeNumberForReport` i `getSchemeName` tako da:
- ne vraćaju hardkodirane “Shema 1/2/3” za air,
- koriste `schemeService.getSchemeImage(...)`/`getSchemeImageUrl(...)` i `scheme.name` kad postoji.
4. U PDF naslov “Skica” koristiti naziv sheme iz admin zapisa (ako postoji), inače fallback na “Shema F/G/H”.

Kriterij prihvata:
- Za sva tri LA/LB scenarija PDF vuče točnu sliku iz `scheme_images` (`method_type='air'`).
- “Skica:” prikazuje očekivani naziv sheme, ne hardkodiran 1/2/3.

### A2. Materijal cijevi u metodi zrak (posebno LC)

Zahtjev:
- LC ne ispisuje materijal cijevi; provjeriti da PDF povlači admin materijale.

Plan:
1. Dodati async resolver za materijale po ID-u (cache map `id -> name`) unutar `pdfGenerator`.
2. Zamijeniti hardkodirane mape (`PVC/PE/PEHD/...`) i index-logiku sa stvarnim nazivima iz lookup-a (`materials`).
3. Primijeniti isto za `pane_material_id` i `pipe_material_id` u air i water grani.

Kriterij prihvata:
- Ako korisnik odabere bilo koji custom materijal, isti naziv se vidi u PDF-u za sve procedure (LA/LB/LC/LD).

### A3. Maknuti “Trajanje” desno u metodi zrak

Zahtjev:
- generalno iz air PDF-a maknuti trajanje koje se prikazuje desno.

Plan:
1. Ukloniti red `addRight('Trajanje', ...)` iz air desnog stupca.
2. Ostaviti samo relevantna vremena (`Vr. stabilizacije`, `Vr. ispitivanja`) prema dogovoru.

Kriterij prihvata:
- U desnom stupcu air PDF-a više nema stavke “Trajanje”.

### A4. Air EN 1610 tablica layout

Zahtjev:
- `DN[mm]` iznad brojki 100/200/300/400...
- “Vrijeme ispitivanja” kao naziv reda u sredini.

Plan:
1. Refaktorirati crtanje tablice u deklarativnu strukturu (header rows + data rows) umjesto ručnih koordinata.
2. Prilagoditi redoslijed redaka tako da `DN [mm]` bude header nad redom promjera, a “Vrijeme ispitivanja t [min]” centrirani naziv tog reda/bloka.
3. Dodati vizualnu regresijsku provjeru (ručno + screenshot) za granice i poravnanja.

Kriterij prihvata:
- Tablica izgleda prema traženom rasporedu u exportu.

## B) Metoda voda (PDF + forma)

### B1. Materijali okna/slivnika i cijevi u PDF-u

Zahtjev:
- PDF ne vuče materijale odabrane u aplikaciji (A/B/C/D/E scenariji).

Plan:
1. Iskoristiti isti material resolver iz A2 i za water granu.
2. Ukloniti hardkodirane nizove `mats` i `pipeMats` iz PDF-a.
3. Kod pipe-only sheme (C) osigurati da se prikazuje samo relevantan materijal cijevi.

Kriterij prihvata:
- U svim water shemama PDF prikazuje točan materijal iz admin lookup-a.

### B2. Shema C (cjevovod): sakriti okno polja i H2

Zahtjev:
- u metodi voda, kod cjevovoda ne prikazivati unos okna (vrsta/materijal), nema H2 dijela.

Plan:
1. U `WaterMethodForm` sakriti “Vrsta okna/slivnika” i “Materijal okna/slivnika” kad je `draft_id === 2`.
2. U rezultatima forme sakriti `hydrostaticHeight` za `draft_id === 2`.
3. U PDF rezultatu sakriti “Hidrost. visina” za `draft_id === 2` (zadržati gdje treba za ostale sheme).

Kriterij prihvata:
- Shema C više ne prikazuje UI ni PDF elemente okna/H2.

### B3. Slivnik labela “Visina slivnika”

Zahtjev:
- za slivnik koristiti “Visina slivnika”, ne “Visina okna”.

Plan:
1. U PDF-u zamijeniti hardkodirani `addLeft('Visina okna', ...)` za round slučaj sa `heightLabel`.
2. Provjeriti da je labela ispravna za sheme D/E.

Kriterij prihvata:
- U slivnik scenariju PDF prikazuje “Visina slivnika”.

### B4. Delta V znak

Zahtjev:
- umjesto apostrofa treba biti delta znak.

Plan:
1. Validirati glyph podršku u aktivnom PDF fontu (trenutni Roboto bundle).
2. Ako glyph nije podržan, zamijeniti font bundle punim Unicode fontom koji pokriva grčka slova.
3. Ostaviti labelu `ΔV` nakon potvrde da se prikazuje ispravno.

Kriterij prihvata:
- U PDF-u se vidi “ΔV”, bez zamjene apostrofom.

### B5. Materijali okna se dupliraju pri odabiru

Zahtjev:
- u metodi voda materijali okna se dupliraju.

Plan:
1. Učitavanje materijala standardizirati na `orderBy: 'id'` radi stabilnog redoslijeda.
2. U `pane_material_id` select prikazivati samo `material_type_id === 1`.
3. U `pipe_material_id` select prikazivati samo `material_type_id === 2`.
4. Dodati zaštitu protiv duplikata po `(id)` u renderu opcija.

Kriterij prihvata:
- U izboru okna nema cijevnih materijala i nema duplikata zbog miješanja tipova.

### B6. Odstupanje mora ostati ručno izmjenjivo

Zahtjev:
- polje odstupanja mora se moći mijenjati.

Plan:
1. Auto-popunu odstupanja promijeniti u “soft suggestion”:
- upisati samo kad je polje prazno,
- ne prepisivati ručni unos.
2. Spremiti flag `isDeviationUserEdited` ili usporediti s posljednjom auto-vrijednošću.

Kriterij prihvata:
- korisnik može upisati vlastiti tekst i on ostaje nakon promjena drugih polja.

### B7. Saturacija samo kad je materijal okna beton

Zahtjev:
- vrijeme saturacije prikazivati samo za beton okna/slivnika.

Plan:
1. U `WaterMethodForm` provjeru betona vezati samo na `pane_material_id`.
2. Maknuti `pipeMaterial` iz uvjeta prikaza saturacije.

Kriterij prihvata:
- Saturacija se ne pojavljuje zbog betonske cijevi; pojavljuje se samo zbog betonskog okna/slivnika.

## C) Word generiranje

### C1. Sekcije se ne prikazuju u Word dokumentu

Zahtjev:
- sekcije moraju biti vidljive u Word tablicama.

Plan:
1. U `tableBuilder.ts` sekciju prepoznati po `section_name`, bez ovisnosti o `!type_id`.
2. U filteru za air/water sekcije koristiti `section_name` + `(type_id ili material_type_id)` robustno.
3. U `ConstructionReports.tsx` kod selektivnog izvoza uključiti relevantne sekcije uz odabrane dionice (ne samo čiste report redove).
4. Dodati testni fixture sa sekcijama i provjeru da `airReports`/`waterReports` sadrže `isSection=true` redove.

Kriterij prihvata:
- Sekcije se vide u Word tablicama u oba moda izvoza (sve i selektirano).

### C2. “Dio građevine” default tekst + editabilno

Zahtjev:
- default “Sustav odvodnje odpadnih voda”, korisnik može urediti.

Plan:
1. U `ConstructionReports` promijeniti default `constructionPart`.
2. U `ExportDialog` resetirati state pri otvaranju tako da se default konzistentno primjenjuje, ali ostaje editable.

Kriterij prihvata:
- Dialog se otvara s traženim tekstom i korisnik ga može promijeniti prije izvoza.

### C3. Datum u Wordu ima čudne znakove

Zahtjev:
- ukloniti artefakte u prikazu datuma svugdje u Wordu.

Plan:
1. Uvesti jedinstveni formatter `dd.MM.yyyy.` bez locale-spaces nuspojava.
2. Zamijeniti `toLocaleDateString('hr-HR')` i pomoćni `formatDate` na Word putanji.
3. Sanitizirati stringove (`NBSP` -> običan razmak) prije `doc.render`.

Kriterij prihvata:
- Svi datumi u dokumentu i footeru su čisti i konzistentni.

### C4. Redni broj u metodi zrak mora biti “1.”

Zahtjev:
- redni broj u Word tablici za zrak s točkom.

Plan:
1. U `buildAirReportRows` postaviti `ordinal` kao string `${n}.`.
2. Provjeriti template da ne duplira točku.

Kriterij prihvata:
- Air redovi u tablici prikazuju “1.”, “2.”, ...

### C5. Napomene iz Word dijaloga moraju ući u dokument

Zahtjev:
- napomene da se vuku iz unosa kod generiranja Worda.

Plan:
1. Potvrditi da template koristi tagove `airMethodRemark` i `waterMethodRemark`.
2. Ako template koristi druga imena, uskladiti tagove ili mapping.
3. U `ExportDialog` pri svakom otvaranju osigurati svježi state da korisnikov aktualni unos ide u `onConfirm`.

Kriterij prihvata:
- unos u dialogu se 1:1 pojavljuje u Word napomenama.

### C6. Slike u Wordu: naziv “Situacija” (bold) + razmak iznad

Zahtjev:
- naziv slike samo “Situacija”, bold, s razmakom iznad.

Plan:
1. U `dataPreparation.ts` za image priloge postaviti `description: 'Situacija'`.
2. U Word template-u podesiti stil retka s `{description}` na bold i dodati spacing before.
3. Zadržati filename/path samo za internu referencu, ne za prikazni naslov.

Kriterij prihvata:
- Svaka slika u Wordu ima naslov “Situacija”, bold i vidljiv razmak iznad.

### C7. U Word tekst dodati koje dionice ne zadovoljavaju

Zahtjev:
- kad neka dionica ne zadovoljava, tekst mora navesti koje.

Plan:
1. U `wordExportService.ts` graditi listu iz `dionica || stock` (ne samo `stock`).
2. Dodati sigurni fallback ako oba polja nedostaju.
3. Po potrebi dodati novi tag za detaljniji prikaz (npr. `unsatisfiedSections`).

Kriterij prihvata:
- Word narativni tekst navodi stvarne nazive dionica koje ne zadovoljavaju.

### C8. Metoda vode napomena/odstupanje kao dropdown (2 opcije)

Zahtjev:
- pri generiranju Worda umjesto unosa dropdown:
1) `h2 < 100 cm`
2) `Kod pojedinih dionica h2 < 100 cm`

Plan:
1. U `ExportDialog` polje `waterDeviation` prebaciti s textarea na select.
2. Dodati i18n ključeve za dvije opcije.

Kriterij prihvata:
- korisnik bira jednu od dvije vrijednosti (i samo te dvije); odabrana vrijednost se pojavljuje u Wordu.

## D) Generalni fix

### D1. Automatsko uklanjanje nula pri fokusu numeričkih polja

Zahtjev:
- u svim formama gdje se upisuju brojke nule se automatski maknu na klik.

Plan:
1. Audit svih numeričkih inputa i potvrda da koriste `Input` komponentu.
2. Za eventualna non-`Input` numerička polja primijeniti isti `onFocus` mehanizam kao u `Input.tsx`.
3. Dodati kratki QA checklist po glavnim formama (Air, Water, Calendar).

Kriterij prihvata:
- na focus numeričkog polja default `0` nestaje i korisnik odmah upisuje novu vrijednost.

## 3) Redoslijed implementacije (predloženi sprint plan)

1. Temeljni data sloj za PDF: resolveri shema + materijala + fallback pravila.
2. PDF zrak/voda: sheme F/G/H, materijali, trajanje desno, tablica, H2, labela slivnika, ΔV.
3. Water forma: filtriranje materijala, odstupanje editable, saturacija uvjet.
4. Word pipeline: sekcije, default construction part, datumi, ordinals, unsatisfied dionice, water deviation dropdown.
5. Template update (`method1610.docx`): naslov slike “Situacija” bold + spacing, potvrda tagova za napomene.
6. QA i regresija: ručni scenariji + vitest helper testovi + 1-2 Playwright smoke scenarija za export tok.

## 4) Test matrica (minimalni skup)

1. Air PDF: LA/LB + (okno, okno+cjevovod, cjevovod) => F/H/G slike iz admina.
2. Air PDF: LC + custom pipe material => ispisuje točan naziv materijala.
3. Water PDF: A/B/C/D/E + custom pane/pipe materials => svi nazivi točni.
4. Water PDF: C (pipe-only) => nema okno polja i nema H2.
5. Water PDF: D/E round => “Visina slivnika”.
6. Water PDF: ΔV glyph vidljiv kao delta.
7. Water forma: nema duplikata okno materijala; odstupanje ručno editabilno; saturacija samo za beton okna.
8. Word: sekcije vidljive, air ordinal s točkom, napomene iz dialoga, tekst s nezadovoljenim dionicama.
9. Word: default “Dio građevine” tekst postavljen i editabilan.
10. Word: datumi bez čudnih znakova u dokumentu i footeru.
11. Generalno: numerička polja brišu nulu na focus.

## 5) Matrica pokrivenosti prijavljenih problema (3x provjera)

Napomena:
- U originalnoj prijavi ista stavka za LA/LB + okno i cjevovod => shema H bila je navedena dvaput; mapirana je jednom jer je sadržajno identična.

1. Metoda zrak LA/LB + shema okno => shema F:
- Pokriveno u: `A1. Shema F/G/H (LA/LB) i admin slike`

2. Metoda zrak LA/LB + shema okno i cjevovod => shema H:
- Pokriveno u: `A1. Shema F/G/H (LA/LB) i admin slike`

3. Metoda zrak LA/LB + shema cjevovod => shema G:
- Pokriveno u: `A1. Shema F/G/H (LA/LB) i admin slike`

4. Sheme moraju biti one iz administracije:
- Pokriveno u: `A1. Shema F/G/H (LA/LB) i admin slike`

5. Metoda zrak LC ne ispisuje materijal cijevi / provjera admin materijala:
- Pokriveno u: `A2. Materijal cijevi u metodi zrak (posebno LC)`

6. U metodi zrak maknuti trajanje desno:
- Pokriveno u: `A3. Maknuti “Trajanje” desno u metodi zrak`

7. Tablica metoda zrak: DN[mm] iznad 100/200/300/400 i “Vrijeme ispitivanja” kao naziv reda:
- Pokriveno u: `A4. Air EN 1610 tablica layout`

8. Metoda voda shema A (okno okruglo) ne vuče materijal okna:
- Pokriveno u: `B1. Materijali okna/slivnika i cijevi u PDF-u`

9. Metoda voda shema B (okno+cjevovod okruglo) ne vuče materijal okna i cijevi:
- Pokriveno u: `B1. Materijali okna/slivnika i cijevi u PDF-u`

10. Metoda voda shema B: delta V je apostrof umjesto delta:
- Pokriveno u: `B4. Delta V znak`

11. Metoda voda shema C (cjevovod): ne prikazivati unos okna (vrsta/materijal), nema H2:
- Pokriveno u: `B2. Shema C (cjevovod): sakriti okno polja i H2`

12. Metoda voda shema C: materijali nisu iz admina (okno/cijev):
- Pokriveno u: `B1. Materijali okna/slivnika i cijevi u PDF-u`

13. Metoda voda shema C: delta V znak:
- Pokriveno u: `B4. Delta V znak`

14. Metoda voda slivnik: umjesto “Visina okna” treba “Visina slivnika”:
- Pokriveno u: `B3. Slivnik labela “Visina slivnika”`

15. Metoda voda slivnik: materijali nisu iz admina:
- Pokriveno u: `B1. Materijali okna/slivnika i cijevi u PDF-u`

16. Metoda voda slivnik: delta V znak:
- Pokriveno u: `B4. Delta V znak`

17. Word generiranje: sekcije se ne prikazuju:
- Pokriveno u: `C1. Sekcije se ne prikazuju u Word dokumentu`

18. Generalno metoda voda: materijali okna se dupliraju:
- Pokriveno u: `B5. Materijali okna se dupliraju pri odabiru`

19. Generalno metoda voda: polje odstupanja mora biti izmjenjivo:
- Pokriveno u: `B6. Odstupanje mora ostati ručno izmjenjivo`

20. Generalno metoda voda: saturacija samo za beton okna:
- Pokriveno u: `B7. Saturacija samo kad je materijal okna beton`

21. Generalni fix: nule u brojčanim poljima automatski nestaju na klik:
- Pokriveno u: `D1. Automatsko uklanjanje nula pri fokusu numeričkih polja`

22. Word: u “Dio građevine” default mora biti “Sustav odvodnje odpadnih voda” i editable:
- Pokriveno u: `C2. “Dio građevine” default tekst + editabilno`

23. Word: datum dodaje čudne razmake/znakove (footer i svugdje):
- Pokriveno u: `C3. Datum u Wordu ima čudne znakove`

24. Word metoda zrak: redni broj s točkom (npr. 1.):
- Pokriveno u: `C4. Redni broj u metodi zrak mora biti “1.”`

25. Word: napomene moraju biti iz unosa korisnika pri generiranju:
- Pokriveno u: `C5. Napomene iz Word dijaloga moraju ući u dokument`

26. Word: naziv slike “Situacija” (bold) + razmak iznad:
- Pokriveno u: `C6. Slike u Wordu: naziv “Situacija” (bold) + razmak iznad`

27. Word: ako neka dionica ne zadovoljava, treba navesti koja:
- Pokriveno u: `C7. U Word tekst dodati koje dionice ne zadovoljavaju`

28. Word metoda vode: odstupanje kao dropdown s 2 opcije:
- Pokriveno u: `C8. Metoda vode napomena/odstupanje kao dropdown (2 opcije)`
