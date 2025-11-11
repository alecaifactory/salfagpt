# 📋 Complete Salfa Corp Domain List

**Date:** 2025-11-10  
**Source:** Configured domains + Email domains  
**Total Salfa Domains:** 15 (excluding getaifactory.com and gmail.com)

---

## ✅ **All Salfa Corporation Domains**

### **Domains WITH Users (7 domains, 37 users):**

1. **maqsa.cl** - 20 users 👥👥👥
2. **iaconcagua.com** - 9 users 👥
3. **salfagestion.cl** - 3 users (includes admin: sorellanac@) ⭐
4. **novatec.cl** - 2 users
5. **salfamontajes.com** - 1 user
6. **practicantecorp.cl** - 1 user
7. **salfacloud.cl** - 1 user

### **Domains WITHOUT Users Yet (8 domains, configured/reserved):**

8. **fegrande.cl** - 0 users (configured, active)
9. **geovita.cl** - 0 users (configured, active)
10. **inoval.cl** - 0 users (configured, active)
11. **salfacorp.com** - 0 users (configured, active)
12. **salfamantenciones.cl** - 0 users (configured, active)
13. **salfaustral.cl** - 0 users (configured, active)
14. **tecsa.cl** - 0 users (configured, active)
15. **duocuc.cl** - 0 users (configured as "SalfaCorpTest")

---

## ❌ **Excluded Domains (As Requested):**

- ❌ **getaifactory.com** - GetAI Factory (SuperAdmin company)
- ❌ **gmail.com** - Personal emails

---

## 🎯 **Final Migration Configuration**

### **Cleaned Domain List (15 domains):**

```
maqsa.cl
iaconcagua.com
salfagestion.cl
novatec.cl
salfamontajes.com
practicantecorp.cl
salfacloud.cl
fegrande.cl
geovita.cl
inoval.cl
salfacorp.com
salfamantenciones.cl
salfaustral.cl
tecsa.cl
duocuc.cl
```

---

## 🚀 **Ready to Execute**

### **Complete Migration Command (DRY RUN):**

```bash
npm run migrate:multi-org:dry-run -- \
  --org=salfa-corp \
  --domains=maqsa.cl,iaconcagua.com,salfagestion.cl,novatec.cl,salfamontajes.com,practicantecorp.cl,salfacloud.cl,fegrande.cl,geovita.cl,inoval.cl,salfacorp.com,salfamantenciones.cl,salfaustral.cl,tecsa.cl,duocuc.cl
```

This will show:
- ✅ All 37 existing users
- ✅ All domains reserved for Salfa Corp
- ✅ Future users with these domains auto-assigned to org

---

### **Complete Migration Command (EXECUTE):**

```bash
npm run migrate:multi-org -- \
  --org=salfa-corp \
  --domains=maqsa.cl,iaconcagua.com,salfagestion.cl,novatec.cl,salfamontajes.com,practicantecorp.cl,salfacloud.cl,fegrande.cl,geovita.cl,inoval.cl,salfacorp.com,salfamantenciones.cl,salfaustral.cl,tecsa.cl,duocuc.cl \
  --env=production
```

---

## 📊 **Impact Summary**

**Immediate Migration:**
- 37 existing users → assigned to salfa-corp
- ~150-400 conversations → assigned to salfa-corp
- ~50-200 context sources → assigned to salfa-corp

**Future Auto-Assignment:**
- Any new user with these 15 domains → automatically assigned to salfa-corp
- This includes domains currently without users:
  - fegrande.cl
  - geovita.cl
  - inoval.cl
  - salfacorp.com
  - salfamantenciones.cl
  - salfaustral.cl
  - tecsa.cl
  - duocuc.cl

---

## ✅ **Organization Configuration**

**Salfa Corp Organization:**
- **Name:** Salfa Corp
- **Primary Domain:** salfagestion.cl (admin is here)
- **All Domains:** 15 domains (listed above)
- **Total Users:** 37 (95% of database)
- **Primary Admin:** sorellanac@salfagestion.cl
- **SuperAdmin:** alec@getaifactory.com (not in org, manages org)

---

## 🎯 **Recommendation**

**Run the complete migration with all 15 domains:**

1. **Preview first** (dry-run with all 15 domains)
2. **Verify** (37 users + all domains)
3. **Execute** (production migration)
4. **Verify** (check org stats, user access)

**Want me to run the preview with all 15 domains now?**

