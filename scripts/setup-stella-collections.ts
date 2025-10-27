#!/usr/bin/env npx tsx
/**
 * Setup Script: Create Firestore collections and indexes for Stella system
 * 
 * Creates:
 * - feedback_sessions
 * - feedback_tickets
 * - backlog_items
 * - roadmap_items
 * - feedback_agent_memory
 * - company_okrs
 * - worktree_assignments
 * - ticket_counters
 * 
 * Also creates required composite indexes
 */

import { firestore } from '../src/lib/firestore';

async function setupStellaCollections() {
  console.log('🚀 Setting up Stella Viral Feedback Loop collections...\n');
  
  try {
    // Create sample documents to initialize collections
    
    // 1. feedback_sessions
    console.log('1️⃣  Creating feedback_sessions collection...');
    const sessionRef = await firestore.collection('feedback_sessions').add({
      userId: 'setup',
      companyId: 'setup',
      sessionType: 'general_feedback',
      status: 'active',
      priority: 'medium',
      messages: [],
      screenshots: [],
      annotations: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      source: 'localhost',
    });
    console.log('   ✅ Created with sample doc:', sessionRef.id);
    await sessionRef.delete(); // Clean up
    
    // 2. feedback_tickets
    console.log('2️⃣  Creating feedback_tickets collection...');
    const ticketRef = await firestore.collection('feedback_tickets').add({
      ticketId: 'SETUP-0000',
      sessionId: 'setup',
      userId: 'setup',
      companyId: 'setup',
      type: 'general_feedback',
      title: 'Setup ticket',
      status: 'submitted',
      priority: 'low',
      upvotes: 0,
      upvotedBy: [],
      views: 0,
      viewedBy: [],
      shares: 0,
      sharedBy: [],
      shareChain: [],
      viralCoefficient: 0,
      isPublic: false,
      requiresAuth: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      source: 'localhost',
    });
    console.log('   ✅ Created with sample doc:', ticketRef.id);
    await ticketRef.delete();
    
    // 3. backlog_items
    console.log('3️⃣  Creating backlog_items collection...');
    const backlogRef = await firestore.collection('backlog_items').add({
      companyId: 'setup',
      title: 'Setup item',
      description: 'Setup description',
      userStory: 'As a setup, I want setup, so that setup',
      acceptanceCriteria: [],
      feedbackSessionIds: [],
      createdBy: 'admin',
      type: 'feature',
      category: 'other',
      tags: [],
      priority: 'low',
      estimatedEffort: 's',
      estimatedCSATImpact: 0,
      estimatedNPSImpact: 0,
      affectedUsers: 0,
      alignedOKRs: [],
      okrImpactScore: 0,
      status: 'new',
      lane: 'backlog',
      position: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      source: 'localhost',
    });
    console.log('   ✅ Created with sample doc:', backlogRef.id);
    await backlogRef.delete();
    
    // 4. roadmap_items
    console.log('4️⃣  Creating roadmap_items collection...');
    const roadmapRef = await firestore.collection('roadmap_items').add({
      companyId: 'setup',
      title: 'Setup roadmap',
      description: 'Setup description',
      objectives: [],
      backlogItemIds: [],
      feedbackSessionIds: [],
      quarter: 'Q1 2025',
      status: 'planned',
      progress: 0,
      estimatedCSATImpact: 0,
      estimatedNPSImpact: 0,
      affectedUsers: 0,
      alignedOKRs: [],
      okrImpactScore: 0,
      strategicValue: 'low',
      adminApproved: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      source: 'localhost',
    });
    console.log('   ✅ Created with sample doc:', roadmapRef.id);
    await roadmapRef.delete();
    
    // 5. feedback_agent_memory
    console.log('5️⃣  Creating feedback_agent_memory collection...');
    const memoryRef = await firestore.collection('feedback_agent_memory').doc('setup');
    await memoryRef.set({
      userId: 'setup',
      companyId: 'setup',
      previousFeedback: [],
      preferredCommunicationStyle: 'concise',
      commonPainPoints: [],
      frequentFeatureRequests: [],
      totalSessions: 0,
      averageSessionLength: 0,
      lastInteractionAt: new Date(),
      updatedAt: new Date(),
      source: 'localhost',
    });
    console.log('   ✅ Created with sample doc');
    await memoryRef.delete();
    
    // 6. company_okrs
    console.log('6️⃣  Creating company_okrs collection...');
    const okrRef = await firestore.collection('company_okrs').add({
      companyId: 'setup',
      objective: 'Setup objective',
      keyResults: [],
      quarter: 'Q1 2025',
      year: 2025,
      status: 'active',
      currentProgress: 0,
      targetProgress: 0,
      onTrack: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      source: 'localhost',
    });
    console.log('   ✅ Created with sample doc:', okrRef.id);
    await okrRef.delete();
    
    // 7. worktree_assignments
    console.log('7️⃣  Creating worktree_assignments collection...');
    const worktreeRef = await firestore.collection('worktree_assignments').add({
      worktreePath: '/setup',
      branchName: 'setup',
      port: 3001,
      backlogItemId: 'setup',
      assignedTo: 'setup',
      status: 'setup',
      progress: 0,
      commits: 0,
      filesChanged: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      source: 'localhost',
    });
    console.log('   ✅ Created with sample doc:', worktreeRef.id);
    await worktreeRef.delete();
    
    // 8. ticket_counters
    console.log('8️⃣  Creating ticket_counters collection...');
    const counterRef = await firestore.collection('ticket_counters').doc('demo-FEAT');
    await counterRef.set({
      count: 0,
      updatedAt: new Date(),
    });
    console.log('   ✅ Created counter document');
    
    console.log('\n✅ All Stella collections created successfully!\n');
    
    // Display indexes to create
    console.log('📋 Next steps: Create these Firestore indexes\n');
    console.log('Method 1: Firebase Console');
    console.log('→ https://console.firebase.google.com/project/gen-lang-client-0986191192/firestore/indexes\n');
    
    console.log('Method 2: gcloud CLI\n');
    
    console.log('# feedback_sessions indexes');
    console.log('gcloud firestore indexes composite create \\');
    console.log('  --collection-group=feedback_sessions \\');
    console.log('  --field-config field-path=userId,order=ascending \\');
    console.log('  --field-config field-path=createdAt,order=descending\n');
    
    console.log('gcloud firestore indexes composite create \\');
    console.log('  --collection-group=feedback_sessions \\');
    console.log('  --field-config field-path=companyId,order=ascending \\');
    console.log('  --field-config field-path=status,order=ascending \\');
    console.log('  --field-config field-path=createdAt,order=descending\n');
    
    console.log('# feedback_tickets indexes');
    console.log('gcloud firestore indexes composite create \\');
    console.log('  --collection-group=feedback_tickets \\');
    console.log('  --field-config field-path=companyId,order=ascending \\');
    console.log('  --field-config field-path=status,order=ascending \\');
    console.log('  --field-config field-path=priority,order=descending\n');
    
    console.log('# backlog_items indexes');
    console.log('gcloud firestore indexes composite create \\');
    console.log('  --collection-group=backlog_items \\');
    console.log('  --field-config field-path=companyId,order=ascending \\');
    console.log('  --field-config field-path=lane,order=ascending \\');
    console.log('  --field-config field-path=position,order=ascending\n');
    
    console.log('📚 See .cursor/rules/feedback-system.mdc for complete index list\n');
    
  } catch (error) {
    console.error('❌ Error setting up collections:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

// Run setup
setupStellaCollections();

