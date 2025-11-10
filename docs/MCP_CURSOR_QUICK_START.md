# MCP Quick Start - Cursor Setup

**Purpose:** Connect Cursor AI to Flow platform for usage statistics  
**Time:** 5 minutes  
**Access:** SuperAdmin only (initial release)

---

## 🚀 5-Minute Setup

### Step 1: Create MCP Server (2 min)

1. **Login** to Flow as SuperAdmin
   ```
   Email: alec@getaifactory.com
   ```

2. **Navigate** to Admin Panel
   ```
   http://localhost:3000/admin
   ```

3. **Go to** MCP Servers tab

4. **Click** "Create Server"

5. **Fill in:**
   ```
   Name: Flow Usage Stats
   Description: Read-only usage statistics for Cursor
   Type: usage-stats
   Domains: getaifactory.com
   Expires: 90 days
   ```

6. **Click** "Create Server"

7. **Copy** the API key immediately (won't be shown again!)
   ```
   mcp_localhost_a1b2c3d4e5f6...
   ```

---

### Step 2: Configure Cursor (2 min)

1. **Create** Cursor config file:
   ```bash
   mkdir -p ~/.cursor
   touch ~/.cursor/mcp.json
   ```

2. **Add** this configuration:
   ```json
   {
     "mcpServers": {
       "flow-usage-stats": {
         "url": "http://localhost:3000/api/mcp/usage-stats",
         "apiKey": "PASTE_YOUR_API_KEY_HERE",
         "domain": "getaifactory.com"
       }
     }
   }
   ```

3. **Save** the file

4. **Restart** Cursor completely

---

### Step 3: Test Connection (1 min)

1. **Open** any file in Cursor

2. **Ask** Cursor:
   ```
   "Show me usage stats for getaifactory.com"
   ```

3. **Verify** you get structured data like:
   ```
   Domain: getaifactory.com
   Total Agents: 45
   Total Messages: 234
   Active Users: 3
   Cost: $12.50
   ```

✅ **Working!** You're now connected to Flow via MCP.

---

## 🎯 Example Queries

### Usage Overview
```
"Show me a summary of usage stats for my domain"
"How many agents do we have?"
"What's our total message count?"
```

### Agent Analysis
```
"Which agents have the most activity?"
"Show me agents using Pro model"
"What's the average messages per agent?"
```

### Cost Analysis
```
"What's our cost breakdown by model?"
"How much are we spending on Flash vs Pro?"
"Show me cost per agent"
```

### User Activity
```
"Who are our most active users?"
"Show me user activity stats"
"How many users are active?"
```

---

## 🔒 Security Notes

### API Key Storage

**✅ SAFE:**
```json
// ~/.cursor/mcp.json (local file, not committed)
{
  "mcpServers": {
    "flow": {
      "apiKey": "mcp_localhost_..."
    }
  }
}
```

**❌ UNSAFE:**
```javascript
// NEVER commit to git
const apiKey = "mcp_localhost_..."; // ❌
```

---

### Access Levels

**What you CAN do:**
- ✅ View your domain's usage stats
- ✅ Query agent performance
- ✅ Analyze costs
- ✅ Track user activity

**What you CANNOT do:**
- ❌ Modify data (read-only)
- ❌ Access other domains (if Admin)
- ❌ Create/delete agents
- ❌ View sensitive user data

---

## 🐛 Troubleshooting

### "Server not found" in Cursor

**Fix:**
1. Verify `~/.cursor/mcp.json` exists
2. Check JSON syntax is valid
3. Restart Cursor completely
4. Check Cursor logs for errors

---

### "Unauthorized" Response

**Fix:**
1. Verify API key is correct
2. Check server hasn't expired
3. Ensure you're logged in to Flow
4. Verify session cookie is valid

---

### "No data returned"

**Fix:**
1. Verify domain has users
2. Check users have conversations
3. Ensure Firestore indexes deployed
4. Check browser console for errors

---

## 🎓 Advanced Usage

### Multiple Domains

If you manage multiple domains:

```json
{
  "mcpServers": {
    "flow-getaifactory": {
      "url": "http://localhost:3000/api/mcp/usage-stats",
      "apiKey": "mcp_localhost_key1...",
      "domain": "getaifactory.com"
    },
    "flow-client-domain": {
      "url": "http://localhost:3000/api/mcp/usage-stats",
      "apiKey": "mcp_localhost_key2...",
      "domain": "client.com"
    }
  }
}
```

Then specify in queries:
```
"Show stats for getaifactory.com"
"Show stats for client.com"
```

---

### Production Setup

**For production, update the URL:**

```json
{
  "mcpServers": {
    "flow-usage-stats": {
      "url": "https://flow.yourcompany.com/api/mcp/usage-stats",
      "apiKey": "mcp_production_...",
      "domain": "yourcompany.com"
    }
  }
}
```

**Remember:**
- Use production API key (not localhost)
- Verify HTTPS is working
- Test thoroughly before sharing with team

---

## 📞 Support

**Issues?** Contact:
- SuperAdmin: alec@getaifactory.com
- Documentation: `docs/MCP_SERVER_SETUP_2025-10-30.md`
- Technical: Review Cursor logs and browser console

---

**Last Updated:** 2025-10-30  
**Version:** 1.0.0  
**Status:** ✅ Ready for Testing











