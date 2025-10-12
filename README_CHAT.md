# Flow Chat Interface

A comprehensive ChatGPT-like interface powered by Google's Gemini 2.5-pro, built with Astro, React, and Google Cloud Firestore.

## 🚀 Features

### Core Functionality
- ✅ **ChatGPT-like Interface** - Modern, responsive chat UI
- ✅ **Conversation Management** - Create, organize, and search conversations
- ✅ **Time-Based Grouping** - Auto-organize by Today, Yesterday, Last Week, etc.
- ✅ **Folder Organization** - Create folders to organize related conversations
- ✅ **Auto-Generated Titles** - Conversations get descriptive titles based on content
- ✅ **Real-Time Updates** - Instant message synchronization

### AI Capabilities
- ✅ **Gemini 2.5-pro Integration** - State-of-the-art AI responses
- ✅ **1M Token Context Window** - Extensive conversation memory
- ✅ **Multi-Modal Support** - Text, code, images (future), audio (future)
- ✅ **Code Generation** - Syntax-highlighted code blocks
- ✅ **Conversation Memory** - Full history maintained across sessions

### Context Management
- ✅ **Context Window Display** - See % of context used in real-time
- ✅ **5-Section Breakdown** - Detailed view of what's in the context:
  - System Instructions
  - Conversation History
  - User Context
  - Current Message
  - Model Response
- ✅ **Token Tracking** - Track token usage per section
- ✅ **User Context** - Add files, URLs, notes for persistent context

### UI/UX
- ✅ **Responsive Design** - Works on desktop, tablet, mobile
- ✅ **Modern Aesthetics** - Clean, minimalist interface
- ✅ **Smooth Animations** - Polished user experience
- ✅ **Keyboard Shortcuts** - Enter to send, Shift+Enter for new line
- ✅ **Loading States** - Clear feedback during AI generation

## 🏗️ Architecture

### Technology Stack

**Frontend:**
- Astro 5.14.1 - Modern web framework
- React 18.3.1 - UI components
- TailwindCSS 3.4.17 - Styling
- Lucide React - Beautiful icons

**Backend:**
- Node.js - Server runtime
- Astro API Routes - Serverless functions
- Google Cloud Firestore - Real-time database
- Google Gemini 2.5-pro - AI model

**Infrastructure:**
- Google Cloud Platform - Hosting & services
- OAuth 2.0 - Authentication
- JWT - Session management

### Database Schema

#### Collections

1. **conversations**
   - Stores conversation metadata
   - Indexed by userId + lastMessageAt
   - Includes title, folder, timestamps, context usage

2. **messages**
   - Stores individual messages
   - Indexed by conversationId + timestamp
   - Supports multi-modal content

3. **folders**
   - User-created organization folders
   - Auto-counts conversations

4. **user_context**
   - Persistent user-added context
   - Files, URLs, notes, documents

### API Endpoints

```
GET    /api/conversations              - List user conversations
POST   /api/conversations              - Create new conversation
GET    /api/conversations/:id/messages - Get conversation messages
POST   /api/conversations/:id/messages - Send message & get AI response
GET    /api/conversations/:id/context  - Get context window info
```

### Component Structure

```
ChatInterface (Main Component)
├── Left Sidebar
│   ├── New Conversation Button
│   └── Conversation List
│       ├── Time Groups (Today, Yesterday, etc.)
│       └── Folder Groups
├── Main Chat Area
│   ├── Message List
│   │   ├── User Messages
│   │   └── Assistant Messages
│   │       ├── Text Content
│   │       ├── Code Blocks
│   │       └── Mixed Content
│   └── Loading Indicator
└── Input Area
    ├── Context Window Display
    │   └── Context Detail Modal
    │       └── Expandable Sections
    ├── Add Context Button
    ├── Message Input (Textarea)
    └── Send Button
```

## 📦 Installation

### Prerequisites

```bash
# Required
- Node.js 18+
- npm or yarn
- Google Cloud Project
- Firestore enabled
- Google AI API access

# Optional
- Docker (for containerized deployment)
```

### Quick Start

1. **Clone and Install**
```bash
git clone <repository>
cd flow
npm install
```

2. **Configure Environment**
```bash
cp .env.example .env
# Edit .env with your credentials
```

3. **Set Up Google Cloud**
```bash
# Enable Firestore
gcloud firestore databases create --location=us-central1

# Enable Google AI API
gcloud services enable generativelanguage.googleapis.com
```

4. **Run Development Server**
```bash
npm run dev
# Server runs on http://localhost:3000
```

5. **Access Chat**
```
http://localhost:3000/auth/login  (authenticate first)
http://localhost:3000/chat        (then access chat)
```

## 🔧 Configuration

### Environment Variables

```env
# Google Cloud
GOOGLE_CLOUD_PROJECT=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json

# Authentication
GOOGLE_CLIENT_ID=your-oauth-client-id
GOOGLE_CLIENT_SECRET=your-oauth-client-secret
JWT_SECRET=your-jwt-secret

# AI APIs
GOOGLE_AI_API_KEY=your-gemini-api-key
ANTHROPIC_API_KEY_CAP001_CURSOR=your-anthropic-key

# OAuth
OAUTH_REDIRECT_URI=http://localhost:3000/auth/callback
```

### Customization

**Change AI Model:**
```typescript
// src/lib/gemini.ts
const MODEL_NAME = 'gemini-2.5-pro-latest'; // Change this
```

**Adjust Context Window:**
```typescript
// src/lib/gemini.ts
const CONTEXT_WINDOW = 1000000; // Adjust this
```

**Modify UI Colors:**
```typescript
// src/components/ChatInterface.tsx
// Update Tailwind classes
```

## 📊 Usage Examples

### Basic Chat

```typescript
// User sends message
POST /api/conversations/conv-123/messages
{
  "userId": "user-456",
  "message": "What is quantum computing?"
}

// System responds with AI-generated answer
{
  "message": {
    "role": "assistant",
    "content": {
      "type": "text",
      "text": "Quantum computing is..."
    }
  },
  "contextUsage": 5.2,
  "contextSections": [...]
}
```

### Code Generation

```
User: "Write a Python function to sort a list"
