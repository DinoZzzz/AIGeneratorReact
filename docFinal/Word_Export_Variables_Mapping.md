# Word Export Variables Mapping

This document maps the variables used in the Legacy C# Application's Word Export (`MSWord.cs`) to the new React Application's implementation (`wordExportService.ts`). It identifies implemented variables, missing logic, and provides instructions for achieving full parity.

## 1. Variable Mapping Table

| Legacy Variable (C#) | Legacy Source | React Variable | React Implementation Status | Notes |
| :--- | :--- | :--- | :--- | :--- |
| `%Creator%` | `IUser.GetById(UserId).GetName()` | `creator` | ✅ Implemented | Defaults to "System" if missing. |
| `%Certifier%` | `IUser.GetById(CertifierId).GetName()` | `certifier` | ✅ Implemented | |
| `%ConstructionSitePart%` | `ReportExport.ConstructionPart` | `constructionSitePart` | ✅ Implemented | Defaults to "-". |
| `%CurrentDate%` | `ReportExport.ExaminationDate` (in Footer) | `currentDate` | ✅ Implemented | Formatted as `dd.MM.yyyy.` |
| `%WorkOrder%` | `CustomerConstruction.WorkOrder` | `workOrder` | ✅ Implemented | |
| `%ExaminationDate%` | Calculated from Min/Max of `ReportForm.ExaminationDate` | `examinationDate` | ✅ Implemented | Handles ranges (e.g., "01.01.2023. - 05.01.2023."). |
| `%Temperature%` | Calculated from Min/Max of `ReportForm.Temperature` | `temperature` | ✅ Implemented | Handles ranges (e.g., "10 - 15 ºC"). |
| `%CustomerDetailed%` | Loop through Customers formatted with Address | `customerDetailed` | ⚠️ Partial | C# loops through *all* unique customers in the report. React currently assumes one customer per batch. Needs to loop if multi-customer support is required. |
| `%CustomerName%` | Comma-separated list of Customer Names | `customerName` | ⚠️ Partial | See above. |
| `%ConstructionLocations%` | Comma-separated list of Locations | `constructionLocations` | ⚠️ Partial | See above. |
| `%ConstructionSite%` | Comma-separated list of Constructions | `constructionSite` | ⚠️ Partial | See above. |
| `%RevisionPaneCount%` | Count of Reports where `DraftId` is not 3 or 6 | `revisionPaneCount` | ✅ Implemented | Logic matches. |
| `%TubeLengthSum%` | Sum of `PipeLength` where `DraftId` is not 1 or 4 | `tubeLengthSum` | ✅ Implemented | Logic matches. |
| `%Drainage%` | `ReportExport.Drainage` | `drainage` | ✅ Implemented | |
| `%AirMethodRemark%` | `ReportExport.AirRemark` | `airMethodRemark` | ✅ Implemented | Defaults to "nema". |
| `%AirNormDeviation%` | `ReportExport.AirDeviation` | `airNormDeviation` | ✅ Implemented | Defaults to "nema". |
| `%WaterMethodRemark%` | `ReportExport.WaterRemark` | `waterMethodRemark` | ✅ Implemented | Defaults to "nema". |
| `%WaterNormDeviation%` | `ReportExport.WaterDeviation` | `waterNormDeviation` | ✅ Implemented | Defaults to "nema". |
| `%AirMethodSatisfies%` | Logic: "ne zadovoljava" if any Air test fails | **MISSING** | ❌ Missing | Needs to be added. React only has a global `satisfies` variable. |
| `%WaterMethodCriteria%` | Complex logic based on `DraftId` presence | **MISSING** | ❌ Missing | **Crucial**. Requires formatting with Superscripts (²). See Section 2. |
| `%AirMethodTableName%` | "Tablica br.1" or "Tablica br.2" depending on presence | **MISSING** | ❌ Missing | Logic needs to be ported. |
| `%WaterMethodTableName%` | "Tablica br.1" or "Tablica br.2" depending on presence | **MISSING** | ❌ Missing | Logic needs to be ported. |
| `%Satisfies%` | Global Pass/Fail | `satisfies` | ✅ Implemented | Logic matches (C# uses CAPS, React currently passes text "ZADOVOLJAVA"). |
| `%UnsatisfiedStocks%` | List of stocks that failed | `unsatisfiedStocks` | ✅ Implemented | Logic matches. |
| `%ContentTable%` | List of attachments (formatted text) | **MISSING** | ❌ Missing | **Major Gap**. See Section 3. |
| `%Attachments%` | Images inserted into the document | **MISSING** | ❌ Missing | **Major Gap**. See Section 3. |
| `%PaneMaterials%` | List of unique materials | `paneMaterials` | ✅ Implemented | |
| `%PaneDiameters%` | List of unique diameters (ø X) | `paneDiameters` | ✅ Implemented | |
| `%TubeMaterials%` | List of unique materials | `tubeMaterials` | ✅ Implemented | |
| `%TubeDiameters%` | List of unique diameters (ø X) | `tubeDiameters` | ✅ Implemented | |

---

## 2. Complex Logic Implementation Guide

### A. Water Method Criteria (`%WaterMethodCriteria%`)
The C# application dynamically builds this string based on the `DraftId` types present in the reports. It uses a superscript "2" (ASCII 253).

**C# Logic:**
```csharp
StringBuilder sb = new StringBuilder();
if (reportForms.Any(x => x.DraftId == 1)) sb.Append("reviziono okno = 0,40 l/m²");
if (reportForms.Any(x => x.DraftId == 2)) sb.Append((sb.Length == 0 ? "" : ", ") + "cjevovod + reviziono okno = 0,20 l/m²");
if (reportForms.Any(x => x.DraftId == 3)) sb.Append((sb.Length == 0 ? "" : ", ") + "cjevovod = 0,15 l/m²");
```

**React Implementation Plan:**
1.  In `wordExportService.ts`, iterate through `reports` to check for `draft_id` 1, 2, or 3.
2.  Build the string exactly as above.
3.  **Note on Superscripts:** Docxtemplater handles strings as plain text by default. To support the superscript `²`, you can try simply passing the unicode character `\u00B2`.

### B. Table Naming (`%AirMethodTableName%`, `%WaterMethodTableName%`)
The C# app dynamically numbers tables. If both methods exist, Air is Table 1 and Water is Table 2. If only one exists, it is Table 1.

**React Implementation Plan:**
1.  Check `hasAirTests` and `hasWaterTests`.
2.  Set `airMethodTableName` variable:
    - If `hasAirTests` is true: "Tablica br.1"
    - Else: "" (or hidden by section logic)
3.  Set `waterMethodTableName` variable:
    - If `hasWaterTests` and `hasAirTests`: "Tablica br.2"
    - If `hasWaterTests` and `!hasAirTests`: "Tablica br.1"
    - Else: ""

---

## 3. Attachments and Images (Major Gap)

This is the most significant missing feature. The Legacy app iterates through `ReportExport.ReportFiles` and does two things:

1.  **Content Table (`%ContentTable%`):**
    - It builds a formatted string list of all attachments (e.g., "7.1. Opis slike...").
    - It groups PDFs under a single entry if they are related.

2.  **Image Insertion (`%Attachments%`):**
    - It finds the text placeholder `%{FileId}%` and *replaces it with the actual image file*.
    - It handles page breaks (`\f` in C# string) between images.

**React Implementation Challenges:**
- `docxtemplater` (the paid version) has an Image Module. The open-source version requires a custom parser or the `docxtemplater-image-module-free` (which is deprecated/hard to use).
- **Recommended Approach:**
    1.  Purchase/Use the official `docxtemplater-image-module`.
    2.  Or use the `raw-xml` feature of docxtemplater to inject the XML for images (very complex).
    3.  **Alternative:** Since `pizzip` gives access to the zip structure, we might need a specialized library just for the images, or stick to `docxtemplater`'s image capabilities.

**Immediate Action Plan for React:**
1.  Add the `docxtemplater-image-module-free` (or paid) to `package.json`.
2.  Update `wordExportService.ts` to accept an array of `ReportFile` objects (fetched from Supabase `report_files` table).
3.  Implement the loop to fetch image blobs from Supabase Storage.
4.  Pass the images to the template engine.

---

## 4. Formatting Notes

- **Superscripts:** Use Unicode `\u00B2` (²) and `\u00B3` (³) in your strings.
- **Dates:** Ensure `dd.MM.yyyy.` format (already done).
- **Decimals:** Ensure 2 decimal places, comma separator is standard for HR locale but currently code uses `toFixed(2)` which gives dots.
    - **Correction needed:** Change `formatNum` in `wordExportService.ts` to replace `.` with `,` if Croatian locale is required (e.g., `num.toFixed(2).replace('.', ',')`).
