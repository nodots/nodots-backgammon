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

## Branch Management

### Primary Branch Standard

- **REQUIRED**: Use `main` as the primary branch name in ALL repositories
- **NEVER use**: `master` - this is deprecated and should be migrated to `main`
- **MIGRATION**: Convert any existing `master` branches to `main`
- **NEW REPOSITORIES**: Always initialize with `main` as the default branch
- **CI/CD**: Update all automation to reference `main` branch
- **Branch protection**: Apply branch protection rules to `main` branch
- **Default branch**: Set `main` as the default branch in all repository settings

### Feature Branches

- Create feature branches from `main`
- Use descriptive branch names: `feature/description` or `fix/issue-description`
- Keep branch names concise but clear about the purpose

## TypeScript Standards

### Type Definitions

- Use explicit types for all function parameters and return values
- Prefer interfaces over type aliases for object shapes
- Use union types for controlled variations
- Avoid `any` type - use `unknown` when type is truly unknown

### Interface Design

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

### Functional Programming

- Prefer immutable data structures
- Use pure functions when possible
- Avoid side effects in business logic
- Use functional composition over inheritance
- **CRUCIAL**: Always use switch over if/else. If is a code smell in Functional Programming and the existing Claude rules make it clear that our paradigm is FP.

### Error Handling

- Use Result/Either types for error handling
- Avoid throwing exceptions in business logic
- Handle errors at appropriate boundaries
- Provide meaningful error messages

## Code Organization

### File Structure

- Group related functionality in modules
- Use index files for clean imports
- Separate types, logic, and tests
- Follow consistent naming conventions

### Naming Conventions

- Use PascalCase for types and classes
- Use camelCase for variables and functions
- Use UPPER_CASE for constants
- Use descriptive names that explain purpose

### Function Design

- Keep functions small and focused
- Use descriptive parameter names
- Limit function parameters (max 3-4)
- Return early to reduce nesting

### Class Design

- Prefer composition over inheritance
- Use dependency injection
- Keep classes focused on single responsibility
- Make fields private by default

## API Design Guidelines

### RESTful API Design

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

```
Good Examples:
GET /api/v1/games
GET /api/v1/games/123
POST /api/v1/games
PUT /api/v1/games/123
DELETE /api/v1/games/123
GET /api/v1/games/123/moves

Bad Examples:
GET /api/v1/getGames
POST /api/v1/createGame
GET /api/v1/game/123
```

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

### API Server Management

**CRITICAL**: Never manually restart development servers - let them restart themselves
- The API server runs with nodemon and automatically restarts when code changes are detected
- The client dev server also auto-restarts on changes
- Do not use `kill-all-ports`, `start:dev:ssl`, or any manual restart commands
- Servers will restart themselves and show in the logs when ready
- Any attempt to manually restart causes port conflicts and crashes
- Let the automated restart process handle server lifecycle management
- **IMPORTANT**: Keep server logs running continuously for real-time monitoring and debugging

### Development Workflow

- Make code changes and save files
- Wait for nodemon/dev servers to detect changes and restart automatically
- Monitor the continuous log output for confirmation that servers are ready
- Keep log terminals visible at all times for immediate feedback
- Only intervene if servers fail to start (check logs for actual errors)

## Git Workflow

### Feature Branch Workflow

- Use feature branches: `feature/description`
- Always branch from `main` (not master)
- Rebase before merging to maintain clean history
- Squash related commits when merging
- Tag releases with semantic versioning
- Keep `main` branch stable and deployable

### Commit Messages

- Use conventional commit format: `type(scope): description`
- Types: feat, fix, docs, style, refactor, test, chore
- Keep first line under 72 characters
- Include body for complex changes

### Pull Request Process

- Create feature branches from `main`
- Write descriptive PR titles and descriptions
- Include test coverage for new features
- Link to relevant issues
- Request review from at least one other developer
- Merge back to `main` after approval

## Testing Strategy

### Test Types

- **Unit Tests**: Test individual functions and classes
- **Integration Tests**: Test component interactions
- **End-to-End Tests**: Test complete user workflows
- **Performance Tests**: Ensure response times meet requirements

### E2E Testing Browser Configuration

- **REQUIRED**: E2E tests should only run on Chromium for faster development cycles
- **Playwright Configuration**: Disable Firefox and WebKit projects in playwright.config.ts
- **Rationale**: Cross-browser testing adds significant time without proportional value during active development
- **CI/CD**: Can be re-enabled for full browser testing in production deployment pipelines

### Test Coverage

- Maintain minimum 80% code coverage
- Cover all public API endpoints
- Test error conditions and edge cases
- Include regression tests for bug fixes

### Test Organization

- Place tests in `__tests__` directories
- Use descriptive test names
- Group related tests with `describe` blocks
- Use `beforeEach` and `afterEach` for setup/teardown

## Communication Standards

### Code Comments

- Write comments for business logic and game rules
- Avoid redundant comments that restate obvious code
- Use clear, concise language
- No adverbs or adjectives in comments - keep language direct and factual

### Documentation

- Document all public APIs
- Include usage examples
- Explain complex algorithms
- Keep documentation up to date

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

### Database Design

- Normalize data appropriately
- Use indexes effectively
- Implement proper connection pooling
- Monitor query performance

## Code Quality

### Static Analysis

- Use ESLint for code quality
- Use Prettier for formatting
- Enable strict TypeScript checking
- Use SonarQube for code analysis

### Code Reviews

- Review for correctness and clarity
- Check test coverage
- Verify documentation
- Ensure consistency with standards

## Development Environment

### Required Tools

- Node.js 18+ with npm
- Git for version control
- Your preferred IDE with TypeScript support
- Access to shared development database

### Setup Process

1. Clone repository
2. Run `npm install` to install dependencies
3. Copy environment template: `cp .env.example .env`
4. Configure environment variables
5. Run `npm test` to verify setup

## Deployment

### Environment Management

- Use environment-specific configurations
- Implement proper secret management
- Monitor application health
- Implement rollback procedures

### CI/CD Pipeline

- Automated testing on all commits
- Automated deployment to staging
- Manual approval for production
- Automated rollback on failures
- Always deploy from `main` branch

### Monitoring

- Log all significant events
- Monitor system metrics
- Set up alerts for critical issues
- Regular health checks

## Architecture Patterns

### Domain-Driven Design

- Separate domain logic from infrastructure
- Use rich domain models
- Implement domain events
- Maintain bounded contexts

### Hexagonal Architecture

- Keep domain logic independent
- Use ports and adapters pattern
- Implement clean boundaries
- Test domain logic in isolation

### Event-Driven Architecture

- Use events for loose coupling
- Implement event sourcing where appropriate
- Handle events asynchronously
- Ensure event ordering when needed

## Error Types

- **ValidationError**: Invalid input data
- **NotFoundError**: Resource not found
- **AuthenticationError**: Authentication failed
- **AuthorizationError**: Insufficient permissions
- **NetworkError**: Network connectivity issues

## Workspace Structure

This project uses a monorepo structure with the following packages:

- **packages/types**: Shared TypeScript types and interfaces
- **packages/core**: Core game logic and domain models
- **packages/ai**: AI player implementations
- **packages/api**: Backend API service
- **packages/client**: Frontend web application
- **packages/cli**: Command-line interface tools

Each package inherits these shared rules but may have additional package-specific guidelines in their respective `.cursor/rules.md` files.

## Type System and State Management

### State Handling Critical Rule

- **CRITICAL**: Always make switch statements on state exhaustive for the state. The type system for this project is very thorough and will save your ass.