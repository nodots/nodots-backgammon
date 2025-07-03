import fs from 'fs/promises'
import path from 'path'
import os from 'os'
import axios from 'axios'
import chalk from 'chalk'
import open from 'open'

interface AuthConfig {
  access_token: string
  refresh_token?: string
  expires_at?: number
  user_email?: string
}

interface DeviceFlowResponse {
  device_code: string
  user_code: string
  verification_uri: string
  verification_uri_complete: string
  expires_in: number
  interval: number
}

interface TokenResponse {
  access_token: string
  token_type: string
  expires_in: number
  refresh_token?: string
  scope?: string
}

export class AuthService {
  private configDir: string
  private configFile: string
  private apiUrl: string

  constructor() {
    this.configDir = path.join(os.homedir(), '.nodots-backgammon')
    this.configFile = path.join(this.configDir, 'auth.json')
    this.apiUrl = process.env.API_URL || 'http://localhost:3000'
  }

  async ensureConfigDir(): Promise<void> {
    try {
      await fs.mkdir(this.configDir, { recursive: true })
    } catch (error) {
      // Directory already exists
    }
  }

  async saveAuth(config: AuthConfig): Promise<void> {
    await this.ensureConfigDir()
    await fs.writeFile(this.configFile, JSON.stringify(config, null, 2))
  }

  async loadAuth(): Promise<AuthConfig | null> {
    try {
      const data = await fs.readFile(this.configFile, 'utf8')
      return JSON.parse(data)
    } catch (error) {
      return null
    }
  }

  async clearAuth(): Promise<void> {
    try {
      await fs.unlink(this.configFile)
    } catch (error) {
      // File doesn't exist
    }
  }

  async initiateDeviceFlow(): Promise<DeviceFlowResponse> {
    try {
      const response = await axios.post(`${this.apiUrl}/api/v1/auth/device`, {})
      return response.data
    } catch (error) {
      throw new Error(`Device flow initiation failed: ${error}`)
    }
  }

  async pollForToken(deviceCode: string, interval: number, expiresIn: number): Promise<TokenResponse> {
    const endTime = Date.now() + (expiresIn * 1000)
    
    while (Date.now() < endTime) {
      try {
        const response = await axios.post(`${this.apiUrl}/api/v1/auth/token`, {
          grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
          device_code: deviceCode
        })
        
        return response.data
      } catch (error: any) {
        if (error.response?.data?.error === 'authorization_pending') {
          // Continue polling
          await new Promise(resolve => setTimeout(resolve, interval * 1000))
          continue
        } else if (error.response?.data?.error === 'slow_down') {
          // Increase interval
          await new Promise(resolve => setTimeout(resolve, (interval + 5) * 1000))
          continue
        } else {
          throw new Error(`Token polling failed: ${error.response?.data?.error || error.message}`)
        }
      }
    }
    
    throw new Error('Device flow expired')
  }

  async login(): Promise<boolean> {
    try {
      console.log(chalk.blue('🔐 Starting Auth0 device flow authentication...'))
      
      // Check if API is accessible
      try {
        await axios.get(`${this.apiUrl}/api/v1/health`)
      } catch (error) {
        console.error(chalk.red('❌ Cannot connect to API server'))
        console.log(chalk.yellow('Make sure the API server is running on port 3000'))
        return false
      }

      // For development, use a simple token approach
      if (process.env.NODE_ENV === 'development') {
        console.log(chalk.yellow('📋 Development mode: Using CLI token'))
        
        const authConfig: AuthConfig = {
          access_token: 'cli|kenr@nodots.com',
          user_email: 'kenr@nodots.com',
          expires_at: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
        }
        
        await this.saveAuth(authConfig)
        console.log(chalk.green('✅ Authentication successful'))
        return true
      }

      // Production Auth0 device flow
      const deviceFlow = await this.initiateDeviceFlow()
      
      console.log(chalk.cyan('\n📱 Please complete authentication in your browser:'))
      console.log(chalk.white(`🔗 ${deviceFlow.verification_uri}`))
      console.log(chalk.yellow(`🔢 User Code: ${deviceFlow.user_code}`))
      console.log(chalk.gray('Press Ctrl+C to cancel\n'))

      // Open browser automatically
      try {
        await open(deviceFlow.verification_uri_complete)
        console.log(chalk.green('🌐 Browser opened automatically'))
      } catch (error) {
        console.log(chalk.yellow('⚠️  Could not open browser automatically'))
      }

      console.log(chalk.blue('⏳ Waiting for authentication...'))

      const tokenResponse = await this.pollForToken(
        deviceFlow.device_code,
        deviceFlow.interval,
        deviceFlow.expires_in
      )

      const authConfig: AuthConfig = {
        access_token: tokenResponse.access_token,
        refresh_token: tokenResponse.refresh_token,
        expires_at: Date.now() + (tokenResponse.expires_in * 1000),
        user_email: 'user@example.com' // Will be updated from profile
      }

      await this.saveAuth(authConfig)
      console.log(chalk.green('✅ Authentication successful'))
      return true

    } catch (error) {
      console.error(chalk.red(`❌ Authentication failed: ${error}`))
      return false
    }
  }

  async getValidToken(): Promise<string | null> {
    const auth = await this.loadAuth()
    if (!auth) {
      return null
    }

    // Check if token is expired (with 5 minute buffer)
    if (auth.expires_at && auth.expires_at < Date.now() + (5 * 60 * 1000)) {
      console.log(chalk.yellow('🔄 Token expired, please login again'))
      return null
    }

    return auth.access_token
  }

  async isAuthenticated(): Promise<boolean> {
    const token = await this.getValidToken()
    return !!token
  }

  async requireAuth(): Promise<string> {
    const token = await this.getValidToken()
    if (!token) {
      console.log(chalk.red('❌ Not authenticated. Please run `backgammon login` first'))
      process.exit(1)
    }
    return token
  }
}