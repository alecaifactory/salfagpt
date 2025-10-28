/**
 * API Endpoint: Re-index all documents for an agent
 * POST /api/admin/reindex-agent
 * 
 * Applies latest chunking filters (garbage removal) to all documents
 */

import type { APIRoute } from 'astro';
import { firestore, COLLECTIONS } from '../../../lib/firestore';
import { getSession } from '../../../lib/auth';

export const POST: APIRoute = async (context) => {
  try {
    // 1. Verify authentication (optional for localhost)
    const session = getSession(context);
    // Allow on localhost for admin scripts
    const isLocalhost = context.request.url.includes('localhost');
    
    if (!session && !isLocalhost) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Get request body
    const body = await context.request.json();
    const { agentId } = body;
    
    if (!agentId) {
      return new Response(
        JSON.stringify({ error: 'agentId is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // 2. Get agent info
    const agentDoc = await firestore.collection(COLLECTIONS.CONVERSATIONS).doc(agentId).get();
    
    if (!agentDoc.exists) {
      return new Response(
        JSON.stringify({ error: 'Agent not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const agentData = agentDoc.data();
    const agentTitle = agentData?.title || agentId;
    
    console.log('🔄 Re-indexing agent:', agentTitle);
    
    // 3. Find all documents assigned to this agent
    const sources = await firestore.collection(COLLECTIONS.CONTEXT_SOURCES)
      .where('assignedToAgents', 'array-contains', agentId)
      .get();
    
    if (sources.empty) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No documents found for this agent',
          documentsReindexed: 0
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`   Found ${sources.size} documents to re-index`);
    
    // 4. Re-index each document
    const results = [];
    let successCount = 0;
    let errorCount = 0;
    
    for (const sourceDoc of sources.docs) {
      const sourceId = sourceDoc.id;
      const sourceData = sourceDoc.data();
      
      console.log(`   📄 Re-indexing: ${sourceData.name}`);
      
      // Check if has extracted data
      if (!sourceData.extractedData) {
        console.log(`      ⚠️ No extractedData - skipping`);
        results.push({
          sourceId,
          sourceName: sourceData.name,
          success: false,
          error: 'No extracted data'
        });
        errorCount++;
        continue;
      }
      
      try {
        // Call enable-rag endpoint with forceReindex
        const response = await fetch(`http://localhost:3000/api/context-sources/${sourceId}/enable-rag`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            forceReindex: true,
          })
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.log(`      ❌ Error ${response.status}`);
          results.push({
            sourceId,
            sourceName: sourceData.name,
            success: false,
            error: errorText
          });
          errorCount++;
          continue;
        }
        
        const data = await response.json();
        
        console.log(`      ✅ Success!`);
        console.log(`         Chunks: ${data.chunksCount || 'N/A'}`);
        console.log(`         Filtered: ${data.chunksFiltered || 0} garbage chunks`);
        console.log(`         Useful: ${(data.chunksCount || 0) - (data.chunksFiltered || 0)}`);
        
        results.push({
          sourceId,
          sourceName: sourceData.name,
          success: true,
          chunksCount: data.chunksCount,
          chunksFiltered: data.chunksFiltered,
          indexingTime: data.indexingTime
        });
        
        successCount++;
        
      } catch (error) {
        console.log(`      ❌ Error: ${error.message}`);
        results.push({
          sourceId,
          sourceName: sourceData.name,
          success: false,
          error: error.message
        });
        errorCount++;
      }
    }
    
    console.log(`\n✅ Re-indexing complete for ${agentTitle}!`);
    console.log(`   Success: ${successCount}`);
    console.log(`   Errors: ${errorCount}`);
    
    return new Response(
      JSON.stringify({
        success: true,
        agentId,
        agentTitle,
        documentsFound: sources.size,
        documentsReindexed: successCount,
        documentsFailed: errorCount,
        results
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('❌ Error re-indexing agent:', error);
    
    return new Response(
      JSON.stringify({
        error: 'Failed to re-index agent',
        details: error instanceof Error ? error.message : String(error)
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

