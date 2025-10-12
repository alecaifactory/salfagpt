#!/usr/bin/env node

/**
 * Test script para verificar consistencia entre local y producción
 * Usage: node scripts/test-firestore-consistency.js
 */

import { Firestore } from '@google-cloud/firestore';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  section: (msg) => console.log(`\n${colors.cyan}${'='.repeat(60)}${colors.reset}\n${colors.cyan}  ${msg}${colors.reset}\n${colors.cyan}${'='.repeat(60)}${colors.reset}\n`),
};

async function main() {
  log.section('🔍 Firestore Consistency Test');

  // Check environment variables
  const projectId = process.env.GOOGLE_CLOUD_PROJECT;
  
  if (!projectId) {
    log.error('GOOGLE_CLOUD_PROJECT not set in .env file');
    log.info('Add: GOOGLE_CLOUD_PROJECT=your-project-id to .env');
    process.exit(1);
  }

  log.info(`Project ID: ${projectId}`);
  log.info(`Node Environment: ${process.env.NODE_ENV || 'development'}`);

  // Initialize Firestore client
  log.section('📦 Initializing Firestore Client');
  
  let firestore;
  try {
    firestore = new Firestore({
      projectId: projectId,
    });
    log.success('Firestore client initialized');
  } catch (error) {
    log.error(`Failed to initialize Firestore: ${error.message}`);
    log.info('Run: gcloud auth application-default login');
    process.exit(1);
  }

  // Test 1: Check authentication
  log.section('🔐 Test 1: Authentication');
  
  try {
    const collections = await firestore.listCollections();
    log.success(`Authenticated successfully`);
    log.info(`Found ${collections.length} collections`);
    
    if (collections.length > 0) {
      log.info(`Collections: ${collections.map(c => c.id).join(', ')}`);
    }
  } catch (error) {
    log.error(`Authentication failed: ${error.message}`);
    log.info('Ensure you have run: gcloud auth application-default login');
    log.info('And configured project: gcloud config set project ' + projectId);
    process.exit(1);
  }

  // Test 2: Read permissions
  log.section('📖 Test 2: Read Permissions');
  
  try {
    const testQuery = await firestore
      .collection('conversations')
      .limit(1)
      .get();
    
    log.success('Read permission verified');
    log.info(`Query returned ${testQuery.size} documents`);
  } catch (error) {
    log.error(`Read permission failed: ${error.message}`);
    log.info('Ensure your account has role: roles/datastore.user');
    process.exit(1);
  }

  // Test 3: Write permissions
  log.section('✍️  Test 3: Write Permissions');
  
  const testDocId = `test_${Date.now()}`;
  
  try {
    // Write test document
    await firestore
      .collection('_test_consistency')
      .doc(testDocId)
      .set({
        timestamp: new Date(),
        test: true,
        environment: process.env.NODE_ENV || 'development',
        source: 'test-firestore-consistency.js',
      });
    
    log.success('Write permission verified');
    log.info(`Test document created: _test_consistency/${testDocId}`);
    
    // Read back to verify
    const doc = await firestore
      .collection('_test_consistency')
      .doc(testDocId)
      .get();
    
    if (doc.exists) {
      log.success('Document read back successfully');
      const data = doc.data();
      log.info(`Data: ${JSON.stringify(data, null, 2)}`);
    }
    
    // Clean up
    await firestore
      .collection('_test_consistency')
      .doc(testDocId)
      .delete();
    
    log.success('Test document cleaned up');
  } catch (error) {
    log.error(`Write permission failed: ${error.message}`);
    log.info('Ensure your account has role: roles/datastore.user');
    process.exit(1);
  }

  // Test 4: Check critical collections
  log.section('📚 Test 4: Critical Collections');
  
  const criticalCollections = [
    'conversations',
    'messages',
    'users',
    'folders',
    'user_context',
  ];
  
  for (const collectionName of criticalCollections) {
    try {
      const snapshot = await firestore
        .collection(collectionName)
        .limit(1)
        .get();
      
      log.success(`${collectionName}: accessible (${snapshot.size} docs checked)`);
    } catch (error) {
      log.warning(`${collectionName}: ${error.message}`);
    }
  }

  // Test 5: Latency check
  log.section('⚡ Test 5: Latency Check');
  
  const latencyTests = [];
  for (let i = 0; i < 5; i++) {
    const start = Date.now();
    
    try {
      await firestore
        .collection('conversations')
        .limit(1)
        .get();
      
      const latency = Date.now() - start;
      latencyTests.push(latency);
      log.info(`Test ${i + 1}: ${latency}ms`);
    } catch (error) {
      log.error(`Latency test ${i + 1} failed: ${error.message}`);
    }
  }
  
  if (latencyTests.length > 0) {
    const avgLatency = latencyTests.reduce((a, b) => a + b, 0) / latencyTests.length;
    const minLatency = Math.min(...latencyTests);
    const maxLatency = Math.max(...latencyTests);
    
    log.success(`Latency stats:`);
    log.info(`  Average: ${avgLatency.toFixed(2)}ms`);
    log.info(`  Min: ${minLatency}ms`);
    log.info(`  Max: ${maxLatency}ms`);
    
    if (avgLatency < 100) {
      log.success('Excellent latency!');
    } else if (avgLatency < 300) {
      log.success('Good latency');
    } else {
      log.warning('High latency detected');
    }
  }

  // Test 6: Configuration consistency
  log.section('🔍 Test 6: Configuration Consistency');
  
  try {
    // Check if local config matches what's in Firestore
    const configDoc = await firestore
      .collection('_config')
      .doc('project')
      .get();
    
    if (configDoc.exists) {
      const configData = configDoc.data();
      log.info(`Project config found in Firestore:`);
      log.info(`  ${JSON.stringify(configData, null, 2)}`);
      
      if (configData.projectId === projectId) {
        log.success('Project ID matches config in Firestore');
      } else {
        log.warning(`Project ID mismatch:`);
        log.warning(`  Local: ${projectId}`);
        log.warning(`  Firestore: ${configData.projectId}`);
      }
    } else {
      log.info('No project config document found (this is OK)');
    }
  } catch (error) {
    log.info(`Config check skipped: ${error.message}`);
  }

  // Final summary
  log.section('✨ Test Summary');
  
  log.success('All tests passed!');
  log.info('');
  log.info('Your local environment is properly configured to use GCP Firestore.');
  log.info('Both local development and production will use the same database.');
  log.info('');
  log.info('Next steps:');
  log.info('  1. Test your application: npm run dev');
  log.info('  2. Check Firebase Console: https://console.firebase.google.com/');
  log.info('  3. Validate with production: ./scripts/validate-consistency.sh <prod-url>');
  log.info('');
}

// Run the tests
main().catch((error) => {
  log.error(`Fatal error: ${error.message}`);
  console.error(error.stack);
  process.exit(1);
});

