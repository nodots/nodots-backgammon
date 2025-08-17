# Claude Code Rules for Nodots Backgammon

This file contains consolidated development rules imported from the .cursor directory for use with Claude Code. These rules ensure consistency, quality, and proper domain knowledge across the entire Nodots Backgammon ecosystem.

## CURRENT SESSION NOTES - E2E TESTING STATUS

### E2E Test Progress - Human vs Robot Game (2025-08-09)

**CURRENT STATUS: STUCK ON TURN TRANSITIONS**

#### What We Accomplished ✅
1. **Dice rolling works perfectly** - Human can roll dice consistently
2. **Move execution works** - Individual moves execute successfully via React handlers
3. **React event system identified** - Found the correct `handleCheckerClick` function
4. **WebSocket integration confirmed** - `makeMove` calls succeed with `{success: true}` responses
5. **Basic game setup works** - Login, game creation, board loading all functional

#### The Core Problem ❌
**Turn transitions from human → robot are broken.** After human completes their turn and clicks "pass turn", the game doesn't transition to robot player. Instead it stays stuck waiting for robot turn indefinitely.

#### Working Files:
- ✅ `/packages/client/tests/e2e/09-minimal-working-test.spec.ts` - Proves basic functionality works
- ❌ `/packages/client/tests/e2e/10-simple-human-robot.spec.ts` - Gets stuck on turn transitions
- ❌ `/packages/client/tests/e2e/08-turn-transition-test.spec.ts` - Complex debugging version

#### Next Session Action Plan:
1. **FIRST:** Remove all debug logging from `handleCheckerClick` (it's cluttering output)
2. **INVESTIGATE:** Why human → robot turn transitions fail after "pass turn" dice click
3. **SIMPLIFY:** Focus only on getting 1 human turn → 1 robot turn working
4. **FALLBACK:** If robot automation is broken, test human vs human instead

#### Key Insight:
Individual components (dice, moves, clicks) all work. The issue is the **game state management and turn transition system** - likely a WebSocket/REDIS/React context sync issue, not a UI interaction problem.

## Core Backgammon Rules and Domain Knowledge

### Rules of Backgammon

Reference: https://www.bkgm.com/rules.html

### Backgammon Board Position System

**CRITICAL**: Each point on the backgammon board has TWO position numbers - one for each player direction:

- **Clockwise positions**: 1, 2, 3... 24 (clockwise player's perspective)
- **Counterclockwise positions**: 1, 2, 3... 24 (counterclockwise player's perspective)

## The Golden Rule

Always calculate CheckerContainer (Point, Bar, Off) positions using this approach:

- Always get a point position using game.board.points.filter(p => p.position[activePlayer.direction])
- Always get a bar position using game.board.bar[activePlayer.direction]
- Always get an off positing using game.board.off[activePlayer.direction]
- Carefully review the checkercontainer class from types

### Starting Positions

- **Clockwise player** starts with checkers on clockwise positions: 24, 13, 8, 6
- **Counterclockwise player** starts with checkers on counterclockwise positions: 24, 13, 8, 6

### Key Points

- Both players start on their respective "24, 13, 8, 6" but from their own directional perspective
- This is NOT a bug - it's the correct dual numbering system
- Each point object contains: `{ clockwise: X, counterclockwise: Y }`
- Move validation must use the correct positional perspective for each player

### Example

```
Point at top-right of ASCII board:
- Clockwise position: 24 (WHITE's starting position)
- Counterclockwise position: 1 (BLACK's goal position)
```

This dual numbering system is essential for proper move validation and game logic.

## Unified Presentation Layer

**KEY FEATURE**: Every player sees the board as if they are "white moving clockwise" regardless of the actual backend configuration.

### Backend Flexibility

The game can have any combination of:

- White moving clockwise vs counterclockwise
- Black moving clockwise vs counterclockwise
- Any player being human or robot
- Any starting positions

### Frontend Consistency

Every player always sees:

- Their checkers as "white" moving clockwise
- Their home board as positions 1-6 (bottom right)
- Their outer board as positions 7-12 (bottom left)
- Opponent's outer board as positions 13-18 (top left)
- Opponent's home board as positions 19-24 (top right)

### Benefits

- Eliminates cognitive load of "which direction am I moving?"
- No need to mentally flip the board
- Consistent, intuitive view for all players
- Backend can handle any game configuration while frontend presents unified experience

This presentation abstraction is a key differentiator of Nodots Backgammon.

## Play/Move Game Flow

Understanding the critical game flow is essential for debugging move-related issues:

1. **Game.roll()** creates new Play instance → becomes activePlay in Game
2. **Play.initialize()** creates moves (2 for regular roll, 4 for doubles) with possibleMoves populated
3. **Empty possibleMoves** = 'no-move', completed automatically
4. **Non-empty possibleMoves** = player selects from options (humans click checkers, robots auto-select first)
5. **Move execution** updates activePlay.moves to track consumed dice

When debugging move issues, always check: activePlay state, moves array, possibleMoves population, and dice consumption tracking.

## Memory Rules

### Development Tools
- Always use gh cli to read and write to github issues
- ALWAYS use the e2e-test-coordinator to write E2E tests

### UI and State Management
- NEVER import game state into window. Always use useGameContext.

### CRITICAL GAME STATE RULE - NEVER FORGET THIS
**DO NOT USE DICE/CURRENT_ROLL FOR TRACKING PLAY STATE. YOU MUST ALWAYS, ALWAYS, ALWAYS USE `game.activePlay.moves`.**

Why this is critical:
- `game.activePlay.moves` is the single source of truth for available moves
- It contains all game logic, validation, and state management built into it
- The game engine handles all complexity: move validation, sequence dependencies, board state updates, doubles logic, hits, bearing off, blocking, etc.
- `activePlay.moves` reflects CURRENT reality after each move
- `stateKind: "ready"` = this move can be executed now
- `stateKind: "completed"` = this move is done
- `possibleMoves` array = exactly what's legal right now

Correct approach:
1. Always get fresh `game.activePlay.moves`
2. Find moves with `stateKind: "ready"`
3. Execute the first available ready move
4. Let the game engine update the state
5. Repeat until no more ready moves

Never guess, never track dice manually, never use stale move data. Follow what the game engine tells you is possible.

## Architecture and Separation of Concerns

### Game Logic Separation

ALL game logic must reside in nodots-backgammon-core. The API layer should ONLY:

1. Accept information about current state and proposed state changes
2. Pass these to core for validation and execution
3. Return results or errors from core
4. Handle persistence and API concerns

Never implement game rules, move validation, or game state logic in the API layer. This separation ensures consistency and testability.

### API Client Usage

ALWAYS use the configured apiClient (`api.*` methods) instead of raw fetch() calls in the frontend:

1. Use `api.games.*` for all game-related operations (create, start, roll, move, etc.)
2. Use `api.users.*` for all user-related operations
3. Never use raw `fetch()` calls to the backend API endpoints
4. The apiClient handles authentication, error handling, and consistent request formatting
5. This ensures type safety and consistent error handling across the application

Example: Use `api.games.rollForStart(gameId)` not `fetch('/games/${gameId}/roll-for-start')`

## Type Safety and Dependencies

### Official Types Package

ALWAYS use types from `@nodots-llc/backgammon-types` package - NEVER redefine local types:

1. Import all game-related types from `@nodots-llc/backgammon-types`
2. Use `BackgammonGame`, `BackgammonPlayer`, `BackgammonBoard`, etc. from the official package
3. NEVER create local interfaces that duplicate package types (e.g., don't create `GameState` when `BackgammonGame` exists)
4. Use package types for all API responses, state management, and type annotations
5. Only create local interfaces for UI-specific state that doesn't exist in the package
6. This ensures type consistency between frontend, backend, and prevents state transition bugs

Example: Use `BackgammonGame` not local `GameState` interface

## Programming Style Guidelines

### Functional Programming Over Imperative

Avoid if/then statements when possible - they are code smell in functional programming:

1. Use early returns instead of nested if/else chains
2. Prefer switch statements with early returns for state machines
3. Use ternary operators for simple conditional assignments
4. Leverage array methods (.map, .filter, .find, .some, .every) over imperative loops
5. Use object/map lookups instead of long if/else chains
6. Extract complex conditions into well-named boolean variables or functions

Example: `const isValidMove = dice.includes(dieValue) && !isBlocked` instead of nested ifs

### Comment Style

No adverbs or adjectives in comments. Keep language direct and factual.

## Data Serialization

### Critical Serialization Issue

The activePlay property in BackgammonGame objects is being serialized as null instead of undefined when sent via API responses. This happens because JSON.stringify() converts undefined to null.

**Solution Required**: Implement custom serialization logic to ensure activePlay (and potentially other properties) return undefined instead of null. Consider using a Functional Programming TypeScript library (like fp-ts, Ramda, or similar) that provides proper Option/Maybe types and serialization utilities.

### Core Library Data Structures

In nodots-backgammon-core, the activePlay.moves property is stored as a Set, not an Array. When iterating over moves or using Array methods like .map(), .filter(), etc., you MUST first convert to Array using Array.from(game.activePlay.moves).

The core library should handle this conversion internally rather than exposing Set complexity to consuming applications.

## Development Workflow Rules

### Status Updates and Communication

#### Regular Status Updates

Provide status updates every 15 seconds during long-running tasks or operations. Each update MUST include:

- 🕒 Timestamp in format "**[HH:MM:SS] UPDATE #N**"
- Current task/operation being performed
- Progress indicators or completion status
- Any issues encountered
- Next steps planned

This keeps the user informed and prevents confusion about task progress.

#### Notification Requirements

Update status in the chat window at a minimum every 30 seconds. If you are stuck, interrupt after 3 iterations.

#### Stuck Detection

If I spend more than 2 minutes on infrastructure issues, debugging environment problems, or repeatedly failing at the same task without making progress toward the user's actual goal, I MUST notify the user immediately with:

- "⚠️ **I'M STUCK**: [brief description of what I'm stuck on]"
- "🎯 **SUGGESTED APPROACH**: [alternative approach]"
- "❓ **USER INPUT NEEDED**: [what decision or help I need]"

This prevents wasting time on tangential issues and keeps focus on the main objective.

### Testing and Quality Assurance

#### Test Requirements

All tests must pass before reporting that a task is completed. If any tests fail after implementing changes, iterate on the solution until all tests pass. Run the test suite and fix any failures before considering the task done.

#### Bug Status Clarity

When reporting on bugs, be explicitly clear about the current status using these exact terms:

- "🔍 **BUG DISCOVERED**" - when a bug has been found and documented but not yet fixed
- "🔧 **BUG FIXED**" - when a bug has been resolved and verified through testing
- "🧪 **BUG INVESTIGATION**" - when actively debugging but root cause not yet identified
- "✅ **BUG VERIFIED RESOLVED**" - when fix has been tested and confirmed working

Never use ambiguous language that could confuse discovery with resolution.

### Date and Timestamp Management

#### Current Date Requirement

Always run the unix `date` command to get the current date before updating any document or log file. This ensures timestamps are accurate and up-to-date.

**Required workflow:**

1. Execute `date` command to get current OS date
2. Use the returned date when setting timestamps in any file
3. Never assume or hardcode dates without verification

**Example:**

```bash
date  # Get current date first
# Then update files with accurate timestamp
```

This prevents outdated or incorrect dates in documentation and ensures all timestamps reflect the actual current date.

## Environment Management

### Directory Verification

ALWAYS verify the current directory before running terminal commands. Use `pwd` or check the last terminal cwd to ensure you're in the correct directory (e.g., nodots-backgammon-api for API commands, nodots-backgammon-core for core commands). If in the wrong directory, navigate to the correct one before executing commands. This prevents file not found errors and ensures commands run in the intended context.

### API Server Management

ALWAYS kill existing API server processes before starting the server. Multiple running instances cause port conflicts and unpredictable behavior. Before starting the API server:

1. Navigate to `nodots-backgammon-api` directory
2. Run `npm run kill-port` to kill processes on port 3000 (uses the package.json script)
3. Check for any remaining ts-node/nodemon processes with `ps aux | grep -E "(ts-node|nodemon)" | grep -v grep`
4. Kill any remaining processes if found
5. Start the server with `npm start` (not npm run dev - that script doesn't exist)

This prevents port conflicts, ensures clean server state, and avoids multiple concurrent API instances that can cause simulation hangs.

## Game Creation Requirements

Backgammon games MUST be created with exactly 2 players and ONLY 2 players are permitted:

1. The POST /games endpoint requires `{ player1: { userId: "id1" }, player2: { userId: "id2" } }` in the request body
2. Both `player1.userId` and `player2.userId` are required and must be different
3. There is NO addPlayer endpoint - players cannot be added after game creation
4. Use `api.games.start(player1Id, player2Id)` not `api.games.create()` for creating games with players
5. The `api.games.create()` method (no parameters) is invalid and will result in 400 errors

This ensures all games have the required two players from creation and prevents incomplete game states.

## Branch Management

### Primary Branch Standard

- **REQUIRED**: Use `main` as the primary branch name in ALL repositories
- **MIGRATION**: Convert any existing `master` branches to `main`
- **NEW REPOSITORIES**: Always initialize with `main` as the default branch
- **CI/CD**: Update all automation to reference `main` branch

## Server Management

### API Server Lifecycle

- **CRITICAL**: Never manually restart the API server in nodots-backgammon-api
- The server runs with nodemon and automatically restarts when code changes are detected
- Do not use `kill-all-ports`, `start:dev:ssl`, or any manual restart commands
- The server will restart itself and show in the logs when it's ready
- Any attempt to manually restart causes port conflicts and crashes
- Let the automated restart process handle server lifecycle management

### Development Workflow

- Make code changes and save files
- Wait for nodemon to detect changes and restart automatically
- Check logs for confirmation that server is ready
- Only intervene if server fails to start (check logs for actual errors)

## Environment and Database Management

### Three-Environment Setup

1. **Development** (`NODE_ENV=development` or unset)
   - Uses `.env` or `.env.development` file
   - Connects to development database

2. **Test** (`NODE_ENV=test`)
   - Uses `.env.test` file
   - Connects to test database

3. **Production** (`NODE_ENV=production`)
   - Uses `.env.production` file
   - Connects to production database with SSL

### Database Configuration

- **Development Database**: `nodots_backgammon_dev`
- **Test Database**: `nodots_backgammon_test`
- **Production Database**: `nodots_backgammon_prod`

### Route Structure

- Main API routes: `/api/v1/*` (uses main database)
- Test API routes: `/api/test/*` (uses test database)

## Frontend Guidelines

### Unified User Experience

Every player sees the board from a consistent perspective:

- Their checkers appear as "white" moving clockwise
- Their home board is always positions 1-6 (bottom right)
- Their outer board is always positions 7-12 (bottom left)
- Opponent's outer board is always positions 13-18 (top left)
- Opponent's home board is always positions 19-24 (top right)

This eliminates cognitive load and provides a consistent, intuitive view for all players.

### Internationalization

Support multiple languages through proper i18n configuration:

- Arabic (ar)
- English (en, en-US)
- Spanish (es, es-MX)
- French (fr, fr-FR)
- Greek (gr, gr-GR)
- Turkish (tr, tr-TR)

### Accessibility Guidelines

#### WCAG 2.1 AA Compliance

- Ensure sufficient color contrast ratios (4.5:1 for normal text, 3:1 for large text)
- Provide keyboard navigation for all interactive elements
- Implement focus indicators that are visible and meaningful
- Use semantic HTML elements for proper screen reader support

#### Screen Reader Support

- Provide descriptive alt text for all images and board elements
- Use ARIA labels for complex game interactions
- Announce game state changes and move confirmations
- Ensure logical tab order through the interface

#### Keyboard Accessibility

- All game actions must be keyboard accessible
- Provide keyboard shortcuts for common actions
- Ensure no keyboard traps in modal dialogs or game boards
- Support both mouse and keyboard input methods

#### Visual Accessibility

- Support high contrast mode preferences
- Provide options to increase text size
- Ensure game board elements are distinguishable without color alone
- Use patterns and shapes in addition to colors for differentiation

#### Cognitive Accessibility

- Provide clear, simple instructions
- Allow users to undo actions where appropriate
- Give sufficient time to complete actions
- Avoid flashing or rapidly changing content
- useMemo is a code smell. AVOID it. Consider using useGameContext instead.
- The types in the Nodots Backgammon ecosystem are very strict and are designed to prevent state management problems in a complex game. Use them. `any` is a code smell. Everything should have a specific type.
- CRITICAL. No task for the CLIENT is complete without a browser-based E2E test that proves all acceptance criteria have been met.
- ALWAYS use useGameState() for autoritative state info for CLIENT
- You can create new labels for github issues using the gh cli client.
- Anything that can be derived from gameState must be derived from gameState.
- NEVER claim something is fixed until you have verified with a browser-based E2E test that SHOWS the fix.
- ALWAYS create new branches from `development` branch
- Always create github issues in this repo: https://github.com/nodots/nodots-backgammon