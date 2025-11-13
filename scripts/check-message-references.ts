import { firestore } from '../src/lib/firestore';

async function check() {
  // Get the most recent message
  const messages = await firestore
    .collection('messages')
    .orderBy('timestamp', 'desc')
    .limit(5)
    .get();
  
  console.log(`📊 Checking ${messages.size} most recent messages for references:\n`);
  
  messages.docs.forEach((doc, index) => {
    const data = doc.data();
    console.log(`${index + 1}. Message ${doc.id}`);
    console.log(`   Role: ${data.role}`);
    console.log(`   Content length: ${data.content?.text?.length || data.content?.length || 0}`);
    console.log(`   Has references field: ${!!data.references}`);
    console.log(`   References count: ${data.references?.length || 0}`);
    
    if (data.references && data.references.length > 0) {
      console.log(`   ✅ HAS REFERENCES!`);
      data.references.slice(0, 3).forEach((ref: any) => {
        console.log(`      [${ref.id}] ${ref.sourceName} - ${(ref.similarity * 100).toFixed(1)}%`);
      });
    } else {
      console.log(`   ❌ NO REFERENCES`);
    }
    console.log('');
  });
  
  process.exit(0);
}

check();
