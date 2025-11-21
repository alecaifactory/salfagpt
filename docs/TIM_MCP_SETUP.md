# 🤖 Tim MCP Server Setup Guide

**Tim (Together Imagine More)** - Invoke digital twin testing from Cursor!

---

## 🎯 What You Can Do

From Cursor, you can now:

```
"Create a Tim digital twin for user usr_g14stel2ccwsl0eafp60 
 to test a message send failure"

"List all Tim test sessions"

"Show me details for Tim session tim-session-xxx"

"Create a digital twin to test PDF upload issue for power_user"
```

---

## 🚀 Quick Setup (5 minutes)

### Step 1: Create MCP Server (if not exists)

```bash
# Visit admin panel
open http://localhost:3000/admin

# Navigate to "MCP Servers" tab
# Click "Create Server"

# Fill in:
Name: Tim Digital Twin Testing
Type: tim
Domains: getaifactory.com
Expires: 90 days

# Copy the API key (shown only once!)
mcp_localhost_xxxxxxxxxxxxx
```

### Step 2: Configure Cursor

Create or update `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "flow-tim": {
      "url": "http://localhost:3000/api/mcp/tim",
      "apiKey": "YOUR_API_KEY_HERE",
      "userId": "usr_ygbwzh8jsdjwbqs0lwwv"
    }
  }
}
```

### Step 3: Restart Cursor

Completely quit and restart Cursor for changes to take effect.

### Step 4: Test It!

In Cursor, ask:

```
"Use Tim to create a digital twin for testing"
```

---

## 🛠️ Available Tools

### 1. Create Digital Twin

```
"Create a Tim digital twin for user usr_g14stel2ccwsl0eafp60 
 with ticket TIM-001 to test: user clicked Send button but got error"
```

**What happens:**
1. Tim creates privacy-safe digital twin (≥98% compliance)
2. Anonymizes user data
3. Encrypts sensitive information
4. Stores twin in Firestore
5. Returns twin ID and session ID

### 2. List Sessions

```
"Show me all Tim test sessions"
"List Tim sessions for user usr_g14stel2ccwsl0eafp60"
```

### 3. Get Session Details

```
"Get details for Tim session tim-session-1763428409974-abc123"
```

### 4. List Digital Twins

```
"List all digital twins created by Tim"
"Show Tim twins for user usr_g14stel2ccwsl0eafp60"
```

---

## 📋 Demo Users

Use these user IDs for testing:

| Email | User ID | Best For Testing |
|-------|---------|------------------|
| admin@demo.com | `usr_ygbwzh8jsdjwbqs0lwwv` | Admin features |
| user@demo.com | `usr_g14stel2ccwsl0eafp60` | Basic user issues |
| expert@demo.com | `usr_criv06hp5i99zof1uxzz` | Expert workflows |
| power_user@demo.com | `usr_d51z4oimxwijhqz1wo7n` | Power user features |

---

## 🎯 Example Scenarios

### Scenario 1: Message Send Failure

```
"Create Tim digital twin:
- User: usr_g14stel2ccwsl0eafp60
- Ticket: TIM-SEND-001
- Issue: User typed 'Hello' and clicked Send but got error 'Failed to send message'
- Steps: Login to chat, open agent, type message, click Send, observe error"
```

### Scenario 2: PDF Upload Stuck

```
"Create Tim digital twin:
- User: usr_d51z4oimxwijhqz1wo7n
- Ticket: TIM-UPLOAD-001
- Issue: PDF upload stuck at 'Processing...' indefinitely
- Steps: Login, open agent, click 'Agregar Fuente', select file, upload PDF, observe stuck progress"
```

### Scenario 3: Model Switch Issue

```
"Create Tim digital twin:
- User: usr_ygbwzh8jsdjwbqs0lwwv
- Ticket: TIM-MODEL-001
- Issue: Model switch appears to work but still using Flash instead of Pro
- Steps: Login, open conversation, click model dropdown, select Pro, send message, check metadata"
```

---

## 🔐 Privacy & Security

### Privacy Guarantees

All digital twins maintain ≥98% compliance:

| Feature | Implementation | Example |
|---------|----------------|---------|
| Email Anonymization | First char + *** | `a***@g***.com` |
| Name Anonymization | First char + *** | `A*** J***` |
| PII Redaction | Auto-detect & remove | `[EMAIL_REDACTED]` |
| Encryption | AES-256-GCM | Encrypted sensitive data |
| Audit Trail | Complete logging | All operations tracked |

### Access Control

- **SuperAdmin:** Can create twins for any user
- **Admin:** Can create twins for users in their domain only
- **User:** Cannot access Tim MCP (requires admin)

---

## 🏗️ Architecture

```
CURSOR REQUEST
      ↓
MCP PROTOCOL
      ↓
/api/mcp/tim
      ↓
Tim MCP Server (src/mcp/tim.ts)
      ↓
Tim Core Library (src/lib/tim.ts)
      ↓
Firestore
      ├─ digital_twins
      ├─ tim_test_sessions
      └─ tim_compliance_logs
```

---

## 🧪 Testing

### Manual Test via curl

```bash
# 1. List available tools
curl -X POST http://localhost:3000/api/mcp/tim \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "method": "tools/list",
    "requesterId": "usr_ygbwzh8jsdjwbqs0lwwv"
  }'

# 2. Create a digital twin
curl -X POST http://localhost:3000/api/mcp/tim \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "method": "tools/call",
    "params": {
      "name": "tim/create-twin",
      "arguments": {
        "userId": "usr_g14stel2ccwsl0eafp60",
        "ticketId": "TIM-TEST-001",
        "userAction": "Clicked Send button",
        "expectedBehavior": "Message should send",
        "actualBehavior": "Got error message",
        "reproductionSteps": [
          "Login to platform",
          "Open chat",
          "Type message",
          "Click Send",
          "Observe error"
        ]
      }
    },
    "requesterId": "usr_ygbwzh8jsdjwbqs0lwwv"
  }'

# 3. List sessions
curl -X POST http://localhost:3000/api/mcp/tim \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "method": "tools/call",
    "params": {
      "name": "tim/list-sessions",
      "arguments": {
        "limit": 5
      }
    },
    "requesterId": "usr_ygbwzh8jsdjwbqs0lwwv"
  }'
```

### Test in Cursor

After setup, ask Cursor:

```
"Test Tim MCP by listing available tools"

"Create a test digital twin with Tim"

"Show me all Tim sessions"
```

---

## 📊 MCP Response Format

### Success Response

```json
{
  "content": {
    "success": true,
    "digitalTwinId": "tim-usr_xxx-TIM-001-1763428409974",
    "sessionId": "tim-session-1763428409974-abc123",
    "complianceScore": 100,
    "status": "created",
    "message": "✅ Digital twin created successfully! Compliance: 100%",
    "nextSteps": [
      "Use tim/get-session to view session details",
      "Execute browser automation with MCP browser tools",
      "Tim will capture diagnostics and route insights"
    ]
  }
}
```

### Error Response

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid API key"
  }
}
```

---

## 🎯 Next Steps After Creating Twin

Once you create a digital twin, Tim can:

1. **Execute Browser Automation**
   - Navigate to localhost:3000
   - Reproduce user's exact steps
   - Capture diagnostics (console, network, screenshots)

2. **AI Analysis**
   - Analyze captured data with Gemini Pro
   - Identify root cause of issue
   - Generate fix recommendations

3. **Route Insights**
   - Send to Ally (personal assistant)
   - Notify Stella (UX/feedback agent)
   - Update Rudy (roadmap agent)
   - Alert admins

---

## 📄 Files Created

- ✅ `src/mcp/tim.ts` - MCP server implementation
- ✅ `src/pages/api/mcp/tim.ts` - API endpoint
- ✅ `.cursor/rules/tim-mcp.mdc` - Cursor rule for easy reference
- ✅ `docs/TIM_MCP_SETUP.md` - This setup guide

---

## ✅ Verification Checklist

Before using Tim MCP:

- [ ] Localhost running (`npm run dev`)
- [ ] Demo users seeded
- [ ] MCP server created in admin panel
- [ ] API key copied
- [ ] `~/.cursor/mcp.json` configured
- [ ] Cursor restarted
- [ ] Test command executed successfully

---

## 🎉 Success!

If you can ask Cursor:

```
"List Tim tools"
```

And get a response with 4 tools, **Tim MCP is working!** 🚀

Now you can invoke Tim directly from Cursor to create digital twins and test user issues automatically!

---

**Created:** 2025-11-18  
**Version:** 1.0.0  
**Status:** ✅ Production Ready



