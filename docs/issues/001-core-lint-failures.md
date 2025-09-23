Title: packages/core lint failures – parser config + 400+ rule violations

Summary
- ESLint fails in `packages/core` with 489 errors. Errors include `parserOptions.project` not finding test/script files and many @typescript-eslint rule violations (`no-explicit-any`, `prefer-nullish-coalescing`, unsafe assignments, etc.). Tooling is wired, but config and code need alignment.

Reproduction
- Command: `npm run lint --workspace=packages/core`
- Environment: Node 18+, local repo checkout

Representative Errors
- Parsing error: "parserOptions.project" has been provided... The file was not found in any of the provided project(s): `src/__tests__/...` and `src/scripts/...`
- Rule examples: `@typescript-eslint/no-explicit-any`, `@typescript-eslint/no-unsafe-assignment`, `@typescript-eslint/prefer-nullish-coalescing`, `no-case-declarations`.

Root Cause (likely)
- ESLint uses `parserOptions.project` but the TS project doesn’t include tests and scripts. Strict rules flag long-standing patterns (`any`, for-loops, etc.).

Proposed Fix
1) Add a dedicated `tsconfig.eslint.json` in `packages/core` that extends the main tsconfig and includes:
   - `include`: `src/**/*`, `src/**/__tests__/**/*`, `src/scripts/**/*`
2) Point ESLint to `tsconfig.eslint.json` (via eslint config or overrides for test files).
3) Add ESLint `overrides` for test files to relax rules that don’t provide value in tests (e.g., `no-unsafe-*`, optional).
4) Incrementally refactor code to remove `any`, prefer `??`, and address unsafe patterns in core modules.

Scope
- `packages/core` only. No cross-package changes.

Definition of Done
- `npm run lint --workspace=packages/core` exits with code 0.
- If rules are relaxed, the rationale is documented in the ESLint config near the override.

How to File (GitHub CLI)
```bash
gh issue create \
  --title "packages/core lint failures – parser config + 400+ rule violations" \
  --body-file docs/issues/001-core-lint-failures.md \
  --label tooling,lint,core
```

