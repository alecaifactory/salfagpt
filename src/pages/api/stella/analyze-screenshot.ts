/**
 * Stella Screenshot Analysis API
 * 
 * Analyzes annotated screenshots with Gemini AI to:
 * - Identify UI problems/features indicated by annotations
 * - Extract context about what the user is highlighting
 * - Provide intelligent suggestions based on visual analysis
 * 
 * POST /api/stella/analyze-screenshot
 */

import type { APIRoute } from 'astro';
import { GoogleGenAI } from '@google/genai';
import type { AnnotatedScreenshot } from '../../../types/feedback';

const GEMINI_API_KEY = import.meta.env.GOOGLE_AI_API_KEY || process.env.GOOGLE_AI_API_KEY;

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { screenshot, uiContext, category } = body as {
      screenshot: AnnotatedScreenshot;
      uiContext: {
        currentAgent?: string;
        currentChat?: string;
        consoleErrors?: string[];
        pageUrl?: string;
      };
      category: 'bug' | 'feature' | 'improvement';
    };

    if (!screenshot || !screenshot.imageDataUrl) {
      return new Response(
        JSON.stringify({ error: 'Screenshot data required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Gemini AI
    const genAI = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

    // Build analysis prompt
    const analysisPrompt = buildAnalysisPrompt(category, uiContext, screenshot.annotations.length);

    // Convert base64 image to inline data
    const imageData = screenshot.imageDataUrl.split(',')[1]; // Remove data:image/png;base64,

    // Call Gemini Vision API
    const result = await genAI.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { text: analysisPrompt },
            {
              inlineData: {
                mimeType: 'image/png',
                data: imageData,
              },
            },
          ],
        },
      ],
      config: {
        temperature: 0.3, // Lower for more focused analysis
        maxOutputTokens: 500, // Concise analysis
      },
    });

    const analysis = result.text || 'No se pudo analizar la imagen.';

    return new Response(
      JSON.stringify({
        analysis,
        annotationsCount: screenshot.annotations.length,
        context: uiContext,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('❌ Error analyzing screenshot:', error);
    return new Response(
      JSON.stringify({
        error: 'Error al analizar screenshot',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

function buildAnalysisPrompt(
  category: 'bug' | 'feature' | 'improvement',
  uiContext: any,
  annotationsCount: number
): string {
  const categoryContext = {
    bug: 'El usuario está reportando un problema o error en la interfaz.',
    feature: 'El usuario está solicitando una nueva funcionalidad.',
    improvement: 'El usuario está sugiriendo una mejora a algo existente.',
  }[category];

  const contextInfo = [];
  if (uiContext.currentAgent) contextInfo.push(`Agente actual: ${uiContext.currentAgent}`);
  if (uiContext.currentChat) contextInfo.push(`Chat ID: ${uiContext.currentChat}`);
  if (uiContext.pageUrl) contextInfo.push(`Página: ${uiContext.pageUrl}`);

  return `Eres Stella, un asistente AI de análisis de feedback para SalfaGPT.

${categoryContext}

Analiza esta captura de pantalla que tiene ${annotationsCount} anotaciones del usuario (círculos, rectángulos, flechas, texto).

Contexto adicional:
${contextInfo.length > 0 ? contextInfo.join('\n') : 'Sin contexto adicional'}

Tu tarea:
1. Identifica QUÉ elementos de la UI están siendo señalados por las anotaciones
2. Infiere QUÉ problema/feature/mejora el usuario está indicando
3. Proporciona un resumen conciso (2-3 líneas máximo) de lo que observas

Responde SOLO con el análisis, sin introducción ni conclusión.`;
}

