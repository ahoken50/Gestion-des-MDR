## 2025-12-25 - Navigation Accessibility
**Learning:** The navigation elements (Sidebar and Header) relied solely on visual cues (background color) to indicate the active page. This left screen reader users without context on their current location.
**Action:** Added `aria-current="page"` to the active navigation button in both `Sidebar.tsx` and `Header.tsx`. This programmatic indicator allows screen readers to announce "Current Page" alongside the link text.

## 2025-12-26 - Form Interaction & Structure
**Learning:** The "Single" vs "Multi" request toggle was implemented as two div-wrapped buttons without semantic relationship, making the form context ambiguous for screen readers. Additionally, submitting the single request form lacked visual feedback, creating uncertainty about whether the action was processing.
**Action:**
1. Converted the toggle into a proper ARIA `tablist` with `role="tab"` and `aria-selected` states.
2. Added a loading spinner state to the submit button, disabling it during processing to prevent double-submission and provide reassurance.
