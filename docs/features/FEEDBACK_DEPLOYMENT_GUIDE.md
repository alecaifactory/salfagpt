# Feedback System - Deployment Guide

**Feature:** User & Expert Feedback System  
**Date:** 2025-10-29  
**Version:** 1.0.0

---

## 📋 Pre-Deployment Checklist

### Code Quality
- [x] TypeScript: `npm run type-check` - 0 errors
- [ ] Build: `npm run build` - Success
- [ ] Linting: No errors
- [ ] All imports resolved

### Firestore
- [ ] Collections documented in `data.mdc`
- [ ] Indexes defined in `firestore.indexes.json`
- [ ] Indexes deployed to Firestore
- [ ] Security rules updated (if needed)

### Environment
- [x] `GOOGLE_AI_API_KEY` available
- [x] `GOOGLE_CLOUD_PROJECT` set
- [x] Gemini API enabled

---

## 🚀 Deployment Steps

### 1. Deploy Firestore Indexes

**Important:** Indexes must be deployed BEFORE using the feature in production.

```bash
# Deploy all indexes
firebase deploy --only firestore:indexes --project gen-lang-client-0986191192

# Wait for indexes to be ready (usually 1-2 minutes)
gcloud firestore indexes composite list \
  --project=gen-lang-client-0986191192 \
  --database='(default)'

# Verify STATUS is READY for:
# - message_feedback (userId, timestamp)
# - message_feedback (conversationId, timestamp)
# - feedback_tickets (status, priority, createdAt)
# - feedback_tickets (priority, createdAt)
# - feedback_tickets (category, createdAt)
```

### 2. Verify Gemini API Access

```bash
# Test Gemini API
curl -X POST "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=$GOOGLE_AI_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"contents":[{"parts":[{"text":"Hello"}]}]}'

# Should return valid response
```

### 3. Build and Deploy Application

```bash
# Build
npm run build

# Deploy to Cloud Run
gcloud run deploy flow-chat \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --project gen-lang-client-0986191192
```

### 4. Verify Deployment

```bash
# Get service URL
SERVICE_URL=$(gcloud run services describe flow-chat \
  --region us-central1 \
  --project gen-lang-client-0986191192 \
  --format='value(status.url)')

# Test feedback API
curl -X POST "$SERVICE_URL/api/feedback/submit" \
  -H "Content-Type: application/json" \
  -H "Cookie: flow_session=YOUR_SESSION_TOKEN" \
  -d '{
    "messageId": "test-msg",
    "conversationId": "test-conv",
    "userId": "YOUR_USER_ID",
    "userEmail": "YOUR_EMAIL",
    "userRole": "user",
    "feedbackType": "user",
    "userStars": 5
  }'

# Should return: {"success":true,"feedbackId":"...","ticketId":"..."}
```

---

## 🧪 Manual Testing

### Test as Expert User

1. **Login as Expert**
   - Email: `alec@getaifactory.com` or expert account
   - Role: `admin`, `expert`, or `superadmin`

2. **Send Message to Agent**
   - Go to any agent
   - Send: "¿Cuál es tu función principal?"
   - Wait for response

3. **Click Expert Feedback Button**
   - Purple button should appear: "Experto"
   - Click it

4. **Fill Expert Feedback**
   - Select rating: Sobresaliente
   - NPS: 9
   - CSAT: 5
   - Notes: "Respuesta clara y precisa"
   - [Optional] Capture screenshot
     - Draw circle around key element
     - Add arrow pointing to something
     - Add text annotation
     - Confirm screenshot
   - Click "Enviar Feedback"

5. **Verify Success**
   - Alert: "Feedback enviado exitosamente. Ticket creado: ticket-xyz"
   - Check console for logs

6. **View in Backlog**
   - Open user menu (bottom-left)
   - Click "Backlog de Feedback"
   - See new ticket in list
   - Verify AI-generated title
   - Expand ticket
   - See original feedback
   - See AI analysis
   - See screenshots

### Test as Standard User

1. **Login as User**
   - Email: User account (not admin/expert)
   - Role: `user`

2. **Send Message**
   - Any message to agent
   - Wait for response

3. **Click User Feedback Button**
   - Violet-yellow gradient button: "Calificar"
   - Click it

4. **Fill User Feedback**
   - Select: 4 stars
   - Hover to see labels
   - Comment: "Muy útil, gracias"
   - [Optional] Screenshot with annotations
   - Click "Enviar"

5. **Verify**
   - Success alert
   - Ticket created (visible to admins)

### Test Screenshot Annotator

1. **Open Feedback Modal**
2. **Click "Capturar Pantalla"**
3. **Annotator opens with screenshot**
4. **Test each tool:**
   - **Circle:** Click center, drag to edge
   - **Rectangle:** Click corner, drag to opposite corner
   - **Arrow:** Click start, drag to end (see arrowhead)
   - **Text:** Click position, type text, click "Agregar"
5. **Change colors**
6. **Test Undo** (removes last annotation)
7. **Test Clear All**
8. **Click "Confirmar"**
9. **Verify screenshot appears in feedback modal**

---

## 🐛 Troubleshooting

### Issue: "Feedback button not showing"

**Cause:** Message is streaming or role check failing

**Fix:**
1. Check `msg.isStreaming === false`
2. Check `currentUser.role` is correct
3. Verify import of `Award` and `Star` icons

### Issue: "Screenshot not capturing"

**Cause:** Canvas API not working

**Fix:**
1. Check browser supports Canvas API
2. Check console for errors
3. Verify `captureViewport()` implementation

### Issue: "Ticket not created"

**Cause:** Gemini API error or Firestore write failure

**Fix:**
1. Check `GOOGLE_AI_API_KEY` is set
2. Check Firestore permissions
3. Check API logs: `gcloud logging read "resource.type=cloud_run_revision"`
4. Fallback: `createBasicTicket()` should still work

### Issue: "Cannot view backlog"

**Cause:** User role insufficient

**Fix:**
1. Verify user role is `admin` or `expert`
2. Check menu item visibility condition
3. Check API `/api/feedback/tickets` auth

---

## 📊 Monitoring

### Metrics to Track

**Feedback Volume:**
```sql
-- Count feedback by type and day
SELECT
  DATE(timestamp) as date,
  feedbackType,
  COUNT(*) as count
FROM message_feedback
WHERE DATE(timestamp) >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY)
GROUP BY date, feedbackType
ORDER BY date DESC
```

**Ticket Velocity:**
```sql
-- Tickets created and resolved per week
SELECT
  DATE_TRUNC(createdAt, WEEK) as week,
  COUNT(*) as created,
  COUNTIF(resolvedAt IS NOT NULL) as resolved
FROM feedback_tickets
GROUP BY week
ORDER BY week DESC
```

**Quality Trends:**
```sql
-- Expert ratings over time
SELECT
  DATE(timestamp) as date,
  expertRating,
  COUNT(*) as count,
  AVG(npsScore) as avg_nps,
  AVG(csatScore) as avg_csat
FROM message_feedback
WHERE feedbackType = 'expert'
GROUP BY date, expertRating
ORDER BY date DESC
```

---

## 🔒 Security Considerations

### Authentication
- ✅ All API endpoints verify JWT session
- ✅ Ownership verified (session.id === userId)
- ✅ Role-based access for backlog (admin/expert only)

### Data Privacy
- ✅ Users only see their own feedback
- ✅ Admins see all feedback (for backlog management)
- ✅ Screenshots stored as data URLs (no external hosting)
- ✅ AI analysis non-blocking (failure doesn't block feedback)

### Input Validation
- ✅ Required fields validated
- ✅ Enum values validated (feedbackType, expertRating, etc.)
- ✅ User role verified before allowing expert feedback
- ✅ SQL injection prevented (Firestore NoSQL)

---

## 💰 Cost Estimation

### Gemini API Costs

**Per Feedback with Screenshot:**
- Model: `gemini-2.5-flash`
- Input: ~500 tokens (prompt + annotation description)
- Output: ~1000 tokens (analysis)
- **Cost:** ~$0.0004 per feedback

**Per Ticket Generation:**
- Input: ~300 tokens
- Output: ~1500 tokens
- **Cost:** ~$0.0005 per ticket

**Total per Expert Feedback with Screenshot:**
~$0.0009 (~$0.90 per 1000 feedbacks)

**Optimization:**
- Use Flash (not Pro) - 94% cost savings
- Cache AI responses for similar feedbacks (future)
- Batch processing for multiple screenshots

---

## 🔮 Future Optimizations

### Performance
- [ ] Lazy load backlog (pagination)
- [ ] Virtual scrolling for large ticket lists
- [ ] Image compression for screenshots
- [ ] Cache AI analysis results

### Features
- [ ] Feedback trends chart
- [ ] Email notifications for critical feedback
- [ ] Slack integration for new tickets
- [ ] Export backlog as CSV/PDF
- [ ] Roadmap view (Gantt chart)

### AI Enhancements
- [ ] Use embeddings to detect duplicate tickets
- [ ] ML model to predict priority
- [ ] Sentiment analysis on feedback
- [ ] Auto-categorization improvement over time

---

## ✅ Acceptance Criteria

### Must Have (MVP)
- [x] Expert can submit detailed feedback
- [x] User can submit star rating
- [x] Screenshots with basic annotations
- [x] AI generates tickets from feedback
- [x] SuperAdmin can view backlog
- [x] Tickets can be updated (status, priority)

### Should Have
- [ ] Notification badge (new tickets count)
- [ ] Email alerts for critical feedback
- [ ] Ticket search functionality
- [ ] Filter persistence (save filters)

### Nice to Have
- [ ] Feedback analytics dashboard
- [ ] A/B testing based on feedback
- [ ] Integration with external tools
- [ ] Mobile-optimized feedback UI

---

## 📚 Related Documentation

### Implementation
- `docs/features/FEEDBACK_SYSTEM_2025-10-29.md` - Feature documentation
- `src/types/feedback.ts` - Type definitions
- `src/lib/feedback-service.ts` - AI integration
- `.cursor/rules/data.mdc` - Updated with new collections

### API
- `src/pages/api/feedback/submit.ts` - Submit endpoint
- `src/pages/api/feedback/tickets.ts` - List tickets
- `src/pages/api/feedback/tickets/[id].ts` - Update/Delete

### UI
- `src/components/ExpertFeedbackPanel.tsx`
- `src/components/UserFeedbackPanel.tsx`
- `src/components/ScreenshotAnnotator.tsx`
- `src/components/FeedbackBacklogDashboard.tsx`

---

**Deployment Status:** Ready for deployment  
**Manual Testing:** Required before production  
**Rollback Plan:** Remove feedback buttons, disable endpoints  

---

**Questions/Issues:** Contact @alec

