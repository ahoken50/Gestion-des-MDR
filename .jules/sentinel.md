# Sentinel Journal

## 2025-02-17 - Unrestricted Firestore Access
**Vulnerability:** Firestore rules configured with `allow read, write: if true;` for critical collections (`inventory`, `counters`).
**Learning:** Developers often default to "test mode" rules (public access) to avoid permission errors during development, but fail to add schema validation when authentication is not yet implemented.
**Prevention:** Even without authentication, use `request.resource.data` validation to enforce schema integrity (types, required fields) to prevent data corruption.
