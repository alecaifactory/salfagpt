#!/usr/bin/env node

/**
 * Get Latest 10 Feedbacks from System
 * 
 * Lists the 10 most recent feedback submissions with complete details
 * 
 * Usage:
 *   node scripts/get-latest-feedback.mjs
 *   npm run feedback:latest
 */

import { Firestore } from '@google-cloud/firestore';
import crypto from 'crypto';

// Initialize Firestore
const firestore = new Firestore({
  projectId: process.env.GOOGLE_CLOUD_PROJECT || 'salfagpt',
});

/**
 * Hash user ID for privacy
 */
function hashUserId(userId) {
  return crypto.createHash('sha256').update(userId).digest('hex').substring(0, 12);
}

/**
 * Extract domain from email
 */
function getDomainFromEmail(email) {
  if (!email || typeof email !== 'string') return 'unknown';
  const parts = email.split('@');
  return parts.length === 2 ? parts[1] : 'unknown';
}

/**
 * Get organization from domain
 */
function getOrganizationFromDomain(domain) {
  const orgMap = {
    'salfagestion.cl': 'Salfa Corp',
    'salfa.cl': 'Salfa Corp',
    'getaifactory.com': 'AI Factory',
    'gmail.com': 'Personal',
  };
  return orgMap[domain] || domain;
}

/**
 * Format timestamp to readable string
 */
function formatDate(timestamp) {
  if (!timestamp) return 'N/A';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleString('es-CL', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format feedback rating
 */
function formatRating(feedbackType, data) {
  if (feedbackType === 'expert') {
    return data.expertRating || 'N/A';
  } else {
    return data.userStars !== undefined ? `${data.userStars} ⭐` : 'N/A';
  }
}

/**
 * Format feedback comment
 */
function formatComment(feedbackType, data) {
  if (feedbackType === 'expert') {
    return data.expertNotes || '(sin comentario)';
  } else {
    return data.userComment || '(sin comentario)';
  }
}

/**
 * Truncate text with ellipsis
 */
function truncate(text, maxLength = 80) {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * Main function
 */
async function getLatestFeedback() {
  try {
    console.log('\n📥 Obteniendo últimos 10 feedbacks del sistema...\n');
    
    // Query last 10 feedback submissions
    const snapshot = await firestore
      .collection('message_feedback')
      .orderBy('timestamp', 'desc')
      .limit(10)
      .get();
    
    if (snapshot.empty) {
      console.log('ℹ️  No hay feedbacks en el sistema.');
      return;
    }
    
    console.log(`✅ Encontrados ${snapshot.size} feedbacks\n`);
    
    // Display header
    console.log('═'.repeat(160));
    console.log('ÚLTIMOS 10 FEEDBACKS EN EL SISTEMA');
    console.log('═'.repeat(160));
    console.log('');
    
    // Process each feedback
    let counter = 1;
    for (const doc of snapshot.docs) {
      const data = doc.data();
      const domain = getDomainFromEmail(data.userEmail);
      const organization = getOrganizationFromDomain(domain);
      
      // Display feedback
      console.log(`┌─ FEEDBACK #${counter} (ID: ${doc.id.substring(0, 12)}...)`);
      console.log('│');
      console.log(`│  👤 Usuario:`);
      console.log(`│     Email:        ${data.userEmail || 'unknown'}`);
      console.log(`│     Hash ID:      ${hashUserId(data.userId)}`);
      console.log(`│     Rol:          ${data.userRole || 'unknown'}`);
      console.log(`│     Dominio:      ${domain}`);
      console.log(`│     Organización: ${organization}`);
      console.log('│');
      console.log(`│  📊 Feedback:`);
      console.log(`│     Tipo:         ${data.feedbackType === 'expert' ? '🎓 Expert' : '👤 Usuario'}`);
      console.log(`│     Rating:       ${formatRating(data.feedbackType, data)}`);
      
      if (data.csatScore !== undefined) {
        console.log(`│     CSAT:         ${data.csatScore}/5`);
      }
      
      if (data.npsScore !== undefined) {
        console.log(`│     NPS:          ${data.npsScore}/10`);
      }
      
      console.log('│');
      console.log(`│  💬 Comentario:`);
      const comment = formatComment(data.feedbackType, data);
      // Split long comments into multiple lines
      const commentLines = comment.match(/.{1,120}/g) || [comment];
      commentLines.forEach((line, idx) => {
        if (idx === 0) {
          console.log(`│     "${line}"`);
        } else {
          console.log(`│      ${line}`);
        }
      });
      console.log('│');
      console.log(`│  🔗 Referencias:`);
      console.log(`│     Message ID:      ${data.messageId?.substring(0, 20) || 'N/A'}...`);
      console.log(`│     Conversation ID: ${data.conversationId?.substring(0, 20) || 'N/A'}...`);
      
      if (data.ticketId) {
        console.log(`│     Ticket ID:       ${data.ticketId}`);
      }
      
      console.log('│');
      console.log(`│  📅 Timestamp: ${formatDate(data.timestamp)}`);
      
      if (data.screenshots && data.screenshots.length > 0) {
        console.log('│');
        console.log(`│  📸 Screenshots: ${data.screenshots.length} adjuntas`);
        
        if (data.screenshotAnalysis) {
          console.log(`│  🤖 Análisis AI: ${truncate(data.screenshotAnalysis, 100)}`);
        }
      }
      
      console.log('└─');
      console.log('');
      
      counter++;
    }
    
    // Summary statistics
    console.log('═'.repeat(160));
    console.log('RESUMEN');
    console.log('═'.repeat(160));
    
    const expertCount = snapshot.docs.filter(doc => doc.data().feedbackType === 'expert').length;
    const userCount = snapshot.docs.filter(doc => doc.data().feedbackType === 'user').length;
    const withTickets = snapshot.docs.filter(doc => doc.data().ticketId).length;
    const withScreenshots = snapshot.docs.filter(doc => doc.data().screenshots && doc.data().screenshots.length > 0).length;
    
    console.log(`Total feedbacks:      ${snapshot.size}`);
    console.log(`  - Expert:           ${expertCount} (${(expertCount / snapshot.size * 100).toFixed(1)}%)`);
    console.log(`  - Usuario:          ${userCount} (${(userCount / snapshot.size * 100).toFixed(1)}%)`);
    console.log(`Con tickets:          ${withTickets} (${(withTickets / snapshot.size * 100).toFixed(1)}%)`);
    console.log(`Con screenshots:      ${withScreenshots} (${(withScreenshots / snapshot.size * 100).toFixed(1)}%)`);
    
    // Calculate average ratings
    const expertRatings = snapshot.docs
      .filter(doc => doc.data().feedbackType === 'expert' && doc.data().expertRating)
      .map(doc => {
        const rating = doc.data().expertRating;
        const ratingMap = {
          'perfect': 5,
          'great': 4,
          'good': 3,
          'needs_improvement': 2,
          'poor': 1,
        };
        return ratingMap[rating] || 0;
      });
    
    const userRatings = snapshot.docs
      .filter(doc => doc.data().feedbackType === 'user' && doc.data().userStars !== undefined)
      .map(doc => doc.data().userStars);
    
    if (expertRatings.length > 0) {
      const avgExpert = expertRatings.reduce((sum, r) => sum + r, 0) / expertRatings.length;
      console.log(`Rating promedio (Expert): ${avgExpert.toFixed(2)}/5`);
    }
    
    if (userRatings.length > 0) {
      const avgUser = userRatings.reduce((sum, r) => sum + r, 0) / userRatings.length;
      console.log(`Rating promedio (Usuario): ${avgUser.toFixed(2)}/5`);
    }
    
    // NPS calculation
    const npsScores = snapshot.docs
      .filter(doc => doc.data().npsScore !== undefined)
      .map(doc => doc.data().npsScore);
    
    if (npsScores.length > 0) {
      const promoters = npsScores.filter(score => score >= 9).length;
      const detractors = npsScores.filter(score => score <= 6).length;
      const nps = ((promoters - detractors) / npsScores.length) * 100;
      console.log(`NPS Score:            ${nps.toFixed(1)} (${npsScores.length} respuestas)`);
      console.log(`  - Promotores (9-10): ${promoters} (${(promoters / npsScores.length * 100).toFixed(1)}%)`);
      console.log(`  - Pasivos (7-8):     ${npsScores.filter(s => s >= 7 && s <= 8).length}`);
      console.log(`  - Detractores (0-6): ${detractors} (${(detractors / npsScores.length * 100).toFixed(1)}%)`);
    }
    
    console.log('');
    console.log('═'.repeat(160));
    console.log('');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al obtener feedbacks:', error);
    console.error('');
    console.error('Soluciones:');
    console.error('  1. Verifica que GOOGLE_CLOUD_PROJECT esté configurado');
    console.error('  2. Verifica autenticación: gcloud auth application-default login');
    console.error('  3. Verifica que la colección message_feedback exista');
    console.error('');
    process.exit(1);
  }
}

// Run
getLatestFeedback();

