#!/usr/bin/env node
/**
 * CLI: Feedback Management Commands
 * 
 * Commands:
 * - flow-cli feedback submit    - Submit feedback from CLI
 * - flow-cli feedback list      - View feedback sessions
 * - flow-cli feedback view      - View specific session
 * - flow-cli feedback note      - Add admin note
 */

import { Command } from 'commander';
import { firestore } from '../lib/firestore';
import type { FeedbackSession } from '../../src/types/feedback';

const program = new Command();

program
  .name('feedback')
  .description('Manage user feedback and feature requests');

// Submit feedback
program
  .command('submit')
  .description('Submit new feedback')
  .requiredOption('--type <type>', 'Feedback type: feature, bug, general, ui')
  .requiredOption('--title <title>', 'Feedback title')
  .requiredOption('--description <description>', 'Detailed description')
  .option('--priority <priority>', 'Priority: low, medium, high, critical', 'medium')
  .option('--user <userId>', 'User ID (defaults to current user)')
  .option('--company <companyId>', 'Company ID (defaults to user company)')
  .action(async (options) => {
    try {
      console.log('📝 Submitting feedback...');
      
      const sessionData = {
        userId: options.user || process.env.USER_ID,
        companyId: options.company || process.env.COMPANY_ID,
        sessionType: mapFeedbackType(options.type),
        status: 'submitted',
        priority: options.priority,
        title: options.title,
        description: options.description,
        messages: [],
        screenshots: [],
        annotations: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        submittedAt: new Date(),
        source: 'localhost' as const,
      };
      
      const ref = await firestore.collection('feedback_sessions').add(sessionData);
      
      console.log('✅ Feedback submitted successfully!');
      console.log(`   Session ID: ${ref.id}`);
      console.log(`   Title: ${options.title}`);
      console.log(`   Type: ${options.type}`);
      console.log(`   Priority: ${options.priority}`);
      console.log('');
      console.log('💡 Admins will review your feedback soon.');
      
    } catch (error) {
      console.error('❌ Error submitting feedback:', error);
      process.exit(1);
    }
  });

// List feedback
program
  .command('list')
  .description('List feedback sessions')
  .option('--status <status>', 'Filter by status')
  .option('--user <userId>', 'Filter by user (admin only)')
  .option('--company <companyId>', 'Filter by company (admin only)')
  .option('--limit <number>', 'Limit results', '20')
  .action(async (options) => {
    try {
      console.log('📋 Fetching feedback sessions...');
      
      let query = firestore.collection('feedback_sessions');
      
      if (options.user) {
        query = query.where('userId', '==', options.user);
      }
      
      if (options.company) {
        query = query.where('companyId', '==', options.company);
      }
      
      if (options.status) {
        query = query.where('status', '==', options.status);
      }
      
      const snapshot = await query
        .orderBy('createdAt', 'desc')
        .limit(parseInt(options.limit))
        .get();
      
      if (snapshot.empty) {
        console.log('ℹ️  No feedback sessions found');
        return;
      }
      
      console.log(`\n📊 Found ${snapshot.size} sessions:\n`);
      
      snapshot.docs.forEach((doc, idx) => {
        const data = doc.data();
        const statusEmoji = getStatusEmoji(data.status);
        const priorityColor = getPriorityColor(data.priority);
        
        console.log(`${idx + 1}. ${statusEmoji} ${data.title || 'Sin título'}`);
        console.log(`   ID: ${doc.id}`);
        console.log(`   Type: ${data.sessionType}`);
        console.log(`   Priority: ${priorityColor}${data.priority}\x1b[0m`);
        console.log(`   Status: ${data.status}`);
        console.log(`   Created: ${data.createdAt.toDate().toLocaleString()}`);
        if (data.submittedAt) {
          console.log(`   Submitted: ${data.submittedAt.toDate().toLocaleString()}`);
        }
        console.log('');
      });
      
    } catch (error) {
      console.error('❌ Error listing feedback:', error);
      process.exit(1);
    }
  });

// View specific session
program
  .command('view')
  .description('View feedback session details')
  .argument('<sessionId>', 'Session ID to view')
  .action(async (sessionId) => {
    try {
      const doc = await firestore.collection('feedback_sessions').doc(sessionId).get();
      
      if (!doc.exists) {
        console.log('❌ Session not found');
        process.exit(1);
      }
      
      const data = doc.data() as FeedbackSession;
      
      console.log('\n' + '='.repeat(60));
      console.log(`📋 Feedback Session: ${data.title || 'Sin título'}`);
      console.log('='.repeat(60));
      console.log('');
      console.log(`ID: ${doc.id}`);
      console.log(`Type: ${data.sessionType}`);
      console.log(`Status: ${data.status}`);
      console.log(`Priority: ${data.priority}`);
      console.log(`Created: ${data.createdAt.toDate().toLocaleString()}`);
      if (data.submittedAt) {
        console.log(`Submitted: ${data.submittedAt.toDate().toLocaleString()}`);
      }
      console.log('');
      
      if (data.description) {
        console.log('Description:');
        console.log(data.description);
        console.log('');
      }
      
      if (data.messages && data.messages.length > 0) {
        console.log(`Conversation (${data.messages.length} messages):`);
        console.log('─'.repeat(60));
        data.messages.forEach((msg) => {
          const roleEmoji = msg.role === 'user' ? '👤' : msg.role === 'assistant' ? '🤖' : '⚙️';
          console.log(`${roleEmoji} ${msg.role.toUpperCase()}:`);
          console.log(`   ${msg.content}`);
          console.log('');
        });
      }
      
      if (data.aiSummary) {
        console.log('AI Summary:');
        console.log(data.aiSummary);
        console.log('');
      }
      
      if (data.extractedRequirements && data.extractedRequirements.length > 0) {
        console.log('Extracted Requirements:');
        data.extractedRequirements.forEach((req, idx) => {
          console.log(`  ${idx + 1}. ${req}`);
        });
        console.log('');
      }
      
      if (data.successCriteria && data.successCriteria.length > 0) {
        console.log('Success Criteria:');
        data.successCriteria.forEach((criteria, idx) => {
          console.log(`  ${idx + 1}. ${criteria}`);
        });
        console.log('');
      }
      
      if (data.expectedCSATImpact) {
        console.log(`Expected CSAT Impact: ${data.expectedCSATImpact}/5`);
      }
      if (data.expectedNPSImpact) {
        console.log(`Expected NPS Impact: ${data.expectedNPSImpact > 0 ? '+' : ''}${data.expectedNPSImpact}`);
      }
      
      if (data.adminNotes) {
        console.log('');
        console.log('Admin Notes:');
        console.log(data.adminNotes);
      }
      
      console.log('\n' + '='.repeat(60) + '\n');
      
    } catch (error) {
      console.error('❌ Error viewing session:', error);
      process.exit(1);
    }
  });

// Add admin note
program
  .command('note')
  .description('Add admin note to session')
  .argument('<sessionId>', 'Session ID')
  .argument('<note>', 'Admin note')
  .option('--admin <userId>', 'Admin user ID')
  .action(async (sessionId, note, options) => {
    try {
      await firestore.collection('feedback_sessions').doc(sessionId).update({
        adminNotes: note,
        reviewedBy: options.admin || process.env.USER_ID,
        reviewedAt: new Date(),
        updatedAt: new Date(),
      });
      
      console.log('✅ Admin note added successfully');
      
    } catch (error) {
      console.error('❌ Error adding note:', error);
      process.exit(1);
    }
  });

// Helper functions
function mapFeedbackType(type: string): string {
  const mapping: Record<string, string> = {
    'feature': 'feature_request',
    'bug': 'bug_report',
    'general': 'general_feedback',
    'ui': 'ui_improvement',
  };
  return mapping[type] || 'general_feedback';
}

function getStatusEmoji(status: string): string {
  const emojis: Record<string, string> = {
    'active': '🔵',
    'submitted': '📮',
    'under_review': '👀',
    'accepted': '✅',
    'rejected': '❌',
    'implemented': '🎉',
  };
  return emojis[status] || '⚪';
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

