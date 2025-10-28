import { Firestore } from '@google-cloud/firestore';

const firestore = new Firestore({
  projectId: 'gen-lang-client-0986191192'
});

const COLLECTIONS = {
  CONVERSATIONS: 'conversations',
  CONTEXT_SOURCES: 'context_sources',
  CONVERSATION_CONTEXT: 'conversation_context'
};

async function checkS001Context() {
  console.log('🔍 Verificando contexto del agente S001...\n');
  
  try {
    // 1. Find S001 agent
    const convs = await firestore.collection(COLLECTIONS.CONVERSATIONS)
      .where('title', '==', 'GESTION BODEGAS GPT (S001)')
      .get();
    
    if (convs.empty) {
      console.log('❌ No se encontró agente con título "GESTION BODEGAS GPT (S001)"');
      console.log('   Buscando por patrón parcial...\n');
      
      const allConvs = await firestore.collection(COLLECTIONS.CONVERSATIONS)
        .get();
      
      const s001Convs = allConvs.docs.filter(doc => 
        doc.data().title?.includes('S001') || doc.data().title?.includes('BODEGAS')
      );
      
      if (s001Convs.length > 0) {
        console.log('📝 Agentes encontrados con patrón similar:');
        s001Convs.forEach(doc => {
          console.log(`   - ${doc.data().title} (ID: ${doc.id})`);
        });
      }
      process.exit(1);
    }
    
    const s001Doc = convs.docs[0];
    const s001Id = s001Doc.id;
    const s001Data = s001Doc.data();
    
    console.log('✅ Agente encontrado:', s001Id);
    console.log('   Título:', s001Data.title);
    console.log('   activeContextSourceIds:', s001Data.activeContextSourceIds || '(campo vacío)');
    console.log();
    
    // 2. Check conversation_context
    const contextDoc = await firestore.collection(COLLECTIONS.CONVERSATION_CONTEXT)
      .doc(s001Id)
      .get();
    
    if (contextDoc.exists) {
      const contextData = contextDoc.data();
      console.log('✅ conversation_context existe');
      console.log('   activeContextSourceIds:', contextData?.activeContextSourceIds || '(vacío)');
      console.log('   Cantidad:', contextData?.activeContextSourceIds?.length || 0);
    } else {
      console.log('❌ conversation_context NO existe para este agente');
    }
    console.log();
    
    // 3. Check assigned sources
    const sources = await firestore.collection(COLLECTIONS.CONTEXT_SOURCES)
      .where('assignedToAgents', 'array-contains', s001Id)
      .get();
    
    console.log(`📄 Fuentes asignadas a S001: ${sources.size}`);
    if (sources.size > 0) {
      sources.docs.forEach(doc => {
        const data = doc.data();
        console.log(`   ✅ ${data.name}`);
        console.log(`      ID: ${doc.id}`);
        console.log(`      Tipo: ${data.type}`);
        console.log(`      Extractado: ${data.extractedData ? 'Sí' : 'No'}`);
        console.log(`      Tamaño: ${data.extractedData?.length || 0} chars`);
        console.log();
      });
    } else {
      console.log('   ⚠️  No hay fuentes asignadas a este agente');
      console.log();
      
      // Check all sources for this user
      const allUserSources = await firestore.collection(COLLECTIONS.CONTEXT_SOURCES)
        .where('userId', '==', s001Data.userId)
        .get();
      
      console.log(`📚 Fuentes totales del usuario: ${allUserSources.size}`);
      if (allUserSources.size > 0) {
        console.log('   Fuentes disponibles para asignar:');
        allUserSources.docs.forEach(doc => {
          const data = doc.data();
          console.log(`   - ${data.name} (ID: ${doc.id})`);
        });
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkS001Context();

