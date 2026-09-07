# Project Context

<!-- kuvibe: template=project-context revision=1 ownership=project -->

## Product

Nest AI Boot is a NestJS backend foundation for administrative applications, Vben Admin integration, RBAC, PostgreSQL/Redis-backed authentication, WebSocket features, and AI capabilities.

## Users and domain

- Administrative web clients, with Vben Admin as the currently documented frontend target.
- Authenticated users, roles, menus/button permissions, refresh-token sessions, and system administrators.
- Planned Vben system-management domains include departments and complete user/role/menu management.

## Repository shape

- `packages/core`: NestJS application and database migrations.
- `packages/core/src/modules/auth`: login, refresh, logout, token lifecycle.
- `packages/core/src/modules/user`: current-user data and user-role relationships.
- `packages/core/src/modules/system`: system users, roles, menus, and logs.
- `docs`: VitePress project documentation and generated/published API guidance.
- `.agents`: KuVibe state, durable context, workflows, and engineering work artifacts.

## Established constraints

- Keep NestJS, TypeORM, PostgreSQL, Redis, Fastify, pnpm, and ESM; normal feature work must not reopen stack selection.
- Default HTTP prefix is `/api`.
- Public API responses are wrapped by the global response interceptor unless explicitly skipped.
- Swagger/OpenAPI is the canonical endpoint reference; planning artifacts must not become a duplicate public API manual.
- Existing authentication endpoints and data model must be extended compatibly rather than replaced without an approved migration.
