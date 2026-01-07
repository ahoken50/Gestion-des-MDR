## 2025-05-24 - Empty State UX
**Learning:** Users often hit "dead ends" in data tables when filtering heavily (e.g., search + date + status). A simple text message like "No results" feels like a system error or failure.
**Action:** Implemented a rich "Empty State" pattern in `RequestHistory.tsx` using a relevant icon (`MagnifyingGlassIcon`), clear explanation, and a "Reset Filters" action button. This turns a dead end into a helpful recovery path. This pattern should be replicated for other lists (e.g., Inventory) if they become filterable.
