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

## 2024-05-24 - Unrestricted File Upload Types in Firestore Rules
**Vulnerability:** The `firestore.rules` for Firebase Storage only validated file size (<10MB) but did not restrict `contentType`. This could allow attackers to upload malicious files (e.g., HTML with scripts, executables) masquerading as invoices or images. Client-side checks were present for images but missing for invoices, and could be bypassed regardless.

**Learning:** Client-side file validation is insufficient. Storage security rules must explicitly validate `request.resource.contentType` to prevent Stored XSS or malware hosting. Relying on "it's just an invoice" assumption is dangerous.

**Prevention:**
- Always add `request.resource.contentType.matches('image/.*')` or specific whitelist in Storage rules.
- Mirror these validations on the client-side for better UX.

## 2025-05-25 - Missing Subresource Integrity for CDN Scripts
**Vulnerability:** The application was loading `jspdf` and `jspdf-autotable` scripts from a public CDN without Subresource Integrity (SRI) checks. If the CDN were compromised, malicious code could be injected into the application context.

**Learning:** When relying on external CDNs for core libraries, especially in security-sensitive applications (handling inventory/invoices), trusting the delivery mechanism is a vulnerability.

**Prevention:**
- Always generate and include `integrity` hashes (SRI) for external scripts.
- Use `crossorigin="anonymous"` to ensure correct CORS handling for integrity checks.
- Periodically audit external dependencies.
