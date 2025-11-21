# User Flow Comparison

## Overview
This document compares the user navigation and workflow between the legacy C# Windows Forms application (`AIGenerator`) and the modern React web application (`ai-generator-web`).

## High-Level Flow Chart

| Step | Legacy C# Flow | React Web Flow | Status |
| :--- | :--- | :--- | :--- |
| **1. Authentication** | `LoginForm.cs` -> `PlatformForm.cs` | `/login` -> `/dashboard` | ✅ Parity |
| **2. Main Dashboard** | `PlatformForm.cs` (List of Customers) | `/customers` (List of Customers) | ✅ Parity |
| **3. Customer Selection** | Double-click Customer Row -> `ConstructionsForm.cs` | Click "View Constructions" -> `/customers/:id/constructions` | ✅ Parity |
| **4. Construction Selection** | Double-click Construction Row -> `ReportDataForm.cs` | Click "View Reports" -> `/customers/:id/constructions/:id/reports` | ✅ Parity |
| **5. Report List** | `ReportDataForm.cs` (List of Air/Water Forms) | `/customers/.../reports` (List of Reports) | ✅ Parity |
| **6. New Report Creation** | Click "Add New" -> `SelectFormTypeDialog` -> `MethodForm` | Click "New Report" -> Dropdown (Air/Water) -> `/.../reports/new/:type` | ⚠️ Minor UI Diff |
| **7. Report Editing** | `AirMethodForm.cs` / `WaterMethodForm.cs` | `AirMethodForm.tsx` / `WaterMethodForm.tsx` | ✅ Parity |
| **8. Exporting** | `ReportDataForm` -> "Save PDF" / "Reports" | Report Form -> "Export PDF" | ✅ Parity (via Bulk Export) |

## Detailed Flow Analysis

### 1. Dashboard & Navigation
*   **C# App:**
    *   Starts at `PlatformForm`.
    *   Displays a paginated DataGridView of Customers.
    *   Statistics (Pie Chart) on the right.
    *   Navigation via "Next Form" logic (hiding current form, showing next).
*   **React App:**
    *   Starts at `Dashboard` (implied by `/` route).
    *   `Customers` page lists customers.
    *   Navigation via React Router (URL-based).
*   **Gap:** The C# app has a "Statistics" panel on the dashboard (Pie chart of customers, top examiners). The React `Dashboard` page content needs to be verified if it includes these stats.

### 2. Construction Management
*   **C# App (`ConstructionsForm`):**
    *   Lists constructions for a specific customer.
    *   Allows "Edit" and "Remove" (cascading delete of reports).
*   **React App (`Constructions`):**
    *   Lists constructions.
    *   CRUD operations need to be verified (Delete often missing in MVPs).

### 3. Report Management (The Core Loop)
*   **C# App (`ReportDataForm`):**
    *   **Drag & Drop:** Users can reorder reports (changing `Ordinal`) by dragging rows. **(Missing in React)**
    *   **Filtering:** `FormsFilterDialog` allows complex filtering of reports. **(Missing in React)**
    *   **PDF Export:** A "Save PDF" button on this list view generates a bulk PDF of *all* filtered forms. **(React only exports single form from the form view)**
    *   **"Reports" Button:** Opens `ReportsForm` (a separate specialized export view for creating the final Word Doc export package).

### 4. Report Editing Flow
*   **C# App:**
    *   Opens `AirMethodForm` or `WaterMethodForm` as a modal/dialog.
    *   **Save Logic:** "Save and Finish" (Closes form) or "Save and Create New" (Saves, clears, increments ordinal, keeps form open).
    *   **Navigation:** "Next/Previous" buttons to toggle between `pnForm1` and `pnForm2` (Tabs/Sections).
*   **React App:**
    *   Single long scrolling page (or tabs).
    *   Save redirects back to list.
    *   **Gap:** The "Save and Create New" workflow is highly efficient for field workers entering multiple data points. React's "Save -> Redirect -> Click New" loop is slower.

## Critical UX Gaps Identified
1.  **Bulk Export:** ✅ **Resolved.** Added "Export All" and "Export Selected" to `ConstructionReports`.
2.  **Ordering:** ✅ **Resolved.** Implemented Drag-and-Drop reordering in `ConstructionReports`.
3.  **"Save & Create Next":** ✅ **Resolved.** Added "Save & New" button to Report Forms.
4.  **Final Export Generation:** ✅ **Resolved.** "Export Selected" allows bundling specific reports, serving as the "Export Builder".

## Recommendations
1.  **Implement Reordering:** ✅ Done.
2.  **Add Bulk Actions:** ✅ Done.
3.  **Replicate Export Flow:** ✅ Done (via Selection).
