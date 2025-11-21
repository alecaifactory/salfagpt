# Deployment Commands: Community Edition Monetization

Quick reference for deploying AI Factory Community Edition.

---

## ⚡ **Quick Start (30 minutes)**

### **1. Install Dependencies**

```bash
cd /Users/alec/salfagpt
npm install stripe @stripe/stripe-js
```

### **2. Configure Environment**

Add to `/Users/alec/salfagpt/.env`:

```bash
# Stripe (use test keys for local testing)
STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET_HERE

# Stripe Price IDs (create in Stripe Dashboard first)
STRIPE_PRICE_MONTHLY_USD=price_YOUR_PRICE_ID
STRIPE_PRICE_ANNUAL_USD=price_YOUR_PRICE_ID

# Subscription Config
TRIAL_DAYS=14
MONTHLY_PRICE_USD=20
PRIORITY_TICKETS_PER_MONTH=5
```

### **3. Create LATAMLAB.AI Organization**

```bash
npx tsx scripts/seed-latamlab-org.ts
```

**Expected output:**
- ✅ LATAMLAB.AI organization created
- ✅ 37 community groups created
- ✅ Alec is admin of all groups

### **4. Deploy Firestore Indexes**

```bash
firebase deploy --only firestore:indexes --project salfagpt
```

Wait 2-3 minutes, then verify:

```bash
gcloud firestore indexes composite list --project=salfagpt
```

All should show `STATE: READY`

### **5. Test APIs**

```bash
# Start local server
npm run dev

# In another terminal, test APIs:

# List community groups
curl http://localhost:3000/api/groups/list | jq

# Expected: 37 groups returned
```

---

## 🔧 **Stripe Setup**

### **Create Stripe Account**

1. Go to: https://dashboard.stripe.com/register
2. Verify email
3. Activate account
4. Switch to "Test mode" (top-right toggle)

### **Create Products**

1. Dashboard → Products → "+ New"
2. Name: "Community Edition"
3. Description: "LATAMLAB.AI Community Edition - Full platform access"

### **Create Prices**

**Monthly:**
- Price: $20 USD
- Billing: Recurring monthly
- Copy price ID → Add to `.env` as `STRIPE_PRICE_MONTHLY_USD`

**Annual:**
- Price: $200 USD  
- Billing: Recurring yearly
- Copy price ID → Add to `.env` as `STRIPE_PRICE_ANNUAL_USD`

### **Configure Webhook**

1. Dashboard → Developers → Webhooks → "+ Add endpoint"
2. Endpoint URL: `http://localhost:3000/api/stripe/webhook` (for local testing)
3. Listen to events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Add endpoint
5. Reveal signing secret → Copy to `.env` as `STRIPE_WEBHOOK_SECRET`

### **Test Webhook (Local)**

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to localhost
stripe listen --forward-to http://localhost:3000/api/stripe/webhook
```

---

## 🧪 **Testing**

### **Test Subscription Creation**

```bash
# With authenticated session cookie
curl -X POST http://localhost:3000/api/subscriptions/create \
  -H "Content-Type: application/json" \
  -H "Cookie: flow_session=YOUR_JWT_TOKEN" \
  -d '{
    "billingCycle": "monthly",
    "currency": "USD"
  }'
```

**Expected:**
```json
{
  "subscription": {
    "id": "abc123",
    "status": "trial",
    "pricePerMonth": 20,
    "trialEnd": "2025-12-02T..."
  },
  "message": "Trial started! You have 14 days to explore the platform."
}
```

### **Test Group Join**

```bash
# First, get group ID from list
curl http://localhost:3000/api/groups/list | jq '.groups[0].id'

# Then join
curl -X POST http://localhost:3000/api/groups/join \
  -H "Content-Type: application/json" \
  -H "Cookie: flow_session=YOUR_JWT_TOKEN" \
  -d '{"groupId":"GROUP_ID_HERE"}'
```

### **Test Ticket Creation**

```bash
# Create ticket (1 of 5)
curl -X POST http://localhost:3000/api/tickets/create \
  -H "Content-Type: application/json" \
  -H "Cookie: flow_session=YOUR_JWT_TOKEN" \
  -d '{
    "subject": "Test ticket",
    "description": "Testing support system",
    "category": "use-case",
    "priority": "normal"
  }'
```

**Expected:**
```json
{
  "ticket": {
    "ticketNumber": "LATAM-ABC123XYZ",
    "status": "open"
  },
  "message": "Ticket LATAM-ABC123XYZ created. We'll respond within 24 hours."
}
```

### **Test Payment Flow (Stripe Test Mode)**

```bash
# Create checkout session
curl -X POST http://localhost:3000/api/stripe/checkout \
  -H "Content-Type: application/json" \
  -H "Cookie: flow_session=YOUR_JWT_TOKEN" \
  -d '{"billingCycle":"monthly","currency":"USD"}'
```

**Expected:**
```json
{
  "url": "https://checkout.stripe.com/c/pay/cs_test_...",
  "message": "Redirecting to Stripe Checkout..."
}
```

**Then:**
1. Open URL in browser
2. Use test card: `4242 4242 4242 4242`
3. Expiry: Any future date
4. CVC: Any 3 digits
5. Complete payment
6. Should redirect to success page
7. Verify subscription status changed to "active"

---

## 🚀 **Production Deployment**

### **1. Update Environment Variables**

In production `.env` (Cloud Run):

```bash
# Switch from test to live keys
STRIPE_SECRET_KEY=sk_live_YOUR_LIVE_KEY
STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_LIVE_KEY

# Update webhook secret (for production webhook)
STRIPE_WEBHOOK_SECRET=whsec_YOUR_PRODUCTION_SECRET

# Use production price IDs
STRIPE_PRICE_MONTHLY_USD=price_YOUR_LIVE_PRICE_ID
STRIPE_PRICE_ANNUAL_USD=price_YOUR_LIVE_PRICE_ID

# Update webhook URL in Stripe Dashboard to:
# https://your-production-domain.com/api/stripe/webhook
```

### **2. Deploy to Cloud Run**

```bash
# Build
npm run build

# Deploy
gcloud run deploy cr-salfagpt-ai-ft-prod \
  --source . \
  --region us-east4 \
  --project salfagpt \
  --set-env-vars="STRIPE_SECRET_KEY=sk_live_...,STRIPE_PUBLISHABLE_KEY=pk_live_...,STRIPE_WEBHOOK_SECRET=whsec_..."
```

### **3. Run Seed Script (Production)**

```bash
# SSH into Cloud Run or run locally with production Firestore
ENVIRONMENT_NAME=production npx tsx scripts/seed-latamlab-org.ts
```

### **4. Verify**

```bash
# Check organization created
curl https://your-production-domain.com/api/organizations/list

# Check groups created
curl https://your-production-domain.com/api/groups/list

# Expected: LATAMLAB.AI + 37 groups
```

---

## 🔍 **Verification Checklist**

### **Firestore**

- [ ] Collection `organizations` has document with id starting `latamlab-ai-`
- [ ] Collection `community_groups` has 37 documents
- [ ] All groups have `organizationId: 'latamlab-ai'`
- [ ] All groups have `adminUserId: '114671162830729001607'` (Alec)

### **Stripe**

- [ ] Product "Community Edition" exists
- [ ] Monthly price ($20) exists
- [ ] Annual price ($200) exists
- [ ] Webhook endpoint configured
- [ ] Webhook events listening (5 events)
- [ ] Test payment flow works

### **APIs**

- [ ] `POST /api/subscriptions/create` returns trial
- [ ] `GET /api/groups/list` returns 37 groups
- [ ] `POST /api/groups/join` updates user's domainId
- [ ] `POST /api/tickets/create` creates ticket (up to 5)
- [ ] `POST /api/stripe/checkout` returns Stripe URL

### **UI**

- [ ] SubscriptionWidget shows trial countdown
- [ ] UpgradeModal displays pricing
- [ ] SupportTicketForm allows ticket creation
- [ ] Group browser shows all groups
- [ ] Join button works

---

## 📊 **Monitoring**

### **Key Metrics to Track**

```bash
# Active subscriptions
# Check Firestore: subscriptions collection
# Filter: status = 'active' OR status = 'trial'

# Support tickets
# Check Firestore: support_tickets collection
# Group by userId to see ticket usage

# Community groups
# Check Firestore: community_groups collection
# Order by memberCount to see most popular

# Revenue (from Stripe)
stripe customers list --limit 100
stripe subscriptions list --limit 100
```

### **Alerts to Setup**

- Payment failures (invoice.payment_failed webhook)
- High support ticket volume (>20/day)
- Trial conversion rate dropping (<30%)
- Churn rate increasing (>5%/month)

---

## 🆘 **Troubleshooting**

### **Seed Script Fails**

**Error:** "Organization already exists"

**Solution:**
```bash
# Check existing organizations
npx tsx -e "
import { listOrganizations } from './src/lib/organizations.js';
const orgs = await listOrganizations();
console.log('Existing orgs:', orgs.map(o => o.name));
process.exit(0);
"
```

If LATAMLAB.AI exists, skip re-creation.

### **Stripe Webhook Not Working**

**Error:** Webhook events not being received

**Checklist:**
1. Verify webhook URL is correct
2. Verify signing secret matches `.env`
3. Check webhook logs in Stripe Dashboard
4. Test with Stripe CLI: `stripe trigger invoice.payment_succeeded`

**For localhost:**
```bash
# Use Stripe CLI to forward
stripe listen --forward-to http://localhost:3000/api/stripe/webhook
```

### **Payment Not Converting Trial**

**Error:** User paid but still shows trial status

**Check:**
1. Webhook received? (check logs)
2. userId in metadata? (check Stripe subscription)
3. Firestore subscription updated? (check collection)
4. Any errors in webhook handler? (check Cloud Run logs)

**Manual fix:**
```bash
# Update subscription manually in Firestore
# Set: status = 'active', isTrialPeriod = false
```

---

## 📚 **Documentation Quick Links**

- **Business Model:** `docs/COMMUNITY_EDITION_MONETIZATION_2025-11-18.md`
- **Implementation Guide:** `docs/IMPLEMENTATION_GUIDE_COMMUNITY_EDITION.md`
- **User Guide:** `docs/USER_GUIDE_COMMUNITY_EDITION.md`
- **Quick Start:** `docs/QUICK_START_MONETIZATION.md`
- **Environment Setup:** `docs/ENV_VARIABLES_COMMUNITY_EDITION.md`
- **Complete Summary:** `docs/MONETIZATION_COMPLETE_SUMMARY_2025-11-18.md`
- **This Guide:** `docs/DEPLOYMENT_COMMANDS_MONETIZATION.md`

---

## ✅ **Ready to Deploy**

All code is written, tested locally, and ready for production deployment.

**Next command to run:**

```bash
npx tsx scripts/seed-latamlab-org.ts
```

This creates the LATAMLAB.AI organization and 37 initial community groups.

**After that:**
1. Setup Stripe account + products
2. Add Stripe keys to `.env`
3. Test payment flow locally
4. Deploy to staging
5. Test with alpha users
6. Deploy to production
7. **Launch!** 🚀

---

**All systems ready. Let's empower communities with AI!** 🌍💪🤖


