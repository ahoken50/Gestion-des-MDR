# Sentinel Journal - Security Learnings

## 2025-02-19 - Open Firestore Permissions
**Vulnerability:** The `firestore.rules` file contained overly permissive rules (`allow read, write: if true;`) for `inventory` and `counters` collections, and generic public access for storage.
**Learning:** This likely occurred during development to facilitate rapid testing but was not locked down before "production" readiness. In Firebase, "Test Mode" creates open rules which must be manually tightened.
**Prevention:** Always start with `allow read, write: if false;` and incrementally add permissions. Implement CI checks for sensitive rule patterns (like `if true`) before deployment.
