import axios from 'axios'
import open from 'open'
import { logger } from '../utils/logger'

export interface DeviceCodeResponse {
  device_code: string
  user_code: string
  verification_uri: string
  verification_uri_complete: string
  expires_in: number
  interval: number
}

export interface TokenResponse {
  access_token: string
  token_type: string
  expires_in: number
  scope?: string
}

export interface DeviceFlowConfig {
  domain: string
  clientId: string
  audience: string
  scope?: string
}

export class Auth0DeviceFlow {
  private config: DeviceFlowConfig
  private readonly POLL_TIMEOUT = 300000 // 5 minutes

  constructor(config: DeviceFlowConfig) {
    this.config = {
      scope: 'openid profile email',
      ...config,
    }
  }

  /**
   * Initiate device authorization flow
   * Returns device code and user code for verification
   */
  async initiateDeviceFlow(): Promise<DeviceCodeResponse> {
    try {
      const response = await axios.post(
        `https://${this.config.domain}/oauth/device/code`,
        {
          client_id: this.config.clientId,
          scope: this.config.scope,
          audience: this.config.audience,
        },
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      )

      return response.data as DeviceCodeResponse
    } catch (error: any) {
      logger.error('[Device Flow] Failed to initiate device flow:', error)

      // Provide more specific error messages
      if (error.response?.status === 400) {
        if (error.response.data?.error === 'invalid_client') {
          throw new Error(
            'Invalid Auth0 client ID. Please check your AUTH0_CLI_CLIENT_ID configuration.'
          )
        } else if (error.response.data?.error === 'unauthorized_client') {
          throw new Error(
            'Auth0 application not configured for device flow. Please enable Device Code grant type in Auth0.'
          )
        } else if (error.response.data?.error === 'invalid_audience') {
          throw new Error(
            'Invalid audience. Please check your AUTH0_AUDIENCE configuration.'
          )
        }
      } else if (error.response?.status === 403) {
        throw new Error(
          'Auth0 application not authorized for device flow. Please configure the application properly.'
        )
      } else if (error.code === 'ENOTFOUND') {
        throw new Error(
          `Cannot reach Auth0 domain: ${this.config.domain}. Please check your AUTH0_DOMAIN configuration.`
        )
      }

      throw new Error(
        `Failed to initiate device authorization flow: ${
          error.response?.data?.error_description || error.message
        }`
      )
    }
  }

  /**
   * Poll Auth0 for access token using device code
   */
  async pollForToken(
    deviceCode: string,
    interval: number
  ): Promise<TokenResponse> {
    const startTime = Date.now()

    while (Date.now() - startTime < this.POLL_TIMEOUT) {
      try {
        await this.sleep(interval * 1000)

        const response = await axios.post(
          `https://${this.config.domain}/oauth/token`,
          {
            grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
            device_code: deviceCode,
            client_id: this.config.clientId,
          },
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          }
        )

        return response.data as TokenResponse
      } catch (error: any) {
        if (error.response?.data?.error === 'authorization_pending') {
          // User hasn't completed authorization yet, continue polling
          continue
        } else if (error.response?.data?.error === 'slow_down') {
          // Rate limited, wait a bit longer
          await this.sleep(5000)
          continue
        } else if (error.response?.data?.error === 'expired_token') {
          throw new Error('Device code expired. Please try logging in again.')
        } else if (error.response?.data?.error === 'access_denied') {
          throw new Error('User denied the authorization request.')
        } else {
          logger.error(
            '[Device Flow] Token polling error:',
            error.response?.data || error.message
          )
          throw new Error('Failed to get access token')
        }
      }
    }

    throw new Error('Authentication timeout. Please try logging in again.')
  }

  /**
   * Complete device flow authentication process
   * Opens browser and polls for token
   */
  async authenticate(): Promise<TokenResponse> {
    logger.info('[Device Flow] Starting Auth0 device authorization flow...')

    // Step 1: Get device code
    const deviceResponse = await this.initiateDeviceFlow()

    logger.info(
      `[Device Flow] Please visit: ${deviceResponse.verification_uri}`
    )
    logger.info(`[Device Flow] Enter code: ${deviceResponse.user_code}`)

    // Step 2: Open browser automatically
    try {
      await open(deviceResponse.verification_uri_complete)
      logger.info('[Device Flow] Browser opened automatically')
    } catch (error) {
      logger.warn('[Device Flow] Could not open browser automatically')
      logger.info(
        `[Device Flow] Please manually visit: ${deviceResponse.verification_uri_complete}`
      )
    }

    // Step 3: Display user instructions
    console.log('\n🔐 **Authentication Required**')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`📱 A browser window should have opened automatically.`)
    console.log(`🌐 If not, please visit: ${deviceResponse.verification_uri}`)
    console.log(`🔑 Enter this code: ${deviceResponse.user_code}`)
    console.log('✋ Complete the login process in your browser.')
    console.log('⏳ Waiting for authentication...\n')

    // Step 4: Poll for access token
    try {
      const tokenResponse = await this.pollForToken(
        deviceResponse.device_code,
        deviceResponse.interval
      )

      logger.info('[Device Flow] Authentication successful!')
      console.log('✅ Authentication successful!\n')

      return tokenResponse
    } catch (error) {
      logger.error('[Device Flow] Authentication failed:', error)
      throw error
    }
  }

  /**
   * Get user profile information using access token
   */
  async getUserProfile(accessToken: string): Promise<any> {
    try {
      const response = await axios.get(
        `https://${this.config.domain}/userinfo`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )

      return response.data
    } catch (error) {
      logger.error('[Device Flow] Failed to get user profile:', error)
      throw new Error('Failed to get user profile')
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}
