Title: Core: add tsconfig.eslint.json and wire ESLint to it

Context
- Relates to #148. Lint fails in `packages/core` partly because ESLint uses `parserOptions.project`, but tests/scripts aren’t included in the referenced TS project.

Goal
- Add a dedicated `tsconfig.eslint.json` that includes source, tests, and scripts; update ESLint config to point to it so parsing is consistent.

Proposed Changes
1) Create `packages/core/tsconfig.eslint.json`:
   - Extends base tsconfig.
   - `include`: `src/**/*`, `src/**/__tests__/**/*`, `src/scripts/**/*`.
   - No emit.
2) Update `packages/core/eslint.config.js` to set `parserOptions.project` to `./tsconfig.eslint.json` (or add an override for test files if using flat config).
3) Run `npm run lint --workspace=packages/core` and address any lingering parser errors (rule violations handled in #148).

Acceptance Criteria
- `npm run lint --workspace=packages/core` runs without parser errors.
- No changes to build output; config files only.

Validation
```bash
npm run lint --workspace=packages/core
```

Labels
- testing, typescript, automation, game-logic

