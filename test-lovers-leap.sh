#!/bin/bash

# Test GNU Backgammon with a position where player rolled [5,6] and should play Lover's Leap
# The starting position ID is 4HPwATDgc/ABMA

cd /Users/kenr/Code/nodots-backgammon/packages/ai/dist/gnubg

echo "🧪 Testing GNU Backgammon Lover's Leap recommendation..."
echo "📍 Using starting position with dice [5,6]"

# Use a GNU Backgammon position ID that represents the starting position
# where a player needs to move with dice 5 and 6
echo "new game
set board 4HPwATDgc/ABMA:56
hint" | ./gnubg -t

echo ""
echo "🔍 Expected recommendation: 24/13 (Lover's Leap) should be among the top moves"