/**
 * Evaluation Test Execution API
 * 
 * Purpose: Execute test questions against agents and return responses
 */

import type { APIRoute } from 'astro';
import { getSession } from '../../../../lib/auth';
import { searchRelevantChunks } from '../../../../lib/rag-search';

/**
 * POST /api/evaluations/:id/test
 * Execute a test question against an agent
 */
export const POST: APIRoute = async ({ params, request, cookies }) => {
  try {
    const session = getSession({ cookies });
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { id } = params;
    const body = await request.json();
    const { userId, questionId, agentId, prompt } = body;

    if (!userId || !id || !questionId || !agentId || !prompt) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verify ownership
    if (session.id !== userId) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log('🧪 Testing question:', questionId, 'for agent:', agentId);

    // Search for relevant chunks using RAG
    const searchResults = await searchRelevantChunks(userId, prompt, {
      topK: 10,
      minSimilarity: 0.5,
    });

    console.log('📚 Found', searchResults.length, 'relevant chunks');

    // Build context from search results
    const contextSections = searchResults.map((result, index) => ({
      id: `ref-${index + 1}`,
      name: result.sourceName || 'Unknown',
      similarity: result.similarity,
      content: result.text,
      tokenCount: estimateTokens(result.text),
    }));

    // Build full prompt with context
    const contextText = contextSections
      .map((section, i) => `[${i + 1}] ${section.name} (${(section.similarity * 100).toFixed(1)}% similitud):\n${section.content}`)
      .join('\n\n---\n\n');

    const fullPrompt = `Contexto de documentos relevantes:

${contextText}

---

Pregunta del usuario:
${prompt}

Por favor responde basándote en el contexto proporcionado. Si mencionas un documento, usa la numeración [1], [2], etc. que aparece en el contexto.`;

    // Call Gemini AI
    const { GoogleGenAI } = await import('@google/genai');
    const genAI = new GoogleGenAI({ 
      apiKey: process.env.GOOGLE_AI_API_KEY || '' 
    });

    const systemPrompt = `Eres un asistente especializado en gestión de bodegas y procedimientos SAP.
Responde de manera profesional, precisa y útil.
Siempre que menciones un documento del contexto, usa su numeración exacta [1], [2], etc.
Si el contexto no tiene información suficiente, indícalo claramente.`;

    const result = await genAI.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: fullPrompt,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.3,
        maxOutputTokens: 8192,
      },
    });

    const response = result.text || '';

    console.log('✅ Generated response:', response.substring(0, 100) + '...');

    return new Response(JSON.stringify({
      response,
      references: contextSections.map((s, i) => ({
        id: `ref-${i + 1}`,
        number: i + 1,
        name: s.name,
        similarity: s.similarity,
        content: s.content.substring(0, 200) + '...',
      })),
      contextSources: contextSections.map(s => s.name),
      metadata: {
        questionId,
        agentId,
        prompt,
        model: 'gemini-2.5-flash',
        referenceCount: contextSections.length,
        timestamp: new Date().toISOString(),
      },
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error executing test:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

/**
 * Helper: Estimate token count
 */
function estimateTokens(text: string): number {
  // Rough estimate: ~0.75 tokens per word
  return Math.ceil(text.split(/\s+/).length * 0.75);
}

