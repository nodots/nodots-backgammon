# API Version Analysis: GNU vs Nodots Simulation Routes

## Overview

This document analyzes the current API state and identifies missing routes needed for the GNU vs Nodots live simulation feature described in `goals-20250713.md`.

## API Version Confusion

### Current State
There are **two different API versions** being used in the codebase:

1. **API v1** (`/api/v1/`) - Used in most scripts and documentation
   - Port: `http://localhost:3000`
   - Used in: `API_TESTING_GUIDE.md`, `WORKING_FEATURES.md`, most scripts in `/scripts/`

2. **API v3.2** (`/api/v3.2/`) - Used in newer simulation scripts
   - Port: `https://localhost:3443` (HTTPS)
   - Used in: `test-robot-vs-robot-api.js`, `create-robots-then-simulate.js`

### Key Differences

**API v1 (Port 3000, HTTP):**
```bash
# Current documented routes
GET  /api/v1/users
POST /api/v1/users  
GET  /api/v1/games/:id
POST /api/v1/games
POST /api/v1/games/:id/roll
POST /api/v1/games/:id/move
GET  /api/v1/games/:id/possible-moves
```

**API v3.2 (Port 3443, HTTPS):**
```bash
# Newer routes with simulation support
GET  /api/v3.2/health
GET  /api/v3.2/users
POST /api/v3.2/users
POST /api/v3.2/games
POST /api/v3.2/games/:id/roll-for-start
POST /api/v3.2/robots/simulations
GET  /api/v3.2/robots/simulations/:id
```

## Missing Routes Analysis (Corrected for v3.2)

Based on the v3.2 API that's actually being used for simulations, here are the **missing routes** needed for the GNU vs Nodots feature:

### Already Available in v3.2:
- ✅ `POST /api/v3.2/robots/simulations` - Create robot simulation
- ✅ `GET /api/v3.2/robots/simulations/:id` - Get simulation status
- ✅ `POST /api/v3.2/games/:id/roll-for-start` - Roll for start

### Missing Routes for GNU vs Nodots:

#### 1. **GNU vs Nodots Specific Route**
```typescript
POST /api/v3.2/simulations/gnu-vs-nodots
{
  "speed": "slow" | "normal" | "fast",
  "autoStart": boolean
}

Response:
{
  "simulationId": "uuid",
  "gameId": "uuid", 
  "status": "created" | "in-progress" | "completed",
  "players": {
    "gnu": { "id": "uuid", "name": "GNU AI", "type": "gnubg" },
    "nodots": { "id": "uuid", "name": "Nodots AI", "type": "nodots" }
  }
}
```

#### 2. **Real-time Updates**
```typescript
// WebSocket for live viewing
WS /api/v3.2/games/:gameId/stream

// Or Server-Sent Events
GET /api/v3.2/games/:gameId/events

// Event types:
{
  "type": "move" | "roll" | "state-change" | "game-complete",
  "data": {
    "gameId": "uuid",
    "move": { /* move data */ },
    "timestamp": "2025-01-13T..."
  }
}
```

#### 3. **Simulation Control**
```typescript
PATCH /api/v3.2/robots/simulations/:id
{
  "status": "paused" | "resumed" | "stopped"
}

Response:
{
  "simulationId": "uuid",
  "status": "paused" | "running" | "completed" | "error",
  "moveCount": 15,
  "currentPlayer": "white" | "black"
}
```

#### 4. **Game History & Analytics**
```typescript
GET /api/v3.2/games/:gameId/moves
Response: Array of all moves made in the game

GET /api/v3.2/games/:gameId/history
Response: Complete game history with timestamps

GET /api/v3.2/simulations/:id/stats
Response: Simulation statistics and performance metrics
```

## Implementation Priority

### Phase 1 (Critical for MVP)
1. **POST /api/v3.2/simulations/gnu-vs-nodots** - Create simulation
2. **WebSocket /api/v3.2/games/:id/stream** - Real-time updates
3. **GET /api/v3.2/games/:id/moves** - Move history

### Phase 2 (Enhanced Experience)
1. **PATCH /api/v3.2/robots/simulations/:id** - Pause/resume control
2. **GET /api/v3.2/simulations/:id/stats** - Statistics
3. **GET /api/v3.2/games/:id/history** - Complete history

## Technical Considerations

### API Version Update
- **Current**: Mixed v1/v3.2 usage causing confusion
- **Recommendation**: Standardize on v3.2 for all new development
- **Migration**: Update documentation and scripts to use v3.2

### HTTPS Requirement
- **Current**: v3.2 uses HTTPS on port 3443
- **SSL**: Development certificates must be handled (currently using `rejectUnauthorized: false`)
- **Production**: Proper SSL certificate management needed

### Authentication Requirements
- **User authentication** - Track who created simulations
- **Rate limiting** - Prevent abuse of simulation creation
- **Authorization** - Control who can create/manage simulations

## Frontend Integration

### API Client Updates
The frontend needs to be updated to use the v3.2 API:

```typescript
// Update API base URL
const API_BASE = 'https://localhost:3443/api/v3.2'

// Add simulation-specific methods
const api = {
  simulations: {
    createGnuVsNodots: (options) => 
      fetch(`${API_BASE}/simulations/gnu-vs-nodots`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options)
      }),
    
    getStatus: (simulationId) =>
      fetch(`${API_BASE}/robots/simulations/${simulationId}`),
      
    pause: (simulationId) =>
      fetch(`${API_BASE}/robots/simulations/${simulationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'paused' })
      })
  },
  
  games: {
    getStream: (gameId) => 
      new WebSocket(`wss://localhost:3443/api/v3.2/games/${gameId}/stream`),
      
    getMoves: (gameId) =>
      fetch(`${API_BASE}/games/${gameId}/moves`)
  }
}
```

### Real-time Updates Implementation
```typescript
// Frontend WebSocket connection
const gameStream = api.games.getStream(gameId)

gameStream.onmessage = (event) => {
  const update = JSON.parse(event.data)
  
  switch (update.type) {
    case 'move':
      updateBoardWithMove(update.data.move)
      break
    case 'roll':
      updateDiceDisplay(update.data.dice)
      break
    case 'state-change':
      updateGameState(update.data.state)
      break
    case 'game-complete':
      showGameResults(update.data.winner)
      break
  }
}
```

## Success Criteria Verification

### Functional Testing
- [ ] User can log in successfully
- [ ] User is redirected to home page after login
- [ ] "Show GNU vs Nodots Simulation" button is visible and functional
- [ ] Clicking button creates simulation through v3.2 API
- [ ] User is redirected to simulation page
- [ ] Standard Nodots backgammon board is displayed
- [ ] Checkers move in real-time via WebSocket updates
- [ ] Simulation completes successfully

### Technical Testing
- [ ] All v3.2 API endpoints return proper responses
- [ ] WebSocket connection provides real-time game updates
- [ ] Board animations are smooth and responsive
- [ ] Error handling works for network failures
- [ ] Memory leaks are prevented (cleanup of WebSocket connections)
- [ ] Performance meets requirements (real-time updates)

## Risk Mitigation

### Technical Risks
- **API Version Confusion**: Standardize on v3.2 and update all documentation
- **WebSocket Reliability**: Implement reconnection logic and fallback to polling
- **SSL Certificate Issues**: Handle development certificates properly
- **Performance**: Monitor WebSocket message frequency and optimize

### User Experience Risks
- **Slow Loading**: Implement progressive loading and clear feedback
- **Connection Issues**: Provide fallback to polling if WebSocket fails
- **Confusing Interface**: Ensure clear indication of which AI is moving

## Dependencies

### Required Packages
- Existing `@nodots-llc/backgammon-types` for type safety
- Existing `@nodots-llc/backgammon-core` for game logic
- WebSocket support for real-time updates
- SSL certificate handling for HTTPS

### External Dependencies
- HTTPS certificates for local development
- WebSocket server implementation
- Proper SSL certificate management

## Conclusion

The main missing piece for the GNU vs Nodots feature is **real-time streaming capability**. The v3.2 API already supports robot simulations, but lacks the WebSocket/SSE infrastructure needed for live browser viewing.

**Recommendation**: Build the real-time streaming layer on top of the existing v3.2 simulation infrastructure, rather than creating a completely new API version.

---

**Document Version**: 1.0  
**Last Updated**: 2025-01-13  
**Author**: AI Assistant  
**Status**: Ready for Implementation