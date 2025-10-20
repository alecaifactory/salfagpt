# Contextos - Document Management

This folder contains documents that will be processed and uploaded to Flow's context system.

## Folder Structure

```
contextos/
├── pdf/
│   ├── agentes/
│   │   ├── M001/          # Agent M001 documents
│   │   ├── M002/          # Agent M002 documents
│   │   └── .../           # More agents
│   └── general/           # General PDFs
├── csv/
│   └── data/              # CSV data files
├── excel/
│   └── reports/           # Excel reports
└── word/
    └── docs/              # Word documents
```

## Usage

### Manual Upload (via CLI)

```bash
# Upload documents from a folder
npx salfagpt upload /contextos/pdf/agentes/M001

# Or from project root
npx salfagpt upload contextos/pdf/agentes/M001
```

### Automated Processing

The CLI tool will:
1. Scan the folder for documents
2. Upload to GCP Storage
3. Extract text using Gemini multimodal
4. Generate embeddings (future)
5. Store vectors for semantic search (future)
6. Log all operations
7. Git commit changes (optional)

## Document Organization Guidelines

### By Agent
Store agent-specific documents in `agentes/[AGENT_ID]/`

**Example:**
```
contextos/pdf/agentes/M001/
├── manual-producto.pdf
├── politicas-atencion.pdf
└── faq-cliente.pdf
```

### By Category
Or organize by document type/category:

```
contextos/pdf/general/
├── policies/
├── manuals/
└── faqs/
```

## Status

**Current Version:** v0.1.0 (Simple upload)  
**Status:** 🔨 In Development

### Roadmap

- [x] Folder structure created
- [ ] CLI tool v1 (upload + extraction)
- [ ] Vector embeddings generation
- [ ] Semantic search indexing
- [ ] Git automation
- [ ] Full logging system

See `docs/features/salfagpt-cli-roadmap.md` for complete roadmap.

---

**Last Updated:** 2025-10-19  
**Version:** 0.1.0

