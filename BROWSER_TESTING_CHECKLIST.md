# 🧪 Browser Testing Checklist for OAuth

## ✅ What's Working (Verified):
- ✅ Server on http://localhost:3000
- ✅ Home page loads (200 OK)
- ✅ Chat interface loads (200 OK)
- ✅ Login redirects to Google OAuth ✨

## 🎯 Manual Testing Steps

### Test 1: Home Page ✅
**URL**: http://localhost:3000/

**What to check:**
- [ ] Page loads without errors
- [ ] See "Flow" branding
- [ ] Navigation works
- [ ] Design looks professional

### Test 2: Chat Interface (Before Login) 🔒
**URL**: http://localhost:3000/chat

**What to check:**
- [ ] Chat UI loads
- [ ] See message input box
- [ ] See send button
- [ ] Try sending a message → Should get "Unauthorized" (expected)

### Test 3: OAuth Login Flow 🔐
**URL**: http://localhost:3000/auth/login

**What should happen:**
1. [ ] Browser redirects to Google sign-in page
2. [ ] See Google OAuth consent screen
3. [ ] Shows: "Flow wants to access your Google Account"
4. [ ] Permissions requested:
   - See your email address
   - See your personal info
5. [ ] Click "Continue" or "Allow"

### Test 4: After Google Login ✨
**What should happen:**
1. [ ] Redirect back to http://localhost:3000 (or wherever configured)
2. [ ] You're now logged in!
3. [ ] Check browser DevTools (F12):
   - Go to: Application → Cookies → http://localhost:3000
   - [ ] See cookie named: `flow_session`
   - [ ] Cookie has a JWT token value

### Test 5: Chat with Authentication ✅
**URL**: http://localhost:3000/chat (after login)

**What to check:**
- [ ] Chat interface loads
- [ ] Type a test message: "Hello!"
- [ ] Click Send
- [ ] Should work WITHOUT "401 Unauthorized"!
- [ ] AI should respond (if Gemini API key is set)

### Test 6: Logout 🚪
**URL**: http://localhost:3000/auth/logout

**What should happen:**
- [ ] Session cookie removed
- [ ] Redirected to home page
- [ ] Chat no longer works (401 again)
- [ ] Can login again

---

## 🐛 Common Issues & Solutions

### Issue 1: "Redirect URI mismatch" error
**Solution**: Your OAuth callback URL must be exactly:
```
http://localhost:3000/auth/callback
```
(Already configured in your screenshot ✅)

### Issue 2: "This app isn't verified"
**Solution**: 
- Click "Advanced"
- Click "Go to Flow (unsafe)" 
- This is normal for development apps

### Issue 3: Login works but chat still gives 401
**Possible causes:**
- Cookie not being set → Check DevTools → Application → Cookies
- JWT_SECRET not set in .env → Check: `grep JWT_SECRET .env`
- Session expired → Try logout and login again

### Issue 4: "Access blocked: This app hasn't been verified"
**Solution**:
- Go to OAuth Consent Screen in Google Console
- Add yourself as a Test User
- Save and try again

---

## ✅ Success Checklist

After completing all tests, you should have:

- [x] Home page accessible
- [x] Chat UI loads
- [x] OAuth login redirects to Google
- [ ] Successfully logged in with Google account
- [ ] Session cookie exists in browser
- [ ] Chat works after login (no 401 errors)
- [ ] Can send messages to AI
- [ ] Can logout successfully

---

## 🎉 What to Do Next

Once OAuth is working:

1. **Test different user accounts**
   - Try logging in with different Google accounts
   - Verify sessions are separate

2. **Test session persistence**
   - Close browser
   - Reopen http://localhost:3000/chat
   - Should still be logged in (for 24 hours)

3. **Test protected endpoints**
   - Visit: http://localhost:3000/api/analytics/summary
   - Should work after login

4. **Deploy to production**
   - Follow: DEPLOY_TO_CLOUD_RUN.md
   - Update OAuth redirect URIs for production domain
   - Test OAuth on production URL

---

## 📊 Testing Status Template

Copy and paste this to track your testing:

```
Date: _____________
Tester: ___________

✅ Home page: [ ]
✅ Chat UI loads: [ ]
✅ Login redirects to Google: [ ]
✅ Google auth completes: [ ]
✅ Session cookie created: [ ]
✅ Chat works after login: [ ]
✅ Logout works: [ ]

Issues found:
- 
- 
- 

Notes:
- 
- 
```

---

**Ready to test? Start with Step 1 and check off each item!** 🚀
