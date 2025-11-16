/**
 * Configuration and Credential Management
 * 
 * Stores credentials in: ~/.flow/credentials.json
 * With secure permissions (600)
 */

import fs from 'fs';
import path from 'path';
import os from 'os';

const FLOW_DIR = path.join(os.homedir(), '.flow');
const CREDENTIALS_FILE = path.join(FLOW_DIR, 'credentials.json');

export interface FlowCredentials {
  apiKey: string;
  organizationId: string;
  organizationName: string;
  domain: string;
  tier: string;
  createdAt: string;
}

export interface FlowConfig {
  apiUrl: string;
  authUrl: string;
}

/**
 * Get Flow configuration
 */
export function getConfig(): FlowConfig {
  const isProduction = process.env.FLOW_ENV === 'production';
  
  return {
    apiUrl: isProduction 
      ? 'https://api.flow.ai' 
      : 'http://localhost:3000',
    authUrl: isProduction
      ? 'https://flow.ai'
      : 'http://localhost:3000',
  };
}

/**
 * Check if credentials exist
 */
export function hasCredentials(): boolean {
  return fs.existsSync(CREDENTIALS_FILE);
}

/**
 * Load saved credentials
 */
export function loadCredentials(): FlowCredentials | null {
  try {
    if (!hasCredentials()) {
      return null;
    }
    
    const data = fs.readFileSync(CREDENTIALS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading credentials:', error);
    return null;
  }
}

/**
 * Save credentials securely
 */
export function saveCredentials(credentials: FlowCredentials): void {
  try {
    // Create .flow directory if it doesn't exist
    if (!fs.existsSync(FLOW_DIR)) {
      fs.mkdirSync(FLOW_DIR, { mode: 0o700 }); // rwx------
    }
    
    // Save credentials
    fs.writeFileSync(
      CREDENTIALS_FILE,
      JSON.stringify(credentials, null, 2),
      { mode: 0o600 } // rw-------
    );
    
    console.log('✅ Credentials saved securely');
  } catch (error) {
    console.error('Error saving credentials:', error);
    throw error;
  }
}

/**
 * Clear credentials
 */
export function clearCredentials(): void {
  try {
    if (fs.existsSync(CREDENTIALS_FILE)) {
      fs.unlinkSync(CREDENTIALS_FILE);
    }
  } catch (error) {
    console.error('Error clearing credentials:', error);
  }
}

/**
 * Require authentication (throw if not authenticated)
 */
export function requireAuth(): FlowCredentials {
  const credentials = loadCredentials();
  
  if (!credentials) {
    throw new Error(
      'Not authenticated. Run: flow-cli login <invitation-code>'
    );
  }
  
  return credentials;
}

