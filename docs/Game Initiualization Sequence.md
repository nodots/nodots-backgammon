# Game Initialization Sequence for Human v Robot Play

## Initial Game Setup

1. Human User clicks "Play Robot" button in lobby
2. Triggers call to API CREATE GAME endpoint POST /game which creates a game that is in the 'rolling-for-start' state.
3. API broadcasts new game state via WebSocket
4. CLIENT detects a game in 'rolling-for-start' state and makes API request to POST /game/:id/roll-for-start which returns a game in the 'rolled-for-start' state.
5. CLIENT detects a game in the 'rolled-for-start' state and makes API request to POST /game/:id/roll which updates the game, player, and dice states. Game is in 'rolled' state
6. API broadcasts new game state via WebSocket

## Paths Diverge for Human and Robot Here

### Human

6. Human clicks checker in Board interface
7. CLIENT calls POST /game/:id/move which returns a game in the 'moving' state with updated game, players, board
8. API broadcasts new game state via WebSocket
9. CLIENT receives updated game state and updates board including moving checkers to match new board state

## The Problem

We need a way to handle the transition(s) between the rolled and moving states that is based on the possibility that a user might DOUBLE before MOVING.

In a 'rolled' state a player can take three actions:

1. SWITCH DICE by clicking the DiceSwitcher component. Game remains in 'rolled' state but with updated activePlay and dice
2. DOUBLE by clicking the Cube component. Game remains in a 'rolled' state but with updated game and cube states. (Note: This is not currently implemented)
3. MOVE by clicking a Checker component

Suggest approaches for handling this problem using the following principles:

1. All business logic resides in CORE.
2. CLIENT is responsible for displaying GAME states and sending requests to the API for changes to GAME state
3. API is responsible for transmitting the requests for state changes from CLIENT to CORE and broadcasting updated game states via websocket
4. State changes should be based on switching on discriminated union state types (stateKind in the model), i.e., state machine based on Functional Programming principles.
