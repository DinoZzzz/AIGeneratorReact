# Gap Analysis

## Overview
The React application has a good foundation for Data Entry and basic Calculations but lags significantly in **Validation**, **Complex Logic (Test Time)**, and **Reporting/Exports**.

## Critical Gaps

### 1. Export / Reporting (High Priority)
*   **Current State:** React uses a simple client-side PDF generator.
*   **Goal:** Use the original `.doc` templates.
*   **Missing:**
    *   Backend service to handle `.docx` manipulation (OpenXML).
    *   Logic to dynamically add rows to tables in the Word doc.
    *   Logic to handle image attachments in the Word doc.

### 2. Air Method Logic
*   **Current State:** Hardcoded `AllowedLoss = 0.10`.
*   **Goal:** Dynamic lookup based on `ExaminationProcedure`.
*   **Missing:**
    *   Frontend needs to fetch `ExaminationProcedure` details.
    *   Calculation logic needs to use the fetched `AllowedLoss`.

### 3. Test Time Calculation
*   **Current State:** Not implemented.
*   **Goal:** Auto-calculate required test duration.
*   **Missing:**
    *   Port `TestTimeClass` logic from C# to TypeScript.
    *   UI element to display "Required Time" vs "Actual Time".

### 4. Hydrostatic Height & Deviations
*   **Current State:** Calculated but not fully utilized.
*   **Goal:** Auto-fill "Deviation" text when specific conditions are met.
*   **Missing:**
    *   Logic to check `hydrostaticHeight < 100` and `DraftId == 2`.
    *   Auto-population of the `Deviation` text field.

### 5. UI / UX Parity
*   **Read-Only Modes:** C# app has strict "Enabled/Disabled" states for inputs based on the selected Draft (e.g., hiding Pipe inputs if testing only Shaft).
*   **React:** Needs review of `DraftId` based field visibility to ensure it matches `AirMethodForm.cs` `UpdateScreen()` logic.

## Implementation Plan
1.  **Fix Air Calculations:** Fetch procedures and use correct `AllowedLoss`.
2.  **Port Test Time:** Implement the time calculation utility.
3.  **Field Visibility:** Refine the React forms to hide/show fields exactly like the C# `UpdateScreen` methods.
4.  **Backend Export Service:** This is the largest task. A decision needs to be made to build a .NET API endpoint for generating these reports using the original templates.
