/**
 * Serve original file from Cloud Storage
 * Requires authentication
 * 
 * GET /api/context-sources/:id/file
 */

import type { APIRoute } from 'astro';
import { getContextSource } from '../../../../lib/firestore';
import { downloadFile } from '../../../../lib/storage';
import { getSession } from '../../../../lib/auth';

export const GET: APIRoute = async (context) => {
  try {
    const sourceId = context.params.id;
    
    if (!sourceId) {
      return new Response('Source ID required', { status: 400 });
    }

    // AUTHENTICATION REQUIRED
    const session = getSession(context);
    if (!session) {
      return new Response('Unauthorized - Login required', { status: 401 });
    }

    console.log(`📥 File request for source: ${sourceId} by user: ${session.id}`);

    // Get source from Firestore
    const source = await getContextSource(sourceId);
    
    if (!source) {
      return new Response('Source not found', { status: 404 });
    }

    // AUTHORIZATION: User must own the source
    if (source.userId !== session.id) {
      console.warn(`🚫 Unauthorized access attempt: ${session.id} tried to access ${sourceId} owned by ${source.userId}`);
      return new Response('Forbidden - Not your document', { status: 403 });
    }

    // Check if file exists in Cloud Storage
    const storagePath = (source.metadata as any)?.storagePath;
    
    if (!storagePath) {
      return new Response('File not available in Cloud Storage', { status: 404 });
    }

    console.log(`📥 Downloading from storage: ${storagePath}`);

    // Download file from Cloud Storage
    const fileBuffer = await downloadFile(storagePath);
    
    console.log(`✅ File downloaded: ${fileBuffer.length} bytes`);

    // Determine content type
    const contentType = (source.metadata as any)?.fileType || 
      (source.type === 'pdf' ? 'application/pdf' : 'application/octet-stream');

    // Return file with proper headers (convert Buffer to Uint8Array for Response)
    return new Response(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${source.name}"`,
        'Cache-Control': 'private, max-age=3600', // Cache for 1 hour
        'X-Content-Type-Options': 'nosniff',
      },
    });

  } catch (error) {
    console.error('❌ Error serving file:', error);
    
    return new Response(
      `Error serving file: ${error instanceof Error ? error.message : 'Unknown error'}`,
      { status: 500 }
    );
  }
};

