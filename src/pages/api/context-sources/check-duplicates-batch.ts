/**
 * Batch Duplicate Check API
 * 
 * Checks multiple files for duplicates in a single request
 * Much faster than individual checks (1 request vs N requests)
 */

import type { APIRoute } from 'astro';
import { firestore, COLLECTIONS } from '../../../lib/firestore';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { userId, fileNames } = await request.json();

    if (!userId || !fileNames || !Array.isArray(fileNames)) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields: userId and fileNames array' 
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log(`🔍 Batch duplicate check for ${fileNames.length} files (user: ${userId})`);
    const startTime = Date.now();

    // Query Firestore for all files at once
    const snapshot = await firestore
      .collection(COLLECTIONS.CONTEXT_SOURCES)
      .where('userId', '==', userId)
      .where('name', 'in', fileNames.slice(0, 30)) // Firestore 'in' limit is 30
      .get();

    // Build map of filename -> source
    const duplicates: Record<string, any> = {};
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      duplicates[data.name] = {
        id: doc.id,
        ...data,
        addedAt: data.addedAt?.toDate?.() || data.addedAt,
      };
    });

    // Handle if more than 30 files (split into batches)
    if (fileNames.length > 30) {
      const remainingFiles = fileNames.slice(30);
      const batches = [];
      
      for (let i = 0; i < remainingFiles.length; i += 30) {
        batches.push(remainingFiles.slice(i, i + 30));
      }
      
      for (const batch of batches) {
        const batchSnapshot = await firestore
          .collection(COLLECTIONS.CONTEXT_SOURCES)
          .where('userId', '==', userId)
          .where('name', 'in', batch)
          .get();
        
        batchSnapshot.docs.forEach(doc => {
          const data = doc.data();
          duplicates[data.name] = {
            id: doc.id,
            ...data,
            addedAt: data.addedAt?.toDate?.() || data.addedAt,
          };
        });
      }
    }

    const duration = Date.now() - startTime;
    const duplicateCount = Object.keys(duplicates).length;
    
    console.log(`✅ Batch check complete: ${duplicateCount}/${fileNames.length} duplicates found in ${duration}ms`);

    return new Response(
      JSON.stringify({
        duplicates,
        totalChecked: fileNames.length,
        totalDuplicates: duplicateCount,
        duration,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error in batch duplicate check:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to check for duplicates',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

