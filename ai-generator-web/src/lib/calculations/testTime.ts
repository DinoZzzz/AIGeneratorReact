
/**
 * Calculates the required test time for Air Method (EN 1610)
 * Ported from AIGenerator/Common/TestTimeClass.cs
 */

export const calculateRequiredTestTime = (
    procedureId: number, // 1=LA, 2=LB, 3=LC, 4=LD
    draftId: number, // 1 or 4 = Shaft only (halves the time)
    diameterMm: number // Diameter in millimeters
): number => {

    // Standard diameters list from C# TestTimeClass.cs
    const diameters = [100, 200, 300, 400, 600, 800, 1000, 1100, 1200];

    // Time lists corresponding to Procedure IDs
    let times: number[] = [];

    switch (procedureId) {
        case 1: // LA (10 mbar)
            times = [5, 5, 7, 10, 14, 19, 24, 27, 29];
            break;
        case 2: // LB (50 mbar)
            times = [4, 4, 6, 7, 11, 15, 19, 21, 22];
            break;
        case 3: // LC (100 mbar)
            times = [3, 3, 4, 5, 6, 11, 14, 15, 16];
            break;
        case 4: // LD (200 mbar)
            times = [1.5, 1.5, 2, 2.5, 4, 5, 7, 7, 8];
            break;
        default:
            return 0;
    }

    let calculatedTime = 0;

    // Logic from C# CalculateTestTime
    if (diameterMm >= Math.max(...diameters)) {
        calculatedTime = times[times.length - 1];
    } else {
        // Binary search for interval
        let l = 0;
        let r = diameters.length - 1;

        while (r - l > 1) {
            const m = Math.floor((l + r) / 2);
            if (diameters[m] > diameterMm) {
                r = m;
            } else {
                l = m;
            }
        }

        // Linear Interpolation
        // time = time[l] + (time[r] - time[l]) * (val - list[l]) / (list[r] - list[l])
        const timeL = times[l];
        const timeR = times[r];
        const diamL = diameters[l];
        const diamR = diameters[r];

        calculatedTime = timeL + (timeR - timeL) * (diameterMm - diamL) / (diamR - diamL);
    }

    // Shaft logic: C# says "draftId == 4" (which in C# seed seems to be "Shaft" for Air Type?).
    // In React/Enums/DraftEnum.cs:
    // Ispitivanje_okna = 1
    // But in DatabaseInitializer.cs:
    // Id 4 = ReportFormType 2 (Air) + DraftEnum 1 (Shaft)
    // So for Air Methods, the "Shaft" report draft has ID 4 in the database table `report_drafts`.
    // However, the React dropdown might be sending ID 1 (based on the Enum value, or the ID from the table).
    // The React `AirMethodForm` sets `draft_id` to 1, 2, 3 manually in the Select.
    // If the backend expects 4, 5, 6 for Air, then React is sending the wrong IDs OR the React app treats 1,2,3 as universal IDs.
    // Given the React code `initialState` has `draft_id: 1` (Shaft), we should support 1 as well.
    // Update: If draftId is 1 (Shaft) or 4 (Shaft in DB context), we halve the time.
    if (draftId === 4 || draftId === 1) {
        calculatedTime = calculatedTime / 2;
    }

    return calculatedTime;
};

export const formatTime = (minutes: number): string => {
    const m = Math.floor(minutes);
    const s = Math.round((minutes - m) * 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};
