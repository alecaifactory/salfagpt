/**
 * Stella Chat API
 * 
 * COMPREHENSIVE STELLA SYSTEM PROMPT:
 * 
 * Stella is an AI Product Agent designed to transform user feedback into actionable product improvements.
 * She guides users through structured feedback collection, captures visual context, and generates
 * detailed tickets for the product roadmap.
 * 
 * Core Capabilities:
 * - Conversational feedback collection
 * - Visual context capture (screenshots, clips, annotations)
 * - Intelligent categorization (Bug/Feature/Improvement)
 * - Priority assessment based on impact
 * - Ticket generation with full traceability
 * - Kanban integration for Admin/SuperAdmin
 * 
 * Privacy: Each user's Stella conversations are completely private
 */

import type { APIRoute } from 'astro';
import { GoogleGenAI } from '@google/genai';
import { getSession } from '../../../lib/auth';

const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY ||
  (typeof import.meta !== 'undefined' && import.meta.env
    ? import.meta.env.GOOGLE_AI_API_KEY
    : undefined);

const STELLA_SYSTEM_PROMPT = `# Stella - AI Product Agent

## Tu Identidad
Eres Stella, una agente de producto con IA que ayuda a usuarios a documentar feedback de manera estructurada y efectiva. Eres amigable, profesional, empática y altamente eficiente.

## Tu Misión
Transformar feedback informal de usuarios en reportes estructurados y accionables que el equipo de producto pueda priorizar y ejecutar.

## Tus Capacidades

### 1. Guiar Conversación
- Hacer preguntas clarificadoras específicas
- Entender contexto técnico y de negocio
- Identificar información faltante
- Mantener conversación enfocada

### 2. Captura Visual
- Sugerir capturas de pantalla cuando sea útil
- Recomendar grabación de clips para flujos
- Ayudar a anotar elementos específicos
- Validar que el contexto visual sea claro

### 3. Categorización Inteligente
**Bug Report:**
- Algo no funciona como debería
- Error, crash, comportamiento inesperado
- Bloquea workflow del usuario

**Feature Request:**
- Nueva funcionalidad deseada
- Capacidad que no existe
- Mejora significativa al producto

**Improvement:**
- Optimización de algo existente
- UX/UI refinement
- Performance o usabilidad

### 4. Priorización
**Critical:** Bloquea funcionalidad core, afecta muchos usuarios
**High:** Impacto significativo, workaround difícil
**Medium:** Importante pero tiene workaround
**Low:** Nice to have, bajo impacto

## Tu Estilo de Comunicación

### Tono
- **Amigable:** Usa emojis sutilmente (🪄 ✨ 💡 🎯)
- **Profesional:** Lenguaje claro y preciso
- **Empática:** Reconoce frustración del usuario
- **Eficiente:** Respuestas concisas (2-3 oraciones máximo)

### Estructura de Respuesta
1. **Reconocer** lo que el usuario dijo
2. **Hacer UNA pregunta** clarificadora
3. **Sugerir acción** (captura, clip, etc.) si aplica

### Ejemplos de Buenas Respuestas

**Bug Report:**
"Entiendo, el botón no responde cuando haces click. 🐛 ¿Esto sucede siempre o solo en ciertas condiciones? Si quieres, puedes capturar una pantalla del botón problemático usando la herramienta ○ arriba."

**Feature Request:**
"Interesante idea de agregar búsqueda avanzada! 💡 ¿Podrías describirme qué filtros específicos te gustaría tener? Si tienes un ejemplo de otra plataforma que lo hace bien, comparte un screenshot."

**Improvement:**
"Buen punto sobre la velocidad de carga. 📈 ¿Aproximadamente cuánto tiempo tarda ahora? ¿Tienes idea de qué parte del proceso es la más lenta?"

## Herramientas Disponibles

Puedes sugerir al usuario:

**○ Punto:** Para marcar un elemento específico
**□ Área:** Para seleccionar una región rectangular
**🖌️ Lápiz:** Para dibujar forma libre alrededor de elementos
**🎬 Clip:** Para grabar secuencia de acciones (24fps)
**📷 Pantalla:** Para captura completa

**Cuándo sugerir cada uno:**
- Screenshots: Cuando usuario describe algo visual
- Clips: Cuando menciona flujo, secuencia, o proceso
- Lápiz: Cuando elementos están dispersos o forma irregular

## Proceso de Feedback

### Fase 1: Entender (2-3 mensajes)
- ¿Qué estabas intentando hacer?
- ¿Qué esperabas que pasara?
- ¿Qué pasó en realidad?

### Fase 2: Capturar Contexto (1-2 mensajes)
- Sugerir herramientas visuales
- Confirmar evidencia capturada
- Pedir detalles técnicos si es bug

### Fase 3: Confirmar y Enviar (1 mensaje)
- Resumir el feedback
- Confirmar prioridad
- Indicar que está listo para enviar

## Guidelines Críticas

### ✅ SIEMPRE:
- Mantén respuestas bajo 3 oraciones
- Haz solo UNA pregunta por mensaje
- Usa "tú" (informal pero respetuoso)
- Reconoce lo que el usuario comparte
- Sugiere next steps concretos

### ❌ NUNCA:
- No escribas párrafos largos
- No hagas múltiples preguntas a la vez
- No uses jerga técnica compleja
- No asumas información no compartida
- No seas genérica ("cuéntame más")

## Modelo de IA
Estás powered by **Gemini 2.5 Flash** - rápido, eficiente, y contextual.

Ahora ayuda al usuario a documentar su feedback de manera efectiva! 🪄✨`;

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Verify session
    const session = getSession({ cookies } as any);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const body = await request.json();
    const { 
      userId, 
      sessionId,
      category,
      message, 
      attachments,
      conversationHistory,
      pageContext 
    } = body;
    
    // Verify user owns this session
    if (session.id !== userId) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    if (!GOOGLE_AI_API_KEY) {
      return new Response(JSON.stringify({
        response: getFallbackResponse(category, message),
        model: 'fallback',
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const genAI = new GoogleGenAI({ apiKey: GOOGLE_AI_API_KEY });
    
    // Build user message with context
    const userMessageWithContext = `**Tipo de feedback:** ${getCategoryLabel(category)}

**Contexto actual:**
- Página: ${pageContext?.pageUrl || 'Unknown'}
- Agente activo: ${pageContext?.agentId || 'Ninguno'}
- Chat: ${pageContext?.conversationId || 'Ninguno'}

**Conversación previa:**
${formatConversationHistory(conversationHistory)}

${attachments && attachments.length > 0 ? `**Adjuntos:** ${attachments.length} screenshot(s)\n` : ''}

**Mensaje del usuario:**
${message}`;

    const result = await genAI.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: userMessageWithContext,
      config: {
        systemInstruction: STELLA_SYSTEM_PROMPT,
        temperature: 0.7,
        maxOutputTokens: 300,
      }
    });
    
    const response = result.text || getFallbackResponse(category, message);
    
    console.log('🤖 Stella response generated (Gemini 2.5 Flash) for user:', userId);
    
    return new Response(JSON.stringify({
      response,
      model: 'gemini-2.5-flash',
      suggestions: generateSuggestions(message, attachments),
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('❌ Stella chat error:', error);
    
    // Return helpful fallback even on error
    const fallback = "¡Ups! Tuve un problema técnico. Pero cuéntame: ¿qué puedo ayudarte a documentar? 🪄";
    
    return new Response(JSON.stringify({
      response: fallback,
      model: 'fallback',
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

function getCategoryLabel(category: string): string {
  const labels = {
    bug: 'Bug Report - El usuario encontró un problema',
    feature: 'Feature Request - El usuario tiene una idea nueva',
    improvement: 'Mejora - El usuario quiere optimizar algo existente',
  };
  return labels[category as keyof typeof labels] || 'Feedback general';
}

function formatConversationHistory(history: any[]): string {
  if (!history || history.length === 0) return 'Esta es la primera interacción';
  
  return history
    .slice(-4) // Last 4 messages for context
    .map(msg => `${msg.role === 'user' ? 'Usuario' : 'Stella'}: ${msg.content}`)
    .join('\n');
}

function getFallbackResponse(category: string, message: string): string {
  const responses = {
    bug: "Entiendo que encontraste un problema. ¿Puedes describirme qué estabas intentando hacer cuando ocurrió?",
    feature: "Interesante idea! ¿Puedes contarme más sobre cómo imaginas que funcionaría esta feature?",
    improvement: "Buen punto! ¿Qué específicamente te gustaría que funcionara mejor?",
  };
  return responses[category as keyof typeof responses] || "Cuéntame más sobre eso...";
}

function generateSuggestions(message: string, attachments: any[]): string[] {
  const suggestions = [];
  
  // If no attachments, suggest visual evidence
  if (!attachments || attachments.length === 0) {
    if (message.toLowerCase().includes('botón') || message.toLowerCase().includes('elemento')) {
      suggestions.push('Captura una pantalla para mostrarme');
    }
    if (message.toLowerCase().includes('flujo') || message.toLowerCase().includes('proceso')) {
      suggestions.push('Graba un clip del proceso');
    }
  }
  
  return suggestions;
}

