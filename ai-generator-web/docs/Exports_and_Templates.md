# Exports and Templates

## The Challenge
The C# application uses **Microsoft Office Interop** to automate MS Word. It opens a `.doc` template (`Templates/method1610.doc`) and performs "Find & Replace" operations to fill in data. This approach **cannot** be directly replicated in a browser-based React app or a Linux-based web server because it requires an installed local instance of Microsoft Word.

## C# Template Logic (`MSWord.cs`)
The class `AIGenerator.Common.MSWord` handles the export.

### 1. Placeholders
The code replaces specific strings in the Word doc with data:
*   `%Creator%`, `%Certifier%` -> User Names
*   `%CustomerName%`, `%CustomerDetailed%` -> Customer Info
*   `%ConstructionSite%`, `%WorkOrder%` -> Site Info
*   `%ExaminationDate%` -> Date Range
*   `%Temperature%` -> Min-Max Temp
*   `%AirMethodSatisfies%`, `%WaterMethodCriteria%` -> Summary Results

### 2. Dynamic Tables
The document contains pre-defined tables (Table 4 for Air, Table 5 for Water).
*   The code iterates through selected reports.
*   It adds a new row to the Word table for each report.
*   It fills cells with calculated values (e.g., `CalculatePressureLoss()`, `CalculateResult()`).

### 3. Attachments
*   Images and PDFs are appended to the end of the document.
*   It uses `InlineShapes.AddPicture` to insert images.

## Recommended Strategy for React
Since `Interop` is not an option, we must choose a compatible alternative.

### Option A: Client-Side Generation (Recommended for MVP)
Use a library like `docxtemplater` (for filling text) and `docx` (for creating tables) in the browser.
*   **Pros:** No backend required.
*   **Cons:** Hard to replicate complex existing `.doc` layouts perfectly. Converting `.docx` to PDF in the browser is difficult.

### Option B: Backend Generation Service (Recommended for Parity)
Create a C# ASP.NET Core API endpoint (in `AIGeneratorWebApi`) that uses **OpenXML SDK** or a library like **DocX** or **Aspose.Words** (Commercial).
1.  **Input:** JSON object with all report data.
2.  **Process:**
    *   Load `method1610.docx` (converted from .doc).
    *   Replace text placeholders (OpenXML).
    *   Insert table rows (OpenXML).
    *   Insert images (OpenXML).
    *   Convert to PDF (using a library like `QuestPDF` or `LibreOffice` headless).
3.  **Output:** Return PDF file to React app.

## Immediate Next Steps
1.  **Convert Template:** Open `AIGenerator/Templates/method1610.DOC` in Word and save it as `.docx`.
2.  **Define API Contract:** Create a definition of the JSON payload the React app should send to the backend.
3.  **Migration:** Since the user requested "same templates", **Option B** is the only viable path to true parity. The React app's current `generatePDF` (likely `jspdf`) will never match the Word template exactly.

## Template Placeholders Reference
*   `%Creator%`
*   `%Certifier%`
*   `%ConstructionSitePart%`
*   `%CurrentDate%`
*   `%WorkOrder%`
*   `%ExaminationDate%`
*   `%Temperature%`
*   `%CustomerDetailed%`
*   `%CustomerName%`
*   `%ConstructionLocations%`
*   `%ConstructionSite%`
*   `%RevisionPaneCount%`
*   `%TubeLengthSum%`
*   `%Drainage%`
*   `%AirMethodRemark%`
*   `%AirNormDeviation%`
*   `%WaterMethodRemark%`
*   `%WaterNormDeviation%`
*   `%AirMethodSatisfies%`
*   `%WaterMethodCriteria%`
*   `%Satisfies%`
*   `%UnsatisfiedStocks%`
