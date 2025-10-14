#!/usr/bin/env tsx
/**
 * Script para Inspeccionar el Contenido Completo de un Documento
 * 
 * Muestra TODOS los detalles de un context source específico
 * incluyendo el extractedData completo.
 * 
 * Uso: npx tsx scripts/inspect-document-content.ts [nombre-del-documento]
 */

import { firestore } from '../src/lib/firestore.js';

const documentName = process.argv[2] || 'SOC 2  eBook.pdf';

async function inspectDocument() {
  console.log(`🔍 Inspeccionando: "${documentName}"`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    // Search for document by name
    const snapshot = await firestore
      .collection('context_sources')
      .where('name', '==', documentName)
      .get();

    if (snapshot.empty) {
      console.log(`❌ No se encontró el documento "${documentName}" en Firestore`);
      console.log('\n📋 Documentos disponibles:');
      
      const allDocs = await firestore
        .collection('context_sources')
        .orderBy('addedAt', 'desc')
        .limit(10)
        .get();
      
      allDocs.docs.forEach((doc, i) => {
        console.log(`   ${i + 1}. ${doc.data().name}`);
      });
      
      process.exit(1);
    }

    // Display all found documents with this name
    console.log(`✅ Encontrados ${snapshot.size} documento(s) con este nombre:\n`);

    snapshot.docs.forEach((doc, index) => {
      const data = doc.data();
      
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`📄 DOCUMENTO #${index + 1}`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

      console.log(`🆔 ID: ${doc.id}`);
      console.log(`📛 Nombre: ${data.name}`);
      console.log(`📄 Tipo: ${data.type}`);
      console.log(`🎯 Estado: ${data.status}`);
      console.log(`👤 Usuario: ${data.userId}`);
      console.log(`📅 Subido: ${data.addedAt?.toDate?.() || data.addedAt}`);
      console.log(`🔧 Fuente: ${data.source || 'unknown'}`);
      
      if (data.assignedToAgents && data.assignedToAgents.length > 0) {
        console.log(`🤖 Asignado a agentes: ${data.assignedToAgents.join(', ')}`);
      }

      console.log('');

      // METADATA
      if (data.metadata && Object.keys(data.metadata).length > 0) {
        console.log('📊 METADATA:');
        Object.entries(data.metadata).forEach(([key, value]) => {
          console.log(`   • ${key}: ${value}`);
        });
        console.log('');
      } else {
        console.log('⚠️  NO hay metadata de extracción\n');
      }

      // ERROR
      if (data.error) {
        console.log('❌ ERROR:');
        console.log(`   Mensaje: ${data.error.message}`);
        if (data.error.details) {
          console.log(`   Detalles: ${data.error.details}`);
        }
        if (data.error.timestamp) {
          const errorDate = data.error.timestamp.toDate ? 
            data.error.timestamp.toDate() : 
            new Date(data.error.timestamp);
          console.log(`   Timestamp: ${errorDate.toLocaleString('es-ES')}`);
        }
        console.log('');
      }

      // PROGRESS
      if (data.progress) {
        console.log('📊 PROGRESO:');
        console.log(`   Etapa: ${data.progress.stage}`);
        console.log(`   Porcentaje: ${data.progress.percentage}%`);
        console.log(`   Mensaje: ${data.progress.message}`);
        console.log('');
      }

      // EXTRACTED DATA
      console.log('📖 CONTENIDO EXTRAÍDO:');
      if (data.extractedData) {
        const length = data.extractedData.length;
        console.log(`   ✅ ${length.toLocaleString()} caracteres extraídos\n`);
        
        console.log('   📝 PRIMEROS 500 CARACTERES:');
        console.log('   ┌────────────────────────────────────────────────────┐');
        const preview = data.extractedData.substring(0, 500);
        preview.split('\n').forEach(line => {
          console.log(`   │ ${line}`);
        });
        if (length > 500) {
          console.log(`   │ ... (${length - 500} caracteres más)`);
        }
        console.log('   └────────────────────────────────────────────────────┘');
        console.log('');

        // Analyze content
        const lines = data.extractedData.split('\n');
        const words = data.extractedData.split(/\s+/).filter(w => w.length > 0);
        const hasCode = data.extractedData.includes('```');
        const hasTables = data.extractedData.includes('|');
        const hasHeadings = /^#+\s/m.test(data.extractedData);

        console.log('   📊 ANÁLISIS DEL CONTENIDO:');
        console.log(`      • Líneas totales: ${lines.length}`);
        console.log(`      • Palabras: ${words.length}`);
        console.log(`      • Bloques de código: ${hasCode ? 'Sí' : 'No'}`);
        console.log(`      • Tablas: ${hasTables ? 'Sí' : 'No'}`);
        console.log(`      • Encabezados: ${hasHeadings ? 'Sí' : 'No'}`);
        
        // Check if content looks valid
        if (length < 100) {
          console.log(`      ⚠️  ADVERTENCIA: Muy poco contenido extraído (< 100 caracteres)`);
        }
        if (data.extractedData.includes('error') || data.extractedData.includes('failed')) {
          console.log(`      ⚠️  ADVERTENCIA: El texto contiene palabras de error`);
        }
        
        console.log('');
      } else {
        console.log('   ❌ NO HAY CONTENIDO EXTRAÍDO');
        console.log('   ⚠️  El documento se guardó pero la extracción falló o está vacía\n');
      }

      console.log('');
    });

    console.log('\n💡 DIAGNÓSTICO:');
    
    const problematicDocs = snapshot.docs.filter(doc => {
      const data = doc.data();
      return !data.extractedData || data.extractedData.length < 100 || data.status === 'error';
    });

    if (problematicDocs.length > 0) {
      console.log('   ⚠️  Se encontraron documentos con problemas:');
      problematicDocs.forEach(doc => {
        const data = doc.data();
        console.log(`      • ${data.name}: ${!data.extractedData ? 'Sin contenido' : `Contenido muy corto (${data.extractedData.length} chars)`}`);
      });
      console.log('\n   🔧 SOLUCIONES:');
      console.log('      1. Re-extraer con modelo Pro (más preciso)');
      console.log('      2. Verificar que el PDF no esté escaneado (imagen)');
      console.log('      3. Verificar que el PDF no esté protegido/encriptado');
      console.log('      4. Intentar con un límite mayor de tokens (maxOutputTokens)');
    } else {
      console.log('   ✅ Todos los documentos tienen contenido extraído correctamente');
    }

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }

  process.exit(0);
}

inspectDocument();



