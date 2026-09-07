# Vben Effective Permission Codes — Batch M1.4

Timestamp: `2026-09-07T20:04:35+08:00`

## Problem and context

Vben uses `/auth/codes` for action/button permission codes, but the endpoint returned role identities from the JWT context. The backend guard used menu permissions, yet its cache fallback converted a Redis miss to an empty array before applying `??`, so a missing cache could deny valid users without querying PostgreSQL.

## Decision

- Keep role identity in `/user/info.roles`; return only effective menu/button permission codes from `/auth/codes`.
- Use one cache-backed resolver for both `/auth/codes` and `RbacGuard`.
- Treat a version-matching cached empty `codes` array as an authoritative hit and only query PostgreSQL when the cache is absent, legacy, or invalid.
- Version the permission-cache value so legacy forever-cached arrays are rebuilt lazily under the new authorization semantics.
- Restrict ordinary users to enabled assigned roles and enabled menu/button records.
- Let an enabled `super` role receive all enabled menu/button permission codes, matching the guard bypass rule.
- Provide targeted user-cache invalidation now; attach it to authorization writes only after their database transactions commit in later milestones.

## Alternatives

- Returning role codes was rejected because Vben's access-code store compares action permission codes.
- Bypassing the cache for `/auth/codes` was rejected because the UI and guard could observe different authorization state and every request would query PostgreSQL.
- Granting `super` only explicitly mapped menu rows was rejected because the existing backend already treats `super` as globally authorized.
- Adding menu/role CRUD invalidation hooks in this batch was rejected because those write workflows belong to M2 and M4 and do not yet exist.

## Constraints

- Preserve the global `ResOp<T>` response envelope and expose `ResOp<string[]>` in Swagger.
- Reuse the existing user-role-menu schema without introducing an M2 menu migration early.
- Cache invalidation must be targeted and must occur after a successful authorization-changing transaction.

## Implementation

- `/auth/codes` delegates to `AuthService.getEffectivePermissionsByUserId()` and declares its Swagger array response.
- `AuthService` distinguishes a cache miss from a cached empty permission list, refills on miss, and exposes `invalidatePermissionsCache(userId)`.
- Permission cache values contain `schemaVersion` and `codes`; legacy raw arrays and unknown versions automatically reload from PostgreSQL.
- `RbacGuard` calls the same effective-permission resolver.
- `MenuService` filters enabled roles and enabled `MENU`/`BUTTON` records, normalizes comma-separated codes, removes duplicates, and sorts the result.
- Enabled `super` role assignments load all enabled menu/button codes without role-menu mappings.
- Login/user role codes now exclude disabled roles, and the guard's super bypass checks those effective role codes instead of the legacy `sys_user.role` value.

## Verification

- Focused Jest: 5 suites and 17 tests passed.
- Full core Jest: 8 suites and 25 tests passed.
- Test TypeScript compilation passed.
- Focused ESLint passed.
- Nest application build passed.
- Vben contract parser tests: 3 passed.
- Locked v5.7.0 contract snapshot and fixtures passed against `/private/tmp/vue-vben-admin-v5.7.0` at the locked commit.
- `git diff --check` passed.

The default network-backed contract check could not clone because the configured local proxy at `127.0.0.1:7890` was unavailable. This did not affect the source comparison because the existing checkout was verified by the contract tool against the locked full SHA before regenerating the snapshot in memory.

## Documentation impact

Swagger now types the permission-code response. Existing Vben integration, RBAC, data, cache, and HTTP API documentation now describe the effective-code and cache rules. No new parallel endpoint reference was introduced.

## Consequences and follow-ups

M2, M4, and M5 authorization-changing services must determine every affected user and call the targeted invalidation method after transaction commit. M1 next addresses environment-specific CORS, credentialed Cookie, and CSRF behavior.
