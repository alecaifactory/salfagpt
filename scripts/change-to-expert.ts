#!/usr/bin/env tsx
/**
 * Change User Role to Expert
 * 
 * Updates fdiazt@salfagestion.cl from 'user' to 'expert' role
 */

import admin from 'firebase-admin';
import { ROLE_PERMISSIONS } from '../src/types/users.js';

if (!admin.apps.length) {
  admin.initializeApp({ projectId: 'salfagpt' });
}

const db = admin.firestore();

async function changeToExpert() {
  console.log('👤 Cambiando rol a Expert...');
  console.log('=====================================');
  console.log('📧 Usuario: fdiazt@salfagestion.cl');
  console.log('📛 Nombre: FRANCIS ANAIS DIAZ TOBAR');
  console.log('🎭 Nuevo rol: expert');
  console.log('');

  const userId = 'usr_2uvqilsx8m7vr3evr0ch';
  const userRef = db.collection('users').doc(userId);

  try {
    // Get current user data
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      console.log('❌ Usuario no encontrado');
      return;
    }

    const currentData = userDoc.data();
    console.log('📋 Estado actual:');
    console.log(`   Rol: ${currentData?.role}`);
    console.log(`   Roles: ${currentData?.roles?.join(', ')}`);
    console.log('');

    // Get expert permissions
    const expertPermissions = ROLE_PERMISSIONS['expert'];

    // Update to expert
    await userRef.update({
      role: 'expert',
      roles: ['expert'],
      permissions: expertPermissions,
      updatedAt: new Date().toISOString(),
    });

    console.log('✅ Usuario actualizado a EXPERT exitosamente!');
    console.log('');
    console.log('🎯 Nuevos permisos habilitados:');
    console.log('');
    console.log('📚 Context Management:');
    console.log('   ✅ Crear contexto (canCreateContext)');
    console.log('   ✅ Editar contexto (canEditContext)');
    console.log('   ✅ Revisar contexto (canReviewContext)');
    console.log('   ✅ Aprobar contexto (canSignOffContext)');
    console.log('   ✅ Compartir contexto (canShareContext)');
    console.log('');
    console.log('🤖 Agent Management:');
    console.log('   ✅ Crear agentes (canCreateAgent)');
    console.log('   ✅ Editar agentes (canEditAgent)');
    console.log('   ✅ Revisar agentes (canReviewAgent)');
    console.log('   ✅ Aprobar agentes (canSignOffAgent)');
    console.log('   ✅ Compartir agentes (canShareAgent)');
    console.log('');
    console.log('📊 Advanced Features:');
    console.log('   ✅ Colaborar con otros (canCollaborate)');
    console.log('   ✅ Ver analytics (canViewAnalytics)');
    console.log('');
    console.log('💡 Francis ahora tiene permisos de experto completos!');
    console.log('💡 Puede crear, editar, revisar y aprobar contenido y agentes.');
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

changeToExpert()
  .then(() => {
    console.log('✅ Script completado');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  });

