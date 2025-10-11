import type { APIRoute } from 'astro';
import { GoogleGenAI } from '@google/genai';

// Initialize Gemini AI client
const IS_DEVELOPMENT = import.meta.env.DEV;

let geminiClient: GoogleGenAI | null = null;

function getGeminiClient() {
  if (!geminiClient) {
    try {
      const apiKey = process.env.GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY;
      
      if (!apiKey) {
        throw new Error('GEMINI_API_KEY not configured');
      }
      
      geminiClient = new GoogleGenAI({ apiKey });
      console.log('✅ Gemini AI client initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Gemini AI client:', error);
      throw error;
    }
  }
  return geminiClient;
}

// POST /api/extract-document - Extract text from PDF/image using Gemini AI
export const POST: APIRoute = async ({ request }) => {
  try {
    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const model = formData.get('model') as string || 'gemini-2.5-flash';

    if (!file) {
      return new Response(
        JSON.stringify({ error: 'No file provided' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate file type
    const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid file type. Supported: PDF, PNG, JPEG',
          receivedType: file.type
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return new Response(
        JSON.stringify({ 
          error: 'File too large. Maximum size: 50MB',
          fileSize: file.size,
          maxSize
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📄 Extracting text from: ${file.name} (${file.type}, ${file.size} bytes) using ${model}`);

    // Convert file to base64
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Data = buffer.toString('base64');

    // Determine mime type
    const mimeType = file.type;

    // Call Gemini AI
    const client = getGeminiClient();
    const startTime = Date.now();

    // Use Gemini's native PDF/image processing
    const result = await client.models.generateContent({
      model: model,
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType: mimeType,
                data: base64Data,
              },
            },
            {
              text: 'Por favor, extrae TODO el texto de este documento de manera estructurada. Mantén el formato original tanto como sea posible, incluyendo títulos, párrafos, listas, y cualquier contenido de tablas. No resumas, extrae todo el texto completo.',
            },
          ],
        },
      ],
      config: {
        temperature: 0.1, // Low temperature for accurate extraction
        maxOutputTokens: 8192,
      },
    });

    const extractionTime = Date.now() - startTime;
    const extractedText = result.text || '';

    if (!extractedText || extractedText.trim().length === 0) {
      return new Response(
        JSON.stringify({ 
          error: 'No text found in document',
          warning: 'The document may be empty or contain only images without text'
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Build metadata
    const metadata = `📄 Archivo: ${file.name}
📊 Tamaño: ${(file.size / 1024 / 1024).toFixed(2)} MB
📝 Caracteres extraídos: ${extractedText.length}
🤖 Modelo: ${model}
🔥 Procesado con: Gemini AI
⚡ Tiempo de extracción: ${extractionTime}ms
📅 Fecha de extracción: ${new Date().toLocaleString('es-ES')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${extractedText}`;

    console.log(`✅ Text extracted: ${extractedText.length} characters in ${extractionTime}ms using ${model}`);

    return new Response(
      JSON.stringify({
        success: true,
        text: metadata,
        metadata: {
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          characters: extractedText.length,
          extractionTime,
          model,
          service: 'Gemini AI'
        }
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error extracting document:', error);
    
    return new Response(
      JSON.stringify({
        error: 'Failed to extract document',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

