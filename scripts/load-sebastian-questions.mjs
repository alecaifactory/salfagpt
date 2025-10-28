import { Firestore } from '@google-cloud/firestore';

const PROJECT_ID = 'salfagpt';
const BASE_URL = 'http://localhost:3000';

const firestore = new Firestore({
  projectId: PROJECT_ID
});

// Sebastian's questions for S1
const S1_QUESTIONS = [
  "¿Cómo se hace una Solped?",
  "¿Dónde busco los códigos de materiales?",
  "¿Cómo hago una pedido de convenio?",
  "¿Cuándo debo enviar el informe de consumo de petróleo?",
  "¿Cómo genero el informe de consumo de petróleo?",
  "¿Para qué genero el informe de consumo de petróleo?",
  "¿Dónde busco los códigos de los diferentes tipos de servicios?",
  "¿Dónde busco los códigos de los diferentes tipos de equipo?",
  "¿Cuál es el calendario de inventarios para el PEP?",
  "¿Cómo genero una guía de despacho?",
  "¿Cómo hago una solicitud de transporte?",
  "¿Qué es una ST?",
  "¿Qué es una SIM?",
  "¿Dónde busco la información de un PEP, Centro y almacén?",
  "¿Cuál es código de servicio de catering?",
  "¿Cuál es el código para solicitar un rotomartillo?",
  "¿Cómo solicito los implementos para activar bodega fácil?",
  "¿Cómo solicito los equipos para activar bodega fácil?",
  "¿Cómo solicito los insumos para activar bodega fácil?",
  "¿Cómo actualizo las cantidades en bodega fácil, si no me calza el físico con sistema?",
  "¿Cómo solicito el arriendo de insumos tecnológicos? Ejemplo: correo, notebook, Smartphone, impresora, router, entre otros.",
  "¿Cómo solicito una cuenta PBI para maestro de materiales?",
  "¿Cómo solicito una capacitación de bodega fácil (BF)?",
  "¿Cómo puedo generar una solicitud de materiales?",
  "¿Cómo puedo generar una compra por convenio?",
  "¿Cuál es el formato de solicitud interna de materiales (SIM)?",
  "¿Cómo se genera una regularización de materiales?",
  "¿Cómo se realiza la solicitud de servicios?",
  "¿Cómo se realiza una HES, en relación a un estado de pago?",
  "¿Cómo borro las posiciones de una SolPed?",
  "¿Cómo controlo la entrega de EPP en obra?",
  "¿Cómo solicito la creación de Proveedores?",
  "¿Qué requisitos hay para crear proveedores?",
  "¿A quién se le debe enviar la posible acreditación de un proveedor?",
  "¿Cómo solicito la creación de un código de material?",
  "¿Cómo puedo revisar los códigos de servicios vigentes para las ZSER?",
  "¿Cómo ingreso una guía de despacho (GD) por SAP o PDA de bodega fácil?",
  "¿Cómo ingreso un vale de Consumo a SAP o una reserva por bodega fácil?",
  "¿Cómo reviso y soluciono facturas del ZMONITOR?",
  "¿Cuál es la TRX para revisar las facturas?",
  "¿Cómo solicito el arriendo o compra de un equipo?",
  "¿Cómo ingreso un equipo de tercero a sistema SAP?",
  "¿Cómo puedo ver mi inventario de equipos?",
  "¿Cómo puedo sacar de mi inventario de equipos, los que ya se han devuelto al proveedor de tercero?",
  "¿Cómo se genera una regularización de equipos?",
  "¿Cómo solicito el arriendo de un camión SUBCARGO?",
  "¿Cómo solicito mi usuario LE-TRA?",
  "¿Cómo solicito un transporte SAMEX?",
  "¿Cómo solicito una cuenta SAMEX?",
  "¿Cómo descargo un reporte de consumo de combustible?",
  "¿Cómo anulo un consumo de petróleo?",
  "¿Cómo hago para cargar el petróleo al generador que queda en el edificio (compra de equipo)?",
  "¿Cómo puedo generar una guía de despacho?",
  "¿Existe algún instructivo para la emisión de guías de despacho?",
  "¿A quién se debe solicitar instructivo para emitir guías de despacho internas?",
  "¿Cómo puedo descargar un inventario de sistema SAP?",
  "¿Cómo realizo un inventario de materiales?",
  "¿Cómo borro una posición del inventario en SAP?",
  "¿Cómo se realiza un traspaso de bodega?",
  "¿Debo copiar a alguien cuando genero un traspaso de bodega?",
  "¿Cómo se puede hacer un traspaso de materiales entre obras?",
  "¿Cómo puedo obtener una mejor evaluación como jefatura de bodega?",
  "¿Cómo encuentro los procedimientos actualizados de SSOMA?",
  "¿Cómo encuentro un Procedimiento, Instructivo o Paso a Paso?",
  "¿Cómo se si es la última versión de un Procedimiento, Instructivo o Paso a Paso?",
  "¿Cómo encuentro un registro de gestión bodegas?",
  "¿Cómo se si es la última versión de un registro de gestión bodegas?"
];

// Sebastian's questions for M1
const M1_QUESTIONS = [
  "¿Qué es un OGUC?",
  "¿Me puedes decir la diferencia entre un Loteo DFL2 y un Loteo con Construcción Simultánea?",
  "¿Cuál es la diferencia entre condominio tipo a y tipo b?",
  "¿Qué requisitos se necesitan para aprobar un permiso de edificios, un permiso de urbanización, permiso de subdivisión, permiso de loteo?",
  "¿Qué documentos se deben presentar para los trámites de loteo, subdivisión, permiso de edificación?",
  "¿Es posible aprobar una fusión de terrenos que no se encuentran urbanizados?",
  "¿Es posible aprobar un condominio tipo B dentro de un permiso de edificación acogido a conjunto armónico?",
  "¿Es posible otorgar un permiso de edificación a un lote no urbanizado dentro de un loteo sin construcción simultánea?",
  "¿Es posible otorgar un CIP a terrenos que no se encuentran con autorización de enajenar?",
  "¿Puede una vivienda en un condominio tipo B tener una altura mayor si se trata de una zona con uso de suelo mixto y una rasante permisiva?",
  "¿Qué jurisprudencia o dictámenes del MINVU existen sobre la exigencia de estacionamientos en proyectos de vivienda social en zonas con plan regulador antiguo?",
  "En una fusión de lotes en zona ZH4 del PRC de Vitacura, ¿puedo mantener derechos adquiridos si uno de los lotes tenía uso de suelo distinto antes de la fusión?",
  "¿Cuáles son las diferencias normativas y procedimentales entre un Loteo con Construcción Simultánea y un Proyecto Inmobiliario acogiéndose al Art. 6.1.8 de la OGUC?",
  "¿Qué requisitos diferenciados hay entre un permiso de urbanización en zona urbana versus una en extensión urbana, según la LGUC?",
  "¿Qué documentos necesito presentar para solicitar un permiso de edificación en un terreno afecto a declaratoria de utilidad pública, según la OGUC y los DDU más recientes?",
  "¿Qué requisitos deben incluirse en un informe de mitigación de impacto vial para un centro comercial en zona ZC2 con vías colectoras?",
  "¿Qué pasa si el PRC permite un uso de suelo y el Plan Regulador Metropolitano de Santiago lo restringe en una macrozona? ¿Cuál prevalece y en qué casos?",
  "¿Se puede edificar sobre una franja de riesgo declarada por el MINVU si se presenta un estudio geotécnico? ¿Qué dictámenes respaldan esto?",
  "¿Cómo se calcula la densidad bruta en un proyecto que abarca varios roles con diferentes normas urbanísticas?",
  "¿Cuál es el procedimiento para regularizar una construcción antigua en zona no edificable pero consolidada, acogida al Art. 148 de la LGUC?"
];

async function findAgent(searchTerm) {
  const allConvs = await firestore.collection('conversations').get();
  
  for (const doc of allConvs.docs) {
    const title = doc.data().title || '';
    if (title.includes(searchTerm)) {
      return { id: doc.id, title };
    }
  }
  
  return null;
}

async function loadQuestionsForAgent(agentId, agentName, questions) {
  console.log(`\n📝 Cargando preguntas para: ${agentName}`);
  console.log(`   Total preguntas: ${questions.length}`);
  console.log(`   Agent ID: ${agentId}\n`);
  
  // Enable testing first
  await firestore.collection('agent_testing_config').doc(agentId).set({
    agentId,
    agentName,
    testingEnabled: true,
    totalQuestions: questions.length,
    updatedAt: new Date(),
    updatedBy: 'system'
  }, { merge: true });
  
  console.log(`   ✅ Testing habilitado para ${agentName}\n`);
  
  // Categorize questions
  const categories = {
    'Solped|pedido|solicitud|HES': 'procedure',
    'código|códigos|TRX': 'code',
    'Qué es|diferencia entre': 'concept',
    'requisito|permiso|aprobar': 'regulation',
    'inventario|reporte|descargo': 'reporting'
  };
  
  function categorizeQuestion(question) {
    for (const [pattern, category] of Object.entries(categories)) {
      if (new RegExp(pattern, 'i').test(question)) {
        return category;
      }
    }
    return 'other';
  }
  
  // Add all questions
  let addedCount = 0;
  
  for (const question of questions) {
    try {
      const category = categorizeQuestion(question);
      
      await firestore.collection('test_questions').add({
        agentId,
        question,
        category,
        difficulty: 'medium',
        enabled: true,
        createdAt: new Date(),
        createdBy: 'sebastian-feedback'
      });
      
      addedCount++;
      
      if (addedCount % 10 === 0) {
        console.log(`   ✅ ${addedCount}/${questions.length} preguntas agregadas...`);
      }
      
    } catch (error) {
      console.error(`   ❌ Error adding question: ${question.substring(0, 50)}...`);
    }
  }
  
  console.log(`\n   🎉 ${addedCount}/${questions.length} preguntas cargadas exitosamente!\n`);
  
  return addedCount;
}

async function main() {
  console.log('🚀 Cargando Preguntas de Sebastian a S001 y M001\n');
  
  // Find agents
  console.log('🔍 Buscando agentes...\n');
  
  const s001 = await findAgent('BODEGAS');
  const m001 = await findAgent('Legal Territorial');
  
  if (!s001) {
    console.log('❌ S001 no encontrado');
  } else {
    console.log(`✅ S001: ${s001.title} (${s001.id})`);
  }
  
  if (!m001) {
    console.log('❌ M001 no encontrado');
  } else {
    console.log(`✅ M001: ${m001.title} (${m001.id})`);
  }
  
  console.log();
  
  // Load questions
  let totalAdded = 0;
  
  if (s001) {
    const count = await loadQuestionsForAgent(s001.id, s001.title, S1_QUESTIONS);
    totalAdded += count;
  }
  
  if (m001) {
    const count = await loadQuestionsForAgent(m001.id, m001.title, M1_QUESTIONS);
    totalAdded += count;
  }
  
  // Summary
  console.log('='.repeat(70));
  console.log('🎉 CARGA COMPLETADA');
  console.log('='.repeat(70));
  console.log();
  console.log(`📊 Total preguntas cargadas: ${totalAdded}`);
  console.log(`   S001: ${S1_QUESTIONS.length} preguntas`);
  console.log(`   M001: ${M1_QUESTIONS.length} preguntas`);
  console.log();
  console.log('📝 Próximos pasos:');
  console.log('   1. Abrir http://localhost:3000/chat');
  console.log('   2. Click en agente S001 o M001');
  console.log('   3. Click en Settings del agente');
  console.log('   4. Ver tab "Testing & Evaluación"');
  console.log('   5. Ver las preguntas cargadas');
  console.log();
  
  process.exit(0);
}

main();

