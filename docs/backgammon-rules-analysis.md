# Backgammon Rules Analysis: Missing and Incorrect Implementations in Nodots Backgammon

This document analyzes the current state of backgammon rule implementation in Nodots Backgammon, identifying rules that are either not implemented at all or implemented incorrectly according to official backgammon rules (referenced from https://www.bkgm.com/rules.html).

## Summary

Based on the codebase analysis, Nodots Backgammon implements the core movement mechanics correctly but lacks many standard backgammon rules and tournament features. The implementation focuses primarily on basic gameplay with some support for the doubling cube.

## Rules Correctly Implemented ✅

### Core Movement Rules
- **Basic Checker Movement**: Players move according to dice rolls from higher to lower numbered points
- **Hitting and Re-entering**: Blots can be hit and must re-enter from the bar
- **Bearing Off**: Checkers can be borne off once all are in the home board
- **Higher Die Bear-off Rule**: Can use higher die values to bear off when no checkers on higher points
- **Blocking**: Points with 2+ checkers block opponent movement

### Board Setup and Direction System
- **Dual Position Numbering**: Correctly implements clockwise/counterclockwise position system
- **Starting Position**: Standard 15 checkers per player in correct positions (2-24, 5-13, 3-8, 5-6)
- **Unified Presentation**: Frontend always shows players moving clockwise regardless of backend direction

### Basic Doubling Cube
- **Cube Initialization**: Starts at value 1 (inactive)
- **Basic Doubling**: Can offer doubles, accept/decline
- **Cube Ownership**: Tracks who owns the cube
- **Maximum Value**: Cube caps at 64

## Rules Not Implemented ❌

### Tournament and Match Rules

#### 1. **Crawford Rule** - NOT IMPLEMENTED
**What it is**: In match play, when a player reaches one point away from winning, the Crawford rule prohibits the use of the doubling cube for exactly one game.

**Current Status**: 
- Type definitions exist (`useCrawfordRule?: boolean`)
- No implementation in game logic
- Would need: Crawford game detection, cube disabling logic

#### 2. **Post-Crawford Rule** - NOT IMPLEMENTED  
**What it is**: After the Crawford game, only the trailing player may double.

**Current Status**: No implementation or logic for post-Crawford restrictions.

#### 3. **Match Length and Scoring** - PARTIALLY IMPLEMENTED
**What it is**: Matches played to a specific number of points with proper match scoring.

**Current Status**: 
- Basic game completion detection exists
- No multi-game match tracking
- No match score accumulation

### Advanced Doubling Rules

#### 4. **Jacoby Rule** - NOT IMPLEMENTED
**What it is**: In money games, gammons and backgammons count only if the cube has been turned during the game.

**Current Status**:
- Type definitions exist (`useJacobyRule?: boolean`)
- No implementation in scoring logic
- No gammon/backgammon value calculation based on cube usage

#### 5. **Beaver Rule** - NOT IMPLEMENTED
**What it is**: When offered a double, a player may "beaver" by immediately redoubling while keeping the cube.

**Current Status**:
- Type definitions exist (`useBeaverRule?: boolean`)
- No beaver logic in doubling mechanics
- Would need: Immediate redouble on double acceptance option

#### 6. **Raccoon/Holland Rules** - NOT IMPLEMENTED
**What it is**: Extensions of beaver rule allowing further immediate redoubles.

**Current Status**: Type definitions exist but no implementation.

### Game Outcome and Resignation

#### 7. **Resignation System** - NOT IMPLEMENTED
**What it is**: Players can resign games for 1, 2, or 3 points (normal, gammon, backgammon resignation).

**Current Status**:
- Type definitions exist for resignation offers
- No resign action implementation
- No resignation acceptance/decline logic
- Settings include `allowResign?: boolean` but unused

#### 8. **Gammon and Backgammon Scoring** - NOT IMPLEMENTED
**What it is**: 
- **Gammon**: Winner gets 2x points if opponent has no checkers off
- **Backgammon**: Winner gets 3x points if opponent has checkers in winner's home board or on bar

**Current Status**:
- Win detection only checks for all 15 checkers borne off
- No gammon/backgammon detection
- No score multiplier calculation

### Pip Count and Statistics

#### 9. **Pip Count Calculation** - INCOMPLETE
**What it is**: Running count of total distance all checkers must travel to bear off.

**Current Status**:
- Basic pip count infrastructure exists
- `Board.getPipCounts()` returns hardcoded values (167, 167)
- No actual pip count calculation implemented
- UI elements exist but may not display accurate values

#### 10. **Game Statistics and Timing** - PARTIALLY IMPLEMENTED
**What it is**: Detailed game statistics including move times, turn counts, cube history.

**Current Status**:
- Comprehensive type definitions exist (`BackgammonGameStatistics`, `BackgammonGameTiming`)
- No actual statistics collection implementation
- No timing enforcement or tracking

### Advanced Features

#### 11. **Automatic Play Features** - NOT IMPLEMENTED
**What it is**: Forced moves, automatic doubles on opening rolls, automatic acceptance of advantageous situations.

**Current Status**:
- No forced move detection (when only one legal move exists)
- No automatic play for obvious moves

#### 12. **Undo Functionality** - NOT IMPLEMENTED  
**What it is**: Ability to undo moves before completing turn.

**Current Status**:
- Settings include `allowUndo?: boolean`
- No undo implementation in move logic

#### 13. **Draw Offers** - NOT IMPLEMENTED
**What it is**: Players can offer draws in certain situations.

**Current Status**:
- Settings include `allowDraw?: boolean`
- No draw offer/acceptance logic

## Rules Implemented Incorrectly ⚠️

### 1. **Pip Count Display** - INCORRECT VALUES
**Issue**: `Board.getPipCounts()` returns hardcoded values instead of calculating actual pip counts.

**Fix Needed**: Implement proper pip count calculation based on checker positions.

### 2. **Game State Management** - OVERLY COMPLEX
**Issue**: The state machine has many intermediate states that don't align with standard backgammon rules.

**Standard Flow**: Roll → Move → End Turn
**Current Flow**: rolling-for-start → rolled-for-start → rolling → rolled → preparing-move → moving → moved

**Analysis**: The extra states may be UI-driven but complicate rule implementation.

## Implementation Priority Recommendations

### High Priority (Essential for Tournament Play)
1. **Gammon/Backgammon Detection and Scoring**
2. **Proper Pip Count Calculation**  
3. **Crawford Rule Implementation**
4. **Resignation System**

### Medium Priority (Important for Serious Play)
1. **Jacoby Rule**
2. **Match Play and Scoring**
3. **Forced Move Detection**
4. **Game Statistics Collection**

### Low Priority (Nice to Have)
1. **Beaver/Raccoon Rules**
2. **Undo Functionality**
3. **Automatic Play Features**
4. **Draw Offers**

## Technical Debt and Architecture Issues

### 1. **Hardcoded Values**
- Pip counts return static values (167, 167)
- Need dynamic calculation based on actual board state

### 2. **Unused Type Definitions**
- Many advanced rule flags exist in types but have no implementation
- Should either implement or remove to avoid confusion

### 3. **Rule Configuration Not Enforced**
- Game has `rules` object with various flags but they don't affect gameplay
- Need to implement rule checking in game logic

### 4. **State Machine Complexity**
- Current state machine is more complex than necessary for backgammon rules
- Consider simplifying to align with actual game flow

## Conclusion

Nodots Backgammon successfully implements the core mechanics of backgammon movement and basic doubling. However, it lacks many rules essential for serious or tournament play, particularly around game endings, match play, and advanced doubling rules. The codebase shows good architectural planning with comprehensive type definitions, but the actual rule implementations have not been completed.

The most critical missing features for competitive play are proper game outcome detection (gammons/backgammons), resignation handling, and tournament rules like Crawford rule. Implementing these would significantly enhance the platform's credibility for serious backgammon play.