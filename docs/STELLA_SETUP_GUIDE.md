# 🔒 Stella Viral Feedback Loop - Setup Guide

**CONFIDENTIAL - Internal Development Only**

---

## 📋 Quick Start (5 Minutes)

### 1. Install Dependencies

```bash
# Navigate to project root
cd /Users/alec/salfagpt

# Install required packages
npm install html2canvas date-fns

# Verify installation
npm list html2canvas date-fns
```

### 2. Create Firestore Collections

```bash
# Run setup script (creates collections and indexes)
npx tsx scripts/setup-stella-collections.ts
```

**Collections created:**
- `feedback_sessions`
- `feedback_tickets`
- `backlog_items`
- `roadmap_items`
- `feedback_agent_memory`
- `company_okrs`
- `worktree_assignments`
- `ticket_counters`

### 3. Add Stella Tool to Chat Interface

```typescript
// src/components/ChatInterfaceWorking.tsx

// Add import
import StellaMarkerTool from './StellaMarkerTool';

// Add to component (before closing div)
<StellaMarkerTool
  userId={currentUser?.id || ''}
  companyId={currentUser?.company || 'demo'}
  onTicketCreated={(ticketId, shareUrl) => {
    console.log('✅ Stella ticket created:', ticketId);
    // Optional: Show toast notification
  }}
/>
```

### 4. Add CSS Animations

```typescript
// src/layouts/Layout.astro or global CSS import

import '../styles/stella-animations.css';
```

### 5. Test Locally

```bash
# Start dev server
npm run dev

# Navigate to chat
open http://localhost:3000/chat

# Test Stella tool
# 1. Look for purple pencil button (top-right)
# 2. Click to activate
# 3. Click anywhere on page
# 4. Stella marker appears with color cycling
# 5. Feedback box surfaces
# 6. Enter feedback and submit
# 7. Watch submit animation
# 8. See share modal
```

---

## 🔧 Detailed Configuration

### Firestore Security Rules

Add to `firestore.rules`:

```javascript
// Feedback Sessions
match /feedback_sessions/{sessionId} {
  allow read: if request.auth != null && (
    resource.data.userId == request.auth.uid ||
    isAdmin(request.auth.uid)
  );
  allow create: if request.auth != null &&
                request.resource.data.userId == request.auth.uid;
  allow update: if request.auth != null &&
                resource.data.userId == request.auth.uid;
}

// Feedback Tickets (Viral Loop)
match /feedback_tickets/{ticketId} {
  // Read: Company members (for upvoting/viewing)
  allow read: if request.auth != null &&
              resource.data.companyId == getUserCompany(request.auth.uid);
  
  // Create: Session creators
  allow create: if request.auth != null &&
                request.resource.data.userId == request.auth.uid;
  
  // Update: For upvotes and shares (validated in Cloud Function)
  allow update: if request.auth != null &&
                resource.data.companyId == getUserCompany(request.auth.uid);
}

// Backlog Items (Admin only)
match /backlog_items/{itemId} {
  allow read, write: if request.auth != null &&
                      isAdmin(request.auth.uid);
}

// Roadmap Items (Admin only)
match /roadmap_items/{itemId} {
  allow read, write: if request.auth != null &&
                      isAdmin(request.auth.uid);
}

// Helper function
function isAdmin(userId) {
  return get(/databases/$(database)/documents/users/$(userId)).data.role == 'admin';
}

function getUserCompany(userId) {
  return get(/databases/$(database)/documents/users/$(userId)).data.company;
}
```

### Deploy Security Rules

```bash
# Deploy to Firestore
firebase deploy --only firestore:rules --project gen-lang-client-0986191192
```

---

## 🎨 Customization

### Stella Marker Colors

Edit `src/styles/stella-animations.css`:

```css
/* Change color cycle */
@keyframes stellaColorCycle {
  0% {
    fill: #a855f7; /* Your purple */
  }
  33% {
    fill: #fbbf24; /* Your yellow */
  }
  66% {
    fill: #10b981; /* Your green */
  }
  100% {
    fill: #a855f7;
  }
}
```

### Widget Position

```typescript
// Change position
<StellaMarkerTool
  position="bottom-left"  // or top-right, top-left
  // ...
/>
```

### Animation Speed

```typescript
// In StellaMarkerTool.tsx
const ANIMATION_DURATION = 2000; // 2 seconds (default)

// Adjust in animateColors():
animationPhase: (marker.animationPhase + 0.01) % 1,
//                                    ^^^^
// Increase for faster (0.02 = 2x speed)
// Decrease for slower (0.005 = 0.5x speed)
```

---

## 🔗 Integration with Existing Features

### Add Admin Route

Create `src/pages/admin/feedback.astro`:

```astro
---
import AdminFeedbackPanel from '../../components/AdminFeedbackPanel';
import Layout from '../../layouts/Layout.astro';

// Get session
import { getSession } from '../../lib/auth';
const session = getSession(Astro.cookies);

// Require admin
if (!session || session.role !== 'admin') {
  return Astro.redirect('/auth/login');
}
---

<Layout title="Stella Feedback Management">
  <AdminFeedbackPanel
    client:load
    companyId={session.company || 'demo'}
    adminUserId={session.id}
  />
</Layout>
```

### Add to Navigation

```typescript
// In main navigation (if admin)
{hasPermission(currentUser, 'canManageUsers') && (
  <a href="/admin/feedback" className="nav-link">
    <MessageCircle className="w-4 h-4" />
    Stella Feedback
  </a>
)}
```

---

## 📊 Analytics Setup

### Track Stella Events

```typescript
// Add to analytics tracking
trackEvent('stella_tool_activated', {
  userId,
  pageUrl: window.location.href,
  timestamp: new Date(),
});

trackEvent('stella_marker_placed', {
  userId,
  position: { x, y },
  elementPath,
});

trackEvent('stella_feedback_submitted', {
  userId,
  ticketId,
  feedbackLength: feedback.length,
  hasScreenshot: screenshots.length > 0,
});

trackEvent('stella_ticket_shared', {
  userId,
  ticketId,
  platform: 'slack',
  viralDepth: 0,
});

trackEvent('stella_ticket_upvoted', {
  userId,
  ticketId,
  referredBy: trackingToken.sharedBy,
});
```

### BigQuery Schema

```sql
CREATE TABLE `gen-lang-client-0986191192.flow_analytics.stella_events` (
  event_id STRING NOT NULL,
  event_type STRING NOT NULL,
  user_id STRING NOT NULL,
  company_id STRING NOT NULL,
  ticket_id STRING,
  
  -- Event details
  details JSON,
  
  -- Viral tracking
  viral_depth INT64,
  referred_by STRING,
  
  -- Timestamp
  timestamp TIMESTAMP NOT NULL,
  
  -- Partitioning
  date DATE NOT NULL
)
PARTITION BY date
CLUSTER BY user_id, event_type, date;
```

---

## 🧪 Testing

### Manual Testing Checklist

**Stella Marker:**
- [ ] Click tool activates (purple glow)
- [ ] Cursor changes to Stella shape
- [ ] Click places marker
- [ ] Colors cycle (purple → yellow → green)
- [ ] Marker pulses gently
- [ ] Feedback box appears
- [ ] Input works properly

**Submit Flow:**
- [ ] Submit button enabled when text entered
- [ ] Submit triggers animation
- [ ] Marker turns blue
- [ ] Marker spins 360°
- [ ] Marker scales down
- [ ] Stars explode outward
- [ ] Stars fade out
- [ ] Checkmark badge appears
- [ ] Ticket ID displayed

**Share Modal:**
- [ ] Modal appears after submit
- [ ] Ticket ID shown correctly
- [ ] Status timeline displays
- [ ] Share buttons work (Slack, Teams, WhatsApp, Copy)
- [ ] Preview card shown
- [ ] Close button works

**Admin Panel:**
- [ ] Loads without errors
- [ ] Stats display correctly
- [ ] Filters work
- [ ] Session cards clickable
- [ ] Detail modal shows full conversation
- [ ] Approve button works
- [ ] Convert to backlog works

### Automated Tests (Future)

```bash
# Unit tests
npm test src/components/StellaMarkerTool.test.tsx

# Integration tests
npm test src/tests/stella-integration.test.tsx

# E2E tests
npm run test:e2e -- stella-viral-loop.spec.ts
```

---

## 🚀 Deployment

### Pre-Deployment Checklist

- [ ] All TypeScript errors resolved
- [ ] Manual testing complete
- [ ] Animations smooth (60fps)
- [ ] Mobile responsive
- [ ] Accessibility verified
- [ ] Security rules deployed
- [ ] API endpoints tested
- [ ] Error handling verified
- [ ] Analytics tracking confirmed
- [ ] Documentation complete

### Feature Flag Rollout

```typescript
// .env or feature flags service
ENABLE_STELLA_TOOL=false  // Start disabled

// Gradual rollout
STELLA_ROLLOUT_PERCENTAGE=0   // Start at 0%
STELLA_ROLLOUT_PERCENTAGE=10  // Week 1: 10% of users
STELLA_ROLLOUT_PERCENTAGE=50  // Week 2: 50% of users
STELLA_ROLLOUT_PERCENTAGE=100 // Week 3: All users
```

```typescript
// In ChatInterfaceWorking.tsx
const STELLA_ENABLED = process.env.ENABLE_STELLA_TOOL === 'true';
const ROLLOUT_PERCENTAGE = parseInt(process.env.STELLA_ROLLOUT_PERCENTAGE || '0');

// Determine if user gets Stella
const userGetsStella = STELLA_ENABLED && (
  // Admin always gets it
  currentUser?.role === 'admin' ||
  // Or random % based on rollout
  (Math.random() * 100) < ROLLOUT_PERCENTAGE
);

{userGetsStella && (
  <StellaMarkerTool {...props} />
)}
```

### Deploy Command

```bash
# Build
npm run build

# Type check
npm run type-check

# Deploy to production
gcloud run deploy flow-chat \
  --source . \
  --region us-central1 \
  --set-env-vars="ENABLE_STELLA_TOOL=true,STELLA_ROLLOUT_PERCENTAGE=10"
```

---

## 📊 Monitoring

### Key Metrics to Watch

**Day 1:**
```bash
# Tool activation rate
SELECT 
  COUNT(DISTINCT user_id) as active_users,
  COUNT(*) as activations,
  COUNT(*) / COUNT(DISTINCT user_id) as avg_activations_per_user
FROM `gen-lang-client-0986191192.flow_analytics.stella_events`
WHERE event_type = 'stella_tool_activated'
  AND DATE(timestamp) = CURRENT_DATE();
```

**Week 1:**
```bash
# Viral metrics
SELECT
  ticket_id,
  COUNT(DISTINCT CASE WHEN event_type = 'stella_ticket_upvoted' THEN user_id END) as upvotes,
  COUNT(DISTINCT CASE WHEN event_type = 'stella_ticket_shared' THEN user_id END) as shares,
  COUNT(DISTINCT CASE WHEN event_type = 'stella_ticket_viewed' THEN user_id END) as views,
  SAFE_DIVIDE(
    COUNT(DISTINCT CASE WHEN event_type = 'stella_ticket_shared' THEN user_id END),
    COUNT(DISTINCT CASE WHEN event_type = 'stella_ticket_viewed' THEN user_id END)
  ) as viral_coefficient
FROM `gen-lang-client-0986191192.flow_analytics.stella_events`
WHERE DATE(timestamp) >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY)
GROUP BY ticket_id
HAVING viral_coefficient > 1.0
ORDER BY viral_coefficient DESC;
```

### Alerts to Configure

```typescript
// Low adoption alert
if (activationRate < 0.10) {  // Less than 10%
  alertTeam('Stella adoption low - investigate UX friction');
}

// High virality alert
if (viralCoefficient > 1.5) {
  alertTeam('Stella going viral! 🔥 Monitor for trending topics');
}

// Fraud detection alert
if (fraudSignals.length > 0) {
  alertSecurity('Potential fraud detected in Stella feedback');
}
```

---

## 🐛 Troubleshooting

### Stella marker not appearing

**Symptoms:** Click doesn't place marker

**Causes:**
1. Z-index conflict with other UI
2. Click handler blocked
3. Tool not activated

**Fix:**
```css
/* Ensure Stella marker is on top */
.stella-marker {
  z-index: 9999 !important;
}
```

### Colors not cycling

**Symptoms:** Marker stays one color

**Causes:**
1. Animation not starting
2. CSS not loaded
3. Animation frame cancelled

**Fix:**
```typescript
// Check if animateColors is running
useEffect(() => {
  console.log('🎨 Starting color animation');
  animateColors();
}, [markers]);
```

### Share modal not showing

**Symptoms:** Submit completes but no modal

**Causes:**
1. API response missing shareCard
2. State not updating
3. Modal z-index issue

**Fix:**
```typescript
// Debug API response
const result = await response.json();
console.log('Share card:', result.shareCard);
setCurrentTicket(result);
setShowShareModal(true);
```

### Upvotes not incrementing

**Symptoms:** Click doesn't increase count

**Causes:**
1. Already upvoted
2. Rate limit hit
3. API error

**Fix:**
```typescript
// Check rate limit response
const result = await StellaFeedback.upvote(ticketId);
if (!result.success) {
  console.warn('Upvote failed:', result.reason);
}
```

---

## 📚 Additional Resources

### Internal Documentation
- `.cursor/rules/viral-feedback-loop.mdc` - Complete system docs
- `.cursor/rules/feedback-system.mdc` - Data schema reference
- `docs/features/CONFIDENTIAL-stella-viral-loop-2025-10-27.md` - Viral mechanics
- `docs/STELLA_IMPLEMENTATION_SUMMARY_2025-10-27.md` - Progress tracking

### External References (Inspiration Only)
- Linear issue creation UX
- Figma commenting system
- Loom sharing mechanics
- ProductBoard voting

**Note:** Do not copy implementations directly. Our approach is novel and proprietary.

---

## 🔒 Security Reminder

**Before committing code:**

```bash
# Check for exposed secrets
grep -r "CONFIDENTIAL" src/ docs/

# Verify proprietary files marked
grep -r "PROPRIETARY" .cursor/rules/

# Ensure viral algorithms obfuscated
# (Don't commit viral coefficient formula in plaintext)
```

**Before sharing with team:**
- ✅ Ensure team member has signed NDA
- ✅ Share via encrypted channel (not public Slack)
- ✅ Mark messages as confidential
- ✅ No screenshots of proprietary code

---

## ✅ Launch Checklist

### Pre-Launch (Complete these)

**Technical:**
- [ ] All animations smooth
- [ ] All API endpoints working
- [ ] Error handling complete
- [ ] Mobile responsive
- [ ] TypeScript 0 errors
- [ ] Performance optimized

**Security:**
- [ ] Security rules deployed
- [ ] Rate limiting active
- [ ] Fraud detection enabled
- [ ] API keys secured
- [ ] Domain whitelist configured

**Legal:**
- [ ] Patent application filed
- [ ] Team NDAs signed
- [ ] Proprietary code obfuscated
- [ ] License headers added
- [ ] Terms of use updated

**Business:**
- [ ] Success metrics defined
- [ ] A/B test plan ready
- [ ] Rollback plan documented
- [ ] Team trained
- [ ] Support docs ready

### Launch Day

1. **Enable for 10% of users** (feature flag)
2. **Monitor metrics** every hour
3. **Watch for errors** in logs
4. **Collect user feedback** on Stella itself
5. **Adjust based on data**

### Post-Launch (Week 1)

1. **Daily metrics review**
2. **Optimize friction points**
3. **Expand to 50%** if metrics good
4. **Iterate on UX**
5. **Full rollout** if viral coefficient >1.0

---

## 🎓 Best Practices

### DO's ✅

1. ✅ **Keep animations fast** (<300ms)
2. ✅ **Make sharing obvious** (big buttons)
3. ✅ **Celebrate contributors** (public recognition)
4. ✅ **Fast-track viral tickets** (implement quickly)
5. ✅ **Monitor viral coefficient** (optimize for >1.3)
6. ✅ **Protect proprietary code** (obfuscate algorithms)
7. ✅ **Test on mobile** (50%+ traffic)
8. ✅ **A/B test everything** (CTA, colors, copy)

### DON'Ts ❌

1. ❌ **Don't add friction** to sharing flow
2. ❌ **Don't expose private data** in share cards
3. ❌ **Don't ignore fraud signals** (act fast)
4. ❌ **Don't slow down animations** (kills delight)
5. ❌ **Don't make authentication complex** (kills virality)
6. ❌ **Don't share proprietary docs** externally
7. ❌ **Don't let viral tickets languish** (breaks trust)
8. ❌ **Don't over-gamify** (authenticity matters)

---

## 📈 Success Metrics

### Week 1 Targets
- Tool activation: >15%
- Feedback completion: >60%
- Share rate: >10%
- Viral coefficient: >0.8

### Month 1 Targets
- Tool activation: >25%
- Share rate: >15%
- Viral coefficient: >1.2
- Upvote conversion: >30%
- Time to validation: <5 days

### Month 3 Targets
- Tool activation: >40%
- Share rate: >20%
- Viral coefficient: >1.5
- Upvote conversion: >35%
- Time to implementation: <21 days
- ROI: >300%

---

## 🔮 Roadmap

### Completed ✅
- Data schema
- Stella marker tool
- Feedback chat widget
- Admin panel
- CLI commands
- API endpoints
- Documentation

### In Progress 🚧
- Screenshot capture
- Annotation drawing tools
- Share card generation
- Viral tracking

### Next Up 📅
- Slack/Teams integration
- Upvote system
- Points and badges
- Leaderboard
- Network graph

### Future 🔮
- MCP server
- Mobile SDK
- Video annotations
- AI-powered insights
- Public API

---

## 💡 Tips for Success

### For Users
- Make feedback specific and actionable
- Use Stella marker to point exactly where
- Share with relevant teammates (not everyone)
- Upvote features you actually need

### For Admins
- Review feedback daily
- Fast-track high-upvote items
- Recognize top contributors
- Close the loop (notify when implemented)

### For Developers
- Protect proprietary code
- Monitor performance
- Optimize friction points
- A/B test relentlessly

---

## 📞 Support

**Internal Only:**
- Slack: #stella-dev
- Email: alec@getaifactory.com
- Docs: This guide + cursor rules

**External Support:**
- Not available (internal tool)

---

**Last Updated:** 2025-10-27  
**Next Review:** 2025-11-03  
**Status:** 30% Complete - Foundation Ready  
**Classification:** 🔒 CONFIDENTIAL

