#!/usr/bin/env node
/**
 * Environment Loader for Multi-Project Setup
 * Reads .env.project to determine which project config to use
 * Copies the correct .env file for the selected project
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const projectRoot = process.cwd();
const projectFile = resolve(projectRoot, '.env.project');
const envFile = resolve(projectRoot, '.env');

// Read project selector
if (!existsSync(projectFile)) {
  console.error('❌ .env.project file not found!');
  console.error('   Create it with: echo "CURRENT_PROJECT=SALFACORP" > .env.project');
  process.exit(1);
}

const projectContent = readFileSync(projectFile, 'utf-8');
const match = projectContent.match(/CURRENT_PROJECT=(\w+)/);

if (!match) {
  console.error('❌ CURRENT_PROJECT not found in .env.project');
  console.error('   Expected format: CURRENT_PROJECT=SALFACORP or CURRENT_PROJECT=AIFACTORY');
  process.exit(1);
}

const currentProject = match[1];

// Determine which env file to use
let sourceEnvFile;
if (currentProject === 'SALFACORP') {
  sourceEnvFile = resolve(projectRoot, '.env.salfacorp');
} else if (currentProject === 'AIFACTORY') {
  sourceEnvFile = resolve(projectRoot, '.env.aifactory');
} else {
  console.error(`❌ Unknown project: ${currentProject}`);
  console.error('   Valid options: SALFACORP, AIFACTORY');
  process.exit(1);
}

// Verify source file exists
if (!existsSync(sourceEnvFile)) {
  console.error(`❌ Environment file not found: ${sourceEnvFile}`);
  process.exit(1);
}

// Copy to .env
try {
  const envContent = readFileSync(sourceEnvFile, 'utf-8');
  writeFileSync(envFile, envContent, 'utf-8');
  
  console.log('✅ Environment loaded successfully');
  console.log(`📂 Project: ${currentProject}`);
  console.log(`📄 Source: ${sourceEnvFile.split('/').pop()}`);
  console.log(`📝 Created: .env`);
  
  // Show key configuration
  const lines = envContent.split('\n');
  const project = lines.find(l => l.startsWith('GOOGLE_CLOUD_PROJECT='))?.split('=')[1];
  const port = lines.find(l => l.startsWith('DEV_PORT='))?.split('=')[1];
  const baseUrl = lines.find(l => l.startsWith('PUBLIC_BASE_URL='))?.split('=')[1];
  
  console.log('');
  console.log('🔧 Configuration:');
  console.log(`   GCP Project: ${project || 'NOT SET'}`);
  console.log(`   Port: ${port || '3000 (default)'}`);
  console.log(`   Base URL: ${baseUrl || 'NOT SET'}`);
  
} catch (error) {
  console.error('❌ Failed to load environment:', error.message);
  process.exit(1);
}








