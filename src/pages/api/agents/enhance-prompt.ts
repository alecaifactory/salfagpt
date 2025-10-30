/**
 * Enhance agent prompt using extracted document content
 * POST /api/agents/enhance-prompt
 * 
 * Analyzes document content and generates improved agent prompt
 * using prompt engineering best practices
 */
import type { APIRoute } from 'astro';
import { GoogleGenAI } from '@google/genai';

const genAI = new GoogleGenAI({ 
  apiKey: process.env.GOOGLE_AI_API_KEY!
});

const PROMPT_ENHANCER_SYSTEM_INSTRUCTION = `
Eres un experto en prompt engineering y diseño de agentes de IA conversacionales.

Tu tarea es analizar el contenido de un documento que describe un agente de IA y su propósito,
y generar un prompt mejorado que maximice la calidad de las respuestas del agente.

## Mejores Prácticas que DEBES Aplicar:

1. **Claridad de Propósito:**
   - Define claramente qué hace el agente y qué problemas resuelve
   - Especifica la audiencia objetivo
   - Incluye el contexto de uso

2. **Instrucciones Específicas:**
   - Instrucciones claras y accionables
   - Evita ambigüedades
   - Usa ejemplos concretos

3. **Tono y Estilo:**
   - Define el tono apropiado (formal, técnico, empático, etc.)
   - Especifica el nivel de detalle esperado
   - Establece el lenguaje y terminología

4. **Formato de Respuesta:**
   - Estructura clara (resumen, detalles, conclusión)
   - Uso de bullets, números, tablas cuando sea apropiado
   - Longitud y profundidad de respuestas

5. **Restricciones y Límites:**
   - Qué NO debe hacer el agente
   - Información a evitar o tratar con cuidado
   - Límites de scope

6. **Manejo de Casos Especiales:**
   - Qué hacer con preguntas ambiguas
   - Cómo manejar información faltante
   - Cuándo pedir aclaraciones

## Formato del Prompt Mejorado:

Estructura el prompt en secciones claras:

\`\`\`
[Identidad y Propósito]
Eres un [rol específico]...

[Audiencia y Contexto]
Tus usuarios son [descripción]...

[Comportamiento y Tono]
Siempre debes:
- [Comportamiento 1]
- [Comportamiento 2]
- [Comportamiento 3]

[Formato de Respuesta]
Estructura tus respuestas así:
1. [Elemento 1]
2. [Elemento 2]
3. [Elemento 3]

[Restricciones]
NO debes:
- [Restricción 1]
- [Restricción 2]

[Casos Especiales]
Si [situación], entonces [acción]...
\`\`\`

## Principios:

- Sé específico y concreto
- Usa ejemplos cuando ayude
- Balancea brevedad con completitud
- Prioriza claridad sobre elegancia
- Optimiza para resultados, no para impresionar

Genera SOLO el prompt mejorado, sin explicaciones adicionales.
`.trim();

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { agentId, agentName, currentPrompt, extractedContent } = body;

    if (!agentId || !extractedContent) {
      return new Response(
        JSON.stringify({ error: 'agentId and extractedContent are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('🎯 Enhancing prompt for agent:', agentName || agentId);
    console.log('📄 Extracted content length:', extractedContent.length);
    console.log('📝 Current prompt length:', currentPrompt?.length || 0);

    // Build analysis prompt
    const analysisPrompt = `
Analiza el siguiente documento que describe un agente de IA y genera un prompt mejorado.

## Documento Analizado:

\`\`\`
${extractedContent}
\`\`\`

## Prompt Actual del Agente:

\`\`\`
${currentPrompt || '(Sin prompt personalizado - usa información del documento para crear uno completo)'}
\`\`\`

## Tu Tarea:

Genera un prompt mejorado que:
1. Incorpore TODA la información relevante del documento
2. Siga las mejores prácticas de prompt engineering
3. Sea específico al propósito y audiencia descrita
4. Mantenga las buenas partes del prompt actual (si las hay)
5. Agregue claridad, estructura, y restricciones útiles

Genera SOLO el prompt mejorado (texto plano), sin explicaciones ni comentarios adicionales.
`.trim();

    // Generate enhanced prompt
    const result = await genAI.models.generateContent({
      model: 'gemini-2.5-pro', // Use Pro for better prompt engineering
      contents: analysisPrompt,
      config: {
        systemInstruction: PROMPT_ENHANCER_SYSTEM_INSTRUCTION,
        temperature: 0.7, // Balanced creativity
        maxOutputTokens: 4096,
      }
    });

    const enhancedPrompt = result.text || currentPrompt;

    console.log('✅ Enhanced prompt generated');
    console.log('📊 Length: Current =', currentPrompt?.length || 0, '→ Enhanced =', enhancedPrompt.length);

    return new Response(
      JSON.stringify({
        success: true,
        enhancedPrompt,
        metadata: {
          originalLength: currentPrompt?.length || 0,
          enhancedLength: enhancedPrompt.length,
          improvement: enhancedPrompt.length - (currentPrompt?.length || 0),
          modelUsed: 'gemini-2.5-pro',
          timestamp: new Date().toISOString(),
        }
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ Error enhancing prompt:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to enhance prompt',
        details: error.message 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

