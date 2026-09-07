# Vben Browser Credentials Security — Batch M1.5

Timestamp: `2026-09-07T21:37:58+08:00`

## Problem and context

The backend enabled credentialed CORS with `origin: '*'`, which browsers reject, while Refresh Token Cookies were always Secure and SameSite=Strict. That prevented ordinary HTTP local development and did not define a deployable same-site/cross-site model. CORS by itself also does not stop a cross-site form from causing a state-changing request.

## Decision

- Use an exact environment-backed browser Origin allowlist; never combine credentialed CORS with a wildcard.
- Default local/development origins to the locked Vben playground on port 5555 and Ant Design Vue app on port 5999, including localhost and 127.0.0.1.
- Require explicit HTTPS API/frontend origins and Secure Cookies in production.
- Default Refresh Cookies to host-only, SameSite=Lax, and the API auth path. Make Domain and SameSite explicit deployment options.
- Permit SameSite=None only when Secure is enabled.
- Enforce exact trusted Origin checks for all unsafe browser HTTP methods before JWT and business guards. Preserve requests without Origin for CLI and service-to-service clients.
- Apply identical Cookie identity/security options when setting, rotating, and clearing the Refresh Token.

## Alternatives

- Wildcard credentialed CORS was rejected because browsers do not allow it.
- Always-Secure Cookies were rejected for local HTTP because browsers will not send them.
- Always-Strict SameSite was rejected because it silently breaks approved cross-site deployments.
- CORS-only protection was rejected because it controls response visibility but does not reliably prevent cross-site state changes.
- A JavaScript-readable CSRF token was not introduced because exact Origin validation protects the existing HttpOnly Cookie flow without expanding the Vben API contract. If future clients cannot provide reliable Origin headers, a reviewed double-submit/token protocol can be added separately.
- A broad parent-domain Cookie was rejected as the default because a host-only Cookie reduces exposure to sibling subdomains.

## Constraints

- Keep Access Tokens in the Authorization header and Refresh Tokens in HttpOnly Cookies.
- Preserve `ResOp<T>` and the existing login/refresh/logout paths.
- Support TLS termination at a trusted reverse proxy; the browser-facing production URL must still be HTTPS.
- Do not require browser-only headers from CLI or service-to-service clients.

## Implementation

- Added `BROWSER_SECURITY_CONFIG` with normalized exact origins and centralized Refresh Cookie attributes.
- Added startup validation for production HTTPS, explicit CORS origins, Secure Cookies, SameSite/Secure compatibility, and valid optional Cookie Domain.
- `main.ts` now passes the exact origin list to credentialed CORS.
- Added `TrustedOriginGuard` as the first global guard and error code `10010`/HTTP 403.
- Removed the Fastify hook that fabricated missing Origin headers.
- Auth login/refresh use one Cookie setter; logout clears with the same Path, Domain, SameSite, Secure, and HttpOnly settings.
- Added local environment examples and current deployment/Vben documentation.

## Verification

- Focused Jest: 3 suites and 13 tests passed.
- Full core Jest: 10 suites and 32 tests passed.
- Test TypeScript compilation passed.
- Focused ESLint passed.
- Nest application build passed.
- Vben contract parser tests: 3 passed.
- Locked v5.7.0 contract snapshot and fixtures passed against the verified local locked-commit checkout.
- `git diff --check` passed.

The VitePress documentation build remains unverified because its dependencies are not installed in this workspace. Markdown changes were checked structurally and with `git diff --check`.

## Documentation impact

The environment reference now defines each browser-security variable and same-site/cross-site deployment behavior. The existing Vben and auth/RBAC documents describe credentialed requests, HTTPS, Cookie scope, and HTTP 403 Origin rejection. No parallel endpoint reference was added.

## Consequences and follow-ups

Production deployments must set `APP_BASE_URL` and `APP_CORS_ORIGINS` to HTTPS URLs before the application will start. M1 next verifies disabled-user login rejection and defines the staged password-hash migration away from MD5.
