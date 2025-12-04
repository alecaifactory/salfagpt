/**
 * API: Get Server Version
 * GET /api/version
 * 
 * Returns current deployment version for client-side version checking
 * Now includes canary status for progressive rollout
 */

import type { APIRoute } from 'astro';
import { getSession } from '../../lib/auth';
import { isCanaryUser } from '../../lib/canary';

export const GET: APIRoute = async ({ cookies }) => {
  // Get version from package.json or environment
  const version = process.env.npm_package_version || '0.1.0';
  const commit = process.env.GIT_COMMIT || 'unknown';
  const deployedAt = process.env.DEPLOY_TIME || new Date().toISOString();
  const environment = process.env.ENVIRONMENT_NAME || 'localhost';
  
  // Check if user should see canary version
  const session = getSession({ cookies } as any);
  const userEmail = session?.email || 'anonymous';
  
  let canaryInfo;
  try {
    canaryInfo = await isCanaryUser(userEmail);
  } catch (error) {
    console.error('Error checking canary status:', error);
    canaryInfo = { isCanary: false, revision: 'stable', version: 'stable', rolloutPercentage: 0 };
  }
  
  return new Response(JSON.stringify({
    version,
    commit: commit.substring(0, 7), // Short commit hash
    deployedAt,
    environment,
    // Unique identifier for this deployment
    buildId: `${version}-${commit.substring(0, 7)}`,
    // Canary information
    isCanary: canaryInfo.isCanary,
    canaryRevision: canaryInfo.revision,
    rolloutPercentage: canaryInfo.rolloutPercentage,
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate', // Never cache version endpoint
    }
  });
};

