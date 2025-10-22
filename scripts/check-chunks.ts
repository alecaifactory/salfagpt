import { firestore } from '../src/lib/firestore.js';

async function checkChunks() {
  try {
    const snapshot = await firestore.collection('document_chunks').limit(10).get();
    console.log('Total chunks in Firestore:', snapshot.size);
    
    if (snapshot.size > 0) {
      console.log('\nSample chunks:');
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        console.log(`  - ${data.sourceName} - chunk ${data.chunkIndex} - ${data.text.substring(0, 50)}...`);
      });
    } else {
      console.log('⚠️ No chunks found in Firestore');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkChunks();

