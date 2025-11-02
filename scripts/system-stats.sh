#!/bin/bash
# 📊 Flow Platform System Stats
# Generates ASCII stats display for monitoring

# Colors for terminal output (optional)
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# System Stats
SYSTEM_UPTIME=$(uptime | awk '{print $3, $4}' | sed 's/,//')
LOAD_AVG=$(uptime | awk -F'load averages:' '{print $2}')

# Dev Server Stats (find Astro process dynamically)
DEV_PID=$(lsof -i :3000 2>/dev/null | grep LISTEN | awk '{print $2}' | head -1)
if [ -n "$DEV_PID" ]; then
  DEV_UPTIME=$(ps -p $DEV_PID -o etime= 2>/dev/null | xargs)
  DEV_CPU=$(ps -p $DEV_PID -o %cpu= 2>/dev/null | xargs)
  DEV_MEM=$(ps -p $DEV_PID -o %mem= 2>/dev/null | xargs)
  DEV_STATUS="🟢 Running"
  DEV_PID_TEXT="PID: $DEV_PID"
else
  DEV_UPTIME="Not running"
  DEV_CPU="0"
  DEV_MEM="0"
  DEV_STATUS="🔴 Stopped"
  DEV_PID_TEXT="N/A"
fi

# Port Check
PORT_3000=$(lsof -i :3000 2>/dev/null | grep LISTEN | wc -l | xargs)

# Project Stats
TOTAL_FILES=$(find src -type f 2>/dev/null | wc -l | xargs)
TS_FILES=$(find src -name "*.ts" -o -name "*.tsx" 2>/dev/null | wc -l | xargs)
COMPONENTS=$(find src/components -name "*.tsx" 2>/dev/null | wc -l | xargs)
API_ROUTES=$(find src/pages/api -name "*.ts" 2>/dev/null | wc -l | xargs)

# Git Stats
GIT_BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
GIT_COMMITS=$(git rev-list --count HEAD 2>/dev/null || echo "0")
UNCOMMITTED=$(git status --short 2>/dev/null | wc -l | xargs)
UNTRACKED=$(git ls-files --others --exclude-standard 2>/dev/null | wc -l | xargs)

# Build Stats
if [ -d "dist" ]; then
  BUILD_EXISTS="✅ Yes"
  BUILD_SIZE=$(du -sh dist 2>/dev/null | awk '{print $1}')
  BUILD_DATE=$(stat -f "%Sm" -t "%Y-%m-%d %H:%M" dist 2>/dev/null || echo "Unknown")
else
  BUILD_EXISTS="❌ No"
  BUILD_SIZE="N/A"
  BUILD_DATE="N/A"
fi

# TypeScript Check (quick)
TS_CHECK=$(npm run type-check 2>&1 | grep -c "error TS" || echo "0")
if [ "$TS_CHECK" -eq 0 ]; then
  TS_STATUS="✅ No errors"
else
  TS_STATUS="⚠️  $TS_CHECK errors"
fi

# Firestore Connection
FIRESTORE_STATUS=$(curl -s http://localhost:3000/api/health/firestore 2>/dev/null | grep -q "healthy" && echo "✅ Connected" || echo "❌ Disconnected")

# Current timestamp
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# Generate ASCII stats
cat << EOF
╔════════════════════════════════════════════════════════════════╗
║               FLOW PLATFORM - SYSTEM STATUS                    ║
║                  $TIMESTAMP                           ║
╠════════════════════════════════════════════════════════════════╣
║                                                                ║
║  🖥️  SYSTEM                                                    ║
║  ├─ Uptime:        $SYSTEM_UPTIME                              ║
║  ├─ Load Avg:      $LOAD_AVG                                   ║
║  └─ Platform:      macOS (darwin 24.1.0)                       ║
║                                                                ║
║  🚀 DEV SERVER (localhost:3000)                                ║
║  ├─ Status:        $DEV_STATUS                                 ║
║  ├─ $DEV_PID_TEXT                                              ║
║  ├─ Uptime:        $DEV_UPTIME                                 ║
║  ├─ CPU Usage:     ${DEV_CPU}%                                 ║
║  └─ Memory:        ${DEV_MEM}% (~225MB)                        ║
║                                                                ║
║  📦 PROJECT                                                     ║
║  ├─ Branch:        $GIT_BRANCH                                 ║
║  ├─ Commits:       $GIT_COMMITS                                ║
║  ├─ Modified:      $UNCOMMITTED files                          ║
║  ├─ Untracked:     $UNTRACKED files                            ║
║  ├─ Total Files:   $TOTAL_FILES                                ║
║  ├─ TS Files:      $TS_FILES                                   ║
║  ├─ Components:    $COMPONENTS                                 ║
║  └─ API Routes:    $API_ROUTES                                 ║
║                                                                ║
║  🏗️  BUILD                                                      ║
║  ├─ Last Build:    $BUILD_EXISTS                               ║
║  ├─ Build Date:    $BUILD_DATE                                 ║
║  └─ Build Size:    $BUILD_SIZE                                 ║
║                                                                ║
║  🔧 HEALTH                                                      ║
║  ├─ TypeScript:    $TS_STATUS                                  ║
║  └─ Firestore:     $FIRESTORE_STATUS                           ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝

Legend:
  🟢 Running    🔴 Stopped    ✅ OK    ❌ Error    ⚠️  Warning

Quick Commands:
  npm run dev          - Start dev server
  npm run build        - Build for production
  npm run type-check   - Check TypeScript errors
  
  curl http://localhost:3000/chat  - Test if chat loads
  lsof -i :3000                    - Check what's on port 3000
EOF





