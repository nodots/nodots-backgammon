# @nodots-llc/backgammon-core API Reference

Complete API documentation for the professional TypeScript backgammon game engine.

## Installation

```bash
npm install @nodots-llc/backgammon-core
npm install @nodots-llc/backgammon-types  # Peer dependency
```

## Quick Start

```typescript
import { Board, Player, Game, Dice } from '@nodots-llc/backgammon-core'

// Initialize a new game
const board = Board.initialize()
const player1 = Player.initialize('black', 'clockwise')
const player2 = Player.initialize('white', 'counterclockwise')
const game = Game.initialize([player1, player2])

// Roll dice and make moves
const rolledGame = Game.roll(game)
const possibleMoves = Board.getPossibleMoves(board, player1, 6)
```

---

## Core Modules

### Board

The `Board` class manages the game board state, checker positions, and move validation.

#### Static Methods

##### `Board.initialize(boardImport?: BackgammonCheckerContainerImport[]): BackgammonBoard`

Creates a new backgammon board with standard starting positions.

**Parameters:**

- `boardImport` (optional): Custom board setup configuration

**Returns:** `BackgammonBoard` - Initialized board with checkers in starting positions

**Example:**

```typescript
// Standard starting position
const board = Board.initialize()

// Custom board setup
const customSetup = [
  { kind: 'point', position: { clockwise: 1 }, checkers: [...] }
]
const customBoard = Board.initialize(customSetup)
```

##### `Board.moveChecker(board, origin, destination, direction): BackgammonBoard`

Executes a checker move on the board, handling hits and rule validation.

**Parameters:**

- `board: BackgammonBoard` - Current board state
- `origin: BackgammonPoint | BackgammonBar` - Source position
- `destination: BackgammonPoint | BackgammonOff` - Target position
- `direction: BackgammonMoveDirection` - Player direction ('clockwise' | 'counterclockwise')

**Returns:** `BackgammonBoard` - New board state after move

**Example:**

```typescript
const point1 = board.BackgammonPoints.find((p) => p.position.clockwise === 1)
const point7 = board.BackgammonPoints.find((p) => p.position.clockwise === 7)
const newBoard = Board.moveChecker(board, point1, point7, 'clockwise')
```

##### `Board.getPossibleMoves(board, player, dieValue): BackgammonMoveSkeleton[]`

Calculates all legal moves for a player with a specific die value.

**Parameters:**

- `board: BackgammonBoard` - Current board state
- `player: BackgammonPlayer` - Player making the move
- `dieValue: BackgammonDieValue` - Die value (1-6)

**Returns:** `BackgammonMoveSkeleton[]` - Array of possible moves

**Example:**

```typescript
const moves = Board.getPossibleMoves(board, player, 6)
// Returns moves like: [{ origin: point1, destination: point7, dieValue: 6 }]
```

##### `Board.getCheckers(board): BackgammonChecker[]`

Gets all checkers on the board.

**Returns:** `BackgammonChecker[]` - All checkers from all positions

##### `Board.getCheckersForColor(board, color): BackgammonChecker[]`

Gets all checkers for a specific color.

**Parameters:**

- `color: BackgammonColor` - 'black' | 'white'

**Returns:** `BackgammonChecker[]` - Checkers of the specified color

##### `Board.getPipCounts(game): { [color]: number }`

Calculates pip counts for both players.

**Parameters:**

- `game: BackgammonGame` - Current game state

**Returns:** Object with pip counts per color

**Example:**

```typescript
const pipCounts = Board.getPipCounts(game)
// { black: 167, white: 167 }
```

#### Utility Methods

##### `Board.getPoints(board): BackgammonPoint[]`

Gets all 24 points on the board.

##### `Board.getBars(board): BackgammonBar[]`

Gets both bar positions (clockwise and counterclockwise).

##### `Board.getOffs(board): BackgammonOff[]`

Gets both off positions.

##### `Board.getCheckerContainer(board, id): BackgammonCheckerContainer`

Finds a specific checker container by ID.

##### `Board.getAsciiBoard(board, players?): string`

Returns ASCII representation of the board for debugging.

---

### Player

The `Player` class manages player state, dice, and movement logic.

#### Static Methods

##### `Player.initialize(color, direction, dice?, id?, stateKind?, isRobot?): BackgammonPlayer`

Creates a new player with specified properties.

**Parameters:**

- `color: BackgammonColor` - 'black' | 'white'
- `direction: BackgammonMoveDirection` - 'clockwise' | 'counterclockwise'
- `dice?: BackgammonDice` - Player's dice (auto-generated if not provided)
- `id?: string` - Player ID (auto-generated if not provided)
- `stateKind?: BackgammonPlayerStateKind` - Initial state (default: 'inactive')
- `isRobot?: boolean` - Whether player is AI-controlled

**Returns:** `BackgammonPlayer` - Initialized player

**Example:**

```typescript
const player = Player.initialize(
  'black',
  'clockwise',
  undefined,
  undefined,
  'inactive',
  false
)
```

##### `Player.roll(player): BackgammonPlayerRolled`

Rolls dice for a player in the 'rolling' state.

**Parameters:**

- `player: BackgammonPlayerRolling` - Player ready to roll

**Returns:** `BackgammonPlayerRolled` - Player with rolled dice

**Example:**

```typescript
const rolledPlayer = Player.roll(rollingPlayer)
console.log(rolledPlayer.dice.currentRoll) // [3, 5]
```

##### `Player.move(board, play, originId): BackgammonMoveResult`

Executes a move for a player from a specific origin.

**Parameters:**

- `board: Board` - Current board
- `play: BackgammonPlayMoving` - Current play state
- `originId: string` - ID of origin position

**Returns:** `BackgammonMoveResult` - Result of the move attempt

##### `Player.getHomeBoard(board, player): BackgammonPoint[]`

Gets the home board points for a player.

**Returns:** Array of points in the player's home board (points 19-24 for clockwise, 1-6 for counterclockwise)

##### `Player.toMoving(player): BackgammonPlayerMoving`

Transitions a player to the 'moving' state.

---

### Dice

The `Dice` class handles dice rolling and state management.

#### Static Methods

##### `Dice.initialize(color, stateKind?, id?, currentRoll?): BackgammonDiceInactive`

Creates new dice for a player.

**Parameters:**

- `color: BackgammonColor` - Player color
- `stateKind?: BackgammonDiceStateKind` - Initial state (default: 'inactive')
- `id?: string` - Dice ID (auto-generated)
- `currentRoll?: BackgammonRoll` - Predefined roll for testing

**Returns:** `BackgammonDiceInactive` - New dice object

##### `Dice.roll(dice): BackgammonDiceRolled`

Rolls the dice and returns new state.

**Parameters:**

- `dice: BackgammonDiceInactive` - Dice to roll

**Returns:** `BackgammonDiceRolled` - Dice with roll results

**Example:**

```typescript
const dice = Dice.initialize('black')
const rolled = Dice.roll(dice)
console.log(rolled.currentRoll) // [2, 4]
console.log(rolled.total) // 6
```

##### `Dice.isDouble(dice): boolean`

Checks if the roll is a double.

**Returns:** `true` if both dice show the same value

##### `Dice.switchDice(dice): BackgammonDiceRolled`

Swaps the order of the dice values.

**Example:**

```typescript
// Original: [3, 5] → Switched: [5, 3]
const switched = Dice.switchDice(rolledDice)
```

---

### Game

The `Game` class orchestrates the overall game flow and state management.

#### Static Methods

##### `Game.initialize(players, ...options): BackgammonGame`

Creates a new game with two players.

**Parameters:**

- `players: BackgammonPlayers` - Array of two players
- `id?: string` - Game ID
- `stateKind?: BackgammonGameStateKind` - Initial state
- `board?: BackgammonBoard` - Custom board
- `cube?: BackgammonCube` - Doubling cube

**Returns:** `BackgammonGame` - New game instance

**Example:**

```typescript
const player1 = Player.initialize('black', 'clockwise')
const player2 = Player.initialize('white', 'counterclockwise')
const game = Game.initialize([player1, player2])
```

##### `Game.rollForStart(game): BackgammonGameRolledForStart`

Determines which player goes first.

**Parameters:**

- `game: BackgammonGameRollingForStart` - Game ready for start roll

**Returns:** `BackgammonGameRolledForStart` - Game with starting player determined

##### `Game.roll(game): BackgammonGameRolled`

Rolls dice for the active player.

**Parameters:**

- `game: BackgammonGameRolling | BackgammonGameRolledForStart` - Game ready for roll

**Returns:** `BackgammonGameRolled` - Game with dice rolled

##### `Game.move(game, originId): BackgammonGameMoving | BackgammonGame`

Executes a move in the game.

**Parameters:**

- `game: BackgammonGameMoving | BackgammonGameRolled` - Game in moving state
- `originId: string` - Origin position ID

**Returns:** Updated game state

##### `Game.startMove(game, movingPlay): BackgammonGameMoving`

Initiates the moving phase for a player.

**Parameters:**

- `game: BackgammonGameRolled` - Game with rolled dice
- `movingPlay: BackgammonPlayMoving` - Play state for moves

**Returns:** `BackgammonGameMoving` - Game in moving state

#### Doubling Cube Methods

##### `Game.canOfferDouble(game, player): boolean`

Checks if a player can offer a double.

##### `Game.offerDouble(game, player): BackgammonGame`

Player offers to double the stakes.

##### `Game.acceptDouble(game, player): BackgammonGame`

Player accepts a double offer.

##### `Game.refuseDouble(game, player): BackgammonGame`

Player refuses a double offer (forfeits the game).

---

### Move

Move validation and execution for different types of backgammon moves.

#### Move Types

1. **PointToPoint** - Standard moves between board points
2. **BearOff** - Moving checkers off the board from home board
3. **Reenter** - Moving checkers from the bar back onto the board

#### Example Move Flow

```typescript
// Get possible moves for a die value
const possibleMoves = Board.getPossibleMoves(board, player, 6)

// Execute a move
const moveResult = Player.move(board, play, originId)

// Update game state
const updatedGame = Game.move(game, originId)
```

---

### Checker

Represents individual checkers on the board.

#### Properties

- `id: string` - Unique identifier
- `color: BackgammonColor` - 'black' | 'white'
- `checkercontainerId: string` - ID of current container (point, bar, or off)

---

### Play

Manages the state of a single play (series of moves with one dice roll).

#### Key Concepts

- **Play Initialization** - Created when dice are rolled
- **Move Execution** - Individual moves within a play
- **Play Completion** - When all moves are made or no more moves possible
- **Doubles Handling** - Special logic for double rolls (4 moves)

---

## Type System Integration

The core library works seamlessly with `@nodots-llc/backgammon-types`:

```typescript
import type {
  BackgammonBoard,
  BackgammonPlayer,
  BackgammonGame,
  BackgammonMove,
} from '@nodots-llc/backgammon-types'

// All functions are fully typed
const board: BackgammonBoard = Board.initialize()
const player: BackgammonPlayer = Player.initialize('black', 'clockwise')
```

---

## Error Handling

The library uses typed errors that extend the base `BackgammonError` interface:

```typescript
export interface BackgammonError extends Error {
  entity: BackgammonEntity
  message: string
}
```

Common error scenarios:

- Invalid move attempts
- Missing required parameters
- Invalid game state transitions
- Rule violations

---

## Testing

The library includes comprehensive Jest tests with 86% coverage:

```bash
npm test              # Run all tests
npm test -- --coverage   # Generate coverage report
```

---

## Advanced Usage

### Custom Board Setups

```typescript
// Create a custom starting position
const customSetup: BackgammonCheckerContainerImport[] = [
  {
    kind: 'point',
    position: { clockwise: 6, counterclockwise: 19 },
    checkers: [
      { color: 'black', checkercontainerId: 'point-6' },
      // ... more checkers
    ],
  },
]

const board = Board.initialize(customSetup)
```

### Game State Serialization

```typescript
// Games can be serialized to JSON
const gameJson = JSON.stringify(game)
const restoredGame = JSON.parse(gameJson) as BackgammonGame
```

### ASCII Board Display

```typescript
// For debugging and testing
const asciiBoard = Board.getAsciiBoard(board, game.players)
console.log(asciiBoard)
```

---

## Performance Considerations

- **Immutable Operations** - All move operations return new objects
- **Efficient Algorithms** - Optimized move generation and validation
- **Memory Management** - Proper cleanup of large game trees
- **Batch Operations** - Efficient handling of multiple moves

---

## Contributing

This library is open source under the MIT license. Contributions welcome:

1. Fork the repository
2. Create a feature branch
3. Add comprehensive tests
4. Ensure 100% TypeScript compliance
5. Submit a pull request

---

## License

MIT © [Nodots LLC](https://nodots.com)

For more information, visit the [GitHub repository](https://github.com/nodots/nodots-backgammon).
