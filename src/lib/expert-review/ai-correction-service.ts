// AI Correction Suggestion Service
// Created: 2025-11-09
// Purpose: Generate AI-powered correction suggestions for poor responses

import { GoogleGenAI } from '@google/genai';
import type { CorrectionProposal } from '../../types/expert-review';

const genAI = new GoogleGenAI({ 
  apiKey: process.env.GOOGLE_AI_API_KEY || '' 
});

/**
 * Generate AI-suggested correction when expert marks response as poor
 * 
 * @param params - Context for generating correction
 * @returns AI-generated suggestion with alternatives
 */
export async function generateCorrectionSuggestion(params: {
  userQuestion: string;
  originalResponse: string;
  expertNotes: string;
  contextUsed: string[];          // Active context source names
  agentPrompt: string;
  domainContext?: {
    mission?: string;
    okrs?: string[];
    kpis?: string[];
  };
}): Promise<CorrectionProposal['aiSuggestions']> {
  
  const { 
    userQuestion, 
    originalResponse, 
    expertNotes, 
    contextUsed, 
    agentPrompt,
    domainContext 
  } = params;
  
  // Build domain-aware prompt
  const prompt = `Eres un experto en mejorar respuestas de asistentes de IA${domainContext ? ` para una organización` : ''}.

CONTEXTO DEL PROBLEMA:
Pregunta del usuario: "${userQuestion}"
Respuesta actual del agente: "${originalResponse}"
Notas del experto revisor: "${expertNotes}"
Contexto disponible: ${contextUsed.join(', ') || 'Ninguno'}
Prompt del agente: "${agentPrompt}"

${domainContext ? `
CONTEXTO ORGANIZACIONAL:
Misión: "${domainContext.mission || 'No especificada'}"
OKRs del quarter: ${domainContext.okrs?.join(', ') || 'No especificados'}
KPIs críticos: ${domainContext.kpis?.join(', ') || 'No especificados'}
` : ''}

TAREA:
Genera una respuesta MEJORADA que el agente debería haber dado, considerando:
1. Claridad y estructura (pasos accionables)
2. Información específica (no genérica)
3. Referencias verificables (docs, secciones)
4. Alineación con misión y OKRs (si aplica)
5. Contexto disponible (usar fuentes de conocimiento)

IMPORTANTE:
- Sé conciso pero completo
- Incluye pasos numerados si es un proceso
- Agrega contactos/emails específicos (no genéricos)
- Incluye SLAs o tiempos esperados
- Referencia documentos/secciones cuando sea posible

Además, proporciona:
- Razones por las que tu sugerencia es mejor
- 2 opciones alternativas con pros/cons
- Estimación de cuántas preguntas similares mejorarían (0-100+)
- Estimación del % de mejora en calidad (0-100%)

FORMATO DE RESPUESTA (JSON estricto):
{
  "suggestedCorrection": "Texto de respuesta mejorada completa aquí...",
  "confidenceScore": 85,
  "reasoning": "Esta corrección mejora porque: 1) Incluye pasos accionables vs vago, 2) Contacto específico vs genérico...",
  "alternativeOptions": [
    {
      "text": "Opción alternativa 1 (más breve)...",
      "pros": ["Más concisa", "Más rápida de leer"],
      "cons": ["Menos detalle", "Puede generar follow-ups"],
      "riskLevel": "low"
    },
    {
      "text": "Opción alternativa 2 (más completa)...",
      "pros": ["Muy completa", "Cubre edge cases"],
      "cons": ["Más larga", "Puede abrumar"],
      "riskLevel": "low"
    }
  ],
  "affectedSimilarQuestions": 25,
  "estimatedQualityImprovement": 35
}

SOLO el JSON, sin explicaciones antes o después.`;

  try {
    console.log('✨ Generating AI correction suggestion...');
    
    const result = await genAI.models.generateContent({
      model: 'gemini-2.0-flash-exp', // Fast, high-quality
      contents: prompt,
      config: {
        temperature: 0.3,           // Balanced creativity
        maxOutputTokens: 2000,
        responseMimeType: 'application/json'
      }
    });

    const text = result.text || '{}';
    const suggestions = JSON.parse(text);
    
    console.log('✅ AI correction generated:', {
      confidence: suggestions.confidenceScore,
      similarQuestions: suggestions.affectedSimilarQuestions,
      improvement: suggestions.estimatedQualityImprovement
    });
    
    // Add metadata
    return {
      ...suggestions,
      generatedAt: new Date(),
      model: 'gemini-2.0-flash-exp',
      tokensUsed: result.usageMetadata?.totalTokenCount || 0
    };
    
  } catch (error) {
    console.error('❌ Error generating AI correction:', error);
    
    // Return fallback suggestion
    return {
      suggestedCorrection: `Basándose en: "${expertNotes}", considere proporcionar una respuesta más específica con pasos claros y referencias verificables.`,
      confidenceScore: 50,
      reasoning: 'Sugerencia básica generada debido a error de IA. Por favor, escriba corrección manualmente.',
      alternativeOptions: [],
      affectedSimilarQuestions: 0,
      estimatedQualityImprovement: 0,
      generatedAt: new Date(),
      model: 'fallback',
      tokensUsed: 0
    };
  }
}

/**
 * Estimate tokens in text (rough approximation)
 * Used for cost estimation
 */
function estimateTokens(text: string): number {
  // Rough estimate: 1 token ≈ 4 characters
  return Math.ceil(text.length / 4);
}

