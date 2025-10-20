#!/usr/bin/env node

/**
 * Script de Migración: Reconectar Archivos CLI con GCS
 * 
 * Problema: Archivos subidos via CLI antes de 2025-10-20 no tienen metadata.gcsPath
 * Solución: Buscar archivos en GCS y actualizar Firestore con la ruta correcta
 * 
 * Uso:
 *   npx tsx scripts/reconnect-cli-files-to-gcs.ts
 *   npx tsx scripts/reconnect-cli-files-to-gcs.ts --dry-run  # Para preview sin cambios
 */

import { Storage } from '@google-cloud/storage';
import { firestore } from '../src/lib/firestore';
import { config } from 'dotenv';

config();

const storage = new Storage({
  projectId: process.env.GOOGLE_CLOUD_PROJECT,
});

const BUCKET_NAME = `${process.env.GOOGLE_CLOUD_PROJECT}-context-documents`;
const DRY_RUN = process.argv.includes('--dry-run');

interface ReconnectionResult {
  sourceId: string;
  fileName: string;
  oldGcsPath?: string;
  newGcsPath?: string;
  matched: boolean;
  updated: boolean;
  error?: string;
}

async function main() {
  console.log('🔗 Reconectando Archivos CLI con GCS');
  console.log('====================================\n');
  
  if (DRY_RUN) {
    console.log('⚠️  DRY RUN MODE - No se harán cambios\n');
  }
  
  try {
    // 1. Get all context_sources uploaded via CLI
    console.log('📥 Cargando fuentes de contexto subidas via CLI...');
    
    const sourcesSnapshot = await firestore
      .collection('context_sources')
      .where('metadata.uploadedVia', '==', 'cli')
      .get();
    
    console.log(`✅ Encontradas ${sourcesSnapshot.size} fuentes CLI\n`);
    
    const results: ReconnectionResult[] = [];
    
    // 2. For each source, try to find matching file in GCS
    for (const doc of sourcesSnapshot.docs) {
      const data = doc.data();
      const sourceId = doc.id;
      const fileName = data.metadata?.originalFileName || data.name;
      const userId = data.userId;
      
      console.log(`🔍 Procesando: ${fileName}`);
      console.log(`   Source ID: ${sourceId}`);
      console.log(`   User ID: ${userId}`);
      
      const result: ReconnectionResult = {
        sourceId,
        fileName,
        oldGcsPath: (data.metadata as any)?.gcsPath,
        matched: false,
        updated: false,
      };
      
      // Skip if already has gcsPath
      if ((data.metadata as any)?.gcsPath) {
        console.log(`   ✓ Ya tiene gcsPath: ${(data.metadata as any).gcsPath}`);
        result.matched = true;
        result.newGcsPath = (data.metadata as any).gcsPath;
        results.push(result);
        console.log('');
        continue;
      }
      
      // Try to find file in GCS
      console.log(`   🔎 Buscando en GCS...`);
      
      // Search in cli-upload folder
      const possiblePaths = [
        `${userId}/cli-upload/${fileName}`,
        `${userId}/${fileName}`, // Fallback
      ];
      
      let foundPath: string | null = null;
      
      for (const path of possiblePaths) {
        try {
          const file = storage.bucket(BUCKET_NAME).file(path);
          const [exists] = await file.exists();
          
          if (exists) {
            foundPath = `gs://${BUCKET_NAME}/${path}`;
            console.log(`   ✅ Encontrado en GCS: ${foundPath}`);
            break;
          }
        } catch (error) {
          // Continue searching
        }
      }
      
      if (!foundPath) {
        console.log(`   ⚠️  No encontrado en GCS`);
        result.error = 'File not found in GCS';
        results.push(result);
        console.log('');
        continue;
      }
      
      result.matched = true;
      result.newGcsPath = foundPath;
      
      // 3. Update Firestore with gcsPath
      if (!DRY_RUN) {
        try {
          await firestore.collection('context_sources').doc(sourceId).update({
            'metadata.gcsPath': foundPath,
            'metadata.reconnectedAt': new Date(),
            'metadata.reconnectionScript': 'reconnect-cli-files-to-gcs.ts',
          });
          
          console.log(`   ✅ Firestore actualizado con gcsPath`);
          result.updated = true;
        } catch (error) {
          console.log(`   ❌ Error actualizando Firestore:`, error);
          result.error = error instanceof Error ? error.message : 'Unknown error';
        }
      } else {
        console.log(`   🔄 [DRY RUN] Actualizaría con: ${foundPath}`);
        result.updated = false;
      }
      
      results.push(result);
      console.log('');
    }
    
    // Summary
    console.log('\n📊 RESUMEN DE RECONEXIÓN');
    console.log('========================\n');
    
    const totalSources = results.length;
    const alreadyConnected = results.filter(r => r.oldGcsPath).length;
    const newlyMatched = results.filter(r => r.matched && !r.oldGcsPath).length;
    const updated = results.filter(r => r.updated).length;
    const notFound = results.filter(r => !r.matched).length;
    
    console.log(`Total fuentes CLI: ${totalSources}`);
    console.log(`Ya tenían gcsPath: ${alreadyConnected}`);
    console.log(`Nuevas conexiones encontradas: ${newlyMatched}`);
    if (!DRY_RUN) {
      console.log(`Actualizadas en Firestore: ${updated}`);
    }
    console.log(`No encontradas en GCS: ${notFound}\n`);
    
    // List not found
    if (notFound > 0) {
      console.log('⚠️  Archivos no encontrados en GCS:');
      results.filter(r => !r.matched).forEach(r => {
        console.log(`   - ${r.fileName} (ID: ${r.sourceId})`);
      });
      console.log('');
    }
    
    // List successful reconnections
    if (newlyMatched > 0) {
      console.log('✅ Archivos reconectados:');
      results.filter(r => r.matched && !r.oldGcsPath).forEach(r => {
        console.log(`   ✓ ${r.fileName}`);
        console.log(`     GCS: ${r.newGcsPath}`);
        console.log(`     Firestore: context_sources/${r.sourceId}`);
        if (!DRY_RUN && r.updated) {
          console.log(`     Estado: Actualizado ✓`);
        }
        console.log('');
      });
    }
    
    if (DRY_RUN) {
      console.log('\n💡 Para aplicar cambios, ejecuta sin --dry-run:');
      console.log('   npx tsx scripts/reconnect-cli-files-to-gcs.ts\n');
    } else {
      console.log('\n✅ Migración completada!');
      console.log('💡 Los archivos ahora mostrarán el link "Ver en GCS" en la webapp\n');
    }
    
  } catch (error) {
    console.error('\n❌ Error en migración:', error);
    process.exit(1);
  }
}

main();

