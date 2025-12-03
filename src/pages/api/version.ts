/**
 * API: Get Server Version
 * GET /api/version
 * 
 * Returns current deployment version for client-side version checking
 * Used to detect when new production version is deployed
 */

import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  // Get version from package.json or environment
  const version = process.env.npm_package_version || '0.1.0';
  const commit = process.env.GIT_COMMIT || 'unknown';
  const deployedAt = process.env.DEPLOY_TIME || new Date().toISOString();
  const environment = process.env.ENVIRONMENT_NAME || 'localhost';
  
  return new Response(JSON.stringify({
    version,
    commit: commit.substring(0, 7), // Short commit hash
    deployedAt,
    environment,
    // Unique identifier for this deployment
    buildId: `${version}-${commit.substring(0, 7)}`,
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate', // Never cache version endpoint
    }
  });
};

