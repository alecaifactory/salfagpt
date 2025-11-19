# Bulk Upload System Documentation

## 📚 Documentation Index

This folder contains complete documentation for the SalfaGPT Bulk Upload System.

---

## 🚀 Quick Start

**Upload 2 test documents to a new agent**:

```bash
# 1. Edit the script to configure your agent name
# 2. Run the test upload
npx tsx scripts/test-new-agent-upload.ts
```

That's it! The system will:
- Find your agent by name
- Get the correct document ID
- Fix any missing fields
- Upload 2 PDFs from your folder
- Process with RAG (chunking + embeddings)
- Assign to the agent
- Verify everything works

---

## 📖 Documentation Files

### For First-Time Users
**Start here** → [`BULK_UPLOAD_CONDITIONS.md`](./BULK_UPLOAD_CONDITIONS.md)
- Simple checklist format
- All required conditions
- Pre-flight validation steps
- Common issues & fixes
- Quick troubleshooting

### For Regular Users
**Interactive guide** → [`CLI_BULK_UPLOAD_SYSTEM.mdc`](./CLI_BULK_UPLOAD_SYSTEM.mdc)
- Visual, web-friendly format
- Step-by-step workflows
- Code examples with tabs
- Interactive checklists
- Diagrams and charts

### For Technical Users
**Complete reference** → [`CLI_BULK_UPLOAD_SYSTEM.md`](./CLI_BULK_UPLOAD_SYSTEM.md)
- Full technical documentation (5,500+ words)
- Architecture & data flow
- API reference
- Configuration options
- Best practices
- Security guidelines

### Project Summary
**Implementation summary** → [`../BULK_UPLOAD_COMPLETE.md`](../BULK_UPLOAD_COMPLETE.md)
- What was built
- Test results
- Key achievements
- Future roadmap
- Success criteria

---

## 🎯 Common Tasks

### Upload Documents to New Agent

```bash
# Edit config in the script first, then:
npx tsx scripts/test-new-agent-upload.ts
```

### Check Agent Structure

```bash
npx tsx scripts/list-all-user-agents.ts
npx tsx scripts/compare-agents.ts
```

### Fix Agent Issues

```bash
# Fix missing fields
npx tsx scripts/fix-test-agent-structure.ts

# Sync document context
npx tsx scripts/fix-agent-context.ts
```

### Get Your User ID

```bash
npx tsx scripts/get-hash-id.ts your-email@company.com
```

### Verify Upload Success

```bash
# Check embeddings were created
npx tsx scripts/check-embeddings-simple.ts

# Verify agent sync
npx tsx scripts/verify-agent-sync.ts
```

---

## 🆘 Troubleshooting

### Documents Don't Appear in UI

**Most common issue!** The agent's `activeContextSourceIds` is out of sync.

**Fix**:
```bash
npx tsx scripts/fix-agent-context.ts
```

Then refresh your browser.

### Agent Not Found

**Issue**: Script says "Agent not found"

**Fix**: 
1. List all agents: `npx tsx scripts/list-all-user-agents.ts`
2. Check the exact name spelling
3. Create agent if needed: `npx tsx scripts/create-test-agent.ts`

### Wrong User ID

**Issue**: Documents upload but don't appear

**Cause**: Using Google ID instead of hash ID

**Fix**: Get your hash ID and re-upload
```bash
npx tsx scripts/get-hash-id.ts your-email@company.com
```

---

## 📊 System Requirements

### Must Have
- ✅ Node.js v18+
- ✅ Google Cloud authenticated: `gcloud auth application-default login`
- ✅ Valid Gemini API key in `.env`
- ✅ Agent exists with all required fields
- ✅ User hash ID (format: `usr_xxxxx`)

### File Requirements
- ✅ PDF files only (currently)
- ✅ Max 50 MB per file (recommended)
- ✅ Files must be readable (not corrupted)
- ✅ Folder path must be valid

---

## 🔑 Key Concepts

### Agent Name vs Agent ID

**Important**: Agent names are for display, document IDs are for storage.

```typescript
// ❌ WRONG: Assume name = ID
const agentId = 'TestApiUpload_S001';

// ✅ CORRECT: Find by name, get ID
const agent = await findAgentByName('TestApiUpload_S001');
const agentId = agent.id; // 'rzEqb17ZwSjk99bZHbTv'
```

The system handles this automatically!

### Hash ID vs Google ID

**Primary identifier**: Hash ID (e.g., `usr_uhwqffaqag1wrryd82tw`)

**Optional reference**: Google OAuth ID (e.g., `114671162830729001607`)

Always use the hash ID for uploads!

### activeContextSourceIds

This field in the agent document **must** contain all document IDs for them to appear in the UI.

The system syncs this automatically, but if documents don't appear, run:
```bash
npx tsx scripts/fix-agent-context.ts
```

---

## 💰 Costs

### Typical Costs
- Small PDF (5 pages): ~$0.002
- Medium PDF (25 pages): ~$0.015
- Large PDF (100 pages): ~$0.10
- Batch of 100 docs: ~$2-10

### Cost Breakdown
- **Gemini Extraction**: ~85% of cost
- **Embeddings**: ~10% of cost
- **Storage**: ~5% of cost

---

## 🎓 Best Practices

1. **Test First**: Always upload 1-2 files before bulk processing
2. **Use Tags**: Tag each batch for easy tracking
3. **Organize Files**: Keep related documents in subfolders
4. **Check Agent**: Verify agent structure before uploading
5. **Verify After**: Always check documents appear in UI

---

## 🔮 Future Features

Coming soon:
- 📋 CLI with command-line arguments
- 📋 NPX package (no install needed)
- 📋 REST API endpoints
- 📋 MCP Server for AI assistants
- 📋 Web-based upload dashboard

---

## 📞 Need Help?

1. **Check documentation**: Start with `BULK_UPLOAD_CONDITIONS.md`
2. **Run diagnostics**: Use the provided scripts
3. **Check Firestore**: Verify data in Firebase console
4. **Review logs**: Console output shows detailed errors
5. **Contact support**: If all else fails

---

## 📁 File Structure

```
salfagpt/
├── docs/
│   ├── README_BULK_UPLOAD.md          # This file
│   ├── BULK_UPLOAD_CONDITIONS.md      # Checklist
│   ├── CLI_BULK_UPLOAD_SYSTEM.md      # Full docs
│   └── CLI_BULK_UPLOAD_SYSTEM.mdc     # Interactive guide
├── scripts/
│   ├── test-new-agent-upload.ts       # Main upload script
│   ├── create-test-agent.ts           # Create agent
│   ├── fix-agent-context.ts           # Fix sync issues
│   └── [20+ diagnostic scripts]
├── cli/
│   ├── lib/
│   │   ├── storage.ts                 # GCS upload
│   │   ├── extraction.ts              # Gemini AI
│   │   └── embeddings.ts              # RAG processing
│   └── commands/
│       └── upload.ts                  # CLI command (future)
└── BULK_UPLOAD_COMPLETE.md            # Implementation summary
```

---

## ✅ Quick Validation Checklist

Before uploading, verify:
- [ ] Agent exists (run `list-all-user-agents.ts`)
- [ ] Agent has all required fields (run `compare-agents.ts`)
- [ ] You have your hash ID (run `get-hash-id.ts`)
- [ ] Files are valid PDFs
- [ ] Folder path is correct
- [ ] Google Cloud is authenticated
- [ ] `.env` file is configured

After uploading, verify:
- [ ] Console shows success messages
- [ ] No errors in output
- [ ] Documents in Firestore (`context_sources`)
- [ ] Embeddings created (`document_chunks`)
- [ ] activeContextSourceIds synced (run `verify-agent-sync.ts`)
- [ ] Documents visible in UI (refresh browser)

---

## 🎯 Success Criteria

Upload is successful when:
- ✅ Files uploaded to Google Cloud Storage
- ✅ Content extracted with Gemini AI
- ✅ Documents saved to Firestore
- ✅ RAG chunks and embeddings created
- ✅ Documents assigned to correct agent
- ✅ activeContextSourceIds synced
- ✅ **Documents appear in UI**
- ✅ Documents are searchable in chat

---

**Documentation Version**: 1.0.0  
**Last Updated**: November 19, 2025  
**Status**: ✅ Production Ready

---

**Ready to get started?** → [`BULK_UPLOAD_CONDITIONS.md`](./BULK_UPLOAD_CONDITIONS.md)

