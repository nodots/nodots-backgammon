# Stuck Game Detection and Incident Reporting System

## Technical Specification v1.0

**Document Status**: Draft  
**Date**: January 2025  
**Author**: Engineering Team  
**System**: Nodots Backgammon

---

## Executive Summary

This document outlines a comprehensive system for automatically detecting stuck game states in the Nodots Backgammon application and generating detailed incident reports for operational monitoring and debugging. The system addresses critical game flow interruptions that prevent players from completing turns or progressing through normal game states.

## 1. Problem Statement

### 1.1 Identified Stuck Game Patterns

Based on production analysis, we have identified three primary stuck game patterns:

#### Pattern A: Orphaned Move State
- **Symptoms**: Game in `moving` state with incomplete activePlay moves referencing non-existent checkers
- **Root Cause**: State desynchronization between CORE game logic and activePlay structure
- **Impact**: Players cannot complete their turn or transition to next player

#### Pattern B: Validation Mismatch
- **Symptoms**: Valid moves exist but client receives "No legal moves available" errors
- **Root Cause**: Mismatch between client checker selection and server possibleMoves validation
- **Impact**: Players cannot execute valid moves despite dice roll

#### Pattern C: State Transition Failure
- **Symptoms**: Game remains in transitional state (e.g., `moving`) after all moves completed
- **Root Cause**: Failed state machine transition logic or race conditions
- **Impact**: Turn cannot be confirmed, game cannot progress

### 1.2 Business Impact

- **Player Experience**: Frustration, game abandonment, negative reviews
- **Support Load**: Increased tickets requiring manual intervention
- **Data Integrity**: Potential for corrupted game states in database
- **Competitive Impact**: Players lose trust in platform reliability

## 2. Detection System Architecture

### 2.1 Real-time Detection Engine

```typescript
interface StuckGameDetector {
  // Core detection methods
  detectOrphanedMoves(game: BackgammonGame): DetectionResult;
  detectValidationMismatch(game: BackgammonGame): DetectionResult;
  detectStateTransitionFailure(game: BackgammonGame): DetectionResult;
  
  // Composite detection
  performFullScan(game: BackgammonGame): StuckGameReport;
}

interface DetectionResult {
  detected: boolean;
  pattern: StuckGamePattern;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  confidence: number; // 0.0 to 1.0
  evidence: Evidence[];
  suggestedFix?: AutoFixStrategy;
}
```

### 2.2 Detection Algorithms

#### Algorithm 1: Orphaned Move Detection

```typescript
function detectOrphanedMoves(game: BackgammonGame): DetectionResult {
  if (game.state.kind !== 'moving') {
    return { detected: false, pattern: 'NONE', severity: 'LOW', confidence: 0 };
  }

  const orphanedMoves: Move[] = [];
  
  for (const move of game.activePlay?.moves || []) {
    if (move.origin && !move.checker) {
      // Check if origin point has any checkers
      const originPoint = game.board.points.find(
        p => p.position[game.activePlayer.direction] === move.origin
      );
      
      const hasCheckersAtOrigin = originPoint?.checkers.some(
        c => c.playerId === game.activePlayer.id
      );
      
      if (!hasCheckersAtOrigin) {
        orphanedMoves.push(move);
      }
    }
  }
  
  if (orphanedMoves.length > 0) {
    return {
      detected: true,
      pattern: 'ORPHANED_MOVE_STATE',
      severity: 'CRITICAL',
      confidence: 1.0,
      evidence: orphanedMoves.map(m => ({
        type: 'ORPHANED_MOVE',
        data: {
          moveId: m.id,
          origin: m.origin,
          expectedChecker: m.checker,
          actualCheckersAtOrigin: 0
        }
      })),
      suggestedFix: 'REBUILD_ACTIVE_PLAY'
    };
  }
  
  return { detected: false, pattern: 'NONE', severity: 'LOW', confidence: 0 };
}
```

#### Algorithm 2: Validation Mismatch Detection

```typescript
function detectValidationMismatch(game: BackgammonGame): DetectionResult {
  if (game.state.kind !== 'rolled' || !game.activePlay) {
    return { detected: false, pattern: 'NONE', severity: 'LOW', confidence: 0 };
  }

  const mismatches: ValidationMismatch[] = [];
  
  // Get all player's checkers
  const playerCheckers = getAllPlayerCheckers(game, game.activePlayer.id);
  
  // Get all possible move origins
  const possibleOrigins = new Set<number>();
  for (const move of game.activePlay.moves) {
    for (const possibleMove of move.possibleMoves || []) {
      possibleOrigins.add(possibleMove.origin);
    }
  }
  
  // Check for checkers that should be movable but aren't in possibleMoves
  for (const checker of playerCheckers) {
    const checkerPosition = getCheckerPosition(game, checker.id);
    if (checkerPosition && !possibleOrigins.has(checkerPosition)) {
      // Verify this checker SHOULD be movable given the dice
      if (canCheckerMoveWithDice(game, checker, game.dice)) {
        mismatches.push({
          checkerId: checker.id,
          position: checkerPosition,
          reason: 'CHECKER_NOT_IN_POSSIBLE_MOVES'
        });
      }
    }
  }
  
  if (mismatches.length > 0) {
    return {
      detected: true,
      pattern: 'VALIDATION_MISMATCH',
      severity: 'HIGH',
      confidence: 0.9,
      evidence: mismatches.map(m => ({
        type: 'VALIDATION_MISMATCH',
        data: m
      })),
      suggestedFix: 'RECALCULATE_POSSIBLE_MOVES'
    };
  }
  
  return { detected: false, pattern: 'NONE', severity: 'LOW', confidence: 0 };
}
```

#### Algorithm 3: State Transition Failure Detection

```typescript
function detectStateTransitionFailure(game: BackgammonGame): DetectionResult {
  const stuckDuration = Date.now() - new Date(game.lastModified).getTime();
  const STUCK_THRESHOLD_MS = 30000; // 30 seconds
  
  // Check for stuck in moving state with all moves completed
  if (game.state.kind === 'moving' && game.activePlay) {
    const allMovesCompleted = game.activePlay.moves.every(m => m.checker !== null);
    
    if (allMovesCompleted && stuckDuration > STUCK_THRESHOLD_MS) {
      return {
        detected: true,
        pattern: 'STATE_TRANSITION_FAILURE',
        severity: 'HIGH',
        confidence: 0.95,
        evidence: [{
          type: 'STUCK_STATE',
          data: {
            currentState: 'moving',
            expectedState: 'moved',
            allMovesCompleted: true,
            stuckDurationMs: stuckDuration
          }
        }],
        suggestedFix: 'FORCE_STATE_TRANSITION'
      };
    }
  }
  
  // Check for stuck in rolled state with no possible moves
  if (game.state.kind === 'rolled' && game.activePlay) {
    const hasPossibleMoves = game.activePlay.moves.some(
      m => m.possibleMoves && m.possibleMoves.length > 0
    );
    
    if (!hasPossibleMoves && stuckDuration > STUCK_THRESHOLD_MS) {
      return {
        detected: true,
        pattern: 'NO_VALID_MOVES_STUCK',
        severity: 'MEDIUM',
        confidence: 0.85,
        evidence: [{
          type: 'NO_MOVES_AVAILABLE',
          data: {
            dice: game.dice,
            playerPosition: getPlayerBoardPosition(game, game.activePlayer.id),
            stuckDurationMs: stuckDuration
          }
        }],
        suggestedFix: 'SKIP_TURN'
      };
    }
  }
  
  return { detected: false, pattern: 'NONE', severity: 'LOW', confidence: 0 };
}
```

### 2.3 Monitoring Integration

```typescript
class StuckGameMonitor {
  private readonly SCAN_INTERVAL_MS = 10000; // 10 seconds
  private readonly detector: StuckGameDetector;
  private readonly incidentReporter: IncidentReporter;
  
  async performScheduledScan(): Promise<void> {
    const activeGames = await this.gameRepository.findActiveGames();
    
    for (const game of activeGames) {
      const report = this.detector.performFullScan(game);
      
      if (report.hasIssues()) {
        // Generate and submit incident report
        const incident = await this.incidentReporter.createIncident(report);
        
        // Attempt auto-fix if confidence is high
        if (report.confidence > 0.9 && report.suggestedFix) {
          await this.attemptAutoFix(game, report.suggestedFix);
        }
        
        // Alert operations team for critical issues
        if (report.severity === 'CRITICAL') {
          await this.alertOpsTeam(incident);
        }
      }
    }
  }
}
```

## 3. Incident Report Format

### 3.1 Incident Report Structure

```typescript
interface IncidentReport {
  // Identification
  incidentId: string;
  timestamp: Date;
  gameId: string;
  players: PlayerInfo[];
  
  // Detection Results
  detectionPattern: StuckGamePattern;
  severity: Severity;
  confidence: number;
  
  // Game State Snapshot
  gameStateSnapshot: {
    state: GameStateKind;
    activePlayer: string;
    dice: number[];
    moveCount: number;
    turnNumber: number;
    lastActivityTime: Date;
  };
  
  // Technical Details
  technicalDetails: {
    activePlayState: ActivePlaySnapshot;
    boardState: BoardSnapshot;
    validationErrors: ValidationError[];
    stateTransitionHistory: StateTransition[];
  };
  
  // Evidence and Diagnostics
  evidence: Evidence[];
  stackTrace?: string;
  relatedLogs: LogEntry[];
  
  // Resolution
  suggestedFix: AutoFixStrategy;
  autoFixAttempted: boolean;
  autoFixResult?: FixResult;
  manualInterventionRequired: boolean;
  
  // Metadata
  environment: 'development' | 'staging' | 'production';
  apiVersion: string;
  coreVersion: string;
  clientVersion?: string;
}
```

### 3.2 Sample Incident Report

```json
{
  "incidentId": "INC-2025-01-06-001",
  "timestamp": "2025-01-06T16:43:59.569Z",
  "gameId": "2d0eeec9-2f35-4ed3-837c-637642dc1064",
  "players": [
    {
      "id": "4008dfc4-0a45-4b06-bac5-a2a2c40496c7",
      "nickname": "BlackPlayer",
      "type": "human",
      "connectionStatus": "connected"
    },
    {
      "id": "robot-123",
      "nickname": "WhiteRobot",
      "type": "robot",
      "connectionStatus": "active"
    }
  ],
  
  "detectionPattern": "ORPHANED_MOVE_STATE",
  "severity": "CRITICAL",
  "confidence": 1.0,
  
  "gameStateSnapshot": {
    "state": "moving",
    "activePlayer": "4008dfc4-0a45-4b06-bac5-a2a2c40496c7",
    "dice": [5, 1],
    "moveCount": 1,
    "turnNumber": 24,
    "lastActivityTime": "2025-01-06T16:43:30.000Z"
  },
  
  "technicalDetails": {
    "activePlayState": {
      "moves": [
        {
          "id": "move-1",
          "origin": 6,
          "destination": "off",
          "dieValue": 6,
          "checker": "checker-abc"
        },
        {
          "id": "move-2",
          "origin": 5,
          "destination": "off",
          "dieValue": 5,
          "checker": null
        }
      ],
      "possibleMoves": []
    },
    "boardState": {
      "point5CheckerCount": 0,
      "point6CheckerCount": 0,
      "barCheckers": [],
      "bearOffCount": { "black": 14, "white": 11 }
    },
    "validationErrors": [
      {
        "code": "NO_CHECKER_AT_ORIGIN",
        "message": "No checker found at origin point 5",
        "timestamp": "2025-01-06T16:43:59.569Z"
      }
    ]
  },
  
  "evidence": [
    {
      "type": "ORPHANED_MOVE",
      "data": {
        "moveId": "move-2",
        "origin": 5,
        "expectedChecker": null,
        "actualCheckersAtOrigin": 0
      }
    }
  ],
  
  "suggestedFix": "REBUILD_ACTIVE_PLAY",
  "autoFixAttempted": false,
  "manualInterventionRequired": true,
  
  "environment": "production",
  "apiVersion": "1.0.0",
  "coreVersion": "3.7.0",
  "clientVersion": "2.1.0"
}
```

## 4. Auto-Recovery Strategies

### 4.1 Fix Strategy Implementation

```typescript
enum AutoFixStrategy {
  REBUILD_ACTIVE_PLAY = 'REBUILD_ACTIVE_PLAY',
  RECALCULATE_POSSIBLE_MOVES = 'RECALCULATE_POSSIBLE_MOVES',
  FORCE_STATE_TRANSITION = 'FORCE_STATE_TRANSITION',
  SKIP_TURN = 'SKIP_TURN',
  RESET_TO_LAST_VALID_STATE = 'RESET_TO_LAST_VALID_STATE',
  NONE = 'NONE'
}

class AutoFixService {
  async applyFix(
    game: BackgammonGame,
    strategy: AutoFixStrategy
  ): Promise<FixResult> {
    switch (strategy) {
      case AutoFixStrategy.REBUILD_ACTIVE_PLAY:
        return this.rebuildActivePlay(game);
        
      case AutoFixStrategy.RECALCULATE_POSSIBLE_MOVES:
        return this.recalculatePossibleMoves(game);
        
      case AutoFixStrategy.FORCE_STATE_TRANSITION:
        return this.forceStateTransition(game);
        
      case AutoFixStrategy.SKIP_TURN:
        return this.skipCurrentTurn(game);
        
      case AutoFixStrategy.RESET_TO_LAST_VALID_STATE:
        return this.resetToLastValidState(game);
        
      default:
        return { success: false, reason: 'No fix available' };
    }
  }
  
  private async rebuildActivePlay(game: BackgammonGame): Promise<FixResult> {
    try {
      // Clear current activePlay
      game.activePlay = null;
      
      // Regenerate based on current dice and board state
      const newActivePlay = generateActivePlay(game, game.dice);
      game.activePlay = newActivePlay;
      
      // Save to database
      await this.gameRepository.save(game);
      
      // Notify connected clients
      await this.notifyClients(game.id, 'ACTIVE_PLAY_REBUILT');
      
      return {
        success: true,
        strategy: 'REBUILD_ACTIVE_PLAY',
        details: 'Successfully rebuilt activePlay structure'
      };
    } catch (error) {
      return {
        success: false,
        reason: error.message,
        error
      };
    }
  }
}
```

## 5. Implementation Roadmap

### Phase 1: Detection (Week 1-2)
- Implement core detection algorithms
- Add detection hooks to WebSocket handlers
- Create detection test suite

### Phase 2: Reporting (Week 3)
- Build incident report generation
- Implement report storage and indexing
- Create incident dashboard UI

### Phase 3: Auto-Recovery (Week 4-5)
- Implement safe auto-fix strategies
- Add fix confirmation mechanisms
- Create rollback capabilities

### Phase 4: Monitoring (Week 6)
- Deploy monitoring infrastructure
- Set up alerting rules
- Create operational runbooks

## 6. Performance Considerations

### 6.1 Detection Performance

- **Scan Frequency**: 10-second intervals for active games
- **Performance Budget**: < 50ms per game scan
- **Memory Usage**: < 10MB for detection cache
- **Database Impact**: Use read replicas for scanning

### 6.2 Optimization Strategies

```typescript
class OptimizedDetector {
  private readonly cache = new LRUCache<string, DetectionResult>({
    max: 1000,
    ttl: 30000 // 30 seconds
  });
  
  async detectWithCache(game: BackgammonGame): Promise<DetectionResult> {
    const cacheKey = `${game.id}-${game.lastModified}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }
    
    const result = await this.performDetection(game);
    this.cache.set(cacheKey, result);
    
    return result;
  }
}
```

## 7. Metrics and KPIs

### 7.1 Key Metrics to Track

```typescript
interface StuckGameMetrics {
  // Detection Metrics
  totalGamesScanned: number;
  stuckGamesDetected: number;
  detectionLatencyP99: number;
  falsePositiveRate: number;
  
  // Pattern Distribution
  patternCounts: {
    ORPHANED_MOVE_STATE: number;
    VALIDATION_MISMATCH: number;
    STATE_TRANSITION_FAILURE: number;
  };
  
  // Recovery Metrics
  autoFixAttempts: number;
  autoFixSuccessRate: number;
  manualInterventionsRequired: number;
  averageRecoveryTime: number;
  
  // Business Impact
  playerSessionsAffected: number;
  gamesAbandoned: number;
  supportTicketsGenerated: number;
}
```

### 7.2 Success Criteria

- **Detection Rate**: > 99% of stuck games detected within 30 seconds
- **False Positive Rate**: < 0.1%
- **Auto-Fix Success Rate**: > 80% for high-confidence detections
- **Mean Time to Recovery**: < 2 minutes for auto-fixable issues
- **Stuck Game Rate**: < 0.01% of all games

## 8. Security and Safety

### 8.1 Safety Checks

```typescript
class SafetyValidator {
  validateFixSafety(game: BackgammonGame, fix: AutoFixStrategy): boolean {
    // Never auto-fix tournament games
    if (game.isTournament) return false;
    
    // Never auto-fix games with wagers
    if (game.hasWager) return false;
    
    // Require high confidence for auto-fix
    if (fix.confidence < 0.95) return false;
    
    // Ensure we have recent backup
    if (!this.hasRecentBackup(game)) return false;
    
    return true;
  }
}
```

### 8.2 Audit Trail

All detection events and fix attempts must be logged with:
- Timestamp
- Detector version
- Detection result
- Fix attempt details
- Outcome
- Operator ID (if manual)

## 9. Testing Strategy

### 9.1 Test Scenarios

```typescript
describe('StuckGameDetector', () => {
  it('should detect orphaned moves', async () => {
    const game = createGameWithOrphanedMove();
    const result = await detector.detectOrphanedMoves(game);
    
    expect(result.detected).toBe(true);
    expect(result.pattern).toBe('ORPHANED_MOVE_STATE');
    expect(result.severity).toBe('CRITICAL');
  });
  
  it('should not produce false positives', async () => {
    const game = createHealthyGame();
    const result = await detector.performFullScan(game);
    
    expect(result.hasIssues()).toBe(false);
  });
  
  it('should successfully auto-fix high confidence issues', async () => {
    const game = createStuckGame();
    const result = await detector.performFullScan(game);
    
    if (result.confidence > 0.9) {
      const fixResult = await fixer.applyFix(game, result.suggestedFix);
      expect(fixResult.success).toBe(true);
    }
  });
});
```

## 10. Operational Runbook

### 10.1 Alert Response Procedures

#### CRITICAL Alert: Orphaned Move State
1. Verify incident report in dashboard
2. Check player impact (are players online?)
3. If auto-fix failed, attempt manual fix:
   ```bash
   npm run fix:orphaned-moves -- --game-id=<GAME_ID>
   ```
4. Verify fix succeeded
5. Notify affected players if necessary
6. Create post-mortem ticket

#### HIGH Alert: Validation Mismatch
1. Review incident report evidence
2. Check for recent deployments
3. Run validation recalculation:
   ```bash
   npm run fix:recalculate-moves -- --game-id=<GAME_ID>
   ```
4. Monitor for recurrence
5. Escalate if pattern continues

### 10.2 Manual Recovery Procedures

See `docs/operations/stuck-game-recovery.md` for detailed manual recovery procedures.

## Appendix A: Database Schema Changes

```sql
-- Add incident tracking table
CREATE TABLE game_incidents (
  incident_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID REFERENCES games(id),
  incident_type VARCHAR(50) NOT NULL,
  severity VARCHAR(20) NOT NULL,
  confidence DECIMAL(3,2) NOT NULL,
  detected_at TIMESTAMP NOT NULL DEFAULT NOW(),
  auto_fixed BOOLEAN DEFAULT FALSE,
  fix_applied_at TIMESTAMP,
  fix_strategy VARCHAR(50),
  fix_successful BOOLEAN,
  incident_data JSONB NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Add index for monitoring queries
CREATE INDEX idx_game_incidents_game_id ON game_incidents(game_id);
CREATE INDEX idx_game_incidents_detected_at ON game_incidents(detected_at);
CREATE INDEX idx_game_incidents_severity ON game_incidents(severity);

-- Add game state backup table for recovery
CREATE TABLE game_state_backups (
  backup_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID REFERENCES games(id),
  state_snapshot JSONB NOT NULL,
  backup_reason VARCHAR(100),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_game_state_backups_game_id ON game_state_backups(game_id);
```

## Appendix B: Monitoring Dashboard Mockup

```
┌─────────────────────────────────────────────────────────────┐
│  Stuck Game Detection Dashboard                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Active Incidents: 3        Auto-Fixed Today: 12            │
│  Detection Rate: 99.2%      Manual Interventions: 1         │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Recent Incidents                                      │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │ TIME     GAME ID    PATTERN            SEVERITY  FIX │  │
│  │ 16:43    2d0ee...   ORPHANED_MOVE      CRITICAL  ⏳  │  │
│  │ 16:41    66512...   VALIDATION_MISMATCH HIGH      ✓  │  │
│  │ 16:38    abc12...   STATE_TRANSITION   MEDIUM    ✓  │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Pattern Distribution (Last 24h)                       │  │
│  │                                                        │  │
│  │ Orphaned Moves:     ████████░░ 35%                   │  │
│  │ Validation Issues:  ██████░░░░ 28%                   │  │
│  │ State Transitions:  █████░░░░░ 22%                   │  │
│  │ Other:             ███░░░░░░░ 15%                   │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

**Document Version History**
- v1.0 - Initial draft (January 2025)
- v1.1 - Added auto-recovery strategies (Pending)
- v1.2 - Production deployment guide (Pending)