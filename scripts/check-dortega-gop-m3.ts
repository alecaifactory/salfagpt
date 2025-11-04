import { firestore } from '../src/lib/firestore';

async function investigate() {
  const email = 'dortega@novatec.cl';
  const agentName = 'GOP GPT M3';
  
  console.log('🔍 Investigando usuario y agente...\n');
  console.log('═'.repeat(80));
  console.log('👤 Usuario:', email);
  console.log('🤖 Agente:', agentName);
  console.log('═'.repeat(80));
  
  // 1. Find user
  const userSnapshot = await firestore
    .collection('users')
    .where('email', '==', email)
    .limit(1)
    .get();
  
  if (userSnapshot.empty) {
    console.log('\n❌ USUARIO NO ENCONTRADO EN FIRESTORE\n');
    return;
  }
  
  const userDoc = userSnapshot.docs[0];
  const userData = userDoc.data();
  const userId = userDoc.id;
  
  console.log('\n👤 INFORMACIÓN DEL USUARIO:');
  console.log('─'.repeat(40));
  console.log('   ID (hash):', userId);
  console.log('   Email:', userData.email);
  console.log('   Nombre:', userData.name || 'N/A');
  console.log('   Rol:', userData.role);
  console.log('   Activo:', userData.isActive ? '✅ Sí' : '❌ No');
  console.log('   Último login:', userData.lastLoginAt?.toDate?.() || userData.lastLoginAt || 'Nunca');
  console.log('   Google OAuth ID:', userData.googleUserId || 'No seteado');
  
  // Get user groups
  const groupMembersSnapshot = await firestore
    .collection('group_members')
    .where('userId', '==', userId)
    .get();
  
  const groupIds = groupMembersSnapshot.docs.map(doc => doc.data().groupId);
  console.log('   Grupos:', groupIds.length > 0 ? JSON.stringify(groupIds) : 'Ninguno');
  
  // 2. Find agent
  console.log('\n🔍 BUSCANDO AGENTE:', agentName);
  console.log('─'.repeat(40));
  
  const agentSnapshot = await firestore
    .collection('conversations')
    .where('title', '==', agentName)
    .get();
  
  if (agentSnapshot.empty) {
    console.log('   ⚠️  Agente no encontrado con título exacto');
    console.log('   Buscando variaciones...\n');
    
    const allAgents = await firestore.collection('conversations').get();
    const matches = allAgents.docs.filter(doc => {
      const title = (doc.data().title || '').toLowerCase();
      return title.includes('gop') || title.includes('m3');
    });
    
    if (matches.length > 0) {
      console.log('   📋 Agentes similares:\n');
      for (const match of matches.slice(0, 10)) {
        console.log('      -', match.data().title, '(ID:', match.id + ')');
      }
    }
    console.log('');
    return;
  }
  
  const agentDoc = agentSnapshot.docs[0];
  const agentData = agentDoc.data();
  const agentId = agentDoc.id;
  
  console.log('   ✅ Agente encontrado!');
  console.log('   ID:', agentId);
  console.log('   Título:', agentData.title);
  console.log('   Dueño:', agentData.userId);
  
  // 3. Check shares
  console.log('\n🔍 VERIFICANDO COMPARTIDOS:');
  console.log('─'.repeat(40));
  
  const sharesSnapshot = await firestore
    .collection('agent_shares')
    .where('agentId', '==', agentId)
    .get();
  
  console.log(`   Total shares: ${sharesSnapshot.size}\n`);
  
  if (sharesSnapshot.empty) {
    console.log('   ❌ Este agente NO está compartido\n');
    return;
  }
  
  let userHasAccess = false;
  let accessViaGroup = false;
  let accessDetails = null;
  
  for (const shareDoc of sharesSnapshot.docs) {
    const shareData = shareDoc.data();
    console.log('   📌 Share:', shareDoc.id);
    console.log('      Owner:', shareData.ownerId);
    console.log('      Level:', shareData.accessLevel);
    console.log('      Status:', shareData.status || 'active');
    console.log('      Compartido con:');
    
    if (shareData.sharedWith && Array.isArray(shareData.sharedWith)) {
      for (const target of shareData.sharedWith) {
        console.log('        -', target.type + ':', target.id);
        
        // Check match
        if (target.type === 'user' && target.id === userId) {
          console.log('          ✅ MATCH DIRECTO!');
          userHasAccess = true;
          accessDetails = shareData;
        }
        
        if (target.type === 'group' && groupIds.includes(target.id)) {
          console.log('          ✅ MATCH VÍA GRUPO!');
          accessViaGroup = true;
          accessDetails = shareData;
        }
      }
    }
    console.log('');
  }
  
  // Summary
  console.log('\n📊 DIAGNÓSTICO FINAL:');
  console.log('═'.repeat(80));
  
  if (userHasAccess || accessViaGroup) {
    console.log('✅ USUARIO SÍ TIENE ACCESO AL AGENTE');
    console.log('');
    console.log('   Método:', userHasAccess ? 'Asignación directa' : 'Vía grupo');
    console.log('   Nivel de acceso:', accessDetails?.accessLevel);
    console.log('   Estado del share:', accessDetails?.status || 'active');
    console.log('');
    console.log('🚨 PERO EL USUARIO NO LO VE - POSIBLES CAUSAS:');
    console.log('');
    console.log('   1️⃣  PROBLEMA EN EL FRONTEND:');
    console.log('      - El API /api/agents/shared no está devolviendo el agente');
    console.log('      - Verificar logs del navegador (Console)');
    console.log('      - Buscar: "Shared agents data" en consola');
    console.log('');
    console.log('   2️⃣  PROBLEMA DE ID MISMATCH:');
    console.log('      - JWT tiene ID diferente al hash ID');
    console.log('      - userId en JWT:', userData.googleUserId || 'N/A');
    console.log('      - userId en Firestore:', userId);
    console.log('      - API debe usar userEmail para resolver hash ID');
    console.log('');
    console.log('   3️⃣  PROBLEMA DE CACHÉ:');
    console.log('      - Usuario necesita hacer logout/login');
    console.log('      - O refrescar página (Ctrl+Shift+R)');
    console.log('');
    console.log('🔧 SOLUCIONES A PROBAR:');
    console.log('   1. Usuario hace logout y login de nuevo');
    console.log('   2. Usuario refresca con Ctrl+Shift+R (hard refresh)');
    console.log('   3. Verificar Console del navegador para errores en API');
    console.log('   4. Verificar Network tab: /api/agents/shared request');
    console.log('');
  } else {
    console.log('❌ USUARIO NO TIENE ACCESO');
    console.log('');
    console.log('   Usuario ID buscado:', userId);
    console.log('   Grupos del usuario:', JSON.stringify(groupIds));
    console.log('');
    console.log('   IDs en los shares:');
    for (const shareDoc of sharesSnapshot.docs) {
      const shareData = shareDoc.data();
      if (shareData.sharedWith) {
        shareData.sharedWith.forEach((t: any) => {
          console.log('      -', t.type + ':', t.id);
        });
      }
    }
    console.log('');
    console.log('   ❌ NO HAY COINCIDENCIA');
    console.log('');
    console.log('🔧 SOLUCIÓN:');
    console.log('   Editar el share y agregar userId:', userId);
    console.log('');
  }
}

investigate()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });

