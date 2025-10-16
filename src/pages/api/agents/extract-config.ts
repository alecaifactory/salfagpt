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

    // Prepare extraction prompt
    const extractionPrompt = `Analiza este documento de requerimientos para un agente AI y extrae la siguiente información.

IMPORTANTE: Devuelve SOLO un objeto JSON válido, sin texto adicional antes o después. No uses markdown. Solo JSON puro.

Formato requerido:

{
  "agentName": "Nombre del agente",
  "agentPurpose": "Propósito y objetivo principal",
  "targetAudience": ["Usuario 1", "Usuario 2"],
  "businessCase": {
    "painPoint": "Problema que resuelve",
    "affectedPersonas": ["Personas afectadas con cantidad si se menciona"],
    "businessArea": "Área de negocio",
    "businessImpact": {
      "quantitative": {
        "usersAffected": número,
        "frequency": "Frecuencia de uso",
        "timeSavingsPerQuery": "Tiempo ahorrado por consulta",
        "estimatedAnnualValue": "Valor anual estimado"
      },
      "qualitative": {
        "description": "Descripción de beneficios",
        "benefitAreas": ["Áreas de beneficio"],
        "risksMitigated": ["Riesgos mitigados"]
      }
    }
  },
  "recommendedModel": "gemini-2.5-flash" o "gemini-2.5-pro",
  "systemPrompt": "System prompt generado basado en el propósito",
  "tone": "Tono de las respuestas",
  "expectedInputTypes": ["Tipos de preguntas esperadas"],
  "expectedOutputFormat": "Formato de respuesta esperado",
  "responseRequirements": {
    "format": "Formato preferido",
    "length": { "min": número, "max": número, "target": número },
    "precision": "exact" o "approximate",
    "speed": { "target": segundos, "maximum": segundos },
    "mustInclude": ["Elementos que debe incluir"],
    "mustAvoid": ["Elementos que debe evitar"],
    "citations": true/false
  },
  "qualityCriteria": [
    {
      "criterion": "Nombre del criterio",
      "weight": 0.0-1.0,
      "description": "Descripción"
    }
  ],
  "undesirableOutputs": [
    {
      "example": "Ejemplo de respuesta mala",
      "reason": "Por qué es mala",
      "howToAvoid": "Cómo evitarla"
    }
  ],
  "acceptanceCriteria": [
    {
      "criterion": "Criterio",
      "description": "Descripción",
      "isRequired": true/false,
      "testable": true/false,
      "howToTest": "Cómo probarlo"
    }
  ]
}

Extrae TODA la información disponible del documento. Si algo no está explícito, infiere basado en el contexto del dominio.`;

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
        maxOutputTokens: 4096
      }
    });

    const responseText = result.text || '';
    
    console.log('✅ Gemini response received, length:', responseText.length);
    console.log('📝 Response preview:', responseText.substring(0, 200));
    
    // Clean response - remove markdown code blocks if present
    let cleanedResponse = responseText.trim();
    if (cleanedResponse.startsWith('```json')) {
      cleanedResponse = cleanedResponse.replace(/```json\n?/, '').replace(/```\s*$/, '');
    } else if (cleanedResponse.startsWith('```')) {
      cleanedResponse = cleanedResponse.replace(/```\n?/, '').replace(/```\s*$/, '');
    }
    
    console.log('🧹 Cleaned response preview:', cleanedResponse.substring(0, 200));
    
    // Extract JSON from response
    const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('❌ No JSON found in Gemini response');
      console.error('Full response:', cleanedResponse.substring(0, 1000));
      throw new Error('No JSON found in Gemini response');
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

