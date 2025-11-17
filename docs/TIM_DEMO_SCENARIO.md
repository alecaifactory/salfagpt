# Tim Demo - End-to-End Test Scenario

**Created:** 2025-11-16  
**Purpose:** Demonstrate Tim's complete workflow with real example

---

## 🎬 **Scenario: User Can't Send Message**

### **Setup**

**User:** `hello@getaifactory.com` (User B from multi-user testing)  
**Ticket ID:** `ticket-20251116-001`  
**Issue:** User clicks "Send" button but message fails to send

**User's Report:**
```
Subject: Cannot send messages in my agent

When I:
1. Open my agent "Agente de Hello"
2. Type a message
3. Click the Send button

Expected: Message sends and AI responds
Actual: Error message appears: "Failed to send message"

This started happening today.
```

---

## 🧪 **Demo Test Execution**

### **Step 1: Create Digital Twin**

I'll execute this API call to create Tim:

```bash
curl -X POST http://localhost:3000/api/tim/create \
  -H "Content-Type: application/json" \
  -H "Cookie: flow_session=YOUR_SESSION_TOKEN" \
  -d '{
    "userId": "116745562509015715931",
    "ticketId": "ticket-20251116-001",
    "ticketDetails": {
      "userAction": "User typed message and clicked Send button",
      "expectedBehavior": "Message should be sent and AI should respond within 3 seconds",
      "actualBehavior": "Error message appears: Failed to send message",
      "reproductionSteps": [
        "Login to Flow platform as hello@getaifactory.com",
        "Navigate to /chat",
        "Select agent: Agente de Hello",
        "Type message in input field: Hello, can you help me?",
        "Click Send button",
        "Observe error message"
      ]
    }
  }'
```

**Expected Response:**
```json
{
  "digitalTwinId": "tim-116745562509015715931-ticket-20251116-001-1731801600000",
  "complianceScore": 99.5,
  "status": "created",
  "sessionId": "tim-session-1731801600000-abc123def456"
}
```

**Compliance Checks:**
- ✅ Email anonymized: `h***@g***.com`
- ✅ User config encrypted
- ✅ Context sources encrypted
- ✅ PII redacted
- ✅ Score: 99.5% (≥98% required)

---

### **Step 2: Browser Automation (AI Assistant)**

Now I (AI assistant) will execute the test using MCP browser tools:

#### **2.1: Navigate to Platform**

```typescript
await browser_navigate({ 
  url: 'http://localhost:3000/chat' 
});

// Wait for page load
await browser_wait_for({ time: 2 });
```

#### **2.2: Capture Initial State**

```typescript
// Take screenshot of login/landing page
await browser_take_screenshot({ 
  filename: 'tim-step-1-landing.png',
  fullPage: true 
});

// Get accessibility snapshot
const snapshot = await browser_snapshot();
// I can see: buttons, inputs, text, structure

// Capture console
const consoleLogs = await browser_console_messages();
```

#### **2.3: Simulate User Login**

```typescript
// Note: In real scenario, we'd use test authentication
// For now, we'll note this would happen

console.log('🔐 Test authentication would occur here');
```

#### **2.4: Navigate to Agent**

```typescript
// Click on "Agente de Hello" in sidebar
await browser_click({ 
  element: 'Agent: Agente de Hello',
  ref: '[ref from snapshot]'
});

await browser_wait_for({ time: 1 });

// Screenshot after agent selected
await browser_take_screenshot({ 
  filename: 'tim-step-2-agent-selected.png' 
});
```

#### **2.5: Type Message**

```typescript
await browser_type({ 
  element: 'message input textarea',
  ref: '[ref from snapshot]',
  text: 'Hello, can you help me?'
});

// Screenshot with message typed
await browser_take_screenshot({ 
  filename: 'tim-step-3-message-typed.png' 
});
```

#### **2.6: Click Send & Capture Error**

```typescript
// Click Send button
await browser_click({ 
  element: 'Send button',
  ref: '[ref from snapshot]'
});

// Wait for response or error
await browser_wait_for({ time: 3 });

// Capture state after click
await browser_take_screenshot({ 
  filename: 'tim-step-4-after-send.png' 
});

// Capture all diagnostics
const finalConsoleLogs = await browser_console_messages();
const networkRequests = await browser_network_requests();

// Measure performance
const metrics = await browser_evaluate({
  function: `() => ({
    loadTime: performance.timing.loadEventEnd - performance.timing.navigationStart,
    domReady: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart,
    memoryUsage: performance.memory?.usedJSHeapSize || 0
  })`
});
```

---

### **Step 3: Captured Data Example**

**Console Logs:**
```
[ERROR] Failed to send message: Network error
[ERROR] POST /api/conversations/conv-123/messages 401 Unauthorized
[WARN] Session may have expired
[LOG] Retrying authentication...
[ERROR] Authentication failed: Invalid token
```

**Network Requests:**
```
POST /api/conversations/conv-123/messages
  Status: 401 Unauthorized
  Duration: 234ms
  Response: {"error": "Invalid session token"}

GET /api/user-settings?userId=116745562509015715931
  Status: 200 OK
  Duration: 156ms
```

**Screenshots:**
- `tim-step-1-landing.png` - Login page
- `tim-step-2-agent-selected.png` - Agent loaded
- `tim-step-3-message-typed.png` - Message ready
- `tim-step-4-after-send.png` - Error state

**Performance:**
```
Load Time: 1,234ms
DOM Ready: 890ms
Memory: 45.6MB
API Latency: 234ms
```

---

### **Step 4: AI Analysis**

Gemini Pro analyzes all captured data:

```json
{
  "rootCause": "Session token expired. The flow_session cookie is missing or invalid, causing 401 Unauthorized errors on message send API calls.",
  
  "reproducible": true,
  
  "severity": "high",
  
  "affectedUsers": "Users with expired sessions (>7 days idle)",
  
  "recommendedFix": "1. Implement session refresh mechanism. 2. Add clear session expiration messaging. 3. Automatic redirect to login on 401. Specific changes: Add middleware to check token validity before API calls, extend session on user activity, show 'Session expired' message with login button.",
  
  "estimatedEffort": "4 hours (2h middleware + 1h UI + 1h testing)",
  
  "confidence": 95
}
```

---

### **Step 5: Insight Routing**

**✅ User** (hello@getaifactory.com)
```
Notification:
"Your issue has been analyzed by Tim!

Root Cause: Session token expired
Fix: We're implementing session refresh
Timeline: 4 hours

View full report: /tickets/ticket-20251116-001"
```

**✅ Ally** (Personal Agent)
```
Context Update:
"User experienced session expiration causing message send failures. 
Recommend: Notify user of session state, suggest re-login if inactive >6 days."
```

**✅ Stella** (Product Agent)
```
Product Insight:
Category: UX Bug
Impact: High severity, affects users with expired sessions
Recommendation: Add session refresh + clear expiration messaging
Evidence: 4 screenshots showing error state
```

**✅ Rudy** (Roadmap Agent)
```
Roadmap Input:
Priority: HIGH
Impact: Users with expired sessions cannot send messages
Effort: 4 hours
Recommendation: Add to next sprint
```

**✅ Admin** (Organization Level)
```
Notification:
"Pattern detected in your organization:
3 users affected by session expiration in last 7 days.

Action: Review session timeout settings."
```

---

## 📊 **Expected Outcomes**

### **Immediate (User)**
- ✅ Clear understanding of problem
- ✅ Expected timeline for fix
- ✅ Workaround suggested (re-login)
- ✅ Increased trust (AI reproduced their issue)

### **Short-term (Dev Team)**
- ✅ Precise root cause identified
- ✅ Specific fix recommended
- ✅ Effort estimated accurately
- ✅ Evidence provided (screenshots, logs)

### **Long-term (Platform)**
- ✅ Pattern recognition across users
- ✅ Proactive issue detection
- ✅ Continuous improvement
- ✅ Reduced manual debugging time

---

## 🎯 **Success Metrics**

### **For This Demo**
- [ ] Digital twin created with ≥98% compliance
- [ ] All reproduction steps executed
- [ ] Console logs captured (should show errors)
- [ ] Network requests captured (should show 401)
- [ ] Screenshots taken at each step
- [ ] AI analysis identified "session expiration"
- [ ] Insights routed to 5 recipients
- [ ] User can view privacy ledger

### **Quality Checks**
- [ ] No actual user data exposed
- [ ] All PII anonymized/encrypted
- [ ] Complete audit trail
- [ ] Actionable recommendations
- [ ] Reproducible issue confirmed

---

## 💡 **Next: Run This Demo**

To execute this demo, the AI assistant (me) needs:

1. **Access to localhost:3000** (or production URL)
2. **Session token** for authenticated API calls
3. **Permission to use browser tools**

Then I can:
- Create the digital twin
- Execute browser automation
- Capture all diagnostics
- Generate AI analysis
- Route insights

**Ready to run? Say: "Run the Tim demo on localhost:3000"** 🚀

