/**
 * Upload agent setup document and extract content
 * POST /api/agents/upload-setup-document
 * 
 * Accepts PDF or DOCX file, extracts full content, saves to Cloud Storage
 */
import type { APIRoute } from 'astro';
import { Storage } from '@google-cloud/storage';
import { GoogleGenAI } from '@google/genai';
import mammoth from 'mammoth';

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
    
    // Verify environment variables
    if (!process.env.GOOGLE_CLOUD_PROJECT) {
      console.error('❌ GOOGLE_CLOUD_PROJECT not set');
      throw new Error('Server configuration error: GOOGLE_CLOUD_PROJECT missing');
    }
    if (!process.env.GOOGLE_AI_API_KEY) {
      console.error('❌ GOOGLE_AI_API_KEY not set');
      throw new Error('Server configuration error: GOOGLE_AI_API_KEY missing');
    }
    console.log('✅ Environment variables verified:', {
      project: process.env.GOOGLE_CLOUD_PROJECT,
      hasApiKey: !!process.env.GOOGLE_AI_API_KEY,
    });
    
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
      } else {
        console.log(`✅ Bucket already exists: ${bucketName}`);
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
    
    try {
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
    } catch (uploadError: any) {
      uploadError.step = 'cloud_storage_upload';
      console.error('❌ Cloud Storage upload failed:', uploadError);
      throw uploadError;
    }

    // Make file publicly readable (optional - remove if you want it private)
    // await cloudFile.makePublic();
    
    const publicUrl = `https://storage.googleapis.com/${bucketName}/${cloudPath}`;
    console.log('✅ File uploaded to Cloud Storage:', publicUrl);
    console.log('📤 [PROGRESS] 30% - File uploaded successfully');

    // 2. Extract content (30-100% progress)
    console.log('🔍 Extracting content from document...');
    console.log('📤 [PROGRESS] 35% - Determining extraction method');
    
    let extractedContent = '';
    let extractionMethod = 'unknown';
    
    // Handle different file types
    if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
        file.name.toLowerCase().endsWith('.docx')) {
      // DOCX: Use mammoth to extract text
      console.log('📄 DOCX file detected - using mammoth for extraction');
      console.log('📤 [PROGRESS] 50% - Extracting text from DOCX...');
      extractionMethod = 'mammoth';
      
      try {
        const result = await mammoth.extractRawText({ buffer: Buffer.from(fileBuffer) });
        extractedContent = result.value;
        
        if (result.messages.length > 0) {
          console.warn('⚠️ Mammoth warnings:', result.messages);
        }
        
        console.log(`✅ DOCX text extracted: ${extractedContent.length} characters`);
        console.log('📤 [PROGRESS] 100% - Extraction complete');
      } catch (mammothError: any) {
        mammothError.step = 'mammoth_extraction';
        console.error('❌ Mammoth extraction failed:', mammothError);
        throw mammothError;
      }
      
    } else if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      // PDF: Use Gemini Vision API
      console.log('📄 PDF file detected - using Gemini AI for extraction');
      console.log('📤 [PROGRESS] 50% - Converting to base64');
      extractionMethod = 'gemini';
      
      const base64Data = Buffer.from(fileBuffer).toString('base64');
      
      console.log('📤 [PROGRESS] 60% - Sending to Gemini AI...');
      
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

      try {
        const result = await genAI.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [
            {
              role: 'user',
              parts: [
                { 
                  inlineData: { 
                    mimeType: 'application/pdf', 
                    data: base64Data 
                  } 
                },
                { text: extractionPrompt }
              ]
            }
          ],
          config: {
            temperature: 0.1,
            maxOutputTokens: 8192,
          }
        });
        
        extractedContent = result.text || '';
        console.log(`✅ PDF content extracted: ${extractedContent.length} characters`);
        console.log('📤 [PROGRESS] 100% - Extraction complete');
        
      } catch (geminiError: any) {
        geminiError.step = 'gemini_extraction';
        console.error('❌ Gemini extraction failed:', geminiError);
        throw geminiError;
      }
    } else {
      throw new Error(`Unsupported file type: ${file.type}. Only PDF and DOCX are supported.`);
    }
    
    // Return successful response
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
          extractionMethod,
        }
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ Error processing setup document:', error);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Error details:', {
      name: error.name,
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
    });
    
    // More specific error messages
    let errorMessage = 'Failed to process document';
    let errorDetails = error.message;
    
    if (error.message?.includes('bucket')) {
      errorMessage = 'Cloud Storage bucket error';
      errorDetails = `Bucket issue: ${error.message}. Check if bucket exists and has proper permissions.`;
    } else if (error.message?.includes('API key')) {
      errorMessage = 'Gemini API key error';
      errorDetails = 'Invalid or missing GOOGLE_AI_API_KEY environment variable';
    } else if (error.code === 'ECONNREFUSED') {
      errorMessage = 'Connection error';
      errorDetails = 'Could not connect to Google Cloud services';
    }
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: errorDetails,
        step: error.step || 'unknown',
        timestamp: new Date().toISOString(),
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
