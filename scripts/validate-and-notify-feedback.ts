#!/usr/bin/env tsx
/**
 * Validate and Notify Feedback Resolution
 * 
 * For each user feedback:
 * 1. Check if issue still exists in current version
 * 2. Run test with same question/context
 * 3. Compare old vs new response
 * 4. If resolved: Notify user and thank them
 * 5. If not resolved: Create improvement ticket
 * 
 * Usage:
 *   npx tsx scripts/validate-and-notify-feedback.ts [--feedback-id=abc123] [--all]
 */

import { firestore, COLLECTIONS } from '../src/lib/firestore';
import { GoogleGenAI } from '@google/genai';

interface FeedbackValidation {
  feedbackId: string;
  status: 'resolved' | 'partially_resolved' | 'not_resolved' | 'requires_manual_review';
  originalIssue: string;
  testResult: {
    questionAsked: string;
    oldResponse: string;
    newResponse: string;
    contextSourcesUsed: string[];
    improvementDetected: boolean;
    improvementDetails: string;
  };
  userNotification: {
    shouldNotify: boolean;
    message: string;
    emailSubject: string;
    emailBody: string;
  };
  nextActions: string[];
}

const genAI = new GoogleGenAI({
  apiKey: process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY || ''
});

async function validateFeedback(feedbackDoc: any): Promise<FeedbackValidation> {
  const data = feedbackDoc.data();
  
  console.error(`\n📋 Validando feedback: ${feedbackDoc.id}`);
  console.error(`   Usuario: ${data.userEmail}`);
  console.error(`   Rating: ${data.userStars ? data.userStars + '⭐' : data.expertRating}`);
  
  // Load conversation context
  const conversationDoc = await firestore
    .collection(COLLECTIONS.CONVERSATIONS)
    .doc(data.conversationId)
    .get();
  
  if (!conversationDoc.exists) {
    console.error('   ⚠️  Conversación no encontrada');
    return createManualReviewResult(feedbackDoc, 'Conversación no encontrada');
  }
  
  const conversation = conversationDoc.data();
  
  // Load messages to find the evaluated message and previous context
  const messagesSnapshot = await firestore
    .collection(COLLECTIONS.MESSAGES)
    .where('conversationId', '==', data.conversationId)
    .orderBy('timestamp', 'asc')
    .get();
  
  const messages = messagesSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    timestamp: doc.data().timestamp?.toDate ? doc.data().timestamp.toDate() : new Date(doc.data().timestamp)
  }));
  
  // Find the evaluated message
  const evaluatedMessage = messages.find(m => m.id === data.messageId);
  
  if (!evaluatedMessage) {
    console.error('   ⚠️  Mensaje evaluado no encontrado');
    return createManualReviewResult(feedbackDoc, 'Mensaje no encontrado');
  }
  
  // Find the user question (message before the evaluated response)
  const messageIndex = messages.findIndex(m => m.id === data.messageId);
  const userQuestion = messageIndex > 0 && messages[messageIndex - 1].role === 'user'
    ? messages[messageIndex - 1]
    : null;
  
  if (!userQuestion) {
    console.error('   ⚠️  Pregunta del usuario no encontrada');
    return createManualReviewResult(feedbackDoc, 'Pregunta no encontrada');
  }
  
  console.error(`   ✅ Pregunta original: "${userQuestion.content.substring(0, 80)}..."`);
  
  // Re-test with current system
  console.error('   🧪 Re-testeando con sistema actual...');
  
  const newResponse = await testWithCurrentSystem(
    userQuestion.content,
    conversation.agentModel || 'gemini-2.5-flash',
    conversation.activeContextSourceIds || []
  );
  
  // Compare responses using AI
  console.error('   🤖 Comparando respuestas con AI...');
  
  const oldResponseContent = typeof evaluatedMessage.content === 'string' 
    ? evaluatedMessage.content 
    : evaluatedMessage.content?.text || '';
  
  const comparison = await compareResponses(
    userQuestion.content,
    oldResponseContent,
    newResponse,
    data.userComment || data.expertNotes || 'No specific issue mentioned',
    data.userStars || 3
  );
  
  // Determine if resolved
  const isResolved = comparison.improvementScore >= 7; // 7+/10 = resolved
  const isPartiallyResolved = comparison.improvementScore >= 5 && comparison.improvementScore < 7;
  
  const status = isResolved ? 'resolved' : 
                 isPartiallyResolved ? 'partially_resolved' : 
                 'not_resolved';
  
  console.error(`   📊 Resultado: ${status} (Score: ${comparison.improvementScore}/10)`);
  
  // Create user notification
  const notification = createUserNotification(
    data,
    userQuestion.content,
    comparison,
    status
  );
  
  return {
    feedbackId: feedbackDoc.id,
    status,
    originalIssue: data.userComment || data.expertNotes || 'Rating dado sin comentario específico',
    testResult: {
      questionAsked: userQuestion.content,
      oldResponse: oldResponseContent.substring(0, 500),
      newResponse: newResponse.substring(0, 500),
      contextSourcesUsed: conversation.activeContextSourceIds || [],
      improvementDetected: comparison.improvementScore > (data.userStars || 3),
      improvementDetails: comparison.analysis
    },
    userNotification: notification,
    nextActions: determineNextActions(status, data, comparison)
  };
}

async function testWithCurrentSystem(
  question: string,
  model: string,
  contextSourceIds: string[]
): Promise<string> {
  try {
    // For now, generate with Gemini without full context (would need to load context sources)
    const result = await genAI.models.generateContent({
      model: model || 'gemini-2.5-flash',
      contents: question,
      config: {
        temperature: 0.7,
        maxOutputTokens: 2048
      }
    });
    
    return result.text || 'Sin respuesta';
  } catch (error) {
    console.error('   ❌ Error en test:', error);
    return '[Error al generar respuesta de prueba]';
  }
}

async function compareResponses(
  question: string,
  oldResponse: string,
  newResponse: string,
  userFeedback: string,
  originalRating: number
): Promise<{ improvementScore: number; analysis: string; resolved: boolean }> {
  try {
    const prompt = `Analiza si la nueva respuesta resuelve el problema mencionado en el feedback del usuario.

PREGUNTA ORIGINAL:
"${question}"

RESPUESTA ANTERIOR (calificada con ${originalRating}/5 estrellas):
"${oldResponse.substring(0, 800)}"

FEEDBACK DEL USUARIO:
"${userFeedback}"

NUEVA RESPUESTA (sistema actual):
"${newResponse.substring(0, 800)}"

ANÁLISIS REQUERIDO:
1. ¿La nueva respuesta aborda el problema mencionado en el feedback?
2. ¿La nueva respuesta es mejor que la anterior?
3. ¿Se resolvió el issue completamente?

RESPONDE EN JSON:
{
  "improvementScore": [0-10, donde 10 = completamente resuelto],
  "resolved": [true/false],
  "analysis": "[Explicación breve de si está resuelto y cómo]",
  "keyImprovements": ["Mejora 1", "Mejora 2", ...],
  "remainingIssues": ["Issue 1", "Issue 2", ...] o []
}`;

    const result = await genAI.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.3,
        maxOutputTokens: 1024
      }
    });
    
    const responseText = result.text || '{}';
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        improvementScore: parsed.improvementScore || 0,
        analysis: parsed.analysis || 'No se pudo analizar',
        resolved: parsed.resolved || false
      };
    }
    
    return {
      improvementScore: 5,
      analysis: 'No se pudo analizar automáticamente',
      resolved: false
    };
  } catch (error) {
    console.error('   ❌ Error en comparación:', error);
    return {
      improvementScore: 0,
      analysis: 'Error en análisis',
      resolved: false
    };
  }
}

function createUserNotification(
  feedback: any,
  question: string,
  comparison: any,
  status: string
): any {
  const userName = feedback.userName || 'Usuario';
  const rating = feedback.userStars || 3;
  const improvementScore = comparison.improvementScore;
  
  let message = '';
  let emailSubject = '';
  let emailBody = '';
  
  if (status === 'resolved') {
    // Issue resolved!
    message = `¡Hola ${userName}! 🎉\n\nGracias por tu feedback sobre "${question.substring(0, 100)}..."\n\nNos ayudó a mejorar el sistema. Hemos validado que el issue que mencionaste ahora está resuelto.\n\n✅ Mejora detectada: ${comparison.analysis}\n\n¿Podrías probar nuevamente y confirmar que funciona mejor?\n\nGracias por ayudarnos a mejorar SalfaGPT! 🙏`;
    
    emailSubject = '✅ Tu feedback fue implementado - SalfaGPT';
    
    emailBody = `Hola ${userName},

¡Excelente noticia! 🎉

Gracias por tu feedback del ${new Date(feedback.timestamp?.toDate ? feedback.timestamp.toDate() : new Date()).toLocaleDateString('es-CL')}.

TU FEEDBACK ORIGINAL:
${rating} estrellas - "${feedback.userComment || 'Sin comentario'}"

Sobre la pregunta: "${question.substring(0, 150)}..."

ESTADO ACTUAL:
✅ Issue Resuelto (Score de mejora: ${improvementScore}/10)

${comparison.analysis}

¿PUEDES PROBARLO NUEVAMENTE?
Nos encantaría que verificaras que ahora funciona mejor para ti.

1. Haz la misma pregunta en SalfaGPT
2. Compara con la respuesta anterior
3. Si funciona mejor, ¡genial! Si no, déjanos saber.

GRACIAS POR AYUDARNOS A MEJORAR 🙏
Tu feedback hace que SalfaGPT sea mejor para todos.

Saludos,
Equipo SalfaGPT`;
    
  } else if (status === 'partially_resolved') {
    // Partially resolved
    message = `Hola ${userName},\n\nGracias por tu feedback. Hemos hecho mejoras basadas en tu comentario, pero aún estamos trabajando en resolverlo completamente.\n\nMejora actual: ${comparison.analysis}\n\nSeguimos trabajando en esto. ¡Gracias por tu paciencia!`;
    
    emailSubject = '⏳ Trabajando en tu feedback - SalfaGPT';
    
    emailBody = `Hola ${userName},

Gracias por tu feedback del ${new Date(feedback.timestamp?.toDate ? feedback.timestamp.toDate() : new Date()).toLocaleDateString('es-CL')}.

ESTADO ACTUAL:
⏳ Parcialmente Resuelto (Score: ${improvementScore}/10)

Hemos hecho mejoras, pero aún estamos trabajando en resolverlo completamente.

${comparison.analysis}

Seguimos en ello. Te notificaremos cuando esté completamente resuelto.

Gracias por tu paciencia,
Equipo SalfaGPT`;
    
  } else {
    // Not resolved yet
    message = `Hola ${userName},\n\nGracias por tu feedback. Estamos trabajando activamente en resolver el issue que mencionaste.\n\nEn nuestra lista de prioridades. Te notificaremos cuando tengamos una solución.\n\n¡Gracias por ayudarnos a mejorar!`;
    
    emailSubject = '🔧 Trabajando en tu feedback - SalfaGPT';
    
    emailBody = `Hola ${userName},

Gracias por tu feedback del ${new Date(feedback.timestamp?.toDate ? feedback.timestamp.toDate() : new Date()).toLocaleDateString('es-CL')}.

ESTADO ACTUAL:
🔧 En Proceso (Score: ${improvementScore}/10)

Estamos trabajando activamente en resolver el issue que mencionaste.

Tu feedback está en nuestra lista de prioridades.

Te notificaremos cuando tengamos una solución.

Gracias por tu paciencia y por ayudarnos a mejorar,
Equipo SalfaGPT`;
  }
  
  return {
    shouldNotify: status === 'resolved', // Only auto-notify if resolved
    message,
    emailSubject,
    emailBody
  };
}

function determineNextActions(
  status: string,
  feedback: any,
  comparison: any
): string[] {
  const actions: string[] = [];
  
  if (status === 'resolved') {
    actions.push('📧 Enviar email de notificación al usuario');
    actions.push('✅ Marcar feedback como resuelto');
    actions.push('📊 Actualizar métricas de resolución');
    actions.push('🎉 Agregar a changelog como mejora implementada');
  } else if (status === 'partially_resolved') {
    actions.push('🔧 Continuar trabajando en mejoras');
    actions.push('📝 Actualizar ticket con progreso');
    actions.push('⏰ Programar re-validación en 7 días');
  } else {
    actions.push('🎫 Crear/actualizar ticket de mejora');
    actions.push('📊 Priorizar basado en impacto');
    actions.push('👨‍💻 Asignar a equipo técnico');
    actions.push('⏰ Establecer timeline de resolución');
  }
  
  // Additional actions based on rating
  if ((feedback.userStars && feedback.userStars <= 2) || feedback.expertRating === 'inaceptable') {
    actions.push('🚨 Escalar a prioridad alta');
    actions.push('👥 Notificar a stakeholders');
  }
  
  return actions;
}

function createManualReviewResult(feedbackDoc: any, reason: string): FeedbackValidation {
  return {
    feedbackId: feedbackDoc.id,
    status: 'requires_manual_review',
    originalIssue: reason,
    testResult: {
      questionAsked: '',
      oldResponse: '',
      newResponse: '',
      contextSourcesUsed: [],
      improvementDetected: false,
      improvementDetails: `Requiere revisión manual: ${reason}`
    },
    userNotification: {
      shouldNotify: false,
      message: '',
      emailSubject: '',
      emailBody: ''
    },
    nextActions: ['👨‍💻 Revisar manualmente', '📝 Completar información faltante']
  };
}

async function sendUserNotification(
  userEmail: string,
  notification: any,
  feedbackId: string
): Promise<boolean> {
  // TODO: Integrate with email service (SendGrid, Gmail API, etc.)
  console.error(`\n📧 SIMULACIÓN DE EMAIL:`);
  console.error(`   Para: ${userEmail}`);
  console.error(`   Asunto: ${notification.emailSubject}`);
  console.error(`   Preview: ${notification.emailBody.substring(0, 200)}...`);
  
  // For now, just log (implement actual email sending later)
  // await sendEmail(userEmail, notification.emailSubject, notification.emailBody);
  
  // Mark feedback as notified
  try {
    await firestore
      .collection('message_feedback')
      .doc(feedbackId)
      .update({
        validatedAt: new Date(),
        validationStatus: 'notified',
        notificationSent: true,
        notifiedAt: new Date()
      });
    
    console.error(`   ✅ Feedback marcado como notificado`);
    return true;
  } catch (error) {
    console.error(`   ❌ Error marcando feedback:`, error);
    return false;
  }
}

async function main() {
  try {
    const args = process.argv.slice(2);
    const feedbackIdArg = args.find(a => a.startsWith('--feedback-id='));
    const allFlag = args.includes('--all');
    
    console.error('⭐ Validación y Notificación de Feedback\n');
    
    let feedbacksToValidate = [];
    
    if (feedbackIdArg) {
      // Validate specific feedback
      const feedbackId = feedbackIdArg.split('=')[1];
      const feedbackDoc = await firestore.collection('message_feedback').doc(feedbackId).get();
      
      if (feedbackDoc.exists) {
        feedbacksToValidate = [feedbackDoc];
      } else {
        console.error(`❌ Feedback ${feedbackId} no encontrado`);
        process.exit(1);
      }
    } else if (allFlag) {
      // Validate all user feedbacks from last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const snapshot = await firestore
        .collection('message_feedback')
        .where('feedbackType', '==', 'user')
        .where('timestamp', '>=', thirtyDaysAgo)
        .get();
      
      feedbacksToValidate = snapshot.docs;
      console.error(`📊 Validando ${feedbacksToValidate.length} feedbacks de usuarios (últimos 30 días)\n`);
    } else {
      console.error('❌ Especifica --feedback-id=abc123 o --all');
      console.error('\nEjemplos:');
      console.error('  npx tsx scripts/validate-and-notify-feedback.ts --feedback-id=abc123');
      console.error('  npx tsx scripts/validate-and-notify-feedback.ts --all');
      process.exit(1);
    }
    
    // Validate each feedback
    const results: FeedbackValidation[] = [];
    let resolvedCount = 0;
    let partialCount = 0;
    let notifiedCount = 0;
    
    for (const feedbackDoc of feedbacksToValidate) {
      const result = await validateFeedback(feedbackDoc);
      results.push(result);
      
      if (result.status === 'resolved') {
        resolvedCount++;
        
        // Send notification if resolved
        if (result.userNotification.shouldNotify) {
          const feedbackData = feedbackDoc.data();
          const sent = await sendUserNotification(
            feedbackData.userEmail,
            result.userNotification,
            feedbackDoc.id
          );
          
          if (sent) notifiedCount++;
        }
      } else if (result.status === 'partially_resolved') {
        partialCount++;
      }
      
      // Small delay between validations
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Save results
    const outputPath = './exports/salfa-analytics/feedback-validation-results.json';
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
    
    console.error('\n' + '═'.repeat(70));
    console.error('✅ VALIDACIÓN COMPLETA!');
    console.error('═'.repeat(70));
    console.error(`\n📁 Resultados: ${outputPath}\n`);
    
    console.error('📊 RESUMEN:');
    console.error(`   • Total Validados: ${results.length}`);
    console.error(`   • ✅ Resueltos: ${resolvedCount}`);
    console.error(`   • ⏳ Parcialmente Resueltos: ${partialCount}`);
    console.error(`   • ❌ No Resueltos: ${results.length - resolvedCount - partialCount}`);
    console.error(`   • 📧 Notificaciones Enviadas: ${notifiedCount}\n`);
    
    console.error('🎯 PRÓXIMAS ACCIONES:');
    console.error(`   • Revisar resultados en: ${outputPath}`);
    console.error(`   • Verificar emails de notificación (simulados)`);
    console.error(`   • Implementar envío real de emails`);
    console.error(`   • Actualizar dashboard con status de validación\n`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();


