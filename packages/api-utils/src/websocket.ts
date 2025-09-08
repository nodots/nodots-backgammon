/**
 * WebSocket Event Types
 * 
 * These types define the shape of WebSocket events sent from the API to clients.
 */

import type { BackgammonPlayer, BackgammonMove } from '@nodots-llc/backgammon-types'
import type { SerializedBackgammonGame } from './responses'

/**
 * WebSocket event when game state is updated
 */
export interface GameUpdatedEvent {
  type: 'game-updated'
  game: SerializedBackgammonGame
}

/**
 * WebSocket event for game state updates
 */
export interface GameStateUpdateEvent {
  type: 'GAME_STATE_UPDATE'
  gameId: string
  gameState: SerializedBackgammonGame
}

/**
 * WebSocket event when a move is made
 */
export interface MoveMadeEvent {
  type: 'move-made'
  gameId: string
  playerId: string
  move: BackgammonMove
  gameState: SerializedBackgammonGame
}

/**
 * WebSocket event when game is completed
 */
export interface GameCompletedEvent {
  type: 'game-completed'
  gameId: string
  winner: BackgammonPlayer
  finalState: SerializedBackgammonGame
  timestamp: number
}

/**
 * Union type of all WebSocket events
 */
export type WebSocketEvent = 
  | GameUpdatedEvent 
  | GameStateUpdateEvent 
  | MoveMadeEvent 
  | GameCompletedEvent