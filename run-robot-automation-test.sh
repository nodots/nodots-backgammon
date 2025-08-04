#!/bin/bash

# Script to run the robot automation E2E test
# This proves that the robot automation fix works in a real web browser

echo "🤖 Robot Automation E2E Test Runner"
echo "===================================="

# Check if API server is running
if ! curl -s http://localhost:3000/api/v3.6/health > /dev/null; then
    echo "❌ API server not running on http://localhost:3000"
    echo "Please start the API server first:"
    echo "   cd packages/api && NODE_ENV=development npm start"
    exit 1
fi

echo "✅ API server is running"

# Check if client is running
if ! curl -s http://localhost:5173 > /dev/null; then
    echo "❌ Client not running on http://localhost:5173"
    echo "Please start the client first:"
    echo "   cd packages/client && npm run dev"
    exit 1
fi

echo "✅ Client is running"

# Run the robot automation E2E test
echo ""
echo "🎬 Running Robot Automation E2E Test..."
echo "This will open a browser and prove that robot automation works!"

cd packages/client

# Update the base URL in the test to use the correct client port
sed -i '' 's/http:\/\/localhost:5437/http:\/\/localhost:5173/g' playwright.config.ts

# Run the specific robot automation test
npx playwright test e2e/robot-automation-simple.test.ts --headed --reporter=line

# Restore original config
git checkout playwright.config.ts 2>/dev/null || true

echo ""
echo "📊 Test Results:"
echo "  - Screenshots saved to packages/client/test-results/"
echo "  - Check API server logs for robot automation messages" 
echo "  - Look for 🤖 emoji in the logs indicating robot turns"

echo ""
echo "✅ Robot Automation E2E Test Complete!"
echo "   If the test passed, the robot automation fix is working correctly."