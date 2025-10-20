import { firestore } from '../src/lib/firestore.js';

console.log('🔍 Verificando documentos subidos via CLI...\n');

const docs = await firestore
  .collection('context_sources')
  .where('userId', '==', '114671162830729001607')
  .where('metadata.uploadedVia', '==', 'cli')
  .orderBy('addedAt', 'desc')
  .limit(15)
  .get();

console.log(`📊 Encontrados ${docs.size} documentos subidos via CLI:\n`);

docs.forEach((doc, index) => {
  const data = doc.data();
  console.log(`${index + 1}. 📄 ${data.name}`);
  console.log(`   🔑 ID: ${doc.id}`);
  console.log(`   ☁️  GCS: ${data.metadata?.gcsPath || 'N/A'}`);
  console.log(`   📝 Caracteres: ${(data.metadata?.charactersExtracted || 0).toLocaleString()}`);
  console.log(`   🤖 Modelo: ${data.metadata?.model || 'N/A'}`);
  console.log(`   💰 Costo: $${(data.metadata?.estimatedCost || 0).toFixed(6)}`);
  console.log(`   📅 Fecha: ${data.addedAt?.toDate().toLocaleString('es-ES') || 'N/A'}`);
  console.log(`   👁️  Preview: ${(data.extractedData || '').substring(0, 150)}...`);
  console.log('');
});

const totalChars = docs.docs.reduce((sum, doc) => sum + (doc.data().metadata?.charactersExtracted || 0), 0);
const totalCost = docs.docs.reduce((sum, doc) => sum + (doc.data().metadata?.estimatedCost || 0), 0);

console.log('═'.repeat(70));
console.log('📊 TOTALES:');
console.log(`   Documentos: ${docs.size}`);
console.log(`   Caracteres: ${totalChars.toLocaleString()}`);
console.log(`   Costo Total: $${totalCost.toFixed(6)}`);
console.log('═'.repeat(70));

console.log('\n💡 Ver en Firebase Console:');
console.log('   https://console.firebase.google.com/project/gen-lang-client-0986191192/firestore/data/~2Fcontext_sources');

console.log('\n💡 Ver en GCP Storage:');
console.log('   https://console.cloud.google.com/storage/browser/gen-lang-client-0986191192-context-documents');

process.exit(0);

