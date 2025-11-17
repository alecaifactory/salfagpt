# Tim Usage Guide - Digital Twin Testing Agent

**Created:** 2025-11-16  
**Version:** 1.0.0  
**Status:** ✅ Ready for Testing

---

## 🎯 **What is Tim?**

**Tim (Together Imagine More)** is an automated testing agent that:
- Creates digital twins of users to safely reproduce issues
- Maintains ≥98% privacy compliance through encryption & anonymization
- Captures comprehensive diagnostics (console, network, screenshots, performance)
- Uses AI to analyze root causes
- Routes insights to appropriate agents (Ally, Stella, Rudy) and admins

---

## 🚀 **Quick Start**

### **1. User Reports an Issue**

User creates a support ticket describing:
- What they did
- What they expected
- What actually happened

### **2. Create Digital Twin**

```typescript
// API Call
POST /api/tim/create
{
  "userId": "user-123",
  "ticketId": "ticket-456",
  "ticketDetails": {
    "userAction": "User clicked 'Send Message' button",
    "expectedBehavior": "Message should be sent and AI should respond",
    "actualBehavior": "Received error: 'Failed to send message'",
    "reproductionSteps": [
      "Login to Flow platform",
      "Open existing agent",
      "Type message: 'Hello'",
      "Click Send button",
      "Observe error message"
    ]
  }
}

Response:
{
  "digitalTwinId": "tim-user123-ticket456-1731801600000",
  "complianceScore": 99.5,
  "status": "created",
  "sessionId": "tim-session-1731801600000-abc123def456"
}
```

### **3. AI Assistant Executes Test**

The AI assistant (via MCP browser tools) will:

```typescript
// 1. Navigate to platform
await browser_navigate({ url: 'http://localhost:3000/chat' });

// 2. Capture initial state
const snapshot = await browser_snapshot();

// 3. Execute each reproduction step
// - Click elements
// - Type text
// - Wait for responses

// 4. Capture diagnostics at each step
const consoleLogs = await browser_console_messages();
const networkRequests = await browser_network_requests();
await browser_take_screenshot({ filename: 'step-1.png' });

// 5. Measure performance
const metrics = await browser_evaluate({
  function: `() => ({
    loadTime: performance.timing.loadEventEnd - performance.timing.navigationStart,
    memoryUsage: performance.memory?.usedJSHeapSize
  })`
});
```

### **4. View Results**

```typescript
// Get test session results
GET /api/tim/sessions/{sessionId}

Response:
{
  "sessionId": "session-abc",
  "status": "completed",
  "aiAnalysis": {
    "rootCause": "Missing API authentication header in request",
    "reproducible": true,
    "severity": "high",
    "affectedUsers": "All users",
    "recommendedFix": "Add auth middleware to /api/messages endpoint",
    "estimatedEffort": "2 hours",
    "confidence": 95
  },
  "capturedData": {
    "consoleLogs": [...],
    "networkRequests": [...],
    "screenshots": [...]
  }
}
```

### **5. User Views Privacy Ledger**

```typescript
// Get all Tim sessions for transparency
GET /api/tim/my-sessions?userId={userId}

Response:
{
  "ledger": [
    {
      "sessionId": "session-abc",
      "ticketId": "ticket-456",
      "createdAt": "2025-11-16T10:00:00Z",
      "status": "completed",
      "dataShared": {
        "profile": "anonymized",
        "messages": "encrypted",
        "contextSources": "encrypted + anonymized",
        "screenshots": "UI only - no sensitive data",
        "consoleLogs": "redacted PII"
      },
      "accessedBy": [
        { "agent": "tim", "timestamp": "...", "purpose": "Issue reproduction" },
        { "agent": "ally", "timestamp": "...", "purpose": "Personal context update" },
        { "agent": "stella", "timestamp": "...", "purpose": "Product insights" }
      ],
      "complianceScore": 99.5,
      "compliancePassed": true,
      "downloadUrl": "/api/tim/download/session-abc"
    }
  ]
}
```

---

## 🔒 **Privacy & Compliance**

### **What Gets Anonymized**
- ✅ Email: `alec@getaifactory.com` → `a***@g***.com`
- ✅ Name: `Alec Johnson` → `A*** J***`
- ✅ PII in messages: Emails, phones, SSN, credit cards → `[REDACTED]`

### **What Gets Encrypted**
- ✅ System prompts (may contain personal instructions)
- ✅ Context source IDs (document references)
- ✅ User messages (original content)
- ✅ Console logs containing sensitive data

### **Compliance Score Calculation**
```
Score = (PII Detection × 0.35) + 
        (Encryption Strength × 0.30) + 
        (Access Control × 0.25) + 
        (Audit Trail × 0.10)

Minimum Required: 98%
```

---

## 🤖 **How AI Assistant Uses Tim**

### **Example: Testing a User Issue**

**User says:** "Test this ticket - user can't send messages"

**AI assistant does:**

```typescript
// 1. Create digital twin
const twin = await runTimTest({
  userId: "user-123",
  ticketId: "ticket-456",
  ticketDetails: {
    userAction: "Clicked Send button",
    expectedBehavior: "Message sent to AI",
    actualBehavior: "Error: 'Failed to send'",
    reproductionSteps: [
      "Login",
      "Open agent",
      "Type message",
      "Click Send"
    ]
  }
});

// 2. Navigate to platform
await browser_navigate({ url: 'http://localhost:3000/chat' });

// 3. Execute steps
await browser_snapshot(); // See initial state
// ... simulate user login (test auth)
await browser_type({ element: 'message input', ref: '[ref]', text: 'Hello' });
await browser_click({ element: 'Send button', ref: '[ref]' });

// 4. Capture diagnostics
const console = await browser_console_messages();
const network = await browser_network_requests();
await browser_take_screenshot({ filename: 'error-state.png' });

// 5. Analyze with AI
const analysis = await analyzeTestResults(sessionId, capturedData, testScenario);

// 6. Report to user
"I found the issue: Missing auth header. Fix: Add middleware. Estimated: 2 hours."
```

---

## 📊 **Insight Routing**

### **Who Gets What**

| Recipient | When | Purpose |
|-----------|------|---------|
| **User** | Always | Test results and resolution plan |
| **Ally** | Always | Update personal agent context |
| **Stella** | UX/Bug/Feature | Product improvement insights |
| **Rudy** | High/Critical | Roadmap prioritization |
| **Admin** | Domain issues | Organization-level patterns |
| **SuperAdmin** | Platform-wide | Critical system issues |

---

## 🔧 **For Developers**

### **Creating a Tim Test Programmatically**

```typescript
import { runTimTest } from '../lib/tim-orchestrator';

async function testUserIssue() {
  const result = await runTimTest({
    userId: 'user-123',
    ticketId: 'ticket-456',
    ticketDetails: {
      userAction: 'User action description',
      expectedBehavior: 'What should happen',
      actualBehavior: 'What actually happened',
      reproductionSteps: [
        'Step 1',
        'Step 2',
        'Step 3'
      ]
    }
  });
  
  console.log('Digital Twin created:', result.digitalTwinId);
  console.log('Session ID:', result.sessionId);
  console.log('Compliance:', result.complianceScore + '%');
}
```

### **Viewing Test Results**

```typescript
import { getTestSession } from '../lib/tim';

async function viewResults(sessionId: string) {
  const session = await getTestSession(sessionId);
  
  console.log('Status:', session.status);
  console.log('Root Cause:', session.aiAnalysis?.rootCause);
  console.log('Recommended Fix:', session.aiAnalysis?.recommendedFix);
  console.log('Screenshots:', session.capturedData.screenshots.length);
  console.log('Console Errors:', 
    session.capturedData.consoleLogs.filter(log => log.level === 'error').length
  );
}
```

---

## 📋 **Collections Created**

### **1. digital_twins**
Stores twin configurations with anonymized user data

### **2. tim_test_sessions**  
Records of all test executions with captured diagnostics

### **3. tim_compliance_logs**
Audit trail of all compliance checks

### **4. tim_insights**
Analyzed findings routed to agents/admins

---

## ✅ **Next Steps**

### **Immediate (Manual Testing)**
1. Create a test ticket
2. Call `POST /api/tim/create`
3. AI assistant executes browser automation
4. Review results in `/api/tim/sessions/{id}`
5. Verify privacy ledger in `/api/tim/my-sessions`

### **Future Enhancements**
- [ ] Automated test scheduling
- [ ] Visual regression testing
- [ ] Performance benchmarking over time
- [ ] Tim learning from resolutions
- [ ] Predictive issue detection

---

## 🎓 **Key Concepts**

### **Digital Twin**
A privacy-safe clone of a user's configuration used for testing. Contains:
- Anonymized profile
- Encrypted sensitive data
- User's agent configuration
- Active context sources (encrypted)

### **Compliance Score**
Weighted score (0-100) measuring:
- PII detection & anonymization (35%)
- Encryption strength (30%)
- Access control (25%)
- Audit trail (10%)

**Minimum:** 98% required to proceed

### **Captured Data**
Comprehensive diagnostics from browser:
- Console logs (errors, warnings, info)
- Network requests (timing, status, failures)
- Screenshots (UI state at each step)
- Performance metrics (load time, memory)
- Accessibility issues (a11y violations)

### **AI Analysis**
Gemini Pro analyzes all captured data to provide:
- Root cause identification
- Reproducibility confirmation
- Severity assessment
- Affected user estimation
- Recommended fix with effort estimate

---

## 🔗 **Integration Points**

### **With Existing Systems**
- **Feedback Tickets** → Tim tests reported issues
- **Ally Agent** → Receives Tim insights for user context
- **Stella Agent** → Receives product improvement insights
- **Rudy Agent** → Receives roadmap prioritization data
- **Admin Panels** → View organization-wide patterns
- **User Dashboard** → Privacy ledger and transparency

---

**Remember:** Tim operates with complete user privacy and transparency. Every user can see exactly what data was used, how it was protected, and who accessed it. 🔒✨

