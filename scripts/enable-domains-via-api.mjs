#!/usr/bin/env node
/**
 * Enable Domains via API Script
 * 
 * Creates and enables multiple domains using the local API
 * Requires admin session cookie
 */

import fetch from 'node-fetch';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const BASE_URL = 'http://localhost:3000';

// Domains to enable
const DOMAINS_TO_ENABLE = [
  {
    domain: 'getaifactory.com',
    name: 'GetAI Factory',
    description: 'GetAI Factory domain - Enabled by admin',
  },
  {
    domain: 'salfacloud.cl',
    name: 'Salfa Cloud',
    description: 'Salfa Cloud domain - Enabled by admin',
  },
];

// Admin email for creating domains
const ADMIN_EMAIL = 'alec@getaifactory.com';

async function enableDomains() {
  console.log('🚀 Domain Enablement Script');
  console.log('============================');
  console.log('');
  console.log('📝 Domains to enable:');
  DOMAINS_TO_ENABLE.forEach(d => {
    console.log(`   - ${d.domain} (${d.name})`);
  });
  console.log('');

  // Note: For this to work, you need to be logged in as admin in your browser
  // and we'll use a mock approach since we can't access browser cookies from Node
  
  console.log('⚠️  This script requires direct Firestore access.');
  console.log('💡 Alternative: Use the Domain Management UI in the browser');
  console.log('');
  console.log('Creating domains directly in Firestore...');
  console.log('');

  // Import Firestore
  const { Firestore } = await import('@google-cloud/firestore');
  
  const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT || 'gen-lang-client-0986191192';
  const firestore = new Firestore({
    projectId: PROJECT_ID,
  });

  console.log('📦 Project:', PROJECT_ID);
  console.log('');

  const results = [];

  for (const domainInfo of DOMAINS_TO_ENABLE) {
    const { domain, name, description } = domainInfo;
    
    try {
      console.log(`🔧 Processing: ${domain}...`);
      
      // Check if domain exists
      const domainDoc = await firestore.collection('domains').doc(domain).get();
      
      if (domainDoc.exists) {
        const existingData = domainDoc.data();
        console.log(`   ℹ️  Domain exists (${existingData.enabled ? 'enabled' : 'disabled'})`);
        
        if (!existingData.enabled) {
          // Enable it
          await firestore.collection('domains').doc(domain).update({
            enabled: true,
            updatedAt: new Date(),
          });
          console.log('   ✅ Enabled successfully');
          results.push({ domain, status: 'enabled', action: 'updated' });
        } else {
          console.log('   ✅ Already enabled');
          results.push({ domain, status: 'enabled', action: 'no change' });
        }
      } else {
        // Create new domain
        const domainData = {
          name: name,
          enabled: true,
          createdBy: ADMIN_EMAIL,
          createdAt: new Date(),
          updatedAt: new Date(),
          allowedAgents: [],
          allowedContextSources: [],
          userCount: 0,
          description: description,
          settings: {},
        };
        
        await firestore.collection('domains').doc(domain).set(domainData);
        console.log('   ✅ Created and enabled');
        results.push({ domain, status: 'enabled', action: 'created' });
      }
      
    } catch (error) {
      console.error(`   ❌ Failed: ${error.message}`);
      results.push({ domain, status: 'failed', error: error.message });
    }
    
    console.log('');
  }

  // Summary
  console.log('');
  console.log('📊 Summary:');
  console.log('===========');
  console.log('');
  
  results.forEach(result => {
    const status = result.status === 'enabled' ? '✅' : '❌';
    console.log(`${status} ${result.domain}`);
    if (result.action) {
      console.log(`   Action: ${result.action}`);
    }
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });
  
  console.log('');
  console.log('🎯 Next Steps:');
  console.log('   1. Verify in browser: http://localhost:3000/superadmin');
  console.log('   2. Open Domain Management panel');
  console.log('   3. Confirm domains are visible and enabled');
  console.log('   4. Test login with user from these domains');
  console.log('');
}

// Execute
enableDomains()
  .then(() => {
    console.log('✅ Process completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });

