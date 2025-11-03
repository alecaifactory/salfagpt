/**
 * Flow CLI Configuration Management
 * 
 * Handles reading/writing CLI configuration securely
 */

import { homedir } from 'os';
import { join } from 'path';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import type { CLIConfig } from './types.js';

const CONFIG_DIR = join(homedir(), '.flow-cli');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');

/**
 * Default configuration
 */
const DEFAULT_CONFIG: CLIConfig = {
  apiEndpoint: 'http://localhost:3000',  // Default to localhost
  lastUpdated: new Date().toISOString(),
};

/**
 * Ensure config directory exists
 */
function ensureConfigDir(): void {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true, mode: 0o700 }); // Owner only
  }
}

/**
 * Read CLI configuration
 */
export function readConfig(): CLIConfig {
  ensureConfigDir();
  
  if (!existsSync(CONFIG_FILE)) {
    return DEFAULT_CONFIG;
  }
  
  try {
    const data = readFileSync(CONFIG_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.warn('⚠️  Failed to read config, using defaults');
    return DEFAULT_CONFIG;
  }
}

/**
 * Write CLI configuration
 */
export function writeConfig(config: CLIConfig): void {
  ensureConfigDir();
  
  const updatedConfig: CLIConfig = {
    ...config,
    lastUpdated: new Date().toISOString(),
  };
  
  writeFileSync(
    CONFIG_FILE,
    JSON.stringify(updatedConfig, null, 2),
    { encoding: 'utf-8', mode: 0o600 } // Owner read/write only
  );
}

/**
 * Get API key from config
 */
export function getAPIKey(): string | null {
  const config = readConfig();
  return config.apiKey || null;
}

/**
 * Set API key in config
 */
export function setAPIKey(apiKey: string): void {
  const config = readConfig();
  writeConfig({
    ...config,
    apiKey,
  });
}

/**
 * Get API endpoint
 */
export function getAPIEndpoint(): string {
  const config = readConfig();
  return config.apiEndpoint;
}

/**
 * Set API endpoint
 */
export function setAPIEndpoint(endpoint: string): void {
  const config = readConfig();
  writeConfig({
    ...config,
    apiEndpoint: endpoint,
  });
}

/**
 * Clear configuration (logout)
 */
export function clearConfig(): void {
  writeConfig(DEFAULT_CONFIG);
}

/**
 * Get config file path (for user reference)
 */
export function getConfigPath(): string {
  return CONFIG_FILE;
}








