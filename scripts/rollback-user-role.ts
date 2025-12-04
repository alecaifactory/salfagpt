#!/usr/bin/env tsx
/**
 * ROLLBACK: Change User Role Back to 'user'
 * 
 * Emergency rollback script to revert fdiazt@salfagestion.cl
 * from 'expert' back to 'user' role.
 * 
 * BEFORE STATE (2025-11-27 21:36:01):
 * - Role: user
 * - Roles: ['user']
 * - Permissions: user permissions
 * 
 * AFTER STATE (current):
 * - Role: expert
 * - Roles: ['expert']  
 * - Permissions: expert permissions
 * 
 * Usage:
 *   npx tsx scripts/rollback-user-role.ts
 */

import admin from 'firebase-admin';
import { ROLE_PERMISSIONS } from '../src/types/users.js';

if (!admin.apps.length) {
  admin.initializeApp({ projectId: 'salfagpt' });
}

const db = admin.firestore();

async function rollbackToUser() {
  console.log('🔄 ROLLBACK: Revirtiendo rol a USER...');
  console.log('=====================================');
  console.log('📧 Usuario: fdiazt@salfagestion.cl');
  console.log('🔙 Revertir de: expert → user');
  console.log('');

  const userId = 'usr_2uvqilsx8m7vr3evr0ch';
  const userRef = db.collection('users').doc(userId);

  try {
    // Get current state
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

    // Rollback to original 'user' role
    const userPermissions = ROLE_PERMISSIONS['user'];

    await userRef.update({
      role: 'user',
      roles: ['user'],
      permissions: userPermissions,
      updatedAt: new Date().toISOString(),
    });

    console.log('✅ Rollback completado exitosamente');
    console.log('');
    console.log('🔙 Estado restaurado:');
    console.log('   Rol: user');
    console.log('   Roles: [user]');
    console.log('   Permisos: user permissions (read-only)');
    console.log('');
    console.log('⚠️  NOTA: Usuario ahora tiene permisos limitados de nuevo');

  } catch (error) {
    console.error('❌ Error en rollback:', error);
    throw error;
  }
}

rollbackToUser()
  .then(() => {
    console.log('✅ Rollback completado');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  });

