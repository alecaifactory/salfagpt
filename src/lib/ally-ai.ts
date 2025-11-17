/**
 * Ally AI Integration
 * 
 * Integrates Gemini AI with Ally for intelligent responses.
 * Uses hierarchical prompt system and context-aware generation.
 * 
 * Version: 2.0.0 (Phase 2)
 * Date: 2025-11-16
 */

import { GoogleGenAI } from '@google/genai';
import { firestore } from './firestore';
import type { Message } from './firestore';

// Initialize Gemini AI
const apiKey = process.env.GOOGLE_AI_API_KEY || 
  (typeof import.meta !== 'undefined' && import.meta.env?.GOOGLE_AI_API_KEY);

if (!apiKey) {
  console.warn('⚠️ [ALLY AI] GOOGLE_AI_API_KEY not set - Ally will use fallback responses');
}

const genAI = apiKey ? new GoogleGenAI({ apiKey }) : null;

/**
 * Generate Ally response using Gemini AI
 */
export async function generateAllyResponse(
  conversationId: string,
  userId: string,
  userMessage: string,
  effectivePrompt: string,
  conversationHistory: Message[],
  recentConversationsContext?: string // ✅ NEW: Context from last 3 conversations
): Promise<{
  response: string;
  tokensUsed: { input: number; output: number; total: number };
  model: string;
}> {
  
  console.log('🤖 [ALLY AI] Generating response...');
  console.log(`  Conversation: ${conversationId}`);
  console.log(`  User message: ${userMessage.substring(0, 100)}...`);
  console.log(`  Effective prompt: ${effectivePrompt.length} chars`);
  console.log(`  History: ${conversationHistory.length} messages`);
  console.log(`  Recent context: ${recentConversationsContext ? 'Yes ✅' : 'No'}`);
  
  // Fallback if no API key
  if (!genAI) {
    console.warn('⚠️ [ALLY AI] No API key - using fallback response');
    return {
      response: generateFallbackResponse(userMessage),
      tokensUsed: { input: 100, output: 200, total: 300 },
      model: 'fallback',
    };
  }
  
  try {
    // Build conversation contents for Gemini
    const contents = buildConversationContents(userMessage, conversationHistory);
    
    // Build system instruction (effective prompt + Ally-specific instructions + recent context)
    const systemInstruction = buildAllySystemInstruction(effectivePrompt, recentConversationsContext);
    
    // Generate response with Gemini
    const result = await genAI.models.generateContent({
      model: 'gemini-2.0-flash-exp',  // Use Flash for speed
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
        maxOutputTokens: 2048,
      },
    });
    
    const responseText = result.text || 'Lo siento, no pude generar una respuesta.';
    
    // Estimate tokens (will be replaced with actual from API in future)
    const estimatedInput = systemInstruction.length + JSON.stringify(contents).length;
    const estimatedOutput = responseText.length;
    
    console.log('✅ [ALLY AI] Response generated');
    console.log(`  Length: ${responseText.length} chars`);
    console.log(`  Tokens: ~${estimatedInput + estimatedOutput}`);
    
    return {
      response: responseText,
      tokensUsed: {
        input: Math.ceil(estimatedInput / 4),   // ~4 chars per token
        output: Math.ceil(estimatedOutput / 4),
        total: Math.ceil((estimatedInput + estimatedOutput) / 4),
      },
      model: 'gemini-2.0-flash-exp',
    };
    
  } catch (error) {
    console.error('❌ [ALLY AI] Failed to generate response:', error);
    
    // Fallback to safe response
    return {
      response: `Lo siento, tuve un problema al generar una respuesta. 

Error técnico: ${error instanceof Error ? error.message : 'Unknown error'}

Intenta reformular tu pregunta o contacta al administrador si el problema persiste.`,
      tokensUsed: { input: 100, output: 150, total: 250 },
      model: 'fallback-error',
    };
  }
}

/**
 * Build conversation contents for Gemini API
 */
function buildConversationContents(
  userMessage: string,
  conversationHistory: Message[]
): Array<{ role: string; parts: Array<{ text: string }> }> {
  
  const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];
  
  // Add conversation history (last 10 messages for context)
  const recentHistory = conversationHistory.slice(-10);
  
  for (const msg of recentHistory) {
    const text = typeof msg.content === 'string' 
      ? msg.content 
      : msg.content?.text || '';
    
    if (text) {
      contents.push({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text }],
      });
    }
  }
  
  // Add current user message
  contents.push({
    role: 'user',
    parts: [{ text: userMessage }],
  });
  
  return contents;
}

/**
 * Build Ally system instruction
 * 
 * Combines effective prompt with Ally-specific capabilities
 */
function buildAllySystemInstruction(effectivePrompt: string, recentConversationsContext?: string): string {
  
  return `${effectivePrompt}${recentConversationsContext || ''}

**ALLY-SPECIFIC CAPABILITIES:**

You are Ally, the user's personal assistant. You have special capabilities:

1. **Agent Recommendations:**
   - When users ask questions, identify which specialized agent can best help
   - Explain WHY that agent is the right choice
   - Offer to connect them: "¿Quieres que te conecte con [Agent]?"
   - If they agree, respond with: "CONNECT_TO_AGENT:[agentId]:[agentName]"

2. **Platform Guidance:**
   - Help users understand available features
   - Guide through onboarding if they're new
   - Answer questions about how to use the platform
   - Provide tutorials and best practices

3. **Context Search:**
   - Help users find information in documents
   - Search across available context sources
   - Summarize relevant information

4. **Proactive Help:**
   - Offer suggestions when users seem stuck
   - Recommend next steps
   - Highlight relevant agents or features

**COMMUNICATION STYLE:**
- Friendly but professional
- Concise but complete
- Use Spanish as primary language
- Use emojis sparingly (only when it adds value)
- Always offer actionable next steps

**AGENT RECOMMENDATION FORMAT:**
When recommending an agent, use this exact format:

"Para [user's task], te recomiendo el agente **[Agent Name]**.

[Brief explanation of why this agent is right]

¿Quieres que te conecte con [Agent Name]? Puedo crear un chat con ese agente y transferir tu pregunta.

CONNECT_TO_AGENT:[agentId]:[agentName]"

**REMEMBER:**
- You help users be successful
- You make the platform easier to use
- You're always supportive and helpful
- You learn from each interaction`;
}

/**
 * Fallback response (when no API key)
 */
function generateFallbackResponse(userMessage: string): string {
  return `Recibí tu mensaje: "${userMessage}"

Soy Ally, tu asistente personal. En este momento estoy funcionando en modo de prueba.

**Lo que puedo hacer:**
✅ Recordar esta conversación
✅ Ayudarte a navegar la plataforma
✅ Guiarte hacia los agentes correctos

**Próximamente:**
🔨 Respuestas inteligentes con IA
🔨 Recomendaciones personalizadas de agentes
🔨 Búsqueda en documentos
🔨 Aprendizaje de tus preferencias

¿En qué más puedo ayudarte?`;
}

/**
 * Parse Ally response for special commands
 */
export function parseAllyResponse(response: string): {
  text: string;
  commands: Array<{
    type: 'CONNECT_TO_AGENT' | 'SEARCH_DOCS' | 'SHOW_TUTORIAL';
    agentId?: string;
    agentName?: string;
    query?: string;
    tutorialId?: string;
  }>;
} {
  
  const commands: any[] = [];
  let cleanText = response;
  
  // Extract CONNECT_TO_AGENT commands
  const connectRegex = /CONNECT_TO_AGENT:([^:]+):([^\n]+)/g;
  let match;
  
  while ((match = connectRegex.exec(response)) !== null) {
    commands.push({
      type: 'CONNECT_TO_AGENT',
      agentId: match[1],
      agentName: match[2],
    });
    
    // Remove command from text
    cleanText = cleanText.replace(match[0], '').trim();
  }
  
  return {
    text: cleanText,
    commands,
  };
}

/**
 * Analyze user query and recommend agent
 */
export async function recommendAgent(
  userQuery: string,
  userId: string,
  userDomain: string
): Promise<{
  agentId: string | null;
  agentName: string | null;
  confidence: number;
  reasoning: string;
}> {
  
  console.log('🎯 [ALLY AI] Recommending agent for query:', userQuery.substring(0, 100));
  
  try {
    // Get available agents for user
    const agents = await getUserAvailableAgents(userId, userDomain);
    
    if (agents.length === 0) {
      return {
        agentId: null,
        agentName: null,
        confidence: 0,
        reasoning: 'No agents available',
      };
    }
    
    // Simple keyword matching for MVP (will be replaced with AI analysis)
    const query = userQuery.toLowerCase();
    
    // Legal/normativa keywords → M001
    if (query.includes('legal') || query.includes('normativa') || query.includes('permiso') || 
        query.includes('regulación') || query.includes('construcción') || query.includes('edificación')) {
      const m001 = agents.find(a => a.title?.includes('M001') || a.title?.includes('Legal'));
      if (m001) {
        return {
          agentId: m001.id,
          agentName: m001.title || 'M001',
          confidence: 0.85,
          reasoning: 'Este agente especializa en normativa legal y regulaciones de construcción.',
        };
      }
    }
    
    // Warehouse/inventory keywords → S001
    if (query.includes('bodega') || query.includes('inventario') || query.includes('stock') ||
        query.includes('almacén') || query.includes('materiales') || query.includes('sap')) {
      const s001 = agents.find(a => a.title?.includes('S001') || a.title?.includes('BODEGA'));
      if (s001) {
        return {
          agentId: s001.id,
          agentName: s001.title || 'S001',
          confidence: 0.90,
          reasoning: 'Este agente maneja todo lo relacionado con gestión de bodegas e inventarios.',
        };
      }
    }
    
    // Safety keywords → SSOMA
    if (query.includes('seguridad') || query.includes('ssoma') || query.includes('riesgo') ||
        query.includes('accidente') || query.includes('epp') || query.includes('salud ocupacional')) {
      const ssoma = agents.find(a => a.title?.includes('SSOMA'));
      if (ssoma) {
        return {
          agentId: ssoma.id,
          agentName: ssoma.title || 'SSOMA',
          confidence: 0.88,
          reasoning: 'Este agente especializa en seguridad y salud ocupacional.',
        };
      }
    }
    
    // Default: return most used agent
    return {
      agentId: agents[0]?.id || null,
      agentName: agents[0]?.title || null,
      confidence: 0.50,
      reasoning: 'Este es uno de los agentes más populares en tu dominio.',
    };
    
  } catch (error) {
    console.error('Failed to recommend agent:', error);
    return {
      agentId: null,
      agentName: null,
      confidence: 0,
      reasoning: 'Error al buscar agentes',
    };
  }
}

/**
 * Get available agents for user
 */
async function getUserAvailableAgents(
  userId: string,
  userDomain: string
): Promise<Array<{ id: string; title: string; description?: string }>> {
  
  try {
    // Get user's own agents
    const ownedAgents = await firestore
      .collection('conversations')
      .where('userId', '==', userId)
      .where('isAgent', '==', true)
      .get();
    
    const agents = ownedAgents.docs.map(doc => ({
      id: doc.id,
      title: doc.data().title || 'Unnamed Agent',
      description: doc.data().description,
    }));
    
    console.log(`  Found ${agents.length} available agents`);
    
    return agents;
    
  } catch (error) {
    console.error('Failed to get available agents:', error);
    return [];
  }
}

