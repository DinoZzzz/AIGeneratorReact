# Template Variables Update Guide

This document lists the variables that need to be replaced in the Word template (`method1610.docx`) to work with the new React application. The new system uses **Mustache syntax** (e.g., `{{variable}}`) instead of the legacy percentage syntax (e.g., `%Variable%`).

## 1. General Variables

Replace the following text placeholders in your Word document:

| Legacy Placeholder (Old) | New Variable (New) | Description |
| :--- | :--- | :--- |
| `%Creator%` | `{{creator}}` | Name of the person creating the report. |
| `%Certifier%` | `{{certifier}}` | Name of the certifier. |
| `%ConstructionSitePart%` | `{{constructionSitePart}}` | Specific part of the construction site. |
| `%CurrentDate%` | `{{currentDate}}` | Date of document generation (dd.MM.yyyy.). |
| `%WorkOrder%` | `{{workOrder}}` | Work order number. |
| `%ExaminationDate%` | `{{examinationDate}}` | Date range of examination. |
| `%Temperature%` | `{{temperature}}` | Temperature range during examination. |
| `%CustomerDetailed%` | `{{customerDetailed}}` | Customer name and address. |
| `%CustomerName%` | `{{customerName}}` | Customer name only. |
| `%ConstructionLocations%` | `{{constructionLocations}}` | Construction location. |
| `%ConstructionSite%` | `{{constructionSite}}` | Construction site name. |
| `%RevisionPaneCount%` | `{{revisionPaneCount}}` | Count of revision panes. |
| `%TubeLengthSum%` | `{{tubeLengthSum}}` | Total length of tubes. |
| `%Drainage%` | `{{drainage}}` | Drainage type/info. |
| `%AirMethodRemark%` | `{{airMethodRemark}}` | Remark for Air method. |
| `%AirNormDeviation%` | `{{airNormDeviation}}` | Norm deviation for Air method. |
| `%WaterMethodRemark%` | `{{waterMethodRemark}}` | Remark for Water method. |
| `%WaterNormDeviation%` | `{{waterNormDeviation}}` | Norm deviation for Water method. |
| `%Satisfies%` | `{{satisfies}}` | "ZADOVOLJAVA" or "NE ZADOVOLJAVA". |
| `%UnsatisfiedStocks%` | `{{unsatisfiedStocks}}` | Text describing which stocks failed. |
| `%PaneMaterials%` | `{{paneMaterials}}` | List of pane materials. |
| `%PaneDiameters%` | `{{paneDiameters}}` | List of pane diameters. |
| `%TubeMaterials%` | `{{tubeMaterials}}` | List of tube materials. |
| `%TubeDiameters%` | `{{tubeDiameters}}` | List of tube diameters. |

## 2. New Logic Variables (Missing in Legacy Mapping)

These variables implement logic that was previously hardcoded or dynamic in C#:

| Legacy Logic/Variable | New Variable | Description |
| :--- | :--- | :--- |
| `%WaterMethodCriteria%` | `{{waterMethodCriteria}}` | Dynamic criteria text (e.g., "reviziono okno = 0,40 l/m²"). |
| `%AirMethodSatisfies%` | `{{airMethodSatisfies}}` | "zadovoljava" or "ne zadovoljava" specifically for Air method. |
| `%AirMethodTableName%` | `{{airMethodTableName}}` | Displays "Tablica br.1" if Air tests exist. |
| `%WaterMethodTableName%` | `{{waterMethodTableName}}` | Displays "Tablica br.1" or "Tablica br.2" appropriately. |
| `%ContentTable%` | `{{contentTable}}` | List of attachments (e.g., "7.1. Image Description..."). |

## 3. Tables (Loops)

The legacy system might have used dynamic row insertion. The new system uses loops. You must wrap the table row you want to repeat with the start and end tags.

### Air Method Table
Wrap the data row in `{#airTests}` and `{/airTests}`.

| Legacy Column | New Variable |
| :--- | :--- |
| Ordinal | `{{ordinal}}` |
| Stock | `{{stock}}` |
| Pipe Length | `{{pipeLength}}` |
| Procedure Info | `{{procedureInfo}}` |
| Allowed Loss | `{{allowedLoss}}` |
| Pressure Loss | `{{pressureLoss}}` |
| Constant | `{{constVal}}` |

**Example Table Row:**
`{{ordinal}}` | `{{stock}}` | `{{pipeLength}}` | `{{procedureInfo}}` | `{{allowedLoss}}` | `{{pressureLoss}}` | `{{constVal}}`

**Conditional Visibility:**
To hide the entire Air Method section if no tests exist, wrap the whole section (header + table) in:
`{#hasAirTests}` ... content ... `{/hasAirTests}`

### Water Method Table
Wrap the data row in `{#waterTests}` and `{/waterTests}`.

| Legacy Column | New Variable |
| :--- | :--- |
| Ordinal | `{{ordinal}}` |
| Stock | `{{stock}}` |
| Allowed Loss | `{{allowedLoss}}` |
| Water Volume Loss | `{{waterVolumeLoss}}` |
| Result | `{{result}}` |

**Example Table Row:**
`{{ordinal}}` | `{{stock}}` | `{{allowedLoss}}` | `{{waterVolumeLoss}}` | `{{result}}`

**Conditional Visibility:**
To hide the Water Method section:
`{#hasWaterTests}` ... content ... `{/hasWaterTests}`

## 4. Attachments (Images)

Legacy `%Attachments%` is replaced by a loop that inserts images.

**Usage:**
Place the following block where you want the images to appear:

```
{#attachments}
{%image}
{{name}}
{/attachments}
```

- `{#attachments}`: Starts the loop for each image.
- `{%image}`: The special tag that the system replaces with the actual image.
- `{{name}}`: The file name or description (optional).
- `{/attachments}`: Ends the loop.

## 5. Summary of Conditional Blocks

Use these to show/hide sections based on data presence:

- `{#hasAirTests}` ... `{/hasAirTests}`
- `{#hasWaterTests}` ... `{/hasWaterTests}`
- `{#hasPaneInfo}` ... `{/hasPaneInfo}`
- `{#hasTubeInfo}` ... `{/hasTubeInfo}`
- `{#isUnsatisfied}` ... `{/isUnsatisfied}` (Show content only if FAILED)
