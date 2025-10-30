/**
 * Create example roadmap cards based on real features built
 * These simulate feedback that Alec could have shared via Stella
 */

import { Firestore } from '@google-cloud/firestore';

const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT || 'gen-lang-client-0986191192';
const firestore = new Firestore({ projectId: PROJECT_ID });

const EXAMPLE_CARDS = [
  // BACKLOG - Ideas recientes
  {
    ticketId: 'FEAT-001',
    title: 'Sistema de carrusel de preguntas de muestra',
    description: 'Agregar carrusel visual de preguntas sugeridas para cada agente con navegación por flechas',
    lane: 'backlog',
    createdBy: 'Alec Dickinson',
    createdByEmail: 'alec@getaifactory.com',
    userRole: 'admin',
    userDomain: 'getaifactory.com',
    agentName: 'M001 - Manual Operaciones',
    conversationId: 'demo-conv-001',
    aiSummary: 'Feature UX que mejora onboarding de usuarios nuevos mostrando ejemplos de preguntas relevantes por agente.',
    okrAlignment: ['Mejorar engagement', 'Reducir tiempo de onboarding'],
    kpiImpact: {
      csat: 3.2,
      nps: 85,
      roi: 6.5,
      customKPIs: [
        { name: 'Time to first question', value: '-40%' },
        { name: 'Questions per session', value: '+25%' }
      ]
    },
    upvotes: 8,
    upvotedBy: ['user1', 'user2', 'expert1'],
    shares: 3,
    priority: 'medium',
    estimatedEffort: 's',
    type: 'feature',
    status: 'new',
  },
  
  // ROADMAP - Planificado
  {
    ticketId: 'FEAT-002',
    title: 'Sistema de evaluación masiva de agentes',
    description: 'Banco de 85 preguntas benchmark para evaluar calidad de respuestas de agentes con métricas CSAT/NPS',
    lane: 'roadmap',
    createdBy: 'Alec Dickinson',
    createdByEmail: 'alec@getaifactory.com',
    userRole: 'admin',
    userDomain: 'getaifactory.com',
    agentName: 'Sistema - Evaluación',
    conversationId: 'demo-conv-002',
    aiSummary: 'Sistema crítico para quality assurance de agentes. Permite testing sistemático antes de producción.',
    okrAlignment: ['Aumentar calidad de respuestas', 'Reducir feedback negativo'],
    kpiImpact: {
      csat: 4.5,
      nps: 95,
      roi: 15,
      customKPIs: [
        { name: 'Agent quality score', value: '+45%' },
        { name: 'Negative feedback', value: '-60%' }
      ]
    },
    upvotes: 25,
    upvotedBy: ['user1', 'user2', 'user3', 'expert1', 'expert2'],
    shares: 12,
    priority: 'high',
    estimatedEffort: 'l',
    type: 'feature',
    status: 'groomed',
  },
  
  // IN DEVELOPMENT
  {
    ticketId: 'BUG-001',
    title: 'Fix permanente: Numeración de referencias RAG',
    description: 'Consolidar numeración de referencias ANTES de enviar al AI para evitar fragmentos duplicados y referencias inventadas',
    lane: 'in_development',
    createdBy: 'Alec Dickinson',
    createdByEmail: 'alec@getaifactory.com',
    userRole: 'admin',
    userDomain: 'getaifactory.com',
    agentName: 'M001 - Manual Operaciones',
    conversationId: 'demo-conv-003',
    aiSummary: 'Bug crítico que causaba 80% de fragmentos basura y referencias inventadas. Fix implementa consolidación pre-AI.',
    okrAlignment: ['Mejorar accuracy de respuestas', 'Aumentar confianza en sistema'],
    kpiImpact: {
      csat: 4.8,
      nps: 98,
      roi: 25,
      customKPIs: [
        { name: 'Reference accuracy', value: '+95%' },
        { name: 'Hallucination rate', value: '-90%' }
      ]
    },
    upvotes: 42,
    upvotedBy: ['user1', 'user2', 'user3', 'user4', 'expert1', 'expert2', 'expert3'],
    shares: 18,
    priority: 'critical',
    estimatedEffort: 'm',
    type: 'bug',
    status: 'in_progress',
  },
  
  // EXPERT REVIEW
  {
    ticketId: 'FEAT-003',
    title: 'Modal de referencias simplificado',
    description: 'Simplificar modal "Ver documento" para mostrar solo info esencial: nombre, página, snippet con highlight del texto relevante',
    lane: 'expert_review',
    createdBy: 'Alec Dickinson',
    createdByEmail: 'alec@getaifactory.com',
    userRole: 'admin',
    userDomain: 'getaifactory.com',
    agentName: 'General - UX',
    conversationId: 'demo-conv-004',
    aiSummary: 'Mejora UX reduciendo cognitive load en verificación de referencias. Modal más limpio y scannable.',
    okrAlignment: ['Mejorar usability', 'Reducir tiempo de verificación'],
    kpiImpact: {
      csat: 3.5,
      nps: 88,
      roi: 8,
      customKPIs: [
        { name: 'Time to verify reference', value: '-50%' },
        { name: 'Modal completion rate', value: '+35%' }
      ]
    },
    upvotes: 15,
    upvotedBy: ['user1', 'user2', 'expert1'],
    shares: 6,
    priority: 'medium',
    estimatedEffort: 's',
    type: 'enhancement',
    status: 'review',
  },
  
  // PRODUCTION - Deployed
  {
    ticketId: 'FEAT-004',
    title: 'Sistema de prompts jerárquicos (Domain + Agent)',
    description: 'Combinar prompts de dominio y agente de forma jerárquica para contexto más rico y respuestas más precisas',
    lane: 'production',
    createdBy: 'Alec Dickinson',
    createdByEmail: 'alec@getaifactory.com',
    userRole: 'admin',
    userDomain: 'getaifactory.com',
    agentName: 'Sistema - Architecture',
    conversationId: 'demo-conv-005',
    screenshot: '/demo-screenshot-prompts.png',
    aiSummary: 'Arquitectura mejorada que permite prompts a nivel dominio (compartido) y agente (específico) para mejor control.',
    okrAlignment: ['Aumentar precisión de respuestas', 'Mejorar customization'],
    kpiImpact: {
      csat: 4.2,
      nps: 92,
      roi: 12,
      customKPIs: [
        { name: 'Response relevance', value: '+40%' },
        { name: 'Setup time per agent', value: '-60%' }
      ]
    },
    upvotes: 32,
    upvotedBy: ['user1', 'user2', 'user3', 'user4', 'expert1', 'expert2'],
    shares: 14,
    priority: 'high',
    estimatedEffort: 'm',
    type: 'feature',
    status: 'done',
  },
  
  // More cards from recent work
  {
    ticketId: 'FEAT-005',
    title: 'Feedback system con Stella Marker Tool',
    description: 'Herramienta de anotación visual para dar feedback directo en UI con markers purple/yellow/green cycling',
    lane: 'production',
    createdBy: 'Alec Dickinson',
    createdByEmail: 'alec@getaifactory.com',
    userRole: 'admin',
    userDomain: 'getaifactory.com',
    agentName: 'Sistema - Feedback',
    conversationId: 'demo-conv-006',
    aiSummary: 'Sistema viral de feedback que permite a usuarios marcar elementos confusos directamente, generando tickets compartibles.',
    okrAlignment: ['Aumentar feedback rate', 'Mejorar product-market fit'],
    kpiImpact: {
      csat: 4.8,
      nps: 96,
      roi: 18,
      customKPIs: [
        { name: 'Feedback volume', value: '+500%' },
        { name: 'Feedback quality', value: '+80%' }
      ]
    },
    upvotes: 56,
    upvotedBy: ['user1', 'user2', 'user3', 'user4', 'user5', 'expert1', 'expert2'],
    shares: 28,
    priority: 'high',
    estimatedEffort: 'xl',
    type: 'feature',
    status: 'done',
  },
  
  {
    ticketId: 'FEAT-006',
    title: 'RAG con vectorstore y similarity search',
    description: 'Implementar búsqueda semántica con embeddings para encontrar chunks más relevantes en documentos grandes',
    lane: 'production',
    createdBy: 'Alec Dickinson',
    createdByEmail: 'alec@getaifactory.com',
    userRole: 'admin',
    userDomain: 'getaifactory.com',
    agentName: 'Sistema - RAG',
    conversationId: 'demo-conv-007',
    aiSummary: 'Upgrade de arquitectura de full-text a RAG semántico. Mejora dramática en relevancia de referencias.',
    okrAlignment: ['Mejorar accuracy', 'Reducir tokens desperdiciados'],
    kpiImpact: {
      csat: 4.7,
      nps: 94,
      roi: 22,
      customKPIs: [
        { name: 'Reference relevance', value: '+85%' },
        { name: 'Token efficiency', value: '+60%' },
        { name: 'Cost per query', value: '-40%' }
      ]
    },
    upvotes: 38,
    upvotedBy: ['user1', 'expert1', 'expert2', 'expert3'],
    shares: 16,
    priority: 'critical',
    estimatedEffort: 'xl',
    type: 'feature',
    status: 'done',
  },
  
  // ROADMAP - Features planeadas
  {
    ticketId: 'FEAT-007',
    title: 'Dashboard de métricas por agente',
    description: 'Vista analytics con CSAT, NPS, token usage, y quality scores por agente para optimización continua',
    lane: 'roadmap',
    createdBy: 'Alec Dickinson',
    createdByEmail: 'alec@getaifactory.com',
    userRole: 'admin',
    userDomain: 'getaifactory.com',
    agentName: 'Sistema - Analytics',
    conversationId: 'demo-conv-008',
    aiSummary: 'Dashboard que permite comparar performance entre agentes, identificar mejores prácticas, y optimizar configuraciones.',
    okrAlignment: ['Data-driven optimization', 'Increase agent quality'],
    kpiImpact: {
      csat: 3.8,
      nps: 90,
      roi: 10,
      customKPIs: [
        { name: 'Optimization cycle time', value: '-70%' },
        { name: 'Agent quality improvement', value: '+40%' }
      ]
    },
    upvotes: 18,
    upvotedBy: ['expert1', 'expert2'],
    shares: 7,
    priority: 'high',
    estimatedEffort: 'l',
    type: 'feature',
    status: 'ready',
  },
  
  // BACKLOG - Ideas futuras
  {
    ticketId: 'FEAT-008',
    title: 'Export conversación a PDF/Word',
    description: 'Permitir exportar conversaciones completas con formato, incluyendo markdown, código, y referencias',
    lane: 'backlog',
    createdBy: 'Alec Dickinson',
    createdByEmail: 'alec@getaifactory.com',
    userRole: 'admin',
    userDomain: 'getaifactory.com',
    agentName: 'General - Export',
    conversationId: 'demo-conv-009',
    aiSummary: 'Feature de productividad que permite compartir conversaciones offline con stakeholders y clientes.',
    okrAlignment: ['Mejorar sharing', 'Aumentar valor percibido'],
    kpiImpact: {
      csat: 2.5,
      nps: 78,
      roi: 5,
      customKPIs: [
        { name: 'Sharing frequency', value: '+120%' },
        { name: 'Offline usage', value: '+200%' }
      ]
    },
    upvotes: 12,
    upvotedBy: ['user1', 'user2'],
    shares: 4,
    priority: 'medium',
    estimatedEffort: 'm',
    type: 'feature',
    status: 'new',
  },
  
  {
    ticketId: 'FEAT-009',
    title: 'Multi-file upload en contexto',
    description: 'Permitir drag & drop de múltiples PDFs a la vez para agregar contexto más rápido',
    lane: 'backlog',
    createdBy: 'Alec Dickinson',
    createdByEmail: 'alec@getaifactory.com',
    userRole: 'admin',
    userDomain: 'getaifactory.com',
    agentName: 'Sistema - Context',
    conversationId: 'demo-conv-010',
    aiSummary: 'UX improvement que reduce friction en setup de agentes nuevos con mucho contexto documental.',
    okrAlignment: ['Reducir setup time', 'Mejorar UX'],
    kpiImpact: {
      csat: 2.8,
      nps: 82,
      roi: 4.5,
      customKPIs: [
        { name: 'Context setup time', value: '-65%' },
        { name: 'Files per agent', value: '+80%' }
      ]
    },
    upvotes: 9,
    upvotedBy: ['user1', 'expert1'],
    shares: 2,
    priority: 'low',
    estimatedEffort: 's',
    type: 'enhancement',
    status: 'new',
  },
  
  {
    ticketId: 'BUG-002',
    title: 'Modal "Ver documento" no abre en algunos casos',
    description: 'Referencias clickables a veces no abren modal de detalles, especialmente en documentos con chunks RAG',
    lane: 'roadmap',
    createdBy: 'Alec Dickinson',
    createdByEmail: 'alec@getaifactory.com',
    userRole: 'admin',
    userDomain: 'getaifactory.com',
    agentName: 'M001 - Manual Operaciones',
    conversationId: 'demo-conv-011',
    aiSummary: 'Bug que impide verificación de fuentes. Afecta confianza en respuestas del AI.',
    okrAlignment: ['Aumentar trust', 'Mejorar reliability'],
    kpiImpact: {
      csat: 3.5,
      nps: 88,
      roi: 8,
      customKPIs: [
        { name: 'Reference verification rate', value: '+100%' },
        { name: 'Trust score', value: '+30%' }
      ]
    },
    upvotes: 22,
    upvotedBy: ['user1', 'user2', 'user3', 'expert1'],
    shares: 8,
    priority: 'high',
    estimatedEffort: 's',
    type: 'bug',
    status: 'ready',
  },
];

async function createExampleCards() {
  console.log('🎨 Creating example roadmap cards...\n');
  
  const companyId = 'aifactory';
  const now = new Date();
  
  for (const card of EXAMPLE_CARDS) {
    try {
      // Create feedback ticket - filter undefined values
      const ticketData = {
        ticketId: card.ticketId,
        sessionId: `session-${card.ticketId}`,
        userId: '114671162830729001607', // Alec's userId
        companyId,
        
        // Content
        type: card.type === 'bug' ? 'bug_report' : 'feature_request',
        title: card.title,
        status: 'submitted',
        priority: card.priority,
        
        // Extended data for roadmap
        createdByName: card.createdBy,
        createdByEmail: card.createdByEmail,
        createdByRole: card.userRole,
        companyDomain: card.userDomain,
        agentName: card.agentName,
        conversationId: card.conversationId,
        description: card.description,
        annotations: card.annotations || [],
        aiSummary: card.aiSummary,
        okrAlignment: card.okrAlignment,
        estimatedCSAT: card.kpiImpact.csat,
        estimatedNPS: card.kpiImpact.nps,
        estimatedROI: card.kpiImpact.roi,
        customKPIs: card.kpiImpact.customKPIs,
        
        // Social
        upvotes: card.upvotes,
        upvotedBy: card.upvotedBy,
        views: card.upvotes * 2,
        viewedBy: [],
        shares: card.shares,
        sharedBy: [],
        shareChain: [],
        viralCoefficient: card.shares / Math.max(card.upvotes, 1),
        
        // Privacy
        isPublic: false,
        requiresAuth: true,
        
        createdAt: now,
        updatedAt: now,
        source: 'localhost',
      };
      
      // Only add screenshot if present
      if (card.screenshot) {
        ticketData.screenshot = card.screenshot;
      }
      
      const ticketRef = await firestore.collection('feedback_tickets').add(ticketData);
      console.log(`✅ Created ticket: ${card.ticketId} (${ticketRef.id})`);
      
      // Create backlog item
      const backlogData = {
        companyId,
        
        // Content
        title: card.title,
        description: card.description,
        userStory: `Como ${card.userRole}, quiero ${card.title.toLowerCase()}, para mejorar mi experiencia`,
        acceptanceCriteria: [
          'Feature funciona correctamente',
          'Tests agregados',
          'Documentación actualizada',
        ],
        
        // Source
        feedbackSessionIds: [`session-${card.ticketId}`],
        createdBy: 'admin',
        createdByUserId: '114671162830729001607',
        
        // Classification
        type: card.type,
        category: 'ui',
        tags: [card.lane, card.agentName],
        
        // Priority & Impact
        priority: card.priority,
        estimatedEffort: card.estimatedEffort,
        estimatedCSATImpact: card.kpiImpact.csat,
        estimatedNPSImpact: card.kpiImpact.nps,
        affectedUsers: card.upvotes * 20, // Estimate based on upvotes
        
        // OKR
        alignedOKRs: card.okrAlignment,
        okrImpactScore: Math.round(card.kpiImpact.roi / 2), // ROI to 1-10 scale
        
        // Kanban
        status: card.status,
        lane: card.lane,
        position: EXAMPLE_CARDS.indexOf(card) + 1,
        
        createdAt: now,
        updatedAt: now,
        source: 'localhost',
      };
      
      const backlogRef = await firestore.collection('backlog_items').add(backlogData);
      console.log(`   ✅ Created backlog item: ${backlogRef.id}`);
      console.log(`   📍 Lane: ${card.lane}`);
      console.log('');
      
    } catch (error) {
      console.error(`❌ Failed to create ${card.ticketId}:`, error);
    }
  }
  
  console.log('🎉 Example cards created!\n');
  console.log('📊 Summary:');
  console.log(`   Backlog: ${EXAMPLE_CARDS.filter(c => c.lane === 'backlog').length}`);
  console.log(`   Roadmap: ${EXAMPLE_CARDS.filter(c => c.lane === 'roadmap').length}`);
  console.log(`   In Development: ${EXAMPLE_CARDS.filter(c => c.lane === 'in_development').length}`);
  console.log(`   Expert Review: ${EXAMPLE_CARDS.filter(c => c.lane === 'expert_review').length}`);
  console.log(`   Production: ${EXAMPLE_CARDS.filter(c => c.lane === 'production').length}`);
  console.log('');
  console.log('🔗 View at: http://localhost:3000/roadmap');
  console.log('   (Login as alec@getaifactory.com)');
}

createExampleCards()
  .then(() => {
    console.log('✅ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });

