import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import type { APIContext } from 'astro';

// Use process.env for runtime secrets (works with Secret Manager)
// Fallback to import.meta.env for local development
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || import.meta.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || import.meta.env.GOOGLE_CLIENT_SECRET;
const JWT_SECRET = process.env.JWT_SECRET || import.meta.env.JWT_SECRET;
const BASE_URL = process.env.PUBLIC_BASE_URL || import.meta.env.PUBLIC_BASE_URL || 'http://localhost:3000';

// Initialize OAuth2 client
export const oauth2Client = new OAuth2Client(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  `${BASE_URL}/auth/callback`
);

// Generate authorization URL
export function getAuthorizationUrl(): string {
  const scopes = [
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
  ];

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent',
  });
}

// Exchange authorization code for tokens
export async function exchangeCodeForTokens(code: string) {
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);
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
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '24h',
  });
}

// JWT token verification
export function verifyJWT(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// Get session from request
export function getSession(context: APIContext) {
  const sessionCookie = context.cookies.get('salfagpt_session');
  
  if (!sessionCookie) {
    return null;
  }
  
  const session = verifyJWT(sessionCookie.value);
  return session;
}

// Set session cookie
export function setSession(context: APIContext, userData: any) {
  const token = generateJWT(userData);
  
  context.cookies.set('salfagpt_session', token, {
    httpOnly: true,
    secure: import.meta.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 86400, // 24 hours
    path: '/',
  });
}

// Clear session
export function clearSession(context: APIContext) {
  context.cookies.delete('salfagpt_session', {
    path: '/',
  });
}

// Middleware to protect routes
export function requireAuth(context: APIContext) {
  const session = getSession(context);
  
  if (!session) {
    return context.redirect('/');
  }
  
  return session;
}

