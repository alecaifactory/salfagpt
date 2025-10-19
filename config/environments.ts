/**
 * Multi-Environment Configuration for Flow
 * Supports: local, staging-internal, staging-client, production-client
 * 
 * BACKWARD COMPATIBLE: Existing setup (local) works exactly as before
 * NEW: Support for staging and production client deployments
 */

export type Environment = 
  | 'local' 
  | 'staging-internal'
  | 'staging-client'
  | 'production-client';

export interface EnvironmentConfig {
  name: Environment;
  displayName: string;
  projectId: string;
  region: string;
  serviceName: string;
  baseUrl: string;
  
  // OAuth configuration
  oauth: {
    clientId: string;
    redirectUri: string;
  };
  
  // Firestore configuration
  firestore: {
    projectId: string;
    locationId: string;
    databaseId: string;
  };
  
  // Cloud Run configuration
  cloudRun: {
    minInstances: number;
    maxInstances: number;
    memory: string;
    cpu: number;
    timeout: number;
  };
  
  // Feature flags
  features: {
    analytics: boolean;
    debugging: boolean;
    rateLimiting: boolean;
  };
}

const ENVIRONMENTS: Record<Environment, EnvironmentConfig> = {
  'local': {
    name: 'local',
    displayName: 'Local Development',
    projectId: 'gen-lang-client-0986191192',
    region: 'us-central1',
    serviceName: 'local-dev',
    baseUrl: process.env.PUBLIC_BASE_URL || 'http://localhost:3000',
    
    oauth: {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      redirectUri: 'http://localhost:3000/auth/callback',
    },
    
    firestore: {
      projectId: 'gen-lang-client-0986191192',
      locationId: 'us-central1',
      databaseId: '(default)',
    },
    
    cloudRun: {
      minInstances: 0,
      maxInstances: 1,
      memory: '512Mi',
      cpu: 1,
      timeout: 60,
    },
    
    features: {
      analytics: false,
      debugging: true,
      rateLimiting: false,
    },
  },
  
  'staging-internal': {
    name: 'staging-internal',
    displayName: 'Staging Internal (GetAI Factory)',
    projectId: 'gen-lang-client-0986191192',
    region: 'us-central1',
    serviceName: 'flow-staging-internal',
    baseUrl: process.env.PUBLIC_BASE_URL || 'https://flow-staging-internal-xxx.run.app',
    
    oauth: {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      redirectUri: (process.env.PUBLIC_BASE_URL || 'https://flow-staging-internal-xxx.run.app') + '/auth/callback',
    },
    
    firestore: {
      projectId: 'gen-lang-client-0986191192',
      locationId: 'us-central1',
      databaseId: '(default)',
    },
    
    cloudRun: {
      minInstances: 0,
      maxInstances: 5,
      memory: '512Mi',
      cpu: 1,
      timeout: 60,
    },
    
    features: {
      analytics: true,
      debugging: true,
      rateLimiting: false,
    },
  },
  
  'staging-client': {
    name: 'staging-client',
    displayName: 'Client Staging (UAT)',
    projectId: process.env.GOOGLE_CLOUD_PROJECT || '[CLIENT-STAGING-PROJECT-ID]',
    region: process.env.REGION || 'us-central1',
    serviceName: 'flow-staging',
    baseUrl: process.env.PUBLIC_BASE_URL || 'https://staging.client-domain.com',
    
    oauth: {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      redirectUri: (process.env.PUBLIC_BASE_URL || 'https://staging.client-domain.com') + '/auth/callback',
    },
    
    firestore: {
      projectId: process.env.GOOGLE_CLOUD_PROJECT || '[CLIENT-STAGING-PROJECT-ID]',
      locationId: process.env.REGION || 'us-central1',
      databaseId: '(default)',
    },
    
    cloudRun: {
      minInstances: 1,
      maxInstances: 10,
      memory: '1Gi',
      cpu: 2,
      timeout: 120,
    },
    
    features: {
      analytics: true,
      debugging: true,
      rateLimiting: true,
    },
  },
  
  'production-client': {
    name: 'production-client',
    displayName: 'Client Production (Live)',
    projectId: process.env.GOOGLE_CLOUD_PROJECT || '[CLIENT-PRODUCTION-PROJECT-ID]',
    region: process.env.REGION || 'us-central1',
    serviceName: 'flow-production',
    baseUrl: process.env.PUBLIC_BASE_URL || 'https://flow.client-domain.com',
    
    oauth: {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      redirectUri: (process.env.PUBLIC_BASE_URL || 'https://flow.client-domain.com') + '/auth/callback',
    },
    
    firestore: {
      projectId: process.env.GOOGLE_CLOUD_PROJECT || '[CLIENT-PRODUCTION-PROJECT-ID]',
      locationId: process.env.REGION || 'us-central1',
      databaseId: '(default)',
    },
    
    cloudRun: {
      minInstances: 2,
      maxInstances: 50,
      memory: '2Gi',
      cpu: 4,
      timeout: 300,
    },
    
    features: {
      analytics: true,
      debugging: false,
      rateLimiting: true,
    },
  },
};

/**
 * Get current environment from environment variables
 * BACKWARD COMPATIBLE: Defaults to 'local' if not specified
 */
export function getCurrentEnvironment(): Environment {
  const envName = process.env.ENVIRONMENT_NAME as Environment;
  
  if (envName && ENVIRONMENTS[envName]) {
    return envName;
  }
  
  // Backward compatible fallback logic
  if (process.env.NODE_ENV === 'development') return 'local';
  
  // Detect from Cloud Run service name (K_SERVICE env var)
  if (process.env.K_SERVICE) {
    if (process.env.K_SERVICE.includes('staging-internal')) return 'staging-internal';
    if (process.env.K_SERVICE.includes('staging')) return 'staging-client';
    if (process.env.K_SERVICE.includes('production')) return 'production-client';
  }
  
  // Default to local (backward compatible)
  return 'local';
}

/**
 * Get configuration for current environment
 */
export function getEnvironmentConfig(): EnvironmentConfig {
  const env = getCurrentEnvironment();
  const config = ENVIRONMENTS[env];
  
  console.log(`🌍 Environment: ${config.displayName}`);
  console.log(`📦 Project: ${config.projectId}`);
  
  return config;
}

/**
 * Check if current environment is production
 */
export function isProduction(): boolean {
  return getCurrentEnvironment() === 'production-client';
}

/**
 * Check if current environment is staging
 */
export function isStaging(): boolean {
  const env = getCurrentEnvironment();
  return env === 'staging-internal' || env === 'staging-client';
}

/**
 * Check if current environment is local
 */
export function isLocal(): boolean {
  return getCurrentEnvironment() === 'local';
}

// Export singleton config (BACKWARD COMPATIBLE)
export const ENV_CONFIG = getEnvironmentConfig();







