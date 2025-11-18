/**
 * Diagnose Archive User ID Mismatch
 * 
 * Purpose: Find why archived conversations aren't showing for current user
 * 
 * Run: npx tsx scripts/diagnose-archive-userid.ts <currentUserId>
 */

import { firestore } from '../src/lib/firestore.js';

async function diagnoseArchiveUserId(currentUserId?: string) {
  console.log('🔍 DIAGNÓSTICO COMPLETO DE USER IDS\n');
  console.log('===================================\n');
  
  try {
    // 1. Verificar usuario actual
    if (currentUserId) {
      console.log(`1️⃣  USUARIO ACTUAL: ${currentUserId}\n`);
      
      const userDoc = await firestore.collection('users').doc(currentUserId).get();
      if (userDoc.exists) {
        const data = userDoc.data();
        console.log('✅ Usuario encontrado:');
        console.log(`   Email: ${data.email}`);
        console.log(`   googleUserId: ${data.googleUserId || 'N/A'}`);
        console.log(`   Formato: ${currentUserId.startsWith('usr_') ? 'hashId ✅' : 'legacy'}\n`);
      } else {
        console.log(`❌ Usuario ${currentUserId} NO encontrado en Firestore\n`);
      }
      
      // 2. Buscar conversaciones con este userId
      console.log(`2️⃣  CONVERSACIONES DEL USUARIO (${currentUserId}):\n`);
      
      const userConvs = await firestore
        .collection('conversations')
        .where('userId', '==', currentUserId)
        .get();
      
      console.log(`Total conversaciones: ${userConvs.size}`);
      console.log(`  Activas: ${userConvs.docs.filter(d => d.data().status !== 'archived').length}`);
      console.log(`  Archivadas: ${userConvs.docs.filter(d => d.data().status === 'archived').length}\n`);
      
      if (userConvs.docs.filter(d => d.data().status === 'archived').length > 0) {
        console.log('Conversaciones archivadas de este usuario:');
        userConvs.docs
          .filter(d => d.data().status === 'archived')
          .slice(0, 10)
          .forEach(doc => {
            const data = doc.data();
            console.log(`  - ${data.title || 'Sin título'}`);
            console.log(`    Category: ${data.archivedFolder || 'N/A'}`);
            console.log(`    isAgent: ${data.isAgent || false}`);
            console.log(`    userId: ${data.userId}`);
          });
      }
    }
    
    // 3. Analizar TODAS las conversaciones archivadas y sus userIds
    console.log('\n3️⃣  ANÁLISIS DE TODAS LAS CONVERSACIONES ARCHIVADAS:\n');
    
    const allArchived = await firestore
      .collection('conversations')
      .where('status', '==', 'archived')
      .get();
    
    console.log(`Total archivadas en sistema: ${allArchived.size}\n`);
    
    // Agrupar por userId
    const byUserId = new Map();
    
    allArchived.docs.forEach(doc => {
      const data = doc.data();
      const userId = data.userId;
      
      if (!byUserId.has(userId)) {
        byUserId.set(userId, {
          count: 0,
          format: userId.startsWith('usr_') ? 'hashId' : userId.match(/^\d+$/) ? 'googleId' : 'emailBased',
          samples: []
        });
      }
      
      const entry = byUserId.get(userId);
      entry.count++;
      if (entry.samples.length < 3) {
        entry.samples.push({
          title: data.title || 'Sin título',
          category: data.archivedFolder || 'N/A',
          isAgent: data.isAgent || false
        });
      }
    });
    
    console.log('Distribución por userId:\n');
    
    const sortedEntries = Array.from(byUserId.entries())
      .sort((a, b) => b[1].count - a[1].count);
    
    sortedEntries.forEach(([userId, info]) => {
      console.log(`userId: ${userId}`);
      console.log(`  Formato: ${info.format}`);
      console.log(`  Count: ${info.count} archivados`);
      
      // Check if this userId exists in users collection
      info.samples.forEach(s => {
        console.log(`    - ${s.title} (${s.category})`);
      });
      console.log('');
    });
    
    // 4. Verificar si hay conversaciones con googleUserId que necesitan migración
    console.log('\n4️⃣  CONVERSACIONES QUE NECESITAN MIGRACIÓN:\n');
    
    const needsMigration = sortedEntries.filter(([userId, info]) => info.format !== 'hashId');
    
    if (needsMigration.length === 0) {
      console.log('✅ Todas las conversaciones ya usan hashId\n');
    } else {
      console.log(`⚠️  ${needsMigration.length} usuarios con formato legacy:\n`);
      
      for (const [legacyUserId, info] of needsMigration) {
        // Buscar el hashId correspondiente
        let hashId = null;
        
        if (info.format === 'googleId') {
          const userByGoogle = await firestore
            .collection('users')
            .where('googleUserId', '==', legacyUserId)
            .limit(1)
            .get();
          
          if (!userByGoogle.empty) {
            hashId = userByGoogle.docs[0].id;
          }
        }
        
        console.log(`  ${legacyUserId} (${info.format})`);
        console.log(`    → Debe migrar a: ${hashId || '❌ NO ENCONTRADO'}`);
        console.log(`    Conversaciones afectadas: ${info.count}`);
        console.log('');
      }
    }
    
    console.log('\n✅ Diagnóstico completo');
    
  } catch (error) {
    console.error('\n❌ Error:', error);
    throw error;
  }
}

// Get userId from command line
const userId = process.argv[2];

diagnoseArchiveUserId(userId)
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  });





