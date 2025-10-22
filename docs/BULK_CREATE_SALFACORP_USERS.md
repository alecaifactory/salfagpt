# Bulk Create Salfacorp Users - Manual Import Guide

## 🎯 Purpose

Create 43 Salfacorp users as normal 'user' role in the Flow platform.

Due to Firestore security rules, bulk creation requires either:
1. Manual import through Firebase Console (RECOMMENDED)
2. API call with valid admin session

## 📊 Users to Create

**Total:** 43 users  
**Role:** `user` (standard permissions)  
**Companies:** 13 Salfacorp companies

**Breakdown by Company:**
- Salfa Gestión: 12 usuarios
- Salfa Montajes: 8 usuarios
- Novatec: 4 usuarios
- FE Grande: 3 usuarios
- Salfa Austral: 3 usuarios
- Tecsa: 3 usuarios
- Geovita: 2 usuarios
- Salfa Cloud: 2 usuarios
- Inoval: 2 usuarios
- Salfa Mantenciones: 1 usuario
- Maqsa: 1 usuario
- Salfa Corp: 1 usuario
- IA Concagua: 1 usuario

---

## ✅ Method 1: Firebase Console Manual Import (RECOMMENDED)

### Step 1: Prepare Import Data

The import data is ready in: `scripts/salfacorp-users-import.json`

### Step 2: Access Firestore Console

1. Open Firebase Console: https://console.firebase.google.com/project/gen-lang-client-0986191192/firestore
2. Navigate to Data tab
3. Select `users` collection

### Step 3: Manual Import Process

**Unfortunately, Firebase Console doesn't support bulk JSON import directly. You have two options:**

#### Option A: Use gcloud CLI (if you have project owner permissions)

```bash
# This requires project owner permissions
gcloud alpha firestore import gs://gen-lang-client-0986191192-imports/users/ \
  --collection-ids=users \
  --project=gen-lang-client-0986191192
```

#### Option B: Add Users One-by-One via Console

For each user in `scripts/salfacorp-users-import.json`:

1. Click "Add document" in Firestore Console
2. Set Document ID: `{email}` with `@` and `.` replaced by `_`  
   Example: `nfarias@salfagestion.cl` → `nfarias_salfagestion_cl`
3. Add fields:
   - `email` (string): user's email
   - `name` (string): full name
   - `role` (string): `user`
   - `roles` (array): `["user"]`
   - `company` (string): company name
   - `createdBy` (string): `alec@getaifactory.com`
   - `createdAt` (timestamp): current time
   - `updatedAt` (timestamp): current time
   - `isActive` (boolean): `true`
   - `agentAccessCount` (number): `0`
   - `contextAccessCount` (number): `0`
   - `permissions` (map): See below

**Permissions for 'user' role:**
```json
{
  "canCreateAgents": true,
  "canDeleteOwnAgents": true,
  "canViewOwnAgents": true,
  "canUseAgents": true,
  "canUploadContext": true,
  "canDeleteOwnContext": true,
  "canViewOwnContext": true,
  "canUseContext": true,
  "canSendMessages": true,
  "canViewOwnConversations": true,
  "canOrganizeInFolders": true
}
```

---

## ✅ Method 2: Through Web UI (When it's available)

### Prerequisites
1. Running dev server: `npm run dev`
2. Login as admin at http://localhost:3000/chat
3. Access User Management panel

### Steps
1. Click user menu (bottom-left)
2. Click "User Management"
3. Click "Create User" button
4. Fill in form for each user
5. Set role to "user"
6. Save

**Note:** This method is tedious for 43 users but ensures proper permissions.

---

## ✅ Method 3: Via API (With Admin Session)

### Prerequisites
1. Running dev server: `npm run dev`
2. Valid admin session cookie

### Steps

1. **Get your session cookie:**
   - Login at http://localhost:3000/chat
   - Open DevTools → Application → Cookies
   - Copy value of `flow_session` cookie

2. **Run the script:**
   ```bash
   ./scripts/create-salfacorp-users-via-api.sh "your-session-cookie-value"
   ```

3. **Verify results:**
   - Check console output
   - Verify in Firebase Console

---

## 🔍 Troubleshooting

### Permission Denied Errors

**Cause:** Firestore security rules or IAM permissions

**Solutions:**
1. Deploy Firestore rules: `firebase deploy --only firestore:rules`
2. Or manually import via Firebase Console
3. Or use service account with admin permissions

### Users Already Exist

If some users already exist (from previous runs):
- Script will skip them
- No duplicates will be created
- Check Firestore Console to verify

---

## 📋 Verification

After creating users, verify in Firebase Console:

1. **Count:** Should have 43 new users in `users` collection
2. **Fields:** Each user should have all required fields
3. **Permissions:** Each user should have `user` role permissions
4. **Companies:** Users should be distributed across 13 companies

### Quick Verification Script

```bash
npx tsx -e "
import { getAllUsers } from './src/lib/firestore.js';
const users = await getAllUsers();
const salfacorpUsers = users.filter(u => 
  u.email.includes('salfagestion') ||
  u.email.includes('salfamontajes') ||
  u.email.includes('fegrande') ||
  u.email.includes('geovita') ||
  u.email.includes('salfaustral') ||
  u.email.includes('novatec') ||
  u.email.includes('tecsa') ||
  u.email.includes('maqsa') ||
  u.email.includes('salfacorp') ||
  u.email.includes('salfacloud') ||
  u.email.includes('iaconcagua') ||
  u.email.includes('inoval') ||
  u.email.includes('salfamantenciones')
);
console.log('Total Salfacorp users:', salfacorpUsers.length);
salfacorpUsers.forEach(u => console.log('-', u.email, '(' + u.company + ')'));
process.exit(0);
"
```

---

## 💡 Next Steps

After users are created:

1. **Email notification:** Inform users they can now login
2. **Onboarding:** Provide user guide/training
3. **Support:** Be available for questions
4. **Monitoring:** Track login activity and usage

---

## 📚 User List Reference

<details>
<summary>Click to expand full user list (43 users)</summary>

1. nfarias@salfagestion.cl - Nenett Farias (Salfa Gestión)
2. acastillo@salfagestion.cl - Andy Castillo (Salfa Gestión)
3. mmelin@salfagestion.cl - Marcos Melin (Salfa Gestión)
4. sorellanac@salfagestion.cl - Sebastian Orellana (Salfa Gestión)
5. fdiazt@salfagestion.cl - FRANCIS ANAIS DIAZ TOBAR (Salfa Gestión)
6. mjaramillo@salfamontajes.com - Matías Jaramillo (Salfa Montajes)
7. plambert@fegrande.cl - Paul Lambert (FE Grande)
8. avalderramad@geovita.cl - Alejandro Valderrama (Geovita)
9. iwebar@salfaustral.cl - Ignacio Webar (Salfa Austral)
10. lramos@fegrande.cl - Luis Ramos (FE Grande)
11. abecerrao@salfamontajes.com - Ariel Becerra (Salfa Montajes)
12. fpereza@salfamontajes.com - Franco Pérez (Salfa Montajes)
13. cmaldonados@novatec.cl - Carlos Maldonado (Novatec)
14. erioseco@salfamantenciones.cl - Eduardo Rioseco (Salfa Mantenciones)
15. gherreral@tecsa.cl - Gabriel Herrera (Tecsa)
16. jmestre@salfaustral.cl - John Mestre (Salfa Austral)
17. lpenaag@salfamontajes.com - Lucas Peña (Salfa Montajes)
18. tidiaz@maqsa.cl - Tomás Díaz (Maqsa)
19. msotoq@salfagestion.cl - MATIAS NICOLAS SOTO QUEZADA (Salfa Gestión)
20. dtorres@salfagestion.cl - Daniel Emilio Torres Mora (Salfa Gestión)
21. nimunoz@salfacorp.com - N. IVAN MUÑOZ TORRES (Salfa Corp)
22. cesar@salfacloud.cl - Soporte (Salfa Cloud)
23. rkrause@tecsa.cl - RONALD JOACHIM KRAUSE ORELLANA (Tecsa)
24. ftramon@tecsa.cl - FRANCISCA TIARE TRAMON LABORDA (Tecsa)
25. nmunozm@salfagestion.cl - NICOLAS IGNACIO MUÑOZ MORALES (Salfa Gestión)
26. dcifuentes@salfamontajes.com - DANIEL EDMUNDO CIFUENTES CARRASCO (Salfa Montajes)
27. cmsaavedra@salfagestion.cl - CAMILA MARGARITA SAAVEDRA SILVA (Salfa Gestión)
28. wcerda@salfamontajes.com - WILSON OCTAVIO CERDA CORTES (Salfa Montajes)
29. respicel@salfaustral.cl - RICARDO ALBERTO ESPICEL LA PAZ (Salfa Austral)
30. ojimenez@inoval.cl - OSCAR PEDRO JIMENEZ URETA (Inoval)
31. snunez@salfamontajes.com - SEBASTIAN IGNACIO NUÑEZ CONTRERAS (Salfa Montajes)
32. aialvarez@geovita.cl - ANIBAL IGNACIO ALVAREZ MORENO (Geovita)
33. jahumadaa@salfamontajes.com - JOSE ARIEL AHUMADA ALVEAL (Salfa Montajes)
34. jriverof@iaconcagua.com - JULIO IGNACIO RIVERO FIGUEROA (IA Concagua)
35. dortega@novatec.cl - DANIEL ADOLFO ORTEGA VIDELA (Novatec)
36. mburgoa@novatec.cl - MANUEL ALEJANDRO BURGOA MARAMBIO (Novatec)
37. gfalvarez@novatec.cl - GONZALO FERNANDO ALVAREZ GONZALEZ (Novatec)
38. akamke@salfagestion.cl - AGUSTIN PABLO KAMKE MARDONES (Salfa Gestión)
39. rfuentesm@inoval.cl - RICARDO ANDRES FUENTES MOISAN (Inoval)
40. scortesr@salfagestion.cl - SEBASTIAN RODRIGO Cortes Rodriguez (Salfa Gestión)
41. mbarriga@salfagestion.cl - MARÍA INÉS BARRIGA TAPIA (Salfa Gestión)
42. hcastillo@fegrande.cl - Hans Castillo (FE Grande)
43. capacitacionesia@salfacloud.cl - Capacitaciones IA (Salfa Cloud)

</details>

---

## 🚨 Important Notes

1. **Automatic Creation on Login:** Users will be auto-created when they first login via Google OAuth if they don't exist yet
2. **No Pre-creation Required:** The system will handle user creation automatically
3. **Role Assignment:** New users get 'user' role by default (can be changed later)
4. **Company Detection:** Company is auto-detected from email domain

### Recommendation

**The EASIEST approach is to skip manual creation entirely:**

1. Configure Google OAuth to allow these domains
2. Users login with their corporate Google accounts
3. System auto-creates user on first login with 'user' role
4. You can then adjust roles if needed via User Management panel

This approach is:
- ✅ Zero manual work
- ✅ Self-service for users
- ✅ Automatic and reliable
- ✅ No permission issues

---

## 📧 Email Template for Users

```
Subject: Acceso a Flow - Plataforma de IA para Salfacorp

Hola,

Ya tienes acceso a Flow, la nueva plataforma de IA conversacional para Salfacorp.

**Cómo iniciar sesión:**
1. Visita: https://your-production-url.com/chat
2. Haz clic en "Login with Google"
3. Usa tu email corporativo: {user@company.com}

**Qué puedes hacer:**
- Crear agentes de IA personalizados
- Subir documentos como contexto (PDFs, Excel, Word)
- Conversaciones inteligentes con el AI
- Organizar tus agentes en carpetas

**Soporte:**
Si tienes preguntas, contacta a: alec@getaifactory.com

Saludos,
Equipo Flow
```

---

**Created:** 2025-10-22  
**Total Users:** 43  
**Method:** Auto-creation on first OAuth login (RECOMMENDED)  
**Alternative:** Manual import via Firebase Console

