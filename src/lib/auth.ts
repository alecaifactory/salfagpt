import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import type { APIContext } from 'astro';

// BACKWARD COMPATIBLE: Environment-aware OAuth configuration
// Supports multi-tenant deployments with separate OAuth clients per environment

// Try to load environment config (if available)
let ENV_CONFIG: any = null;
try {
  const envModule = await import('../../config/environments.js').catch(() => null);
  if (envModule) {
    ENV_CONFIG = envModule.ENV_CONFIG;
  }
} catch (error) {
  // Fallback to original behavior
  console.log('📝 Using legacy OAuth configuration (backward compatible)');
}

// Determine OAuth credentials (BACKWARD COMPATIBLE)
// Priority: process.env > environment config > import.meta.env
// This ensures .env files loaded by astro.config.mjs are used
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID 
  || ENV_CONFIG?.oauth?.clientId 
  || import.meta.env.GOOGLE_CLIENT_ID;

const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET 
  || import.meta.env.GOOGLE_CLIENT_SECRET;

const JWT_SECRET = process.env.JWT_SECRET 
  || import.meta.env.JWT_SECRET;

// CRITICAL FIX: Detect if we're running on localhost
// Use localhost URL when running locally, regardless of PUBLIC_BASE_URL env var
// Check DEV_PORT (set when running npm run dev) to determine if we're in local development
// In production, NODE_ENV will be 'production' and DEV_PORT will not be set
const isLocalhost = process.env.DEV_PORT === '3000';

const BASE_URL = isLocalhost
  ? 'http://localhost:3000' // Force localhost when running locally (npm run dev)
  : (process.env.PUBLIC_BASE_URL 
      || ENV_CONFIG?.baseUrl 
      || import.meta.env.PUBLIC_BASE_URL 
      || 'http://localhost:3000');

const REDIRECT_URI = `${BASE_URL}/auth/callback`;

// Lazy initialization function to ensure env vars are loaded
let _oauth2Client: OAuth2Client | null = null;

function getOAuth2Client(): OAuth2Client {
  if (_oauth2Client) {
    return _oauth2Client;
  }

  // Re-check environment variables at runtime
  const clientId = process.env.GOOGLE_CLIENT_ID 
    || ENV_CONFIG?.oauth?.clientId 
    || import.meta.env.GOOGLE_CLIENT_ID;

  const clientSecret = process.env.GOOGLE_CLIENT_SECRET 
    || import.meta.env.GOOGLE_CLIENT_SECRET;

  console.log('🔐 Initializing OAuth2 Client:');
  console.log(`  Environment: ${ENV_CONFIG?.name || 'local'}`);
  console.log(`  Is Localhost: ${isLocalhost ? 'YES ✅' : 'NO (Production)'}`);
  console.log(`  Project: ${process.env.GOOGLE_CLOUD_PROJECT || 'NOT SET'}`);
  console.log(`  Client ID: ${clientId ? '***' + clientId.slice(-10) : 'NOT SET ❌'}`);
  console.log(`  Base URL: ${BASE_URL}`);
  console.log(`  Redirect URI: ${REDIRECT_URI}`);

  if (!clientId) {
    throw new Error('GOOGLE_CLIENT_ID is not defined - check .env file');
  }

  if (!clientSecret) {
    throw new Error('GOOGLE_CLIENT_SECRET is not defined - check .env file');
  }

  _oauth2Client = new OAuth2Client(
    clientId,
    clientSecret,
    REDIRECT_URI
  );

  return _oauth2Client;
}

// Export the client (will be initialized on first use)
export const oauth2Client = new Proxy({} as OAuth2Client, {
  get(target, prop) {
    const client = getOAuth2Client();
    return (client as any)[prop];
  }
});

// Generate authorization URL
export function getAuthorizationUrl(): string {
  const scopes = [
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
  ];

  // Explicitly pass redirect_uri to avoid production issues
  const redirectUri = `${BASE_URL}/auth/callback`;
  
  // Get the OAuth client (will initialize if needed)
  const client = getOAuth2Client();
  
  console.log('🔗 Generating OAuth URL:', {
    baseUrl: BASE_URL,
    redirectUri,
  });

  return client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent',
    redirect_uri: redirectUri, // Explicitly set redirect_uri
  });
}

// Exchange authorization code for tokens
export async function exchangeCodeForTokens(code: string) {
  // CRITICAL: Must pass the same redirect_uri used in authorization request
  const redirectUri = `${BASE_URL}/auth/callback`;
  
  console.log('🔄 Exchanging code for tokens:', {
    codeLength: code.length,
    redirectUri,
  });
  
  // Get the OAuth client (will initialize if needed)
  const client = getOAuth2Client();
  
  const { tokens } = await client.getToken({
    code,
    redirect_uri: redirectUri, // Explicitly pass redirect_uri
  });
  
  client.setCredentials(tokens);
  return tokens;
}

// Get user info from Google
export async function getUserInfo(accessToken: string) {
  const response = await fetch(
    `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${accessToken}`
  );
  
  if (!response.ok) {
    throw new Error('Failed to fetch user info');
  }
  
  return await response.json();
}

// JWT token generation
export function generateJWT(payload: any): string {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET not configured');
  }
  
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '7d', // 7 days (as per privacy.mdc)
    issuer: 'flow-platform',
    audience: 'flow-users',
  });
}

// JWT token verification
export function verifyJWT(token: string): any {
  if (!JWT_SECRET) {
    console.error('❌ JWT_SECRET not configured');
    return null;
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'flow-platform',
      audience: 'flow-users',
    });
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      console.warn('⚠️ JWT token expired:', error.expiredAt);
    } else if (error instanceof jwt.JsonWebTokenError) {
      console.warn('⚠️ Invalid JWT token:', error.message);
    } else {
      console.error('❌ JWT verification error:', error);
    }
    return null;
  }
}

// Get session from request
export function getSession(context: APIContext) {
  const sessionCookie = context.cookies.get('flow_session');
  
  if (!sessionCookie) {
    return null;
  }
  
  const session = verifyJWT(sessionCookie.value);
  return session;
}

// Set session cookie
export function setSession(context: APIContext, userData: any) {
  const token = generateJWT(userData);
  
  // Check if running in production (Cloud Run sets NODE_ENV)
  const isProduction = process.env.NODE_ENV === 'production' || !import.meta.env.DEV;
  
  context.cookies.set('flow_session', token, {
    httpOnly: true, // ✅ JavaScript cannot access (XSS protection)
    secure: isProduction, // ✅ HTTPS only in production
    sameSite: 'lax', // ✅ CSRF protection
    maxAge: 604800, // 7 days (as per privacy.mdc)
    path: '/',
  });
  
  console.log('🔐 Session cookie set:', {
    secure: isProduction,
    httpOnly: true,
    maxAge: '7 days',
    timestamp: new Date().toISOString(),
  });
}

// Clear session
export function clearSession(context: APIContext) {
  context.cookies.delete('flow_session', {
    path: '/',
  });
  
  // Also clear any auth redirect cookie
  context.cookies.delete('auth_redirect', {
    path: '/',
  });
  
  console.log('🔐 Session cookies cleared');
}

// Middleware to protect routes
export function requireAuth(context: APIContext) {
  const session = getSession(context);
  
  if (!session) {
    return context.redirect('/');
  }
  
  return session;
}

