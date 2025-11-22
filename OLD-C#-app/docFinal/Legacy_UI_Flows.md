# Legacy UI Flows

This document details the screens, fields, and user navigation of the legacy C# application.

## 1. Login Screen (`LoginForm.cs`)
*   **Entry Point:** The first screen shown to the user.
*   **Fields:**
    *   `Username` (Text)
    *   `Password` (Text/Masked)
*   **Actions:**
    *   `Login`: Validates credentials. On success, opens `PlatformForm`.

## 2. Dashboard (`PlatformForm.cs`)
*   **Layout:**
    *   **Sidebar/Menu:** Navigation to Platform, History, Examiners, Customers, Settings, Help.
    *   **Header:** Welcome message, User Name, Notification icon.
*   **Main Content:**
    *   **Pie Chart (`chartCustomers`):** Shows "Top Customers" by report count.
    *   **Top Examiners List:** Displays top 3 examiners with their report counts.
    *   **Customers List (`dtCustomers`):**
        *   **Columns:** Number (Work Order), Customer Name, Active Work Orders (List of recent constructions).
        *   **Actions:**
            *   `Edit`: Opens Customer Edit dialog.
            *   `Add Construction`: Opens "Add Construction" dialog.
            *   **Double Click:** Opens `ConstructionsForm` for that customer.
    *   **Search Bar:** Filters customers by Name, Location, or Work Order.

## 3. Constructions List (`ConstructionsForm.cs`)
*   **Access:** Accessed by double-clicking a customer in the Dashboard.
*   **Content:** Lists all construction sites for the selected customer.
*   **Actions:**
    *   Select a construction to view its reports (`ReportsForm`).

## 4. Reports List (`ReportsForm.cs`)
*   **Access:** Accessed from `ConstructionsForm`.
*   **Content:** Lists "Report Exports" (sessions) for a specific construction.
*   **Columns:** Date, Work Order, Creator.
*   **Actions:**
    *   `Create New`: Starts a new report session.
    *   `Edit`: Opens `ReportDataForm`.

## 5. Report Detail / Data Entry (`ReportDataForm.cs`)
*   **Role:** The hub for a specific report session. It lists all the individual test forms (Air/Water) added to this report.
*   **Content:**
    *   List of added test forms (e.g., "Pipe 1", "Pipe 2").
*   **Actions:**
    *   `Add Air Method`: Opens `AirMethodForm`.
    *   `Add Water Method`: Opens `WaterMethodForm`.
    *   `Export`: Opens `ExportForm`.

## 6. Air Method Form (`AirMethodForm.cs`)
*   **Role:** Input screen for Method 1060 (Air).
*   **Layout:** Split into two steps (`pnForm1` and `pnForm2`), toggled by a "Next/Back" button.
*   **Step 1 Fields:**
    *   `Draft` (Dropdown): e.g., "Ispitivanje cjevovoda" (Pipeline), "Ispitivanje okna" (Shaft). *Changes visibility of other fields.*
    *   `Material Type` (Dropdown): e.g., "Round", "Rectangular".
    *   `Tube Material` (Dropdown): e.g., "PVC", "Concrete".
    *   `Pipe Diameter` (Numeric): Input (mm).
    *   `Pipe Length` (Numeric): Input (m).
    *   `Examination Procedure` (Dropdown): e.g., "LA", "LB", "LC", "LD". *Determines allowed loss.*
    *   `Examination Date` (Date Picker).
    *   `Stock` (Text): Segment identifier (e.g., "Dionica 1").
*   **Step 2 Fields:**
    *   `Pressure Start` (Numeric): mbar.
    *   `Pressure End` (Numeric): mbar.
    *   `Test Time` (Calculated/Read-only): Derived from `TestTimeClass`.
    *   `Result` (Read-only): "SATISFIES" / "DOES NOT SATISFY".
*   **Key Behavior:**
    *   Changing `ExaminationProcedure` or `Diameter` triggers `TestTimeClass.GetTestTime()`.
    *   `Save & New`: Saves current form and immediately resets for the next entry (incrementing ordinal).

## 7. Water Method Form (`WaterMethodForm.cs`)
*   **Role:** Input screen for Method 1060 (Water).
*   **Layout:** Two steps, similar to Air Method.
*   **Fields:**
    *   `Water Height Start` (Numeric).
    *   `Water Height End` (Numeric).
    *   `Water Added` (Calculated).
    *   `Wetted Surface` (Calculated).
    *   `Allowable Loss` (Calculated).
*   **Key Behavior:**
    *   Calculates `Water Volume Loss` vs. `Allowable Loss`.

## 8. Export Screen (`ExportForm.cs`)
*   **Role:** Finalize and generate the Word document.
*   **Fields:**
    *   `Certifier` (Dropdown): Select who signs the report.
    *   `Date Range`.
*   **Actions:**
    *   `Generate`: Triggers `MSWord.Export`.
