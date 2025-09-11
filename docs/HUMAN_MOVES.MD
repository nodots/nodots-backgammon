# How Humans and Robots Play in Nodots Backgammon

## Game States

A Nodots Backgammon game progresses through a series of well-defined states, each representing a phase in the gameplay. The state machine ensures that only valid actions are possible at each step, and transitions are handled by specific functions in the codebase.

### Main Game States

1. **rolling-for-start**

   - Both players roll a single die to determine who starts.
   - Players: Both are in 'inactive' or 'rolling-for-start' state.
   - Transition: When both have rolled, the game moves to 'rolled-for-start'.

2. **rolled-for-start**

   - The player with the higher die starts the game, using the rolled dice as their opening roll.
   - Players: One is 'rolled-for-start', the other is 'inactive'.
   - Transition: The starting player is set as 'active', and the game moves to 'rolling'.

3. **rolling**

   - The active player rolls two dice to begin their turn.
   - Players: One is 'rolling', the other is 'inactive'.
   - Transition: After rolling, the game moves directly to 'moving'.

4. **moving**

   - The active player is in the process of making moves (may be multiple moves per turn).
   - Players: One is 'active', the other is 'inactive'.
   - Transition: When all moves are completed or no more moves are possible, the game moves to 'rolling' for the next player, or to 'winner' if the game is over.

6. **doubled**

   - A player has offered a double; the opponent must accept or decline.
   - Players: One is 'doubled', the other is 'inactive'.
   - Transition: If accepted, the cube value doubles and play continues. If declined, the game ends with the offering player as the winner.

7. **winner**
   - The game is over; one player has borne off all their checkers or the opponent has declined a double.

### State Transition Functions

The following functions (primarily in `Game` and `Player` classes) handle transitions between these states:

- `Game.initialize(players)`: Sets up a new game in the 'rolling-for-start' state.
- `Game.rollForStart(player)`: Handles a player's initial die roll; transitions to 'rolled-for-start' when both have rolled.
- `Game.startGameWithRoll()`: Determines the starting player and transitions to 'rolling'.
- `Game.rollDice(player)`: Handles dice rolling for the active player; transitions to 'moving'.
- `Game.makeMove(move)`: Applies a move; remains in 'moving' until turn is complete, then transitions to 'rolling' for the next player or 'winner'.
- `Game.offerDouble(player)`: Initiates a double; transitions to 'doubled'.
- `Game.acceptDouble(player)`: Accepts a double; transitions back to 'rolling' or 'moving'.
- `Game.declineDouble(player)`: Declines a double; transitions to 'winner'.
- `Game.checkForWin()`: Checks if a player has borne off all checkers; transitions to 'winner' if so.

Each state transition is validated to ensure only legal moves and actions are possible, maintaining the integrity of the game flow.

For more details, see the `Game` class in `src/Game/index.ts` and the `Player` class for player-specific state transitions.

## Example Human Turn in a Nodots Backgammon Client

1. Player clicks the dice, which triggers `api.Game.rollDice(player)`. This action transitions the game state from `'rolling'` to `'moving'`. In the `'moving'` state, the active player's dice values are set, and the game is ready for move generation.
2. Upon entering the `'moving'` state, the Play module is invoked to analyze the current board and dice. It constructs an `activePlay` object, which contains all possible legal move sequences the active player can make with the current dice. This process ensures that only valid moves are presented to the player.
3. When the player clicks on a checker in the web client, the client checks if the origin position of that checker is included among the origins in the list of possible moves for `game.activePlay.moves`. If the origin is valid, the client calls the api to make the move then updates the board. The game remains in the `'moving'` state. If the origin is not valid, an error is logged and no move is made. In the `'moving'` state, the player's moves are applied to the board, and the game logic checks if the turn is complete, if additional moves are possible, or if the game should transition to the next phase.
4. Once all moves in `activePlay` have been completed, the game enters the `'moved'` state. In this state, the player must confirm the end of their turn by clicking on the dice again. When the dice are clicked in the `'moved'` state, the play is finalized, and the turn passes to the opponent. At this point, the game logic checks for the following possible states:
   - If a player has borne off all their checkers, the game transitions to the `'winner'` state.
   - If a double has been offered and accepted, the game may transition to `'doubled'` or back to `'rolling'`/`'moving'` as appropriate.
   - If the turn is simply over, the game transitions to the `'rolling'` state for the next player, where the dice are rolled to begin the next turn.
   - If no further moves are possible but the turn is not over (rare), the game may remain in `'moving'` until all legal actions are exhausted.

In summary, after a move is "completed" (all legal moves for the turn are made), the game will be in one of the following states: `'rolling'` (next player's turn), `'winner'` (game over), or `'doubled'` (if a double is in progress).

**Summary of transitions:**

- `'rolling'` → `'moving'` (after dice are rolled)
- The Play module's creation of `activePlay` occurs during the `'moving'` state, defining the set of legal actions available to the player.
