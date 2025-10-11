import type { APIRoute } from 'astro';
import { ImageAnnotatorClient } from '@google-cloud/vision';

// Initialize Vision API client
// Uses same credentials as Firestore (service account or Application Default Credentials)
const IS_DEVELOPMENT = import.meta.env.DEV;

let visionClient: ImageAnnotatorClient | null = null;

function getVisionClient() {
  if (!visionClient) {
    try {
      // Use same pattern as firestore.ts for credentials
      const projectId = process.env.GOOGLE_CLOUD_PROJECT || 
                        import.meta.env.GOOGLE_CLOUD_PROJECT;
      
      visionClient = new ImageAnnotatorClient({
        projectId,
        // In production, uses Application Default Credentials
        // In development, uses GOOGLE_APPLICATION_CREDENTIALS env var
      });
      
      console.log('✅ Vision API client initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Vision API client:', error);
      throw error;
    }
  }
  return visionClient;
}

// POST /api/extract-document - Extract text from PDF/image using Google Cloud Vision API
export const POST: APIRoute = async ({ request }) => {
  try {
    // Check if we're in development without credentials
    if (IS_DEVELOPMENT) {
      try {
        const client = getVisionClient();
        // Test if credentials are available
        await client.getProjectId();
      } catch (error) {
        console.warn('⚠️ Vision API not available in development, using fallback');
        return new Response(
          JSON.stringify({
            error: 'Vision API not configured locally',
            fallback: true,
            message: 'Please configure GOOGLE_APPLICATION_CREDENTIALS for local development'
          }),
          { status: 503, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

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

    console.log(`📄 Extracting text from: ${file.name} (${file.type}, ${file.size} bytes)`);

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Call Vision API
    const client = getVisionClient();
    const startTime = Date.now();

    const [result] = await client.documentTextDetection({
      image: { content: buffer },
    });

    const extractionTime = Date.now() - startTime;
    const detections = result.textAnnotations;
    const fullText = result.fullTextAnnotation;

    if (!fullText || !fullText.text) {
      return new Response(
        JSON.stringify({ 
          error: 'No text found in document',
          warning: 'The document may be empty or contain only images without text'
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const extractedText = fullText.text;
    const pages = fullText.pages?.length || 1;

    // Build metadata
    const metadata = `📄 Archivo: ${file.name}
📊 Total de páginas: ${pages}
📝 Caracteres extraídos: ${extractedText.length}
🤖 Modelo: ${model}
☁️ Procesado con: Google Cloud Vision API
⚡ Tiempo de extracción: ${extractionTime}ms
📅 Fecha de extracción: ${new Date().toLocaleString('es-ES')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${extractedText}`;

    console.log(`✅ Text extracted: ${extractedText.length} characters in ${extractionTime}ms`);

    return new Response(
      JSON.stringify({
        success: true,
        text: metadata,
        metadata: {
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          pages,
          characters: extractedText.length,
          extractionTime,
          model,
          service: 'Google Cloud Vision API'
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

