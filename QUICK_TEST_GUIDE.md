# 🧪 Quick Test Guide - Multi-Organization System

**What to test in your browser right now**

---

## 🚀 **Start Testing (5 minutes)**

### **1. Start the Server:**

```bash
cd /Users/alec/salfagpt
npm run dev
```

Wait for: "Server ready at http://localhost:3000"

---

### **2. Open Browser:**

```
http://localhost:3000/chat
```

You should see: Login screen or your chat interface

---

### **3. Check Navigation Menu:**

**Action:** Click your avatar (bottom left corner)

**You should see:**
```
┌────────────────────────────────────────────────────────┐
│ Menú de Navegación                                  X  │
├──────┬──────┬──────┬──────┬──────┬────────────────────┤
│ COL1 │ COL2 │ COL3 │ COL4 │ COL5 │ COL6 ⭐ NEW       │
├──────┼──────┼──────┼──────┼──────┼────────────────────┤
│DOMINI│AGENTE│ANALÍT│EVALUA│PRODUC│ ORGANIZATIONS     │
│      │      │      │      │      │ (Orange theme)     │
└──────┴──────┴──────┴──────┴──────┴────────────────────┘
```

**Look for:** Orange-themed "ORGANIZATIONS" column (Column 6)

---

### **4. Click "Organizations":**

**You should see:**
- Full-screen modal (95% of screen)
- Header: "Organization Management" with Building icon
- 6 tabs below header:
  1. Company Profile
  2. Branding
  3. Domains & Features
  4. Organization Agents
  5. Organization Analytics
  6. WhatsApp Service

---

### **5. Test Each Tab:**

**Company Profile:**
- Fields for URL, Mission, Vision, Purpose
- Core Values (can add/edit)
- OKRs with Key Results
- KPIs with progress bars
- Leadership section
- Edit/Save button

**Branding:**
- Company name input
- Logo upload area
- Color pickers (Primary, Secondary)
- Live color preview boxes
- Save button

**Domains & Features:**
- Should show 15 Salfa domains (if logged in as org admin/superadmin)
- Each domain has feature flag toggles
- A/B testing toggle
- Primary domain marked

**Organization Agents:**
- North Star Metric (cost per message)
- Domain cards showing metrics
- DAU/WAU/MAU display
- Messages/User, Messages/Day stats

**Organization Analytics:**
- Key metrics: 37 users, 215 agents
- Total messages, token count
- Est. monthly cost
- CSAT/NPS progress bars

**WhatsApp Service:**
- Service overview (numbers available, assigned)
- Subscription configuration
- Assigned numbers list (3 mock users)
- Available numbers pool (2 mock numbers)
- Revenue summary (MRR calculation)
- "How it works" 5-step process

---

## 📸 **What to Screenshot/Check:**

1. **Navigation menu** - See Column 6 "Organizations"
2. **Organizations modal** - Full-screen, 6 tabs visible
3. **Company Profile tab** - All fields present
4. **Branding tab** - Color pickers working
5. **Domains tab** - 15 domains listed
6. **WhatsApp tab** - Complete UI with mock data

---

## 🔍 **Test in Browser Console (F12):**

### **Check if logged in:**
```javascript
document.cookie
// Should show: flow_session=...
```

### **Test Organizations API:**
```javascript
fetch('/api/organizations')
  .then(r => r.json())
  .then(data => {
    console.log('Organizations:', data);
    console.log('Count:', data.count);
    console.log('Your role:', data.userRole);
  })
```

### **Check Salfa Corp:**
```javascript
fetch('/api/organizations/salfa-corp')
  .then(r => r.json())
  .then(data => {
    console.log('Salfa Corp:', data.organization);
    console.log('Domains:', data.organization.domains.length);
    console.log('Expected: 15 domains');
  })
```

### **Check Stats:**
```javascript
fetch('/api/organizations/salfa-corp/stats')
  .then(r => r.json())
  .then(data => {
    console.log('Stats:', data.stats);
    console.log('Users:', data.stats.totalUsers, '(expected: 37)');
    console.log('Agents:', data.stats.totalAgents, '(expected: 215)');
  })
```

---

## ✅ **Success Criteria:**

**Everything is working if:**
- [ ] Menu opens when clicking avatar
- [ ] "Organizations" appears in Column 6 (orange)
- [ ] Clicking Organizations opens full-screen modal
- [ ] Modal shows 6 tabs
- [ ] Each tab loads without errors
- [ ] Domains tab shows 15 Salfa domains
- [ ] Analytics shows 37 users, 215 conversations
- [ ] WhatsApp shows subscription interface
- [ ] No console errors (F12 → Console)

---

## 🚨 **Common Issues:**

**If Organizations menu not visible:**
- Check you're logged in as admin or superadmin
- Regular users don't see this (by design)
- Reload page after server restart

**If modal looks compressed:**
- Should be 95vw x 95vh (very large)
- Has proper padding (p-4)
- Header should have Building2 icon

**If data doesn't load:**
- Check browser console for errors
- Verify APIs working (run console tests above)
- Check you have session cookie

---

**Start with Step 1 (npm run dev) and let me know what you see!** 🚀

**I can help debug based on what appears in your browser!**

