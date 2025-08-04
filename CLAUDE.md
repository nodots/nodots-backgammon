# Claude Code Rules for Nodots Backgammon

This file contains consolidated development rules imported from the .cursor directory for use with Claude Code. These rules ensure consistency, quality, and proper domain knowledge across the entire Nodots Backgammon ecosystem.

## Core Backgammon Rules and Domain Knowledge

### Rules of Backgammon
Reference: https://www.bkgm.com/rules.html

### Backgammon Board Position System

**CRITICAL**: Each point on the backgammon board has TWO position numbers - one for each player direction:

- **Clockwise positions**: 1, 2, 3... 24 (clockwise player's perspective)
- **Counterclockwise positions**: 1, 2, 3... 24 (counterclockwise player's perspective)

### The Golden Rule

Always calculate CheckerContainer (Point, Bar, Off) positions using this approach:

- Always get a point position using `game.board.points.filter(p => p.position[activePlayer.direction])`
- Always get a bar position using `game.board.bar[activePlayer.direction]`
- Always get an off position using `game.board.off[activePlayer.direction]`
- Carefully review the CheckerContainer class from types

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

### Unified Presentation Layer

**KEY FEATURE**: Every player sees the board as if they are "white moving clockwise" regardless of the actual backend configuration.

#### Backend Flexibility

The game can have any combination of:
- White moving clockwise vs counterclockwise
- Black moving clockwise vs counterclockwise
- Any player being human or robot
- Any starting positions

#### Frontend Consistency

Every player always sees:
- Their checkers as "white" moving clockwise
- Their home board as positions 1-6 (bottom right)
- Their outer board as positions 7-12 (bottom left)
- Opponent's outer board as positions 13-18 (top left)
- Opponent's home board as positions 19-24 (top right)

#### Benefits

- Eliminates cognitive load of "which direction am I moving?"
- No need to mentally flip the board
- Consistent, intuitive view for all players
- Backend can handle any game configuration while frontend presents unified experience

This presentation abstraction is a key differentiator of Nodots Backgammon.

## Game States and Human Player Workflow

### Game State Machine

Nodots Backgammon progresses through well-defined states that control valid actions and transitions:

1. **rolling-for-start**: Both players roll to determine who starts
2. **rolled-for-start**: Starting player determined, uses initial dice
3. **rolling**: Active player rolls dice to begin turn
4. **rolled**: Active player must make moves with rolled dice
5. **moving**: Player executing moves (may be multiple moves per turn)
6. **doubled**: Double offered, opponent must accept/decline
7. **winner**: Game over, one player has won

### State Transition Functions

Critical functions that handle state transitions:

- `Game.initialize(players)`: Sets up new game in 'rolling-for-start'
- `Game.rollForStart(player)`: Handles initial die roll
- `Game.startGameWithRoll()`: Determines starting player
- `Game.rollDice(player)`: Handles dice rolling, transitions to 'rolled'
- `Game.makeMove(move)`: Applies move, transitions to 'moving'
- `Game.offerDouble(player)`: Initiates double, transitions to 'doubled'
- `Game.acceptDouble(player)`: Accepts double
- `Game.declineDouble(player)`: Declines double, transitions to 'winner'
- `Game.checkForWin()`: Checks for win condition

### Human Player Turn Workflow

1. **Rolling Phase**: Player clicks dice → `api.Game.rollDice(player)` → State: 'rolling' → 'rolled'

2. **Move Generation**: In 'rolled' state, API/CORE creates `activePlay` object containing:
   - `activePlay.moves` array with skeletons for all moves allowed by dice roll (2 or 4 moves)
   - Each `move` in `moves` array has `possibleMoves` array pre-populated
   - Each `possibleMove` has:
     - `origin`: Point or Bar location (not individual checker ID)
     - `destination`: Target Point, Bar, or Off location  
     - `dieValue`: Die value used for this move

3. **Move Selection**: 
   - Player clicks checker → Client finds checker's current Point/Bar location
   - Client matches location to `origin` in `activePlay.moves[n].possibleMoves`
   - Client sends `checkerId` to API → State: 'rolled' → 'moving'

4. **Move Completion**: After all moves completed → State: 'moving' → 'moved' → Player clicks dice to confirm turn end

5. **Turn Transition**: Game checks for:
   - Win condition → 'winner' state
   - Double in progress → 'doubled' state  
   - Normal turn end → 'rolling' state for next player

### Critical Move Validation Architecture

- `activePlay.moves[n].possibleMoves` contains ALL legal moves pre-calculated by CORE
- Each `possibleMove.origin` corresponds to a Point or Bar location, NOT individual checkers
- When user clicks checker, client must:
  1. Determine checker's current Point/Bar location
  2. Find matching `possibleMove` where `origin` equals that location
  3. Execute the pre-calculated legal move instantly
- This architecture enables instant client-side move validation and execution

## Development Workflow and Communication Standards

### Branch Management

#### Primary Branch Standard
- **REQUIRED**: Use `main` as the primary branch name in ALL repositories
- **MIGRATION**: Convert any existing `master` branches to `main`
- **NEW REPOSITORIES**: Always initialize with `main` as the default branch
- **CI/CD**: Update all automation to reference `main` branch
- **BUILD FROM**: Always build production frontend from `main` branch
- **DEPLOY FROM**: Always deploy API services from `main` branch only

#### Feature Branches
- Create feature branches from `main`
- Use descriptive branch names: `feature/description` or `fix/issue-description`
- Keep branch names concise but clear about the purpose

### Communication Standards

#### Code Comments
- Write comments for business logic and game rules
- Avoid redundant comments that restate obvious code
- Use clear, concise language
- No adverbs or adjectives in comments - keep language direct and factual

#### Commit Messages
- Use conventional commit format: `type(scope): description`
- Types: feat, fix, docs, style, refactor, test, chore
- Keep first line under 72 characters
- Include body for complex changes

#### Pull Request Process
- Create feature branches from `main`
- Write descriptive PR titles and descriptions
- Include test coverage for new features
- Link to relevant issues
- Request review from at least one other developer
- Merge back to `main` after approval

### Status Updates and Communication

#### Regular Status Updates
Provide status updates every 15 seconds during long-running tasks or operations. Each update MUST include:
- 🕒 Timestamp in format "**[HH:MM:SS] UPDATE #N**"
- Current task/operation being performed
- Progress indicators or completion status
- Any issues encountered
- Next steps planned

#### Stuck Detection
If I spend more than 2 minutes on infrastructure issues, debugging environment problems, or repeatedly failing at the same task without making progress toward the user's actual goal, I MUST notify the user immediately with:
- "⚠️ **I'M STUCK**: [brief description of what I'm stuck on]"
- "🎯 **SUGGESTED APPROACH**: [alternative approach]"
- "❓ **USER INPUT NEEDED**: [what decision or help I need]"

### Date and Timestamp Management
Always run the unix `date` command to get the current date before updating any document or log file. This ensures timestamps are accurate and up-to-date.

## Coding Standards and Architecture

### TypeScript Standards

#### Type Definitions
- Use explicit types for all function parameters and return values
- Prefer interfaces over type aliases for object shapes
- Use union types for controlled variations
- Avoid `any` type - use `unknown` when type is truly unknown

#### Interface Design
```typescript
// Good
interface GameState {
  readonly id: string
  readonly players: ReadonlyArray<Player>
  readonly board: Board
  readonly currentPlayer: PlayerColor
  readonly dice: ReadonlyArray<number>
}

// Avoid
interface GameState {
  id: any
  players: Player[]
  board: any
  currentPlayer: string
  dice: number[]
}
```

### Architecture Patterns

#### Game Logic Separation
ALL game logic must reside in nodots-backgammon-core. The API layer should ONLY:
1. Accept information about current state and proposed state changes
2. Pass these to core for validation and execution
3. Return results or errors from core
4. Handle persistence and API concerns

Never implement game rules, move validation, or game state logic in the API layer.

#### Domain-Driven Design
- Separate domain logic from infrastructure
- Use rich domain models
- Implement domain events
- Maintain bounded contexts

#### Hexagonal Architecture
- Keep domain logic independent
- Use ports and adapters pattern
- Implement clean boundaries
- Test domain logic in isolation

### Type Safety and Dependencies

#### Official Types Package
ALWAYS use types from `@nodots-llc/backgammon-types` package - NEVER redefine local types:
1. Import all game-related types from `@nodots-llc/backgammon-types`
2. Use `BackgammonGame`, `BackgammonPlayer`, `BackgammonBoard`, etc. from the official package
3. NEVER create local interfaces that duplicate package types
4. Use package types for all API responses, state management, and type annotations
5. Only create local interfaces for UI-specific state that doesn't exist in the package

#### Database and Type Consistency
The database schema and the corresponding TypeScript type must always have the same fields. Any addition, removal, or change to one must be reflected in the other.

### Programming Style Guidelines

#### Functional Programming Over Imperative
Avoid if/then statements when possible - they are code smell in functional programming:
1. Use early returns instead of nested if/else chains
2. Prefer switch statements with early returns for state machines
3. Use ternary operators for simple conditional assignments
4. Leverage array methods (.map, .filter, .find, .some, .every) over imperative loops
5. Use object/map lookups instead of long if/else chains
6. Extract complex conditions into well-named boolean variables or functions

#### Naming Conventions
- Use PascalCase for types and classes
- Use camelCase for variables and functions
- Use UPPER_CASE for constants
- Use descriptive names that explain purpose

#### Function Design
- Keep functions small and focused
- Use descriptive parameter names
- Limit function parameters (max 3-4)
- Return early to reduce nesting

## API Design Guidelines

### RESTful API Standards

#### HTTP Methods
- **GET**: Retrieve resources (idempotent)
- **POST**: Create new resources
- **PUT**: Update/replace entire resources (idempotent)
- **PATCH**: Partial updates
- **DELETE**: Remove resources (idempotent)

#### Resource Naming
- Use nouns for resource names
- Use plural forms for collections
- Use hierarchical structure for relationships
- Keep URLs readable and intuitive

#### HTTP Status Codes
- **200 OK**: Successful GET, PUT, PATCH
- **201 Created**: Successful POST
- **204 No Content**: Successful DELETE
- **400 Bad Request**: Invalid request data
- **401 Unauthorized**: Authentication required
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource not found
- **409 Conflict**: Resource conflict
- **500 Internal Server Error**: Server error

### API Client Usage
ALWAYS use the configured apiClient (`api.*` methods) instead of raw fetch() calls:
1. Use `api.games.*` for all game-related operations
2. Use `api.users.*` for all user-related operations
3. Never use raw `fetch()` calls to the backend API endpoints
4. The apiClient handles authentication, error handling, and consistent request formatting

### Server Management

#### API Server Lifecycle
- **CRITICAL**: Never manually restart the API server in nodots-backgammon-api
- The server runs with nodemon and automatically restarts when code changes are detected
- Do not use `kill-all-ports`, `start:dev:ssl`, or any manual restart commands
- Let the automated restart process handle server lifecycle management

#### Environment Management
- **Development Database**: `nodots_backgammon_dev`
- **Test Database**: `nodots_backgammon_test`
- **Production Database**: `nodots_backgammon_prod`
- Main API routes: `/api/v1/*` (uses main database)
- Test API routes: `/api/test/*` (uses test database)

### Data Serialization

#### Critical Serialization Issue
The activePlay property in BackgammonGame objects is being serialized as null instead of undefined when sent via API responses. This happens because JSON.stringify() converts undefined to null.

**Solution Required**: Implement custom serialization logic to ensure activePlay returns undefined instead of null.

#### Core Library Data Structures
In nodots-backgammon-core, the activePlay.moves property is stored as a Set, not an Array. When iterating over moves, you MUST first convert to Array using Array.from(game.activePlay.moves).

## Frontend Development Guidelines

### React Best Practices

#### Component Design
- Use functional components with hooks
- Keep components small and focused
- Use TypeScript for all components
- Implement proper prop validation

#### State Management
- Use React hooks for local state
- Use Redux/Context for global state
- Keep state as close to usage as possible
- Implement proper state updates

### UI/UX Standards

#### Unified User Experience
Every player sees the board from a consistent perspective:
- Their checkers appear as "white" moving clockwise
- Their home board is always positions 1-6 (bottom right)
- Their outer board is always positions 7-12 (bottom left)
- Opponent's outer board is always positions 13-18 (top left)
- Opponent's home board is always positions 19-24 (top right)

#### Design Principles
1. Create beautiful and modern UI
2. Implement best UX practices
3. Ensure responsive design
4. Provide clear visual feedback
5. Maintain accessibility standards

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

### Internationalization

#### Locale Support
Support multiple languages through proper i18n configuration:
- Arabic (ar)
- English (en, en-US)
- Spanish (es, es-MX)
- French (fr, fr-FR)
- Greek (gr, gr-GR)
- Turkish (tr, tr-TR)

## Testing Strategy

### Test Types
- **Unit Tests**: Test individual functions and classes
- **Integration Tests**: Test component interactions
- **End-to-End Tests**: Test complete user workflows
- **Performance Tests**: Ensure response times meet requirements

### Test Coverage
- Maintain minimum 80% code coverage
- Cover all public API endpoints
- Test error conditions and edge cases
- Include regression tests for bug fixes

### Test Requirements
All tests must pass before reporting that a task is completed. If any tests fail after implementing changes, iterate on the solution until all tests pass.

### Bug Status Clarity
When reporting on bugs, be explicitly clear about the current status:
- "🔍 **BUG DISCOVERED**" - when a bug has been found and documented but not yet fixed
- "🔧 **BUG FIXED**" - when a bug has been resolved and verified through testing
- "🧪 **BUG INVESTIGATION**" - when actively debugging but root cause not yet identified
- "✅ **BUG VERIFIED RESOLVED**" - when fix has been tested and confirmed working

## Security Guidelines

### Input Validation
- Validate all user inputs
- Sanitize data for output
- Use parameterized queries
- Implement rate limiting

### Authentication & Authorization
- Use secure authentication mechanisms
- Implement proper session management
- Follow principle of least privilege
- Regular security audits

### Data Protection
- Encrypt sensitive data
- Use secure communication channels
- Implement proper access controls
- Regular security updates

## Performance Considerations

### Memory Management
- Avoid memory leaks
- Use object pooling for frequent allocations
- Implement proper cleanup
- Monitor memory usage

### Database Optimization
- Use appropriate indexes
- Optimize query performance
- Implement connection pooling
- Monitor database metrics

### Caching
- Implement appropriate caching strategies
- Use ETags for conditional requests
- Cache frequently accessed data
- Implement cache invalidation

## Monitoring and Logging

### Logging Strategy
- Use structured logging
- Include relevant context
- Implement proper log levels
- Monitor log aggregation

### Metrics Collection
- Track business metrics
- Monitor system performance
- Implement health checks
- Set up alerting

### Error Tracking
- Implement comprehensive error tracking
- Include error context
- Monitor error rates
- Set up error notifications

## Configuration Migration Consistency

### ES Modules Migration
When reviewing package.json or configuration files, always verify complete migration patterns:
1. **ES Modules Migration (`"type": "module"`):**
   - ✅ ALL `ts-node` commands must include `--esm` flag
   - ✅ Check scripts: `start`, `start:dev`, `dev`, `test`, and any custom scripts
   - ✅ Verify TypeScript config uses appropriate module settings

2. **TypeScript Configuration Consistency:**
   - ✅ `tsconfig.json` module settings must align with `package.json` type
   - ✅ All build/dev scripts should use compatible flags

3. **Node.js Version Compatibility:**
   - ✅ Check `.nvmrc` vs `package.json` engines vs actual Node version
   - ✅ Verify ts-node version supports the Node.js version in use

## Memory Rules

### Move Logic Principles
- Do not think of plays as proceeding by "using up both dice". The logic is more complex and is handled when a new play is initialized with its moves populated based on that logic. Think of a play has "using up all moves".