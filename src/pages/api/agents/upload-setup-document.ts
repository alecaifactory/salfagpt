/**
 * Upload agent setup document and extract content
 * POST /api/agents/upload-setup-document
 * 
 * Accepts PDF or DOCX file, extracts full content, saves to Cloud Storage
 */
import type { APIRoute } from 'astro';
import { Storage } from '@google-cloud/storage';
import { GoogleGenAI } from '@google/genai';

const storage = new Storage({
  projectId: process.env.GOOGLE_CLOUD_PROJECT,
});

const genAI = new GoogleGenAI({ 
  apiKey: process.env.GOOGLE_AI_API_KEY!
});

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const agentId = formData.get('agentId') as string;
    const purpose = formData.get('purpose') as string;

    if (!file || !agentId) {
      return new Response(
        JSON.stringify({ error: 'File and agentId are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('📤 Uploading setup document for agent:', agentId);
    console.log('📄 File:', file.name, file.type, file.size, 'bytes');

    // 1. Upload to Cloud Storage
    const bucketName = `${process.env.GOOGLE_CLOUD_PROJECT}-agent-setup-docs`;
    const bucket = storage.bucket(bucketName);
    
    // Create bucket if doesn't exist
    try {
      await bucket.create();
      console.log(`✅ Bucket created: ${bucketName}`);
    } catch (error: any) {
      if (error.code !== 409) { // 409 = already exists
        console.warn('Bucket creation error (may already exist):', error.message);
      }
    }

    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const cloudPath = `agents/${agentId}/setup-docs/${timestamp}-${sanitizedFileName}`;
    const cloudFile = bucket.file(cloudPath);

    // Upload file
    const fileBuffer = await file.arrayBuffer();
    await cloudFile.save(Buffer.from(fileBuffer), {
      metadata: {
        contentType: file.type,
        metadata: {
          agentId,
          purpose,
          originalName: file.name,
          uploadedAt: new Date().toISOString(),
        }
      }
    });

    // Make file publicly readable (optional - remove if you want it private)
    // await cloudFile.makePublic();
    
    const publicUrl = `https://storage.googleapis.com/${bucketName}/${cloudPath}`;
    console.log('✅ File uploaded to Cloud Storage:', publicUrl);

    // 2. Extract content using Gemini AI
    console.log('🔍 Extracting content from document...');
    
    // Upload file to Gemini File API for processing
    const fileUri = await uploadFileToGemini(fileBuffer, file.name, file.type);
    
    // Extract content with Gemini
    const extractionPrompt = `
Extrae TODO el contenido de este documento de manera exhaustiva y estructurada.

Incluye:
- Todo el texto completo
- Todas las secciones y subsecciones
- Todos los detalles, ejemplos, y especificaciones
- Tablas (en formato markdown)
- Listas y viñetas
- Cualquier información relevante

NO resumas. NO omitas detalles. Extrae TODO el contenido disponible.

Formato: Texto plano con estructura clara usando markdown donde sea apropiado.
`.trim();

    const result = await genAI.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { fileData: { mimeType: file.type, fileUri } },
            { text: extractionPrompt }
          ]
        }
      ],
      config: {
        temperature: 0.1, // Low temperature for faithful extraction
        maxOutputTokens: 8192,
      }
    });

    const extractedContent = result.text || '';
    console.log(`✅ Content extracted: ${extractedContent.length} characters`);

    return new Response(
      JSON.stringify({
        success: true,
        documentUrl: publicUrl,
        cloudPath,
        extractedContent,
        metadata: {
          originalFileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          uploadedAt: new Date().toISOString(),
          agentId,
          purpose,
        }
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ Error processing setup document:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process document',
        details: error.message 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

/**
 * Helper: Upload file to Gemini File API
 */
async function uploadFileToGemini(
  fileBuffer: ArrayBuffer,
  fileName: string,
  mimeType: string
): Promise<string> {
  // For now, return a mock URI
  // In production, you'd use Gemini's File API to upload the file
  // and get back a fileUri that can be used in generateContent
  
  // TODO: Implement actual Gemini File API upload
  // const fileManager = new GoogleAIFileManager(apiKey);
  // const uploadResult = await fileManager.uploadFile(filePath, { mimeType });
  // return uploadResult.file.uri;
  
  // For now, we'll use a different approach:
  // Convert to base64 and include inline (works for smaller files)
  const base64 = Buffer.from(fileBuffer).toString('base64');
  return `data:${mimeType};base64,${base64}`;
}

