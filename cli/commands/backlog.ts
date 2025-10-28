#!/usr/bin/env node
/**
 * CLI: Backlog Management Commands
 * 
 * Commands:
 * - flow-cli backlog list      - View backlog items
 * - flow-cli backlog create    - Create backlog item
 * - flow-cli backlog move      - Move item between lanes
 * - flow-cli backlog assign    - Assign to developer
 * - flow-cli backlog view      - View item details
 */

import { Command } from 'commander';
import { firestore } from '../lib/firestore';
import type { BacklogItem, BacklogLane } from '../../src/types/feedback';

const program = new Command();

program
  .name('backlog')
  .description('Manage backlog items');

// List backlog items
program
  .command('list')
  .description('List backlog items')
  .option('--company <companyId>', 'Company ID (defaults to current company)')
  .option('--lane <lane>', 'Filter by lane: backlog, next, now, done')
  .option('--priority <priority>', 'Filter by priority')
  .option('--status <status>', 'Filter by status')
  .option('--limit <number>', 'Limit results', '50')
  .action(async (options) => {
    try {
      console.log('📋 Fetching backlog items...\n');
      
      let query = firestore.collection('backlog_items');
      
      if (options.company) {
        query = query.where('companyId', '==', options.company);
      }
      
      if (options.lane) {
        query = query.where('lane', '==', options.lane);
      }
      
      if (options.priority) {
        query = query.where('priority', '==', options.priority);
      }
      
      if (options.status) {
        query = query.where('status', '==', options.status);
      }
      
      const snapshot = await query
        .orderBy('position', 'asc')
        .limit(parseInt(options.limit))
        .get();
      
      if (snapshot.empty) {
        console.log('ℹ️  No backlog items found');
        return;
      }
      
      // Group by lane
      const byLane: Record<string, any[]> = {
        backlog: [],
        next: [],
        now: [],
        done: [],
      };
      
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        byLane[data.lane]?.push({ id: doc.id, ...data });
      });
      
      // Display by lane
      for (const [lane, items] of Object.entries(byLane)) {
        if (items.length === 0) continue;
        
        console.log(`\n${getLaneEmoji(lane)} ${lane.toUpperCase()} (${items.length} items)`);
        console.log('─'.repeat(60));
        
        items.forEach((item, idx) => {
          const priorityColor = getPriorityColor(item.priority);
          
          console.log(`\n${idx + 1}. ${item.title}`);
          console.log(`   ID: ${item.id}`);
          console.log(`   Priority: ${priorityColor}${item.priority}\x1b[0m`);
          console.log(`   Effort: ${item.estimatedEffort}`);
          console.log(`   CSAT: +${item.estimatedCSATImpact || 0} | NPS: +${item.estimatedNPSImpact || 0}`);
          
          if (item.assignedTo && item.assignedTo !== 'unassigned') {
            console.log(`   Assigned: ${item.assignedTo}`);
          }
          
          if (item.targetReleaseDate) {
            console.log(`   Target: ${new Date(item.targetReleaseDate.toDate()).toLocaleDateString()}`);
          }
        });
      }
      
      console.log('\n');
      
    } catch (error) {
      console.error('❌ Error listing backlog:', error);
      process.exit(1);
    }
  });

// Create backlog item
program
  .command('create')
  .description('Create new backlog item')
  .requiredOption('--title <title>', 'Item title')
  .requiredOption('--description <description>', 'Item description')
  .option('--type <type>', 'Type: feature, enhancement, bug, technical_debt, research', 'feature')
  .option('--priority <priority>', 'Priority: low, medium, high, critical', 'medium')
  .option('--effort <effort>', 'Effort: xs, s, m, l, xl', 'm')
  .option('--company <companyId>', 'Company ID')
  .action(async (options) => {
    try {
      console.log('📝 Creating backlog item...');
      
      const itemData: Omit<BacklogItem, 'id'> = {
        companyId: options.company || process.env.COMPANY_ID || 'demo',
        title: options.title,
        description: options.description,
        userStory: `As a user, I want ${options.title}, so that I can improve my workflow`,
        acceptanceCriteria: [],
        feedbackSessionIds: [],
        createdBy: 'admin',
        createdByUserId: process.env.USER_ID,
        type: options.type,
        category: 'other',
        tags: [],
        priority: options.priority,
        estimatedEffort: options.effort,
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
      };
      
      const ref = await firestore.collection('backlog_items').add(itemData);
      
      console.log('✅ Backlog item created!');
      console.log(`   ID: ${ref.id}`);
      console.log(`   Title: ${options.title}`);
      console.log(`   Lane: backlog\n`);
      
    } catch (error) {
      console.error('❌ Error creating item:', error);
      process.exit(1);
    }
  });

// Move item between lanes
program
  .command('move')
  .description('Move item between lanes')
  .argument('<itemId>', 'Backlog item ID')
  .requiredOption('--lane <lane>', 'Target lane: backlog, next, now, done')
  .action(async (itemId, options) => {
    try {
      await firestore.collection('backlog_items').doc(itemId).update({
        lane: options.lane,
        updatedAt: new Date(),
      });
      
      console.log(`✅ Moved to ${options.lane} lane`);
      
    } catch (error) {
      console.error('❌ Error moving item:', error);
      process.exit(1);
    }
  });

// Assign to developer
program
  .command('assign')
  .description('Assign item to developer')
  .argument('<itemId>', 'Backlog item ID')
  .requiredOption('--developer <userId>', 'Developer user ID')
  .action(async (itemId, options) => {
    try {
      await firestore.collection('backlog_items').doc(itemId).update({
        assignedTo: options.developer,
        updatedAt: new Date(),
      });
      
      console.log(`✅ Assigned to ${options.developer}`);
      
    } catch (error) {
      console.error('❌ Error assigning item:', error);
      process.exit(1);
    }
  });

// View item details
program
  .command('view')
  .description('View backlog item details')
  .argument('<itemId>', 'Backlog item ID')
  .action(async (itemId) => {
    try {
      const doc = await firestore.collection('backlog_items').doc(itemId).get();
      
      if (!doc.exists) {
        console.log('❌ Item not found');
        process.exit(1);
      }
      
      const item = { id: doc.id, ...doc.data() } as BacklogItem;
      
      console.log('\n' + '='.repeat(60));
      console.log(`📋 ${item.title}`);
      console.log('='.repeat(60) + '\n');
      
      console.log(`ID: ${doc.id}`);
      console.log(`Type: ${item.type}`);
      console.log(`Priority: ${item.priority}`);
      console.log(`Effort: ${item.estimatedEffort}`);
      console.log(`Lane: ${item.lane}`);
      console.log(`Status: ${item.status}\n`);
      
      console.log('Description:');
      console.log(item.description);
      console.log('');
      
      if (item.userStory) {
        console.log('User Story:');
        console.log(item.userStory);
        console.log('');
      }
      
      if (item.acceptanceCriteria.length > 0) {
        console.log('Acceptance Criteria:');
        item.acceptanceCriteria.forEach((criteria, idx) => {
          console.log(`  ${idx + 1}. ${criteria}`);
        });
        console.log('');
      }
      
      console.log('Impact:');
      console.log(`  CSAT: +${item.estimatedCSATImpact}/5`);
      console.log(`  NPS: ${item.estimatedNPSImpact > 0 ? '+' : ''}${item.estimatedNPSImpact}`);
      console.log(`  Users: ~${item.affectedUsers}`);
      console.log(`  OKR: ${item.okrImpactScore}/10\n`);
      
      if (item.assignedTo) {
        console.log(`Assigned: ${item.assignedTo}`);
      }
      
      if (item.worktreeId) {
        console.log(`Worktree: ${item.worktreeId}`);
      }
      
      if (item.branchName) {
        console.log(`Branch: ${item.branchName}`);
      }
      
      if (item.prUrl) {
        console.log(`PR: ${item.prUrl}`);
      }
      
      console.log('\n' + '='.repeat(60) + '\n');
      
    } catch (error) {
      console.error('❌ Error viewing item:', error);
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
    'low': '\x1b[90m',      // Gray
    'medium': '\x1b[33m',   // Yellow
    'high': '\x1b[35m',     // Magenta
    'critical': '\x1b[31m', // Red
  };
  return colors[priority] || '\x1b[0m';
}

program.parse();

