# 🧪 Testing Guide - Modular Platform

**How to test at every stage: Planning → Implementation → Production**

---

## 🎯 Current Stage: Planning Complete

**What we have now:**
- ✅ Strategic plans (5 documents)
- ✅ TypeScript types (`src/types/tiers.ts`)
- ✅ Tier configurations (`src/config/tiers.ts`)
- ⬜ Implementation (Phases 1-7 not built yet)

**What you can test NOW:**
1. ✅ Review type definitions
2. ✅ Validate tier configurations
3. ✅ Verify backward compatibility approach
4. ✅ Test pricing calculations

**What you'll test LATER** (as we implement):
- Week 2: Tier system enforcement
- Week 4: Trial signup flow
- Week 6: Ally Personal features
- Week 8: Team collaboration
- Week 12: Complete platform

---

## 🧪 Phase 0: Testing the Plan (NOW)

### **Test 1: Validate Type Definitions**

**Purpose:** Ensure TypeScript types are correct

```bash
# Run type checker
npm run type-check

# Expected output:
# ✅ No errors
# Files checked:
#   - src/types/tiers.ts
#   - src/config/tiers.ts
```

**What to verify:**
- [ ] No TypeScript errors
- [ ] All types properly exported
- [ ] Types match strategic plan
- [ ] Helper types complete

**Result:** ✅ **PASSED** (verified - no linter errors)

---

### **Test 2: Validate Tier Configurations**

**Purpose:** Ensure tier limits and pricing are correct

```bash
# Create test script
npx tsx -e "
import { ALL_TIERS, calculateMonthlyPrice, formatPrice } from './src/config/tiers.js';

console.log('🧪 Testing Tier Configurations\n');

// Test each tier
Object.values(ALL_TIERS).forEach(tier => {
  console.log(\`\n📋 \${tier.name} (\${tier.id}):\`);
  console.log(\`   Monthly: \${formatPrice(tier.pricing.monthlyBase)}\`);
  console.log(\`   Max users: \${tier.limits.maxUsers === -1 ? 'Unlimited' : tier.limits.maxUsers}\`);
  console.log(\`   Max agents: \${tier.limits.maxAgents === -1 ? 'Unlimited' : tier.limits.maxAgents}\`);
  console.log(\`   Token quota: \${tier.limits.monthlyTokenQuota === -1 ? 'Unlimited' : tier.limits.monthlyTokenQuota.toLocaleString()}\`);
  console.log(\`   Ally version: \${tier.limits.allyVersion}\`);
});

// Test pricing calculations
console.log('\n💰 Pricing Calculations:\n');
console.log('Solo (monthly):', formatPrice(calculateMonthlyPrice('solo', 1, 'monthly')));
console.log('Solo (annual):', formatPrice(calculateMonthlyPrice('solo', 1, 'annual')));
console.log('Team 2 users (monthly):', formatPrice(calculateMonthlyPrice('team', 2, 'monthly')));
console.log('Team 7 users (monthly):', formatPrice(calculateMonthlyPrice('team', 7, 'monthly')));

console.log('\n✅ All tier configurations valid!');
process.exit(0);
"
```

**Expected output:**
```
🧪 Testing Tier Configurations

📋 Spark (spark):
   Monthly: $0.00
   Max users: 1
   Max agents: 5
   Token quota: 1,000,000
   Ally version: lite

📋 Solo (solo):
   Monthly: $29.00
   Max users: 1
   Max agents: 25
   Token quota: 5,000,000
   Ally version: personal

📋 Team (team):
   Monthly: $99.00
   Max users: 7
   Max agents: 100
   Token quota: 20,000,000
   Ally version: team

📋 Enterprise (enterprise):
   Monthly: $2,500.00
   Max users: Unlimited
   Max agents: Unlimited
   Token quota: Unlimited
   Ally version: enterprise

💰 Pricing Calculations:

Solo (monthly): $29.00
Solo (annual): $24.17
Team 2 users (monthly): $118.00
Team 7 users (monthly): $213.00

✅ All tier configurations valid!
```

**What to verify:**
- [ ] Prices match strategic plan
- [ ] Limits match feature matrix
- [ ] Annual discount calculated correctly (17%)
- [ ] Per-user pricing works (Team tier)

---

### **Test 3: Review Strategic Alignment**

**Purpose:** Ensure documents align with existing rules

**Checklist:**

```bash
# 1. Check alignment with privacy.mdc
grep -n "User Data Isolation" docs/MODULAR_PLATFORM_ARCHITECTURE.md
grep -n "GDPR" docs/MODULAR_PLATFORM_ARCHITECTURE.md
# ✅ Should find: Complete privacy guarantees per tier

# 2. Check alignment with organizations.mdc  
grep -n "Multi-org" docs/MODULAR_PLATFORM_ARCHITECTURE.md
grep -n "Organization Isolation" docs/MODULAR_PLATFORM_ARCHITECTURE.md
# ✅ Should find: Enterprise tier includes multi-org

# 3. Check backward compatibility
grep -n "Backward Compatible" docs/MODULARIZATION_IMPLEMENTATION_PLAN.md
grep -n "additive" docs/MODULAR_PLATFORM_ARCHITECTURE.md
# ✅ Should find: All changes are additive

# 4. Check existing features preserved
grep -n "existing" docs/MODULARIZATION_IMPLEMENTATION_PLAN.md
# ✅ Should find: All existing functionality preserved
```

**What to verify:**
- [ ] Privacy principles maintained
- [ ] Multi-org architecture leveraged
- [ ] No breaking changes proposed
- [ ] Existing users protected (grandfathering)

---

### **Test 4: Financial Model Validation**

**Purpose:** Verify revenue projections are realistic

**Create spreadsheet test:**

```typescript
// test-financial-model.ts
interface FinancialModel {
  month: number;
  trialSignups: number;
  trialToSolo: number;  // Conversion %
  soloToTeam: number;   // Conversion %
  teamToEnterprise: number; // Conversion %
  
  soloCustomers: number;
  teamCustomers: number;
  enterpriseCustomers: number;
  
  mrr: number;
}

// Month-by-month projection
const projections: FinancialModel[] = [];

// Conservative assumptions
const TRIAL_TO_SOLO = 0.30;      // 30%
const SOLO_TO_TEAM = 0.10;       // 10%
const TEAM_TO_ENTERPRISE = 0.20; // 20%

for (let month = 1; month <= 24; month++) {
  // Trial signups (ramp up)
  const trials = month <= 2 ? 50 : 
                 month <= 6 ? 100 : 
                 150;
  
  // Conversions (with delay)
  const newSolo = month > 1 ? trials * TRIAL_TO_SOLO : 0;
  const newTeam = month > 3 ? projections[month-3].soloCustomers * SOLO_TO_TEAM / 12 : 0;
  const newEnterprise = month > 6 ? projections[month-6].teamCustomers * TEAM_TO_ENTERPRISE / 12 : 0;
  
  // Cumulative customers (with churn)
  const churnRate = 0.05; // 5% monthly churn
  const soloCustomers = month === 1 ? 0 : 
    (projections[month-2].soloCustomers * (1 - churnRate)) + newSolo;
  const teamCustomers = month === 1 ? 0 :
    (projections[month-2].teamCustomers * (1 - churnRate)) + newTeam;
  const enterpriseCustomers = month === 1 ? 0 :
    (projections[month-2].enterpriseCustomers * (1 - churnRate)) + newEnterprise;
  
  // Revenue
  const soloMRR = soloCustomers * 29;
  const teamMRR = teamCustomers * 200; // Avg 5 users
  const enterpriseMRR = enterpriseCustomers * 3500; // Avg contract
  const totalMRR = soloMRR + teamMRR + enterpriseMRR;
  
  projections.push({
    month,
    trialSignups: trials,
    trialToSolo: TRIAL_TO_SOLO,
    soloToTeam: SOLO_TO_TEAM,
    teamToEnterprise: TEAM_TO_ENTERPRISE,
    soloCustomers: Math.floor(soloCustomers),
    teamCustomers: Math.floor(teamCustomers),
    enterpriseCustomers: Math.floor(enterpriseCustomers),
    mrr: Math.floor(totalMRR),
  });
}

// Output
console.log('📊 Financial Model Test\n');
console.log('Assumptions:');
console.log(`  Trial → Solo: ${TRIAL_TO_SOLO * 100}%`);
console.log(`  Solo → Team: ${SOLO_TO_TEAM * 100}%`);
console.log(`  Team → Enterprise: ${TEAM_TO_ENTERPRISE * 100}%`);
console.log(`  Churn: 5% monthly\n`);

console.log('Month 6:', projections[5]);
console.log('Month 12:', projections[11]);
console.log('Month 24:', projections[23]);

console.log(`\n🎯 Month 12 MRR: $${projections[11].mrr.toLocaleString()}`);
console.log(`🎯 Month 24 MRR: $${projections[23].mrr.toLocaleString()}`);
```

**What to verify:**
- [ ] Month 12 MRR ≈ $13K (matches plan)
- [ ] Month 24 MRR ≈ $58K (matches plan)
- [ ] Growth curve realistic
- [ ] Conversion rates achievable

---

## 🧪 Phase 1: Testing Foundation (Week 2)

**Once Phase 1 is implemented, test:**

### **Test 1: Tier Detection**

```bash
# Start dev server
npm run dev

# Test tier detection in browser console
```

```typescript
// In browser console (localhost:3000/chat)

// 1. Check current user tier
const user = await fetch('/api/users/me').then(r => r.json());
console.log('Current tier:', user.tier);
// Expected: 'solo' or 'enterprise' (existing users auto-assigned)

// 2. Check tier config
const config = await fetch('/api/tiers/solo').then(r => r.json());
console.log('Solo tier config:', config);
// Expected: Matches SOLO_TIER in src/config/tiers.ts

// 3. Test tier limits
const limits = config.limits;
console.log('Max agents:', limits.maxAgents);
// Expected: 25 (for Solo)
```

**What to verify:**
- [ ] User has assigned tier
- [ ] Tier config loads correctly
- [ ] Limits match configuration
- [ ] No errors in console

---

### **Test 2: Feature Flags**

```typescript
// In browser console

// 1. Check feature availability
const hasAPI = await fetch('/api/features/api-access').then(r => r.json());
console.log('API access:', hasAPI);
// Expected: { enabled: true } for Solo+

// 2. Check A/B test assignment
const variant = await fetch('/api/features/experiment/new-onboarding').then(r => r.json());
console.log('Onboarding variant:', variant);
// Expected: 'control' or 'variant-a' or 'variant-b'

// 3. Test progressive rollout
const wellness = await fetch('/api/features/ally-wellness').then(r => r.json());
console.log('Wellness feature:', wellness);
// Expected: May be enabled/disabled based on rollout %
```

**What to verify:**
- [ ] Features gate correctly per tier
- [ ] A/B tests assign consistently (same user = same variant)
- [ ] Progressive rollout percentage respected

---

### **Test 3: Module Loading**

```typescript
// In browser console

// 1. Check loaded modules
const modules = window.__FLOW_MODULES__;
console.log('Loaded modules:', modules);
// Expected: Array of module IDs matching tier

// Example for Solo tier:
// ['core-auth', 'data-layer', 'ai-orchestration', 
//  'chat-interface', 'ally-personal', 'calendar', 'finance']

// 2. Verify tier-specific modules
const hasCal = modules.includes('calendar');
const hasTeam = modules.includes('team-collaboration');
console.log('Calendar module:', hasCal); // ✅ true (Solo+)
console.log('Team module:', hasTeam);    // ❌ false (Team+ only)

// 3. Check module dependencies resolved
const deps = window.__MODULE_DEPENDENCIES__;
console.log('Dependencies satisfied:', deps.every(d => d.satisfied));
// Expected: true (all dependencies loaded)
```

**What to verify:**
- [ ] Correct modules loaded for tier
- [ ] No missing dependencies
- [ ] No extra modules (locked features)
- [ ] Loading time acceptable (<2s)

---

### **Test 4: Backward Compatibility**

```bash
# 1. Test with existing user (before migration)
# - Login as existing user (alec@getaifactory.com)
# - Verify: All features still work
# - Verify: Tier auto-assigned (should be 'enterprise')
# - Verify: No features locked
# - Verify: No data lost

# 2. Test all existing flows
# - Create agent (should work)
# - Upload context (should work)
# - Send message (should work)
# - Switch agents (should work)
# - Everything as before ✅

# 3. Check console for errors
# - Should see: "✅ Tier assigned: enterprise"
# - Should NOT see: any errors or warnings

# 4. Verify database unchanged
npx tsx -e "
import { firestore } from './src/lib/firestore.js';

const users = await firestore.collection('users').limit(5).get();
users.docs.forEach(doc => {
  const data = doc.data();
  console.log('User:', data.email);
  console.log('  Has tier?', 'tier' in data);
  console.log('  Tier value:', data.tier || 'not assigned yet');
});
process.exit(0);
"
```

**What to verify:**
- [ ] Existing users keep all access
- [ ] No features broken
- [ ] Auto-tier assignment works
- [ ] Grandfathered pricing applied
- [ ] All data preserved

**Critical:** If ANY existing feature breaks → STOP, fix before proceeding

---

## 🧪 Phase 2: Testing Trial Flow (Week 4)

**Once signup wizard implemented:**

### **Test 1: Signup to First Conversation**

**Goal:** <2 minutes from click to value

**Procedure:**
```bash
# 1. Open incognito browser (clean state)
open -na "Google Chrome" --args --incognito http://localhost:3000

# 2. Click "Start Free Trial"
# 3. Start timer ⏱️

# Steps (user performs):
# - Sign in with Google (OAuth)
# - Brief wizard (name, use case - optional)
# - Click "Get Started"

# System should:
# - Provision account (behind the scenes)
# - Show progress: "Setting up your workspace..."
# - Redirect to chat interface
# - Ally greets: "Welcome! I'm Ally, your AI companion."

# 4. User sends first message: "Hello"
# 5. Ally responds
# 6. Stop timer ⏱️

# Target: <2 minutes total
```

**Measure:**
- [ ] Signup completion time
- [ ] Provisioning time (<60s)
- [ ] Time to first AI response
- [ ] Total time <2 minutes ✅

**Data to collect:**
```typescript
{
  signupStarted: timestamp,
  oauthCompleted: timestamp,
  provisioningStarted: timestamp,
  provisioningCompleted: timestamp,
  firstMessageSent: timestamp,
  firstResponseReceived: timestamp,
  totalTime: duration,
  targetMet: totalTime < 120000 // 2 minutes in ms
}
```

---

### **Test 2: Trial Limits Enforcement**

**Goal:** Verify Spark tier limits enforced

```typescript
// In browser (as trial user)

// 1. Create agents until limit
for (let i = 1; i <= 6; i++) {
  const response = await fetch('/api/agents', {
    method: 'POST',
    body: JSON.stringify({ name: `Agent ${i}` })
  });
  const data = await response.json();
  
  if (i <= 5) {
    console.log(`✅ Agent ${i} created`);
  } else {
    console.log('❌ Expected error:', data.error);
    // Expected: "Tier limit reached: Max 5 agents for Spark tier"
  }
}

// 2. Try to access locked features
const apiAccess = await fetch('/api/v1/agents').then(r => r.json());
console.log('API access:', apiAccess.error);
// Expected: "Feature not available in your tier. Upgrade to Solo for API access."

// 3. Try to upload large file
const largeFile = new File([new Blob(['x'.repeat(60 * 1024 * 1024)])], 'large.pdf');
const upload = await uploadFile(largeFile);
// Expected: Error "File too large: 60MB. Max for Spark tier: 50MB"
```

**What to verify:**
- [ ] Cannot create more than 5 agents
- [ ] Cannot upload files >50MB
- [ ] Cannot access API endpoints
- [ ] Error messages suggest upgrade
- [ ] Limits match tier config exactly

---

### **Test 3: Trial Lifecycle**

**Goal:** Verify archival and deletion automation

**Setup (accelerated timeline for testing):**
```typescript
// src/lib/tier-manager.ts (add test mode)
const TRIAL_DURATION = process.env.TEST_MODE === 'true' 
  ? 60 * 1000        // 1 minute (for testing)
  : 30 * 24 * 60 * 60 * 1000; // 30 days (production)
```

**Test procedure:**
```bash
# 1. Create trial user (test mode)
TEST_MODE=true npm run dev

# 2. Create trial account
# - Sign up
# - Create 2 agents
# - Send 10 messages

# 3. Wait 1 minute (trial expires)

# 4. Verify archival
# - Try to create new agent → Should fail
# - Try to send message → Should fail
# - Can still VIEW conversations ✅
# - Can export data ✅
# - Sees "Upgrade to continue" banner

# 5. Test upgrade path
# - Click "Upgrade to Solo"
# - Complete payment (use Stripe test mode)
# - Verify: All data restored
# - Verify: Can create agents again
# - Verify: Tier changed to 'solo'
```

**What to verify:**
- [ ] Trial expires on schedule
- [ ] Archived = read-only access
- [ ] Export always available
- [ ] Upgrade restores full access
- [ ] No data lost during transition

---

## 🧪 Phase 3: Testing Ally Personal (Week 6)

**Once Ally Personal implemented:**

### **Test 1: Calendar Integration**

```typescript
// 1. Connect Google Calendar
// - Go to Settings → Ally → Calendar
// - Click "Connect Google Calendar"
// - Authorize OAuth scopes
// - Verify: "✅ Connected to Google Calendar"

// 2. Test schedule analysis
const analysis = await fetch('/api/ally/calendar/analyze').then(r => r.json());
console.log('Schedule analysis:', analysis);
/*
Expected output:
{
  totalMeetings: 23,
  meetingHours: 12.5,
  focusTimeHours: 8.5,
  recommendations: [
    "You have 3 consecutive meetings on Tuesday - suggest breaks",
    "Thursday morning is your most productive time - block for deep work",
    "5 meetings could be emails - consider declining"
  ]
}
*/

// 3. Test auto-scheduling
const optimized = await fetch('/api/ally/calendar/optimize', {
  method: 'POST',
  body: JSON.stringify({ task: 'Deep work on project X', duration: 120 })
}).then(r => r.json());

console.log('Ally scheduled:', optimized);
// Expected: Suggested time slot in calendar (not yet booked)

// 4. Verify in Google Calendar
// - Open Google Calendar
// - Check if Ally's suggestion makes sense
// - User can approve or reject
```

**What to verify:**
- [ ] OAuth flow works (Google Calendar)
- [ ] Calendar events read correctly
- [ ] Analysis insights are relevant
- [ ] Suggestions make sense
- [ ] Integration doesn't break on errors

---

### **Test 2: Financial Tracking**

```typescript
// 1. Add expense
const expense = await fetch('/api/ally/finance/expense', {
  method: 'POST',
  body: JSON.stringify({
    amount: 47.50,
    description: 'Lunch with client',
    date: new Date()
  })
}).then(r => r.json());

// 2. Check categorization (AI-powered)
console.log('Category:', expense.category);
// Expected: 'Business meal' or 'Client entertainment' (AI inferred)

// 3. Get budget status
const budget = await fetch('/api/ally/finance/budget').then(r => r.json());
console.log('Budget status:', budget);
/*
Expected:
{
  monthly: {
    budget: 2000,
    spent: 1523,
    remaining: 477,
    categories: {
      'meals': { budget: 500, spent: 347, percentage: 69 },
      'transport': { budget: 300, spent: 180, percentage: 60 },
      ...
    }
  },
  alerts: [
    "Meals budget at 69% - on track",
    "Office supplies over budget by $23"
  ]
}
*/

// 4. Get ROI calculation
const roi = await fetch('/api/ally/finance/roi?project=client-x').then(r => r.json());
console.log('Project ROI:', roi);
// Expected: Revenue vs expenses, profit margin, ROI %
```

**What to verify:**
- [ ] Expense entry works
- [ ] AI categorization accurate
- [ ] Budget tracking functional
- [ ] Alerts fire correctly
- [ ] ROI calculations make sense

---

### **Test 3: Personal Profile Portability**

**Goal:** Verify personal data exports and can be imported to new account

```bash
# Scenario: User changes jobs

# 1. As user with Solo tier (old job)
# - Login as user-old@oldcompany.com
# - Use for 3 months (lots of data)
# - Learning journal: 50 lessons
# - Wellness data: 90 days

# 2. Export personal profile
# - Settings → Ally → Personal Profile
# - Click "Export My Personal Data"
# - Download: personal-profile-2025-11-16.json

# 3. Create new account (new job)
# - Logout
# - Signup with user-new@newcompany.com
# - Complete onboarding

# 4. Import personal profile
# - Settings → Ally → Import Personal Data
# - Upload: personal-profile-2025-11-16.json
# - Verify: Learning journal restored ✅
# - Verify: Wellness patterns restored ✅
# - Verify: NO business data imported (correct!)

# 5. Verify separation
# - Old account: Business data intact (if still accessible)
# - New account: Only personal data imported
# - No company secrets leaked ✅
```

**What to verify:**
- [ ] Export includes only personal data
- [ ] Export excludes business/company data
- [ ] Import works to new account
- [ ] Learning journal preserved
- [ ] Wellness patterns transferred
- [ ] Privacy maintained (no leaks)

**Critical:** This is a UNIQUE feature - test thoroughly!

---

## 🧪 Phase 4: Testing Team Collaboration (Week 8)

**Once team features implemented:**

### **Test 1: Team Creation (Dunbar Limit)**

```typescript
// 1. Create team (as owner)
const team = await fetch('/api/teams', {
  method: 'POST',
  body: JSON.stringify({ name: 'Test Team' })
}).then(r => r.json());

// 2. Invite users (up to 7)
for (let i = 1; i <= 8; i++) {
  const invite = await fetch(`/api/teams/${team.id}/invite`, {
    method: 'POST',
    body: JSON.stringify({ email: `user${i}@test.com` })
  }).then(r => r.json());
  
  if (i <= 6) {
    console.log(`✅ User ${i} invited (${i+1}/7 total)`);
  } else {
    console.log(`❌ Expected error:`, invite.error);
    // Expected: "Team limit reached: Max 7 users for Team tier"
  }
}

// 3. Verify UI shows limit
// - Team members list shows "6/7"
// - Invite button active
// - Add 7th member
// - Invite button disabled
// - Message: "Team full (7/7) - Upgrade to Enterprise for unlimited users"
```

**What to verify:**
- [ ] Cannot exceed 7 users
- [ ] UI reflects limit clearly
- [ ] Error messages helpful
- [ ] Upgrade path suggested

---

### **Test 2: Shared Agents (Real-time)**

**Setup:** 2 browser windows (2 team members)

```bash
# Window 1: Team owner (user1@test.com)
# Window 2: Team member (user2@test.com)

# Test procedure:
# 1. Window 1: Create shared agent
#    - Name: "Customer Support Bot"
#    - Toggle: "Share with team" ON

# 2. Window 2: Should see agent appear (real-time)
#    - Check sidebar: New agent appears
#    - No refresh needed ✅

# 3. Window 2: Send message to shared agent
#    - Message: "What's our return policy?"

# 4. Window 1: Should see message in activity feed
#    - Activity: "User2 sent message to Customer Support Bot"

# 5. Window 1: Add context to shared agent
#    - Upload: "return-policy.pdf"

# 6. Window 2: Should see new context available
#    - Context panel updates (real-time)
#    - PDF appears in shared agent context

# 7. Both windows: Send concurrent messages
#    - Window 1: "Question A"
#    - Window 2: "Question B" (same time)
#    - Both should work ✅
#    - No conflicts
```

**What to verify:**
- [ ] Real-time updates work (WebSocket or polling)
- [ ] No race conditions
- [ ] Concurrent edits handled
- [ ] Activity feed accurate
- [ ] Permissions respected

---

### **Test 3: Ally Team Coordination**

```typescript
// 1. Team standup (automated by Ally)
const standup = await fetch('/api/ally/team/standup').then(r => r.json());
console.log('Team standup:', standup);
/*
Expected:
{
  date: '2025-11-16',
  team: 'Test Team',
  members: 7,
  summary: {
    yesterday: [
      "User1: Completed feature X, started feature Y",
      "User2: Reviewed 3 PRs, fixed 2 bugs",
      ...
    ],
    today: [...],
    blockers: [
      "User3: Waiting for API key from client"
    ]
  },
  recommendations: [
    "User3 is blocked - User1 can help (has client contact)",
    "User5 and User6 working on similar issues - suggest pairing"
  ]
}
*/

// 2. Load balancing
const balance = await fetch('/api/ally/team/load-balance').then(r => r.json());
console.log('Load balance:', balance);
/*
Expected:
{
  overloaded: ['User1', 'User4'],
  underutilized: ['User6'],
  recommendations: [
    "Shift task X from User1 to User6",
    "User4: Decline low-priority meeting to reduce load"
  ]
}
*/

// 3. Meeting prep (all attendees)
const prep = await fetch('/api/ally/team/meeting/prep', {
  method: 'POST',
  body: JSON.stringify({ meetingId: 'cal-event-123' })
}).then(r => r.json());

console.log('Meeting prep:', prep);
// Expected: Agenda, background context, action items for each attendee
```

**What to verify:**
- [ ] Standup summary accurate
- [ ] Load balancing insights helpful
- [ ] Meeting prep relevant
- [ ] All team members benefit
- [ ] Ally coordination feels natural

---

## 🧪 Phase 5: Testing Developer Ecosystem (Week 10)

**Once SDK published:**

### **Test 1: SDK Installation & Usage**

```bash
# 1. Create test project
mkdir flow-sdk-test
cd flow-sdk-test
npm init -y

# 2. Install SDK
npm install @flow-ai/sdk

# 3. Test authentication
cat > test-sdk.ts << 'EOF'
import { FlowSDK } from '@flow-ai/sdk';

const flow = new FlowSDK({
  apiKey: process.env.FLOW_API_KEY,
  environment: 'production'
});

async function test() {
  try {
    // Test connection
    const auth = await flow.auth.verify();
    console.log('✅ Authenticated:', auth.user.email);
    
    // Test stats
    const stats = await flow.analytics.getUsageStats({ days: 7 });
    console.log('✅ Usage stats:', stats);
    
    // Test agent creation
    const agent = await flow.agents.create({
      name: 'Test Agent from SDK',
      model: 'flash',
      systemPrompt: 'You are a helpful assistant.'
    });
    console.log('✅ Agent created:', agent.id);
    
    // Test sending message
    const message = await flow.conversations.sendMessage(agent.id, {
      content: 'Hello from SDK!'
    });
    console.log('✅ Message sent:', message.id);
    
    // Cleanup
    await flow.agents.delete(agent.id);
    console.log('✅ Agent deleted');
    
    console.log('\n🎉 All SDK tests passed!');
    
  } catch (error) {
    console.error('❌ SDK test failed:', error);
    process.exit(1);
  }
}

test();
EOF

# 4. Run test
npx tsx test-sdk.ts

# Expected: All ✅ checks pass
```

**What to verify:**
- [ ] NPM package installs correctly
- [ ] TypeScript types included
- [ ] Authentication works
- [ ] All methods functional
- [ ] Error handling works
- [ ] Documentation matches reality

---

### **Test 2: NPX Template**

```bash
# 1. Create from template
npx create-flow-chatbot test-bot

# Interactive prompts:
? Bot name: Test Support Bot
? Use case: Customer service
? Deploy now? No (test locally first)

# Expected output:
Creating your Flow chatbot...
✅ Template cloned
✅ Dependencies installed
✅ Configuration created
✅ Sample data seeded

Your chatbot is ready!

  cd test-bot
  npm run dev         # Test locally
  npm run deploy      # Deploy to production

# 2. Test locally
cd test-bot
npm run dev

# 3. Verify in browser
open http://localhost:3000

# Expected:
# - Chatbot interface loads
# - Sample agent configured
# - Can send messages
# - Responds correctly

# 4. Check generated code
ls -la
# Expected files:
#   package.json
#   src/
#   .env.example
#   README.md
#   deployment/
#   docs/
```

**What to verify:**
- [ ] Template creates successfully
- [ ] All dependencies install
- [ ] Local dev server works
- [ ] Sample data appropriate
- [ ] Documentation clear
- [ ] Deploy scripts included

---

### **Test 3: Cursor Template**

```bash
# Setup (in Cursor workspace)
# 1. Install Cursor template package
npm install -g @flow-ai/cursor-template

# 2. Configure Cursor to recognize template
# - Add to Cursor settings
# - Restart Cursor

# Test in Cursor:
# 1. Open Cursor
# 2. Cmd+K (or Ctrl+K)
# 3. Type: "Create Flow Platform for Acme Corp"

# Cursor should:
# - Recognize template
# - Ask configuration questions:
#   ? Organization: Acme Corp
#   ? Tier: Enterprise
#   ? Infrastructure: Self-hosted
#   ? GCP Project: acme-flow-prod

# - Execute template script
# - Clone repository
# - Configure for Acme Corp
# - Show progress in Cursor

# Expected result (15 min):
# ✅ Complete platform in workspace
# ✅ Configured for Acme Corp
# ✅ Ready to deploy
# ✅ Documentation included

# 4. Verify generated code
# - Review src/config/ (should have Acme branding)
# - Review .env.example (should have Acme project ID)
# - Review docs/ (should reference Acme Corp)

# 5. Test deployment
npm run deploy:staging

# Expected: Deploys to acme-flow-prod project ✅
```

**What to verify:**
- [ ] Cursor recognizes template
- [ ] Interactive prompts work
- [ ] Configuration applied correctly
- [ ] All files generated
- [ ] Deployment works
- [ ] Time <20 minutes (setup to deployed)

---

## 🧪 Phase 6: Testing Enterprise Features (Week 12)

### **Test 1: BYOK (Bring Your Own Keys)**

```typescript
// 1. Setup (as Enterprise customer)
// - Settings → Advanced → API Keys
// - Click "Add Your Own Gemini Key"
// - Enter: AIza... (your key)
// - Save

// 2. Verify routing
const message = await sendMessage('Test with my key');

// 3. Check backend logs
// Should see:
// "✅ Using customer-provided Gemini key (org: acme-corp)"

// 4. Verify cost attribution
const costs = await fetch('/api/analytics/costs').then(r => r.json());
console.log('Costs:', costs);
/*
Expected:
{
  platform: {
    infrastructure: 250, // Cloud Run, Firestore
    overhead: 50
  },
  customer: {
    aiTokens: 0,  // Customer paid directly (BYOK)
    total: 0
  },
  attribution: 'Customer API key used - no AI costs charged to platform'
}
*/
```

**What to verify:**
- [ ] Custom keys stored securely (encrypted)
- [ ] API requests use customer key
- [ ] No platform AI costs when BYOK active
- [ ] Cost attribution correct
- [ ] Can switch back to platform keys

---

### **Test 2: A/B Testing Framework**

```typescript
// 1. Create experiment (as admin)
const experiment = await fetch('/api/admin/experiments', {
  method: 'POST',
  body: JSON.stringify({
    id: 'new-onboarding-v2',
    name: 'New Onboarding Flow',
    variants: {
      control: 50,     // 50% see current
      'variant-a': 30, // 30% see new
      'variant-b': 20  // 20% see alternative
    },
    metrics: ['signup_completion', 'time_to_first_message', 'trial_conversion']
  })
}).then(r => r.json());

// 2. Test user assignment (100 test users)
const assignments = {};
for (let i = 0; i < 100; i++) {
  const userId = `test-user-${i}`;
  const variant = await fetch(`/api/experiments/assign/${userId}/${experiment.id}`)
    .then(r => r.json());
  
  assignments[variant] = (assignments[variant] || 0) + 1;
}

console.log('Variant distribution:', assignments);
// Expected: ~50 control, ~30 variant-a, ~20 variant-b (within ±5%)

// 3. Track metrics
for (let i = 0; i < 100; i++) {
  const userId = `test-user-${i}`;
  const variant = await getUserVariant(userId, experiment.id);
  
  // Simulate user behavior (variant affects outcome)
  const completionTime = variant === 'variant-a' 
    ? 90 + Math.random() * 20   // Faster
    : 120 + Math.random() * 30; // Baseline
  
  await fetch('/api/experiments/track', {
    method: 'POST',
    body: JSON.stringify({
      userId,
      experimentId: experiment.id,
      metric: 'signup_completion',
      value: completionTime
    })
  });
}

// 4. Analyze results
const results = await fetch(`/api/experiments/${experiment.id}/results`)
  .then(r => r.json());

console.log('Experiment results:', results);
/*
Expected:
{
  control: { avg: 135, users: 50 },
  'variant-a': { avg: 100, users: 30 },  // 26% faster! ✅
  'variant-b': { avg: 140, users: 20 },
  
  winner: 'variant-a',
  confidence: 0.95,
  recommendation: 'Roll out variant-a to 100% of users'
}
*/
```

**What to verify:**
- [ ] Variant assignment consistent (same user = same variant)
- [ ] Distribution matches percentages
- [ ] Metrics tracked correctly
- [ ] Analysis detects winner
- [ ] Can roll out winner

---

### **Test 3: Traffic Splitting (Progressive Rollout)**

```bash
# Scenario: Rolling out new feature to 20% of users

# 1. Create feature flag
# src/config/feature-flags.ts
{
  'ally-wellness-v2': {
    tiers: ['solo', 'team', 'enterprise'],
    rollout: 'progressive',
    percentage: 20,  // Start with 20%
    increaseDaily: 10 // +10% per day until 100%
  }
}

# 2. Test with 100 users
for i in {1..100}; do
  curl -s "http://localhost:3000/api/features/check?userId=user-$i&feature=ally-wellness-v2"
done | grep -c "enabled: true"

# Expected: ~20 (20% of users)

# 3. Wait 1 day (or simulate)
# Set: Date + 1 day in test

# 4. Test again
# Expected: ~30 (30% of users - increased by 10%)

# 5. Monitor metrics per variant
# - Compare wellness scores: old vs new
# - Compare engagement: old vs new
# - Decide: Continue rollout or rollback
```

**What to verify:**
- [ ] Rollout percentage accurate
- [ ] Daily increase works
- [ ] Can pause/resume rollout
- [ ] Can rollback if needed
- [ ] Metrics track separately per variant

---

## 🧪 Integration Testing (All Phases)

### **Test 1: Complete User Journey (End-to-End)**

**Scenario:** User goes from trial to enterprise customer

```bash
# Day 0: Free trial
1. Sign up (incognito browser)
2. Provision (should complete in <60s)
3. First conversation
4. Create 5 agents (hit limit)
5. Upload 10 PDFs
6. Use for exploration
   → Measure: Time to first value

# Day 23: Trial warning
7. Receive email: "7 days left"
8. See banner in UI: "Trial ending soon"
9. Click "Upgrade to Solo"
10. Complete payment (Stripe test mode)
    → Measure: Upgrade conversion time

# Month 1: Solo user
11. Calendar connects (Google OAuth)
12. Ally optimizes schedule (3 meetings declined)
13. Finance tracking (50 expenses categorized)
14. Wellness monitoring (productivity patterns detected)
    → Measure: Solo feature adoption rate

# Month 3: Hire employee
15. Invite employee to platform
16. See message: "Team tier required for collaboration"
17. Upgrade to Team tier
18. Add employee (now 2/7 users)
    → Measure: Solo → Team conversion

# Month 6: Team of 5
19. All collaborating on shared agents
20. Ally Team coordinating
21. Measuring team ROI/T: 120x (above target!)
    → Measure: Team value delivered

# Month 12: Growing to 8 users
22. Try to add 8th user → Blocked
23. See: "Upgrade to Enterprise for unlimited users"
24. Contact sales (enterprise requires quote)
25. Upgrade to Enterprise
26. Now 25 users, SOC 2 needed (compliance active)
    → Measure: Team → Enterprise conversion

# Verify at each stage:
- ✅ Tier features work as expected
- ✅ Upgrade paths smooth
- ✅ No data lost in transitions
- ✅ Pricing calculated correctly
- ✅ ROI/T tracked throughout
```

**Success criteria:**
- [ ] Complete journey takes <5 minutes to test
- [ ] All transitions smooth
- [ ] No data loss
- [ ] Value clear at each tier
- [ ] Upgrade motivations compelling

---

### **Test 2: Multi-Tier Concurrent Usage**

**Setup:** 4 browser sessions (one per tier)

```bash
# Session 1: Spark user (trial)
# - Login: trial@test.com
# - Verify: 5 agent limit
# - Verify: No calendar integration
# - Verify: Trial countdown visible

# Session 2: Solo user
# - Login: solo@test.com  
# - Verify: 25 agent limit
# - Verify: Calendar integration active
# - Verify: Ally Personal features work

# Session 3: Team member
# - Login: team-member@test.com
# - Verify: Shared agents visible
# - Verify: Activity feed active
# - Verify: Team coordination features

# Session 4: Enterprise admin
# - Login: enterprise-admin@test.com
# - Verify: Unlimited agents
# - Verify: BYOK configuration available
# - Verify: Multi-org switcher visible

# Run concurrent operations:
# - All 4 users send messages simultaneously
# - All should work without interference
# - Each sees only their tier features
# - No cross-contamination
```

**What to verify:**
- [ ] Tier isolation complete
- [ ] No feature bleeding
- [ ] Performance acceptable (4 concurrent users)
- [ ] Each tier gets correct features
- [ ] No security issues

---

## 🧪 Performance Testing

### **Test 1: Provisioning Speed**

**Goal:** Trial provisioning <60 seconds

```typescript
// Automated test
async function testProvisioningSpeed() {
  const iterations = 10;
  const times = [];
  
  for (let i = 0; i < iterations; i++) {
    const start = Date.now();
    
    // Create trial user
    const user = await fetch('/api/auth/trial-signup', {
      method: 'POST',
      body: JSON.stringify({
        email: `test-${Date.now()}@test.com`,
        name: `Test User ${i}`
      })
    }).then(r => r.json());
    
    const duration = Date.now() - start;
    times.push(duration);
    
    console.log(`Trial ${i+1}: ${duration}ms`);
    
    // Cleanup
    await deleteUser(user.id);
  }
  
  const avg = times.reduce((a, b) => a + b) / times.length;
  const p95 = times.sort()[Math.floor(times.length * 0.95)];
  
  console.log(`\nProvisioning performance:`);
  console.log(`  Average: ${avg}ms`);
  console.log(`  P95: ${p95}ms`);
  console.log(`  Target: <60,000ms`);
  console.log(`  Status: ${p95 < 60000 ? '✅ PASS' : '❌ FAIL'}`);
}
```

**Target:** P95 < 60 seconds

---

### **Test 2: Module Loading Performance**

```typescript
// Test module loading impact

// 1. Measure baseline (core only)
const start = performance.now();
await loadCoreModules();
const coreTime = performance.now() - start;
console.log('Core modules:', coreTime, 'ms');

// 2. Measure each tier
const tiers = ['spark', 'solo', 'team', 'enterprise'];

for (const tier of tiers) {
  const start = performance.now();
  await loadModulesForTier(tier);
  const duration = performance.now() - start;
  
  console.log(`${tier} tier:`, duration, 'ms');
}

// Expected:
// Core: ~200ms
// Spark: ~300ms (core + ally-lite)
// Solo: ~500ms (core + ally-personal + integrations)
// Team: ~700ms (solo + collaboration + ally-team)
// Enterprise: ~1000ms (team + all advanced features)

// All should be <2s target ✅
```

**Target:** All tiers load in <2 seconds

---

## 🧪 Security Testing

### **Test 1: Tier Feature Access Control**

```typescript
// Attempt to access features not in tier

// As Spark user (trial):
const tests = [
  {
    feature: 'Create 6th agent',
    endpoint: 'POST /api/agents',
    expected: 403,
    message: 'Tier limit reached'
  },
  {
    feature: 'API access',
    endpoint: 'GET /api/v1/agents',
    expected: 403,
    message: 'Feature not available'
  },
  {
    feature: 'Calendar integration',
    endpoint: 'POST /api/ally/calendar/connect',
    expected: 403,
    message: 'Upgrade to Solo required'
  },
];

for (const test of tests) {
  const response = await fetch(test.endpoint);
  
  console.assert(
    response.status === test.expected,
    `${test.feature}: Expected ${test.expected}, got ${response.status}`
  );
  
  const data = await response.json();
  console.assert(
    data.error.includes(test.message),
    `Wrong error message for ${test.feature}`
  );
}

console.log('✅ All security tests passed');
```

**What to verify:**
- [ ] Cannot access higher-tier features
- [ ] Helpful error messages (not just "Forbidden")
- [ ] Suggests upgrade path
- [ ] No security bypasses

---

### **Test 2: Data Isolation (Across Tiers)**

```bash
# Setup: 4 users (one per tier)

# Test cross-tier data access:
# 1. Spark user tries to access Solo user's agents
curl -H "Cookie: spark_session_token" \
  "http://localhost:3000/api/agents?userId=solo-user-id"

# Expected: HTTP 403 Forbidden ✅

# 2. Team member tries to access Enterprise org
curl -H "Cookie: team_session_token" \
  "http://localhost:3000/api/organizations/enterprise-org-id"

# Expected: HTTP 403 Forbidden ✅

# 3. Solo user tries to use Team API endpoint
curl -H "Cookie: solo_session_token" \
  -X POST "http://localhost:3000/api/teams"

# Expected: HTTP 403 "Team tier required" ✅
```

**Critical:** Each tier must be completely isolated (like multi-tenant security)

---

## 🧪 Compliance Testing

### **Test 1: GDPR Compliance (All Tiers)**

**Procedure:**

```bash
# 1. Right to Access (export data)
# - Login as user
# - Settings → Privacy → Export My Data
# - Click "Export"
# - Download JSON file
# - Verify: Contains all user data (conversations, messages, settings)
# - Verify: Readable format
# - Time: <30 seconds for export ✅

# 2. Right to Rectification (edit data)
# - Edit agent name, system prompt
# - Edit user profile
# - Verify: Changes saved
# - Verify: Audit log created

# 3. Right to Erasure (delete account)
# - Settings → Account → Delete Account
# - Confirm deletion
# - Verify: 30-day recovery window message
# - Wait 30 days (or simulate)
# - Verify: Data completely deleted
# - Verify: Deletion certificate emailed

# 4. Right to Portability (export in standard format)
# - Export should be JSON (machine-readable)
# - Import to competitor should be possible (if they support)

# 5. Right to Object (opt-out)
# - Settings → Privacy → Analytics
# - Toggle: "Share usage data" OFF
# - Verify: No analytics tracking (except required audit logs)
```

**What to verify:**
- [ ] All GDPR rights supported
- [ ] Export <30 seconds
- [ ] Deletion confirmation required
- [ ] 30-day recovery window
- [ ] Audit trail complete

---

### **Test 2: SOC 2 Evidence Collection (Enterprise)**

```bash
# Automated evidence collection test

# 1. Generate evidence package
curl -X POST "http://localhost:3000/api/admin/compliance/soc2/generate-evidence" \
  -H "Authorization: Bearer admin-token" \
  > soc2-evidence.zip

# 2. Verify package contains:
unzip -l soc2-evidence.zip
# Expected files:
#   access-logs.csv (90 days)
#   encryption-evidence.pdf
#   security-incidents.csv
#   policy-compliance.pdf
#   user-access-controls.csv
#   data-retention-proof.pdf
#   backup-verification.pdf

# 3. Validate each evidence file
# - Access logs: Complete (no gaps)
# - Encryption: All data encrypted
# - Incidents: Properly documented
# - Policies: Up to date
# - Controls: All users have appropriate access
# - Retention: Matches policy
# - Backups: Tested and verified

# 4. Generate SOC 2 report
# - Should be PDF, ready for auditor
# - Should reference all evidence files
# - Should include compliance scorecard
```

**What to verify:**
- [ ] Evidence generation automated
- [ ] All required evidence present
- [ ] Evidence is current (<24h old)
- [ ] Format acceptable to auditors
- [ ] Can generate on-demand

---

## 🧪 User Acceptance Testing (UAT)

### **UAT 1: Spark Tier (Week 4)**

**Test with 10 real users** (not team members):

```
Recruit:
- 5 from target audience (professionals exploring AI)
- 5 from outside target (to test appeal)

Give them:
- Link to signup
- No instructions (measure intuitiveness)
- Survey after 7 days

Measure:
1. Signup completion rate (target: >80%)
2. Time to first conversation (target: <2 min)
3. First week engagement (target: >5 conversations)
4. Features understood (survey)
5. Willingness to pay (target: >30% say yes)

Survey questions:
- How easy was signup? (1-5)
- How quickly did you get value? (<5 min / <30 min / <1 hour)
- Would you pay $29/month for this? (Yes/No/Maybe)
- What features do you want most?
- What's confusing?
```

**Acceptance criteria:**
- [ ] >80% complete signup
- [ ] >50% get value in first session
- [ ] >30% would pay
- [ ] NPS >30 (passable)
- [ ] <3 critical issues

**If UAT fails:** Iterate on Spark before building Solo

---

### **UAT 2: Solo Tier (Week 6)**

**Test Ally Personal with 5 beta users:**

```
Recruit:
- Users who completed Spark trial
- Offer: Free Solo for 1 month in exchange for feedback

Test plan (1 month):
Week 1: Calendar integration
  - Connect Google Calendar
  - Use Ally suggestions for 1 week
  - Measure: Time saved (self-reported)

Week 2: Financial tracking  
  - Add expenses daily
  - Review AI categorization
  - Measure: Accuracy of categorization

Week 3: Wellness monitoring
  - Daily productivity tracking
  - Burnout risk assessment
  - Measure: Insights relevance

Week 4: Learning journal
  - Capture lessons learned
  - Review career growth trajectory
  - Measure: Value of portability

Final survey:
- Is Ally Personal worth $29/month? (Yes/No)
- Which feature provides most value?
- What's missing?
- Would you recommend? (NPS)
```

**Acceptance criteria:**
- [ ] >60% say "worth $29/month"
- [ ] >10 hours time saved per user
- [ ] NPS >50 (good)
- [ ] <2 critical bugs
- [ ] Calendar integration works reliably

**If UAT fails:** Refine Ally Personal before launching

---

### **UAT 3: Team Tier (Week 8)**

**Test with 2 real teams (5-7 people each):**

```
Recruit:
- 1 startup team (high collaboration)
- 1 agency team (client work)

Test plan (1 month):
Week 1: Setup & onboarding
  - All members signup
  - Share 3 core agents
  - Upload team knowledge base
  - Measure: Onboarding time per member

Week 2-3: Active collaboration
  - Use shared agents daily
  - Track activity feed usage
  - Ally Team daily standups
  - Measure: Collaboration frequency

Week 4: Team value assessment
  - Calculate time saved (team-wide)
  - Measure ROI/Token (team aggregate)
  - Survey: Worth the price?

Survey per team member:
- Does team collaboration work smoothly? (1-5)
- Is Ally Team helpful? (1-5)
- How much time saved per week? (hours)
- Worth $99 + $19/user? (Yes/No)
- Would you recommend? (NPS)
```

**Acceptance criteria:**
- [ ] >70% say "worth the price"
- [ ] Team ROI/T >80x
- [ ] NPS >60 (excellent)
- [ ] No critical collaboration bugs
- [ ] All 7-person limit tests pass

---

## 🧪 Load Testing (Pre-Production)

### **Test 1: Concurrent Trial Signups**

**Goal:** Handle 100 simultaneous trial signups

```bash
# Use load testing tool (k6 or artillery)

# k6 script:
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 100,        // 100 virtual users
  duration: '30s', // 30 seconds
};

export default function () {
  const email = `test-${Date.now()}-${__VU}@test.com`;
  
  const response = http.post('http://localhost:3000/api/auth/trial-signup', 
    JSON.stringify({
      email: email,
      name: `Test User ${__VU}`
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  
  check(response, {
    'status is 200': (r) => r.status === 200,
    'provisioned in <60s': (r) => r.timings.duration < 60000,
    'returned userId': (r) => JSON.parse(r.body).userId !== undefined,
  });
  
  sleep(1);
}

# Run test
k6 run load-test-signups.js

# Expected:
# ✅ >95% requests successful
# ✅ P95 latency <60s
# ✅ No database errors
# ✅ All users provisioned correctly
```

**Acceptance criteria:**
- [ ] 95% success rate
- [ ] P95 <60 seconds
- [ ] No errors in Firestore
- [ ] No memory leaks

---

### **Test 2: Module Loading Under Load**

```bash
# Simulate 500 concurrent users (mixed tiers)

# Distribution:
# - 250 Spark users (50%)
# - 150 Solo users (30%)
# - 80 Team users (16%)
# - 20 Enterprise users (4%)

# Measure:
# - Page load time per tier
# - Module loading time
# - Memory usage
# - CPU usage

# Target:
# - Page load P95: <3s
# - Module load P95: <2s
# - Memory: <512MB per instance
# - CPU: <50% average

# Run for 10 minutes
# Monitor Cloud Run metrics
```

**Acceptance criteria:**
- [ ] Auto-scaling works (instances spawn)
- [ ] No module loading errors
- [ ] Performance targets met
- [ ] Costs reasonable (<$5 for test)

---

## 🧪 Regression Testing (Every Deploy)

### **Automated Test Suite**

**Create:** `tests/tier-system.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { getTierConfig, hasFeature, calculateMonthlyPrice } from '../src/config/tiers';

describe('Tier System', () => {
  describe('Tier Configurations', () => {
    it('should have all 4 tiers defined', () => {
      expect(getTierConfig('spark')).toBeDefined();
      expect(getTierConfig('solo')).toBeDefined();
      expect(getTierConfig('team')).toBeDefined();
      expect(getTierConfig('enterprise')).toBeDefined();
    });
    
    it('should have correct pricing', () => {
      expect(getTierConfig('spark').pricing.monthlyBase).toBe(0);
      expect(getTierConfig('solo').pricing.monthlyBase).toBe(2900);
      expect(getTierConfig('team').pricing.monthlyBase).toBe(9900);
      expect(getTierConfig('enterprise').pricing.monthlyBase).toBe(250000);
    });
    
    it('should have progressive limits', () => {
      expect(getTierConfig('spark').limits.maxAgents).toBe(5);
      expect(getTierConfig('solo').limits.maxAgents).toBe(25);
      expect(getTierConfig('team').limits.maxAgents).toBe(100);
      expect(getTierConfig('enterprise').limits.maxAgents).toBe(-1); // Unlimited
    });
  });
  
  describe('Feature Availability', () => {
    it('should gate API access by tier', () => {
      expect(hasFeature('spark', 'apiAccess')).toBe(false);
      expect(hasFeature('solo', 'apiAccess')).toBe(true);
      expect(hasFeature('team', 'apiAccess')).toBe(true);
      expect(hasFeature('enterprise', 'apiAccess')).toBe(true);
    });
    
    it('should gate calendar by tier', () => {
      expect(getTierConfig('spark').limits.calendarIntegration).toBe(false);
      expect(getTierConfig('solo').limits.calendarIntegration).toBe(true);
      expect(getTierConfig('team').limits.calendarIntegration).toBe(true);
    });
    
    it('should gate team features', () => {
      expect(getTierConfig('spark').limits.sharedAgents).toBe(false);
      expect(getTierConfig('solo').limits.sharedAgents).toBe(false);
      expect(getTierConfig('team').limits.sharedAgents).toBe(true);
      expect(getTierConfig('enterprise').limits.sharedAgents).toBe(true);
    });
  });
  
  describe('Pricing Calculations', () => {
    it('should calculate Solo pricing correctly', () => {
      expect(calculateMonthlyPrice('solo', 1, 'monthly')).toBe(2900);
      expect(calculateMonthlyPrice('solo', 1, 'annual')).toBeCloseTo(2417, 0); // ~$24.17
    });
    
    it('should calculate Team pricing with additional users', () => {
      expect(calculateMonthlyPrice('team', 2, 'monthly')).toBe(11800); // $99 + $19
      expect(calculateMonthlyPrice('team', 7, 'monthly')).toBe(21300); // $99 + 6*$19
    });
    
    it('should apply annual discount correctly', () => {
      const monthly = calculateMonthlyPrice('solo', 1, 'monthly') * 12;
      const annual = calculateMonthlyPrice('solo', 1, 'annual') * 12;
      const savings = monthly - annual;
      const discount = (savings / monthly) * 100;
      
      expect(discount).toBeCloseTo(17, 0); // 17% discount
    });
  });
  
  describe('Backward Compatibility', () => {
    it('should auto-assign tier to existing users', async () => {
      const existingUser = await getUser('existing-user-id');
      expect(existingUser.tier).toBeDefined();
      expect(['solo', 'team', 'enterprise']).toContain(existingUser.tier);
    });
    
    it('should grandfather existing users pricing', async () => {
      const existingUser = await getUser('existing-user-id');
      const subscription = await getSubscription(existingUser.subscriptionId);
      
      expect(subscription.lockedPricing.grandfathered).toBe(true);
      expect(subscription.lockedPricing.monthlyBase).toBe(0); // Free for existing
    });
  });
});
```

**Run before every deploy:**
```bash
npm run test:tier-system
# All tests must pass ✅
```

---

## 📋 Testing Checklist (By Phase)

### **Phase 1: Foundation** ✅ (Week 2)

**Code tests:**
- [x] TypeScript compiles (no errors)
- [x] Tier types defined correctly
- [x] Tier configs validate
- [ ] Subscription collection schema created
- [ ] Feature flags load correctly
- [ ] Module loader works
- [ ] Tier middleware enforces access

**Manual tests:**
- [ ] Existing users still work (backward compat)
- [ ] Can switch tiers (admin only in dev)
- [ ] UI shows correct features per tier
- [ ] No performance regression

---

### **Phase 2: Trial** (Week 4)

**Functional tests:**
- [ ] Signup wizard completes
- [ ] Provisioning <60s
- [ ] 5 starter agents created
- [ ] First conversation works
- [ ] Trial countdown accurate

**Edge cases:**
- [ ] Duplicate email → Error message
- [ ] OAuth cancellation → Return to signup
- [ ] Provisioning failure → Retry logic
- [ ] Network error → Graceful degradation

**UAT:**
- [ ] 10 external users complete signup
- [ ] >80% activate (send first message)
- [ ] Survey: NPS >30
- [ ] Conversion intent: >30%

---

### **Phase 3: Ally** (Week 6)

**Integration tests:**
- [ ] Calendar OAuth works (Google)
- [ ] Events read correctly
- [ ] Schedule analysis accurate
- [ ] Expense categorization >80% correct
- [ ] Wellness tracking relevant
- [ ] Learning journal captures insights

**UAT:**
- [ ] 5 beta users test for 1 month
- [ ] >60% say "worth $29/month"
- [ ] >10 hours saved per user
- [ ] NPS >50

---

### **Phase 4: Team** (Week 8)

**Collaboration tests:**
- [ ] 2-7 users can join team
- [ ] Shared agents work (real-time updates)
- [ ] Activity feed accurate
- [ ] Notifications fire correctly
- [ ] Ally Team coordinates effectively

**UAT:**
- [ ] 2 real teams test for 1 month
- [ ] >70% say "worth the price"
- [ ] Team ROI/T >80x
- [ ] NPS >60

---

### **Phase 5: Developer** (Week 10)

**SDK tests:**
- [ ] NPM package installs
- [ ] All methods work
- [ ] TypeScript types correct
- [ ] Error handling robust
- [ ] Documentation accurate

**Template tests:**
- [ ] All 4 NPX templates create successfully
- [ ] Generated code runs
- [ ] Deployment works
- [ ] Cursor template <20 min to deployed

---

### **Phase 6-7: Enterprise** (Week 12)

**Enterprise tests:**
- [ ] BYOK works (all providers)
- [ ] Multi-org isolation complete
- [ ] A/B testing accurate
- [ ] Compliance automation working
- [ ] Self-hosted deployment successful

**Final UAT:**
- [ ] First enterprise customer deployed
- [ ] All features working in production
- [ ] ROI/T tracking operational
- [ ] Customer satisfied (NPS >70)

---

## 🎯 Testing Success Metrics

### **At Each Phase:**

**Technical Metrics:**
- Code coverage: >80%
- Type errors: 0
- Linter errors: 0
- Security issues: 0
- Performance: All targets met

**User Metrics:**
- Task completion: >90%
- Time to value: <5 minutes
- Feature discovery: >70%
- Error rate: <1%
- Support tickets: <5 per 100 users

**Business Metrics:**
- Conversion rate (matches projections)
- Retention rate (above industry avg)
- NPS (improving over time)
- ROI/T (meeting tier targets)

---

## 🚀 Quick Test Commands

### **Right Now (Planning Phase):**

```bash
# 1. Validate types
npm run type-check

# 2. Test tier configs
npx tsx -e "
import { ALL_TIERS, formatPrice } from './src/config/tiers.js';
Object.values(ALL_TIERS).forEach(t => 
  console.log(\`\${t.name}: \${formatPrice(t.pricing.monthlyBase)}\`)
);
process.exit(0);
"

# 3. Check backward compatibility
grep -r "Backward Compatible" docs/*.md
# Should find: Guaranteed in all docs ✅
```

---

### **Week 2 (Foundation Complete):**

```bash
# 1. Start dev server
npm run dev

# 2. Login and check tier
# Open browser console
# Run: await fetch('/api/users/me').then(r => r.json())
# Verify: Has 'tier' field

# 3. Test feature gating
# Try accessing locked feature
# Verify: Gets 403 with upgrade message

# 4. Run automated tests
npm run test:tier-system
```

---

### **Week 4 (Trial Live):**

```bash
# 1. Incognito browser
open -na "Google Chrome" --args --incognito http://localhost:3000

# 2. Complete signup (time it!)
# Target: <2 minutes to first conversation

# 3. Test limits
# - Create 6 agents (6th should fail)
# - Upload 51MB file (should fail)
# - Access API (should fail)

# 4. Verify archival (test mode)
TEST_MODE=true npm run dev
# Wait 1 minute → Trial expires
# Verify: Read-only access
```

---

### **Week 6+ (As Features Added):**

```bash
# Test new features in isolation
npm run test:ally-calendar
npm run test:ally-finance
npm run test:team-collaboration

# Then integration tests
npm run test:integration

# Then E2E
npm run test:e2e

# Finally, UAT with real users
```

---

## 🎯 What Success Looks Like

### **Phase 1 Success:**
```
✅ Tier system working
✅ Feature flags operational
✅ Modules load correctly
✅ Existing users unaffected
✅ Type-check passes
✅ No performance regression
```

### **Phase 2 Success:**
```
✅ Trial signup <2 minutes
✅ Provisioning <60 seconds
✅ 30% conversion rate (trial → Solo)
✅ NPS >30
✅ <5 support tickets per 100 users
```

### **Phase 3 Success:**
```
✅ Calendar integration works
✅ Expense tracking >80% accurate
✅ Wellness insights relevant
✅ Learning journal valuable
✅ >60% say "worth $29/month"
✅ NPS >50
```

### **Phase 4 Success:**
```
✅ 7-person teams collaborate seamlessly
✅ Real-time updates work
✅ Ally Team coordination helpful
✅ Team ROI/T >100x
✅ >70% say "worth $99+"
✅ NPS >60
```

### **Complete Platform Success (Week 12):**
```
✅ All 4 tiers operational
✅ All tests passing
✅ MRR >$10K
✅ Blended NPS >60
✅ Blended ROI/T >100x
✅ 0 critical bugs
✅ <2s page loads (all tiers)
✅ >99% uptime
```

---

## 📖 Test Documentation

**For each phase, create:**

1. **Test plan** (before implementation)
   - What to test
   - How to test
   - Success criteria

2. **Test results** (after implementation)
   - What was tested
   - Results (pass/fail)
   - Issues found
   - Issues resolved

3. **UAT report** (after user testing)
   - User feedback
   - Metrics collected
   - Recommendations
   - Go/No-Go decision

---

## ✅ Your Action Items (Testing Phase)

### **NOW (Today):**

1. **Validate the plan:**
   ```bash
   # Run type check
   npm run type-check
   
   # Test tier configs
   npx tsx -e "
   import { ALL_TIERS } from './src/config/tiers.js';
   console.log('Tiers:', Object.keys(ALL_TIERS));
   process.exit(0);
   "
   
   # Review documents
   # - docs/QUICK_START_MODULARIZATION.md
   # - docs/MODULARIZATION_IMPLEMENTATION_PLAN.md
   # - docs/MODULAR_PLATFORM_ARCHITECTURE.md
   ```

2. **Provide feedback:**
   - Tier names OK? (Spark/Solo/Team/Enterprise)
   - Pricing OK? ($0/$29/$99/Custom)
   - Timeline OK? (12 weeks)
   - Anything to change?

3. **Approve to proceed:**
   - "Let's start Phase 1" → I create branch and begin
   - "Adjust X first" → I refine plan
   - "Let me review more" → Take your time

---

### **Week 2 (Foundation Complete):**

1. **Manual testing:**
   - Login as existing user
   - Verify tier assigned
   - Test feature gating
   - Check backward compatibility

2. **Automated testing:**
   ```bash
   npm run test:tier-system
   npm run test:feature-flags
   npm run test:module-loader
   ```

3. **Demo preparation:**
   - Prepare: Different UI per tier
   - Show: Tier switching (admin view)
   - Prove: Backward compatible

---

### **Every Week After:**

1. **Test new features** (unit + integration)
2. **Run regression tests** (ensure nothing broke)
3. **Collect metrics** (conversion, engagement, NPS)
4. **UAT with real users** (at phase milestones)
5. **Demo to stakeholders** (every Friday)

---

## 🎯 Bottom Line

**Right now, you can test:**
1. ✅ Type definitions (compile check)
2. ✅ Tier configurations (logic validation)
3. ✅ Strategic alignment (document review)
4. ✅ Financial model (spreadsheet validation)

**As we implement, you'll test:**
- Week 2: Tier system enforcement
- Week 4: Trial signup flow
- Week 6: Ally Personal features
- Week 8: Team collaboration
- Week 10: Developer ecosystem
- Week 12: Complete platform

**Testing is continuous, not a phase.** Every feature gets:
1. Unit tests (automated)
2. Integration tests (automated)
3. Manual QA (you or team)
4. UAT (real users)
5. Regression (every deploy)

**Result:** High confidence, low risk, fast iteration. 🎯✅

---

**Ready to test the first phase?** Just say **"Let's start Phase 1"** and I'll begin implementation! 🚀





