# Vben API and Version Analysis

## Upstream decision

Use the official Git repository's stable tag plus full commit SHA as the compatibility baseline:

- Repository: `https://github.com/vbenjs/vue-vben-admin.git`
- Stable baseline: `v5.7.0`
- Commit: `63a38dce49ba109f61607994e21ba921d8e970e9`
- Baseline commit time: `2026-05-21T09:07:59+08:00`
- Researched on: `2026-09-07`
- Main observed for early warning: `d4b2b02c54175746ab96eda7e0c83a9574b7fca6`

Do not use `@vben/backend-mock` as an npm dependency. It is a private workspace (`private: true`) and the npm registry returns 404. Do not use a moving `main` commit as the production baseline. At the observed `main`, the workspace says `5.8.0` while the monorepo root remains `5.7.0`, so it represents unreleased development state.

The recommended retrieval method is a shallow, filtered, sparse Git clone into a temporary/cache directory at an immutable ref. Do not vendor the full Vben repository or add it as a runtime submodule. Record tag and SHA together because a SHA is immutable and a tag is readable.

## Sources that must be compared at the same commit

`apps/backend-mock` alone is incomplete. Collect contracts from:

1. `apps/backend-mock/api/**` — routes implemented by the mock;
2. `playground/src/api/**` — every backend call declared by the full demo;
3. `playground/src/views/system/**` — submitted fields, validation, and interaction semantics;
4. `apps/web-*/src/api/core/**` — minimal runtime contracts for UI variants;
5. `packages/types` and `packages/@core/base/typings` — user and route response types.

At v5.7.0 the frontend declares 31 local-server requests. The mock implements 22 of them, while 9 system CRUD requests are called by the frontend but missing from the mock. The mock also exposes two unused `/test` diagnostic routes. The department-create mock is the hidden file `api/system/dept/.post.ts`; tooling that ignores dotfiles will miss it. Between v5.7.0 and the observed main, no API route was added, removed, or renamed; main fixes missing imports in `setTimezone` and changes config/mock data.

## API inventory

Paths omit this project's default `/api` global prefix.

### Runtime and preferences (9)

| Method | Path | Contract summary | Current project |
| --- | --- | --- | --- |
| POST | `/auth/login` | `{ username, password } -> { accessToken }`; refresh cookie | Exists |
| POST | `/auth/refresh` | refresh cookie -> project contract `ResOp<{ accessToken }>`; generated OpenAPI client unwraps `data` | Exists; preserve envelope and contract-test it |
| POST | `/auth/logout` | invalidate login state and cookie/session | Exists |
| GET | `/auth/codes` | button/action permission `string[]` | Exists; currently returns role codes |
| GET | `/user/info` | `userId`, `username`, `realName`, `avatar`, `roles`, `homePath` and compatible profile fields | Exists; needs a dedicated adapter DTO |
| GET | `/menu/all` | authorized `RouteRecordStringComponent[]` tree | Missing |
| GET | `/timezone/getTimezoneOptions` | `Array<{ label, value }>` | Missing |
| GET | `/timezone/getTimezone` | current user's IANA timezone or null | Missing |
| POST | `/timezone/setTimezone` | `{ timezone }` | Missing |

### System management (18)

| Domain | Method and path | Request/query summary | Upstream mock | Current project |
| --- | --- | --- | --- | --- |
| Department | GET `/system/dept/list` | tree of `id,pid,name,status,remark,createTime,children` | Yes | Missing |
| Department | POST `/system/dept` | `pid,name,status,remark` | Fake success only (`.post.ts`) | Missing |
| Department | PUT `/system/dept/:id` | `pid,name,status,remark` | Fake success only | Missing |
| Department | DELETE `/system/dept/:id` | id | Fake success only | Missing |
| Menu | GET `/system/menu/list` | complete menu/button tree | Yes | Missing |
| Menu | GET `/system/menu/name-exists` | query `name`, optional editing `id` | Yes | Missing |
| Menu | GET `/system/menu/path-exists` | query `path`, optional editing `id` | Yes | Missing |
| Menu | POST `/system/menu` | Vben menu form | **Missing** | Missing |
| Menu | PUT `/system/menu/:id` | Vben menu form | **Missing** | Missing |
| Menu | DELETE `/system/menu/:id` | id | **Missing** | Missing |
| Role | GET `/system/role/list` | `page,pageSize,name,id,status,remark,startTime,endTime` | Yes | Missing |
| Role | POST `/system/role` | `name,status,remark,permissions` | **Missing** | Missing |
| Role | PUT `/system/role/:id` | partial update, including status | **Missing** | Missing |
| Role | DELETE `/system/role/:id` | id | **Missing** | Missing |
| User | GET `/system/user/list` | role-list filters plus `deptId`; `{ items,total }` | Yes | Exists; fields/pagination differ |
| User | POST `/system/user` | demo sends `name,deptId,status,remark,permissions` | **Missing** | Missing |
| User | PUT `/system/user/:id` | partial update, including status | **Missing** | Missing |
| User | DELETE `/system/user/:id` | id | **Missing** | Missing |

The menu form can submit `type`, `name`, `pid`, `meta.title`, `path`, `activePath`, `meta.icon`, `meta.activeIcon`, `component`, `linkSrc`, `authCode`, `status`, badge fields, keep-alive/affix flags, and hide flags. Menu types are `catalog | menu | embedded | link | button`; this is not compatible with the existing three-value numeric enum without an explicit migration/mapping.

### Playground examples (4)

| Method | Path | Decision |
| --- | --- | --- |
| GET | `/table/list` | Optional full-playground parity; use fixture data, not a fake product table |
| POST | `/upload` | Implement only against real storage and validation; return `{ url }` |
| GET | `/demo/bigint` | Fixed contract fixture; no table |
| GET | `/status?status=...` | Development/test only; disable in production |

`GET /test` and `POST /test` are mock-only diagnostics and are not frontend contracts. The download example calls an external static URL and is not a local backend endpoint.

## Contract gaps in the existing backend

- Official Vben v5.7.0 uses a bare `baseRequestClient` for refresh and its mock returns a raw token. This project intentionally does not copy that exception: the backend keeps `ResOp<{ accessToken }>` and the project frontend's Hey API/OpenAPI wrapper plus `defaultResponseInterceptor` unwraps the `data` field. Contract tests must protect this project-specific adapter boundary.
- `/auth/codes` now returns cache-backed effective menu/button permission codes. Enabled ordinary roles contribute enabled assigned menu/button codes; enabled `super` receives all enabled codes. Role identities remain in `/user/info.roles`.
- `/user/info` previously exposed an entity-shaped object with `id`. M1.1 introduced a dedicated DTO, and M1.3 added persistent avatar, home-path, and description fields. The adapter now returns only `userId`, `username`, `realName`, `avatar`, `homePath`, `desc`, and `roles`; it deliberately does not echo an Access Token.
- `nestjs-paginate` returns a shape like `{ data, meta, links }`; Vben system tables expect unwrapped `{ items, total }` and use `page/pageSize`.
- Existing `sys_menu` lacks the complete five-type Vben model and extensible route metadata.
- Existing role/menu services and controllers are partial; all writes need transactional relationship replacement and cache invalidation.

## Real persistence and business rules

- Reuse `sys_user`, `sys_role`, `sys_menu`, `sys_user_role`, `sys_role_menu`, and `user_refresh_token`.
- Add a self-referencing `sys_dept` table and an indexed department foreign key on `sys_user`.
- Extend user/profile persistence for avatar, home path, description, timezone, and remark, choosing user columns versus a profile/preferences table before migration.
- Model stable menu fields (`name`, `path`, `authCode`, `component`, `type`, `status`, `parentId`) as columns. Prefer PostgreSQL JSONB for fast-moving Vben `meta`; promote only fields needing uniqueness, indexing, or domain queries.
- Treat role `permissions` as menu/button IDs stored through `sys_role_menu` and replace mappings transactionally.
- The official user demo also submits `permissions`, but this conflicts with the established user -> role -> menu model. Recommendation: keep role-based authorization and adapt the Vben user form to `roleIds`. If exact demo compatibility requires direct grants, first design `sys_user_menu` plus explicit union/override rules.
- Reject cyclic department/menu parents. Reject destructive deletes when children or active references exist. Protect the last super administrator and protected/default roles. Prefer soft deletion for users.
- Invalidate permission/menu/session caches only after successful commits and for all affected users.
- Do not create business tables for status, bigint, or generic table demos. File metadata needs a table only if product requirements include managed assets.

## Version-change management

- Store a machine-readable upstream lock with repository, stable tag, full SHA, collected paths, and collection time.
- Generate a contract snapshot from both frontend callers and mock handlers.
- On a new stable tag, classify diffs as additive, behavioral, breaking, removed, or mock-data-only.
- Use main only as a scheduled early-warning comparison, never to silently update production compatibility.
- Keep contract fixtures for the current and previous supported Vben stable baselines until all deployed frontends upgrade.
- Keep additive changes under `/api`; introduce `/api/v2` only for unavoidable breaking domain contracts, not for every Vben minor release.

## Implemented contract tooling

M0 now provides a deterministic schema-version-2 contract snapshot, frozen behavior fixtures, and four repository commands:

- `vben:contract:collect` regenerates the locked snapshot explicitly.
- `vben:contract:check` proves that the locked source still produces the committed snapshot and valid fixtures.
- `vben:contract:diff -- --ref <candidate>` classifies route, method, request, response, mock-coverage, and source-only changes without modifying the lock.
- `vben:contract:warn-main` compares the configured moving warning ref and exits with code 2 when drift is found.

The scheduled main warning is advisory: it can fail visibly, but it cannot update the production baseline. A stable-baseline change remains an explicit reviewed PR using the Vben upstream-upgrade template. At verification time, current `main` changed request signatures for `/auth/logout`, `/auth/refresh`, and `/upload`, response signatures for `/timezone/setTimezone` and `/upload`, plus upstream source data; this confirms why `main` must not be the compatibility lock.

## Response-envelope decision

`ResOp<T>` is the canonical backend JSON response format. Controllers return their business DTO and the global transform interceptor emits `{ code, data, message, success, traceId }`. The project Vben frontend generates types and calls from Swagger, then unwraps `data` centrally in its OpenAPI client. Consequently:

- no Vben endpoint should opt out of the transform merely to imitate `backend-mock`;
- `/auth/login` and `/auth/refresh` both expose `ResOp<LoginTokenResponseDto>` on the wire;
- contract tests assert both the business DTO and its `ResOp` envelope;
- any upstream raw-response special case is handled in the frontend adapter, not by fragmenting backend response conventions.

## Implemented refresh lifecycle

M1.2 keeps the existing JWT and Redis model but closes the refresh replay window. After signature/cache/database/expiry checks, one PostgreSQL `DELETE ... WHERE value = ?` is the single-use consumption point. Only a request whose delete affects exactly one row may create the replacement Refresh Token and Access Token. Logout now passes the HttpOnly cookie into the established login-state cleanup, revokes its PostgreSQL/Redis state, and clears it from the browser.

## Implemented effective permission resolution

M1.4 makes `/auth/codes` and `RbacGuard` use the same cache-backed resolver. A version-matching cached empty `codes` array is a real hit; missing, invalid, unknown-version, and legacy raw-array values trigger a PostgreSQL query and cache refill. This lazy cache-schema migration prevents forever-cached pre-M1.4 permissions from retaining the old filtering semantics. Permission rows are restricted to enabled roles and enabled menu/button records, then comma-separated values are trimmed, stripped of empty entries, deduplicated, and sorted. Enabled `super` role assignments load every enabled menu/button permission code. A targeted invalidation method is available for the transaction-after-commit hooks required by M2, M4, and M5.
