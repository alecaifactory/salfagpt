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
              text: `Por favor, extrae TODO el contenido de este documento de manera completa y estructurada:

1. TEXTO: Extrae todo el texto manteniendo el formato original (títulos, párrafos, listas, etc.)

2. TABLAS: Si hay tablas, extráelas preservando la estructura en formato de texto (usa | para separar columnas)

3. IMÁGENES: Si hay imágenes, gráficos o diagramas, descríbelos en texto claro y detallado. Describe:
   - Qué muestra la imagen
   - Elementos importantes (texto visible, datos, símbolos)
   - Contexto o propósito aparente
   - Usa formato tipo ASCII art si es relevante para diagramas simples

NO resumas, extrae TODO el contenido de manera completa. El objetivo es preservar toda la información del documento en formato de texto para uso posterior.`,
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
    
    // Provide detailed error information
    let errorMessage = 'Failed to extract document';
    let errorDetails = 'Unknown error';
    let suggestions: string[] = [];
    
    if (error instanceof Error) {
      errorDetails = error.message;
      
      // Categorize errors and provide suggestions
      if (errorDetails.includes('API key') || errorDetails.includes('GEMINI_API_KEY')) {
        errorMessage = 'Gemini API Key no configurado';
        errorDetails = 'La variable de entorno GEMINI_API_KEY no está disponible';
        suggestions = [
          'Verifica que GEMINI_API_KEY esté en el archivo .env',
          'Reinicia el servidor después de agregar la key',
          'Confirma que la key sea válida en https://aistudio.google.com/app/apikey'
        ];
      } else if (errorDetails.includes('network') || errorDetails.includes('fetch') || errorDetails.includes('ENOTFOUND')) {
        errorMessage = 'Error de conexión a Gemini AI';
        errorDetails = `No se pudo conectar al servicio: ${errorDetails}`;
        suggestions = [
          'Verifica tu conexión a internet',
          'Comprueba que no haya firewall bloqueando la conexión',
          'Intenta nuevamente en unos momentos'
        ];
      } else if (errorDetails.includes('quota') || errorDetails.includes('rate limit')) {
        errorMessage = 'Límite de uso alcanzado';
        errorDetails = 'Has excedido el límite de solicitudes de la API de Gemini';
        suggestions = [
          'Espera unos minutos antes de intentar nuevamente',
          'Verifica tu cuota en https://aistudio.google.com/',
          'Considera actualizar tu plan de Gemini AI'
        ];
      } else if (errorDetails.includes('model') || errorDetails.includes('not found')) {
        errorMessage = 'Modelo no encontrado';
        errorDetails = `El modelo especificado no está disponible: ${errorDetails}`;
        suggestions = [
          'Intenta con gemini-2.5-flash en lugar de gemini-2.5-pro',
          'Verifica que tu API key tenga acceso al modelo solicitado'
        ];
      } else if (errorDetails.includes('timeout')) {
        errorMessage = 'Timeout procesando el documento';
        errorDetails = 'El documento tardó demasiado en procesarse';
        suggestions = [
          'El archivo puede ser muy grande, intenta con uno más pequeño',
          'Intenta nuevamente, el servicio puede estar lento temporalmente'
        ];
      }
    }
    
    return new Response(
      JSON.stringify({
        error: errorMessage,
        details: errorDetails,
        suggestions: suggestions.length > 0 ? suggestions : undefined,
        timestamp: new Date().toISOString()
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

