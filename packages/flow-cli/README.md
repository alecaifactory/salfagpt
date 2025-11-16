# Flow CLI - Vision API Command Line Interface

Beautiful, simple, powerful document extraction from your terminal.

## Installation

```bash
npm install -g @flow/cli
```

## Quick Start

### 1. Login with Invitation Code

```bash
flow-cli login FLOW-ENT-202511-ABC123
```

Browser opens → Login with Google → Use business email → Done! ✨

### 2. Extract Your First Document

```bash
flow-cli extract requirements.pdf
```

That's it! Document extracted in seconds.

## Commands

### `login [invitation-code]`

Authenticate with Flow API.

```bash
flow-cli login FLOW-YOUR-CODE-HERE
```

### `extract <file> [options]`

Extract text and data from documents.

```bash
# Basic extraction
flow-cli extract document.pdf

# Use Pro model for better accuracy
flow-cli extract document.pdf --model pro

# Save to file
flow-cli extract document.pdf -o output.txt

# JSON output
flow-cli extract document.pdf --json
```

**Supported formats:** PDF, Excel, Word, CSV

### `whoami`

Show your current organization.

```bash
flow-cli whoami
```

### `status`

Check your usage and quota.

```bash
flow-cli status
```

### `logout`

Clear your credentials.

```bash
flow-cli logout
```

## Features

✨ **Beautiful UI** - Colors, emojis, progress indicators  
🔐 **Secure** - OAuth authentication, encrypted storage  
⚡ **Fast** - Optimized for speed and efficiency  
📊 **Transparent** - See usage, quotas, costs in real-time  
🎯 **Simple** - One command to extract any document  
💡 **Helpful** - Clear errors, actionable suggestions

## Example Session

```bash
$ flow-cli login FLOW-ENT-202511-ABC123

┌──────────────────────────────────────┐
│  🔐 Flow API Authentication          │
└──────────────────────────────────────┘

📱 Opening browser for Google OAuth...
✓ Authentication successful

┌──────────────────────────────────────┐
│  ✓ Welcome to Flow API!              │
│                                      │
│  Organization: YourCompany-API       │
│  Domain: yourcompany.com             │
│  Tier: PRO                           │
│                                      │
│  Next steps:                         │
│  • Extract: flow-cli extract doc.pdf│
│  • Status: flow-cli status           │
└──────────────────────────────────────┘

$ flow-cli extract requirements.pdf

📄 Document Extraction

File: requirements.pdf
Size: 1.21 MB
Model: Gemini 2.5 Flash

✓ Document extracted successfully

┌──────────────────────────────────────┐
│  ✓ Extraction Complete               │
│                                      │
│  File: requirements.pdf              │
│  Pages: 15                           │
│  Tokens: 12,450                      │
│  Cost: $0.0034                       │
│  Time: 2.3s                          │
└──────────────────────────────────────┘

💡 Tip: Save to file with:
   flow-cli extract requirements.pdf -o output.txt
```

## Support

- **Documentation:** https://api.flow.ai/docs
- **Email:** api-support@flow.ai
- **Issues:** https://github.com/flow/cli/issues

## License

MIT © Flow by AI Factory
