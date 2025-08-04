#!/bin/bash

# Automated installation script for Nodots Backgammon SSL Proxy
# This script sets up everything needed for local HTTPS development

set -e

echo "🚀 Installing Nodots Backgammon SSL Proxy..."
echo ""

# Check if running on macOS
if [[ "$OSTYPE" == "darwin"* ]]; then
    PLATFORM="macos"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    PLATFORM="linux"
else
    echo "❌ Unsupported platform: $OSTYPE"
    echo "This script supports macOS and Linux only."
    exit 1
fi

echo "🔍 Detected platform: $PLATFORM"

# Check if we're in the proxy directory
if [[ ! -f "package.json" ]] || [[ ! -f "setup-certs.sh" ]]; then
    echo "❌ Please run this script from the proxy directory"
    exit 1
fi

# Step 1: Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Step 2: Generate certificates
echo ""
echo "🔒 Generating SSL certificates..."
./setup-certs.sh

# Step 3: Install CA certificate
echo ""
echo "🔑 Installing CA certificate..."
if [[ "$PLATFORM" == "macos" ]]; then
    echo "Installing CA certificate for macOS..."
    sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain certs/ca/ca.crt
    echo "✅ CA certificate installed"
elif [[ "$PLATFORM" == "linux" ]]; then
    echo "Installing CA certificate for Linux..."
    sudo cp certs/ca/ca.crt /usr/local/share/ca-certificates/nodots-dev-ca.crt
    sudo update-ca-certificates
    echo "✅ CA certificate installed"
fi

# Step 4: Add hosts entries
echo ""
echo "🌐 Adding hosts entries..."

# Check if entries already exist
if grep -q "nodots.home" /etc/hosts && grep -q "api.nodots.home" /etc/hosts; then
    echo "ℹ️  Hosts entries already exist"
else
    echo "Adding entries to /etc/hosts..."
    echo "" | sudo tee -a /etc/hosts > /dev/null
    echo "# Nodots Development Domains" | sudo tee -a /etc/hosts > /dev/null
    echo "127.0.0.1 nodots.home" | sudo tee -a /etc/hosts > /dev/null
    echo "127.0.0.1 api.nodots.home" | sudo tee -a /etc/hosts > /dev/null
    echo "✅ Hosts entries added"
fi

# Step 5: Test installation
echo ""
echo "🧪 Testing installation..."

# Start health check server temporarily for testing
node -e "
const http = require('http');
const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'test-ok', timestamp: new Date().toISOString() }));
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});
server.listen(8080, () => {
  console.log('✅ Health check server started');
  setTimeout(() => {
    server.close();
    console.log('✅ Health check server stopped');
  }, 1000);
});
" &

sleep 2

# Test certificate validity
echo "🔍 Validating certificate..."
openssl x509 -in certs/domains/nodots.home.crt -text -noout | grep -E "(Subject:|DNS:|IP Address:)" || true

echo ""
echo "🎉 Installation complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Start your development servers:"
echo "      cd .. && npm run start:api-only"
echo "      cd .. && npm run start:client-only"
echo ""
echo "   2. Start the proxy server:"
echo "      npm start"
echo ""
echo "   3. Visit your app:"
echo "      https://nodots.home (Client)"
echo "      https://api.nodots.home:8443 (API)"
echo ""
echo "   4. Or start everything together:"
echo "      cd .. && npm run start:with-proxy"
echo ""
echo "🔧 Useful commands:"
echo "   npm run health    - Check proxy health"
echo "   npm test         - Test proxy functionality"
echo "   npm run dev      - Start proxy with auto-restart"
echo ""