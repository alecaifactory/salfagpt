/**
 * Version and Deployment Information
 * 
 * Provides runtime access to deployment metadata:
 * - Environment (localhost/qa/production)
 * - Version number
 * - Git branch and commit
 * - Deploy timestamp
 * - GCP project
 * 
 * Used by VersionInfo component and admin dashboards
 */

export interface DeploymentInfo {
  environment: 'localhost' | 'qa' | 'production' | 'unknown';
  version: string;
  branch: string;
  commit: string;
  deployedAt: string;
  projectId: string;
  serviceName?: string;
}

/**
 * Detect current environment from various signals
 */
function detectEnvironment(): DeploymentInfo['environment'] {
  // Priority 1: Explicit ENVIRONMENT_NAME
  const envName = process.env.ENVIRONMENT_NAME?.toLowerCase();
  if (envName === 'qa' || envName === 'staging') return 'qa';
  if (envName === 'production' || envName === 'prod') return 'production';
  if (envName === 'local' || envName === 'localhost') return 'localhost';
  
  // Priority 2: Cloud Run service name (K_SERVICE)
  const serviceName = process.env.K_SERVICE || '';
  if (serviceName.includes('qa') || serviceName.includes('staging')) return 'qa';
  if (serviceName.includes('prod')) return 'production';
  
  // Priority 3: NODE_ENV
  if (process.env.NODE_ENV === 'development') return 'localhost';
  
  // Priority 4: Browser detection (client-side only)
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') return 'localhost';
    
    const href = window.location.href;
    if (href.includes('salfagpt-qa') || href.includes('cr-salfagpt-qa')) return 'qa';
    if (href.includes('salfagpt-3snj65wckq') || href.includes('cr-salfagpt-ai-ft-prod')) return 'production';
  }
  
  // Default
  return 'unknown';
}

/**
 * Get complete deployment information
 */
export function getDeploymentInfo(): DeploymentInfo {
  const environment = detectEnvironment();
  
  return {
    environment,
    version: process.env.npm_package_version || '0.0.0',
    branch: process.env.GIT_BRANCH || 'unknown',
    commit: process.env.GIT_COMMIT || 'unknown',
    deployedAt: process.env.DEPLOY_TIME || new Date().toISOString(),
    projectId: process.env.GOOGLE_CLOUD_PROJECT || 'unknown',
    serviceName: process.env.K_SERVICE,
  };
}

/**
 * Get environment configuration
 */
export function getEnvironmentConfig() {
  const info = getDeploymentInfo();
  
  return {
    name: info.environment,
    isProduction: info.environment === 'production',
    isQA: info.environment === 'qa',
    isLocal: info.environment === 'localhost',
    projectId: info.projectId,
    displayName: info.environment.toUpperCase(),
  };
}

/**
 * Expose deployment info to browser console (non-sensitive only)
 */
if (typeof window !== 'undefined') {
  (window as any).__DEPLOYMENT_INFO__ = getDeploymentInfo();
  console.log('📦 Deployment Info:', (window as any).__DEPLOYMENT_INFO__);
}

