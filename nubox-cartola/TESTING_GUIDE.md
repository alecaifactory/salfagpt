# Testing Guide - Nubox Cartola Extraction
## Comprehensive Testing Strategy

**Version:** 1.0.0  
**Last Updated:** November 27, 2025  
**Test Coverage Target:** >80%

---

## 🎯 Testing Strategy

### **Test Pyramid**

```
                    ┌──────────────────┐
                    │   E2E TESTS      │
                    │   (5 tests)      │
                    │   Real AWS       │
                    └────────┬─────────┘
                             │ Slow, Expensive
                             │ Run: Before production deploy
                    ┌────────▼──────────────┐
                    │  INTEGRATION TESTS    │
                    │  (20 tests)           │
                    │  Local + Mock AWS     │
                    └────────┬──────────────┘
                             │ Medium speed/cost
                             │ Run: Every commit
            ┌────────────────▼────────────────────┐
            │       UNIT TESTS                    │
            │       (50+ tests)                   │
            │       Pure functions                │
            └─────────────────────────────────────┘
                             │ Fast, Free
                             │ Run: During development
```

---

## 🧪 Unit Tests

### **Setup**

```bash
# Install Jest
npm install --save-dev jest @types/jest

# Create jest.config.js
cat > jest.config.js << 'EOF'
module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'lambda/**/*.js',
    '!lambda/**/*.test.js'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
EOF

# Add test script to package.json
npm pkg set scripts.test="jest"
npm pkg set scripts.test:coverage="jest --coverage"
npm pkg set scripts.test:watch="jest --watch"
```

### **Test Files Structure**

```
lambda/
├─ lib/
│  ├─ extractor.js
│  ├─ extractor.test.js        ← Unit tests
│  ├─ validators.js
│  └─ validators.test.js       ← Unit tests
├─ handler.js
├─ handler.test.js             ← Integration tests
└─ __tests__/
   ├─ e2e/
   │  └─ full-flow.test.js     ← E2E tests
   └─ fixtures/
      ├─ sample-statement.pdf
      └─ expected-output.json
```

### **Example Unit Tests**

**Test: Balance Validation (`lambda/lib/validators.test.js`)**

```javascript
const { validateBalance } = require('./validators');

describe('validateBalance', () => {
  test('should pass when balance equation is correct', () => {
    const data = {
      opening_balance: 1000000,
      total_credits: 500000,
      total_debits: 300000,
      closing_balance: 1200000
    };
    
    const result = validateBalance(data);
    
    expect(result.coincide).toBe(true);
    expect(result.diferencia).toBe(0);
  });
  
  test('should fail when balance mismatch exceeds tolerance', () => {
    const data = {
      opening_balance: 1000000,
      total_credits: 500000,
      total_debits: 300000,
      closing_balance: 1200100  // Off by 100
    };
    
    const result = validateBalance(data);
    
    expect(result.coincide).toBe(false);
    expect(result.diferencia).toBe(100);
  });
  
  test('should allow ±1 tolerance for rounding', () => {
    const data = {
      opening_balance: 1000000,
      total_credits: 500000,
      total_debits: 300000,
      closing_balance: 1200001  // Off by 1
    };
    
    const result = validateBalance(data);
    
    expect(result.coincide).toBe(true);  // Within tolerance
    expect(result.diferencia).toBe(1);
  });
});
```

**Test: Amount Parsing (`lambda/lib/parsers.test.js`)**

```javascript
const { parseChileanAmount } = require('./parsers');

describe('parseChileanAmount', () => {
  test('should parse amounts with thousands separators', () => {
    expect(parseChileanAmount('1.234.567')).toBe(1234567);
    expect(parseChileanAmount('50.000')).toBe(50000);
    expect(parseChileanAmount('999')).toBe(999);
  });
  
  test('should parse amounts with comma decimals', () => {
    expect(parseChileanAmount('1.234,50')).toBe(1234.50);
    expect(parseChileanAmount('100,00')).toBe(100);
  });
  
  test('should handle negative amounts', () => {
    expect(parseChileanAmount('-50.000')).toBe(-50000);
    expect(parseChileanAmount('(50.000)')).toBe(-50000);  // Accounting format
  });
  
  test('should return 0 for invalid input', () => {
    expect(parseChileanAmount('')).toBe(0);
    expect(parseChileanAmount(null)).toBe(0);
    expect(parseChileanAmount('invalid')).toBe(0);
  });
});
```

**Test: RUT Parsing**

```javascript
const { parseRUT } = require('./parsers');

describe('parseRUT', () => {
  test('should extract RUT from text', () => {
    const text = '77.352.453-K Transf. FERRETERI';
    const result = parseRUT(text);
    
    expect(result.holder_id).toBe('77352453k');
    expect(result.dv).toBe('k');
  });
  
  test('should handle RUT without dots', () => {
    const text = '77352453-K';
    const result = parseRUT(text);
    
    expect(result.holder_id).toBe('77352453k');
  });
  
  test('should return null for no RUT', () => {
    const text = 'Payment description';
    const result = parseRUT(text);
    
    expect(result.holder_id).toBe(null);
  });
});
```

**Run unit tests:**
```bash
npm test

# With coverage
npm run test:coverage

# Watch mode (during development)
npm run test:watch
```

---

## 🔗 Integration Tests

### **Test: Lambda Handler**

**`lambda/handler.test.js`:**

```javascript
const { processCartola } = require('./handler');

// Mock AWS SDK
jest.mock('aws-sdk', () => {
  const mockS3 = {
    getObject: jest.fn().mockReturnValue({
      promise: jest.fn().mockResolvedValue({
        Body: Buffer.from('mock-pdf-content')
      })
    })
  };
  
  const mockDynamoDB = {
    put: jest.fn().mockReturnValue({ promise: jest.fn() }),
    update: jest.fn().mockReturnValue({ promise: jest.fn() })
  };
  
  return {
    S3: jest.fn(() => mockS3),
    DynamoDB: {
      DocumentClient: jest.fn(() => mockDynamoDB)
    }
  };
});

// Mock extractor
jest.mock('./lib/extractor', () => ({
  extractNuboxCartola: jest.fn().mockResolvedValue({
    document_id: 'doc_test',
    movements: [{ id: 'mov_001', amount: 50000 }],
    balance_validation: { coincide: true }
  })
}));

describe('processCartola Lambda Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.S3_BUCKET = 'test-bucket';
    process.env.DYNAMODB_TABLE = 'test-table';
    process.env.GEMINI_API_KEY = 'test-key';
  });
  
  test('should process extraction successfully', async () => {
    const event = {
      body: JSON.stringify({
        s3Key: 'user-123/test.pdf',
        userId: 'user-123',
        bankName: 'Banco de Chile'
      })
    };
    
    const result = await processCartola(event);
    
    expect(result.statusCode).toBe(200);
    
    const body = JSON.parse(result.body);
    expect(body.success).toBe(true);
    expect(body.extractionId).toBeDefined();
    expect(body.result).toBeDefined();
  });
  
  test('should return 400 for missing required fields', async () => {
    const event = {
      body: JSON.stringify({
        // Missing s3Key and userId
        bankName: 'Banco de Chile'
      })
    };
    
    const result = await processCartola(event);
    
    expect(result.statusCode).toBe(400);
    
    const body = JSON.parse(result.body);
    expect(body.error).toContain('Missing required fields');
  });
  
  test('should handle extraction errors gracefully', async () => {
    const { extractNuboxCartola } = require('./lib/extractor');
    extractNuboxCartola.mockRejectedValueOnce(new Error('Gemini API error'));
    
    const event = {
      body: JSON.stringify({
        s3Key: 'user-123/test.pdf',
        userId: 'user-123'
      })
    };
    
    const result = await processCartola(event);
    
    expect(result.statusCode).toBe(500);
    
    const body = JSON.parse(result.body);
    expect(body.success).toBe(false);
    expect(body.error).toBeDefined();
  });
});
```

**Run integration tests:**
```bash
npm test -- handler.test.js
```

---

## 🌐 End-to-End Tests

### **Test: Full Extraction Flow**

**`lambda/__tests__/e2e/full-flow.test.js`:**

```javascript
const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

// Use real AWS services (requires deployment)
const s3 = new AWS.S3();
const apiUrl = process.env.API_URL;
const apiKey = process.env.API_KEY;

describe('E2E: Full Extraction Flow', () => {
  jest.setTimeout(180000);  // 3 minutes max
  
  test('should extract real bank statement end-to-end', async () => {
    // 1. Upload PDF to S3
    const pdfPath = path.join(__dirname, '../fixtures/banco-chile-oct-2024.pdf');
    const pdfBuffer = fs.readFileSync(pdfPath);
    const s3Key = `e2e-test/${Date.now()}/test.pdf`;
    
    await s3.putObject({
      Bucket: process.env.S3_BUCKET,
      Key: s3Key,
      Body: pdfBuffer,
      ContentType: 'application/pdf'
    }).promise();
    
    console.log('✅ PDF uploaded to S3');
    
    // 2. Trigger extraction
    const extractResponse = await fetch(`${apiUrl}/cartola/extract`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey
      },
      body: JSON.stringify({
        s3Key,
        userId: 'e2e-test-user',
        bankName: 'Banco de Chile',
        model: 'gemini-2.5-flash'
      })
    });
    
    const extraction = await extractResponse.json();
    expect(extraction.success).toBe(true);
    expect(extraction.extractionId).toBeDefined();
    
    console.log('✅ Extraction triggered:', extraction.extractionId);
    
    // 3. Poll for completion
    let attempts = 0;
    let result;
    
    while (attempts < 60) {  // Max 5 minutes
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      const statusResponse = await fetch(`${apiUrl}/cartola/${extraction.extractionId}`, {
        headers: { 'x-api-key': apiKey }
      });
      
      result = await statusResponse.json();
      
      if (result.status === 'completed' || result.status === 'failed') {
        break;
      }
      
      attempts++;
    }
    
    expect(result.status).toBe('completed');
    console.log('✅ Extraction completed');
    
    // 4. Validate results
    const extractionResult = result.extractionResult;
    
    expect(extractionResult.document_id).toBeDefined();
    expect(extractionResult.bank_name).toBe('Banco de Chile');
    expect(extractionResult.movements).toBeInstanceOf(Array);
    expect(extractionResult.movements.length).toBeGreaterThan(0);
    
    // Validate balance
    expect(extractionResult.balance_validation).toBeDefined();
    expect(extractionResult.balance_validation.coincide).toBe(true);
    
    console.log(`✅ Extracted ${extractionResult.movements.length} movements`);
    console.log(`✅ Balance validation: ${extractionResult.balance_validation.coincide ? 'PASS' : 'FAIL'}`);
    
    // 5. Cleanup
    await s3.deleteObject({
      Bucket: process.env.S3_BUCKET,
      Key: s3Key
    }).promise();
    
    console.log('✅ Cleanup complete');
  });
});
```

**Run E2E tests:**
```bash
# Set environment variables
export API_URL=https://abc123.execute-api.us-east-1.amazonaws.com/prod
export API_KEY=your-api-key
export S3_BUCKET=nubox-cartola-uploads-prod

# Run E2E tests
npm test -- e2e/full-flow.test.js
```

---

## 📋 Test Cases

### **TC-1: Standard Extraction (Banco de Chile)**

**Objective:** Verify complete extraction of standard bank statement

**Test Data:**
- PDF: Banco de Chile statement (October 2024)
- Movements: 10
- Pages: 3

**Steps:**
1. Upload PDF to S3
2. Trigger extraction
3. Wait for completion
4. Validate results

**Expected Results:**
- ✅ All 10 movements extracted
- ✅ All amounts signed correctly (credits +, debits -)
- ✅ All balances match column values
- ✅ Balance validation passes (coincide = true, diferencia = 0)
- ✅ All dates in ISO 8601 format
- ✅ RUTs extracted where present
- ✅ Quality = "alta"
- ✅ Recommendation = "✅ Lista para Nubox"

**Acceptance Criteria:**
- Extraction accuracy: >95%
- Processing time: <60s
- Cost: <$0.001

---

### **TC-2: Large PDF (50+ pages)**

**Objective:** Verify handling of large statements

**Test Data:**
- PDF: 50 pages, 200+ movements
- File size: ~5MB

**Steps:**
1. Upload large PDF
2. Trigger extraction with Flash model
3. Monitor processing time
4. Validate completeness

**Expected Results:**
- ✅ All movements extracted
- ✅ No timeout errors
- ✅ Memory usage within limits
- ✅ Processing time <120s

---

### **TC-3: Multiple Banks**

**Objective:** Verify multi-bank support

**Test Data:**
- Banco de Chile
- BancoEstado
- Banco Itaú
- Scotiabank

**Steps:**
For each bank:
1. Upload sample statement
2. Trigger extraction (with bankName hint)
3. Verify bank detected correctly

**Expected Results:**
- ✅ Bank name extracted correctly
- ✅ Format variations handled
- ✅ All movements extracted

---

### **TC-4: Error Handling - Invalid PDF**

**Objective:** Verify graceful error handling

**Test Data:**
- Corrupted PDF
- Non-PDF file (renamed .txt)
- Encrypted PDF

**Steps:**
1. Upload invalid file
2. Trigger extraction
3. Verify error response

**Expected Results:**
- ✅ Status = "failed"
- ✅ Error message clear and actionable
- ✅ No Lambda crashes
- ✅ DynamoDB updated with error

---

### **TC-5: Balance Validation Failure**

**Objective:** Verify detection of extraction errors

**Test Data:**
- PDF with deliberate extraction errors

**Steps:**
1. Upload PDF
2. Trigger extraction
3. Check balance validation

**Expected Results:**
- ✅ coincide = false
- ✅ diferencia > 0
- ✅ Recommendation = "⚠️ Revisar extracción"
- ✅ Quality = "media" or "baja"

---

### **TC-6: Concurrency Test**

**Objective:** Verify parallel processing

**Test Data:**
- 10 PDFs uploaded simultaneously

**Steps:**
1. Upload 10 PDFs to S3
2. Trigger 10 extractions in parallel
3. Poll all 10 until complete
4. Verify all succeed

**Expected Results:**
- ✅ All 10 complete successfully
- ✅ No throttling errors
- ✅ Results independent (no cross-contamination)
- ✅ Total time <120s (parallel processing working)

---

### **TC-7: API Authentication**

**Objective:** Verify API security

**Steps:**
1. Call API without x-api-key header
2. Call API with invalid key
3. Call API with valid key

**Expected Results:**
- ❌ No header: 401 Unauthorized
- ❌ Invalid key: 403 Forbidden
- ✅ Valid key: 200 OK

---

### **TC-8: Rate Limiting**

**Objective:** Verify rate limits enforced

**Steps:**
1. Send 101 requests in 1 second
2. Verify 429 response

**Expected Results:**
- ✅ First 100 requests: 200 OK
- ✅ 101st request: 429 Too Many Requests
- ✅ Retry-After header present

---

## 🔬 Performance Testing

### **Load Test Script**

```javascript
// load-test.js
const fetch = require('node-fetch');

async function loadTest(concurrency, duration) {
  const apiUrl = process.env.API_URL;
  const apiKey = process.env.API_KEY;
  
  let totalRequests = 0;
  let successCount = 0;
  let errorCount = 0;
  const durations = [];
  
  const startTime = Date.now();
  const endTime = startTime + (duration * 1000);
  
  async function makeRequest() {
    while (Date.now() < endTime) {
      const requestStart = Date.now();
      totalRequests++;
      
      try {
        const response = await fetch(`${apiUrl}/cartola/extract`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey
          },
          body: JSON.stringify({
            s3Key: `load-test/test-${totalRequests}.pdf`,
            userId: 'load-test-user'
          })
        });
        
        if (response.ok) {
          successCount++;
        } else {
          errorCount++;
        }
        
        durations.push(Date.now() - requestStart);
        
      } catch (error) {
        errorCount++;
      }
    }
  }
  
  // Start concurrent requests
  const promises = Array(concurrency).fill(0).map(() => makeRequest());
  await Promise.all(promises);
  
  // Calculate statistics
  const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
  const p95Duration = durations.sort((a, b) => a - b)[Math.floor(durations.length * 0.95)];
  
  console.log('\n📊 Load Test Results:');
  console.log(`Total requests: ${totalRequests}`);
  console.log(`Success: ${successCount} (${(successCount/totalRequests*100).toFixed(2)}%)`);
  console.log(`Errors: ${errorCount} (${(errorCount/totalRequests*100).toFixed(2)}%)`);
  console.log(`Avg response time: ${avgDuration.toFixed(0)}ms`);
  console.log(`P95 response time: ${p95Duration}ms`);
  console.log(`Duration: ${duration}s`);
  console.log(`Concurrency: ${concurrency}`);
}

// Run: node load-test.js
loadTest(10, 60);  // 10 concurrent for 60 seconds
```

---

## 🧰 Testing Tools

### **Local Testing with Serverless Offline**

```bash
# Install plugin
npm install --save-dev serverless-offline

# Add to serverless.yml
# plugins:
#   - serverless-offline

# Start local server
serverless offline start

# API available at: http://localhost:3000

# Test locally
curl -X POST http://localhost:3000/cartola/extract \
  -H "Content-Type: application/json" \
  -d '{"s3Key":"test.pdf","userId":"user-123"}'
```

**Benefits:**
- ✅ Fast iteration (no deployment)
- ✅ Free (no AWS costs)
- ✅ Debugger support
- ❌ Not 100% identical to AWS (close enough for dev)

---

### **Mock Data for Testing**

**Mock successful extraction result:**

```javascript
// test-fixtures/mock-extraction-result.json
{
  "document_id": "doc_mock123",
  "bank_name": "Banco de Chile",
  "account_number": "000484021004",
  "account_holder": "Test User",
  "account_holder_rut": "12345678-9",
  "period_start": "2024-10-01T00:00:00Z",
  "period_end": "2024-10-31T00:00:00Z",
  "opening_balance": 1000000,
  "closing_balance": 1500000,
  "total_credits": 600000,
  "total_debits": 100000,
  "movements": [
    {
      "id": "mov_001",
      "type": "deposit",
      "amount": 100000,
      "pending": false,
      "currency": "CLP",
      "post_date": "2024-10-15T00:00:00Z",
      "description": "Depósito",
      "balance": 1100000,
      "sender_account": {
        "holder_id": null,
        "dv": null,
        "holder_name": null
      },
      "insights": {
        "errores": [],
        "calidad": "alta",
        "banco": "Banco de Chile",
        "extraction_proximity_pct": 95
      }
    }
  ],
  "balance_validation": {
    "saldo_inicial": 1000000,
    "total_abonos": 600000,
    "total_cargos": 100000,
    "saldo_calculado": 1500000,
    "saldo_final_documento": 1500000,
    "coincide": true,
    "diferencia": 0
  },
  "metadata": {
    "total_pages": 1,
    "total_movements": 1,
    "extraction_time": 30000,
    "confidence": 0.95,
    "model": "gemini-2.5-flash",
    "cost": 0.0008
  },
  "quality": {
    "fields_complete": true,
    "movements_complete": true,
    "balance_matches": true,
    "confidence_score": 0.95,
    "recommendation": "✅ Lista para Nubox",
    "average_extraction_proximity_pct": 95,
    "extraction_bank": "Banco de Chile"
  }
}
```

---

## ✅ Test Checklist

### **Before Each Deployment**

**Unit Tests:**
- [ ] All unit tests pass (`npm test`)
- [ ] Code coverage >80% (`npm run test:coverage`)
- [ ] No failing assertions
- [ ] No skipped tests without reason

**Integration Tests:**
- [ ] Lambda handler tests pass
- [ ] S3 operations work
- [ ] DynamoDB operations work
- [ ] Error handling verified

**E2E Tests (Staging):**
- [ ] Real PDF extraction works
- [ ] Balance validation passes
- [ ] API responds correctly
- [ ] Results match GCP baseline

**Manual Tests:**
- [ ] Test with 3+ different bank statements
- [ ] Test with large PDF (>20MB)
- [ ] Test concurrent extractions
- [ ] Test error scenarios
- [ ] Verify monitoring dashboards

---

## 🐛 Debugging Failed Tests

### **Issue: Unit tests fail after code change**

**Diagnosis:**
```bash
npm test -- --verbose

# Check which test failed
# Read error message carefully
# Review recent code changes
```

**Common causes:**
- Mock not updated after code change
- Assertion expectations outdated
- Test data no longer valid

---

### **Issue: Integration tests timeout**

**Diagnosis:**
```bash
# Increase Jest timeout
jest.setTimeout(60000);  // 60 seconds

# Check Lambda logs
aws logs tail /aws/lambda/ProcessCartolaExtraction --follow
```

**Common causes:**
- Lambda taking too long (check memory/timeout config)
- Network issues (retry)
- Gemini AI slow response (use Flash instead of Pro)

---

### **Issue: E2E tests fail in CI/CD**

**Diagnosis:**
```bash
# Verify environment variables set
echo $API_URL
echo $API_KEY
echo $S3_BUCKET

# Check CI/CD logs for specific error
```

**Common causes:**
- Environment variables not set in CI
- API key expired or invalid
- S3 bucket not accessible from CI
- Rate limits exceeded

---

## 📊 Test Metrics

### **Track These Metrics**

```
Test Coverage:
├─ Line coverage: >80%
├─ Branch coverage: >75%
├─ Function coverage: >90%
└─ Statement coverage: >80%

Test Reliability:
├─ Flakiness rate: <1%
├─ Average run time: <5 minutes
└─ Success rate: >99%

Quality Metrics:
├─ Bugs found in testing: Track trend
├─ Bugs escaped to production: 0 goal
└─ Test maintenance time: <10% of dev time
```

---

## 🔄 Continuous Testing

### **Pre-Commit Hook**

```bash
# Create .git/hooks/pre-commit
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash

echo "Running tests before commit..."

# Run unit tests
npm test

if [ $? -ne 0 ]; then
  echo "❌ Tests failed! Commit aborted."
  exit 1
fi

echo "✅ Tests passed!"
exit 0
EOF

chmod +x .git/hooks/pre-commit
```

### **CI/CD Pipeline (GitHub Actions example)**

```yaml
# .github/workflows/test.yml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npm test
      
      - name: Check coverage
        run: npm run test:coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info

  e2e:
    runs-on: ubuntu-latest
    needs: test
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run E2E tests
        env:
          API_URL: ${{ secrets.API_URL }}
          API_KEY: ${{ secrets.API_KEY }}
          S3_BUCKET: ${{ secrets.S3_BUCKET }}
        run: npm test -- e2e/
```

---

## 📚 Test Documentation

### **Writing Good Tests**

**Good test structure (AAA pattern):**

```javascript
test('should calculate balance correctly', () => {
  // Arrange
  const opening = 1000000;
  const credits = 500000;
  const debits = 300000;
  
  // Act
  const result = calculateBalance(opening, credits, debits);
  
  // Assert
  expect(result).toBe(1200000);
});
```

**Clear test names:**
- ✅ `should return 400 when userId is missing`
- ✅ `should extract all movements from Banco de Chile statement`
- ❌ `test1`
- ❌ `it works`

**One assertion per test (preferably):**
```javascript
// ❌ BAD: Multiple unrelated assertions
test('handler', () => {
  expect(result.statusCode).toBe(200);
  expect(config.memory).toBe(2048);
  expect(user.name).toBe('Test');
});

// ✅ GOOD: Focused assertions
test('should return 200 on success', () => {
  expect(result.statusCode).toBe(200);
});

test('should configure 2GB memory', () => {
  expect(config.memory).toBe(2048);
});
```

---

## 🎯 Test Success Criteria

**Tests are successful when:**

1. ✅ All unit tests pass (50+ tests)
2. ✅ All integration tests pass (20+ tests)
3. ✅ All E2E tests pass (5+ tests)
4. ✅ Code coverage >80%
5. ✅ No flaky tests (<1% flakiness)
6. ✅ Test run time <5 minutes
7. ✅ Real PDF extraction matches baseline (95%+ accuracy)
8. ✅ Balance validation 100% correct
9. ✅ No errors in CloudWatch logs
10. ✅ Costs within budget

---

**Last Updated:** November 27, 2025  
**Version:** 1.0.0  
**Test Coverage:** Target >80%  
**Maintainer:** Nubox QA Team

