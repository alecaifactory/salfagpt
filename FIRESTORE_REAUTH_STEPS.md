# 🔐 Firestore Re-Authentication Steps

**Problem:** Google Workspace security policy requires fresh re-authentication  
**Error:** `invalid_rapt` (reauth related error)  
**Solution:** Complete credential reset and re-authentication

---

## ✅ Execute These Commands

### Step 1: Open a NEW terminal window

### Step 2: Run these commands in order:

```bash
# 1. Revoke old credentials
gcloud auth application-default revoke

# 2. Remove credential file
rm -f ~/.config/gcloud/application_default_credentials.json

# 3. Re-authenticate (will open browser)
gcloud auth application-default login

# 4. When browser opens:
#    - Select alec@getaifactory.com
#    - Click "Allow"
#    - Wait for "You are now authenticated"
#    - Close browser tab

# 5. Verify credentials created
ls -la ~/.config/gcloud/application_default_credentials.json
# Should show the file exists

# 6. Go back to the terminal running npm run dev
# Press Ctrl+C to stop it

# 7. Restart server
cd /Users/alec/salfagpt
npm run dev

# 8. Wait for server to start (about 10 seconds)

# 9. Refresh browser
# Cmd + Shift + R
```

---

## 🔍 Verification

After completing all steps, check:

```bash
curl http://localhost:3000/api/health/firestore
```

**Should show:**
```json
{
  "status": "healthy",
  "checks": {
    "authentication": {
      "status": "pass"  ← Must say "pass"
    }
  }
}
```

**If still failing:**
- Your Google Workspace may have additional security policies
- May need to use a personal Google account instead
- Or use Service Account authentication

---

## 🎯 Expected Result

**After successful re-auth:**
- ✅ Console: "✅ 74 conversaciones cargadas desde Firestore"
- ✅ Sidebar: Full list of 74 conversations
- ✅ Can click on any conversation
- ✅ Messages load
- ✅ Context sources load

---

## 🚨 Alternative: Use Personal Google Account

If Workspace account has strict security:

```bash
# Login with personal account instead
gcloud auth application-default login --no-browser

# Then follow the URL and authenticate with a personal Gmail account
# that has access to the project
```

---

**Start with Step 1: Open a new terminal and run the commands above.** 🔐

