/**
 * API Endpoint: Split Large PDF
 * 
 * POST /api/tools/split-pdf
 * 
 * Uploads PDF to GCS, invokes Cloud Function, tracks execution
 */

import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';
import { 
  createToolExecution, 
  uploadToGCS, 
  invokeCloudFunction 
} from '../../../lib/tool-manager';

const CLOUD_FUNCTION_URL = process.env.PDF_SPLITTER_FUNCTION_URL || 
  'https://us-central1-gen-lang-client-0986191192.cloudfunctions.net/pdf-splitter-tool';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // 1. Authenticate
    const session = getSession({ cookies } as any);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // 2. Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const chunkSizeMB = parseInt(formData.get('chunkSizeMB') as string || '20');
    
    if (!file) {
      return new Response(JSON.stringify({ error: 'No file provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    console.log('\n┌─────────────────────────────────────────────────┐');
    console.log('│ 🔪 PDF SPLITTER API - Starting                 │');
    console.log('└─────────────────────────────────────────────────┘');
    console.log(`📁 File: ${file.name}`);
    console.log(`📏 Size: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
    console.log(`👤 User: ${session.id}\n`);
    
    // 3. Create execution record
    const execution = await createToolExecution(
      session.id,
      'pdf-splitter',
      file.name,
      file.size / 1024 / 1024,
      { chunkSizeMB }
    );
    
    console.log(`✅ Execution created: ${execution.id}`);
    
    // 4. Upload to GCS
    console.log('⬆️  Uploading to GCS...');
    const uploadStart = Date.now();
    const buffer = Buffer.from(await file.arrayBuffer());
    const gcsUrl = await uploadToGCS(buffer, session.id, file.name);
    console.log(`✅ Uploaded in ${Date.now() - uploadStart}ms: ${gcsUrl}\n`);
    
    // 5. Invoke Cloud Function (async - don't await)
    console.log('☁️  Invoking Cloud Function...');
    invokeCloudFunction(CLOUD_FUNCTION_URL, {
      inputFileUrl: gcsUrl,
      chunkSizeMB,
      userId: session.id,
      executionId: execution.id,
    })
      .then(async (result) => {
        console.log('✅ Cloud Function completed:', result);
        
        // Update execution with results
        const { updateToolExecution } = await import('../../../lib/tool-manager');
        await updateToolExecution(execution.id, {
          status: 'completed',
          outputFiles: result.chunks,
          metadata: result.metadata,
          completedAt: new Date(),
          durationMs: Date.now() - execution.startedAt.getTime(),
        });
      })
      .catch(async (error) => {
        console.error('❌ Cloud Function failed:', error);
        
        // Update execution with error
        const { updateToolExecution } = await import('../../../lib/tool-manager');
        await updateToolExecution(execution.id, {
          status: 'failed',
          error: {
            message: error.message,
            code: 'CLOUD_FUNCTION_ERROR',
            details: error.stack,
          },
          completedAt: new Date(),
        });
      });
    
    // 6. Return immediately (async processing)
    return new Response(JSON.stringify({
      success: true,
      executionId: execution.id,
      status: 'pending',
      message: 'PDF splitting started. Poll for results.',
      pollUrl: `/api/tools/status/${execution.id}`,
      estimatedTimeSeconds: Math.ceil((file.size / 1024 / 1024) * 0.5), // ~0.5s per MB
    }), {
      status: 202, // Accepted
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('❌ API error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};












