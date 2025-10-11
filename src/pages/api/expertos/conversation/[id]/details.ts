import type { APIRoute } from 'astro';
import { verifyAccess, createAccessDeniedResponse, createUnauthorizedResponse, UserRole } from '../../../../../lib/access-control';

export const GET: APIRoute = async ({ params, request }) => {
  // Verify Expert access or higher
  const userAccess = await verifyAccess(request, UserRole.EXPERT);
  
  if (!userAccess) {
    return createUnauthorizedResponse();
  }
  
  // Check if user has at least Expert role
  const allowedRoles = [UserRole.EXPERT, UserRole.ADMIN, UserRole.SUPERADMIN];
  if (!allowedRoles.includes(userAccess.role)) {
    return createAccessDeniedResponse('Expert access required');
  }

  const { id } = params;
  
  if (!id) {
    return new Response(
      JSON.stringify({
        error: 'Bad Request',
        message: 'Conversation ID is required',
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    // Mock conversation details
    // In production, this would query Firestore for the conversation and messages
    const conversation = {
      id,
      userId: 'user-001',
      userHash: 'user_a1b2c3',
      model: 'gemini-2.5-pro',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      status: 'pending',
      type: 'support',
      title: 'How to set up authentication?',
      systemInstruction: 'You are a helpful assistant specialized in technical support.',
      config: {
        temperature: 0.7,
        maxTokens: 8192,
      },
    };

    const messages = [
      {
        id: 'msg-001',
        role: 'user',
        content: 'Hi, I need help setting up Google OAuth 2.0 authentication in my application. Can you guide me through the process?',
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        tokenCount: 28,
      },
      {
        id: 'msg-002',
        role: 'assistant',
        content: "I'd be happy to help you set up Google OAuth 2.0 authentication! Let me guide you through the process step by step.\n\nFirst, you'll need to:\n\n1. Create a project in Google Cloud Console\n2. Enable the Google OAuth 2.0 API\n3. Create credentials (Client ID and Client Secret)\n4. Configure authorized redirect URIs\n\nWhich framework or platform are you using for your application?",
        timestamp: new Date(Date.now() - 86400000 + 60000).toISOString(),
        tokenCount: 89,
      },
      {
        id: 'msg-003',
        role: 'user',
        content: "I'm using Next.js 15 with Astro. I want to protect certain routes and allow users to sign in with their Google accounts.",
        timestamp: new Date(Date.now() - 86400000 + 120000).toISOString(),
        tokenCount: 32,
      },
      {
        id: 'msg-004',
        role: 'assistant',
        content: "Perfect! For Next.js 15 with Astro, here's a comprehensive setup guide:\n\n**Step 1: Install Dependencies**\n```bash\nnpm install googleapis jsonwebtoken cookie\n```\n\n**Step 2: Create OAuth credentials**\n- Go to Google Cloud Console\n- Navigate to APIs & Services > Credentials\n- Create OAuth 2.0 Client ID\n- Add authorized redirect URIs:\n  - http://localhost:3000/auth/callback (development)\n  - https://yourdomain.com/auth/callback (production)\n\n**Step 3: Set up environment variables**\n```env\nOAUTH_CLIENT_ID=your_client_id\nOAUTH_CLIENT_SECRET=your_client_secret\nOAUTH_REDIRECT_URI=http://localhost:3000/auth/callback\nJWT_SECRET=your_secure_random_string\n```\n\nWould you like me to show you the code for the authentication endpoints?",
        timestamp: new Date(Date.now() - 86400000 + 180000).toISOString(),
        tokenCount: 187,
      },
      {
        id: 'msg-005',
        role: 'user',
        content: 'Yes please! Show me the authentication endpoints code.',
        timestamp: new Date(Date.now() - 86400000 + 240000).toISOString(),
        tokenCount: 12,
      },
      {
        id: 'msg-006',
        role: 'assistant',
        content: "Here's the complete authentication flow:\n\n**1. Login Endpoint** (`src/pages/auth/login.ts`):\n```typescript\nimport type { APIRoute } from 'astro';\nimport { google } from 'googleapis';\n\nexport const GET: APIRoute = async ({ redirect, url }) => {\n  const oauth2Client = new google.auth.OAuth2(\n    process.env.OAUTH_CLIENT_ID,\n    process.env.OAUTH_CLIENT_SECRET,\n    process.env.OAUTH_REDIRECT_URI\n  );\n\n  const redirectParam = url.searchParams.get('redirect');\n  if (redirectParam) {\n    // Store redirect destination\n    // ...\n  }\n\n  const authUrl = oauth2Client.generateAuthUrl({\n    access_type: 'offline',\n    scope: ['email', 'profile'],\n  });\n\n  return redirect(authUrl);\n};\n```\n\nThis creates the OAuth URL and redirects the user to Google's login page. Once they authenticate, Google will redirect back to your callback URL.\n\nWould you like to see the callback endpoint next?",
        timestamp: new Date(Date.now() - 86400000 + 300000).toISOString(),
        tokenCount: 198,
      },
    ];

    // Mock existing evaluation (if any)
    const evaluation = id === 'conv-002' ? {
      id: 'eval-001',
      conversationId: id,
      expertId: 'expert-001',
      evaluatedAt: new Date().toISOString(),
      scores: {
        accuracy: 5,
        helpfulness: 4,
        coherence: 5,
        safety: 5,
        efficiency: 4,
        overall: 4.6,
      },
      feedback: 'Excellent technical guidance with clear step-by-step instructions. Code examples are helpful and correct.',
      issues: [],
      severity: 'low',
      flags: [],
      suggestions: 'Could include more error handling examples.',
    } : null;

    return new Response(
      JSON.stringify({
        conversation,
        messages,
        evaluation,
        messageCount: messages.length,
        totalTokens: messages.reduce((sum, m) => sum + (m.tokenCount || 0), 0),
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching conversation details:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal Server Error',
        message: 'Failed to fetch conversation details',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

