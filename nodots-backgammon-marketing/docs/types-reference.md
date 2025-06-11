# @nodots-llc/backgammon-types Reference

Complete TypeScript type definitions for professional backgammon development.

## Installation

```bash
npm install @nodots-llc/backgammon-types
```

## Overview

This package provides comprehensive TypeScript definitions for all aspects of backgammon game development, ensuring type safety and excellent developer experience.

---

## Core Types

### Game Entities

#### `BackgammonColor`

```typescript
type BackgammonColor = 'black' | 'white'
```

#### `BackgammonMoveDirection`

```typescript
type BackgammonMoveDirection = 'clockwise' | 'counterclockwise'
```

#### `BackgammonDieValue`

```typescript
type BackgammonDieValue = 1 | 2 | 3 | 4 | 5 | 6
```

#### `BackgammonRoll`

```typescript
type BackgammonRoll = [BackgammonDieValue, BackgammonDieValue]
```

---

## Board Types

### `BackgammonBoard`

Main board interface containing all game positions.

```typescript
interface BackgammonBoard {
  id: string
  BackgammonPoints: BackgammonPoints // Array of 24 points
  bar: {
    clockwise: BackgammonBar
    counterclockwise: BackgammonBar
  }
  off: {
    clockwise: BackgammonOff
    counterclockwise: BackgammonOff
  }
}
```

### `BackgammonPoint`

Individual board positions (1-24).

```typescript
interface BackgammonPoint extends BackgammonCheckerContainer {
  kind: 'point'
  position: {
    clockwise: BackgammonPointValue // 1-24
    counterclockwise: BackgammonPointValue
  }
  checkers: BackgammonChecker[]
}
```

### `BackgammonBar`

The bar position where hit checkers are placed.

```typescript
interface BackgammonBar extends BackgammonCheckerContainer {
  kind: 'bar'
  direction: BackgammonMoveDirection
  checkers: BackgammonChecker[]
}
```

### `BackgammonOff`

The off position where borne-off checkers are placed.

```typescript
interface BackgammonOff extends BackgammonCheckerContainer {
  kind: 'off'
  direction: BackgammonMoveDirection
  checkers: BackgammonChecker[]
}
```

---

## Checker Types

### `BackgammonChecker`

Individual game pieces.

```typescript
interface BackgammonChecker {
  id: string
  color: BackgammonColor
  checkercontainerId: string // ID of current container
}
```

### `BackgammonCheckerContainer`

Base interface for positions that can hold checkers.

```typescript
interface BackgammonCheckerContainer {
  id: string
  kind: 'point' | 'bar' | 'off'
  checkers: BackgammonChecker[]
}
```

---

## Player Types

### `BackgammonPlayer`

Base player interface with discriminated union by state.

```typescript
interface BackgammonPlayer {
  id: string
  color: BackgammonColor
  direction: BackgammonMoveDirection
  stateKind: BackgammonPlayerStateKind
  dice: BackgammonDice
  pipCount: number
  isRobot: boolean
}
```

### Player State Types

#### `BackgammonPlayerStateKind`

```typescript
type BackgammonPlayerStateKind =
  | 'inactive'
  | 'rolling-for-start'
  | 'rolled-for-start'
  | 'rolling'
  | 'rolled'
  | 'moving'
  | 'moved'
  | 'winner'
  | 'doubled'
```

#### Specific Player States

```typescript
interface BackgammonPlayerInactive extends BackgammonPlayer {
  stateKind: 'inactive'
}

interface BackgammonPlayerRolling extends BackgammonPlayer {
  stateKind: 'rolling'
  dice: BackgammonDiceInactive
}

interface BackgammonPlayerRolled extends BackgammonPlayer {
  stateKind: 'rolled'
  dice: BackgammonDiceRolled
}

interface BackgammonPlayerMoving extends BackgammonPlayer {
  stateKind: 'moving'
  dice: BackgammonDiceRolled
}
```

---

## Dice Types

### `BackgammonDice`

Discriminated union of dice states.

```typescript
type BackgammonDice = BackgammonDiceInactive | BackgammonDiceRolled
```

### Dice State Types

#### `BackgammonDiceInactive`

```typescript
interface BackgammonDiceInactive {
  id: string
  stateKind: 'inactive'
  color: BackgammonColor
  currentRoll?: BackgammonRoll
  total?: number
}
```

#### `BackgammonDiceRolled`

```typescript
interface BackgammonDiceRolled {
  id: string
  stateKind: 'rolled'
  color: BackgammonColor
  currentRoll: BackgammonRoll
  total: number
}
```

---

## Game Types

### `BackgammonGame`

Main game interface with discriminated union by state.

```typescript
interface BackgammonGame {
  id: string
  stateKind: BackgammonGameStateKind
  players: BackgammonPlayers
  board: BackgammonBoard
  cube: BackgammonCube
}
```

### Game State Types

#### `BackgammonGameStateKind`

```typescript
type BackgammonGameStateKind =
  | 'rolling-for-start'
  | 'rolled-for-start'
  | 'rolling'
  | 'rolled'
  | 'moving'
  | 'moved'
  | 'completed'
  | 'doubling'
  | 'doubled'
```

#### Specific Game States

```typescript
interface BackgammonGameRolling extends BackgammonGame {
  stateKind: 'rolling'
  activeColor: BackgammonColor
  activePlayer: BackgammonPlayerActive
  inactivePlayer: BackgammonPlayerInactive
}

interface BackgammonGameRolled extends BackgammonGame {
  stateKind: 'rolled'
  activeColor: BackgammonColor
  activePlayer: BackgammonPlayerRolled
  inactivePlayer: BackgammonPlayerInactive
}

interface BackgammonGameMoving extends BackgammonGame {
  stateKind: 'moving'
  activeColor: BackgammonColor
  activePlayer: BackgammonPlayerMoving
  inactivePlayer: BackgammonPlayerInactive
  activePlay: BackgammonPlayMoving
}
```

---

## Move Types

### `BackgammonMove`

Complete move definition.

```typescript
interface BackgammonMove {
  id: string
  kind: BackgammonMoveKind
  origin: BackgammonMoveOrigin
  destination: BackgammonMoveDestination
  dieValue: BackgammonDieValue
  checker: BackgammonChecker
  hitChecker?: BackgammonChecker // If opponent checker was hit
}
```

### Move Kinds

#### `BackgammonMoveKind`

```typescript
type BackgammonMoveKind = 'point-to-point' | 'bear-off' | 'reenter'
```

#### Specific Move Types

```typescript
interface BackgammonMovePointToPoint extends BackgammonMove {
  kind: 'point-to-point'
  origin: BackgammonPoint
  destination: BackgammonPoint
}

interface BackgammonMoveBearOff extends BackgammonMove {
  kind: 'bear-off'
  origin: BackgammonPoint
  destination: BackgammonOff
}

interface BackgammonMoveReenter extends BackgammonMove {
  kind: 'reenter'
  origin: BackgammonBar
  destination: BackgammonPoint
}
```

### Move Validation

#### `BackgammonMoveSkeleton`

Partial move used for validation.

```typescript
interface BackgammonMoveSkeleton {
  origin: BackgammonPoint | BackgammonBar
  destination: BackgammonPoint | BackgammonOff
  dieValue: BackgammonDieValue
}
```

#### `BackgammonMoveResult`

Result of move execution.

```typescript
interface BackgammonMoveResult {
  success: boolean
  board?: BackgammonBoard
  move?: BackgammonMove
  error?: string
}
```

---

## Play Types

### `BackgammonPlay`

Represents a series of moves with one dice roll.

```typescript
interface BackgammonPlay {
  id: string
  stateKind: BackgammonPlayStateKind
  board: BackgammonBoard
  player: BackgammonPlayer
  dice: BackgammonDiceRolled
  moves: BackgammonMove[]
  availableDice: BackgammonDieValue[]
}
```

### Play States

#### `BackgammonPlayStateKind`

```typescript
type BackgammonPlayStateKind = 'rolled' | 'moving' | 'completed'
```

#### Specific Play States

```typescript
interface BackgammonPlayRolled extends BackgammonPlay {
  stateKind: 'rolled'
  moves: []
  availableDice: BackgammonDieValue[] // [die1, die2] or [die, die, die, die] for doubles
}

interface BackgammonPlayMoving extends BackgammonPlay {
  stateKind: 'moving'
  moves: BackgammonMove[]
  availableDice: BackgammonDieValue[] // Remaining unused dice
}

interface BackgammonPlayCompleted extends BackgammonPlay {
  stateKind: 'completed'
  moves: BackgammonMove[]
  availableDice: [] // All dice used or no legal moves
}
```

---

## Cube Types

### `BackgammonCube`

Doubling cube implementation.

```typescript
interface BackgammonCube {
  id: string
  value: BackgammonCubeValue
  owner?: BackgammonColor // Who owns the cube (can double)
  centered: boolean // True if cube is in center (either can double)
}
```

#### `BackgammonCubeValue`

```typescript
type BackgammonCubeValue = 1 | 2 | 4 | 8 | 16 | 32 | 64
```

---

## Offer Types

### `BackgammonOffer`

Game offers (double, resign, etc.).

```typescript
interface BackgammonOffer {
  id: string
  kind: BackgammonOfferKind
  from: BackgammonColor
  to: BackgammonColor
  value?: number // For resign offers (1=single, 2=gammon, 3=backgammon)
}
```

#### `BackgammonOfferKind`

```typescript
type BackgammonOfferKind = 'double' | 'resign'
```

---

## Utility Types

### Collections

```typescript
type BackgammonPlayers = [BackgammonPlayer, BackgammonPlayer]
type BackgammonPoints = BackgammonPoint[] // Always length 24
```

### Import/Export

```typescript
interface BackgammonCheckerContainerImport {
  kind: 'point' | 'bar' | 'off'
  position?: { clockwise: number; counterclockwise: number }
  direction?: BackgammonMoveDirection
  checkers: Array<{
    color: BackgammonColor
    checkercontainerId: string
  }>
}
```

### Position Values

```typescript
type BackgammonPointValue =
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | 13
  | 14
  | 15
  | 16
  | 17
  | 18
  | 19
  | 20
  | 21
  | 22
  | 23
  | 24
```

---

## Type Guards

The types include discriminated unions, allowing for type-safe state checking:

```typescript
// Type guard examples
function isPlayerRolled(
  player: BackgammonPlayer
): player is BackgammonPlayerRolled {
  return player.stateKind === 'rolled'
}

function isGameMoving(game: BackgammonGame): game is BackgammonGameMoving {
  return game.stateKind === 'moving'
}

function isPointToPointMove(
  move: BackgammonMove
): move is BackgammonMovePointToPoint {
  return move.kind === 'point-to-point'
}
```

---

## Usage Examples

### Basic Type Usage

```typescript
import type {
  BackgammonBoard,
  BackgammonPlayer,
  BackgammonGame,
  BackgammonMove,
} from '@nodots-llc/backgammon-types'

// All operations are fully typed
function processGame(game: BackgammonGame): void {
  if (game.stateKind === 'moving') {
    // TypeScript knows this is BackgammonGameMoving
    const activePlay = game.activePlay
    const moves = activePlay.moves
  }
}
```

### Custom Type Extensions

```typescript
// Extend types for your application
interface MyGameState extends BackgammonGame {
  customProperty: string
  timestamp: Date
}

interface MyPlayer extends BackgammonPlayer {
  name: string
  rating: number
}
```

---

## Integration with Core Library

These types are designed to work seamlessly with `@nodots-llc/backgammon-core`:

```typescript
import { Board, Player, Game } from '@nodots-llc/backgammon-core'
import type {
  BackgammonBoard,
  BackgammonPlayer,
} from '@nodots-llc/backgammon-types'

// Core functions return properly typed objects
const board: BackgammonBoard = Board.initialize()
const player: BackgammonPlayer = Player.initialize('black', 'clockwise')
```

---

## Validation

All types include proper constraints and validation rules that match official backgammon rules:

- **Board**: Always 24 points, proper checker limits
- **Dice**: Values 1-6, proper double handling
- **Moves**: Rule-compliant move validation
- **Players**: Consistent state transitions
- **Game Flow**: Enforced turn order and state progression

---

## License

MIT © [Nodots LLC](https://nodots.com)

For more information, visit the [GitHub repository](https://github.com/nodots/nodots-backgammon).
