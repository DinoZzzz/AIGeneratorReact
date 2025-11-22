# Master Migration Plan

This document serves as the technical specification for an AI developer to complete the migration from the legacy C# application to the modern React web application.

## Phase 1: Core Logic Correction (Highest Priority)

### Task 1.1: Implement Air Method Test Time Interpolation
**Source:** `AIGenerator/Common/TestTimeClass.cs`
**Target:** `ai-generator-web/src/lib/calculations/testTime.ts`
**Description:**
The current React implementation is a placeholder. You must port the Binary Search and Linear Interpolation logic exactly.
**Requirements:**
1.  Define the standard diameter lists and time lists for Methods LA, LB, LC, LD as constant arrays.
2.  Implement the `GetTestTime(procedureId, draftId, diameter)` function.
3.  Implement the binary search to find the diameter interval `[L, R]`.
4.  Implement the interpolation formula: `Time = Time[L] + (Time[R] - Time[L]) * (Diameter - Diam[L]) / (Diam[R] - Diam[L])`.
5.  Apply the "Shaft Rule": If `DraftId == 4`, divide time by 2.
6.  **Verification:** Write a Unit Test (`testTime.test.ts`) with test cases from the C# code (e.g., Method LA, Diameter 400 -> 10 mins).

## Phase 2: Document Generation (The Hardest Part)

### Task 2.1: Template Conversion
**Source:** `AIGenerator/Templates/method1610.doc`
**Target:** `ai-generator-web/public/templates/method1610.docx`
**Description:**
The legacy app uses an old `.doc` file and C# Interop. We need a `.docx` file with Mustache tags for `docxtemplater`.
**Steps:**
1.  Open the original `.doc` (if possible) or recreate the layout in a new `.docx` file.
2.  Replace textual placeholders:
    *   `%Creator%` -> `{creator}`
    *   `%WorkOrder%` -> `{workOrder}`
    *   ... (Refer to `Legacy_Exports.md` for full mapping)
3.  Rebuild Tables for Loop Data:
    *   Create the header row for Air Method.
    *   Create one data row with tags like `{#airTests} {ordinal} | {stock} | ... {/airTests}`.
    *   Do the same for Water Method: `{#waterTests} ... {/waterTests}`.
4.  Add Conditional Blocks:
    *   Wrap Air table in `{#hasAirTests}...{/hasAirTests}`.
    *   Wrap Water table in `{#hasWaterTests}...{/hasWaterTests}`.

### Task 2.2: Implement Export Service
**Source:** `AIGenerator/Common/MSWord.cs`
**Target:** `ai-generator-web/src/services/wordExportService.ts`
**Description:**
Implement the service using `docxtemplater`, `pizzip`, and `file-saver`.
**Requirements:**
1.  Load the `method1610.docx` from `public/`.
2.  Fetch all necessary data (Customer, Reports, Photos).
3.  Prepare the data object:
    *   Flatten the list of reports into `airTests` and `waterTests` arrays.
    *   Calculate aggregates (e.g., `TubeLengthSum`, `RevisionPaneCount`).
    *   Handle image modules for attachments (converting URLs to binary for the docx).
4.  Render the document and trigger download.

## Phase 3: Data Integration

### Task 3.1: Examiners Service
**Target:** `ai-generator-web/src/services/examinerService.ts`
**Description:**
Replace the mock data with actual Supabase calls.
**Requirements:**
1.  `getAll()`: Fetch from `auth_users` (or a public profile table if arch differs).
2.  `create()`, `update()`, `delete()`: Implement logic (Note: Creating Auth users usually requires Admin API or Edge Function).

## Phase 4: Final Polish & Verification

### Task 4.1: UI Polish
*   Ensure Dashboard sorting matches `PlatformForm.cs` logic.
*   Verify "Save & New" flow in Method Forms resets all fields correctly.

### Task 4.2: E2E Testing
*   Write Playwright tests that simulate a full user flow:
    1.  Login.
    2.  Create Customer.
    3.  Create Construction.
    4.  Add Air Report -> Verify Calculation Result.
    5.  Add Water Report -> Verify Calculation Result.
    6.  Click Export (Verify no crash).
