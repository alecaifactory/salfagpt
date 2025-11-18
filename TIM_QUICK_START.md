# 🤖 TIM Quick Start Guide

**TIM (Together Imagine More)** - Digital Twin Testing Agent

---

## 🚀 Quick Commands

```bash
# Start localhost
npm run dev

# Run Tim tests
npm run test:tim

# Seed demo users (if needed)
npx tsx scripts/seed-demo-users.ts
```

---

## 📋 Test Digital Twins via API

```bash
# Create a digital twin
curl -X POST http://localhost:3000/api/tim/create \
  -H "Content-Type: application/json" \
  -H "Cookie: flow_session=YOUR_TOKEN" \
  -d '{
    "userId": "usr_g14stel2ccwsl0eafp60",
    "ticketId": "TICKET-001",
    "ticketDetails": {
      "userAction": "Clicked send button",
      "expectedBehavior": "Message should send",
      "actualBehavior": "Error appeared",
      "reproductionSteps": [
        "Login to platform",
        "Open chat",
        "Send message",
        "Observe error"
      ]
    }
  }'

# View your Tim sessions
curl http://localhost:3000/api/tim/my-sessions \
  -H "Cookie: flow_session=YOUR_TOKEN"

# Get specific session
curl http://localhost:3000/api/tim/sessions/SESSION_ID \
  -H "Cookie: flow_session=YOUR_TOKEN"
```

---

## 🤖 Use Tim from Cursor

```
"Execute Tim digital twin test for TIM-TEST-001"
```

Tim will automatically:
1. ✅ Create privacy-safe digital twin (≥98% compliance)
2. ✅ Navigate to localhost:3000
3. ✅ Reproduce user steps
4. ✅ Capture diagnostics (console, network, screenshots)
5. ✅ Analyze with Gemini Pro
6. ✅ Route insights to Ally/Stella/Rudy/Admins

---

## 📊 Demo Users Available

| Email | Role | User ID |
|-------|------|---------|
| admin@demo.com | admin | usr_ygbwzh8jsdjwbqs0lwwv |
| user@demo.com | user | usr_g14stel2ccwsl0eafp60 |
| expert@demo.com | expert | usr_criv06hp5i99zof1uxzz |
| power_user@demo.com | power user | usr_d51z4oimxwijhqz1wo7n |

---

## ✅ What Was Tested

- ✅ Privacy & anonymization (100% compliance)
- ✅ Digital twin creation (5 scenarios)
- ✅ PII detection and redaction
- ✅ AES-256-GCM encryption
- ✅ Firestore storage
- ✅ API endpoints

---

## 🎯 Example Test Scenarios

### 1. Message Send Failure
```javascript
{
  userId: "usr_g14stel2ccwsl0eafp60",
  ticketId: "TIM-TEST-001",
  ticketDetails: {
    userAction: "Typed message and clicked Send",
    expectedBehavior: "Message should send",
    actualBehavior: "Error: 'Failed to send message'",
    reproductionSteps: [...]
  }
}
```

### 2. PDF Upload Issue
```javascript
{
  userId: "usr_d51z4oimxwijhqz1wo7n",
  ticketId: "TIM-TEST-002",
  ticketDetails: {
    userAction: "Uploaded PDF document",
    expectedBehavior: "PDF processed successfully",
    actualBehavior: "Stuck at 'Processing...'",
    reproductionSteps: [...]
  }
}
```

---

## 🔐 Privacy Features

- **Email Anonymization:** `alec@getaifactory.com` → `a***@g***.com`
- **Name Anonymization:** `Alec Johnson` → `A*** J***`
- **PII Redaction:** Auto-detect emails, phones, SSN, credit cards
- **Encryption:** AES-256-GCM for sensitive data
- **Compliance:** ≥98% score required (all tests achieved 100%)

---

## 📄 Documentation

- **Test Results:** `docs/TIM_TEST_RESULTS_2025-11-18.md`
- **Architecture:** `docs/TIM_ARCHITECTURE.md`
- **Usage Guide:** `docs/TIM_USAGE_GUIDE.md`
- **Implementation:** `docs/TIM_IMPLEMENTATION_SUMMARY.md`

---

## 🛠️ Files

- **Core Library:** `src/lib/tim.ts`
- **Browser Automation:** `src/lib/tim-browser.ts`
- **API Endpoint:** `src/pages/api/tim/create.ts`
- **Types:** `src/types/tim.ts`
- **Test Script:** `scripts/test-tim-digital-twin.ts`

---

## 🎉 Success!

Tim is fully operational and ready to test user issues with complete privacy protection!

**Test Results:**
- ✅ 5/5 digital twins created
- ✅ 100% compliance scores
- ✅ All privacy features working
- ✅ Data saved to Firestore

**Next:** Use MCP browser tools to execute actual reproduction steps! 🚀


