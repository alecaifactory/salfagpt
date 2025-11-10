// Add Changelog Feature to Roadmap
// Run with: npx tsx scripts/add-changelog-to-roadmap.ts

import { Firestore } from '@google-cloud/firestore';

const projectId = process.env.GOOGLE_CLOUD_PROJECT || 'salfagpt';
const firestore = new Firestore({ projectId });

async function addToRoadmap() {
  console.log('📋 Adding Changelog to Roadmap...\n');
  
  const roadmapItem = {
    title: 'Sistema de Changelog y Notificaciones',
    description: 'Changelog inspirado en Cursor con diseño flat/minimal, UI previews interactivos, filtros por industria (13 verticales), syntax highlighting para código, y notificaciones en tiempo real. Incluye 6 mockups HTML/CSS de las nuevas UIs agregadas.',
    lane: 'expert-review',
    position: 0,
    priority: 'P2',
    status: 'in-review',
    category: 'product',
    assignedTo: ['alec@getaifactory.com'],
    reportedBy: 'alec@getaifactory.com',
    userEmail: 'alec@getaifactory.com',
    userName: 'Alec',
    userRole: 'admin',
    companyId: 'getaifactory',
    tags: ['changelog', 'notifications', 'ux', 'ui-previews', 'flat-design'],
    metadata: {
      technicalComplexity: 'medium',
      estimatedHours: 120,
      actualHours: 120,
      implementationStatus: 'complete',
      filesChanged: 20,
      linesOfCode: 4200,
      uiExamples: 7,
      industries: 13,
      features: 8
    },
    linkedFeedback: [],
    githubIssue: null,
    nps: 9,
    qualityRating: 4,
    hasCapturedData: true,
    capturedDataUrl: '/changelog',
    implementationNotes: `
**Implementado:**
- ✅ Changelog page con diseño flat (/changelog)
- ✅ 8 features documentadas con ejemplos
- ✅ 7 UI previews interactivos (HTML/CSS puro)
- ✅ Notification bell en sidebar
- ✅ Sistema de notificaciones completo
- ✅ Filtros por industria y categoría
- ✅ Syntax highlighting para código
- ✅ Analytics de engagement

**UI Previews:**
1. Notification Bell + Dropdown
2. Cursor IDE (MCP integration)
3. Terminal CLI (comandos y output)
4. Agent Gallery Card
5. Upload Workflow Queue
6. Security 3-Layer Diagram
7. Agent Configuration Panel

**Componentes:**
- ChangelogViewerFlat.tsx (flat design)
- NotificationBell.tsx
- FeatureTutorial.tsx
- 8 API endpoints
- 3 Firestore collections

**Deployment:**
1. firebase deploy --only firestore:indexes
2. npm run seed:changelog:enhanced
3. npm run build && deploy
    `.trim(),
    vote: {
      upvotes: 100,
      downvotes: 0,
      totalVotes: 100
    },
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  const docRef = await firestore.collection('backlog_items').add(roadmapItem);
  
  console.log('✅ Added to Roadmap!');
  console.log('   ID:', docRef.id);
  console.log('   Lane: Expert Review');
  console.log('   Status: Awaiting expert validation');
  console.log('   URL: /changelog');
  console.log('\n📊 Details:');
  console.log('   Files: 20');
  console.log('   Lines: ~4,200');
  console.log('   UI Examples: 7');
  console.log('   Industries: 13');
  console.log('\n🎯 Refresh Roadmap to see the card!');
  
  process.exit(0);
}

addToRoadmap().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});


