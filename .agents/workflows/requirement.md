# Requirement Workflow

<!-- kuvibe: template=requirement-workflow revision=1 ownership=kuvibe -->

1. Read KuVibe state, project context, stack context, relevant current docs, source, and active artifacts.
2. Normalize outcome, actors, preconditions, main flow, edge/error behavior, exclusions, constraints, assumptions, and acceptance signals.
3. Classify completeness as complete, assumable, or incomplete. Ask only about decisions that materially change behavior, data, security, compatibility, or acceptance.
4. Record Level 2–3 requirements under `.agents/notes/active/<slug>/requirement.md` before implementation.
5. Keep public API details in Swagger/OpenAPI; requirement artifacts capture intent and decisions, not duplicated reference documentation.
