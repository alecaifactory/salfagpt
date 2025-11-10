# Flow CLI Quick Start

**Version**: 0.1.0  
**Audience**: Domain Admins

---

## 🚀 5-Minute Setup

### Step 1: Get Your API Key

Contact your SuperAdmin to create an API key for you.

**What you need:**
- Your email (e.g., admin@mydomain.com)
- Your domain (e.g., @mydomain.com)

**What you'll receive:**
- API key (e.g., <REDACTED_API_KEY>...)
- Expiration date (usually 90 days)

---

### Step 2: Install CLI

**Option A: Global install (recommended)**
```bash
npm install -g @flow-ai/cli
```

**Option B: Use with npx (no install)**
```bash
# Just run commands with npx prefix
npx @flow-ai/cli <command>
```

---

### Step 3: Login

```bash
flow login <your-api-key>

# For production:
flow login <your-api-key> --endpoint https://flow.getaifactory.com
```

**Expected output:**
```
🔐 Flow CLI Authentication

✅ API key saved securely

Testing connection...
✅ Successfully authenticated!

User: admin@mydomain.com
Role: admin
Config: ~/.flow-cli/config.json

💡 You can now run commands like:
   flow usage-stats @mydomain.com
```

---

### Step 4: View Stats

```bash
# Last 7 days (default)
flow usage-stats @mydomain.com

# Last 30 days
flow usage-stats @mydomain.com --days 30

# Export as JSON
flow usage-stats @mydomain.com --format json > stats.json
```

---

## 📊 Understanding the Output

### Users Section
```
👥 Users
┌─────────────┬───────┐
│ Total Users │ 45    │
│ Active Users│ 32    │
└─────────────┴───────┘
```

- **Total Users**: All users in your domain
- **Active Users**: Users who sent messages in the period

---

### Agents Section
```
🤖 Agents & Conversations
┌──────────────────────────┬────────┐
│ Total Agents             │ 120    │
│ Conversations            │ 340    │
│ Messages                 │ 2,450  │
│ Avg Messages/Conversation│ 7.2    │
└──────────────────────────┴────────┘
```

- **Total Agents**: Unique agents created
- **Conversations**: Chat sessions with agents
- **Messages**: Total messages (user + AI)
- **Avg Messages/Conversation**: Engagement metric

---

### Model Usage Section
```
⚡ Model Usage
┌───────┬──────────┬──────────┬────────────┐
│ Model │ Requests │ Tokens   │ Cost (USD) │
├───────┼──────────┼──────────┼────────────┤
│ Flash │ 2,100    │ 1,250,000│ $0.1875    │
│ Pro   │ 350      │ 450,000  │ $2.8125    │
│ Total │ 2,450    │ 1,700,000│ $3.00      │
└───────┴──────────┴──────────┴────────────┘
```

- **Flash**: Faster, cheaper model (94% cost savings)
- **Pro**: More accurate, expensive model
- **Tokens**: Number of tokens processed
- **Cost**: Estimated cost in USD

---

### Cost Summary Section
```
💰 Cost Summary
┌───────────────────┬──────────┐
│ Total Cost        │ $3.00    │
│ Cost per User     │ $0.0667  │
│ Cost per Message  │ $0.0012  │
└───────────────────┴──────────┘
```

- **Total Cost**: Total spend for the period
- **Cost per User**: Average cost per active user
- **Cost per Message**: Average cost per message

---

## 🔧 Common Commands

```bash
# Check authentication status
flow status

# View configuration
flow config

# Logout (clear credentials)
flow logout

# Help
flow --help
flow usage-stats --help
```

---

## 🐛 Troubleshooting

### "Not authenticated"

```bash
# Check status
flow status

# If not authenticated, login again
flow login <your-api-key>
```

---

### "Invalid API key"

**Possible causes:**
1. Key was revoked by SuperAdmin
2. Key has expired
3. Typo in key

**Solution:** Contact SuperAdmin for new key

---

### "Cannot access other domains"

**Problem:** You can only access YOUR domain.

**Solution:**
```bash
# Check your domain
flow status

# Use YOUR domain in commands
flow usage-stats @your-actual-domain.com
```

---

## 💡 Tips

1. **Save your API key securely** in a password manager
2. **Set expiration dates** - rotate keys every 90 days
3. **Use JSON export** for custom dashboards:
   ```bash
   flow usage-stats @domain.com --format json | jq '.totalCost'
   ```
4. **Monitor regularly** - run weekly to track trends
5. **Report issues** to SuperAdmin if key stops working

---

## 📞 Support

**SuperAdmin**: alec@getaifactory.com  
**Documentation**: See full README.md in package  
**Issues**: Report via Flow platform

---

**Enjoy your secure CLI access! 🎉**











