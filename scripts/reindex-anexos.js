/**
 * Script to re-index ANEXOS document for RAG
 */

import admin from 'firebase-admin';

// Initialize admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'gen-lang-client-0986191192'
  });
}

const db = admin.firestore();

async function reindexANEXOS() {
  try {
    console.log('🔍 Buscando documento ANEXOS...\n');
    
    // Find ANEXOS document
    const sources = await db.collection('context_sources')
      .orderBy('addedAt', 'desc')
      .limit(20)
      .get();
    
    console.log(`📚 Total context sources: ${sources.size}\n`);
    
    let anexosDoc = null;
    sources.docs.forEach(doc => {
      const data = doc.data();
      console.log(`- ${data.name} (${doc.id})`);
      
      if (data.name && data.name.includes('ANEXOS')) {
        anexosDoc = { id: doc.id, ...data };
        console.log('  ✅ ENCONTRADO!');
      }
    });
    
    if (!anexosDoc) {
      console.log('\n❌ Documento ANEXOS no encontrado');
      console.log('💡 Verifica el nombre exacto del documento');
      process.exit(1);
    }
    
    console.log('\n📄 Re-indexando:', anexosDoc.name);
    console.log('ID:', anexosDoc.id);
    console.log('UserID:', anexosDoc.userId);
    console.log('Texto:', anexosDoc.extractedData?.length || 0, 'caracteres');
    
    if (!anexosDoc.extractedData) {
      console.log('\n❌ No hay extractedData');
      console.log('💡 El documento necesita ser extraído primero');
      process.exit(1);
    }
    
    // Import indexing function
    const { chunkAndIndexDocument } = await import('../dist/lib/rag-indexing.js');
    
    console.log('\n🔍 Iniciando indexación RAG...\n');
    
    const result = await chunkAndIndexDocument({
      sourceId: anexosDoc.id,
      userId: anexosDoc.userId,
      sourceName: anexosDoc.name,
      text: anexosDoc.extractedData,
      chunkSize: 500,
      overlap: 50,
    });
    
    console.log('\n✅ INDEXACIÓN COMPLETA!');
    console.log('  Chunks creados:', result.chunksCreated);
    console.log('  Total tokens:', result.totalTokens.toLocaleString());
    console.log('  Tiempo:', (result.indexingTime / 1000).toFixed(2) + 's');
    
    // Update source metadata
    await db.collection('context_sources').doc(anexosDoc.id).update({
      ragEnabled: true,
      ragMetadata: {
        chunkCount: result.chunksCreated,
        avgChunkSize: Math.round(result.totalTokens / result.chunksCreated),
        indexedAt: new Date(),
        embeddingModel: 'text-embedding-004',
      },
      updatedAt: new Date(),
    });
    
    console.log('\n✅ Metadata actualizada en Firestore');
    console.log('\n🎉 Re-indexación exitosa! Ahora puedes usar RAG con este documento.');
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\nDetalles:', error.stack);
    process.exit(1);
  }
}

reindexANEXOS();

