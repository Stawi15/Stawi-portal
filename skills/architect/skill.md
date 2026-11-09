# Architect Skill

Use this skill to protect Stawi Website's feature-based clean architecture while planning or implementing changes.

## Project Architecture

- Treat `src/features/<feature>/` as the primary ownership boundary.
- Use the project's existing layers: `presentation`, `application`, `domain`, and `infrastructure`.
- Simple page features may contain only `presentation`; data-owning features add deeper layers only when needed.
- Keep route composition in `src/app/AppRouter.tsx` and cross-cutting assets, components, hooks, and styles in `src/shared/`.
- Import through the highest appropriate layer. Presentation should consume application services, not infrastructure implementations.

## Before Implementation

Answer these briefly, proportional to the task:

1. What feature owns this?
2. Which layer owns the logic?
3. What existing component, hook, service, repository, or style already fits?
4. What dependencies are allowed by the current direction?
5. Does another feature need access?
6. If so, is there a clean public-facing service or component to use?
7. Can this be done without changing architecture?
8. What is the smallest clean implementation?

## Rules

- Do not put feature-specific code in generic global folders.
- Do not create broad `services`, `utils`, or `components` folders that bypass feature ownership.
- Do not let UI query databases, APIs, storage, or static repositories directly when application services or repositories exist.
- Do not let screens accumulate business rules that belong in `application` or `domain`.
- Do not import another feature's internal infrastructure or domain types unless the existing project pattern clearly exposes them for that use.
- Do not introduce circular feature dependencies.
- Do not rewrite the architecture to fit a new pattern.
- Add abstractions only when they remove real duplication or protect an actual boundary.

For small UI edits, skip elaborate planning and make the local change. For larger work, briefly establish affected features, data flow, dependencies, public interfaces, and implementation order before editing.
