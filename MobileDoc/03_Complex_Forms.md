# Complex Forms & Results Optimization

## 1. Air & Water Method Forms

### A. Layout Adjustments
*   **Grid Stacking:**
    *   The current 3-column layout (`grid-cols-1 lg:grid-cols-3`) naturally stacks on mobile.
    *   **Improvement:** Ensure spacing between stacked sections (`gap-6`) is sufficient.
*   **Stepper Component:**
    *   On mobile, the horizontal Stepper (Step 1 ---- Step 2) can get cramped.
    *   **Optimization:** Use a compact stepper (e.g., "Step 1 of 2: Parameters") or hide the text labels and show only numbered circles if space is tight.

### B. "Calculated Results" Panel (The Drawer Pattern)
Currently, the results panel is a sidebar. On mobile, it stacks at the bottom, forcing the user to scroll down to see if their input passes the test.

**New Strategy: Floating Action Button (FAB) + Drawer**

1.  **FAB:**
    *   Place a fixed position button at the bottom-right of the screen (e.g., `fixed bottom-6 right-6`).
    *   **Icon:** Use a calculator or chart icon.
    *   **Label:** "Results" (optional, icon-only is often enough if distinct).
    *   **Dynamic State:** Change color based on Pass/Fail status (Green/Red) so the user gets instant feedback without opening the panel.

2.  **Bottom Drawer (Sheet):**
    *   When the FAB is tapped, slide up a **Drawer** (Bottom Sheet) containing the full results table (Pressure Loss, Allowed Loss, Status).
    *   This allows users to tweak inputs (top of page) and quickly check results (tap button) without losing scroll position.

### C. Implementation Details
*   **Hide Original Panel:** `hidden lg:block` for the desktop sidebar results.
*   **Show Mobile Triggers:** `block lg:hidden` for the FAB.
*   **Component:** Create a `ResultsDrawer` component that reuses the `ResultRow` logic but wraps it in a mobile-friendly overlay.

## 2. Input Fields
*   **Number Inputs:** Ensure `type="number"` or `inputMode="decimal"` is set correctly to trigger the numeric keypad on phones.
*   **Date Pickers:** Use native browser date pickers (fully supported on modern iOS/Android) for best experience.

## 3. Navigation Buttons (Next/Back/Save)
*   **Placement:** The "Next/Back" buttons are currently at the bottom of the form sections.
*   **Sticky Footer:** Consider making the primary action bar (Back | Save) sticky at the bottom of the viewport (`sticky bottom-0`) with a solid background so it's always reachable.
