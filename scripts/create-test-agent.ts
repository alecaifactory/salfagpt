/**
 * Create TestApiUpload_S001 Agent
 * 
 * Creates the agent document in Firestore so CLI uploads can assign documents to it
 */

import { firestore } from '../src/lib/firestore';

async function createAgent() {
  const agentId = 'TestApiUpload_S001';
  const userId = 'usr_uhwqffaqag1wrryd82tw'; // ✅ Hash ID (primary)
  
  console.log(`Creating agent: ${agentId}...`);
  
  try {
    await firestore.collection('conversations').doc(agentId).set({
      id: agentId,
      name: 'Test API Upload S001',
      // ✅ CRITICAL FIELDS for UI compatibility
      agentName: agentId, // Must match the document ID
      title: 'Test Upload Agent (S001)', // Friendly display name
      isAgent: true,
      userId, // ✅ Use hash ID (primary identifier)
      organizationId: 'getaifactory.com', // ✅ Required for multi-org support
      messageCount: 0, // ✅ Initialize message counter
      version: 1, // ✅ Schema version
      source: 'cli', // ✅ Track creation source
      // Agent configuration
      createdAt: new Date(),
      updatedAt: new Date(),
      model: 'gemini-2.5-flash',
      systemPrompt: 'Eres un asistente experto en gestión de bodegas, logística y procedimientos operacionales de Salfacorp. Ayudas a responder preguntas sobre procedimientos, instructivos y manuales de la empresa.',
      activeContextSourceIds: [],
      temperature: 0.7,
      maxTokens: 8192,
      description: 'Agente de prueba para carga masiva de documentos S001',
    });
    
    console.log(`✅ Agent ${agentId} created successfully!`);
    console.log(`\n✅ Agent includes all critical fields:`);
    console.log(`   - agentName: ${agentId}`);
    console.log(`   - title: Test Upload Agent (S001)`);
    console.log(`   - userId: ${userId} (hash ID)`);
    console.log(`   - organizationId: getaifactory.com`);
    console.log(`   - messageCount: 0`);
    console.log(`\nYou can now run:`);
    console.log(`  npx tsx cli/commands/upload.ts \\`);
    console.log(`    --folder=/Users/alec/salfagpt/upload-queue/salfacorp/S001-20251118 \\`);
    console.log(`    --tag=S001-20251118-1545 \\`);
    console.log(`    --agent=TestApiUpload_S001 \\`);
    console.log(`    --user=${userId} \\`);
    console.log(`    --email=alec@getaifactory.com`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

createAgent();

