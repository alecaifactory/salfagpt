# Deployment Guide - Nubox Cartola Extraction
## AWS Lambda Step-by-Step Setup

**Version:** 1.0.0  
**Estimated Time:** 2-4 hours  
**Skill Level:** Intermediate AWS + Node.js  
**Last Updated:** November 27, 2025

---

## 📋 Pre-Flight Checklist

Before starting, ensure you have:

```bash
✅ AWS Account with admin access
✅ AWS CLI installed (v2.x)
✅ Node.js 20+ installed
✅ Gemini API key from Google AI Studio
✅ Git installed
✅ Text editor (VS Code recommended)
✅ Terminal/Command Line access
```

**Verify Prerequisites:**
```bash
# Check all tools
node --version        # Should show v20.x.x
aws --version         # Should show aws-cli/2.x
git --version         # Should show git version 2.x
npm --version         # Should show 10.x.x

# Configure AWS
aws configure
# Enter: Access Key, Secret Key, Region (us-east-1), Format (json)

# Verify AWS access
aws sts get-caller-identity
# Should show your account ID

# Set Gemini API key
export GEMINI_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

---

## 🚀 Deployment Method 1: Serverless Framework (Recommended)

**Fastest path to production (2 hours)**

### **Step 1: Install Serverless Framework (5 min)**

```bash
# Install globally
npm install -g serverless

# Verify installation
serverless --version
# Should show: Framework Core: 3.x

# Login (optional - for dashboard)
serverless login
```

---

### **Step 2: Create Project Structure (10 min)**

```bash
# Create project directory
mkdir nubox-cartola-lambda
cd nubox-cartola-lambda

# Initialize npm
npm init -y

# Install dependencies
npm install @google/genai aws-sdk

# Install dev dependencies
npm install --save-dev serverless serverless-offline jest

# Create folders
mkdir -p lambda/lib lambda/handlers test-docs docs

# Create .gitignore
cat > .gitignore << 'EOF'
node_modules/
.env
.serverless/
*.log
test-docs/*.pdf
.DS_Store
EOF
```

---

### **Step 3: Create serverless.yml (15 min)**

```bash
cat > serverless.yml << 'EOF'
service: nubox-cartola-extraction

provider:
  name: aws
  runtime: nodejs20.x
  region: us-east-1
  stage: ${opt:stage, 'dev'}
  memorySize: 2048
  timeout: 900
  
  environment:
    GEMINI_API_KEY: ${env:GEMINI_API_KEY}
    S3_BUCKET: ${self:custom.s3Bucket}
    DYNAMODB_TABLE: ${self:custom.dynamoTable}
    NODE_ENV: production
  
  iam:
    role:
      statements:
        - Effect: Allow
          Action:
            - s3:GetObject
            - s3:PutObject
            - s3:DeleteObject
          Resource: "arn:aws:s3:::${self:custom.s3Bucket}/*"
        
        - Effect: Allow
          Action:
            - dynamodb:PutItem
            - dynamodb:GetItem
            - dynamodb:UpdateItem
            - dynamodb:Query
            - dynamodb:Scan
          Resource:
            - "arn:aws:dynamodb:${self:provider.region}:*:table/${self:custom.dynamoTable}"
            - "arn:aws:dynamodb:${self:provider.region}:*:table/${self:custom.dynamoTable}/index/*"

custom:
  s3Bucket: nubox-cartola-uploads-${self:provider.stage}
  dynamoTable: cartola_extractions_${self:provider.stage}

functions:
  processCartola:
    handler: lambda/handler.processCartola
    description: Extract bank statement data using Gemini AI
    events:
      - http:
          path: cartola/extract
          method: post
          cors: true
    timeout: 900
    memorySize: 2048
  
  getStatus:
    handler: lambda/handlers/get-status.handler
    description: Get extraction status by ID
    events:
      - http:
          path: cartola/{id}
          method: get
          cors: true
    timeout: 30
    memorySize: 512
  
  listCartolas:
    handler: lambda/handlers/list.handler
    description: List user's extractions
    events:
      - http:
          path: cartola/list
          method: get
          cors: true
    timeout: 30
    memorySize: 512

resources:
  Resources:
    CartolaUploadsBucket:
      Type: AWS::S3::Bucket
      Properties:
        BucketName: ${self:custom.s3Bucket}
        PublicAccessBlockConfiguration:
          BlockPublicAcls: true
          BlockPublicPolicy: true
          IgnorePublicAcls: true
          RestrictPublicBuckets: true
        BucketEncryption:
          ServerSideEncryptionConfiguration:
            - ServerSideEncryptionByDefault:
                SSEAlgorithm: AES256
        LifecycleConfiguration:
          Rules:
            - Id: DeleteAfter7Days
              Status: Enabled
              ExpirationInDays: 7
    
    CartolaExtractionsTable:
      Type: AWS::DynamoDB::Table
      Properties:
        TableName: ${self:custom.dynamoTable}
        BillingMode: PAY_PER_REQUEST
        AttributeDefinitions:
          - AttributeName: id
            AttributeType: S
          - AttributeName: userId
            AttributeType: S
          - AttributeName: createdAt
            AttributeType: N
          - AttributeName: organizationId
            AttributeType: S
          - AttributeName: status
            AttributeType: S
        KeySchema:
          - AttributeName: id
            KeyType: HASH
        GlobalSecondaryIndexes:
          - IndexName: userId-createdAt-index
            KeySchema:
              - AttributeName: userId
                KeyType: HASH
              - AttributeName: createdAt
                KeyType: RANGE
            Projection:
              ProjectionType: ALL
          - IndexName: organizationId-createdAt-index
            KeySchema:
              - AttributeName: organizationId
                KeyType: HASH
              - AttributeName: createdAt
                KeyType: RANGE
            Projection:
              ProjectionType: ALL
          - IndexName: status-createdAt-index
            KeySchema:
              - AttributeName: status
                KeyType: HASH
              - AttributeName: createdAt
                KeyType: RANGE
            Projection:
              ProjectionType: ALL
        TimeToLiveSpecification:
          Enabled: true
          AttributeName: ttl
        PointInTimeRecoverySpecification:
          PointInTimeRecoveryEnabled: true

plugins:
  - serverless-offline
EOF
```

---

### **Step 4: Copy Extraction Code (20 min)**

**From your existing GCP implementation:**

```bash
# Copy the core extraction library
# This is the most important file - it contains all the working logic

# Option A: Copy from salfagpt project
cp ../salfagpt/src/lib/nubox-cartola-extraction.ts lambda/lib/extractor.js

# Option B: Download from repository
# [Provide download link or git command]

# The file should contain:
# - extractNuboxCartola() function
# - buildExtractionPrompt() function
# - parseAndValidateJSON() function
# - calculateCost() function
```

**If using TypeScript, either:**

**Option 1: Convert to JavaScript**
```bash
# Install TypeScript
npm install --save-dev typescript @types/node

# Add tsconfig.json
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "outDir": "./dist",
    "rootDir": "./lambda",
    "strict": true,
    "esModuleInterop": true
  }
}
EOF

# Update serverless.yml
# Change handler: lambda/handler.js → dist/handler.js

# Add build script to package.json
# "scripts": { "build": "tsc" }
```

**Option 2: Use JavaScript directly**
- Keep as .js files
- Add JSDoc comments for typing
- Simpler for AWS Lambda

---

### **Step 5: Create Lambda Handlers (30 min)**

**Main handler - `lambda/handler.js`:**

```bash
cat > lambda/handler.js << 'EOF'
const { extractNuboxCartola } = require('./lib/extractor');
const AWS = require('aws-sdk');

const s3 = new AWS.S3();
const dynamoDB = new AWS.DynamoDB.DocumentClient();

/**
 * Process bank statement extraction
 */
exports.processCartola = async (event) => {
  console.log('🏦 Processing cartola extraction');
  const startTime = Date.now();
  
  try {
    // Parse request
    const body = JSON.parse(event.body || '{}');
    const { s3Key, userId, organizationId, bankName, model } = body;
    
    // Validate
    if (!s3Key || !userId) {
      return {
        statusCode: 400,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ 
          error: 'Missing required fields: s3Key, userId' 
        })
      };
    }
    
    // Generate extraction ID
    const extractionId = `ext_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log(`📝 Extraction ID: ${extractionId}`);
    
    // Create DynamoDB record
    const now = Date.now();
    await dynamoDB.put({
      TableName: process.env.DYNAMODB_TABLE,
      Item: {
        id: extractionId,
        userId,
        organizationId: organizationId || null,
        status: 'processing',
        fileName: s3Key.split('/').pop(),
        s3Key,
        bankName: bankName || null,
        model: model || 'gemini-2.5-flash',
        createdAt: now,
        updatedAt: now,
        ttl: Math.floor(now / 1000) + (90 * 24 * 60 * 60)
      }
    }).promise();
    
    console.log('✅ DynamoDB record created');
    
    // Download PDF
    console.log(`📥 Downloading PDF: ${s3Key}`);
    const s3Result = await s3.getObject({
      Bucket: process.env.S3_BUCKET,
      Key: s3Key
    }).promise();
    
    const pdfBuffer = s3Result.Body;
    console.log(`📄 PDF size: ${(pdfBuffer.length / 1024 / 1024).toFixed(2)} MB`);
    
    // Extract with Gemini AI
    console.log('🤖 Calling Gemini AI...');
    const extractionResult = await extractNuboxCartola(pdfBuffer, {
      fileName: s3Key.split('/').pop(),
      bank: bankName,
      currency: 'CLP',
      model: model || 'gemini-2.5-flash'
    });
    
    const processingTime = Date.now() - startTime;
    console.log(`✅ Extraction completed in ${processingTime}ms`);
    
    // Update DynamoDB with results
    await dynamoDB.update({
      TableName: process.env.DYNAMODB_TABLE,
      Key: { id: extractionId },
      UpdateExpression: 'SET #status = :status, extractionResult = :result, completedAt = :completed, processingTime = :time, updatedAt = :updated',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: {
        ':status': 'completed',
        ':result': extractionResult,
        ':completed': Date.now(),
        ':time': processingTime,
        ':updated': Date.now()
      }
    }).promise();
    
    console.log('💾 Results saved to DynamoDB');
    
    // Return success
    return {
      statusCode: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        extractionId,
        result: extractionResult,
        processingTime,
        metadata: {
          movementsCount: extractionResult.movements?.length || 0,
          balanceValidated: extractionResult.balance_validation?.coincide || false,
          recommendation: extractionResult.quality?.recommendation || ''
        }
      })
    };
    
  } catch (error) {
    console.error('❌ Extraction error:', error);
    
    // Update DynamoDB with error
    try {
      await dynamoDB.update({
        TableName: process.env.DYNAMODB_TABLE,
        Key: { id: extractionId },
        UpdateExpression: 'SET #status = :status, #error = :error, updatedAt = :updated',
        ExpressionAttributeNames: {
          '#status': 'status',
          '#error': 'error'
        },
        ExpressionAttributeValues: {
          ':status': 'failed',
          ':error': {
            message: error.message,
            stack: error.stack
          },
          ':updated': Date.now()
        }
      }).promise();
    } catch (dbError) {
      console.error('Failed to update error status:', dbError);
    }
    
    return {
      statusCode: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        error: error.message,
        details: error.stack
      })
    };
  }
};
EOF
```

**Get status handler - `lambda/handlers/get-status.js`:**

```bash
cat > lambda/handlers/get-status.js << 'EOF'
const AWS = require('aws-sdk');
const dynamoDB = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
  try {
    const { id } = event.pathParameters;
    
    if (!id) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Missing extraction ID' })
      };
    }
    
    const result = await dynamoDB.get({
      TableName: process.env.DYNAMODB_TABLE,
      Key: { id }
    }).promise();
    
    if (!result.Item) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Extraction not found' })
      };
    }
    
    return {
      statusCode: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(result.Item)
    };
    
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message })
    };
  }
};
EOF
```

**List handler - `lambda/handlers/list.js`:**

```bash
cat > lambda/handlers/list.js << 'EOF'
const AWS = require('aws-sdk');
const dynamoDB = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
  try {
    const { userId, status, limit } = event.queryStringParameters || {};
    
    if (!userId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Missing userId parameter' })
      };
    }
    
    const params = {
      TableName: process.env.DYNAMODB_TABLE,
      IndexName: 'userId-createdAt-index',
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      },
      ScanIndexForward: false,
      Limit: parseInt(limit) || 50
    };
    
    // Add status filter if provided
    if (status) {
      params.FilterExpression = '#status = :status';
      params.ExpressionAttributeNames = { '#status': 'status' };
      params.ExpressionAttributeValues[':status'] = status;
    }
    
    const result = await dynamoDB.query(params).promise();
    
    return {
      statusCode: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        items: result.Items,
        count: result.Count,
        nextToken: result.LastEvaluatedKey || null
      })
    };
    
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message })
    };
  }
};
EOF
```

---

### **Step 6: Deploy to AWS (10 min)**

```bash
# Set Gemini API key in environment
export GEMINI_API_KEY=your-actual-key-here

# Deploy to dev environment first
serverless deploy --stage dev

# Expected output:
# ✅ Service deployed
# 
# endpoints:
#   POST - https://abc123.execute-api.us-east-1.amazonaws.com/dev/cartola/extract
#   GET - https://abc123.execute-api.us-east-1.amazonaws.com/dev/cartola/{id}
#   GET - https://abc123.execute-api.us-east-1.amazonaws.com/dev/cartola/list
#
# functions:
#   processCartola
#   getStatus
#   listCartolas

# Save your API URL
API_URL="https://abc123.execute-api.us-east-1.amazonaws.com/dev"
echo "export CARTOLA_API_URL=$API_URL" >> ~/.zshrc
```

**Deployment creates:**
- ✅ S3 bucket: `nubox-cartola-uploads-dev`
- ✅ DynamoDB table: `cartola_extractions_dev`
- ✅ 3 Lambda functions
- ✅ API Gateway with 3 endpoints
- ✅ IAM execution role with permissions
- ✅ CloudWatch log groups

---

### **Step 7: Test Deployment (20 min)**

```bash
# Upload test PDF to S3
aws s3 cp test-docs/banco-chile-oct-2024.pdf \
  s3://nubox-cartola-uploads-dev/test-user/test.pdf

# Trigger extraction
curl -X POST $API_URL/cartola/extract \
  -H "Content-Type: application/json" \
  -d '{
    "s3Key": "test-user/test.pdf",
    "userId": "test-user",
    "bankName": "Banco de Chile",
    "model": "gemini-2.5-flash"
  }'

# Response will include extractionId
# Save it for next step

# Check status (replace with your extractionId)
EXTRACTION_ID="ext_1700000000000_abc123"
curl "$API_URL/cartola/$EXTRACTION_ID"

# Poll every 10 seconds until status = "completed"
while true; do
  STATUS=$(curl -s "$API_URL/cartola/$EXTRACTION_ID" | jq -r '.status')
  echo "Status: $STATUS"
  if [ "$STATUS" = "completed" ] || [ "$STATUS" = "failed" ]; then
    break
  fi
  sleep 10
done

# Get full results
curl "$API_URL/cartola/$EXTRACTION_ID" | jq '.'

# Verify results:
# ✅ status = "completed"
# ✅ movements array populated
# ✅ balance_validation.coincide = true
# ✅ quality.recommendation = "✅ Lista para Nubox"
```

---

### **Step 8: Deploy to Production (10 min)**

```bash
# Once dev testing passes, deploy to production
serverless deploy --stage prod

# Update environment variable reference
API_URL="https://xyz789.execute-api.us-east-1.amazonaws.com/prod"

# Run production smoke test
# (Same test as dev, but with prod URL)

# Monitor CloudWatch for first 24 hours
serverless logs -f processCartola --tail --stage prod
```

---

## 🛠️ Deployment Method 2: AWS Console (Manual)

**For those who prefer GUI over CLI (4 hours)**

### **Step 1: Create S3 Bucket (10 min)**

1. Open AWS Console → S3
2. Click **"Create bucket"**
3. **Bucket name:** `nubox-cartola-uploads-prod`
4. **Region:** us-east-1 (or your region)
5. **Object Ownership:** ACLs disabled
6. **Block Public Access:** ✅ Enable all
7. **Bucket Versioning:** Disabled
8. **Encryption:** Amazon S3-managed keys (SSE-S3)
9. **Advanced Settings:**
   - Object Lock: Disabled
10. Click **"Create bucket"**

**After creation, add lifecycle rule:**
1. Select bucket → **Management** tab
2. Click **"Create lifecycle rule"**
3. **Rule name:** `delete-after-7-days`
4. **Rule scope:** Apply to all objects
5. **Lifecycle rule actions:** ✅ Expire current versions
6. **Days after object creation:** 7
7. Click **"Create rule"**

---

### **Step 2: Create DynamoDB Table (15 min)**

1. Open AWS Console → DynamoDB
2. Click **"Create table"**
3. **Table name:** `cartola_extractions_prod`
4. **Partition key:** `id` (String)
5. **Sort key:** None
6. **Table settings:** Customize settings
7. **Read/write capacity:** On-demand
8. **Encryption:** AWS owned key
9. Click **"Create table"**

**After table is created (2-3 minutes):**

**Add Global Secondary Index 1:**
1. Select table → **Indexes** tab
2. Click **"Create index"**
3. **Partition key:** `userId` (String)
4. **Sort key:** `createdAt` (Number)
5. **Index name:** `userId-createdAt-index`
6. **Projected attributes:** All
7. Click **"Create index"**

**Add Global Secondary Index 2:**
1. Click **"Create index"**
2. **Partition key:** `organizationId` (String)
3. **Sort key:** `createdAt` (Number)
4. **Index name:** `organizationId-createdAt-index`
5. **Projected attributes:** All
6. Click **"Create index"**

**Add Global Secondary Index 3:**
1. Click **"Create index"**
2. **Partition key:** `status` (String)
3. **Sort key:** `createdAt` (Number)
4. **Index name:** `status-createdAt-index`
5. **Projected attributes:** All
6. Click **"Create index"**

**Enable Time to Live (TTL):**
1. Select table → **Additional settings** tab
2. Scroll to **Time to Live (TTL)**
3. Click **"Enable"**
4. **TTL attribute:** `ttl`
5. Click **"Enable TTL"**

**Enable Point-in-Time Recovery:**
1. **Backups** tab
2. Click **"Edit"**
3. ✅ Enable point-in-time recovery
4. Click **"Save changes"**

---

### **Step 3: Create IAM Execution Role (10 min)**

1. Open AWS Console → IAM
2. Click **"Roles"** → **"Create role"**
3. **Trusted entity:** AWS service
4. **Use case:** Lambda
5. Click **"Next"**
6. **Permissions:** (We'll add custom policy)
7. **Role name:** `NuboxCartolaLambdaRole`
8. Click **"Create role"**

**Add inline policy:**
1. Select role → **Permissions** tab
2. Click **"Add permissions"** → **"Create inline policy"**
3. Switch to **JSON** editor:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject"
      ],
      "Resource": "arn:aws:s3:::nubox-cartola-uploads-prod/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:PutItem",
        "dynamodb:GetItem",
        "dynamodb:UpdateItem",
        "dynamodb:Query"
      ],
      "Resource": [
        "arn:aws:dynamodb:us-east-1:*:table/cartola_extractions_prod",
        "arn:aws:dynamodb:us-east-1:*:table/cartola_extractions_prod/index/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:*"
    }
  ]
}
```

4. **Policy name:** `NuboxCartolaAccess`
5. Click **"Create policy"**

---

### **Step 4: Create Lambda Function (15 min)**

1. Open AWS Console → Lambda
2. Click **"Create function"**
3. **Function name:** `ProcessCartolaExtraction`
4. **Runtime:** Node.js 20.x
5. **Architecture:** x86_64
6. **Permissions:** Use existing role → `NuboxCartolaLambdaRole`
7. Click **"Create function"**

**Configure function:**

1. **General configuration:**
   - **Memory:** 2048 MB
   - **Timeout:** 15 min 0 sec (900 seconds)
   - **Ephemeral storage:** 512 MB

2. **Environment variables:**
   - `GEMINI_API_KEY`: Your actual Gemini API key
   - `S3_BUCKET`: `nubox-cartola-uploads-prod`
   - `DYNAMODB_TABLE`: `cartola_extractions_prod`
   - `NODE_ENV`: `production`

3. **Upload code:**
   
```bash
# On your local machine, package the code
cd nubox-cartola-lambda
zip -r function.zip lambda/ node_modules/ package.json

# Upload via console or AWS CLI
aws lambda update-function-code \
  --function-name ProcessCartolaExtraction \
  --zip-file fileb://function.zip
```

4. Click **"Deploy"** (if using console upload)

---

### **Step 5: Create API Gateway (20 min)**

1. Open AWS Console → API Gateway
2. Click **"Create API"**
3. Choose **REST API** (not private)
4. Click **"Build"**
5. **API name:** `NuboxCartolaAPI`
6. **Endpoint Type:** Regional
7. Click **"Create API"**

**Create resources and methods:**

**Resource 1: /cartola**
1. **Actions** → **Create Resource**
2. **Resource Name:** `cartola`
3. **Resource Path:** `/cartola`
4. Click **"Create Resource"**

**Method: POST /cartola/extract**
1. Select `/cartola` resource
2. **Actions** → **Create Resource**
3. **Resource Name:** `extract`
4. **Resource Path:** `/extract`
5. Click **"Create Resource"**
6. Select `/extract` → **Actions** → **Create Method** → **POST**
7. **Integration type:** Lambda Function
8. **Lambda Function:** `ProcessCartolaExtraction`
9. Click **"Save"** → **"OK"** (grant permission)

**Enable CORS for POST:**
1. Select **POST** method
2. **Actions** → **Enable CORS**
3. ✅ POST
4. Click **"Enable CORS and replace existing CORS headers"**

**Resource 2: /cartola/{id}**
1. Select `/cartola` resource
2. **Actions** → **Create Resource**
3. **Resource Name:** `{id}`
4. ✅ Resource Path should be `{id}`
5. Click **"Create Resource"**
6. Select `/{id}` → **Actions** → **Create Method** → **GET**
7. **Lambda Function:** `GetCartolaStatus` (create this function first following same steps as ProcessCartola)
8. Enable CORS

**Resource 3: /cartola/list**
1. Select `/cartola` → **Create Resource**
2. **Resource Name:** `list`
3. **GET** method → Lambda: `ListUserCartolas`
4. Enable CORS

**Deploy API:**
1. **Actions** → **Deploy API**
2. **Deployment stage:** `prod` (create new)
3. Click **"Deploy"**
4. **Note the Invoke URL:** `https://abc123.execute-api.us-east-1.amazonaws.com/prod`

---

### **Step 6: Test Deployment (15 min)**

```bash
# Set your API URL
API_URL="https://abc123.execute-api.us-east-1.amazonaws.com/prod"

# Upload test PDF
aws s3 cp test-docs/banco-chile.pdf \
  s3://nubox-cartola-uploads-prod/test-user/banco-chile.pdf

# Trigger extraction
curl -X POST $API_URL/cartola/extract \
  -H "Content-Type: application/json" \
  -d '{
    "s3Key": "test-user/banco-chile.pdf",
    "userId": "test-user",
    "bankName": "Banco de Chile"
  }'

# Get extraction ID from response
EXTRACTION_ID="ext_xxx_yyy"

# Check status
curl "$API_URL/cartola/$EXTRACTION_ID" | jq '.'

# Wait for completion, then verify:
# ✅ status = "completed"
# ✅ movements extracted
# ✅ balance validated
```

---

## 📊 Deployment Validation

### **Checklist After Deployment**

**Infrastructure:**
- [ ] S3 bucket created and encrypted
- [ ] S3 lifecycle rule configured (7 days)
- [ ] DynamoDB table created
- [ ] 3 GSIs created and active
- [ ] TTL enabled on DynamoDB
- [ ] Point-in-time recovery enabled
- [ ] Lambda function deployed
- [ ] Lambda has correct memory (2GB)
- [ ] Lambda has correct timeout (15 min)
- [ ] IAM role has all permissions
- [ ] API Gateway deployed
- [ ] CORS enabled on all endpoints

**Configuration:**
- [ ] `GEMINI_API_KEY` set in Lambda env vars
- [ ] `S3_BUCKET` matches actual bucket name
- [ ] `DYNAMODB_TABLE` matches actual table name
- [ ] `NODE_ENV` set to production

**Testing:**
- [ ] Can upload PDF to S3
- [ ] Can trigger extraction via API
- [ ] Lambda processes successfully
- [ ] Results saved to DynamoDB
- [ ] Can query extraction status
- [ ] Can list user's extractions
- [ ] Balance validation works
- [ ] Quality metrics populated

**Monitoring:**
- [ ] CloudWatch logs visible
- [ ] Metrics dashboard configured
- [ ] Alarms created for errors
- [ ] Cost tracking enabled

---

## 🔄 Deployment Troubleshooting

### **Issue 1: "AccessDeniedException" on S3**

**Error:**
```
User is not authorized to perform: s3:GetObject
```

**Solution:**
```bash
# Verify IAM role has S3 permissions
aws iam get-role-policy \
  --role-name NuboxCartolaLambdaRole \
  --policy-name NuboxCartolaAccess

# If missing, update policy (see Step 4)
```

---

### **Issue 2: "ResourceNotFoundException" on DynamoDB**

**Error:**
```
Requested resource not found: Table: cartola_extractions_prod not found
```

**Solution:**
```bash
# Verify table exists
aws dynamodb describe-table \
  --table-name cartola_extractions_prod

# If not found, create table (see Step 2)

# Verify environment variable
aws lambda get-function-configuration \
  --function-name ProcessCartolaExtraction \
  | jq '.Environment.Variables.DYNAMODB_TABLE'
```

---

### **Issue 3: "Task timed out after 3.00 seconds"**

**Error:**
```
Task timed out after 3.00 seconds
```

**Solution:**
```bash
# Increase Lambda timeout
aws lambda update-function-configuration \
  --function-name ProcessCartolaExtraction \
  --timeout 900

# Verify timeout
aws lambda get-function-configuration \
  --function-name ProcessCartolaExtraction \
  | jq '.Timeout'
# Should show: 900
```

---

### **Issue 4: Gemini API Key Error**

**Error:**
```
API key not valid. Please pass a valid API key.
```

**Solution:**
```bash
# Verify key is set
aws lambda get-function-configuration \
  --function-name ProcessCartolaExtraction \
  | jq '.Environment.Variables.GEMINI_API_KEY'

# Update key
aws lambda update-function-configuration \
  --function-name ProcessCartolaExtraction \
  --environment "Variables={GEMINI_API_KEY=AIzaSyXXXX,S3_BUCKET=nubox-cartola-uploads-prod,DYNAMODB_TABLE=cartola_extractions_prod}"
```

---

### **Issue 5: CORS Error in Browser**

**Error:**
```
Access to fetch at ... has been blocked by CORS policy
```

**Solution:**
1. API Gateway → Select your API
2. Select method (POST /cartola/extract)
3. **Actions** → **Enable CORS**
4. ✅ POST
5. **Enable CORS and replace existing CORS headers**
6. **Actions** → **Deploy API** → Select stage → **Deploy**

---

## 🔐 Security Post-Deployment

### **Step 1: Restrict API Access (Recommended)**

**Add API Key authentication:**

1. API Gateway → **API Keys**
2. Click **"Create API key"**
3. **Name:** `nubox-frontend-key`
4. Click **"Save"**
5. **Copy the API key value**

**Create usage plan:**
1. **Usage Plans** → **"Create"**
2. **Name:** `NuboxStandardPlan`
3. **Throttling:**
   - Rate: 100 requests/second
   - Burst: 200
4. **Quota:**
   - 100,000 requests per month
5. Click **"Next"**
6. **Add API Stages:** Select your API and stage
7. Click **"Next"**
8. **Add API Keys:** Select the key you created
9. Click **"Done"**

**Require API key on methods:**
1. Select method (POST /cartola/extract)
2. **Method Request** → **API Key Required:** ✅ true
3. Repeat for all methods
4. **Deploy API**

**Test with API key:**
```bash
curl -X POST $API_URL/cartola/extract \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key-here" \
  -d '{"s3Key":"...","userId":"..."}'
```

---

### **Step 2: Enable CloudWatch Alarms (15 min)**

**Alarm 1: High Error Rate**

```bash
aws cloudwatch put-metric-alarm \
  --alarm-name cartola-high-error-rate \
  --alarm-description "Alert when Lambda error rate > 5%" \
  --metric-name Errors \
  --namespace AWS/Lambda \
  --statistic Average \
  --period 300 \
  --evaluation-periods 2 \
  --threshold 5 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=FunctionName,Value=ProcessCartolaExtraction
```

**Alarm 2: Long Processing Time**

```bash
aws cloudwatch put-metric-alarm \
  --alarm-name cartola-long-duration \
  --alarm-description "Alert when processing time > 120s" \
  --metric-name Duration \
  --namespace AWS/Lambda \
  --statistic Average \
  --period 300 \
  --evaluation-periods 1 \
  --threshold 120000 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=FunctionName,Value=ProcessCartolaExtraction
```

**Alarm 3: High Cost**

```bash
aws cloudwatch put-metric-alarm \
  --alarm-name cartola-daily-cost-high \
  --alarm-description "Alert when daily cost > $10" \
  --metric-name EstimatedCharges \
  --namespace AWS/Billing \
  --statistic Maximum \
  --period 86400 \
  --evaluation-periods 1 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold
```

---

## 📈 Post-Deployment Monitoring

### **Day 1: Watch Closely**

```bash
# Stream logs in real-time
aws logs tail /aws/lambda/ProcessCartolaExtraction --follow

# Check for errors
aws logs filter-log-events \
  --log-group-name /aws/lambda/ProcessCartolaExtraction \
  --filter-pattern "ERROR" \
  --start-time $(date -u -d '1 hour ago' +%s)000

# Monitor costs
aws ce get-cost-and-usage \
  --time-period Start=$(date -u -d '1 day ago' +%Y-%m-%d),End=$(date -u +%Y-%m-%d) \
  --granularity DAILY \
  --metrics UnblendedCost \
  --filter file://cost-filter.json
```

### **Week 1: Validate Baseline**

- [ ] No critical errors in logs
- [ ] 95%+ success rate maintained
- [ ] Processing times within targets (<120s p95)
- [ ] Costs within budget (<$1 per 1K extractions)
- [ ] No security incidents

### **Month 1: Optimize**

- [ ] Analyze performance bottlenecks
- [ ] Tune memory allocation (cost vs speed)
- [ ] Optimize prompts if needed
- [ ] Review and adjust concurrency limits
- [ ] User feedback incorporated

---

## 🎯 Success Criteria

**Deployment is successful when:**

1. ✅ All infrastructure deployed without errors
2. ✅ Test extraction completes successfully
3. ✅ Results match GCP baseline (95%+ accuracy)
4. ✅ Balance validation passes
5. ✅ API accessible and responding
6. ✅ Monitoring dashboards show healthy metrics
7. ✅ Costs within expected range
8. ✅ No security vulnerabilities detected

---

## 📞 Support & Escalation

**During deployment, if stuck:**

1. Check this guide's troubleshooting section
2. Review CloudWatch logs for specific errors
3. Consult AWS documentation (links in README)
4. Contact AWS Support (if you have support plan)
5. Internal: [Your team's support channel]

**Escalation path:**
1. Level 1: Self-service (this guide)
2. Level 2: Team lead review
3. Level 3: AWS Support ticket
4. Level 4: Google AI Support (for Gemini issues)

---

**Last Updated:** November 27, 2025  
**Next Review:** 2025-12-27  
**Maintainer:** Nubox Development Team

