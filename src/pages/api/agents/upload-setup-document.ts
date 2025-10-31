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
    console.log('📥 [UPLOAD] Request received');
    console.log('📥 [UPLOAD] Content-Type:', request.headers.get('content-type'));
    
    const formData = await request.formData();
    console.log('📥 [UPLOAD] FormData parsed');
    
    const file = formData.get('file') as File;
    const agentId = formData.get('agentId') as string;
    const purpose = formData.get('purpose') as string;

    console.log('📥 [UPLOAD] file:', !!file, 'name:', file?.name);
    console.log('📥 [UPLOAD] agentId:', agentId, 'type:', typeof agentId, 'length:', agentId?.length);
    console.log('📥 [UPLOAD] purpose:', purpose);

    if (!file || !agentId) {
      console.error('❌ [UPLOAD] Missing required fields - file:', !!file, 'agentId:', agentId || 'missing');
      return new Response(
        JSON.stringify({ 
          error: 'File and agentId are required',
          received: { 
            hasFile: !!file, 
            fileName: file?.name || 'missing',
            agentId: agentId || 'missing',
            agentIdType: typeof agentId,
            purpose: purpose || 'missing'
          }
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('📤 Uploading setup document for agent:', agentId);
    console.log('📄 File:', file.name, file.type, file.size, 'bytes');

    // 1. Upload to Cloud Storage (0-30% progress)
    console.log('📤 [PROGRESS] 5% - Starting upload to Cloud Storage');
    const projectId = process.env.GOOGLE_CLOUD_PROJECT || 'salfagpt';
    const bucketName = `${projectId}-agent-setup-docs`;
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

    console.log('📤 [PROGRESS] 10% - Preparing file upload');
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const cloudPath = `agents/${agentId}/setup-docs/${timestamp}-${sanitizedFileName}`;
    const cloudFile = bucket.file(cloudPath);

    // Upload file
    console.log('📤 [PROGRESS] 15% - Uploading file to Cloud Storage');
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
    console.log('📤 [PROGRESS] 30% - File uploaded successfully');

    // 2. Extract content using Gemini AI (30-100% progress)
    console.log('🔍 Extracting content from document...');
    console.log('📤 [PROGRESS] 35% - Converting file to base64');
    
    // Convert file to base64 for inline data
    const base64Data = Buffer.from(fileBuffer).toString('base64');
    console.log('📤 [PROGRESS] 50% - Sending to Gemini AI for extraction');
    
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

    console.log('📤 [PROGRESS] 60% - Processing with Gemini AI...');
    const result = await genAI.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { 
              inlineData: { 
                mimeType: file.type, 
                data: base64Data 
              } 
            },
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
    console.log('📤 [PROGRESS] 100% - Extraction complete');

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
