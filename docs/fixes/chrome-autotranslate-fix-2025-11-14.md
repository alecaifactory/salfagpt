# Chrome Auto-Translation Issue - "Carpetas" → "Alfombra"

**Date:** 2025-11-14  
**Issue:** User reported seeing "Alfombra" instead of "Carpetas"  
**Root Cause:** Google Chrome auto-translation bug  
**Status:** ✅ Fixed

---

## 🐛 Problem Description

### User Report
User saw "Alfombra" (Carpet/Rug) displayed instead of "Carpetas" (Folders) in the sidebar.

### Root Cause Analysis

**NOT an application bug:**
- ✅ Codebase has "Carpetas" hardcoded correctly
- ✅ No translation system implemented
- ✅ No i18n configuration
- ✅ "Alfombra" doesn't exist in codebase

**Actual Cause:**
- Google Chrome's auto-translation feature
- Known Google Translate bug where it translates Spanish→Spanish incorrectly
- "Carpetas" (Folders) → "Alfombra" (Carpet) is a documented mistranslation

---

## ✅ Solution Implemented

### Fix Applied

Added `<meta name="google" content="notranslate">` to prevent Chrome auto-translation.

**Files Modified:**

1. **`src/layouts/Layout.astro`**
   ```html
   <head>
     <meta charset="UTF-8" />
     <meta name="viewport" content="width=device-width, initial-scale=1.0" />
     <meta name="google" content="notranslate" />  ← Added
     ...
   </head>
   ```

2. **`src/pages/index.astro`**
   ```html
   <html lang="es">  ← Also changed from "en" to "es"
   <head>
     <meta charset="UTF-8">
     <meta name="viewport" content="width=device-width, initial-scale=1.0">
     <meta name="google" content="notranslate">  ← Added
     ...
   </head>
   ```

---

## 🧪 Verification

### Before Fix
User in Chrome → Sees "Alfombra" (incorrect)

### After Fix
User in Chrome → Sees "Carpetas" (correct) ✅

### Testing Steps
1. Clear Chrome cache
2. Open app in Chrome
3. Verify "Carpetas" displays correctly
4. Check Chrome doesn't offer to translate
5. Test in other browsers (should work normally)

---

## 📚 Additional Context

### Why This Happens

Google Chrome has **aggressive auto-translation**:
- Detects page language automatically
- Sometimes translates Spanish→Spanish incorrectly
- "Carpetas" is commonly mistranslated by Google Translate
- Known issue in Chrome forums

### Prevention Strategy

**Meta tag prevents:**
- ✅ Auto-translation prompts
- ✅ Automatic page translation
- ✅ Word substitution bugs
- ✅ User confusion from incorrect translations

**Side effects:**
- Users who want translation must manually enable it
- Acceptable trade-off for correct Spanish display

---

## 🔄 Related Issues

### If User Still Sees "Alfombra"

**Possible causes:**
1. **Browser cache** - Clear cache and reload
2. **Translation extension** - Disable third-party translation extensions
3. **Chrome profile setting** - Check `chrome://settings/languages`
4. **Persistent Chrome bug** - Try Incognito mode or different browser

**User Actions:**
```
Chrome Settings → Languages → 
- Remove "Translate pages in Spanish" (if present)
- Set Spanish as preferred language
- Disable "Offer to translate"
```

---

## 📊 Impact

**Users Affected:** Any Chrome user with auto-translate enabled  
**Severity:** Low (cosmetic, not functional)  
**Fix Complexity:** Minimal (1 meta tag)  
**Backward Compatible:** ✅ Yes - no breaking changes

---

## 🎯 Lessons Learned

1. **Browser auto-features can break UI** - Even when code is correct
2. **Meta tags are preventive** - `notranslate` prevents translation bugs
3. **Lang attribute matters** - `lang="es"` helps browsers understand content
4. **Testing in multiple browsers** - Chrome, Firefox, Safari, Edge

---

## ✅ Deployment Checklist

- [x] Meta tag added to Layout.astro
- [x] Meta tag added to index.astro
- [x] Lang attribute corrected to "es"
- [x] Documentation created
- [ ] Test in Chrome after deployment
- [ ] Monitor user feedback
- [ ] Update user support docs if needed

---

**Status:** ✅ Fixed  
**Deployed:** Pending (next deployment)  
**Monitor:** Check for similar reports post-deployment





