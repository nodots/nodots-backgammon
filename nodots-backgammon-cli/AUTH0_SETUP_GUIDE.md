# Auth0 Device Flow Setup Guide

## Overview

The Nodots Backgammon CLI now supports OAuth2 Device Flow authentication, providing a secure, user-friendly way to authenticate via the browser instead of manually entering JWT tokens.

## Auth0 Configuration Required

To enable browser authentication, you need to set up an Auth0 application configured for Device Flow.

### 1. Create Auth0 Application

1. **Log into Auth0 Dashboard**: Go to [Auth0 Dashboard](https://manage.auth0.com)
2. **Create Application**:
   - Click "Applications" → "Create Application"
   - Name: "Nodots Backgammon CLI"
   - Type: **Native Application**
   - Click "Create"

### 2. Configure Application Settings

#### Grant Types

Enable the following grant types:

- ✅ **Device Code** (required for CLI device flow)
- ✅ **Refresh Token** (optional, for token refresh)

#### Advanced Settings

- **Grant Types** tab:
  - Enable: `urn:ietf:params:oauth:grant-type:device_code`
  - Enable: `refresh_token` (optional)

#### APIs

- **Machine to Machine Applications** tab:
  - Authorize this application for your API
  - API Identifier: `nodots-backgammon-api`
  - Scopes: `read:games`, `write:games`, `read:users`, `write:users`

### 3. Update CLI Configuration

Update the client ID in the CLI code:

```typescript
// In src/commands/login.ts
const AUTH0_CONFIG = {
  domain: 'dev-8ykjldydiqcf2hqu.us.auth0.com',
  clientId: 'YOUR_ACTUAL_CLIENT_ID', // Replace with real Auth0 client ID
  audience: 'nodots-backgammon-api',
}
```

### 4. Environment Variables (Optional)

You can also configure via environment variables:

```bash
# .env file or environment
AUTH0_CLI_CLIENT_ID=your_auth0_client_id
AUTH0_DOMAIN=dev-8ykjldydiqcf2hqu.us.auth0.com
AUTH0_AUDIENCE=nodots-backgammon-api
```

## How Device Flow Works

### User Experience

1. User runs `nodots-backgammon login`
2. CLI opens browser to Auth0 login page
3. User logs in with their Auth0 credentials
4. User grants permission to CLI application
5. CLI receives access token automatically
6. User can now use authenticated CLI commands

### Technical Flow

1. **Device Authorization Request**: CLI requests device code from Auth0
2. **User Authorization**: Browser opens to Auth0 with verification URL
3. **Device Polling**: CLI polls Auth0 for access token
4. **Token Exchange**: Once user authorizes, Auth0 returns JWT token
5. **API Integration**: CLI uses token for authenticated API requests

## Benefits vs Manual Token Entry

### ❌ **Before: Manual Token Entry**

- User must manually obtain JWT from browser dev tools
- Tokens expire, requiring manual refresh
- Poor security (tokens in terminal history)
- Complex, technical process

### ✅ **After: OAuth2 Device Flow**

- **User-friendly**: Browser-based login
- **Secure**: No tokens in terminal history
- **Automatic**: Handles token management
- **Standard**: Uses OAuth2 industry standard
- **Familiar**: Same login as web application

## Alternative Authentication Methods

The CLI supports multiple authentication methods:

### 1. 🌐 Browser Authentication (Recommended)

- OAuth2 Device Flow with Auth0
- Opens browser for secure login
- Best user experience

### 2. 🔑 API Token

- For CI/automation environments
- Direct token input
- Non-interactive

### 3. 📧 Email (Legacy)

- Creates CLI-specific user account
- No Auth0 dependency
- Fallback option

## Testing Without Auth0 Setup

If Auth0 is not yet configured, you can test using:

```bash
# Email-based authentication (works immediately)
nodots-backgammon login
# Select: "📧 Email (Legacy CLI method)"

# Or API token authentication
nodots-backgammon login --token "your-api-token"
```

## Security Considerations

### Device Flow Security

- **No Client Secret**: Native apps don't store secrets
- **User Authorization**: User must explicitly authorize
- **Short-lived Codes**: Device codes expire quickly
- **Audience Validation**: Tokens scoped to specific API

### Token Storage

- Tokens stored in `~/.nodots-backgammon/auth.json`
- File permissions: readable only by user
- Automatic token expiration handling

## Troubleshooting

### "Unauthorized or unknown client"

- Auth0 application not configured for device flow
- Incorrect client ID in configuration
- Device Code grant type not enabled

### "Invalid audience"

- API not configured in Auth0
- Incorrect audience identifier
- Application not authorized for API

### Browser doesn't open

- CLI falls back to manual URL instructions
- Check if `open` command is available
- Copy URL manually to browser

## Next Steps

1. **Configure Auth0**: Set up device flow application
2. **Update Client ID**: Replace placeholder with real client ID
3. **Test Authentication**: Try browser login flow
4. **Deploy**: Users get secure, user-friendly authentication

This system provides the same quality authentication experience as modern CLI tools like GitHub CLI, AWS CLI, and Docker CLI.
