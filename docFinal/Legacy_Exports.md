# Legacy Export Process

This document details the report generation process used in the C# application.

## Overview
The legacy app uses **Microsoft Office Interop** (`Microsoft.Office.Interop.Word`). It does **not** create documents from scratch. Instead, it opens a pre-existing `.doc` template and modifies it.

**File:** `AIGenerator/Common/MSWord.cs`
**Template:** `AIGenerator/Templates/method1610.doc`

## The Process

1.  **Open Template:**
    The app copies `method1610.doc` to a temporary path and opens it.

2.  **Simple Text Replacements:**
    The app searches for specific `%TAGS%` and replaces them with data.

    | Tag | Data Source |
    | :--- | :--- |
    | `%Creator%` | Logged-in User Name |
    | `%Certifier%` | Selected Certifier Name (or blank) |
    | `%ConstructionSitePart%` | User input from ExportForm |
    | `%CurrentDate%` | Examination Date |
    | `%WorkOrder%` | Customer Work Order |
    | `%ExaminationDate%` | Min/Max date range of tests |
    | `%Temperature%` | Min/Max temperature range |
    | `%RevisionPaneCount%` | Count of shafts tested |
    | `%TubeLengthSum%` | Sum of pipe lengths |
    | `%Drainage%` | Drainage type input |
    | `%AirMethodRemark%` | User input |
    | `%WaterMethodRemark%` | User input |
    | `%Satisfies%` | "ZADOVOLJAVA" / "NE ZADOVOLJAVA" |

3.  **Table Manipulation (The Hard Part):**
    The template contains empty tables for Air and Water results. The code locates these tables by index (Tables[4] for Air, Tables[5] for Water) and dynamically adds rows.

    *   **Air Table (Table 4):**
        *   Col 1: Ordinal (1, 2, 3...)
        *   Col 2: Stock (Section Name)
        *   Col 3: Pipe Length
        *   Col 4: Procedure (e.g., "LC - 100mbar")
        *   Col 5: Allowed Loss
        *   Col 6: Actual Loss
        *   Col 7: Constant "0.23" (?)

    *   **Water Table (Table 5):**
        *   Col 1: Ordinal
        *   Col 2: Stock
        *   Col 3: Allowed Loss (L)
        *   Col 4: Water Volume Loss (L)
        *   Col 5: Result (L/m²)

4.  **Conditional Text Blocks:**
    The app looks for "Blocks" of text marked by start/end tags and deletes them if they aren't needed.
    *   `%ShowAirMethodTextStart%` ... `%ShowAirMethodTextEnd%`: Deleted if no Air tests exist.
    *   `%ShowWaterMethodTextStart%` ... `%ShowWaterMethodTextEnd%`: Deleted if no Water tests exist.
    *   `%ShowPaneInfoStart%` ... `%ShowPaneInfoEnd%`: Shows list of shaft materials/diameters.

5.  **Attachments:**
    The app iterates through `ReportFiles` (photos).
    *   It finds the `%Attachments%` tag.
    *   It inserts the photo description.
    *   It inserts the photo image using `InlineShapes.AddPicture`.

## Migration Challenge
The Web App **cannot** use Office Interop. It must use a library like `docxtemplater` or `docx`.
*   **Simple Tags:** Easy to port (`{Creator}`).
*   **Tables:** `docxtemplater` supports loops `{#tests}...{/tests}` which is cleaner than Interop row adding.
*   **Conditional Blocks:** `docxtemplater` supports conditionals `{#showAir}...{/showAir}`.
*   **Images:** `docxtemplater` has an image module.

**Key Requirement:** The template `method1610.doc` must be converted to a `.docx` file and updated with Mustache-style tags (`{tag}`) instead of `%tag%`.
