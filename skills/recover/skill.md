# Recover Skill

Use this skill for broken builds, regressions, runtime errors, failed implementations, and debugging.

## Debugging Workflow

1. Identify what changed.
2. Identify what is failing.
3. Classify the failure: TypeScript, lint, runtime, routing, data flow, state, UI, styling, or architecture.
4. Reproduce or inspect the smallest relevant evidence: error output, stack trace, failing file, `git diff`, nearby implementation, or route behavior.
5. Find the root cause before editing.
6. Apply the smallest safe repair.
7. Validate with the narrowest useful command, then `npm run build` when the risk warrants it.
8. Confirm the repair preserves feature boundaries.

## Project-Specific Checks

- Confirm route imports in `src/app/AppRouter.tsx` still point to feature `presentation` files.
- Confirm presentation code imports application services instead of infrastructure repositories.
- Confirm static data implementations remain behind repository/service abstractions.
- Confirm global CSS is imported from `src/shared/styles/global.css` and shared page CSS is imported by `src/shared/components/Layout.tsx`.
- Confirm shared components remain reusable and are not carrying feature-specific business logic.

## Avoid

- Do not rewrite a feature just because one error appears.
- Do not change libraries to escape a local bug.
- Do not suppress TypeScript or lint errors without fixing the cause.
- Do not add broad `try/catch` blocks that hide failures.
- Do not remove functionality, tests, or routes simply to make errors disappear.
- Do not perform unrelated refactors during recovery.

If a previous generated change caused the issue, repair the underlying mistake instead of layering more workarounds on top.
