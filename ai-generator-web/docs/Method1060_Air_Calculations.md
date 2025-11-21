# Method 1060 - Air Calculations

## Logic Comparison

| Feature | C# Implementation (`ReportForm.cs`) | React Implementation (`report.ts`) | Status |
| :--- | :--- | :--- | :--- |
| **Pressure Loss** | `Math.Abs(PressureEnd - PressureStart)` | `Math.Abs(end - start)` | ✅ Matches |
| **Allowed Loss** | Defined in `ExaminationProcedure` entity (`AllowedLoss` field). | Hardcoded to `0.10`. | ❌ **GAP** |
| **Satisfaction** | `CalculatePressureLoss() <= examinationProcedure.AllowedLoss` | `pressureLoss <= 0.10` | ❌ **GAP** |
| **Test Time** | `TestTimeClass.GetTestTime(...)` (Complex logic based on pipe size/type) | Not implemented. | ❌ **GAP** |

## Detailed C# Logic

### Satisfaction Check
The C# app relies on the `ExaminationProcedure` selected by the user.
```csharp
// ReportForm.cs
public bool IsSatisfying(ExaminationProcedure examinationProcedure)
{
    // ...
    double loss = CalculatePressureLoss();
    Satisfies = loss <= examinationProcedure.AllowedLoss;
    return Satisfies;
}
```

### Test Time Calculation
The C# app dynamically calculates the required test duration (`dtTestTime`) based on the procedure and geometry. This logic resides in `TestTimeClass` (which needs to be ported).

## Required Actions for React
1.  **Update `AirMethodForm.tsx`**:
    *   Fetch `ExaminationProcedure` data including `AllowedLoss`.
    *   Pass the selected procedure's `AllowedLoss` to the calculation function.
2.  **Update `report.ts`**:
    *   Modify `calculateAirReport` to accept `allowedLoss` as a parameter instead of hardcoding `0.10`.
3.  **Implement `TestTime` Logic**:
    *   Locate `TestTimeClass.cs` in C# (likely in `Common` or `Services`).
    *   Port the logic to a new `testTime.ts` utility.
    *   Display the required test time on the form.
