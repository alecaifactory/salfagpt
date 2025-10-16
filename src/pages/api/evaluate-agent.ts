import type { APIRoute } from 'astro';
import { GoogleGenAI } from '@google/genai';

const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY || 
  (typeof import.meta !== 'undefined' && import.meta.env 
    ? import.meta.env.GOOGLE_AI_API_KEY 
    : undefined);

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const {
      agentId,
      agentName,
      agentContext,
      systemPrompt,
      model,
      testInput,
      expectedOutput,
      acceptanceCriteria,
      category
    } = body;
    
    if (!GOOGLE_AI_API_KEY) {
      return new Response(JSON.stringify({
        error: 'API Key no configurado'
      }), { status: 500 });
    }
    
    const genAI = new GoogleGenAI({ apiKey: GOOGLE_AI_API_KEY });
    
    // Step 1: Get agent response
    const agentPrompt = systemPrompt || 'Eres un asistente útil y profesional.';
    const contextString = agentContext ? `\n\nCONTEXTO DISPONIBLE:\n${agentContext}` : '';
    
    const agentResponseResult = await genAI.models.generateContent({
      model: model || 'gemini-2.5-flash',
      contents: agentPrompt + contextString + '\n\nPREGUNTA: ' + testInput,
      config: {
        temperature: 0.7,
        maxOutputTokens: 2048
      }
    });
    
    const agentResponse = agentResponseResult.text || 'Sin respuesta';
    
    // Step 2: Evaluate the response using Gemini as evaluator
    const evaluatorPrompt = `Eres un evaluador experto de agentes AI. Tu tarea es evaluar la calidad de la respuesta de un agente.

AGENTE EVALUADO: ${agentName}
CATEGORÍA DEL TEST: ${category}

ENTRADA AL AGENTE:
${testInput}

SALIDA ESPERADA:
${expectedOutput}

RESPUESTA REAL DEL AGENTE:
${agentResponse}

CRITERIOS DE ACEPTACIÓN:
${acceptanceCriteria || 'La respuesta debe ser precisa, clara, completa y relevante a la pregunta.'}

INSTRUCCIONES DE EVALUACIÓN:
1. Compara la respuesta del agente con la salida esperada
2. Evalúa cada criterio en escala 0-100:
   - Precisión: ¿Qué tan precisa es la información?
   - Claridad: ¿Qué tan clara y comprensible es la respuesta?
   - Completitud: ¿Cubre todos los puntos necesarios?
   - Relevancia: ¿Qué tan relevante es a la pregunta?

3. Determina si el test PASA o FALLA (pasa si promedio ≥ 85%)
4. Proporciona feedback constructivo

RESPONDE EN FORMATO JSON:
{
  "passed": true/false,
  "score": 0-100,
  "criteriaScores": {
    "precision": 0-100,
    "clarity": 0-100,
    "completeness": 0-100,
    "relevance": 0-100
  },
  "feedback": "Explicación breve de la evaluación y sugerencias si aplica"
}`;
    
    const evaluationResult = await genAI.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: evaluatorPrompt,
      config: {
        temperature: 0.3, // Lower temperature for more consistent evaluation
        maxOutputTokens: 1024
      }
    });
    
    const evaluationText = evaluationResult.text || '{}';
    
    // Parse JSON response
    let evaluation;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = evaluationText.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/) || 
                       evaluationText.match(/(\{[\s\S]*\})/);
      const jsonText = jsonMatch ? jsonMatch[1] : evaluationText;
      evaluation = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('Error parsing evaluation:', parseError);
      console.log('Raw evaluation text:', evaluationText);
      
      // Fallback: extract scores from text
      evaluation = {
        passed: evaluationText.toLowerCase().includes('pass') || 
                evaluationText.toLowerCase().includes('aprobado'),
        score: 75,
        criteriaScores: {
          precision: 75,
          clarity: 75,
          completeness: 75,
          relevance: 75
        },
        feedback: evaluationText.substring(0, 200)
      };
    }
    
    return new Response(JSON.stringify({
      agentResponse,
      ...evaluation
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Error in agent evaluation:', error);
    return new Response(JSON.stringify({
      error: 'Error al evaluar agente',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

