/**
 * Test Upload to New Agent
 * 
 * 1. Find agent by name
 * 2. Verify agent structure
 * 3. Upload 2 test documents
 * 4. Verify documents appear in UI
 */

import { firestore } from '../src/lib/firestore';
import { uploadFileToGCS } from '../cli/lib/storage';
import { extractDocument } from '../cli/lib/extraction';
import { processForRAG } from '../cli/lib/embeddings';
import { readdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const CONFIG = {
  agentName: 'TestApiUpload_S0012',
  userId: 'usr_uhwqffaqag1wrryd82tw', // Hash ID
  userEmail: 'alec@getaifactory.com',
  folderPath: '/Users/alec/salfagpt/upload-queue/salfacorp/S001-20251118',
  tag: 'TEST-' + Date.now(),
  maxDocuments: 2,
  model: 'gemini-2.5-flash' as const,
};

async function findPDFs(folder: string, limit: number): Promise<string[]> {
  const files: string[] = [];
  
  async function scan(dir: string) {
    if (files.length >= limit) return;
    
    const entries = await readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      if (files.length >= limit) break;
      
      const fullPath = join(dir, entry.name);
      
      if (entry.isDirectory()) {
        await scan(fullPath);
      } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.pdf')) {
        files.push(fullPath);
      }
    }
  }
  
  await scan(folder);
  return files.slice(0, limit);
}

async function main() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║              Test Upload to New Agent                       ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');
  
  console.log('📋 Configuration:');
  console.log(`   Agent Name: ${CONFIG.agentName}`);
  console.log(`   User ID: ${CONFIG.userId}`);
  console.log(`   Folder: ${CONFIG.folderPath}`);
  console.log(`   Max Documents: ${CONFIG.maxDocuments}`);
  console.log(`   Tag: ${CONFIG.tag}`);
  
  // STEP 1: Find agent by name
  console.log('\n\n🔍 STEP 1: Finding agent by name...');
  console.log('═'.repeat(70));
  
  const agentsSnapshot = await firestore
    .collection('conversations')
    .where('userId', '==', CONFIG.userId)
    .where('isAgent', '==', true)
    .get();
  
  let targetAgentId: string | null = null;
  let targetAgent: any = null;
  
  for (const doc of agentsSnapshot.docs) {
    const data = doc.data();
    const displayName = data.name || data.agentName || data.title || '';
    
    if (displayName === CONFIG.agentName || 
        data.agentName === CONFIG.agentName ||
        data.title === CONFIG.agentName) {
      targetAgentId = doc.id;
      targetAgent = data;
      break;
    }
  }
  
  if (!targetAgentId) {
    console.log(`\n❌ ERROR: Agent "${CONFIG.agentName}" not found!`);
    console.log('\n📋 Available agents:');
    agentsSnapshot.docs.slice(0, 10).forEach(doc => {
      const data = doc.data();
      const name = data.name || data.agentName || data.title || 'N/A';
      console.log(`   - "${name}" (ID: ${doc.id})`);
    });
    process.exit(1);
  }
  
  console.log(`✅ Found agent:`);
  console.log(`   Display Name: ${targetAgent.name || targetAgent.title}`);
  console.log(`   Agent ID: ${targetAgentId}`);
  console.log(`   Has agentName: ${targetAgent.agentName ? '✅' : '❌'}`);
  console.log(`   Has organizationId: ${targetAgent.organizationId ? '✅' : '❌'}`);
  console.log(`   Current documents: ${targetAgent.activeContextSourceIds?.length || 0}`);
  
  // Fix agent structure if needed
  if (!targetAgent.agentName || !targetAgent.organizationId) {
    console.log('\n🔧 Fixing agent structure...');
    await firestore.collection('conversations').doc(targetAgentId).update({
      agentName: targetAgent.agentName || targetAgentId,
      name: CONFIG.agentName,
      title: CONFIG.agentName,
      organizationId: targetAgent.organizationId || 'getaifactory.com',
      messageCount: targetAgent.messageCount || 0,
      version: targetAgent.version || 1,
      source: targetAgent.source || 'webapp',
      updatedAt: new Date(),
    });
    console.log('   ✅ Agent structure fixed');
  }
  
  // STEP 2: Find PDFs to upload
  console.log('\n\n📁 STEP 2: Finding PDFs to upload...');
  console.log('═'.repeat(70));
  
  if (!existsSync(CONFIG.folderPath)) {
    console.log(`❌ Folder not found: ${CONFIG.folderPath}`);
    process.exit(1);
  }
  
  const pdfFiles = await findPDFs(CONFIG.folderPath, CONFIG.maxDocuments);
  
  console.log(`✅ Found ${pdfFiles.length} PDFs to upload:`);
  pdfFiles.forEach((file, i) => {
    const fileName = file.split('/').pop();
    console.log(`   ${i + 1}. ${fileName}`);
  });
  
  if (pdfFiles.length === 0) {
    console.log('\n❌ No PDF files found!');
    process.exit(1);
  }
  
  // STEP 3: Upload documents
  console.log('\n\n📤 STEP 3: Uploading documents...');
  console.log('═'.repeat(70));
  
  const uploadedDocs: string[] = [];
  let totalCost = 0;
  
  for (let i = 0; i < pdfFiles.length; i++) {
    const filePath = pdfFiles[i];
    const fileName = filePath.split('/').pop() || 'unknown.pdf';
    
    console.log(`\n📄 Document ${i + 1}/${pdfFiles.length}: ${fileName}`);
    console.log('─'.repeat(70));
    
    try {
      // Upload to GCS
      console.log('  📤 Uploading to Cloud Storage...');
      const uploadResult = await uploadFileToGCS(
        filePath,
        CONFIG.userId,
        targetAgentId,
        (progress) => {
          process.stdout.write(`\r     ${progress.percentage.toFixed(0)}% uploaded`);
        }
      );
      console.log(); // New line
      
      if (!uploadResult.success) {
        throw new Error(uploadResult.error || 'Upload failed');
      }
      
      console.log(`     ✅ Uploaded (${(uploadResult.fileSize / 1024).toFixed(2)} KB)`);
      
      // Extract with Gemini
      console.log('  🤖 Extracting content with Gemini AI...');
      const extraction = await extractDocument(filePath, CONFIG.model);
      
      if (!extraction.success) {
        throw new Error(extraction.error || 'Extraction failed');
      }
      
      console.log(`     ✅ Extracted ${extraction.charactersExtracted.toLocaleString()} chars`);
      console.log(`     💰 Cost: $${extraction.estimatedCost.toFixed(6)}`);
      totalCost += extraction.estimatedCost;
      
      // Save to Firestore
      console.log('  💾 Saving to Firestore...');
      const sourceDoc = await firestore.collection('context_sources').add({
        userId: CONFIG.userId,
        name: fileName,
        type: 'pdf',
        enabled: true,
        status: 'active',
        addedAt: new Date(),
        extractedData: extraction.extractedText,
        originalFileUrl: uploadResult.gcsPath,
        tags: [CONFIG.tag],
        assignedToAgents: [targetAgentId], // ✅ Use the found agent ID
        metadata: {
          originalFileName: fileName,
          originalFileSize: uploadResult.fileSize,
          extractionDate: new Date(),
          extractionTime: Date.now(),
          model: extraction.model,
          charactersExtracted: extraction.charactersExtracted,
          tokensEstimate: extraction.tokensEstimate,
          inputTokens: extraction.inputTokens,
          outputTokens: extraction.outputTokens,
          estimatedCost: extraction.estimatedCost,
          uploadedVia: 'test-script',
          uploadedBy: CONFIG.userEmail,
          testUpload: true,
        },
        source: 'test-script',
      });
      
      const sourceId = sourceDoc.id;
      console.log(`     ✅ Saved (ID: ${sourceId})`);
      
      // RAG Processing
      console.log('  🧬 Processing for RAG...');
      const ragResult = await processForRAG(
        sourceId,
        fileName,
        extraction.extractedText,
        CONFIG.userId,
        targetAgentId,
        {
          chunkSize: 1000,
          embeddingModel: 'text-embedding-004',
          uploadedVia: 'test-script',
          userEmail: CONFIG.userEmail,
        }
      );
      
      if (ragResult.success) {
        console.log(`     ✅ Created ${ragResult.totalChunks} chunks with embeddings`);
        console.log(`     💰 Embedding cost: $${ragResult.estimatedCost.toFixed(6)}`);
        totalCost += ragResult.estimatedCost;
        
        // Update metadata
        await firestore.collection('context_sources').doc(sourceId).update({
          ragEnabled: true,
          ragMetadata: {
            chunkCount: ragResult.totalChunks,
            avgChunkSize: Math.round(ragResult.totalTokens / ragResult.totalChunks),
            indexedAt: new Date(),
            embeddingModel: 'text-embedding-004',
          },
          useRAGMode: true,
        });
      }
      
      uploadedDocs.push(sourceId);
      console.log(`  ✅ Document ${i + 1} complete!`);
      
    } catch (error) {
      console.log(`  ❌ Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  // STEP 4: Update agent's activeContextSourceIds
  console.log('\n\n🔗 STEP 4: Updating agent context...');
  console.log('═'.repeat(70));
  
  // Get all documents assigned to this agent
  const allDocs = await firestore
    .collection('context_sources')
    .where('userId', '==', CONFIG.userId)
    .where('assignedToAgents', 'array-contains', targetAgentId)
    .get();
  
  const allDocIds = allDocs.docs.map(doc => doc.id);
  
  await firestore.collection('conversations').doc(targetAgentId).update({
    activeContextSourceIds: allDocIds,
    updatedAt: new Date(),
  });
  
  console.log(`✅ Updated activeContextSourceIds: ${allDocIds.length} total documents`);
  console.log(`   (${uploadedDocs.length} new + ${allDocIds.length - uploadedDocs.length} existing)`);
  
  // STEP 5: Verify
  console.log('\n\n✅ STEP 5: Verification...');
  console.log('═'.repeat(70));
  
  const verifyAgent = await firestore.collection('conversations').doc(targetAgentId).get();
  const verifyData = verifyAgent.data();
  
  console.log(`Agent ID: ${targetAgentId}`);
  console.log(`Agent Name: ${verifyData?.name || verifyData?.agentName}`);
  console.log(`Documents in activeContextSourceIds: ${verifyData?.activeContextSourceIds?.length || 0}`);
  console.log(`Documents in DB: ${allDocIds.length}`);
  console.log(`Match: ${verifyData?.activeContextSourceIds?.length === allDocIds.length ? '✅' : '❌'}`);
  
  // Final Summary
  console.log('\n\n═'.repeat(70));
  console.log('✅ TEST COMPLETE');
  console.log('═'.repeat(70));
  console.log(`\n📊 Summary:`);
  console.log(`   Agent: ${CONFIG.agentName} (ID: ${targetAgentId})`);
  console.log(`   Documents uploaded: ${uploadedDocs.length}/${CONFIG.maxDocuments}`);
  console.log(`   Total documents now: ${allDocIds.length}`);
  console.log(`   Total cost: $${totalCost.toFixed(6)}`);
  console.log(`   Tag: ${CONFIG.tag}`);
  console.log('\n💡 Next steps:');
  console.log('   1. Refresh your browser');
  console.log('   2. Open agent settings for "' + CONFIG.agentName + '"');
  console.log(`   3. You should see ${allDocIds.length} documents`);
  console.log(`   4. Try asking a question about the uploaded documents`);
  console.log('');
}

main().then(() => process.exit(0)).catch(err => {
  console.error('\n❌ Fatal Error:', err);
  process.exit(1);
});

