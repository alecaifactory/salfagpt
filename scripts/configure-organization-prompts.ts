#!/usr/bin/env -S npx tsx
/**
 * Configure Organization Prompts for AI Factory and Salfa Corp
 * 
 * Sets:
 * - AI Factory: "Eres el asistente de AI Factory."
 * - Salfa Corp: "Eres el asistente del Grupo Salfacorp."
 * 
 * Run: npx tsx scripts/configure-organization-prompts.ts
 */

import { firestore, COLLECTIONS } from '../src/lib/firestore.js';

async function configureOrganizationPrompts() {
  console.log('🏢 Configuring Organization Prompts...\n');
  
  try {
    // ==========================================
    // 1. AI FACTORY
    // ==========================================
    console.log('1️⃣  AI Factory (getaifactory.com)');
    console.log('   Organization Prompt: "Eres el asistente de AI Factory."\n');
    
    const aiFactoryRef = firestore.collection(COLLECTIONS.ORGANIZATIONS).doc('ai-factory');
    const aiFactoryDoc = await aiFactoryRef.get();
    
    if (!aiFactoryDoc.exists) {
      // Create AI Factory org if doesn't exist
      console.log('   Creating AI Factory organization...');
      await aiFactoryRef.set({
        id: 'ai-factory',
        name: 'AI Factory',
        slug: 'ai-factory',
        domains: ['getaifactory.com'],
        primaryDomain: 'getaifactory.com',
        isEnabled: true,
        tenant: {
          type: 'saas' as const,
          gcpProjectId: 'salfagpt',
          region: 'us-east4'
        },
        allyConfig: {
          organizationPrompt: 'Eres el asistente de AI Factory.',
          enableHistory: true,
          historyLimit: 10,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'alec@getaifactory.com',
        source: 'localhost'
      });
      console.log('   ✅ AI Factory organization created');
    } else {
      // Update existing
      console.log('   Updating existing AI Factory organization...');
      await aiFactoryRef.update({
        'allyConfig.organizationPrompt': 'Eres el asistente de AI Factory.',
        'allyConfig.enableHistory': true,
        'allyConfig.historyLimit': 10,
        updatedAt: new Date()
      });
      console.log('   ✅ AI Factory organization prompt updated');
    }
    
    // ==========================================
    // 2. SALFA CORP
    // ==========================================
    console.log('\n2️⃣  Salfa Corp (salfagestion.cl, salfa.cl, maqsa.cl)');
    console.log('   Organization Prompt: "Eres el asistente del Grupo Salfacorp."\n');
    
    const salfaRef = firestore.collection(COLLECTIONS.ORGANIZATIONS).doc('salfa-corp');
    const salfaDoc = await salfaRef.get();
    
    if (!salfaDoc.exists) {
      console.error('   ❌ ERROR: Salfa Corp organization not found!');
      console.error('   Please create it first using organization creation script.');
      process.exit(1);
    }
    
    console.log('   Updating Salfa Corp organization...');
    await salfaRef.update({
      'allyConfig.organizationPrompt': 'Eres el asistente del Grupo Salfacorp.',
      'allyConfig.enableHistory': true,
      'allyConfig.historyLimit': 10,
      updatedAt: new Date()
    });
    console.log('   ✅ Salfa Corp organization prompt updated');
    
    // ==========================================
    // VERIFICATION
    // ==========================================
    console.log('\n🔍 Verification:\n');
    
    // Verify AI Factory
    const aiFactoryVerify = await aiFactoryRef.get();
    if (aiFactoryVerify.exists) {
      const data = aiFactoryVerify.data();
      console.log('✅ AI Factory:');
      console.log(`   Name: ${data?.name}`);
      console.log(`   Domains: ${data?.domains?.join(', ')}`);
      console.log(`   Org Prompt: "${data?.allyConfig?.organizationPrompt}"`);
      console.log(`   Prompt Length: ${data?.allyConfig?.organizationPrompt?.length || 0} chars`);
    }
    
    console.log('');
    
    // Verify Salfa Corp
    const salfaVerify = await salfaRef.get();
    if (salfaVerify.exists) {
      const data = salfaVerify.data();
      console.log('✅ Salfa Corp:');
      console.log(`   Name: ${data?.name}`);
      console.log(`   Domains: ${data?.domains?.join(', ')}`);
      console.log(`   Org Prompt: "${data?.allyConfig?.organizationPrompt}"`);
      console.log(`   Prompt Length: ${data?.allyConfig?.organizationPrompt?.length || 0} chars`);
    }
    
    // ==========================================
    // SUCCESS
    // ==========================================
    console.log('\n✅ Organization prompts configured successfully!\n');
    console.log('📊 Summary:');
    console.log('   - AI Factory: "Eres el asistente de AI Factory." (37 chars)');
    console.log('   - Salfa Corp: "Eres el asistente del Grupo Salfacorp." (48 chars)');
    console.log('\n🧪 Next Steps:');
    console.log('   1. Test Ally conversation as alec@getaifactory.com');
    console.log('   2. Test Ally conversation as usuario@salfagestion.cl');
    console.log('   3. Verify organization prompt appears in combined prompt');
    console.log('   4. Check Domain dropdown shows all 3 domains for Salfa Corp\n');
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Error configuring organization prompts:', error);
    process.exit(1);
  }
}

// Run
configureOrganizationPrompts();

