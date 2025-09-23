/**
 * API Response Types
 * 
 * These types represent the serialized format of data sent from the API to clients.
 * The main difference from CORE types is that Set<T> becomes Array<T> for JSON compatibility.
 * 
 * IMPORTANT: The serialization functions in API's utils/serialization.ts return `any` type
 * to avoid complex TypeScript issues with the deeply nested game state.
 * However, the actual runtime behavior is:
 * 
 * 1. CORE stores activePlay.moves as Set<BackgammonMove>
 * 2. API serialization converts Set → Array before sending responses
 * 3. CLIENT receives activePlay.moves as BackgammonMove[]
 * 
 * These types document the expected shape of API responses,
 * even though they're not enforced at compile time due to complexity.
 */

import type {
  BackgammonGame,
  BackgammonPlay,
  BackgammonMove,
  BackgammonPlayer,
  BackgammonBoard,
  BackgammonCube,
  BackgammonOffer,
  BackgammonDice
} from '@nodots-llc/backgammon-types'

/**
 * Serialized version of BackgammonPlay where moves is an Array instead of Set
 */
export interface SerializedBackgammonPlay extends Omit<BackgammonPlay, 'moves'> {
  moves: BackgammonMove[] // Array instead of Set<BackgammonMove>
}

/**
 * Serialized version of BackgammonGame for API responses
 * Main changes:
 * - activePlay.moves is Array instead of Set
 * - Players include current pip counts
 * - gnuPositionId is included as a property
 * - activePlay can be null (when in rolling state) or undefined
 */
export interface SerializedBackgammonGame extends Omit<BackgammonGame, 'activePlay' | 'players' | 'activePlayer' | 'inactivePlayer' | 'gnuPositionId'> {
  activePlay?: SerializedBackgammonPlay | null  // Can be null when in rolling state
  players: Array<BackgammonPlayer & { pipCount: number }>
  activePlayer?: (BackgammonPlayer & { pipCount: number }) | null
  inactivePlayer?: (BackgammonPlayer & { pipCount: number }) | null
  gnuPositionId?: string
}

/**
 * Game-specific API responses
 */
export interface GameResponse extends ApiResponse<SerializedBackgammonGame> {
  data: SerializedBackgammonGame
}

export interface GamesListResponse extends ApiResponse<SerializedBackgammonGame[]> {
  data: SerializedBackgammonGame[]
}

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

/**
 * WebSocket Event Types
 *
 * These types define the events sent via WebSocket connections
 */

/**
 * Base event structure
 */
export interface WebSocketEvent<T = any> {
  type: string
  gameId: string
  data: T
  timestamp: Date
}

/**
 * Game state update event
 */
export interface GameStateUpdateEvent extends WebSocketEvent<SerializedBackgammonGame> {
  type: 'game-state-update'
}

/**
 * Game updated event (general updates)
 */
export interface GameUpdatedEvent extends WebSocketEvent<SerializedBackgammonGame> {
  type: 'game-updated'
}

/**
 * Move made event
 */
export interface MoveMadeEvent extends WebSocketEvent<{
  game: SerializedBackgammonGame
  move: BackgammonMove
  playerId: string
}> {
  type: 'move-made'
}

/**
 * Game completed event
 */
export interface GameCompletedEvent extends WebSocketEvent<{
  game: SerializedBackgammonGame
  winnerId: string
  reason: string
}> {
  type: 'game-completed'
}