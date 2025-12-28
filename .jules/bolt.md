## 2025-05-20 - Smart Memoization for List Items
**Learning:** When rendering a list of items filtered from a parent state (e.g. `inventory.filter(...)`), `useMemo` on the filtered list will often return a new array reference even if the items inside are the same, because `filter` creates a new array. This breaks `React.memo` on child components. A custom 'smart memoization' that checks referential equality of array contents can preserve the array reference and enable effective memoization of child components.
**Action:** Use `useRef` to store the previous result and compare contents manually inside `useMemo` or use a custom `useDeepCompareMemo` hook (but optimized for reference checking).

## 2025-05-21 - Hoisting Redundant Filter Operations
**Learning:** Expensive operations like `new Date()` and `toLowerCase()` inside a `filter` loop are severe performance killers for large lists (O(N) operations per render). Hoisting them outside the loop reduces complexity to O(1) relative to list size for the preparation step.
**Action:** Always inspect `filter` callbacks for object instantiation or transformation logic that depends only on external state, and hoist it.
