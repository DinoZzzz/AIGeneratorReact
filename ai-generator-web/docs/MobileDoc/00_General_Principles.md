# General Mobile Optimization Principles

## 1. Core Philosophy
The application must be fully functional and user-friendly on all device sizes, from mobile phones (320px+) to tablets and small laptops (1280px+). The core visual metaphor for data presentation on mobile is the **Card View**.

## 2. Breakpoints & Responsive Strategy
Since the project uses Tailwind CSS v4, we rely on standard breakpoints but must pay special attention to the "Small Laptop" range.

| Breakpoint | Width | Device Target | Strategy |
|------------|-------|---------------|----------|
| `base` | < 640px | Phones | Stacked layout, Card Views, Full-screen Modals, Bottom Drawers. |
| `sm` | 640px | Large Phones / Small Tablets | Grid layouts start to emerge (2 columns). |
| `md` | 768px | Tablets (Portrait) | Sidebar might be hidden or icon-only. 2-3 column grids. |
| `lg` | 1024px | Tablets (Landscape) / Small Laptops | **Critical Target.** Sidebar is visible. Grids must fit without overflow. |
| `xl` | 1280px | Laptops / Desktops | Full dashboard experience. |

### Small Laptop Optimization (1280px - 1366px)
*   **Challenge:** Sidebar + padding often squeezes content on 13" screens.
*   **Solution:**
    *   Reduce container max-widths or padding at `lg` and `xl` if content feels cramped.
    *   Ensure data tables do not horizontally scroll unless absolutely necessary; use `table-layout: fixed` or responsive hiding of less important columns.

## 3. Interaction Design

### Touch Targets
*   All interactive elements (buttons, inputs, icons) must have a minimum touch target of **44x44px** on touch devices.
*   Increase padding on buttons and input fields for mobile views.

### Gestures
*   **Swipe Gestures:** Implement swipe-to-open and swipe-to-close for the Sidebar navigation on mobile.
*   **Library:** Use a library like `react-swipeable` or `use-gesture` to handle these interactions smoothly.

### Mobile-First Components
*   **Tables:** **DO NOT** use horizontal scrolling for primary data. Convert table rows into **Cards** (vertical stacking of data).
*   **Modals/Dialogs:** Must be **100% Full Screen** on mobile devices to maximize usable area.
*   **Results Panel:** On mobile, complex result panels (like in Forms) should not just stack at the bottom. Use a **Floating Action Button (FAB)** that triggers a **Bottom Drawer** (Sheet) containing the results.

## 4. Typography
*   Base font size should remain legible (16px standard).
*   Headings should scale down on mobile (`text-2xl` on desktop -> `text-xl` or `text-lg` on mobile) to prevent excessive wrapping.
*   Use `truncate` for long text strings (like filenames or addresses) to prevent layout breakage, combined with full text in Tooltips (desktop) or Expanded Cards (mobile).
