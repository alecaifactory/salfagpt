#!/usr/bin/env node

/**
 * Detailed Feedback Report
 * 
 * Lists all feedback with:
 * - User information
 * - Star rating
 * - User question
 * - Agent used
 * - AI response
 * - Whether response had correct references
 * 
 * Usage:
 *   node scripts/feedback-detailed-report.mjs
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
    'maqsa.cl': 'Salfa Corp',
    'getaifactory.com': 'AI Factory',
    'iaconcagua.com': 'IA Concagua',
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
 * Get star rating display
 */
function getStarDisplay(stars) {
  if (stars === undefined || stars === null) return 'N/A';
  return '⭐'.repeat(stars) + '☆'.repeat(5 - stars);
}

/**
 * Truncate text with ellipsis
 */
function truncate(text, maxLength = 100) {
  if (!text) return '(vacío)';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * Extract message content as plain text
 */
function extractMessageContent(content) {
  if (!content) return '(sin contenido)';
  
  // If it's a string, return as-is
  if (typeof content === 'string') return content;
  
  // If it's an object with text property
  if (content.text) return content.text;
  
  // If it's an array of parts
  if (Array.isArray(content.parts)) {
    return content.parts
      .map(part => part.text || JSON.stringify(part))
      .join('\n');
  }
  
  // Otherwise, stringify
  return JSON.stringify(content);
}

/**
 * Check if response has references
 */
function checkReferences(aiResponse) {
  if (!aiResponse) return { hasReferences: false, referenceCount: 0, details: 'Sin respuesta' };
  
  const content = extractMessageContent(aiResponse);
  
  // Check for source references patterns
  const patterns = [
    /\[([^\]]+)\]\(#source-([a-zA-Z0-9]+)\)/g, // Markdown source links
    /#source-[a-zA-Z0-9]+/g, // Direct source references
    /según\s+(?:el|la|los|las)\s+([^,\.]+)/gi, // "Según el documento..."
    /de\s+acuerdo\s+(?:a|con)\s+([^,\.]+)/gi, // "De acuerdo a..."
    /como\s+indica\s+([^,\.]+)/gi, // "Como indica..."
  ];
  
  let totalMatches = 0;
  const foundReferences = [];
  
  for (const pattern of patterns) {
    const matches = content.match(pattern);
    if (matches) {
      totalMatches += matches.length;
      foundReferences.push(...matches);
    }
  }
  
  return {
    hasReferences: totalMatches > 0,
    referenceCount: totalMatches,
    details: totalMatches > 0 
      ? `${totalMatches} referencia(s) encontrada(s)`
      : 'Sin referencias explícitas',
    examples: foundReferences.slice(0, 3), // First 3 examples
  };
}

/**
 * Main function
 */
async function generateDetailedReport() {
  try {
    console.log('\n📊 REPORTE DETALLADO DE FEEDBACKS\n');
    console.log('═'.repeat(160));
    
    // Get all feedback
    const feedbackSnapshot = await firestore
      .collection('message_feedback')
      .orderBy('timestamp', 'desc')
      .limit(100) // Safety limit
      .get();
    
    console.log(`✅ Total feedbacks encontrados: ${feedbackSnapshot.size}\n`);
    
    if (feedbackSnapshot.empty) {
      console.log('ℹ️  No hay feedbacks en el sistema.');
      return;
    }
    
    // Process each feedback
    let counter = 1;
    const feedbackByUser = {};
    
    for (const feedbackDoc of feedbackSnapshot.docs) {
      const feedback = feedbackDoc.data();
      
      // Get the original message
      let userMessage = null;
      let aiMessage = null;
      let conversationTitle = 'N/A';
      
      try {
        // Get the message that was rated
        if (feedback.messageId) {
          const messageDoc = await firestore
            .collection('messages')
            .doc(feedback.messageId)
            .get();
          
          if (messageDoc.exists) {
            const messageData = messageDoc.data();
            
            // Get user message (the one before AI response)
            const messagesSnapshot = await firestore
              .collection('messages')
              .where('conversationId', '==', feedback.conversationId)
              .orderBy('timestamp', 'asc')
              .get();
            
            const messagesWithIds = messagesSnapshot.docs.map(doc => ({
              ...doc.data(),
              _docId: doc.id,
            }));
            const messageIndex = messagesWithIds.findIndex(m => 
              m.id === feedback.messageId || m._docId === feedback.messageId
            );
            
            if (messageIndex > 0) {
              userMessage = messagesWithIds[messageIndex - 1]; // Previous message (user question)
              aiMessage = messagesWithIds[messageIndex]; // Current message (AI response)
            } else if (messageData) {
              aiMessage = messageData;
            }
          }
        }
        
        // Get conversation title
        if (feedback.conversationId) {
          const convDoc = await firestore
            .collection('conversations')
            .doc(feedback.conversationId)
            .get();
          
          if (convDoc.exists) {
            conversationTitle = convDoc.data().title || 'Sin título';
          }
        }
      } catch (err) {
        console.error(`⚠️ Error loading message data for feedback ${feedbackDoc.id}:`, err.message);
      }
      
      // Extract user question and AI response
      const userQuestion = userMessage 
        ? extractMessageContent(userMessage.content)
        : '(no disponible)';
      
      const aiResponse = aiMessage 
        ? extractMessageContent(aiMessage.content)
        : '(no disponible)';
      
      // Check references in AI response
      const referenceCheck = checkReferences(aiResponse);
      
      // Get rating
      const rating = feedback.feedbackType === 'expert'
        ? feedback.expertRating || 'N/A'
        : feedback.userStars;
      
      const stars = feedback.feedbackType === 'user' && feedback.userStars !== undefined
        ? feedback.userStars
        : null;
      
      // Get comment
      const comment = feedback.feedbackType === 'expert'
        ? feedback.expertNotes || '(sin comentario)'
        : feedback.userComment || '(sin comentario)';
      
      // Organize by user
      const userKey = feedback.userEmail || feedback.userId;
      if (!feedbackByUser[userKey]) {
        feedbackByUser[userKey] = {
          email: feedback.userEmail,
          hashId: hashUserId(feedback.userId),
          role: feedback.userRole,
          domain: getDomainFromEmail(feedback.userEmail),
          organization: getOrganizationFromDomain(getDomainFromEmail(feedback.userEmail)),
          feedbacks: [],
        };
      }
      
      feedbackByUser[userKey].feedbacks.push({
        id: feedbackDoc.id,
        timestamp: formatDate(feedback.timestamp),
        type: feedback.feedbackType,
        rating,
        stars,
        comment,
        userQuestion,
        aiResponse,
        agentName: conversationTitle,
        conversationId: feedback.conversationId,
        messageId: feedback.messageId,
        hasReferences: referenceCheck.hasReferences,
        referenceCount: referenceCheck.referenceCount,
        referenceDetails: referenceCheck.details,
        referenceExamples: referenceCheck.examples,
        ticketId: feedback.ticketId || 'N/A',
        csatScore: feedback.csatScore,
        npsScore: feedback.npsScore,
      });
    }
    
    // Display by user
    console.log('═'.repeat(160));
    console.log('FEEDBACKS POR USUARIO');
    console.log('═'.repeat(160));
    console.log('');
    
    const users = Object.values(feedbackByUser);
    users.sort((a, b) => b.feedbacks.length - a.feedbacks.length);
    
    for (const user of users) {
      console.log('┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓');
      console.log(`┃ 👤 USUARIO: ${user.email || 'unknown'}`);
      console.log(`┃    Hash ID:       ${user.hashId}`);
      console.log(`┃    Rol:           ${user.role}`);
      console.log(`┃    Dominio:       ${user.domain}`);
      console.log(`┃    Organización:  ${user.organization}`);
      console.log(`┃    Total Feedbacks: ${user.feedbacks.length}`);
      console.log('┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛');
      console.log('');
      
      // Display each feedback
      user.feedbacks.forEach((fb, idx) => {
        console.log(`  ┌─ FEEDBACK #${idx + 1} - ${fb.timestamp}`);
        console.log('  │');
        console.log(`  │  📊 Rating: ${fb.type === 'user' && fb.stars !== null ? getStarDisplay(fb.stars) : fb.rating}`);
        
        if (fb.csatScore !== undefined) {
          console.log(`  │     CSAT:   ${fb.csatScore}/5`);
        }
        
        if (fb.npsScore !== undefined) {
          console.log(`  │     NPS:    ${fb.npsScore}/10`);
        }
        
        console.log('  │');
        console.log(`  │  🤖 Agente: ${fb.agentName}`);
        console.log(`  │     Conv ID: ${fb.conversationId?.substring(0, 24) || 'N/A'}...`);
        console.log('  │');
        console.log(`  │  ❓ PREGUNTA DEL USUARIO:`);
        const questionLines = truncate(fb.userQuestion, 500).match(/.{1,140}/g) || [fb.userQuestion];
        questionLines.forEach((line, i) => {
          if (i === 0) {
            console.log(`  │     "${line}"`);
          } else {
            console.log(`  │      ${line}`);
          }
        });
        console.log('  │');
        console.log(`  │  🤖 RESPUESTA DE IA:`);
        const responseLines = truncate(fb.aiResponse, 600).match(/.{1,140}/g) || [fb.aiResponse];
        responseLines.forEach((line, i) => {
          if (i === 0) {
            console.log(`  │     "${line}"`);
          } else {
            console.log(`  │      ${line}`);
          }
        });
        console.log('  │');
        console.log(`  │  📚 REFERENCIAS:`);
        console.log(`  │     Tiene referencias: ${fb.hasReferences ? '✅ SÍ' : '❌ NO'}`);
        console.log(`  │     Cantidad:          ${fb.referenceCount}`);
        console.log(`  │     Detalles:          ${fb.referenceDetails}`);
        
        if (fb.referenceExamples && fb.referenceExamples.length > 0) {
          console.log('  │     Ejemplos:');
          fb.referenceExamples.forEach(ex => {
            console.log(`  │       - ${ex}`);
          });
        }
        
        console.log('  │');
        console.log(`  │  💬 Comentario del usuario:`);
        const commentLines = truncate(fb.comment, 300).match(/.{1,140}/g) || [fb.comment];
        commentLines.forEach((line, i) => {
          if (i === 0) {
            console.log(`  │     "${line}"`);
          } else {
            console.log(`  │      ${line}`);
          }
        });
        console.log('  │');
        console.log(`  │  🔗 IDs:`);
        console.log(`  │     Feedback: ${fb.id.substring(0, 20)}...`);
        console.log(`  │     Message:  ${fb.messageId?.substring(0, 20) || 'N/A'}...`);
        console.log(`  │     Ticket:   ${fb.ticketId}`);
        console.log('  └─');
        console.log('');
      });
      
      console.log('');
    }
    
    // Overall statistics
    console.log('═'.repeat(160));
    console.log('ESTADÍSTICAS GENERALES');
    console.log('═'.repeat(160));
    console.log('');
    
    const allFeedbacks = Object.values(feedbackByUser).flatMap(u => u.feedbacks);
    
    // Total counts
    console.log(`📊 Total feedbacks:        ${allFeedbacks.length}`);
    console.log(`👥 Total usuarios:         ${users.length}`);
    console.log('');
    
    // By type
    const expertFeedbacks = allFeedbacks.filter(f => f.type === 'expert');
    const userFeedbacks = allFeedbacks.filter(f => f.type === 'user');
    
    console.log(`Distribución por tipo:`);
    console.log(`  🎓 Expert:               ${expertFeedbacks.length} (${(expertFeedbacks.length / allFeedbacks.length * 100).toFixed(1)}%)`);
    console.log(`  👤 Usuario:              ${userFeedbacks.length} (${(userFeedbacks.length / allFeedbacks.length * 100).toFixed(1)}%)`);
    console.log('');
    
    // Star distribution (user feedback only)
    const starCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0, 0: 0 };
    userFeedbacks.forEach(f => {
      if (f.stars !== null && f.stars !== undefined) {
        starCounts[f.stars]++;
      }
    });
    
    console.log(`Distribución de estrellas (Usuario):`);
    console.log(`  ⭐⭐⭐⭐⭐ 5 estrellas:    ${starCounts[5]} (${(starCounts[5] / userFeedbacks.length * 100).toFixed(1)}%)`);
    console.log(`  ⭐⭐⭐⭐  4 estrellas:    ${starCounts[4]} (${(starCounts[4] / userFeedbacks.length * 100).toFixed(1)}%)`);
    console.log(`  ⭐⭐⭐   3 estrellas:    ${starCounts[3]} (${(starCounts[3] / userFeedbacks.length * 100).toFixed(1)}%)`);
    console.log(`  ⭐⭐    2 estrellas:    ${starCounts[2]} (${(starCounts[2] / userFeedbacks.length * 100).toFixed(1)}%)`);
    console.log(`  ⭐     1 estrella:     ${starCounts[1]} (${(starCounts[1] / userFeedbacks.length * 100).toFixed(1)}%)`);
    console.log('');
    
    // Average rating
    const totalStars = Object.entries(starCounts).reduce((sum, [stars, count]) => sum + (parseInt(stars) * count), 0);
    const avgStars = totalStars / userFeedbacks.filter(f => f.stars !== null).length;
    console.log(`⭐ Rating promedio (Usuario): ${avgStars.toFixed(2)}/5`);
    console.log('');
    
    // Expert ratings distribution
    const expertRatings = { perfect: 0, great: 0, good: 0, needs_improvement: 0, poor: 0 };
    expertFeedbacks.forEach(f => {
      if (f.rating && typeof f.rating === 'string') {
        expertRatings[f.rating] = (expertRatings[f.rating] || 0) + 1;
      }
    });
    
    if (expertFeedbacks.length > 0) {
      console.log(`Distribución ratings Expert:`);
      console.log(`  🏆 Perfect:              ${expertRatings.perfect} (${(expertRatings.perfect / expertFeedbacks.length * 100).toFixed(1)}%)`);
      console.log(`  ✨ Great:                ${expertRatings.great} (${(expertRatings.great / expertFeedbacks.length * 100).toFixed(1)}%)`);
      console.log(`  ✅ Good:                 ${expertRatings.good} (${(expertRatings.good / expertFeedbacks.length * 100).toFixed(1)}%)`);
      console.log(`  ⚠️  Needs Improvement:   ${expertRatings.needs_improvement} (${(expertRatings.needs_improvement / expertFeedbacks.length * 100).toFixed(1)}%)`);
      console.log(`  ❌ Poor:                 ${expertRatings.poor} (${(expertRatings.poor / expertFeedbacks.length * 100).toFixed(1)}%)`);
      console.log('');
    }
    
    // Reference analysis
    const withReferences = allFeedbacks.filter(f => f.hasReferences);
    const withoutReferences = allFeedbacks.filter(f => !f.hasReferences);
    
    console.log(`📚 Análisis de Referencias:`);
    console.log(`  ✅ Con referencias:      ${withReferences.length} (${(withReferences.length / allFeedbacks.length * 100).toFixed(1)}%)`);
    console.log(`  ❌ Sin referencias:      ${withoutReferences.length} (${(withoutReferences.length / allFeedbacks.length * 100).toFixed(1)}%)`);
    
    if (withReferences.length > 0) {
      const avgReferences = withReferences.reduce((sum, f) => sum + f.referenceCount, 0) / withReferences.length;
      console.log(`  📊 Promedio referencias: ${avgReferences.toFixed(1)} por respuesta`);
    }
    
    console.log('');
    
    // Tickets created
    const withTickets = allFeedbacks.filter(f => f.ticketId !== 'N/A');
    console.log(`🎫 Tickets generados:      ${withTickets.length} (${(withTickets.length / allFeedbacks.length * 100).toFixed(1)}%)`);
    console.log('');
    
    // NPS Score
    const npsScores = allFeedbacks.filter(f => f.npsScore !== undefined).map(f => f.npsScore);
    if (npsScores.length > 0) {
      const promoters = npsScores.filter(score => score >= 9).length;
      const passives = npsScores.filter(score => score >= 7 && score <= 8).length;
      const detractors = npsScores.filter(score => score <= 6).length;
      const nps = ((promoters - detractors) / npsScores.length) * 100;
      
      console.log(`📈 NPS Score:              ${nps.toFixed(1)}`);
      console.log(`  Promotores (9-10):       ${promoters} (${(promoters / npsScores.length * 100).toFixed(1)}%)`);
      console.log(`  Pasivos (7-8):           ${passives} (${(passives / npsScores.length * 100).toFixed(1)}%)`);
      console.log(`  Detractores (0-6):       ${detractors} (${(detractors / npsScores.length * 100).toFixed(1)}%)`);
    }
    
    console.log('');
    console.log('═'.repeat(160));
    console.log('');
    
    // Export to JSON (optional)
    const exportData = {
      generatedAt: new Date().toISOString(),
      totalFeedbacks: allFeedbacks.length,
      users: users.map(u => ({
        email: u.email,
        hashId: u.hashId,
        role: u.role,
        domain: u.domain,
        organization: u.organization,
        feedbackCount: u.feedbacks.length,
        feedbacks: u.feedbacks,
      })),
      statistics: {
        byType: {
          expert: expertFeedbacks.length,
          user: userFeedbacks.length,
        },
        averageStars: avgStars,
        withReferences: withReferences.length,
        withTickets: withTickets.length,
      },
    };
    
    // Save to file
    const fs = await import('fs');
    const outputPath = 'feedback-detailed-report.json';
    fs.writeFileSync(outputPath, JSON.stringify(exportData, null, 2));
    console.log(`💾 Reporte exportado a: ${outputPath}`);
    console.log('');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al generar reporte:', error);
    console.error('');
    console.error('Soluciones:');
    console.error('  1. Verifica que GOOGLE_CLOUD_PROJECT esté configurado');
    console.error('  2. Verifica autenticación: gcloud auth application-default login');
    console.error('  3. Verifica que las colecciones existan en Firestore');
    console.error('');
    process.exit(1);
  }
}

// Run
generateDetailedReport();

