# Nodots Backgammon SSL Proxy

This directory contains SSL proxy servers that provide secure local development with valid certificates for `.home` domains.

## Features

- **SSL Termination**: Handles HTTPS with locally-generated certificates
- **Domain Routing**: Routes `nodots.home` and `api.nodots.home` to local services
- **Certificate Authority**: Creates and manages a local CA for trusted certificates
- **Health Monitoring**: Provides health check endpoints for monitoring

## Quick Start

```bash
# 1. Navigate to proxy directory
cd proxy

# 2. Install dependencies
npm install

# 3. Generate SSL certificates
npm run setup

# 4. Install CA certificate (macOS)
npm run install-ca-macos

# 5. Add domain entries to /etc/hosts
npm run add-hosts

# 6. Start proxy servers
npm start
```

## Architecture

```
┌─────────────────┐    ┌──────────────┐    ┌─────────────────┐
│ Browser         │    │ SSL Proxy    │    │ Local Dev       │
│                 │    │              │    │ Servers         │
│ nodots.home     ├────┤ :443         ├────┤ localhost:5437  │
│ (HTTPS)         │    │              │    │ (Client)        │
└─────────────────┘    │              │    │                 │
                       │              │    │                 │
┌─────────────────┐    │              │    │                 │
│ Browser         │    │              │    │                 │
│                 │    │              │    │                 │
│ api.nodots.home ├────┤ :8443        ├────┤ localhost:3000  │
│ (HTTPS)         │    │              │    │ (API)           │
└─────────────────┘    └──────────────┘    └─────────────────┘
```

## Configuration

### Domains and Ports

| Service | Domain | Proxy Port | Target |
|---------|--------|------------|--------|
| Client | `nodots.home` | 443 | `localhost:5437` |
| API | `api.nodots.home` | 8443 | `localhost:3000` |
| Health | `localhost` | 8080 | Health check |

### Certificate Details

- **CA Certificate**: `certs/ca/ca.crt`
- **CA Private Key**: `certs/ca/ca.key`
- **Domain Certificate**: `certs/domains/nodots.home.crt`
- **Domain Private Key**: `certs/domains/nodots.home.key`

## Commands

### Setup Commands

```bash
# Generate SSL certificates
npm run setup

# Install CA certificate on macOS
npm run install-ca-macos

# Install CA certificate on Linux
npm run install-ca-linux

# Add domain entries to /etc/hosts
npm run add-hosts
```

### Runtime Commands

```bash
# Start proxy servers
npm start

# Start with auto-restart on changes
npm run dev

# Check proxy health
npm run health

# Test proxy functionality
npm test
```

### Maintenance Commands

```bash
# Clean generated certificates and dependencies
npm run clean

# Reinstall dependencies
npm install
```

## Manual Setup Steps

If the automated setup doesn't work, follow these manual steps:

### 1. Add Domain Entries

Add these lines to `/etc/hosts`:

```
127.0.0.1 nodots.home
127.0.0.1 api.nodots.home
```

### 2. Install CA Certificate

#### macOS
```bash
sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain certs/ca/ca.crt
```

#### Linux
```bash
sudo cp certs/ca/ca.crt /usr/local/share/ca-certificates/nodots-dev-ca.crt
sudo update-ca-certificates
```

#### Windows
1. Double-click `certs/ca/ca.crt`
2. Click "Install Certificate"
3. Select "Local Machine"
4. Choose "Place all certificates in the following store"
5. Select "Trusted Root Certification Authorities"

## Testing

### Health Check

```bash
curl -s http://localhost:8080/health | jq .
```

Expected response:
```json
{
  "status": "healthy",
  "proxies": {
    "client": "https://nodots.home:443",
    "api": "https://api.nodots.home:8443"
  },
  "timestamp": "2025-08-02T..."
}
```

### SSL Certificate Verification

```bash
# Test client certificate
openssl s_client -connect nodots.home:443 -servername nodots.home

# Test API certificate  
openssl s_client -connect api.nodots.home:8443 -servername api.nodots.home
```

### Browser Testing

1. Navigate to `https://nodots.home`
2. Navigate to `https://api.nodots.home:8443`
3. Verify no SSL warnings appear

## Troubleshooting

### Common Issues

#### "Certificate not trusted" warnings
- Ensure CA certificate is installed in system trust store
- Restart browser after installing CA certificate
- Check that domain names match certificate SAN entries

#### "Connection refused" errors
- Verify proxy servers are running: `npm run health`
- Check that target services are running (client on 5437, API on 3000)
- Verify /etc/hosts entries are correct

#### Port conflicts
- Check if ports 443, 8443, or 8080 are in use
- Use different ports in `proxy-server.js` if needed
- Ensure you have permission to bind to port 443 (may need sudo on some systems)

#### Permission errors on port 443
```bash
# Option 1: Run with sudo (macOS/Linux)
sudo npm start

# Option 2: Use different port
# Edit proxy-server.js and change client.port to 4433
```

### Logs and Debugging

The proxy server provides detailed logging:

```
📍 CLIENT: GET nodots.home/
⏱️  CLIENT: 200 in 45ms
📍 API: POST api.nodots.home/api/v3.6/games
⏱️  API: 201 in 123ms
```

### File Permissions

Ensure certificate files have correct permissions:

```bash
chmod 600 certs/ca/ca.key certs/domains/nodots.home.key
chmod 644 certs/ca/ca.crt certs/domains/nodots.home.crt
```

## Security Notes

- **Development Only**: These certificates are for local development only
- **Self-Signed**: The CA is self-signed and should not be used in production
- **Local Network**: Certificates are only valid for localhost and .home domains
- **Private Keys**: Keep private keys secure and never commit them to version control

## Integration with Development Workflow

### Starting Development Environment

```bash
# Terminal 1: Start backend services
npm run start:api

# Terminal 2: Start frontend
npm run start:client  

# Terminal 3: Start proxy
cd proxy && npm start
```

### Browser URLs

- **Client**: `https://nodots.home`
- **API**: `https://api.nodots.home:8443`
- **Health Check**: `http://localhost:8080/health`

### Environment Variables

Update your `.env` files to use the proxy URLs:

```bash
# Client .env
VITE_API_URL=https://api.nodots.home:8443/api/v3.6
VITE_WEBSOCKET_URL=wss://api.nodots.home:8443

# API .env (if needed)
CORS_ORIGIN=https://nodots.home
```