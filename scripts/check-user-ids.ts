#!/usr/bin/env tsx
/**
 * Verifica los IDs de usuario en ambas colecciones
 */

import { firestore } from '../src/lib/firestore.js';

async function checkUserIds() {
  console.log('🔍 Verificando IDs de usuarios...\n');

  try {
    // Check users collection
    console.log('📋 Collection: users');
    const usersSnapshot = await firestore.collection('users').get();
    
    for (const doc of usersSnapshot.docs) {
      const data = doc.data();
      if (data.email === 'alec@getaifactory.com') {
        console.log('  ✅ Encontrado en users:');
        console.log('     Document ID:', doc.id);
        console.log('     Email:', data.email);
        console.log('     Theme:', data.theme || 'undefined');
        console.log('');
      }
    }

    // Check user_settings collection
    console.log('📋 Collection: user_settings');
    const settingsSnapshot = await firestore.collection('user_settings').get();
    
    if (settingsSnapshot.empty) {
      console.log('  ⚠️ No hay documentos en user_settings');
    } else {
      settingsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        console.log('  Document ID:', doc.id);
        console.log('  User ID field:', data.userId);
        console.log('  Theme:', data.theme || 'undefined');
        console.log('');
      });
    }

    // Check what ID the app is using
    console.log('💡 El app está buscando con ID: 114671162830729001607');
    console.log('   (según los logs del servidor)');
    console.log('');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkUserIds()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  });

