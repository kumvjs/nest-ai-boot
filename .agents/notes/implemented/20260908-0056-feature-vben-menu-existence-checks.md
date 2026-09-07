# Vben menu existence checks

## Scope

- Completed M2.5 only: menu name/path existence checks with edit-ID exclusion.
- Removed the redundant direct `MenuModule` import from `AppModule`; `AuthModule` already imports the module for permission resolution, so both menu controllers remain registered.
- Did not implement menu create, update, delete, write validation, transactions, or cache invalidation.

## Behavior

- `GET /system/menu/name-exists` accepts required `name` and optional positive bigint-string `id`.
- `GET /system/menu/path-exists` accepts required `path` and optional positive bigint-string `id`.
- Both routes require `system:menu:list` and Swagger describes the standard `ResOp<boolean>` response.
- Supplying `id` excludes only that menu, supporting unchanged values during edit.
- Lookups are exact and case-sensitive. Normal TypeORM repository scope excludes soft-deleted rows, and menu name/path/auth-code uniqueness uses `deleted_at IS NULL` partial indexes so those values can be reused consistently.

## Verification

- Menu-focused Jest suites: 5 suites, 26 tests passed.
- Full Core Jest suite, TypeScript, ESLint, Nest build, locked contract parser/snapshot/fixtures, and diff checks passed.
