import type { APIRoute } from 'astro';
import { GoogleGenAI } from '@google/genai';

let geminiClient: GoogleGenAI | null = null;

function getGeminiClient() {
  if (!geminiClient) {
    try {
      const apiKey = process.env.GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('GEMINI_API_KEY not configured');
      }
      geminiClient = new GoogleGenAI({ apiKey });
      console.log('✅ Gemini AI client initialized for relevance analysis');
    } catch (error) {
      console.error('❌ Failed to initialize Gemini AI client for relevance analysis:', error);
      throw error;
    }
  }
  return geminiClient;
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const { query, chunks } = await request.json();

    if (!query || !chunks || !Array.isArray(chunks) || chunks.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Query and chunks are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const client = getGeminiClient();

    const relevanceScores: Array<{ chunkId: string; score: number }> = [];

    // Process chunks in parallel
    const scorePromises = chunks.map(async (chunk) => {
      const prompt = `Dada la siguiente pregunta: "${query}"
Evalúa la relevancia del siguiente fragmento de texto en una escala del 0 al 100.
Responde ÚNICAMENTE con un número entero.

Fragmento de texto:
"${chunk.content}"

Relevancia (0-100):`;

      try {
        const result = await client.models.generateContent({
          model: 'gemini-1.5-flash',
          contents: prompt,
          config: {
            temperature: 0.1,
            maxOutputTokens: 10,
          }
        });
        
        const responseText = result.text || '0';
        const score = parseInt(responseText.trim(), 10);

        return {
          chunkId: chunk.id,
          score: isNaN(score) ? 0 : Math.max(0, Math.min(100, score)),
        };
      } catch (error) {
        console.error(`Error analyzing chunk ${chunk.id}:`, error);
        return {
          chunkId: chunk.id,
          score: 0,
        };
      }
    });

    const scores = await Promise.all(scorePromises);
    relevanceScores.push(...scores);

    console.log(`✅ Analyzed ${chunks.length} chunks for query: "${query}"`);

    return new Response(
      JSON.stringify({ success: true, relevanceScores }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error analyzing relevance:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to analyze relevance', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
