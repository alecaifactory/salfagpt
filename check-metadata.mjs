import { firestore } from './src/lib/firestore.ts';

const sourceId = 'LqZZrXNqK5zKKl26rwXZ';

const doc = await firestore.collection('context_sources').doc(sourceId).get();
const data = doc.data();

console.log('📋 Source:', data.name);
console.log('🔍 Metadata:');
console.log('  storagePath:', data.metadata?.storagePath);
console.log('  gcsPath:', data.metadata?.gcsPath);
console.log('  bucketName:', data.metadata?.bucketName);
console.log('  agentId:', data.metadata?.agentId);
console.log('\n📊 Full metadata keys:');
console.log(Object.keys(data.metadata || {}));

process.exit(0);
