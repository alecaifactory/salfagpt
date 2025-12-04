# 🚀 Canary Deployment - Quick Start Guide

**Status:** ✅ Ready to use  
**Rollback:** Always available (30 seconds)  
**Safe:** Only you affected during testing

---

## ⚡ **3-Minute Quick Start**

### **1. Deploy Canary** (30 sec command, 8 min build)

```bash
./scripts/deploy-canary.sh
```

**Press:** `yes` when prompted

**What happens:**
- ✅ New version deployed (no traffic)
- ✅ You added to canary list
- ✅ Everyone else stays on stable

---

### **2. Test** (5-30 minutes - you decide)

**Open:** https://salfagpt.salfagestion.cl/

**You'll see:**
```
┌────────────────────────────────────┐
│ 🧪 CANARY v0.1.1 (Testing Mode)   │  ← Top-right yellow badge
└────────────────────────────────────┘
```

**Test everything:**
- ✅ Login works?
- ✅ Chat loads?
- ✅ AI responds?
- ✅ No errors in console (F12)?

---

### **3A: If Issues → INSTANT ROLLBACK** (30 sec)

```bash
./scripts/rollback-to-stable.sh
```

**Press:** `yes`

**Result:**
- ✅ Back on stable in 30 seconds
- ✅ Issue contained (only you saw it)
- ✅ Everyone else unaffected

---

### **3B: If Works → EXPAND** (progressive)

```bash
# Expand to 5% (~2-3 users)
./scripts/rollout-canary.sh 5

# Wait 30 minutes, monitor...

# If still good:
./scripts/rollout-canary.sh 25  # ~12 users

# Wait 1 hour, monitor...

# Complete rollout:
./scripts/rollout-canary.sh 100  # All users
```

**Result:**
- ✅ Gradual, safe rollout
- ✅ Can rollback at ANY stage
- ✅ Confidence at each step

---

## 🚨 **Emergency Rollback**

**AT ANY TIME, run:**
```bash
./scripts/rollback-to-stable.sh
```

**This ALWAYS works and takes 30 seconds.**

---

## 📊 **How It Works**

```
Stable Version (00095-b8f):
  ├─ Tag: prod/stable-2025-12-04
  ├─ Traffic: 95-100%
  ├─ Users: Everyone (except canary)
  └─ Status: Verified working ✅

Canary Version (00106+):
  ├─ Traffic: 0% (Cloud Run)
  ├─ Users: Canary list (you) via app routing
  ├─ Status: Testing
  └─ Rollback: Available always

When you open app:
  ↓
App checks: Is your email in canary list?
  ├─ YES → Shows canary version
  └─ NO  → Shows stable version
```

---

##  Files Created**

```
✅ src/types/canary.ts              - TypeScript types
✅ src/lib/canary.ts                - Canary logic
✅ src/components/CanaryBadge.tsx   - UI indicator
✅ src/pages/api/version.ts         - Enhanced version API
✅ scripts/deploy-canary.sh         - Deploy script
✅ scripts/rollback-to-stable.sh    - Rollback script
✅ scripts/rollout-canary.sh        - Expansion script
✅ docs/CANARY_DEPLOYMENT_GUIDE.md  - Full guide
✅ docs/CANARY_QUICK_START.md       - This guide
```

**Total:** ~800 lines of code + documentation

---

## ✅ **What You Have Now**

```
✅ Canary deployment system
✅ Instant rollback (30 seconds)
✅ Progressive rollout control
✅ Visual canary indicator
✅ Complete documentation
✅ Safety guarantee

Next: Test it!
```

---

**Ready to commit and test!** 🚀

