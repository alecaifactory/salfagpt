# Chat Interface Architecture

## Overview
This document describes the architecture of the Flow chat interface, which provides a ChatGPT-like experience for users to interact with AI agents powered by Google's Gemini 2.5-pro model.

## System Components

### Frontend Components

#### ChatInterface.tsx
Main React component that provides the complete chat experience:
- **Left Sidebar**: Conversation management
  - New conversation button
  - Conversations grouped by time (Today, Yesterday, Last Week, etc.)
  - Folder support for organization
- **Main Chat Area**: Message display
  - User and assistant messages
  - Multi-modal content support (text, code, images, etc.)
  - Real-time streaming support
- **Input Area**: Message composition
  - Text input with multi-line support
  - Add context button (attachments)
  - Send button
  - Context window usage display

### Backend Services

#### Firestore (`src/lib/firestore.ts`)
Database layer using Google Cloud Firestore for real-time chat data:

**Collections:**
1. **conversations**: Conversation metadata
   - `id`, `userId`, `title`, `folderId`
   - `createdAt`, `updatedAt`, `lastMessageAt`
   - `messageCount`, `contextWindowUsage`
   - `agentModel` (gemini-2.5-pro)

2. **messages**: Individual messages
   - `id`, `conversationId`, `userId`
   - `role` (user/assistant/system)
   - `content` (MessageContent object)
   - `timestamp`, `tokenCount`
   - `contextSections` (for debugging/transparency)

3. **folders**: User-created folders
   - `id`, `userId`, `name`
   - `createdAt`, `conversationCount`

4. **user_context**: User-added context items
   - `userId`, `contextItems[]`
   - `totalTokens`, `updatedAt`

**Key Functions:**
- `createConversation()`: Create new conversation
- `getConversations()`: List user conversations
- `addMessage()`: Add message to conversation
- `getMessages()`: Retrieve conversation messages
- `calculateContextWindowUsage()`: Calculate % of context window used
- `groupConversationsByTime()`: Group conversations by time period

#### Gemini AI Service (`src/lib/gemini.ts`)
AI interaction layer using Google's Gemini 2.5-pro:

**Model Configuration:**
- Model: `gemini-2.5-pro-latest`
- Context Window: 1,000,000 tokens
- Temperature: 0.7 (default)
- Max Output Tokens: 8,192 (default)

**Key Functions:**
- `generateAIResponse()`: Generate AI response with context
- `streamAIResponse()`: Stream responses in real-time
- `generateConversationTitle()`: Auto-generate conversation titles
- `analyzeImage()`: Analyze images using multimodal capabilities
- `parseResponseContent()`: Parse different content types (text, code, mixed)

**Features:**
- Multi-modal support (text, code, images)
- Code block detection and syntax highlighting
- Conversation history management
- User context integration
- Token counting and context window tracking

### API Endpoints

#### GET /api/conversations
List user's conversations grouped by time period.

**Query Parameters:**
- `userId` (required): User identifier
- `folderId` (optional): Filter by folder

**Response:**
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

#### POST /api/conversations
Create a new conversation.

**Body:**
```json
{
  "userId": "user-123",
  "title": "New Conversation",
  "folderId": "folder-456" // optional
}
```

**Response:**
```json
{
  "conversation": {
    "id": "conv-789",
    "userId": "user-123",
    "title": "New Conversation",
    ...
  }
}
```

#### GET /api/conversations/:id/messages
Get messages for a conversation.

**Response:**
```json
{
  "messages": [
    {
      "id": "msg-123",
      "role": "user",
      "content": {
        "type": "text",
        "text": "Hello!"
      },
      "timestamp": "2025-01-09T...",
      "tokenCount": 5
    }
  ]
}
```

#### POST /api/conversations/:id/messages
Send a message and get AI response.

**Body:**
```json
{
  "userId": "user-123",
  "message": "What is quantum computing?"
}
```

**Response:**
```json
{
  "message": {
    "id": "msg-456",
    "role": "assistant",
    "content": {...},
    "timestamp": "2025-01-09T...",
    "tokenCount": 150
  },
  "contextUsage": 5.2,
  "contextSections": [...]
}
```

#### GET /api/conversations/:id/context
Get context window information for a conversation.

**Query Parameters:**
- `userId` (required): User identifier

**Response:**
```json
{
  "usage": 5.2, // percentage
  "sections": [
    {
      "name": "System Instructions",
      "tokenCount": 500,
      "content": "...",
      "collapsed": true
    },
    {
      "name": "Conversation History",
      "tokenCount": 3500,
      "content": "50 messages",
      "collapsed": false
    }
  ]
}
```

## Data Flow

### New Conversation Flow
1. User clicks "New Conversation" button
2. Frontend calls `POST /api/conversations`
3. Backend creates conversation in Firestore
4. Frontend loads empty conversation view

### Message Send Flow
1. User types message and clicks send
2. Frontend adds user message to UI (optimistic update)
3. Frontend calls `POST /api/conversations/:id/messages`
4. Backend:
   - Saves user message to Firestore
   - Retrieves conversation history and user context
   - Calls Gemini AI with context
   - Saves assistant response to Firestore
   - Calculates context window usage
   - Auto-generates title (if first message)
5. Frontend receives response and updates UI
6. Context window usage is updated

### Context Window Display Flow
1. User clicks on context usage indicator
2. Frontend shows detailed breakdown modal
3. User can expand/collapse sections to see:
   - System instructions
   - Conversation history
   - User-added context
   - Current message
   - Model response
4. Each section shows token count and content

## Multi-Modal Content Support

### Text Content
Simple text messages displayed as-is.

### Code Content
Code blocks are detected using regex and displayed with:
- Syntax highlighting
- Language identifier
- Copy button (future)

### Mixed Content
Messages containing both text and code are parsed into parts:
```typescript
{
  type: "mixed",
  parts: [
    { type: "text", content: "Here's the code:" },
    { type: "code", content: { language: "python", code: "..." } }
  ]
}
```

### Image Content (Future)
Images will be:
- Uploaded to Cloud Storage
- Analyzed by Gemini's vision capabilities
- Displayed inline in messages

### Audio/Video Content (Future)
- Transcription using Google Speech-to-Text
- Display with embedded player
- Gemini analysis of content

## Context Window Management

### Context Sections
The system tracks 5 main sections that contribute to the context:

1. **System Instructions** (~500 tokens)
   - Agent configuration
   - System prompts
   - Behavior guidelines

2. **Conversation History** (variable)
   - Recent messages (up to 50)
   - Both user and assistant messages
   - Includes all message types

3. **User Context** (variable)
   - User-added files
   - URLs and documents
   - Notes and references

4. **Current User Message** (variable)
   - The message being processed

5. **Model Response** (variable)
   - Generated response tokens

### Usage Calculation
```
usage = (total_tokens / context_window) * 100
context_window = 1,000,000 tokens (Gemini 2.5-pro)
```

## Folder Organization

Users can organize conversations into folders:
- Create folder: `POST /api/folders`
- Move conversation to folder: Update `folderId` in conversation
- Delete folder: Moves conversations to root
- Folder count auto-updates when conversations added/removed

## Time-Based Grouping

Conversations are automatically grouped:
- **Today**: Same day
- **Yesterday**: Previous day
- **Last 7 Days**: Within last week
- **Last 30 Days**: Within last month
- **Older**: Everything else

Grouping is done client-side using `groupConversationsByTime()` function.

## Performance Considerations

### Firestore Queries
- Indexed on `userId` + `lastMessageAt` for fast conversation listing
- Indexed on `conversationId` + `timestamp` for fast message retrieval
- Limited to 50 recent messages per conversation

### Token Estimation
- Uses rough estimate: 4 characters ≈ 1 token
- More accurate counting can be added using Gemini's token counting API

### Real-Time Updates
- Future: Use Firestore real-time listeners for live updates
- Future: WebSocket streaming for real-time AI responses

## Security Considerations

### Authentication
- JWT-based authentication required for all endpoints
- User ID extracted from verified JWT token
- All queries filtered by `userId` to prevent unauthorized access

### Data Access
- Users can only access their own conversations
- Firestore security rules enforce user-level isolation
- API validates user ownership before operations

### API Keys
- Gemini API key stored in environment variables
- Never exposed to frontend
- All AI calls made server-side

## Future Enhancements

### Planned Features
1. **Real-time Streaming**: Stream AI responses as they generate
2. **Voice Input**: Record and transcribe voice messages
3. **Image Upload**: Upload and analyze images
4. **Code Execution**: Run code in sandboxed environment
5. **Export Conversations**: Download as PDF/Markdown
6. **Search**: Full-text search across conversations
7. **Shared Conversations**: Share conversations with other users
8. **Agent Customization**: Custom system prompts per conversation
9. **File Attachments**: Upload documents for context
10. **Message Editing**: Edit and regenerate responses

### Performance Optimizations
1. Implement message pagination
2. Add caching for frequently accessed conversations
3. Optimize context window by pruning old messages
4. Use Firestore batch operations for better performance
5. Add CDN for static assets

### UX Improvements
1. Keyboard shortcuts
2. Dark mode
3. Message reactions
4. Typing indicators
5. Read receipts (for multi-user)
6. Better code syntax highlighting
7. Markdown rendering for text
8. LaTeX math rendering

## Deployment

### Environment Variables
See `.env.example` for required configuration:
- `GOOGLE_CLOUD_PROJECT`: GCP project ID
- `GOOGLE_AI_API_KEY`: Gemini API key
- `JWT_SECRET`: Secret for JWT signing
- Additional OAuth and database configs

### Dependencies
```json
{
  "@google-cloud/firestore": "^7.10.0",
  "@google/genai": "^1.23.0",
  "astro": "^5.14.1",
  "react": "^18.3.1",
  "lucide-react": "^0.468.0"
}
```

### Deployment Steps
1. Install dependencies: `npm install`
2. Configure environment variables
3. Set up Google Cloud Firestore
4. Set up authentication (OAuth)
5. Build: `npm run build`
6. Deploy to Google Cloud Run or similar

## Monitoring

### Metrics to Track
- Conversation creation rate
- Messages per conversation
- Average response time
- Context window usage
- Error rates
- API latency
- Token usage costs

### Logging
All errors are logged with context:
- User ID
- Conversation ID
- Operation type
- Error message
- Stack trace

## Testing

### Unit Tests (Future)
- Firestore operations
- Gemini AI integration
- Token counting
- Content parsing

### Integration Tests (Future)
- End-to-end conversation flow
- Authentication
- API endpoints
- Multi-modal content

### Load Tests (Future)
- Concurrent conversation handling
- Large message history performance
- Context window limits

---

**Last Updated**: January 9, 2025
**Version**: 1.0.0
**Author**: Flow Team

