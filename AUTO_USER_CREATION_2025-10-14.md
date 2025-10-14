# ✅ Auto User Creation on OAuth Login

**Date:** October 14, 2025  
**Status:** ✅ Implemented  
**Impact:** Users now automatically saved to Firestore on login

---

## 🎯 Problem Solved

### Before (Problem)
```
User logs in with Google OAuth
  ↓
Session cookie created ✅
  ↓
User info stored in JWT ✅
  ↓
Firestore users collection: ❌ NOT updated
  ↓
User Management panel: Shows "0 usuarios" ❌
```

### After (Solution)
```
User logs in with Google OAuth
  ↓
Session cookie created ✅
  ↓
User info stored in JWT ✅
  ↓
NEW: upsertUserOnLogin() called ✅
  ↓
Firestore users collection: Updated ✅
  ↓
User Management panel: Shows all users ✅
```

---

## 🔧 Implementation

### New Function: `upsertUserOnLogin()`

**Location:** `src/lib/firestore.ts`

**Purpose:** Create or update user in Firestore when they login

**Logic:**
```typescript
export async function upsertUserOnLogin(email: string, name: string) {
  const userId = email.replace(/[@.]/g, '_');
  
  // Check if user exists
  const userDoc = await firestore.collection('users').doc(userId).get();
  
  if (userDoc.exists) {
    // Existing user - update last login
    await firestore.collection('users').doc(userId).update({
      name,           // Update if name changed
      lastLoginAt: now,
      updatedAt: now,
    });
    console.log('✅ User login updated:', email);
  } else {
    // New user - create record
    await firestore.collection('users').doc(userId).set({
      email,
      name,
      role: 'user',
      roles: ['user'],
      company: extractCompany(email),  // Auto-extract from domain
      permissions: getMergedPermissions(['user']),
      createdAt: now,
      lastLoginAt: now,
      isActive: true,
      createdBy: 'oauth-system',
    });
    console.log('✅ New user created:', email);
  }
}
```

---

## 🏢 Auto Company Assignment

**Function:** `extractCompany(email)`

**Maps email domains to company names:**

| Email Domain | Company Name |
|---|---|
| @getaifactory.com | GetAI Factory |
| @salfacorp.com | Salfa Corp |
| @salfagestion.cl | Salfa Gestión |
| @other-domain.com | other-domain.com |

**Example:**
- alec@getaifactory.com → Company: "GetAI Factory"
- hello@getaifactory.com → Company: "GetAI Factory"
- user@example.com → Company: "example.com"

---

## 👤 Default User Values

When a new user logs in for the first time:

```typescript
{
  id: "email_domain_com",       // Email with @ and . replaced by _
  email: "user@example.com",
  name: "User Name",             // From Google OAuth
  role: "user",                  // Primary role
  roles: ["user"],               // Multi-role array
  company: "example.com",        // Auto-extracted
  department: undefined,         // Can be set by admin later
  permissions: { ... },          // Default user permissions
  createdAt: Date,
  updatedAt: Date,
  lastLoginAt: Date,
  isActive: true,
  createdBy: "oauth-system",
}
```

**Admins can later:**
- Change roles via User Management panel
- Add more roles (multi-role support)
- Set department
- Activate/deactivate

---

## 🔄 User Lifecycle

### First Login (New User)
```
1. User clicks "Continue with Google"
2. OAuth authentication
3. Callback receives user info (email, name)
4. upsertUserOnLogin() called
5. User NOT found in Firestore
6. CREATE new user with defaults:
   - Role: 'user'
   - Company: Auto-extracted from email
   - Active: true
   - Created by: 'oauth-system'
7. Redirect to /chat
8. User appears in User Management panel ✅
```

### Subsequent Logins (Existing User)
```
1. User clicks "Continue with Google"
2. OAuth authentication
3. Callback receives user info
4. upsertUserOnLogin() called
5. User FOUND in Firestore
6. UPDATE existing user:
   - Name: Updated if changed
   - LastLoginAt: Updated to now
7. Redirect to /chat
8. User stats updated in panel ✅
```

---

## 📊 What Shows in User Management Now

### Before Fix
```
┌──────────────────────────────────┐
│  👥 Gestión de Usuarios          │
│  0 usuarios totales              │
├──────────────────────────────────┤
│                                  │
│   👤                             │
│   No hay usuarios creados        │
│                                  │
│   [+ Crear Primer Usuario]      │
│                                  │
└──────────────────────────────────┘
```

### After Fix (After Re-login)
```
┌─────────────────────────────────────────────────────────────────┐
│  👥 Gestión de Usuarios          2 usuarios totales             │
├─────────────────────────────────────────────────────────────────┤
│ Usuario      │ Roles  │ Empresa      │ Estado │ Último Login   │
├──────────────┼────────┼──────────────┼────────┼────────────────┤
│ AD           │ 🟣 Admin│ GetAI       │ 🟢    │ Hoy 3:00PM     │
│ Alec D.      │        │ Factory     │ Activo │                │
│ alec@get...  │        │             │        │                │
├──────────────┼────────┼──────────────┼────────┼────────────────┤
│ HE           │ ⚪ User │ GetAI       │ 🟢    │ Hoy 2:45PM     │
│ Hello U.     │        │ Factory     │ Activo │                │
│ hello@get... │        │             │        │                │
└──────────────┴────────┴──────────────┴────────┴────────────────┘
```

---

## ✅ Testing Instructions

### Step 1: Logout
```
1. Click your name (bottom-left)
2. Click "Cerrar Sesión"
3. You'll be redirected to landing page
```

### Step 2: Re-login
```
1. Click "Continue with Google"
2. Authenticate with alec@getaifactory.com
3. Redirect to /chat
```

### Step 3: Check User Management
```
1. Click your name (bottom-left)
2. Click "👥 Gestión de Usuarios"
3. Should now see:
   ✅ Your user (alec@getaifactory.com)
   ✅ Company: GetAI Factory
   ✅ Role: user (can be changed to admin by another admin)
   ✅ Last Login: Just now
```

### Step 4: Test with Second User (Optional)
```
1. Logout
2. Login as hello@getaifactory.com
3. Check User Management again
4. Should see BOTH users:
   - alec@getaifactory.com
   - hello@getaifactory.com
```

---

## 🔒 Security & Privacy

**User Data Stored:**
- Email (from Google OAuth)
- Name (from Google OAuth)
- Company (auto-extracted from domain)
- Roles (default: 'user')
- Login timestamps
- Active status

**NOT Stored:**
- Password (OAuth only, no passwords)
- Google access tokens
- Refresh tokens
- Other sensitive OAuth data

**Access Control:**
- Only admins/superadmins can view User Management
- Regular users cannot see this panel
- Users only see their own data in settings

---

## 📋 Files Modified

1. **`src/pages/auth/callback.ts`**
   - Added `upsertUserOnLogin()` call after OAuth
   - Logs success/failure
   - Non-blocking (continues even if fails)

2. **`src/lib/firestore.ts`**
   - Added `upsertUserOnLogin()` function (+70 lines)
   - Added `extractCompany()` helper
   - Added `getMergedPermissions()` helper
   - Fixed type errors in permission merging

---

## 🎯 Impact

**Before:**
- Users could login ✅
- But weren't tracked in Firestore ❌
- User Management showed empty ❌
- No way to manage user roles ❌

**After:**
- Users login ✅
- Automatically saved to Firestore ✅
- User Management shows all users ✅
- Can manage roles, permissions ✅
- Can impersonate users ✅
- Complete user oversight ✅

---

## 📊 User Registration Flow

```
┌──────────────────────────────────────────────────────┐
│  OAuth Login → User Registration Flow               │
├──────────────────────────────────────────────────────┤
│                                                      │
│  1. User clicks "Continue with Google"              │
│     ↓                                                │
│  2. Google OAuth (email, name, picture)             │
│     ↓                                                │
│  3. Callback receives user info                     │
│     ↓                                                │
│  4. Set session cookie ✅                           │
│     ↓                                                │
│  5. NEW: upsertUserOnLogin(email, name) ✅          │
│     ↓                                                │
│     ┌─── User Exists? ───┐                          │
│     │                     │                          │
│    YES                   NO                          │
│     │                     │                          │
│     ↓                     ↓                          │
│  Update:              Create:                        │
│  • lastLoginAt        • All fields                   │
│  • name               • Role: 'user'                 │
│  • updatedAt          • Company: from email          │
│                       • Active: true                 │
│     │                     │                          │
│     └────────┬────────────┘                          │
│              ↓                                       │
│  6. Redirect to /chat ✅                             │
│     ↓                                                │
│  7. User visible in User Management ✅               │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

## ✅ Success Criteria

- [x] `upsertUserOnLogin()` function created
- [x] Called from OAuth callback
- [x] Creates new users with defaults
- [x] Updates existing users on login
- [x] Company auto-extracted from email
- [x] Type errors fixed
- [x] Non-blocking (login still works if fails)
- [x] Logged for debugging
- [ ] Tested: Logout and re-login (next step)
- [ ] Verified: Users appear in panel (after re-login)

---

## 🚀 Next Steps

1. **Test the fix:**
   - Logout from the app
   - Re-login with alec@getaifactory.com
   - Open User Management panel
   - Should see your user now ✅

2. **Test with second user:**
   - Login as hello@getaifactory.com (if available)
   - Check User Management
   - Should see both users

3. **Promote to admin (if needed):**
   - Create another admin user manually
   - Or use Firestore console to update your role to 'admin'

---

**Status:** ✅ Implemented  
**Commits:** 2 (feat + fix)  
**Ready for:** Testing via logout/re-login  
**Expected Result:** Users appear in User Management panel

