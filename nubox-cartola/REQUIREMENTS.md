# Functional Requirements - Nubox Cartola Extraction
## Complete Specification

**Version:** 1.0.0  
**Last Updated:** November 27, 2025  
**Status:** Approved for Implementation

---

## 📋 Table of Contents

1. [Business Requirements](#business-requirements)
2. [Functional Requirements](#functional-requirements)
3. [Non-Functional Requirements](#non-functional-requirements)
4. [Data Requirements](#data-requirements)
5. [Integration Requirements](#integration-requirements)
6. [Compliance Requirements](#compliance-requirements)

---

## 🎯 Business Requirements

### **BR-1: Automated Bank Statement Processing**

**Objective:** Eliminate manual data entry of bank movements

**Current State:**
- Users manually type each movement from PDF statements
- Average time: 5-10 minutes per statement
- Error rate: 5-10% (typos, misreading)
- Volume: 1,000+ statements/month across Nubox users

**Desired State:**
- Upload PDF → Get structured JSON in <2 minutes
- Accuracy: >95% on all fields
- Zero manual typing required
- Immediate integration with Nubox accounting

**Business Value:**
- **Time savings:** 90% reduction (10 min → 1 min per statement)
- **Error reduction:** 50% reduction (10% → 5% error rate)
- **Cost savings:** $40-50/month infrastructure costs
- **Competitive advantage:** First Chilean accounting software with AI extraction

---

### **BR-2: Multi-Bank Support**

**Objective:** Support all major Chilean banks

**Priority Banks** (80% market share):
1. ✅ Banco de Chile
2. ✅ BancoEstado
3. ✅ Banco Itaú Chile
4. ✅ Scotiabank

**Additional Banks** (20% market share):
5. ✅ MachBank (digital)
6. ✅ TenpoBank (digital)
7. ✅ Generic parser (other banks)

**Acceptance Criteria:**
- Each bank's statement format recognized
- Columns correctly identified (ABONOS vs CARGOS)
- Account holder and RUT extracted
- Opening/closing balances matched

---

### **BR-3: Quality Assurance**

**Objective:** Ensure extraction quality meets accounting standards

**Quality Metrics:**
- **Field accuracy:** >95% on critical fields (amounts, dates, descriptions)
- **Balance validation:** 100% mathematical correctness
- **Movement completeness:** All movements extracted (no omissions)
- **Error detection:** Automatic flagging of low-confidence extractions

**Quality Indicators:**
```json
{
  "quality": {
    "fields_complete": true,
    "movements_complete": true,
    "balance_matches": true,
    "confidence_score": 0.98,
    "recommendation": "✅ Lista para Nubox",
    "average_extraction_proximity_pct": 95
  }
}
```

---

## ⚙️ Functional Requirements

### **FR-1: PDF Upload**

**Description:** Users can upload bank statement PDFs

**Specifications:**
- **Supported formats:** PDF only (v1.0)
- **Maximum size:** 500MB per file
- **Upload methods:**
  - Direct upload via API
  - Pre-signed S3 URL (recommended)
- **Validation:**
  - File type verification
  - File size check
  - PDF integrity check
- **Storage:**
  - S3 bucket with encryption
  - 7-day retention policy
  - Automatic deletion after processing

**Acceptance Criteria:**
- [ ] Can upload valid PDF (<500MB)
- [ ] Rejects non-PDF files with clear error
- [ ] Rejects oversized files with size limit message
- [ ] PDF stored in S3 with encryption
- [ ] Pre-signed URLs expire after upload

---

### **FR-2: Bank Detection**

**Description:** Automatically identify issuing bank

**Specifications:**
- **Detection method:** AI-powered text recognition
- **Confidence threshold:** >80% for automatic detection
- **Fallback:** User can specify bank manually
- **Supported banks:** 7+ (see BR-2)

**Output:**
```json
{
  "bank_name": "Banco de Chile",
  "insights": {
    "banco": "Banco de Chile",
    "extraction_proximity_pct": 95
  }
}
```

**Acceptance Criteria:**
- [ ] Correctly identifies bank name from logo/header
- [ ] Returns null if confidence <80%
- [ ] User override available
- [ ] Bank name normalized (consistent naming)

---

### **FR-3: Movement Extraction**

**Description:** Extract all bank movements from statement

**Specifications:**

**Required Fields (per movement):**
- `id`: Unique identifier (generated)
- `type`: transfer|deposit|withdrawal|payment|fee|other
- `amount`: Number (positive = credit, negative = debit)
- `pending`: Boolean
- `currency`: "CLP" for Chilean pesos
- `post_date`: ISO 8601 timestamp
- `description`: Full transaction description
- `balance`: Account balance after this movement
- `sender_account`: { holder_id, dv, holder_name }

**Optional Fields:**
- `category`: Expense category (future)
- `tags`: User-defined tags (future)

**Column Interpretation Rules:**
1. **ABONOS/CRÉDITOS column** → amount is POSITIVE
2. **CARGOS/DÉBITOS column** → amount is NEGATIVE
3. **SALDO/BALANCE column** → balance field
4. All amounts as numbers (no separators)

**Example:**
```
Statement shows:
| Fecha    | Descripción       | Abonos | Cargos  | Saldo     |
|----------|-------------------|--------|---------|-----------|
| 24/10/24 | Transferencia     | 50,000 |         | 2,310,904 |
| 25/10/24 | Pago servicio     |        | 15,000  | 2,295,904 |

Extracted JSON:
[
  {
    "amount": 50000,      // From ABONOS → positive
    "balance": 2310904,   // From SALDO
    "description": "Transferencia"
  },
  {
    "amount": -15000,     // From CARGOS → negative
    "balance": 2295904,
    "description": "Pago servicio"
  }
]
```

**Acceptance Criteria:**
- [ ] All movements extracted (100% coverage)
- [ ] Amounts signed correctly (credits +, debits -)
- [ ] Dates in ISO 8601 format
- [ ] Descriptions preserved exactly
- [ ] RUTs extracted when present
- [ ] Balance after each movement recorded

---

### **FR-4: Balance Validation**

**Description:** Validate mathematical correctness

**Formula:**
```
saldo_calculado = saldo_inicial + total_abonos - total_cargos
coincide = |saldo_calculado - saldo_final| <= 1
```

**Validation Output:**
```json
{
  "balance_validation": {
    "saldo_inicial": 2260904,
    "total_abonos": 317000,
    "total_cargos": 1554952,
    "saldo_calculado": 1022952,
    "saldo_final_documento": 1022952,
    "coincide": true,
    "diferencia": 0
  }
}
```

**Acceptance Criteria:**
- [ ] Calculates total credits (sum of positive amounts)
- [ ] Calculates total debits (sum of negative amounts)
- [ ] Applies balance equation
- [ ] Allows ±1 tolerance (rounding)
- [ ] Returns boolean `coincide` flag
- [ ] Returns numerical `diferencia` value

**Error Handling:**
- If `coincide = false`:
  - Flag in quality metrics
  - Recommendation: "⚠️ Revisar extracción"
  - Log discrepancy for manual review

---

### **FR-5: Quality Metrics**

**Description:** Per-movement quality assessment

**Insights Object (required for each movement):**
```json
{
  "insights": {
    "errores": [],                         // Array of error strings
    "calidad": "alta",                     // "alta"|"media"|"baja"
    "banco": "Banco de Chile",             // Detected bank
    "extraction_proximity_pct": 95         // Confidence (0-100)
  }
}
```

**Quality Determination:**
- **Alta (95-100%):** All fields complete, high confidence
- **Media (80-94%):** Minor issues, review recommended
- **Baja (<80%):** Significant issues, manual review required

**Acceptance Criteria:**
- [ ] Every movement has `insights` object
- [ ] Quality calculated based on field completeness
- [ ] Proximity percentage reflects AI confidence
- [ ] Errors array populated with specific issues
- [ ] Overall recommendation generated

---

### **FR-6: API Endpoints**

**Description:** RESTful API for integration

#### **POST /cartola/extract**

**Purpose:** Trigger extraction

**Request:**
```json
{
  "s3Key": "user-123/cartola-oct-2024.pdf",
  "userId": "user-123",
  "organizationId": "org-salfa-corp",
  "bankName": "Banco de Chile",
  "model": "gemini-2.5-flash"
}
```

**Response (Immediate):**
```json
{
  "success": true,
  "extractionId": "ext_1700000000000_abc123",
  "status": "processing",
  "estimatedTime": 60
}
```

**Acceptance Criteria:**
- [ ] Returns within 3 seconds (async pattern)
- [ ] Validates required fields (s3Key, userId)
- [ ] Generates unique extractionId
- [ ] Creates DynamoDB record
- [ ] Triggers async Lambda processing

#### **GET /cartola/{id}**

**Purpose:** Get extraction status/results

**Request:**
```
GET /cartola/ext_1700000000000_abc123
```

**Response:**
```json
{
  "id": "ext_1700000000000_abc123",
  "status": "completed",
  "fileName": "cartola-oct-2024.pdf",
  "bankName": "Banco de Chile",
  "extractionResult": {
    "movements": [...],
    "balance_validation": {...}
  },
  "processingTime": 58234,
  "cost": 0.0008,
  "createdAt": 1700000000000,
  "completedAt": 1700000058234
}
```

**Acceptance Criteria:**
- [ ] Returns current status (pending/processing/completed/failed)
- [ ] Returns full result when completed
- [ ] Returns error details when failed
- [ ] Response time <500ms

#### **GET /cartola/list**

**Purpose:** List user's extractions

**Request:**
```
GET /cartola/list?userId=user-123&status=completed&limit=50
```

**Response:**
```json
{
  "items": [
    {
      "id": "ext_xxx",
      "fileName": "cartola-oct.pdf",
      "status": "completed",
      "createdAt": 1700000000000
    }
  ],
  "count": 1,
  "nextToken": null
}
```

**Acceptance Criteria:**
- [ ] Filters by userId
- [ ] Optional status filter
- [ ] Pagination support (limit + nextToken)
- [ ] Ordered by createdAt DESC
- [ ] Response time <1s

---

## 🎯 Non-Functional Requirements

### **NFR-1: Performance**

**Response Times:**
- API endpoint response: <3s (p95)
- PDF download from S3: <5s
- Gemini AI extraction: <60s (Flash), <180s (Pro)
- JSON validation: <1s
- DynamoDB write: <100ms
- Total end-to-end: <120s (p95)

**Throughput:**
- Concurrent executions: 100
- Requests per minute: 100
- Daily volume: 10,000+ extractions

**Availability:**
- Uptime: 99.9% (Lambda SLA)
- Error rate: <1%
- Success rate: >99%

---

### **NFR-2: Scalability**

**Horizontal Scaling:**
- Auto-scaling from 0 to 1,000 concurrent executions
- No manual configuration required
- Instant scale-up (<1 minute)
- Gradual scale-down (idle instances terminated)

**Vertical Scaling:**
- Memory: 512MB to 10GB (configurable)
- CPU: Proportional to memory
- Ephemeral storage: Up to 10GB (if needed)

**Load Testing Targets:**
- 100 req/min sustained
- 500 req/min burst
- 10,000 extractions/day

---

### **NFR-3: Reliability**

**Fault Tolerance:**
- Retry failed Gemini API calls (1 retry)
- AWS SDK auto-retries for S3/DynamoDB
- Graceful degradation (return partial results if needed)
- Error logging for all failures

**Data Durability:**
- S3: 99.999999999% (11 nines)
- DynamoDB: 99.999999999% (11 nines)
- Point-in-time recovery: 35 days

**Monitoring:**
- CloudWatch alarms for errors
- Real-time dashboards
- Automated incident response

---

### **NFR-4: Security**

**Authentication:**
- API Gateway: API keys or Cognito
- Lambda: IAM execution role
- S3: Private bucket, pre-signed URLs only
- DynamoDB: IAM-based access control

**Encryption:**
- At rest: AES-256 (S3), AWS-managed KMS (DynamoDB)
- In transit: TLS 1.2+ (all connections)
- Environment variables: KMS encrypted

**Data Privacy:**
- User data isolation (userId filtering)
- Organization data isolation (organizationId)
- No cross-user data access
- Audit trail for all access

**Compliance:**
- Chilean banking regulations (Ley 19.628)
- GDPR principles (data minimization, user rights)
- SOC 2 Type II readiness (future)

---

### **NFR-5: Maintainability**

**Code Quality:**
- TypeScript or JavaScript with JSDoc
- ESLint + Prettier
- Code coverage >80%
- Clear error messages
- Comprehensive logging

**Documentation:**
- README for quick start
- Architecture diagrams (ASCII)
- API specification (OpenAPI)
- Deployment runbook
- Troubleshooting guide

**Monitoring:**
- Structured logs (JSON)
- Metrics dashboards
- Alarm definitions
- SLA tracking

---

## 📊 Data Requirements

### **DR-1: Input Data**

**PDF Bank Statement:**
- Format: PDF (version 1.4+)
- Size: Up to 500MB
- Pages: 1 to 1,000 pages
- Content: Text-based (OCR not required)
- Language: Spanish (Chilean variant)

**Metadata:**
- userId: Required (owner identifier)
- organizationId: Optional (for multi-tenant)
- bankName: Optional (for optimization)
- model: Optional (default: gemini-2.5-flash)

---

### **DR-2: Output Data**

**Nubox-Compatible JSON:**

**Required Top-Level Fields:**
```json
{
  "document_id": "string (unique)",
  "bank_name": "string",
  "account_number": "string",
  "account_holder": "string",
  "account_holder_rut": "string (format: 12345678-9)",
  "period_start": "ISO 8601 timestamp",
  "period_end": "ISO 8601 timestamp",
  "statement_date": "ISO 8601 timestamp",
  "opening_balance": "number (no separators)",
  "closing_balance": "number (no separators)",
  "total_credits": "number",
  "total_debits": "number",
  "movements": [...],
  "balance_validation": {...},
  "metadata": {...},
  "quality": {...}
}
```

**Required Movement Fields:**
```json
{
  "id": "string (mov_xxx)",
  "type": "enum (transfer|deposit|withdrawal|payment|fee|other)",
  "amount": "number (signed: + credit, - debit)",
  "pending": "boolean",
  "currency": "string (CLP)",
  "post_date": "ISO 8601",
  "description": "string (preserve original text)",
  "balance": "number (saldo after movement)",
  "sender_account": {
    "holder_id": "string (RUT without dots: 12345678k)",
    "dv": "string (digit verifier: k)",
    "holder_name": "string or null"
  },
  "insights": {
    "errores": "array of strings",
    "calidad": "enum (alta|media|baja)",
    "banco": "string",
    "extraction_proximity_pct": "number (0-100)"
  }
}
```

**Schema Validation:**
- All required fields must be present
- Field types must match specification
- Enums must use allowed values only
- Dates must be valid ISO 8601
- Amounts must be valid numbers

---

### **DR-3: Storage Requirements**

**S3 Storage:**
- Original PDFs: 7 days retention
- Average file size: 500KB
- Peak storage: ~1GB per 1,000 PDFs
- Cost: ~$0.03/month per 1,000 files

**DynamoDB Storage:**
- Extraction records: 90 days retention (TTL)
- Average item size: 50KB (with full JSON)
- Peak storage: ~50MB per 1,000 extractions
- Cost: ~$0.01/month per 1,000 records

---

## 🔌 Integration Requirements

### **IR-1: Nubox Frontend Integration**

**Integration Points:**
1. Upload PDF from Nubox web app
2. Display extraction progress
3. Show results in accounting entries
4. Allow manual corrections

**API Flow:**
```javascript
// 1. Upload
const uploaded = await nuboxAPI.uploadCartola(pdfFile);

// 2. Trigger extraction
const extraction = await nuboxAPI.extractCartola({
  s3Key: uploaded.key,
  userId: currentUser.id
});

// 3. Poll for results
const result = await nuboxAPI.pollExtraction(extraction.extractionId);

// 4. Import to accounting
await nuboxAPI.importMovements(result.movements);
```

**Acceptance Criteria:**
- [ ] Can call API from Nubox frontend
- [ ] Handles CORS properly
- [ ] Displays progress to user
- [ ] Imports results automatically
- [ ] Allows manual review before import

---

### **IR-2: Gemini AI Integration**

**API Used:** Google Gemini AI (external)

**Models:**
- **gemini-2.5-flash:** Default, fast, accurate
- **gemini-2.5-pro:** Advanced, slower, higher accuracy

**Request Format:**
```json
{
  "contents": [{
    "parts": [
      { "text": "Extract bank statement..." },
      {
        "inlineData": {
          "mimeType": "application/pdf",
          "data": "base64_encoded_pdf"
        }
      }
    ]
  }],
  "generationConfig": {
    "temperature": 0.1,
    "maxOutputTokens": 4096,
    "responseMimeType": "application/json"
  }
}
```

**Error Handling:**
- Timeout: Retry once after 30s
- Quota exceeded: Return error, log event
- Invalid response: Parse error, manual review

---

### **IR-3: Webhook Integration (Optional)**

**Purpose:** Notify external systems when extraction completes

**Configuration:**
```json
{
  "webhookUrl": "https://your-app.com/webhook/cartola",
  "events": ["extraction.completed", "extraction.failed"],
  "secret": "shared_secret_for_hmac"
}
```

**Webhook Payload:**
```json
{
  "event": "extraction.completed",
  "extractionId": "ext_xxx",
  "userId": "user-123",
  "status": "completed",
  "result": {
    "movements": 10,
    "balanceValidated": true
  },
  "timestamp": "2024-11-27T10:00:00Z",
  "signature": "HMAC-SHA256(...)"
}
```

**Security:**
- HMAC-SHA256 signature verification
- HTTPS only
- Retry on failure (3 attempts)
- Timeout: 30 seconds

---

## 🔒 Compliance Requirements

### **CR-1: Data Privacy (Ley 19.628 - Chile)**

**Requirements:**
- User consent for data processing
- Data retention: 90 days maximum
- User rights: Access, rectify, delete data
- No international data transfer (AWS Chile region recommended)

**Implementation:**
- DynamoDB TTL: 90 days
- S3 lifecycle: 7 days
- User deletion: Cascade delete all records
- Data export: API endpoint for user data

---

### **CR-2: Security Standards**

**Requirements:**
- Encryption at rest (all data)
- Encryption in transit (TLS 1.2+)
- Access control (IAM + API keys)
- Audit logging (CloudWatch + CloudTrail)
- Regular security audits

**Implementation:**
- S3: AES-256
- DynamoDB: KMS encryption
- API Gateway: HTTPS enforced
- CloudWatch: 30-day log retention
- CloudTrail: 90-day event history

---

### **CR-3: Banking Regulations**

**Requirements:**
- No storage of financial data >90 days
- Audit trail for all operations
- User data isolation
- Secure transmission

**Implementation:**
- TTL-based auto-deletion
- CloudWatch comprehensive logging
- userId filtering on all queries
- HTTPS + KMS encryption

---

## 🎯 Acceptance Criteria Summary

### **Minimum Viable Product (MVP)**

**Must Have:**
- ✅ Upload PDF to S3
- ✅ Extract movements with Gemini AI
- ✅ Validate balance equation
- ✅ Return Nubox-compatible JSON
- ✅ Store results in DynamoDB
- ✅ API for triggering and querying
- ✅ Error handling for all failures
- ✅ CloudWatch logging

**Nice to Have (v1.1):**
- 📋 Webhook notifications
- 📋 Batch processing
- 📋 PDF preview generation
- 📋 Manual correction interface
- 📋 Historical analytics

**Future (v2.0):**
- 🔮 Multi-currency support
- 🔮 OCR for scanned PDFs
- 🔮 Automatic categorization
- 🔮 Fraud detection
- 🔮 Export to multiple formats

---

## 📏 Measurement Criteria

### **Success Metrics**

**Functional:**
- Extraction accuracy: >95%
- Balance validation: 100%
- Movement completeness: >99%
- API uptime: >99.9%

**Performance:**
- Processing time: <120s (p95)
- API response: <3s
- Success rate: >99%

**Business:**
- Cost per extraction: <$0.01
- User satisfaction: >4.5/5
- Time savings: >90%
- Error reduction: >50%

**Operational:**
- Deployment frequency: Weekly
- Mean time to recovery: <30 minutes
- Incident rate: <1/month
- Cost variance: <10%

---

## 🔄 Change Management

### **Version Control**

**Semantic Versioning:**
- MAJOR: Breaking API changes
- MINOR: New features, backward compatible
- PATCH: Bug fixes

**Current:** v1.0.0

**Roadmap:**
- v1.1.0: Webhook notifications
- v1.2.0: Batch processing
- v2.0.0: Multi-currency support

### **Backward Compatibility**

**Guaranteed:**
- JSON output format stable
- API endpoints unchanged
- Field names preserved
- Date format consistent

**Migration Path:**
- New fields added as optional
- Deprecated fields marked clearly
- 90-day deprecation notice
- v1 API supported for 1 year

---

## 📚 References

**Business Requirements:**
- Source: Nubox Product Team
- Stakeholder: [Name]
- Approval: [Date]

**Technical Requirements:**
- AWS Lambda Limits: https://docs.aws.amazon.com/lambda/latest/dg/limits.html
- DynamoDB Limits: https://docs.aws.amazon.com/dynamodb/latest/developerguide/Limits.html
- Gemini AI Pricing: https://ai.google.dev/pricing

**Compliance:**
- Ley 19.628: https://www.bcn.cl/leychile/navegar?idNorma=141599
- GDPR Principles: https://gdpr-info.eu/

---

**Last Updated:** November 27, 2025  
**Approved By:** [Stakeholder Name]  
**Next Review:** 2025-12-27  
**Status:** ✅ Approved for Implementation

