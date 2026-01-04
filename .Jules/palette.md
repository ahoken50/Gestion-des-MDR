## 2025-12-25 - Navigation Accessibility
**Learning:** The navigation elements (Sidebar and Header) relied solely on visual cues (background color) to indicate the active page. This left screen reader users without context on their current location.
**Action:** Added `aria-current="page"` to the active navigation button in both `Sidebar.tsx` and `Header.tsx`. This programmatic indicator allows screen readers to announce "Current Page" alongside the link text.

## 2025-05-21 - Combobox Accessibility
**Learning:** The autocomplete component relied on visual overlays for suggestions but lacked semantic connection between the input and the listbox. Screen readers would not know that suggestions were available or how to navigate them.
**Action:** Implemented the ARIA Combobox pattern in `ContactAutocomplete.tsx`. Added `role="combobox"`, `aria-expanded`, and `aria-controls` to the input, and `role="listbox"` with `aria-selected` options to the suggestion list. Used `useId` to ensure unique, valid ID references.
