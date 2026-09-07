# Vben API Compatibility Requirement

## Outcome

Establish the authoritative Vben API scope and implement the versioned backlog in small, independently verified batches for a real NestJS/PostgreSQL/Redis backend.

## Actors and affected modules

- Vben Admin runtime and playground system-management frontend.
- Existing auth, user, role, menu, Redis cache, TypeORM migration, and Swagger modules.
- Planned department, user-preference/timezone, and optional upload capabilities.

## Constraints

- Existing login, refresh, logout, access-code, user-info, and system-user-list work must be reused and contract-tested, not blindly rewritten.
- Implement one coherent milestone slice per batch and update `plan.md` only for work that has actually passed verification.
- A route returning mock-shaped data is not complete: production work needs schema, constraints, transactions, authorization, cache invalidation, error behavior, migrations, and tests.
- Swagger/OpenAPI remains the endpoint reference; these artifacts hold research, decisions, and TODOs only.
- Upstream selection must support deterministic builds and future API-change detection.

## Non-goals for the current M0.1 batch

- No controller/service/entity/migration implementation.
- No Vben source vendoring or runtime dependency installation.
- No database table for demonstration-only endpoints.
- No redesign of existing authentication unless a compatibility defect is proven during later contract testing.

## Assumptions

- The target is Vben Admin 5.x and includes the official playground system-management pages, not only a minimal UI variant.
- The existing role-based RBAC remains the preferred authorization model.
- Exact production behavior for direct per-user permissions is a blocking design decision for the later user-management implementation, not for this planning phase.
