# Vben User Info Profile — Batch M1.3

Timestamp: `2026-09-07T17:52:44+08:00`

## Problem and context

M1.1 stopped exposing `SysUserEntity` and mapped bigint `id` to `userId`, but the Vben-facing DTO still lacked avatar, home-path, and description fields because the database had no authoritative source for them.

## Decision

- Persist avatar URL, login home path, and description as nullable `sys_user` columns.
- Map persistence names to Vben names only in the public DTO: `home_path -> homePath` and `description -> desc`.
- Normalize historical NULL values to empty strings at the API boundary.
- Do not include `token` in user information; authentication tokens remain in the dedicated login/refresh flow.

## Alternatives

- Hard-coded profile values were rejected because they are not real business data.
- A separate profile table was rejected for these three one-to-one scalar fields because it adds joins and lifecycle complexity without a current independent profile domain.
- Returning the user entity was rejected because it leaks persistence, audit, relation, and potentially sensitive fields.

## Constraints

- Keep bigint identifiers as strings.
- Preserve the global `ResOp<T>` response envelope.
- Use a reversible migration and keep later system-user writes responsible for validation and cache invalidation.

## Implementation

- Added nullable `avatar varchar(500)`, `home_path varchar(255)`, and `description varchar(500)` columns to `SysUserEntity`.
- Added migration `1788774074964-add-vben-user-profile` with matching `up` and `down` SQL.
- Extended `UserInfoResponseDto` and its explicit service mapping.
- Added persisted-value and NULL-compatibility contract tests plus migration-shape tests.
- Corrected TypeORM's compiled migration glob from `dist/migrations` to Nest's actual `dist/src/migrations` output.

## Verification

- Focused Jest: 2 suites and 4 tests passed.
- Test TypeScript compilation passed.
- Focused ESLint passed.
- Nest application build passed.
- The compiled migration exists under `dist/src/migrations` and the compiled data-source configuration targets that directory.
- `git diff --check` passed.

The migration was not applied to a live PostgreSQL database in this environment; deployment must run the normal migration command before serving the new entity mapping.

## Documentation impact

Swagger exposes the expanded `UserInfoResponseDto`. Existing Vben, HTTP API, and data/cache documentation now describe the persisted profile fields. No new parallel endpoint reference was added.

## Consequences and follow-ups

The M1 user-info item is complete. M5 should reuse these columns and add department, timezone, remark, write validation, and cache invalidation rather than creating duplicate profile storage.
