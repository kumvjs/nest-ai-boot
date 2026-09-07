# Vben Backend TODO

This is an implementation backlog, not authorization to implement all items in one change. Complete milestones in order and refine their acceptance criteria before coding.

## M0 — Upstream contract and version foundation

- [x] Add a machine-readable upstream lock containing repository, tag, full commit SHA, collected paths, and timestamp.
- [x] Add a read-only collector that shallow-clones and sparse-checks out the locked Vben commit into a temporary/cache directory.
- [x] Generate a snapshot for all 31 frontend-declared local API calls; track the two mock-only diagnostics separately.
- [x] Diff a candidate stable tag against the lock and report added, removed, renamed, method-changed, request-changed, response-changed, and mock-data-only changes.
- [x] Add an optional main-branch early-warning job that never updates the stable lock automatically.
- [x] Add upgrade-PR fields for compatibility class, schema/data migration, frontend rollout, rollback, and supported-baseline window.
- [x] Define frozen contract fixtures for success/error envelopes, `{ items,total }` pagination, 401/403, refresh cookies, dynamic routes, and bigint serialization.

Acceptance: the same commit always generates the same normalized contract; a route present only in frontend callers is reported rather than lost; upstream changes cannot silently alter production behavior.

## M1 — Stabilize existing authentication compatibility

- [x] Add Vben v5.7.0-derived contract tests for existing `/auth/login`, `/auth/refresh`, `/auth/logout`, and `/user/info`; assert the project's canonical `ResOp<T>` envelope and do not rewrite working login logic.
- [ ] Verify/fix refresh behavior through the generated OpenAPI client contract `ResOp<{ accessToken }>`, including token rotation, replay rejection, cookie replacement, and logout invalidation; never introduce a raw-response exception.
- [ ] Add a dedicated `/user/info` response DTO mapping `id -> userId` and compatible profile fields; stop exposing `SysUserEntity` as the public contract.
- [ ] Change `/auth/codes` from role codes to effective menu/button permission codes and align Redis permission-cache invalidation.
- [ ] Define environment-specific CORS origin, HTTPS, SameSite, Secure, Domain, and CSRF behavior for credentialed requests.
- [ ] Verify disabled users cannot log in and password hashing is scheduled for Argon2id/bcrypt migration rather than copied from the current MD5 approach.

Acceptance: the project's Vben v5.7.0 frontend using the generated OpenAPI client can log in, unwrap `ResOp`, load user data/codes, refresh once with rotation, reject refresh replay, and log out.

## M2 — Dynamic menu and permission backbone

- [ ] Define internal menu-domain DTOs and Vben request/response adapters for all five menu types and extensible metadata.
- [ ] Design a reversible `sys_menu` migration from the numeric three-type model to the chosen stable representation plus JSONB metadata.
- [ ] Implement `GET /menu/all` from enabled user roles and role-menu mappings, including required parent nodes and deterministic ordering.
- [ ] Implement `GET /system/menu/list` as a complete menu/button tree.
- [ ] Implement `GET /system/menu/name-exists` and `GET /system/menu/path-exists` with edit-ID exclusion.
- [ ] Implement `POST /system/menu`, `PUT /system/menu/:id`, and `DELETE /system/menu/:id`.
- [ ] Enforce name/path/authCode rules, safe component/link values, valid type-dependent fields, and no parent cycles.
- [ ] Reject deletion with children or role references unless an explicit reviewed replacement workflow exists.
- [ ] Invalidate affected users' menu/permission caches after committed menu or mapping changes.

Acceptance: menus are persistent, authorization-derived, safely editable, and returned in Vben route format; action codes and route visibility reflect the same effective permissions.

## M3 — Department persistence

- [ ] Design and migrate `sys_dept` with parent ID, name, status, remark, order, and audit fields.
- [ ] Add an indexed nullable department foreign key to `sys_user` with an explicit deletion policy.
- [ ] Implement `GET /system/dept/list` as a deterministic tree.
- [ ] Implement `POST /system/dept`, `PUT /system/dept/:id`, and `DELETE /system/dept/:id`.
- [ ] Reject cyclic parents and deletion when child departments or users exist.
- [ ] Decide and test how disabling a department affects descendants and users; recommendation: do not silently disable user accounts.

Acceptance: department writes persist, tree invariants hold under concurrent updates, and destructive operations cannot orphan users or descendants.

## M4 — Role management

- [ ] Implement Vben `{ items,total }` role pagination with `page,pageSize,name,id,status,remark,startTime,endTime`.
- [ ] Implement `POST /system/role`, `PUT /system/role/:id`, and `DELETE /system/role/:id`.
- [ ] Keep immutable unique role `code` separate from editable display `name`.
- [ ] Replace `sys_role_menu` permissions transactionally and validate every referenced menu/button ID.
- [ ] Protect super/default roles and reject deletion of roles still assigned to users.
- [ ] Invalidate effective permissions for every affected user after commit.

Acceptance: role CRUD and permission assignment are transactional, protected roles cannot be corrupted, and users observe new permissions without stale cache.

## M5 — User management

- [ ] Resolve the contract decision: recommended `roleIds` with existing RBAC; if exact upstream `permissions` is retained, approve direct-user-grant storage and union/override semantics first.
- [ ] Extend user/profile persistence for department, avatar, home path, description, timezone, and remark as approved.
- [ ] Adapt `GET /system/user/list` from `nestjs-paginate` output to `{ items,total }` and accept Vben `page/pageSize` filters including `deptId` and time range.
- [ ] Implement `POST /system/user`, `PUT /system/user/:id`, and `DELETE /system/user/:id` with DTOs separate from entities.
- [ ] Implement transactional role assignment and targeted permission/session-cache invalidation.
- [ ] Define soft delete, username reuse, status toggling, password create/reset, forced logout, and audit rules.
- [ ] Prevent disabling/deleting the current last super administrator.
- [ ] Migrate new/reset passwords to Argon2id or bcrypt; include a safe transition for existing hashes.

Acceptance: user CRUD preserves RBAC and session invariants, returns Vben-compatible fields, and cannot remove the system's final administrative access path.

## M6 — Timezone preferences

- [ ] Choose a user column or separate preferences table for timezone and other per-user preferences.
- [ ] Implement `GET /timezone/getTimezoneOptions`, `GET /timezone/getTimezone`, and `POST /timezone/setTimezone`.
- [ ] Validate IANA zone IDs; do not persist fixed GMT offsets as timezone identity.
- [ ] Decide whether the options endpoint remains public as in the mock or requires authentication; recommendation: options may be public, user value/update must be authenticated.

Acceptance: timezone is per-user and durable across processes/devices; invalid zones are rejected with the standard error contract.

## M7 — Optional full-playground parity

- [ ] Implement `POST /upload` only after selecting storage, object naming, content/size limits, URL policy, malware handling, ownership, cleanup, and optional metadata persistence.
- [ ] Implement `GET /table/list` only if the generic table demo remains; use deterministic fixture data rather than a fake domain table.
- [ ] Implement `GET /demo/bigint` as a fixed serialization fixture only if the demo remains.
- [ ] Implement `GET /status` only in development/test environments.
- [ ] Do not implement mock-only `GET /test` or `POST /test` in production.

Acceptance: retained examples serve an explicit frontend demo, introduce no fake production domain, and expose no diagnostic behavior in production.

## M8 — Verification and release gates

- [ ] Add DTO-validation, service-unit, PostgreSQL integration, Redis invalidation, HTTP contract, and Vben e2e tests per domain.
- [ ] Test unique/foreign-key constraints, cycle rejection, soft deletion, transaction rollback, concurrent state changes, and bigint string boundaries.
- [ ] Test permissions before and after menu/role/user changes to prove cache invalidation.
- [ ] Run Vben v5.7.0 login, refresh, dynamic menu, button permission, and system-management flows end to end.
- [ ] Update Swagger/OpenAPI with every implemented endpoint and contract; do not create a parallel API reference Markdown file.
- [ ] On each upstream-baseline upgrade, update the lock, snapshot, compatibility fixtures, active plan/current docs as applicable, and release notes.

Acceptance: focused and broad checks pass, Swagger matches runtime behavior, migrations and rollback are verified proportionally, and both supported Vben baselines pass their contract suites.
