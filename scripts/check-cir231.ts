import { firestore } from '../src/lib/firestore';

async function check() {
  const doc = await firestore
    .collection('context_sources')
    .doc('QLkYR6DClmOJY1tQkjBc')
    .get();

  if (doc.exists) {
    const data = doc.data();
    console.log('📄 Cir-231.pdf Metadata:');
    console.log('  uploadedVia:', data?.metadata?.uploadedVia);
    console.log('  gcsPath:', data?.metadata?.gcsPath);
    console.log('  cliVersion:', data?.metadata?.cliVersion);
    console.log('');
    console.log('Full metadata:');
    console.log(JSON.stringify(data?.metadata, null, 2));
  } else {
    console.log('❌ Document not found');
  }
  
  process.exit(0);
}

check();

