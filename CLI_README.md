# 🛠️ SalfaGPT CLI - Developer Tool for Context Management

**Version:** 0.2.0  
**Status:** ✅ Upload & Extraction Working  
**Next:** v0.3.0 - Vector Embeddings & Semantic Search

---

## 🎯 What Is This?

A command-line tool that automates the document lifecycle for Flow's AI context system:

```
Local Documents → Upload → Extract → Embed → Index → Search
```

**Current Capabilities (v0.2):**
- ✅ Scan local folders for documents
- ✅ Validate file types (PDF, Word, Excel, CSV)
- ✅ Upload to GCP Cloud Storage
- ✅ Extract text with Gemini AI (Flash or Pro)
- ✅ Save to Firestore with full metadata
- ✅ Make available in webapp immediately
- ✅ Complete event tracking (user attribution)
- ✅ Detailed progress in terminal
- ✅ Cost tracking per operation
- ✅ Comprehensive logging

**Coming in v0.3:**
- Vector embeddings generation
- Semantic search capability
- RAG chunking optimization

---

## ⚡ Quick Start

### 1. Organize Documents

```bash
# Create folder for your agent
mkdir -p contextos/pdf/agentes/M001

# Add your documents
# (Place PDFs, Word docs, Excel, or CSV files here)
```

### 2. Run CLI

```bash
npx salfagpt upload contextos/pdf/agentes/M001
```

### 3. Review Log

```bash
cat salfagpt-cli-log.md
```

---

## 📚 Documentation

- **Quick Start:** `docs/cli/QUICKSTART.md`
- **Full Roadmap:** `docs/features/salfagpt-cli-roadmap.md`
- **Development Rules:** `.cursor/rules/cli-sdk-development.mdc`

---

## 🗺️ Roadmap

| Version | Features | Status | ETA |
|---------|----------|--------|-----|
| **v0.1** | Foundation + Scan | ✅ Complete | 2025-10-19 |
| **v0.2** | Upload + Extraction | 📋 Planned | 2025-10-26 |
| **v0.3** | Embeddings + Search | 📋 Planned | 2025-11-02 |
| **v0.4** | Git Automation | 📋 Planned | 2025-11-09 |
| **v0.5** | Full SDK | 📋 Planned | 2025-11-16 |

### Detailed Feature List

**v0.2.0 - Upload & Extraction:**
- Upload to GCP Storage
- Extract with Gemini 2.5 Flash/Pro
- Save to Firestore `context_sources`
- Progress tracking
- Error recovery

**v0.3.0 - Vector Embeddings:**
- Intelligent document chunking
- Generate embeddings
- Vector storage (BigQuery)
- Semantic search API
- Relevance ranking

**v0.4.0 - Automation:**
- Auto-commit to git
- Batch folder processing
- Watch mode (monitor folders)
- Webhook notifications
- Configuration file

**v0.5.0 - Full SDK:**
- TypeScript SDK for programmatic use
- NPM package published
- Complete API documentation
- Example projects
- Enterprise features

---

## 🔧 Commands (v0.1)

### Upload Documents

```bash
npx salfagpt upload <folder-path>
```

**Supported Formats:**
- PDF (`.pdf`)
- Word (`.docx`, `.doc`)
- Excel (`.xlsx`, `.xls`)
- CSV (`.csv`)

**Example:**
```bash
npx salfagpt upload contextos/pdf/agentes/M001
```

### Get Help

```bash
npx salfagpt help
```

---

## 🏗️ Architecture

### Current (v0.1)

```
CLI Tool
  ↓
Folder Scanner → File Validator → Logger
                      ↓
                 Terminal Output
```

### Future (v0.2+)

```
CLI Tool
  ↓
Scanner → Validator → Uploader → Extractor → Indexer
    ↓         ↓          ↓          ↓          ↓
  Files    GCP      Gemini AI  Firestore  BigQuery
                  Storage                 (v0.3)
```

---

## 💻 Development

### Build CLI

```bash
npm run build:cli
```

### Test Locally

```bash
node dist/cli/index.js help
node dist/cli/index.js upload contextos/pdf/agentes/M001
```

### Type Check

```bash
npm run type-check
```

---

## 📊 Use Cases

### 1. Bulk Document Upload

**Problem:** Need to upload 50 PDFs to an agent.

**Solution:**
```bash
# Put all PDFs in folder
cp *.pdf contextos/pdf/agentes/M001/

# Upload with one command
npx salfagpt upload contextos/pdf/agentes/M001
```

**Time Saved:** 25 minutes (1 min/doc manual vs 30s automated)

---

### 2. Multi-Agent Setup

**Problem:** Setting up 5 agents with different context documents.

**Solution:**
```bash
# Organize documents
mkdir -p contextos/pdf/agentes/{M001,M002,M003,M004,M005}

# Add docs to each folder
# ...

# Batch upload (v0.4)
npx salfagpt batch upload contextos/pdf/agentes/*
```

**Time Saved:** Hours vs manual webapp upload

---

### 3. CI/CD Integration

**Problem:** Auto-update agent context when docs change in git.

**Solution (v0.4):**
```yaml
# .github/workflows/update-context.yml
name: Update Agent Context
on:
  push:
    paths:
      - 'contextos/**'

jobs:
  upload:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npx salfagpt upload contextos/pdf/agentes/M001
```

**Value:** Automatic, zero-effort context updates

---

## 🔐 Security

### Environment Variables

**Required (v0.2+):**
```bash
# .env
GOOGLE_CLOUD_PROJECT=gen-lang-client-0986191192
GOOGLE_AI_API_KEY=your-api-key
```

**Never Commit:**
- ❌ `.env` file
- ❌ API keys
- ❌ User credentials
- ❌ Actual documents (use .gitignore)

### Permissions

**CLI operates as authenticated user:**
- Uses application default credentials
- Same permissions as webapp
- No elevated access

---

## 🐛 Known Limitations (v0.1)

1. **Simulated Upload** - Doesn't actually upload to GCP (coming in v0.2)
2. **No Extraction** - Doesn't extract text (coming in v0.2)
3. **No Search** - Semantic search not available (coming in v0.3)
4. **No Git Integration** - Manual git operations (coming in v0.4)

---

## 💬 Feedback & Support

**Found a bug?** Open a GitHub issue  
**Have a feature request?** Check roadmap first, then create issue  
**Need help?** Read `docs/cli/QUICKSTART.md`

---

## 📜 License

MIT License - See `LICENSE` file

---

## 👥 Contributors

- **Alec** - Initial development and architecture
- *Your name here* - Contributions welcome!

---

## 🙏 Acknowledgments

Built on top of:
- Astro 5.1.x
- Google Cloud Platform
- Gemini AI 2.5
- TypeScript 5.7

---

**Last Updated:** 2025-10-19  
**Current Version:** 0.1.0  
**Maintained By:** GetAI Factory

---

## 🚀 Get Started Now

```bash
# 1. Create folder
mkdir -p contextos/pdf/agentes/M001

# 2. Add documents
# (Copy your PDFs here)

# 3. Run CLI
npx salfagpt upload contextos/pdf/agentes/M001

# 4. Check log
cat salfagpt-cli-log.md
```

**Next:** Read `docs/cli/QUICKSTART.md` for detailed guide

