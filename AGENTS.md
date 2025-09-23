# Repository Guidelines

## Project Structure & Module Organization
- Monorepo managed by npm workspaces (`packages/*`).
- Source lives in `packages/*/src`.
- Tests: `packages/*/src/**/__tests__` and `**/*.test.ts[x]`.
- Key packages:
  - `packages/api` – Express REST API + WebSocket, Drizzle ORM.
  - `packages/client` – React + Vite app (Playwright e2e).
  - `packages/core` – Core backgammon rules/logic.
  - `packages/ai` – GNU Backgammon integration.
  - `packages/types` – Shared TypeScript types.
- Assets: `packages/client/public/**` (e.g., dice artwork).
- Note: `packages/cli` and robot-related tooling are currently dormant.

## Build, Test, and Development Commands
- Install all: `npm install --workspaces`
- Start both servers: `npm run start` (API + Client)
- Start individually: `npm run start --workspace=packages/api` | `npm run dev --workspace=packages/client`
- Build all: `npm run build --workspaces`
- Test all: `npm test` (or `npm run test --workspaces`)
- Lint all: `npm run lint --workspaces`
- Client e2e: `npm run e2e:install --workspace=packages/client` then `npm run e2e --workspace=packages/client`

## Coding Style & Naming Conventions
- Language: TypeScript (Node 18+).
- Linting: ESLint per package; use `lint:fix` where available.
- Indentation: 2 spaces; use semicolons.
- Naming: camelCase (vars/functions), PascalCase (classes/types/React components).
- Prefer named exports from module entrypoints.

## Testing Guidelines
- Unit/Integration: Jest across packages.
- E2E: Playwright in `packages/client`.
- Naming: `*.test.ts`/`*.test.tsx`; colocate next to source or under `__tests__`.
- Run focused tests, e.g.: `npm run test --workspace=packages/api -- src/routes/__tests__/robots-websocket-integration.test.ts`.
- Keep or improve existing coverage (notably in `core` and `api`).

## Commit & Pull Request Guidelines
- Conventional Commits: `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:`.
- PRs include: clear description, linked issues, test plan, and screenshots/GIFs for UI changes.
- Ensure lint, unit tests, and (when applicable) client e2e pass locally.

## Security & Configuration Tips
- Don’t commit secrets. Use `.env.development`, `.env.test`, `.env`.
- API requires PostgreSQL; Redis is used for robot/queue features.
- Common env vars: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `AUTH0_DOMAIN`, `AUTH0_AUDIENCE`.
- See `packages/api/README.md` for detailed setup.

## Open Issues & Tracking
- Core lint failures: see `docs/issues/001-core-lint-failures.md`.
- AI lint failures: see `docs/issues/002-ai-lint-failures.md`.
