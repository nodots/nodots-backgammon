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

## Memory Rules

### Move Logic Principles

- Do not think of plays as proceeding by "using up both dice". The logic is more complex and is handled when a new play is initialized with its moves populated based on that logic. Think of a play has "using up all moves".

[Rest of the existing content remains unchanged]