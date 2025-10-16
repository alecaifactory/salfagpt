import type { APIRoute } from 'astro';
import { GoogleGenAI } from '@google/genai';

// Initialize Gemini with API key
const API_KEY = process.env.GOOGLE_AI_API_KEY || 
  (typeof import.meta !== 'undefined' && import.meta.env 
    ? import.meta.env.GOOGLE_AI_API_KEY 
    : undefined);

if (!API_KEY) {
  console.error('❌ GOOGLE_AI_API_KEY not configured');
}

const genAI = new GoogleGenAI({ 
  apiKey: API_KEY || '' 
});

export const POST: APIRoute = async ({ request }) => {
  try {
    console.log('📥 Received agent config extraction request');
    
    if (!API_KEY) {
      return new Response(
        JSON.stringify({ error: 'Gemini API key not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const agentId = formData.get('agentId') as string;
    
    if (!file) {
      return new Response(
        JSON.stringify({ error: 'No file provided' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('📄 Processing file:', file.name, file.type, file.size);

    // Read file content
    const fileBuffer = await file.arrayBuffer();
    const fileBase64 = Buffer.from(fileBuffer).toString('base64');
    
    console.log('🔄 File converted to base64, calling Gemini...');

    // Prepare extraction prompt - IMPROVED with explicit ARD field mapping
    const extractionPrompt = `Analiza este documento ARD (Agent Requirements Document) y extrae la configuración del agente.

═══════════════════════════════════════════════════════════
MAPEO EXPLÍCITO: CAMPOS DEL ARD → JSON
═══════════════════════════════════════════════════════════

DEL DOCUMENTO ARD, BUSCA Y EXTRAE:

1. "Nombre Sugerido del Asistente Virtual:" → agentName
2. "Objetivo y Descripción Breve del Asistente Virtual:" → agentPurpose
3. "Encargado del Proyecto:" → domainExpert.name
4. "Usuarios que participarán en el Piloto o Validación:" → pilotUsers[] (cada nombre en la lista)
5. "Usuarios Finales:" → targetAudience[] (cada nombre en la lista)
6. "Preguntas Tipo:" → expectedInputExamples[] (cada pregunta numerada)
7. "Respuestas Tipo:" → expectedOutputFormat + tone + citations
8. Tabla "Nombre del documento:" → requiredContextSources[] (si tiene filas)

═══════════════════════════════════════════════════════════
PROCESAMIENTO DE PREGUNTAS TIPO
═══════════════════════════════════════════════════════════

Cada pregunta en la lista "Preguntas Tipo:" debe convertirse así:

Input: "1. ¿Qué requisitos se necesitan para aprobar un permiso de edificios?"
Output JSON:
{
  "question": "¿Qué requisitos se necesitan para aprobar un permiso de edificios?",
  "category": "Permisos y Autorizaciones",
  "difficulty": "easy"
}

Categorización automática:
- Si menciona "permiso|autorización|aprobar" → "Permisos y Autorizaciones"
- Si menciona "loteo|subdivisión" → "Loteos y Subdivisiones"
- Si menciona "condominio" → "Condominios"
- Si menciona "conflicto|prevalece|contradice" → "Conflictos Normativos"
- Si menciona "procedimiento|trámite|documentos" → "Procedimientos"
- Si menciona "cálculo|densidad|altura|rasante" → "Cálculos Técnicos"
- Resto → "General"

Dificultad:
- "easy": Preguntas directas tipo "¿Qué es X?" o "¿Cuál es la diferencia entre X y Y?"
- "hard": Preguntas con múltiples condiciones o "¿Qué pasa si X pero Y?"
- "medium": Todo lo demás

═══════════════════════════════════════════════════════════
PROCESAMIENTO DE RESPUESTAS TIPO
═══════════════════════════════════════════════════════════

Del campo "Respuestas Tipo:", extrae:

Input: "Adaptativo, con referencias y fuentes. Técnico y especializado"
Output JSON:
{
  "expectedOutputFormat": "Adaptativo con referencias y fuentes",
  "tone": "Técnico y especializado",
  "responseRequirements": {
    "citations": true,
    "format": "Estructura con referencias",
    "precision": "exact"
  }
}

Si menciona "con referencias" o "con fuentes" → citations: true
Si menciona "técnico" → precision: "exact"
Si menciona "adaptativo" → format incluye "Adaptativo"

═══════════════════════════════════════════════════════════
AUTO-GENERACIÓN DE CAMPOS NO EXPLÍCITOS
═══════════════════════════════════════════════════════════

recommendedModel:
- Si dominio legal/médico/financiero O requiere citaciones → "gemini-2.5-pro"
- Si dominio general/simple → "gemini-2.5-flash"

systemPrompt (genera un prompt detallado):
Estructura: "Eres [rol basado en agentPurpose]. 

Cuando respondas:
- [Instrucciones según tone]
- [Requisito de citaciones si citations=true]
- [Formato estructurado si expectedOutputFormat lo indica]

Si no tienes información, indícalo claramente."

Ejemplo:
Si agentPurpose menciona "normativas de construcción" y tone es "técnico":
"Eres un asistente experto en normativas de construcción chilenas (LGUC, OGUC, DDU). 

Cuando respondas:
- Usa lenguaje técnico pero comprensible
- SIEMPRE cita artículos específicos (formato: LGUC Art. X, OGUC Art. Y)
- Estructura: respuesta directa → fundamento normativo → consideraciones → fuentes
- Si no encuentras información específica, indícalo claramente

Tu objetivo es proporcionar respuestas precisas con referencias verificables."

expectedInputTypes:
Auto-genera lista de categorías únicas de expectedInputExamples

═══════════════════════════════════════════════════════════
FORMATO DE SALIDA JSON
═══════════════════════════════════════════════════════════

Tu respuesta debe ser ÚNICAMENTE un objeto JSON válido:
- NO markdown (\`\`\`json)
- NO explicaciones
- SOLO { ... }

{
  "agentName": "Extraído del ARD",
  "agentPurpose": "Extraído del ARD - texto completo del objetivo",
  "targetAudience": ["Lista completa de usuarios finales del ARD"],
  "pilotUsers": ["Lista de usuarios del piloto/validación del ARD"],
  "recommendedModel": "gemini-2.5-flash" o "gemini-2.5-pro",
  "systemPrompt": "System prompt auto-generado según instrucciones arriba",
  "tone": "Extraído de Respuestas Tipo",
  "expectedInputTypes": ["Lista de categorías únicas"],
  "expectedInputExamples": [
    {
      "question": "Texto exacto de cada pregunta del ARD",
      "category": "Categoría auto-asignada",
      "difficulty": "easy|medium|hard"
    }
  ],
  "expectedOutputFormat": "Extraído de Respuestas Tipo",
  "responseRequirements": {
    "citations": true si menciona referencias/fuentes,
    "format": "Formato extraído",
    "precision": "exact" para técnico/legal, "approximate" para general
  },
  "requiredContextSources": ["Nombres de documentos si tabla tiene filas"],
  "domainExpert": {
    "name": "Encargado del Proyecto"
  }
}

VALIDACIÓN FINAL:
- agentName debe tener valor (no vacío)
- agentPurpose debe tener al menos 50 caracteres
- expectedInputExamples debe tener al menos 1 pregunta
- Si ARD tiene sección "Preguntas Tipo" con 10+ preguntas, TODAS deben aparecer en expectedInputExamples

Extrae y mapea cuidadosamente.`;

    // Call Gemini for extraction
    const result = await genAI.models.generateContent({
      model: 'gemini-2.5-pro', // Use Pro for complex extraction
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType: file.type,
                data: fileBase64
              }
            },
            {
              text: extractionPrompt
            }
          ]
        }
      ],
      config: {
        temperature: 0.2, // Low temperature for consistent extraction
        maxOutputTokens: 8192 // Increased to handle large documents
      }
    });

    const responseText = result.text || '';
    
    console.log('✅ Gemini response received, length:', responseText.length);
    console.log('📝 Full response:', responseText); // Log full response for debugging
    
    if (!responseText || responseText.length === 0) {
      throw new Error('Gemini returned empty response');
    }
    
    // Clean response - remove markdown code blocks and any explanatory text
    let cleanedResponse = responseText.trim();
    
    // Remove markdown code blocks
    cleanedResponse = cleanedResponse
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .replace(/^\s*json\s*/i, ''); // Remove "json" prefix
    
    // Remove any text before first { and after last }
    const firstBrace = cleanedResponse.indexOf('{');
    const lastBrace = cleanedResponse.lastIndexOf('}');
    
    console.log('🔍 First brace at position:', firstBrace);
    console.log('🔍 Last brace at position:', lastBrace);
    
    if (firstBrace === -1 || lastBrace === -1) {
      console.error('❌ No JSON object found in response');
      console.error('Response does not contain { or }');
      throw new Error('No JSON object found - Gemini may have returned explanatory text instead of JSON');
    }
    
    if (lastBrace <= firstBrace) {
      console.error('❌ Invalid JSON structure - closing brace before opening brace');
      throw new Error('Invalid JSON structure in Gemini response');
    }
    
    cleanedResponse = cleanedResponse.substring(firstBrace, lastBrace + 1);
    
    console.log('🧹 Extracted JSON length:', cleanedResponse.length);
    console.log('🧹 JSON preview (first 500):', cleanedResponse.substring(0, 500));
    
    // Validate we have something that looks like JSON
    const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('❌ Regex match failed after cleaning');
      throw new Error('Failed to extract JSON after cleaning');
    }

    console.log('🔍 JSON extracted, parsing...');
    let extractedConfig;
    try {
      extractedConfig = JSON.parse(jsonMatch[0]);
    } catch (parseError: any) {
      console.error('❌ JSON parse error:', parseError.message);
      console.error('JSON string preview:', jsonMatch[0].substring(0, 500));
      console.error('JSON string end:', jsonMatch[0].substring(Math.max(0, jsonMatch[0].length - 500)));
      
      // Try to fix common JSON issues more aggressively
      let fixedJson = jsonMatch[0]
        .replace(/,\s*}/g, '}')     // Remove trailing commas before }
        .replace(/,\s*]/g, ']')     // Remove trailing commas before ]
        .replace(/,(\s*[}\]])/g, '$1') // More aggressive trailing comma removal
        .replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2":') // Fix unquoted keys
        .replace(/:\s*'([^']*)'/g, ':"$1"') // Fix single quotes to double quotes
        .replace(/\n/g, ' ')        // Remove newlines
        .replace(/\t/g, ' ')        // Remove tabs
        .replace(/\s+/g, ' ')       // Normalize whitespace
        .replace(/\s*([{}\[\],:])\s*/g, '$1'); // Remove whitespace around structural chars
      
      try {
        extractedConfig = JSON.parse(fixedJson);
        console.log('✅ JSON fixed and parsed successfully');
      } catch (secondError: any) {
        console.error('❌ Second parse attempt failed:', secondError.message);
        console.error('Fixed JSON preview:', fixedJson.substring(0, 500));
        
        // Final attempt: Ask Gemini to fix the JSON
        console.log('🔄 Asking Gemini to fix malformed JSON...');
        const fixPrompt = `The following JSON is malformed. Fix it and return ONLY valid JSON:

${jsonMatch[0]}

Return ONLY the fixed JSON object, no explanation, no markdown.`;

        const fixResult = await genAI.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: fixPrompt,
          config: {
            temperature: 0,
            maxOutputTokens: 8192
          }
        });

        const fixedResponse = (fixResult.text || '').trim();
        const fixedJsonMatch = fixedResponse.match(/\{[\s\S]*\}/);
        
        if (fixedJsonMatch) {
          extractedConfig = JSON.parse(fixedJsonMatch[0]);
          console.log('✅ Gemini fixed the JSON successfully');
        } else {
          throw new Error(`JSON parsing failed after all attempts: ${parseError.message}`);
        }
      }
    }
    
    console.log('✅ Configuration extracted successfully');
    console.log('Agent name:', extractedConfig.agentName);
    console.log('🔍 [DEBUG] extractedConfig keys:', Object.keys(extractedConfig));
    console.log('🔍 [DEBUG] expectedInputExamples:', extractedConfig.expectedInputExamples);
    console.log('🔍 [DEBUG] expectedInputExamples length:', extractedConfig.expectedInputExamples?.length);
    console.log('🔍 [DEBUG] expectedOutputExamples:', extractedConfig.expectedOutputExamples);
    console.log('🔍 [DEBUG] Full config:', JSON.stringify(extractedConfig, null, 2).substring(0, 1000));
    
    // Save to Firestore agent_setup_docs for evaluation system
    if (agentId) {
      try {
        console.log('💾 [SAVE] Starting Firestore save for agent:', agentId);
        
        const { firestore } = await import('../../../lib/firestore');
        
        // Map input examples - handle different possible structures
        const inputExamples = extractedConfig.expectedInputExamples?.map((ex: any) => ({
          question: ex.question || ex.example || ex.input || '',
          category: ex.category || 'General'
        })) || [];
        
        console.log('💾 [SAVE] Mapped inputExamples:', inputExamples);
        console.log('💾 [SAVE] inputExamples count:', inputExamples.length);
        
        const setupDocData = {
          agentId,
          fileName: file.name,
          uploadedAt: new Date(),
          uploadedBy: 'system', // TODO: Get from session
          
          // Core fields from extraction
          agentName: extractedConfig.agentName || file.name,
          agentPurpose: extractedConfig.agentPurpose || '',
          setupInstructions: extractedConfig.systemPrompt || '',
          
          // NEW: User fields
          targetAudience: extractedConfig.targetAudience || [],
          pilotUsers: extractedConfig.pilotUsers || [],
          
          // NEW: Behavior fields
          tone: extractedConfig.tone || '',
          recommendedModel: extractedConfig.recommendedModel || 'gemini-2.5-flash',
          expectedOutputFormat: extractedConfig.expectedOutputFormat || '',
          
          // Input/Output examples
          inputExamples,
          expectedInputTypes: extractedConfig.expectedInputTypes || [],
          correctOutputs: extractedConfig.expectedOutputExamples?.map((ex: any) => ({
            example: ex.example || '',
            criteria: ex.successCriteria || 'Apropiada según configuración'
          })) || [],
          incorrectOutputs: extractedConfig.undesirableOutputs?.map((ex: any) => ({
            example: ex.example || '',
            reason: ex.reason || ''
          })) || [],
          
          // Response requirements
          responseRequirements: extractedConfig.responseRequirements || {},
          
          // Context sources
          requiredContextSources: extractedConfig.requiredContextSources || [],
          
          // Domain expert
          domainExpert: extractedConfig.domainExpert || {
            name: 'Unknown',
            email: 'Unknown',
            department: 'Unknown'
          },
          
          // Optional/legacy fields (preserve if exist)
          businessCase: extractedConfig.businessCase,
          qualityCriteria: extractedConfig.qualityCriteria,
          undesirableOutputs: extractedConfig.undesirableOutputs,
          acceptanceCriteria: extractedConfig.acceptanceCriteria
        };
        
        console.log('💾 [SAVE] Final setupDocData.inputExamples:', setupDocData.inputExamples);
        console.log('💾 [SAVE] Final setupDocData.inputExamples.length:', setupDocData.inputExamples.length);
        
        console.log('💾 [SAVE] Data prepared, counts:', {
          inputExamples: setupDocData.inputExamples.length,
          correctOutputs: setupDocData.correctOutputs.length,
          purpose: setupDocData.agentPurpose.substring(0, 50),
          targetAudience: setupDocData.targetAudience.length,
          pilotUsers: setupDocData.pilotUsers.length,
          tone: setupDocData.tone || 'N/A',
          model: setupDocData.recommendedModel
        });
        
        console.log('💾 [SAVE] NEW FIELDS:');
        console.log('  - targetAudience:', setupDocData.targetAudience);
        console.log('  - pilotUsers:', setupDocData.pilotUsers);
        console.log('  - tone:', setupDocData.tone);
        console.log('  - recommendedModel:', setupDocData.recommendedModel);
        console.log('  - domainExpert.name:', setupDocData.domainExpert?.name);
        
        console.log('💾 [SAVE] Calling Firestore set() for collection agent_setup_docs, doc:', agentId);
        
        await firestore
          .collection('agent_setup_docs')
          .doc(agentId)
          .set(setupDocData);
        
        console.log('✅ [SAVE] Firestore set() completed successfully');
        console.log('✅ [SAVE] Setup document saved for agent:', agentId);
        console.log('✅ [SAVE] Document path: agent_setup_docs/' + agentId);
      } catch (firestoreError) {
        console.error('❌ [SAVE] Failed to save setup doc:', firestoreError);
        console.error('❌ [SAVE] Error details:', firestoreError instanceof Error ? firestoreError.message : 'Unknown');
        console.error('❌ [SAVE] Error stack:', firestoreError instanceof Error ? firestoreError.stack : 'N/A');
        // Continue - extraction succeeded even if save failed
      }
    } else {
      console.log('⚠️ [SAVE] No agentId provided, skipping Firestore save');
    }
    
    // Return extracted configuration
    return new Response(
      JSON.stringify({
        success: true,
        config: extractedConfig,
        metadata: {
          fileName: file.name,
          fileSize: file.size,
          extractionModel: 'gemini-2.5-pro',
          extractedAt: new Date().toISOString()
        }
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('❌ Error extracting agent config:', error);
    console.error('Error stack:', error.stack);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to extract configuration',
        details: error.message,
        hint: 'Check server logs for more details'
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};

