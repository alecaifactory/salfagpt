/**
 * Gemini AI Integration using @google/genai v1.23.0
 * 
 * ✅ CORRECT: Uses GoogleGenAI (not GoogleGenerativeAI)
 * ✅ CORRECT: Uses genAI.models.generateContent()
 * ✅ CORRECT: Passes model selection from user config
 */
import { GoogleGenAI } from '@google/genai';
import type { MessageContent, ContextSection } from './firestore';

// Initialize Gemini AI client
// Prioritize process.env for Cloud Run
const API_KEY = process.env.GOOGLE_AI_API_KEY || 
  (typeof import.meta !== 'undefined' && import.meta.env 
    ? (import.meta.env.GOOGLE_AI_API_KEY || import.meta.env.GEMINI_API_KEY)
    : undefined);

if (!API_KEY) {
  throw new Error('GOOGLE_AI_API_KEY or GEMINI_API_KEY not configured. Please set one in your .env file.');
}

const genAI = new GoogleGenAI({ apiKey: API_KEY });

// Model configuration
const MODEL_NAME = 'gemini-2.5-pro-latest';
const CONTEXT_WINDOW = 1000000; // 1M tokens

export interface GenerateOptions {
  model?: 'gemini-2.5-pro' | 'gemini-2.5-flash'; // User-selected model
  systemInstruction?: string;
  conversationHistory?: Array<{ role: string; content: string }>;
  userContext?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface SourceReference {
  id: number;
  sourceId: string;
  sourceName: string;
  snippet: string;
  fullText?: string; // Full chunk text for detailed view
  chunkIndex?: number; // Which chunk from the source (-1 = full document, >=0 = specific chunk)
  similarity?: number; // Similarity score (0-1) for RAG
  context?: {
    before?: string;
    after?: string;
  };
  location?: {
    page?: number;
    section?: string;
  };
  metadata?: {
    startChar?: number;
    endChar?: number;
    tokenCount?: number;
    startPage?: number;
    endPage?: number;
    isRAGChunk?: boolean; // NEW: Whether this is a RAG chunk (vs full document)
    isFullDocument?: boolean; // NEW: Whether this is the full document
  };
}

export interface GenerateResponse {
  content: MessageContent;
  tokenCount: number;
  contextSections: ContextSection[];
  references?: SourceReference[];
}

// Token counting helper (approximate)
function estimateTokenCount(text: string): number {
  // Rough estimate: ~4 characters per token
  return Math.ceil(text.length / 4);
}

// Generate AI response with Gemini (using correct @google/genai v1.23.0 API)
export async function generateAIResponse(
  userMessage: string,
  options: GenerateOptions = {}
): Promise<GenerateResponse> {
  const {
    model = 'gemini-2.5-flash', // Default to flash for speed
    systemInstruction = 'You are a helpful AI assistant.',
    conversationHistory = [],
    userContext = '',
    temperature = 0.7,
    maxTokens = 8192,
  } = options;

  try {
    // Build conversation contents array
    const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

    // Add conversation history
    conversationHistory.forEach(msg => {
      contents.push({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      });
    });

    // Add user context if provided
    let fullUserMessage = userMessage;
    let enhancedSystemInstruction = systemInstruction;
    
    if (userContext) {
      fullUserMessage = `Context:\n${userContext}\n\nUser Message:\n${userMessage}`;
      
      // Enhance system instruction to include references
      enhancedSystemInstruction = `${systemInstruction}

IMPORTANTE: Cuando uses información de los documentos de contexto:
1. Incluye referencias numeradas inline usando el formato [1], [2], etc.
2. Al final de tu respuesta, incluye una sección "REFERENCIAS:" con el formato JSON:

REFERENCIAS:
\`\`\`json
{
  "references": [
    {
      "id": 1,
      "snippet": "texto exacto usado del documento",
      "context": {
        "before": "texto anterior para dar contexto (opcional)",
        "after": "texto posterior para dar contexto (opcional)"
      }
    }
  ]
}
\`\`\`

Ejemplo de respuesta con referencias:
"Las construcciones en subterráneo deben cumplir con distanciamientos[1]. La DDU 189 establece zonas inexcavables[2]."

REFERENCIAS:
\`\`\`json
{
  "references": [
    {
      "id": 1,
      "snippet": "las construcciones en subterráneo deben cumplir con las disposiciones sobre distanciamientos",
      "context": {
        "before": "establece que",
        "after": "o zonas inexcavables que hayan sido establecidas"
      }
    },
    {
      "id": 2,
      "snippet": "las zonas inexcavables están clarificadas en el artículo 2.6.3 de la OGUC"
    }
  ]
}
\`\`\``;
    }

    // Add current user message
    contents.push({
      role: 'user',
      parts: [{ text: fullUserMessage }],
    });

    // ✅ CORRECT API: genAI.models.generateContent()
    const result = await genAI.models.generateContent({
      model: model, // Use user-selected model
      contents: contents,
      config: {
        systemInstruction: enhancedSystemInstruction,
        temperature: temperature,
        maxOutputTokens: maxTokens,
      }
    });

    const responseText = result.text || '';

    // Parse references from response
    const { cleanText, references } = parseReferencesFromResponse(responseText);

    // Parse response for different content types
    const content = parseResponseContent(cleanText);
    
    // NEW: Use ACTUAL token counts from Gemini API if available
    const usageMetadata = (result as any).usageMetadata;
    
    let systemTokens, historyTokens, contextTokens, userTokens, responseTokens;
    
    if (usageMetadata && usageMetadata.promptTokenCount && usageMetadata.candidatesTokenCount) {
      // Use REAL token counts from API
      responseTokens = usageMetadata.candidatesTokenCount;
      const totalPromptTokens = usageMetadata.promptTokenCount;
      
      // Distribute prompt tokens proportionally (estimate)
      systemTokens = estimateTokenCount(systemInstruction);
      historyTokens = conversationHistory.reduce(
        (sum, msg) => sum + estimateTokenCount(msg.content),
        0
      );
      contextTokens = estimateTokenCount(userContext);
      userTokens = estimateTokenCount(userMessage);
      
      console.log(`📊 Real token counts from API: prompt=${totalPromptTokens}, response=${responseTokens}`);
    } else {
      // Fallback to estimation
      systemTokens = estimateTokenCount(systemInstruction);
      historyTokens = conversationHistory.reduce(
        (sum, msg) => sum + estimateTokenCount(msg.content),
        0
      );
      contextTokens = estimateTokenCount(userContext);
      userTokens = estimateTokenCount(userMessage);
      responseTokens = estimateTokenCount(responseText);
      
      console.log('⚠️ Using estimated token counts (no usageMetadata from API)');
    }

    // Build context sections for display
    const contextSections: ContextSection[] = [
      {
        name: 'System Instructions',
        tokenCount: systemTokens,
        content: systemInstruction,
        collapsed: true,
      },
      {
        name: 'Conversation History',
        tokenCount: historyTokens,
        content: `${conversationHistory.length} messages`,
        collapsed: false,
      },
      {
        name: 'User Context',
        tokenCount: contextTokens,
        content: userContext || 'No additional context',
        collapsed: true,
      },
      {
        name: 'Current User Message',
        tokenCount: userTokens,
        content: userMessage,
        collapsed: true,
      },
      {
        name: 'Model Response',
        tokenCount: responseTokens,
        content: responseText,
        collapsed: true,
      },
    ];

    return {
      content,
      tokenCount: responseTokens,
      contextSections,
      references: references.length > 0 ? references : undefined,
    };
  } catch (error) {
    console.error('Error generating AI response:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to generate AI response: ${errorMessage}`);
  }
}

// Parse references from AI response
function parseReferencesFromResponse(responseText: string): { 
  cleanText: string; 
  references: SourceReference[] 
} {
  // Look for REFERENCIAS: section
  const referencesMatch = responseText.match(/REFERENCIAS:\s*```json\s*([\s\S]*?)```/i);
  
  if (!referencesMatch) {
    // No references found, return original text
    return { cleanText: responseText, references: [] };
  }

  try {
    const referencesJson = referencesMatch[1];
    const parsed = JSON.parse(referencesJson);
    
    // Remove REFERENCIAS section from text
    const cleanText = responseText.replace(/REFERENCIAS:\s*```json\s*[\s\S]*?```/i, '').trim();
    
    // Map references to include source metadata (will be enhanced later)
    const references: SourceReference[] = (parsed.references || []).map((ref: any) => ({
      id: ref.id,
      sourceId: '', // Will be filled from context sources
      sourceName: '', // Will be filled from context sources
      snippet: ref.snippet,
      context: ref.context,
      location: ref.location,
    }));
    
    return { cleanText, references };
  } catch (error) {
    console.error('Failed to parse references:', error);
    // On parse error, return original text without references
    return { cleanText: responseText, references: [] };
  }
}

// Parse response content to detect different types (text, code, etc.)
function parseResponseContent(responseText: string): MessageContent {
  // Check for code blocks
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  const codeMatches = Array.from(responseText.matchAll(codeBlockRegex));

  if (codeMatches.length > 0) {
    // Contains code - create mixed content
    const parts: Array<{ type: string; content: string | object }> = [];
    let lastIndex = 0;

    codeMatches.forEach(match => {
      const [fullMatch, language, code] = match;
      const matchIndex = match.index!;

      // Add text before code block
      if (matchIndex > lastIndex) {
        const textBefore = responseText.slice(lastIndex, matchIndex).trim();
        if (textBefore) {
          parts.push({ type: 'text', content: textBefore });
        }
      }

      // Add code block
      parts.push({
        type: 'code',
        content: {
          language: language || 'plaintext',
          code: code.trim(),
        },
      });

      lastIndex = matchIndex + fullMatch.length;
    });

    // Add remaining text after last code block
    if (lastIndex < responseText.length) {
      const textAfter = responseText.slice(lastIndex).trim();
      if (textAfter) {
        parts.push({ type: 'text', content: textAfter });
      }
    }

    return {
      type: 'mixed',
      parts,
    };
  }

  // Plain text response
  return {
    type: 'text',
    text: responseText,
  };
}

// Stream AI response (for real-time streaming)
export async function* streamAIResponse(
  userMessage: string,
  options: GenerateOptions = {}
): AsyncGenerator<string, void, unknown> {
  const {
    model = 'gemini-2.5-flash',
    systemInstruction = 'You are a helpful AI assistant.',
    conversationHistory = [],
    userContext = '',
    temperature = 0.7,
    maxTokens = 8192,
  } = options;

  try {
    // Build conversation contents array
    const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

    // Add conversation history
    conversationHistory.forEach(msg => {
      contents.push({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      });
    });

    // Add user context if provided
    let fullUserMessage = userMessage;
    let enhancedSystemInstruction = systemInstruction;
    
    if (userContext) {
      // Detectar si el contexto contiene chunks RAG numerados
      const isRAGContext = userContext.includes('[Fragmento ') || userContext.includes('Relevancia:');
      
      if (isRAGContext) {
        // Modo RAG: Extraer números de fragmentos del contexto
        const fragmentMatches = userContext.match(/\[Fragmento (\d+),/g) || [];
        const fragmentNumbers = fragmentMatches.map(m => {
          const match = m.match(/\[Fragmento (\d+),/);
          return match ? match[1] : null;
        }).filter(Boolean);
        
        fullUserMessage = `FRAGMENTOS RELEVANTES DEL CONTEXTO (ordenados por relevancia):
${userContext}

───────────────────────────────────
PREGUNTA DEL USUARIO:
${userMessage}`;

        enhancedSystemInstruction = `${systemInstruction}

🔍 MODO RAG ACTIVADO - INSTRUCCIONES CRÍTICAS:

⚠️ ATENCIÓN: Los fragmentos se consolidan por documento.
- Fragmentos recibidos: ${fragmentNumbers.length}
- Estos se agruparán en ~${Math.ceil(fragmentNumbers.length / 2)}-${Math.ceil(fragmentNumbers.length / 3)} referencias finales por documento único
- En tu lista de referencias, SOLO incluye los documentos únicos (NO repitas el mismo documento)

🚨 REGLA ABSOLUTA - NUMERACIÓN:
- Usa SOLO los números que aparecen en la sección "### Referencias" al final
- ❌ PROHIBIDO usar [${fragmentNumbers.length + 1}], [${fragmentNumbers.length + 2}], o números mayores
- ❌ PROHIBIDO inventar referencias que no existen
- ✅ Si un fragmento no contiene la información, di claramente que no está disponible

INSTRUCCIONES OBLIGATORIAS:
1. ✅ Cita usando [N] INMEDIATAMENTE después del dato específico
2. ✅ Si un dato viene de múltiples fragmentos del MISMO documento, usa una sola cita
3. ✅ Cada afirmación factual DEBE tener su referencia
4. ❌ NO inventes información
5. ❌ NO uses números inexistentes

EJEMPLO CORRECTO (3 documentos únicos de 10 fragmentos):
"La gestión del combustible requiere control diario[1]. El informe se genera en SAP 
con la transacción ZMM_IE[2]. Este proceso es responsabilidad de JBOD[3]."

### Referencias
[1] Fragmento de Gestión Combustible Rev.05.pdf (similitud: 80%)
[2] Fragmento de Imprimir Resumen Petróleo Rev.02.pdf (similitud: 79%)
[3] Fragmento de Reporte Seguimiento ST.pdf (similitud: 76%)

❌ EJEMPLO INCORRECTO:
"... según procedimiento [4]" donde [4] no existe en Referencias.

FORMATO OBLIGATORIO para sección Referencias:
- Una línea por documento ÚNICO
- NO repitas el mismo nombre de documento
- Usa solo números consecutivos 1, 2, 3, ... (SIN SALTOS)
- NO agregues fragmentos extra después del último documento único

NÚMEROS VÁLIDOS: Los que aparecen en tu sección "### Referencias" (típicamente ${Math.ceil(fragmentNumbers.length / 3)}-${Math.ceil(fragmentNumbers.length / 2)} documentos únicos)`;
      } else {
        // Modo Full-Text (documento completo)
        fullUserMessage = `DOCUMENTO COMPLETO:
${userContext}

───────────────────────────────────
PREGUNTA DEL USUARIO:
${userMessage}`;
        
        enhancedSystemInstruction = `${systemInstruction}

📝 MODO FULL-TEXT ACTIVADO:

Tienes acceso al documento completo. Puedes usar cualquier parte del documento para responder.

RECOMENDADO (pero no obligatorio):
- Menciona el documento cuando sea útil: "Según el documento..."
- Cita secciones específicas si es relevante
`;
      }
    }

    // Add current user message
    contents.push({
      role: 'user',
      parts: [{ text: fullUserMessage }],
    });

    // ✅ CORRECT API: genAI.models.generateContentStream()
    const stream = await genAI.models.generateContentStream({
      model: model,
      contents: contents,
      config: {
        systemInstruction: enhancedSystemInstruction,
        temperature: temperature,
        maxOutputTokens: maxTokens,
      }
    });

    for await (const chunk of stream) {
      if (chunk.text) {
        yield chunk.text;
      }
    }
  } catch (error) {
    console.error('Error streaming AI response:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to stream AI response: ${errorMessage}`);
  }
}

// Generate title for conversation based on first message
export async function generateConversationTitle(firstMessage: string): Promise<string> {
  try {
    // ✅ CORRECT API: genAI.models.generateContent()
    const result = await genAI.models.generateContent({
      model: 'gemini-2.5-flash', // Use flash for speed
      contents: [{ role: 'user', parts: [{ text: firstMessage }] }],
      config: {
        systemInstruction: 'Generate a short, descriptive title (3-6 words) for a conversation based on the first message. Only return the title, nothing else.',
        temperature: 0.7,
        maxOutputTokens: 20,
      }
    });

    const title = (result.text || 'New Conversation').trim().replace(/^["']|["']$/g, '');
    
    return title.length > 60 ? title.slice(0, 60) + '...' : title;
  } catch (error) {
    console.error('Error generating title:', error);
    return 'New Conversation';
  }
}

// Analyze image using Gemini's multimodal capabilities
export async function analyzeImage(
  imageData: string, // Base64 or URL
  prompt: string = 'Describe this image in detail.'
): Promise<MessageContent> {
  try {
    // ✅ CORRECT API: genAI.models.generateContent() with multimodal input
    const result = await genAI.models.generateContent({
      model: 'gemini-2.5-flash', // Flash supports vision
      contents: [{
        role: 'user',
        parts: [
          { text: prompt },
          {
            inlineData: {
              data: imageData,
              mimeType: 'image/jpeg', // Adjust based on actual image type
            }
          }
        ]
      }],
      config: {
        temperature: 0.7,
        maxOutputTokens: 2048,
      }
    });

    const responseText = result.text || 'Could not analyze image';

    return {
      type: 'text',
      text: responseText,
    };
  } catch (error) {
    console.error('Error analyzing image:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to analyze image: ${errorMessage}`);
  }
}

// Get model info
export function getModelInfo() {
  return {
    name: MODEL_NAME,
    contextWindow: CONTEXT_WINDOW,
    capabilities: [
      'text generation',
      'code generation',
      'image analysis',
      'conversation',
      'reasoning',
    ],
  };
}

