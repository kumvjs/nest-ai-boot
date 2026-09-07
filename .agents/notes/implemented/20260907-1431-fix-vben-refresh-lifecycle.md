# Vben Refresh Lifecycle and OpenAPI Quick Start — Batch M1.2

Timestamp: `2026-09-07T14:31:07+08:00`

## Problem and context

The existing refresh flow checked Redis and PostgreSQL before deleting the old token, which allowed two concurrent requests to pass both checks and each issue a replacement. Logout invalidated only the presented Access Token and neither revoked the HttpOnly Refresh Token nor cleared its browser cookie. The Vben guide also lacked a reproducible Swagger/OpenAPI-TS integration path.

## Decision

- Keep the canonical `ResOp<T>` response envelope and generated OpenAPI-client adapter from M1.1.
- Use the PostgreSQL delete result as the atomic, single-use refresh-token consumption decision.
- Revoke both Access and presented Refresh Token state on logout and clear the cookie.
- Document the shortest supported Vben integration using `@hey-api/openapi-ts`, the Axios plugin, Vben's request interceptor, and a typed `apiRequest` wrapper.

## Alternatives

- A read-then-delete replay check was rejected because it remains race-prone.
- A process-local mutex was rejected because it fails with multiple Nest processes/instances.
- Returning a raw refresh token was rejected because OpenAPI-TS already unwraps `ResOp.data` centrally.
- A new database migration was unnecessary: PostgreSQL atomic deletion provides the required one-winner decision using the existing token value.

## Constraints

- Do not replace JWT, Redis authentication state, RBAC, or the existing refresh-token table.
- Logout remains idempotent for absent or malformed Refresh Cookies.
- Never trust a malformed refresh JWT merely to locate its database row; delete it only by its opaque exact value.

## Implementation

- Refresh now checks signature, Redis state, database ownership, and expiry, then requires `delete(...).affected === 1` before issuing replacements.
- The old Redis refresh key is deleted before the new token pair is issued.
- Logout forwards its cookie to `AuthService`, attempts both token revocations, and clears `refresh_token` in a `finally` block.
- Token persistence now consistently uses the injected repository rather than TypeORM's static active-record API.
- Added refresh rotation/replay, expiry, valid/malformed revoke, and full logout-lifecycle tests.
- Added an OpenAPI-TS quick-start section with generation config, `apiClient`, and generated-call examples.

## Verification

- Focused Jest: 4 suites and 11 tests passed.
- Test TypeScript compilation passed.
- Focused ESLint passed.
- Nest application build passed.
- Locked Vben snapshot/fixtures and M0 collector tests passed.
- Documentation content and diff checks passed. The VitePress build could not run because its executable/dependencies are not installed in the current workspace.
- `git diff --check` passed.

Verification used installed repository binaries because the package-manager shim could not verify/fetch its requested pnpm release.

## Documentation impact

Updated the existing Vben integration, HTTP API, and auth/RBAC pages. Swagger response conventions remain unchanged; `/user/info` continues to use the DTO introduced in M1.1. No duplicate endpoint reference was created.

## Consequences and follow-ups

The refresh lifecycle plan item is complete. M1 still needs persistent profile fields for full user-info compatibility, effective menu/button codes, environment-specific credentialed CORS/Cookie/CSRF policy, disabled-user enforcement, and password-hash migration planning.
