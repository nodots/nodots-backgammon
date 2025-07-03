import axios from 'axios'

export class GameService {
  private apiUrl: string

  constructor() {
    this.apiUrl = process.env.API_URL || 'http://localhost:3000'
  }

  async createGame(token: string): Promise<any> {
    try {
      const response = await axios.post(
        `${this.apiUrl}/api/v1/games`,
        { opponent: 'robot' },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )
      return response.data
    } catch (error: any) {
      throw new Error(error.response?.data?.error || error.message)
    }
  }

  async listGames(token: string): Promise<any> {
    try {
      const response = await axios.get(
        `${this.apiUrl}/api/v1/games`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      )
      return response.data
    } catch (error: any) {
      throw new Error(error.response?.data?.error || error.message)
    }
  }

  async getGame(gameId: string, token: string): Promise<any> {
    try {
      const response = await axios.get(
        `${this.apiUrl}/api/v1/games/${gameId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      )
      return response.data
    } catch (error: any) {
      throw new Error(error.response?.data?.error || error.message)
    }
  }

  async rollDice(gameId: string, token: string): Promise<any> {
    try {
      const response = await axios.post(
        `${this.apiUrl}/api/v1/games/${gameId}/roll`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )
      return response.data
    } catch (error: any) {
      throw new Error(error.response?.data?.error || error.message)
    }
  }

  async makeMove(gameId: string, from: number, to: number, token: string): Promise<any> {
    try {
      const response = await axios.post(
        `${this.apiUrl}/api/v1/games/${gameId}/move`,
        { from, to },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )
      return response.data
    } catch (error: any) {
      throw new Error(error.response?.data?.error || error.message)
    }
  }

  async endTurn(gameId: string, token: string): Promise<any> {
    try {
      const response = await axios.post(
        `${this.apiUrl}/api/v1/games/${gameId}/play`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )
      return response.data
    } catch (error: any) {
      throw new Error(error.response?.data?.error || error.message)
    }
  }
}