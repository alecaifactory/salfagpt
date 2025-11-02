#!/bin/bash
# Terminal Session Tracker with Git Context
# Usage: ./scripts/start-tracked-session.sh

set -e

# Configuration
SESSION_DIR="docs/sessions"
SESSION_FILE="$SESSION_DIR/terminal-session-$(date +%Y%m%d-%H%M%S).md"

# Create sessions directory if needed
mkdir -p "$SESSION_DIR"

# Capture git context
BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
LAST_COMMIT=$(git log -1 --oneline 2>/dev/null || echo "no commits")
REPO_STATUS=$(git status --short 2>/dev/null || echo "not a git repo")

# Write session header
cat > "$SESSION_FILE" << EOF
# Terminal Session

**Started:** $(date)
**Branch:** $BRANCH
**Last Commit:** $LAST_COMMIT
**Working Directory:** $(pwd)

## Repository Status
\`\`\`
$REPO_STATUS
\`\`\`

---

## Session Output

EOF

echo "🎬 Starting tracked terminal session..."
echo "📝 Output will be saved to: $SESSION_FILE"
echo "🔄 Branch: $BRANCH"
echo "📊 Git context captured"
echo ""
echo "💡 Exit session: Type 'exit' or press Ctrl+D"
echo ""

# Start script session (appends to file)
script -a "$SESSION_FILE"

# Add footer when session ends
cat >> "$SESSION_FILE" << EOF

---

**Ended:** $(date)
**Duration:** Session complete
**Final Branch:** $(git branch --show-current 2>/dev/null || echo "unknown")
EOF

echo ""
echo "✅ Session saved to: $SESSION_FILE"
echo "📖 Review with: cat $SESSION_FILE"

