# Sentinel Journal

This journal records CRITICAL security learnings, vulnerabilities, and patterns found in the codebase.
Only add entries for unique, project-specific security insights.

## 2024-03-20 - Firestore Public Access
**Vulnerability:** Firestore rules allowed public read/write access (`if true`) to `counters` and `inventory` collections.
**Learning:** Without authentication, security relies on strict schema validation and operation restrictions in security rules.
**Prevention:** Always define specific validation rules for public collections instead of using `if true`, even for internal apps.
