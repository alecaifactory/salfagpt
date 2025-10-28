import { Firestore } from '@google-cloud/firestore';

const firestore = new Firestore({
  projectId: 'gen-lang-client-0986191192'
});

/**
 * Create backlog tickets from Sebastian's feedback
 * 
 * Issues:
 * FB-001: S1 - Referencias no aparecen
 * FB-002: M1 - Alucinación de referencias [FIXED]
 * FB-003: M1 - Fragmentos basura RAG [FIXED]
 * FB-004: M1 - Modal "Ver documento" no abre
 * FB-005: S1 - AI solo menciona documentos sin usar contenido
 */

const SEBASTIAN_USER_ID = '114671162830729001607'; // alec@getaifactory.com (admin)
const COMPANY_ID = 'salfacorp';

const tickets = [
  // FB-001: S1 - Referencias no aparecen
  {
    title: '[S1] Referencias no aparecen en respuestas',
    description: `Usuario reporta que el agente S1 (GESTION BODEGAS GPT - S001) no muestra referencias en sus respuestas.

**Observación:**
- Probado en usuario admin Y usuario final
- Mismo comportamiento (no muestra referencias)
- El sistema de referencias funciona en M1, no en S1

**Impacto:**
- Usuario no puede verificar fuentes
- Reduce confianza en respuestas
- Imposible auditar información

**Hipótesis:**
1. S1 no tiene context sources asignados
2. Context sources no están activados (toggles)
3. Documentos subidos solo contienen referencias a otros docs no subidos`,
    userStory: 'Como usuario de S1, quiero ver referencias clickeables en las respuestas, para poder verificar las fuentes de información',
    acceptanceCriteria: [
      'S1 muestra referencias clickeables tipo [1], [2], [3]',
      'Referencias aparecen tanto en usuario admin como usuario final',
      'Panel de Referencias muestra fragmentos utilizados',
      'Click en referencia abre detalle del fragmento',
    ],
    type: 'bug',
    category: 'other',
    priority: 'high',
    estimatedEffort: 'm',
    tags: ['s1', 'referencias', 'rag', 'sebastian-feedback'],
    affectedUsers: 2,
    estimatedCSATImpact: 8,
    estimatedNPSImpact: 15,
  },
  
  // FB-002: M1 - Alucinación de referencias [FIXED - pero requiere testing]
  {
    title: '[M1] AI inventa referencias que no existen (FIXED)',
    description: `Usuario reporta que M1 usa referencias como [7] cuando solo hay 5 fragmentos.

**Observación:**
- Pregunta: "¿Qué es un OGUC?"
- Respuesta incluye [7] en el texto
- Pero solo hay 5 fragmentos citados ([1] a [5])
- El AI está inventando el número [7]

**Solución Implementada (commit ce47110):**
- System prompt reforzado con reglas estrictas
- PROHIBIDO usar números fuera del rango válido
- Ejemplo explícito de número inválido

**Testing Requerido:**
- Manual: Pregunta "¿Qué es un OGUC?" en M1
- Verificar: Solo usa [1][2][3][4][5], NO [7]
- Confirmar con Sebastian que funciona

**Status:** ✅ Fix implementado, pendiente testing usuario`,
    userStory: 'Como usuario de M1, quiero que las referencias sean solo a fragmentos que existen, para poder confiar en las citas',
    acceptanceCriteria: [
      'AI solo usa referencias que existen (ej: [1-5] si hay 5 fragmentos)',
      'NO aparecen referencias inventadas ([6], [7], etc.)',
      'Testing con pregunta "¿Qué es un OGUC?" pasa',
      'Sebastian confirma que funciona correctamente',
    ],
    type: 'bug',
    category: 'other',
    priority: 'critical',
    estimatedEffort: 's',
    tags: ['m1', 'referencias', 'alucinacion', 'rag', 'sebastian-feedback', 'fixed'],
    affectedUsers: 2,
    estimatedCSATImpact: 9,
    estimatedNPSImpact: 20,
  },
  
  // FB-003: M1 - Fragmentos basura RAG [FIXED - pero requiere re-indexing]
  {
    title: '[M1] 80% de fragmentos RAG son basura (FIXED)',
    description: `Usuario reporta que 4 de 5 fragmentos devueltos por RAG son irrelevantes.

**Observación:**
Pregunta: "¿Qué es un OGUC?"
Fragmentos devueltos:
- ❌ Fragmento 1: "1. INTRODUCCIÓN .............." (TOC)
- ❌ Fragmento 2: "1. INTRODUCCIÓN .............." (TOC)
- ❌ Fragmento 3: "Página 2 de 3" (4 tokens, número de página)
- ❌ Fragmento 4: "1. INTRODUCCIÓN .............." (TOC)
- ✅ Fragmento 5: Contenido útil sobre OGUC

**Resultado:** Solo 1 de 5 útil (20% calidad)

**Solución Implementada (commit ce47110):**
- Nueva función filterGarbageChunks() en chunking.ts
- Filtra: headers TOC, números de página, separadores, chunks <50 chars
- Integrado en pipeline de indexing (webapp + CLI)

**Requiere:**
- Re-indexar documentos existentes de M1
- Nuevos uploads automáticamente filtrados

**Resultado Esperado:**
- De 20% útil → 90% útil
- 4-5 de 5 fragmentos relevantes

**Status:** ✅ Fix implementado, pendiente re-indexing + testing`,
    userStory: 'Como usuario de M1, quiero que los fragmentos RAG sean útiles y relevantes, para obtener respuestas de calidad basadas en documentos',
    acceptanceCriteria: [
      'Fragmentos NO contienen headers TOC ("INTRODUCCIÓN ...")',
      'Fragmentos NO contienen números de página ("Página X de Y")',
      'Fragmentos NO contienen solo separadores o puntos',
      'Al menos 80% de fragmentos devueltos son útiles',
      'Pregunta "¿Qué es un OGUC?" devuelve 4-5 de 5 útiles',
      'Sebastian confirma mejora en calidad',
    ],
    type: 'bug',
    category: 'other',
    priority: 'critical',
    estimatedEffort: 'm',
    tags: ['m1', 'rag', 'chunks', 'calidad', 'sebastian-feedback', 'fixed', 'requiere-reindex'],
    affectedUsers: 2,
    estimatedCSATImpact: 10,
    estimatedNPSImpact: 25,
  },
  
  // FB-004: M1 - Modal "Ver documento" no abre
  {
    title: '[M1] Modal "Ver documento original" no abre',
    description: `Usuario reporta que el botón "Ver documento original" en referencias no funciona.

**Observación:**
- Usuario hace click en referencia → Panel de detalle se abre ✅
- Usuario hace click en "Ver documento original"
- ❌ Modal no se abre
- ❌ No pasa nada

**Impacto:**
- Feature prometida no funciona
- Usuario no puede ver contexto completo
- Experiencia incompleta

**Investigación Requerida:**
- Verificar si modal está implementado
- Verificar event handler
- Verificar si es feature pendiente`,
    userStory: 'Como usuario, quiero ver el documento completo al hacer click en "Ver documento original", para entender el contexto completo del fragmento',
    acceptanceCriteria: [
      'Click en "Ver documento original" abre modal',
      'Modal muestra documento completo',
      'Modal tiene opción de cerrar (X o ESC)',
      'Modal muestra nombre del documento en header',
    ],
    type: 'bug',
    category: 'ui',
    priority: 'medium',
    estimatedEffort: 's',
    tags: ['m1', 'modal', 'ui', 'referencias', 'sebastian-feedback'],
    affectedUsers: 2,
    estimatedCSATImpact: 6,
    estimatedNPSImpact: 10,
  },
  
  // FB-005: S1 - AI solo menciona documentos sin dar contenido
  {
    title: '[S1] AI menciona documentos pero no usa su contenido',
    description: `Usuario reporta que S1 solo dice "consulta el documento X" en vez de dar la respuesta.

**Observación:**
Pregunta 1: "¿Cómo genero el informe de consumo de petróleo?"
Pregunta 2: "Como Imprimir Resumen Consumo Petróleo?"

Respuesta del AI:
"Según el documento MAQ-LOG-CBO-I-002, debes consultar el instructivo MAQ-LOG-CBO-PP-009"

Pregunta 3: "Resume el documento MAQ-LOG-CBO-PP-009"
Respuesta: "El documento MAQ-LOG-CBO-PP-009 no se encuentra incluido"

**Root Cause:**
- Documento I-002 SÍ está en el sistema ✅
- Documento I-002 menciona documento PP-009 ✅
- Documento PP-009 NO está en el sistema ❌
- Por eso AI solo puede decir "ve al documento PP-009"

**Solución:**
- Subir documentos faltantes (PP-009, etc.)
- Verificar que todos los documentos referenciados estén disponibles
- Completar la cadena de documentación`,
    userStory: 'Como usuario de S1, quiero que el AI use el contenido de los documentos para responder, no solo mencionar que existen otros documentos',
    acceptanceCriteria: [
      'AI responde con el contenido de documentos, no solo menciones',
      'Todos los documentos referenciados están subidos al sistema',
      'Pregunta sobre procedimientos obtiene pasos concretos',
      'No dice "consulta el instructivo X" si X no está disponible',
    ],
    type: 'enhancement',
    category: 'other',
    priority: 'high',
    estimatedEffort: 'm',
    tags: ['s1', 'documentos', 'contenido', 'referencias-cruzadas', 'sebastian-feedback'],
    affectedUsers: 2,
    estimatedCSATImpact: 9,
    estimatedNPSImpact: 20,
  },
];

async function createTickets() {
  console.log('🎫 Creando tickets de feedback de Sebastian...\n');
  
  const createdTickets = [];
  let position = 0;
  
  for (const ticket of tickets) {
    try {
      const backlogItemData = {
        companyId: COMPANY_ID,
        ...ticket,
        feedbackSessionIds: ['sebastian-session-2025-10-28'],
        createdBy: 'user',
        createdByUserId: SEBASTIAN_USER_ID,
        alignedOKRs: ['improve-agent-quality', 'reduce-hallucination'],
        okrImpactScore: 8,
        status: 'ready', // Ready to work
        lane: 'next',    // Start in "next" lane (roadmap)
        position: position++,
        createdAt: new Date(),
        updatedAt: new Date(),
        source: 'localhost',
      };
      
      const ref = await firestore.collection('backlog_items').add(backlogItemData);
      
      console.log(`✅ Ticket creado: ${ticket.title}`);
      console.log(`   ID: ${ref.id}`);
      console.log(`   Lane: ${backlogItemData.lane}`);
      console.log(`   Priority: ${ticket.priority}`);
      console.log(`   Effort: ${ticket.estimatedEffort}`);
      console.log(`   Tags: ${ticket.tags.join(', ')}`);
      console.log();
      
      createdTickets.push({ id: ref.id, ...ticket });
      
    } catch (error) {
      console.error(`❌ Error creando ticket "${ticket.title}":`, error);
    }
  }
  
  console.log(`\n🎉 ${createdTickets.length} tickets creados exitosamente!\n`);
  console.log('📊 Resumen por Lane:');
  console.log(`   Roadmap (next): ${createdTickets.filter(t => t.lane === 'next').length}`);
  console.log(`   Now: ${createdTickets.filter(t => t.lane === 'now').length}`);
  console.log(`   Done: ${createdTickets.filter(t => t.lane === 'done').length}`);
  console.log();
  
  console.log('🔗 Ver en Kanban:');
  console.log('   http://localhost:3000/roadmap');
  console.log();
  
  console.log('📝 IDs de tickets creados:');
  createdTickets.forEach(t => {
    console.log(`   ${t.id} - ${t.title}`);
  });
  
  process.exit(0);
}

createTickets().catch(error => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});

