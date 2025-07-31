# XG Mobile Import/Export Technical Specification

## Executive Summary

This document provides a comprehensive technical specification and implementation plan for importing and exporting XG Mobile backgammon game format within the Nodots Backgammon ecosystem. The XG format is a widely-used standard for backgammon game notation that includes match metadata, game history, and move sequences.

## 1. XG Format Analysis

### 1.1 File Structure

The XG format consists of three main sections:

#### Header Section (Lines 1-14)
```
; [Site "XG Mobile"]
; [Match ID "491989142"]  
; [Player 1 "Ken"]
; [Player 2 "XG-Intermediate"]
; [Player 1 Elo "1522.94/244"]
; [Player 2 Elo "1829.00/0"]
; [TimeControl "*0"]
; [EventDate "2022.12.24"]
; [EventTime "21.23"]
; [Variation "Backgammon"]
; [Jacoby "On"]
; [Beaver "Off"]
; [Unrated "Off"]
; [CubeLimit "1024"]
```

#### Match Metadata (Lines 16-17)
```
0 point match

Game 1 
Ken : 0                              XG-Intermediate : 0 
```

#### Game Records (Lines 18+)
Each game contains:
- Move sequences with dice rolls and position notation
- Doubling cube actions (`Doubles => 2`, `Takes`, `Drops`)
- Game outcomes (`Wins X point`)

### 1.2 Move Notation Format

**Standard Moves**: `dice_roll: from/to from/to`
- Example: `21: 13/11 8/7` (rolled 2-1, moved checker from point 13 to 11, and from point 8 to 7)

**Special Positions**:
- `25`: Bar (entering from bar)
- `0`: Off (bearing off)
- Multiple moves with same die: `33: 6/3 6/3 13/10 13/10`

**Cube Actions**:
- `Doubles => 2`: Player doubles cube to 2
- `Takes`: Opponent accepts double
- `Drops`: Opponent declines double

### 1.3 Game States

Each game progresses through:
1. **Initial setup**: Starting positions
2. **Move sequences**: Alternating player moves
3. **Cube actions**: Optional doubling
4. **Game completion**: Winner declaration with points

## 2. Data Model Design

### 2.1 Core Interfaces

```typescript
// XG Match Header
export interface XGMatchHeader {
  site: string
  matchId: string
  player1: string
  player2: string
  player1Elo?: string
  player2Elo?: string
  timeControl?: string
  eventDate: string
  eventTime: string
  variation: string
  jacoby: 'On' | 'Off'
  beaver: 'On' | 'Off'
  unrated: 'On' | 'Off'
  cubeLimit: number
}

// XG Game Record
export interface XGGameRecord {
  gameNumber: number
  initialScore: {
    player1: number
    player2: number
  }
  moves: XGMoveRecord[]
  winner: 1 | 2
  pointsWon: number
  finalScore: {
    player1: number
    player2: number
  }
}

// XG Move Record
export interface XGMoveRecord {
  moveNumber: number
  player: 1 | 2
  dice?: [number, number]
  moves?: XGMove[]
  cubeAction?: XGCubeAction
  gameEnd?: {
    winner: 1 | 2
    points: number
  }
}

// Individual move within a turn
export interface XGMove {
  from: number // 1-24 for points, 25 for bar, 0 for off
  to: number   // 1-24 for points, 25 for bar, 0 for off
}

// Cube actions
export interface XGCubeAction {
  type: 'double' | 'take' | 'drop'
  value?: number // New cube value for doubles
}

// Complete XG Match
export interface XGMatch {
  header: XGMatchHeader
  matchLength: number // 0 for money game
  games: XGGameRecord[]
  metadata: {
    totalGames: number
    finalScore: {
      player1: number
      player2: number
    }
    parsedAt: Date
    fileSize: number
  }
}
```

### 2.2 Integration with Existing Types

```typescript
// Mapping XG to Nodots types
export interface XGToNodotsMapping {
  // Convert XG position numbers to Nodots CheckerContainer positions
  xgPositionToCheckerContainer: (
    xgPosition: number,
    playerDirection: BackgammonMoveDirection
  ) => BackgammonCheckerContainerPosition

  // Convert XG moves to Nodots moves
  xgMoveToNodotsMove: (
    xgMove: XGMove,
    activeColor: BackgammonColor,
    dice: [number, number]
  ) => BackgammonMove

  // Convert XG game to Nodots game
  xgGameToNodotsGame: (
    xgGame: XGGameRecord,
    players: BackgammonPlayers
  ) => BackgammonGame

  // Convert Nodots game to XG game
  nodotsGameToXGGame: (
    game: BackgammonGame,
    gameNumber: number
  ) => XGGameRecord
}
```

## 3. Parser Implementation Plan

### 3.1 Parser Architecture

```typescript
export class XGParser {
  private static readonly HEADER_PATTERN = /^; \[(\w+) "([^"]+)"\]$/
  private static readonly MOVE_PATTERN = /^(\d+)\) (.+)$/
  private static readonly DICE_MOVE_PATTERN = /^(\d{1,2}): (.+)$/
  private static readonly CUBE_PATTERN = /^(Doubles => \d+|Takes|Drops)$/

  public static parse(content: string): XGMatch {
    const lines = content.split('\n').map(line => line.trim())
    
    const header = this.parseHeader(lines)
    const matchLength = this.parseMatchLength(lines)
    const games = this.parseGames(lines)
    
    return {
      header,
      matchLength,
      games,
      metadata: this.generateMetadata(games, content.length)
    }
  }

  private static parseHeader(lines: string[]): XGMatchHeader {
    // Implementation details...
  }

  private static parseGames(lines: string[]): XGGameRecord[] {
    // Implementation details...
  }

  private static parseMove(moveLine: string): XGMoveRecord {
    // Implementation details...
  }

  private static parseMoveNotation(notation: string): XGMove[] {
    // Parse notation like "13/11 8/7" into move objects
  }
}
```

### 3.2 Parser Implementation Phases

#### Phase 1: Basic Structure Parser
- Parse header metadata
- Identify game boundaries
- Extract move sequences

#### Phase 2: Move Notation Parser
- Parse dice rolls and move notation
- Handle special cases (bar, bearing off)
- Parse cube actions

#### Phase 3: Validation & Error Handling
- Validate move legality
- Check position consistency
- Handle malformed input gracefully

#### Phase 4: Performance Optimization
- Stream parsing for large files
- Memory-efficient processing
- Caching for repeated operations

### 3.3 Error Handling Strategy

```typescript
export class XGParserError extends Error {
  constructor(
    message: string,
    public lineNumber?: number,
    public column?: number,
    public context?: string
  ) {
    super(message)
    this.name = 'XGParserError'
  }
}

export interface XGParseResult {
  success: boolean
  data?: XGMatch
  errors: XGParserError[]
  warnings: string[]
}
```

## 4. Serializer Implementation Plan

### 4.1 Serializer Architecture

```typescript
export class XGSerializer {
  public static serialize(match: XGMatch): string {
    const lines: string[] = []
    
    // Serialize header
    lines.push(...this.serializeHeader(match.header))
    lines.push('')
    
    // Serialize match info
    lines.push(`${match.matchLength} point match`)
    lines.push('')
    
    // Serialize games
    match.games.forEach((game, index) => {
      lines.push(...this.serializeGame(game, index + 1))
      lines.push('')
    })
    
    return lines.join('\n')
  }

  private static serializeHeader(header: XGMatchHeader): string[] {
    // Implementation details...
  }

  private static serializeGame(game: XGGameRecord, gameNumber: number): string[] {
    // Implementation details...
  }

  private static serializeMoves(moves: XGMove[]): string {
    // Convert moves back to XG notation
  }
}
```

### 4.2 Serialization Phases

#### Phase 1: Basic Structure
- Generate header section
- Create game structure
- Basic move notation

#### Phase 2: Advanced Features
- Cube action serialization
- Score tracking
- Time stamps

#### Phase 3: Optimization
- Compact notation
- Consistent formatting
- Validation of output

## 5. Integration with Existing System

### 5.1 API Endpoints

```typescript
// New API endpoints for XG import/export
export interface XGImportExportAPI {
  // Import XG file
  POST /api/v1/games/import/xg
  Body: { file: File | string }
  Response: { 
    success: boolean
    gameIds: string[]
    errors?: string[]
  }

  // Export game(s) to XG format
  GET /api/v1/games/:gameId/export/xg
  Response: XG format file

  // Export multiple games as XG match
  POST /api/v1/games/export/xg
  Body: { gameIds: string[] }
  Response: XG format file

  // Validate XG file
  POST /api/v1/games/validate/xg
  Body: { file: File | string }
  Response: {
    valid: boolean
    errors?: XGParserError[]
    warnings?: string[]
    metadata?: XGMatch['metadata']
  }
}
```

### 5.2 Service Layer Integration

```typescript
export class XGImportExportService {
  constructor(
    private gameService: GameService,
    private playerService: PlayerService
  ) {}

  async importXGMatch(content: string): Promise<BackgammonGame[]> {
    // Parse XG content
    const parseResult = XGParser.parse(content)
    if (!parseResult.success) {
      throw new Error(`Failed to parse XG file: ${parseResult.errors.join(', ')}`)
    }

    // Convert to Nodots games
    const games: BackgammonGame[] = []
    for (const xgGame of parseResult.data!.games) {
      const nodotsGame = await this.convertXGGameToNodots(xgGame, parseResult.data!.header)
      games.push(nodotsGame)
    }

    return games
  }

  async exportGamesToXG(gameIds: string[]): Promise<string> {
    // Fetch games from database
    const games = await this.gameService.getGames(gameIds)
    
    // Convert to XG format
    const xgMatch = await this.convertNodotsGamesToXG(games)
    
    // Serialize to XG format
    return XGSerializer.serialize(xgMatch)
  }

  private async convertXGGameToNodots(
    xgGame: XGGameRecord, 
    header: XGMatchHeader
  ): Promise<BackgammonGame> {
    // Implementation details...
  }

  private async convertNodotsGamesToXG(games: BackgammonGame[]): Promise<XGMatch> {
    // Implementation details...
  }
}
```

### 5.3 Client Integration

```typescript
// React components for XG import/export
export const XGImportDialog: React.FC = () => {
  const [file, setFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  
  const handleImport = async () => {
    if (!file) return
    
    setImporting(true)
    try {
      const content = await file.text()
      const result = await apiClient.importXG(content)
      
      if (result.success) {
        toast.success(`Imported ${result.gameIds.length} games`)
        onImportSuccess(result.gameIds)
      } else {
        toast.error(`Import failed: ${result.errors?.join(', ')}`)
      }
    } catch (error) {
      toast.error(`Import error: ${error.message}`)
    } finally {
      setImporting(false)
    }
  }

  return (
    // UI implementation...
  )
}

export const XGExportButton: React.FC<{ gameIds: string[] }> = ({ gameIds }) => {
  const handleExport = async () => {
    try {
      const xgContent = await apiClient.exportXG(gameIds)
      const blob = new Blob([xgContent], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      
      const a = document.createElement('a')
      a.href = url
      a.download = `backgammon-match-${Date.now()}.txt`
      a.click()
      
      URL.revokeObjectURL(url)
    } catch (error) {
      toast.error(`Export failed: ${error.message}`)
    }
  }

  return (
    <button onClick={handleExport}>
      Export to XG Format
    </button>
  )
}
```

## 6. Implementation Timeline

### Phase 1: Foundation (Week 1-2)
- ✅ Complete format analysis
- ✅ Design core data models
- Implement basic parser structure
- Create unit test framework

### Phase 2: Core Parser (Week 3-4)
- Implement header parsing
- Implement move notation parsing
- Add cube action parsing
- Comprehensive error handling

### Phase 3: Serializer (Week 5)
- Implement XG serialization
- Add formatting validation
- Performance optimization

### Phase 4: Integration (Week 6-7)
- API endpoint implementation
- Service layer integration
- Database persistence
- Client UI components

### Phase 5: Testing & Polish (Week 8)
- End-to-end testing
- Performance testing
- Documentation
- Bug fixes and optimization

## 7. Testing Strategy

### 7.1 Unit Tests
```typescript
describe('XGParser', () => {
  it('should parse header correctly', () => {
    const content = `; [Site "XG Mobile"]
; [Player 1 "Ken"]`
    const result = XGParser.parse(content)
    expect(result.header.site).toBe('XG Mobile')
    expect(result.header.player1).toBe('Ken')
  })

  it('should parse moves correctly', () => {
    const moveLine = '21: 13/11 8/7'
    const moves = XGParser.parseMoveNotation('13/11 8/7')
    expect(moves).toEqual([
      { from: 13, to: 11 },
      { from: 8, to: 7 }
    ])
  })

  it('should handle cube actions', () => {
    const cubeAction = XGParser.parseCubeAction('Doubles => 2')
    expect(cubeAction).toEqual({
      type: 'double',
      value: 2
    })
  })
})
```

### 7.2 Integration Tests
- Test complete file parsing
- Test round-trip conversion (import then export)
- Test error handling with malformed files
- Test performance with large files

### 7.3 E2E Tests
- Test file upload UI
- Test game import workflow
- Test game export workflow
- Test error display and handling

## 8. Performance Considerations

### 8.1 Parser Optimizations
- **Streaming**: Parse large files line-by-line to reduce memory usage
- **Caching**: Cache parsed results for repeated operations
- **Lazy Loading**: Only parse games when needed
- **Worker Threads**: Use web workers for client-side parsing

### 8.2 Memory Management
- Efficient string processing
- Minimize object allocation
- Clean up temporary data structures
- Use generators for large datasets

### 8.3 Database Considerations
- Batch insert operations
- Index optimization for imported games
- Consider separate table for XG metadata
- Implement soft deletes for imported games

## 9. Security Considerations

### 9.1 Input Validation
- File size limits (max 10MB)
- Content validation before parsing
- Sanitize all user inputs
- Rate limiting on import operations

### 9.2 Error Handling
- Don't expose internal system details in errors
- Log security-relevant events
- Validate all parsed data before persistence
- Implement proper error boundaries

## 10. File Structure

```
packages/
├── types/src/
│   └── xg.ts                    # XG format type definitions
├── core/src/
│   ├── xg/
│   │   ├── parser.ts           # XG parser implementation
│   │   ├── serializer.ts       # XG serializer implementation
│   │   ├── mapper.ts           # XG <-> Nodots conversion
│   │   └── validator.ts        # XG format validation
│   └── __tests__/xg/
│       ├── parser.test.ts
│       ├── serializer.test.ts
│       └── fixtures/
│           └── sample.xg
├── api/src/
│   ├── routes/xg.ts            # XG import/export endpoints
│   └── services/xg.ts          # XG service implementation
└── client/src/
    ├── components/XG/
    │   ├── ImportDialog.tsx
    │   ├── ExportButton.tsx
    │   └── ValidationResults.tsx
    └── hooks/
        └── useXGImportExport.ts
```

## 11. Conclusion

This specification provides a comprehensive roadmap for implementing XG Mobile format import/export functionality in Nodots Backgammon. The modular approach ensures maintainability while the phased implementation allows for iterative development and testing.

Key benefits of this implementation:
- **Interoperability**: Enable data exchange with other backgammon software
- **Archival**: Preserve game history in a standard format
- **Analysis**: Import games for statistical analysis
- **Sharing**: Export games for sharing with other players

The implementation leverages existing Nodots types and patterns while introducing new functionality in a clean, testable manner.