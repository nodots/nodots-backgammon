#!/bin/bash

# Nodots Backgammon CLI Installation Script

set -e

CLI_NAME="ndbg"
INSTALL_DIR="/usr/local/bin"
SOURCE_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "🎮 Installing Nodots Backgammon CLI..."

# Build the CLI
echo "📦 Building CLI..."
cd "$SOURCE_DIR"
npm run build

# Make executable
echo "🔧 Making executable..."
chmod +x dist/index.js

# Create symlink
echo "🔗 Creating global command '$CLI_NAME'..."
sudo ln -sf "$SOURCE_DIR/dist/index.js" "$INSTALL_DIR/$CLI_NAME"

# Verify installation
echo "✅ Installation complete!"
echo ""
echo "Test the installation:"
echo "  $CLI_NAME --help"
echo "  $CLI_NAME --version"
echo ""
echo "Get started:"
echo "  $CLI_NAME login"
echo "  $CLI_NAME robot-list"
echo ""
echo "📚 For Auth0 setup instructions, see:"
echo "  $SOURCE_DIR/AUTH0_SETUP_GUIDE.md" 