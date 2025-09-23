Title: AI: add ESLint test overrides and fix env globals

Context
- Relates to #149. AI package lint errors include `no-undef` for `setTimeout` in tests and `no-unsafe-function-type` for `Function`.

Goal
- Ensure test files have proper env (`jest`, `node` or `jsdom`) and remove use of the broad `Function` type in tests.

Proposed Changes
1) Update `packages/ai/eslint.config.js` (or .eslintrc) with test overrides:
   - `files: ['**/*.test.ts']`
   - `env: { jest: true, node: true }` (or `browser: true` if running under jsdom)
2) Replace `Function` types in tests with explicit signatures or `(...args: unknown[]) => void`.
3) Tidy unused variables in tests (prefix with `_` or remove).

Acceptance Criteria
- `npm run lint --workspace=packages/ai` returns zero errors.

Validation
```bash
npm run lint --workspace=packages/ai
```

Labels
- ai-integration, testing, automation

