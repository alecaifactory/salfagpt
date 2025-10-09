import type { APIRoute } from 'astro';
import { getAuthorizationUrl } from '../../lib/auth';

export const GET: APIRoute = async ({ redirect }) => {
  try {
    const authUrl = getAuthorizationUrl();
    return redirect(authUrl);
  } catch (error) {
    console.error('Error generating auth URL:', error);
    return new Response('Authentication error', { status: 500 });
  }
};

