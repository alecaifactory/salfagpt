#!/usr/bin/env node

/**
 * Migrate Existing Feedback Tickets
 * 
 * Adds missing fields to existing tickets so they appear in Roadmap
 */

import { Firestore } from '@google-cloud/firestore';

const firestore = new Firestore({
  projectId: process.env.GOOGLE_CLOUD_PROJECT || 'salfagpt',
});

async function migrateTickets() {
  console.log('🔄 Migrating Feedback Tickets');
  console.log('============================\n');

  try {
    // Get all tickets
    console.log('1️⃣  Loading all feedback tickets...');
    const snapshot = await firestore
      .collection('feedback_tickets')
      .get();

    console.log(`   Found ${snapshot.size} tickets to check\n`);

    let migrated = 0;
    let skipped = 0;

    // Process each ticket
    for (const doc of snapshot.docs) {
      const ticket = doc.data();
      const updates = {};
      let needsUpdate = false;

      // Add missing lane field
      if (!ticket.lane) {
        updates.lane = 'backlog';
        needsUpdate = true;
        console.log(`   Adding lane: backlog to ${doc.id}`);
      }

      // Add missing ticketId
      if (!ticket.ticketId) {
        updates.ticketId = `TKT-${Date.now()}-${Math.random().toString(36).substring(7)}`;
        needsUpdate = true;
        console.log(`   Adding ticketId to ${doc.id}`);
      }

      // Add missing userDomain
      if (!ticket.userDomain && ticket.reportedByEmail) {
        const domain = ticket.reportedByEmail.split('@')[1] || 'unknown';
        updates.userDomain = domain;
        updates.companyDomain = domain;
        needsUpdate = true;
        console.log(`   Adding userDomain: ${domain} to ${doc.id}`);
      }

      // Add missing reportedByName
      if (!ticket.reportedByName && ticket.reportedByEmail) {
        const name = ticket.reportedByEmail.split('@')[0];
        updates.reportedByName = name;
        updates.createdBy = name;
        needsUpdate = true;
        console.log(`   Adding reportedByName: ${name} to ${doc.id}`);
      }

      // Add missing createdByRole alias
      if (!ticket.createdByRole && ticket.reportedByRole) {
        updates.createdByRole = ticket.reportedByRole;
        needsUpdate = true;
      }

      // Try to get agent name from conversation
      if (!ticket.agentName && ticket.conversationId) {
        try {
          const convDoc = await firestore.collection('conversations').doc(ticket.conversationId).get();
          if (convDoc.exists) {
            const agentName = convDoc.data()?.title || 'General';
            updates.agentName = agentName;
            updates.agentId = ticket.conversationId;
            needsUpdate = true;
            console.log(`   Adding agentName: ${agentName} to ${doc.id}`);
          }
        } catch (err) {
          console.warn(`   Could not fetch agent name for ${doc.id}`);
        }
      }

      // Create originalFeedback object if missing
      if (!ticket.originalFeedback) {
        updates.originalFeedback = {
          type: ticket.feedbackSource || 'user',
          rating: ticket.expertRating || ticket.userStars || 3,
          comment: ticket.description || '',
          screenshots: [],
        };
        needsUpdate = true;
        console.log(`   Adding originalFeedback to ${doc.id}`);
      }

      // Add missing CSAT if has userStars
      if (!ticket.estimatedCSAT && ticket.userStars) {
        updates.estimatedCSAT = ticket.userStars;
        needsUpdate = true;
      }

      // Add missing social features
      if (ticket.upvotes === undefined) {
        updates.upvotes = 0;
        updates.upvotedBy = [];
        updates.views = 0;
        updates.viewedBy = [];
        updates.shares = 0;
        updates.sharedBy = [];
        updates.shareChain = [];
        updates.viralCoefficient = 0;
        needsUpdate = true;
      }

      // Update if needed
      if (needsUpdate) {
        await doc.ref.update(updates);
        migrated++;
        console.log(`✅ Migrated: ${doc.id}\n`);
      } else {
        skipped++;
      }
    }

    console.log('📊 MIGRATION SUMMARY');
    console.log('─'.repeat(60));
    console.log(`   Total tickets: ${snapshot.size}`);
    console.log(`   Migrated: ${migrated}`);
    console.log(`   Skipped (already complete): ${skipped}`);
    console.log('');
    console.log('✅ Migration complete!');
    console.log('');
    console.log('Next steps:');
    console.log('  1. Refresh the Roadmap modal');
    console.log('  2. Check Backlog column for migrated tickets');
    console.log('  3. Submit new feedback to verify new format works');

  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (error.message?.includes('PERMISSION_DENIED')) {
      console.error('\n💡 Authentication required. Run:');
      console.error('   gcloud auth application-default login --project salfagpt');
    }
    
    process.exit(1);
  }
}

migrateTickets();

