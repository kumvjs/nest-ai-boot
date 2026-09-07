# Documentation Workflow

<!-- kuvibe: template=documentation-workflow revision=1 ownership=kuvibe -->

1. Determine impact on business rules, workflows, data model, API, UI integration, operations, and architecture.
2. Keep current product/architecture truth under `docs/`; keep public endpoint schemas in Swagger/OpenAPI.
3. Keep temporary analysis and plans under `.agents/notes/active/`.
4. On implementation completion, update current docs and consolidate meaningful history into `.agents/notes/implemented/YYYYMMDD-HHmm-TYPE-SLUG.md`.
5. Never rewrite historical notes during normal maintenance or protocol refresh.
