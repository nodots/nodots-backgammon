# Bearing-Off Bug Report

## Bug Summary
**Critical bearing-off validation bug allows illegal moves that violate fundamental backgammon rules.**

Game ID: `11d09d20-4f3f-4d8c-9f52-6137bfb2ceb1`  
Sequences: 102-104 (after dice roll [3,3])

## The Problem
White player made 3 illegal moves from position 6 using die value 3, when bearing-off rules require:
- Position 6 can only be used with die value 6 (or higher if no checkers on higher positions)
- Die value 3 can only be used from position 3 (or lower positions if 3 is empty)

## Board State When Bug Occurred
**Before sequences 102-104:**
- Position 3: 1 white checker  
- Position 4: 3 white checkers
- Position 5: 2 white checkers  
- Position 6: 3 white checkers
- Dice roll: [3,3] (doubles = 4 moves with die value 3)

**Invalid moves made:**
1. Sequence 102: Position 6 → Position 3 (die value 3) ❌ ILLEGAL
2. Sequence 103: Position 6 → Position 3 (die value 3) ❌ ILLEGAL  
3. Sequence 104: Position 6 → Position 3 (die value 3) ❌ ILLEGAL
4. Sequence 105: Position 3 → Off (die value 3) ✅ Legal

## Root Cause Analysis

### Location: `/packages/core/src/Move/index.ts`

**Lines 702-707:** `determineMoveKind()` method
```typescript
if (
  origin.kind === 'point' &&
  Move.canBearOff(origin as BackgammonPoint, player, board)
) {
  return 'bear-off'
}
```

**Lines 720-757:** `canBearOff()` method - Only checks if bearing-off is generally possible but **missing die value validation**.

### The Bug
1. `canBearOff()` only validates that all checkers are in home board
2. It does NOT validate that the specific `dieValue` can legally be used from the specific position
3. Move generation incorrectly allows bearing-off moves for any die value from any home board position

### Missing Validation
The `canBearOff()` method should include:
```typescript
// MISSING: Check if dieValue can be used from this position
const pointPosition = point.position[player.direction]
if (dieValue < pointPosition) {
  // Cannot use smaller die value from higher position
  return false
}
if (dieValue > pointPosition) {
  // Can only use higher die value if no checkers on higher positions
  const hasCheckerOnHigher = /* check logic */
  if (hasCheckerOnHigher) {
    return false
  }
}
```

## Correct Bearing-Off Rules
1. **Exact match**: Bear off from position N with die value N
2. **Higher die**: Bear off from position N with die value > N **only if** no checkers on positions > N  
3. **Lower die**: **NEVER** bear off from position N with die value < N

## Fix Required

### Option 1: Fix `canBearOff()` method
Add `dieValue` parameter and validate die-to-position compatibility:
```typescript
private static canBearOff = function canBearOff(
  point: BackgammonPoint,
  player: BackgammonPlayer,
  board: BackgammonBoard,
  dieValue: BackgammonDieValue  // ADD THIS PARAMETER
): boolean {
  // ... existing validation ...
  
  // ADD: Die value validation
  const pointPosition = point.position[player.direction]
  if (dieValue < pointPosition) {
    return false  // Cannot use smaller die from higher position
  }
  if (dieValue > pointPosition) {
    // Check if higher positions are empty
    const hasCheckerOnHigher = board.points.some(p => 
      p.position[player.direction] > pointPosition &&
      p.checkers.some(c => c.color === player.color)
    )
    if (hasCheckerOnHigher) {
      return false
    }
  }
  return true
}
```

### Option 2: Add validation in `determineMoveKind()`
Add die value check before calling `canBearOff()`.

## Impact Assessment
- **Severity**: Critical - Breaks fundamental game rules
- **Affected**: All bearing-off scenarios where players have multiple positions occupied
- **User Impact**: Allows cheating, unfair advantage, invalid game states
- **Tournament Impact**: Invalid game results, compromised competitive integrity

## Test Case Needed
Create test that verifies:
1. Position 6 with die value 3 is rejected when positions 4,5 have checkers
2. Position 6 with die value 6 is allowed  
3. Position 3 with die value 6 is allowed only if positions 4,5,6 are empty
4. All combinations of positions and die values follow correct bearing-off rules

## Priority: URGENT
This bug allows illegal moves that fundamentally break backgammon rules and must be fixed immediately.