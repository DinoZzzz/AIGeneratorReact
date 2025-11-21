# Method 1060 (1610) Overview

## Introduction
Method 1060 (referred to as namespace `Method1610` in the C# codebase) is the primary testing method used in the application. It supports two distinct types of tests:
1. **Air Method (Type ID: 2)**: Testing pipe/shaft integrity using air pressure.
2. **Water Method (Type ID: 1)**: Testing pipe/shaft integrity using water volume loss.

## Key Components

### 1. Data Model (`ReportForm.cs`)
The `ReportForm` class is the central data structure. It contains fields for both Air and Water methods.
*   **Shared Fields:** `ExaminationDate`, `ConstructionId`, `Temperature`, `Remark`, `Deviation`.
*   **Air Specifics:** `PressureStart`, `PressureEnd`.
*   **Water Specifics:** `WaterHeight`, `WaterHeightStart`, `WaterHeightEnd`, `DepositionalHeight`.
*   **Geometry:** `PaneDiameter`, `PipeDiameter`, `PipeLength`, `PaneWidth`, `PaneHeight`, `PaneLength`.

### 2. Subtypes (Drafts)
The method supports different "Drafts" (visual schemes) which dictate which fields are visible and how calculations are performed.
*   **Draft 1:** Testing of Shaft (`Ispitivanje_okna`)
*   **Draft 2:** Testing of Pipe (`Ispitivanje_cjevovoda`)
*   **Draft 3:** Testing of Shaft and Pipe (`Ispitivanje_okna_cjevovoda`)
*   *Others exist but these are the primary ones observed.*

### 3. Workflow
1.  User selects a customer and construction site.
2.  User creates a new Report (Air or Water).
3.  User enters geometry and measurement data.
4.  System calculates results (Pressure Loss or Water Loss) and determines if it "Satisfies" the criteria.
5.  Reports are grouped into an **Export** (`ReportExport`), often separating Air and Water tables.
6.  Final output is a Word Document (`.doc`) generated from `Templates/method1610.DOC`.

## Current React Status
*   **Forms:** `AirMethodForm` and `WaterMethodForm` are implemented.
*   **Calculations:** Ported to `src/lib/calculations/report.ts`.
    *   *Water:* Mostly complete.
    *   *Air:* Simplified (Missing dynamic `AllowedLoss` from `ExaminationProcedure`).
*   **Exports:** Currently uses a client-side PDF generator which does not match the C# template system.
