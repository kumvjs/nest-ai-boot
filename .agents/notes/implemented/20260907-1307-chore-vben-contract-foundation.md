# Vben Contract Foundation — Batch M0.1

Timestamp: `2026-09-07T13:07:39+08:00`

## Problem and context

The Vben implementation backlog depended on a manually researched API list. Future upstream updates needed an immutable source lock and a reproducible way to prove which calls exist in frontend clients versus the mock server before any database/API implementation begins.

## Decision

- Lock the official repository at readable tag `v5.7.0` and immutable commit `63a38dce49ba109f61607994e21ba921d8e970e9`.
- Collect backend handlers, every official UI core API variant, playground APIs/system views, and shared types with a temporary shallow/filtered/sparse clone.
- Generate a deterministic JSON snapshot and fail collection when expected coverage counts drift.
- Keep candidate-version semantic diffing and CI/main warning work for the next batch.

## Alternatives

- Installing `@vben/backend-mock` was rejected because it is an unpublished private workspace.
- Vendoring or submoduling the full Vben repository was rejected because application builds do not need the upstream implementation.
- Scanning only `apps/backend-mock` was rejected because the frontend declares routes the mock does not implement.

## Constraints

- This batch must not change existing authentication, JWT, RBAC, controllers, entities, migrations, or Swagger endpoints.
- Generated output must be stable for the same locked commit.
- Temporary checkout cleanup must target only the directory created by the collector.

## Implementation

- Added `contracts/vben/upstream.lock.json`.
- Added `scripts/vben-contract.mjs` with `generate`, `generate --write`, `check`, and optional `--source` support.
- Added root `vben:contract:collect` and `vben:contract:check` scripts.
- Generated `contracts/vben/v5.7.0/api-contract.json`, including callers, mock handlers, coverage state, source hashes, and mock-only routes.
- Corrected the earlier manual inventory after the collector found hidden handler `apps/backend-mock/api/system/dept/.post.ts`. The verified totals are 31 frontend endpoints, 22 mock-covered endpoints, 9 frontend-only endpoints, and 2 mock-only diagnostics.

## Verification

- `node --check scripts/vben-contract.mjs`
- `node scripts/vben-contract.mjs generate --source /private/tmp/vue-vben-admin-v5.7.0 --write`
- `node scripts/vben-contract.mjs check --source /private/tmp/vue-vben-admin-v5.7.0`
- `node scripts/vben-contract.mjs check` using a fresh network-backed temporary clone
- `git diff --check`

All completed successfully. The fresh-clone check reproduced the committed snapshot and removed its temporary checkout afterward.

## Documentation impact

Swagger/API documentation: N/A. No runtime API changed. KuVibe requirement, analysis, acceptance, and plan artifacts were updated with the verified counts and batch state.

## Consequences and follow-ups

The repository now has a reproducible stable contract baseline. M0 remains active: the next batch should implement candidate-version field-level diffing, optional main warning, upgrade PR metadata, and frozen compatibility fixtures.
