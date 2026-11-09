# Imprint Skill

Use this skill for precise visual implementation in the Stawi Website.

## Visual Source Of Truth

- If the user provides a screenshot, mockup, Figma reference, image, or visual inspiration, inspect it before coding.
- Match the requested reference closely: composition, section order, alignment, spacing, typography hierarchy, color, borders, radius, shadows, button treatment, image ratios, card proportions, and density.
- Written user requirements override the reference when they conflict.
- If no reference is provided, follow the existing Stawi visual system in `src/shared/styles`, feature CSS files, shared components, and imported assets.

## Implementation Rules

- Reuse existing shared components such as `Navbar`, `Footer`, `Logo`, and `PhoneMockup` when they fit the target accurately.
- Keep page-specific UI inside the owning feature's `presentation` layer.
- Put feature-specific CSS beside the feature presentation file when that is the existing pattern.
- Use shared styles, colors, typography, spacing, icons, and assets when they already express the design.
- Use targeted hardcoded values only when needed for faithful visual matching and no suitable token or pattern exists.
- Preserve desktop fidelity while creating sensible tablet and mobile adaptations.

## Avoid

- Do not creatively embellish screenshots or redesign them by default.
- Do not automatically make the UI more modern, futuristic, premium, animated, colorful, spacious, or decorative.
- Do not add oversized headings, excessive gradients, random animations, glassmorphism, extra sections, extra cards, decorative icons, or illustrations unless requested or present in the reference.
- Do not move visual code outside the owning feature unless it is genuinely reusable across the project.

Validate visual work by checking imports, responsive behavior, route behavior, and the closest available build or lint command.
