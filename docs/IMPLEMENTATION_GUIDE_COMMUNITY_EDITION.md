# Implementation Guide: AI Factory Community Edition

**Document Type:** Technical Implementation Guide  
**Created:** 2025-11-18  
**Target:** Development team implementing monetization  
**Estimated Time:** 4 weeks to production  

---

## 🎯 **Implementation Overview**

This guide walks through implementing the complete Community Edition monetization system, from database setup to production deployment.

**What We're Building:**
- $20/month subscription platform
- Community groups (domains)
- Priority support (5 tickets/month)
- Stripe payment integration
- Email-based signup (any email)

---

## 📋 **Week 1: Database & Core APIs**

### **Day 1: Setup Organization & Groups**

#### **Step 1.1: Run Seed Script**

```bash
# This creates LATAMLAB.AI org + 37 initial groups
npx tsx scripts/seed-latamlab-org.ts
```

**Expected Output:**
```
🌱 Seeding LATAMLAB.AI Organization
=====================================

📦 Creating LATAMLAB.AI organization...
✅ Organization created: latamlab-ai-xxx

📚 Creating 37 community groups...

  ✅ AI Factory               (AI) → ai-factory
  ✅ LATAMLAB.AI              (AI) → latamlab-ai
  ✅ El Club de la IA         (AI) → el-club-de-la-ia
  ✅ Reforge LATAM            (Growth) → reforge-latam
  ... (33 more)

=====================================
🎉 Seeding Complete!

✅ Success: 37 groups created
❌ Failed: 0 groups

👤 Alec is now admin of:
   - Organization: LATAMLAB.AI
   - 37 community groups
```

#### **Step 1.2: Verify in Firestore**

```bash
# Check organizations collection
curl "http://localhost:3000/api/organizations/list"

# Expected: LATAMLAB.AI with 37 domains

# Check community_groups collection
curl "http://localhost:3000/api/groups/list"

# Expected: 37 groups returned
```

#### **Step 1.3: Deploy Indexes**

```bash
# Create firestore.indexes.json entries
cat >> firestore.indexes.json << 'EOF'
{
  "indexes": [
    {
      "collectionGroup": "subscriptions",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "support_tickets",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "community_groups",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "organizationId", "order": "ASCENDING" },
        { "fieldPath": "memberCount", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "group_invitations",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "recipientEmail", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" }
      ]
    }
  ]
}
EOF

# Deploy indexes
firebase deploy --only firestore:indexes --project salfagpt

# Verify (wait 2-5 minutes for creation)
gcloud firestore indexes composite list --project=salfagpt
```

---

### **Day 2: Test Core APIs**

#### **Test Subscription Creation**

```bash
# Simulate user signup (creates trial subscription)
curl -X POST http://localhost:3000/api/subscriptions/create \
  -H "Content-Type: application/json" \
  -H "Cookie: flow_session=YOUR_JWT_TOKEN" \
  -d '{
    "billingCycle": "monthly",
    "currency": "USD"
  }'

# Expected response:
{
  "subscription": {
    "id": "sub_xxx",
    "userId": "114671162830729001607",
    "status": "trial",
    "pricePerMonth": 20,
    "trialEnd": "2025-12-02T..."
  },
  "message": "Trial started! You have 14 days to explore the platform."
}
```

#### **Test Group Join**

```bash
# Join a group
curl -X POST http://localhost:3000/api/groups/join \
  -H "Content-Type: application/json" \
  -H "Cookie: flow_session=YOUR_JWT_TOKEN" \
  -d '{
    "groupId": "GROUP_ID_FROM_LIST"
  }'

# Expected: domainId updated in users collection
```

#### **Test Ticket Creation**

```bash
# Create support ticket (1 of 5)
curl -X POST http://localhost:3000/api/tickets/create \
  -H "Content-Type: application/json" \
  -H "Cookie: flow_session=YOUR_JWT_TOKEN" \
  -d '{
    "subject": "How do I create a shared agent?",
    "description": "I want to share an agent with my team",
    "category": "use-case",
    "priority": "normal"
  }'

# Expected:
{
  "ticket": {
    "ticketNumber": "LATAM-00123",
    "status": "open"
  },
  "message": "Ticket LATAM-00123 created. We'll respond within 24 hours."
}

# Try creating 6th ticket (should fail)
# Expected: HTTP 429 - Ticket limit reached
```

---

### **Day 3: Implement Stripe Integration**

#### **Step 3.1: Setup Stripe Account**

1. Create account at stripe.com
2. Get API keys from Dashboard
3. Create products:
   - Product: "Community Edition"
   - Price 1: $20/month recurring
   - Price 2: $200/year recurring

#### **Step 3.2: Create Stripe Library**

**File:** `src/lib/stripe.ts`

```typescript
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia'
});

export async function createCheckoutSession(
  userId: string,
  userEmail: string,
  priceId: string,
  successUrl: string,
  cancelUrl: string
): Promise<string> {
  const session = await stripe.checkout.sessions.create({
    customer_email: userEmail,
    line_items: [{
      price: priceId,
      quantity: 1,
    }],
    mode: 'subscription',
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      userId,
      organizationId: 'latamlab-ai',
    },
  });
  
  return session.url!;
}

export async function handleWebhook(
  body: string,
  signature: string
): Promise<void> {
  const event = stripe.webhooks.constructEvent(
    body,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET!
  );
  
  switch (event.type) {
    case 'customer.subscription.created':
      await handleSubscriptionCreated(event.data.object);
      break;
    case 'invoice.payment_succeeded':
      await handlePaymentSucceeded(event.data.object);
      break;
    case 'invoice.payment_failed':
      await handlePaymentFailed(event.data.object);
      break;
  }
}
```

#### **Step 3.3: Create Stripe Checkout Endpoint**

**File:** `src/pages/api/stripe/checkout.ts`

(See implementation in next section)

#### **Step 3.4: Test Payment Flow**

```bash
# 1. Start local server
npm run dev

# 2. Navigate to upgrade page
open http://localhost:3000/subscribe

# 3. Use Stripe test card
Card: 4242 4242 4242 4242
Exp: Any future date
CVC: Any 3 digits

# 4. Complete checkout
# Expected: Subscription status → 'active'
```

---

### **Day 4-5: Build UI Components**

#### **SubscriptionWidget.tsx**

Shows trial status or active subscription in top-right corner.

#### **CommunityGroupsBrowser.tsx**

Browse and join community groups.

#### **SupportTicketForm.tsx**

Create priority support tickets (max 5/month).

#### **UpgradeModal.tsx**

Prompts trial users to subscribe when trial expires.

(Full component code provided in separate section below)

---

## 📋 **Week 2: Payment Integration**

### **Stripe Integration Steps**

#### **1. Install Stripe**

```bash
npm install stripe @stripe/stripe-js
```

#### **2. Configure Products in Stripe Dashboard**

**Product:** Community Edition

**Prices:**
- Monthly: $20 USD (price_monthly_community_usd)
- Annual: $200 USD (price_annual_community_usd)
- Monthly CLP: $18,000 CLP (price_monthly_community_clp)

#### **3. Implement Checkout**

```typescript
// src/pages/api/stripe/checkout.ts
import type { APIRoute } from 'astro';
import { createCheckoutSession } from '../../../lib/stripe.js';
import { getSession } from '../../../lib/auth.js';

export const POST: APIRoute = async ({ request, cookies }) => {
  const session = getSession({ cookies } as any);
  if (!session) return unauthorized();
  
  const { billingCycle } = await request.json();
  
  const priceId = billingCycle === 'annual' 
    ? process.env.STRIPE_PRICE_ANNUAL_USD 
    : process.env.STRIPE_PRICE_MONTHLY_USD;
  
  const checkoutUrl = await createCheckoutSession(
    session.id,
    session.email,
    priceId!,
    'https://latamlab.ai/subscribe/success',
    'https://latamlab.ai/subscribe/cancel'
  );
  
  return new Response(JSON.stringify({ url: checkoutUrl }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};
```

#### **4. Implement Webhook Handler**

```typescript
// src/pages/api/stripe/webhook.ts
import type { APIRoute } from 'astro';
import { handleWebhook } from '../../../lib/stripe.js';

export const POST: APIRoute = async ({ request }) => {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature')!;
  
  try {
    await handleWebhook(body, signature);
    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response('Webhook error', { status: 400 });
  }
};
```

#### **5. Configure Webhook in Stripe**

Dashboard → Developers → Webhooks → Add endpoint

```
URL: https://your-domain.com/api/stripe/webhook
Events:
  - customer.subscription.created
  - customer.subscription.updated  
  - customer.subscription.deleted
  - invoice.payment_succeeded
  - invoice.payment_failed
```

---

## 📋 **Week 3: UI Components**

### **Component 1: SubscriptionWidget**

**Location:** Top-right corner of ChatInterfaceWorking.tsx

```typescript
// src/components/SubscriptionWidget.tsx
import { useState, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';

export function SubscriptionWidget() {
  const { user } = useUser();
  const [subscription, setSubscription] = useState(null);
  const [daysLeft, setDaysLeft] = useState(0);
  
  useEffect(() => {
    if (!user) return;
    
    fetch(`/api/subscriptions/${user.id}`)
      .then(r => r.json())
      .then(data => {
        setSubscription(data.subscription);
        
        if (data.subscription?.isTrialPeriod) {
          const end = new Date(data.subscription.trialEnd);
          const now = new Date();
          const diff = end.getTime() - now.getTime();
          setDaysLeft(Math.ceil(diff / (1000 * 60 * 60 * 24)));
        }
      });
  }, [user]);
  
  if (!subscription) return null;
  
  if (subscription.isTrialPeriod) {
    return (
      <div className="px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-blue-800">
            🎉 Trial: {daysLeft} days left
          </span>
          <button className="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700">
            Upgrade
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-green-800">
          ✅ Community Edition
        </span>
        <span className="text-xs text-green-600">
          Tickets: {subscription.currentPeriodUsage.ticketsUsed} / 5
        </span>
      </div>
    </div>
  );
}
```

---

### **Component 2: CommunityGroupsBrowser**

**Purpose:** Browse and join community groups

```typescript
// src/components/CommunityGroupsBrowser.tsx
import { useState, useEffect } from 'react';
import { Users, Search } from 'lucide-react';

export function CommunityGroupsBrowser() {
  const [groups, setGroups] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [industryFilter, setIndustryFilter] = useState('');
  
  useEffect(() => {
    loadGroups();
  }, [industryFilter]);
  
  async function loadGroups() {
    const params = new URLSearchParams();
    if (industryFilter) params.set('industry', industryFilter);
    
    const response = await fetch(`/api/groups/list?${params}`);
    const data = await response.json();
    setGroups(data.groups);
  }
  
  async function handleJoin(groupId: string) {
    await fetch('/api/groups/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ groupId })
    });
    
    alert('Joined group!');
    loadGroups();
  }
  
  const filtered = groups.filter(g => 
    g.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">🌍 Community Groups</h2>
      
      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search groups..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg"
          />
        </div>
        <select
          value={industryFilter}
          onChange={(e) => setIndustryFilter(e.target.value)}
          className="px-4 py-2 border border-slate-300 rounded-lg"
        >
          <option value="">All Industries</option>
          <option value="AI">AI</option>
          <option value="Banking">Banking</option>
          <option value="Construction">Construction</option>
          {/* ... more industries */}
        </select>
      </div>
      
      {/* Groups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(group => (
          <div key={group.id} className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-slate-800">{group.name}</h3>
              {group.industry && (
                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                  {group.industry}
                </span>
              )}
            </div>
            
            <p className="text-sm text-slate-600 mb-3">
              {group.description}
            </p>
            
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                {group.memberCount} members
              </span>
              
              <button
                onClick={() => handleJoin(group.id)}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
              >
                Join
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

### **Component 3: SupportTicketForm**

**Purpose:** Create priority support tickets

```typescript
// src/components/SupportTicketForm.tsx
import { useState } from 'react';
import { Ticket, Send } from 'lucide-react';

export function SupportTicketForm({ 
  subscription, 
  onClose 
}: { 
  subscription: any; 
  onClose: () => void; 
}) {
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('use-case');
  const [priority, setPriority] = useState('normal');
  const [submitting, setSubmitting] = useState(false);
  
  const ticketsUsed = subscription.currentPeriodUsage.ticketsUsed;
  const ticketsTotal = subscription.features.priorityTickets;
  const canCreate = ticketsUsed < ticketsTotal;
  
  async function handleSubmit(e) {
    e.preventDefault();
    if (!canCreate) return;
    
    setSubmitting(true);
    
    try {
      const response = await fetch('/api/tickets/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          description,
          category,
          priority,
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        alert(`Ticket ${data.ticket.ticketNumber} created!`);
        onClose();
      } else {
        alert(data.message || 'Failed to create ticket');
      }
    } finally {
      setSubmitting(false);
    }
  }
  
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Ticket className="w-5 h-5" />
          Create Support Ticket
        </h2>
        <span className="text-sm text-slate-600">
          {ticketsUsed} of {ticketsTotal} used this month
        </span>
      </div>
      
      {!canCreate ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-yellow-800 font-medium">
            You've used all {ticketsTotal} priority tickets this month
          </p>
          <p className="text-sm text-yellow-700 mt-1">
            Resets on {new Date(subscription.nextBillingDate).toLocaleDateString()}
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Brief description of your issue"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg"
            >
              <option value="bug">Bug Report</option>
              <option value="feature-request">Feature Request</option>
              <option value="use-case">Use Case Help</option>
              <option value="question">General Question</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Priority</label>
            <div className="flex gap-4">
              {['low', 'normal', 'high', 'urgent'].map(p => (
                <label key={p} className="flex items-center gap-2">
                  <input
                    type="radio"
                    value={p}
                    checked={priority === p}
                    onChange={(e) => setPriority(e.target.value)}
                  />
                  <span className="capitalize">{p}</span>
                </label>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed description of your issue or question..."
              className="w-full px-4 py-2 border border-slate-300 rounded-lg"
              rows={6}
              required
            />
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
            💡 Tip: Priority tickets are answered within 24 hours (8h for high/urgent)
          </div>
          
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting || !canCreate}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-slate-300 flex items-center justify-center gap-2"
            >
              {submitting ? 'Creating...' : (
                <>
                  <Send className="w-4 h-4" />
                  Create Ticket
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
```

---

## 📋 **Week 3: Email & Notifications**

### **Email Templates**

#### **1. Trial Started**

**Subject:** Welcome to LATAMLAB.AI - Your 14-day trial has started! 🎉

**Body:**
```
Hi {userName},

Welcome to LATAMLAB.AI Community Edition!

Your 14-day free trial has started. Here's what you can do:

✅ Create unlimited AI agents
✅ Join community groups (El Club de la IA, Reforge LATAM, etc.)
✅ Upload context documents (10 GB included)
✅ Get priority support (5 tickets/month)

Quick Start:
1. Create your first agent: https://latamlab.ai/chat
2. Browse communities: https://latamlab.ai/groups
3. Invite your team: https://latamlab.ai/invite

Your trial ends on {trialEndDate}.

Questions? Reply to this email or create a support ticket.

Cheers,
The LATAMLAB.AI Team
```

#### **2. Trial Ending (Day 11)**

**Subject:** 3 days left in your trial - Subscribe to keep your agents

#### **3. Payment Successful**

**Subject:** Welcome to Community Edition! Your subscription is active ✅

---

## 📋 **Week 4: Testing & Launch**

### **Alpha Testing (20 users)**

**Invite List:**
1. Alec (admin)
2. Close team members (5)
3. Reforge LATAM members (5)
4. El Club de la IA members (5)
5. Beta testers (4)

**Test Cases:**
- [x] Signup flow
- [x] Trial period
- [x] Group join/leave
- [x] Ticket creation (all 5)
- [x] Payment processing
- [x] Subscription management
- [x] Group invitations
- [x] Usage tracking

### **Beta Testing (100 users)**

**Expansion:**
- Each alpha user invites 4 more
- Open signups (no invite required)
- Marketing via LinkedIn, Twitter

**Feedback Collection:**
- Weekly surveys
- In-app feedback widget
- Support ticket analysis

---

## 🚀 **Production Deployment**

### **Pre-Launch Checklist**

**Infrastructure:**
- [ ] Stripe account in production mode
- [ ] Webhook endpoint verified
- [ ] Email service configured (SendGrid)
- [ ] Firestore indexes deployed
- [ ] Security rules updated
- [ ] Backup created

**Data:**
- [ ] LATAMLAB.AI organization exists
- [ ] 37 community groups created
- [ ] Alec is admin of all
- [ ] Test subscriptions working

**Testing:**
- [ ] End-to-end payment flow
- [ ] Trial expiration handling
- [ ] Ticket limit enforcement
- [ ] Group join/invite flow
- [ ] Email deliverability

**Legal:**
- [ ] Terms of Service updated
- [ ] Privacy Policy updated
- [ ] Subscription terms clear
- [ ] Refund policy defined

### **Launch Day**

```bash
# 1. Deploy to production
npm run build
gcloud run deploy cr-salfagpt-ai-ft-prod \
  --source . \
  --region us-east4 \
  --project salfagpt

# 2. Verify deployment
curl https://production-url.com/api/groups/list

# 3. Announce to alpha testers
# Send email: "LATAMLAB.AI is now live!"

# 4. Monitor for 48 hours
# Watch error logs, payment webhooks, user signups
```

---

## 🔍 **Monitoring & Analytics**

### **Key Dashboards**

**Business Metrics:**
- MRR (Monthly Recurring Revenue)
- ARR (Annual Recurring Revenue)
- Churn Rate
- CAC (Customer Acquisition Cost)
- LTV (Lifetime Value)
- LTV:CAC ratio (target: >3)

**Product Metrics:**
- DAU/MAU ratio
- Trial → Paid conversion %
- Avg agents per user
- Avg groups per user
- Tickets per user per month

**System Health:**
- API response times
- Payment success rate
- Webhook processing success
- Email delivery rate
- Stripe sync delays

---

## 🎯 **Success Criteria**

### **Week 1**
- ✅ Core infrastructure built
- ✅ APIs functional
- ✅ Database schema deployed

### **Month 1**
- 20 alpha users
- 10 paid conversions (50% trial conversion)
- $200 MRR
- 5 community groups with >5 members

### **Month 3**
- 100 total users
- 40 paid users (40% conversion)
- $800 MRR
- 20 active community groups
- <5% monthly churn

### **Month 6**
- 500 total users
- 200 paid users (40% conversion)
- $4,000 MRR ($48K ARR)
- 50 active community groups
- <3% monthly churn

### **Month 12**
- 2,000 total users
- 1,000 paid users (50% conversion)
- $20,000 MRR ($240K ARR)
- 100+ active community groups
- <2% monthly churn

---

## 🚨 **Risk Mitigation**

### **Technical Risks**

**Risk:** Payment integration failures  
**Mitigation:** Extensive testing, Stripe test mode, manual fallback

**Risk:** Ticket system abuse  
**Mitigation:** 5/month limit, categorization, abuse detection

**Risk:** Storage costs exceed revenue  
**Mitigation:** 10 GB limit per user, monitoring, upsell for more

### **Business Risks**

**Risk:** Low trial → paid conversion  
**Mitigation:** Strong onboarding, email drip campaign, value demonstration

**Risk:** High churn  
**Mitigation:** Community engagement, continuous value delivery, feedback loops

**Risk:** Support overwhelm  
**Mitigation:** Ticket limits, self-service docs, community-driven answers

---

## 📚 **Resources**

### **Documentation**
- `docs/COMMUNITY_EDITION_MONETIZATION_2025-11-18.md` - Business model
- `docs/IMPLEMENTATION_GUIDE_COMMUNITY_EDITION.md` - This guide
- `.cursor/rules/organizations.mdc` - Multi-org system

### **Code References**
- `src/types/subscriptions.ts` - All types
- `src/lib/subscriptions.ts` - Core logic
- `scripts/seed-latamlab-org.ts` - Data seeding

### **External**
- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Subscriptions Guide](https://stripe.com/docs/billing/subscriptions/overview)
- [MercadoPago Docs](https://www.mercadopago.com/developers)

---

## ✅ **Implementation Summary**

**Architecture:** ✅ Complete
- Subscription system designed
- Community groups (domains)
- Support tickets (5/month)
- Payment integration planned

**Backend:** ✅ Core Complete
- TypeScript types defined
- Business logic implemented
- API endpoints created
- Seed script ready

**Next:** 🚧 Payment Integration
- Stripe setup
- Webhook handling
- UI components
- Email notifications

**Timeline:** 4 weeks to production-ready

---

**This implementation guide provides a complete roadmap from database to deployed monetization system. Follow the weekly plan to launch AI Factory Community Edition successfully!** 🚀


