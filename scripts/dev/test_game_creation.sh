#!/bin/bash

# Test game creation with valid user IDs
curl -X POST http://localhost:3000/api/v1/games \
  -H "Content-Type: application/json" \
  -d '{
    "player1": "29ec9420-e628-4b0c-a56f-38b32d8dad10",
    "player2": "cae217aa-44a5-40c2-bd5b-775c51c3b2bc"
  }' 