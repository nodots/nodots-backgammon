# Robot-Move API Authentication Guide

This guide explains how to authenticate API requests to test the robot-move endpoint and GNU Backgammon integration in the nodots-backgammon project.

## Authentication System Overview

The nodots-backgammon API uses two authentication methods:

### 1. Auth0 JWT Tokens (Production)
- Used by the web client for real users
- Requires Auth0 configuration and proper JWT verification
- Format: `Bearer <jwt_token>`

### 2. CLI Legacy Tokens (Development/Testing)
- Used for testing, CLI tools, and automation
- Bypasses Auth0 for development convenience
- Format: `Bearer cli|<email>`
- Example: `Bearer cli|test@nodots.com`

## Current Robot-Move Endpoint Issue

**IMPORTANT**: The robot-move endpoint at `/api/v3.7/games/{gameId}/robot-move` currently **does NOT have authentication middleware applied**, but it expects authentication headers. This appears to be a bug.

### The Problem
- The endpoint returns "No authorization header provided" when called without auth
- The games router doesn't have `authenticateToken` middleware applied globally
- Individual endpoints don't have auth middleware either
- Yet the endpoint seems to expect authentication

### The Solution
You need to add authentication headers even though the middleware might not be enforcing them consistently.

## How to Authenticate for Testing

### Method 1: CLI Legacy Token (Recommended for Testing)

```javascript
const CLI_TOKEN = 'cli|your-email@domain.com'

const response = await fetch('http://localhost:3000/api/v3.7/games/gameId/robot-move', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${CLI_TOKEN}`
  }
})
```

### Method 2: Using the Provided Test Script

Run the authenticated test script:

```bash
cd /Users/kenr/Code/nodots-backgammon
node test-robot-move-authenticated.js
```

This script will:
1. Create a robot user
2. Create a human vs robot game
3. Set up the game state for robot turn
4. Test the robot-move endpoint with proper authentication
5. Check for the "Lover's Leap" (24→13) move with [5,6] dice

## Creating Test Users and Robots

### Creating Robot Users

```javascript
const robotData = {
  name: 'Test Robot',
  email: 'robot@test.com',
  source: 'test',
  externalId: 'robot-test-id',
  isRobot: true
}

const response = await fetch('http://localhost:3000/api/v3.7/users', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer cli|admin@nodots.com'
  },
  body: JSON.stringify(robotData)
})
```

### Default CLI User ID

When using CLI tokens, the system maps to a default user:
- **User ID**: `f25eaccd-1b88-4606-a8a3-bd95d604ecfa`
- **Email**: `kenr@nodots.com`
- **Source**: `cli`

This is defined in the auth middleware and can be used for testing.

## Required Headers for Robot-Move API

```javascript
const headers = {
  'Content-Type': 'application/json',
  'Authorization': 'Bearer cli|test@nodots.com'
}
```

## Testing the GNU Backgammon Integration

### Lover's Leap Test Scenario

The "Lover's Leap" is a classic backgammon opening move:
- **Dice**: [5, 6]
- **Move**: 24→13 (using the 6) and 24→18 (using the 5)
- **Strategic Value**: Escapes back checkers quickly

To test this:

1. Create a game with a robot player
2. Get the robot to roll [5,6] dice (may require multiple attempts)
3. Call the robot-move endpoint
4. Verify the response recommends the 24→13 move

### Expected Response Format

```json
{
  "success": true,
  "recommendedMove": {
    "checkerId": "checker-id",
    "moveDetails": {
      // Move specifics
    },
    "reasoning": "GNU Backgammon analysis",
    "gnuPositionId": "position-id",
    "gnubgMoveHint": "move hint from GNU BG",
    "gnubgInfo": {
      // Additional analysis
    }
  },
  "availableMoves": 2,
  "gameState": "active"
}
```

## Debugging Authentication Issues

### Check if Auth Middleware is Applied

The robot-move endpoint should have authentication middleware, but currently doesn't:

```typescript
// Missing from games.ts:
import { authenticateToken } from '../middleware/auth'

// Should be:
router.post('/:id/robot-move', authenticateToken, async (req, res) => {
  // endpoint logic
})
```

### Verify Token Format

CLI tokens must follow this exact format:
- Start with `cli|`
- Followed by an email address
- Example: `cli|test@nodots.com`

### Common Error Messages

1. **"No authorization header provided"**
   - Solution: Add `Authorization: Bearer <token>` header

2. **"No token provided"**
   - Solution: Ensure Bearer prefix is included

3. **"Invalid token"**
   - Solution: Use CLI token format or valid JWT

## Example Test with curl

```bash
curl -X POST \
  http://localhost:3000/api/v3.7/games/your-game-id/robot-move \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer cli|test@nodots.com"
```

## Environment Setup

Ensure your API server is running:

```bash
cd packages/api
npm start
```

The server should be accessible at `http://localhost:3000`.

## Next Steps

1. **Fix Authentication**: Add proper authentication middleware to the robot-move endpoint
2. **Test GNU Integration**: Verify GNU Backgammon AI is working correctly
3. **Validate Moves**: Ensure the AI recommends optimal moves like Lover's Leap
4. **Create E2E Tests**: Build comprehensive tests for robot move selection

## Files and Scripts

- **Test Script**: `/Users/kenr/Code/nodots-backgammon/test-robot-move-authenticated.js`
- **Auth Middleware**: `/Users/kenr/Code/nodots-backgammon/packages/api/src/middleware/auth.ts`
- **Games Router**: `/Users/kenr/Code/nodots-backgammon/packages/api/src/routes/games.ts`
- **API Client**: `/Users/kenr/Code/nodots-backgammon/packages/client/src/utils/apiClient.ts`

This guide should help you successfully authenticate and test the robot-move endpoint for GNU Backgammon integration!