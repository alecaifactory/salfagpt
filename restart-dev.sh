#!/bin/bash

# Restart Development Server Script
# Kills any process on port 3000 and starts fresh dev server

clear

echo "🔄 Restarting Development Server"
echo "================================="
echo ""

# Kill any process on port 3000
echo "1️⃣  Checking for processes on port 3000..."
PORT_PID=$(lsof -ti:3000)

if [ ! -z "$PORT_PID" ]; then
  echo "   Found process(es): $PORT_PID"
  echo "   Killing..."
  kill -9 $PORT_PID
  echo "   ✅ Port 3000 cleared"
else
  echo "   ℹ️  No process found on port 3000"
fi

# Also kill any stray astro dev processes
echo ""
echo "2️⃣  Checking for astro dev processes..."
ASTRO_PIDS=$(pgrep -f "astro dev")

if [ ! -z "$ASTRO_PIDS" ]; then
  echo "   Found astro process(es): $ASTRO_PIDS"
  echo "   Killing..."
  pkill -f "astro dev"
  echo "   ✅ Astro processes cleared"
else
  echo "   ℹ️  No astro dev processes found"
fi

# Wait a moment for ports to fully release
echo ""
echo "3️⃣  Waiting for port to release..."
sleep 1
echo "   ✅ Ready"

# Start dev server
echo ""
echo "4️⃣  Starting development server..."
echo "   Running: npm run dev"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

npm run dev

