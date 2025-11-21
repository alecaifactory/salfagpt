# Quick Reference: Agent Management Organization Filtering

**Feature:** Multi-organization agent filtering  
**Date:** 2025-11-11

---

## 🚀 Quick Start

### For SuperAdmin

**What you'll see:**
- **ALL agents** from ALL users across the platform
- **Organization badges** showing which org each agent belongs to
- **Owner information** showing who created each agent

**Example:**
```
Agent: "Customer Service Bot" | Gemini Flash | Salfa Corp
Propietario: Sebastian Orellana (sorellanac@salfagestion.cl)
```

---

### For Admin

**What you'll see:**
- **Organization agents** from all users in your organization(s)
- **Organization badge** (same org as yours)
- **Owner information** showing your colleagues' names

**Example (Salfa Corp Admin):**
```
Agent: "HR Assistant" | Gemini Pro | Salfa Corp
Propietario: María García (mgarcia@salfagestion.cl)
```

**Note:** If you're admin of multiple organizations, you'll see agents from all assigned orgs.

---

### For Regular User

**What you'll see:**
- **Your own agents** only (unchanged behavior)
- **NO organization badges** (not relevant)
- **NO owner information** (you're the owner)

**Example:**
```
Agent: "My Personal Assistant" | Gemini Flash
(No org badge, no owner info)
```

---

## 🎯 Key Differences by Role

| Feature | SuperAdmin | Admin | User |
|---------|-----------|-------|------|
| **Agents Visible** | All agents (all users) | Org agents (org users) | Own agents only |
| **Organization Badge** | ✅ Shown | ✅ Shown | ❌ Hidden |
| **Owner Information** | ✅ Shown | ✅ Shown | ❌ Hidden |
| **Agent Count** | Platform total | Org total | Own total |
| **Can Configure** | Any agent | Org agents | Own agents |

---

## 📋 Visual Examples

### SuperAdmin View
```
┌─────────────────────────────────────────────────┐
│ Gestión de Agentes                          [X] │
├─────────────────────────────────────────────────┤
│ 47 agentes • 234 mensajes • $12.45 total       │
├─────────────────────────────────────────────────┤
│                                                 │
│ ▸ Customer Service | Flash | Salfa Corp        │
│   Propietario: Sebastian Orellana              │
│   • 45 mensajes • 3 fuentes • $2.34            │
│                                                 │
│ ▸ HR Assistant | Pro | Salfa Corp              │
│   Propietario: María García                    │
│   • 23 mensajes • 1 fuente • $5.67             │
│                                                 │
│ ▸ Legal Advisor | Flash | ClienteCorp          │
│   Propietario: Juan Pérez                      │
│   • 12 mensajes • 2 fuentes • $1.23            │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

### Admin View (Salfa Corp)
```
┌─────────────────────────────────────────────────┐
│ Gestión de Agentes                          [X] │
├─────────────────────────────────────────────────┤
│ 11 agentes • 156 mensajes • $8.90 total        │
├─────────────────────────────────────────────────┤
│                                                 │
│ ▸ Customer Service | Flash | Salfa Corp        │
│   Propietario: Sebastian Orellana              │
│   • 45 mensajes • 3 fuentes • $2.34            │
│                                                 │
│ ▸ HR Assistant | Pro | Salfa Corp              │
│   Propietario: María García                    │
│   • 23 mensajes • 1 fuente • $5.67             │
│                                                 │
│ (Only Salfa Corp agents shown)                 │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

### User View
```
┌─────────────────────────────────────────────────┐
│ Gestión de Agentes                          [X] │
├─────────────────────────────────────────────────┤
│ 3 agentes • 34 mensajes • $1.23 total          │
├─────────────────────────────────────────────────┤
│                                                 │
│ ▸ My Assistant | Flash                         │
│   • 15 mensajes • 1 fuente • $0.45             │
│                                                 │
│ ▸ Research Helper | Pro                        │
│   • 19 mensajes • 2 fuentes • $0.78            │
│                                                 │
│ (Only own agents shown)                        │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## 🔧 Troubleshooting

### Issue: Admin sees fewer agents than expected

**Possible causes:**
1. Users not assigned to organization yet
2. Agent creators have no `organizationId` (legacy data)

**Solution:**
```bash
# Check user count in org
# Open browser console while logged in as admin
# The API logs will show:
# "Found X users in organizations: [org-ids]"
```

---

### Issue: Organization badges not showing

**Possible causes:**
1. Agent owner has no organization assigned
2. Organization document missing

**Solution:**
- Check owner user document: `organizationId` field
- Verify organization exists in `organizations` collection

---

### Issue: SuperAdmin sees same agents as user

**Possible causes:**
1. Role not properly set in session
2. Session.role !== 'superadmin'

**Solution:**
```bash
# Check session role in browser console
# Should log: "Loading agent metrics for user: X role: superadmin"
```

---

## 📞 Support

**If you encounter issues:**

1. Check browser console for API logs
2. Look for: "📊 Loading agent metrics..." logs
3. Verify role is correct: "role: superadmin" or "role: admin"
4. Check agent count: Should match expected total

**Common Log Messages:**
```
🔓 SuperAdmin access: Loading ALL agents from ALL users
  → Expected for SuperAdmin

🔐 Admin access: Loading agents for organization
  User organizations: ['salfa-corp']
  Found 37 users in organizations
  → Expected for Admin

🔒 User access: Loading only own agents
  → Expected for Regular User
```

---

## 🎓 Technical Notes

### Why Chunking?

**Firestore Limitation:** The `where('field', 'in', array)` operator supports max 10 values.

**Our Solution:**
```typescript
// Instead of single query with 50 user IDs (would fail)
.where('userId', 'in', [user1, user2, ..., user50])

// We chunk into batches of 10
.where('userId', 'in', [user1, ..., user10])  // Query 1
.where('userId', 'in', [user11, ..., user20]) // Query 2
// ... and so on
```

**Impact:** For 50 users = 5 queries instead of 1, but still performant.

---

### Why Optional Fields?

All new fields are **optional** (`field?: type`):
- `ownerUserId?`
- `ownerEmail?`
- `ownerName?`
- `organizationId?`
- `organizationName?`

**Reason:** Backward compatibility. Existing agents without org assignment still display correctly.

---

### Why Purple Badge?

**Color coding:**
- **Green** = Model (Flash)
- **Purple** = Model (Pro)
- **Purple** = Organization (NEW)
- **Blue** = Quality score
- **Indigo** = Setup configured

**Reasoning:** Purple associates with "organization" and doesn't conflict with existing badges.

---

**Last Updated:** 2025-11-11  
**Version:** 1.0.0  
**Questions:** Check main documentation or ask SuperAdmin






