## 2025-12-25 - Navigation Accessibility
**Learning:** The navigation elements (Sidebar and Header) relied solely on visual cues (background color) to indicate the active page. This left screen reader users without context on their current location.
**Action:** Added `aria-current="page"` to the active navigation button in both `Sidebar.tsx` and `Header.tsx`. This programmatic indicator allows screen readers to announce "Current Page" alongside the link text.
