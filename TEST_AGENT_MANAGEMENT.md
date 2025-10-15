# Quick Test Guide - Agent Management Feature

**Status:** Ready to test  
**Browser:** Already open at http://localhost:3000/chat

---

## 🧪 Quick Test Steps

### Step 1: Open Agent Management
1. **Click your user avatar** (bottom-left corner)
2. **Find "Gestión de Agentes"** (indigo colored, third menu item)
3. **Click it**

**Expected Result:**
- ✅ Dashboard opens in modal
- ✅ Shows summary stats at top (agents, messages, tokens, cost)
- ✅ Lists all your agents below
- ✅ Each agent shows: title, model badge, stats

---

### Step 2: Explore Agent List
1. **Look at the summary cards** (top row)
   - Should show real data from your agents
2. **Find an agent with messages**
3. **Click the expand arrow (▶)** on the left

**Expected Result:**
- ✅ Agent expands to show:
  - Usage Metrics (tokens, cost)
  - Model Pricing (current rates)
  - Usage History table (daily breakdown)

---

### Step 3: View Agent Details
1. **Click "Configurar"** button on any agent
2. **Modal opens** with detailed view

**Expected Result:**
- ✅ Shows agent title and model badge
- ✅ Configuration section (model, context sources count)
- ✅ Setup Document section (upload area if not uploaded)
- ✅ Usage Trends chart (if has activity)
- ✅ Transaction Transparency table
- ✅ Quality Metrics (if evaluated)

---

### Step 4: Check Transaction Transparency 🔍
1. **Scroll to "Trazabilidad de Transacciones"** table
2. **Look at the columns**:
   - Date
   - Question
   - Context Used (badges)
   - Tokens In
   - Context (separate!)
   - Tokens Out
   - Cost
   - Details button

3. **Click the eye icon (👁️)** on any row

**Expected Result:**
- ✅ Alert shows detailed breakdown:
  - Model: Gemini 2.5 Flash/Pro
  - Provider: Google
  - Input Rate: $X.XX/1M
  - Output Rate: $X.XX/1M
  - Token counts
  - Cost breakdown
  - Context sources list

---

### Step 5: Upload Setup Document (Optional)
1. **Click "Configurar"** on an agent
2. **Scroll to "Documento de Configuración"**
3. **Click "Subir Setup Doc"**
4. **Select a PDF/Word/TXT file** with agent specs
5. **Wait for processing**

**Expected Result:**
- ✅ File uploads
- ✅ Gemini AI extracts structure
- ✅ Setup doc displays with:
  - Agent Purpose
  - Setup Instructions
  - Input Examples
  - Correct/Incorrect Outputs
  - Domain Expert info

**Sample Setup Doc Content:**
```
Agent Purpose: Customer service assistant for technical support

Setup:
- Use friendly, professional tone
- Reference documentation when possible
- Provide step-by-step solutions

Input Examples:
- "How do I reset my password?"
- "System error 404 appeared"
- "Need help with installation"

Correct Output:
"To reset your password, follow these steps: 1. Click 'Forgot Password', 2. Enter your email..."
Criteria: Clear, actionable, step-by-step

Incorrect Output:
"I don't know"
Reason: Not helpful, doesn't attempt solution

Domain Expert:
Name: John Doe
Email: john@company.com
Department: Technical Support
```

---

## ✅ What to Verify

### Data Accuracy
- [ ] Agent count matches your actual agents
- [ ] Message counts are correct
- [ ] Token estimates are reasonable (will refine later)
- [ ] Costs show in dollars with proper formatting

### Functionality
- [ ] Dashboard opens/closes smoothly
- [ ] Agents expand/collapse
- [ ] "Configurar" opens detail modal
- [ ] Transaction table scrolls properly
- [ ] Eye icon shows breakdown

### Visual Design
- [ ] Model badges colored correctly (green=Flash, purple=Pro)
- [ ] Quality badges show if present
- [ ] "Configurado" badge appears if setup doc uploaded
- [ ] Charts display properly
- [ ] Tables formatted nicely

### Transparency
- [ ] Can see input/output/context tokens separately
- [ ] Can see cost per transaction
- [ ] Can see which context sources were used
- [ ] Can see pricing rates
- [ ] Can see full breakdown on click

---

## 🐛 If Something Doesn't Look Right

### No Agents Showing
- Check console for errors
- Verify you're logged in
- Refresh and try again

### Costs Seem Off
- Remember: Token estimation (1 token ≈ 4 chars)
- Actual tokens may differ
- Will be refined with real tokenizer

### No Transactions in Table
- Normal if agent has no messages
- Send a message to the agent
- Refresh dashboard
- Should appear in next load

### Setup Doc Upload Fails
- Check file format (PDF/Word/TXT)
- Check file size (<10MB recommended)
- Check console for errors
- Verify Gemini API key is set

---

## 🎯 Key Things to Notice

1. **Real Data**: Everything loads from Firestore
2. **Official Pricing**: Uses actual Gemini rates
3. **Transparency**: Full cost breakdown visible
4. **Context Tracking**: See which documents used
5. **Quality Foundation**: Ready for evaluations
6. **Expert Integration**: Domain expert info captured

---

## 🚀 Next Steps After Testing

If everything looks good:
1. ✅ Test with a real agent
2. ✅ Upload a sample setup document
3. ✅ Verify the parsing works
4. ✅ Check transaction details
5. ✅ Review cost calculations
6. 🔮 Plan evaluation system
7. 🔮 Plan quality tracking UI

---

**Ready to test!** Open the browser and click through the steps above. Let me know what you see! 👀

