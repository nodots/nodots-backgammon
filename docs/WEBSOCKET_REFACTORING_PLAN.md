# WebSocket Refactoring Plan

## Nodots Backgammon - Complete WebSocket Integration

### Overview

This plan outlines the complete refactoring of the Nodots Backgammon system to fully integrate WebSocket functionality across all subprojects. The goal is to create a real-time, responsive system while maintaining backward compatibility with REST APIs.

### Current State Assessment

**✅ Already Implemented:**

- Basic WebSocket server using Socket.IO on `https://localhost:3443`
- Client-side WebSocketClient with auto-reconnection
- Real-time simulation updates
- REST API fallback mechanism
- Interactive WebSocket demo

**⚠️ Needs Improvement:**

- WebSocket message type standardization
- Authentication over WebSocket
- Comprehensive error handling
- Integration across all subprojects
- Test coverage for WebSocket functionality

---

## Branch Structure

Each subproject has its own feature branch for WebSocket refactoring:

- `websocket-refactor/types` - Core WebSocket type definitions
- `websocket-refactor/core` - Game state WebSocket integration
- `websocket-refactor/api` - Enhanced WebSocket server
- `websocket-refactor/client` - Complete client WebSocket integration
- `websocket-refactor/cli` - CLI WebSocket support
- `websocket-refactor/ai` - AI WebSocket integration
- `websocket-refactor/dice` - Dice WebSocket events

---

## Implementation Strategy

### Phase 1: Foundation (Types & Core)

**Priority: HIGH** | **Dependencies: None**

#### 1.1 Types Package (`websocket-refactor/types`)

**Goal:** Establish standardized WebSocket message types and interfaces

**Tasks:**

- Create `websocket.ts` with comprehensive message type definitions
- Define WebSocket event interfaces for all game actions
- Establish WebSocket connection state types
- Create error handling types for WebSocket scenarios
- Add authentication payload types for WebSocket

**Key Types to Define:**

```typescript
// WebSocket Message Types
export interface WebSocketMessage<T = any> {
  type: string
  gameId?: string
  playerId?: string
  timestamp: string
  data: T
}

// Game Event Types
export interface GameStateUpdate {
  game: BackgammonGame
  lastMove?: Move
  activePlayer?: Player
}

// Connection Types
export interface WebSocketConnectionState {
  isConnected: boolean
  reconnectAttempts: number
  lastError?: string
}
```

**Deliverables:**

- Complete WebSocket type definitions
- Updated package exports
- Documentation for new types

#### 1.2 Core Package (`websocket-refactor/core`)

**Goal:** Add WebSocket event emission capabilities to core game logic

**Tasks:**

- Create `WebSocketEventEmitter` class for game state changes
- Integrate event emission into `BackgammonGame` class
- Add WebSocket event hooks to move validation and execution
- Implement game state change detection
- Add configuration for WebSocket event publishing

**Key Integration Points:**

- Game creation/deletion events
- Move execution events
- Turn completion events
- Game status changes (waiting, playing, finished)
- Cube actions (double, accept, decline)

**Deliverables:**

- Event-driven core package
- WebSocket integration interfaces
- Backward compatibility maintained
- Unit tests for event emission

---

### Phase 2: Server Enhancement (API)

**Priority: HIGH** | **Dependencies: Types**

#### 2.1 API Package (`websocket-refactor/api`)

**Goal:** Create production-ready WebSocket server with comprehensive features

**Tasks:**

- Enhance Socket.IO server configuration
- Implement robust authentication over WebSocket
- Create comprehensive message routing system
- Add WebSocket middleware for validation and logging
- Implement room management for game isolation
- Add rate limiting and security measures
- Create WebSocket API versioning system

**Key Features:**

```typescript
// Enhanced WebSocket Handler
class WebSocketHandler {
  private io: Server

  async authenticateConnection(socket: Socket, token: string): Promise<User>
  async joinGameRoom(socket: Socket, gameId: string): Promise<void>
  async handleGameAction(
    socket: Socket,
    message: WebSocketMessage
  ): Promise<void>
  async broadcastGameUpdate(
    gameId: string,
    update: GameStateUpdate
  ): Promise<void>
}
```

**Message Types to Handle:**

- `GAME_JOIN` - Join game room
- `GAME_LEAVE` - Leave game room
- `MOVE_REQUEST` - Request possible moves
- `MOVE_EXECUTE` - Execute move
- `CUBE_ACTION` - Double/accept/decline cube
- `GAME_STATE_REQUEST` - Request current game state

**Deliverables:**

- Production-ready WebSocket server
- Comprehensive message handling
- Authentication integration
- Room management system
- API documentation updates

---

### Phase 3: Client Integration

**Priority: HIGH** | **Dependencies: Types, API**

#### 3.1 Client Package (`websocket-refactor/client`)

**Goal:** Complete WebSocket integration with React client

**Tasks:**

- Enhance WebSocketClient with authentication
- Create React hooks for WebSocket state management
- Implement real-time game board updates
- Add WebSocket connection status indicators
- Create comprehensive error handling and fallback
- Integrate WebSocket with game components
- Add user preference for WebSocket vs REST

**Key Components:**

```typescript
// React Hook for WebSocket Game State
export function useWebSocketGame(gameId: string) {
  const [gameState, setGameState] = useState<BackgammonGame>()
  const [connectionState, setConnectionState] =
    useState<WebSocketConnectionState>()
  const [error, setError] = useState<string>()

  const sendMove = useCallback((move: Move) => {
    /* ... */
  }, [])
  const sendCubeAction = useCallback((action: CubeAction) => {
    /* ... */
  }, [])

  return { gameState, connectionState, error, sendMove, sendCubeAction }
}
```

**UI Enhancements:**

- Real-time connection status indicator
- WebSocket vs REST mode toggle
- Live game state updates without refresh
- Real-time opponent move visualization
- Connection quality indicators

**Deliverables:**

- Fully integrated WebSocket client
- React hooks for WebSocket state
- Enhanced user experience
- Comprehensive fallback handling

---

### Phase 4: CLI Enhancement

**Priority: MEDIUM** | **Dependencies: Types, API**

#### 4.1 CLI Package (`websocket-refactor/cli`)

**Goal:** Add real-time capabilities to CLI interface

**Tasks:**

- Integrate WebSocketClient into CLI commands
- Add real-time game watching capabilities
- Implement live tournament monitoring
- Create WebSocket-based robot automation
- Add connection management commands
- Enhance ASCII display with real-time updates

**Key Features:**

- `nodots watch <gameId>` - Watch game in real-time
- `nodots simulate --live` - Live simulation with WebSocket updates
- `nodots tournament --monitor` - Real-time tournament monitoring
- WebSocket connection diagnostics

**Deliverables:**

- CLI WebSocket integration
- Real-time command features
- Enhanced automation capabilities

---

### Phase 5: AI Integration

**Priority: MEDIUM** | **Dependencies: Types, API**

#### 5.1 AI Package (`websocket-refactor/ai`)

**Goal:** Integrate AI analysis with real-time WebSocket communication

**Tasks:**

- Create WebSocket client for AI services
- Implement real-time move analysis broadcasting
- Add live AI commentary features
- Create AI vs AI WebSocket tournaments
- Implement real-time difficulty adjustment
- Add AI performance metrics broadcasting

**Key Features:**

- Real-time move analysis streaming
- AI vs AI live battles
- Performance metrics broadcasting
- Live difficulty adjustment based on game state

**Deliverables:**

- AI WebSocket integration
- Real-time analysis features
- Enhanced AI tournament capabilities

---

### Phase 6: Dice Integration

**Priority: LOW** | **Dependencies: Types**

#### 6.1 Dice Package (`websocket-refactor/dice`)

**Goal:** Add WebSocket events for dice rolling actions

**Tasks:**

- Integrate dice roll events with WebSocket
- Add real-time dice animation triggers
- Create dice roll verification over WebSocket
- Implement custom dice roll events

**Deliverables:**

- Dice WebSocket event integration
- Real-time dice roll notifications

---

## Integration & Testing Strategy

### Integration Testing

**Priority: HIGH** | **Dependencies: All Phase 1-6**

**Tasks:**

- Create end-to-end WebSocket test suite
- Test WebSocket + REST fallback scenarios
- Performance testing under load
- Connection resilience testing
- Authentication flow testing
- Multi-client synchronization testing

**Test Scenarios:**

- Simultaneous WebSocket and REST clients
- Network interruption recovery
- High-frequency message handling
- Memory leak detection
- WebSocket server restart recovery

### Documentation Updates

**Priority: MEDIUM** | **Dependencies: Integration Testing**

**Tasks:**

- Update API documentation with WebSocket endpoints
- Create WebSocket integration guides
- Update client SDK documentation
- Create troubleshooting guides
- Add performance optimization guides

---

## Implementation Timeline

### Week 1-2: Foundation

- [ ] Complete Types package WebSocket definitions
- [ ] Integrate Core package event emission
- [ ] Update package dependencies

### Week 3-4: Server Enhancement

- [ ] Enhance API WebSocket server
- [ ] Implement authentication and security
- [ ] Add comprehensive message handling

### Week 5-6: Client Integration

- [ ] Complete React client WebSocket integration
- [ ] Add real-time UI updates
- [ ] Implement fallback mechanisms

### Week 7: CLI & AI Enhancement

- [ ] Add CLI WebSocket support
- [ ] Integrate AI real-time features
- [ ] Complete Dice WebSocket events

### Week 8: Integration & Testing

- [ ] Comprehensive testing across all packages
- [ ] Performance optimization
- [ ] Documentation updates

---

## Success Criteria

### Technical Metrics

- [ ] <100ms WebSocket message latency
- [ ] 99.9% WebSocket connection uptime
- [ ] Zero message loss during normal operations
- [ ] Graceful degradation to REST within 5 seconds
- [ ] Support for 100+ concurrent WebSocket connections

### User Experience Metrics

- [ ] Real-time game state updates
- [ ] Seamless connection management
- [ ] Transparent fallback behavior
- [ ] Improved responsiveness vs REST-only

### Code Quality Metrics

- [ ] 90%+ test coverage for WebSocket functionality
- [ ] Zero breaking changes to existing REST APIs
- [ ] Comprehensive error handling
- [ ] Memory leak prevention

---

## Risk Mitigation

### Technical Risks

- **Connection Stability**: Implement robust reconnection logic
- **Message Ordering**: Use message sequencing and acknowledgments
- **Memory Leaks**: Regular connection cleanup and monitoring
- **Authentication**: Secure token validation over WebSocket

### Business Risks

- **Backward Compatibility**: Maintain full REST API support
- **Performance Impact**: Implement connection pooling and optimization
- **User Adoption**: Gradual rollout with user preferences

---

## Post-Implementation

### Monitoring & Maintenance

- WebSocket connection metrics dashboard
- Real-time error tracking and alerting
- Performance monitoring and optimization
- Regular security audits

### Future Enhancements

- Multi-server WebSocket clustering
- Advanced room management features
- WebSocket API rate limiting
- Enhanced security features

---

**Last Updated:** January 2025  
**Status:** Planning Phase  
**Next Review:** After Types & Core completion
