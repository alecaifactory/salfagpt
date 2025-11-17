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
    console.log('\n❌ USUARIO NO ENCONTRADO EN FIRESTORE');
    console.log('   → Usuario debe hacer login vía OAuth primero\n');
    process.exit(0);
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
  console.log('   Roles:', JSON.stringify(userData.roles || [userData.role]));
  console.log('   Activo:', userData.isActive ? '✅ Sí' : '❌ No');
  console.log('   Último login:', userData.lastLoginAt || '❌ Nunca');
  console.log('   Google OAuth ID:', userData.googleUserId || 'No seteado');
  
  // Get user's groups
  const userGroupsSnapshot = await firestore
    .collection('group_members')
    .where('userId', '==', userId)
    .get();
  
  const userGroupIds = userGroupsSnapshot.docs.map(doc => doc.data().groupId);
  console.log('   Grupos:', userGroupIds.length > 0 ? JSON.stringify(userGroupIds) : 'Ninguno');
  
  // 2. Find agent by name
  console.log('\n🔍 BUSCANDO AGENTE:', agentName);
  console.log('─'.repeat(40));
  
  const agentSnapshot = await firestore
    .collection('conversations')
    .where('title', '==', agentName)
    .get();
  
  if (agentSnapshot.empty) {
    console.log('   ⚠️  Agente no encontrado con título exacto:', agentName);
    console.log('   → Buscando coincidencias parciales...\n');
    
    const allAgents = await firestore
      .collection('conversations')
      .get();
    
    const matches = allAgents.docs.filter(doc => {
      const title = doc.data().title || '';
      return title.toLowerCase().includes('gop') || 
             title.toLowerCase().includes('m3') ||
             title.toLowerCase().includes('gpt');
    });
    
    if (matches.length > 0) {
      console.log('   📋 Agentes similares encontrados:\n');
      for (const match of matches.slice(0, 10)) {
        console.log('      -', match.data().title, '(ID:', match.id + ')');
      }
      console.log('');
    } else {
      console.log('   ❌ No se encontraron agentes similares\n');
    }
    
    process.exit(0);
  }
  
  const agentDoc = agentSnapshot.docs[0];
  const agentData = agentDoc.data();
  const agentId = agentDoc.id;
  
  console.log('   ✅ Agente encontrado!');
  console.log('   ID:', agentId);
  console.log('   Título:', agentData.title);
  console.log('   Dueño (userId):', agentData.userId);
  
  // 3. Check agent_shares for this agent
  console.log('\n🔍 VERIFICANDO COMPARTIDOS (agent_shares):');
  console.log('─'.repeat(40));
  
  const sharesSnapshot = await firestore
    .collection('agent_shares')
    .where('agentId', '==', agentId)
    .get();
  
  console.log(`   Total shares para este agente: ${sharesSnapshot.size}\n`);
  
  if (sharesSnapshot.empty) {
    console.log('   ❌ NO HAY REGISTROS DE COMPARTIDO para este agente');
    console.log('   → El agente NO ha sido compartido con nadie');
    console.log('\n🔧 SOLUCIÓN:');
    console.log('   1. Abrir configuración del agente GOP GPT M3');
    console.log('   2. Click en "Compartir"');
    console.log('   3. Agregar usuario: dortega@novatec.cl');
    console.log('   4. Guardar\n');
  } else {
    let foundUser = false;
    let foundViaGroup = false;
    
    for (const shareDoc of sharesSnapshot.docs) {
      const shareData = shareDoc.data();
      console.log('   📌 Share Record:', shareDoc.id);
      console.log('      Owner ID:', shareData.ownerId);
      console.log('      Access Level:', shareData.accessLevel);
      console.log('      Status:', shareData.status || 'active');
      console.log('      Created:', shareData.createdAt || 'N/A');
      console.log('      Shared With:');
      
      if (shareData.sharedWith && Array.isArray(shareData.sharedWith)) {
        for (const target of shareData.sharedWith) {
          console.log('        -', target.type + ':', target.id);
          
          // Check direct user match
          if (target.type === 'user' && target.id === userId) {
            console.log('          ✅ MATCH! Usuario está aquí directamente');
            foundUser = true;
          }
          
          // Check group match
          if (target.type === 'group' && userGroupIds.includes(target.id)) {
            console.log('          ✅ MATCH! Usuario está en este grupo');
            foundViaGroup = true;
          }
        }
      } else {
        console.log('        ⚠️ sharedWith array está vacío o inválido');
      }
      console.log('');
    }
    
    // Summary
    console.log('\n📊 RESUMEN DE ACCESO:');
    console.log('─'.repeat(40));
    
    if (foundUser) {
      console.log('   ✅ Usuario tiene acceso DIRECTO al agente');
      console.log('   ✅ Compartido vía: Asignación individual');
    } else if (foundViaGroup) {
      console.log('   ✅ Usuario tiene acceso VÍA GRUPO');
      console.log('   ✅ Compartido vía: Membresía de grupo');
    } else {
      console.log('   ❌ USUARIO NO TIENE ACCESO');
      console.log('\n   📋 Usuario buscado:');
      console.log('      ID:', userId);
      console.log('      Grupos:', JSON.stringify(userGroupIds));
      console.log('\n   📋 Compartido con (en los shares):');
      for (const shareDoc of sharesSnapshot.docs) {
        const shareData = shareDoc.data();
        if (shareData.sharedWith) {
          for (const target of shareData.sharedWith) {
            console.log('      -', target.type + ':', target.id);
          }
        }
      }
      console.log('\n   ❌ NO HAY COINCIDENCIA');
      console.log('\n🔧 PROBLEMA IDENTIFICADO:');
      console.log('   El agente está compartido, pero NO con este usuario específico');
      console.log('   Los shares existentes no incluyen:', userId);
      console.log('\n🔧 SOLUCIÓN:');
      console.log('   1. Editar el share existente');
      console.log('   2. Agregar a sharedWith:', userId);
      console.log('   3. O usar UI: Compartir → Agregar usuario');
    }
  }
  
  console.log('\n');
}

investigate()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });





