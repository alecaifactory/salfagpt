#!/usr/bin/env node

/**
 * Check Feedback Tickets in Firestore
 * 
 * Verifies that feedback tickets are being created correctly
 * and have all required fields for Roadmap display
 */

import { Firestore } from '@google-cloud/firestore';

const firestore = new Firestore({
  projectId: process.env.GOOGLE_CLOUD_PROJECT || 'salfagpt',
});

async function checkFeedbackTickets() {
  console.log('🔍 Checking Feedback Tickets');
  console.log('============================\n');

  try {
    // Get recent feedback tickets
    console.log('1️⃣  Loading recent feedback tickets...');
    const snapshot = await firestore
      .collection('feedback_tickets')
      .limit(10)
      .get();

    if (snapshot.empty) {
      console.log('⚠️  No feedback tickets found in Firestore');
      console.log('');
      console.log('This could mean:');
      console.log('  1. No feedback has been submitted yet');
      console.log('  2. Ticket creation is failing');
      console.log('  3. Wrong Firestore project selected');
      console.log('');
      console.log('Check:');
      console.log('  - GOOGLE_CLOUD_PROJECT in .env');
      console.log('  - message_feedback collection (feedback without tickets)');
      return;
    }

    console.log(`✅ Found ${snapshot.size} tickets\n`);

    // Analyze each ticket
    snapshot.docs.forEach((doc, idx) => {
      const ticket = doc.data();
      console.log(`Ticket ${idx + 1}: ${doc.id}`);
      console.log('─'.repeat(60));
      
      // Critical fields for Roadmap display
      console.log('📋 Display Fields:');
      console.log(`   Ticket ID: ${ticket.ticketId || '❌ MISSING'}`);
      console.log(`   Title: ${ticket.title || '❌ MISSING'}`);
      console.log(`   Lane: ${ticket.lane || '❌ MISSING'}`);
      console.log(`   Status: ${ticket.status || '❌ MISSING'}`);
      console.log(`   Priority: ${ticket.priority || '❌ MISSING'}`);
      
      console.log('\n👤 User Info:');
      console.log(`   Created By: ${ticket.reportedByName || ticket.createdBy || '❌ MISSING'}`);
      console.log(`   Email: ${ticket.reportedByEmail || '❌ MISSING'}`);
      console.log(`   Role: ${ticket.reportedByRole || ticket.createdByRole || '❌ MISSING'}`);
      console.log(`   Domain: ${ticket.userDomain || ticket.companyDomain || '❌ MISSING'}`);
      console.log(`   User ID: ${ticket.reportedBy || '❌ MISSING'}`);
      
      console.log('\n🤖 Agent Context:');
      console.log(`   Agent Name: ${ticket.agentName || '❌ MISSING'}`);
      console.log(`   Agent ID: ${ticket.agentId || ticket.conversationId || '❌ MISSING'}`);
      
      console.log('\n⭐ Feedback Data:');
      if (ticket.originalFeedback) {
        console.log(`   Type: ${ticket.originalFeedback.type}`);
        console.log(`   Rating: ${ticket.originalFeedback.rating}`);
        console.log(`   Comment: ${ticket.originalFeedback.comment || '(none)'}`);
        console.log(`   Screenshots: ${ticket.originalFeedback.screenshots?.length || 0}`);
      } else {
        console.log('   ❌ originalFeedback MISSING');
      }
      
      console.log('\n📊 Scores:');
      console.log(`   CSAT: ${ticket.estimatedCSAT || 0}`);
      console.log(`   NPS: ${ticket.estimatedNPS || 0}`);
      console.log(`   ROI: ${ticket.estimatedROI || 0}`);
      
      console.log('\n📅 Timestamps:');
      const createdAt = ticket.createdAt?.toDate?.() || new Date(ticket.createdAt);
      console.log(`   Created: ${createdAt.toLocaleString('es-ES')}`);
      
      console.log('\n');
    });

    // Summary
    console.log('📊 SUMMARY');
    console.log('─'.repeat(60));
    
    const byLane = {
      backlog: 0,
      roadmap: 0,
      in_development: 0,
      expert_review: 0,
      production: 0,
      other: 0,
    };
    
    const byRole = {
      user: 0,
      expert: 0,
      admin: 0,
      other: 0,
    };
    
    const byPriority = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      other: 0,
    };
    
    snapshot.docs.forEach(doc => {
      const ticket = doc.data();
      
      // Count by lane
      if (ticket.lane in byLane) {
        byLane[ticket.lane]++;
      } else {
        byLane.other++;
      }
      
      // Count by role
      const role = ticket.reportedByRole || ticket.createdByRole || 'other';
      if (role in byRole) {
        byRole[role]++;
      } else {
        byRole.other++;
      }
      
      // Count by priority
      if (ticket.priority in byPriority) {
        byPriority[ticket.priority]++;
      } else {
        byPriority.other++;
      }
    });
    
    console.log('\nBy Lane:');
    Object.entries(byLane).forEach(([lane, count]) => {
      if (count > 0) {
        console.log(`   ${lane}: ${count}`);
      }
    });
    
    console.log('\nBy Role:');
    Object.entries(byRole).forEach(([role, count]) => {
      if (count > 0) {
        console.log(`   ${role}: ${count}`);
      }
    });
    
    console.log('\nBy Priority:');
    Object.entries(byPriority).forEach(([priority, count]) => {
      if (count > 0) {
        console.log(`   ${priority}: ${count}`);
      }
    });
    
    console.log('\n');
    console.log('✅ Check complete!');
    console.log('\nIf tickets exist but don\'t appear in Roadmap:');
    console.log('  1. Check lane field is exactly "backlog" (lowercase)');
    console.log('  2. Check userDomain matches the domain in query');
    console.log('  3. Check reportedBy matches your userId');
    console.log('  4. Open browser console and check API response');

  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (error.message?.includes('PERMISSION_DENIED')) {
      console.error('\n💡 Authentication required. Run:');
      console.error('   gcloud auth application-default login --project salfagpt');
    }
    
    process.exit(1);
  }
}

checkFeedbackTickets();

