#!/usr/bin/env node
/**
 * List All User Feedback - Flow Platform
 * 
 * Retrieves and displays all user feedback with:
 * - User Hash ID
 * - User Email
 * - Organization
 * - Domain
 * - Feedback content
 * - CSAT score
 * - NPS score
 * 
 * Usage: node scripts/list-all-feedback.mjs
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read environment variables
const envPath = join(__dirname, '..', '.env');
const envContent = readFileSync(envPath, 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length) {
    envVars[key.trim()] = valueParts.join('=').trim();
  }
});

const PROJECT_ID = envVars.GOOGLE_CLOUD_PROJECT || 'salfagpt';

console.log('🔧 Initializing Firestore connection...');
console.log(`📊 Project: ${PROJECT_ID}`);

// Initialize Firebase Admin
try {
  initializeApp({
    projectId: PROJECT_ID,
  });
} catch (error) {
  if (!error.message.includes('already exists')) {
    console.error('❌ Failed to initialize Firebase:', error);
    process.exit(1);
  }
}

const firestore = getFirestore();

/**
 * Hash user ID for privacy (first 8 chars)
 */
function hashUserId(userId) {
  if (!userId) return 'unknown';
  return userId.substring(0, 8) + '...';
}

/**
 * Extract domain from email
 */
function getDomainFromEmail(email) {
  if (!email) return 'unknown';
  const parts = email.split('@');
  return parts.length > 1 ? parts[1] : 'unknown';
}

/**
 * Format date for display
 */
function formatDate(timestamp) {
  if (!timestamp) return 'N/A';
  
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toISOString().substring(0, 10); // YYYY-MM-DD
}

/**
 * Get organization info from user email domain
 */
function getOrganizationFromDomain(domain) {
  const orgMap = {
    'salfagestion.cl': 'Salfa Corp',
    'salfa.cl': 'Salfa Corp',
    'maqsa.cl': 'Salfa Corp',
    'getaifactory.com': 'AI Factory',
    'gmail.com': 'Personal/External',
  };
  
  return orgMap[domain] || 'Unknown';
}

/**
 * Format feedback type-specific data
 */
function formatFeedbackData(feedback) {
  const result = {
    type: feedback.feedbackType || 'unknown',
    rating: 'N/A',
    comment: '',
    csat: 'N/A',
    nps: 'N/A',
  };
  
  if (feedback.feedbackType === 'expert') {
    result.rating = feedback.expertRating || 'N/A';
    result.comment = feedback.expertNotes || '';
    result.csat = feedback.csatScore !== undefined ? feedback.csatScore : 'N/A';
    result.nps = feedback.npsScore !== undefined ? feedback.npsScore : 'N/A';
  } else if (feedback.feedbackType === 'user') {
    result.rating = feedback.userStars !== undefined ? `${feedback.userStars}/5` : 'N/A';
    result.comment = feedback.userComment || '';
    // User feedback uses stars, convert to CSAT equivalent (1-5 scale)
    result.csat = feedback.userStars !== undefined ? feedback.userStars : 'N/A';
  }
  
  return result;
}

/**
 * Main function to retrieve and display all feedback
 */
async function listAllFeedback() {
  try {
    console.log('\n📥 Retrieving all feedback from message_feedback collection...\n');
    
    // Query all feedback (no filters - get everything)
    const snapshot = await firestore
      .collection('message_feedback')
      .orderBy('timestamp', 'desc')
      .limit(1000) // Safety limit
      .get();
    
    console.log(`✅ Found ${snapshot.size} feedback submissions\n`);
    
    if (snapshot.empty) {
      console.log('ℹ️  No feedback found in database.');
      return;
    }
    
    // Display header
    console.log('═'.repeat(140));
    console.log('USER FEEDBACK SUMMARY');
    console.log('═'.repeat(140));
    console.log('');
    
    // Process each feedback
    const feedbackList = [];
    
    for (const doc of snapshot.docs) {
      const data = doc.data();
      const domain = getDomainFromEmail(data.userEmail);
      const organization = getOrganizationFromDomain(domain);
      const feedbackData = formatFeedbackData(data);
      
      feedbackList.push({
        id: doc.id,
        hashId: hashUserId(data.userId),
        userId: data.userId,
        userEmail: data.userEmail || 'unknown',
        userRole: data.userRole || 'unknown',
        domain,
        organization,
        feedbackType: feedbackData.type,
        rating: feedbackData.rating,
        comment: feedbackData.comment,
        csat: feedbackData.csat,
        nps: feedbackData.nps,
        timestamp: formatDate(data.timestamp),
        ticketId: data.ticketId || 'N/A',
      });
    }
    
    // Display in organized format
    let counter = 1;
    for (const feedback of feedbackList) {
      console.log(`📝 Feedback #${counter}`);
      console.log('─'.repeat(140));
      console.log(`   User Hash ID:    ${feedback.hashId}`);
      console.log(`   User Email:      ${feedback.userEmail}`);
      console.log(`   User Role:       ${feedback.userRole}`);
      console.log(`   Organization:    ${feedback.organization}`);
      console.log(`   Domain:          ${feedback.domain}`);
      console.log(`   Date:            ${feedback.timestamp}`);
      console.log('');
      console.log(`   Feedback Type:   ${feedback.feedbackType}`);
      console.log(`   Rating:          ${feedback.rating}`);
      console.log(`   CSAT Score:      ${feedback.csat}`);
      console.log(`   NPS Score:       ${feedback.nps}`);
      console.log('');
      if (feedback.comment) {
        const displayComment = feedback.comment.length > 100 
          ? feedback.comment.substring(0, 100) + '...'
          : feedback.comment;
        console.log(`   Comment:         ${displayComment}`);
      }
      console.log(`   Ticket ID:       ${feedback.ticketId}`);
      console.log('');
      counter++;
    }
    
    console.log('═'.repeat(140));
    console.log('');
    
    // Summary statistics
    console.log('📊 SUMMARY STATISTICS');
    console.log('─'.repeat(140));
    console.log(`Total Feedback:      ${feedbackList.length}`);
    console.log(`Expert Feedback:     ${feedbackList.filter(f => f.feedbackType === 'expert').length}`);
    console.log(`User Feedback:       ${feedbackList.filter(f => f.feedbackType === 'user').length}`);
    console.log('');
    
    // CSAT Summary (excluding N/A)
    const csatScores = feedbackList
      .map(f => f.csat)
      .filter(s => s !== 'N/A' && typeof s === 'number');
    
    if (csatScores.length > 0) {
      const avgCSAT = csatScores.reduce((a, b) => a + b, 0) / csatScores.length;
      console.log(`CSAT Average:        ${avgCSAT.toFixed(2)}/5 (from ${csatScores.length} ratings)`);
    } else {
      console.log(`CSAT Average:        N/A (no CSAT scores recorded)`);
    }
    
    // NPS Summary (excluding N/A)
    const npsScores = feedbackList
      .map(f => f.nps)
      .filter(s => s !== 'N/A' && typeof s === 'number');
    
    if (npsScores.length > 0) {
      const avgNPS = npsScores.reduce((a, b) => a + b, 0) / npsScores.length;
      console.log(`NPS Average:         ${avgNPS.toFixed(2)}/10 (from ${npsScores.length} scores)`);
    } else {
      console.log(`NPS Average:         N/A (no NPS scores recorded)`);
    }
    
    console.log('');
    
    // By Organization
    console.log('📊 By Organization:');
    const byOrg = {};
    feedbackList.forEach(f => {
      if (!byOrg[f.organization]) byOrg[f.organization] = 0;
      byOrg[f.organization]++;
    });
    Object.entries(byOrg)
      .sort((a, b) => b[1] - a[1])
      .forEach(([org, count]) => {
        console.log(`   ${org.padEnd(25)} ${count} feedback(s)`);
      });
    
    console.log('');
    
    // By Domain
    console.log('📊 By Domain:');
    const byDomain = {};
    feedbackList.forEach(f => {
      if (!byDomain[f.domain]) byDomain[f.domain] = 0;
      byDomain[f.domain]++;
    });
    Object.entries(byDomain)
      .sort((a, b) => b[1] - a[1])
      .forEach(([domain, count]) => {
        console.log(`   ${domain.padEnd(25)} ${count} feedback(s)`);
      });
    
    console.log('');
    console.log('═'.repeat(140));
    
    // Export to JSON for further analysis
    const exportData = {
      timestamp: new Date().toISOString(),
      totalCount: feedbackList.length,
      feedback: feedbackList,
    };
    
    const fs = await import('fs');
    const exportPath = join(__dirname, '..', 'feedback-export.json');
    fs.writeFileSync(exportPath, JSON.stringify(exportData, null, 2));
    console.log(`\n💾 Full data exported to: feedback-export.json`);
    console.log('');
    
  } catch (error) {
    console.error('❌ Error retrieving feedback:', error);
    throw error;
  }
}

// Run the script
listAllFeedback()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });

