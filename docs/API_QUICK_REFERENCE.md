# Flow API System - Quick Reference

**Last Updated:** 2025-11-16  
**For:** SuperAdmins & Developers

---

## 🎯 **For SuperAdmins**

### Create API Invitation

```bash
# Via UI (Settings → APIs → Create Invitation)
# Or via API:

curl -X POST http://localhost:3000/api/admin/api-invitations \
  -H "Cookie: flow_session=YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "targetAudience": "Enterprise Clients",
    "description": "Q4 2025 Enterprise Beta",
    "maxRedemptions": 50,
    "defaultTier": "trial",
    "expiresInDays": 90,
    "allowedDomains": ["enterprise.com", "company.com"]
  }'

# Response:
{
  "invitation": {
    "invitationCode": "FLOW-ENTERPRISE-202511-A3F9E2D8",
    "targetAudience": "Enterprise Clients",
    ...
  }
}
```

### List Invitations

```bash
curl -X GET http://localhost:3000/api/admin/api-invitations \
  -H "Cookie: flow_session=YOUR_JWT"
```

### Revoke Invitation

```bash
curl -X DELETE http://localhost:3000/api/admin/api-invitations \
  -H "Cookie: flow_session=YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{"invitationId": "invitation_id_here"}'
```

---

## 👨‍💻 **For Developers**

### Step 1: Get Invitation

Contact Flow team: api@flow.ai

You'll receive: `FLOW-XXX-202511-XXXXXXXX`

### Step 2: Install CLI

```bash
npm install -g @flow/cli
```

### Step 3: Login

```bash
flow-cli login FLOW-XXX-202511-XXXXXXXX
```

Browser opens → Login with Google → Use **business email**

### Step 4: Verify Setup

```bash
flow-cli whoami
```

Output:
```
Organization: YourCompany-API
Domain: yourcompany.com
Tier: trial
Quota: 10 / 100 requests this month
```

### Step 5: Extract Document

```bash
flow-cli extract requirements.pdf
```

Output:
```
Extracting requirements.pdf...
✓ Extracted successfully
  Pages: 15
  Tokens: 12,450
  Cost: $0.0034
  Time: 2.3s

Extracted text saved to: requirements.txt
```

---

## 🔌 **API Usage**

### Authentication

All requests require API key in header:

```bash
Authorization: Bearer fv_live_xxxxxxxxxxxxxxxx
```

### Extract Document (cURL)

```bash
curl -X POST https://api.flow.ai/v1/extract-document \
  -H "Authorization: Bearer fv_live_xxxxxxxxxxxxxxxx" \
  -F "file=@document.pdf" \
  -F "model=flash"
```

### Extract Document (JavaScript)

```javascript
const FormData = require('form-data');
const fs = require('fs');
const axios = require('axios');

const form = new FormData();
form.append('file', fs.createReadStream('document.pdf'));
form.append('model', 'flash');

const response = await axios.post(
  'https://api.flow.ai/v1/extract-document',
  form,
  {
    headers: {
      'Authorization': 'Bearer fv_live_xxxxxxxxxxxxxxxx',
      ...form.getHeaders()
    }
  }
);

console.log(response.data.extractedText);
```

### Extract Document (Python)

```python
import requests

url = "https://api.flow.ai/v1/extract-document"
headers = {"Authorization": "Bearer fv_live_xxxxxxxxxxxxxxxx"}
files = {"file": open("document.pdf", "rb")}
data = {"model": "flash"}

response = requests.post(url, headers=headers, files=files, data=data)
result = response.json()

print(result['extractedText'])
```

---

## 📊 **Organization Management**

### Get Organization Info

```bash
curl -X GET https://api.flow.ai/v1/organization \
  -H "Authorization: Bearer fv_live_xxxxxxxxxxxxxxxx"
```

### Update Webhook URL

```bash
curl -X PATCH https://api.flow.ai/v1/organization \
  -H "Authorization: Bearer fv_live_xxxxxxxxxxxxxxxx" \
  -H "Content-Type: application/json" \
  -d '{
    "webhookUrl": "https://yourapp.com/webhooks/flow"
  }'
```

### View Usage Analytics

```bash
curl -X GET 'https://api.flow.ai/v1/organization/usage?start=2025-11-01&end=2025-11-30' \
  -H "Authorization: Bearer fv_live_xxxxxxxxxxxxxxxx"
```

---

## 🔑 **API Key Management**

### Create New Key

```bash
curl -X POST https://api.flow.ai/v1/keys \
  -H "Authorization: Bearer fv_live_xxxxxxxxxxxxxxxx" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Production Key",
    "scopes": ["vision:read", "vision:write"]
  }'
```

Response (key shown ONCE):
```json
{
  "key": "fv_live_xxxxxxxxxxxxxxxx",
  "keyInfo": {
    "id": "key_xxxxx",
    "name": "Production Key",
    "scopes": ["vision:read", "vision:write"],
    ...
  }
}
```

### List Keys

```bash
curl -X GET https://api.flow.ai/v1/keys \
  -H "Authorization: Bearer fv_live_xxxxxxxxxxxxxxxx"
```

### Revoke Key

```bash
curl -X DELETE https://api.flow.ai/v1/keys/key_xxxxx \
  -H "Authorization: Bearer fv_live_xxxxxxxxxxxxxxxx"
```

---

## 📋 **Tier Quotas**

| Tier | Monthly Requests | Daily Requests | Max File Size | Concurrent | Price |
|------|------------------|----------------|---------------|------------|-------|
| Trial | 100 | 10 | 20MB | 1 | Free (14 days) |
| Starter | 1,000 | 100 | 100MB | 3 | $50/mo |
| Pro | 10,000 | 1,000 | 500MB | 10 | $200/mo |
| Enterprise | 100,000 | 10,000 | 2GB | 50 | Custom |

---

## ⚠️ **Error Codes**

| Code | Status | Meaning |
|------|--------|---------|
| `UNAUTHORIZED` | 401 | Invalid/missing API key |
| `INVALID_KEY` | 401 | API key not found |
| `KEY_EXPIRED` | 401 | API key has expired |
| `INSUFFICIENT_SCOPE` | 403 | Missing required scope |
| `QUOTA_EXCEEDED` | 403 | Monthly/daily limit reached |
| `ORG_SUSPENDED` | 403 | Organization suspended |
| `TRIAL_EXPIRED` | 403 | Trial period ended |
| `MISSING_FILE` | 400 | No file in request |
| `FILE_TOO_LARGE` | 400 | File exceeds tier limit |
| `INVALID_FILE` | 400 | Unsupported file type |
| `EXTRACTION_FAILED` | 500 | Processing error |
| `INTERNAL_ERROR` | 500 | Server error |

---

## 🆘 **Support**

### For Developers

**Issue with API?**
1. Check error code in response
2. Verify API key is valid
3. Check quota limits
4. Review documentation

**Need Help?**
- Email: api-support@flow.ai
- Chat: Developer portal → Support
- Docs: https://api.flow.ai/docs

### For SuperAdmins

**Create Invitation:**
Settings → APIs → Create Invitation

**Monitor Usage:**
Admin Panel → API Management → Analytics

**Support Ticket:**
If developer reports issue → Check logs in API Management

---

## 🚀 **Best Practices**

### For Developers

1. **Use Environment Variables**
   ```bash
   export FLOW_API_KEY=fv_live_xxxxx
   ```

2. **Handle Errors Gracefully**
   ```javascript
   try {
     const result = await flowAPI.extract(file);
   } catch (error) {
     if (error.code === 'QUOTA_EXCEEDED') {
       // Notify user, upgrade tier
     }
   }
   ```

3. **Monitor Usage**
   - Check dashboard regularly
   - Set up quota alerts
   - Optimize API calls

4. **Use Webhooks for Large Files**
   ```javascript
   await flowAPI.extract(file, {
     webhookUrl: 'https://yourapp.com/webhooks/flow'
   });
   ```

### For SuperAdmins

1. **Targeted Invitations**
   - Specific audience descriptions
   - Reasonable redemption limits
   - Appropriate tier assignments

2. **Monitor Quotas**
   - Alert on high usage
   - Proactive tier upgrades
   - Cost optimization

3. **Developer Success**
   - Quick response to issues
   - Clear communication
   - Continuous improvement

---

## 📖 **Resources**

### Documentation

- **Architecture:** `docs/API_SYSTEM_ARCHITECTURE.md`
- **Implementation:** `docs/API_SYSTEM_IMPLEMENTATION_GUIDE.md`
- **Complete Summary:** `docs/API_SYSTEM_PHASE1_COMPLETE.md`

### Code

- **Types:** `src/types/api-system.ts`
- **Library:** `src/lib/api-management.ts`
- **Vision API:** `src/pages/api/v1/extract-document.ts`
- **Organization:** `src/pages/api/v1/organization.ts`
- **Admin:** `src/pages/api/admin/api-invitations.ts`

### Configuration

- **Indexes:** `firestore.indexes.json` (lines 781-870)
- **Collections:** See `src/types/api-system.ts`

---

**This quick reference covers the essentials. For complete documentation, see the full guides.** 📚

