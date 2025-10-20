#!/usr/bin/env node

/**
 * Batch Re-procesar TODOS los Embeddings Faltantes
 * 
 * Procesa todos los documentos CLI que no tienen embeddings
 */

import { firestore } from '../src/lib/firestore';
import { processForRAG } from '../cli/lib/embeddings';
import { config } from 'dotenv';

config();

async function main() {
  console.log('🔄 Batch Re-procesando TODOS los Embeddings');
  console.log('==========================================\n');
  
  try {
    // Get all CLI documents
    console.log('📥 Cargando documentos CLI...\n');
    
    const snapshot = await firestore
      .collection('context_sources')
      .where('metadata.uploadedVia', '==', 'cli')
      .get();
    
    // Filter those without embeddings
    const docsToProcess = snapshot.docs.filter(doc => {
      const data = doc.data();
      return (data.metadata?.ragEmbeddings || 0) === 0;
    });
    
    console.log(`✅ Total CLI: ${snapshot.size}`);
    console.log(`⚠️  Sin embeddings: ${docsToProcess.length}\n`);
    
    if (docsToProcess.length === 0) {
      console.log('✅ Todos los documentos ya tienen embeddings\n');
      return;
    }
    
    console.log('🔬 Procesando embeddings...\n');
    
    let processed = 0;
    let failed = 0;
    
    for (let i = 0; i < docsToProcess.length; i++) {
      const doc = docsToProcess[i];
      const data = doc.data();
      const docId = doc.id;
      const fileName = data.name;
      const extractedText = data.extractedData;
      
      console.log(`[${i + 1}/${docsToProcess.length}] 🔬 ${fileName}`);
      
      if (!extractedText) {
        console.log(`   ⚠️  Sin texto extraído - saltando\n`);
        failed++;
        continue;
      }
      
      try {
        const ragResult = await processForRAG(
          docId,
          fileName,
          extractedText,
          data.userId,
          'cli-upload',
          {
            embeddingModel: 'text-embedding-004',
            uploadedVia: 'cli',
            cliVersion: data.metadata?.cliVersion || '0.3.0',
            userEmail: data.metadata?.userEmail || 'unknown',
          }
        );
        
        if (ragResult.success) {
          console.log(`   ✅ ${ragResult.embeddings.length} embeddings generados`);
          
          // ✅ CRITICAL: Update context_sources with RAG metadata
          await firestore.collection('context_sources').doc(docId).update({
            ragEnabled: true,
            'metadata.ragEnabled': true,
            'metadata.ragChunks': ragResult.totalChunks,
            'metadata.ragEmbeddings': ragResult.embeddings.length,
            'metadata.ragTokens': ragResult.totalTokens,
            'metadata.ragCost': ragResult.estimatedCost,
            'metadata.ragModel': 'text-embedding-004',
            'metadata.ragProcessedAt': new Date(),
            'metadata.ragProcessedBy': data.metadata?.userEmail || 'unknown',
          });
          
          console.log(`   ✅ Metadata actualizada\n`);
          processed++;
        } else {
          console.log(`   ❌ Error: ${ragResult.error}\n`);
          failed++;
        }
        
        // Small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.log(`   ❌ Error: ${error instanceof Error ? error.message : 'Unknown'}\n`);
        failed++;
      }
    }
    
    console.log('\n📊 RESUMEN FINAL');
    console.log('================');
    console.log(`Total a procesar: ${docsToProcess.length}`);
    console.log(`✅ Exitosos: ${processed}`);
    console.log(`❌ Fallidos: ${failed}\n`);
    
    if (processed > 0) {
      console.log('✅ Búsqueda semántica ahora disponible!\n');
      console.log('💡 Los documentos procesados ahora tienen:');
      console.log('   - Embeddings vectoriales (768-dim)');
      console.log('   - Búsqueda semántica funcional');
      console.log('   - RAG inteligente habilitado\n');
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

main();

