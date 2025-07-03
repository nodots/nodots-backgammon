import chalk from 'chalk'
import { Command } from 'commander'
import inquirer from 'inquirer'
import { ApiService } from '../services/api'
import { AuthService } from '../services/auth'
import { Auth0DeviceFlow } from '../services/auth0-device-flow'
import { logger } from '../utils/logger'

// Auth0 configuration for CLI application
const AUTH0_CONFIG = {
  domain: process.env.AUTH0_DOMAIN || 'dev-8ykjldydiqcf2hqu.us.auth0.com',
  clientId: process.env.AUTH0_CLI_CLIENT_ID || 'YOUR_CLI_CLIENT_ID', // Configure via AUTH0_CLI_CLIENT_ID env var
  audience: process.env.AUTH0_AUDIENCE || 'nodots-backgammon-api',
}

export class LoginCommand extends Command {
  constructor() {
    super('login')
    this.description('Login to Nodots Backgammon')
    this.option('-t, --token <token>', 'API token (for service authentication)')
    this.action(this.execute.bind(this))
  }

  public async execute(options: { token?: string } = {}): Promise<void> {
    try {
      const authService = new AuthService()

      // Check if already logged in
      if (authService.isLoggedIn()) {
        const currentUser = authService.getCurrentUser()
        console.log(chalk.yellow('You are already logged in.'))
        if (currentUser?.email) {
          console.log(chalk.gray(`Logged in as: ${currentUser.email}`))
        }

        const { action } = await inquirer.prompt([
          {
            type: 'list',
            name: 'action',
            message: 'What would you like to do?',
            choices: [
              { name: 'Continue with current session', value: 'continue' },
              { name: 'Login with different account', value: 'relogin' },
              { name: 'Cancel', value: 'cancel' },
            ],
          },
        ])

        if (action === 'continue') {
          console.log(chalk.green('✅ Continuing with current session'))
          return
        } else if (action === 'cancel') {
          console.log(chalk.gray('Login cancelled'))
          return
        }
        // For 'relogin', continue with new login process
      }

      // If token is provided via command line (for CI/service usage)
      if (options.token) {
        return await this.handleTokenLogin(options.token, authService)
      }

      // Interactive login method selection
      const { method } = await inquirer.prompt([
        {
          type: 'list',
          name: 'method',
          message: 'How would you like to login?',
          choices: [
            {
              name: '🌐 Browser Authentication (Recommended)',
              value: 'browser',
            },
            { name: '🔑 API Token', value: 'token' },
            { name: '📧 Email (Legacy CLI method)', value: 'email' },
          ],
        },
      ])

      switch (method) {
        case 'browser':
          await this.handleBrowserLogin(authService)
          break
        case 'token':
          await this.handleInteractiveTokenLogin(authService)
          break
        case 'email':
          await this.handleEmailLogin(authService)
          break
      }
    } catch (error) {
      logger.error('Login failed:', error)
      console.log(chalk.red('❌ Login failed'))
      console.log(
        chalk.red(error instanceof Error ? error.message : String(error))
      )
      process.exit(1)
    }
  }

  private async handleBrowserLogin(authService: AuthService): Promise<void> {
    try {
      // Validate Auth0 configuration
      if (
        !AUTH0_CONFIG.clientId ||
        AUTH0_CONFIG.clientId === 'YOUR_CLI_CLIENT_ID'
      ) {
        console.log(chalk.red('\n❌ Auth0 configuration missing!'))
        console.log(
          chalk.yellow('\nTo use browser authentication, you need to:')
        )
        console.log(
          chalk.gray('1. Set up an Auth0 application for device flow')
        )
        console.log(
          chalk.gray(
            '2. Configure the AUTH0_CLI_CLIENT_ID environment variable'
          )
        )
        console.log(chalk.gray('3. Or update the configuration in the code'))
        console.log(
          chalk.gray('\nFor now, please use one of these alternatives:')
        )
        console.log(chalk.gray('• Email authentication (Legacy CLI method)'))
        console.log(chalk.gray('• API token authentication'))
        console.log(
          chalk.gray('\nSee AUTH0_SETUP_GUIDE.md for setup instructions.\n')
        )

        const { fallback } = await inquirer.prompt([
          {
            type: 'list',
            name: 'fallback',
            message: 'Choose an alternative login method:',
            choices: [
              { name: '📧 Email (Legacy CLI method)', value: 'email' },
              { name: '🔑 API Token', value: 'token' },
              { name: '❌ Cancel', value: 'cancel' },
            ],
          },
        ])

        if (fallback === 'email') {
          return await this.handleEmailLogin(authService)
        } else if (fallback === 'token') {
          return await this.handleInteractiveTokenLogin(authService)
        } else {
          console.log(chalk.gray('Login cancelled'))
          return
        }
      }

      console.log(chalk.blue('\n🔐 Starting browser authentication...'))
      console.log(
        chalk.gray('This will open your default browser for secure login.\n')
      )

      const deviceFlow = new Auth0DeviceFlow(AUTH0_CONFIG)

      // Perform OAuth2 device flow authentication
      const tokenResponse = await deviceFlow.authenticate()

      // Get user profile from Auth0
      const userProfile = await deviceFlow.getUserProfile(
        tokenResponse.access_token
      )

      logger.info('Browser authentication successful', {
        userSub: userProfile.sub,
        email: userProfile.email,
      })

      // Create/update user in our API
      const apiService = new ApiService()
      const [source, externalId] = userProfile.sub.split('|')

      const userData = {
        source,
        externalId,
        email: userProfile.email,
        given_name: userProfile.given_name,
        family_name: userProfile.family_name,
        nickname: userProfile.nickname,
        picture: userProfile.picture,
        locale: userProfile.locale || 'en-US',
        userType: 'human',
      }

      const userResponse = await apiService.createOrUpdateUser(userData)

      if (!userResponse.success) {
        throw new Error(`Failed to sync user with API: ${userResponse.error}`)
      }

      // Store authentication information
      const authData = {
        email: userProfile.email,
        firstName: userProfile.given_name,
        lastName: userProfile.family_name,
        userId: userResponse.data.id,
        token: tokenResponse.access_token,
        authMethod: 'auth0-browser',
        loginTime: new Date().toISOString(),
      }

      authService.login(authData)

      console.log(chalk.green('\n✅ Login successful!'))
      console.log(chalk.gray(`Welcome back, ${userProfile.email}!`))
      console.log(
        chalk.gray(
          'You can now use CLI commands that require authentication.\n'
        )
      )
    } catch (error) {
      logger.error('Browser authentication failed:', error)
      throw new Error(
        `Browser authentication failed: ${
          error instanceof Error ? error.message : String(error)
        }`
      )
    }
  }

  private async handleTokenLogin(
    token: string,
    authService: AuthService
  ): Promise<void> {
    // For direct token usage (CI/automation)
    const authData = {
      token,
      authMethod: 'api-token',
      loginTime: new Date().toISOString(),
    }

    authService.login(authData)
    console.log(chalk.green('✅ Token authentication successful'))
    logger.info('API token authentication completed')
  }

  private async handleInteractiveTokenLogin(
    authService: AuthService
  ): Promise<void> {
    const { token } = await inquirer.prompt([
      {
        type: 'password',
        name: 'token',
        message: 'Enter your API token:',
        mask: '*',
      },
    ])

    await this.handleTokenLogin(token, authService)
  }

  private async handleEmailLogin(authService: AuthService): Promise<void> {
    // Legacy email-based CLI registration
    const { email } = await inquirer.prompt([
      {
        type: 'input',
        name: 'email',
        message: 'Enter your email address:',
        validate: (input) => {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
          return emailRegex.test(input) || 'Please enter a valid email address'
        },
      },
    ])

    const apiService = new ApiService()

    // Generate CLI-specific credentials
    const timestamp = Date.now()
    const externalId = `cli-user-${timestamp}`
    const token = `cli|${externalId}`

    const userData = {
      source: 'cli',
      externalId,
      email,
      given_name: 'CLI',
      family_name: 'User',
      locale: 'en-US',
      userType: 'human',
    }

    const response = await apiService.createOrUpdateUser(userData)

    if (!response.success) {
      throw new Error(`Failed to create user: ${response.error}`)
    }

    const authData = {
      email,
      firstName: 'CLI',
      lastName: 'User',
      userId: response.data.id,
      token,
      authMethod: 'cli-email',
      loginTime: new Date().toISOString(),
    }

    authService.login(authData)

    console.log(chalk.green('✅ Login successful!'))
    console.log(
      chalk.gray(
        'You can now use other CLI commands that require authentication.'
      )
    )
    logger.info('Email-based CLI authentication completed', { email })
  }
}
