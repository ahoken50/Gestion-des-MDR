# Sentinel Journal - Security Learnings

## 2024-03-24 - Firestore Security Rules
**Vulnerability:** Firestore rules are configured with `allow read, write: if true` for most collections.
**Learning:** This is a common pattern for rapid prototyping or applications without authentication, but it exposes all data to anyone with the project ID.
**Prevention:** Implement strict security rules based on authentication (even anonymous) and data validation. For this specific app, since auth is missing, we must rely on other methods or accept the risk for now, but enabling `read: true` for everyone implies data is public.
