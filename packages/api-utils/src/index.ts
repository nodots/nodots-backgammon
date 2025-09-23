// Re-export user types
export type {
  UserPreferences,
  UserState,
  UserType,
  User,
  ExternalUser,
  AuthenticatedRequest,
  Preference,
  BackgammonGamePreferences,
  GamePreferences
} from './users'

// Re-export request types
export type {
  CreateGameRequest,
  CreateUserRequest,
  UpdateUserRequest
} from './requests'

// Re-export response types
export type {
  ApiResponse,
  SerializedBackgammonPlay,
  SerializedBackgammonGame,
  GameResponse,
  GamesListResponse,
  WebSocketEvent,
  GameStateUpdateEvent,
  GameUpdatedEvent,
  MoveMadeEvent,
  GameCompletedEvent
} from './responses'

// Import ApiResponse for use in our functions
import type { ApiResponse } from './responses'

export interface ApiErrorResponse {
  success: false
  error: string
  message?: string
}

export interface ApiSuccessResponse<T = any> {
  success: true
  data: T
}

export function createSuccessResponse<T>(data: T): ApiSuccessResponse<T> {
  return {
    success: true,
    data
  }
}

export function createErrorResponse(error: string, message?: string): ApiErrorResponse {
  return {
    success: false,
    error,
    message
  }
}

export function isApiError(response: ApiResponse): response is ApiErrorResponse {
  return !response.success
}

export function isApiSuccess<T>(response: ApiResponse<T>): response is ApiSuccessResponse<T> {
  return response.success
}