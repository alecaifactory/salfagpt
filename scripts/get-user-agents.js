// Script to get all agents for a specific user
import { Firestore } from '@google-cloud/firestore';

const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT || 'gen-lang-client-0986191192';

const firestore = new Firestore({
  projectId: PROJECT_ID,
});

async function getUserAgents(userId) {
  try {
    console.log('\n🔍 Buscando agentes para usuario:', userId);
    console.log('📦 Proyecto:', PROJECT_ID);
    console.log('');
    
    const snapshot = await firestore
      .collection('conversations')
      .where('userId', '==', userId)
      .orderBy('lastMessageAt', 'desc')
      .get();
    
    console.log('📋 AGENTES ACTIVOS - alec@getaifactory.com\n');
    console.log('Total de agentes:', snapshot.size);
    console.log('\n');
    
    // Table header
    console.log('┌─────┬────────────────────────────────┬─────────┬──────────┬──────────────────┬─────────────────┐');
    console.log('│  #  │ Título                         │ Modelo  │ Mensajes │ Última Actividad │ ID              │');
    console.log('├─────┼────────────────────────────────┼─────────┼──────────┼──────────────────┼─────────────────┤');
    
    // Table rows
    snapshot.docs.forEach((doc, index) => {
      const data = doc.data();
      const title = (data.title || 'Sin título').padEnd(30).substring(0, 30);
      const model = (data.agentModel === 'gemini-2.5-pro' ? 'Pro' : 'Flash').padEnd(7);
      const messages = String(data.messageCount || 0).padStart(8);
      const lastActivity = data.lastMessageAt 
        ? data.lastMessageAt.toDate().toLocaleDateString('es-ES').padEnd(16)
        : 'N/A'.padEnd(16);
      const id = doc.id.substring(0, 15);
      const num = String(index + 1).padStart(3);
      
      console.log(`│ ${num} │ ${title} │ ${model} │ ${messages} │ ${lastActivity} │ ${id}... │`);
    });
    
    console.log('└─────┴────────────────────────────────┴─────────┴──────────┴──────────────────┴─────────────────┘');
    console.log('\n✅ Lista completa mostrada\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Get userId from command line or use default
const userId = process.argv[2] || '114671162830729001607';
getUserAgents(userId);

