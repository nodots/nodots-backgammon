# Robot Simulation Guide

## Overview

The Nodots Backgammon CLI now supports comprehensive robot vs robot simulation capabilities, powered by the Nodots Backgammon API v3.1.0. This allows you to run automated games between AI opponents with various difficulty levels and configurations.

## Available Commands

### 1. `robot-list` / `robots`

List all available robot users.

```bash
nodots-backgammon robot-list
nodots-backgammon robots  # shorthand alias
```

### 2. `robot-simulate`

Start a new robot vs robot simulation.

```bash
# Basic usage
nodots-backgammon robot-simulate

# With specific configuration
nodots-backgammon robot-simulate \
  --robot1-difficulty advanced \
  --robot2-difficulty beginner \
  --speed 500

# Interactive mode
nodots-backgammon robot-simulate --interactive
```

**Options:**

- `-s, --speed <ms>` - Speed between moves in milliseconds (default: 1000)
- `-r1, --robot1-difficulty <level>` - Robot 1 difficulty (beginner|intermediate|advanced)
- `-r2, --robot2-difficulty <level>` - Robot 2 difficulty (beginner|intermediate|advanced)
- `-i, --interactive` - Interactive configuration mode

### 3. `robot-status`

Check the status of a running simulation.

```bash
# Check once
nodots-backgammon robot-status <simulation-id>

# Watch in real-time
nodots-backgammon robot-status <simulation-id> --watch

# Custom update interval
nodots-backgammon robot-status <simulation-id> --watch --interval 5
```

**Options:**

- `-w, --watch` - Watch simulation progress in real-time
- `-i, --interval <seconds>` - Update interval for watch mode (default: 2)

### 4. `robot-pause`

Pause or resume a simulation.

```bash
nodots-backgammon robot-pause <simulation-id>
```

### 5. `robot-stop`

Stop a running simulation.

```bash
# With confirmation
nodots-backgammon robot-stop <simulation-id>

# Force stop without confirmation
nodots-backgammon robot-stop <simulation-id> --force
```

**Options:**

- `-f, --force` - Force stop without confirmation

### 6. `robot-speed`

Change the speed of a running simulation.

```bash
# Set specific speed
nodots-backgammon robot-speed <simulation-id> --speed 2000

# Interactive speed selection
nodots-backgammon robot-speed <simulation-id> --interactive
```

**Options:**

- `-s, --speed <ms>` - New speed in milliseconds (100-30000)
- `-i, --interactive` - Interactive speed selection

### 7. `robot-batch`

Run multiple simulations in batch.

```bash
# Default single scenario
nodots-backgammon robot-batch

# Preset scenarios
nodots-backgammon robot-batch --preset all
nodots-backgammon robot-batch --preset difficulty-test
nodots-backgammon robot-batch --preset speed-test

# From JSON file
nodots-backgammon robot-batch --file examples/batch-scenarios.json

# Interactive configuration
nodots-backgammon robot-batch --interactive

# Custom settings
nodots-backgammon robot-batch \
  --preset all \
  --concurrent 5 \
  --speed 200 \
  --output results.json
```

**Options:**

- `-c, --concurrent <number>` - Maximum concurrent simulations (default: 3)
- `-s, --speed <ms>` - Default speed for all simulations (default: 200)
- `-p, --preset <name>` - Use preset scenarios (all|difficulty-test|speed-test)
- `-f, --file <path>` - Load scenarios from JSON file
- `-o, --output <path>` - Save results to JSON file
- `-i, --interactive` - Interactive scenario configuration

## Difficulty Levels

- **beginner** - Basic move selection, good for testing and learning
- **intermediate** - Balanced strategy with position evaluation
- **advanced** - Sophisticated algorithms, competitive play

## Speed Guidelines

- **100ms** - Ultra-fast for automated testing
- **500ms** - Fast for development and quick games
- **1000ms** - Normal speed for real-time observation
- **2000ms** - Slow for educational purposes
- **5000ms+** - Very slow for detailed analysis and debugging

## Usage Examples

### Quick Start

1. **List available robots:**

   ```bash
   nodots-backgammon robots
   ```

2. **Start a simple simulation:**

   ```bash
   nodots-backgammon robot-simulate --interactive
   ```

3. **Monitor the simulation:**
   ```bash
   # Replace <simulation-id> with actual ID from step 2
   nodots-backgammon robot-status <simulation-id> --watch
   ```

### Batch Testing

1. **Run all difficulty combinations:**

   ```bash
   nodots-backgammon robot-batch --preset all --output results.json
   ```

2. **Performance testing:**

   ```bash
   nodots-backgammon robot-batch \
     --preset speed-test \
     --concurrent 5 \
     --output performance-results.json
   ```

3. **Custom scenarios from file:**
   ```bash
   nodots-backgammon robot-batch \
     --file examples/batch-scenarios.json \
     --concurrent 3 \
     --output custom-results.json
   ```

### Advanced Usage

1. **Start and control a simulation:**

   ```bash
   # Start simulation
   SIMULATION_ID=$(nodots-backgammon robot-simulate \
     --robot1-difficulty advanced \
     --robot2-difficulty beginner \
     --speed 1000 | grep "Simulation ID:" | cut -d' ' -f3)

   # Watch for a while
   timeout 30s nodots-backgammon robot-status $SIMULATION_ID --watch

   # Pause it
   nodots-backgammon robot-pause $SIMULATION_ID

   # Change speed
   nodots-backgammon robot-speed $SIMULATION_ID --speed 500

   # Resume (pause again)
   nodots-backgammon robot-pause $SIMULATION_ID

   # Stop when done
   nodots-backgammon robot-stop $SIMULATION_ID --force
   ```

## Configuration

Set environment variables for API configuration:

```bash
export NODOTS_API_URL="http://localhost:3000"  # API base URL
export NODOTS_USER_ID="your-user-id"           # Optional user ID
export NODOTS_API_KEY="your-api-key"           # Optional API key
```

## Batch Scenarios File Format

Create a JSON file with an array of scenario objects:

```json
[
  {
    "name": "Test Scenario 1",
    "robot1Difficulty": "beginner",
    "robot2Difficulty": "intermediate",
    "speed": 1000
  },
  {
    "name": "Test Scenario 2",
    "robot1Difficulty": "advanced",
    "robot2Difficulty": "advanced",
    "speed": 500
  }
]
```

## Troubleshooting

### Common Issues

1. **"No robot users found"**

   - Ensure the API has robot users configured
   - Check your API URL and authentication

2. **"Failed to start simulation"**

   - Verify at least 2 robot users exist
   - Check API connectivity
   - Ensure valid difficulty levels (beginner|intermediate|advanced)

3. **Simulation stuck**

   - The API has auto-recovery mechanisms
   - Try stopping and restarting the simulation
   - Check simulation logs via `robot-status`

4. **Performance issues**
   - Reduce number of concurrent simulations
   - Increase speed intervals for slower machines
   - Monitor system resources

### Debug Commands

```bash
# Check robot availability
nodots-backgammon robots

# Get detailed simulation info
nodots-backgammon robot-status <simulation-id>

# Check API connectivity
curl $NODOTS_API_URL/api/v1/robots
```

## Integration with API v3.1.0

All robot simulation features use the new API endpoints:

- `GET /api/v1/robots` - List robots
- `POST /api/v1/robots/simulations` - Start simulation
- `GET /api/v1/robots/simulations/:id` - Get status
- `POST /api/v1/robots/simulations/:id/pause` - Pause/resume
- `DELETE /api/v1/robots/simulations/:id` - Stop simulation
- `POST /api/v1/robots/simulations/:id/speed` - Change speed

For full API documentation, see the API docs at `/public/api-docs.html`.

## Support

For issues or questions:

- Check the API logs for detailed error messages
- Verify robot users are properly configured in the database
- Ensure the API version is v3.1.0 or later
- Use `--interactive` modes for easier configuration
