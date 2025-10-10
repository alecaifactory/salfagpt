import type { APIRoute } from 'astro';
import { getAuthorizationUrl } from '../../lib/auth';

export const GET: APIRoute = async ({ redirect, url, cookies }) => {
  try {
    // Store the redirect URL from the query parameter
    const redirectTo = url.searchParams.get('redirect') || '/chat';
    
    // Store in a cookie so we can retrieve it after OAuth callback
    cookies.set('auth_redirect', redirectTo, {
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 600, // 10 minutes
    });
    
    const authUrl = getAuthorizationUrl();
    return redirect(authUrl);
  } catch (error) {
    console.error('Error generating auth URL:', error);
    return new Response('Authentication error', { status: 500 });
  }
};

