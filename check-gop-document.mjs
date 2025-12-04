import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const app = initializeApp({ projectId: 'salfagpt' });
const db = getFirestore(app);

// Buscar documento GOP
const snapshot = await db.collection('context_sources')
  .where('name', '>=', 'GOP-P-PCO-2.1')
  .where('name', '<=', 'GOP-P-PCO-2.1\uf8ff')
  .limit(5)
  .get();

console.log('📄 Documentos GOP encontrados:', snapshot.size);

snapshot.docs.forEach(doc => {
  const data = doc.data();
  console.log('\n📋 Documento:', {
    id: doc.id,
    name: data.name,
    userId: data.userId,
    assignedToAgents: data.assignedToAgents?.slice(0, 3) || [],
    totalAgents: data.assignedToAgents?.length || 0
  });
});

process.exit(0);
