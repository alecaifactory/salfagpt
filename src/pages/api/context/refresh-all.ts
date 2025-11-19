import type { APIRoute } from 'astro';
import { firestore, COLLECTIONS } from '../../../lib/firestore';

/**
 * POST /api/context/refresh-all
 * Automatic context refresh endpoint (called by Cloud Scheduler)
 * Refreshes all web/API sources that are due for update
 */
export const POST: APIRoute = async ({ request }) => {
  console.log('🔄 Starting automatic context refresh...');
  
  try {
    // Verify request is from Cloud Scheduler (check for authorization header)
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Cloud Scheduler only' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Find sources due for refresh
    const now = new Date();
    const staleSources = await firestore
      .collection(COLLECTIONS.CONTEXT_SOURCES)
      .where('type', 'in', ['web-url', 'api'])
      .where('freshness.autoRefreshEnabled', '==', true)
      .where('freshness.nextRefreshDue', '<=', now)
      .limit(100) // Batch size
      .get();
    
    console.log(`📋 Found ${staleSources.size} sources to refresh`);
    
    const results = {
      total: staleSources.size,
      success: 0,
      failed: 0,
      unchanged: 0,
      updated: 0,
      sources: [] as string[]
    };
    
    for (const doc of staleSources.docs) {
      const source = doc.data();
      
      try {
        console.log(`🔄 Refreshing: ${source.name} (${source.type})`);
        
        // Extract fresh content
        let freshContent = '';
        
        if (source.type === 'web-url' && source.sourceUrl) {
          // For web URLs, re-extract content
          const response = await fetch(`/api/extract-url`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              url: source.sourceUrl,
              model: 'gemini-2.5-flash' // Use Flash for cost efficiency
            })
          });
          
          if (response.ok) {
            const data = await response.json();
            freshContent = data.extractedText || '';
          }
        } else if (source.type === 'api' && source.sourceUrl) {
          // For API sources, fetch fresh data
          const apiResponse = await fetch(source.sourceUrl);
          if (apiResponse.ok) {
            freshContent = await apiResponse.text();
          }
        }
        
        // Detect changes
        const hasChanged = freshContent !== (source.extractedData || '');
        
        // Prepare update
        const updates: any = {
          'freshness.lastRefreshed': now,
          'freshness.nextRefreshDue': calculateNextRefresh(
            source.freshness?.refreshSchedule || 'daily'
          ),
          'freshness.changeDetected': hasChanged,
        };
        
        if (hasChanged && freshContent) {
          // Content changed - create new version
          const currentVersion = source.currentVersion || 0;
          const newVersion = currentVersion + 1;
          
          // Store old version in history
          const oldVersion = {
            version: currentVersion,
            extractedAt: source.metadata?.extractionDate || now,
            extractedData: source.extractedData || '',
            metadata: source.metadata || {}
          };
          
          const existingVersions = source.versions || [];
          
          // Keep only last 10 versions to save storage
          const updatedVersions = [...existingVersions.slice(-9), oldVersion];
          
          updates.versions = updatedVersions;
          updates.extractedData = freshContent;
          updates.currentVersion = newVersion;
          updates['freshness.lastChangeDate'] = now;
          updates['metadata.extractionDate'] = now;
          updates['metadata.charactersExtracted'] = freshContent.length;
          
          console.log(
            `✅ Updated ${source.name} (v${currentVersion} → v${newVersion})`
          );
          results.updated++;
        } else {
          console.log(`ℹ️ No changes for ${source.name}`);
          results.unchanged++;
        }
        
        // Log refresh history
        const refreshEntry = {
          timestamp: now,
          success: true,
          changesDetected: hasChanged,
          bytesChanged: hasChanged 
            ? Math.abs(freshContent.length - (source.extractedData?.length || 0))
            : 0
        };
        
        const refreshHistory = source.freshness?.refreshHistory || [];
        updates['freshness.refreshHistory'] = [
          ...refreshHistory.slice(-9), // Keep last 10
          refreshEntry
        ];
        
        // Update Firestore
        await doc.ref.update(updates);
        results.success++;
        results.sources.push(source.name);
        
      } catch (error) {
        console.error(`❌ Failed to refresh ${source.name}:`, error);
        
        // Log failure
        const failureEntry = {
          timestamp: now,
          success: false,
          changesDetected: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
        
        const refreshHistory = source.freshness?.refreshHistory || [];
        
        await doc.ref.update({
          'freshness.lastRefreshed': now,
          'freshness.nextRefreshDue': calculateNextRefresh(
            source.freshness?.refreshSchedule || 'daily'
          ),
          'freshness.refreshHistory': [
            ...refreshHistory.slice(-9),
            failureEntry
          ]
        });
        
        results.failed++;
      }
    }
    
    console.log('🎯 Refresh complete:', results);
    
    return new Response(
      JSON.stringify({
        success: true,
        results,
        message: `Refreshed ${results.success}/${results.total} sources. ${results.updated} updated, ${results.unchanged} unchanged, ${results.failed} failed.`
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
    
  } catch (error) {
    console.error('❌ Refresh job failed:', error);
    
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

/**
 * Calculate next refresh date based on schedule
 */
function calculateNextRefresh(schedule: string): Date {
  const now = new Date();
  
  switch (schedule) {
    case 'daily':
      // Next day at 2 AM
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(2, 0, 0, 0);
      return tomorrow;
      
    case 'weekly':
      // Next Monday at 2 AM
      const nextMonday = new Date(now);
      const daysUntilMonday = (8 - nextMonday.getDay()) % 7 || 7;
      nextMonday.setDate(nextMonday.getDate() + daysUntilMonday);
      nextMonday.setHours(2, 0, 0, 0);
      return nextMonday;
      
    case 'monthly':
      // First day of next month at 2 AM
      const nextMonth = new Date(now);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      nextMonth.setDate(1);
      nextMonth.setHours(2, 0, 0, 0);
      return nextMonth;
      
    default:
      // Default to daily
      const defaultTomorrow = new Date(now);
      defaultTomorrow.setDate(defaultTomorrow.getDate() + 1);
      defaultTomorrow.setHours(2, 0, 0, 0);
      return defaultTomorrow;
  }
}

