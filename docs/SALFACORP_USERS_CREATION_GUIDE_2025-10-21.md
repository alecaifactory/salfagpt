# Salfacorp Users Creation Guide

**Date:** 2025-10-21  
**Created by:** Alec  
**Purpose:** Create 43 Salfacorp users across 13 domains

---

## 📊 Summary

- **Total users to create:** 43
- **Unique domains:** 13
- **All users role:** `user` (basic permissions)
- **Created by:** `alec@getaifactory.com`

---

## ✅ Domains Status

**Good news:** All 13 domains were successfully enabled via API:

1. ✅ salfagestion.cl
2. ✅ salfamontajes.com
3. ✅ fegrande.cl
4. ✅ geovita.cl
5. ✅ salfaustral.cl
6. ✅ novatec.cl
7. ✅ salfamantenciones.cl
8. ✅ tecsa.cl
9. ✅ maqsa.cl
10. ✅ salfacorp.com
11. ✅ salfacloud.cl
12. ✅ inoval.cl
13. ✅ iaconcagua.com

---

## 👥 Users to Create

### Option 1: Via Firebase Console (Manual)

Go to: https://console.firebase.google.com/project/gen-lang-client-0986191192/firestore/data/~2Fusers

For each user below, click "Add document" and use this structure:

**Document ID:** `{email with @ and . replaced by _}`  
Example: `nfarias@salfagestion.cl` → Document ID: `nfarias_salfagestion_cl`

**Fields:**
```
id: {email_with_underscores}
email: {email}
name: {fullName}
role: "user"
roles: ["user"]
company: {domain}
department: ""
createdAt: {timestamp - now}
updatedAt: {timestamp - now}
createdBy: "alec@getaifactory.com"
isActive: true
```

---

### Option 2: Firestore Import (Bulk)

Create a JSON file and import via `gcloud firestore import`.

---

### Option 3: Grant Script Permissions (Recommended)

Grant your current account Firestore write permissions:

```bash
# Switch to an account with Owner/Editor role on the project
gcloud auth login

# Grant datastore.user role to service account or your user
gcloud projects add-iam-policy-binding gen-lang-client-0986191192 \
  --member="user:YOUR_ADMIN_EMAIL@domain.com" \
  --role="roles/datastore.user"

# Then run the script again
node scripts/create-salfacorp-users-direct.mjs
```

---

## 📋 Complete User List

| # | Full Name | Email | Domain |
|---|-----------|-------|--------|
| 1 | Nenett Farias | nfarias@salfagestion.cl | salfagestion.cl |
| 2 | Andy Castillo | acastillo@salfagestion.cl | salfagestion.cl |
| 3 | Marcos Melin | mmelin@salfagestion.cl | salfagestion.cl |
| 4 | Sebastian Orellana | sorellanac@salfagestion.cl | salfagestion.cl |
| 5 | FRANCIS ANAIS DIAZ TOBAR | fdiazt@salfagestion.cl | salfagestion.cl |
| 6 | Matías Jaramillo | mjaramillo@salfamontajes.com | salfamontajes.com |
| 7 | Paul Lambert | plambert@fegrande.cl | fegrande.cl |
| 8 | Alejandro Valderrama | avalderramad@geovita.cl | geovita.cl |
| 9 | Ignacio Webar | iwebar@salfaustral.cl | salfaustral.cl |
| 10 | Luis Ramos | lramos@fegrande.cl | fegrande.cl |
| 11 | Ariel Becerra | abecerrao@salfamontajes.com | salfamontajes.com |
| 12 | Franco Pérez | fpereza@salfamontajes.com | salfamontajes.com |
| 13 | Carlos Maldonado | cmaldonados@novatec.cl | novatec.cl |
| 14 | Eduardo Rioseco | erioseco@salfamantenciones.cl | salfamantenciones.cl |
| 15 | Gabriel Herrera | gherreral@tecsa.cl | tecsa.cl |
| 16 | John Mestre | jmestre@salfaustral.cl | salfaustral.cl |
| 17 | Lucas Peña | lpenaag@salfamontajes.com | salfamontajes.com |
| 18 | Tomás Díaz | tidiaz@maqsa.cl | maqsa.cl |
| 19 | MATIAS NICOLAS SOTO QUEZADA | msotoq@salfagestion.cl | salfagestion.cl |
| 20 | Daniel Emilio Torres Mora | dtorres@salfagestion.cl | salfagestion.cl |
| 21 | N. IVAN MUÑOZ TORRES | nimunoz@salfacorp.com | salfacorp.com |
| 22 | Soporte | cesar@salfacloud.cl | salfacloud.cl |
| 23 | RONALD JOACHIM KRAUSE ORELLANA | rkrause@tecsa.cl | tecsa.cl |
| 24 | FRANCISCA TIARE TRAMON LABORDA | ftramon@tecsa.cl | tecsa.cl |
| 25 | NICOLAS IGNACIO MUÑOZ MORALES | nmunozm@salfagestion.cl | salfagestion.cl |
| 26 | DANIEL EDMUNDO CIFUENTES CARRASCO | dcifuentes@salfamontajes.com | salfamontajes.com |
| 27 | CAMILA MARGARITA SAAVEDRA SILVA | cmsaavedra@salfagestion.cl | salfagestion.cl |
| 28 | WILSON OCTAVIO CERDA CORTES | wcerda@salfamontajes.com | salfamontajes.com |
| 29 | RICARDO ALBERTO ESPICEL LA PAZ | respicel@salfaustral.cl | salfaustral.cl |
| 30 | OSCAR PEDRO JIMENEZ URETA | ojimenez@inoval.cl | inoval.cl |
| 31 | SEBASTIAN IGNACIO NUÑEZ CONTRERAS | snunez@salfamontajes.com | salfamontajes.com |
| 32 | ANIBAL IGNACIO ALVAREZ MORENO | aialvarez@geovita.cl | geovita.cl |
| 33 | JOSE ARIEL AHUMADA ALVEAL | jahumadaa@salfamontajes.com | salfamontajes.com |
| 34 | JULIO IGNACIO RIVERO FIGUEROA | jriverof@iaconcagua.com | iaconcagua.com |
| 35 | DANIEL ADOLFO ORTEGA VIDELA | dortega@novatec.cl | novatec.cl |
| 36 | MANUEL ALEJANDRO BURGOA MARAMBIO | mburgoa@novatec.cl | novatec.cl |
| 37 | GONZALO FERNANDO ALVAREZ GONZALEZ | gfalvarez@novatec.cl | novatec.cl |
| 38 | AGUSTIN PABLO KAMKE MARDONES | akamke@salfagestion.cl | salfagestion.cl |
| 39 | RICARDO ANDRES FUENTES MOISAN | rfuentesm@inoval.cl | inoval.cl |
| 40 | SEBASTIAN RODRIGO Cortes Rodriguez | scortesr@salfagestion.cl | salfagestion.cl |
| 41 | MARÍA INÉS BARRIGA TAPIA | mbarriga@salfagestion.cl | salfagestion.cl |
| 42 | Hans Castillo | hcastillo@fegrande.cl | fegrande.cl |
| 43 | Capacitaciones IA | capacitacionesia@salfacloud.cl | salfacloud.cl |

---

## 🔧 Recommended Solution

### Step 1: Grant Firestore Permissions

You need to grant write permissions to either:

**Option A:** Your current user (`alec@salfacloud.cl`)
```bash
# Switch to an account with Owner role on the project
gcloud auth login

# Run this command with Owner account:
gcloud projects add-iam-policy-binding gen-lang-client-0986191192 \
  --member="user:alec@salfacloud.cl" \
  --role="roles/datastore.user"
```

**Option B:** Use service account credentials
```bash
# Create a service account key (if you have Owner access)
gcloud iam service-accounts keys create key.json \
  --iam-account=SERVICE_ACCOUNT_EMAIL

# Set environment variable
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/key.json"

# Run script
node scripts/create-salfacorp-users-direct.mjs
```

### Step 2: Run the Script

Once permissions are granted:
```bash
node scripts/create-salfacorp-users-direct.mjs
```

This will create all 43 users and enable all 13 domains.

---

## 📝 Manual Creation Reference

If you need to create users manually, use this JSON template for each user:

```json
{
  "id": "email_with_underscores",
  "email": "user@domain.com",
  "name": "Full Name",
  "role": "user",
  "roles": ["user"],
  "company": "domain.com",
  "department": "",
  "createdAt": "2025-10-21T12:00:00Z",
  "updatedAt": "2025-10-21T12:00:00Z",
  "createdBy": "alec@getaifactory.com",
  "isActive": true
}
```

---

## ✅ Verification

After creating users, verify with:

```bash
# Count users in Firestore
npx tsx -e "
import { Firestore } from '@google-cloud/firestore';
const firestore = new Firestore({ projectId: 'gen-lang-client-0986191192' });
const snapshot = await firestore.collection('users').get();
console.log('Total users:', snapshot.size);
process.exit(0);
"
```

---

## 🚨 Current Issue

**Problem:** `alec@salfacloud.cl` doesn't have `datastore.user` or `datastore.owner` role

**Solutions:**
1. Login with an Owner account and grant permissions
2. Use Firebase Console to create users manually
3. Use a service account with proper credentials
4. Contact project owner to grant permissions

---

## 📞 Next Steps

1. Determine which account has Owner/Editor role on `gen-lang-client-0986191192`
2. Use that account to grant permissions OR create users manually
3. Run verification script to confirm all 43 users exist



