# Layout & Navigation Optimization

## 1. Sidebar Navigation (Mobile)

### Current State
The sidebar is hidden on mobile and toggled via a hamburger menu. It slides in from the left.

### Optimization Plan
*   **Swipe Support:**
    *   Implement **Swipe-to-Open** (from left edge) and **Swipe-to-Close** gestures.
    *   Wrap the `Layout` container or a specific edge-detection area with a swipe handler (e.g., using `react-swipeable`).
*   **Backdrop:** Ensure the backdrop (`bg-background/80`) supports tap-to-close (already implemented) AND swipe-to-close.
*   **Animation:** Use a smooth transition (currently `transform transition-transform`) which is good. Ensure `duration-200` or `300` feels snappy.

### Technical Implementation Guide
```tsx
// Pseudocode for Sidebar Swipe
import { useSwipeable } from 'react-swipeable';

const handlers = useSwipeable({
  onSwipedLeft: () => setIsMobileMenuOpen(false),
  trackMouse: true
});

// Apply {..handlers} to the Sidebar div
```

## 2. Mobile Header

### Adjustments
*   **Sticky Header:** Ensure the mobile header (containing the Hamburger menu and Logo) is `sticky top-0 z-50` so navigation is always accessible.
*   **Title/Context:** Display the current page title (e.g., "Customers") in the header instead of just "AIGenerator" generic text when navigating deep into the app.
*   **Actions:** If the page has a primary action (e.g., "New Report"), consider placing a compact icon button in the top-right of the header.

## 3. Small Laptop (1280px-1366px) Adjustments

### Sidebar Sizing
*   On `lg` screens (1024px+), the sidebar is fixed.
*   **Issue:** `w-64` (256px) takes up significant space on a 1280px screen.
*   **Fix:** Consider reducing sidebar width to `w-56` or `w-20` (icon only) on `lg` screens if the main content area feels too narrow.
*   **Collapsible Sidebar:** Optionally implement a "Collapse" button for desktop/laptop users to toggle the sidebar to an icon-only mode.

## 4. Bottom Navigation (Alternative Consideration)
*   *Note:* While a sidebar is standard, a **Bottom Navigation Bar** is often superior for mobile apps.
*   **Decision:** For this iteration, stick to the **Swipeable Sidebar** to maintain consistency with the desktop app structure, but ensure the "Menu" button is easily reachable (thumb zone).
