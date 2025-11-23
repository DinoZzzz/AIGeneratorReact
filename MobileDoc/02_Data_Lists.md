# Data Lists: Table to Card View Transformation

## Core Concept
Standard HTML `<table>` elements offer poor user experience on mobile devices due to horizontal scrolling. The solution is to hide the table on mobile and display a list of **Cards** instead.

## 1. Implementation Strategy

### CSS/Tailwind Approach
*   Use `hidden md:table` for the table element.
*   Use `block md:hidden` for the mobile Card container.
*   This ensures the optimal view is loaded based on screen size.

## 2. Specific Page Strategies

### A. Customers List (`src/pages/Customers.tsx`)
*   **Card Content:**
    *   **Header:** Customer Name (Bold, Large).
    *   **Sub-header:** Work Order (Badge/Gray text).
    *   **Body:** Location, Address (Icon + Text).
    *   **Footer:** Action buttons (View Constructions, Edit, Delete).
*   **Actions:**
    *   Make the entire card clickable to go to "Constructions" (primary intent).
    *   Place "Edit/Delete" actions in a clear row at the bottom of the card or a kebab menu (three dots) in the top-right.

### B. Constructions List (`src/pages/Constructions.tsx`)
*   **Card Content:**
    *   **Header:** Construction Name.
    *   **Sub-header:** Work Order.
    *   **Body:** Location.
    *   **Footer:** Actions (Reports, Edit, Delete).
*   **Visual Cue:** Use an icon (e.g., `HardHat`) to distinguish from Customer cards.

### C. Reports List (`src/pages/Reports.tsx` & `ConstructionReports.tsx`)
*   **Card Content:**
    *   **Header:** Report Type (Air/Water) + Date.
    *   **Status Badge:** "Satisfies" (Green) / "Failed" (Red) - Prominently displayed.
    *   **Body:** Dionica, Draft Type.
    *   **Selection:**
        *   If "Select Mode" is active, tapping the card toggles the checkbox.
        *   Include a visible Checkbox in the top-left of the card.
    *   **Footer:** Export PDF, Edit, Delete.

### D. History List (`src/pages/History.tsx`)
*   **Card Content:**
    *   **Header:** Construction Part.
    *   **Body:** Certifier Name, Created By, Date.
    *   **Footer:** Open, Delete.

## 3. Pagination & Filters (Mobile)
*   **Pagination:**
    *   Keep "Previous" and "Next" buttons prominent.
    *   Simplify the "Showing 1-10 of 50" text to just "Page 1 of 5".
*   **Search/Filter:**
    *   The Search bar is already responsive.
    *   Sorting options (currently table headers) need a mobile equivalent.
    *   **Implementation:** Add a "Sort" button near the search bar that opens a Bottom Drawer with sort options (Name, Date, Status).

## 4. Code Structure Example
```tsx
{/* Desktop View */}
<table className="min-w-full hidden md:table">
  {/* ... table content ... */}
</table>

{/* Mobile View */}
<div className="space-y-4 md:hidden">
  {data.map(item => (
    <div key={item.id} className="bg-card p-4 rounded-lg shadow border border-border">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-bold">{item.name}</h3>
          <p className="text-sm text-muted-foreground">{item.work_order}</p>
        </div>
        <Badge status={item.status} />
      </div>
      <div className="mt-4 flex justify-end space-x-2">
         {/* Action Buttons */}
      </div>
    </div>
  ))}
</div>
```
