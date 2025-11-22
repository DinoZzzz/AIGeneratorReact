# React Current State

This document outlines the current state of the `ai-generator-web` React application.

## Architecture
*   **Frontend:** React (Vite) + TypeScript.
*   **UI Library:** Shadcn UI + Tailwind CSS.
*   **Backend:** Supabase (Database + Auth).
*   **Testing:** Vitest (Unit), Playwright (E2E).

## Pages & Features

### 1. Authentication
*   **Login:** Implemented (`src/pages/Login.tsx`). Uses Supabase Auth.
*   **Protection:** `ProtectedRoute` component ensures authenticated access.

### 2. Dashboard (`src/pages/Dashboard.tsx`)
*   **Status:** Partially Implemented.
*   **Content:**
    *   Summary Cards (Total Reports, etc.).
    *   "Top Customers" Pie Chart (Recharts).
    *   "Top Examiners" List.
    *   Customers Table (with Server-side pagination).
*   **Gap:** Comparison with Legacy `PlatformForm` shows good parity, but specific sorting/filtering might need tuning to match C# exactly.

### 3. Customers & Constructions
*   **Customers:** `src/pages/Customers.tsx`. CRUD operations, Search, Pagination.
*   **Constructions:** `src/pages/Constructions.tsx`. Linked to Customers.
*   **Status:** Functional.

### 4. Reports (The Core)
*   **List:** `src/pages/Reports.tsx`. Lists reports for a construction.
*   **Method Forms:**
    *   `AirMethodForm.tsx`: Implements the 2-step UI.
    *   `WaterMethodForm.tsx`: Implements the 2-step UI.
*   **Status:** UI is largely there. The "Save & New" logic exists.

### 5. Services (`src/services/`)
*   `examinerService.ts`: **MOCK Data only.** Not connected to Supabase `users` table properly.
*   `wordExportService.ts`: **Missing/Incomplete.** Needs to handle the complex `.docx` generation with tables and images.
*   `reportService.ts`: Handles CRUD for reports.

### 6. Calculations (`src/lib/calculations/`)
*   `report.ts`: Contains Water method logic. Seems to match `ReportForm.cs` well.
*   `testTime.ts`: **INCORRECT.** Contains a "Simplified" placeholder logic. Needs to be replaced with the exact interpolation algorithm from `TestTimeClass.cs`.

## Key Technical Gaps
1.  **Export:** No robust Word generation implementation that matches the legacy template features (tables, images, conditional text).
2.  **Calculations:** Air Method Test Time is wrong.
3.  **Examiners:** Using mock data.
4.  **Templates:** The legacy `.doc` template needs to be converted and "tagged" for the web generator.
