import { describe, expect, it } from '@jest/globals'
import { ApiService } from '../services/api'
import { CliConfig } from '../types'
import { BoardDisplay } from '../utils/board-display'

describe('CLI Tests', () => {
  describe('ApiService', () => {
    it('should create instance with config', () => {
      const config: CliConfig = {
        apiUrl: 'http://localhost:3000',
      }
      const apiService = new ApiService(config)
      expect(apiService).toBeInstanceOf(ApiService)
    })
  })

  describe('BoardDisplay', () => {
    it('should render possible moves', () => {
      const moves = [
        { from: 1, to: 3, dieValue: 2 },
        { from: 5, to: 8, dieValue: 3 },
      ]
      const output = BoardDisplay.renderPossibleMoves(moves)
      expect(output).toContain('Possible moves:')
      expect(output).toContain('1. 1 → 3 (die: 2)')
      expect(output).toContain('2. 5 → 8 (die: 3)')
    })

    it('should handle empty moves', () => {
      const output = BoardDisplay.renderPossibleMoves([])
      expect(output).toContain('No possible moves available')
    })
  })
})
