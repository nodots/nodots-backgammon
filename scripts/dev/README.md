# Development Scripts

This directory contains various development and debugging scripts for the Nodots Backgammon project.

## Script Categories

### Game Creation and Management

- `create_game.js` - Creates a new backgammon game via API
- `get_game.js` - Retrieves game data from API
- `test_game_creation.js` - Tests game creation functionality
- `test_game_creation.sh` - Shell script for testing game creation

### Board Analysis and Display

- `analyze_board.js` - Analyzes board state and compares to standard opening positions
- `show_board.js` - Displays board state
- `show_ascii_board.js` - Shows ASCII representation of the board
- `show_board_tabular.js` - Displays board in tabular format
- `check_board_setup.js` - Validates board setup

### Move Testing and Validation

- `move_checker.js` - Tests checker movement functionality
- `move_checker_api.js` - Tests checker movement via API
- `get_possible_moves.js` - Gets possible moves for a position
- `check_possible_moves.js` - Validates possible moves
- `show_possible_moves.js` - Displays possible moves
- `test_move.js` - Tests move functionality
- `test_move_checker.js` - Tests move checker functionality
- `test_possible_moves.js` - Tests possible moves functionality
- `test_possible_moves_simple.js` - Simple test for possible moves

### Game State and Actions

- `roll_dice.js` - Tests dice rolling functionality
- `test_roll_dice.js` - Tests dice rolling
- `show_game.js` - Displays game state
- `show_updated_game.js` - Shows updated game after moves
- `show_second_move.js` - Shows second move in a turn

### Debugging Scripts

- `debug_board.js` - Debug board functionality
- `debug_board_data.js` - Debug board data structures
- `debug_positions.js` - Debug position calculations
- `debug_active_play.js` - Debug active play functionality
- `debug_play_initialize.js` - Debug play initialization
- `force_reinitialize.js` - Force reinitialization of game state
- `fix_board_iteratively.js` - Iteratively fix board issues

### API Testing

- `test_api.js` - Tests API endpoints
- `test_conversion.js` - Tests data conversion

### Utility Scripts

- `test_print.js` - Simple test print script

## Sample Data Files

### Game State Examples

- `current_game.json` - Sample game state data (26KB) - contains a game in "rolled" state
- `game_state.json` - Sample game state data (8.4KB) - contains a game in "rolled-for-start" state

These files can be used as reference data for testing scripts or understanding the game state structure. They are not referenced by any scripts but serve as examples of the JSON structure used by the backgammon game.

## Usage

Most scripts can be run directly with Node.js:

```bash
node scripts/dev/create_game.js
node scripts/dev/analyze_board.js <game_id>
```

Some scripts require specific parameters (like game IDs) which should be passed as command line arguments.

## Dependencies

These scripts typically require:

- The core backgammon library (`nodots-backgammon-core`)
- API server running on localhost:3000
- `node-fetch` for API calls

Make sure the API server is running and the core library is built before running these scripts.
