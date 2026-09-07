# KuVibe Schema 1 to 2 Legacy Adoption

Timestamp: `2026-09-07T12:53:58+08:00`

## Problem and context

The repository contained `kuVibe.md` version 0.2.0/project schema 2 and an empty tracked `AGENTS.md`, but no `.agents/kuvibe.yaml` or KuVibe context/workflow state. The existing marker makes this a legacy adoption rather than a fresh-project bootstrap.

## Decision

- Adopt schema 2 and release 0.2.0.
- Convert the empty `AGENTS.md` into a bounded managed router.
- Add separate version state, project-owned project context, mixed stack context, and revision-1 workflow templates.
- Preserve all existing source and project documentation.
- Store the current Vben planning work under `.agents/notes/active/vben-api-compatibility/`.

## Alternatives

- Treating the repository as greenfield was rejected because the legacy `AGENTS.md` marker and established application/docs already existed.
- Duplicating all KuVibe protocol text into `AGENTS.md` was rejected in favor of a thin router.

## Implementation

Created `.agents/kuvibe.yaml`, project/stack context, requirement/development/review/documentation workflows, this migration note, and the active Vben requirement artifacts. Added only a KuVibe-managed block to `AGENTS.md`.

## Verification

- Required state, context, workflow, and active-artifact files exist.
- Every workflow has template revision/ownership metadata.
- `AGENTS.md` has one balanced managed block and points to existing files.
- Existing `docs/frontend/vben.md` is unchanged from Git.
- `git diff --check` passes.

## Documentation and consequences

No public product documentation was changed. Future non-trivial work now has a stable router, version check, project context, and workflow location. `.agents/project.md`, active/implemented notes, and real project documentation remain project-owned and must not be regenerated during refreshes.

## Follow-ups

- Keep active Vben artifacts current while milestones are refined and implemented.
- On completion, consolidate the active Vben artifacts into an implemented note according to the documentation workflow.
