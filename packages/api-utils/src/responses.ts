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