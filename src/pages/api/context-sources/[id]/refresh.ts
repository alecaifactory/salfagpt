import type { APIRoute } from 'astro';
import { firestore, COLLECTIONS } from '../../../../lib/firestore';
import { getSession } from '../../../../lib/auth';

/**
 * POST /api/context-sources/:id/refresh
 * Manually refresh a single context source
 * Available for web-url and api source types
 */
export const POST: APIRoute = async ({ params, request, cookies }) => {
  try {
    // Verify authentication
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
        JSON.stringify({ error: 'Source ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get source document
    const sourceDoc = await firestore
      .collection(COLLECTIONS.CONTEXT_SOURCES)
      .doc(sourceId)
      .get();

    if (!sourceDoc.exists) {
      return new Response(
        JSON.stringify({ error: 'Source not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const source = sourceDoc.data();

    // Verify user has access to this source
    // Check if user is the owner or has access via organization
    const hasAccess = 
      source.userId === session.userId ||
      (source.organizationId && session.organizationId === source.organizationId) ||
      session.role === 'superadmin';

    if (!hasAccess) {
      return new Response(
        JSON.stringify({ error: 'Access denied' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verify source type is refreshable
    if (source.type !== 'web-url' && source.type !== 'api') {
      return new Response(
        JSON.stringify({ 
          error: 'Only web-url and api sources can be refreshed',
          sourceType: source.type
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!source.sourceUrl) {
      return new Response(
        JSON.stringify({ error: 'Source URL not found' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log(`🔄 Manual refresh requested for: ${source.name}`);
    console.log(`   Type: ${source.type}`);
    console.log(`   URL: ${source.sourceUrl}`);
    console.log(`   User: ${session.email}`);

    const now = new Date();

    // Update status to processing
    await sourceDoc.ref.update({
      status: 'processing',
      'metadata.refreshingBy': session.email,
      'metadata.refreshStartTime': now
    });

    try {
      // Extract fresh content
      let freshContent = '';
      let extractionMetadata: any = {};

      if (source.type === 'web-url') {
        // For web URLs, use the extract-url API
        const extractResponse = await fetch(
          `${new URL(request.url).origin}/api/extract-url`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              url: source.sourceUrl,
              model: 'gemini-2.5-flash'
            })
          }
        );

        if (!extractResponse.ok) {
          throw new Error('Failed to extract content from URL');
        }

        const extractData = await extractResponse.json();
        freshContent = extractData.extractedText || '';
        extractionMetadata = {
          charactersExtracted: freshContent.length,
          tokensEstimate: Math.floor(freshContent.length / 4),
          model: 'gemini-2.5-flash',
          extractionTime: extractData.extractionTime
        };
        
      } else if (source.type === 'api') {
        // For API sources, fetch directly
        const apiResponse = await fetch(source.sourceUrl);
        
        if (!apiResponse.ok) {
          throw new Error(`API returned ${apiResponse.status}: ${apiResponse.statusText}`);
        }
        
        const contentType = apiResponse.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          const jsonData = await apiResponse.json();
          freshContent = JSON.stringify(jsonData, null, 2);
        } else {
          freshContent = await apiResponse.text();
        }
        
        extractionMetadata = {
          charactersExtracted: freshContent.length,
          tokensEstimate: Math.floor(freshContent.length / 4),
          contentType,
          apiStatus: apiResponse.status
        };
      }

      // Detect changes
      const oldContent = source.extractedData || '';
      const hasChanged = freshContent !== oldContent;
      const bytesChanged = Math.abs(freshContent.length - oldContent.length);

      console.log(`📊 Extraction complete:`);
      console.log(`   Characters: ${freshContent.length}`);
      console.log(`   Changed: ${hasChanged ? 'Yes' : 'No'}`);
      if (hasChanged) {
        console.log(`   Bytes changed: ${bytesChanged}`);
      }

      // Prepare update
      const updates: any = {
        status: 'active',
        'freshness.lastRefreshed': now,
        'freshness.changeDetected': hasChanged,
        'metadata.extractionDate': now,
        'metadata.refreshingBy': null,
        'metadata.refreshStartTime': null,
        ...extractionMetadata
      };

      if (hasChanged) {
        // Content changed - create new version
        const currentVersion = source.currentVersion || 0;
        const newVersion = currentVersion + 1;

        // Store old version
        const oldVersion = {
          version: currentVersion,
          extractedAt: source.metadata?.extractionDate || now,
          extractedData: oldContent,
          metadata: source.metadata || {}
        };

        const existingVersions = source.versions || [];
        
        // Keep only last 10 versions
        const updatedVersions = [...existingVersions.slice(-9), oldVersion];

        updates.versions = updatedVersions;
        updates.extractedData = freshContent;
        updates.currentVersion = newVersion;
        updates['freshness.lastChangeDate'] = now;

        console.log(`✅ Content changed - creating version ${newVersion}`);
      } else {
        console.log(`ℹ️ Content unchanged - keeping current version`);
      }

      // Update refresh history
      const refreshEntry = {
        timestamp: now,
        success: true,
        changesDetected: hasChanged,
        bytesChanged: hasChanged ? bytesChanged : 0,
        triggeredBy: session.email,
        triggerType: 'manual'
      };

      const refreshHistory = source.freshness?.refreshHistory || [];
      updates['freshness.refreshHistory'] = [
        ...refreshHistory.slice(-9), // Keep last 10
        refreshEntry
      ];

      // Apply updates
      await sourceDoc.ref.update(updates);

      console.log(`✅ Refresh complete for: ${source.name}`);

      return new Response(
        JSON.stringify({
          success: true,
          sourceId,
          sourceName: source.name,
          hasChanged,
          bytesChanged: hasChanged ? bytesChanged : 0,
          newVersion: hasChanged ? updates.currentVersion : source.currentVersion || 0,
          extractionMetadata,
          message: hasChanged 
            ? `Content updated successfully (v${updates.currentVersion})`
            : 'Content is up to date (no changes detected)'
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );

    } catch (error) {
      console.error(`❌ Refresh failed for ${source.name}:`, error);

      // Log failure
      const failureEntry = {
        timestamp: now,
        success: false,
        changesDetected: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        triggeredBy: session.email,
        triggerType: 'manual'
      };

      const refreshHistory = source.freshness?.refreshHistory || [];

      // Update with failure status
      await sourceDoc.ref.update({
        status: 'error',
        'error.message': error instanceof Error ? error.message : 'Refresh failed',
        'error.timestamp': now,
        'freshness.lastRefreshed': now,
        'freshness.refreshHistory': [
          ...refreshHistory.slice(-9),
          failureEntry
        ],
        'metadata.refreshingBy': null,
        'metadata.refreshStartTime': null
      });

      return new Response(
        JSON.stringify({
          success: false,
          error: error instanceof Error ? error.message : 'Refresh failed',
          sourceId,
          sourceName: source.name
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

  } catch (error) {
    console.error('❌ Refresh API error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};

