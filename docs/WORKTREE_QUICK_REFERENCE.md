# 🚀 Worktree Quick Reference Card

**Print this and keep it handy!**

---

## 📌 Port Assignments

```
Main:      localhost:3000  (OAuth ✅)
Worktree 1: localhost:3001
Worktree 2: localhost:3002
Worktree 3: localhost:3003
```

---

## 🎯 Quick Commands

### Create Worktree
```bash
# Choose slot: 1, 2, or 3
WORKTREE_NUM=1

# Create
git worktree add \
  ~/.cursor/worktrees/salfagpt/worktree-${WORKTREE_NUM} \
  feat/my-feature-$(date +%Y-%m-%d)

# Configure port
cd ~/.cursor/worktrees/salfagpt/worktree-${WORKTREE_NUM}
# Edit astro.config.mjs → port: 300${WORKTREE_NUM}
```

### Start Dev Server
```bash
# Main
cd ~/salfagpt && npm run dev

# Worktree 1
cd ~/.cursor/worktrees/salfagpt/worktree-1 && npm run dev

# Worktree 2
cd ~/.cursor/worktrees/salfagpt/worktree-2 && npm run dev

# Worktree 3
cd ~/.cursor/worktrees/salfagpt/worktree-3 && npm run dev
```

### Check Status
```bash
# List all worktrees
git worktree list

# Check port usage
lsof -i :3000  # Main
lsof -i :3001  # Worktree 1
lsof -i :3002  # Worktree 2
lsof -i :3003  # Worktree 3
```

### Update Tracking
```bash
# Edit docs/BranchLog.md
# Update port assignment table:
# | Worktree 1 | 3001 | 🟢 Active | Your Feature | feat/... |
```

### Sync with Main
```bash
cd /path/to/worktree
git fetch origin main
git rebase origin/main
```

### Merge to Main
```bash
cd ~/salfagpt
git checkout main
git merge --no-ff feat/my-feature-2025-10-14
git push origin main
```

### Clean Up
```bash
git worktree remove ~/.cursor/worktrees/salfagpt/worktree-1
git branch -d feat/my-feature-2025-10-14

# Update BranchLog.md: Mark port as 🟡 Available
```

---

## 🚨 Remember

- ✅ Main = port 3000 (OAuth configured)
- ✅ Worktrees = 3001-3003 (no OAuth needed)
- ✅ Configure port in astro.config.mjs
- ✅ Update BranchLog.md with assignment
- ❌ NEVER change main branch port
- ❌ NEVER configure OAuth for worktree ports

---

## 📋 Current Assignments

**Check:** `docs/BranchLog.md` for live status

| Port | Status | Feature |
|---|---|---|
| 3000 | 🟢 Main | Always active |
| 3001 | ? | Check BranchLog.md |
| 3002 | ? | Check BranchLog.md |
| 3003 | ? | Check BranchLog.md |

---

**Last Updated:** 2025-10-14  
**Quick Access:** `cat docs/WORKTREE_QUICK_REFERENCE.md`

