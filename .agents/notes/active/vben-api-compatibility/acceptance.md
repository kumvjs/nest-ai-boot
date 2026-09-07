# Planning Acceptance

- [x] Stable Vben baseline is identified by tag and immutable commit SHA.
- [x] `@vben/backend-mock` publication/installation suitability is evaluated.
- [x] Backend mock handlers and frontend-declared APIs are compared at the same commit.
- [x] Minimal runtime, system-management, preference, and playground APIs are separated.
- [x] Existing same-path backend endpoints are identified without claiming behavioral compatibility.
- [x] Persistence, business-rule, security, cache, migration, and contract-test work is represented in the backlog.
- [x] Swagger remains the API reference; no duplicate public endpoint document is introduced.
- [x] No endpoint/entity/service/migration implementation is performed in this phase.

Later implementation acceptance is defined per milestone in `plan.md` and must be refined before each milestone starts.

## Completed batch: M0.1

- [x] Upstream repository, tag, full SHA, source paths, expected counts, and snapshot path are machine-readable.
- [x] Collection uses a temporary shallow/filtered/sparse clone and verifies the checked-out SHA.
- [x] The snapshot deterministically records 31 frontend endpoints, 22 mock-covered endpoints, 9 frontend-only endpoints, and 2 mock-only diagnostics.
- [x] Hidden Nitro handler files such as `api/system/dept/.post.ts` are collected.
- [x] A clean network-backed collection reproduces the committed snapshot.
- [x] No application endpoint, authentication, authorization, entity, or migration code changed.

## Completed batch: M0.2

- [x] Candidate refs can be compared with the locked snapshot for route, method, request, response, mock-coverage, and source-only changes.
- [x] Same-ref comparison against `v5.7.0` reports no changes.
- [x] A scheduled/manual main warning reports drift without changing the stable lock or committed snapshot.
- [x] The upstream-upgrade PR template requires compatibility, migration, rollout, support-window, verification, and rollback decisions.
- [x] Frozen fixtures cover success/error envelopes, `{ items,total }` pagination, 401/403, refresh-cookie behavior, dynamic routes, and bigint serialization.
- [x] Contract parser/diff tests cover typed and multiline calls, hidden Nitro routes, and every required diff classification.
- [x] No application endpoint, authentication, authorization, entity, migration, or Swagger code changed.

## Completed batch: M1.1

- [x] `/auth/login` contract tests preserve `ResOp<{ accessToken }>` and the HttpOnly refresh cookie.
- [x] `/auth/refresh` contract tests preserve `ResOp<{ accessToken }>` while replacing the refresh cookie; missing cookies return HTTP 401.
- [x] `/auth/logout` contract tests prove delegation to the established access-token invalidation path without rewriting it.
- [x] `/user/info` maps bigint `id` to string `userId` through a dedicated Swagger DTO and does not expose entity/audit/password fields.
- [x] The frozen refresh fixture reflects the project OpenAPI client's `ResOp` unwrapping contract rather than the upstream mock's raw-token exception.
- [x] Focused Jest tests, test type-checking, lint, Nest build, and locked Vben fixture validation pass.

## Completed batch: M1.2

- [x] Refresh verifies the JWT, Redis state, database ownership, and expiration before rotation.
- [x] PostgreSQL atomic deletion is the single-use consumption point; a concurrent/replayed old token cannot issue a second token pair.
- [x] Successful rotation removes the old Redis refresh state, persists/caches a new Refresh Token, and issues a new Access Token.
- [x] Logout blacklists/removes the current Access Token, deletes the presented Refresh Token from PostgreSQL/Redis, and clears the browser cookie.
- [x] Malformed logout cookies are deleted by opaque value without trusting an invalid JWT payload.
- [x] The Vben integration guide includes the Swagger → OpenAPI-TS → `apiClient` generation, unwrapping, login, user-info, and refresh path.
- [x] Four focused Jest suites (11 tests), test type-checking, lint, Nest build, contract fixtures, and Markdown diff checks pass; the VitePress build is unverified because documentation dependencies are not installed locally.

## Completed batch: M1.3

- [x] `sys_user` persists nullable avatar URL, home path, and description through a reversible TypeORM migration.
- [x] `/user/info` returns explicit `userId`, `username`, `realName`, `avatar`, `homePath`, `desc`, and `roles` fields inside `ResOp`.
- [x] Existing NULL profile values normalize to empty strings without inventing a URL or route.
- [x] Access tokens, password fields, entity relations, and audit columns are excluded from the response DTO.
- [x] The compiled migration discovery path matches Nest's actual `dist/src/migrations` output.
- [x] Focused DTO/migration tests, test type-checking, lint, and Nest build pass; applying the migration to a live PostgreSQL database remains an environment deployment step.

## Completed batch: M1.4

- [x] `/auth/codes` returns effective menu/button permission codes rather than role codes, still wrapped by `ResOp<string[]>`.
- [x] Normal users receive codes only from enabled assigned roles and enabled menu/button records; comma-separated values are trimmed, empty values removed, duplicates removed, and results sorted deterministically.
- [x] A user with the enabled `super` role receives every enabled menu/button permission code without requiring explicit role-menu mappings.
- [x] Version-matching Redis permission-cache hits, including an empty `codes` array, do not query PostgreSQL; misses and legacy unversioned values load and repopulate the cache.
- [x] `RbacGuard` and `/auth/codes` use the same cache-backed effective-permission resolver.
- [x] A targeted permission-cache invalidation API exists for later menu/role/user transaction hooks, and its behavior is tested.
- [x] Swagger, current RBAC/Vben docs, focused tests, type-checking, lint, Nest build, contract parser tests, and locked Vben fixtures are updated and verified.

## Completed batch: M1.5

- [x] Local/development CORS defaults allow the locked Vben playground and Ant Design Vue app origins without using a credentialed wildcard; production requires an explicit HTTPS origin list.
- [x] Production requires an HTTPS public API URL and a Secure Refresh Token Cookie; `SameSite=None` is rejected unless Secure is enabled.
- [x] Refresh Cookie options are centralized, host-only by default, scoped to the API auth path, configurable for SameSite/Domain, and applied identically on login, refresh, and logout clearing.
- [x] Unsafe browser requests with an untrusted `Origin` receive HTTP 403 before authentication/business logic; trusted origins, preflight/safe methods, and non-browser requests without Origin remain supported.
- [x] The Fastify adapter no longer fabricates an Origin header when clients omit it.
- [x] Environment validation, controller Cookie contracts, trusted-origin behavior, docs, type-checking, lint, Nest build, contract parser tests, and locked Vben fixtures pass.
