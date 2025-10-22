import { Firestore } from '@google-cloud/firestore';

const firestore = new Firestore({
  projectId: process.env.GOOGLE_CLOUD_PROJECT || 'gen-lang-client-0986191192',
});

async function checkConversations() {
  try {
    const snapshot = await firestore
      .collection('conversations')
      .where('userId', '==', '114671162830729001607')
      .orderBy('lastMessageAt', 'desc')
      .limit(20)
      .get();
    
    console.log(`📊 Total conversaciones encontradas: ${snapshot.size}`);
    console.log('');
    
    let withIsAgent = 0;
    let withoutIsAgent = 0;
    let explicitAgents = 0;
    let explicitChats = 0;
    
    console.log('Detalle de conversaciones:');
    console.log('═'.repeat(80));
    
    snapshot.docs.forEach((doc, index) => {
      const data = doc.data();
      
      if (data.isAgent !== undefined) {
        withIsAgent++;
        if (data.isAgent === true) explicitAgents++;
        if (data.isAgent === false) explicitChats++;
      } else {
        withoutIsAgent++;
      }
      
      console.log(`${index + 1}. ${data.title}`);
      console.log(`   isAgent: ${data.isAgent !== undefined ? data.isAgent : 'undefined (legacy)'}`);
      console.log(`   agentId: ${data.agentId || 'none'}`);
      console.log(`   Mensajes: ${data.messageCount || 0}`);
      console.log('');
    });
    
    console.log('═'.repeat(80));
    console.log('Resumen:');
    console.log(`  Con campo isAgent: ${withIsAgent}`);
    console.log(`    • isAgent: true (agentes): ${explicitAgents}`);
    console.log(`    • isAgent: false (chats): ${explicitChats}`);
    console.log(`  Sin campo isAgent (legacy): ${withoutIsAgent}`);
    console.log('');
    console.log('🎯 Recomendación:');
    if (withoutIsAgent > 0) {
      console.log(`   ${withoutIsAgent} conversaciones legacy necesitan migración`);
      console.log('   Opción 1: Marcarlas todas como isAgent: true');
      console.log('   Opción 2: Cambiar filtro para excluir undefined');
    } else {
      console.log('   ✅ Todas las conversaciones tienen el campo isAgent definido');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  process.exit(0);
}

checkConversations();

