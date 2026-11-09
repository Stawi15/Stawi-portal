# Review Skill

Use this skill as the final quality gate before reporting work complete.

## 1. Requirement Match

- Confirm the implemented change matches the user's actual request.
- Confirm no unrelated functionality, files, dependencies, or documentation were added.
- Confirm nothing requested is missing.

## 2. Design Match

- If a screenshot or visual reference exists, compare layout, section order, spacing, proportions, typography, element placement, color, and density.
- Flag or fix unnecessary creative changes.
- Confirm mobile, tablet, and desktop behavior remain usable.

## 3. Architecture

- Confirm code lives in the owning feature and correct layer.
- Confirm `presentation` does not reach into `infrastructure` when an `application` service exists.
- Confirm feature boundaries remain intact.
- Confirm shared code is genuinely reusable.
- Confirm no circular or unnecessary cross-feature imports were introduced.

## 4. Code Quality

- Check imports, strict types, naming, duplication, dead code, unnecessary complexity, and error/loading/empty states where relevant.
- Confirm CSS and assets follow existing project conventions.
- Prefer direct fixes over long reports when the issue is in scope.

## 5. Regression Risk

- Check routing, navigation, shared components, data calls, responsive layout, and neighboring screens touched by the change.
- Run the narrowest useful validation first; use `npm run build` when the change can affect TypeScript, routes, imports, or bundled output.

If issues are found, fix them directly when they are in scope. If everything is good, give a concise completion summary with validation performed.
