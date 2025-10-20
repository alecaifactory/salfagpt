# SalfaGPT CLI - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Organize Your Documents

Create folders for your agent documents:

```bash
mkdir -p contextos/pdf/agentes/M001
```

Place your documents there:
```
contextos/pdf/agentes/M001/
├── manual-producto.pdf
├── politicas-atencion.pdf
└── faq-cliente.pdf
```

### Step 2: Run the CLI

```bash
npx salfagpt upload contextos/pdf/agentes/M001
```

**Output:**
```
🚀 SalfaGPT CLI - Document Upload Tool
==================================================

📁 Scanning folder: contextos/pdf/agentes/M001

✅ Found 3 document(s) to process:
   - manual-producto.pdf
   - politicas-atencion.pdf
   - faq-cliente.pdf

📄 Processing: manual-producto.pdf
   Size: 1.24 MB
   ✅ Ready for upload (v0.1: simulation)

...

==================================================
📊 Upload Summary:
   Total: 3
   Success: 3
   Failed: 0

✅ Upload process complete!

📝 Log appended to: salfagpt-cli-log.md
```

### Step 3: Review the Log

```bash
cat salfagpt-cli-log.md
```

---

## 📖 Available Commands (v0.1.0)

### Upload Documents

```bash
npx salfagpt upload <folder-path>
```

**Examples:**
```bash
# Relative path
npx salfagpt upload contextos/pdf/agentes/M001

# Absolute path
npx salfagpt upload /Users/alec/salfagpt/contextos/pdf/agentes/M001
```

### Get Help

```bash
npx salfagpt help
```

---

## 🔮 Coming Soon

### v0.2.0 - Real Upload & Extraction

```bash
# Upload to GCP Storage + extract with Gemini AI
npx salfagpt upload contextos/pdf/agentes/M001 \
  --user user-123 \
  --agent agent-M001 \
  --model flash
```

**Will:**
- Upload files to GCP Storage
- Extract text using Gemini 2.5 Flash
- Save to Firestore
- Make documents available in webapp

### v0.3.0 - Semantic Search

```bash
# Search documents
npx salfagpt search "política de devoluciones" --agent M001

# Manage index
npx salfagpt index rebuild --agent M001
```

### v0.4.0 - Git Automation

```bash
# Auto-commit after upload
npx salfagpt upload contextos/pdf/agentes/M001 \
  --commit "Add M001 training docs" \
  --push
```

---

## 🛠️ Development Setup

### For Contributors

```bash
# 1. Clone repository
git clone https://github.com/org/salfagpt.git
cd salfagpt

# 2. Install dependencies
npm install

# 3. Build CLI
npm run build:cli

# 4. Test locally
npx tsx cli/index.ts help

# 5. Make changes
# Edit cli/index.ts or cli/commands/

# 6. Test your changes
npx tsx cli/index.ts upload test-folder

# 7. Run type check
npm run type-check
```

---

## 🐛 Troubleshooting

### CLI Not Found

**Error:**
```
command not found: salfagpt
```

**Solution:**
```bash
# Use npx to run without installation
npx salfagpt help

# Or install globally
npm install -g salfagpt
```

### Folder Not Found

**Error:**
```
❌ Error: Folder does not exist: contextos/pdf/agentes/M001
```

**Solution:**
```bash
# Create the folder
mkdir -p contextos/pdf/agentes/M001

# Verify it exists
ls -la contextos/pdf/agentes/M001

# Add documents and retry
```

### No Documents Found

**Warning:**
```
⚠️  No documents found in folder
```

**Cause:** Folder is empty or contains unsupported file types.

**Solution:**
```bash
# Check folder contents
ls contextos/pdf/agentes/M001

# Supported formats:
# - PDF (.pdf)
# - Word (.docx, .doc)
# - Excel (.xlsx, .xls)
# - CSV (.csv)

# Add supported documents and retry
```

---

## 📚 Additional Resources

- **Full Roadmap:** `docs/features/salfagpt-cli-roadmap.md`
- **Development Rules:** `.cursor/rules/cli-sdk-development.mdc`
- **API Reference:** `docs/cli/API_REFERENCE.md` (coming in v0.2)
- **Examples:** `docs/cli/EXAMPLES.md` (coming in v0.2)

---

## 💬 Support

**Issues:** Open a GitHub issue  
**Questions:** Contact developers  
**Contributing:** See `CONTRIBUTING.md`

---

**Last Updated:** 2025-10-19  
**Current Version:** v0.1.0  
**Next Release:** v0.2.0 (estimated 2025-10-26)

