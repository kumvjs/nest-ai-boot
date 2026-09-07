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

At v5.7.0 the frontend declares 31 local-server requests. The mock implements 21 of them, while 10 system CRUD requests are called by the frontend but missing from the mock. The mock also exposes two unused `/test` diagnostic routes. Between v5.7.0 and the observed main, no API route was added, removed, or renamed; main fixes missing imports in `setTimezone` and changes config/mock data.

## API inventory

Paths omit this project's default `/api` global prefix.

### Runtime and preferences (9)

| Method | Path | Contract summary | Current project |
| --- | --- | --- | --- |
| POST | `/auth/login` | `{ username, password } -> { accessToken }`; refresh cookie | Exists |
| POST | `/auth/refresh` | refresh cookie -> raw access-token response expected by Vben base client | Exists; response compatibility needs a test |
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
| Department | POST `/system/dept` | `pid,name,status,remark` | **Missing** | Missing |
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

- The global success envelope is broadly compatible with Vben's `code === 0` and `data` extraction, but refresh uses `baseRequestClient` without the normal data-unwrapping interceptor; the current wrapped refresh body may be interpreted as the token object.
- `/auth/codes` returns login-context role codes, while Vben expects action/button codes. The database source should be effective menu permissions.
- `/user/info` exposes an entity-shaped object with `id`; Vben types expect `userId` plus profile fields. Use a dedicated response DTO.
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
