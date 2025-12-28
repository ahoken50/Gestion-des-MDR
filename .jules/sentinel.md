## 2024-05-23 - Insecure Firestore Rules Detected
**Vulnerability:** The `firestore.rules` file contained overly permissive rules:
- `counters` allowed arbitrary writes, enabling anyone to reset or corrupt the request numbering.
- `inventory` allowed document deletion, which could lead to data loss even though the application logic doesn't support it.
- `inventory` allowed setting negative quantities.

**Learning:** When using client-side SDKs without user authentication (`allow read, write: if true`), it is critical to rely on data validation rules to enforce business logic integrity (e.g., atomic increments, immutable fields).

**Prevention:**
- Explicitly define `create` and `update` rules separately.
- Validate data types and values (e.g., `value == resource.data.value + 1`).
- Disable `delete` operations unless strictly necessary and authenticated.
