#!/usr/bin/env node
/**
 * CLI: Worktree Management from Backlog
 * 
 * Commands:
 * - flow-cli worktree create    - Create worktree from backlog item
 * - flow-cli worktree status    - Check worktree status
 * - flow-cli worktree list      - List all worktrees
 * - flow-cli worktree complete  - Mark worktree complete and merge
 */

import { Command } from 'commander';
import { execSync } from 'child_process';
import { firestore } from '../lib/firestore';
import type { BacklogItem, WorktreeAssignment } from '../../src/types/feedback';

const program = new Command();

program
  .name('worktree')
  .description('Manage worktrees from backlog items');

// Create worktree from backlog item
program
  .command('create')
  .description('Create worktree from backlog item')
  .argument('<backlogItemId>', 'Backlog item ID')
  .option('--port <number>', 'Port for dev server (3001-3003)', '3001')
  .option('--path <path>', 'Worktree path (optional)')
  .option('--developer <userId>', 'Assign to developer')
  .action(async (backlogItemId, options) => {
    try {
      console.log('🌳 Creating worktree from backlog item...\n');
      
      // 1. Get backlog item
      const itemDoc = await firestore.collection('backlog_items').doc(backlogItemId).get();
      
      if (!itemDoc.exists) {
        console.error('❌ Backlog item not found:', backlogItemId);
        process.exit(1);
      }
      
      const item = { id: itemDoc.id, ...itemDoc.data() } as BacklogItem;
      
      console.log(`📋 Backlog Item: ${item.title}`);
      console.log(`   Type: ${item.type}`);
      console.log(`   Priority: ${item.priority}`);
      console.log(`   Effort: ${item.estimatedEffort}\n`);
      
      // 2. Generate branch name
      const branchName = `feat/${sanitizeBranchName(item.title)}-${new Date().toISOString().split('T')[0]}`;
      
      // 3. Determine worktree path
      const worktreeNum = options.port.toString().slice(-1); // Extract number from port
      const worktreePath = options.path || 
        `/Users/alec/.cursor/worktrees/salfagpt/worktree-${worktreeNum}`;
      
      console.log(`📁 Worktree Details:`);
      console.log(`   Path: ${worktreePath}`);
      console.log(`   Branch: ${branchName}`);
      console.log(`   Port: ${options.port}\n`);
      
      // 4. Create worktree
      console.log('🔨 Creating worktree...');
      
      try {
        execSync(`git worktree add "${worktreePath}" -b ${branchName}`, {
          stdio: 'inherit',
          cwd: '/Users/alec/salfagpt',
        });
      } catch (error) {
        console.error('❌ Failed to create worktree');
        process.exit(1);
      }
      
      // 5. Configure port in astro.config.mjs
      console.log(`\n⚙️  Configuring port ${options.port}...`);
      
      const astroConfig = `import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import node from '@astrojs/node';

export default defineConfig({
  server: {
    port: ${options.port},
  },
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  integrations: [
    react(),
    tailwind({ applyBaseStyles: true }),
  ],
});
`;
      
      const fs = require('fs');
      fs.writeFileSync(`${worktreePath}/astro.config.mjs`, astroConfig);
      
      // 6. Create worktree assignment in Firestore
      console.log('💾 Saving worktree assignment...');
      
      const assignmentData: Omit<WorktreeAssignment, 'id'> = {
        worktreePath,
        branchName,
        port: parseInt(options.port),
        backlogItemId,
        assignedTo: options.developer || process.env.USER_ID || 'unassigned',
        status: 'setup',
        progress: 0,
        commits: 0,
        filesChanged: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        source: 'localhost',
      };
      
      const assignmentRef = await firestore.collection('worktree_assignments').add(assignmentData);
      
      // 7. Update backlog item
      await firestore.collection('backlog_items').doc(backlogItemId).update({
        status: 'in_progress',
        lane: 'now',
        worktreeId: assignmentRef.id,
        branchName,
        startedAt: new Date(),
        updatedAt: new Date(),
      });
      
      console.log('\n✅ Worktree created successfully!\n');
      console.log('📝 Next steps:');
      console.log(`   1. cd ${worktreePath}`);
      console.log(`   2. npm install (if needed)`);
      console.log(`   3. npm run dev (starts on port ${options.port})`);
      console.log(`   4. Open http://localhost:${options.port}\n`);
      console.log('📋 Backlog item moved to "Now" lane\n');
      
    } catch (error) {
      console.error('❌ Error creating worktree:', error);
      process.exit(1);
    }
  });

// List all worktrees
program
  .command('list')
  .description('List all active worktrees')
  .action(async () => {
    try {
      const snapshot = await firestore
        .collection('worktree_assignments')
        .where('status', 'in', ['setup', 'in_progress', 'review'])
        .orderBy('createdAt', 'desc')
        .get();
      
      if (snapshot.empty) {
        console.log('ℹ️  No active worktrees');
        return;
      }
      
      console.log(`\n🌳 Active Worktrees (${snapshot.size}):\n`);
      
      for (const doc of snapshot.docs) {
        const data = doc.data() as WorktreeAssignment;
        
        // Get backlog item
        const itemDoc = await firestore.collection('backlog_items').doc(data.backlogItemId).get();
        const item = itemDoc.data();
        
        console.log(`${getStatusEmoji(data.status)} ${item?.title || 'Unknown'}`);
        console.log(`   ID: ${doc.id}`);
        console.log(`   Branch: ${data.branchName}`);
        console.log(`   Path: ${data.worktreePath}`);
        console.log(`   Port: ${data.port}`);
        console.log(`   Status: ${data.status}`);
        console.log(`   Progress: ${data.progress}%`);
        console.log(`   Commits: ${data.commits}`);
        console.log(`   Files: ${data.filesChanged}`);
        if (data.prUrl) {
          console.log(`   PR: ${data.prUrl}`);
        }
        console.log('');
      }
      
    } catch (error) {
      console.error('❌ Error listing worktrees:', error);
      process.exit(1);
    }
  });

// Check worktree status
program
  .command('status')
  .description('Check worktree status')
  .argument('<worktreeId>', 'Worktree assignment ID')
  .action(async (worktreeId) => {
    try {
      const doc = await firestore.collection('worktree_assignments').doc(worktreeId).get();
      
      if (!doc.exists) {
        console.log('❌ Worktree not found');
        process.exit(1);
      }
      
      const data = doc.data() as WorktreeAssignment;
      
      // Get git status
      const gitStatus = execSync('git status --short', {
        cwd: data.worktreePath,
        encoding: 'utf-8',
      });
      
      const gitLog = execSync('git log --oneline -5', {
        cwd: data.worktreePath,
        encoding: 'utf-8',
      });
      
      console.log('\n' + '='.repeat(60));
      console.log(`🌳 Worktree Status: ${data.branchName}`);
      console.log('='.repeat(60) + '\n');
      
      console.log(`Path: ${data.worktreePath}`);
      console.log(`Port: ${data.port}`);
      console.log(`Status: ${data.status}`);
      console.log(`Progress: ${data.progress}%`);
      console.log(`Commits: ${data.commits}`);
      console.log(`Files Changed: ${data.filesChanged}\n`);
      
      console.log('Git Status:');
      console.log(gitStatus || '  (clean)');
      
      console.log('\nRecent Commits:');
      console.log(gitLog);
      
      if (data.prUrl) {
        console.log(`PR: ${data.prUrl}\n`);
      }
      
    } catch (error) {
      console.error('❌ Error checking status:', error);
      process.exit(1);
    }
  });

// Complete worktree (merge and cleanup)
program
  .command('complete')
  .description('Complete worktree and merge to main')
  .argument('<worktreeId>', 'Worktree assignment ID')
  .requiredOption('--pr-url <url>', 'Pull request URL')
  .action(async (worktreeId, options) => {
    try {
      console.log('🏁 Completing worktree...\n');
      
      const doc = await firestore.collection('worktree_assignments').doc(worktreeId).get();
      
      if (!doc.exists) {
        console.log('❌ Worktree not found');
        process.exit(1);
      }
      
      const data = doc.data() as WorktreeAssignment;
      
      // Update assignment
      await firestore.collection('worktree_assignments').doc(worktreeId).update({
        status: 'merged',
        progress: 100,
        prUrl: options.prUrl,
        mergedAt: new Date(),
        updatedAt: new Date(),
      });
      
      // Update backlog item
      await firestore.collection('backlog_items').doc(data.backlogItemId).update({
        status: 'done',
        lane: 'done',
        prUrl: options.prUrl,
        completedAt: new Date(),
        updatedAt: new Date(),
      });
      
      console.log('✅ Worktree marked as complete');
      console.log(`📋 Backlog item moved to "Done"`);
      console.log(`🔗 PR: ${options.prUrl}\n`);
      console.log('💡 To clean up worktree:');
      console.log(`   git worktree remove ${data.worktreePath}\n`);
      
    } catch (error) {
      console.error('❌ Error completing worktree:', error);
      process.exit(1);
    }
  });

// Helper functions
function sanitizeBranchName(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50);
}

function getStatusEmoji(status: string): string {
  const emojis: Record<string, string> = {
    'setup': '🔧',
    'in_progress': '🚧',
    'review': '👀',
    'merged': '✅',
    'abandoned': '❌',
  };
  return emojis[status] || '⚪';
}

program.parse();

