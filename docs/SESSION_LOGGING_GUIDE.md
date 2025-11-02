# Session Logging Guide

## 🎯 Purpose

Capture terminal and browser console output with git context for better debugging, context preservation, and development tracking.

---

## 📟 Terminal Session Tracking

### Quick Start

```bash
# Make script executable
chmod +x scripts/start-tracked-session.sh
chmod +x scripts/track-command.sh

# Start a tracked session
./scripts/start-tracked-session.sh
```

### What Gets Captured

**Automatic Git Context:**
- Current branch name
- Last commit message
- Working directory status
- All terminal output

**Output Location:** `docs/sessions/terminal-session-YYYYMMDD-HHMMSS.md`

### Usage Examples

#### Example 1: Development Session
```bash
# Start tracked session
./scripts/start-tracked-session.sh

# All commands now logged:
npm run dev
curl http://localhost:3000/api/health
git status
git commit -m "feat: add feature"

# Exit when done
exit
```

#### Example 2: Track Single Command
```bash
# Log a specific command with context
./scripts/track-command.sh "npm run build"
./scripts/track-command.sh "git push origin main"
./scripts/track-command.sh "gcloud run deploy flow-chat --source ."
```

**Output Location:** `docs/sessions/command-log.md` (appends to same file)

---

## 🌐 Browser Console Tracking

### Setup

**1. Add to your main app component:**

```typescript
// src/components/ChatInterfaceWorking.tsx (or App.tsx)
import { initConsoleLogger } from '../lib/console-logger';

export default function ChatInterface() {
  useEffect(() => {
    // Initialize console logger
    initConsoleLogger();
    
    return () => {
      // Optional: cleanup on unmount
      // destroyConsoleLogger();
    };
  }, []);
  
  // ... rest of component
}
```

**2. API endpoint is already created at:**
- `src/pages/api/console-logs.ts`

### What Gets Captured

**Browser console output:**
- `console.log()` calls
- `console.error()` calls  
- `console.warn()` calls
- `console.info()` calls
- `console.debug()` calls

**Metadata:**
- Timestamp
- Log type
- Current URL
- User agent
- Stack trace (for errors)

**Output Location:** `docs/sessions/console.md`

### Behavior

**Buffering:**
- Logs are buffered (max 50 entries)
- Auto-flushes every 30 seconds
- Auto-flushes when buffer is full
- Flushes on page unload

**Non-blocking:**
- Logging failures don't break app
- Failed logs are retried
- Silent degradation

**Development Only:**
- Disabled in production by default
- Can enable for production if needed

---

## 📊 Session Files Structure

```
docs/
└── sessions/
    ├── terminal-session-20241102-143022.md  # Terminal session 1
    ├── terminal-session-20241102-151433.md  # Terminal session 2
    ├── command-log.md                        # All tracked commands
    └── console.md                            # Browser console output
```

### Example Terminal Session Output

```markdown
# Terminal Session

**Started:** Sat Nov  2 14:30:22 PDT 2024
**Branch:** feat/session-logging-2024-11-02
**Last Commit:** a1b2c3d docs: Add session logging guide
**Working Directory:** /Users/alec/salfagpt

## Repository Status
```
M  src/components/ChatInterfaceWorking.tsx
A  scripts/start-tracked-session.sh
```

---

## Session Output

$ npm run dev

> salfagpt@0.1.0 dev
> astro dev

  🚀  astro  v5.1.1 started in 234ms
  
  ┃ Local    http://localhost:3000/
  ┃ Network  use --host to expose

$ curl http://localhost:3000/api/health

{"status":"healthy"}

$ exit

---

**Ended:** Sat Nov  2 15:45:10 PDT 2024
**Duration:** Session complete
**Final Branch:** feat/session-logging-2024-11-02
```

### Example Console Log Output

```markdown
# Browser Console Log

Auto-generated log of browser console output.

---

## Session: session-1730584322-abc123xyz - 2024-11-02T21:30:22.000Z

### ℹ️ LOG - 11/2/2024, 2:30:22 PM

**URL:** http://localhost:3000/chat

**Message:**
```
📊 Console logger initialized
```

### ✅ LOG - 11/2/2024, 2:30:23 PM

**URL:** http://localhost:3000/chat

**Message:**
```
📥 Cargando conversaciones desde Firestore...
```

### ❌ ERROR - 11/2/2024, 2:30:25 PM

**URL:** http://localhost:3000/chat

**Message:**
```
Failed to load conversations: TypeError: Cannot read property 'userId' of undefined
```

**Stack:**
```
TypeError: Cannot read property 'userId' of undefined
    at loadConversations (ChatInterface.tsx:145)
    at HTMLButtonElement.onClick (ChatInterface.tsx:230)
```
```

---

## 🔧 Configuration

### Console Logger Options

Edit `src/lib/console-logger.ts`:

```typescript
private maxBufferSize = 50;        // Max entries before auto-flush
private flushInterval = 30000;     // Flush every 30s
```

### Enable in Production

```typescript
// Remove this check if you want production logging:
if (process.env.NODE_ENV === 'production') {
  console.log('📊 Console logging disabled in production');
  return; // ← Remove this return
}
```

### Customize Log Format

Edit `src/pages/api/console-logs.ts` to change markdown format.

---

## 🧹 Maintenance

### Clean Old Sessions

```bash
# Keep last 7 days only
find docs/sessions -name "terminal-session-*.md" -mtime +7 -delete

# Archive old sessions
mkdir -p docs/sessions/archive/$(date +%Y-%m)
mv docs/sessions/terminal-session-2024-10-*.md docs/sessions/archive/2024-10/
```

### Review Logs

```bash
# View latest terminal session
ls -t docs/sessions/terminal-session-*.md | head -1 | xargs cat

# View console log
cat docs/sessions/console.md

# View command log
cat docs/sessions/command-log.md
```

---

## 💡 Use Cases

### Use Case 1: Debugging Production Issues
1. User reports bug
2. Enable console logging in production
3. Reproduce issue
4. Check `console.md` for detailed logs
5. Review stack traces and context

### Use Case 2: Development Session Archive
1. Start tracked session before coding
2. Work normally
3. Exit session
4. Session saved with all git context
5. Easy to review what was done

### Use Case 3: Command History with Context
1. Use `track-command.sh` for important commands
2. Deployment commands logged with git state
3. Easy to retrace steps
4. Share exact commands with team

### Use Case 4: AI Context Enhancement
1. Run tracked session
2. Feed `terminal.md` to AI assistant
3. AI has full context of what was attempted
4. Better debugging assistance

---

## ⚠️ Privacy & Security

### Sensitive Data

**Terminal sessions may capture:**
- Environment variables (if printed)
- API keys (if printed)
- Secrets (if displayed)

**Best Practices:**
1. **Never** commit session files to git
2. Add to `.gitignore`:
   ```
   docs/sessions/
   ```
3. Review session files before sharing
4. Redact sensitive data if sharing

### Console Logs May Contain

- User input
- API responses
- Error messages with stack traces
- URLs with query parameters

**Recommendation:** Only enable in development, or sanitize before sending to server.

---

## 🔄 Integration with Existing Workflows

### Git Workflow Integration

```bash
# Before starting work
./scripts/start-tracked-session.sh

# Your normal workflow
git checkout -b feat/new-feature-2024-11-02
# ... make changes ...
./scripts/track-command.sh "git commit -m 'feat: add feature'"

# Review session
cat docs/sessions/terminal-session-*.md | tail -100

# Exit when done
exit
```

### CI/CD Integration (Future)

Could integrate with:
- GitHub Actions (capture test output)
- Cloud Build (capture deploy logs)
- Error monitoring (send to Sentry/DataDog)

---

## 🎯 Summary

### What You Can Do Now

✅ **Terminal Tracking:**
- Run: `./scripts/start-tracked-session.sh`
- All output saved to `docs/sessions/`
- Includes automatic git context
- Exit with `exit` or Ctrl+D

✅ **Command Tracking:**
- Run: `./scripts/track-command.sh "your command"`
- Single command logged with context
- Appends to `command-log.md`

✅ **Console Logging (Optional):**
- Add `initConsoleLogger()` to app
- Browser console → `docs/sessions/console.md`
- Non-blocking, development-only

### Benefits

1. **Context Preservation:** Git state captured automatically
2. **Debugging:** Full log trail for issue reproduction
3. **Documentation:** Session files serve as development logs
4. **AI Enhancement:** Feed logs to AI for better assistance
5. **Team Collaboration:** Share exact commands and output

### Limitations

1. **Manual Cleanup:** Session files need periodic cleanup
2. **Not Real-Time:** Console logs buffer before sending
3. **Privacy:** Must be careful with sensitive data
4. **Storage:** Session files can grow large

---

## 🚀 Next Steps

### To Enable Terminal Logging:

```bash
chmod +x scripts/start-tracked-session.sh
chmod +x scripts/track-command.sh
./scripts/start-tracked-session.sh
```

### To Enable Console Logging:

```typescript
// In your main app component (e.g., ChatInterfaceWorking.tsx)
import { initConsoleLogger } from '../lib/console-logger';

useEffect(() => {
  initConsoleLogger();
}, []);
```

### To Review Logs:

```bash
# Latest terminal session
ls -t docs/sessions/terminal-session-*.md | head -1 | xargs cat

# All commands
cat docs/sessions/command-log.md

# Browser console
cat docs/sessions/console.md
```

---

**Last Updated:** 2024-11-02  
**Status:** ✅ Ready to Use  
**Backward Compatible:** Yes (additive only)  
**Production Ready:** Terminal tracking yes, console logging optional

