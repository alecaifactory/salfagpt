import { firestore } from './src/lib/firestore';

async function verify() {
  console.log('🔍 Verificando asignaciones en Firestore\n');
  
  // 1. Get agent M001
  const agentSnap = await firestore.collection('conversations').where('title', '==', 'M001').limit(1).get();
  
  if (agentSnap.empty) {
    console.log('❌ Agente M001 no encontrado');
    return;
  }
  
  const agentId = agentSnap.docs[0].id;
  console.log('✅ Agent M001 ID:', agentId, '\n');
  
  // 2. Count assigned sources
  const assigned = await firestore.collection('context_sources').where('assignedToAgents', 'array-contains', agentId).get();
  
  console.log('📊 TOTAL sources asignados a M001:', assigned.size);
  console.log('📋 Primeros 10:');
  assigned.docs.slice(0, 10).forEach((doc, i) => {
    console.log('  ', (i+1) + '.', doc.data().name);
  });
  
  if (assigned.size > 10) {
    console.log('   ... y', assigned.size - 10, 'más\n');
  }
  
  // 3. Check recent 4
  console.log('\n🔍 Verificando 4 documentos recientes:');
  const recent = ['DDU-518-con-anexos.pdf', 'Cir110.pdf'];
  
  for (const name of recent) {
    const snap = await firestore.collection('context_sources').where('name', '==', name).limit(1).get();
    if (!snap.empty) {
      const data = snap.docs[0].data();
      const has = (data.assignedToAgents || []).includes(agentId);
      console.log(has ? '✅' : '❌', name, '- Asignado?', has);
    }
  }
  
  process.exit(0);
}

verify().catch(e => { console.error(e); process.exit(1); });
