# Method 1060 - Water Calculations

## Logic Comparison

| Feature | C# Implementation (`ReportForm.cs`) | React Implementation (`report.ts`) | Status |
| :--- | :--- | :--- | :--- |
| **Water Loss (mm)** | `Math.Abs(WaterHeightEnd - WaterHeightStart)` | `Math.Abs(end - start)` | ✅ Matches |
| **Volume Loss (l)** | Based on shape (Round/Rect) and dimensions. | Implemented for Type 1 (Round) and 2 (Rect). | ✅ Matches |
| **Wetted Shaft Area** | Complex logic based on `DraftId` and `MaterialType`. | Ported. | ✅ Matches |
| **Wetted Pipe Area** | Based on Diameter/Length. | Ported. | ✅ Matches |
| **Total Area** | Sum of Shaft + Pipe. | Ported. | ✅ Matches |
| **Criteria (l/m²)** | 0.401, 0.201, or 0.15 based on `DraftId`. | Ported `getCriteria`. | ✅ Matches |
| **Allowed Loss (l)** | `Criteria * TotalArea` | Ported. | ✅ Matches |
| **Result (l/m²)** | `VolumeLoss / TotalArea` | Ported. | ✅ Matches |
| **Satisfaction** | `Result <= Criteria` | Ported. | ✅ Matches |

## Detailed Logic

### Criteria Selection
*   **Draft 1 (Shaft):** 0.401 l/m²
*   **Draft 2 (Pipe):** 0.201 l/m²
*   **Draft 3 (Shaft + Pipe):** 0.15 l/m²

### Volume Loss Formula
*   **Round:** `Loss * (Diameter^2 * PI / 4)`
*   **Rectangular:** `Loss * Width * Length`

### Wetted Surface Formula
*   **Shaft (Round):** Bottom Area (`D^2*PI/4`) + Side Area (`D*PI*H`)
*   **Shaft (Rect):** Bottom Area (`L*W`) + Side Area (`2(L*H) + 2(W*H)`)
*   **Pipe:** `(D^2*PI/4) + (D*PI*L)`
    *   *Note:* C# excludes pipe surface if `DraftId` is 1 (Shaft only) or 4. React checks `draftId === 1 || draftId === 4` correctly.

## Gaps
*   **Hydrostatic Height:** C# calculates `CalculateHydrostaticHeight`. React has this function but it's not clearly displayed/used in the form UI as prominently as in C#.
*   **Deviation Text:** C# auto-generates deviation text like "Kod pojedinih dionica h2<100cm" if hydrostatic height is low. React does not yet automate this text generation.
