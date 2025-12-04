# 🚀 AI Studio Setup Instructions for Statistics Dashboard Generation

## Step-by-Step Guide

### 1️⃣ Open AI Studio

Go to: **https://aistudio.google.com/**

### 2️⃣ Configure Model

- **Model:** Gemini 2.0 Flash Experimental (or Gemini 1.5 Pro)
- **Temperature:** 0.2 (for consistent code generation)
- **Safety:** Default settings

### 3️⃣ Attach Files to Context

Click **"Add file"** and upload these files from `/Users/alec/aifactory/estadisticas-salfagpt/`:

**Required CSV Files (for data reference):**
1. ✅ `1_user_engagement_2025-11-28.csv`
2. ✅ `2_agent_performance_2025-11-28.csv`
3. ✅ `3_daily_activity_2025-11-28.csv`
4. ✅ `7_kpis_summary_2025-11-28.csv`

**Optional (for complete context):**
5. ⚪ `4_hourly_distribution_2025-11-28.csv`
6. ⚪ `5_domain_distribution_2025-11-28.csv`
7. ⚪ `README.md`

**Reference (from requirements folder):**
8. ✅ Upload: `/Users/alec/aifactory/upload-queue/ESTADISTICAS-SALFAGPT/mokup_estadisticas - v3 (1).html`

### 4️⃣ Copy and Paste the Prompt

Use the optimized prompt below:

---

## 📋 OPTIMIZED PROMPT FOR AI STUDIO

```
You are an expert Next.js 15 developer building a production statistics dashboard.

I've attached:
- 4 CSV files with real user engagement data (30 days, 1,710 messages, 48 users, 655 agents)
- 1 HTML mockup showing the exact design to implement

TASK: Generate complete, production-ready code for a statistics dashboard page.

TECH STACK (STRICT):
- Next.js 15 App Router
- React 19
- TypeScript (strict mode)
- Tailwind CSS v3.4.17 (NOT v4)
- Recharts (for charts)
- Lucide React (for icons)
- React DatePicker (for date range)

REQUIREMENTS TO IMPLEMENT:

RF-02: GLOBAL FILTERS (affect all charts/tables)
- Date range picker (start/end)
- Quick buttons: "Last 7 days", "Last 30 days"
- Dropdowns: Filter by Assistant, Domain
- All filters update ALL visualizations simultaneously

RF-03: KPI CARDS (from 7_kpis_summary.csv)
Display 4 cards horizontally:
1. Total Messages: 1,710
2. Total Conversations: 655
3. Active Users: 48
4. Avg Messages/User: 35.6
Each with: icon, title, value, trend (+X% from previous)

RF-04: CHARTS (5 charts)
1. Activity Line Chart (from 3_daily_activity.csv)
   - X axis: Date (30 days)
   - Y axis: Total_Messages
   - Line chart with area fill

2. Messages by Assistant Bar Chart (from 2_agent_performance.csv)
   - Show top 15 agents
   - X axis: Agent_Title
   - Y axis: Total_Messages
   - Horizontal bars

3. Hourly Distribution Area Chart (from 4_hourly_distribution.csv)
   - X axis: Hour (00-23)
   - Y axis: Total_Messages
   - Smooth area chart

4. Messages by User Bar Chart (from 1_user_engagement.csv)
   - Show top 10 users
   - X axis: User_Email
   - Y axis: Total_Messages
   - Horizontal bars

5. Domain Pie Chart (from 5_domain_distribution.csv)
   - Show all domains
   - Values: Unique_Users
   - Percentages visible

RF-05: TOP USERS TABLE (from 1_user_engagement.csv)
Table with columns: Email, Name, Messages
Show top 10 users sorted by Total_Messages descending

RF-06: AI ASSISTANT (basic structure)
- Collapsible section
- Chat interface (left: suggested questions, right: chat)
- Suggested questions (3-5 examples)
- Text input + Send button
- Note: Actual AI integration can be placeholder for now

RF-07: EXPORT BUTTONS
- Button: "Exportar (.xlsx, PDF)"
- On click: Download filtered data as CSV
- Button: "Programar Reporte"
- On click: Show modal (can be basic modal for now)

CODE QUALITY REQUIREMENTS:
✅ TypeScript interfaces for ALL data types
✅ Proper React hooks (useEffect, useState, useMemo for filtering)
✅ CSV parsing utility functions
✅ Responsive design (mobile, tablet, desktop)
✅ Loading states while parsing CSVs
✅ Error handling (file not found, parse errors)
✅ Spanish language for ALL UI text
✅ Performance optimized (<3s load, <2s filter)
✅ Clean, maintainable code with comments

FILE STRUCTURE TO GENERATE:

1. src/app/estadisticas/page.tsx - Main dashboard page
2. src/components/statistics/KPICards.tsx
3. src/components/statistics/GlobalFilters.tsx
4. src/components/statistics/ActivityChart.tsx
5. src/components/statistics/AgentMessagesChart.tsx
6. src/components/statistics/HourlyDistributionChart.tsx
7. src/components/statistics/UserMessagesChart.tsx
8. src/components/statistics/DomainPieChart.tsx
9. src/components/statistics/TopUsersTable.tsx
10. src/components/statistics/AIAssistant.tsx
11. src/components/statistics/ExportButtons.tsx
12. src/lib/statistics-data.ts - CSV parsing utilities
13. src/lib/statistics-filters.ts - Filter logic
14. src/types/statistics.ts - All TypeScript interfaces

DATA LOCATION:
CSVs are in: /public/data/statistics/ folder
Read them via fetch() or import

STYLING GUIDELINES:
- Match the mockup design exactly
- Use Tailwind classes from v3.4.17
- Rounded-xl for cards
- Shadow-sm for elevation
- Gradient headers (from-blue-600 to-indigo-600)
- Responsive grid (grid-cols-1 md:grid-cols-2 lg:grid-cols-4)
- Professional spacing (p-6, gap-6)

IMPORTANT NOTES:
- Filter state must be shared across ALL components
- Use React Context for filter state
- All charts must react to filter changes
- Date range affects: daily activity, user engagement, agent performance
- Domain filter affects: all user-related data
- Assistant filter affects: agent performance, related users

DELIVERABLE:
Complete, copy-paste-ready code for all 14 files listed above.
Each file should be production-ready with:
- Proper imports
- TypeScript types
- Error handling
- Loading states
- Responsive design
- Spanish text
- Professional styling matching the mockup

Generate the complete implementation now.
```

---

## 5️⃣ What to Expect

Gemini will generate:
- ✅ Complete Next.js application code
- ✅ All 14 files listed
- ✅ CSV parsing logic
- ✅ All 5 chart implementations
- ✅ Filter system
- ✅ TypeScript types
- ✅ Styling with Tailwind

**Estimated response:** 5,000-10,000 lines of code

---

## 6️⃣ After Generation

**Copy the code:**
1. Create the files in your Next.js project
2. Install dependencies:
   ```bash
   npm install recharts react-datepicker lucide-react
   npm install -D @types/react-datepicker
   ```
3. Copy CSV files to `/public/data/statistics/`
4. Run the app:
   ```bash
   npm run dev
   ```
5. Open: `http://localhost:3000/estadisticas`

---

## 🔧 Troubleshooting

**If Gemini output is truncated:**
- Ask: "Continue from where you left off"
- Or: "Generate the remaining files"

**If code has errors:**
- Copy error message back to Gemini
- Ask: "Fix this error: [paste error]"

**If styling doesn't match:**
- Share screenshot with Gemini
- Ask: "Adjust styling to match the mockup more closely"

---

## 💡 Pro Tips

**For better results:**
1. ✅ Upload the mockup HTML file (visual reference)
2. ✅ Upload 2-3 sample CSV files (data structure reference)
3. ✅ Be specific about framework versions (Next.js 15, Tailwind v3.4.17)
4. ✅ Request TypeScript strict mode
5. ✅ Ask for complete files, not code snippets

**Follow-up prompts if needed:**
- "Add loading states to all charts"
- "Improve the responsive design for mobile"
- "Add export to Excel functionality"
- "Optimize the filter performance"

---

## 📊 Sample CSV Data to Share

If Gemini asks for sample data, paste this:

**From 7_kpis_summary.csv:**
```
Metric,Value,Period_Start,Period_End,Days
"Total Messages",1710,2025-10-30,2025-11-29,30
"User Questions",872,2025-10-30,2025-11-29,30
"Active Users",48,2025-10-30,2025-11-29,30
```

**From 3_daily_activity.csv:**
```
Date,Day_Name,Total_Messages,User_Questions,Assistant_Responses,Unique_Users,Active_Agents
2025-11-25,lunes,323,166,157,14,130
2025-11-10,domingo,227,114,113,9,109
2025-11-26,martes,127,63,64,11,66
```

---

**✅ YOU'RE READY! Copy the prompt and attach the files in AI Studio.**

**Expected time:** 2-5 minutes for Gemini to generate all code
**Expected output:** Complete, working Next.js dashboard application

🚀 **GO BUILD!**

