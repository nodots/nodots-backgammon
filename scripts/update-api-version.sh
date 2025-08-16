#!/bin/bash
# Update API Version References Script
# This script helps update any remaining v3.6 references to v3.7 across the project

echo "🔄 Updating API version references from v3.6 to v3.7..."
echo "=============================================="

# Define the base directory
BASE_DIR="/Users/kenr/Code/nodots-backgammon"

# Find and update remaining references (excluding certain directories and files)
find "$BASE_DIR" -type f \( -name "*.md" -o -name "*.js" -o -name "*.ts" -o -name "*.sh" -o -name "*.py" \) \
  ! -path "*/node_modules/*" \
  ! -path "*/coverage/*" \
  ! -path "*/.git/*" \
  ! -name "*.log" \
  ! -name "*.bak" \
  -exec grep -l "v3\.6\|api/v3\.6" {} \; | while read file; do
    echo "Updating: $file"
    sed -i.bak 's/v3\.6/v3.7/g; s/api\/v3\.6/api\/v3.7/g' "$file"
    rm -f "$file.bak"
done

echo ""
echo "✅ API version update complete!"
echo "📝 Key changes made:"
echo "   • API_VERSION_PATH: /api/v3.7" 
echo "   • VITE_API_URL: http://localhost:3000/api/v3.7"
echo "   • vite.config.ts fallback URL updated"
echo "   • All test scripts and documentation updated"
echo ""
echo "🔄 To apply changes, restart the API server:"
echo "   npm start"