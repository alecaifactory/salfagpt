#!/usr/bin/env tsx
/**
 * Script para Comparar Documentos Exitosos vs Fallidos
 * 
 * Compara las características de documentos que se extrajeron correctamente
 * vs los que fallaron, para identificar patrones.
 */

import { firestore } from '../src/lib/firestore.js';

async function compareDocuments() {
  console.log('🔍 Comparación de Documentos: Exitosos vs Fallidos');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    // Get all context sources
    const snapshot = await firestore
      .collection('context_sources')
      .orderBy('addedAt', 'desc')
      .get();

    const docs = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as any));

    // Categorize
    const successful = docs.filter(d => d.extractedData && d.extractedData.length > 100);
    const failed = docs.filter(d => !d.extractedData || d.extractedData.length < 100 || d.status === 'error');

    console.log('📊 ESTADÍSTICAS:');
    console.log(`   Total documentos: ${docs.length}`);
    console.log(`   ✅ Exitosos: ${successful.length}`);
    console.log(`   ❌ Fallidos/Vacíos: ${failed.length}`);
    console.log('');

    // Compare successful
    if (successful.length > 0) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('✅ DOCUMENTOS EXITOSOS:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      
      successful.forEach((doc, i) => {
        console.log(`${i + 1}. ${doc.name}`);
        console.log(`   🆔 ID: ${doc.id}`);
        console.log(`   📄 Tamaño archivo: ${(doc.metadata?.originalFileSize || 0 / 1024).toFixed(2)} KB`);
        console.log(`   📝 Caracteres extraídos: ${doc.extractedData.length.toLocaleString()}`);
        console.log(`   🤖 Modelo: ${doc.metadata?.model || 'unknown'}`);
        console.log(`   ⏱️  Tiempo: ${doc.metadata?.extractionTime || 'N/A'}ms`);
        
        const preview = doc.extractedData.substring(0, 100).replace(/\n/g, ' ');
        console.log(`   📖 Preview: "${preview}..."`);
        console.log('');
      });
    }

    // Compare failed
    if (failed.length > 0) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('❌ DOCUMENTOS FALLIDOS/VACÍOS:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      
      failed.forEach((doc, i) => {
        console.log(`${i + 1}. ${doc.name}`);
        console.log(`   🆔 ID: ${doc.id}`);
        console.log(`   🎯 Estado: ${doc.status}`);
        console.log(`   📄 Tamaño archivo: ${((doc.metadata?.originalFileSize || 0) / 1024).toFixed(2)} KB`);
        console.log(`   🤖 Modelo usado: ${doc.metadata?.model || 'unknown'}`);
        
        if (doc.error) {
          console.log(`   🚨 Error: ${doc.error.message}`);
          if (doc.error.details) {
            console.log(`   🔍 Detalles: ${doc.error.details}`);
          }
        }
        
        if (doc.extractedData) {
          console.log(`   📝 Contenido: ${doc.extractedData.length} caracteres`);
          const preview = doc.extractedData.substring(0, 100).replace(/\n/g, ' ');
          console.log(`   📖 Preview: "${preview}..."`);
        } else {
          console.log(`   ❌ Sin extractedData`);
        }
        
        console.log('');
      });

      // Analysis
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🔬 ANÁLISIS DE PATRONES:\n');

      // File size analysis
      const avgSuccessSize = successful.reduce((sum, d) => 
        sum + (d.metadata?.originalFileSize || 0), 0) / successful.length;
      const avgFailedSize = failed.reduce((sum, d) => 
        sum + (d.metadata?.originalFileSize || 0), 0) / failed.length;

      console.log('📏 TAMAÑO DE ARCHIVOS:');
      console.log(`   Exitosos (promedio): ${(avgSuccessSize / 1024).toFixed(2)} KB`);
      console.log(`   Fallidos (promedio): ${(avgFailedSize / 1024).toFixed(2)} KB`);
      
      if (avgFailedSize > avgSuccessSize * 2) {
        console.log('   ⚠️  Los archivos fallidos son significativamente más grandes');
        console.log('   💡 Solución: Archivos grandes pueden necesar modelo Pro');
      }
      console.log('');

      // Model usage
      const successModels = successful.map(d => d.metadata?.model).filter(Boolean);
      const failedModels = failed.map(d => d.metadata?.model).filter(Boolean);
      
      console.log('🤖 MODELOS USADOS:');
      console.log(`   Exitosos: ${[...new Set(successModels)].join(', ') || 'ninguno'}`);
      console.log(`   Fallidos: ${[...new Set(failedModels)].join(', ') || 'ninguno'}`);
      console.log('');

      // Common errors
      const errorMessages = failed
        .filter(d => d.error?.message)
        .map(d => d.error!.message);
      
      if (errorMessages.length > 0) {
        console.log('📝 MENSAJES DE ERROR COMUNES:');
        [...new Set(errorMessages)].forEach(msg => {
          const count = errorMessages.filter(m => m === msg).length;
          console.log(`   • "${msg}" (${count} veces)`);
        });
        console.log('');
      }
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('💡 RECOMENDACIONES GENERALES:\n');
    console.log('1. Para PDFs grandes (>1 MB): Usa modelo Pro');
    console.log('2. Para PDFs escaneados: Asegúrate que tengan OCR o usa Pro');
    console.log('3. Si extractedData está vacío pero status=active:');
    console.log('   → Re-extrae el documento con configuración diferente');
    console.log('4. Aumenta maxOutputTokens si el documento es muy largo');
    console.log('   → Default: 8192, puedes probar con 16384 o 32768');
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }

  process.exit(0);
}

compareDocuments();

