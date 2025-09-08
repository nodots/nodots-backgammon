/**
 * API Request Types
 * 
 * These types define the shape of data sent TO the API from clients.
 */

/**
 * Request to create a new game with two players
 */
export interface CreateGameRequest {
  player1: { userId: string; isRobot: boolean }
  player2: { userId: string; isRobot: boolean }
}

/**
 * Request to create or update a user
 */
export interface CreateUserRequest {
  source: string
  externalId: string
  email: string
  given_name?: string
  family_name?: string
  nickname?: string
  picture?: string
  locale?: string
  userType?: string
}

/**
 * Request to update an existing user
 */
export interface UpdateUserRequest {
  email?: string
  given_name?: string
  family_name?: string
  nickname?: string
  picture?: string
  locale?: string
  userType?: string
}