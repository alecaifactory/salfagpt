/**
 * Re-index document with Vertex AI semantic embeddings
 * 
 * Usage: npx tsx scripts/reindex-document.ts <sourceId>
 * Example: npx tsx scripts/reindex-document.ts 8tjgUceVZW0A46QYYRfW
 */

import { firestore } from '../src/lib/firestore';
import { generateEmbedding } from '../src/lib/embeddings';

async function reindexDocument(sourceId: string) {
  console.log('🔄 Re-indexing document with Vertex AI semantic embeddings...');
  console.log('Source ID:', sourceId);
  console.log('');
  
  // 1. Load source info
  const sourceDoc = await firestore.collection('context_sources').doc(sourceId).get();
  if (!sourceDoc.exists) {
    throw new Error(`Source ${sourceId} not found`);
  }
  
  const sourceName = sourceDoc.data()?.name || 'Unknown';
  console.log(`📄 Document: ${sourceName}`);
  
  // 2. Load all chunks for this source
  const chunksSnapshot = await firestore
    .collection('document_chunks')
    .where('sourceId', '==', sourceId)
    .orderBy('chunkIndex', 'asc')
    .get();
  
  if (chunksSnapshot.empty) {
    throw new Error(`No chunks found for source ${sourceId}`);
  }
  
  console.log(`📊 Found ${chunksSnapshot.size} chunks to re-index`);
  console.log('');
  
  // 3. Re-generate embeddings for each chunk
  let successCount = 0;
  let failCount = 0;
  const startTime = Date.now();
  
  for (const doc of chunksSnapshot.docs) {
    const chunkData = doc.data();
    const chunkIndex = chunkData.chunkIndex;
    
    console.log(`🧮 Chunk #${chunkIndex} (${chunkData.text.length} chars)`);
    console.log(`  Preview: ${chunkData.text.substring(0, 80)}...`);
    
    try {
      // Generate NEW semantic embedding with Vertex AI
      const newEmbedding = await generateEmbedding(chunkData.text);
      
      // Update chunk in Firestore
      await doc.ref.update({
        embedding: newEmbedding,
        reindexedAt: new Date(),
        embeddingType: 'vertex-ai-semantic', // Mark as semantic
        embeddingModel: 'text-embedding-004',
      });
      
      successCount++;
      console.log(`  ✅ Updated with ${newEmbedding.length}-dim semantic embedding`);
      
      // Small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 200));
      
    } catch (error) {
      failCount++;
      console.error(`  ❌ Failed:`, error instanceof Error ? error.message : String(error));
    }
    
    console.log('');
  }
  
  // 4. Update source metadata
  await firestore.collection('context_sources').doc(sourceId).update({
    'ragMetadata.embeddingType': 'vertex-ai-semantic',
    'ragMetadata.embeddingModel': 'text-embedding-004',
    'ragMetadata.lastReindexed': new Date(),
    'ragMetadata.reindexDuration': Date.now() - startTime,
  });
  
  console.log('═══════════════════════════════════════');
  console.log('✅ Re-indexing complete!');
  console.log('═══════════════════════════════════════');
  console.log(`Document: ${sourceName}`);
  console.log(`Success: ${successCount} chunks`);
  console.log(`Failed: ${failCount} chunks`);
  console.log(`Duration: ${((Date.now() - startTime) / 1000).toFixed(1)}s`);
  console.log('');
  console.log('Next steps:');
  console.log('1. Refresh the chat page');
  console.log('2. Ask your question again');
  console.log('3. Check for RAG chunks with real similarity scores');
}

// Get sourceId from command line
const sourceId = process.argv[2];

if (!sourceId) {
  console.error('❌ Error: Source ID required');
  console.error('');
  console.error('Usage:');
  console.error('  npx tsx scripts/reindex-document.ts <sourceId>');
  console.error('');
  console.error('Example:');
  console.error('  npx tsx scripts/reindex-document.ts 8tjgUceVZW0A46QYYRfW');
  console.error('');
  console.error('To find source IDs, check Firestore console or use:');
  console.error('  npx tsx scripts/list-sources.ts');
  process.exit(1);
}

console.log('🚀 Starting re-indexation...');
console.log('');

reindexDocument(sourceId)
  .then(() => {
    console.log('🎉 Done!');
    process.exit(0);
  })
  .catch(error => {
    console.error('');
    console.error('❌ Re-indexing failed:');
    console.error(error);
    console.error('');
    process.exit(1);
  });

