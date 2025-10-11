# Chat Interface Setup Guide

## Prerequisites

1. **Google Cloud Project** with:
   - Firestore database enabled
   - Google AI API (Gemini) enabled
   - Service account with Firestore and AI permissions

2. **Node.js** 18+ installed

3. **Environment Variables** configured (see below)

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy the example environment file and fill in your values:

```bash
cp .env.example .env
```

Required environment variables:

```env
# Google Cloud Configuration
GOOGLE_CLOUD_PROJECT=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json

# OAuth Configuration (for authentication)
GOOGLE_CLIENT_ID=your-oauth-client-id
GOOGLE_CLIENT_SECRET=your-oauth-client-secret
OAUTH_REDIRECT_URI=http://localhost:3000/auth/callback

# JWT Configuration
JWT_SECRET=your-jwt-secret-key

# API Keys
GOOGLE_AI_API_KEY=your-google-ai-api-key
ANTHROPIC_API_KEY_CAP001_CURSOR=your-anthropic-api-key

# Firestore Configuration
FIRESTORE_DATABASE_ID=(default)  # Optional, uses default database

# Environment
NODE_ENV=development
```

### 3. Set Up Google Cloud Services

#### Enable Firestore
```bash
gcloud firestore databases create --location=us-central1
```

#### Enable Google AI API
```bash
gcloud services enable generativelanguage.googleapis.com
```

#### Create Service Account
```bash
gcloud iam service-accounts create openflow-service \
  --display-name="OpenFlow Service Account"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:openflow-service@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/datastore.user"

gcloud iam service-accounts keys create service-account-key.json \
  --iam-account=openflow-service@YOUR_PROJECT_ID.iam.gserviceaccount.com
```

#### Get Google AI API Key
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy it to your `.env` file as `GOOGLE_AI_API_KEY`

### 4. Initialize Firestore Collections

The Firestore collections will be created automatically on first use, but you can also create them manually:

```javascript
// Collections created:
// - conversations
// - messages
// - folders
// - user_context

// Indexes created automatically:
// - conversations: userId, lastMessageAt
// - messages: conversationId, timestamp
// - folders: userId, createdAt
```

### 5. Run Development Server

```bash
npm run dev
```

The server will start on `http://localhost:3000`.

### 6. Access Chat Interface

1. First, authenticate at: `http://localhost:3000/auth/login`
2. After authentication, navigate to: `http://localhost:3000/chat`
3. Start chatting!

## Features

### Chat Interface Features

- **Conversation Management**
  - Create new conversations
  - Auto-generated titles based on first message
  - Group conversations by time (Today, Yesterday, etc.)
  - Organize conversations in folders

- **Message Interaction**
  - Send text messages
  - Receive AI responses from Gemini 2.5-pro
  - Multi-modal content display (text, code, images, etc.)
  - Real-time message updates

- **Context Window Management**
  - View context window usage percentage
  - Expand to see detailed breakdown:
    - System instructions
    - Conversation history
    - User-added context
    - Current message
    - Model response
  - Each section shows token count

- **Multi-Modal Support**
  - Text messages
  - Code blocks with syntax highlighting
  - Images (coming soon)
  - Audio/Video (coming soon)

### AI Capabilities

Using **Gemini 2.5-pro** with:
- 1,000,000 token context window
- Multi-modal understanding
- Code generation and analysis
- Conversation memory
- Streaming responses (coming soon)

## API Endpoints

### Conversations

#### List Conversations
```http
GET /api/conversations?userId=USER_ID&folderId=FOLDER_ID
```

Response:
```json
{
  "groups": [
    {
      "label": "Today",
      "conversations": [...]
    }
  ]
}
```

#### Create Conversation
```http
POST /api/conversations
Content-Type: application/json

{
  "userId": "user-123",
  "title": "New Chat",
  "folderId": "folder-456"
}
```

#### Get Messages
```http
GET /api/conversations/CONVERSATION_ID/messages
```

#### Send Message
```http
POST /api/conversations/CONVERSATION_ID/messages
Content-Type: application/json

{
  "userId": "user-123",
  "message": "Hello, how are you?"
}
```

#### Get Context Window Info
```http
GET /api/conversations/CONVERSATION_ID/context?userId=USER_ID
```

## Database Schema

### Conversations Collection
```typescript
{
  id: string;
  userId: string;
  title: string;
  folderId?: string;
  createdAt: Date;
  updatedAt: Date;
  lastMessageAt: Date;
  messageCount: number;
  contextWindowUsage: number; // 0-100
  agentModel: string; // "gemini-2.5-pro"
}
```

### Messages Collection
```typescript
{
  id: string;
  conversationId: string;
  userId: string;
  role: 'user' | 'assistant' | 'system';
  content: MessageContent;
  timestamp: Date;
  tokenCount: number;
  contextSections?: ContextSection[];
}
```

### Folders Collection
```typescript
{
  id: string;
  userId: string;
  name: string;
  createdAt: Date;
  conversationCount: number;
}
```

### User Context Collection
```typescript
{
  userId: string;
  contextItems: ContextItem[];
  totalTokens: number;
  updatedAt: Date;
}
```

## Troubleshooting

### Issue: "Failed to generate AI response"

**Solution:**
- Check that `GOOGLE_AI_API_KEY` is set correctly
- Verify the API key is valid and has Gemini access
- Check API quota limits

### Issue: "Firestore permission denied"

**Solution:**
- Verify service account has `roles/datastore.user` role
- Check that `GOOGLE_APPLICATION_CREDENTIALS` points to valid key file
- Ensure Firestore is enabled in your project

### Issue: "Authentication failed"

**Solution:**
- Configure OAuth credentials in Google Cloud Console
- Update `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
- Set correct `OAUTH_REDIRECT_URI`

### Issue: "Context window too large"

**Solution:**
- The system automatically tracks context usage
- If reaching limits, older messages will need to be pruned
- Consider reducing user context items

## Development

### Project Structure

```
openflow/
├── src/
│   ├── components/
│   │   └── ChatInterface.tsx        # Main chat UI component
│   ├── lib/
│   │   ├── firestore.ts            # Firestore database operations
│   │   ├── gemini.ts               # Gemini AI integration
│   │   └── auth.ts                 # Authentication utilities
│   ├── pages/
│   │   ├── chat.astro              # Chat page
│   │   └── api/
│   │       └── conversations/      # API endpoints
│   └── styles/
│       └── global.css              # Global styles
├── docs/
│   ├── CHAT_ARCHITECTURE.md        # Architecture documentation
│   └── CHAT_SETUP.md              # This file
└── package.json
```

### Running Tests

```bash
# Run unit tests (when available)
npm test

# Run type checking
npm run build
```

### Building for Production

```bash
# Build the project
npm run build

# Preview production build
npm run preview
```

## Deployment

### Deploy to Google Cloud Run

1. **Build Docker image:**
```bash
npm run deploy:build
```

2. **Deploy to Cloud Run:**
```bash
npm run deploy:run
```

3. **Set environment variables in Cloud Run:**
```bash
gcloud run services update openflow \
  --set-env-vars="GOOGLE_CLOUD_PROJECT=your-project-id" \
  --set-env-vars="GOOGLE_AI_API_KEY=your-api-key" \
  --set-env-vars="JWT_SECRET=your-jwt-secret"
```

### Deploy to Other Platforms

The application can be deployed to any Node.js hosting platform:
- Vercel
- Netlify
- Railway
- Render
- AWS (ECS, Lambda)
- Azure (App Service)

Just ensure all environment variables are configured.

## Security Best Practices

1. **Never commit `.env` file** - Keep it in `.gitignore`
2. **Rotate API keys regularly** - Update in environment
3. **Use strong JWT secrets** - Generate with `openssl rand -hex 32`
4. **Enable Firestore security rules** - Restrict access by user
5. **Use HTTPS in production** - Enable SSL/TLS
6. **Rate limit API endpoints** - Prevent abuse
7. **Validate user input** - Sanitize all inputs
8. **Monitor API usage** - Track costs and quotas

## Cost Optimization

### Gemini API Costs
- Gemini 2.5-pro: ~$0.00125/1K input tokens, ~$0.005/1K output tokens
- Monitor usage in Google Cloud Console
- Set budget alerts

### Firestore Costs
- Document reads: $0.06 per 100K
- Document writes: $0.18 per 100K
- Storage: $0.18/GB/month

### Optimization Tips
1. Cache frequent queries
2. Batch write operations
3. Limit conversation history length
4. Prune old messages
5. Use pagination for message loading

## Support

For issues or questions:
1. Check the [Architecture Documentation](./CHAT_ARCHITECTURE.md)
2. Review [Astro Documentation](https://docs.astro.build)
3. Check [Gemini AI Documentation](https://ai.google.dev/docs)
4. Review [Firestore Documentation](https://firebase.google.com/docs/firestore)

## Next Steps

After setup:
1. ✅ Test basic chat functionality
2. ✅ Verify context window tracking
3. ✅ Test multi-modal content display
4. 🔄 Add real-time streaming
5. 🔄 Implement image upload
6. 🔄 Add voice input
7. 🔄 Create conversation export
8. 🔄 Add search functionality

---

**Last Updated**: January 9, 2025  
**Version**: 1.0.0

