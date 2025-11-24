import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

initializeApp({ projectId: 'salfagpt' });
const db = getFirestore();

console.log('🔍 Buscando agente S1-v2...\n');

const snapshot = await db.collection('conversations')
  .where('userId', '==', 'usr_uhwqffaqag1wrryd82tw')
  .get();

let s1Found = false;

snapshot.docs.forEach(doc => {
  const data = doc.data();
  const title = data.title || '';
  
  // Buscar S1, S001, BODEGAS, GESTION BODEGAS
  if (title.includes('S1') || title.includes('S001') || 
      title.toLowerCase().includes('bodega') ||
      title.toLowerCase().includes('gestion bodega')) {
    console.log('✅ Encontrado:');
    console.log('   ID:', doc.id);
    console.log('   Title:', title);
    console.log('   Created:', data.createdAt?.toDate?.());
    console.log('   Active Sources:', data.activeContextSourceIds?.length || 0);
    console.log('');
    s1Found = true;
  }
});

if (!s1Found) {
  console.log('⚠️  No se encontró agente S1-v2');
  console.log('📋 Todos los agentes del usuario:');
  snapshot.docs.forEach(doc => {
    console.log('   -', doc.id, ':', doc.data().title);
  });
}

process.exit(0);

