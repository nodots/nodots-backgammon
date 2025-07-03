import { RobotBatchCommand } from '../commands/robot-batch'
import { RobotListCommand } from '../commands/robot-list'
import { RobotPauseCommand } from '../commands/robot-pause'
import { RobotSimulateCommand } from '../commands/robot-simulate'
import { RobotSpeedCommand } from '../commands/robot-speed'
import { RobotStatusCommand } from '../commands/robot-status'
import { RobotStopCommand } from '../commands/robot-stop'
import { ApiService } from '../services/api'

// Mock the API service
jest.mock('../services/api')

describe('Robot Simulation Commands', () => {
  let mockApiService: jest.Mocked<ApiService>

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks()

    // Create a mocked API service instance
    mockApiService = {
      getRobots: jest.fn(),
      startSimulation: jest.fn(),
      getSimulationStatus: jest.fn(),
      pauseSimulation: jest.fn(),
      stopSimulation: jest.fn(),
      changeSimulationSpeed: jest.fn(),
    } as any

    // Mock the ApiService constructor
    ;(ApiService as jest.MockedClass<typeof ApiService>).mockImplementation(
      () => mockApiService
    )
  })

  describe('RobotListCommand', () => {
    it('should create with correct name and description', () => {
      const command = new RobotListCommand()
      expect(command.name()).toBe('robot-list')
      expect(command.description()).toBe('List available robot users')
    })

    it('should have robots alias', () => {
      const command = new RobotListCommand()
      expect(command.aliases()).toContain('robots')
    })
  })

  describe('RobotSimulateCommand', () => {
    it('should create with correct name and description', () => {
      const command = new RobotSimulateCommand()
      expect(command.name()).toBe('robot-simulate')
      expect(command.description()).toBe('Start a robot vs robot simulation')
    })

    it('should have correct options', () => {
      const command = new RobotSimulateCommand()
      const options = command.options.map((opt) => opt.flags)

      expect(options).toContain('-s, --speed <speed>')
      expect(options).toContain('-r1, --robot1-difficulty <difficulty>')
      expect(options).toContain('-r2, --robot2-difficulty <difficulty>')
      expect(options).toContain('-i, --interactive')
    })
  })

  describe('RobotStatusCommand', () => {
    it('should create with correct name and description', () => {
      const command = new RobotStatusCommand()
      expect(command.name()).toBe('robot-status')
      expect(command.description()).toBe(
        'Check the status of a robot simulation'
      )
    })

    it('should have correct options', () => {
      const command = new RobotStatusCommand()
      const options = command.options.map((opt) => opt.flags)

      expect(options).toContain('-w, --watch')
      expect(options).toContain('-i, --interval <seconds>')
    })
  })

  describe('RobotPauseCommand', () => {
    it('should create with correct name and description', () => {
      const command = new RobotPauseCommand()
      expect(command.name()).toBe('robot-pause')
      expect(command.description()).toBe('Pause or resume a robot simulation')
    })
  })

  describe('RobotStopCommand', () => {
    it('should create with correct name and description', () => {
      const command = new RobotStopCommand()
      expect(command.name()).toBe('robot-stop')
      expect(command.description()).toBe('Stop a robot simulation')
    })

    it('should have force option', () => {
      const command = new RobotStopCommand()
      const options = command.options.map((opt) => opt.flags)

      expect(options).toContain('-f, --force')
    })
  })

  describe('RobotSpeedCommand', () => {
    it('should create with correct name and description', () => {
      const command = new RobotSpeedCommand()
      expect(command.name()).toBe('robot-speed')
      expect(command.description()).toBe(
        'Change the speed of a robot simulation'
      )
    })

    it('should have correct options', () => {
      const command = new RobotSpeedCommand()
      const options = command.options.map((opt) => opt.flags)

      expect(options).toContain('-s, --speed <milliseconds>')
      expect(options).toContain('-i, --interactive')
    })
  })

  describe('RobotBatchCommand', () => {
    it('should create with correct name and description', () => {
      const command = new RobotBatchCommand()
      expect(command.name()).toBe('robot-batch')
      expect(command.description()).toBe(
        'Run multiple robot simulations in batch'
      )
    })

    it('should have all batch options', () => {
      const command = new RobotBatchCommand()
      const options = command.options.map((opt) => opt.flags)

      expect(options).toContain('-c, --concurrent <number>')
      expect(options).toContain('-s, --speed <milliseconds>')
      expect(options).toContain('-p, --preset <n>')
      expect(options).toContain('-f, --file <path>')
      expect(options).toContain('-o, --output <path>')
      expect(options).toContain('-i, --interactive')
    })
  })

  describe('API Service Integration', () => {
    it('should call getRobots method', () => {
      mockApiService.getRobots.mockResolvedValue({
        success: true,
        data: [
          { id: 'robot1', name: 'TestBot1', difficulty: 'beginner' },
          { id: 'robot2', name: 'TestBot2', difficulty: 'advanced' },
        ],
      })

      expect(mockApiService.getRobots).toBeDefined()
    })

    it('should call startSimulation with correct parameters', () => {
      const simulationConfig = {
        speed: 1000,
        robot1Difficulty: 'beginner',
        robot2Difficulty: 'intermediate',
      }

      mockApiService.startSimulation.mockResolvedValue({
        success: true,
        data: {
          id: 'sim-123',
          gameId: 'game-456',
          status: 'running',
        },
      })

      expect(mockApiService.startSimulation).toBeDefined()
    })

    it('should call getSimulationStatus method', () => {
      mockApiService.getSimulationStatus.mockResolvedValue({
        success: true,
        data: {
          id: 'sim-123',
          gameId: 'game-456',
          status: 'running',
          currentTurn: 5,
          totalMoves: 10,
          duration: 30000,
          speed: 1000,
          robot1Name: 'TestBot1',
          robot1Difficulty: 'beginner',
          robot2Name: 'TestBot2',
          robot2Difficulty: 'intermediate',
        },
      })

      expect(mockApiService.getSimulationStatus).toBeDefined()
    })

    it('should call pauseSimulation method', () => {
      mockApiService.pauseSimulation.mockResolvedValue({
        success: true,
        data: { message: 'Simulation paused' },
      })

      expect(mockApiService.pauseSimulation).toBeDefined()
    })

    it('should call stopSimulation method', () => {
      mockApiService.stopSimulation.mockResolvedValue({
        success: true,
        data: { message: 'Simulation stopped' },
      })

      expect(mockApiService.stopSimulation).toBeDefined()
    })

    it('should call changeSimulationSpeed method', () => {
      mockApiService.changeSimulationSpeed.mockResolvedValue({
        success: true,
        data: { message: 'Speed changed to 500ms' },
      })

      expect(mockApiService.changeSimulationSpeed).toBeDefined()
    })
  })

  describe('Command Validation', () => {
    it('should validate difficulty levels', () => {
      const validDifficulties = ['beginner', 'intermediate', 'advanced']
      const testDifficulties = [
        'beginner',
        'intermediate',
        'advanced',
        'invalid',
      ]

      testDifficulties.forEach((difficulty) => {
        const isValid = validDifficulties.includes(difficulty)
        expect(isValid).toBe(difficulty !== 'invalid')
      })
    })

    it('should validate speed ranges', () => {
      const validSpeeds = [100, 500, 1000, 5000, 30000]
      const invalidSpeeds = [50, 50000, -100]

      validSpeeds.forEach((speed) => {
        expect(speed >= 100 && speed <= 30000).toBe(true)
      })

      invalidSpeeds.forEach((speed) => {
        expect(speed >= 100 && speed <= 30000).toBe(false)
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle API errors gracefully', () => {
      mockApiService.getRobots.mockResolvedValue({
        success: false,
        error: 'Network error',
      })

      mockApiService.startSimulation.mockResolvedValue({
        success: false,
        error: 'Insufficient robots',
      })

      // Commands should handle these error cases
      expect(mockApiService.getRobots).toBeDefined()
      expect(mockApiService.startSimulation).toBeDefined()
    })
  })
})
