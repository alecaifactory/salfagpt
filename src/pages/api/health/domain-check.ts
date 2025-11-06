import type { APIRoute } from 'astro';
import { getDomain, getDomainFromEmail } from '../../../lib/domains';

/**
 * Health check endpoint for domain verification
 * Tests if domains can be accessed from Firestore
 */
export const GET: APIRoute = async ({ url }) => {
  const email = url.searchParams.get('email') || 'test@getaifactory.com';
  const domainId = getDomainFromEmail(email);
  
  const checks: any = {
    environment: {
      project: process.env.GOOGLE_CLOUD_PROJECT || 'NOT SET',
      nodeEnv: process.env.NODE_ENV || 'NOT SET',
      baseUrl: process.env.PUBLIC_BASE_URL || 'NOT SET',
    },
    domain: {
      email,
      extracted: domainId,
    },
  };

  // Try to get the domain from Firestore
  try {
    const domain = await getDomain(domainId);
    
    checks.domain.exists = domain !== null;
    checks.domain.enabled = domain?.enabled || false;
    checks.domain.data = domain;
    checks.status = domain && domain.enabled ? 'PASS' : 'FAIL';
    checks.message = domain 
      ? (domain.enabled ? 'Domain is enabled ✅' : 'Domain is disabled ❌')
      : 'Domain not found in Firestore ❌';
    
  } catch (error) {
    checks.status = 'ERROR';
    checks.error = {
      message: error instanceof Error ? error.message : 'Unknown error',
      type: error.constructor.name,
    };
  }

  return new Response(
    JSON.stringify(checks, null, 2),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
    }
  );
};


