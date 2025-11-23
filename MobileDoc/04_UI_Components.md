# UI Components & Dashboard Optimization

## 1. Full-Screen Modals (Dialogs)
*   **Current State:** Dialogs are centered with a `max-w-lg` constraint.
*   **Mobile Issue:** Centered modals on small screens often have cut-off content or require awkward internal scrolling.
*   **Optimization:**
    *   On screens smaller than `sm` (640px), force the Dialog to be `fixed inset-0 w-full h-full rounded-none`.
    *   **Close Button:** Ensure a prominent "Close" (X) button is in the top-right or a "Done" button in the header.

## 2. Dashboard Widgets
*   **Summary Cards:**
    *   Current: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`.
    *   Optimization: This is already responsive (`grid-cols-1` on mobile). Ensure the content inside flexes correctly.
*   **Charts (Pie/Line):**
    *   **Recharts:** Charts need a fixed height container.
    *   **Mobile:** Set the chart container height to `300px` on mobile (vs `400px`+ on desktop) to allow other content to be seen.
    *   **Legend:** Move chart legends to the **bottom** on mobile (instead of right side) to maximize horizontal space for the chart data.
*   **Top Examiners List:**
    *   Convert to a horizontal scroll container or a compact vertical list (max 5 items) on mobile to save vertical space.

## 3. Toast Notifications
*   **Positioning:**
    *   Desktop: Bottom-right.
    *   Mobile: **Top-center** or **Bottom-center** (full width).
*   **Style:**
    *   On mobile, the toast should span the full width (`w-[calc(100%-2rem)]`) with margin, floating slightly off the edge.
    *   Enable **Swipe-to-Dismiss** for toasts on touch devices.

## 4. Search & Filtering Components
*   **Search Bars:**
    *   Should expand to full width on focus on mobile.
*   **Filters:**
    *   Hide complex filters behind a "Filter" button that opens a **Bottom Drawer** (Sheet) instead of cluttering the top list view.

## 5. File Uploads (Drag & Drop)
*   **Mobile Limitation:** Drag and drop is hard on mobile.
*   **Optimization:** Ensure the "Click to Upload" area is large and prominent. The standard file picker is the primary interface on mobile.
