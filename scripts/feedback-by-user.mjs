#!/usr/bin/env node
/**
 * Feedback By User - Flow Platform
 * 
 * Groups feedback by user and shows their complete feedback profile
 * 
 * Usage: node scripts/feedback-by-user.mjs
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
 * Hash user ID for privacy
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
 * Get organization from domain
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
 * Format date
 */
function formatDate(timestamp) {
  if (!timestamp) return 'N/A';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toISOString().substring(0, 16).replace('T', ' '); // YYYY-MM-DD HH:MM
}

/**
 * Group feedback by user
 */
async function feedbackByUser() {
  try {
    console.log('\n📥 Retrieving all feedback...\n');
    
    const snapshot = await firestore
      .collection('message_feedback')
      .orderBy('timestamp', 'desc')
      .get();
    
    console.log(`✅ Found ${snapshot.size} feedback submissions\n`);
    
    // Group by user
    const userFeedback = {};
    
    for (const doc of snapshot.docs) {
      const data = doc.data();
      const userId = data.userId;
      
      if (!userFeedback[userId]) {
        userFeedback[userId] = {
          userId,
          hashId: hashUserId(userId),
          email: data.userEmail,
          role: data.userRole,
          domain: getDomainFromEmail(data.userEmail),
          organization: getOrganizationFromDomain(getDomainFromEmail(data.userEmail)),
          feedback: [],
        };
      }
      
      // Extract feedback details
      let rating, comment, csat, nps;
      
      if (data.feedbackType === 'expert') {
        rating = data.expertRating || 'N/A';
        comment = data.expertNotes || '';
        csat = data.csatScore !== undefined ? data.csatScore : null;
        nps = data.npsScore !== undefined ? data.npsScore : null;
      } else {
        rating = data.userStars !== undefined ? data.userStars : null;
        comment = data.userComment || '';
        csat = data.userStars !== undefined ? data.userStars : null;
        nps = null; // User feedback doesn't have NPS
      }
      
      userFeedback[userId].feedback.push({
        id: doc.id,
        type: data.feedbackType,
        rating,
        comment,
        csat,
        nps,
        timestamp: formatDate(data.timestamp),
        ticketId: data.ticketId || 'N/A',
      });
    }
    
    // Display by user
    console.log('═'.repeat(140));
    console.log('FEEDBACK BY USER');
    console.log('═'.repeat(140));
    console.log('');
    
    const users = Object.values(userFeedback);
    users.sort((a, b) => b.feedback.length - a.feedback.length);
    
    for (const user of users) {
      console.log(`👤 USER: ${user.email}`);
      console.log('─'.repeat(140));
      console.log(`   Hash ID:         ${user.hashId}`);
      console.log(`   Full User ID:    ${user.userId}`);
      console.log(`   Role:            ${user.role}`);
      console.log(`   Organization:    ${user.organization}`);
      console.log(`   Domain:          ${user.domain}`);
      console.log(`   Total Feedback:  ${user.feedback.length}`);
      console.log('');
      
      // Calculate averages
      const csatScores = user.feedback.map(f => f.csat).filter(s => s !== null);
      const npsScores = user.feedback.map(f => f.nps).filter(s => s !== null);
      
      if (csatScores.length > 0) {
        const avgCSAT = csatScores.reduce((a, b) => a + b, 0) / csatScores.length;
        console.log(`   Avg CSAT:        ${avgCSAT.toFixed(2)}/5 (${csatScores.length} ratings)`);
      }
      
      if (npsScores.length > 0) {
        const avgNPS = npsScores.reduce((a, b) => a + b, 0) / npsScores.length;
        console.log(`   Avg NPS:         ${avgNPS.toFixed(2)}/10 (${npsScores.length} scores)`);
      }
      
      console.log('');
      console.log('   📝 Feedback History:');
      console.log('');
      
      user.feedback.forEach((f, idx) => {
        console.log(`   ${idx + 1}. [${f.timestamp}] ${f.type.toUpperCase()}`);
        console.log(`      Rating: ${f.rating} | CSAT: ${f.csat ?? 'N/A'} | NPS: ${f.nps ?? 'N/A'}`);
        if (f.comment) {
          const displayComment = f.comment.length > 80 
            ? f.comment.substring(0, 80) + '...'
            : f.comment;
          console.log(`      Comment: "${displayComment}"`);
        }
        console.log(`      Ticket: ${f.ticketId}`);
        console.log('');
      });
      
      console.log('');
    }
    
    console.log('═'.repeat(140));
    console.log(`\n✅ Displayed feedback for ${users.length} users\n`);
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

// Run
feedbackByUser()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Failed:', error);
    process.exit(1);
  });

