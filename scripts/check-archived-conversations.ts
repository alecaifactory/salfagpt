/**
 * Check Archived Conversations and User ID Mapping
 * 
 * Purpose: Investigate why archived items aren't showing
 * 
 * Run: npx tsx scripts/check-archived-conversations.ts
 */

import { firestore } from '../src/lib/firestore.js';

async function checkArchivedConversations() {
  console.log('🔍 Investigando conversaciones archivadas...\n');
  
  try {
    // 1. Verificar usuarios
    console.log('1️⃣  USUARIOS EN SISTEMA:');
    console.log('========================\n');
    
    const users = await firestore.collection('users').get();
    const userMap = new Map();
    
    users.docs.forEach(doc => {
      const data = doc.data();
      userMap.set(doc.id, data);
      console.log(`Usuario:`);
      console.log(`  Doc ID: ${doc.id}`);
      console.log(`  Email: ${data.email}`);
      console.log(`  googleUserId: ${data.googleUserId || 'N/A'}`);
      console.log(`  Tipo: ${doc.id.startsWith('usr_') ? 'hashId ✅' : 'legacy 🔧'}`);
      console.log('');
    });
    
    // 2. Verificar conversaciones archivadas
    console.log('\n2️⃣  CONVERSACIONES ARCHIVADAS:');
    console.log('==============================\n');
    
    const archived = await firestore
      .collection('conversations')
      .where('status', '==', 'archived')
      .get();
    
    console.log(`Total conversaciones archivadas: ${archived.size}\n`);
    
    if (archived.size === 0) {
      console.log('⚠️  No hay conversaciones con status: "archived"\n');
      
      // Verificar si hay conversaciones en general
      const allConvs = await firestore
        .collection('conversations')
        .limit(10)
        .get();
      
      console.log(`Total conversaciones (primeras 10): ${allConvs.size}`);
      allConvs.docs.forEach(doc => {
        const data = doc.data();
        console.log(`  - ${data.title || 'Sin título'}`);
        console.log(`    Status: ${data.status || 'undefined (=active)'}`);
        console.log(`    userId: ${data.userId}`);
        console.log('');
      });
    } else {
      // Analizar formato de userIds en archivados
      const formatAnalysis = {
        hashFormat: [] as any[],
        googleFormat: [] as any[],
        emailFormat: [] as any[],
        other: [] as any[]
      };
      
      archived.docs.forEach(doc => {
        const data = doc.data();
        const userId = data.userId;
        const item = {
          id: doc.id,
          title: data.title || 'Sin título',
          userId,
          isAgent: data.isAgent,
          isAlly: data.isAlly,
          folderId: data.folderId,
          archivedFolder: data.archivedFolder || 'N/A',
          archivedAt: data.archivedAt || 'N/A',
        };
        
        if (userId.startsWith('usr_')) {
          formatAnalysis.hashFormat.push(item);
        } else if (userId.match(/^\d+$/)) {
          formatAnalysis.googleFormat.push(item);
        } else if (userId.includes('_')) {
          formatAnalysis.emailFormat.push(item);
        } else {
          formatAnalysis.other.push(item);
        }
      });
      
      console.log('📊 ANÁLISIS DE FORMATOS:\n');
      console.log(`✅ Hash format (usr_xxx): ${formatAnalysis.hashFormat.length}`);
      console.log(`🔧 Google OAuth numeric: ${formatAnalysis.googleFormat.length}`);
      console.log(`🔧 Email-based: ${formatAnalysis.emailFormat.length}`);
      console.log(`⚠️  Otro formato: ${formatAnalysis.other.length}\n`);
      
      // Mostrar muestras de cada formato
      if (formatAnalysis.hashFormat.length > 0) {
        console.log('\n✅ Archivos con hashId (CORRECTO):');
        formatAnalysis.hashFormat.slice(0, 3).forEach(item => {
          console.log(`  - ${item.title}`);
          console.log(`    userId: ${item.userId}`);
          console.log(`    Category: ${item.archivedFolder}`);
        });
      }
      
      if (formatAnalysis.googleFormat.length > 0) {
        console.log('\n🔧 Archivos con Google OAuth ID (NECESITA MAPEO):');
        formatAnalysis.googleFormat.slice(0, 5).forEach(item => {
          console.log(`  - ${item.title}`);
          console.log(`    userId: ${item.userId}`);
          console.log(`    Category: ${item.archivedFolder}`);
          
          // Buscar mapping
          let foundUser = null;
          userMap.forEach((userData, docId) => {
            if (userData.googleUserId === item.userId) {
              foundUser = { docId, email: userData.email };
            }
          });
          
          if (foundUser) {
            console.log(`    ✅ Mapeo encontrado: ${item.userId} → ${foundUser.docId} (${foundUser.email})`);
          } else {
            console.log(`    ❌ NO SE ENCONTRÓ MAPEO`);
          }
        });
      }
      
      if (formatAnalysis.emailFormat.length > 0) {
        console.log('\n🔧 Archivos con email-based ID (NECESITA MAPEO):');
        formatAnalysis.emailFormat.slice(0, 3).forEach(item => {
          console.log(`  - ${item.title}`);
          console.log(`    userId: ${item.userId}`);
          console.log(`    Category: ${item.archivedFolder}`);
        });
      }
    }
    
    console.log('\n✅ Análisis completo');
    
  } catch (error) {
    console.error('\n❌ Error:', error);
    throw error;
  }
}

checkArchivedConversations()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  });


