import { firestore } from './src/lib/firestore';

async function check() {
  // Find M001 agent
  const agents = await firestore.collection('conversations').get();
  
  console.log('🔍 Buscando agente M001 en', agents.size, 'conversations\n');
  
  agents.docs.forEach(doc => {
    const data = doc.data();
    if (data.title && data.title.includes('M001')) {
      console.log('📌 Encontrado:');
      console.log('   ID:', doc.id);
      console.log('   Title:', data.title);
      console.log('   isAgent:', data.isAgent);
      console.log('');
    }
  });
  
  // Check what was in the assignment request
  console.log('🔍 El agente que se usó en la asignación:');
  console.log('   ID que el frontend envió:', 'CpB6tE5DvjzgHI3FvpU2');
  console.log('');
  
  // Verify one document
  const testDoc = await firestore.collection('context_sources')
    .where('name', '==', 'DDU-518-con-anexos.pdf')
    .limit(1)
    .get();
  
  if (!testDoc.empty) {
    const data = testDoc.docs[0].data();
    console.log('📄 DDU-518-con-anexos.pdf:');
    console.log('   assignedToAgents:', data.assignedToAgents);
    console.log('   updatedAt:', data.updatedAt?.toDate?.());
    console.log('');
    
    if (data.assignedToAgents && data.assignedToAgents.length > 0) {
      console.log('✅ TIENE asignaciones!');
      console.log('   Asignado a:', data.assignedToAgents);
    } else {
      console.log('❌ NO tiene asignaciones (array vacío o undefined)');
    }
  }
  
  process.exit(0);
}

check();
