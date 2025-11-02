#!/bin/bash
# Track a single command with git context
# Usage: ./scripts/track-command.sh "npm run dev"
# Usage: ./scripts/track-command.sh "git commit -m 'feat: xyz'"

set -e

COMMAND="$*"
SESSION_DIR="docs/sessions"
LOG_FILE="$SESSION_DIR/command-log.md"

# Create directory
mkdir -p "$SESSION_DIR"

# Ensure log file exists
if [ ! -f "$LOG_FILE" ]; then
  cat > "$LOG_FILE" << EOF
# Command Log

Auto-generated log of important commands with git context.

---

EOF
fi

# Capture context
TIMESTAMP=$(date)
BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
LAST_COMMIT=$(git log -1 --oneline 2>/dev/null || echo "no commits")

# Log entry header
cat >> "$LOG_FILE" << EOF

## $(date +%Y-%m-%d\ %H:%M:%S)

**Branch:** $BRANCH
**Last Commit:** $LAST_COMMIT

**Command:**
\`\`\`bash
$COMMAND
\`\`\`

**Output:**
\`\`\`
EOF

# Execute command and capture output
echo "🔄 Executing: $COMMAND"
eval "$COMMAND" 2>&1 | tee -a "$LOG_FILE"

# Close code block
echo '```' >> "$LOG_FILE"
echo "" >> "$LOG_FILE"

echo "✅ Command logged to: $LOG_FILE"

