# Worktree Port Management Strategy

**Date:** October 14, 2025  
**Version:** 1.0.0  
**Status:** ✅ Implemented  
**Updated Files:** 3 (worktrees.mdc, alignment.mdc, localhost-port.mdc, BranchLog.md)

---

## 🎯 Objective

Enable parallel development across main branch and 3 worktrees without port conflicts or OAuth configuration issues.

---

## 🌐 Port Allocation

### Port Assignment Table

| Environment | Port | OAuth | Purpose | Access URL |
|---|---|---|---|---|
| **Main Branch** | 3000 | ✅ Yes | Production-ready testing, OAuth flows | http://localhost:3000 |
| **Worktree 1** | 3001 | ❌ No | Feature development slot 1 | http://localhost:3001 |
| **Worktree 2** | 3002 | ❌ No | Feature development slot 2 | http://localhost:3002 |
| **Worktree 3** | 3003 | ❌ No | Feature development slot 3 | http://localhost:3003 |

### Current Status (October 14, 2025)

| Worktree | Port | Status | Feature | Branch |
|---|---|---|---|---|
| Main Branch | 3000 | 🟢 Active | Stable development | `main` |
| Worktree 1 | 3001 | 🟡 Available | - | - |
| Worktree 2 | 3002 | 🟡 Available | - | - |
| Worktree 3 | 3003 | 🟡 Available | - | - |

**Status Legend:**
- 🟢 Active: Currently running/in use
- 🟡 Available: Free for new feature
- 🔴 Reserved: Planned but not started
- ✅ Merged: Completed and merged to main

---

## ✅ Benefits

### 1. OAuth Stability
- Only port 3000 requires OAuth configuration
- No need to add worktree ports to Google OAuth console
- Main branch remains stable for authentication testing

### 2. Parallel Development
- Run 4 dev servers simultaneously
- Test multiple features without switching
- Independent environments per feature
- No interference between features

### 3. No Port Conflicts
- Each worktree has dedicated port
- No need to stop/start servers when switching features
- Clear port → worktree mapping

### 4. Clear Organization
- Port number indicates environment
- Easy to identify which server is which
- Tracking in `docs/BranchLog.md`

---

## 🚀 Quick Start Guide

### Creating a New Worktree

```bash
# 1. Choose an available worktree slot (1, 2, or 3)
WORKTREE_NUM=1
WORKTREE_PORT=$((3000 + WORKTREE_NUM))

# 2. Create worktree
cd /Users/alec/salfagpt
git worktree add \
  /Users/alec/.cursor/worktrees/salfagpt/worktree-${WORKTREE_NUM} \
  feat/my-feature-2025-10-14

# 3. Navigate to worktree
cd /Users/alec/.cursor/worktrees/salfagpt/worktree-${WORKTREE_NUM}

# 4. Copy and modify astro.config.mjs
cp /Users/alec/salfagpt/astro.config.mjs .
# Edit astro.config.mjs and set: port: 3001 (or 3002, 3003)

# 5. Install dependencies (if needed)
npm install

# 6. Start dev server
npm run dev
# Server will run on localhost:300${WORKTREE_NUM}

# 7. Update docs/BranchLog.md
# Mark port as 🟢 Active with your feature name
```

### Example: Setting Up Worktree 1

```bash
# Create worktree
cd /Users/alec/salfagpt
git worktree add \
  /Users/alec/.cursor/worktrees/salfagpt/worktree-1 \
  feat/analytics-dashboard-2025-10-14

# Navigate and configure
cd /Users/alec/.cursor/worktrees/salfagpt/worktree-1

# Update astro.config.mjs
cat > astro.config.mjs << 'EOF'
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import node from '@astrojs/node';

export default defineConfig({
  server: {
    port: 3001,  // Worktree 1
  },
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  integrations: [
    react(),
    tailwind({ applyBaseStyles: true }),
  ],
});
EOF

# Commit port configuration
git add astro.config.mjs
git commit -m "chore: Configure worktree 1 on port 3001"

# Start dev server
npm run dev
# → http://localhost:3001
```

---

## 📋 Daily Workflow

### Starting Your Work Session

```bash
# Main branch work
cd /Users/alec/salfagpt
npm run dev  # Port 3000

# OR Worktree 1 work
cd /Users/alec/.cursor/worktrees/salfagpt/worktree-1
npm run dev  # Port 3001

# OR Worktree 2 work
cd /Users/alec/.cursor/worktrees/salfagpt/worktree-2
npm run dev  # Port 3002

# OR Worktree 3 work
cd /Users/alec/.cursor/worktrees/salfagpt/worktree-3
npm run dev  # Port 3003
```

### Running All 4 Environments

**Use Case:** Testing feature interactions, integration testing

```bash
# Terminal 1 (Main - port 3000)
cd /Users/alec/salfagpt && npm run dev

# Terminal 2 (Worktree 1 - port 3001)
cd /Users/alec/.cursor/worktrees/salfagpt/worktree-1 && npm run dev

# Terminal 3 (Worktree 2 - port 3002)
cd /Users/alec/.cursor/worktrees/salfagpt/worktree-2 && npm run dev

# Terminal 4 (Worktree 3 - port 3003)
cd /Users/alec/.cursor/worktrees/salfagpt/worktree-3 && npm run dev
```

**Access:**
- Main: http://localhost:3000 (OAuth working)
- Feature A: http://localhost:3001
- Feature B: http://localhost:3002
- Feature C: http://localhost:3003

---

## 🔍 Troubleshooting

### Issue 1: Port Already in Use

**Symptom:**
```
Error: listen EADDRINUSE: address already in use :::3001
```

**Solution:**
```bash
# Find process using port
lsof -i :3001

# Kill the process
kill -9 $(lsof -t -i:3001)

# Or use a different port
# Edit astro.config.mjs and use an available port
```

### Issue 2: Wrong Port Configured

**Symptom:**
Server starts but on unexpected port

**Solution:**
```bash
# Check astro.config.mjs
grep "port:" astro.config.mjs

# Should show:
# port: 3001,  // For worktree 1
# port: 3002,  // For worktree 2
# port: 3003,  // For worktree 3
```

### Issue 3: OAuth Not Working in Worktree

**Expected Behavior:**
OAuth should NOT work in worktrees (ports 3001-3003)

**Solution:**
- OAuth is only configured for port 3000 (main branch)
- For worktree development, use main branch for OAuth testing
- Or temporarily use development bypass if needed

---

## 📊 Port Assignment Best Practices

### DO's ✅

1. ✅ **Always use port 3000 for main branch** (OAuth configured)
2. ✅ **Configure port in astro.config.mjs** when creating worktree
3. ✅ **Update BranchLog.md** with port assignment
4. ✅ **Check port availability** before starting dev server
5. ✅ **Mark port as available** when worktree is merged/cleaned up

### DON'Ts ❌

1. ❌ **Never change main branch port** (breaks OAuth)
2. ❌ **Never use same port for multiple worktrees**
3. ❌ **Never configure OAuth for worktree ports** (unnecessary)
4. ❌ **Never use ports outside 3000-3003 range** (stay organized)

---

## 🛠️ Verification Commands

### Check All Ports

```bash
# Check if any port is in use
for port in 3000 3001 3002 3003; do
  echo "Port $port:"
  lsof -i :$port || echo "  Available"
done
```

### Verify Astro Configuration

```bash
# Check main branch
cd /Users/alec/salfagpt
grep "port:" astro.config.mjs
# Should show: port: 3000

# Check worktree
cd /Users/alec/.cursor/worktrees/salfagpt/worktree-1
grep "port:" astro.config.mjs
# Should show: port: 3001
```

### Test All Environments

```bash
# Main branch
curl http://localhost:3000/api/health
# Should return: 200 OK

# Worktree 1
curl http://localhost:3001/api/health
# Should return: 200 OK (if server running)
```

---

## 📚 Updated Documentation

### Files Modified

1. **`.cursor/rules/worktrees.mdc`**
   - Added port management strategy section
   - Updated creation procedure with port config
   - Added port verification commands
   - Updated to version 2.0.0

2. **`.cursor/rules/alignment.mdc`**
   - Added parallel development section
   - Referenced port strategy
   - Updated rule count to 29 total
   - Updated to version 1.7.0

3. **`.cursor/rules/localhost-port.mdc`**
   - Expanded from 1 line to comprehensive guide
   - Added worktree port configuration
   - Included verification procedures
   - Updated to version 2.0.0

4. **`docs/BranchLog.md`**
   - Added port assignment tracking table
   - Included port allocation rules
   - Added quick reference commands

---

## ✅ Success Criteria

- [x] Port strategy documented in 4 files
- [x] Main branch uses port 3000 (OAuth configured)
- [x] Worktrees assigned ports 3001-3003
- [x] Clear tracking system in BranchLog.md
- [x] Verification commands provided
- [x] Troubleshooting guide included
- [x] Aligned with all related rules
- [x] Backward compatible (main branch unchanged)

---

## 🎯 Next Steps

### For New Worktree Creation

1. Check `docs/BranchLog.md` for available port
2. Follow creation procedure in `.cursor/rules/worktrees.mdc`
3. Configure port in worktree's `astro.config.mjs`
4. Update `docs/BranchLog.md` table with assignment
5. Start dev server and verify

### For Daily Development

1. Navigate to your worktree directory
2. Start dev server: `npm run dev`
3. Access on assigned port (3001, 3002, or 3003)
4. Develop and test independently
5. Sync with main regularly

---

## 📖 Reference Links

### Internal Documentation
- `.cursor/rules/worktrees.mdc` - Complete worktree guide
- `.cursor/rules/alignment.mdc` - Development workflow
- `.cursor/rules/localhost-port.mdc` - Port configuration
- `docs/BranchLog.md` - Port assignment tracking

### OAuth Configuration
- Google Console: https://console.cloud.google.com/apis/credentials
- Authorized URIs: Only `localhost:3000/auth/callback` configured
- Production URL: `https://flow-chat-cno6l2kfga-uc.a.run.app/auth/callback`

---

## 🎉 Summary

**What Changed:**
- Implemented systematic port assignment (3000-3003)
- Updated 4 documentation files
- Created tracking system in BranchLog.md
- Aligned all rules with new strategy

**Impact:**
- ✅ Enables 4 parallel development environments
- ✅ Eliminates port conflicts
- ✅ Keeps OAuth stable on port 3000
- ✅ Clear organization and tracking
- ✅ No breaking changes to existing workflow

**For Developers:**
- Main branch: Business as usual on port 3000
- Worktrees: Pick a slot (1, 2, or 3) and use assigned port
- Track assignments in BranchLog.md
- Merge when ready, free up the port

---

**Last Updated**: 2025-10-14  
**Author**: AI Assistant via Cursor  
**Reviewed**: Alec  
**Status**: ✅ Ready for Use

