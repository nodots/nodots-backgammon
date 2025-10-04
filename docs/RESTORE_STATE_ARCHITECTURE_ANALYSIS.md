# Game State Restoration Architecture Analysis

**Date:** 2025-10-04
**Author:** Architecture Review
**Status:** Proposal

## Executive Summary

This document analyzes the optimal architecture for restoring a game to a previous state in the Nodots Backgammon ecosystem. The key insight is that **CORE should handle state management, not undo logic**. The concept of "undo" is a user-facing feature that should be implemented at the API/CLIENT layer by leveraging state restoration capabilities in CORE.

## Current State Analysis

### What We Have

1. **Database Storage (API)**
   - Complete game states stored in `games` table
   - Historical action log in `game_history_actions` table with:
     - `gameStateBefore`: Complete game state before action
     - `gameStateAfter`: Complete game state after action
     - `sequenceNumber`: Sequential ordering of actions
   - `gnuPositionId`: Unique position identifier for each state

2. **CORE Implementation**
   - Current `Game.undoLastMove()` function that manipulates move states
   - No concept of "restoring to arbitrary state"
   - Tightly coupled to move-level undo logic

3. **API Layer**
   - `/undo-move` endpoint that calls `Game.undoLastMove()`
   - `GameStateReconstructor` class for reconstructing historical states
   - History tracking via queue system

4. **CLIENT Layer**
   - `useGameActions.undoMove()` hook
   - Direct REST calls to `/undo-move` endpoint

### Problems with Current Architecture

1. **Responsibility Misplacement**: CORE handles "undo" concept, which is application-level, not domain-level
2. **Limited Scope**: Can only undo last move, not restore to arbitrary points
3. **Tight Coupling**: Undo logic is intertwined with game state transitions
4. **Incomplete Restoration**: Current undo doesn't properly restore all state aspects (dice, possibleMoves, etc.)

## Proposed Architecture

### Core Principle

**CORE should be stateless and have no concept of "undo" - only state restoration.**

### Layer Responsibilities

#### CORE Layer (Domain Logic)

**Remove:**
- `Game.undoLastMove()` function
- Any undo-specific logic

**Add:**
- `Game.restoreState(gameState: BackgammonGame): BackgammonGame`
  - Accepts a complete game state
  - Validates state integrity
  - Returns a properly typed, validated game state
  - No knowledge of history or undo

**Why:** CORE represents pure game domain logic. It should know how to validate and work with game states, not how states are managed over time.

#### API Layer (State Management & Persistence)

**Responsibilities:**
1. Maintain complete history of game states
2. Provide endpoints for state restoration
3. Handle undo as "restore to previous state"
4. Enrich restored states with necessary metadata

**Implementation:**

```typescript
// New endpoint structure
POST /games/:id/restore-state
Body: { sequenceNumber: number } // Which action to restore to

// OR for simple "undo last action"
POST /games/:id/undo-last-action

// Implementation
async function restoreGameState(gameId: string, sequenceNumber: number) {
  // 1. Query history for the desired state
  const reconstructor = getGameStateReconstructor(db)
  const previousState = await reconstructor.reconstructGameState(gameId, sequenceNumber)

  if (!previousState) {
    return { success: false, error: 'State not found' }
  }

  // 2. Validate state with CORE
  const validatedState = Game.restoreState(previousState)

  // 3. Update current game in database
  await GameDb.updateGame(db, gameId, validatedState)

  // 4. Record this restoration action in history
  await recordHistoryAction(gameId, 'restore-state', {
    restoredToSequence: sequenceNumber
  })

  // 5. Return enriched state
  return {
    success: true,
    data: enrichGameResponse(validatedState)
  }
}
```

**Why:** API layer is the right place for managing state persistence and history. It can efficiently query historical states and orchestrate restoration.

#### CLIENT Layer (User Experience)

**Responsibilities:**
1. Provide user-facing "undo" functionality
2. Maintain UI state during restoration
3. Handle optimistic updates if desired

**Implementation:**

```typescript
const undoMove = useCallback(async () => {
  // Option A: Simple undo last action
  const result = await api.games.undoLastAction(gameId)

  // Option B: Undo to specific point (advanced feature)
  const result = await api.games.restoreToSequence(gameId, sequenceNumber)

  return result
}, [gameId])
```

**Why:** CLIENT translates user intent ("I want to undo") into API calls. It doesn't need to know about state restoration mechanics.

### Data Flow

```
User clicks "Undo"
  ↓
CLIENT: useGameActions.undoMove()
  ↓
API: POST /games/:id/undo-last-action
  ↓
API: Query history for previous state (sequenceNumber - 1)
  ↓
API: GameStateReconstructor.reconstructGameState()
  ↓
CORE: Game.restoreState(previousState)
  ↓
API: Update game in database
  ↓
API: Record restoration in history
  ↓
API: Return enriched state to CLIENT
  ↓
CLIENT: Update UI with restored state
```

## Pros and Cons Analysis

### Proposed Architecture Pros

1. **Separation of Concerns**
   - CORE: Pure domain logic, no temporal concerns
   - API: State management and persistence
   - CLIENT: User experience

2. **Flexibility**
   - Can restore to ANY historical point, not just previous move
   - Enables features like "view game at move 10"
   - Supports replay functionality
   - Easy to implement "redo" if needed

3. **Reliability**
   - Database is single source of truth
   - No complex state manipulation in CORE
   - Complete state stored, not computed

4. **Testability**
   - CORE validation logic is simple to test
   - API restoration logic can be tested with real database queries
   - No mock complexity

5. **Performance**
   - Database queries are fast with proper indexing
   - No complex computation needed
   - Can cache recent states if needed

6. **Auditability**
   - Every restoration is recorded in history
   - Full audit trail of all state changes
   - Can track who restored to what state

7. **Simplicity**
   - Less code in CORE
   - Clear responsibility boundaries
   - Easy to understand data flow

### Proposed Architecture Cons

1. **Database Dependency**
   - Requires database query for undo operations
   - More I/O than in-memory undo
   - **Mitigation:** Fast with proper indexing, acceptable latency

2. **Storage Requirements**
   - Stores complete game states in history
   - More database space required
   - **Mitigation:** Game states are relatively small (~10-50KB), compression possible

3. **Migration Effort**
   - Need to remove existing CORE undo logic
   - Update API endpoints
   - Update CLIENT calls
   - **Mitigation:** Clear migration path, can be done incrementally

4. **State Validation Required**
   - Must ensure stored states are valid
   - Potential for corrupted historical data
   - **Mitigation:** Validation in CORE.restoreState(), database constraints

### Current Architecture Cons

1. **Limited Functionality**
   - Only undo last move
   - Can't restore to arbitrary points
   - Can't implement replay features

2. **Complexity in Wrong Layer**
   - CORE has temporal logic
   - Difficult to test edge cases
   - Hard to extend

3. **Incomplete Restoration**
   - Current implementation has bugs with dice state
   - Difficult to ensure all state is restored correctly

4. **No Audit Trail**
   - Undo operations not recorded in history
   - Can't track who undid what

## Database Schema Considerations

### Current Schema (Already Optimal)

```sql
-- game_history_actions table
CREATE TABLE game_history_actions (
  id UUID PRIMARY KEY,
  history_id UUID REFERENCES game_histories(id),
  game_id TEXT REFERENCES games(id),
  sequence_number INTEGER NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  player_id TEXT NOT NULL,
  action_type game_action_type NOT NULL,
  action_data JSONB NOT NULL,
  game_state_before JSONB NOT NULL,  -- Complete state before action
  game_state_after JSONB NOT NULL,   -- Complete state after action
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

  UNIQUE(history_id, sequence_number)
);

-- Indexes for fast queries
CREATE INDEX idx_history_actions_sequence ON game_history_actions(history_id, sequence_number);
CREATE INDEX idx_history_actions_game_sequence ON game_history_actions(game_id, sequence_number);
```

**Perfect for state restoration:**
- `game_state_before` and `game_state_after` provide complete snapshots
- `sequence_number` enables ordered retrieval
- Indexes optimize query performance
- No schema changes needed

### Query Performance

```sql
-- Restore to previous state (undo last action)
SELECT game_state_before
FROM game_history_actions
WHERE game_id = $1
ORDER BY sequence_number DESC
LIMIT 1;

-- Restore to specific point
SELECT game_state_after
FROM game_history_actions
WHERE game_id = $1 AND sequence_number = $2;

-- Get available restore points
SELECT sequence_number, action_type, timestamp
FROM game_history_actions
WHERE game_id = $1
ORDER BY sequence_number;
```

All queries use existing indexes, millisecond performance expected.

## Implementation Recommendation

### Phase 1: API Layer Enhancement (Weeks 1-2)

1. **Add new endpoints:**
   ```typescript
   POST /games/:id/undo-last-action
   POST /games/:id/restore-to-sequence
   GET /games/:id/history/timeline
   ```

2. **Implement restoration logic:**
   - Use existing `GameStateReconstructor`
   - Add state validation
   - Record restoration actions in history

3. **Keep existing undo endpoint** for backward compatibility

### Phase 2: CORE Refactoring (Week 3)

1. **Add `Game.restoreState()`:**
   ```typescript
   static restoreState(state: BackgammonGame): BackgammonGame {
     // Validate state structure
     // Ensure type safety
     // Return validated state
     return state
   }
   ```

2. **Deprecate `Game.undoLastMove()`:**
   - Mark as deprecated
   - Keep for backward compatibility initially

### Phase 3: CLIENT Migration (Week 4)

1. **Update `useGameActions`:**
   ```typescript
   const undoMove = useCallback(async () => {
     const response = await fetch(
       `${API_URL}/games/${gameId}/undo-last-action`,
       { method: 'POST', ... }
     )
     return response.json()
   }, [gameId])
   ```

2. **Test thoroughly** with existing UI

### Phase 4: Cleanup (Week 5)

1. **Remove deprecated code:**
   - Remove `Game.undoLastMove()` from CORE
   - Remove old endpoint from API
   - Update documentation

2. **Add advanced features:**
   - Timeline viewer
   - Restore to arbitrary points
   - Replay functionality

## Advanced Features Enabled

### 1. Game Timeline Viewer
```typescript
// CLIENT
const timeline = await api.games.getTimeline(gameId)
// Display interactive timeline showing all moves
// Click any point to restore to that state
```

### 2. Move Replay
```typescript
// Replay game from start
for (const action of timeline) {
  await api.games.restoreToSequence(gameId, action.sequenceNumber)
  await delay(1000) // Animate
}
```

### 3. Branching (Future)
```typescript
// Fork game from historical point
const forkedGameId = await api.games.forkFromSequence(gameId, sequenceNumber)
// Play alternative moves from that point
```

### 4. Redo Functionality
```typescript
// Undo to sequence 10
await api.games.restoreToSequence(gameId, 10)

// Redo to sequence 12
await api.games.restoreToSequence(gameId, 12)
```

## Testing Strategy

### Unit Tests (CORE)
```typescript
describe('Game.restoreState', () => {
  it('should validate and return state', () => {
    const state = createMockGameState()
    const result = Game.restoreState(state)
    expect(result).toEqual(state)
  })

  it('should throw on invalid state', () => {
    const invalidState = { ...createMockGameState(), stateKind: 'invalid' }
    expect(() => Game.restoreState(invalidState)).toThrow()
  })
})
```

### Integration Tests (API)
```typescript
describe('State Restoration', () => {
  it('should restore to previous state', async () => {
    const game = await createGame()
    await makeMove(game.id)
    await makeMove(game.id)

    const result = await api.post(`/games/${game.id}/undo-last-action`)
    expect(result.data.stateKind).toBe('moving')
  })

  it('should restore to specific sequence', async () => {
    const game = await createGame()
    await makeMove(game.id) // seq 0
    await makeMove(game.id) // seq 1
    await makeMove(game.id) // seq 2

    const result = await api.post(`/games/${game.id}/restore-to-sequence`, {
      sequenceNumber: 1
    })

    expect(result.data).toMatchSnapshot()
  })
})
```

### E2E Tests (CLIENT)
```typescript
test('user can undo move', async () => {
  await page.click('[data-testid="checker-24"]')
  await page.click('[data-testid="undo-button"]')

  await expect(page.locator('[data-testid="board"]')).toMatchSnapshot()
})
```

## Backward Compatibility

### Transition Period

1. **Keep both endpoints** during migration:
   - `/undo-move` (deprecated) → internally calls `/undo-last-action`
   - `/undo-last-action` (new)

2. **Add deprecation warnings:**
   ```typescript
   router.post('/:id/undo-move', (req, res) => {
     logger.warn('DEPRECATED: /undo-move endpoint used, migrate to /undo-last-action')
     // Forward to new implementation
     return restoreToLastAction(req, res)
   })
   ```

3. **Version API** if needed:
   - `/api/v4.0/games/:id/undo-move` (old)
   - `/api/v5.0/games/:id/undo-last-action` (new)

## Performance Analysis

### Current Approach (In-Memory Undo)
- Latency: ~5-10ms (in-memory operation)
- Memory: Minimal
- Scalability: Good
- Reliability: Moderate (state mutation risks)

### Proposed Approach (Database Restoration)
- Latency: ~20-50ms (database query)
- Memory: Minimal
- Scalability: Excellent (stateless)
- Reliability: High (database as source of truth)

### Latency Mitigation Strategies

1. **Optimistic Updates (CLIENT):**
   ```typescript
   const undoMove = async () => {
     // Immediately update UI
     setGameState(previousState)

     // Confirm with server
     const serverState = await api.games.undoLastAction(gameId)

     // Reconcile if needed
     setGameState(serverState)
   }
   ```

2. **Caching (API):**
   ```typescript
   // Cache recent game states in Redis
   const cachedState = await redis.get(`game:${gameId}:state:${sequenceNumber}`)
   if (cachedState) return cachedState

   const state = await db.query(...)
   await redis.setex(`game:${gameId}:state:${sequenceNumber}`, 300, state)
   ```

3. **Database Optimization:**
   - Ensure indexes on `(game_id, sequence_number)`
   - Use connection pooling
   - Consider read replicas for high traffic

## Migration Checklist

### Prerequisites
- [ ] All game state history properly stored in database
- [ ] `GameStateReconstructor` tested and working
- [ ] Database indexes verified

### Implementation
- [ ] Add `Game.restoreState()` to CORE
- [ ] Add `/undo-last-action` endpoint to API
- [ ] Add `/restore-to-sequence` endpoint to API
- [ ] Update history recording to track restorations
- [ ] Write comprehensive tests

### Migration
- [ ] Update CLIENT to use new endpoints
- [ ] Test with real games
- [ ] Monitor performance metrics
- [ ] Verify no regressions

### Cleanup
- [ ] Mark `Game.undoLastMove()` as deprecated
- [ ] Update all documentation
- [ ] Remove deprecated code after grace period

## Conclusion

### Recommendation: **Adopt Proposed Architecture**

**Rationale:**

1. **Correct Abstraction:** CORE should handle domain logic, not temporal state management
2. **Database Capabilities:** We already store complete game states; leverage this investment
3. **Feature Enablement:** Unlocks timeline, replay, and restore-to-point features
4. **Maintainability:** Clear separation of concerns, easier to test and extend
5. **Reliability:** Database as single source of truth eliminates state sync issues

**Trade-offs Accepted:**

- Slightly higher latency (20-50ms vs 5-10ms) for state restoration
- Database query overhead
- Migration effort

**Rejected Alternatives:**

1. **Keep Current CORE-based Undo:** Limited functionality, conceptual misalignment
2. **Hybrid Approach:** Complexity without clear benefits
3. **Event Sourcing:** Overkill for backgammon game state management

### Next Steps

1. **Approval:** Review this analysis with team
2. **Planning:** Schedule implementation phases
3. **Prototype:** Build proof-of-concept for Phase 1
4. **Iterate:** Gather feedback, refine approach

---

**Questions or Concerns:** Please add comments or create issues for discussion.
