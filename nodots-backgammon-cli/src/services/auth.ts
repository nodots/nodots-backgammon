import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { homedir } from 'os'
import { join } from 'path'

export interface UserProfile {
  email?: string
  firstName?: string
  lastName?: string
  userId?: string
  token?: string
  loginTime?: string
}

export class AuthService {
  private configDir: string
  private configFile: string

  constructor() {
    this.configDir = join(homedir(), '.nodots-backgammon')
    this.configFile = join(this.configDir, 'auth.json')

    // Ensure config directory exists
    if (!existsSync(this.configDir)) {
      mkdirSync(this.configDir, { recursive: true })
    }
  }

  isLoggedIn(): boolean {
    try {
      const profile = this.getCurrentUser()
      return !!(profile && (profile.token || profile.userId))
    } catch {
      return false
    }
  }

  getCurrentUser(): UserProfile | null {
    try {
      if (!existsSync(this.configFile)) {
        return null
      }

      const data = readFileSync(this.configFile, 'utf8')
      const profile: UserProfile = JSON.parse(data)

      // Check if login is still valid (optional: could add expiration logic)
      if (profile.loginTime) {
        const loginTime = new Date(profile.loginTime)
        const now = new Date()
        const hoursSinceLogin =
          (now.getTime() - loginTime.getTime()) / (1000 * 60 * 60)

        // Consider login expired after 24 hours
        if (hoursSinceLogin > 24) {
          this.logout()
          return null
        }
      }

      return profile
    } catch {
      return null
    }
  }

  login(profile: Partial<UserProfile>): void {
    const fullProfile: UserProfile = {
      ...profile,
      loginTime: new Date().toISOString(),
    }

    writeFileSync(this.configFile, JSON.stringify(fullProfile, null, 2))
  }

  logout(): void {
    if (existsSync(this.configFile)) {
      try {
        // Don't delete the file, just clear sensitive data
        const emptyProfile = {}
        writeFileSync(this.configFile, JSON.stringify(emptyProfile, null, 2))
      } catch {
        // Silently fail if we can't clear the file
      }
    }
  }

  getApiConfig(): { userId?: string; apiKey?: string } {
    const user = this.getCurrentUser()
    if (!user) {
      return {}
    }

    return {
      userId: user.userId,
      apiKey: user.token,
    }
  }
}
