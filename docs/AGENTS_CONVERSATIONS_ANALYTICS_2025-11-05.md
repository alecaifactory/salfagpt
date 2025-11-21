# 📊 Agents & Conversations Analytics - New Feature

**Date:** November 5, 2025  
**Feature:** New analytics section showing conversations per agent and per user  
**Status:** ✅ Implemented, Ready for Testing

---

## 🎯 What Was Added

### 1. New API Endpoint

**File:** `src/pages/api/analytics/agents-conversations.ts`

**Endpoint:** `POST /api/analytics/agents-conversations`

**Request:**
```json
{
  "filters": {
    "startDate": "2025-10-20T00:00:00.000Z",
    "endDate": "2025-11-06T23:59:59.999Z"
  }
}
```

**Response:**
```json
{
  "agentStats": [
    {
      "id": "agent123",
      "title": "Agent Name",
      "ownerName": "Owner Name",
      "ownerEmail": "owner@email.com",
      "directMessages": 10,
      "directQuestions": 5,
      "childConversations": 15,
      "totalMessages": 50,
      "totalQuestions": 25,
      "uniqueUsers": 5,
      "conversations": [
        {
          "id": "conv123",
          "title": "Conversation Title",
          "userId": "user123",
          "userName": "User Name",
          "userEmail": "user@email.com",
          "messageCount": 10,
          "questionCount": 5
        }
      ]
    }
  ],
  "userStats": [
    {
      "userId": "user123",
      "userName": "User Name",
      "userEmail": "user@email.com",
      "company": "Company Name",
      "totalMessages": 50,
      "totalQuestions": 25,
      "conversationsCount": 10,
      "agentsUsed": 3,
      "topAgents": [
        {
          "agentId": "agent123",
          "agentTitle": "Agent Name",
          "questionCount": 15
        }
      ]
    }
  ],
  "summary": {
    "totalAgents": 43,
    "activeAgents": 18,
    "totalUsers": 27,
    "activeUsers": 15,
    "totalMessages": 562,
    "totalQuestions": 281
  }
}
```

**What It Does:**
- Loads all agents, users, and messages from Firestore
- Calculates statistics per agent and per user
- Groups conversations by agent
- Shows which users use which agents
- Filters by date range

---

### 2. New UI Section

**File:** `src/components/SalfaAnalyticsDashboard.tsx`

**Component:** `AgentsConversationsSection`

**Location:** Added as a new section at the bottom of the Analíticas Avanzadas dashboard

**Features:**

#### Summary Cards (6 KPIs):
1. **Total Agentes** - Blue
2. **Agentes Activos** - Green
3. **Usuarios Activos** - Purple
4. **Total Mensajes** - Indigo
5. **Total Preguntas** - Cyan
6. **Avg Msgs/Agente** - Amber

#### Two Views (Toggle):

**View 1: Por Agente** (Conversations per Agent)
- List of all active agents sorted by total messages
- Each agent shows:
  - Number of unique users
  - Number of conversations
  - Total messages
  - Total questions
- **Expandable:** Click to see:
  - Direct messages on agent
  - List of all conversations with user details
  - Message counts per conversation

**View 2: Por Usuario** (Conversations per User)
- List of all active users sorted by total questions
- Each user shows:
  - Number of agents used
  - Number of conversations
  - Total messages
  - Total questions
- **Expandable:** Click to see:
  - Top 10 agents used by this user
  - Question count per agent

---

## 🎨 UI Design

### Colors:
- **Blue (#3b82f6):** Agents count, users
- **Green (#10b981):** Conversations, active status
- **Purple (#a855f7):** Total messages
- **Indigo (#6366f1):** Questions
- **Cyan:** Metrics
- **Amber:** Averages

### Layout:
```
┌─────────────────────────────────────────────────────┐
│  📊 Agentes & Conversaciones                        │
│  Análisis detallado de uso por agente y usuario    │
├─────────────────────────────────────────────────────┤
│  [6 Summary KPI Cards]                              │
├─────────────────────────────────────────────────────┤
│  [ Por Agente (18) ] [ Por Usuario (15) ]          │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Agent List or User List (expandable rows)         │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 📋 Testing Checklist

### Backend Testing:
- [ ] Start dev server: `npm run dev`
- [ ] Test API endpoint:
  ```bash
  curl -X POST http://localhost:3000/api/analytics/agents-conversations \
    -H "Content-Type: application/json" \
    -d '{"filters":{"startDate":"2025-10-20","endDate":"2025-11-06"}}'
  ```
- [ ] Verify response has `agentStats`, `userStats`, and `summary`
- [ ] Check data accuracy against Firestore

### Frontend Testing:
- [ ] Open http://localhost:3000/chat
- [ ] Login as alec@getaifactory.com
- [ ] Click "Analíticas Avanzadas" in user menu
- [ ] Scroll to bottom to find new "Agentes & Conversaciones" section
- [ ] Verify summary cards display
- [ ] Toggle between "Por Agente" and "Por Usuario" views
- [ ] Expand an agent to see conversations
- [ ] Expand a user to see their top agents
- [ ] Change date range and verify data updates

---

## 📊 Expected Results

Based on current data (as of Nov 5, 2025):

### Summary:
- Total Agentes: 43
- Agentes Activos: 18
- Usuarios Activos: 15
- Total Mensajes: ~562
- Total Preguntas: ~281

### Top Agents:
1. **GESTION BODEGAS GPT (S001)** - 174 messages, 12 users, 55 conversations
2. **SSOMA** - 146 messages, 4 users, 43 conversations
3. **GOP GPT M3** - 52 messages, 6 users, 26 conversations
4. **Asistente Legal Territorial RDI (M001)** - 101 messages, 8 users, 24 conversations

### Top Users:
1. **Alec Dickinson** - 137 questions, 96 agents used
2. **Sebastian Orellana** - 58 questions, 32 agents used
3. **Alejandro Tomás** - 36 questions, 31 agents used
4. **FRANCIS DIAZ** - 17 questions, 8 agents used

### M001 Specific:
- **Total Users:** 8 (including conversations + direct messages)
- **Active Users from Shared List:**
  - Sebastian Orellana: 8 conversations
  - Alejandro Tomás: 5 conversations
  - FRANCIS DIAZ: 2 conversations
  - JULIO RIVERO: 1 conversation
  - IRIS REYGADAS: 1 conversation

---

## 🚀 Deployment

### Files Changed:
1. ✅ `src/pages/api/analytics/agents-conversations.ts` (NEW)
2. ✅ `src/components/SalfaAnalyticsDashboard.tsx` (MODIFIED)

### No Breaking Changes:
- ✅ Additive only - new section added
- ✅ Existing analytics sections unchanged
- ✅ Backward compatible
- ✅ No database changes needed

### To Deploy:
```bash
# 1. Type check
npm run type-check

# 2. Build
npm run build

# 3. Test locally
npm run dev
# Open http://localhost:3000/chat
# Test the new section

# 4. Deploy (when ready)
# Follow your normal deployment process
```

---

## 💡 Benefits

1. **Visibility:** See exactly which agents are being used and by whom
2. **Adoption Tracking:** Identify unused agents or low-adoption agents
3. **User Engagement:** See which users are most active and with which agents
4. **Resource Allocation:** Understand where to focus support and training
5. **ROI Measurement:** Measure value delivered per agent

---

## 🔍 Use Cases

### For M001 Analysis:
- Quickly see that M001 has 8 active users (not just 1)
- Identify Sebastian Orellana as top user (8 conversations)
- See that 4 shared users ARE using it
- Track adoption over time

### For Platform Management:
- Identify most/least used agents
- Find power users who might be good trainers
- Spot agents that need promotion or improvement
- Track cross-agent usage patterns

---

## 📝 Notes

### Data Sources:
- **Agents:** From `conversations` collection where `isAgent == true`
- **Conversations:** From `conversations` collection where `isAgent == false` and `agentId` matches
- **Messages:** From `messages` collection grouped by conversationId
- **Users:** From `users` collection with fallback to googleUserId

### Performance:
- Loads all data in a single request
- Client-side grouping and filtering
- Should load in <3 seconds for typical dataset
- Consider pagination if agents > 100

### Future Enhancements:
- [ ] Add export to Excel functionality
- [ ] Add filtering by specific agent
- [ ] Add time-series charts (adoption over time)
- [ ] Add conversation quality metrics
- [ ] Add cost breakdown per agent
- [ ] Add response time statistics

---

**Ready to test!** Start the dev server and check the new "Agentes & Conversaciones" section in Analíticas Avanzadas.








