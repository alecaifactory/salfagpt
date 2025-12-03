# 🔄 Version-Based Session Refresh - Flow Diagram

**Visual representation of how version-based session refresh works**

---

## 📊 **Complete Flow Diagram**

```
┌─────────────────────────────────────────────────────────────────┐
│                   USER OPENS APP                                 │
│                 (After New Deployment)                           │
└────────────────────────┬────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│  STEP 1: CHECK SERVER VERSION                                   │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━                                  │
│                                                                  │
│  Browser:                                                        │
│    GET /api/version                                              │
│                                                                  │
│  Server:                                                         │
│    {                                                             │
│      "version": "0.1.1",                                         │
│      "commit": "xyz789",                                         │
│      "buildId": "0.1.1-xyz789"  ← Unique identifier             │
│    }                                                             │
│                                                                  │
│  Time: ~50ms                                                     │
└────────────────────────┬────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│  STEP 2: COMPARE VERSIONS                                       │
│  ━━━━━━━━━━━━━━━━━━━━━━━                                         │
│                                                                  │
│  Browser localStorage:                                           │
│    Cached buildId: "0.1.0-abc123" (old)                         │
│                                                                  │
│  Server buildId: "0.1.1-xyz789" (new)                           │
│                                                                  │
│  Result: MISMATCH DETECTED! 🔄                                  │
│                                                                  │
│  Time: <1ms (client-side comparison)                            │
└────────────────────────┬────────────────────────────────────────┘
                         ↓
                    ┌────┴────┐
                    │ Match?  │
                    └────┬────┘
                         │
         ┌───────────────┼───────────────┐
         ↓ NO                            ↓ YES
         │                               │
┌────────┴────────┐              ┌──────┴──────┐
│ NEW VERSION     │              │ SAME VERSION│
│ (Continue)      │              │ (Skip)      │
└────────┬────────┘              └──────┬──────┘
         ↓                               ↓
         │                        ┌──────────────┐
         │                        │ ✅ Continue  │
         │                        │    Normally  │
         │                        └──────────────┘
         ↓
┌─────────────────────────────────────────────────────────────────┐
│  STEP 3: REFRESH SESSION COOKIE                                 │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━                                  │
│                                                                  │
│  Console Log:                                                    │
│    🔄 NEW VERSION DEPLOYED - Refreshing session...              │
│       Old build: 0.1.0-abc123                                   │
│       New build: 0.1.1-xyz789                                   │
│       📝 Step 1/2: Refreshing session cookie...                 │
│                                                                  │
│  Browser:                                                        │
│    POST /api/auth/refresh-session                               │
│    (with existing flow_session cookie)                          │
│                                                                  │
│  Server:                                                         │
│    1. Verify current JWT ✅                                      │
│    2. Fetch user from Firestore                                 │
│    3. Get latest role/permissions                               │
│    4. Generate new JWT with fresh data                          │
│    5. Set new flow_session cookie                               │
│    6. Return: {success: true, roleChanged: ?}                   │
│                                                                  │
│  Console Log:                                                    │
│    ✅ Session refreshed: {success: true, roleChanged: false}    │
│                                                                  │
│  Time: ~200ms                                                    │
└────────────────────────┬────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│  STEP 4: UPDATE CACHE & RELOAD                                  │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━                                   │
│                                                                  │
│  Browser:                                                        │
│    localStorage.setItem('app_build_id', '0.1.1-xyz789')         │
│                                                                  │
│  Console Log:                                                    │
│    🚀 Step 2/2: Forcing hard reload...                          │
│       This ensures you get the latest code and features.        │
│                                                                  │
│  Wait: 500ms (ensure cookie is set)                             │
│                                                                  │
│  Action:                                                         │
│    location.reload(true)  ← Hard reload                         │
│                                                                  │
│  Time: ~500ms                                                    │
└────────────────────────┬────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│  RESULT: USER HAS FRESH SESSION + FRESH CODE                    │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━                      │
│                                                                  │
│  ✅ New version: 0.1.1                                           │
│  ✅ Fresh JWT with latest role/permissions                      │
│  ✅ Latest JavaScript bundle                                    │
│  ✅ All new features available                                  │
│  ✅ Cache cleared                                                │
│                                                                  │
│  Total time: ~750ms (one-time on deployment)                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎯 **State Transitions**

### **User State Evolution**

```
┌──────────────────┐
│  BEFORE DEPLOY   │
│                  │
│  Cached: v0.1.0  │
│  Session: OLD    │
│  Code: OLD       │
└────────┬─────────┘
         │
         │ Deploy v0.1.1
         ↓
┌──────────────────┐
│  OPENS APP       │
│                  │
│  Cached: v0.1.0  │ ← Detects mismatch
│  Server: v0.1.1  │
└────────┬─────────┘
         │
         │ Auto-refresh triggered
         ↓
┌──────────────────┐
│  REFRESHING      │
│                  │
│  1. Get version  │ ✅ 50ms
│  2. Refresh JWT  │ ✅ 200ms
│  3. Clear cache  │ ✅ 1ms
│  4. Wait 500ms   │ ✅
│  5. Hard reload  │ ✅
└────────┬─────────┘
         │
         ↓
┌──────────────────┐
│  AFTER REFRESH   │
│                  │
│  Cached: v0.1.1  │ ✅ Updated
│  Session: NEW    │ ✅ Fresh JWT
│  Code: NEW       │ ✅ Latest bundle
└──────────────────┘
```

---

## 🔄 **Session Refresh Detail**

### **What Gets Updated**

```
OLD JWT Token:
{
  id: "user-123",
  email: "user@domain.com",
  role: "user",          ← May be outdated
  permissions: {...},    ← May be outdated
  domain: "domain.com",
  iat: 1701000000,       ← Old issue time
  exp: 1701604800        ← Old expiry
}

                    ↓ REFRESH ↓

NEW JWT Token:
{
  id: "user-123",
  email: "user@domain.com",
  role: "expert",        ← ✅ Latest from Firestore
  permissions: {...},    ← ✅ Latest from Firestore
  domain: "domain.com",
  iat: 1701604900,       ← ✅ Fresh issue time
  exp: 1702209700        ← ✅ Extended 7 days
}
```

---

## 📈 **Timeline View**

### **Deployment to User Update**

```
T+0min    Developer deploys v0.1.1
          ↓
          Server: buildId = "0.1.1-xyz789"
          
T+1min    User A opens app
          ↓
          Client checks version
          ↓
          Mismatch detected
          ↓
          Session refreshed
          ↓
          Page reloads
          ↓
          User A on v0.1.1 ✅
          
T+5min    User B opens app
          ↓
          Same process
          ↓
          User B on v0.1.1 ✅
          
T+60min   User C opens app
          ↓
          Same process
          ↓
          User C on v0.1.1 ✅

Result: All active users updated within first hour after deployment
```

---

## 🎭 **Role Change Scenario**

### **When Role Changes During Deployment**

```
DAY 1:
  User X has role="user"
  Cached: v0.1.0
  
DAY 2:
  Admin changes User X to role="expert" in Firestore
  Deploy v0.1.1
  
USER X OPENS APP:
  ↓
  Version check: Mismatch (0.1.0 vs 0.1.1)
  ↓
  Session refresh:
    - Fetch user from Firestore
    - Detect role change: user → expert
    - Generate new JWT with role="expert"
    - Set new cookie
  ↓
  Console shows:
    🎭 Role updated: user → expert
  ↓
  Page reloads
  ↓
  User X now has expert UI/features! ✅
```

**Double benefit:** New code + New role in one refresh!

---

## ⚡ **Performance**

### **Cold Start (First Load After Deploy)**

```
User action:     Opens app
                 ↓
Network:         GET /api/version          50ms
Processing:      Compare buildIds          <1ms
Decision:        Mismatch detected         ✓
                 ↓
Network:         POST /api/auth/refresh    200ms
Server:          Fetch user + JWT          ~150ms
                 Generate + set cookie     ~50ms
Processing:      Update localStorage       <1ms
Wait:            Ensure cookie set         500ms
Action:          location.reload()         
                 ↓
Result:          Fresh page load

Total added latency: ~750ms (one-time)
```

### **Warm Start (Same Version)**

```
User action:     Opens app
                 ↓
Network:         GET /api/version          50ms
Processing:      Compare buildIds          <1ms
Decision:        Match - skip refresh      ✓
                 ↓
Result:          Normal load

Total added latency: ~50ms (minimal)
```

---

## 🛡️ **Error Handling**

### **Failure Scenarios**

```
Scenario 1: Version Endpoint Fails
  ↓
  Catch error
  ↓
  Log: "⚠️ Could not check server version"
  ↓
  Continue normally
  ↓
  User not blocked ✅

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Scenario 2: Session Refresh Fails
  ↓
  Catch error
  ↓
  Log: "⚠️ Session refresh failed, continuing..."
  ↓
  Still clear cache and reload
  ↓
  User gets new code (may need to re-login)
  ↓
  Degraded but functional ✅

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Scenario 3: Network Offline
  ↓
  Version check fails
  ↓
  App loads from cache
  ↓
  User sees old version (expected offline behavior) ✅
```

**Principle:** Never block user, gracefully degrade

---

## 📊 **Data Flow**

### **Server → Client Version Info**

```
package.json
  version: "0.1.1"
          ↓
Cloud Build
  GIT_COMMIT: "xyz789"
  DEPLOY_TIME: "2025-12-03T10:00:00Z"
          ↓
/api/version
  buildId: "0.1.1-xyz789"
          ↓
Client localStorage
  app_build_id: "0.1.1-xyz789"
```

### **Session Refresh Data Flow**

```
Client Browser
  flow_session: OLD JWT
          ↓
POST /api/auth/refresh-session
          ↓
Server
  1. Verify OLD JWT ✅
  2. Extract email
          ↓
Firestore
  users/{userId}
    role: "expert" (latest)
    permissions: {...} (latest)
          ↓
Server
  3. Generate NEW JWT
  4. Set flow_session cookie
          ↓
Client Browser
  flow_session: NEW JWT ✅
```

---

## 🎯 **User Experience**

### **Visible to User**

```
User Timeline:

[Opens app after deployment]
    ↓
[Brief loading (normal)]
    ↓
[Page reloads once]  ← Only noticeable change
    ↓
[App loads normally with new features]
```

**Total disruption:** <1 second reload (acceptable)

### **Console Feedback (for developers)**

```
Developer View:

✅ Running latest version: 0.1.1-xyz789
// OR if new version:
🔄 NEW VERSION DEPLOYED - Refreshing session...
   Old build: 0.1.0-abc123
   New build: 0.1.1-xyz789
   📝 Step 1/2: Refreshing session cookie...
   ✅ Session refreshed: {success: true}
   🚀 Step 2/2: Forcing hard reload...
   This ensures you get the latest code and features.
```

---

## 🔧 **Configuration**

### **Automatic Configuration**

```
No config needed! ✅

Environment variables set automatically:
  - npm_package_version (from package.json)
  - GIT_COMMIT (from Cloud Build)
  - DEPLOY_TIME (from Cloud Build)
  - ENVIRONMENT_NAME (from deployment script)
```

### **Build Process Integration**

```
Developer Workflow:

1. Update package.json version (e.g., 0.1.0 → 0.1.1)
2. Commit changes
3. Deploy to production
        ↓
Cloud Build:
  - Reads package.json: version="0.1.1"
  - Gets git commit: xyz789
  - Sets env vars automatically
  - Builds and deploys
        ↓
Production Server:
  - /api/version returns new buildId
  - Users auto-refresh on next load ✅
```

---

## 📊 **Metrics**

### **Trackable Events**

```typescript
// In analytics:
{
  event: 'version_refresh_triggered',
  oldVersion: '0.1.0-abc123',
  newVersion: '0.1.1-xyz789',
  userId: 'hashed_id',
  sessionRefreshSuccess: true,
  roleChanged: false,
  duration_ms: 750,
  timestamp: '2025-12-03T10:00:00Z'
}
```

### **Success Metrics**

**Per Deployment:**
- % users refreshed within 1 hour (target: >80%)
- % users refreshed within 24 hours (target: >95%)
- Session refresh success rate (target: >99%)
- Average refresh time (target: <1s)

---

## 🎊 **Summary Diagram**

```
                    NEW DEPLOYMENT
                          ↓
        ┌─────────────────────────────────┐
        │   Production Version Changes     │
        │   v0.1.0 → v0.1.1               │
        └─────────────┬───────────────────┘
                      ↓
        ┌─────────────────────────────────┐
        │  Users Open App (next visit)    │
        └─────────────┬───────────────────┘
                      ↓
        ┌─────────────────────────────────┐
        │  Auto-Detect Version Mismatch   │
        └─────────────┬───────────────────┘
                      ↓
        ┌─────────────────────────────────┐
        │  Refresh Session (Fresh JWT)    │
        └─────────────┬───────────────────┘
                      ↓
        ┌─────────────────────────────────┐
        │  Clear Cache (Update BuildID)   │
        └─────────────┬───────────────────┘
                      ↓
        ┌─────────────────────────────────┐
        │  Hard Reload (Fresh Code)       │
        └─────────────┬───────────────────┘
                      ↓
        ┌─────────────────────────────────┐
        │  ✅ User on Latest Version      │
        │  ✅ Fresh Session Cookie        │
        │  ✅ Latest Features Available   │
        └─────────────────────────────────┘

                    COMPLETE! 🎉
```

---

**This visual guide shows the complete flow from deployment to user update, ensuring seamless version transitions with automatic session refresh!** 🚀✨

