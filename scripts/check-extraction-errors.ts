#!/usr/bin/env tsx
/**
 * Script de Diagnóstico de Extracción de PDFs
 * 
 * Este script revisa todos los context sources en Firestore
 * y muestra el estado de extracción de cada uno, incluyendo
 * errores detallados si los hay.
 * 
 * Uso: npx tsx scripts/check-extraction-errors.ts
 */

import { firestore } from '../src/lib/firestore.js';

interface ContextSource {
  id: string;
  userId: string;
  name: string;
  type: string;
  status: 'active' | 'processing' | 'error' | 'disabled';
  extractedData?: string;
  metadata?: {
    originalFileName?: string;
    model?: string;
    extractionTime?: number;
    charactersExtracted?: number;
    tokensEstimate?: number;
  };
  error?: {
    message: string;
    details?: string;
    timestamp: any;
  };
  progress?: {
    stage: string;
    percentage: number;
    message: string;
  };
  addedAt: any;
}

async function checkExtractionErrors() {
  console.log('🔍 Diagnóstico de Extracción de Documentos');
  console.log('==========================================\n');

  try {
    // Get all context sources
    const snapshot = await firestore
      .collection('context_sources')
      .orderBy('addedAt', 'desc')
      .get();

    if (snapshot.empty) {
      console.log('📭 No se encontraron context sources en Firestore');
      process.exit(0);
    }

    console.log(`📊 Total de documentos encontrados: ${snapshot.size}\n`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Categorize by status
    const byStatus = {
      active: [] as ContextSource[],
      processing: [] as ContextSource[],
      error: [] as ContextSource[],
      disabled: [] as ContextSource[],
    };

    snapshot.docs.forEach(doc => {
      const source = doc.data() as ContextSource;
      source.id = doc.id;
      byStatus[source.status].push(source);
    });

    // Display summary
    console.log('📈 RESUMEN POR ESTADO:');
    console.log(`  ✅ Exitosos:    ${byStatus.active.length}`);
    console.log(`  ⏳ Procesando:  ${byStatus.processing.length}`);
    console.log(`  ❌ Con Errores: ${byStatus.error.length}`);
    console.log(`  🚫 Desactivados: ${byStatus.disabled.length}`);
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Display successful extractions
    if (byStatus.active.length > 0) {
      console.log('✅ DOCUMENTOS PROCESADOS EXITOSAMENTE:\n');
      byStatus.active.forEach((source, index) => {
        console.log(`${index + 1}. ${source.name}`);
        console.log(`   📄 Tipo: ${source.type.toUpperCase()}`);
        console.log(`   🆔 ID: ${source.id}`);
        
        if (source.metadata) {
          if (source.metadata.model) {
            console.log(`   🤖 Modelo: ${source.metadata.model}`);
          }
          if (source.metadata.charactersExtracted) {
            console.log(`   📝 Caracteres: ${source.metadata.charactersExtracted.toLocaleString()}`);
          }
          if (source.metadata.tokensEstimate) {
            console.log(`   🎯 Tokens estimados: ${source.metadata.tokensEstimate.toLocaleString()}`);
          }
          if (source.metadata.extractionTime) {
            console.log(`   ⏱️  Tiempo: ${source.metadata.extractionTime}ms`);
          }
        }

        if (source.extractedData) {
          const preview = source.extractedData.substring(0, 150).replace(/\n/g, ' ');
          console.log(`   📖 Preview: "${preview}..."`);
        }
        
        console.log('');
      });
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    }

    // Display errors in detail
    if (byStatus.error.length > 0) {
      console.log('❌ DOCUMENTOS CON ERRORES:\n');
      byStatus.error.forEach((source, index) => {
        console.log(`${index + 1}. ${source.name}`);
        console.log(`   📄 Tipo: ${source.type.toUpperCase()}`);
        console.log(`   🆔 ID: ${source.id}`);
        
        if (source.error) {
          console.log(`   🚨 Error: ${source.error.message}`);
          if (source.error.details) {
            console.log(`   🔍 Detalles: ${source.error.details}`);
          }
          if (source.error.timestamp) {
            const errorDate = source.error.timestamp.toDate ? 
              source.error.timestamp.toDate() : 
              new Date(source.error.timestamp);
            console.log(`   🕐 Timestamp: ${errorDate.toLocaleString('es-ES')}`);
          }
        }

        if (source.progress) {
          console.log(`   📊 Progreso: ${source.progress.percentage}% - ${source.progress.message}`);
        }

        if (source.metadata) {
          console.log(`   💾 Metadata disponible:`);
          Object.entries(source.metadata).forEach(([key, value]) => {
            console.log(`      - ${key}: ${value}`);
          });
        }

        console.log('');
      });
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    }

    // Display processing
    if (byStatus.processing.length > 0) {
      console.log('⏳ DOCUMENTOS EN PROCESAMIENTO:\n');
      byStatus.processing.forEach((source, index) => {
        console.log(`${index + 1}. ${source.name}`);
        console.log(`   📄 Tipo: ${source.type.toUpperCase()}`);
        console.log(`   🆔 ID: ${source.id}`);
        
        if (source.progress) {
          console.log(`   📊 Progreso: ${source.progress.percentage}% - ${source.progress.message}`);
          console.log(`   🎯 Etapa: ${source.progress.stage}`);
        }
        
        console.log('');
      });
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    }

    // Recommendations
    console.log('💡 RECOMENDACIONES:\n');
    
    if (byStatus.error.length > 0) {
      console.log('Para documentos con errores:');
      console.log('  1. Abre la configuración del documento (ícono ⚙️)');
      console.log('  2. Revisa el mensaje de error completo');
      console.log('  3. Intenta re-extraer con diferentes configuraciones:');
      console.log('     - Cambia de modelo (Flash ↔ Pro)');
      console.log('     - Ajusta el límite de tokens');
      console.log('     - Verifica que el archivo no esté corrupto');
      console.log('');
    }

    if (byStatus.processing.length > 0) {
      console.log('Para documentos en procesamiento:');
      console.log('  - Si llevan >5 minutos, pueden estar atascados');
      console.log('  - Recarga la página para ver el estado actualizado');
      console.log('  - Si persiste, elimina y vuelve a subir');
      console.log('');
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  } catch (error) {
    console.error('❌ Error ejecutando diagnóstico:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('Could not load the default credentials')) {
        console.log('\n💡 Solución:');
        console.log('   Ejecuta: gcloud auth application-default login');
      } else if (error.message.includes('GOOGLE_CLOUD_PROJECT')) {
        console.log('\n💡 Solución:');
        console.log('   Verifica que .env tenga: GOOGLE_CLOUD_PROJECT=gen-lang-client-0986191192');
      }
    }
    
    process.exit(1);
  }

  process.exit(0);
}

// Run
checkExtractionErrors();



