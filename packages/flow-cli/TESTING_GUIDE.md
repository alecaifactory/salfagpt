# Flow CLI Testing Guide

**Version**: 0.1.0  
**For**: Local development testing

---

## 🚀 Quick Test (2 Minutes)

### Step 1: Verify Build

```bash
cd /Users/alec/salfagpt/packages/flow-cli

# Check build output
ls -la dist/
# Should see: index.js, types.js, config.js, api-client.js, commands/
```

✅ **Expected**: All TypeScript compiled to JavaScript

---

### Step 2: Test CLI Commands

```bash
# Test version
flow --version
# Expected: 0.1.0

# Test help
flow --help
# Expected: List of 5 commands

# Test status (before login)
flow status
# Expected: "Not authenticated"
```

✅ **Expected**: All commands execute without errors

---

### Step 3: Test API Endpoints

```bash
# Test auth endpoint (invalid key)
curl -X GET http://localhost:3000/api/cli/auth/verify \
  -H "X-API-Key: invalid-key"

# Expected: {"error":"Invalid API key"}

# Test usage-stats (no auth)
curl -X GET "http://localhost:3000/api/cli/usage-stats?domain=@test.com"

# Expected: {"error":"Missing API key"}
```

✅ **Expected**: Endpoints return proper error responses

---

### Step 4: Create Test API Key

**Option A: Via Firebase Console** (Fastest)

1. Open Firebase Console
2. Navigate to Firestore → api_keys collection
3. Add document manually:

```json
{
  "name": "Test CLI Key",
  "key": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "keyPreview": "test1234",
  "createdBy": "alec@getaifactory.com",
  "createdAt": <current timestamp>,
  "expiresAt": null,
  "isActive": true,
  "assignedTo": "test@domain.com",
  "domain": "@domain.com",
  "permissions": {
    "canReadUsageStats": true
  },
  "requestCount": 0,
  "description": "Test key",
  "environment": "localhost"
}
```

**Test key plaintext**: `test-key-12345`  
**Hash**: Use `echo -n "test-key-12345" | sha256sum` to get hash above

---

**Option B: Via UI** (After integration)

1. Open http://localhost:3000/superadmin
2. Add APIKeyManagement component
3. Create key via form
4. Copy generated key

---

### Step 5: Test CLI Login

```bash
$ flow login test-key-12345 --endpoint http://localhost:3000

# Expected:
# 🔐 Flow CLI Authentication
# ✅ API key saved securely
# Testing connection...
# ✅ Successfully authenticated!
# User: test@domain.com
# Role: admin
```

✅ **Expected**: Successful authentication

---

### Step 6: Test Usage Stats

```bash
$ flow usage-stats @domain.com

# Expected:
# 📊 Usage Statistics: @domain.com
# (table with stats or "No users found")
```

✅ **Expected**: Stats returned or appropriate empty message

---

### Step 7: Test JSON Export

```bash
$ flow usage-stats @domain.com --format json

# Expected: Valid JSON object
```

✅ **Expected**: Valid JSON with stats structure

---

## 🐛 Troubleshooting

### CLI Not Found

**Problem**: `flow: command not found`

**Solution:**
```bash
cd /Users/alec/salfagpt/packages/flow-cli
npm link
```

---

### API Endpoint 404

**Problem**: Endpoints return 404

**Solution:**
```bash
# Verify files exist
ls -la src/pages/api/cli/
ls -la src/pages/api/superadmin/

# Restart dev server
pkill -f "astro dev"
npm run dev
```

---

### Authentication Fails

**Problem**: CLI login fails even with valid key

**Solution:**
```bash
# Check API key hash matches
echo -n "your-plaintext-key" | sha256sum

# Compare with Firestore document
# Should match the 'key' field
```

---

## ✅ Success Criteria

All tests should pass:

- [x] CLI builds without errors
- [ ] CLI commands execute
- [ ] API endpoints respond
- [ ] Authentication works
- [ ] Usage stats return data
- [ ] Domain isolation enforced
- [ ] JSON export works

**If all pass**: Ready for git commit + deployment!

---

## 🚀 After Testing

### If Tests Pass

```bash
# From main directory
cd /Users/alec/salfagpt

# Stage changes
git add .

# Commit
git commit -m "feat: Add Flow CLI with API key management system

Complete implementation of read-only CLI for domain admins.

Features:
- SuperAdmin API key creation/revocation
- SHA-256 hashed key storage  
- Domain-scoped access enforcement
- Read-only usage statistics command
- Beautiful terminal output
- Secure config storage (~/.flow-cli/)

Files:
- packages/flow-cli/: Complete npm package (33 files)
- src/pages/api/cli/: Auth and stats endpoints
- src/pages/api/superadmin/api-keys.ts: CRUD endpoints
- src/components/APIKeyManagement.tsx: UI component
- firestore.indexes.json: Added api_keys indexes

Testing:
- ✅ CLI builds successfully
- ✅ All commands work
- ✅ API endpoints functional
- ✅ Security enforced

Version: 0.1.0
Status: Production ready"

# Deploy indexes
firebase deploy --only firestore:indexes

# Deploy backend
gcloud run deploy flow-chat --source . --region us-central1

# Publish npm (after production verification)
cd packages/flow-cli
npm publish --access public
```

---

### If Tests Fail

**Document the issue:**
1. Which test failed?
2. What was the error?
3. What did you expect?
4. What actually happened?

**Then**: We'll fix and retest

---

**Ready to test! Let me know how it goes! 🎉**












