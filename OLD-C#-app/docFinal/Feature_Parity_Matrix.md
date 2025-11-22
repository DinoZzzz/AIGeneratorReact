# Feature Parity Matrix

| Feature | Legacy C# (Source) | React App (Target) | Status | Gap / Action Item |
| :--- | :--- | :--- | :--- | :--- |
| **Login** | `LoginForm.cs` | `Login.tsx` | ✅ Parity | - |
| **Dashboard** | `PlatformForm.cs` | `Dashboard.tsx` | ⚠️ Partial | Ensure sort/filter behavior matches exactly. |
| **Customers** | `CustomersForm.cs` | `Customers.tsx` | ✅ Parity | - |
| **Constructions** | `ConstructionsForm.cs` | `Constructions.tsx` | ✅ Parity | - |
| **Reports List** | `ReportsForm.cs` | `Reports.tsx` | ✅ Parity | - |
| **Air Method UI** | `AirMethodForm.cs` | `AirMethodForm.tsx` | ✅ Parity | UI fields match. |
| **Water Method UI** | `WaterMethodForm.cs` | `WaterMethodForm.tsx` | ✅ Parity | UI fields match. |
| **Air Logic: Pass/Fail** | `ReportForm.cs` | `report.ts` | ✅ Parity | Logic seems present. |
| **Air Logic: Test Time** | `TestTimeClass.cs` | `testTime.ts` | ❌ **CRITICAL GAP** | React uses "simplified" formula. Needs Binary Search Interpolation. |
| **Water Logic** | `ReportForm.cs` | `report.ts` | ✅ Parity | Calculations ported. |
| **Word Export** | `MSWord.cs` (Interop) | `wordExportService.ts` | ❌ **CRITICAL GAP** | Need to implement `docxtemplater` with tables, images, loops. |
| **Examiners** | `ExaminersForm.cs` | `Examiners.tsx` | ⚠️ Partial | React uses Mock Service. Needs Supabase integration. |
| **History** | `HistoryForm.cs` | `History.tsx` | ⚠️ Partial | Verify filters and export re-generation. |
| **Settings** | `SettingsForm.cs` | `Settings.tsx` | ⚠️ Partial | Material management restricted to Admin. |
| **Template** | `method1610.doc` | N/A | ❌ Missing | Need to convert `.doc` -> `.docx` and add Mustache tags. |

## Priority List
1.  **Air Method Test Time:** This is a core business rule. If wrong, reports are invalid.
2.  **Word Export:** The app is useless without the generated report.
3.  **Template Conversion:** Prerequisite for Export.
4.  **Examiners Integration:** Needed for proper data management.
