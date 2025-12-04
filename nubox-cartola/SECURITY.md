# Security Specification - Nubox Cartola Extraction
## Security, Privacy & Compliance

**Version:** 1.0.0  
**Last Updated:** November 27, 2025  
**Classification:** Confidential  
**Compliance:** Ley 19.628 (Chile), GDPR principles

---

## 🛡️ Security Overview

### **Defense in Depth Architecture**

```
┌────────────────────────────────────────────────────────────┐
│                   SECURITY LAYERS                           │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Layer 1: Network Security                                 │
│  ├─ HTTPS only (TLS 1.2+)                                 │
│  ├─ API Gateway WAF (optional)                            │
│  └─ DDoS protection (AWS Shield)                          │
│                                                            │
│  Layer 2: Authentication                                   │
│  ├─ API Keys (x-api-key header)                           │
│  ├─ OR AWS Cognito (OAuth 2.0)                            │
│  └─ Rate limiting (100 req/s)                             │
│                                                            │
│  Layer 3: Authorization                                    │
│  ├─ IAM Execution Role (Lambda)                           │
│  ├─ Resource policies (S3, DynamoDB)                      │
│  └─ User data isolation (userId filtering)                │
│                                                            │
│  Layer 4: Data Encryption                                  │
│  ├─ At rest: AES-256 (S3), KMS (DynamoDB)                 │
│  ├─ In transit: TLS 1.2+ (all connections)                │
│  └─ Environment vars: KMS encrypted                       │
│                                                            │
│  Layer 5: Audit & Monitoring                               │
│  ├─ CloudWatch Logs (all API calls)                       │
│  ├─ CloudTrail (AWS API calls)                            │
│  ├─ Alarms (security events)                              │
│  └─ Anomaly detection                                     │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

## 🔐 Authentication & Authorization

### **API Key Authentication (Default)**

**Generation:**
```bash
# Create API key
aws apigateway create-api-key \
  --name nubox-production-key \
  --description "Production API key for Nubox frontend" \
  --enabled

# Get key value
aws apigateway get-api-key \
  --api-key [KEY_ID] \
  --include-value \
  --query 'value' \
  --output text
```

**Storage:**
- ❌ NEVER hardcode in frontend code
- ❌ NEVER commit to git
- ✅ Store in environment variables
- ✅ Store in Secrets Manager (AWS)
- ✅ Rotate every 90 days

**Usage:**
```javascript
// ✅ CORRECT: From environment variable
const apiKey = process.env.NUBOX_CARTOLA_API_KEY;

fetch(url, {
  headers: { 'x-api-key': apiKey }
});

// ❌ WRONG: Hardcoded
const apiKey = 'abc123def456';  // DON'T DO THIS
```

**Rotation Procedure:**
1. Create new API key
2. Add to usage plan
3. Update client applications
4. Verify new key works
5. Wait 7 days (grace period)
6. Disable old key
7. Wait 30 days
8. Delete old key

---

### **AWS Cognito Authentication (Advanced)**

**Setup:**

1. **Create User Pool:**
```bash
aws cognito-idp create-user-pool \
  --pool-name nubox-cartola-users \
  --policies '{
    "PasswordPolicy": {
      "MinimumLength": 12,
      "RequireUppercase": true,
      "RequireLowercase": true,
      "RequireNumbers": true,
      "RequireSymbols": true
    }
  }'
```

2. **Configure API Gateway:**
   - Add Cognito authorizer
   - Require JWT token in Authorization header
   - Token validation automatic

**Benefits:**
- ✅ Built-in user management
- ✅ OAuth 2.0 / OpenID Connect
- ✅ MFA support
- ✅ User attributes and groups

---

## 🔒 Data Security

### **Encryption at Rest**

**S3 Buckets:**
```yaml
Encryption: AES-256 (SSE-S3)
Method: Server-side
Key: AWS-managed
Automatic: Yes (all objects)
```

**DynamoDB Tables:**
```yaml
Encryption: AWS-managed KMS key
Method: Transparent encryption
Performance Impact: Minimal (<1% latency)
Cost: No additional cost
```

**Lambda Environment Variables:**
```yaml
Encryption: KMS
Key: AWS-managed Lambda key
Automatic: Yes
Access: IAM role only
```

**Configuration:**

```bash
# S3 encryption (automatic with SSE-S3)
aws s3api put-bucket-encryption \
  --bucket nubox-cartola-uploads-prod \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "AES256"
      }
    }]
  }'

# DynamoDB encryption (enabled by default on new tables)
# Verify:
aws dynamodb describe-table \
  --table-name cartola_extractions_prod \
  --query 'Table.SSEDescription'
```

---

### **Encryption in Transit**

**All Connections Use TLS 1.2+:**

```
Client → API Gateway: HTTPS (TLS 1.3)
  ↓
API Gateway → Lambda: Internal AWS network (encrypted)
  ↓
Lambda → S3: HTTPS (TLS 1.2+)
Lambda → DynamoDB: HTTPS (TLS 1.2+)
Lambda → Gemini AI: HTTPS (TLS 1.2+)
```

**Enforcement:**

```yaml
# API Gateway: HTTPS only (cannot be disabled)
# S3: Deny non-HTTPS requests
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Deny",
    "Principal": "*",
    "Action": "s3:*",
    "Resource": "arn:aws:s3:::nubox-cartola-uploads-prod/*",
    "Condition": {
      "Bool": {"aws:SecureTransport": "false"}
    }
  }]
}
```

---

## 👤 User Data Privacy

### **Data Isolation**

**Principle:** Each user's data completely isolated

**Implementation:**

**S3 Structure:**
```
s3://bucket/
  ├─ user-123/          ← User A's folder
  │  └─ cartola.pdf
  ├─ user-456/          ← User B's folder
  │  └─ statement.pdf
  └─ [No cross-user access]
```

**DynamoDB Filtering:**
```javascript
// ALWAYS filter by userId
const result = await dynamoDB.query({
  TableName: 'cartola_extractions',
  IndexName: 'userId-createdAt-index',
  KeyConditionExpression: 'userId = :userId',
  ExpressionAttributeValues: {
    ':userId': requestUserId  // From authenticated user
  }
}).promise();

// NEVER query all items
// ❌ const all = await dynamoDB.scan(...).promise();
```

**Lambda Validation:**
```javascript
// Verify ownership before returning data
const item = await getExtraction(extractionId);

if (item.userId !== authenticatedUserId) {
  return {
    statusCode: 403,
    body: JSON.stringify({ error: 'Forbidden' })
  };
}
```

---

### **Data Minimization**

**What We Store:**
- ✅ Extraction results (90 days)
- ✅ User metadata (userId, organizationId)
- ✅ Processing metrics (time, cost, tokens)

**What We DON'T Store:**
- ❌ Original PDFs (deleted after 7 days)
- ❌ User passwords (OAuth only)
- ❌ Credit card information (handled by Nubox)
- ❌ Personal identification (only RUT from statements)

---

### **Data Retention**

```
┌────────────────────────────────────────────────────────────┐
│               DATA LIFECYCLE                                │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Original PDFs (S3):                                       │
│  ├─ Upload          → Day 0                               │
│  ├─ Processing      → Day 0-1                             │
│  ├─ Retention       → Day 1-7                             │
│  └─ Auto-delete     → Day 7                               │
│                                                            │
│  Extraction Results (DynamoDB):                            │
│  ├─ Creation        → Day 0                               │
│  ├─ Active use      → Day 0-30                            │
│  ├─ Archive period  → Day 30-90                           │
│  └─ Auto-delete     → Day 90 (TTL)                        │
│                                                            │
│  CloudWatch Logs:                                          │
│  ├─ Creation        → Real-time                           │
│  ├─ Retention       → 30 days                             │
│  └─ Auto-delete     → Day 30                              │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

**Configuration:**

```bash
# S3 lifecycle (7 days)
# See DEPLOYMENT_GUIDE.md

# DynamoDB TTL (90 days)
# Automatic with ttl attribute

# CloudWatch logs (30 days)
aws logs put-retention-policy \
  --log-group-name /aws/lambda/ProcessCartolaExtraction \
  --retention-in-days 30
```

---

## 🔑 Secrets Management

### **Gemini API Key Storage**

**Option 1: Lambda Environment Variables (Simple)**

```bash
# Encrypt with KMS
aws lambda update-function-configuration \
  --function-name ProcessCartolaExtraction \
  --environment "Variables={
    GEMINI_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXX,
    S3_BUCKET=nubox-cartola-uploads-prod,
    DYNAMODB_TABLE=cartola_extractions_prod
  }"

# Automatic KMS encryption by Lambda
```

**Option 2: AWS Secrets Manager (Enterprise)**

```bash
# Create secret
aws secretsmanager create-secret \
  --name nubox/gemini-api-key \
  --description "Gemini AI API key for cartola extraction" \
  --secret-string "AIzaSyXXXXXXXXXXXXXXXXXXXX"

# Grant Lambda access
aws secretsmanager get-secret-value \
  --secret-id nubox/gemini-api-key
```

**In Lambda code:**
```javascript
const AWS = require('aws-sdk');
const secretsManager = new AWS.SecretsManager();

async function getGeminiKey() {
  // Check cache first
  if (global.cachedApiKey) {
    return global.cachedApiKey;
  }
  
  // Fetch from Secrets Manager
  const secret = await secretsManager.getSecretValue({
    SecretId: 'nubox/gemini-api-key'
  }).promise();
  
  global.cachedApiKey = secret.SecretString;
  return global.cachedApiKey;
}

// Use in handler
const apiKey = await getGeminiKey();
```

**Rotation:**
1. Create new API key in Google AI Studio
2. Update secret in Secrets Manager
3. Lambda automatically uses new key (no restart needed)
4. Disable old key after 24h
5. Delete old key after 30 days

---

## 🚨 Security Best Practices

### **Input Validation**

**Validate ALL inputs:**

```javascript
function validateExtractionRequest(body) {
  const errors = [];
  
  // Required fields
  if (!body.s3Key || typeof body.s3Key !== 'string') {
    errors.push('s3Key must be a non-empty string');
  }
  
  if (!body.userId || typeof body.userId !== 'string') {
    errors.push('userId must be a non-empty string');
  }
  
  // Optional fields
  if (body.model && !['gemini-2.5-flash', 'gemini-2.5-pro'].includes(body.model)) {
    errors.push('model must be gemini-2.5-flash or gemini-2.5-pro');
  }
  
  // S3 key format
  if (body.s3Key && !/^[a-zA-Z0-9\-_\/\.]+$/.test(body.s3Key)) {
    errors.push('s3Key contains invalid characters');
  }
  
  // Prevent path traversal
  if (body.s3Key && body.s3Key.includes('..')) {
    errors.push('s3Key cannot contain ..');
  }
  
  return errors.length > 0 ? { valid: false, errors } : { valid: true };
}
```

---

### **Output Sanitization**

**Sanitize data before logging:**

```javascript
function sanitizeForLogging(data) {
  const safe = { ...data };
  
  // Remove sensitive fields
  delete safe.apiKey;
  delete safe.password;
  delete safe.token;
  
  // Truncate long fields
  if (safe.extractedData && safe.extractedData.length > 1000) {
    safe.extractedData = safe.extractedData.substring(0, 1000) + '... [truncated]';
  }
  
  // Hash user identifiers
  if (safe.userId) {
    safe.userId = hashUserId(safe.userId);
  }
  
  return safe;
}

// Use in logging
console.log('Processing:', sanitizeForLogging(requestData));
```

---

### **SQL Injection Prevention**

**DynamoDB uses parameterized queries (safe by default):**

```javascript
// ✅ SAFE: Parameterized query
await dynamoDB.query({
  TableName: 'table',
  KeyConditionExpression: 'userId = :userId',
  ExpressionAttributeValues: {
    ':userId': userInput  // Automatically escaped
  }
}).promise();

// No SQL injection possible with DynamoDB DocumentClient
```

---

### **SSRF Prevention**

**Webhook URL validation:**

```javascript
function validateWebhookUrl(url) {
  try {
    const parsed = new URL(url);
    
    // Only allow HTTPS
    if (parsed.protocol !== 'https:') {
      return { valid: false, error: 'Webhook must use HTTPS' };
    }
    
    // Block internal IPs
    const hostname = parsed.hostname;
    const blockedPatterns = [
      /^localhost$/i,
      /^127\./,
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[01])\./,
      /^192\.168\./,
      /^169\.254\./  // AWS metadata endpoint
    ];
    
    for (const pattern of blockedPatterns) {
      if (pattern.test(hostname)) {
        return { valid: false, error: 'Internal IPs not allowed' };
      }
    }
    
    return { valid: true };
    
  } catch (error) {
    return { valid: false, error: 'Invalid URL format' };
  }
}
```

---

## 🔍 Audit Logging

### **What We Log**

**Every API Call:**
```json
{
  "timestamp": "2024-11-27T10:00:00.123Z",
  "event": "extraction.started",
  "extractionId": "ext_xxx",
  "userId": "hashed_user_id",
  "s3Key": "user-123/cartola.pdf",
  "bankName": "Banco de Chile",
  "model": "gemini-2.5-flash",
  "sourceIP": "203.0.113.1",
  "userAgent": "nubox-frontend/1.0"
}
```

**Security Events:**
```json
{
  "timestamp": "2024-11-27T10:00:00.123Z",
  "event": "authentication.failed",
  "reason": "invalid_api_key",
  "apiKey": "abc***def",  // Partially masked
  "sourceIP": "203.0.113.1",
  "blocked": true
}
```

**Error Events:**
```json
{
  "timestamp": "2024-11-27T10:00:00.123Z",
  "event": "extraction.failed",
  "extractionId": "ext_xxx",
  "userId": "hashed_user_id",
  "error": {
    "code": "GEMINI_API_ERROR",
    "message": "API quota exceeded"
  },
  "stack": "[truncated for security]"
}
```

---

### **Log Retention & Access**

**Retention Policy:**
- CloudWatch Logs: 30 days
- CloudTrail: 90 days
- DynamoDB records: 90 days (auto-deleted via TTL)
- S3 access logs: 90 days

**Access Control:**
- Logs visible to: Admins only
- CloudTrail: Auditors + admins
- Real-time alerts: DevOps team
- Reports: Management (aggregated only)

---

## 🛡️ Compliance

### **Chilean Data Protection (Ley 19.628)**

**Requirements:**
1. ✅ User consent for data processing
2. ✅ Data minimization (only necessary data)
3. ✅ Purpose limitation (only for accounting)
4. ✅ Storage limitation (90 days max)
5. ✅ User rights (access, rectify, delete)

**Implementation:**

**Consent:**
```javascript
// Before first extraction, user must accept terms
const termsAccepted = await checkUserConsent(userId);
if (!termsAccepted) {
  return {
    statusCode: 403,
    body: JSON.stringify({
      error: 'Terms not accepted',
      message: 'Please accept terms of service'
    })
  };
}
```

**User Rights API Endpoints:**

```javascript
// Get all user data
GET /user/{userId}/data
→ Returns all extractions for user

// Delete all user data
DELETE /user/{userId}/data
→ Deletes all extractions, PDFs, and metadata
```

---

### **GDPR Compliance (If applicable)**

**Principles Applied:**
1. ✅ Lawfulness, fairness, transparency
2. ✅ Purpose limitation
3. ✅ Data minimization
4. ✅ Accuracy
5. ✅ Storage limitation (90 days)
6. ✅ Integrity and confidentiality
7. ✅ Accountability

**User Rights:**
- Right to access: GET /user/{userId}/data
- Right to rectification: UPDATE endpoints
- Right to erasure: DELETE /user/{userId}/data
- Right to restriction: Pause processing (future)
- Right to data portability: Export as JSON
- Right to object: Opt-out options (future)

---

## 🚨 Incident Response

### **Security Incident Procedure**

```
1. DETECTION
   ├─ CloudWatch alarm triggered
   ├─ Unusual activity detected
   └─ User reports suspicious activity

2. ASSESSMENT
   ├─ Check CloudWatch logs
   ├─ Check CloudTrail events
   ├─ Determine scope and impact
   └─ Classify severity (Critical/High/Medium/Low)

3. CONTAINMENT
   ├─ Disable compromised API keys
   ├─ Block malicious IPs (WAF)
   ├─ Isolate affected resources
   └─ Prevent further damage

4. ERADICATION
   ├─ Remove malicious access
   ├─ Patch vulnerabilities
   ├─ Rotate all credentials
   └─ Update security rules

5. RECOVERY
   ├─ Restore from backups if needed
   ├─ Re-enable services
   ├─ Verify normal operation
   └─ Monitor closely (24-48h)

6. LESSONS LEARNED
   ├─ Document incident
   ├─ Update runbooks
   ├─ Improve monitoring
   └─ Train team
```

---

### **Common Security Incidents**

**Incident 1: API Key Leak**

**Detection:**
- API key found in GitHub repository
- Unusual traffic spike
- CloudWatch alarm: High request rate

**Response:**
```bash
# 1. Immediately disable key
aws apigateway update-api-key \
  --api-key [KEY_ID] \
  --patch-operations op=replace,path=/enabled,value=false

# 2. Review CloudWatch logs for unauthorized usage
aws logs filter-log-events \
  --log-group-name /aws/lambda/ProcessCartolaExtraction \
  --start-time [incident_start] \
  --filter-pattern "apiKey: [leaked_key]"

# 3. Create new key
aws apigateway create-api-key --name nubox-new-key

# 4. Update client applications
# 5. Delete old key after 24h
```

---

**Incident 2: Unusual Extraction Volume**

**Detection:**
- CloudWatch alarm: >1,000 extractions in 1 hour
- Cost spike alert

**Response:**
```bash
# 1. Check if legitimate traffic
aws dynamodb query \
  --table-name cartola_extractions_prod \
  --index-name status-createdAt-index \
  --key-condition-expression "status = :status" \
  --expression-attribute-values '{":status":{"S":"completed"}}' \
  --scan-index-forward false \
  --limit 100

# 2. If attack, enable WAF rate limiting
# 3. Block malicious IPs
# 4. Contact affected users
```

---

**Incident 3: Data Exposure**

**Detection:**
- S3 bucket accidentally made public
- Unauthorized access attempt

**Response:**
```bash
# 1. Immediately block public access
aws s3api put-public-access-block \
  --bucket nubox-cartola-uploads-prod \
  --public-access-block-configuration \
    "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"

# 2. Review bucket policy
aws s3api get-bucket-policy --bucket nubox-cartola-uploads-prod

# 3. Check access logs
aws s3api get-bucket-logging --bucket nubox-cartola-uploads-prod

# 4. Rotate all credentials
# 5. Notify affected users (if data accessed)
```

---

## 🔒 Penetration Testing

### **Security Testing Checklist**

**Authentication Tests:**
- [ ] Try API without x-api-key header → 401
- [ ] Try with invalid API key → 403
- [ ] Try with expired API key → 403
- [ ] Try to reuse API key after rotation → 403

**Authorization Tests:**
- [ ] Try to access another user's extraction → 403
- [ ] Try to list another user's extractions → 403
- [ ] Try to access with revoked permissions → 403

**Input Validation Tests:**
- [ ] Try SQL injection in userId → Sanitized
- [ ] Try XSS in description fields → Sanitized
- [ ] Try path traversal in s3Key (../) → Blocked
- [ ] Try oversized payload (>6MB) → 413
- [ ] Try invalid JSON → 400

**Network Security Tests:**
- [ ] Try HTTP instead of HTTPS → Redirect to HTTPS
- [ ] Try TLS 1.0 → Rejected
- [ ] Try weak cipher suite → Rejected

**Data Privacy Tests:**
- [ ] Verify user A cannot see user B's data
- [ ] Verify deleted data is truly deleted
- [ ] Verify logs don't contain sensitive data
- [ ] Verify encryption at rest

---

## 📊 Security Metrics

### **Track These Metrics**

```
Authentication:
├─ Failed auth attempts: <1%
├─ API key rotation compliance: 100%
└─ MFA adoption: >80% (if using Cognito)

Authorization:
├─ Unauthorized access attempts: <0.1%
├─ Permission escalation attempts: 0
└─ Cross-user access attempts: 0

Data Security:
├─ Encryption coverage: 100%
├─ Data retention compliance: 100%
├─ Secure deletion compliance: 100%
└─ PII exposure incidents: 0

Vulnerabilities:
├─ Critical vulnerabilities: 0
├─ High vulnerabilities: 0
├─ Medium vulnerabilities: <3
└─ Patch compliance: >95% (within 30 days)
```

---

## 🔐 Security Hardening Checklist

### **Lambda Function**

- [ ] Execution role has least privilege permissions
- [ ] No wildcard (*) permissions
- [ ] Environment variables encrypted (KMS)
- [ ] VPC configuration (if needed for private resources)
- [ ] Reserved concurrency to prevent runaway costs
- [ ] Dead letter queue (DLQ) for failed invocations

### **S3 Bucket**

- [ ] Block all public access enabled
- [ ] Bucket encryption enabled (AES-256)
- [ ] Versioning disabled (not needed for this use case)
- [ ] Lifecycle policy configured (7-day deletion)
- [ ] Access logging enabled
- [ ] Object lock disabled (not needed)
- [ ] Bucket policy restricts to Lambda role only

### **DynamoDB Table**

- [ ] Encryption enabled (AWS-managed KMS)
- [ ] Point-in-time recovery enabled
- [ ] On-demand billing (prevent surprise costs)
- [ ] TTL enabled (90-day auto-deletion)
- [ ] Fine-grained access control (item-level permissions)
- [ ] Backup plan configured (if compliance requires)

### **API Gateway**

- [ ] HTTPS only (HTTP disabled)
- [ ] API key required on all methods
- [ ] CORS configured properly
- [ ] Rate limiting enabled (100 req/s)
- [ ] Request validation enabled
- [ ] CloudWatch logs enabled
- [ ] WAF enabled (for DDoS protection)

---

## 🔍 Security Auditing

### **Weekly Security Audit**

```bash
#!/bin/bash
# weekly-security-audit.sh

echo "🔍 Weekly Security Audit"
echo "======================="

# 1. Check for public S3 buckets
echo "1️⃣ Checking S3 bucket permissions..."
aws s3api get-public-access-block \
  --bucket nubox-cartola-uploads-prod \
  | jq '.PublicAccessBlockConfiguration'
# All should be true

# 2. Review IAM roles
echo "2️⃣ Checking IAM role permissions..."
aws iam get-role-policy \
  --role-name NuboxCartolaLambdaRole \
  --policy-name NuboxCartolaAccess \
  | jq '.PolicyDocument'
# Verify no wildcard permissions

# 3. Check for failed auth attempts
echo "3️⃣ Checking failed authentication..."
aws logs filter-log-events \
  --log-group-name /aws/lambda/ProcessCartolaExtraction \
  --filter-pattern "Unauthorized" \
  --start-time $(date -u -d '7 days ago' +%s)000 \
  --query 'events[*].[timestamp, message]' \
  --output table

# 4. Verify encryption
echo "4️⃣ Verifying encryption..."
aws s3api get-bucket-encryption \
  --bucket nubox-cartola-uploads-prod \
  | jq '.ServerSideEncryptionConfiguration'

# 5. Check API keys
echo "5️⃣ Listing API keys..."
aws apigateway get-api-keys \
  --include-values false \
  --query 'items[*].[id,name,enabled,createdDate]' \
  --output table

# 6. Review CloudTrail events
echo "6️⃣ Checking CloudTrail for suspicious activity..."
aws cloudtrail lookup-events \
  --lookup-attributes AttributeKey=EventName,AttributeValue=DeleteBucket \
  --max-results 10

echo ""
echo "✅ Security audit complete"
echo "Review results above for anomalies"
```

---

## 📋 Compliance Checklist

### **Ley 19.628 (Chilean Data Protection)**

- [ ] **Art. 4:** User consent obtained before processing
- [ ] **Art. 10:** Data used only for stated purpose (accounting)
- [ ] **Art. 12:** User can access their data (GET /user/{id}/data)
- [ ] **Art. 13:** User can rectify their data (UPDATE endpoints)
- [ ] **Art. 14:** User can delete their data (DELETE endpoints)
- [ ] **Art. 16:** Data security measures implemented (encryption)
- [ ] **Art. 17:** Data retention limited (90 days max)

### **GDPR Principles (If applicable)**

- [ ] **Lawfulness:** Legal basis for processing (user contract)
- [ ] **Fairness:** Transparent processing (privacy policy)
- [ ] **Transparency:** Clear communication to users
- [ ] **Purpose Limitation:** Used only for extraction
- [ ] **Data Minimization:** Only necessary data collected
- [ ] **Accuracy:** Validation mechanisms in place
- [ ] **Storage Limitation:** 90-day automatic deletion
- [ ] **Integrity:** Encryption + access controls
- [ ] **Confidentiality:** No unauthorized access
- [ ] **Accountability:** Audit logs maintained

---

## 🚦 Security Testing Schedule

```
┌────────────────────────────────────────────────────────────┐
│                SECURITY TESTING SCHEDULE                    │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Daily:                                                    │
│  ├─ Automated vulnerability scanning                      │
│  ├─ Dependency updates check                              │
│  └─ Failed auth monitoring                                │
│                                                            │
│  Weekly:                                                   │
│  ├─ Security audit script                                 │
│  ├─ API key rotation check                                │
│  ├─ Permission review                                     │
│  └─ Incident log review                                   │
│                                                            │
│  Monthly:                                                  │
│  ├─ Penetration testing                                   │
│  ├─ Compliance audit                                      │
│  ├─ Security training                                     │
│  └─ Disaster recovery drill                               │
│                                                            │
│  Quarterly:                                                │
│  ├─ External security audit                               │
│  ├─ Threat modeling update                                │
│  ├─ Business continuity test                              │
│  └─ Compliance certification review                       │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

## 🔧 Security Tools

### **Recommended Tools**

**Dependency Scanning:**
```bash
# Install npm audit
npm audit

# Fix vulnerabilities
npm audit fix

# Check for outdated packages
npm outdated
```

**Static Analysis:**
```bash
# Install ESLint security plugin
npm install --save-dev eslint-plugin-security

# Run security lint
npx eslint . --ext .js --plugin security
```

**Secrets Detection:**
```bash
# Install git-secrets
brew install git-secrets  # macOS
# or from: https://github.com/awslabs/git-secrets

# Initialize in repo
git secrets --install
git secrets --register-aws

# Scan for secrets
git secrets --scan
```

---

## 🎯 Security Success Criteria

**Deployment is secure when:**

1. ✅ All data encrypted (at rest and in transit)
2. ✅ Authentication required on all endpoints
3. ✅ User data isolation verified
4. ✅ No public S3 access
5. ✅ IAM roles follow least privilege
6. ✅ API keys rotated quarterly
7. ✅ Audit logs retained 30 days
8. ✅ Incident response plan documented
9. ✅ Compliance checklist 100% complete
10. ✅ No critical vulnerabilities
11. ✅ Penetration testing passed
12. ✅ Security training completed

---

## 📞 Security Contacts

**Report Security Issues:**
- Email: security@nubox.com
- Severity: Critical (4h), High (24h), Medium (7d)
- PGP Key: [If applicable]

**Incident Response Team:**
- On-call: [Phone number]
- Escalation: [Manager contact]
- AWS Support: [Account number]

---

**Last Updated:** November 27, 2025  
**Next Security Audit:** 2025-12-27  
**Compliance Status:** ✅ Ley 19.628 compliant  
**Classification:** Confidential - Internal Use Only

