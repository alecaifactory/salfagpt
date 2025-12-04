import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const app = initializeApp({ projectId: 'salfagpt' });
const db = getFirestore(app);

// Buscar documento exacto
const snapshot = await db.collection('context_sources')
  .where('name', '==', 'GOP-P-PCO-2.1.PROCEDIMIENTO ENTREGA OBRA A POST VENTA-(V.0).pdf')
  .get();

console.log('📄 Documento exacto encontrado:', snapshot.size);

if (snapshot.empty) {
  console.log('⚠️ Documento no encontrado con nombre exacto');
  console.log('🔍 Buscando similar...');
  
  const similar = await db.collection('context_sources')
    .where('name', '>=', 'GOP-P-PCO-2.1.PROCEDIMIENTO ENTREGA')
    .where('name', '<=', 'GOP-P-PCO-2.1.PROCEDIMIENTO ENTREGA\uf8ff')
    .get();
  
  console.log('Similares encontrados:', similar.size);
  similar.docs.forEach(doc => {
    const data = doc.data();
    console.log('  -', doc.id, data.name);
  });
}

snapshot.docs.forEach(doc => {
  const data = doc.data();
  console.log('\n✅ Documento encontrado:', {
    id: doc.id,
    name: data.name,
    userId: data.userId,
    assignedToAgents: data.assignedToAgents?.length || 0,
    firstAgents: data.assignedToAgents?.slice(0, 5) || []
  });
});

process.exit(0);
