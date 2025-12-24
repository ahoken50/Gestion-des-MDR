## 2025-02-23 - Dynamic List Accessibility
**Learning:** In dynamic lists of inputs (like an order form), visual proximity isn't enough for screen readers. Inputs like "Quantity" or "Replace" need explicit context (e.g., "Quantity for [Item Name]").
**Action:** Always use `aria-label` with template literals (e.g., `aria-label={\`Quantity for ${item.name}\`}`) for inputs in mapped lists where the label is implicit or shared.
