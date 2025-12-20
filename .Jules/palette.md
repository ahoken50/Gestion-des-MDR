## 2024-05-23 - Accessibility of Icon-only Buttons
**Learning:** Found several icon-only "trash" buttons used for destructive actions (deleting items from request forms) that lacked `aria-label`. This makes them inaccessible to screen reader users who would only hear "button" without context.
**Action:** Added `aria-label="Supprimer [Item Name]"` to these buttons. Also, since `TrashIcon` accepts props, passed `aria-hidden="true"` implicitly? No, I decided to just rely on the button having an `aria-label`. Actually, standard practice is to hide the icon if the button has a label. I will verify if I should explicitly hide the icon. Since I'm adding `aria-label` to the button, the button's accessible name becomes that label, and the icon's content is ignored. But good practice is `aria-hidden="true"` on the SVG.

## 2025-05-23 - Accessibility of Action Buttons in History and Inventory
**Learning:** Identified multiple icon-only buttons in `RequestHistory` and `InventoryManager` (Delete, Cancel Request, Export Excel, View Invoice) that lacked accessible names.
**Action:** Added descriptive `aria-label` attributes to these buttons (e.g., `aria-label="Annuler la demande"`, `aria-label="Voir la facture"`). This ensures screen reader users can understand the purpose of these controls without relying on visual context or tooltips.
