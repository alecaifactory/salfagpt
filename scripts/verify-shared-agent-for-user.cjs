#!/usr/bin/env node
/**
 * Script de Verificación: Agentes Compartidos para Usuario
 * 
 * Uso:
 *   node scripts/verify-shared-agent-for-user.cjs <userEmail>
 * 
 * Ejemplo:
 *   node scripts/verify-shared-agent-for-user.cjs alecdickinson@gmail.com
 */

const { Firestore } = require('@google-cloud/firestore');

const firestore = new Firestore({
  projectId: process.env.GOOGLE_CLOUD_PROJECT || 'salfagpt'
});

async function verifySharedAgents(userEmail) {
  console.log('\n🔍 Verificando agentes compartidos para:', userEmail);
  console.log('='.repeat(70));
  
  // 1. Get user
  const userSnapshot = await firestore.collection('users')
    .where('email', '==', userEmail)
    .get();
  
  if (userSnapshot.empty) {
    console.log('❌ Usuario no encontrado en Firestore');
    console.log('   Asegúrate que el usuario haya iniciado sesión al menos una vez');
    return;
  }
  
  const user = userSnapshot.docs[0];
  const userData = user.data();
  const userId = user.id;
  
  console.log('\n✅ Usuario encontrado:');
  console.log('   ID:', userId);
  console.log('   Nombre:', userData.name);
  console.log('   Email:', userData.email);
  console.log('   Rol:', userData.role);
  
  // 2. Get user's groups
  const groupsSnapshot = await firestore.collection('user_groups')
    .where('userId', '==', userId)
    .get();
  
  const groupIds = groupsSnapshot.docs.map(doc => doc.data().groupId);
  console.log('\n👥 Grupos del usuario:', groupIds.length);
  groupIds.forEach(gid => console.log('   -', gid));
  
  // 3. Find all shares that match this user
  const sharesSnapshot = await firestore.collection('agent_shares').get();
  console.log('\n📋 Total de shares en el sistema:', sharesSnapshot.size);
  
  const matchingShares = [];
  
  sharesSnapshot.forEach(doc => {
    const share = doc.data();
    
    // Check if expired
    if (share.expiresAt && share.expiresAt.toDate() < new Date()) {
      return; // Skip expired shares
    }
    
    // Check if share matches user or their groups
    const isMatch = share.sharedWith.some(target => {
      // Group match
      if (target.type === 'group') {
        return groupIds.includes(target.id);
      }
      
      // User match (by ID or email)
      if (target.type === 'user') {
        return target.id === userId || target.email === userEmail;
      }
      
      return false;
    });
    
    if (isMatch) {
      matchingShares.push({
        shareId: doc.id,
        agentId: share.agentId,
        accessLevel: share.accessLevel,
        ownerId: share.ownerId,
        expiresAt: share.expiresAt,
        sharedWith: share.sharedWith
      });
    }
  });
  
  console.log('\n✅ Shares que coinciden:', matchingShares.length);
  
  // 4. Load agent details for each share
  console.log('\n📁 Agentes compartidos:\n');
  
  for (const match of matchingShares) {
    const agentDoc = await firestore.collection('conversations').doc(match.agentId).get();
    
    if (!agentDoc.exists) {
      console.log(`⚠️ Share ${match.shareId} apunta a agente inexistente: ${match.agentId}`);
      continue;
    }
    
    const agentData = agentDoc.data();
    
    console.log('───────────────────────────────────────────────────────');
    console.log('📌 Agente:', agentData.title);
    console.log('   ID:', match.agentId);
    console.log('   Dueño ID:', match.ownerId);
    console.log('   Nivel de acceso:', match.accessLevel.toUpperCase());
    console.log('   Share ID:', match.shareId);
    
    // Show how user matches
    const matchReason = match.sharedWith.find(t => {
      if (t.type === 'group') return groupIds.includes(t.id);
      if (t.type === 'user') return t.id === userId || t.email === userEmail;
      return false;
    });
    
    if (matchReason) {
      if (matchReason.type === 'group') {
        console.log('   Compartido vía: Grupo', matchReason.id);
      } else {
        console.log('   Compartido vía: Usuario directo');
        console.log('   Match por:', matchReason.email ? 'email (' + matchReason.email + ')' : 'ID (' + matchReason.id + ')');
      }
    }
    
    if (match.expiresAt) {
      const expiry = new Date(match.expiresAt.toDate());
      const isExpired = expiry < new Date();
      console.log('   Expira:', expiry.toISOString(), isExpired ? '❌ EXPIRADO' : '✅ Vigente');
    } else {
      console.log('   Expira: Nunca (permanente)');
    }
  }
  
  console.log('───────────────────────────────────────────────────────');
  
  console.log('\n✅ Verificación completa!');
  console.log('\n💡 Próximos pasos para verificar en UI:');
  console.log('   1. Inicia sesión como', userEmail);
  console.log('   2. Navega a http://localhost:3000/chat');
  console.log('   3. Busca la sección "Agentes Compartidos" en el sidebar');
  console.log('   4. Deberías ver', matchingShares.length, 'agente(s) compartido(s)');
  console.log('\n📝 Si no aparecen, verifica:');
  console.log('   - Que el navegador tenga la sesión correcta (logout/login)');
  console.log('   - Que no haya errores en la consola del navegador');
  console.log('   - Que el userId del JWT coincida con el ID de Firestore');
  console.log('');
}

// Main execution
const userEmail = process.argv[2];

if (!userEmail) {
  console.error('❌ Error: Email de usuario requerido');
  console.error('\nUso:');
  console.error('   node scripts/verify-shared-agent-for-user.cjs <userEmail>');
  console.error('\nEjemplo:');
  console.error('   node scripts/verify-shared-agent-for-user.cjs alecdickinson@gmail.com');
  process.exit(1);
}

verifySharedAgents(userEmail).catch(err => {
  console.error('\n❌ Error:', err.message);
  console.error(err);
  process.exit(1);
});

