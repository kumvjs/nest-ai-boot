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
