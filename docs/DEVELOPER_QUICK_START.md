# Flow Vision API - Developer Quick Start

**Get started in 5 minutes**  
**From zero to extracting documents**

---

## 🎯 **What You Get**

Upload any document (PDF, Excel, Word, CSV) and get back:
- ✅ Complete extracted text
- ✅ Structured data from tables
- ✅ Metadata (pages, tokens, cost)
- ✅ Fast (< 3s for most documents)
- ✅ Accurate (Powered by Gemini AI)

---

## 🚀 **Quick Start (3 steps)**

### **Step 1: Get Access (Contact Admin)**

```
Contact: alec@getaifactory.com
Request: API invitation code
Format: FLOW-XXXXX-202511-XXXXXX
```

---

### **Step 2: Install CLI & Login**

```bash
# Install CLI
npm install -g @flow/cli

# Login with your invitation code
flow-cli login FLOW-YOUR-INVITATION-CODE

# Browser opens → Login with Google
# Use your business email (NOT gmail.com)

# ✓ API Key saved to ~/.flow/credentials.json
```

---

### **Step 3: Extract Your First Document**

```bash
# Extract any document
flow-cli extract document.pdf

# ✓ Done! See extracted text in terminal
```

---

## 📡 **API Endpoint Details**

### **Endpoint:**

```
POST https://api.flow.ai/v1/extract-document
```

### **Authentication:**

```bash
Authorization: Bearer fv_live_xxxxxxxxxxxxxxxx
```

(API key from CLI login, stored in `~/.flow/credentials.json`)

---

### **Request (cURL):**

```bash
curl -X POST https://api.flow.ai/v1/extract-document \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -F "file=@document.pdf" \
  -F "model=flash"
```

---

### **Request (JavaScript):**

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
      'Authorization': 'Bearer YOUR_API_KEY',
      ...form.getHeaders()
    }
  }
);

console.log(response.data.extractedText);
```

---

### **Request (Python):**

```python
import requests

url = "https://api.flow.ai/v1/extract-document"
headers = {"Authorization": "Bearer YOUR_API_KEY"}
files = {"file": open("document.pdf", "rb")}
data = {"model": "flash"}

response = requests.post(url, headers=headers, files=files, data=data)
result = response.json()

print(result['extractedText'])
```

---

## 📊 **Response Format**

### **Success Response (200 OK):**

```json
{
  "success": true,
  "documentId": "doc_abc123xyz",
  "extractedText": "Full document content extracted here...\n\nWith all text, tables, and data...",
  "metadata": {
    "fileName": "document.pdf",
    "fileSize": 1240000,
    "pageCount": 15,
    "model": "gemini-2.5-flash",
    "extractionMethod": "vision-api",
    "tokensUsed": 12450,
    "costUSD": 0.0034,
    "processingTime": 2300
  }
}
```

---

### **Error Response (40x/50x):**

```json
{
  "error": {
    "code": "QUOTA_EXCEEDED",
    "message": "Monthly quota limit reached",
    "quota": {
      "limit": 1000,
      "used": 1000,
      "remaining": 0,
      "resetsAt": "2025-12-01T00:00:00Z"
    }
  }
}
```

---

## ⚙️ **Request Parameters**

### **Required:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `file` | File | Document to extract (PDF, Excel, Word, CSV) |

### **Optional:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `model` | string | `flash` | AI model: `flash` (fast) or `pro` (accurate) |
| `extractionMethod` | string | `vision-api` | Extraction method (auto-selected based on file size) |
| `webhookUrl` | string | - | Callback URL for async processing (files > 50MB) |

---

## 🔑 **API Models**

### **Flash (Recommended)**

```
Speed: Fast (2-3 seconds)
Cost: $0.075 per 1M input tokens
Best for: Most documents
When: Default choice (94% cheaper than Pro)
```

### **Pro (Advanced)**

```
Speed: Moderate (3-5 seconds)
Cost: $1.25 per 1M input tokens
Best for: Complex documents, high accuracy needs
When: Tables, charts, technical documents
```

---

## 📋 **Supported File Types**

```
✅ PDF (.pdf) - up to 500MB
✅ Excel (.xlsx, .xls) - up to 100MB
✅ Word (.docx, .doc) - up to 100MB
✅ CSV (.csv) - up to 50MB
✅ Images (.png, .jpg) - up to 20MB
```

---

## 💡 **Use Cases**

### **1. Document Processing Pipeline**

```javascript
// Process invoices, contracts, reports
const documents = ['invoice1.pdf', 'contract.pdf', 'report.docx'];

for (const doc of documents) {
  const result = await flowAPI.extractDocument(doc);
  await saveToDatabase(result.extractedText);
}
```

### **2. Data Extraction from Forms**

```javascript
// Extract data from scanned forms
const result = await flowAPI.extractDocument('form.pdf');
const data = parseExtractedData(result.extractedText);
// → { name: "John Doe", amount: "$1,234", date: "2025-11-17" }
```

### **3. Content Search & Analysis**

```javascript
// Extract and search across documents
const result = await flowAPI.extractDocument('manual.pdf');
const keywords = extractKeywords(result.extractedText);
const summary = generateSummary(result.extractedText);
```

---

## 🔄 **Async Processing (Large Files > 50MB)**

### **Request:**

```bash
curl -X POST https://api.flow.ai/v1/extract-document \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -F "file=@large-document.pdf" \
  -F "webhookUrl=https://your-app.com/webhooks/flow"
```

### **Response (202 Accepted):**

```json
{
  "success": true,
  "jobId": "job_xyz789",
  "status": "processing",
  "estimatedCompletion": "2025-11-17T10:35:00Z",
  "message": "Large file processing asynchronously. Webhook will be called on completion."
}
```

### **Webhook Callback (When Complete):**

```json
POST https://your-app.com/webhooks/flow
Headers:
  X-Flow-Signature: sha256=xxxxx (HMAC for verification)

Body:
{
  "jobId": "job_xyz789",
  "documentId": "doc_abc123",
  "status": "completed",
  "extractedText": "Full content...",
  "metadata": { ... }
}
```

---

## 📊 **Quotas & Rate Limits**

### **Trial Tier (Free for 14 days):**

```
Monthly Requests: 100
Daily Requests: 10
Max File Size: 20MB
Concurrent: 1 request at a time
```

### **Starter Tier ($50/month):**

```
Monthly Requests: 1,000
Daily Requests: 100
Max File Size: 100MB
Concurrent: 3 requests
```

### **Pro Tier ($200/month):**

```
Monthly Requests: 10,000
Daily Requests: 1,000
Max File Size: 500MB
Concurrent: 10 requests
```

### **Enterprise (Custom):**

```
Monthly Requests: 100,000+
Daily Requests: 10,000+
Max File Size: 2GB
Concurrent: 50+ requests
Custom SLA, dedicated support
```

---

## 🔍 **How to Monitor Usage**

### **Via CLI:**

```bash
# Check your usage and quota
flow-cli status

# Output:
# Organization: YourCompany-API
# Quota: 234 / 1,000 requests this month
# Cost: $12.34 this month
```

### **Via Dashboard:**

```
1. Visit: https://api.flow.ai/portal
2. Login with your credentials
3. View: Usage analytics, costs, requests
```

---

## 🆘 **Support & Documentation**

### **Get Help:**

```
📧 Email: api-support@flow.ai
💬 Chat: Developer portal → Support
📚 Docs: https://api.flow.ai/docs
🐛 Issues: https://github.com/flow/api-issues
```

### **Documentation:**

```
Quick Start: https://api.flow.ai/docs/quick-start
API Reference: https://api.flow.ai/docs/reference
Use Cases: https://api.flow.ai/docs/use-cases
SDKs: https://api.flow.ai/docs/sdks
```

---

## 🎯 **Complete Example (End-to-End)**

### **Scenario: Process Invoice**

```javascript
// 1. Install SDK
// npm install @flow/sdk

const FlowAPI = require('@flow/sdk');

// 2. Initialize client
const client = new FlowAPI(process.env.FLOW_API_KEY);

// 3. Extract invoice
const result = await client.extractDocument('invoice-2025-11.pdf');

// 4. Parse extracted data
const invoiceData = {
  content: result.extractedText,
  metadata: result.metadata,
  extractedAt: new Date(),
};

// 5. Process the data
const parsed = parseInvoice(result.extractedText);
// → { invoice: "INV-001", total: "$1,234.56", date: "2025-11-17" }

// 6. Save to your database
await db.invoices.create(parsed);

console.log('✓ Invoice processed and saved!');
```

---

## 🔐 **Security Best Practices**

### **1. Store API Keys Securely:**

```bash
# ✅ Good: Environment variable
export FLOW_API_KEY=fv_live_xxxxx

# ❌ Bad: Hardcoded
const apiKey = 'fv_live_xxxxx'; // NEVER do this!
```

### **2. Verify Webhook Signatures:**

```javascript
const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const hash = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
  
  return `sha256=${hash}` === signature;
}
```

### **3. Use HTTPS Only:**

```javascript
// ✅ Production endpoint
const url = 'https://api.flow.ai/v1/extract-document';

// ❌ Never use HTTP in production
const url = 'http://api.flow.ai/v1/extract-document';
```

---

## 🎉 **You're Ready!**

**Next steps:**

1. ✅ Get invitation code from admin
2. ✅ Install CLI: `npm install -g @flow/cli`
3. ✅ Login: `flow-cli login YOUR-CODE`
4. ✅ Extract: `flow-cli extract document.pdf`
5. ✅ Integrate into your app
6. ✅ Scale to production

---

## 📚 **Full Documentation**

For complete documentation, see:

- `docs/API_SYSTEM_ARCHITECTURE.md` - Complete system design
- `docs/API_QUICK_REFERENCE.md` - Daily reference
- `packages/flow-cli/README.md` - CLI documentation
- `.cursor/rules/api-system.mdc` - Technical reference

---

**Welcome to Flow Vision API! Start extracting documents in minutes.** 🚀✨





