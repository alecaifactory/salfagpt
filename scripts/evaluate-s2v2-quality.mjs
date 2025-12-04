import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

initializeApp({
  credential: applicationDefault(),
  projectId: 'salfagpt'
});

const db = getFirestore();

const AGENT_ID = '1lgr33ywq5qed67sqCYi';
const AGENT_NAME = 'Maqsa Mantenimiento (S2-v2)';

// Test evaluations from the provided JSON
const EVALUACIONES = [
  {
    id: 1,
    expected_question: "Indícame qué filtros debo utilizar para una mantención de 2000 horas para una grúa Sany CR900C.",
    expected_answer_quality: "Debe entregar una respuesta completa basada en documentación técnica disponible. Si no existe la información, debe explicar claramente qué documento falta, ofrecer alternativas válidas y evitar respuestas incompletas.",
    expected_answer_format: "Respuesta técnica con: 1) Lista de filtros, 2) referencias al manual, 3) recomendaciones prácticas, 4) pasos a seguir si falta documentación."
  },
  {
    id: 2,
    expected_question: "Camión tolva 10163090 TCBY-56 indica en el panel 'forros de frenos desgastados'.",
    expected_answer_quality: "Debe relacionar correctamente la condición con documentación disponible o modelos equivalentes, explicar el riesgo operativo y entregar pasos concretos de acción inmediata.",
    expected_answer_format: "Formato explicativo con: 1) Significado del mensaje, 2) riesgos, 3) acciones recomendadas, 4) referencias técnicas si existen."
  },
  {
    id: 3,
    expected_question: "¿Cuánto torque se debe aplicar a las ruedas del camión tolva 10163090 TCBY-56 y cuál es el procedimiento correcto?",
    expected_answer_quality: "Debe confirmar si existe documentación específica del modelo. Si no existe, usar valores de referencia con advertencias claras. No debe asumir equivalencias sin explicarlas.",
    expected_answer_format: "Formato técnico con: 1) torque específico o referencial, 2) secuencia de apriete, 3) advertencias, 4) notas sobre falta de manual específico."
  },
  {
    id: 4,
    expected_question: "¿Cada cuántas horas se debe cambiar el aceite hidráulico en un camión pluma SCANIA P450 B 6x4?",
    expected_answer_quality: "Debe entregar el intervalo exacto cuando el fabricante lo define. Si no existe información, debe explicar qué documento falta en lugar de entregar respuestas extensas sin conclusión.",
    expected_answer_format: "Respuesta directa y fundamentada: 1) intervalo oficial, 2) fuente técnica, 3) pasos a seguir si el documento no está disponible."
  }
];

async function main() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║         Evaluación de Calidad - S2-v2                       ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');
  
  console.log(`📌 Agent: ${AGENT_NAME}`);
  console.log(`   ID: ${AGENT_ID}\n`);
  
  console.log('📋 PREGUNTAS DE EVALUACIÓN:\n');
  console.log('═'.repeat(80));
  
  EVALUACIONES.forEach((eval, idx) => {
    console.log(`\n${idx + 1}. ${eval.expected_question}\n`);
    console.log(`   Calidad esperada:`);
    console.log(`   ${eval.expected_answer_quality}\n`);
    console.log(`   Formato esperado:`);
    console.log(`   ${eval.expected_answer_format}\n`);
    console.log('─'.repeat(80));
  });
  
  console.log('\n\n💡 INSTRUCCIONES PARA TESTING MANUAL:\n');
  console.log('1. Abre el agente S2-v2 en la UI');
  console.log('2. Para cada pregunta arriba:');
  console.log('   a) Copia la pregunta exactamente como está');
  console.log('   b) Envíala al agente');
  console.log('   c) Evalúa la respuesta según calidad y formato esperados');
  console.log('   d) Verifica que incluya referencias a documentos');
  console.log('3. Documenta los resultados\n');
  
  console.log('📊 CRITERIOS DE EVALUACIÓN:\n');
  console.log('Contenido:');
  console.log('  ✅ ¿Aborda completamente la pregunta?');
  console.log('  ✅ ¿La información técnica es correcta?');
  console.log('  ✅ ¿Aclara cuando falta documentación?\n');
  console.log('Formato:');
  console.log('  ✅ ¿Sigue el estilo esperado?');
  console.log('  ✅ ¿Usa la estructura solicitada?');
  console.log('  ✅ ¿Mantiene tono profesional?\n');
  console.log('Referencias:');
  console.log('  ✅ ¿Cita documentos específicos?');
  console.log('  ✅ ¿Las referencias son relevantes?');
  console.log('  ✅ ¿Incluye secciones del documento?\n');
  
  // Check current status
  console.log('🔍 ESTADO ACTUAL DEL AGENTE:\n');
  
  const agentDoc = await db.collection('conversations').doc(AGENT_ID).get();
  const agentData = agentDoc.data();
  
  console.log(`   Nombre: ${agentData.title}`);
  console.log(`   Prompt configurado: ${agentData.agentPrompt ? '✅ SÍ' : '❌ NO'}`);
  console.log(`   RAG habilitado: ${agentData.ragEnabled ? '✅ SÍ' : '❌ NO'}`);
  
  // Count sources
  const sourcesSnapshot = await db
    .collection('context_sources')
    .where('assignedToAgents', 'array-contains', AGENT_ID)
    .get();
  
  console.log(`   Sources asignados: ${sourcesSnapshot.size}`);
  
  // Count shares
  const sharesSnapshot = await db
    .collection('agent_shares')
    .where('agentId', '==', AGENT_ID)
    .get();
  
  let totalUsers = 0;
  sharesSnapshot.docs.forEach(doc => {
    const sharedWith = doc.data().sharedWith || [];
    totalUsers += sharedWith.filter(t => t.type === 'user').length;
  });
  
  console.log(`   Usuarios compartidos: ${totalUsers}\n`);
  
  console.log('✨ Listo para testing!\n');
  console.log('📝 Para hacer el testing automático con la API, usar:');
  console.log('   POST /api/conversations/${AGENT_ID}/messages');
  console.log('   Body: { message: "[pregunta]", userId: "[user_id]" }\n');
  
  process.exit(0);
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});




