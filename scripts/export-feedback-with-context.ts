#!/usr/bin/env tsx
/**
 * Export Feedback with Complete Conversation Context
 * 
 * Includes:
 * - User/Expert feedback with stars and comments
 * - Original conversation context (all messages)
 * - Agent used and configuration
 * - Context sources referenced
 * - User questions and AI responses
 * 
 * Usage:
 *   npx tsx scripts/export-feedback-with-context.ts --days=30
 */

import { firestore, COLLECTIONS } from '../src/lib/firestore';
import * as fs from 'fs';

async function main() {
  const args = process.argv.slice(2);
  const daysArg = args.find(a => a.startsWith('--days='));
  const days = daysArg ? parseInt(daysArg.split('=')[1]) : 30;
  
  console.error('⭐ Exportando Feedback con Contexto Completo\n');
  
  // Calculate date range
  const endDate = new Date();
  endDate.setHours(23, 59, 59, 999);
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - (days - 1));
  startDate.setHours(0, 0, 0, 0);
  
  console.error(`📅 Período: ${startDate.toISOString().split('T')[0]} → ${endDate.toISOString().split('T')[0]}\n`);
  
  // Load users
  console.error('👥 Cargando usuarios...');
  const usersSnapshot = await firestore.collection(COLLECTIONS.USERS).get();
  const usersMap = new Map();
  
  for (const doc of usersSnapshot.docs) {
    const data = doc.data();
    usersMap.set(doc.id, {
      email: data.email || 'unknown',
      name: data.name || data.email || 'Unknown',
      role: data.role || 'user'
    });
    
    if (data.googleUserId) {
      usersMap.set(data.googleUserId, {
        email: data.email || 'unknown',
        name: data.name || data.email || 'Unknown',
        role: data.role || 'user'
      });
    }
  }
  
  console.error(`✅ ${usersMap.size} usuarios`);
  
  // Load conversations
  console.error('🤖 Cargando conversaciones...');
  const conversationsSnapshot = await firestore.collection(COLLECTIONS.CONVERSATIONS).get();
  const conversationsMap = new Map();
  
  for (const doc of conversationsSnapshot.docs) {
    const data = doc.data();
    conversationsMap.set(doc.id, {
      id: doc.id,
      title: data.title || 'Sin título',
      userId: data.userId,
      agentModel: data.agentModel,
      isAgent: data.isAgent === true,
      agentId: data.agentId,
      messageCount: data.messageCount || 0
    });
  }
  
  console.error(`✅ ${conversationsMap.size} conversaciones`);
  
  // Load messages
  console.error('💬 Cargando mensajes...');
  const messagesSnapshot = await firestore.collection(COLLECTIONS.MESSAGES).get();
  const messagesByConversation = new Map();
  
  for (const doc of messagesSnapshot.docs) {
    const data = doc.data();
    const conversationId = data.conversationId;
    
    if (!messagesByConversation.has(conversationId)) {
      messagesByConversation.set(conversationId, []);
    }
    
    messagesByConversation.get(conversationId).push({
      id: doc.id,
      role: data.role,
      content: typeof data.content === 'string' ? data.content : data.content?.text || '',
      timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : new Date(data.timestamp),
      contextSections: data.contextSections || []
    });
  }
  
  console.error(`✅ ${messagesSnapshot.size} mensajes`);
  
  // Load feedback
  console.error('⭐ Cargando feedback...');
  const feedbackSnapshot = await firestore.collection('message_feedback').get();
  
  const feedbacksWithContext = [];
  let expertCount = 0;
  let userCount = 0;
  
  for (const doc of feedbackSnapshot.docs) {
    const data = doc.data();
    const timestamp = data.timestamp?.toDate ? data.timestamp.toDate() : new Date(data.timestamp);
    
    if (timestamp >= startDate && timestamp <= endDate) {
      const conversationId = data.conversationId;
      const messageId = data.messageId;
      
      // Get conversation info
      const conversation = conversationsMap.get(conversationId);
      const messages = messagesByConversation.get(conversationId) || [];
      const specificMessage = messages.find(m => m.id === messageId);
      
      // Get agent info
      const agentId = conversation?.agentId || conversationId;
      const agent = conversationsMap.get(agentId);
      
      // Get user info
      const feedbackUser = usersMap.get(data.userId) || { email: 'unknown', name: 'Unknown', role: 'unknown' };
      const conversationOwner = usersMap.get(conversation?.userId) || { email: 'unknown', name: 'Unknown' };
      
      // Count types
      if (data.feedbackType === 'expert') expertCount++;
      if (data.feedbackType === 'user') userCount++;
      
      feedbacksWithContext.push({
        // Feedback info
        feedbackId: doc.id,
        feedbackType: data.feedbackType,
        timestamp: timestamp.toISOString(),
        
        // User who gave feedback
        feedbackBy: {
          userId: data.userId,
          email: feedbackUser.email,
          name: feedbackUser.name,
          role: feedbackUser.role
        },
        
        // Ratings and comments
        userStars: data.userStars,
        userComment: data.userComment,
        expertRating: data.expertRating,
        expertNotes: data.expertNotes,
        npsScore: data.npsScore,
        csatScore: data.csatScore,
        
        // Conversation context
        conversation: conversation ? {
          conversationId,
          title: conversation.title,
          isAgent: conversation.isAgent,
          agentModel: conversation.agentModel,
          messageCount: conversation.messageCount,
          owner: {
            userId: conversation.userId,
            email: conversationOwner.email,
            name: conversationOwner.name
          }
        } : null,
        
        // Agent context (if derived from agent)
        agent: agent && agentId !== conversationId ? {
          agentId,
          agentTitle: agent.title,
          agentModel: agent.agentModel
        } : null,
        
        // Specific message evaluated
        evaluatedMessage: specificMessage ? {
          messageId,
          role: specificMessage.role,
          content: specificMessage.content.substring(0, 500), // First 500 chars
          contentLength: specificMessage.content.length,
          timestamp: specificMessage.timestamp.toISOString(),
          contextSources: specificMessage.contextSections.map(cs => cs.name)
        } : null,
        
        // Conversation thread (context)
        conversationThread: messages.slice(0, 10).map(m => ({
          role: m.role,
          content: m.content.substring(0, 200), // First 200 chars
          timestamp: m.timestamp.toISOString()
        }))
      });
    }
  }
  
  console.error(`✅ ${feedbackSnapshot.size} feedbacks totales`);
  console.error(`   └─ ${expertCount} expert`);
  console.error(`   └─ ${userCount} user`);
  console.error(`   └─ ${feedbacksWithContext.length} en el período\n`);
  
  // Organize by agent
  const feedbackByAgent = new Map();
  
  for (const feedback of feedbacksWithContext) {
    const agentId = feedback.agent?.agentId || feedback.conversation?.conversationId;
    const agentTitle = feedback.agent?.agentTitle || feedback.conversation?.title;
    
    if (!feedbackByAgent.has(agentId)) {
      feedbackByAgent.set(agentId, {
        agentId,
        agentTitle,
        feedbacks: [],
        totalFeedbacks: 0,
        avgUserStars: null,
        expertRatingsCount: { inaceptable: 0, aceptable: 0, sobresaliente: 0 }
      });
    }
    
    const agentData = feedbackByAgent.get(agentId);
    agentData.feedbacks.push(feedback);
    agentData.totalFeedbacks++;
    
    if (feedback.userStars !== undefined) {
      const current = agentData.avgUserStars || { sum: 0, count: 0 };
      current.sum += feedback.userStars;
      current.count++;
      agentData.avgUserStars = current;
    }
    
    if (feedback.expertRating) {
      agentData.expertRatingsCount[feedback.expertRating]++;
    }
  }
  
  // Calculate final averages
  for (const agentData of feedbackByAgent.values()) {
    if (agentData.avgUserStars) {
      agentData.avgUserStars = parseFloat(
        (agentData.avgUserStars.sum / agentData.avgUserStars.count).toFixed(2)
      );
    }
  }
  
  const feedbackByAgentArray = Array.from(feedbackByAgent.values())
    .sort((a, b) => b.totalFeedbacks - a.totalFeedbacks);
  
  // Write output
  const output = {
    metadata: {
      generated: new Date().toISOString(),
      periodStart: startDate.toISOString().split('T')[0],
      periodEnd: endDate.toISOString().split('T')[0],
      totalDays: days
    },
    summary: {
      totalFeedbacks: feedbacksWithContext.length,
      expertFeedbackCount: expertCount,
      userFeedbackCount: userCount,
      avgUserStars: feedbacksWithContext
        .filter(f => f.userStars !== undefined)
        .reduce((sum, f, _, arr) => sum + f.userStars / arr.length, 0)
    },
    feedbacksWithContext: feedbacksWithContext.sort((a, b) => 
      new Date(b.timestamp) - new Date(a.timestamp)
    ),
    feedbackByAgent: feedbackByAgentArray
  };
  
  const outputPath = './exports/salfa-analytics/feedback-with-context.json';
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
  
  const stats = fs.statSync(outputPath);
  const fileSizeKB = (stats.size / 1024).toFixed(2);
  
  console.error('\n' + '═'.repeat(70));
  console.error('✅ FEEDBACK CON CONTEXTO EXPORTADO!');
  console.error('═'.repeat(70));
  console.error(`\n📁 Archivo: ${outputPath}`);
  console.error(`📏 Tamaño: ${fileSizeKB} KB\n`);
  
  console.error('📊 CONTENIDO:');
  console.error(`   • Total Feedbacks: ${feedbacksWithContext.length}`);
  console.error(`   • Con contexto completo: ${feedbacksWithContext.filter(f => f.evaluatedMessage).length}`);
  console.error(`   • Con thread de conversación: ${feedbacksWithContext.filter(f => f.conversationThread.length > 0).length}`);
  console.error(`   • Agentes con feedback: ${feedbackByAgentArray.length}\n`);
  
  // Print main agents feedback
  console.error('🤖 FEEDBACK POR AGENTE PRINCIPAL:\n');
  const mainCodes = ['M3-v2', 'S1-v2', 'S2-v2', 'M1-v2'];
  
  for (const code of mainCodes) {
    const agentFeedback = feedbackByAgentArray.find(a => a.agentTitle?.includes(code));
    if (agentFeedback) {
      console.error(`   ${code}: ${agentFeedback.agentTitle}`);
      console.error(`      Feedbacks: ${agentFeedback.totalFeedbacks}`);
      console.error(`      Avg Stars: ${agentFeedback.avgUserStars || 'N/A'}`);
      console.error(`      Expert: ${agentFeedback.expertRatingsCount.sobresaliente} sobresaliente, ${agentFeedback.expertRatingsCount.aceptable} aceptable, ${agentFeedback.expertRatingsCount.inaceptable} inaceptable`);
      console.error('');
    }
  }
  
  process.exit(0);
}

main();


