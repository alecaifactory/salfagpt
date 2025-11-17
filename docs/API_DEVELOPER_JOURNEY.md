# Flow Vision API - Developer Journey

**From Invitation to Production**  
**Complete developer experience map**

---

## 🗺️ **The Complete Journey**

```
SuperAdmin                Developer                    Their Application
    │                          │                              │
    │ 1. Create Invitation     │                              │
    ├─────────────────────────>│                              │
    │   FLOW-ENT-202511-ABC    │                              │
    │                          │                              │
    │                          │ 2. Install CLI               │
    │                          ├──────────────────────────────┤
    │                          │   npm i -g @flow/cli         │
    │                          │                              │
    │                          │ 3. Login (OAuth)             │
    │                          ├──────────────────────────────┤
    │                          │   flow-cli login CODE        │
    │                          │   Browser: Google OAuth      │
    │                          │   ✓ API Key generated        │
    │                          │                              │
    │                          │ 4. Test Extraction           │
    │                          ├──────────────────────────────┤
    │                          │   flow-cli extract doc.pdf   │
    │                          │   ✓ JSON with content        │
    │                          │                              │
    │                          │ 5. Integrate                 │
    │                          │                              │
    │                          │   const client = new         │
    │                          │     FlowAPI(apiKey);         │
    │                          │                              │
    │                          │   result = await client      │
    │                          │     .extract('doc.pdf');     │
    │                          │                              │
    │                          │ 6. Deploy to Production      │
    │                          │                              │
    │                          │   app.post('/upload', ...)   │
    │                          │   ↓                          │
    │                          │   flowAPI.extract(file)      │
    │                          │   ↓                          │
    │                          │   process(result.text)       │
    │                          │                              │
    │                          │<─────────────────────────────┤
    │                          │   ✓ Documents processed      │
    │                          │   ✓ Users happy              │
    │                          │   ✓ Business value           │
```

---

## 📦 **What Happens Under the Hood**

### **When Developer Calls the API:**

```
Developer App                Flow Platform                Gemini AI
     │                            │                            │
     │ POST /v1/extract-document  │                            │
     ├───────────────────────────>│                            │
     │                            │                            │
     │                            │ 1. Validate API key        │
     │                            │    ✓ Check hash            │
     │                            │    ✓ Check expiration      │
     │                            │    ✓ Check org status      │
     │                            │                            │
     │                            │ 2. Check quotas            │
     │                            │    ✓ Monthly limit         │
     │                            │    ✓ Daily limit           │
     │                            │    ✓ File size limit       │
     │                            │                            │
     │                            │ 3. Process file            │
     │                            ├───────────────────────────>│
     │                            │   Extract content          │
     │                            │<───────────────────────────┤
     │                            │   Extracted text           │
     │                            │                            │
     │                            │ 4. Log usage               │
     │                            │    • Increment counters    │
     │                            │    • Track costs           │
     │                            │    • Audit log             │
     │                            │                            │
     │<───────────────────────────┤                            │
     │   JSON Response            │                            │
     │                            │                            │
     │ 5. Use extracted data      │                            │
     │    • Parse content         │                            │
     │    • Store in DB           │                            │
     │    • Show to users         │                            │
```

---

## 🔄 **Real-Time Monitoring**

### **What SuperAdmin Sees:**

```
API Management Dashboard:

Organizations: 12 active
├─ Salfa-Corp-API: 1,234 requests this month
├─ Partner-Co-API: 567 requests
└─ Client-Inc-API: 890 requests

Total API Calls: 2,691 this month
Revenue: $156.50 this month
Success Rate: 99.7%
Avg Response Time: 1.8s
```

### **What Developer Sees:**

```
Developer Portal Dashboard:

Your Organization: Salfa-Corp-API
Tier: Pro

This Month:
├─ Requests: 1,234 / 10,000
├─ Documents: 456
├─ Tokens: 1.2M
└─ Cost: $45.67

Performance:
├─ Success Rate: 99.8%
├─ Avg Response: 1.6s
└─ Error Rate: 0.2%
```

---

## 🎯 **Integration Patterns**

### **Pattern 1: Synchronous (Small Files)**

```javascript
// For files < 50MB
app.post('/api/process-document', async (req, res) => {
  try {
    // Upload comes from your user
    const file = req.file;
    
    // Extract with Flow
    const result = await flowAPI.extractDocument(file.path);
    
    // Return to your user
    res.json({
      success: true,
      content: result.extractedText,
      metadata: result.metadata,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

---

### **Pattern 2: Asynchronous (Large Files)**

```javascript
// For files > 50MB
app.post('/api/process-large-document', async (req, res) => {
  try {
    const file = req.file;
    
    // Start async extraction
    const job = await flowAPI.extractDocument(file.path, {
      webhookUrl: 'https://your-app.com/webhooks/flow'
    });
    
    // Return job ID immediately
    res.json({
      jobId: job.jobId,
      status: 'processing',
      estimatedTime: '5 minutes',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Webhook endpoint
app.post('/webhooks/flow', async (req, res) => {
  // Verify signature
  const signature = req.headers['x-flow-signature'];
  if (!verifySignature(req.body, signature)) {
    return res.status(401).send('Invalid signature');
  }
  
  // Process result
  const { jobId, documentId, extractedText, metadata } = req.body;
  
  await processExtractedDocument(extractedText);
  
  res.status(200).send('OK');
});
```

---

### **Pattern 3: Batch Processing**

```javascript
// Process multiple documents
const documents = await db.documents.findPending();

const results = await Promise.all(
  documents.map(doc => 
    flowAPI.extractDocument(doc.filePath)
  )
);

// Save all results
await db.documents.updateMany(results);
```

---

## 🔍 **Developer Documentation Sources**

### **1. Interactive Playground (In App)**

```
Flow Chat → Menu → APIs → Test Vision API

Features:
- Upload and extract documents
- See real JSON responses
- Copy code examples
- Test different models
- No coding required
```

---

### **2. Developer Portal (Website)**

```
URL: https://api.flow.ai/portal

Sections:
- Quick Start Guide (5 minutes)
- API Reference (all endpoints)
- Code Examples (cURL, JS, Python)
- Interactive Playground
- Use Cases & Tutorials
- SDK Documentation
```

---

### **3. CLI Help (Command Line)**

```bash
# Get help
flow-cli --help

# Command help
flow-cli extract --help

# Example:
# Usage: flow-cli extract <file> [options]
# Options:
#   -m, --model <model>   AI model: flash or pro (default: flash)
#   -o, --output <file>   Save extracted text to file
#   --json                Output as JSON
```

---

### **4. Developer Docs (Repository)**

```
Location: packages/flow-cli/README.md
         docs/DEVELOPER_QUICK_START.md
         docs/API_QUICK_REFERENCE.md

Content:
- Installation guide
- Authentication flow
- API endpoint reference
- Error codes
- Best practices
- Troubleshooting
```

---

## 💻 **SDK & Libraries**

### **JavaScript/TypeScript SDK:**

```javascript
// Install
npm install @flow/sdk

// Use
const FlowAPI = require('@flow/sdk');
const client = new FlowAPI(process.env.FLOW_API_KEY);

// Extract
const result = await client.extractDocument('file.pdf');

// With options
const result = await client.extractDocument('file.pdf', {
  model: 'pro',
  webhook: 'https://your-app.com/webhook'
});
```

---

### **Python SDK (Future):**

```python
# Install
pip install flow-sdk

# Use
from flow import FlowAPI

client = FlowAPI(api_key=os.getenv('FLOW_API_KEY'))

# Extract
result = client.extract_document('file.pdf')
print(result.extracted_text)
```

---

## 🎓 **Learning Path**

### **Day 1: Get Started**

```
✓ Get invitation code
✓ Install CLI
✓ Login with OAuth
✓ Extract first document
✓ See JSON response

Goal: Understand basic flow
Time: 10 minutes
```

---

### **Day 2-3: Integrate**

```
✓ Read API documentation
✓ Install SDK in your app
✓ Make first API call from code
✓ Handle success/error cases
✓ Test with various file types

Goal: Working integration
Time: 2-3 hours
```

---

### **Week 1: Production**

```
✓ Error handling robust
✓ Quota monitoring setup
✓ Webhook integration (for large files)
✓ Cost tracking
✓ Deploy to production

Goal: Production-ready app
Time: 1 week
```

---

### **Ongoing: Optimize**

```
✓ Monitor usage analytics
✓ Optimize costs (Flash vs Pro)
✓ Improve extraction quality
✓ Scale infrastructure
✓ Add features

Goal: Continuous improvement
```

---

## 🎯 **Success Metrics**

### **For Developers:**

```
Time to First Extraction: < 10 minutes
Integration Time: < 1 day
Success Rate: > 99.5%
Avg Response Time: < 2s
Documentation Quality: Excellent (CSAT 4.8+)
Support Response: < 1 hour
```

### **For Their Users:**

```
Document Processing: Automatic
Accuracy: 99%+
Speed: Seconds vs hours
Cost: Pennies per document
Experience: Seamless
```

---

## 📞 **Getting Started Checklist**

Before you begin:

- [ ] Have business email (not gmail.com)
- [ ] Received invitation code from Flow team
- [ ] Have Node.js 18+ installed
- [ ] Ready to integrate into your app

To get access:

1. Email: alec@getaifactory.com
2. Subject: "Flow Vision API Access Request"
3. Include:
   - Company name
   - Use case
   - Expected monthly volume
   - Technical contact

Response time: < 24 hours

---

**Everything is documented and ready. Developers can start integrating immediately after getting their invitation code!** 🚀

**This is how we enable the entire developer ecosystem.** 🌍✨

