import type { APIRoute } from 'astro';
import { GoogleGenAI } from '@google/genai';

const genAI = new GoogleGenAI({ 
  apiKey: process.env.GOOGLE_AI_API_KEY || '' 
});

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const agentId = formData.get('agentId') as string;
    
    if (!file) {
      return new Response(
        JSON.stringify({ error: 'No file provided' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Read file content
    const fileBuffer = await file.arrayBuffer();
    const fileBase64 = Buffer.from(fileBuffer).toString('base64');

    // Prepare extraction prompt
    const extractionPrompt = `Analiza este documento de requerimientos para un agente AI y extrae la siguiente información en formato JSON:

{
  "agentName": "Nombre del agente",
  "agentPurpose": "Propósito y objetivo principal",
  "targetAudience": ["Lista de usuarios objetivo"],
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
    
    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const extractedConfig = JSON.parse(jsonMatch[0]);
    
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
    console.error('Error extracting agent config:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to extract configuration',
        details: error.message 
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};

