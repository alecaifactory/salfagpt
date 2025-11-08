#!/usr/bin/env npx tsx
/**
 * Populate Production Lane with Git History as Feedback Tickets
 * 
 * Creates items in feedback_tickets collection (which RoadmapModal displays)
 * instead of backlog_items collection.
 */

import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const app = initializeApp({ projectId: 'salfagpt' });
const db = getFirestore(app);

const COMPANY_ID = 'getaifactory.com';
const USER_EMAIL = 'alec@getaifactory.com';
const USER_ID = '114671162830729001607';

interface ProductionFeature {
  title: string;
  description: string;
  priority: 'p0' | 'p1' | 'p2' | 'p3';
  csatImpact: number;
  npsImpact: number;
  roiImpact: number;
  affectedUsers: number;
  okrAlignment: string[];
  deployedDate: Date;
  category: string;
}

const PRODUCTION_FEATURES: ProductionFeature[] = [
  {
    title: 'Folder Organization',
    description: 'Organize conversations into folders for better navigation and management.',
    priority: 'p2',
    csatImpact: 2.5,
    npsImpact: 50,
    roiImpact: 3.0,
    affectedUsers: 300,
    okrAlignment: ['User Experience', 'Organization'],
    deployedDate: new Date('2025-01-11'),
    category: 'ui-improvement',
  },
  {
    title: 'Model Display Indicator',
    description: 'Visual indicator showing which AI model (Flash vs Pro) is responding.',
    priority: 'p2',
    csatImpact: 1.5,
    npsImpact: 30,
    roiImpact: 2.0,
    affectedUsers: 500,
    okrAlignment: ['Transparency', 'User Experience'],
    deployedDate: new Date('2025-01-11'),
    category: 'ui-improvement',
  },
  {
    title: 'Context Window Improvement',
    description: 'Enhanced context window display with detailed breakdown and history.',
    priority: 'p2',
    csatImpact: 2.0,
    npsImpact: 40,
    roiImpact: 2.5,
    affectedUsers: 400,
    okrAlignment: ['User Experience', 'Transparency'],
    deployedDate: new Date('2025-01-11'),
    category: 'ui-improvement',
  },
  {
    title: 'Chat Interface Foundation',
    description: 'Complete chat UI with Tailwind CSS, gradients, and mock data. Foundation for all features.',
    priority: 'p0',
    csatImpact: 5.0,
    npsImpact: 100,
    roiImpact: 20.0,
    affectedUsers: 1000,
    okrAlignment: ['Platform Foundation', 'User Experience'],
    deployedDate: new Date('2025-10-10'),
    category: 'feature-request',
  },
  {
    title: 'CI/CD Automation Pipeline',
    description: 'Automated testing, building, and deployment to Google Cloud Run.',
    priority: 'p1',
    csatImpact: 2.0,
    npsImpact: 40,
    roiImpact: 5.0,
    affectedUsers: 50,
    okrAlignment: ['Developer Experience', 'Deployment Speed'],
    deployedDate: new Date('2025-10-10'),
    category: 'feature-request',
  },
  {
    title: 'User Settings & Configuration',
    description: 'User-level model preferences, system prompts, and personalization.',
    priority: 'p1',
    csatImpact: 3.0,
    npsImpact: 60,
    roiImpact: 4.0,
    affectedUsers: 500,
    okrAlignment: ['User Experience', 'Personalization'],
    deployedDate: new Date('2025-10-10'),
    category: 'feature-request',
  },
  {
    title: 'Context Workflows System',
    description: 'Complete workflow system for processing PDFs, CSVs, Excel, Word documents with AI.',
    priority: 'p0',
    csatImpact: 4.5,
    npsImpact: 95,
    roiImpact: 15.0,
    affectedUsers: 800,
    okrAlignment: ['AI Capabilities', 'Document Processing'],
    deployedDate: new Date('2025-10-11'),
    category: 'feature-request',
  },
  {
    title: 'Context Management Dashboard',
    description: 'Complete context source management with upload, extraction, validation.',
    priority: 'p0',
    csatImpact: 4.8,
    npsImpact: 98,
    roiImpact: 18.0,
    affectedUsers: 800,
    okrAlignment: ['Context Quality', 'User Experience'],
    deployedDate: new Date('2025-10-13'),
    category: 'feature-request',
  },
  {
    title: 'Provider Management System',
    description: 'Gemini model pricing database and cost calculation utilities.',
    priority: 'p1',
    csatImpact: 2.5,
    npsImpact: 50,
    roiImpact: 4.0,
    affectedUsers: 100,
    okrAlignment: ['Cost Optimization', 'Transparency'],
    deployedDate: new Date('2025-10-15'),
    category: 'feature-request',
  },
  {
    title: 'Reference Persistence System',
    description: 'Persistent RAG reference tracking with visualization and debugging.',
    priority: 'p1',
    csatImpact: 3.0,
    npsImpact: 60,
    roiImpact: 5.0,
    affectedUsers: 400,
    okrAlignment: ['AI Quality', 'Debugging'],
    deployedDate: new Date('2025-10-19'),
    category: 'feature-request',
  },
  {
    title: 'Enhanced Context Source Details',
    description: 'Comprehensive context source detail modal with metadata and re-extraction.',
    priority: 'p2',
    csatImpact: 2.5,
    npsImpact: 50,
    roiImpact: 3.0,
    affectedUsers: 300,
    okrAlignment: ['User Experience', 'Context Quality'],
    deployedDate: new Date('2025-10-19'),
    category: 'ui-improvement',
  },
  {
    title: 'Domain-Based Sharing Model',
    description: 'Secure agent and context sharing within domains with role-based permissions.',
    priority: 'p0',
    csatImpact: 4.0,
    npsImpact: 85,
    roiImpact: 12.0,
    affectedUsers: 600,
    okrAlignment: ['Security', 'Collaboration'],
    deployedDate: new Date('2025-10-21'),
    category: 'feature-request',
  },
  {
    title: 'BigQuery Vector Search Integration',
    description: 'Advanced vector search capabilities using BigQuery for semantic retrieval.',
    priority: 'p1',
    csatImpact: 4.5,
    npsImpact: 90,
    roiImpact: 14.0,
    affectedUsers: 700,
    okrAlignment: ['AI Quality', 'Search Performance'],
    deployedDate: new Date('2025-10-22'),
    category: 'feature-request',
  },
  {
    title: 'RAG Reference Visualization',
    description: 'Visual display of RAG references with clickable sources and content preview.',
    priority: 'p2',
    csatImpact: 3.0,
    npsImpact: 65,
    roiImpact: 4.5,
    affectedUsers: 400,
    okrAlignment: ['Transparency', 'User Experience'],
    deployedDate: new Date('2025-10-22'),
    category: 'ui-improvement',
  },
  {
    title: 'RAG Optimization (2000/500 Chunks)',
    description: '10x improvement in RAG search quality through optimized chunking strategy.',
    priority: 'p0',
    csatImpact: 4.0,
    npsImpact: 90,
    roiImpact: 16.0,
    affectedUsers: 800,
    okrAlignment: ['AI Quality', 'Performance'],
    deployedDate: new Date('2025-10-24'),
    category: 'performance',
  },
  {
    title: 'Hierarchical Prompts System',
    description: 'Multi-stage prompt system with numbered stages (001-999) for better AI context.',
    priority: 'p1',
    csatImpact: 4.2,
    npsImpact: 92,
    roiImpact: 13.0,
    affectedUsers: 700,
    okrAlignment: ['AI Quality', 'Context Management'],
    deployedDate: new Date('2025-10-28'),
    category: 'feature-request',
  },
  {
    title: 'Archive Folders',
    description: 'Archive old folders to reduce clutter while preserving history.',
    priority: 'p3',
    csatImpact: 1.0,
    npsImpact: 20,
    roiImpact: 1.5,
    affectedUsers: 200,
    okrAlignment: ['User Experience', 'Organization'],
    deployedDate: new Date('2025-10-28'),
    category: 'ui-improvement',
  },
  {
    title: 'Stella Marker Feedback System',
    description: 'Complete interactive feedback system with screenshot capture and annotations.',
    priority: 'p0',
    csatImpact: 4.8,
    npsImpact: 98,
    roiImpact: 22.0,
    affectedUsers: 1000,
    okrAlignment: ['User Feedback', 'Product Development'],
    deployedDate: new Date('2025-10-29'),
    category: 'feature-request',
  },
  {
    title: 'User Feedback Tracking',
    description: 'Privacy-aware feedback tracking with role-based access and analytics.',
    priority: 'p1',
    csatImpact: 3.5,
    npsImpact: 75,
    roiImpact: 8.0,
    affectedUsers: 500,
    okrAlignment: ['Privacy', 'Analytics'],
    deployedDate: new Date('2025-10-29'),
    category: 'feature-request',
  },
  {
    title: 'MCP Server - Cursor Integration',
    description: 'Model Context Protocol server providing real-time usage statistics for IDEs.',
    priority: 'p1',
    csatImpact: 4.5,
    npsImpact: 90,
    roiImpact: 10.0,
    affectedUsers: 50,
    okrAlignment: ['Developer Experience', 'API Integration'],
    deployedDate: new Date('2025-10-30'),
    category: 'feature-request',
  },
  {
    title: 'AI Prompt Enhancement System',
    description: 'AI-powered prompt improvement with setup document analysis and enhancement.',
    priority: 'p0',
    csatImpact: 4.5,
    npsImpact: 95,
    roiImpact: 17.0,
    affectedUsers: 900,
    okrAlignment: ['AI Quality', 'User Experience'],
    deployedDate: new Date('2025-10-30'),
    category: 'feature-request',
  },
  {
    title: 'Agent Queue System',
    description: 'Batch processing system for queuing multiple prompts with execution control.',
    priority: 'p1',
    csatImpact: 4.0,
    npsImpact: 85,
    roiImpact: 11.0,
    affectedUsers: 600,
    okrAlignment: ['Efficiency', 'Automation'],
    deployedDate: new Date('2025-10-31'),
    category: 'feature-request',
  },
  {
    title: 'Agent Context Lazy Loading',
    description: 'Performance optimization - only loads context sources when needed.',
    priority: 'p2',
    csatImpact: 2.5,
    npsImpact: 60,
    roiImpact: 4.0,
    affectedUsers: 800,
    okrAlignment: ['Performance', 'User Experience'],
    deployedDate: new Date('2025-10-31'),
    category: 'performance',
  },
  {
    title: 'Conversation Pagination',
    description: 'Efficient pagination for conversation lists to improve load times.',
    priority: 'p2',
    csatImpact: 2.0,
    npsImpact: 45,
    roiImpact: 2.5,
    affectedUsers: 700,
    okrAlignment: ['Performance', 'User Experience'],
    deployedDate: new Date('2025-10-31'),
    category: 'performance',
  },
  {
    title: 'Chunked Document Extraction',
    description: 'Large file support with chunked extraction for documents over 20MB.',
    priority: 'p1',
    csatImpact: 3.5,
    npsImpact: 75,
    roiImpact: 7.0,
    affectedUsers: 400,
    okrAlignment: ['Document Processing', 'Scalability'],
    deployedDate: new Date('2025-11-02'),
    category: 'feature-request',
  },
  {
    title: 'Enhanced Embedding Progress',
    description: 'Real-time progress tracking for embedding generation with detailed status.',
    priority: 'p2',
    csatImpact: 1.5,
    npsImpact: 35,
    roiImpact: 2.0,
    affectedUsers: 400,
    okrAlignment: ['User Experience', 'Transparency'],
    deployedDate: new Date('2025-11-02'),
    category: 'ui-improvement',
  },
  {
    title: 'Parallel Uploads with Skip',
    description: 'Upload multiple documents simultaneously with option to skip problematic files.',
    priority: 'p1',
    csatImpact: 3.0,
    npsImpact: 70,
    roiImpact: 6.0,
    affectedUsers: 500,
    okrAlignment: ['User Experience', 'Efficiency'],
    deployedDate: new Date('2025-11-02'),
    category: 'feature-request',
  },
  {
    title: 'Vision API Chunking',
    description: 'Advanced PDF processing with Vision API for better image and table extraction.',
    priority: 'p1',
    csatImpact: 4.0,
    npsImpact: 88,
    roiImpact: 12.0,
    affectedUsers: 600,
    okrAlignment: ['AI Quality', 'Document Processing'],
    deployedDate: new Date('2025-11-02'),
    category: 'feature-request',
  },
  {
    title: 'User Analytics Dashboard',
    description: 'Comprehensive analytics for user activity, agent usage, and cost tracking.',
    priority: 'p1',
    csatImpact: 3.8,
    npsImpact: 88,
    roiImpact: 9.0,
    affectedUsers: 100,
    okrAlignment: ['Analytics', 'Data-Driven Decisions'],
    deployedDate: new Date('2025-11-04'),
    category: 'feature-request',
  },
  {
    title: 'Advanced Analytics - Agents Tab',
    description: 'Detailed agent performance analytics with usage patterns and cost breakdown.',
    priority: 'p2',
    csatImpact: 3.0,
    npsImpact: 70,
    roiImpact: 7.0,
    affectedUsers: 80,
    okrAlignment: ['Analytics', 'Agent Optimization'],
    deployedDate: new Date('2025-11-05'),
    category: 'feature-request',
  },
  {
    title: 'Feedback Backlog Integration',
    description: 'Complete integration of user feedback into Roadmap with privacy-aware loading.',
    priority: 'p0',
    csatImpact: 4.8,
    npsImpact: 96,
    roiImpact: 20.0,
    affectedUsers: 1000,
    okrAlignment: ['Product Development', 'User Feedback'],
    deployedDate: new Date('2025-11-06'),
    category: 'feature-request',
  },
];

async function createFeedbackTicket(feature: ProductionFeature, index: number) {
  const ticketId = `PROD-${Date.now()}-${index.toString().padStart(2, '0')}`;
  
  const ticket = {
    // Identity
    ticketId,
    feedbackId: `git-history-${index}`,
    messageId: '',
    conversationId: '',
    
    // Content
    title: feature.title,
    description: feature.description,
    category: feature.category,
    
    // User info (use your admin account)
    reportedBy: USER_ID,
    reportedByEmail: USER_EMAIL,
    reportedByName: 'Alec (Git History)',
    reportedByRole: 'admin',
    createdByRole: 'admin',
    createdByName: 'Alec',
    createdByEmail: USER_EMAIL,
    userDomain: 'getaifactory.com',
    companyDomain: 'getaifactory.com',
    
    // Roadmap state
    lane: 'production',
    status: 'completed',
    priority: feature.priority,
    
    // Impact metrics
    estimatedCSAT: feature.csatImpact,
    estimatedNPS: feature.npsImpact,
    estimatedROI: feature.roiImpact,
    csatImpact: feature.csatImpact,
    npsImpact: feature.npsImpact,
    roiImpact: feature.roiImpact,
    affectedUsers: feature.affectedUsers,
    
    // Effort & OKRs
    estimatedEffort: 'm',
    okrAlignment: feature.okrAlignment,
    customKPIs: [],
    
    // Viral metrics
    upvotes: feature.affectedUsers / 10, // Simulated engagement
    upvotedBy: [],
    shares: 0,
    
    // Timestamps
    createdAt: feature.deployedDate,
    updatedAt: new Date(),
    resolvedAt: feature.deployedDate,
    
    // Source tracking
    source: 'production',
    companyId: COMPANY_ID,
  };
  
  await db.collection('feedback_tickets').add(ticket);
  
  return ticketId;
}

async function main() {
  console.log('🚀 Populating Production Lane (feedback_tickets)\n');
  console.log('═'.repeat(70));
  console.log('');
  
  // Sort by date
  const sorted = [...PRODUCTION_FEATURES].sort(
    (a, b) => a.deployedDate.getTime() - b.deployedDate.getTime()
  );
  
  console.log(`📅 Creating ${sorted.length} production tickets...\n`);
  
  let created = 0;
  
  for (let i = 0; i < sorted.length; i++) {
    const feature = sorted[i];
    
    try {
      const ticketId = await createFeedbackTicket(feature, i);
      
      console.log(`✅ ${i + 1}. ${feature.title}`);
      console.log(`   Ticket: ${ticketId}`);
      console.log(`   Date: ${feature.deployedDate.toLocaleDateString()}`);
      console.log(`   Impact: CSAT +${feature.csatImpact} | NPS +${feature.npsImpact} | ROI: ${feature.roiImpact}x`);
      console.log('');
      
      created++;
    } catch (error) {
      console.error(`❌ Failed: ${feature.title}`);
      console.error(`   Error: ${error}`);
    }
  }
  
  console.log('═'.repeat(70));
  console.log('');
  console.log(`🎉 Created ${created} production tickets!`);
  console.log('');
  console.log('🌐 Refresh Roadmap modal to see them in Production column');
  console.log('');
  
  process.exit(0);
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

