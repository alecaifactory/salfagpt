# Firestore Development Setup Guide

## Issue Resolution: GOOGLE_APPLICATION_CREDENTIALS Error

**Date**: October 11, 2025  
**Error**: `ENOENT: no such file or directory, lstat '/Users/alec/Downloads/ocr-kaufmann-legal-01495a71b106.json'`

---

## What Was Fixed

The error occurred because `GOOGLE_APPLICATION_CREDENTIALS` was pointing to a non-existent service account file. This caused Firestore operations to fail when loading the chat page.

### Solution Implemented

1. **Graceful Error Handling**: Updated `src/lib/firestore.ts` to catch Firestore errors in development mode
2. **Empty Results**: Returns empty arrays/null instead of crashing when Firestore is unavailable
3. **Developer Warnings**: Logs helpful messages about how to fix the issue
4. **TypeScript Safety**: Fixed all `data is possibly undefined` errors

---

## Permanent Solutions

Choose **ONE** of the following options for your development environment:

### Option 1: Unset Invalid Environment Variable (Quickest)

```bash
# Add to your ~/.zshrc or ~/.bashrc
unset GOOGLE_APPLICATION_CREDENTIALS

# Then restart your terminal or run:
source ~/.zshrc
```

### Option 2: Use Valid Service Account Key

1. Download a valid service account key from GCP Console:
   - Go to: https://console.cloud.google.com/iam-admin/serviceaccounts
   - Select your project
   - Create or select a service account
   - Click "Keys" → "Add Key" → "Create new key" → JSON

2. Save the file to a secure location:
   ```bash
   mv ~/Downloads/service-account-key.json ~/openflow/keys/
   ```

3. Update your environment variable:
   ```bash
   # In ~/.zshrc or ~/.bashrc
   export GOOGLE_APPLICATION_CREDENTIALS="$HOME/openflow/keys/service-account-key.json"
   ```

4. Add to `.gitignore`:
   ```bash
   echo "keys/" >> .gitignore
   ```

### Option 3: Use Firebase Emulator (Recommended for Pure Local Dev)

1. Install Firebase CLI (if not already installed):
   ```bash
   npm install -g firebase-tools
   ```

2. Initialize Firebase emulators:
   ```bash
   firebase init emulators
   # Select: Firestore, Pub/Sub
   ```

3. Start emulator:
   ```bash
   npm run dev:emulator
   ```

4. In another terminal, start your app with emulator:
   ```bash
   npm run dev:local
   ```

This runs the app without needing any GCP credentials!

---

## Current Behavior (Development Mode)

With the fixes in place:

✅ **Chat page loads** even without valid Firestore credentials  
✅ **No crashes** when Firestore is unavailable  
⚠️ **Warning messages** logged to console:
```
⚠️ Firestore query failed in development mode. Returning empty array.
To use Firestore locally:
1. Set GOOGLE_APPLICATION_CREDENTIALS to a valid service account key
2. Or run Firebase emulator: npm run dev:emulator
```

✅ **Empty conversation list** - no errors  
✅ **Can send messages** - stored in memory only (not persisted)

---

## Production Behavior

In production, Firestore errors will **still throw** and be properly logged to error reporting. The graceful handling only applies in development mode (`import.meta.env.DEV`).

---

## Verification

To verify your setup is working:

1. **Check no errors on page load**:
   ```bash
   curl -I http://localhost:3000/chat
   # Should return: 200 OK
   ```

2. **Check console output**:
   - ✅ Good: `🔥 Firestore initialized successfully`
   - ⚠️ Warning: `⚠️ Firestore not available in development mode`

3. **Test chat interface**:
   - Navigate to: http://localhost:3000/chat
   - Interface should load without errors
   - Conversation list may be empty (expected without Firestore)

---

## Related Files

- `src/lib/firestore.ts` - Main Firestore integration with dev mode error handling
- `src/pages/api/conversations/index.ts` - Conversations API endpoint
- `firebase.json` - Firebase emulator configuration

---

## Environment Variables Reference

```bash
# Required for production
GOOGLE_CLOUD_PROJECT=your-project-id

# Optional for development (choose one)
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json  # Real Firestore
FIRESTORE_EMULATOR_HOST=localhost:8080                        # Firebase Emulator
# OR: Don't set either - use in-memory storage (chat won't persist)
```

---

**Last Updated**: October 11, 2025  
**Issue**: Invalid GOOGLE_APPLICATION_CREDENTIALS causing Firestore errors  
**Status**: ✅ Fixed with graceful error handling in development mode

