import { BackgammonGame, BackgammonPlayer } from '@nodots-llc/backgammon-types'
import axios, { AxiosInstance } from 'axios'
import { ApiResponse, CliConfig } from '../types'
import { AuthService } from './auth'

export class ApiService {
  private client: AxiosInstance
  private config: CliConfig
  private authService: AuthService

  constructor(config?: Partial<CliConfig>) {
    this.authService = new AuthService()
    const authConfig = this.authService.getApiConfig()

    this.config = {
      apiUrl:
        config?.apiUrl || process.env.NODOTS_API_URL || 'http://localhost:3000',
      userId: config?.userId || authConfig.userId,
      apiKey: config?.apiKey || authConfig.apiKey,
    }

    this.client = axios.create({
      baseURL: this.config.apiUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Add request interceptor for authentication
    this.client.interceptors.request.use((config) => {
      if (this.config.apiKey) {
        config.headers.Authorization = `Bearer ${this.config.apiKey}`
      }
      return config
    })
  }

  async createGame(
    player1Id: string,
    player2Id: string
  ): Promise<ApiResponse<BackgammonGame>> {
    try {
      const response = await this.client.post('/api/v1/games', {
        player1: { userId: player1Id },
        player2: { userId: player2Id },
      })
      return { success: true, data: response.data }
    } catch (error) {
      return this.handleError(error)
    }
  }

  async getGame(gameId: string): Promise<ApiResponse<BackgammonGame>> {
    try {
      const response = await this.client.get(`/api/v1/games/${gameId}`)
      return { success: true, data: response.data }
    } catch (error) {
      return this.handleError(error)
    }
  }

  async rollDice(gameId: string): Promise<ApiResponse<BackgammonGame>> {
    try {
      const response = await this.client.post(`/api/v1/games/${gameId}/roll`)
      return { success: true, data: response.data }
    } catch (error) {
      return this.handleError(error)
    }
  }

  async makeMove(
    gameId: string,
    from: number,
    to: number
  ): Promise<ApiResponse<BackgammonGame>> {
    try {
      const response = await this.client.post(`/api/v1/games/${gameId}/move`, {
        from,
        to,
      })
      return { success: true, data: response.data }
    } catch (error) {
      return this.handleError(error)
    }
  }

  async getUsers(): Promise<ApiResponse<BackgammonPlayer[]>> {
    try {
      const response = await this.client.get('/api/v1/users')
      return { success: true, data: response.data }
    } catch (error) {
      return this.handleError(error)
    }
  }

  async createOrUpdateUser(userData: {
    source: string
    externalId: string
    email: string
    given_name: string
    family_name: string
    locale: string
  }): Promise<ApiResponse<any>> {
    try {
      const response = await this.client.post('/api/v1/users', userData)
      return { success: true, data: response.data }
    } catch (error) {
      return this.handleError(error)
    }
  }

  // Robot Simulation Methods
  async getRobots(): Promise<ApiResponse<any[]>> {
    try {
      const response = await this.client.get('/api/v1/robots')
      return { success: true, data: response.data }
    } catch (error) {
      return this.handleError(error)
    }
  }

  async startSimulation(config: {
    speed?: number
    robot1Difficulty?: string
    robot2Difficulty?: string
  }): Promise<ApiResponse<any>> {
    try {
      const response = await this.client.post('/api/v1/robots/simulations', {
        speed: 1000,
        robot1Difficulty: 'beginner',
        robot2Difficulty: 'beginner',
        ...config,
      })
      return { success: true, data: response.data }
    } catch (error) {
      return this.handleError(error)
    }
  }

  async getSimulationStatus(simulationId: string): Promise<ApiResponse<any>> {
    try {
      const response = await this.client.get(
        `/api/v1/robots/simulations/${simulationId}`
      )
      return { success: true, data: response.data }
    } catch (error) {
      return this.handleError(error)
    }
  }

  async pauseSimulation(simulationId: string): Promise<ApiResponse<any>> {
    try {
      const response = await this.client.post(
        `/api/v1/robots/simulations/${simulationId}/pause`
      )
      return { success: true, data: response.data }
    } catch (error) {
      return this.handleError(error)
    }
  }

  async stopSimulation(simulationId: string): Promise<ApiResponse<any>> {
    try {
      const response = await this.client.delete(
        `/api/v1/robots/simulations/${simulationId}`
      )
      return { success: true, data: response.data }
    } catch (error) {
      return this.handleError(error)
    }
  }

  async changeSimulationSpeed(
    simulationId: string,
    speed: number
  ): Promise<ApiResponse<any>> {
    try {
      const response = await this.client.post(
        `/api/v1/robots/simulations/${simulationId}/speed`,
        {
          speed,
        }
      )
      return { success: true, data: response.data }
    } catch (error) {
      return this.handleError(error)
    }
  }

  private handleError(error: any): ApiResponse<any> {
    if (axios.isAxiosError(error)) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      }
    }
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}
