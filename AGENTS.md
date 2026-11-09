# AGENTS.md

## Purpose

Use this file as the routing guide for AI coding agents working in this repository. Read it before implementing, debugging, reviewing, or planning changes. Verify the current codebase before relying on a file, route, package, command, or feature.

Keep changes focused, preserve existing user work, and validate the smallest coherent change before widening the check.

## Project Snapshot

- **Application:** Stawi Portal
- **Stack:** Vite, React, TypeScript, and CSS
- **Current entry points:** `src/main.tsx`, `src/App.tsx`, and `src/styles.css`
- **Architecture direction:** feature-based clean architecture
- **Runtime:** client-rendered Vite application connected to the Stawi InsForge backend (PostgreSQL + auth + storage) through `@insforge/sdk`; the client is created in `src/insforge.ts` and all data access lives in `src/api.ts`. Configuration comes from `VITE_INSFORGE_URL` and `VITE_INSFORGE_ANON_KEY` in `.env.local`.
- **Package scripts:** `npm run dev`, `npm run build`, `npm run lint`, and `npm run preview`
- **Specifications:** there is no `specs/` directory or specification file in this repository. Treat the current implementation and explicit user requirements as authoritative.

## Read Before Implementation

1. Read this file and inspect `git status --short`.
2. Classify the task: feature work, shared infrastructure, UI/CSS, debugging, refactoring, or documentation/configuration.
3. Inspect the owning feature or nearest existing implementation before creating files or abstractions.
4. Read the relevant skill under `skills/` when the task matches one.
5. Verify package versions and existing usage before adding or changing a dependency.

Do not assume that the target feature folders, routes, services, tests, or integrations already exist. Search first.

## Architecture

Organize application code by feature under `src/features/<feature>/`. A feature may contain only the layers it needs:

```text
src/
  app/                         # Composition root and route wiring
  features/
    <feature>/
      presentation/            # Pages, components, and feature styles
      application/             # Use cases and orchestration
      domain/                  # Entities, value objects, and ports
      infrastructure/          # Concrete repositories and external adapters
  shared/
    assets/                    # Reusable images, icons, and other static assets
    components/                # Shared navigation, footer, layout, and UI components
    hooks/                     # Reusable, domain-independent React hooks
    styles/                    # Global tokens, resets, fonts, and shared styles
    data/                      # Reusable static content and cross-feature view data
```

`src/App.tsx` is the composition entry point and delegates non-home routes to `src/app/AppRouter.tsx`. Keep route selection in `src/app/`; keep page implementations in their owning feature folders.

### Dependency Rules

- Features own their domain behavior and presentation.
- Keep business rules in `domain` or `application`, not in page components.
- Keep concrete API, storage, static-data, and browser adapters in `infrastructure`.
- Presentation may consume application services. It must not reach directly into infrastructure when an application boundary exists.
- Keep route and dependency composition in `src/app/` or the existing composition root.
- Put genuinely reusable, domain-independent code in `src/shared/`.
- Put the navbar, footer, shared layout, shared UI components, and reusable icons in `src/shared/components/`.
- Keep these shared responsibilities in separate files: `Navbar.tsx`, `Footer.tsx`, `Layout.tsx`, `InnerHero.tsx`, `Wordmark.tsx`, and `Arrow.tsx`.
- Keep shared component styles separate as well: `Navbar.css`, `Footer.css`, `Layout.css`, `InnerHero.css`, and `Wordmark.css`; reserve `site-pages.css` for shared page-level content styles.
- Put reusable images and static assets in `src/shared/assets/`; keep feature-only assets inside the owning feature.
- Put reusable hooks in `src/shared/hooks/` and global/shared styles, tokens, and resets in `src/shared/styles/`.
- Put cross-feature static content or presentation data in `src/shared/data/`; feature-specific data belongs with its feature.
- Do not create broad global `services`, `utils`, or `components` folders that bypass feature ownership.
- Do not import another feature's private infrastructure or domain internals. Expose a deliberate public-facing service or component when cross-feature access is required.
- Avoid circular dependencies between features.
- Add an abstraction only when it removes meaningful duplication or protects a real boundary.

Before a substantial change, answer:

1. Which feature owns this behavior?
2. Which layer owns the logic?
3. What existing implementation can be reused or extended?
4. What dependencies are allowed across the boundary?
5. What is the smallest clean change?

## UI and CSS

- Keep feature-specific components and styles inside the owning feature.
- Keep global styles, fonts, resets, and tokens in `src/shared/styles/`; feature styles stay beside feature presentation code.
- Keep the application entry point thin: `src/App.tsx` delegates route composition to `src/app/AppRouter.tsx`, while reusable shell components belong in separate files under `src/shared/components/`.
- Prefer semantic HTML, one clear route-level `h1`, keyboard-accessible controls, visible focus states, and readable contrast.
- Use meaningful `alt` text for informative images and `alt=""` for decorative images.
- Preserve responsive behavior and avoid layout shifts by using stable dimensions or aspect ratios for media.
- Reuse an existing component or style pattern before creating a new shared abstraction.
- For top-left menu buttons, provide a generous hit area. If a nearby centered or absolutely positioned title could intercept taps, set its pointer events appropriately so the menu reliably opens.

## Data, APIs, and Security

- Verify the current runtime and data boundaries before adding integrations. Do not invent endpoints, environment variables, authentication, or server behavior.
- Never commit secrets, tokens, credentials, or `.env` values.
- Validate user input at the boundary and avoid logging sensitive or unnecessary personal data.
- Keep external integrations behind infrastructure and application boundaries rather than calling them directly from UI components.
- Do not claim a feature, integration, legal policy, or data-retention behavior is implemented unless the repository and requirements support it.

## Working With Files

- Search for an existing equivalent before creating a component, hook, helper, service, repository, type, or token.
- Use `apply_patch` for manual edits. Do not edit generated output such as `dist/`.
- Preserve unrelated user changes. Never reset, discard, or overwrite them.
- Keep public APIs and existing routes compatible unless the task explicitly changes them.
- Use ASCII by default and add comments only when they explain non-obvious logic.

## Validation

Use the narrowest relevant command first, then finish with an executable validation when available:

- `npm run lint` for ESLint and source-level issues
- `npm run build` for TypeScript compilation and the production bundle
- `npm run dev` for interactive local development
- `npm run preview` for serving an existing production build

There is currently no verified test script or test directory. Do not claim tests ran when only lint or build ran. For visual changes, also inspect the affected route at desktop and mobile sizes when browser tooling is available.

## Available Repository Skills

Load the relevant skill before work in its area:

- `skills/architect/skill.md` for architecture, feature ownership, layer selection, and larger changes
- `skills/imprint/skill.md` for screenshot/reference-driven visual work and substantial UI changes
- `skills/recover/skill.md` for build failures, runtime issues, regressions, and debugging
- `skills/remember/skill.md` for durable project decisions or conventions
- `skills/review/skill.md` for final quality review or code-review requests

Do not reference a skill, specification, route, or tool unless it exists in the repository or is explicitly provided by the user.

## Definition of Done

A change is complete when it:

- lives in the correct feature and architectural layer;
- preserves existing behavior outside the requested scope;
- does not introduce unnecessary dependencies or duplicate abstractions;
- meets accessibility and responsive expectations for UI work; and
- passes the narrowest relevant validation command, with any unavailable checks reported clearly.

Do not create commits or branches unless explicitly requested.
