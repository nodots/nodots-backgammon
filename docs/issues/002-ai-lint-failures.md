Title: packages/ai lint failures – test env + unsafe Function types

Summary
- ESLint fails in `packages/ai` with 4 errors and 9 warnings. Key issues: `no-undef` for `setTimeout` in tests and use of the broad `Function` type in test helpers. Some unused variables warnings.

Reproduction
- Command: `npm run lint --workspace=packages/ai`

Representative Errors
- `no-undef`: `setTimeout` is not defined in test files.
- `@typescript-eslint/no-unsafe-function-type`: use of `Function` type.

Root Cause (likely)
- ESLint env for tests doesn’t enable globals (`jest`, `node`/`browser`).
- Tests typed `Function` instead of specific signatures.

Proposed Fix
1) Update ESLint config in `packages/ai` to set test overrides:
   - `files: ['**/*.test.ts']`, `env: { jest: true, node: true }` (or `browser: true` if jsdom).
2) Replace `Function` with explicit types or `(...args: unknown[]) => void` as appropriate.
3) Remove or prefix unused variables with `_` in tests or disable rule per-line where intentional.

Scope
- `packages/ai` test files and ESLint config only.

Definition of Done
- `npm run lint --workspace=packages/ai` returns 0 with no errors.
- Keep warnings to zero or justify suppressions inline.

How to File (GitHub CLI)
```bash
gh issue create \
  --title "packages/ai lint failures – test env + unsafe Function types" \
  --body-file docs/issues/002-ai-lint-failures.md \
  --label tooling,lint,ai
```

