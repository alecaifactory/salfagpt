# API Specification - Nubox Cartola Extraction
## RESTful API Reference

**Version:** 1.0.0  
**Base URL:** `https://[api-id].execute-api.us-east-1.amazonaws.com/[stage]`  
**Protocol:** HTTPS only  
**Authentication:** API Key (Header: `x-api-key`)  
**Content-Type:** `application/json`

---

## 📡 Endpoints

### **POST /cartola/extract**

Extract bank statement data from uploaded PDF.

**Endpoint:**
```
POST /cartola/extract
```

**Headers:**
```
Content-Type: application/json
x-api-key: your-api-key-here
```

**Request Body:**
```json
{
  "s3Key": "user-123/cartola-oct-2024.pdf",
  "userId": "user-123",
  "organizationId": "org-salfa-corp",
  "bankName": "Banco de Chile",
  "model": "gemini-2.5-flash",
  "webhookUrl": "https://your-app.com/webhook/cartola"
}
```

**Request Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `s3Key` | string | ✅ Yes | S3 object key (path to uploaded PDF) |
| `userId` | string | ✅ Yes | User identifier (for data isolation) |
| `organizationId` | string | ❌ No | Organization identifier (multi-tenant) |
| `bankName` | string | ❌ No | Bank name (helps extraction accuracy) |
| `model` | string | ❌ No | AI model: `gemini-2.5-flash` (default) or `gemini-2.5-pro` |
| `webhookUrl` | string | ❌ No | URL to POST results when complete |

**Response (Success - 200 OK):**
```json
{
  "success": true,
  "extractionId": "ext_1700000000000_abc123def456",
  "status": "processing",
  "estimatedTime": 60,
  "message": "Extraction started. Poll GET /cartola/{id} for results."
}
```

**Response (Error - 400 Bad Request):**
```json
{
  "error": "Missing required fields",
  "details": "s3Key and userId are required",
  "fields": ["s3Key", "userId"]
}
```

**Response (Error - 401 Unauthorized):**
```json
{
  "error": "Unauthorized",
  "message": "Invalid or missing API key"
}
```

**Response (Error - 500 Internal Server Error):**
```json
{
  "error": "Extraction failed",
  "details": "Failed to download PDF from S3",
  "extractionId": "ext_xxx"
}
```

**Example cURL:**
```bash
curl -X POST https://abc123.execute-api.us-east-1.amazonaws.com/prod/cartola/extract \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key" \
  -d '{
    "s3Key": "user-123/cartola-oct-2024.pdf",
    "userId": "user-123",
    "bankName": "Banco de Chile",
    "model": "gemini-2.5-flash"
  }'
```

**Example JavaScript:**
```javascript
const response = await fetch('https://abc123.execute-api.us-east-1.amazonaws.com/prod/cartola/extract', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': 'your-api-key'
  },
  body: JSON.stringify({
    s3Key: 'user-123/cartola-oct-2024.pdf',
    userId: 'user-123',
    bankName: 'Banco de Chile'
  })
});

const data = await response.json();
console.log('Extraction ID:', data.extractionId);
```

---

### **GET /cartola/{id}**

Get extraction status and results.

**Endpoint:**
```
GET /cartola/{id}
```

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | ✅ Yes | Extraction ID (from POST response) |

**Headers:**
```
x-api-key: your-api-key-here
```

**Response (Processing - 200 OK):**
```json
{
  "id": "ext_1700000000000_abc123",
  "userId": "user-123",
  "organizationId": "org-salfa-corp",
  "status": "processing",
  "fileName": "cartola-oct-2024.pdf",
  "fileSize": 524288,
  "bankName": "Banco de Chile",
  "model": "gemini-2.5-flash",
  "createdAt": 1700000000000,
  "updatedAt": 1700000030000,
  "message": "Extraction in progress. Estimated 30 seconds remaining."
}
```

**Response (Completed - 200 OK):**
```json
{
  "id": "ext_1700000000000_abc123",
  "userId": "user-123",
  "status": "completed",
  "fileName": "cartola-oct-2024.pdf",
  "bankName": "Banco de Chile",
  "extractionResult": {
    "document_id": "doc_abc123",
    "bank_name": "Banco de Chile",
    "account_number": "000484021004",
    "account_holder": "Gino Ramirez",
    "account_holder_rut": "16416697-K",
    "period_start": "2024-09-30T00:00:00Z",
    "period_end": "2024-10-30T00:00:00Z",
    "opening_balance": 2260904,
    "closing_balance": 1022952,
    "total_credits": 317000,
    "total_debits": 1554952,
    "movements": [
      {
        "id": "mov_001",
        "type": "transfer",
        "amount": -50000,
        "pending": false,
        "currency": "CLP",
        "post_date": "2024-10-30T00:00:00Z",
        "description": "Traspaso A:Gino Superdigital",
        "balance": 2210904,
        "sender_account": {
          "holder_id": "16416697k",
          "dv": "k",
          "holder_name": "Gino Ramirez"
        },
        "insights": {
          "errores": [],
          "calidad": "alta",
          "banco": "Banco de Chile",
          "extraction_proximity_pct": 95
        }
      }
      // ... more movements
    ],
    "balance_validation": {
      "saldo_inicial": 2260904,
      "total_abonos": 317000,
      "total_cargos": 1554952,
      "saldo_calculado": 1022952,
      "saldo_final_documento": 1022952,
      "coincide": true,
      "diferencia": 0
    },
    "metadata": {
      "total_pages": 3,
      "total_movements": 10,
      "extraction_time": 58234,
      "confidence": 0.98,
      "model": "gemini-2.5-flash",
      "cost": 0.0008
    },
    "quality": {
      "fields_complete": true,
      "movements_complete": true,
      "balance_matches": true,
      "confidence_score": 0.98,
      "recommendation": "✅ Lista para Nubox",
      "average_extraction_proximity_pct": 95,
      "extraction_bank": "Banco de Chile"
    }
  },
  "processingTime": 58234,
  "inputTokens": 12500,
  "outputTokens": 3200,
  "cost": 0.0008,
  "createdAt": 1700000000000,
  "completedAt": 1700000058234
}
```

**Response (Failed - 200 OK with error):**
```json
{
  "id": "ext_1700000000000_abc123",
  "status": "failed",
  "error": {
    "message": "Failed to parse PDF",
    "code": "INVALID_PDF",
    "details": "PDF appears to be corrupted or encrypted"
  },
  "createdAt": 1700000000000,
  "updatedAt": 1700000015000
}
```

**Response (Not Found - 404):**
```json
{
  "error": "Extraction not found",
  "extractionId": "ext_xxx"
}
```

**Example cURL:**
```bash
curl https://abc123.execute-api.us-east-1.amazonaws.com/prod/cartola/ext_1700000000000_abc123 \
  -H "x-api-key: your-api-key"
```

**Example JavaScript (Polling):**
```javascript
async function pollExtraction(extractionId, maxAttempts = 60) {
  for (let i = 0; i < maxAttempts; i++) {
    const response = await fetch(
      `https://api-url/cartola/${extractionId}`,
      { headers: { 'x-api-key': 'your-key' } }
    );
    
    const data = await response.json();
    
    if (data.status === 'completed') {
      return data.extractionResult;
    }
    
    if (data.status === 'failed') {
      throw new Error(data.error.message);
    }
    
    // Wait 5 seconds before next poll
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
  
  throw new Error('Extraction timeout - exceeded 5 minutes');
}

// Usage
const result = await pollExtraction('ext_xxx');
console.log('Movements:', result.movements);
```

---

### **GET /cartola/list**

List user's cartola extractions with filtering.

**Endpoint:**
```
GET /cartola/list?userId={userId}&status={status}&limit={limit}&nextToken={token}
```

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `userId` | string | ✅ Yes | User identifier |
| `status` | string | ❌ No | Filter by status: `completed`, `processing`, `failed`, `pending` |
| `limit` | number | ❌ No | Results per page (default: 50, max: 100) |
| `nextToken` | string | ❌ No | Pagination token (from previous response) |

**Headers:**
```
x-api-key: your-api-key-here
```

**Response (200 OK):**
```json
{
  "items": [
    {
      "id": "ext_1700000000000_abc123",
      "userId": "user-123",
      "fileName": "cartola-oct-2024.pdf",
      "bankName": "Banco de Chile",
      "status": "completed",
      "createdAt": 1700000000000,
      "completedAt": 1700000058234,
      "processingTime": 58234,
      "movementsCount": 10,
      "balanceValidated": true
    },
    {
      "id": "ext_1700000001000_def456",
      "userId": "user-123",
      "fileName": "cartola-nov-2024.pdf",
      "bankName": "BancoEstado",
      "status": "processing",
      "createdAt": 1700000001000
    }
  ],
  "count": 2,
  "nextToken": "encoded-continuation-token",
  "hasMore": true
}
```

**Example cURL:**
```bash
# List all extractions for user
curl "https://abc123.execute-api.us-east-1.amazonaws.com/prod/cartola/list?userId=user-123" \
  -H "x-api-key: your-api-key"

# Filter by status
curl "https://abc123.execute-api.us-east-1.amazonaws.com/prod/cartola/list?userId=user-123&status=completed&limit=10" \
  -H "x-api-key: your-api-key"

# Pagination
curl "https://abc123.execute-api.us-east-1.amazonaws.com/prod/cartola/list?userId=user-123&limit=50&nextToken=abc..." \
  -H "x-api-key: your-api-key"
```

**Example JavaScript:**
```javascript
async function listExtractions(userId, options = {}) {
  const params = new URLSearchParams({
    userId,
    ...options  // status, limit, nextToken
  });
  
  const response = await fetch(
    `https://api-url/cartola/list?${params}`,
    { headers: { 'x-api-key': 'your-key' } }
  );
  
  return await response.json();
}

// Usage
const completed = await listExtractions('user-123', { 
  status: 'completed', 
  limit: 20 
});

console.log(`Found ${completed.count} completed extractions`);
completed.items.forEach(item => {
  console.log(`- ${item.fileName}: ${item.movementsCount} movements`);
});
```

---

## 📊 Data Models

### **Extraction Request**

```typescript
interface ExtractionRequest {
  s3Key: string;           // Required: S3 object key
  userId: string;          // Required: Owner identifier
  organizationId?: string; // Optional: For multi-tenant
  bankName?: string;       // Optional: "Banco de Chile", "BancoEstado", etc.
  model?: string;          // Optional: "gemini-2.5-flash" | "gemini-2.5-pro"
  webhookUrl?: string;     // Optional: Callback URL for results
}
```

### **Extraction Response**

```typescript
interface ExtractionResponse {
  success: boolean;
  extractionId: string;
  status: 'processing';
  estimatedTime: number;  // seconds
  message: string;
}
```

### **Extraction Status**

```typescript
interface ExtractionStatus {
  id: string;
  userId: string;
  organizationId?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  fileName: string;
  fileSize: number;
  s3Key: string;
  bankName?: string;
  model: string;
  extractionResult?: NuboxCartolaJSON;  // Only when status = completed
  error?: {
    message: string;
    code: string;
    details?: string;
  };
  processingTime?: number;
  inputTokens?: number;
  outputTokens?: number;
  cost?: number;
  createdAt: number;  // epoch milliseconds
  updatedAt: number;
  completedAt?: number;
  ttl: number;  // epoch seconds (auto-deletion timestamp)
}
```

### **Nubox Cartola JSON**

Complete specification in `REQUIREMENTS.md`, summary here:

```typescript
interface NuboxCartolaJSON {
  document_id: string;
  bank_name: string;
  account_number: string;
  account_holder: string;
  account_holder_rut: string;
  period_start: string;  // ISO 8601
  period_end: string;
  statement_date: string;
  opening_balance: number;
  closing_balance: number;
  total_credits: number;
  total_debits: number;
  movements: Movement[];
  balance_validation: BalanceValidation;
  metadata: Metadata;
  quality: Quality;
}

interface Movement {
  id: string;
  type: 'transfer' | 'deposit' | 'withdrawal' | 'payment' | 'fee' | 'other';
  amount: number;  // Signed: positive = credit, negative = debit
  pending: boolean;
  currency: string;  // "CLP"
  post_date: string;  // ISO 8601
  description: string;
  balance: number;  // Account balance after this movement
  sender_account: {
    holder_id: string;  // RUT without dots: "12345678k"
    dv: string;  // Digit verifier: "k"
    holder_name: string | null;
  };
  insights: {
    errores: string[];
    calidad: 'alta' | 'media' | 'baja';
    banco: string;
    extraction_proximity_pct: number;  // 0-100
  };
}

interface BalanceValidation {
  saldo_inicial: number;
  total_abonos: number;
  total_cargos: number;
  saldo_calculado: number;
  saldo_final_documento: number;
  coincide: boolean;
  diferencia: number;
}

interface Quality {
  fields_complete: boolean;
  movements_complete: boolean;
  balance_matches: boolean;
  confidence_score: number;  // 0-1
  recommendation: string;  // "✅ Lista para Nubox" or "⚠️ Revisar extracción"
  average_extraction_proximity_pct: number;
  extraction_bank: string;
}
```

---

## 🔐 Authentication

### **API Key Authentication**

**Header Format:**
```
x-api-key: abc123def456ghi789jkl012mno345pqr678
```

**Obtaining API Key:**

1. **AWS Console:**
   - API Gateway → API Keys → Create API key
   - Copy key value
   - Associate with usage plan

2. **Via CLI:**
```bash
# Create API key
aws apigateway create-api-key \
  --name nubox-frontend-key \
  --enabled \
  --query 'id' \
  --output text

# Get key value
aws apigateway get-api-key \
  --api-key YOUR_KEY_ID \
  --include-value \
  --query 'value' \
  --output text
```

**Rate Limits (per key):**
- Rate: 100 requests/second
- Burst: 200 requests
- Daily quota: 100,000 requests

**Key Rotation:**
- Recommended: Every 90 days
- Create new key → Update clients → Delete old key

---

## 🚦 Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 400 | Bad Request | Invalid request parameters |
| 401 | Unauthorized | Missing or invalid API key |
| 403 | Forbidden | Valid API key but no permission |
| 404 | Not Found | Extraction ID doesn't exist |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server-side error |
| 503 | Service Unavailable | Temporary outage |

---

## ⏱️ Rate Limiting

**Default Limits:**
```
Rate: 100 requests/second
Burst: 200 requests
Daily: 100,000 requests per API key
```

**Headers in Response:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1700000001
```

**When Rate Limited (429):**
```json
{
  "error": "Rate limit exceeded",
  "retryAfter": 1,
  "message": "Too many requests. Try again in 1 second."
}
```

**Best Practices:**
- Implement exponential backoff
- Cache results when possible
- Batch operations if possible

---

## 🔄 Webhooks (Optional)

### **Webhook Configuration**

**In extraction request:**
```json
{
  "s3Key": "...",
  "userId": "...",
  "webhookUrl": "https://your-app.com/webhook/cartola-complete",
  "webhookSecret": "shared-secret-for-hmac"
}
```

### **Webhook Payload (Completion)**

**POST to your webhookUrl:**

```json
{
  "event": "extraction.completed",
  "extractionId": "ext_1700000000000_abc123",
  "userId": "user-123",
  "status": "completed",
  "result": {
    "movementsCount": 10,
    "balanceValidated": true,
    "bankName": "Banco de Chile",
    "recommendation": "✅ Lista para Nubox"
  },
  "processingTime": 58234,
  "cost": 0.0008,
  "timestamp": "2024-11-27T10:00:58.234Z",
  "signature": "sha256=abc123def456..."
}
```

**Webhook Signature Verification:**

```javascript
const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
  const expectedSignature = 'sha256=' + crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

// In your webhook handler
app.post('/webhook/cartola-complete', (req, res) => {
  const signature = req.headers['x-signature'];
  const secret = process.env.WEBHOOK_SECRET;
  
  if (!verifyWebhookSignature(req.body, signature, secret)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  // Process webhook
  const { extractionId, result } = req.body;
  console.log(`Extraction ${extractionId} completed:`, result);
  
  res.status(200).json({ received: true });
});
```

**Webhook Retry Logic:**
- Retries: 3 attempts
- Backoff: Exponential (1s, 2s, 4s)
- Timeout: 30 seconds per attempt
- If all fail: Log error, no further retries

---

## 📝 Error Codes

### **Application-Specific Errors**

| Code | Message | Cause | Resolution |
|------|---------|-------|------------|
| `MISSING_FIELDS` | Required fields missing | s3Key or userId not provided | Include required fields |
| `INVALID_S3_KEY` | S3 key not found | PDF doesn't exist in S3 | Upload PDF first |
| `INVALID_PDF` | PDF corrupted or invalid | File is not valid PDF | Re-upload valid PDF |
| `PDF_TOO_LARGE` | File size exceeds limit | PDF >500MB | Split or compress PDF |
| `GEMINI_API_ERROR` | Gemini AI request failed | API key invalid or quota exceeded | Check API key and quota |
| `EXTRACTION_TIMEOUT` | Processing took too long | PDF too complex | Retry with Pro model |
| `VALIDATION_FAILED` | JSON validation failed | AI returned invalid format | Manual review required |
| `BALANCE_MISMATCH` | Balance equation failed | Extraction errors | Check quality.recommendation |

### **AWS Service Errors**

| Code | Message | Cause | Resolution |
|------|---------|-------|------------|
| `AccessDeniedException` | S3/DynamoDB access denied | IAM permissions missing | Update Lambda execution role |
| `ThrottlingException` | DynamoDB rate exceeded | Too many requests | Automatic retry (AWS SDK) |
| `ResourceNotFoundException` | Table/bucket not found | Infrastructure not deployed | Deploy infrastructure |
| `ServiceUnavailableException` | AWS service down | Temporary AWS outage | Retry after delay |

---

## 🧪 Testing Endpoints

### **Postman Collection**

Import this JSON into Postman:

```json
{
  "info": {
    "name": "Nubox Cartola API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "baseUrl",
      "value": "https://abc123.execute-api.us-east-1.amazonaws.com/prod"
    },
    {
      "key": "apiKey",
      "value": "your-api-key-here"
    }
  ],
  "item": [
    {
      "name": "Extract Cartola",
      "request": {
        "method": "POST",
        "header": [
          {"key": "Content-Type", "value": "application/json"},
          {"key": "x-api-key", "value": "{{apiKey}}"}
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"s3Key\": \"user-123/test.pdf\",\n  \"userId\": \"user-123\",\n  \"bankName\": \"Banco de Chile\"\n}"
        },
        "url": {
          "raw": "{{baseUrl}}/cartola/extract",
          "host": ["{{baseUrl}}"],
          "path": ["cartola", "extract"]
        }
      }
    },
    {
      "name": "Get Status",
      "request": {
        "method": "GET",
        "header": [
          {"key": "x-api-key", "value": "{{apiKey}}"}
        ],
        "url": {
          "raw": "{{baseUrl}}/cartola/{{extractionId}}",
          "host": ["{{baseUrl}}"],
          "path": ["cartola", "{{extractionId}}"]
        }
      }
    },
    {
      "name": "List Extractions",
      "request": {
        "method": "GET",
        "header": [
          {"key": "x-api-key", "value": "{{apiKey}}"}
        ],
        "url": {
          "raw": "{{baseUrl}}/cartola/list?userId=user-123&limit=10",
          "host": ["{{baseUrl}}"],
          "path": ["cartola", "list"],
          "query": [
            {"key": "userId", "value": "user-123"},
            {"key": "limit", "value": "10"}
          ]
        }
      }
    }
  ]
}
```

---

## 📖 OpenAPI Specification

**Full OpenAPI 3.0 spec:**

```yaml
openapi: 3.0.0
info:
  title: Nubox Cartola Extraction API
  description: Intelligent bank statement extraction using Gemini AI
  version: 1.0.0
  contact:
    name: Nubox Development Team
    email: dev@nubox.com

servers:
  - url: https://abc123.execute-api.us-east-1.amazonaws.com/prod
    description: Production
  - url: https://def456.execute-api.us-east-1.amazonaws.com/staging
    description: Staging

security:
  - ApiKeyAuth: []

paths:
  /cartola/extract:
    post:
      summary: Extract bank statement
      description: Upload PDF and trigger AI extraction
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ExtractionRequest'
      responses:
        '200':
          description: Extraction started
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ExtractionResponse'
        '400':
          description: Invalid request
        '401':
          description: Unauthorized

  /cartola/{id}:
    get:
      summary: Get extraction status
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Extraction found
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ExtractionStatus'
        '404':
          description: Not found

  /cartola/list:
    get:
      summary: List extractions
      parameters:
        - name: userId
          in: query
          required: true
          schema:
            type: string
        - name: status
          in: query
          schema:
            type: string
            enum: [pending, processing, completed, failed]
        - name: limit
          in: query
          schema:
            type: integer
            default: 50
            maximum: 100
      responses:
        '200':
          description: List retrieved
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ExtractionList'

components:
  securitySchemes:
    ApiKeyAuth:
      type: apiKey
      in: header
      name: x-api-key

  schemas:
    ExtractionRequest:
      type: object
      required: [s3Key, userId]
      properties:
        s3Key:
          type: string
        userId:
          type: string
        organizationId:
          type: string
        bankName:
          type: string
        model:
          type: string
          enum: [gemini-2.5-flash, gemini-2.5-pro]
    
    ExtractionResponse:
      type: object
      properties:
        success:
          type: boolean
        extractionId:
          type: string
        status:
          type: string
        estimatedTime:
          type: integer
```

---

## 🔗 SDK Examples

### **Python SDK**

```python
import requests
import time

class NuboxCartolaClient:
    def __init__(self, api_url, api_key):
        self.api_url = api_url
        self.headers = {
            'Content-Type': 'application/json',
            'x-api-key': api_key
        }
    
    def extract(self, s3_key, user_id, bank_name=None):
        """Trigger extraction"""
        response = requests.post(
            f'{self.api_url}/cartola/extract',
            headers=self.headers,
            json={
                's3Key': s3_key,
                'userId': user_id,
                'bankName': bank_name
            }
        )
        return response.json()
    
    def get_status(self, extraction_id):
        """Get extraction status"""
        response = requests.get(
            f'{self.api_url}/cartola/{extraction_id}',
            headers=self.headers
        )
        return response.json()
    
    def poll_until_complete(self, extraction_id, max_wait=300):
        """Poll until extraction completes"""
        start = time.time()
        while time.time() - start < max_wait:
            result = self.get_status(extraction_id)
            
            if result['status'] == 'completed':
                return result['extractionResult']
            elif result['status'] == 'failed':
                raise Exception(f"Extraction failed: {result['error']}")
            
            time.sleep(5)
        
        raise TimeoutError('Extraction timeout')
    
    def list_extractions(self, user_id, status=None, limit=50):
        """List user's extractions"""
        params = {'userId': user_id, 'limit': limit}
        if status:
            params['status'] = status
        
        response = requests.get(
            f'{self.api_url}/cartola/list',
            headers=self.headers,
            params=params
        )
        return response.json()

# Usage
client = NuboxCartolaClient(
    api_url='https://abc123.execute-api.us-east-1.amazonaws.com/prod',
    api_key='your-api-key'
)

# Extract
extraction = client.extract(
    s3_key='user-123/cartola.pdf',
    user_id='user-123',
    bank_name='Banco de Chile'
)

# Wait for results
result = client.poll_until_complete(extraction['extractionId'])
print(f"Extracted {len(result['movements'])} movements")
```

### **Node.js SDK**

```javascript
class NuboxCartolaClient {
  constructor(apiUrl, apiKey) {
    this.apiUrl = apiUrl;
    this.apiKey = apiKey;
  }
  
  async extract(s3Key, userId, options = {}) {
    const response = await fetch(`${this.apiUrl}/cartola/extract`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey
      },
      body: JSON.stringify({
        s3Key,
        userId,
        ...options
      })
    });
    
    return await response.json();
  }
  
  async getStatus(extractionId) {
    const response = await fetch(`${this.apiUrl}/cartola/${extractionId}`, {
      headers: { 'x-api-key': this.apiKey }
    });
    
    return await response.json();
  }
  
  async pollUntilComplete(extractionId, maxWaitSeconds = 300) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitSeconds * 1000) {
      const result = await this.getStatus(extractionId);
      
      if (result.status === 'completed') {
        return result.extractionResult;
      }
      
      if (result.status === 'failed') {
        throw new Error(`Extraction failed: ${result.error.message}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    throw new Error('Extraction timeout');
  }
  
  async listExtractions(userId, options = {}) {
    const params = new URLSearchParams({ userId, ...options });
    const response = await fetch(`${this.apiUrl}/cartola/list?${params}`, {
      headers: { 'x-api-key': this.apiKey }
    });
    
    return await response.json();
  }
}

// Usage
const client = new NuboxCartolaClient(
  'https://abc123.execute-api.us-east-1.amazonaws.com/prod',
  'your-api-key'
);

const extraction = await client.extract('user-123/cartola.pdf', 'user-123');
const result = await client.pollUntilComplete(extraction.extractionId);
console.log('Movements:', result.movements.length);
```

---

## 📊 Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| API response time | <3s (p95) | CloudWatch Metrics |
| Extraction time (Flash) | <60s (p95) | processingTime field |
| Extraction time (Pro) | <180s (p95) | processingTime field |
| Accuracy | >95% | Manual validation |
| Success rate | >99% | CloudWatch Metrics |
| Availability | >99.9% | AWS Lambda SLA |

---

## 🔍 Monitoring & Debugging

### **CloudWatch Logs**

**View recent logs:**
```bash
aws logs tail /aws/lambda/ProcessCartolaExtraction \
  --since 1h \
  --follow
```

**Search for errors:**
```bash
aws logs filter-log-events \
  --log-group-name /aws/lambda/ProcessCartolaExtraction \
  --filter-pattern "ERROR" \
  --start-time $(date -u -d '24 hours ago' +%s)000
```

**Common log patterns:**
```
🏦 Processing cartola extraction    → Entry point
📥 Downloading PDF                   → S3 download started
📄 PDF size: X MB                    → File size check
🤖 Calling Gemini AI...               → AI extraction started
✅ Extraction completed in Xms       → Success
❌ Extraction error                  → Failure (check stack trace)
```

---

## 📚 Additional Resources

**Code Examples:**
- Full working implementation in `/Users/alec/salfagpt/src/lib/nubox-cartola-extraction.ts`
- Test scripts in `/Users/alec/salfagpt/scripts/test-*.js`

**Related Documentation:**
- `ARCHITECTURE.md` - System architecture diagrams
- `REQUIREMENTS.md` - Functional requirements
- `DEPLOYMENT_GUIDE.md` - Deployment procedures
- `TESTING_GUIDE.md` - Testing strategies
- `README.md` - Quick start guide

**External APIs:**
- Gemini AI: https://ai.google.dev/api
- AWS Lambda: https://docs.aws.amazon.com/lambda/
- DynamoDB: https://docs.aws.amazon.com/dynamodb/

---

**Last Updated:** November 27, 2025  
**API Version:** 1.0.0  
**Status:** Stable  
**Breaking Changes:** None planned for v1.x

