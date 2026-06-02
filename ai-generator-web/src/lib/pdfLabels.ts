export type PdfExportLanguage = 'hr' | 'sl';

export interface PdfLabels {
    // Header
    labTitle: string;
    hasSpecialD: boolean; // Whether labTitle needs the Đ rendering hack
    
    // Document titles
    waterTitle: string;
    airTitle: string;
    
    // Meta
    pageLabel: string;
    editionLabel: string;
    formDateLabel: string;
    
    // Status
    satisfies: string;
    notSatisfies: string;
    
    // General info
    temperature: string;
    examDate: string;
    sketch: string;
    
    // Input labels
    section: string;
    shaftType: string;
    gullyType: string;
    round: string;
    rectangular: string;
    shaftMaterial: string;
    gullyMaterial: string;
    shaftHeight: string;
    gullyHeight: string;
    shaftDiameter: string;
    gullyDiameter: string;
    shaftWidth: string;
    shaftLength: string;
    gullyWidth: string;
    gullyLength: string;
    mainPipeDiameter: string;
    channelWidth: string;
    channelLength: string;
    channelHeight: string;
    waterHeight: string;
    testMethod: string;
    duration: string;
    
    // Pipe info
    pipeMaterial: string;
    pipeLength: string;
    pipeDiameter: string;
    deposHeight: string;
    slope: string;
    
    // Air measurements
    stabTime: string;
    testTime: string;
    pressureStart: string;
    pressureEnd: string;
    pressureLoss: string;
    
    // Results - water
    wettedShaftSurface: string;
    wettedGullySurface: string;
    wettedChannelSurface: string;
    wettedPipeSurface: string;
    totalWettedSurface: string;
    allowedLossL: string;
    allowedLossMm: string;
    waterLevelStart: string;
    waterLevelEnd: string;
    hydroHeight: string;
    waterLoss: string;
    measuredLoss: string;
    
    // Air table
    dryConcrPipes: string;
    otherPipes: string;
    initPressureLabel: string;
    pMbar: string;
    allowedDropLabel: string;
    dpMbar: string;
    testTimeTMin: string;
    dnMm: string;
    
    // Footer
    remark: string;
    normDeviation: string;
    createdBy: string;
    unknownUser: string;
    
    // Scheme names
    waterSchemes: Record<number, string>;
    airSchemes: Record<number, string>;
    airLetterSchemes: Record<string, string>;
    unknownScheme: string;
}

const hrLabels: PdfLabels = {
    labTitle: 'GRAĐEVINSKI LABORATORIJ',
    hasSpecialD: true,
    
    waterTitle: 'ISPITIVANJE\nVODONEPROPUSNOSTI\nCJEVOVODA CIJEVI I\nKONTROLNA OKNA\nPREMA HRN EN\n1610:2015 - L',
    airTitle: 'ISPITIVANJE\nVODONEPROPUSNOSTI\nCJEVOVODA\nMETODA ZRAK\nPREMA HRN EN\n1610:2015 - L',
    
    pageLabel: 'Stranica',
    editionLabel: 'Izdanje',
    formDateLabel: 'Datum obrasca',
    
    satisfies: 'ZADOVOLJAVA',
    notSatisfies: 'NE ZADOVOLJAVA',
    
    temperature: 'Temperatura',
    examDate: 'Datum ispitivanja',
    sketch: 'Skica',
    
    section: 'Dionica',
    shaftType: 'Tip okna',
    gullyType: 'Tip slivnika',
    round: 'Okrugli',
    rectangular: 'Kvadratni',
    shaftMaterial: 'Materijal okna',
    gullyMaterial: 'Materijal slivnika',
    shaftHeight: 'Visina okna',
    gullyHeight: 'Visina slivnika',
    shaftDiameter: 'Promjer okna',
    gullyDiameter: 'Promjer slivnika',
    shaftWidth: 'Širina okna',
    shaftLength: 'Dužina okna',
    gullyWidth: 'Širina slivnika',
    gullyLength: 'Dužina slivnika',
    mainPipeDiameter: 'Promjer gl. cijevi',
    channelWidth: 'Širina kanala',
    channelLength: 'Dužina kanala',
    channelHeight: 'Visina kanala',
    waterHeight: 'Visina vode',
    testMethod: 'Metoda ispitivanja',
    duration: 'Trajanje',
    
    pipeMaterial: 'Materijal cijevi',
    pipeLength: 'Dužina cijevi',
    pipeDiameter: 'Promjer cijevi',
    deposHeight: 'Taložna visina',
    slope: 'Nagib',
    
    stabTime: 'Vr. stabilizacije',
    testTime: 'Vr. ispitivanja',
    pressureStart: 'Tlak poc.',
    pressureEnd: 'Tlak kraj',
    pressureLoss: 'Pad tlaka',
    
    wettedShaftSurface: 'Om. povr. okna',
    wettedGullySurface: 'Om. povr. slivnika',
    wettedChannelSurface: 'Om. povr. kanala',
    wettedPipeSurface: 'Om. povr. cijevi',
    totalWettedSurface: 'Ukupna om. povr.',
    allowedLossL: 'Dozv. gubitak (l)',
    allowedLossMm: 'Dozv. gubitak (mm)',
    waterLevelStart: 'Vis. vode na poc.',
    waterLevelEnd: 'Vis. vode na kraju',
    hydroHeight: 'Hidrost. visina',
    waterLoss: 'Gubitak vode',
    measuredLoss: 'Izmj. gubitak',
    
    dryConcrPipes: 'SUHE BETONSKE CIJEVI',
    otherPipes: 'OSTALE CIJEVI',
    initPressureLabel: 'Poc. tlak',
    pMbar: 'p0 [mbar]',
    allowedDropLabel: 'Dozv. pad',
    dpMbar: 'dp [mbar]',
    testTimeTMin: 'Vrijeme ispitivanja t [min]',
    dnMm: 'DN [mm]',
    
    remark: 'Napomena',
    normDeviation: 'Odstupanje od norme',
    createdBy: 'Izradio',
    unknownUser: 'Nepoznat korisnik',
    
    waterSchemes: {
        1: 'Shema A - Ispitivanje okna',
        2: 'Shema C - Ispitivanje cjevovoda',
        3: 'Shema B - Ispitivanje okna i cjevovoda',
        4: 'Shema D - Ispitivanje slivnika',
        5: 'Shema E - Ispitivanje slivnika i cjevovoda',
    },
    airSchemes: {
        1: 'Shema 1 - Ispitivanje cjevovoda',
        2: 'Shema 2 - Ispitivanje okna i cjevovoda',
        3: 'Shema 3 - Ispitivanje okna',
    },
    airLetterSchemes: {
        F: 'Shema F - Ispitivanje okna',
        G: 'Shema G - Ispitivanje cjevovoda',
        H: 'Shema H - Ispitivanje okna i cjevovoda',
    },
    unknownScheme: 'Nepoznata shema',
};

const slLabels: PdfLabels = {
    labTitle: 'GRADBENI LABORATORIJ',
    hasSpecialD: false,
    
    waterTitle: 'PREIZKUŠANJE\nVODOTESNOSTI\nCEVOVODA CEVI IN\nKONTROLNI JAŠKI\nPO SIST EN\n1610:2015 - L',
    airTitle: 'PREIZKUŠANJE\nVODOTESNOSTI\nCEVOVODA\nMETODA ZRAK\nPO SIST EN\n1610:2015 - L',
    
    pageLabel: 'Stran',
    editionLabel: 'Izdaja',
    formDateLabel: 'Datum obrazca',
    
    satisfies: 'USTREZA',
    notSatisfies: 'NE USTREZA',
    
    temperature: 'Temperatura',
    examDate: 'Datum preizkusa',
    sketch: 'Skica',
    
    section: 'Odsek',
    shaftType: 'Tip jaška',
    gullyType: 'Tip požiralnika',
    round: 'Okrogel',
    rectangular: 'Pravokoten',
    shaftMaterial: 'Material jaška',
    gullyMaterial: 'Material požiralnika',
    shaftHeight: 'Višina jaška',
    gullyHeight: 'Višina požiralnika',
    shaftDiameter: 'Premer jaška',
    gullyDiameter: 'Premer požiralnika',
    shaftWidth: 'Širina jaška',
    shaftLength: 'Dolžina jaška',
    gullyWidth: 'Širina požiralnika',
    gullyLength: 'Dolžina požiralnika',
    mainPipeDiameter: 'Premer gl. cevi',
    channelWidth: 'Širina kanala',
    channelLength: 'Dolžina kanala',
    channelHeight: 'Višina kanala',
    waterHeight: 'Višina vode',
    testMethod: 'Metoda preizkušanja',
    duration: 'Trajanje',
    
    pipeMaterial: 'Material cevi',
    pipeLength: 'Dolžina cevi',
    pipeDiameter: 'Premer cevi',
    deposHeight: 'Usedalna višina',
    slope: 'Naklon',
    
    stabTime: 'Čas stabilizacije',
    testTime: 'Čas preizkušanja',
    pressureStart: 'Tlak zač.',
    pressureEnd: 'Tlak konč.',
    pressureLoss: 'Padec tlaka',
    
    wettedShaftSurface: 'Om. povr. jaška',
    wettedGullySurface: 'Om. povr. požiralnika',
    wettedChannelSurface: 'Om. povr. kanala',
    wettedPipeSurface: 'Om. povr. cevi',
    totalWettedSurface: 'Skupna om. povr.',
    allowedLossL: 'Dovol. izguba (l)',
    allowedLossMm: 'Dovol. izguba (mm)',
    waterLevelStart: 'Viš. vode na zač.',
    waterLevelEnd: 'Viš. vode na koncu',
    hydroHeight: 'Hidrost. višina',
    waterLoss: 'Izguba vode',
    measuredLoss: 'Izmer. izguba',
    
    dryConcrPipes: 'SUHE BETONSKE CEVI',
    otherPipes: 'OSTALE CEVI',
    initPressureLabel: 'Zač. tlak',
    pMbar: 'p0 [mbar]',
    allowedDropLabel: 'Dovol. padec',
    dpMbar: 'dp [mbar]',
    testTimeTMin: 'Čas preizkušanja t [min]',
    dnMm: 'DN [mm]',
    
    remark: 'Opomba',
    normDeviation: 'Odstopanje od norme',
    createdBy: 'Izdelal',
    unknownUser: 'Neznan uporabnik',
    
    waterSchemes: {
        1: 'Shema A - Preizkušanje jaška',
        2: 'Shema C - Preizkušanje cevovoda',
        3: 'Shema B - Preizkušanje jaška in cevovoda',
        4: 'Shema D - Preizkušanje požiralnika',
        5: 'Shema E - Preizkušanje požiralnika in cevovoda',
    },
    airSchemes: {
        1: 'Shema 1 - Preizkušanje cevovoda',
        2: 'Shema 2 - Preizkušanje jaška in cevovoda',
        3: 'Shema 3 - Preizkušanje jaška',
    },
    airLetterSchemes: {
        F: 'Shema F - Preizkušanje jaška',
        G: 'Shema G - Preizkušanje cevovoda',
        H: 'Shema H - Preizkušanje jaška in cevovoda',
    },
    unknownScheme: 'Neznana shema',
};

const labelsMap: Record<PdfExportLanguage, PdfLabels> = {
    hr: hrLabels,
    sl: slLabels,
};

export const getPdfLabels = (language?: PdfExportLanguage): PdfLabels => {
    return labelsMap[language || 'hr'];
};
