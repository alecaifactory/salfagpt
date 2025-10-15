import type { APIRoute } from 'astro';
import { clearSession, getSession } from '../../lib/auth';

export const GET: APIRoute = async (context) => {
  // 🔒 Security logging: Get user info before logout
  const session = getSession(context);
  
  if (session) {
    console.log('🔐 User logout:', {
      userId: session.id?.substring(0, 8) + '...',
      email: session.email,
      timestamp: new Date().toISOString(),
    });
  } else {
    console.log('ℹ️ Logout attempt without active session');
  }
  
  // Clear session
  clearSession(context);
  
  console.log('✅ Session cleared, redirecting to home');
  
  return context.redirect('/?logout=success');
};

export const POST: APIRoute = async (context) => {
  // 🔒 Security logging: Get user info before logout
  const session = getSession(context);
  
  if (session) {
    console.log('🔐 User logout (API):', {
      userId: session.id?.substring(0, 8) + '...',
      email: session.email,
      timestamp: new Date().toISOString(),
    });
  }
  
  // Clear session
  clearSession(context);
  
  console.log('✅ Session cleared (API)');
  
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

