# Nodots Backgammon API - Testing Guide

## 🚀 **Quick Start**

### Prerequisites

- API server running on `http://localhost:3000`
- PostgreSQL database connected
- Node.js and curl available

### Test the Working Features

## 1. **User Management** ✅

### Create Robot Users

```bash
# Create Robot Player 1
curl -X POST http://localhost:3000/api/v1/users \
  -H "Content-Type: application/json" \
  -d '{
    "source": "system",
    "externalId": "test-robot-1",
    "email": "robot1@test.com",
    "given_name": "Test Robot",
    "family_name": "Player 1",
    "userType": "robot",
    "locale": "en-US"
  }'

# Create Robot Player 2
curl -X POST http://localhost:3000/api/v1/users \
  -H "Content-Type: application/json" \
  -d '{
    "source": "system",
    "externalId": "test-robot-2",
    "email": "robot2@test.com",
    "given_name": "Test Robot",
    "family_name": "Player 2",
    "userType": "robot",
    "locale": "en-US"
  }'
```

### List Users

```bash
curl http://localhost:3000/api/v1/users | jq '.'
```

## 2. **Game Creation** ✅

### Create New Game

```bash
# Use the user IDs from step 1
curl -X POST http://localhost:3000/api/v1/games \
  -H "Content-Type: application/json" \
  -d '{
    "player1Id": "USER_ID_1",
    "player2Id": "USER_ID_2",
    "autoRollForStart": true
  }' | jq '.'
```

### Get Game State

```bash
curl http://localhost:3000/api/v1/games/GAME_ID | jq '.'
```

## 3. **Dice Rolling** ✅

### Roll Dice for First Turn

```bash
curl -X POST http://localhost:3000/api/v1/games/GAME_ID/roll | jq '.'
```

## 4. **Move Execution** ✅

### Get Possible Moves

```bash
curl http://localhost:3000/api/v1/games/GAME_ID/possible-moves | jq '.'
```

### Execute a Move

```bash
# Use a checker ID from the possible moves response
curl -X POST http://localhost:3000/api/v1/games/GAME_ID/move \
  -H "Content-Type: application/json" \
  -d '{
    "checkerId": "CHECKER_ID"
  }' | jq '.'
```

## 📋 **Complete Working Example**

Here's a complete test sequence:

```bash
#!/bin/bash

echo "🎮 Testing Nodots Backgammon API"

# 1. Create users
echo "Creating robot users..."
USER1=$(curl -s -X POST http://localhost:3000/api/v1/users \
  -H "Content-Type: application/json" \
  -d '{"source":"system","externalId":"test1","email":"test1@test.com","given_name":"Robot","family_name":"One","userType":"robot","locale":"en-US"}' \
  | jq -r '.id')

USER2=$(curl -s -X POST http://localhost:3000/api/v1/users \
  -H "Content-Type: application/json" \
  -d '{"source":"system","externalId":"test2","email":"test2@test.com","given_name":"Robot","family_name":"Two","userType":"robot","locale":"en-US"}' \
  | jq -r '.id')

echo "✅ Created users: $USER1, $USER2"

# 2. Create game
echo "Creating game..."
GAME=$(curl -s -X POST http://localhost:3000/api/v1/games \
  -H "Content-Type: application/json" \
  -d "{\"player1Id\":\"$USER1\",\"player2Id\":\"$USER2\",\"autoRollForStart\":true}" \
  | jq -r '.id')

echo "✅ Created game: $GAME"

# 3. Check initial state
echo "Game state:"
curl -s http://localhost:3000/api/v1/games/$GAME | jq '.stateKind, .activeColor'

# 4. Roll dice if needed
echo "Rolling dice..."
curl -s -X POST http://localhost:3000/api/v1/games/$GAME/roll | jq '.activePlayer.dice.currentRoll'

# 5. Get possible moves
echo "Getting possible moves..."
curl -s http://localhost:3000/api/v1/games/$GAME/possible-moves | jq '.possibleMoves | length'

echo "🎮 Basic API test complete!"
```

## 🧪 **Available Test Scripts**

### Use the Pre-built Testing Scripts

```bash
# Test individual robot moves
node debug-robot-move.js

# Investigate possible moves
node debug-possible-moves.js

# Simple functionality demo
node simple-robot-demo.js

# Test doubles handling
node find-doubles-bug.js
```

## 📊 **Expected Responses**

### Successful Game Creation

```json
{
  "id": "uuid-here",
  "stateKind": "rolled-for-start",
  "activeColor": "white",
  "players": [...],
  "board": {...}
}
```

### Possible Moves (Working Cases)

```json
{
  "gameId": "uuid-here",
  "playerId": "uuid-here",
  "playerColor": "white",
  "possibleMoves": [
    {
      "origin": {...},
      "destination": {...},
      "dieValue": 4
    }
  ]
}
```

### Successful Move

```json
{
  "success": true,
  "game": {
    "stateKind": "moving",
    "activeColor": "white",
    ...
  }
}
```

## ⚠️ **Known API Issues**

### Possible Moves Bug

In complex board positions, you may see:

```json
{
  "possibleMoves": []
}
```

Even when moves should be available. This is a known issue being tracked.

### Robot Simulation Limitations

- Full robot vs robot games may get stuck
- Multi-move turns need manual intervention
- Complex board positions may show no moves

## 🎯 **What Works Reliably**

1. ✅ User creation and management
2. ✅ Game creation with proper setup
3. ✅ Dice rolling and random generation
4. ✅ Single move execution
5. ✅ Board state representation
6. ✅ Basic game flow management

## 📞 **Support**

For issues with the working features, check:

1. API server logs for errors
2. Database connectivity
3. Proper JSON request format
4. Valid user/game IDs

The core system is stable for human vs human gameplay and basic robot operations.
