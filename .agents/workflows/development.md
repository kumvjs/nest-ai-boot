# Development Workflow

<!-- kuvibe: template=development-workflow revision=1 ownership=kuvibe -->

1. Confirm requirement and acceptance artifacts are current and blocking decisions are resolved.
2. Inspect existing conventions and write the smallest coherent implementation plan.
3. Implement migrations and domain rules before thin controller mappings when persistence is involved.
4. Preserve compatibility unless an approved plan says otherwise; isolate external-client adapters from domain entities.
5. Add behavior-focused unit, integration, contract, and e2e tests in proportion to risk.
6. Run focused verification, then broader static/build checks. Update Swagger and affected current documentation.
7. Review the diff and consolidate completed active artifacts into one implemented note.
