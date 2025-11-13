import { firestore } from '../src/lib/firestore';

async function verify() {
  // Get a sample chunk
  const chunk = await firestore.collection('document_chunks')
    .where('sourceId', '==', '0wKs54A12DqZcTsXil8R')
    .limit(1)
    .get();
  
  if (!chunk.empty) {
    const data = chunk.docs[0].data();
    console.log('✅ Sample chunk after migration:');
    console.log('   userId:', data.userId);
    console.log('   googleUserId:', data.googleUserId);
    console.log('   hashedUserId:', data.hashedUserId);
    console.log('');
    console.log('📊 Verification:');
    console.log('   userId format:', data.userId?.startsWith('usr_') ? 'HASHED ✅' : 'GOOGLE (old) ❌');
  }
  
  process.exit(0);
}

verify();

