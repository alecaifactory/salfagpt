#!/usr/bin/env tsx
/**
 * Update User Role to Expert
 * 
 * Updates fdiazt@salfagestion.cl from 'user' to 'expert' role
 * with full expert permissions.
 */

import admin from 'firebase-admin';
import { ROLE_PERMISSIONS } from '../src/types/users.js';
import type { UserRole } from '../src/types/users.js';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: process.env.GOOGLE_CLOUD_PROJECT || 'salfagpt',
  });
}

const db = admin.firestore();

async function updateUserRole(
  userEmail: string,
  newRole: UserRole
) {
  console.log('👤 Actualizando rol de usuario...');
  console.log('=====================================');
  console.log(`📧 Email: ${userEmail}`);
  console.log(`🎭 Nuevo rol: ${newRole}`);
  console.log('');

  const userId = userEmail.replace(/[@.]/g, '_');
  const userRef = db.collection('users').doc(userId);

  try {
    // Get current user
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      console.log('❌ Usuario no encontrado');
      console.log(`💡 ID buscado: ${userId}`);
      return;
    }

    const currentData = userDoc.data();
    console.log(`📋 Rol actual: ${currentData?.role || 'undefined'}`);
    console.log(`📋 Roles actuales: ${(currentData?.roles || []).join(', ') || 'ninguno'}`);
    console.log('');

    // Get permissions for new role
    const newPermissions = ROLE_PERMISSIONS[newRole] || {};

    // Update user
    await userRef.update({
      role: newRole,
      roles: [newRole], // Set to single role array
      permissions: newPermissions,
      updatedAt: new Date().toISOString(),
    });

    console.log('✅ Usuario actualizado exitosamente');
    console.log('');
    console.log('📊 Nuevos permisos:');
    Object.entries(newPermissions).forEach(([perm, value]) => {
      if (value) {
        console.log(`   ✅ ${perm}`);
      }
    });
    console.log('');
    console.log('💡 El usuario puede ahora:');
    if (newRole === 'expert') {
      console.log('   ✅ Crear y editar contexto');
      console.log('   ✅ Revisar y aprobar contexto');
      console.log('   ✅ Crear y editar agentes');
      console.log('   ✅ Revisar y aprobar agentes');
      console.log('   ✅ Compartir recursos');
      console.log('   ✅ Ver analytics');
    }

  } catch (error) {
    console.error('❌ Error actualizando usuario:', error);
    throw error;
  }
}

// Update Francis to expert
updateUserRole('fdiazt@salfagestion.cl', 'expert')
  .then(() => {
    console.log('✅ Script completado');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  });

