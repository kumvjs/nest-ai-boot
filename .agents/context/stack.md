# Stack Profile

<!-- kuvibe: template=stack-profile revision=1 ownership=mixed -->

## Detected facts

| Area | Choice | Evidence | Confidence |
| --- | --- | --- | --- |
| Language/runtime | TypeScript ESM on Node.js | root and `packages/core/package.json` | High |
| Backend | NestJS 12 with Fastify 5 | `packages/core/package.json`, `src/main.ts` | High |
| Persistence | TypeORM with PostgreSQL; MySQL driver is also installed | database config and dependencies | High |
| Cache/session state | Redis/ioredis | shared cache modules and dependencies | High |
| Authentication | Passport JWT, database refresh tokens, Redis access-token state | auth module/services/entities | High |
| Authorization | User-role-menu RBAC | `sys_user_role`, `sys_role_menu`, `sys_menu` | High |
| API contract | Swagger/OpenAPI plus global `{ code, data, message, success, traceId }` envelope | common decorators/interceptors | High |
| Package manager | pnpm 11 workspace-style repository | lockfiles and package manager fields | High |
| Tests | Jest/Supertest | core manifest and test config | High |
| Docs | VitePress Markdown | `docs/package.json`, `.vitepress/config.mts` | High |

## Required engineering rules

- Use explicit DTOs at public API boundaries; do not expose TypeORM entities as a long-term external contract.
- Generate schema evolution through reversible TypeORM migrations; do not depend on synchronize in production.
- Keep authorization-changing writes transactional and invalidate affected Redis permission/session caches after commit.
- Preserve bigint identifiers as strings at JSON boundaries.
- Run focused tests before broader build/lint/e2e verification.
- Keep Swagger current whenever public request or response contracts change.

## Conditional capabilities

- Vben compatibility work must compare frontend API callers, system-page form schemas, shared Vben types, and backend mock routes at the same immutable upstream commit.
- File upload work requires an explicit storage-provider and security design.
- Breaking public contracts require a migration/compatibility plan and human approval.

## Explicit exclusions

- Do not treat upstream mock data as a production domain model.
- Do not add database tables for Vben demonstration-only status, bigint, or generic table fixtures.
- Do not replace the established stack during ordinary Vben compatibility work.
