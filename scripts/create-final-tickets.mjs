const BASE_URL = 'http://localhost:3000';

const tickets = [
  {
    title: '[CRÍTICO] Sincronizar chunks Firestore → BigQuery',
    description: `Root cause de FB-001 y FB-005 identificado.

PROBLEMA:
- Chunks re-indexados están en Firestore (1,773+ chunks) ✅
- Chunks NO están en BigQuery ❌
- RAG vectorial busca en BigQuery → 0 resultados → 0 referencias

EVIDENCIA:
- BigQuery: 0 chunks para user 'alec_getaifactory_com'
- BigQuery: 3,020 chunks para user '114671162830729001607' (viejos, del 22-Oct)
- Firestore: 1,773 chunks S001 (nuevos, del 28-Oct)

SOLUCIÓN:
1. Script sync-firestore-to-bigquery.mjs
2. Leer chunks de Firestore
3. Insertar en BigQuery (salfagpt.flow_analytics.document_embeddings)
4. Usar user_id numérico: '114671162830729001607'
5. Verificar con query

IMPACTO:
- Resuelve FB-001 (S001 sin referencias)
- Resuelve FB-005 (S001 solo menciona docs)
- Habilita RAG vectorial para S001
- S001 mostrará badges clickeables

TIEMPO: 20 minutos`,
    priority: 'critical',
    estimatedEffort: 'm',
    lane: 'now',
    tags: ['bigquery', 'rag', 'sync', 's001', 'critical', 'fb-001', 'fb-005']
  },
  {
    title: '[M1] Eliminar referencias phantom [9][10]',
    description: `M001 menciona referencias [9][10] en lista de referencias pero solo muestra 8 badges [1]-[8].

PROBLEMA:
- Badges mostrados: [1][2][3][4][5][6][7][8]
- Lista de referencias menciona: [9][10] adicionales
- Usuario confundido: ¿dónde está [9] y [10]?

CAUSA:
- AI genera lista descriptiva con números adicionales
- O prompt no es suficientemente estricto

SOLUCIÓN:
- Post-procesar lista de referencias
- Eliminar menciones de números sin badges
- O ajustar prompt para no generar extras

SEVERIDAD: Media (cosmético, no crítico)
TIEMPO: 30 minutos`,
    priority: 'high',
    estimatedEffort: 's',
    lane: 'next',
    tags: ['m1', 'referencias', 'fb-002', 'cosmetic']
  },
  {
    title: 'Evaluación masiva 87 preguntas - Sebastian',
    description: `Ejecutar testing completo de las 87 preguntas configuradas.

PREGUNTAS:
- S001: 67 preguntas gestión bodegas
- M001: 20 preguntas normativa urbana
- Total: 87 preguntas

DEPENDE DE:
- ✅ Sync BigQuery (TICKET-006)
- ✅ Validación pasa (2 preguntas clave)

PROCESO:
1. Script bulk-evaluate-all.ts
2. Para cada pregunta:
   - Ejecutar contra agente
   - Capturar respuesta + referencias
   - Evaluar calidad (poor/fair/good/excellent)
   - Guardar en test_executions
3. Generar CSV con resultados
4. Generar reporte de análisis
5. Decidir: go/no-go producción

CRITERIO ÉXITO:
- ≥70% calidad Good o Excellent
- <10% fragmentos basura
- <5% alucinación

TIEMPO: 40-60 minutos`,
    priority: 'high',
    estimatedEffort: 'l',
    lane: 'next',
    tags: ['evaluation', 'testing', 'sebastian', 'bulk']
  }
];

async function createTickets() {
  console.log('🎫 Creando 3 tickets adicionales...\n');
  
  for (const ticket of tickets) {
    try {
      const response = await fetch(`${BASE_URL}/api/backlog/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: 'salfacorp',
          userId: '114671162830729001607',
          ...ticket,
          userStory: `Como desarrollador, necesito ${ticket.title}, para resolver issues de Sebastian`,
          acceptanceCriteria: [],
          feedbackSessionIds: ['sebastian-session-2025-10-28'],
          alignedOKRs: ['improve-agent-quality'],
          okrImpactScore: ticket.priority === 'critical' ? 10 : 8,
          affectedUsers: 2,
          estimatedCSATImpact: ticket.priority === 'critical' ? 10 : 7,
          estimatedNPSImpact: ticket.priority === 'critical' ? 25 : 15,
          status: 'ready'
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ ${ticket.title}`);
        console.log(`   ID: ${data.id}`);
        console.log(`   Lane: ${ticket.lane}`);
        console.log(`   Priority: ${ticket.priority}`);
        console.log();
      } else {
        const error = await response.text();
        console.log(`❌ Error: ${ticket.title}`);
        console.log(`   ${error.substring(0, 100)}`);
        console.log();
      }
    } catch (error) {
      console.log(`❌ Exception: ${ticket.title}`);
      console.log(`   ${error.message}`);
      console.log();
    }
  }
  
  console.log('🎉 Proceso completado');
  console.log('\n📊 Ver todos los tickets en: http://localhost:3000/roadmap\n');
}

createTickets();

