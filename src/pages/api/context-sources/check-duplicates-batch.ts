import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';
import { firestore } from '../../../lib/firestore';

/**
 * Batch check for duplicate files
 * Much faster than checking each file individually
 * 
 * POST /api/context-sources/batch-check-duplicates
 * Body: { userId: string, fileNames: string[] }
 * Response: { duplicates: Array<{fileName, source}>, newFiles: string[] }
 */
export const POST: APIRoute = async (context) => {
  try {
    // 1. Verify authentication
    const session = getSession(context);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized - Please login' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 2. Get parameters
    const body = await context.request.json();
    const { userId, fileNames } = body;

    if (!userId || !fileNames || !Array.isArray(fileNames)) {
      return new Response(JSON.stringify({ 
        error: 'Missing userId or fileNames array' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 3. Verify ownership
    if (session.id !== userId) {
      return new Response(JSON.stringify({ 
        error: 'Forbidden - Cannot check other user data' 
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const startTime = Date.now();
    console.log(`🔍 Batch duplicate check for ${fileNames.length} files (user: ${userId})`);

    // 4. Query ALL user's sources in one request (much faster than N requests)
    const snapshot = await firestore
      .collection('context_sources')
      .where('userId', '==', userId)
      .select('name', 'id', 'addedAt', 'metadata') // Only fetch needed fields
      .get();

    // Create a map for O(1) lookup
    const existingSourcesMap = new Map();
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      existingSourcesMap.set(data.name, {
        id: doc.id,
        name: data.name,
        addedAt: data.addedAt?.toDate().toISOString(),
        metadata: {
          extractionDate: data.metadata?.extractionDate?.toDate().toISOString(),
          model: data.metadata?.model,
        }
      });
    });

    // 5. Check each file against the map
    const duplicates: Array<{ fileName: string; existingSource: any }> = [];
    const newFiles: string[] = [];

    for (const fileName of fileNames) {
      const existing = existingSourcesMap.get(fileName);
      if (existing) {
        duplicates.push({ fileName, existingSource: existing });
      } else {
        newFiles.push(fileName);
      }
    }

    const duration = Date.now() - startTime;
    console.log(`✅ Batch duplicate check complete in ${duration}ms`);
    console.log(`   Checked: ${fileNames.length} files`);
    console.log(`   Duplicates: ${duplicates.length}`);
    console.log(`   New files: ${newFiles.length}`);

    // Return in format expected by frontend
    return new Response(JSON.stringify({ 
      duplicates,  // Array of { fileName, existingSource }
      newFiles,    // Array of file names
      stats: {
        totalChecked: fileNames.length,
        duplicatesFound: duplicates.length,
        newFilesFound: newFiles.length,
        durationMs: duration,
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error in batch duplicate check:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

