# Organization Features - Manual Testing Guide

**Created:** 2025-11-11  
**Server:** ✅ Running on localhost:3000 (background)  
**Status:** Ready for manual testing

---

## 🎯 Quick Start

### Prerequisites
- ✅ Server running on localhost:3000
- ⏳ Login credentials: alec@getaifactory.com (SuperAdmin)

### Access the Features
```
1. Open: http://localhost:3000/chat
2. Login with Google (alec@getaifactory.com)
3. Click user menu (bottom-left)
4. Look for "Organization" option
```

---

## 🧪 Test Scenarios

### Scenario 1: SuperAdmin - View Organization Management Dashboard

**Objective:** Verify SuperAdmin can access all organization management features

**Steps:**
1. ✅ Login as alec@getaifactory.com
2. Navigate to Organization settings
3. Should see: **OrganizationManagementDashboard**

**Expected Results:**
- ✅ See "Organizations" header
- ✅ See "Create Organization" button
- ✅ See search bar
- ✅ See list of existing organizations (if any)
- ✅ Each org card shows:
  - Organization name
  - Domain count
  - Admin count  
  - Status (Active/Inactive)
  - View/Edit/Settings buttons

**What to Check:**
- [ ] Dashboard loads without errors
- [ ] Search filters organizations correctly
- [ ] Organization cards display complete information
- [ ] Buttons are clickable
- [ ] No console errors

---

### Scenario 2: Create New Organization

**Objective:** Verify organization creation workflow

**Steps:**
1. Click "Create Organization" button
2. Fill in form:
   - Name: "Test Organization"
   - Domains: ["test.com"]
   - Primary Domain: "test.com"
   - Admins: ["admin@test.com"]
3. Click "Create"

**Expected Results:**
- ✅ Modal appears with organization form
- ✅ All fields are editable
- ✅ Validation works (required fields)
- ✅ Success message on creation
- ✅ New organization appears in list
- ✅ Organization saved to Firestore

**What to Check:**
- [ ] Modal opens/closes properly
- [ ] Form validation works
- [ ] Save button enables/disables correctly
- [ ] Loading state shows during save
- [ ] Success/error feedback displayed
- [ ] New org appears in list immediately

---

### Scenario 3: Edit Organization Configuration

**Objective:** Verify all 6 configuration tabs work correctly

**Steps:**
1. Click "Edit" on an organization
2. Navigate through all 6 tabs:
   - General
   - Admins
   - Branding
   - Evaluation
   - Privacy
   - Limits
3. Make changes in each tab
4. Click "Save"

**Expected Results:**

**Tab 1: General**
- ✅ Can edit organization name
- ✅ Can add/remove domains
- ✅ Primary domain selector works
- ✅ Tenant type dropdown functional

**Tab 2: Admins**
- ✅ Can add admins by email
- ✅ Can remove admins
- ✅ Admin list displays correctly
- ✅ Domain validation works

**Tab 3: Branding**
- ✅ Can edit brand name
- ✅ Can upload logo (placeholder)
- ✅ Color picker works
- ✅ Preview updates in real-time

**Tab 4: Evaluation**
- ✅ Enable/disable toggle works
- ✅ Can configure per domain
- ✅ Supervisor assignment functional
- ✅ Settings save correctly

**Tab 5: Privacy**
- ✅ Encryption toggle works
- ✅ KMS key ID editable
- ✅ Data retention configurable
- ✅ Compliance checkboxes functional

**Tab 6: Limits**
- ✅ Number inputs work
- ✅ Validation prevents negative values
- ✅ Changes save correctly
- ✅ Limits enforced in system

**What to Check:**
- [ ] All tabs load without errors
- [ ] Form fields are editable
- [ ] Validation works on all inputs
- [ ] Save updates Firestore
- [ ] Changes persist after refresh
- [ ] No console errors

---

### Scenario 4: View Organization Statistics

**Objective:** Verify organization analytics display correctly

**Steps:**
1. Click "View Stats" on an organization
2. Review displayed metrics

**Expected Results:**
- ✅ Total users count
- ✅ Total conversations
- ✅ Total messages
- ✅ Active users
- ✅ Model usage breakdown (Flash vs Pro %)
- ✅ Charts/graphs display (if implemented)

**What to Check:**
- [ ] Statistics load without errors
- [ ] Numbers are accurate
- [ ] Percentages calculate correctly
- [ ] Visual display is clear
- [ ] Updates in real-time (if applicable)

---

### Scenario 5: Organization-Scoped Data Access

**Objective:** Verify data isolation between organizations

**Steps:**
1. As SuperAdmin, view Org A
2. Note Org A's user count, conversations, etc.
3. Switch to Org B
4. Verify Org B shows different data
5. Verify Org B cannot see Org A's data

**Expected Results:**
- ✅ Each org has independent data
- ✅ No data bleeding between orgs
- ✅ Counts are accurate per org
- ✅ Users filtered by domain

**What to Check:**
- [ ] Org A and Org B have separate data
- [ ] User lists don't overlap
- [ ] Conversation counts are independent
- [ ] Domain filtering works correctly

---

### Scenario 6: WhatsApp Service Configuration

**Objective:** Verify WhatsApp service settings work

**Steps:**
1. Navigate to WhatsApp Service section
2. Toggle enable/disable
3. Update configuration:
   - Monthly fee
   - Number purchase cost
   - Credit threshold
   - Auto-renewal
4. Save changes

**Expected Results:**
- ✅ Toggle changes state
- ✅ Number inputs accept valid values
- ✅ Credit threshold triggers notifications
- ✅ Auto-renewal setting persists
- ✅ Configuration saves to Firestore

**What to Check:**
- [ ] Toggle switches work
- [ ] Number inputs validate (positive values only)
- [ ] Save button enables when changes made
- [ ] Changes persist after save
- [ ] No errors in console

---

## 🔍 Visual Verification Points

### Dashboard Elements to Verify

**Organization Cards:**
- [ ] Proper spacing and layout
- [ ] Icons display correctly
- [ ] Text is readable
- [ ] Hover effects work
- [ ] Cards are clickable
- [ ] Stats update correctly

**Configuration Modal:**
- [ ] Modal centers on screen
- [ ] Tabs are clearly labeled
- [ ] Tab navigation works
- [ ] Forms are well-organized
- [ ] Buttons are accessible
- [ ] Close/cancel works

**Settings Sections:**
- [ ] Sections expand/collapse
- [ ] Icons are appropriate
- [ ] Content is organized
- [ ] Forms are intuitive
- [ ] Save states are clear

---

## 🐛 Debugging Checklist

If something doesn't work:

### Check Console (Browser DevTools)
```javascript
// Look for these errors:
- Authentication errors
- API call failures
- Component rendering errors
- State update errors
- Type errors
```

### Check Network Tab
```
- API calls to /api/organizations/*
- Status codes (200, 401, 403, 500)
- Response payloads
- Request headers
```

### Check Firestore Console
```
1. Open Firebase Console
2. Navigate to Firestore Database
3. Check collections:
   - organizations (new)
   - users (enhanced with organizationId)
   - org_memberships (new)
4. Verify data is being written
```

---

## 📊 Performance Benchmarks

**Target Metrics:**
- Dashboard load time: < 2s
- Organization list: < 1s
- Stats loading: < 1.5s
- Save operation: < 1s
- Modal open/close: Instant

**Monitor:**
- Network requests
- Database queries
- Component re-renders
- Memory usage

---

## ✅ Success Criteria

### Feature Completeness
- [ ] All 6 settings sections functional
- [ ] All 6 configuration tabs working
- [ ] Organization CRUD operations complete
- [ ] Analytics display correctly
- [ ] WhatsApp service configurable

### User Experience
- [ ] Intuitive navigation
- [ ] Clear feedback on actions
- [ ] Smooth animations
- [ ] Responsive design
- [ ] No errors or bugs

### Data Integrity
- [ ] Organizations save correctly
- [ ] Data isolation enforced
- [ ] Changes persist
- [ ] Backward compatibility maintained
- [ ] No data loss

---

## 📝 Testing Checklist Summary

**Before Testing:**
- ✅ Server running on localhost:3000
- ✅ API endpoints verified
- ✅ Components loaded
- ✅ TypeScript compiled (with known script issue)
- ✅ Documentation reviewed

**During Testing:**
- [ ] Login successful
- [ ] Dashboard accessible
- [ ] All sections load
- [ ] CRUD operations work
- [ ] Analytics display
- [ ] No errors encountered

**After Testing:**
- [ ] Document any bugs found
- [ ] Note performance issues
- [ ] Capture screenshots
- [ ] Update test results
- [ ] Report to development team

---

**Manual Testing Required:**  
Open http://localhost:3000/chat and log in to complete the testing!

**Server Ready:** ✅ localhost:3000 is running in background  
**Waiting for:** Manual UI verification






