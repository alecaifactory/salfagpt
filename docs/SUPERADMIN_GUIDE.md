# SuperAdmin Guide - Multi-Organization Management

**Target Audience:** SuperAdmins (alec@getaifactory.com)  
**Purpose:** Complete guide to managing organizations in the Flow platform

---

## 🎯 **SuperAdmin Role**

As a SuperAdmin, you can:
- ✅ View ALL organizations
- ✅ Create new organizations
- ✅ Manage all organization settings
- ✅ Add/remove organization admins
- ✅ Execute promotions to production
- ✅ View all data across all organizations
- ✅ Setup encryption for organizations
- ✅ Access staging and production environments

---

## 🏢 **Organization Management**

### **Create Organization**

```bash
# Via API
curl -X POST http://localhost:3000/api/organizations \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Salfa Corp",
    "domains": ["salfagestion.cl", "salfa.cl"],
    "primaryDomain": "salfagestion.cl",
    "branding": {
      "brandName": "SalfaGPT",
      "primaryColor": "#0066CC"
    }
  }'
```

### **List All Organizations**

```bash
curl http://localhost:3000/api/organizations
```

### **View Organization Details**

```bash
curl http://localhost:3000/api/organizations/salfa-corp
```

### **Update Organization**

```bash
curl -X PUT http://localhost:3000/api/organizations/salfa-corp \
  -H "Content-Type: application/json" \
  -d '{
    "branding": {
      "primaryColor": "#FF6600"
    }
  }'
```

---

## 👥 **User Management**

### **Assign Users to Organization**

**Option 1: Migrate by Domain (Bulk)**
```bash
npm run migrate:multi-org -- \
  --org=salfa-corp \
  --domains=salfagestion.cl,salfa.cl \
  --env=production
```

**Option 2: Assign Individual User**
```bash
curl -X POST http://localhost:3000/api/organizations/salfa-corp/users \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-123",
    "domainId": "salfagestion.cl"
  }'
```

### **List Organization Users**

```bash
curl http://localhost:3000/api/organizations/salfa-corp/users
```

---

## 🔐 **Encryption Management**

### **Setup KMS Encryption for Organization**

```bash
./scripts/setup-org-encryption.sh \
  --org=salfa-corp \
  --project=salfagpt
```

This creates:
- KMS key ring: `organization-keys`
- Crypto key: `salfa-corp-encryption-key`
- Service account permissions

### **Enable Encryption**

```bash
curl -X PUT http://localhost:3000/api/organizations/salfa-corp \
  -H "Content-Type: application/json" \
  -d '{
    "privacy": {
      "encryptionEnabled": true,
      "encryptionKeyId": "projects/salfagpt/locations/us-east4/keyRings/organization-keys/cryptoKeys/salfa-corp-encryption-key"
    }
  }'
```

---

## 🔄 **Staging-Production Workflow**

### **Setup Staging Environment**

```bash
npm run staging:setup
```

This creates:
- `salfagpt-staging` GCP project
- Firestore database (us-east4)
- Copy of production data
- Cloud Run service
- Complete infrastructure

**Time:** ~30-45 minutes  
**Cost:** ~$60-80/week while active

### **Approve Promotions**

**View Pending Promotions:**
```bash
curl "http://localhost:3000/api/promotions?organizationId=salfa-corp&status=pending"
```

**Approve as SuperAdmin:**
```bash
curl -X POST http://localhost:3000/api/promotions/REQUEST_ID/approve \
  -H "Content-Type: application/json" \
  -d '{"notes": "Approved - looks good"}'
```

**Execute Promotion (SuperAdmin only):**
```bash
curl -X POST http://localhost:3000/api/promotions/REQUEST_ID/execute
```

---

## 📊 **Organization Statistics**

### **View Org Stats**

```bash
curl http://localhost:3000/api/organizations/salfa-corp/stats
```

Returns:
- Total users (active/inactive)
- Total agents
- Total context sources
- Total messages
- Token usage
- Estimated monthly cost

---

## 🚨 **Troubleshooting**

### **Issue: Users Not Seeing Organization Data**

**Check:**
1. User has `organizationId` field set
2. Organization exists and is active
3. User's email domain matches org domains

**Fix:**
```bash
# Assign user to org
curl -X POST /api/organizations/salfa-corp/users \
  -d '{"userId":"USER_ID"}'
```

### **Issue: Promotion Conflicts**

**Check conflicts:**
```bash
curl /api/promotions/REQUEST_ID
# Look at "conflicts" field
```

**Resolve:**
- Review conflict details
- Choose staging or production version
- Apply resolution via UI (or manual update)

### **Issue: Encryption Not Working**

**Verify setup:**
```bash
# Check if key exists
gcloud kms keys describe salfa-corp-encryption-key \
  --keyring=organization-keys \
  --location=us-east4 \
  --project=salfagpt

# Check org config
curl /api/organizations/salfa-corp
# Verify privacy.encryptionEnabled === true
```

---

## 📋 **Best Practices**

### **Before Creating Organization:**

1. ✅ Confirm organization name and domains
2. ✅ Identify primary admin (org owner)
3. ✅ Decide on branding (colors, logo)
4. ✅ Determine if encryption needed
5. ✅ Set appropriate limits (users, agents, storage)

### **Before Migrating Data:**

1. ✅ Always run dry-run first
2. ✅ Migrate in staging first
3. ✅ Test thoroughly in staging
4. ✅ Get org admin approval
5. ✅ Then migrate production

### **Before Executing Promotions:**

1. ✅ Verify both approvals (org admin + superadmin)
2. ✅ Check for conflicts
3. ✅ Review changes carefully
4. ✅ Ensure snapshot created
5. ✅ Monitor after execution

---

## 🔗 **Related Documentation**

- `.cursor/rules/organizations.mdc` - Technical specification
- `README_MULTI_ORG_IMPLEMENTATION.md` - Complete implementation guide
- `COMPREHENSIVE_SUMMARY_MULTI_ORG.md` - Detailed summary

---

**Last Updated:** 2025-11-10  
**Version:** 1.0.0  
**For:** SuperAdmin users

