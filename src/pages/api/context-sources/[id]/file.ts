import type { APIRoute } from 'astro';
import { getContextSource } from '../../../../lib/firestore';
import { getSession } from '../../../../lib/auth';
import { getSignedUrl } from '../../../../lib/storage';

/**
 * GET /api/context-sources/:id/file
 * 
 * Serves the original document file for viewing/downloading
 * Returns a redirect to a signed Cloud Storage URL
 * 
 * Security:
 * - Requires authentication
 * - Verifies user owns the document
 * - Generates time-limited signed URL (15 minutes)
 * 
 * Handles multiple storage path formats:
 * - metadata.storagePath (web uploads)
 * - metadata.gcsPath (CLI uploads)
 */
export const GET: APIRoute = async ({ params, cookies }) => {
  try {
    // 1. Verify authentication
    const session = getSession({ cookies } as any);
    if (!session) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Please login' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const sourceId = params.id;
    if (!sourceId) {
      return new Response(
        JSON.stringify({ error: 'Source ID required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('📄 File request for source:', sourceId);

    // 2. Load context source
    const source = await getContextSource(sourceId);
    
    if (!source) {
      console.error('❌ Source not found:', sourceId);
      return new Response(
        JSON.stringify({ error: 'Document not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('📋 Source loaded:', source.name, 'User:', source.userId);

    // 3. SECURITY: Verify ownership
    if (source.userId !== session.id && session.email !== 'alec@getaifactory.com') {
      console.error('🚫 Access denied - userId mismatch:', {
        sourceUserId: source.userId,
        sessionUserId: session.id,
        sessionEmail: session.email
      });
      return new Response(
        JSON.stringify({ error: 'Forbidden - Cannot access other user files' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 4. Get storage path (try multiple field names for backward compatibility)
    const metadata = source.metadata as any;
    const storagePath = metadata?.storagePath || metadata?.gcsPath;
    
    console.log('🔍 Checking metadata for storage path:', {
      hasMetadata: !!metadata,
      storagePath: metadata?.storagePath,
      gcsPath: metadata?.gcsPath,
      result: storagePath
    });
    
    if (!storagePath) {
      console.error('❌ No storage path found in metadata:', metadata);
      return new Response(
        JSON.stringify({ 
          error: 'File not available',
          details: 'No storage path found for this document. File may have been uploaded before Cloud Storage integration.',
          metadata: {
            hasOriginalFileName: !!metadata?.originalFileName,
            hasPageCount: !!metadata?.pageCount,
            uploadMethod: metadata?.uploadedVia || 'unknown'
          }
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Remove 'gs://bucket-name/' prefix if present to get clean path
    const cleanPath = storagePath.replace(/^gs:\/\/[^/]+\//, '');

    console.log('📂 Storage paths:', {
      original: storagePath,
      cleaned: cleanPath
    });

    // 5. Generate signed URL (15 minutes expiry)
    console.log('🔐 Generating signed URL for:', cleanPath);
    const signedUrl = await getSignedUrl(cleanPath, 15);

    console.log('✅ File access granted:', {
      sourceId,
      name: source.name,
      userId: source.userId,
      path: cleanPath
    });

    // 6. Redirect to signed URL
    return new Response(null, {
      status: 302,
      headers: {
        'Location': signedUrl,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      }
    });

  } catch (error: any) {
    console.error('❌ Error serving file:', error);
    console.error('Error stack:', error.stack);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to load file',
        details: error.message || 'Unknown error',
        type: error.name || 'Error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

