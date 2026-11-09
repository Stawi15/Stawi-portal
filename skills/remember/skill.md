# Remember Skill

Use this skill to preserve durable Stawi Website conventions and explicit user decisions without creating documentation clutter.

## What To Remember

Preserve durable information such as:

- Feature ownership and layer conventions under `src/features/<feature>/`.
- Public data flow patterns, such as domain ports, infrastructure implementations, and application services.
- Route composition rules in `src/app/App.tsx`.
- Shared component, hook, asset, and style conventions under `src/shared/`.
- Naming, styling, responsive, and design-system patterns that recur across the site.
- Explicit user preferences or constraints that should affect future work.

## What Not To Remember

Do not preserve temporary information such as:

- One-time error messages.
- Temporary debug state.
- Experimental code.
- Test data or values likely to change.
- Implementation details that are obvious from nearby code.

## Memory Discipline

- Consult existing project memory or instruction files before adding new notes.
- Prefer updating an existing memory entry over creating a new file.
- Keep remembered facts short, specific, and actionable.
- Do not create memory for every minor task.
- When a new explicit user instruction conflicts with an old convention, follow the new instruction and update the remembered understanding.

The goal is consistent future behavior, not a parallel documentation system.
