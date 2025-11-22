# Legacy Calculations (Method 1060)

This document details the exact mathematical formulas and logic used in the legacy C# application.

## 1. Air Method (Method 1060)

### Logic Source
*   **Form:** `AIGenerator/ReportForms/Method1060/AirMethodForm.cs`
*   **Model:** `Models/ReportForm.cs`
*   **Time Calculation:** `AIGenerator/Common/TestTimeClass.cs`

### Pass/Fail Criteria
A test **PASSES** if:
```csharp
PressureLoss <= AllowedLoss
```
Where:
*   `PressureLoss = |PressureEnd - PressureStart|`
*   `AllowedLoss` is defined by the `ExaminationProcedure` (e.g., 2.0 mbar for Method LC).

### Test Time Calculation
The test duration is **NOT** a simple formula. It is interpolated from a standard table based on the **Pipe Diameter**.

**Algorithm (`TestTimeClass.cs`):**
1.  **Inputs:**
    *   `ProcedureId` (Method type: LA, LB, LC, LD).
    *   `DraftId` (Test type: Pipe, Shaft, etc.).
    *   `Diameter` (mm).
2.  **Standard Table lookup:**
    *   Standard Diameters: `[100, 200, 300, 400, 600, 800, 1000, 1100, 1200]`
    *   **Method LA (Procedure 1):** `[5, 5, 7, 10, 14, 19, 24, 27, 29]` minutes.
    *   **Method LB (Procedure 2):** `[4, 4, 6, 7, 11, 15, 19, 21, 22]` minutes.
    *   **Method LC (Procedure 3):** `[3, 3, 4, 5, 6, 11, 14, 15, 16]` minutes.
    *   **Method LD (Procedure 4):** `[1.5, 1.5, 2, 2.5, 4, 5, 7, 7, 8]` minutes.
3.  **Interpolation:**
    *   Find the interval `[L, R]` in the diameter list that contains the input `Diameter`.
    *   `Time = Time[L] + (Time[R] - Time[L]) * (Diameter - Diam[L]) / (Diam[R] - Diam[L])`
    *   *Edge Case:* If `Diameter > 1200`, use the last value.
4.  **Shaft Adjustment:**
    *   If `DraftId == 4` (Shaft only), `Time = Time / 2`.

---

## 2. Water Method (Method 1060)

### Logic Source
*   **Form:** `AIGenerator/ReportForms/Method1060/WaterMethodForm.cs`
*   **Model:** `Models/ReportForm.cs`

### Pass/Fail Criteria
A test **PASSES** if:
```csharp
Result <= Criteria
```
Where:
*   `Result` = `WaterVolumeLoss` / `TotalWettedArea` (L/m²)
*   `Criteria`:
    *   **Draft 1 (Shaft):** 0.401 L/m²
    *   **Draft 2 (Shaft + Pipe):** 0.201 L/m²
    *   **Draft 3 (Pipe):** 0.15 L/m²

### Key Formulas

#### 1. Water Volume Loss (L)
Calculated based on the change in water level (`WaterHeight`) and the geometry of the "Pane" (Shaft/Manhole).
*   `HeightLoss = |WaterHeightEnd - WaterHeightStart|`
*   **Round Shaft:** `HeightLoss * (PaneDiameter^2 * PI / 4)`
*   **Rectangular Shaft:** `HeightLoss * PaneWidth * PaneLength`

#### 2. Wetted Surface Area (m²)
*   **Shaft Surface:**
    *   **Round:** `(PaneDiameter^2 * PI / 4) + (PaneDiameter * PI * WaterHeight)`
    *   **Rectangular:** `(PaneLength * PaneWidth) + 2*(PaneLength * WaterHeight) + 2*(PaneWidth * WaterHeight)`
    *   *Note:* If Draft is Pipe only, Shaft Surface is 0.
*   **Pipe Surface:**
    *   ` (PipeDiameter^2 * PI / 4) + (PipeDiameter * PI * PipeLength)`
    *   *Note:* If Draft is Shaft only, Pipe Surface is 0.
*   **Total Wetted Area:** `ShaftSurface + PipeSurface`

#### 3. Hydrostatic Height
*   `WaterHeight - PipeDiameter`
*   *(Exception for Draft 8):* `|WaterHeight - DepositionalHeight - PipeDiameter|`
