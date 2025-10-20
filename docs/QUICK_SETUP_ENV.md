# Quick Setup Guide - Environment Files

## 🎯 Port Configuration Summary

| Tenant | .env File | Port | OAuth |
|--------|-----------|------|-------|
| **AI Factory** | `.env` | **3000** | ✅ Configured |
| **Salfacorp** | `.env.salfacorp` | **3001** | ✅ Configured |

## 📝 Setup Instructions

### AI Factory (.env)

Add this line to your `.env` file:
```bash
DEV_PORT=3000
PUBLIC_BASE_URL=http://localhost:3000
```

### Salfacorp (.env.salfacorp)

Add this line to your `.env.salfacorp` file:
```bash
DEV_PORT=3001
PUBLIC_BASE_URL=http://localhost:3001
```

## 🚀 How It Works

The `astro.config.mjs` now reads the port from environment:
```javascript
server: {
  port: parseInt(process.env.DEV_PORT || '3000', 10)
}
```

**Default:** If `DEV_PORT` is not set, uses **3000** (AI Factory)

## 🔄 Switching Between Tenants

### Option 1: Copy the .env file (Recommended)
```bash
# For AI Factory
cp .env .env.backup && npm run dev
# → Runs on http://localhost:3000

# For Salfacorp
cp .env.salfacorp .env && npm run dev  
# → Runs on http://localhost:3001
```

### Option 2: Use env vars directly
```bash
# For Salfacorp
export $(cat .env.salfacorp | xargs) && npm run dev
# → Runs on http://localhost:3001
```

## ✅ Verification

After starting the dev server:
```bash
# Check which port is being used
lsof -i :3000  # AI Factory
lsof -i :3001  # Salfacorp

# Or check the startup message
npm run dev
# Should show: "Local: http://localhost:3000" or "http://localhost:3001"
```

## 🔐 Security Checklist

- [x] `.env` files in `.gitignore` ✅
- [x] Both `.env` files exist locally (not committed) ✅
- [x] `.env.example` created (safe to commit) ✅
- [x] All credentials rotated ✅
- [x] Git history cleaned ✅

## 📋 Required Variables in Each .env

Make sure BOTH `.env` and `.env.salfacorp` have these variables:

### Common (Required in Both):
```bash
GOOGLE_CLOUD_PROJECT=
GOOGLE_AI_API_KEY=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
JWT_SECRET=
DEV_PORT=              # 3000 for AI Factory, 3001 for Salfacorp
PUBLIC_BASE_URL=       # Must match DEV_PORT
SESSION_COOKIE_NAME=
NODE_ENV=development
```

### Salfacorp Specific (in .env.salfacorp only):
```bash
# RAG/Embeddings
CHUNK_SIZE=8000
CHUNK_OVERLAP=2000
EMBEDDING_BATCH_SIZE=32
TOP_K=5
EMBEDDING_MODEL=gemini-embedding-001
```

## 🚨 Common Issues

### Issue: Wrong port is being used
**Solution:** Check that DEV_PORT is set correctly in your active .env file

### Issue: OAuth fails on Salfacorp
**Expected:** Port 3001 doesn't have OAuth configured - use port for development only, OAuth testing on AI Factory (port 3000)

### Issue: Port already in use
```bash
# Kill process on port
kill -9 $(lsof -t -i:3000)  # AI Factory
kill -9 $(lsof -t -i:3001)  # Salfacorp
```

---

**Quick Reference:**
- AI Factory: `.env` → Port 3000 → OAuth ✅
- Salfacorp: `.env.salfacorp` → Port 3001 → Development

