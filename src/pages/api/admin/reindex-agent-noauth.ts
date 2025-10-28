/**
 * API Endpoint: Re-index agent (NO AUTH for localhost scripts)
 * POST /api/admin/reindex-agent-noauth
 * 
 * ⚠️ WARNING: Only works on localhost, disabled in production
 */

import type { APIRoute } from 'astro';
import { firestore, COLLECTIONS } from '../../../lib/firestore';

export const POST: APIRoute = async (context) => {
  try {
    // ⚠️ SECURITY: Only allow on localhost
    const isLocalhost = context.request.url.includes('localhost') || 
                        context.request.url.includes('127.0.0.1');
    
    if (!isLocalhost) {
      return new Response(
        JSON.stringify({ error: 'This endpoint only works on localhost' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Get request body
    const body = await context.request.json();
    const { agentId, agentTitle } = body;
    
    if (!agentId && !agentTitle) {
      return new Response(
        JSON.stringify({ error: 'agentId or agentTitle is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('🔄 Re-indexing agent (noauth):', agentId || agentTitle);
    
    // Find agent by ID or title
    let agentDoc;
    let actualAgentId;
    
    if (agentId) {
      agentDoc = await firestore.collection(COLLECTIONS.CONVERSATIONS).doc(agentId).get();
      actualAgentId = agentId;
    } else {
      // Search by title
      const agents = await firestore.collection(COLLECTIONS.CONVERSATIONS)
        .where('title', '==', agentTitle)
        .limit(1)
        .get();
      
      if (!agents.empty) {
        agentDoc = agents.docs[0];
        actualAgentId = agentDoc.id;
      }
    }
    
    if (!agentDoc || !agentDoc.exists) {
      // Try partial match
      console.log('   Trying partial match...');
      const allAgents = await firestore.collection(COLLECTIONS.CONVERSATIONS).get();
      const titleToSearch = (agentTitle || '').toLowerCase();
      
      const matches = allAgents.docs.filter(doc => {
        const title = (doc.data().title || '').toLowerCase();
        return title.includes(titleToSearch) || 
               title.includes('s001') || 
               title.includes('m001') ||
               title.includes('bodegas') ||
               title.includes('legal');
      });
      
      if (matches.length > 0) {
        return new Response(
          JSON.stringify({
            error: 'Agent not found',
            suggestions: matches.map(m => ({
              id: m.id,
              title: m.data().title
            }))
          }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'Agent not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const agentData = agentDoc.data();
    const actualAgentTitle = agentData?.title || actualAgentId;
    
    console.log(`   Agent found: ${actualAgentTitle} (${actualAgentId})`);
    
    // Find all documents assigned to this agent
    const sources = await firestore.collection(COLLECTIONS.CONTEXT_SOURCES)
      .where('assignedToAgents', 'array-contains', actualAgentId)
      .get();
    
    if (sources.empty) {
      console.log(`   ⚠️ No documents found for agent`);
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No documents found for this agent',
          agentId: actualAgentId,
          agentTitle: actualAgentTitle,
          documentsReindexed: 0
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`   Found ${sources.size} documents`);
    
    // Re-index each document
    const results = [];
    let successCount = 0;
    let errorCount = 0;
    
    for (const sourceDoc of sources.docs) {
      const sourceId = sourceDoc.id;
      const sourceData = sourceDoc.data();
      
      console.log(`   📄 ${sourceData.name}`);
      
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
        // Call enable-rag endpoint
        const reindexResponse = await fetch(`http://localhost:3000/api/context-sources/${sourceId}/enable-rag`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            forceReindex: true,
          })
        });
        
        if (!reindexResponse.ok) {
          const errorText = await reindexResponse.text();
          console.log(`      ❌ Error ${reindexResponse.status}`);
          results.push({
            sourceId,
            sourceName: sourceData.name,
            success: false,
            error: errorText
          });
          errorCount++;
          continue;
        }
        
        const reindexData = await reindexResponse.json();
        
        console.log(`      ✅ Re-indexed!`);
        console.log(`         Chunks: ${reindexData.chunksCount || 'N/A'}`);
        console.log(`         Filtered: ${reindexData.chunksFiltered || 0} garbage`);
        
        results.push({
          sourceId,
          sourceName: sourceData.name,
          success: true,
          chunksCount: reindexData.chunksCount,
          chunksFiltered: reindexData.chunksFiltered,
          indexingTime: reindexData.indexingTime
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
    
    console.log(`\n   ✅ Complete: ${successCount} success, ${errorCount} errors`);
    
    return new Response(
      JSON.stringify({
        success: true,
        agentId: actualAgentId,
        agentTitle: actualAgentTitle,
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

