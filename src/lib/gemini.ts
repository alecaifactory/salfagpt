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
  maxTokens?: number; // Default: 300 tokens (optimized for concise responses)
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
    maxTokens = 300, // ✅ OPTIMIZED: 300 tokens = ~1 intro paragraph + 3 bullets + 2-3 questions
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
    maxTokens = 300, // ✅ OPTIMIZED: Concise responses for fast generation
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
        // ✅ FIX 2025-10-29: Extract REFERENCE numbers (consolidated), not fragment numbers
        // New format: === [Referencia N] DocumentName ===
        const referenceMatches = userContext.match(/=== \[Referencia (\d+)\]/g) || [];
        const referenceNumbers = referenceMatches.map(m => {
          const match = m.match(/\[Referencia (\d+)\]/);
          return match ? parseInt(match[1]) : null;
        }).filter((n): n is number => n !== null);
        
        const totalReferences = referenceNumbers.length;
        
        fullUserMessage = `DOCUMENTOS RELEVANTES DEL CONTEXTO (ordenados por relevancia):
${userContext}

───────────────────────────────────
PREGUNTA DEL USUARIO:
${userMessage}`;

        enhancedSystemInstruction = `${systemInstruction}

🔍 MODO RAG ACTIVADO - REFERENCIAS CONSOLIDADAS:

✅ YA CONSOLIDADO: Los fragmentos ya están agrupados por documento único.
- Referencias disponibles: ${totalReferences} documentos
- Cada referencia [N] representa UN documento completo
- Los números son finales y correctos: [1] a [${totalReferences}]

🚨 REGLA ABSOLUTA - USA SOLO ESTOS NÚMEROS:
- Referencias válidas: ${referenceNumbers.map(n => `[${n}]`).join(', ')}
- ❌ PROHIBIDO usar números mayores a [${totalReferences}]
- ❌ PROHIBIDO inventar referencias que no existen
- ✅ Si la información no está, di claramente que no está disponible

INSTRUCCIONES OBLIGATORIAS:
1. ✅ Cita usando [N] INMEDIATAMENTE después del dato específico
2. ✅ SIEMPRE usa referencias INDIVIDUALES: [1] [2] [3]
3. ✅ Si un dato viene de múltiples documentos, cita así: [1][2] (juntos, sin espacios ni comas)
4. ✅ Cada afirmación factual DEBE tener su referencia
5. ❌ NO inventes información
6. ❌ NO uses números que no estén en la lista de referencias válidas arriba

EJEMPLO CORRECTO (si tienes ${totalReferences} referencias):
"La gestión del combustible requiere control diario[1]. El informe se genera en SAP 
con la transacción ZMM_IE[2]. Este proceso aplica a varias áreas[1][2] y es 
responsabilidad de JBOD[${totalReferences > 2 ? '3' : totalReferences}]."

### Referencias
${referenceNumbers.map((n, i) => `[${n}] Documento ${i + 1} (del contexto arriba)`).join('\n')}

❌ EJEMPLOS INCORRECTOS:
"... según procedimiento [${totalReferences + 1}]" ← Número inválido (mayor que ${totalReferences})
"... transacción ZMM_IE [1, 2]" ← NO uses comas, usa [1][2]
"... para declaración [1, 2, 3]" ← NO uses comas, usa [1][2][3]

FORMATO OBLIGATORIO para tu sección Referencias:
- Una línea por documento (máximo ${totalReferences} líneas)
- Usa EXACTAMENTE los números ${referenceNumbers.map(n => `[${n}]`).join(', ')}
- NO inventes números adicionales`;
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
    console.log('🏷️ [TITLE] Starting title generation...');
    console.log('🏷️ [TITLE] Input message:', firstMessage.substring(0, 150));
    
    // 🚨 NOTE: gemini-2.5-flash auto-thinking consumes ALL tokens (no text output)
    // Using smart heuristic extraction instead (fast, reliable, no API cost)
    
    let title = firstMessage
      .replace(/¿|\?/g, '') // Remove question marks
      .replace(/\bMe puedes (decir|explicar|ayudar con)\b/gi, '') // Remove filler
      .replace(/\bla diferencia entre\b/gi, 'Diferencia')
      .replace(/\ben\b/gi, 'en')
      .replace(/\bun\b/gi, '')
      .replace(/\buna\b/gi, '')
      .replace(/\by\b/gi, 'y')
      .trim();
    
    // Take first 6 meaningful words
    const words = title.split(/\s+/).filter(w => w.length > 2); // Filter out 2-letter words
    title = words.slice(0, 6).join(' ');
    
    // Capitalize first letter
    if (title.length > 0) {
      title = title.charAt(0).toUpperCase() + title.slice(1);
    }
    
    // Fallback if too short
    if (title.length < 5) {
      title = 'Nueva Conversación';
    }
    
    console.log('✅ [TITLE] Generated (heuristic):', title);
    return title.substring(0, 60);
    
  } catch (error) {
    console.error('❌ [TITLE] Error generating title:', error);
    return 'Nueva Conversación';
  }
}

/**
 * ✅ NEW: Stream conversation title generation for real-time UI updates
 * Generates title token-by-token for smooth streaming effect
 */
export async function* streamConversationTitle(firstMessage: string): AsyncGenerator<string> {
  try {
    console.log('🏷️ [streamConversationTitle] Starting...');
    console.log('   Message:', firstMessage.substring(0, 100));
    
    // ✅ Use streaming API
    const stream = await genAI.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: `Create a short, descriptive title (3-6 words maximum) for this question: "${firstMessage}"` }] }],
      config: {
        systemInstruction: 'You generate short titles for conversations. Return ONLY the title text, nothing else. No quotes, no punctuation at the end. Make it descriptive and concise.',
        temperature: 0.3,
        maxOutputTokens: 20,
      }
    });

    let fullTitle = '';
    let chunkCount = 0;
    
    console.log('🏷️ [streamConversationTitle] Stream started, reading chunks...');
    
    // Stream each chunk
    for await (const chunk of stream) {
      if (chunk.text) {
        chunkCount++;
        fullTitle += chunk.text;
        console.log(`  📤 Chunk ${chunkCount}:`, chunk.text);
        yield chunk.text;
      } else {
        console.log('  ⚠️ Chunk with no text:', chunk);
      }
    }

    console.log('✅ [streamConversationTitle] Complete:', fullTitle);
    console.log(`   Total chunks: ${chunkCount}`);
    
    // Clean and return
    const cleaned = fullTitle.trim().replace(/^["']|["']$/g, '');
    return cleaned || 'Nueva Conversación';
    
  } catch (error) {
    console.error('❌ [streamConversationTitle] Error:', error);
    yield 'Nueva Conversación';
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

