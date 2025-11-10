# Organization Admin Guide - Managing Your Organization

**Target Audience:** Organization Admins (e.g., sorellanac@salfagestion.cl)  
**Purpose:** Guide to managing your organization in the Flow platform

---

## 🎯 **Org Admin Role**

As an Organization Admin, you can:
- ✅ View all data in YOUR organization
- ✅ Add/remove users in your organization
- ✅ Configure organization settings
- ✅ Manage evaluation workflows (domain-level)
- ✅ Request promotions from staging to production
- ✅ Approve promotion requests
- ✅ View organization statistics
- ❌ Cannot see other organizations' data
- ❌ Cannot create new organizations (SuperAdmin only)

---

## 👥 **Managing Users**

### **View Your Organization's Users**

Via API:
```bash
curl /api/organizations/YOUR_ORG_ID/users
```

Via UI:
- Navigate to Admin Panel
- Click "Organization" tab
- View users list

### **Add User to Your Organization**

**Automatic (by domain):**
- When users with your org's domain sign up, they're automatically assigned
- Example: user@salfagestion.cl → assigned to Salfa Corp

**Manual:**
```bash
curl -X POST /api/organizations/YOUR_ORG_ID/users \
  -d '{"userId":"user-email@your-domain.com"}'
```

---

## 📊 **Organization Statistics**

### **View Your Org Stats**

Via API:
```bash
curl /api/organizations/YOUR_ORG_ID/stats
```

**Shows:**
- Total users (active/inactive)
- Total agents created
- Total context sources uploaded
- Total messages sent
- Token usage
- Estimated monthly cost

---

## 🔄 **Promotion Workflow (Staging → Production)**

### **Create Promotion Request**

When you modify something in staging and want to promote it to production:

```bash
curl -X POST /api/promotions \
  -d '{
    "organizationId": "YOUR_ORG_ID",
    "resourceType": "agent",
    "resourceId": "agent-123",
    "resourceName": "Customer Service Agent",
    "changes": [...]
  }'
```

### **Approve Promotion Request**

Review and approve a promotion:

```bash
curl -X POST /api/promotions/REQUEST_ID/approve \
  -d '{"notes": "Tested in staging, approved for production"}'
```

**Approval Process:**
1. Org Admin approves (you)
2. SuperAdmin approves (alec@)
3. SuperAdmin executes promotion
4. Changes applied to production

### **View Your Promotion Requests**

```bash
curl "/api/promotions?organizationId=YOUR_ORG_ID"
```

---

## ⚙️ **Organization Configuration**

### **Update Branding**

```bash
curl -X PUT /api/organizations/YOUR_ORG_ID \
  -d '{
    "branding": {
      "brandName": "Your Brand",
      "primaryColor": "#FF6600"
    }
  }'
```

### **Configure Evaluation Settings**

Evaluation settings are managed per domain within your organization.

**Via API** (updates organization's evaluation config):
```bash
curl -X PUT /api/organizations/YOUR_ORG_ID \
  -d '{
    "evaluationConfig": {
      "enabled": true,
      "globalSettings": {
        "priorityStarThreshold": 4,
        "autoFlagInaceptable": true
      }
    }
  }'
```

---

## 🚨 **Common Tasks**

### **Add a New Domain to Your Organization**

Contact SuperAdmin to add domain:
- Domains can only be added by SuperAdmin
- Prevents domain conflicts between organizations

### **View Audit Trail**

See complete history of changes:

```bash
curl /api/lineage/conversations/CONVERSATION_ID
```

Shows:
- Who made changes
- When changes occurred
- What was modified
- Promotion history

---

## 📋 **Best Practices**

### **Before Requesting Promotion:**

1. ✅ Test thoroughly in staging
2. ✅ Verify all functionality works
3. ✅ Check for conflicts
4. ✅ Document what changed
5. ✅ Get team approval
6. ✅ Monitor after promotion

### **User Management:**

1. ✅ Verify user's email domain matches your org
2. ✅ Set appropriate role (supervisor, especialista, user)
3. ✅ Assign to specific domain if needed
4. ✅ Monitor user activity

### **Data Privacy:**

1. ✅ Your org's data is completely isolated
2. ✅ You cannot see other organizations
3. ✅ Encryption available (contact SuperAdmin to enable)
4. ✅ Complete audit trail maintained

---

## 🔗 **Related Resources**

- Organization statistics dashboard (in UI)
- Promotion approval dashboard (in UI)
- Evaluation management (existing system)
- User management panel (Admin Panel)

---

**Last Updated:** 2025-11-10  
**Version:** 1.0.0  
**For:** Organization Admin users

