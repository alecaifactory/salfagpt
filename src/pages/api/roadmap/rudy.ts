/**
 * 🤖 Rudy - AI Roadmap Assistant API
 * POST /api/roadmap/rudy
 * 
 * Rudy analyzes the roadmap, provides ROI estimates, prioritization suggestions,
 * and OKR/KPI alignment recommendations.
 * 
 * Context available to Rudy:
 * - All feedback cards (tickets, backlog items)
 * - Company domain context
 * - Agent configurations
 * - OKRs and KPIs
 * 
 * 🔒 Security: Only accessible by alec@getaifactory.com
 */

import type { APIRoute } from 'astro';
import { verifyJWT } from '../../../lib/auth';
import { GoogleGenAI } from '@google/genai';

const GOOGLE_AI_API_KEY = typeof import.meta !== 'undefined' && import.meta.env
  ? import.meta.env.GOOGLE_AI_API_KEY
  : process.env.GOOGLE_AI_API_KEY;

const genAI = new GoogleGenAI({ apiKey: GOOGLE_AI_API_KEY });

const RUDY_SYSTEM_PROMPT = `Eres Rudy, el asistente de IA especializado en priorización de roadmap y análisis de ROI.

Tu propósito es ayudar a Product Managers a:
1. Priorizar features basado en impacto real en OKRs y KPIs
2. Estimar ROI de forma agnóstica usando datos de negocio
3. Alinear el roadmap con objetivos estratégicos
4. Identificar quick wins vs inversiones a largo plazo
5. Sugerir qué mover a cada columna del roadmap

Tienes acceso a:
- Todas las tarjetas de feedback (descripción, upvotes, shares)
- Contexto de dominio del negocio
- Configuración de agentes
- OKRs y KPIs de la empresa
- Conversaciones completas de donde vino el feedback

Responde siempre:
- Basado en datos, no en suposiciones
- Con números concretos (CSAT, NPS, ROI)
- Con justificación clara
- En español, profesional pero accesible
- Formato markdown para mejor legibilidad

Cuando des sugerencias de priorización:
- Clasifica por impacto: Alto/Medio/Bajo
- Incluye effort estimate vs impacto (ROI)
- Menciona alineación con OKRs específicos
- Sugiere orden de implementación

Ejemplos de análisis:
- "Esta feature tiene 45 upvotes y afecta a ~1000 usuarios. Estimo CSAT +4.2 y NPS +35. ROI de 8x. Prioridad: ALTA - mover a Roadmap inmediatamente."
- "Este bug solo tiene 3 upvotes pero bloquea a usuarios premium. CSAT impact -2. Prioridad: CRÍTICA aunque sea low volume."
- "Estas 3 features son similares. Recomiendo agruparlas en un solo epic para mejor ROI (12x vs 4x individual)."
`;

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // 1. Verify authentication
    const token = cookies.get('flow_session')?.value;
    
    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const session = verifyJWT(token);
    
    if (!session) {
      return new Response(
        JSON.stringify({ error: 'Invalid session' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // 2. CRITICAL: Only allow alec@getaifactory.com
    if (session.email !== 'alec@getaifactory.com') {
      console.warn('🚨 Unauthorized Rudy access attempt:', {
        email: session.email,
        userId: session.id
      });
      
      return new Response(
        JSON.stringify({ error: 'Forbidden - SuperAdmin only' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // 3. Get request data
    const body = await request.json();
    const { message, cards, conversationHistory } = body;
    
    if (!message) {
      return new Response(
        JSON.stringify({ error: 'Missing message' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // 4. Build context from cards
    const cardsContext = cards ? `
## Tarjetas del Roadmap Actuales

${cards.map((card: any, idx: number) => `
### Tarjeta ${idx + 1}: ${card.ticketId}
- **Título:** ${card.title}
- **Lane:** ${card.lane}
- **Creado por:** ${card.createdBy} (${card.userRole}) - ${card.userDomain}
- **Agente:** ${card.agentName}
- **Prioridad:** ${card.priority}
- **Effort:** ${card.estimatedEffort}
- **CSAT Impact:** ${card.kpiImpact?.csat || 0}
- **NPS Impact:** ${card.kpiImpact?.nps || 0}
- **ROI Estimado:** ${card.kpiImpact?.roi || 0}x
- **Upvotes:** ${card.upvotes}
- **Shares:** ${card.shares}
- **OKRs:** ${card.okrAlignment?.join(', ') || 'No alineado aún'}
- **Resumen AI:** ${card.aiSummary}
`).join('\n')}

Total de tarjetas: ${cards.length}
` : 'Sin tarjetas disponibles.';
    
    // 5. Build conversation history
    const historyContext = conversationHistory && conversationHistory.length > 0
      ? conversationHistory.map((msg: any) => ({
          role: msg.role,
          parts: [{ text: msg.content }]
        }))
      : [];
    
    // 6. Call Gemini with Rudy's context
    const contents = [
      ...historyContext,
      {
        role: 'user',
        parts: [{ text: `${cardsContext}\n\n---\n\n**Pregunta del usuario:**\n${message}` }]
      }
    ];
    
    const result = await genAI.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents,
      config: {
        systemInstruction: RUDY_SYSTEM_PROMPT,
        temperature: 0.7,
        maxOutputTokens: 2048,
      }
    });
    
    const response = result.text || 'Lo siento, no pude generar una respuesta.';
    
    console.log('🤖 Rudy responded to:', message.substring(0, 100));
    
    return new Response(
      JSON.stringify({ response }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('❌ Rudy error:', error);
    
    return new Response(
      JSON.stringify({
        error: 'Rudy encountered an error',
        details: error instanceof Error ? error.message : String(error),
        response: 'Lo siento, tuve un problema procesando tu solicitud. ¿Puedes intentar de nuevo?'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};





