#!/usr/bin/env node
/**
 * CLI: Roadmap Management Commands
 * 
 * Commands:
 * - flow-cli roadmap analyze   - Run AI roadmap analysis
 * - flow-cli roadmap view      - View roadmap for quarter
 * - flow-cli roadmap approve   - Approve AI suggestions
 * - flow-cli roadmap reject    - Reject with reason
 */

import { Command } from 'commander';
import { firestore } from '../lib/firestore';
import type { RoadmapItem } from '../../src/types/feedback';

const program = new Command();

program
  .name('roadmap')
  .description('Manage roadmap planning');

// Analyze feedback for roadmap
program
  .command('analyze')
  .description('Run AI roadmap analysis')
  .requiredOption('--company <companyId>', 'Company ID')
  .requiredOption('--quarter <quarter>', 'Quarter (e.g., Q1 2025)')
  .option('--feedback <sessionIds...>', 'Specific feedback session IDs')
  .action(async (options) => {
    try {
      console.log('🤖 Running AI roadmap analysis...\n');
      console.log(`   Company: ${options.company}`);
      console.log(`   Quarter: ${options.quarter}\n`);
      
      const response = await fetch('http://localhost:3000/api/roadmap/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: options.company,
          quarter: options.quarter,
          feedbackSessionIds: options.feedback,
        }),
      });
      
      if (!response.ok) throw new Error('Analysis failed');
      
      const result = await response.json();
      
      console.log('✅ Analysis complete!\n');
      console.log('═'.repeat(60));
      console.log('AI ROADMAP RECOMMENDATIONS');
      console.log('═'.repeat(60) + '\n');
      
      // Rationale
      console.log('📊 Rationale:');
      console.log(result.rationale);
      console.log('');
      
      // Expected Outcomes
      console.log('🎯 Expected Outcomes:');
      console.log(`   CSAT Improvement: +${result.expectedOutcomes.csatImprovement}`);
      console.log(`   NPS Improvement: +${result.expectedOutcomes.npsImprovement}`);
      console.log(`   OKRs Impacted: ${Object.keys(result.expectedOutcomes.okrProgress).length}`);
      console.log('');
      
      // Feedback Clusters
      if (result.clusters.length > 0) {
        console.log('🔍 Feedback Clusters:');
        result.clusters.forEach((cluster, idx) => {
          console.log(`   ${idx + 1}. ${cluster.theme}`);
          console.log(`      ${cluster.feedbackIds.length} items • Impact: ${cluster.impactScore}`);
        });
        console.log('');
      }
      
      // New Backlog Items
      if (result.newBacklogItems.length > 0) {
        console.log(`📝 Suggested New Items (${result.newBacklogItems.length}):`);
        result.newBacklogItems.forEach((item, idx) => {
          console.log(`   ${idx + 1}. ${item.title}`);
          console.log(`      Priority: ${item.priority} | Effort: ${item.estimatedEffort}`);
          console.log(`      Impact: CSAT +${item.estimatedCSATImpact}, NPS +${item.estimatedNPSImpact}`);
        });
        console.log('');
      }
      
      // Priority Changes
      if (result.priorityChanges.length > 0) {
        console.log(`🔄 Suggested Priority Changes (${result.priorityChanges.length}):`);
        result.priorityChanges.forEach((change, idx) => {
          console.log(`   ${idx + 1}. Item ${change.itemId}`);
          console.log(`      ${change.currentPriority} → ${change.suggestedPriority}`);
          console.log(`      Reason: ${change.rationale}`);
        });
        console.log('');
      }
      
      // Roadmap Items
      if (result.roadmapRecommendations.length > 0) {
        console.log(`🗺️  Roadmap Items for ${options.quarter} (${result.roadmapRecommendations.length}):`);
        result.roadmapRecommendations.forEach((item, idx) => {
          console.log(`   ${idx + 1}. ${item.title}`);
          console.log(`      ${item.description}`);
          console.log(`      Strategic Value: ${item.strategicValue}`);
          console.log(`      AI Priority: ${item.aiPriorityScore}/100`);
        });
        console.log('');
      }
      
      console.log('═'.repeat(60));
      console.log('\n💡 To approve these recommendations:');
      console.log(`   flow-cli roadmap approve --company ${options.company} --quarter ${options.quarter}\n`);
      
    } catch (error) {
      console.error('❌ Error analyzing roadmap:', error);
      process.exit(1);
    }
  });

// View roadmap
program
  .command('view')
  .description('View roadmap for quarter')
  .requiredOption('--company <companyId>', 'Company ID')
  .requiredOption('--quarter <quarter>', 'Quarter')
  .action(async (options) => {
    try {
      const snapshot = await firestore
        .collection('roadmap_items')
        .where('companyId', '==', options.company)
        .where('quarter', '==', options.quarter)
        .orderBy('aiPriorityScore', 'desc')
        .get();
      
      if (snapshot.empty) {
        console.log(`ℹ️  No roadmap items for ${options.quarter}`);
        return;
      }
      
      console.log(`\n🗺️  Roadmap for ${options.quarter} (${snapshot.size} items)\n`);
      
      snapshot.docs.forEach((doc, idx) => {
        const item = doc.data() as RoadmapItem;
        const statusEmoji = item.adminApproved ? '✅' : '⏳';
        
        console.log(`${idx + 1}. ${statusEmoji} ${item.title}`);
        console.log(`   Status: ${item.status} (${item.progress}% complete)`);
        console.log(`   Strategic Value: ${item.strategicValue}`);
        console.log(`   Impact: CSAT +${item.estimatedCSATImpact}, NPS +${item.estimatedNPSImpact}`);
        console.log(`   Backlog Items: ${item.backlogItemIds.length}`);
        console.log(`   Admin Approved: ${item.adminApproved ? 'Yes' : 'Pending'}`);
        console.log('');
      });
      
    } catch (error) {
      console.error('❌ Error viewing roadmap:', error);
      process.exit(1);
    }
  });

// Approve AI recommendations
program
  .command('approve')
  .description('Approve AI roadmap suggestions')
  .requiredOption('--company <companyId>', 'Company ID')
  .requiredOption('--quarter <quarter>', 'Quarter')
  .option('--admin <userId>', 'Admin user ID')
  .action(async (options) => {
    try {
      console.log('✅ Approving AI roadmap suggestions...\n');
      
      // This would call the approve endpoint
      console.log('   Company:', options.company);
      console.log('   Quarter:', options.quarter);
      console.log('   Admin:', options.admin || process.env.USER_ID);
      console.log('');
      console.log('⚠️  Note: Full approval workflow requires API implementation');
      console.log('   See: src/pages/api/roadmap/approve.ts\n');
      
    } catch (error) {
      console.error('❌ Error approving:', error);
      process.exit(1);
    }
  });

// Reject recommendations
program
  .command('reject')
  .description('Reject AI roadmap suggestions')
  .requiredOption('--company <companyId>', 'Company ID')
  .requiredOption('--quarter <quarter>', 'Quarter')
  .requiredOption('--reason <reason>', 'Reason for rejection')
  .action(async (options) => {
    try {
      console.log('❌ Rejecting AI roadmap suggestions...\n');
      console.log(`   Reason: ${options.reason}\n`);
      console.log('⚠️  Note: Rejection workflow requires API implementation\n');
      
    } catch (error) {
      console.error('❌ Error rejecting:', error);
      process.exit(1);
    }
  });

// Helper functions
function getLaneEmoji(lane: string): string {
  const emojis: Record<string, string> = {
    'backlog': '📚',
    'next': '📅',
    'now': '🚀',
    'done': '✅',
  };
  return emojis[lane] || '📋';
}

function getPriorityColor(priority: string): string {
  const colors: Record<string, string> = {
    'low': '\x1b[90m',
    'medium': '\x1b[33m',
    'high': '\x1b[35m',
    'critical': '\x1b[31m',
  };
  return colors[priority] || '\x1b[0m';
}

program.parse();

