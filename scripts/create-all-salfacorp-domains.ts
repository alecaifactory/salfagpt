#!/usr/bin/env tsx
/**
 * Create all Salfacorp-related domain configurations
 * Based on the domains visible in the UI
 */

import { firestore, COLLECTIONS } from '../src/lib/firestore.js';

// All domains from the UI
const DOMAINS_TO_CREATE = [
  { id: 'duocuc.cl', name: 'DuocUC', description: 'DuocUC domain' },
  { id: 'getaifactory.com', name: 'GetAI Factory', description: 'GetAI Factory - Primary admin domain' },
  { id: 'iaconcagua.com', name: 'IA Concagua', description: 'Salfacorp domain - iaconcagua.com' },
  { id: 'inoval.cl', name: 'Inoval', description: 'Salfacorp domain - inoval.cl' },
  { id: 'salfacorp.com', name: 'Salfacorp', description: 'Salfacorp domain - salfacorp.com' },
  { id: 'maqsa.cl', name: 'Maqsa', description: 'Salfacorp domain - maqsa.cl' },
  { id: 'tecsa.cl', name: 'Tecsa', description: 'Salfacorp domain - tecsa.cl' },
  { id: 'salfamantenciones.cl', name: 'Salfa Mantenciones', description: 'Salfacorp domain - salfamantenciones.cl' },
  { id: 'salfaustral.cl', name: 'Salfa Austral', description: 'Salfacorp domain - salfaustral.cl' },
  { id: 'geovita.cl', name: 'Geovita', description: 'Salfacorp domain - geovita.cl' },
  { id: 'fegrande.cl', name: 'FE Grande', description: 'Salfacorp domain - fegrande.cl' },
  { id: 'salfamontajes.com', name: 'Salfa Montajes', description: 'Salfacorp domain - salfamontajes.com' },
  { id: 'salfagestion.cl', name: 'Salfa Gestion', description: 'Salfa Gestion domain' },
];

async function main() {
  console.log('🏢 Creating Salfacorp Domain Configurations\n');
  console.log('='.repeat(80));
  
  let created = 0;
  let alreadyExists = 0;
  let updated = 0;
  
  for (const domainConfig of DOMAINS_TO_CREATE) {
    console.log(`\n📝 Processing: ${domainConfig.id} (${domainConfig.name})`);
    
    const domainRef = firestore
      .collection(COLLECTIONS.ORGANIZATIONS)
      .doc(domainConfig.id);
    
    const domainDoc = await domainRef.get();
    
    if (domainDoc.exists) {
      const data = domainDoc.data();
      console.log('   ℹ️  Already exists');
      console.log(`   Enabled: ${data?.isEnabled === true ? 'YES' : 'NO'}`);
      
      if (data?.isEnabled !== true) {
        console.log('   🔄 Enabling...');
        await domainRef.update({
          isEnabled: true,
          updatedAt: new Date(),
        });
        updated++;
        console.log('   ✅ Enabled');
      } else {
        alreadyExists++;
      }
    } else {
      console.log('   🆕 Creating new organization...');
      
      await domainRef.set({
        id: domainConfig.id,
        name: domainConfig.name,
        domain: domainConfig.id,
        description: domainConfig.description,
        isEnabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'admin-script',
        settings: {
          allowUserSignup: true,
          requireAdminApproval: false,
          maxAgentsPerUser: 50,
          maxContextSourcesPerUser: 100,
        },
        features: {
          aiChat: true,
          contextManagement: true,
          agentSharing: true,
          analytics: true,
        },
      });
      
      created++;
      console.log('   ✅ Created and enabled');
    }
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('📊 SUMMARY\n');
  console.log(`Domains processed:     ${DOMAINS_TO_CREATE.length}`);
  console.log(`Created:               ${created}`);
  console.log(`Already existed:       ${alreadyExists}`);
  console.log(`Updated (enabled):     ${updated}`);
  console.log('='.repeat(80));
  
  console.log('\n✅ All Salfacorp domains are now configured and enabled!');
  console.log('📝 Users from these domains can now access the platform.');
  
  process.exit(0);
}

main();



