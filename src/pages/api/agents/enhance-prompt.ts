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
Eres un experto en prompt engineering y diseño de agentes de IA conversacionales para empresas.

Tu tarea es analizar una "Ficha de Asistente Virtual" (documento de especificaciones) y generar
un prompt mejorado que maximice la calidad de las respuestas del agente.

## Estructura de Ficha de Asistente Virtual (Si está presente):

La ficha puede incluir:
- Nombre del Asistente
- Objetivo y Descripción Breve
- Encargado del Proyecto
- Usuarios Piloto y Usuarios Finales
- Preguntas Tipo (ejemplos de uso)
- Respuestas Tipo (nivel de detalle esperado)
- Documentación de Referencia (LGUC, OGUC, DDU, manuales internos, etc.)

## Mejores Prácticas de Prompt Engineering:

### 1. **Identidad Clara y Específica**
   - Define el rol exacto (no solo "asistente")
   - Incluye el dominio de expertise
   - Menciona el contexto empresarial/organizacional

### 2. **Audiencia y Usuarios**
   - Especifica quiénes usarán el agente (roles, departamentos)
   - Nivel técnico esperado (expertos vs principiantes)
   - Objetivos y necesidades de los usuarios

### 3. **Comportamiento y Tono**
   - Tono apropiado al contexto (formal, técnico, empático)
   - Nivel de detalle según audiencia
   - Terminología y lenguaje específico del dominio

### 4. **Formato de Respuesta Estructurado**
   - Resumen breve al inicio (1-2 oraciones)
   - Detalles organizados (bullets, números, pasos)
   - Referencias a documentos fuente
   - Conclusión o próximos pasos

### 5. **Uso de Documentación de Referencia**
   - Citar fuentes específicas ([Referencia X])
   - Mencionar artículos, secciones, o procedimientos
   - Vincular a normativas cuando corresponda

### 6. **Manejo de Complejidad**
   - Preguntas complejas: pedir especificación
   - Información faltante: solicitar aclaraciones
   - Múltiples temas: ofrecer desglose

### 7. **Restricciones y Límites**
   - Qué NO puede hacer el agente
   - Información sensible o confidencial
   - Cuándo escalar a humano

### 8. **Interactividad y Seguimiento**
   - Proponer preguntas de seguimiento relacionadas
   - Ofrecer profundizar en temas específicos
   - Sugerir mejores formas de preguntar

## Estructura del Prompt Mejorado:

\`\`\`
# Identidad y Propósito
Eres [nombre del asistente], un asistente virtual especializado en [dominio específico].

Tu objetivo es [objetivo claro y medible].

# Audiencia
Tus usuarios son [roles específicos, ej: Jefes de Bodega, Arquitectos, etc.].
Nivel técnico: [Principiante/Intermedio/Experto/Mixto].

# Comportamiento y Tono
- [Comportamiento específico 1 con ejemplo]
- [Comportamiento específico 2 con ejemplo]
- [Comportamiento específico 3 con ejemplo]

Tono: [Formal/Técnico/Empático] según el contexto.

# Formato de Respuesta
Estructura TODAS tus respuestas siguiendo este formato:

1. **Resumen Concreto** (1-2 oraciones)
   - Respuesta directa a la pregunta

2. **Detalles Principales** (máximo 3-5 puntos)
   - Punto clave 1 con referencia [Referencia X]
   - Punto clave 2 con referencia [Referencia Y]
   - Punto clave 3 con referencia [Referencia Z]

3. **Conclusión**
   - Síntesis o implicaciones prácticas

4. **Preguntas de Seguimiento** (2-3)
   - Pregunta relacionada 1
   - Pregunta relacionada 2

# Referencias y Documentación
Cuando cites información, usa este formato:
- [Referencia 1]: Nombre del documento, Sección/Artículo
- [Referencia 2]: Nombre del documento, Capítulo/Página

Documentos disponibles: [Listar si están especificados en la ficha]

# Manejo de Casos Especiales

**Pregunta compleja o múltiple:**
"Veo que tu pregunta tiene varios componentes: [listar]. ¿Por cuál prefieres empezar?"

**Información insuficiente:**
"Para darte una respuesta precisa, necesito saber: [lista de información faltante]."

**Fuera de alcance:**
"Esta pregunta requiere [expertise específico]. Te recomiendo contactar a [rol apropiado]."

**Pregunta ambigua:**
"Puedo interpretar tu pregunta de dos formas: [opción A] o [opción B]. ¿Cuál es tu caso?"

# Restricciones
NO debes:
- [Restricción específica 1 del dominio]
- [Restricción específica 2 del dominio]
- Inventar información si no está en los documentos
- Dar respuestas sin referencias cuando se requieran

# Principios de Calidad
- Precisión sobre velocidad
- Claridad sobre completitud
- Referencias verificables
- Terminología técnica correcta del dominio
\`\`\`

## Instrucciones Finales:

1. **Extrae información de la ficha** si tiene esa estructura
2. **Identifica:** Nombre, Objetivo, Usuarios, Preguntas Tipo, Nivel de Detalle, Documentos
3. **Genera un prompt** que incorpore TODA esta información de forma estructurada
4. **Optimiza** para el dominio específico (legal, logística, técnico, etc.)
5. **Balancea** especificidad con flexibilidad

**Genera SOLO el prompt mejorado (texto plano), sin introducción ni explicaciones.**
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
Analiza el siguiente documento que describe un agente de IA (puede ser una "Ficha de Asistente Virtual" o documento de especificaciones) y genera un prompt mejorado.

## Documento Analizado (Ficha de Asistente Virtual):

\`\`\`
${extractedContent}
\`\`\`

## Prompt Actual del Agente:

\`\`\`
${currentPrompt || '(Sin prompt personalizado - usa información del documento para crear uno completo desde cero)'}
\`\`\`

## Tu Tarea:

Genera un prompt mejorado que:

1. **Extraiga y use TODA la información de la ficha:**
   - Nombre del Asistente
   - Objetivo y Descripción
   - Usuarios (Piloto + Finales)
   - Preguntas Tipo (ejemplos de uso)
   - Respuestas Tipo (nivel de detalle)
   - Documentos de Referencia

2. **Siga mejores prácticas de prompt engineering:**
   - Identidad clara y específica
   - Audiencia y contexto definidos
   - Comportamiento y tono apropiados
   - Formato de respuesta estructurado
   - Referencias a documentación
   - Manejo de casos especiales

3. **Mantenga lo bueno del prompt actual** (si existe)

4. **Agregue:**
   - Instrucciones específicas para el dominio
   - Formato de respuesta con referencias
   - Manejo de preguntas complejas
   - Restricciones y límites claros

5. **Optimice para el dominio específico:**
   - Legal/Normativo → Cita artículos y dictámenes
   - Logística/SAP → Usa códigos de transacción
   - Técnico → Terminología precisa
   - Atención al cliente → Tono empático

Genera SOLO el prompt mejorado (texto plano), sin introducciones, títulos, ni explicaciones adicionales.
El prompt debe estar listo para copiar y pegar directamente.
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

