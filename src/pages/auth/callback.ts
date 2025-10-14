import type { APIRoute } from 'astro';
import { exchangeCodeForTokens, getUserInfo, setSession } from '../../lib/auth';
import { insertUserSession } from '../../lib/gcp';
import { upsertUserOnLogin } from '../../lib/firestore';

export const GET: APIRoute = async ({ url, cookies, redirect }) => {
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');

  // Handle OAuth errors
  if (error) {
    console.error('OAuth error:', error);
    return redirect('/?error=auth_failed');
  }

  if (!code) {
    return redirect('/?error=no_code');
  }

  try {
    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code);
    
    if (!tokens.access_token) {
      throw new Error('No access token received');
    }

    // Get user information
    const userInfo = await getUserInfo(tokens.access_token);

    // Prepare user data for session
    const userData = {
      id: userInfo.id,
      email: userInfo.email,
      name: userInfo.name,
      picture: userInfo.picture,
      verified_email: userInfo.verified_email,
    };

    // Set session cookie
    setSession({ cookies } as any, userData);
    
    // Create/update user in Firestore on login
    try {
      await upsertUserOnLogin(userData.email, userData.name);
      console.log('✅ User created/updated in Firestore:', userData.email);
    } catch (userError) {
      console.error('Failed to upsert user in Firestore:', userError);
      // Continue anyway - don't block user login
    }

    // Log session to BigQuery (optional, can be async)
    try {
      await insertUserSession(userData.id, {
        email: userData.email,
        login_time: new Date().toISOString(),
      });
    } catch (dbError) {
      console.error('Failed to log session to BigQuery:', dbError);
      // Continue anyway - don't block user login
    }

    // Get the original redirect destination or default to /chat
    const redirectTo = cookies.get('auth_redirect')?.value || '/chat';
    
    // Clear the redirect cookie
    cookies.delete('auth_redirect', { path: '/' });
    
    // Redirect to the original destination
    return redirect(redirectTo);
  } catch (error) {
    console.error('Authentication error:', error);
    return redirect('/?error=auth_processing_failed');
  }
};

