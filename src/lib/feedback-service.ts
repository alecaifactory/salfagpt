import { GoogleGenAI } from '@google/genai';
import { firestore } from './firestore';
import type {
  MessageFeedback,
  FeedbackTicket,
  AnnotatedScreenshot,
  TicketCategory,
  TicketPriority,
  ExpertRating,
  UserRating,
  FeedbackType,
} from '../types/feedback';

/**
 * Analyze screenshots with Gemini 2.5 Flash
 * Extracts insights from annotated screenshots
 */
export async function analyzeScreenshotWithGemini(
  screenshots: AnnotatedScreenshot[],
  feedbackType: FeedbackType,
  rating: ExpertRating | UserRating
): Promise<string> {
  const apiKey = process.env.GOOGLE_AI_API_KEY ||
    (typeof import.meta !== 'undefined' && import.meta.env
      ? import.meta.env.GOOGLE_AI_API_KEY
      : undefined);

  if (!apiKey) {
    console.warn('⚠️ No Gemini API key - skipping screenshot analysis');
    return 'Screenshot analysis unavailable';
  }

  try {
    const genAI = new GoogleGenAI({ apiKey });

    // Build prompt
    const prompt = `Analiza estas capturas de pantalla anotadas de un sistema de feedback ${feedbackType}.

Calificación recibida: ${rating}
Número de capturas: ${screenshots.length}
Total de anotaciones: ${screenshots.reduce((sum, s) => sum + s.annotations.length, 0)}

Por favor identifica:
1. Problemas o elementos señalados en las anotaciones
2. Patrones comunes entre las capturas
3. Áreas específicas de la interfaz mencionadas
4. Gravedad del problema indicado
5. Contexto técnico relevante

Responde en formato estructurado para crear un ticket de trabajo.`;

    // For each screenshot, we'd encode the image and send to Gemini
    // For MVP, we'll analyze annotations only
    const annotationsSummary = screenshots.map((s, idx) => {
      return `Captura ${idx + 1}:
- Dimensiones: ${s.width}x${s.height}
- Anotaciones: ${s.annotations.map((a) => {
        if (a.type === 'text') return `Texto: "${a.text}"`;
        if (a.type === 'circle') return `Círculo en (${a.x}, ${a.y}) radio ${a.radius}`;
        if (a.type === 'rectangle') return `Rectángulo en (${a.x}, ${a.y}) tamaño ${a.width}x${a.height}`;
        if (a.type === 'arrow') return `Flecha desde (${a.x}, ${a.y}) hasta (${a.endX}, ${a.endY})`;
        return '';
      }).join(', ')}`;
    }).join('\n\n');

    const result = await genAI.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `${prompt}\n\nDetalle de anotaciones:\n${annotationsSummary}`,
      config: {
        temperature: 0.3,
        maxOutputTokens: 1000,
      },
    });

    const analysis = result.text || 'Análisis no disponible';
    console.log('✅ Screenshot analysis complete:', analysis.substring(0, 100) + '...');
    return analysis;
  } catch (error) {
    console.error('❌ Error analyzing screenshot:', error);
    return 'Error al analizar capturas';
  }
}

/**
 * Create ticket from feedback
 * Uses AI to generate title, description, category, priority
 */
export async function createTicketFromFeedback(
  feedbackId: string,
  feedback: Omit<MessageFeedback, 'id'>
): Promise<string> {
  const apiKey = process.env.GOOGLE_AI_API_KEY ||
    (typeof import.meta !== 'undefined' && import.meta.env
      ? import.meta.env.GOOGLE_AI_API_KEY
      : undefined);

  if (!apiKey) {
    console.warn('⚠️ No Gemini API key - creating basic ticket');
    return createBasicTicket(feedbackId, feedback);
  }

  try {
    const genAI = new GoogleGenAI({ apiKey });

    // Build analysis prompt
    const prompt = `Analiza este feedback de usuario y genera un ticket de trabajo estructurado.

Tipo de feedback: ${feedback.feedbackType}
${feedback.feedbackType === 'expert' 
  ? `Calificación experta: ${feedback.expertRating}
NPS: ${feedback.npsScore ?? 'N/A'}
CSAT: ${feedback.csatScore ?? 'N/A'}
Notas: ${feedback.expertNotes || 'Sin notas'}` 
  : `Estrellas: ${feedback.userStars}/5
Comentario: ${feedback.userComment || 'Sin comentario'}`}

${feedback.screenshotAnalysis ? `Análisis de capturas:\n${feedback.screenshotAnalysis}` : ''}

Genera un ticket con:
1. **title**: Título conciso y accionable (máx 80 caracteres)
2. **description**: Descripción detallada del problema/mejora
3. **category**: Una de: bug, feature-request, ui-improvement, performance, security, content-quality, agent-behavior, context-accuracy, other
4. **priority**: Una de: critical (P0), high (P1), medium (P2), low (P3)
5. **userImpact**: Una de: critical, high, medium, low
6. **estimatedEffort**: Una de: xs (< 1h), s (1-4h), m (1-2 días), l (3-5 días), xl (> 1 semana)
7. **actionableItems**: Lista de 3-5 acciones concretas
8. **affectedComponents**: Lista de componentes/módulos afectados

Responde SOLO con JSON válido, sin markdown ni explicaciones.`;

    const result = await genAI.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.2, // Low temp for structured output
        maxOutputTokens: 1500,
      },
    });

    const aiResponseText = result.text || '{}';
    
    // Parse AI response
    let aiAnalysis;
    try {
      // Remove markdown code blocks if present
      const jsonText = aiResponseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      aiAnalysis = JSON.parse(jsonText);
    } catch (parseError) {
      console.warn('⚠️ Failed to parse AI response, using fallback:', parseError);
      return createBasicTicket(feedbackId, feedback);
    }

    // Create ticket document
    const ticketData: Omit<FeedbackTicket, 'id'> = {
      feedbackId,
      messageId: feedback.messageId,
      conversationId: feedback.conversationId,
      
      title: aiAnalysis.title || generateBasicTitle(feedback),
      description: aiAnalysis.description || 'Sin descripción generada',
      category: (aiAnalysis.category || 'other') as TicketCategory,
      priority: (aiAnalysis.priority || 'medium') as TicketPriority,
      status: 'new',

      reportedBy: feedback.userId,
      reportedByEmail: feedback.userEmail,
      reportedByRole: feedback.userRole,

      originalFeedback: {
        type: feedback.feedbackType,
        rating: feedback.feedbackType === 'expert' 
          ? feedback.expertRating! 
          : feedback.userStars!,
        comment: feedback.expertNotes || feedback.userComment,
        screenshots: feedback.screenshots,
        screenshotAnalysis: feedback.screenshotAnalysis,
      },

      aiAnalysis: {
        summary: aiAnalysis.description || '',
        suggestedCategory: aiAnalysis.category,
        suggestedPriority: aiAnalysis.priority,
        actionableItems: aiAnalysis.actionableItems || [],
        technicalDetails: aiAnalysis.technicalDetails,
        affectedComponents: aiAnalysis.affectedComponents || [],
      },

      userImpact: aiAnalysis.userImpact || 'medium',
      estimatedEffort: aiAnalysis.estimatedEffort || 'm',

      createdAt: new Date(),
      updatedAt: new Date(),
      source: process.env.NODE_ENV === 'production' ? 'production' : 'localhost',
    };

    const ticketRef = await firestore.collection('feedback_tickets').add(ticketData);
    const ticketId = ticketRef.id;

    console.log(`✅ Ticket created from ${feedback.feedbackType} feedback: ${ticketId}`);
    return ticketId;
  } catch (error) {
    console.error('❌ Error creating ticket from feedback:', error);
    // Fallback to basic ticket
    return createBasicTicket(feedbackId, feedback);
  }
}

/**
 * Create basic ticket without AI analysis
 */
async function createBasicTicket(
  feedbackId: string,
  feedback: Omit<MessageFeedback, 'id'>
): Promise<string> {
  const ticketData: Omit<FeedbackTicket, 'id'> = {
    feedbackId,
    messageId: feedback.messageId,
    conversationId: feedback.conversationId,

    title: generateBasicTitle(feedback),
    description: feedback.expertNotes || feedback.userComment || 'Sin descripción',
    category: 'other',
    priority: determinePriorityFromRating(feedback),
    status: 'new',

    reportedBy: feedback.userId,
    reportedByEmail: feedback.userEmail,
    reportedByRole: feedback.userRole,

    originalFeedback: {
      type: feedback.feedbackType,
      rating: feedback.feedbackType === 'expert' 
        ? feedback.expertRating! 
        : feedback.userStars!,
      comment: feedback.expertNotes || feedback.userComment,
      screenshots: feedback.screenshots,
    },

    userImpact: feedback.feedbackType === 'expert' && feedback.expertRating === 'inaceptable'
      ? 'high'
      : 'medium',
    estimatedEffort: 'm',

    createdAt: new Date(),
    updatedAt: new Date(),
    source: process.env.NODE_ENV === 'production' ? 'production' : 'localhost',
  };

  const ticketRef = await firestore.collection('feedback_tickets').add(ticketData);
  return ticketRef.id;
}

/**
 * Generate basic title from feedback
 */
function generateBasicTitle(feedback: Omit<MessageFeedback, 'id'>): string {
  const type = feedback.feedbackType === 'expert' ? 'Experto' : 'Usuario';
  const rating = feedback.feedbackType === 'expert'
    ? feedback.expertRating
    : `${feedback.userStars}/5`;

  return `Feedback ${type}: ${rating} - Mensaje ${feedback.messageId.substring(0, 8)}`;
}

/**
 * Determine priority from feedback rating
 */
function determinePriorityFromRating(
  feedback: Omit<MessageFeedback, 'id'>
): TicketPriority {
  if (feedback.feedbackType === 'expert') {
    if (feedback.expertRating === 'inaceptable') return 'high';
    if (feedback.expertRating === 'aceptable') return 'medium';
    return 'low'; // sobresaliente = low priority (positive feedback)
  } else {
    const stars = feedback.userStars!;
    if (stars <= 2) return 'high';
    if (stars === 3) return 'medium';
    return 'low'; // 4-5 stars = low priority (positive feedback)
  }
}

