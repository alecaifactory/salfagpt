# MCP Server - Testing Checklist

**Date:** 2025-10-30  
**Purpose:** Step-by-step testing guide for first MCP server

---

## ✅ Pre-Testing Setup

### 1. Verify Prerequisites

```bash
# Check dev server is running
lsof -i :3000
# Should show: node listening on :3000

# Check Firestore connection
npm run test:mcp
# Should show: ✅ All checks passed
```

---

## 🚀 Testing Steps

### Step 1: Deploy Firestore Indexes (Required)

```bash
firebase deploy --only firestore:indexes --project gen-lang-client-0986191192
```

**Expected output:**
```
✔ Deploy complete!

Indexes:
  ✅ mcp_servers (assignedDomains, createdAt)
  ✅ mcp_servers (isActive, createdAt)
  ✅ mcp_api_keys (serverId, createdAt)
```

**Verification:**
```bash
# Check index status
gcloud firestore indexes list --database='(default)' --project=gen-lang-client-0986191192

# All should show STATE: READY
```

**Time:** 1-2 minutes

---

### Step 2: Test Backend with Script

```bash
npm run test:mcp
```

**Expected output:**
```
🧪 Testing MCP Server Setup

1️⃣  Checking Firestore collections...
   ✅ mcp_servers collection exists
   📊 Found 0 servers

2️⃣  Checking SuperAdmin users...
   ✅ Found 1 SuperAdmin(s):
      - alec@getaifactory.com (Alec)

3️⃣  Checking users in getaifactory.com domain...
   📧 Found X users

4️⃣  Checking conversations...
   💬 Found X conversations
   📊 Stats:
      - Total messages: X
      - Flash agents: X
      - Pro agents: X

✅ All checks passed!
```

**If fails:**
- Missing SuperAdmin? Create user with role: "superadmin"
- No users? Add test users
- No conversations? Use platform to create some

**Time:** 30 seconds

---

### Step 3: Create First MCP Server (via UI)

**3a. Navigate to Admin Panel**
```
http://localhost:3000/admin
```

**3b. Find MCP Servers Section**
- Should see new "MCP Servers" tab or section
- Only visible to SuperAdmin

**3c. Click "Create Server"**

**3d. Fill in Form:**
```
Name: Flow Usage Stats Test
Description: Read-only usage statistics for testing
Type: usage-stats
Assigned Domains: getaifactory.com
Expires In: 90 days
```

**3e. Click "Create Server"**

**3f. CRITICAL: Save API Key**
```
API Key displayed: mcp_localhost_abc123...

⚠️ COPY THIS IMMEDIATELY - shown only once!
```

**3g. Copy Cursor Configuration**
- Click "Copy Config" button
- Paste somewhere safe

**Expected result:**
```
✅ Server created successfully
✅ API key displayed
✅ Cursor config generated
✅ Server appears in list
```

**Time:** 2 minutes

---

### Step 4: Configure Cursor

**4a. Create Cursor MCP Config File**
```bash
mkdir -p ~/.cursor
touch ~/.cursor/mcp.json
```

**4b. Add Configuration**
```bash
# Open in editor
code ~/.cursor/mcp.json

# Or use nano
nano ~/.cursor/mcp.json
```

**4c. Paste Configuration:**
```json
{
  "mcpServers": {
    "flow-usage-stats": {
      "url": "http://localhost:3000/api/mcp/usage-stats",
      "apiKey": "PASTE_YOUR_ACTUAL_API_KEY_HERE",
      "domain": "getaifactory.com"
    }
  }
}
```

**4d. Save and Close**

**4e. Restart Cursor Completely**
- Quit Cursor (Cmd+Q)
- Reopen Cursor
- Wait for full initialization

**Expected result:**
```
✅ Config file created
✅ API key pasted
✅ Cursor restarted
✅ No error messages in Cursor
```

**Time:** 2 minutes

---

### Step 5: Test MCP Connection in Cursor

**5a. Open Any File in Cursor**

**5b. Ask Test Query:**
```
"Show me usage stats for getaifactory.com"
```

**5c. Wait for Response** (5-10 seconds)

**5d. Expected Response Format:**
```
Based on the usage stats for getaifactory.com:

📊 **Overview:**
- Total Agents: 45
- Total Messages: 234
- Active Users: 3
- Estimated Cost: $12.50

🤖 **Model Distribution:**
- Flash: 40 agents (88.9%)
- Pro: 5 agents (11.1%)

📈 **Averages:**
- 5.2 messages per agent
- $0.28 per agent

[Data source: MCP Server - usage-stats://getaifactory.com/summary]
```

**Time:** 1 minute

---

### Step 6: Test Additional Queries

**6a. Agent Activity:**
```
"Which agents have the most activity?"
```

**Expected:**
```
Top agents by activity:
1. [Agent Title] - X messages
2. [Agent Title] - X messages
...
```

---

**6b. Cost Breakdown:**
```
"What's our cost breakdown by model?"
```

**Expected:**
```
Cost breakdown:
- Flash: $X (X agents)
- Pro: $X (X agents)
Total: $X
```

---

**6c. User Activity:**
```
"How many active users do we have?"
```

**Expected:**
```
Active users: X
[List of users with activity stats]
```

**Time:** 2 minutes for all queries

---

### Step 7: Verify Security

**7a. Test Domain Isolation (if you have multiple domains)**

```
Ask: "Show me stats for clientdomain.com"
```

**Expected for Admin:**
```
❌ Error: Access denied to domain: clientdomain.com
(You can only access: getaifactory.com)
```

**Expected for SuperAdmin:**
```
✅ Stats for clientdomain.com displayed
```

---

**7b. Test Invalid API Key**

```bash
# Temporarily edit ~/.cursor/mcp.json
# Change API key to: "invalid-key"
# Restart Cursor

Ask: "Show usage stats"
```

**Expected:**
```
❌ Error: Invalid API key
```

**Restore valid key and restart**

**Time:** 2 minutes

---

## 🐛 Troubleshooting

### Issue: "Server not running"

**Fix:**
```bash
npm run dev
# Wait for: "server ready at http://localhost:3000"
```

---

### Issue: "Cannot find MCP Servers tab"

**Check:**
- Logged in as SuperAdmin? (alec@getaifactory.com)
- Component imported in admin page?

**Temporary workaround:**
```
Create server via API:
curl -X POST http://localhost:3000/api/mcp/servers \
  -H "Cookie: flow_session=..." \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Server",
    "type": "usage-stats",
    "assignedDomains": ["getaifactory.com"],
    "resources": ["summary", "agents", "users", "costs"]
  }'
```

---

### Issue: "Firestore index required"

**Fix:**
```bash
# Deploy indexes
firebase deploy --only firestore:indexes --project gen-lang-client-0986191192

# Wait 1-2 minutes for indexes to build
# Check status in Firebase Console
```

---

### Issue: Cursor not responding to queries

**Debug:**
```
1. Check Cursor MCP logs (in Cursor settings)
2. Verify config file syntax (valid JSON)
3. Test API directly with curl
4. Check browser console for errors
5. Verify API key hasn't expired
```

---

## ✅ Success Criteria

After completing all steps, you should have:

**Backend:**
- [x] Firestore indexes deployed and READY
- [x] Test script passes
- [x] API endpoints working
- [x] Stats calculations correct

**Frontend:**
- [x] Can create server via UI
- [x] API key displayed correctly
- [x] Server list shows servers
- [x] Copy buttons work

**Integration:**
- [x] Cursor config file created
- [x] Cursor can list resources
- [x] Cursor can read stats
- [x] Responses are formatted well

**Security:**
- [x] Session required
- [x] API key required
- [x] Role verified
- [x] Domain isolated

---

## 📊 Testing Matrix

| Test | SuperAdmin | Admin | Expected |
|------|-----------|-------|---------|
| Create server | ✅ Can create | ❌ Forbidden | Pass |
| View servers | ✅ See all | ✅ See assigned | Pass |
| Access own domain | ✅ Can access | ✅ Can access | Pass |
| Access other domain | ✅ Can access | ❌ Forbidden | Pass |
| Invalid API key | ❌ Rejected | ❌ Rejected | Pass |
| Expired key | ❌ Rejected | ❌ Rejected | Pass |

---

## 📝 Test Results Template

```markdown
## MCP Server Test Results - 2025-10-30

**Tester:** [Your name]
**Environment:** Localhost
**Server Version:** 1.0.0

### Backend Tests
- [ ] npm run test:mcp: PASS/FAIL
- [ ] Indexes deployed: PASS/FAIL
- [ ] API accessible: PASS/FAIL

### UI Tests
- [ ] Can create server: PASS/FAIL
- [ ] API key displayed: PASS/FAIL
- [ ] Server list loads: PASS/FAIL
- [ ] Copy buttons work: PASS/FAIL

### Cursor Integration
- [ ] Config file created: PASS/FAIL
- [ ] Cursor connects: PASS/FAIL
- [ ] Resources listed: PASS/FAIL
- [ ] Queries work: PASS/FAIL

### Security Tests
- [ ] Session required: PASS/FAIL
- [ ] API key required: PASS/FAIL
- [ ] Role verified: PASS/FAIL
- [ ] Domain isolated: PASS/FAIL

### Issues Found:
- [List any issues]

### Recommendations:
- [Your suggestions]

### Overall Status: PASS/FAIL
```

---

## 🎯 Completion Checklist

**Before marking as "Done":**

- [ ] All 7 testing steps completed
- [ ] At least 3 successful Cursor queries
- [ ] Security tests passed
- [ ] No critical errors found
- [ ] Test results documented
- [ ] Ready for commit

---

**Current Status:** Ready for testing  
**Next:** Run through checklist and report results

**Time to complete full testing:** ~15 minutes












