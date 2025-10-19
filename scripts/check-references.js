// Check if references are being saved to Firestore
import { firestore } from '../src/lib/firestore.js';

async function checkReferences() {
  console.log('🔍 Revisando mensajes en Firestore...\n');

  const snapshot = await firestore
    .collection('messages')
    .orderBy('timestamp', 'desc')
    .limit(10)
    .get();

  console.log('📊 Total mensajes:', snapshot.size);
  console.log('');

  let foundWithReferences = 0;

  snapshot.docs.forEach((doc, index) => {
    const data = doc.data();
    const content = typeof data.content === 'string' 
      ? data.content 
      : data.content?.text || '';
    
    const hasRefs = data.references && data.references.length > 0;
    if (hasRefs) foundWithReferences++;
    
    console.log(`${hasRefs ? '✅' : '⚠️ '} Mensaje ${index + 1}`);
    console.log('  Role:', data.role);
    console.log('  Preview:', content.substring(0, 60) + '...');
    console.log('  References:', hasRefs ? data.references.length : 'ninguna');
    
    if (hasRefs) {
      data.references.forEach(ref => {
        console.log(`    [${ref.id}] ${ref.sourceName} - ${(ref.similarity * 100).toFixed(1)}%`);
      });
    }
    console.log('');
  });

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📚 Mensajes con referencias: ${foundWithReferences} de ${snapshot.size}`);
  
  if (foundWithReferences === 0) {
    console.log('');
    console.log('⚠️  NO HAY MENSAJES CON REFERENCIAS GUARDADAS');
    console.log('');
    console.log('Posibles razones:');
    console.log('  1. Todos los mensajes son anteriores a la implementación');
    console.log('  2. RAG no está generando referencias (sin chunks indexados)');
    console.log('  3. Referencias no se están guardando (bug en addMessage)');
    console.log('');
    console.log('✅ Para generar referencias:');
    console.log('  1. Asegúrate de tener una fuente con RAG habilitado');
    console.log('  2. Verifica que tenga chunks: npm run check-chunks');
    console.log('  3. Envía un NUEVO mensaje');
    console.log('  4. Vuelve a ejecutar este script');
  }

  process.exit(0);
}

checkReferences().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});

