#!/usr/bin/env tsx
/**
 * Export Analytics with Feedback Data
 * Includes user ratings, comments, and expert feedback for conversations
 * 
 * Usage:
 *   npx tsx scripts/export-analytics-with-feedback.ts --days=30
 */

import { firestore, COLLECTIONS } from '../src/lib/firestore';
import * as fs from 'fs';

async function main() {
  const args = process.argv.slice(2);
  const daysArg = args.find(a => a.startsWith('--days='));
  const days = daysArg ? parseInt(daysArg.split('=')[1]) : 30;
  
  console.error('📊 Exportando Analytics con Feedback\n');
  
  // Calculate date range
  const endDate = new Date();
  endDate.setHours(23, 59, 59, 999);
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - (days - 1));
  startDate.setHours(0, 0, 0, 0);
  
  console.error(`📅 Período: ${startDate.toISOString().split('T')[0]} → ${endDate.toISOString().split('T')[0]}\n`);
  
  // Load all feedback
  console.error('⭐ Cargando feedback...');
  const feedbackSnapshot = await firestore.collection('message_feedback').get();
  
  const feedbackByConversation = new Map();
  const feedbackByUser = new Map();
  
  let expertFeedbackCount = 0;
  let userFeedbackCount = 0;
  
  for (const doc of feedbackSnapshot.docs) {
    const data = doc.data();
    const timestamp = data.timestamp?.toDate ? data.timestamp.toDate() : new Date(data.timestamp);
    
    if (timestamp >= startDate && timestamp <= endDate) {
      const feedback = {
        feedbackId: doc.id,
        messageId: data.messageId,
        conversationId: data.conversationId,
        userId: data.userId,
        userEmail: data.userEmail,
        userRole: data.userRole,
        feedbackType: data.feedbackType,
        expertRating: data.expertRating,
        expertNotes: data.expertNotes,
        userStars: data.userStars,
        userComment: data.userComment,
        npsScore: data.npsScore,
        csatScore: data.csatScore,
        timestamp: timestamp.toISOString()
      };
      
      // By conversation
      if (!feedbackByConversation.has(data.conversationId)) {
        feedbackByConversation.set(data.conversationId, []);
      }
      feedbackByConversation.get(data.conversationId).push(feedback);
      
      // By user
      if (!feedbackByUser.has(data.userId)) {
        feedbackByUser.set(data.userId, []);
      }
      feedbackByUser.get(data.userId).push(feedback);
      
      // Count types
      if (data.feedbackType === 'expert') expertFeedbackCount++;
      if (data.feedbackType === 'user') userFeedbackCount++;
    }
  }
  
  console.error(`✅ ${feedbackSnapshot.size} total feedbacks`);
  console.error(`   └─ ${expertFeedbackCount} expert feedbacks`);
  console.error(`   └─ ${userFeedbackCount} user feedbacks`);
  console.error(`   └─ ${feedbackByConversation.size} conversaciones con feedback`);
  console.error(`   └─ ${feedbackByUser.size} usuarios que dieron feedback\n`);
  
  // Calculate conversation feedback summaries
  console.error('📊 Calculando resúmenes de feedback...');
  
  const conversationFeedbackSummaries = [];
  
  for (const [conversationId, feedbacks] of feedbackByConversation.entries()) {
    const expertFeedbacks = feedbacks.filter(f => f.feedbackType === 'expert');
    const userFeedbacks = feedbacks.filter(f => f.feedbackType === 'user');
    
    // Calculate averages
    const avgUserStars = userFeedbacks.length > 0
      ? userFeedbacks.reduce((sum, f) => sum + (f.userStars || 0), 0) / userFeedbacks.length
      : null;
    
    const expertRatings = {
      inaceptable: expertFeedbacks.filter(f => f.expertRating === 'inaceptable').length,
      aceptable: expertFeedbacks.filter(f => f.expertRating === 'aceptable').length,
      sobresaliente: expertFeedbacks.filter(f => f.expertRating === 'sobresaliente').length
    };
    
    conversationFeedbackSummaries.push({
      conversationId,
      totalFeedbacks: feedbacks.length,
      expertFeedbackCount: expertFeedbacks.length,
      userFeedbackCount: userFeedbacks.length,
      avgUserStars: avgUserStars ? parseFloat(avgUserStars.toFixed(2)) : null,
      expertRatings,
      allFeedbacks: feedbacks.map(f => ({
        feedbackId: f.feedbackId,
        userEmail: f.userEmail,
        feedbackType: f.feedbackType,
        userStars: f.userStars,
        userComment: f.userComment,
        expertRating: f.expertRating,
        expertNotes: f.expertNotes,
        timestamp: f.timestamp
      }))
    });
  }
  
  console.error(`✅ ${conversationFeedbackSummaries.length} conversaciones con feedback procesadas\n`);
  
  // Calculate user feedback summaries
  const userFeedbackSummaries = [];
  
  for (const [userId, feedbacks] of feedbackByUser.entries()) {
    const userFeedbacks = feedbacks.filter(f => f.feedbackType === 'user');
    
    const avgStars = userFeedbacks.length > 0
      ? userFeedbacks.reduce((sum, f) => sum + (f.userStars || 0), 0) / userFeedbacks.length
      : null;
    
    const starsDistribution = {
      5: userFeedbacks.filter(f => f.userStars === 5).length,
      4: userFeedbacks.filter(f => f.userStars === 4).length,
      3: userFeedbacks.filter(f => f.userStars === 3).length,
      2: userFeedbacks.filter(f => f.userStars === 2).length,
      1: userFeedbacks.filter(f => f.userStars === 1).length,
      0: userFeedbacks.filter(f => f.userStars === 0).length,
    };
    
    userFeedbackSummaries.push({
      userId,
      userEmail: feedbacks[0].userEmail,
      totalFeedbacks: feedbacks.length,
      userFeedbacksGiven: userFeedbacks.length,
      expertFeedbacksReceived: feedbacks.filter(f => f.feedbackType === 'expert').length,
      avgStars: avgStars ? parseFloat(avgStars.toFixed(2)) : null,
      starsDistribution,
      feedbacksWithComments: userFeedbacks.filter(f => f.userComment).length,
      recentFeedbacks: feedbacks.slice(0, 5).map(f => ({
        conversationId: f.conversationId,
        feedbackType: f.feedbackType,
        stars: f.userStars,
        rating: f.expertRating,
        timestamp: f.timestamp
      }))
    });
  }
  
  // Write output
  const output = {
    metadata: {
      generated: new Date().toISOString(),
      periodStart: startDate.toISOString().split('T')[0],
      periodEnd: endDate.toISOString().split('T')[0],
      totalDays: days
    },
    summary: {
      totalFeedbacks: feedbackSnapshot.size,
      expertFeedbackCount,
      userFeedbackCount,
      conversationsWithFeedback: feedbackByConversation.size,
      usersWhoProvidedFeedback: feedbackByUser.size
    },
    conversationFeedback: conversationFeedbackSummaries,
    userFeedback: userFeedbackSummaries
  };
  
  const outputPath = './exports/salfa-analytics/feedback-data.json';
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
  
  const stats = fs.statSync(outputPath);
  const fileSizeKB = (stats.size / 1024).toFixed(2);
  
  console.error('\n' + '═'.repeat(70));
  console.error('✅ FEEDBACK DATA EXPORTADO!');
  console.error('═'.repeat(70));
  console.error(`\n📁 Archivo: ${outputPath}`);
  console.error(`📏 Tamaño: ${fileSizeKB} KB\n`);
  
  console.error('📊 RESUMEN:');
  console.error(`   • Total Feedbacks: ${feedbackSnapshot.size}`);
  console.error(`   • Expert Feedbacks: ${expertFeedbackCount}`);
  console.error(`   • User Feedbacks: ${userFeedbackCount}`);
  console.error(`   • Conversaciones con Feedback: ${feedbackByConversation.size}`);
  console.error(`   • Usuarios que Dieron Feedback: ${feedbackByUser.size}\n`);
  
  process.exit(0);
}

main();


