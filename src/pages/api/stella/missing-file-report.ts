import type { APIRoute } from 'astro';
import { firestore, COLLECTIONS } from '../../../lib/firestore';
import { getSession } from '../../../lib/auth';

/**
 * POST /api/stella/missing-file-report
 * 
 * Create a feedback ticket for a missing original file
 * Automatically sent to backlog with all diagnostic information
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // 1. Authenticate
    const session = getSession({ cookies } as any);
    if (!session) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Please login' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 2. Parse request body
    const data = await request.json();
    
    const {
      sourceId,
      sourceName,
      agentName,
      description,
      storagePath,
      hasStoragePath,
      hasExtractedData,
      extractedDataSize,
      sourceUserId,
      screenshot,
      reportedByEmail,
      reportedByName,
    } = data;

    // 3. Validate required fields
    if (!sourceId || !sourceName) {
      return new Response(
        JSON.stringify({ error: 'sourceId and sourceName are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('📥 Receiving missing file report:', {
      sourceId,
      sourceName,
      reportedBy: session.id,
    });

    // 4. Create feedback ticket
    const ticketRef = await firestore.collection(COLLECTIONS.FEEDBACK_TICKETS).add({
      // Title and description
      title: `Archivo faltante: ${sourceName}`,
      description: description || 'Archivo PDF original no disponible en el visor de documentos.',
      
      // Categorization
      category: 'missing_document',
      subcategory: 'storage_issue',
      priority: 'medium',
      status: 'open',
      
      // Context
      relatedSourceId: sourceId,
      relatedSourceName: sourceName,
      relatedAgentName: agentName || 'N/A',
      
      // Diagnostic information (helps team debug)
      diagnostic: {
        storagePath: storagePath || 'N/A',
        hasStoragePath: hasStoragePath || false,
        hasExtractedData: hasExtractedData || false,
        extractedDataSize: extractedDataSize || 0,
        sourceUserId: sourceUserId || 'N/A',
        currentUserId: session.id,
        userIdMatch: sourceUserId === session.id,
        
        // Help identify the problem type
        likelyReason: !storagePath ? 'legacy_document_no_storage' :
                      sourceUserId !== session.id ? 'userid_format_mismatch' :
                      'storage_file_deleted_or_corrupted',
      },
      
      // Reporter information
      reportedBy: session.id,
      reportedByEmail: reportedByEmail || session.email || 'N/A',
      reportedByName: reportedByName || session.name || 'Usuario',
      
      // Screenshot (if captured)
      screenshot: screenshot || null,
      
      // Timestamps
      createdAt: new Date(),
      updatedAt: new Date(),
      
      // Assignment (auto-assign to tech team)
      assignedTo: null, // Will be assigned by admin
      assignedAt: null,
      
      // Resolution tracking
      resolvedAt: null,
      resolvedBy: null,
      resolution: null,
      
      // Source tracking
      source: 'document_viewer_missing_file',
      environment: process.env.NODE_ENV || 'production',
    });

    console.log('✅ Missing file ticket created:', ticketRef.id);

    // 5. Return success
    return new Response(
      JSON.stringify({
        success: true,
        ticketId: ticketRef.id,
        message: 'Reporte enviado al Backlog exitosamente',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('❌ Error creating missing file report:', error);
    
    return new Response(
      JSON.stringify({
        error: 'Failed to create report',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};

