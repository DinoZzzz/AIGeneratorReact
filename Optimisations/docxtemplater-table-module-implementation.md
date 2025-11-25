# Implementing Docxtemplater Table Module (Paid Plugin)

## Overview

The **Docxtemplater Table Module** is a paid plugin (~€50) that enables advanced table features including:
- Dynamic cell merging based on conditions
- Different row structures for different items
- Colspan and rowspan support
- Better section header handling

**Purchase Link:** https://docxtemplater.com/modules/table/

---

## Installation

### 1. Purchase the Module
1. Visit https://docxtemplater.com/modules/table/
2. Complete the purchase (~€50 one-time fee)
3. Download the module file (you'll receive `docxtemplater-table-module.js`)

### 2. Install in Project

```bash
# Install the base package if not already installed
npm install docxtemplater

# The table module will be provided as a file after purchase
# Copy it to your project, e.g., in /src/lib/
```

### 3. Update `wordExportService.ts`

```typescript
import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import { saveAs } from 'file-saver';

// Import the table module (adjust path based on where you save it)
import TableModule from '../lib/docxtemplater-table-module.js';

export const generateWordDocument = async (
    reports: ReportForm[],
    metaData: ExportMetaData,
    userId?: string
) => {
    // ... existing code for loading template ...

    const zip = new PizZip(content);
    const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
        modules: [new TableModule()], // Add the module here
    });

    // ... rest of your code ...
};
```

---

## Updated Data Structure

With the Table Module, you can use more advanced structures:

### For Air Reports with Dynamic Row Types

```typescript
const airReports = sortedAirItems.map((r) => {
    if (r.section_name && !r.draft_id) {
        return {
            rowType: 'section',
            sectionName: r.section_name,
            colspan: 7  // Merge all 7 columns for sections
        };
    }
    return {
        rowType: 'report',
        ordinal: airOrdinal++,
        stock: r.dionica || r.stock || '-',
        pipeLength: formatNum(r.pipe_length, 2),
        // ... other fields
    };
});
```

---

## Updated Word Template Structure

With the Table Module, you can use special syntax for row types:

### Air Method Table Template

**Row 1 (Header):**
| R.br. | Ispitna dionica | Dužina | Ispitna metoda | Dozvoljeni | Izmjereni | Nesigurnost |
|-------|----------------|--------|----------------|------------|-----------|-------------|

**Row 2 (Section Row Template):**
Mark this row with `{#table:airReports:section}` at the start:
```
{#table:airReports:section}
```
| {sectionName} |  |  |  |  |  |  |
|---------------|--|--|--|--|--|--|

Then merge all cells in this row manually in Word.

**Row 3 (Report Row Template):**
Mark this row with `{#table:airReports:report}` at the start:
```
{#table:airReports:report}
```
| {ordinal} | {stock} | {pipeLength} | {procedureInfo} | {allowedLoss} | {pressureLoss} | {uncertainty} |

**End the table:**
```
{/table:airReports}
```

---

## Alternative: Module-Free Advanced Approach

If you don't want to purchase the module, you can achieve similar results by:

### 1. Prepare Two Separate Lists

```typescript
// Separate sections and reports
const airSections = sortedAirItems.filter(r => r.section_name && !r.draft_id);
const airReportsOnly = sortedAirItems.filter(r => !r.section_name || r.draft_id);

// Prepare data
const airData = {
    sections: airSections.map(s => ({ name: s.section_name })),
    reports: airReportsOnly.map((r, i) => ({
        ordinal: i + 1,
        stock: r.dionica || r.stock || '-',
        // ... other fields
    }))
};
```

### 2. Create Two Separate Tables in Word

**Table 1 (Sections Only):**
```
{#airData.sections}
| Section Name: {name} |
{/airData.sections}
```

**Table 2 (Reports Only):**
```
{#airData.reports}
| {ordinal} | {stock} | {pipeLength} | ... |
{/airData.reports}
```

This approach is free but requires redesigning your template.

---

## Recommendation

**For Your Use Case:**

Given that you need:
- Clean section headers spanning the full table width
- Mixed section/report rows in the same table
- Professional formatting

I recommend **purchasing the Table Module** if:
- You export reports frequently
- Professional presentation is critical
- Budget allows (~€50)

Otherwise, stick with the **current single-row approach** where sections appear in the first column only. It's functional and works well.

---

## Support & Documentation

**Official Docs:** https://docxtemplater.com/docs/table-module/
**Support:** support@docxtemplater.com
**Examples:** https://docxtemplater.com/demo/

---

## Cost-Benefit Analysis

| Aspect | Free Version | Table Module (~€50) |
|--------|-------------|---------------------|
| Cell Merging | Manual only | Dynamic |
| Row Types | One template row | Multiple row types |
| Complexity | Simple, limited | Advanced, flexible |
| Maintenance | Easy | Moderate |
| Best For | Standard reports | Complex, professional reports |

---

## Next Steps

1. Evaluate if the €50 investment is worth it for your project
2. If yes, purchase from https://docxtemplater.com/modules/table/
3. Follow installation steps above
4. Update template and data structures
5. Test thoroughly with your existing reports

---

**Created:** 2025-11-25
**Status:** Implementation Guide
**Priority:** Optional Enhancement
