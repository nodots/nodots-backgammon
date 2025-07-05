import { Router, Request, Response } from 'express'
import { AuthenticatedRequest } from '../middleware/auth'

const router = Router()

// In-memory game storage
const games = new Map<string, any>()

// Robot automation
const ROBOT_USER_ID = process.env.ROBOT_USER_ID || '767347c0-6a20-4998-8649-4b8bc56192c6'

// Helper to generate game ID
function generateGameId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

// GET /api/v1/games - List user's games
router.get('/', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userGames = Array.from(games.values()).filter(game => 
      game.players.some((p: any) => p.id === req.user?.sub)
    )
    
    res.json({
      games: userGames.map(game => ({
        id: game.id,
        stateKind: game.stateKind,
        activeColor: game.activeColor,
        players: game.players.map((p: any) => ({
          id: p.id,
          color: p.color,
          direction: p.direction,
          stateKind: p.stateKind
        })),
        createdAt: game.createdAt
      }))
    })
  } catch (error) {
    console.error('Error listing games:', error)
    res.status(500).json({ error: 'Failed to list games' })
  }
})

// POST /api/v1/games - Create new game
router.post('/', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.sub

    if (!userId) {
      return res.status(401).json({ error: 'User ID required' })
    }

    // Create a new game structure
    const gameId = generateGameId()
    const game = {
      id: gameId,
      stateKind: 'rolled-for-start',
      activeColor: 'black',
      players: [
        {
          id: userId,
          color: 'black',
          direction: 'counterclockwise',
          stateKind: 'inactive',
          email: req.user?.email || 'user@example.com'
        },
        {
          id: ROBOT_USER_ID,
          color: 'white', 
          direction: 'clockwise',
          stateKind: 'inactive',
          email: 'robot@nodots.com'
        }
      ],
      board: {
        id: `board-${gameId}`,
        points: [] // Simplified board structure
      },
      createdAt: new Date().toISOString()
    }

    games.set(gameId, game)

    console.log(`🎮 New game created: ${gameId}`)
    console.log(`👤 Human: black (${userId})`)
    console.log(`🤖 Robot: white (${ROBOT_USER_ID})`)

    res.status(201).json(game)
    
  } catch (error) {
    console.error('Error creating game:', error)
    res.status(500).json({ error: 'Failed to create game' })
  }
})

// GET /api/v1/games/:id - Get specific game
router.get('/:id', (req: AuthenticatedRequest, res: Response) => {
  try {
    const game = games.get((req as any).params.id)
    
    if (!game) {
      return res.status(404).json({ error: 'Game not found' })
    }

    // Check if user is part of this game
    const isPlayerInGame = game.players.some((p: any) => p.id === req.user?.sub)
    if (!isPlayerInGame) {
      return res.status(403).json({ error: 'Access denied' })
    }

    // Convert null activePlay to undefined to fix serialization issue
    const responseGame = {
      id: game.id,
      stateKind: game.stateKind,
      activeColor: game.activeColor,
      players: game.players,
      board: game.board,
      activePlay: game.activePlay === null ? undefined : game.activePlay,
      lastRoll: game.lastRoll,
      createdAt: game.createdAt
    }

    res.json(responseGame)
  } catch (error) {
    console.error('Error getting game:', error)
    res.status(500).json({ error: 'Failed to get game' })
  }
})

// POST /api/v1/games/:id/roll - Roll dice with improved state handling
router.post('/:id/roll', (req: AuthenticatedRequest, res: Response) => {
  try {
    const game = games.get((req as any).params.id)
    const userId = req.user?.sub

    if (!game) {
      return res.status(404).json({ error: 'Game not found' })
    }

    // Check if user is part of this game
    const isPlayerInGame = game.players.some((p: any) => p.id === userId)
    if (!isPlayerInGame) {
      return res.status(403).json({ error: 'Access denied' })
    }

    // Generate dice roll
    const roll = [
      Math.floor(Math.random() * 6) + 1,
      Math.floor(Math.random() * 6) + 1
    ]

    // Handle state transitions properly
    let newState: string
    if (game.stateKind === 'rolled-for-start') {
      // First roll of the game - transition to rolled state
      newState = 'rolled'
    } else if (game.stateKind === 'rolling') {
      // Normal turn - transition to rolled state
      newState = 'rolled'
    } else if (game.stateKind === 'rolling-for-start') {
      // Rolling for start - transition to rolled-for-start
      newState = 'rolled-for-start'
    } else {
      // Default to rolled state
      newState = 'rolled'
    }

    // Update game state
    const updatedGame = {
      ...game,
      stateKind: newState,
      lastRoll: roll,
      updatedAt: new Date().toISOString()
    }

    games.set((req as any).params.id, updatedGame)

    res.json({
      id: updatedGame.id,
      stateKind: updatedGame.stateKind,
      activeColor: updatedGame.activeColor,
      roll: roll,
      lastRoll: roll,
      message: `Rolled: ${roll.join(', ')}`
    })

  } catch (error: any) {
    console.error('Error rolling dice:', error)
    res.status(500).json({ error: error.message || 'Failed to roll dice' })
  }
})

// POST /api/v1/games/:id/move - Make a move
router.post('/:id/move', (req: AuthenticatedRequest, res: Response) => {
  try {
    const game = games.get((req as any).params.id)
    const { from, to } = (req as any).body

    if (!game) {
      return res.status(404).json({ error: 'Game not found' })
    }

    // Simple move validation and execution
    const updatedGame = {
      ...game,
      stateKind: 'moving',
      lastMove: { from, to },
      updatedAt: new Date().toISOString()
    }

    games.set((req as any).params.id, updatedGame)

    res.json({
      success: true,
      game: updatedGame,
      message: `Moved from ${from} to ${to}`
    })

  } catch (error) {
    console.error('Error making move:', error)
    res.status(500).json({ error: 'Failed to make move' })
  }
})

// POST /api/v1/games/:id/play - Attempt to complete turn
router.post('/:id/play', (req: AuthenticatedRequest, res: Response) => {
  try {
    const game = games.get((req as any).params.id)

    if (!game) {
      return res.status(404).json({ error: 'Game not found' })
    }

    // Simulate end of turn
    const updatedGame = {
      ...game,
      stateKind: 'rolling',
      activeColor: game.activeColor === 'black' ? 'white' : 'black',
      updatedAt: new Date().toISOString()
    }

    games.set((req as any).params.id, updatedGame)

    res.json({
      success: true,
      game: updatedGame,
      message: 'Turn completed'
    })

  } catch (error) {
    console.error('Error attempting play:', error)
    res.status(500).json({ error: 'Failed to attempt play' })
  }
})

export default router