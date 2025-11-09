import type { APIRoute } from 'astro';
import { exchangeCodeForTokens, getUserInfo, setSession } from '../../lib/auth';
import { insertUserSession } from '../../lib/gcp';
import { upsertUserOnLogin } from '../../lib/firestore';
import { isUserDomainEnabled, getDomainFromEmail } from '../../lib/domains';

export const GET: APIRoute = async ({ url, cookies, redirect, request }) => {
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');

  // 🔒 Security logging: OAuth callback received
  console.log('🔐 OAuth callback received:', {
    hasCode: !!code,
    hasError: !!error,
    timestamp: new Date().toISOString(),
    origin: request.headers.get('origin'),
  });

  // Handle OAuth errors
  if (error) {
    console.error('❌ OAuth error from Google:', error);
    console.warn('🚨 Failed login attempt:', {
      error,
      timestamp: new Date().toISOString(),
    });
    return redirect('/?error=auth_failed');
  }

  if (!code) {
    console.error('❌ No authorization code received');
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

    // 🔒 Security: Validate user info
    if (!userInfo.email || !userInfo.verified_email) {
      console.error('❌ Unverified email or missing email:', userInfo.email);
      throw new Error('Email verification required');
    }

    // 🔒 CRITICAL Security: Check if user's domain is enabled
    const userDomain = getDomainFromEmail(userInfo.email);
    const isDomainEnabled = await isUserDomainEnabled(userInfo.email);
    
    if (!isDomainEnabled) {
      console.warn('🚨 Login attempt from disabled domain:', {
        email: userInfo.email,
        domain: userDomain,
        timestamp: new Date().toISOString(),
      });
      
      // Redirect to login with specific error message
      return redirect(`/auth/login?error=domain_disabled&domain=${encodeURIComponent(userDomain)}`);
    }

    console.log('✅ Domain access verified:', {
      email: userInfo.email,
      domain: userDomain,
      enabled: true,
    });

    // Create/update user in Firestore - handles both OAuth-first and admin-created users
    // ✅ If user doesn't exist: Creates with default role, no agents
    // ✅ If user exists (admin-created): Updates login timestamp, preserves roles/permissions
    let firestoreUser;
    try {
      firestoreUser = await upsertUserOnLogin(userInfo.email, userInfo.name, userInfo.id);
      console.log('✅ User created/updated in Firestore:', userInfo.email);
    } catch (userError) {
      console.error('⚠️ Failed to upsert user in Firestore:', userError);
      // Continue anyway - don't block user login
      firestoreUser = null;
    }

    // Prepare user data for session - INCLUDE ROLE from Firestore
    // ✅ CRITICAL: Use hash-based ID from Firestore (consistent with all data relationships)
    // This eliminates ID type mismatches and enables direct comparisons throughout the platform
    const userData = {
      id: firestoreUser?.id || userInfo.id, // Hash-based ID from Firestore (usr_xxx) - fallback to numeric if Firestore failed
      googleUserId: userInfo.id, // Store Google OAuth numeric ID for reference
      email: userInfo.email,
      name: userInfo.name,
      picture: userInfo.picture,
      verified_email: userInfo.verified_email,
      role: firestoreUser?.role || 'user', // ✅ CRITICAL: Include role in JWT
      roles: firestoreUser?.roles || ['user'], // ✅ CRITICAL: Include roles in JWT
      domain: getDomainFromEmail(userInfo.email), // Add domain for quick organizational access
    };

    // 🔒 Security logging: Successful authentication
    console.log('✅ User authenticated:', {
      userId: userData.id.substring(0, 8) + '...',
      email: userData.email,
      role: userData.role,
      roles: userData.roles,
      verified: userData.verified_email,
      timestamp: new Date().toISOString(),
    });

    // Set session cookie with role included
    setSession({ cookies } as any, userData);

    // Log session to BigQuery (optional, can be async)
    try {
      await insertUserSession(userData.id, {
        email: userData.email,
        login_time: new Date().toISOString(),
      });
    } catch (dbError) {
      console.error('⚠️ Failed to log session to BigQuery:', dbError);
      // Continue anyway - don't block user login
    }

    // Get the original redirect destination or default to /chat
    const redirectTo = cookies.get('auth_redirect')?.value || '/chat';
    
    // Clear the redirect cookie
    cookies.delete('auth_redirect', { path: '/' });
    
    console.log('🔐 Redirecting authenticated user to:', redirectTo);
    
    // Redirect to the original destination
    return redirect(redirectTo);
  } catch (error) {
    console.error('❌ Authentication processing error:', error);
    console.error('🚨 Failed to complete authentication:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
    return redirect('/?error=auth_processing_failed');
  }
};

