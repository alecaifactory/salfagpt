#!/usr/bin/env npx tsx
/**
 * Populate Production Lane with Git History
 * 
 * Analyzes feature documentation to create backlog items in Production lane,
 * representing shipped features in chronological order.
 * 
 * Usage:
 *   npx tsx scripts/populate-production-roadmap.ts
 *   npx tsx scripts/populate-production-roadmap.ts --dry-run
 */

import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';
import { firestore } from '../src/lib/firestore';
import type { BacklogItem } from '../src/types/feedback';

// Configuration
const COMPANY_ID = 'getaifactory.com';
const USER_EMAIL = 'alec@getaifactory.com';
const USER_ID = '114671162830729001607';

interface ProductionFeature {
  title: string;
  description: string;
  type: 'feature' | 'bug' | 'enhancement' | 'technical_debt';
  priority: 'low' | 'medium' | 'high' | 'critical';
  effort: 'xs' | 's' | 'm' | 'l' | 'xl';
  csatImpact: number;
  npsImpact: number;
  affectedUsers: number;
  okrAlignment: string[];
  deployedDate: Date;
  docPath: string;
  category: string;
}

// Key features to add (based on docs analysis)
const PRODUCTION_FEATURES: ProductionFeature[] = [
  {
    title: 'Chat Interface Foundation',
    description: 'Complete chat UI with Tailwind CSS, gradients, and mock data. Foundation for all conversational features.',
    type: 'feature',
    priority: 'critical',
    effort: 'xl',
    csatImpact: 5.0,
    npsImpact: 100,
    affectedUsers: 1000,
    okrAlignment: ['Platform Foundation', 'User Experience'],
    deployedDate: new Date('2025-10-10'),
    docPath: 'docs/features/chat-interface-2025-10-10.md',
    category: 'platform',
  },
  {
    title: 'CI/CD Automation Pipeline',
    description: 'Automated testing, building, and deployment to Google Cloud Run with proper authentication and security.',
    type: 'feature',
    priority: 'high',
    effort: 'l',
    csatImpact: 2.0,
    npsImpact: 40,
    affectedUsers: 50,
    okrAlignment: ['Developer Experience', 'Deployment Speed'],
    deployedDate: new Date('2025-10-10'),
    docPath: 'docs/features/cicd-automation-2025-10-10.md',
    category: 'platform',
  },
  {
    title: 'User Settings & Configuration',
    description: 'User-level model preferences, system prompts, and personalization settings with persistence.',
    type: 'feature',
    priority: 'high',
    effort: 'm',
    csatImpact: 3.0,
    npsImpact: 60,
    affectedUsers: 500,
    okrAlignment: ['User Experience', 'Personalization'],
    deployedDate: new Date('2025-10-10'),
    docPath: 'docs/features/user-menu-logout-2025-10-10.md',
    category: 'user_management',
  },
  {
    title: 'Context Workflows System',
    description: 'Complete workflow system for processing PDFs, CSVs, Excel, Word documents, and URLs with AI extraction.',
    type: 'feature',
    priority: 'critical',
    effort: 'xl',
    csatImpact: 4.5,
    npsImpact: 95,
    affectedUsers: 800,
    okrAlignment: ['AI Capabilities', 'Document Processing'],
    deployedDate: new Date('2025-10-11'),
    docPath: 'docs/features/context-workflows-system-2025-10-11.md',
    category: 'context_management',
  },
  {
    title: 'Folder Organization',
    description: 'Organize conversations into folders for better navigation and management.',
    type: 'feature',
    priority: 'medium',
    effort: 's',
    csatImpact: 2.5,
    npsImpact: 50,
    affectedUsers: 300,
    okrAlignment: ['User Experience', 'Organization'],
    deployedDate: new Date('2025-01-11'),
    docPath: 'docs/features/folders-organization-2025-01-11.md',
    category: 'ui',
  },
  {
    title: 'Model Display Indicator',
    description: 'Visual indicator showing which AI model (Flash vs Pro) is responding to user messages.',
    type: 'feature',
    priority: 'medium',
    effort: 'xs',
    csatImpact: 1.5,
    npsImpact: 30,
    affectedUsers: 500,
    okrAlignment: ['Transparency', 'User Experience'],
    deployedDate: new Date('2025-01-11'),
    docPath: 'docs/features/model-display-2025-01-11.md',
    category: 'ui',
  },
  {
    title: 'Context Window Improvement',
    description: 'Enhanced context window display with detailed breakdown and full conversation history visualization.',
    type: 'enhancement',
    priority: 'medium',
    effort: 'm',
    csatImpact: 2.0,
    npsImpact: 40,
    affectedUsers: 400,
    okrAlignment: ['User Experience', 'Transparency'],
    deployedDate: new Date('2025-01-11'),
    docPath: 'docs/features/context-window-improvement-2025-01-11.md',
    category: 'ui',
  },
  {
    title: 'Context Management Dashboard',
    description: 'Complete context source management with upload, extraction, validation, and agent assignment.',
    type: 'feature',
    priority: 'critical',
    effort: 'xl',
    csatImpact: 4.8,
    npsImpact: 98,
    affectedUsers: 800,
    okrAlignment: ['Context Quality', 'User Experience'],
    deployedDate: new Date('2025-10-13'),
    docPath: 'docs/features/context-management-2025-10-13.md',
    category: 'context_management',
  },
  {
    title: 'Provider Management System',
    description: 'Gemini model pricing database and cost calculation utilities for accurate agent cost tracking.',
    type: 'feature',
    priority: 'high',
    effort: 'l',
    csatImpact: 2.5,
    npsImpact: 50,
    affectedUsers: 100,
    okrAlignment: ['Cost Optimization', 'Transparency'],
    deployedDate: new Date('2025-10-15'),
    docPath: 'docs/features/provider-management-2025-10-15.md',
    category: 'platform',
  },
  {
    title: 'Reference Persistence System',
    description: 'Persistent RAG reference tracking with visualization and debugging capabilities.',
    type: 'feature',
    priority: 'high',
    effort: 'm',
    csatImpact: 3.0,
    npsImpact: 60,
    affectedUsers: 400,
    okrAlignment: ['AI Quality', 'Debugging'],
    deployedDate: new Date('2025-10-19'),
    docPath: 'docs/features/reference-persistence-2025-10-19.md',
    category: 'rag_system',
  },
  {
    title: 'Enhanced Context Source Details',
    description: 'Comprehensive context source detail modal with metadata, validation, and re-extraction options.',
    type: 'enhancement',
    priority: 'medium',
    effort: 'm',
    csatImpact: 2.5,
    npsImpact: 50,
    affectedUsers: 300,
    okrAlignment: ['User Experience', 'Context Quality'],
    deployedDate: new Date('2025-10-19'),
    docPath: 'docs/features/enhanced-context-source-details-2025-10-19.md',
    category: 'context_management',
  },
  {
    title: 'Domain-Based Sharing Model',
    description: 'Secure agent and context sharing within domains with role-based permissions.',
    type: 'feature',
    priority: 'critical',
    effort: 'xl',
    csatImpact: 4.0,
    npsImpact: 85,
    affectedUsers: 600,
    okrAlignment: ['Security', 'Collaboration'],
    deployedDate: new Date('2025-10-21'),
    docPath: 'docs/features/user-groups-sharing.md',
    category: 'security',
  },
  {
    title: 'BigQuery Vector Search Integration',
    description: 'Advanced vector search capabilities using BigQuery for semantic context retrieval.',
    type: 'feature',
    priority: 'high',
    effort: 'xl',
    csatImpact: 4.5,
    npsImpact: 90,
    affectedUsers: 700,
    okrAlignment: ['AI Quality', 'Search Performance'],
    deployedDate: new Date('2025-10-22'),
    docPath: 'docs/features/bigquery-vector-search-2025-10-22.md',
    category: 'rag_system',
  },
  {
    title: 'RAG Reference Visualization',
    description: 'Visual display of RAG references with clickable sources and content preview.',
    type: 'feature',
    priority: 'medium',
    effort: 'm',
    csatImpact: 3.0,
    npsImpact: 65,
    affectedUsers: 400,
    okrAlignment: ['Transparency', 'User Experience'],
    deployedDate: new Date('2025-10-22'),
    docPath: 'docs/features/rag-reference-visualization-2025-10-22.md',
    category: 'rag_system',
  },
  {
    title: 'RAG Optimization (2000/500 Chunks)',
    description: '10x improvement in RAG search quality through optimized chunking strategy (2000 tokens/500 overlap).',
    type: 'enhancement',
    priority: 'critical',
    effort: 'l',
    csatImpact: 4.0,
    npsImpact: 90,
    affectedUsers: 800,
    okrAlignment: ['AI Quality', 'Performance', 'Cost Efficiency'],
    deployedDate: new Date('2025-10-24'),
    docPath: 'docs/SESSION_COMPLETE_2025-10-24.md',
    category: 'rag_system',
  },
  {
    title: 'Hierarchical Prompts System',
    description: 'Multi-stage prompt system with numbered stages (001-999) for better AI context understanding.',
    type: 'feature',
    priority: 'high',
    effort: 'l',
    csatImpact: 4.2,
    npsImpact: 92,
    affectedUsers: 700,
    okrAlignment: ['AI Quality', 'Context Management'],
    deployedDate: new Date('2025-10-28'),
    docPath: 'docs/features/hierarchical-prompts-2025-10-28.md',
    category: 'prompts',
  },
  {
    title: 'Archive Folders',
    description: 'Archive old folders to reduce clutter while preserving conversation history.',
    type: 'feature',
    priority: 'low',
    effort: 's',
    csatImpact: 1.0,
    npsImpact: 20,
    affectedUsers: 200,
    okrAlignment: ['User Experience', 'Organization'],
    deployedDate: new Date('2025-10-28'),
    docPath: 'docs/features/archive-folders-2025-10-28.md',
    category: 'ui',
  },
  {
    title: 'Feedback System with Stella Marker',
    description: 'Complete interactive feedback system with screenshot capture, annotations, and instant submission.',
    type: 'feature',
    priority: 'critical',
    effort: 'xl',
    csatImpact: 4.8,
    npsImpact: 98,
    affectedUsers: 1000,
    okrAlignment: ['User Feedback', 'Product Development', 'User Experience'],
    deployedDate: new Date('2025-10-29'),
    docPath: 'docs/features/FEEDBACK_SYSTEM_2025-10-29.md',
    category: 'feedback',
  },
  {
    title: 'User Feedback Tracking',
    description: 'Privacy-aware feedback tracking with role-based access and comprehensive analytics.',
    type: 'feature',
    priority: 'high',
    effort: 'l',
    csatImpact: 3.5,
    npsImpact: 75,
    affectedUsers: 500,
    okrAlignment: ['Privacy', 'Analytics', 'User Feedback'],
    deployedDate: new Date('2025-10-29'),
    docPath: 'docs/features/USER_FEEDBACK_TRACKING_2025-10-29.md',
    category: 'feedback',
  },
  {
    title: 'MCP Server - Cursor Integration',
    description: 'Model Context Protocol server providing real-time usage statistics for AI development tools.',
    type: 'feature',
    priority: 'high',
    effort: 'l',
    csatImpact: 4.5,
    npsImpact: 90,
    affectedUsers: 50,
    okrAlignment: ['Developer Experience', 'Analytics', 'API Integration'],
    deployedDate: new Date('2025-10-30'),
    docPath: 'docs/MCP_COMPLETE_IMPLEMENTATION_2025-10-30.md',
    category: 'developer_tools',
  },
  {
    title: 'AI Prompt Enhancement System',
    description: 'AI-powered prompt improvement with setup document analysis and one-click enhancement.',
    type: 'feature',
    priority: 'critical',
    effort: 'xl',
    csatImpact: 4.5,
    npsImpact: 95,
    affectedUsers: 900,
    okrAlignment: ['AI Quality', 'User Experience', 'Automation'],
    deployedDate: new Date('2025-10-30'),
    docPath: 'docs/features/ai-prompt-enhancement-2025-10-30.md',
    category: 'ai_capabilities',
  },
  {
    title: 'Agent Queue System',
    description: 'Batch processing system for queuing multiple prompts with sequential/parallel execution.',
    type: 'feature',
    priority: 'high',
    effort: 'l',
    csatImpact: 4.0,
    npsImpact: 85,
    affectedUsers: 600,
    okrAlignment: ['Efficiency', 'Automation', 'User Experience'],
    deployedDate: new Date('2025-10-31'),
    docPath: 'docs/features/queue-system-2025-10-31.md',
    category: 'workflow_automation',
  },
  {
    title: 'Agent Context Lazy Loading',
    description: 'Performance optimization for context loading - only loads sources when needed.',
    type: 'enhancement',
    priority: 'medium',
    effort: 'm',
    csatImpact: 2.5,
    npsImpact: 60,
    affectedUsers: 800,
    okrAlignment: ['Performance', 'User Experience'],
    deployedDate: new Date('2025-10-31'),
    docPath: 'docs/features/agent-context-lazy-loading-2025-10-31.md',
    category: 'performance',
  },
  {
    title: 'Conversation Pagination',
    description: 'Efficient pagination for conversation lists to improve load times and UI responsiveness.',
    type: 'enhancement',
    priority: 'medium',
    effort: 's',
    csatImpact: 2.0,
    npsImpact: 45,
    affectedUsers: 700,
    okrAlignment: ['Performance', 'User Experience'],
    deployedDate: new Date('2025-10-31'),
    docPath: 'docs/features/conversation-pagination-2025-10-31.md',
    category: 'performance',
  },
  {
    title: 'Chunked Document Extraction',
    description: 'Large file support with chunked extraction for documents over 20MB using Cloud Functions.',
    type: 'feature',
    priority: 'high',
    effort: 'l',
    csatImpact: 3.5,
    npsImpact: 75,
    affectedUsers: 400,
    okrAlignment: ['Document Processing', 'Scalability'],
    deployedDate: new Date('2025-11-02'),
    docPath: 'docs/features/CHUNKED_EXTRACTION_2025-11-02.md',
    category: 'context_management',
  },
  {
    title: 'Enhanced Embedding Progress',
    description: 'Real-time progress tracking for embedding generation with detailed status updates.',
    type: 'enhancement',
    priority: 'medium',
    effort: 's',
    csatImpact: 1.5,
    npsImpact: 35,
    affectedUsers: 400,
    okrAlignment: ['User Experience', 'Transparency'],
    deployedDate: new Date('2025-11-02'),
    docPath: 'docs/features/ENHANCED_EMBEDDING_PROGRESS_2025-11-02.md',
    category: 'rag_system',
  },
  {
    title: 'Parallel Uploads with Skip',
    description: 'Upload multiple documents simultaneously with option to skip problematic files.',
    type: 'feature',
    priority: 'high',
    effort: 'm',
    csatImpact: 3.0,
    npsImpact: 70,
    affectedUsers: 500,
    okrAlignment: ['User Experience', 'Efficiency'],
    deployedDate: new Date('2025-11-02'),
    docPath: 'docs/features/parallel-uploads-skip-2025-11-02.md',
    category: 'context_management',
  },
  {
    title: 'Vision API Chunking',
    description: 'Advanced PDF processing with Vision API for better image and table extraction in chunks.',
    type: 'feature',
    priority: 'high',
    effort: 'l',
    csatImpact: 4.0,
    npsImpact: 88,
    affectedUsers: 600,
    okrAlignment: ['AI Quality', 'Document Processing'],
    deployedDate: new Date('2025-11-02'),
    docPath: 'docs/features/vision-api-chunking-2025-11-02.md',
    category: 'ai_capabilities',
  },
  {
    title: 'User Analytics Dashboard',
    description: 'Comprehensive analytics for user activity, agent usage, and cost tracking.',
    type: 'feature',
    priority: 'high',
    effort: 'l',
    csatImpact: 3.8,
    npsImpact: 88,
    affectedUsers: 100,
    okrAlignment: ['Analytics', 'Data-Driven Decisions'],
    deployedDate: new Date('2025-11-04'),
    docPath: 'docs/features/user-analytics-2025-11-04.md',
    category: 'analytics',
  },
  {
    title: 'Advanced Analytics - Agents Tab',
    description: 'Detailed agent performance analytics with usage patterns and cost breakdown.',
    type: 'feature',
    priority: 'medium',
    effort: 'm',
    csatImpact: 3.0,
    npsImpact: 70,
    affectedUsers: 80,
    okrAlignment: ['Analytics', 'Agent Optimization'],
    deployedDate: new Date('2025-11-05'),
    docPath: 'docs/ADVANCED_ANALYTICS_AGENTS_TAB_2025-11-05.md',
    category: 'analytics',
  },
  {
    title: 'Feedback Backlog Integration',
    description: 'Complete integration of user feedback into Roadmap with privacy-aware loading and real-time updates.',
    type: 'feature',
    priority: 'critical',
    effort: 'l',
    csatImpact: 4.8,
    npsImpact: 96,
    affectedUsers: 1000,
    okrAlignment: ['Product Development', 'User Feedback', 'Roadmap Planning'],
    deployedDate: new Date('2025-11-06'),
    docPath: 'docs/features/feedback-backlog-integration-2025-11-06.md',
    category: 'feedback',
  },
];

// Create backlog item in Firestore
async function createProductionItem(feature: ProductionFeature, position: number): Promise<string> {
  const itemData: any = {
    companyId: COMPANY_ID,
    
    // Content
    title: feature.title,
    description: feature.description,
    userStory: `As a user, I benefit from ${feature.title.toLowerCase()}, so that I can be more productive and satisfied`,
    acceptanceCriteria: [
      'Feature is deployed to production',
      'No critical bugs reported',
      'Documentation is complete',
      'User testing completed',
    ],
    
    // Feedback integration
    feedbackSessionIds: [],
    
    // Creator
    createdBy: 'Git History Import',
    createdByUserId: USER_ID,
    
    // Classification
    type: feature.type,
    category: feature.category,
    tags: ['production', 'shipped', 'git-import', feature.category],
    
    // Priority & Effort
    priority: feature.priority,
    estimatedEffort: feature.effort,
    
    // Impact metrics
    estimatedCSATImpact: feature.csatImpact,
    estimatedNPSImpact: feature.npsImpact,
    affectedUsers: feature.affectedUsers,
    
    // OKR alignment
    alignedOKRs: feature.okrAlignment,
    okrImpactScore: feature.okrAlignment.length * 2,
    
    // Roadmap state
    status: 'completed',
    lane: 'production',
    position,
    
    // Workflow
    assignedTo: USER_EMAIL,
    // worktreeId, branchName, prUrl omitted (undefined not allowed in Firestore)
    
    // Timing
    startedAt: feature.deployedDate,
    completedAt: feature.deployedDate,
    targetReleaseDate: feature.deployedDate,
    
    // Metadata
    createdAt: feature.deployedDate,
    updatedAt: new Date(),
    source: 'production',
  };
  
  // Filter out undefined values
  const cleanItem = Object.fromEntries(
    Object.entries(itemData).filter(([_, v]) => v !== undefined)
  );
  
  const ref = await firestore.collection('backlog_items').add(cleanItem);
  
  return ref.id;
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  
  console.log('🚀 Populating Production Roadmap from Git History\n');
  console.log('═'.repeat(70));
  console.log('');
  console.log(`📧 User: ${USER_EMAIL}`);
  console.log(`🏢 Company: ${COMPANY_ID}`);
  console.log(`📅 Features: ${PRODUCTION_FEATURES.length}`);
  console.log('');
  
  if (dryRun) {
    console.log('🧪 DRY RUN MODE - No changes will be made\n');
    console.log('═'.repeat(70));
    console.log('');
  }
  
  // Sort by deployment date
  const sortedFeatures = [...PRODUCTION_FEATURES].sort(
    (a, b) => a.deployedDate.getTime() - b.deployedDate.getTime()
  );
  
  console.log('📝 Creating Production backlog items in chronological order...\n');
  
  let created = 0;
  const results: Array<{ title: string; id?: string; error?: string }> = [];
  
  for (let i = 0; i < sortedFeatures.length; i++) {
    const feature = sortedFeatures[i];
    
    try {
      if (dryRun) {
        console.log(`${i + 1}. [DRY RUN] ${feature.title}`);
        console.log(`   Date: ${feature.deployedDate.toLocaleDateString()}`);
        console.log(`   Impact: CSAT +${feature.csatImpact} | NPS +${feature.npsImpact} | Users: ${feature.affectedUsers}`);
        console.log(`   Priority: ${feature.priority.toUpperCase()} | Effort: ${feature.effort.toUpperCase()}`);
        console.log(`   OKRs: ${feature.okrAlignment.join(', ')}`);
        console.log('');
        
        results.push({ title: feature.title });
      } else {
        const itemId = await createProductionItem(feature, i);
        
        console.log(`✅ ${i + 1}. ${feature.title}`);
        console.log(`   ID: ${itemId}`);
        console.log(`   Date: ${feature.deployedDate.toLocaleDateString()}`);
        console.log(`   Impact: CSAT +${feature.csatImpact} | NPS +${feature.npsImpact}`);
        console.log(`   Category: ${feature.category}`);
        console.log('');
        
        created++;
        results.push({ title: feature.title, id: itemId });
      }
    } catch (error) {
      console.error(`❌ Failed: ${feature.title}`);
      console.error(`   Error: ${error}`);
      console.error('');
      
      results.push({ 
        title: feature.title, 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  }
  
  console.log('═'.repeat(70));
  console.log('');
  console.log('🎉 Production Roadmap Population Complete!\n');
  console.log(`✅ Created: ${created} items`);
  console.log(`❌ Failed: ${results.filter(r => r.error).length} items`);
  console.log('');
  
  // Summary stats
  const totalCSAT = sortedFeatures.reduce((sum, f) => sum + f.csatImpact, 0);
  const totalNPS = sortedFeatures.reduce((sum, f) => sum + f.npsImpact, 0);
  const totalUsers = sortedFeatures.reduce((sum, f) => sum + f.affectedUsers, 0);
  
  console.log('📈 Aggregate Impact of Shipped Features:');
  console.log(`   Total CSAT Impact: +${totalCSAT.toFixed(1)}`);
  console.log(`   Total NPS Impact: +${totalNPS}`);
  console.log(`   Total Users Affected: ~${totalUsers.toLocaleString()}`);
  console.log(`   Average CSAT per Feature: +${(totalCSAT / sortedFeatures.length).toFixed(2)}`);
  console.log('');
  
  console.log('📊 View in UI:');
  console.log('   http://localhost:3000/chat → Click "Roadmap" button');
  console.log('   Look in the 🟢 Production column');
  console.log('');
  
  if (!dryRun) {
    console.log('💡 Tip: Refresh your Roadmap modal to see the new items!');
    console.log('');
  }
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

