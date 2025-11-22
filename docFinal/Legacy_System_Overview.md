# Legacy System Overview

## Architecture
The legacy system is a **C# Windows Forms (WinForms)** desktop application targeting the .NET Framework. It is structured as a monolithic client application with a supporting class library for business logic and data access.

### Key Components
1.  **AIGenerator (Desktop App):**
    *   **Technology:** Windows Forms (WinForms).
    *   **Role:** The main user interface for examiners.
    *   **Responsibilities:** User authentication, data entry (Forms), local calculation execution, and report generation (Word export).
    *   **Key Forms:** `PlatformForm` (Dashboard), `ReportsForm` (Report Management), `AirMethodForm`/`WaterMethodForm` (Method 1060).

2.  **Services (Class Library):**
    *   **Technology:** C# Class Library.
    *   **Role:** Data Access Layer (DAL) and Business Logic Layer (BLL).
    *   **Responsibilities:** Interacting with the database (via `AppDbContext`), providing services for entities like `Customer`, `Report`, `User`.
    *   **Key Services:** `ReportExportService`, `ReportFormService`, `UserService`.

3.  **AIGenerator.Common (Shared Library):**
    *   **Role:** Utility functions and shared logic.
    *   **Key Classes:**
        *   `MSWord.cs`: Handles Microsoft Word Interop for report generation.
        *   `TestTimeClass.cs`: Contains the specific interpolation logic for calculating Air Method test times.
        *   `Calculations`: Embedded within `Models/ReportForm.cs`.

## Data Model (Legacy)
The core entities revolve around the **Report** lifecycle:
*   **Customer:** The client ordering the inspection.
*   **CustomerConstruction:** A specific project or site for a customer.
*   **ReportExport (Export):** Represents a generated document bundle (a "Job" or "Session").
*   **ReportForm (Form):** A specific test instance (e.g., one pipe segment test). One `ReportExport` contains multiple `ReportForm` items.
*   **Draft (Schema):** Defines the type of test (e.g., "Shaft", "Pipe", "Shaft & Pipe").
*   **ExaminationProcedure:** Defines the standard used (e.g., "Air Method 1060").

## Core Workflow
1.  **Login:** User authenticates.
2.  **Dashboard (Platform):** User sees summary stats, top customers, and can search customers.
3.  **Customer Selection:** User selects a customer and a construction site.
4.  **Report Management:** User creates a new "Report Export" (container).
5.  **Data Entry:** User adds specific test forms (`AirMethodForm` or `WaterMethodForm`) to the report.
6.  **Calculation:** As data is entered, the system calculates results (Pass/Fail) in real-time.
7.  **Export:** User generates a `.doc` file. The system opens a template, fills placeholders, and appends data tables.
