# 🤖 Prompt for Gemini 2.0 Flash Experimental to Build Statistics Dashboard

Copy and paste this complete prompt into AI Studio with Gemini 2.0 Flash Experimental enabled.

---

## PROMPT START

I need you to build a complete statistics dashboard for SalfaGPT based on functional requirements and exported data. This is a production application that needs to be professional, performant, and fully functional.

### Context

**Platform:** SalfaGPT - AI assistant platform for Salfa Corp
**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS v3.4.17
**Current Status:** Data exported and ready in 7 CSV files
**Your Task:** Build the complete statistics dashboard UI

### Functional Requirements Reference

I'm attaching the complete functional requirements document and mockup. The key requirements are:

**RF-02: Global Filters**
- Date range picker (start/end dates)
- Quick filters: "Last 7 days", "Last 30 days"
- Filter by: Assistant name, Domain, Effectiveness level

**RF-03: KPIs Module**
Display 4-5 key metric cards:
- Total Messages
- Total Conversations
- Active Users
- Average Response Time (if available)
- Each with comparison to previous period (+X% vs previous)

**RF-04: Charts Module (5 charts)**
- RF-04.1: Activity chart (line chart) - conversations/messages per day
- RF-04.2: Messages by Assistant (bar chart) - distribution across agents
- RF-04.3: Distribution by Hour (area/line chart) - hourly activity pattern
- RF-04.4: Messages by User (horizontal bar) - top 10 users
- RF-04.5: Users by Domain (pie chart) - domain distribution

**RF-05: Tables Module**
- RF-05.1: Top 10 Active Users table with email and message count

**RF-06: AI Assistant for Statistics**
- Chat interface to ask questions about the data
- Suggested questions panel
- Contextual answers based on filtered data

**RF-07: Export & Reports**
- Export current view to .xlsx and PDF
- Schedule automated reports via email

### Available Data Files

I have 7 CSV files ready with all the data:

1. **1_user_engagement_2025-11-28.csv** (48 users)
   - Columns: User_ID, User_Email, User_Name, Domain, Total_Messages, User_Questions, Assistant_Responses, First_Message, Last_Message, Days_Active

2. **2_agent_performance_2025-11-28.csv** (655 agents)
   - Columns: Agent_ID, Agent_Title, Agent_Owner, Owner_Email, Total_Messages, User_Questions, Assistant_Responses, Unique_Users, Conversations_Count, Avg_Messages_Per_User

3. **3_daily_activity_2025-11-28.csv** (30 days)
   - Columns: Date, Day_Name, Total_Messages, User_Questions, Assistant_Responses, Unique_Users, Active_Agents

4. **4_hourly_distribution_2025-11-28.csv** (24 hours)
   - Columns: Hour, Total_Messages, User_Questions, Assistant_Responses, Avg_Messages_Per_Day

5. **5_domain_distribution_2025-11-28.csv** (13 domains)
   - Columns: Domain, Unique_Users, Total_Messages, User_Questions, Assistant_Responses, Percentage_Of_Users

6. **6_user_agent_day_detail_2025-11-28.csv** (661 records - MASTER)
   - Columns: Date, Day_Name, Agent_ID, Agent_Title, User_ID, User_Email, User_Name, Domain, Questions, Responses, Total_Messages

7. **7_kpis_summary_2025-11-28.csv** (8 KPIs)
   - Columns: Metric, Value, Period_Start, Period_End, Days

### Design Reference

The mockup (`mokup_estadisticas - v3 (1).html`) shows:

**Layout:**
```
┌─────────────────────────────────────────────┐
│  Header: Dashboard Principal               │
│  Filters: Date range, Quick filters,       │
│           Assistant, Effectiveness, Domain │
├─────────────────────────────────────────────┤
│  KPIs: 4 cards in a row                    │
│  [Messages] [Convs] [Users] [Resp Time]    │
├─────────────────────────────────────────────┤
│  AI Assistant (collapsible)                │
│  [Suggested Q] | [Chat Interface]          │
├─────────────────────────────────────────────┤
│  Charts (2 columns):                        │
│  [Activity Line] [Messages by Agent Bar]   │
│  [Hourly Area]                             │
│  [Messages by User Bar] [Domain Pie]       │
├─────────────────────────────────────────────┤
│  Tables:                                    │
│  [Top 10 Users Table]                      │
└─────────────────────────────────────────────┘
```

**Design System:**
- Primary color: Blue (#3b82f6)
- Success: Green (#10b981)
- Warning: Yellow (#f59e0b)
- Background: Gray-100
- Cards: White with rounded-xl and shadow-sm
- Font: Inter

### Technical Requirements

**Framework:** Next.js 15 with App Router
**Language:** TypeScript (strict mode)
**Styling:** Tailwind CSS v3.4.17 (NOT v4)
**Charts:** Chart.js or Recharts (your choice)
**Components:** Shadcn UI or build custom with Tailwind
**Icons:** Lucide React
**Date Picker:** react-datepicker or similar

**File Structure:**
```
src/
├── app/
│   └── estadisticas/
│       ├── page.tsx                    # Main dashboard page
│       └── layout.tsx                  # Layout wrapper
├── components/
│   └── statistics/
│       ├── KPICards.tsx                # RF-03
│       ├── GlobalFilters.tsx           # RF-02
│       ├── ActivityChart.tsx           # RF-04.1
│       ├── AgentMessagesChart.tsx      # RF-04.2
│       ├── HourlyDistributionChart.tsx # RF-04.3
│       ├── UserMessagesChart.tsx       # RF-04.4
│       ├── DomainPieChart.tsx          # RF-04.5
│       ├── TopUsersTable.tsx           # RF-05.1
│       ├── AIAssistant.tsx             # RF-06
│       └── ExportButtons.tsx           # RF-07
├── lib/
│   ├── statistics-data.ts              # Data loading/parsing
│   └── statistics-filters.ts           # Filter logic
└── types/
    └── statistics.ts                   # TypeScript interfaces
```

### Key Implementation Details

**1. Data Loading:**
```typescript
// Read CSV files from /estadisticas-salfagpt/ folder
// Parse into TypeScript interfaces
// Cache in React state or Context
```

**2. Filtering (RF-02):**
```typescript
// All filters must update ALL charts and tables simultaneously
// Use React Context or state management
// Filters: dateRange, assistant, domain, effectiveness
```

**3. Charts Library:**
- Use Chart.js or Recharts (recommend Recharts for React integration)
- Match the mockup designs exactly
- Responsive on mobile/tablet
- Interactive tooltips

**4. Performance:**
- Initial load: <3 seconds (RF requirement)
- Filter application: <2 seconds (RF requirement)
- Use React.memo for chart components
- Lazy load charts below fold

**5. AI Assistant (RF-06):**
- Chat interface with suggested questions
- Query the master CSV (file 6) to answer questions
- Context: only filtered data currently displayed
- Use Gemini API to process natural language queries

### Sample Data (for testing)

From the CSVs:

**KPIs (7_kpis_summary):**
```
Total Messages: 1,710
User Questions: 872
Assistant Responses: 838
Active Users: 48
```

**Daily Activity (3_daily_activity) - first 7 days:**
```
2025-10-30, miércoles, 16 messages
2025-11-03, domingo, 52 messages
2025-11-04, lunes, 61 messages
2025-11-05, martes, 48 messages
2025-11-10, domingo, 227 messages
2025-11-25, lunes, 323 messages (PEAK)
```

**Top 3 Users (1_user_engagement):**
```
1. alec@getaifactory.com - 680 messages
2. fdiazt@salfagestion.cl - 122 messages
3. sorellanac@salfagestion.cl - 112 messages
```

### Output Requirements

Please provide:

1. **Complete file structure** with all necessary files
2. **All React components** (fully implemented, not stubs)
3. **TypeScript interfaces** for all data types
4. **Chart implementations** for all 5 chart types (RF-04.1 to RF-04.5)
5. **Filter logic** that updates all visualizations (RF-02)
6. **Responsive design** matching the mockup
7. **Professional styling** with Tailwind CSS v3.4.17
8. **Comments** explaining key sections

### Code Quality Standards

- ✅ TypeScript strict mode (no `any` types)
- ✅ Proper React hooks usage (useEffect, useState, useMemo, useCallback)
- ✅ Component composition (small, focused components)
- ✅ Tailwind CSS v3.4.17 (NOT v4)
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Accessibility (proper ARIA labels)
- ✅ Performance optimization (React.memo, lazy loading)
- ✅ Error handling (loading states, error states, empty states)

### Special Considerations

**Multi-language:**
- UI text in Spanish (as shown in mockup)
- Date formatting: Spanish locale (día/mes/año)
- Day names: Spanish (lunes, martes, etc.)

**Timezone:**
- Timestamps in CSVs are UTC
- Display in local timezone (Chile/Santiago if possible)

**Colors:**
- Match the mockup color scheme
- Blue for primary actions
- Green for positive trends
- Red for negative trends
- Gray for neutral

**Interactive Features:**
- Hoverable chart tooltips
- Clickable table rows (optional drill-down)
- Collapsible AI Assistant section
- Exportable filtered views

### Expected Deliverables

Generate complete, production-ready code for:

1. ✅ Main dashboard page component
2. ✅ All 8 sub-components (KPIs, 5 charts, table, filters)
3. ✅ Data loading utilities
4. ✅ TypeScript type definitions
5. ✅ Filter state management
6. ✅ Export functionality (CSV/Excel)
7. ✅ AI Assistant component (basic structure)
8. ✅ Responsive layout
9. ✅ Professional styling

### Integration Notes

**CSV Location:**
- CSVs are in `/estadisticas-salfagpt/` folder
- Can be loaded via API route or imported directly
- Recommend creating API endpoint: `GET /api/statistics/[filename]`

**Existing Platform:**
- This integrates with existing SalfaGPT platform
- Use existing authentication (assume user is logged in)
- Match existing design system (Tailwind, professional look)
- Navigation: Add link to `/estadisticas` from main app

### Success Criteria

The dashboard should:
- ✅ Load all 7 CSV files correctly
- ✅ Display all KPIs from file 7
- ✅ Render all 5 chart types from RF-04
- ✅ Show Top 10 users table from RF-05.1
- ✅ Apply filters to ALL visualizations simultaneously
- ✅ Load in <3 seconds
- ✅ Filter updates in <2 seconds
- ✅ Look professional and match the mockup
- ✅ Be fully responsive
- ✅ Handle empty states gracefully

### Additional Context

**Project name:** SalfaGPT (Flow platform for Salfa Corp)
**Users:** Administrators and managers
**Purpose:** Monitor AI assistant usage, engagement, and performance
**Importance:** HIGH - Executive dashboard for decision-making

---

## Your Task

Generate the complete, production-ready Next.js application code for this statistics dashboard. Include all files, components, types, utilities, and styling needed to:

1. Load the 7 CSV files
2. Implement all filters (RF-02)
3. Display all KPIs (RF-03)
4. Render all 5 charts (RF-04)
5. Show Top 10 users table (RF-05.1)
6. Build AI Assistant interface (RF-06) - basic structure
7. Add export buttons (RF-07.1)

Make it production-ready, professional, performant, and beautiful.

**IMPORTANT:** 
- Use **Tailwind CSS v3.4.17** (NOT v4)
- Use **TypeScript strict mode**
- Match the mockup design exactly
- Ensure <3s load time, <2s filter time
- Spanish language for all UI text
- Professional, enterprise-grade quality

Generate the complete code now.

## PROMPT END


