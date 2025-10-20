#!/usr/bin/env node

/**
 * Re-procesar Embeddings para Documentos Existentes
 * 
 * Problema: Documentos fueron subidos pero embeddings fallaron
 * Solución: Re-generar embeddings sin volver a subir archivos
 * 
 * Uso:
 *   npx tsx scripts/reprocess-embeddings.ts
 *   npx tsx scripts/reprocess-embeddings.ts --source-id ABC123  # Solo un documento
 */

import { firestore } from '../src/lib/firestore';
import { processForRAG } from '../cli/lib/embeddings';
import { config } from 'dotenv';

config();

async function main() {
  console.log('🔄 Re-procesando Embeddings');
  console.log('===========================\n');
  
  const sourceId = process.argv.find(arg => arg.startsWith('--source-id='))?.split('=')[1];
  
  try {
    let docs;
    
    if (sourceId) {
      // Process single document
      console.log(`📄 Procesando documento específico: ${sourceId}\n`);
      const doc = await firestore.collection('context_sources').doc(sourceId).get();
      docs = doc.exists ? [doc] : [];
    } else {
      // Process all CLI documents without embeddings
      console.log('📥 Buscando documentos CLI sin embeddings...\n');
      
      const snapshot = await firestore
        .collection('context_sources')
        .where('metadata.uploadedVia', '==', 'cli')
        .where('metadata.ragEnabled', '==', false)
        .get();
      
      docs = snapshot.docs;
    }
    
    if (docs.length === 0) {
      console.log('✅ No hay documentos para procesar');
      console.log('💡 Todos los documentos ya tienen embeddings\n');
      return;
    }
    
    console.log(`✅ Encontrados ${docs.length} documento(s) para procesar\n`);
    
    let processed = 0;
    let failed = 0;
    
    for (const doc of docs) {
      const data = doc.data();
      const docId = doc.id;
      const fileName = data.name;
      const extractedText = data.extractedData;
      
      console.log(`🔬 Procesando: ${fileName}`);
      console.log(`   ID: ${docId}`);
      
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
          console.log(`   ✅ Embeddings generados: ${ragResult.embeddings.length} vectores`);
          
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
          
          console.log(`   ✅ Metadata actualizada en context_sources\n`);
          processed++;
        } else {
          console.log(`   ❌ Error: ${ragResult.error}\n`);
          failed++;
        }
        
      } catch (error) {
        console.log(`   ❌ Error procesando: ${error instanceof Error ? error.message : 'Unknown'}\n`);
        failed++;
      }
    }
    
    console.log('\n📊 RESUMEN');
    console.log('==========');
    console.log(`Total documentos: ${docs.length}`);
    console.log(`✅ Procesados: ${processed}`);
    console.log(`❌ Fallidos: ${failed}\n`);
    
    if (processed > 0) {
      console.log('✅ Búsqueda semántica ahora disponible para los documentos procesados\n');
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

main();

