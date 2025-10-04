# Set vs Array Analysis: Serialization Boundary Strategy

**Date**: 2025-10-02
**Issue**: Recurring Set/Array serialization problems across API boundaries
**Decision Required**: Keep Set in TYPES/CORE or switch to Array everywhere?

## Executive Summary

**RECOMMENDATION: Switch from Set to Array for `BackgammonMoves`**

The benefits of using Set (preventing duplicates) are outweighed by the costs of managing serialization boundaries in a multi-package architecture with multiple API boundaries (REST, WebSocket, Database JSONB, Client).

## Current State Analysis

### 1. Where Sets Are Used

**Primary Location**: `/packages/types/src/move.ts:113`
```typescript
export type BackgammonMoves = Set<BackgammonMove>
```

**Usage Statistics**:
- **CORE package**: 120+ instances of `Array.from(moves)` or Set operations
- **API package**: 3+ serialization utilities specifically for Set → Array conversion
- **CLIENT package**: 2+ transformation utilities for handling Set/Array ambiguity
- **Total files affected**: 25+ files across 4 packages

### 2. Serialization Boundaries

The Nodots Backgammon architecture has **4 major serialization boundaries**:

1. **CORE → API**: Game state returned from CORE methods
2. **API → Database**: Game state stored in PostgreSQL JSONB columns
3. **API → CLIENT**: REST API responses over HTTP
4. **API ↔ CLIENT**: WebSocket message payloads

**Current Problem**: Each boundary requires Set → Array conversion, and deserialization requires Array → Set reconstruction.

### 3. Current Serialization Utilities

#### CORE Package: `/packages/core/src/utils/serialization.ts`
- `serializeGameState()` - Converts Set to Array during JSON.stringify
- `deserializeGameState()` - Reconstructs Set from Array during JSON.parse
- `ensureMovesAreSet()` - Utility to convert Array to Set
- `ensureMovesAreArray()` - Utility to convert Set to Array

#### API Package: `/packages/api/src/utils/serialization.ts`
- `serializeActivePlayMoves()` - Converts moves Set to Array for API responses
- `serializeGameForResponse()` - Overall game serialization including moves

#### CLIENT Package: `/packages/client/src/utils/transformGameData.ts`
- `transformGameData()` - Recursive transformation handling Sets and Maps
- Special handling for `activePlay.moves` field

### 4. Known Issues and Bugs

#### Issue #158: History-Based Undo Regression
**Problem**: When game state is retrieved from database history (JSONB), the `activePlay.moves` property is an Array instead of Set. The CORE library expects Set, causing move operations to fail.

**Root Cause**: JSONB serialization converts Set to Array, but deserialization doesn't reconstruct Set.

**Impact**: Players can undo moves but cannot make new moves afterward.

#### Issue #139: Duplicate Dice Values in Moves
**Problem**: After executing a move, remaining moves had duplicate die values instead of using remaining unused dice.

**Root Cause**: Move recalculation logic didn't properly track which dice were consumed. Set would have prevented duplicate moves objects, but not duplicate die value assignments.

**Conclusion**: Set does NOT prevent this type of duplicate - it prevents duplicate move *objects*, not duplicate *die values*.

## Benefits Analysis

### Benefits of Set (Current Approach)

1. **Theoretical Duplicate Prevention**: Set automatically prevents duplicate move objects
2. **Mathematical Correctness**: Semantically, a set of moves is mathematically accurate
3. **Type System Enforcement**: TypeScript knows moves is a Set at compile time

### Benefits of Array (Proposed Approach)

1. **No Serialization Complexity**: JSON.stringify/parse work natively
2. **Direct Database Storage**: JSONB stores arrays naturally
3. **Universal Compatibility**: All JavaScript APIs expect arrays
4. **Reduced Code Maintenance**: Remove 100+ `Array.from()` calls
5. **Performance**: No Set construction/conversion overhead
6. **Debugging**: Arrays are easier to inspect in logs and devtools
7. **Fewer Bugs**: Eliminates entire class of serialization bugs

## Cost Analysis

### Costs of Set (Current Approach)

1. **Serialization Overhead**:
   - 4 major serialization boundaries
   - Custom serialization code in 3 packages
   - ~150+ lines of serialization utility code

2. **Runtime Performance**:
   - Set construction overhead
   - `Array.from()` calls everywhere
   - Double conversion: Set → Array → Set

3. **Developer Cognitive Load**:
   - Must remember to convert at boundaries
   - Ambiguous types (is this moves Set or Array?)
   - Bug investigations when conversion is missed

4. **Bug Risk**:
   - Forgot to convert → runtime errors
   - Converted in wrong direction → type errors
   - Partial conversion → state corruption

5. **Code Maintainability**:
   - Serialization utilities must be maintained
   - All new API endpoints must remember conversion
   - All new storage methods must handle conversion

### Costs of Array (Proposed Approach)

1. **Duplicate Prevention**: Must implement manual duplicate checking
2. **Type System**: Less semantically precise (Set vs Array of unique items)
3. **Migration Effort**: Update types, CORE logic, tests

## Duplicate Prevention Analysis

### Does Set Actually Prevent Our Duplicates?

**Critical Finding**: The duplicate issues we've experienced are NOT prevented by Set:

1. **Issue #139**: Duplicate *die values* in moves, not duplicate *move objects*
   - Set prevents: `[moveA, moveA]` (same object twice)
   - Set DOES NOT prevent: `[{dieValue: 5}, {dieValue: 5}]` (different objects, same value)

2. **Actual Duplicate Risk**: Move objects are created with unique UUIDs
   - Each move has `id: generateId()`
   - Identical move parameters create different objects
   - Set equality is by reference, not by move semantics

**Conclusion**: Set provides NO practical duplicate prevention for our use case.

### How Many Duplicates Have We Actually Seen?

**Answer**: Zero duplicates that Set would have prevented.

All bugs have been:
- Duplicate die *values* (not prevented by Set)
- Stale move data (not prevented by Set)
- Serialization issues (CAUSED by Set)

## Architectural Considerations

### Package Boundaries

```
┌─────────────────┐
│     TYPES       │  ← Type definitions (Set or Array?)
└────────┬────────┘
         │
    ┌────▼────┐
    │  CORE   │  ← Game logic (Set or Array?)
    └────┬────┘
         │
    ┌────▼────┐
    │   API   │  ← Serialization boundary #1, #2, #3
    └────┬────┘
         │
    ┌────▼────┐
    │ CLIENT  │  ← Serialization boundary #4
    └─────────┘
```

### Serialization Boundary Best Practices

**Industry Standard**: Use JSON-compatible types at API boundaries

**Anti-pattern**: Pass non-serializable types (Set, Map, Date) across boundaries

**Best Practice**:
- Domain layer (CORE): Can use any types
- API layer: Convert to JSON-compatible types
- Client layer: Receive JSON-compatible types

**Problem**: Our CORE returns game state directly to API, which returns it to CLIENT. Set leaks through all layers.

## Alternative Solutions

### Option 1: Keep Set, Fix Serialization (Current Approach)

**Implementation**:
1. Add deserialization to ALL boundaries
2. Create `reconstructGameState()` utility
3. Call after every database read
4. Call after every API response
5. Call after every WebSocket message

**Pros**:
- Keep theoretical Set benefits
- No migration needed

**Cons**:
- Complex implementation
- Easy to forget
- High maintenance burden
- Still have serialization bugs

### Option 2: Switch to Array (RECOMMENDED)

**Implementation**:
1. Change TYPES: `export type BackgammonMoves = BackgammonMove[]`
2. Update CORE: Remove Set construction, use arrays
3. Update API: Remove serialization utilities
4. Update CLIENT: Remove transformation utilities
5. Add duplicate checking where needed (if any)

**Pros**:
- Eliminate serialization complexity
- Remove 150+ lines of utility code
- Remove entire class of bugs
- Improve performance
- Simplify codebase

**Cons**:
- Migration effort (estimated 2-4 hours)
- Must add manual duplicate checks (if needed)
- Less semantically precise type

### Option 3: Hybrid Approach

**Implementation**:
1. Keep Set in CORE for internal operations
2. Convert to Array at CORE API boundary
3. Never pass Set outside CORE package

**Pros**:
- CORE keeps Set benefits
- External packages use Arrays
- Clear serialization boundary

**Cons**:
- Still need conversion utilities
- CORE API returns different type than internal type
- Type confusion at boundary

## Recommendation

**SWITCH TO ARRAY** (Option 2)

### Rationale

1. **Set provides no practical benefit** - duplicates we've seen are not prevented by Set
2. **Set causes significant costs** - serialization complexity, bugs, maintenance
3. **Array is the JavaScript/JSON standard** - no impedance mismatch
4. **Migration is straightforward** - type change + remove conversions
5. **Future-proof** - no serialization issues going forward

### Migration Plan

#### Phase 1: Update Types (5 minutes)
```typescript
// packages/types/src/move.ts
export type BackgammonMoves = BackgammonMove[]  // Changed from Set
```

#### Phase 2: Update CORE (30-60 minutes)
1. Find all `new Set()` for moves → use `[]`
2. Find all `Array.from(moves)` → use `moves` directly
3. Find all `moves.size` → use `moves.length`
4. Find all `moves.has()` → use `moves.find()`
5. Find all `moves.add()` → use `moves.push()`
6. Update tests

#### Phase 3: Update API (15 minutes)
1. Remove `serializeActivePlayMoves()`
2. Update `serializeGameForResponse()` to remove Set handling
3. Remove Set-related comments

#### Phase 4: Update CLIENT (15 minutes)
1. Remove `transformGameData()` Set handling
2. Remove Set-related type guards

#### Phase 5: Testing (30 minutes)
1. Run CORE tests
2. Run API tests
3. Run E2E tests
4. Manual testing of undo functionality

**Total Estimated Time**: 2-3 hours

### Duplicate Prevention Strategy

If we need to prevent duplicates (which we haven't needed so far):

```typescript
// Helper function (if needed)
function addUniqueMove(moves: BackgammonMove[], move: BackgammonMove): BackgammonMove[] {
  const isDuplicate = moves.some(m => m.id === move.id)
  return isDuplicate ? moves : [...moves, move]
}
```

**Usage**: Only use if we actually find duplicate bugs (we haven't so far).

## Decision Criteria

| Criteria | Set (Current) | Array (Proposed) | Winner |
|----------|---------------|------------------|--------|
| Serialization Complexity | High (4 boundaries) | None | Array ✅ |
| Code Maintenance | High (150+ LOC) | Low | Array ✅ |
| Bug Risk | High (serialization) | Low | Array ✅ |
| Performance | Lower (conversions) | Higher | Array ✅ |
| Duplicate Prevention | No benefit | Same | Tie |
| Type Precision | Slightly better | Good enough | Tie |
| Migration Effort | N/A | 2-3 hours | Set ✅ |

**Score**: Array wins 5-1-1

## Conclusion

**Decision: Migrate from Set to Array for BackgammonMoves**

The serialization complexity and bug risk of using Set outweigh any theoretical benefits. Array is the standard, compatible, and sufficient solution for our use case.

## Next Steps

1. ✅ Get stakeholder approval on this analysis
2. ⬜ Create GitHub issue for migration
3. ⬜ Create feature branch: `feat/array-moves-migration`
4. ⬜ Execute migration plan (Phases 1-5)
5. ⬜ Create PR with before/after comparison
6. ⬜ Update documentation (CLAUDE.md rules)
7. ⬜ Close related serialization issues

## References

- Issue #158: History-based undo regression (Set serialization bug)
- Issue #139: Duplicate dice values (NOT prevented by Set)
- TYPES package: `/packages/types/src/move.ts:113`
- CORE serialization: `/packages/core/src/utils/serialization.ts`
- API serialization: `/packages/api/src/utils/serialization.ts`
- CLIENT transformation: `/packages/client/src/utils/transformGameData.ts`
