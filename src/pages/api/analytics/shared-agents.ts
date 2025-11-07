/**
 * Shared Agents Analytics API
 * 
 * Provides comprehensive analytics on shared agent usage:
 * - Agent-level metrics (queries, users, ROI)
 * - User-level metrics (who uses what)
 * - Quality metrics (reference success rates)
 * - Traceability data (admin vs user comparison)
 * 
 * GET /api/analytics/shared-agents
 */

import type { APIRoute } from 'astro';
import { firestore, COLLECTIONS } from '../../../lib/firestore';

export const GET: APIRoute = async ({ request }) => {
  try {
    console.log('📊 Loading shared agents analytics...');

    // 1. Get all agent shares
    const sharesSnapshot = await firestore
      .collection(COLLECTIONS.AGENT_SHARES)
      .where('isActive', '==', true)
      .get();

    console.log(`   Found ${sharesSnapshot.size} active shares`);

    // 2. Group by agent
    const agentSharesMap = new Map<string, any[]>();
    sharesSnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (!agentSharesMap.has(data.agentId)) {
        agentSharesMap.set(data.agentId, []);
      }
      agentSharesMap.get(data.agentId)!.push({
        ...data,
        id: doc.id
      });
    });

    console.log(`   ${agentSharesMap.size} unique agents with shares`);

    // 3. Get all messages with shared access metadata
    const messagesSnapshot = await firestore
      .collection(COLLECTIONS.MESSAGES)
      .where('role', '==', 'assistant')
      .orderBy('timestamp', 'desc')
      .limit(5000) // Last 5000 messages for analysis
      .get();

    console.log(`   Analyzing ${messagesSnapshot.size} messages...`);

    // 4. Analyze each shared agent
    const agentStats: any[] = [];
    
    for (const [agentId, shares] of agentSharesMap.entries()) {
      // Get agent details
      const agentDoc = await firestore.collection(COLLECTIONS.CONVERSATIONS).doc(agentId).get();
      if (!agentDoc.exists) continue;
      
      const agentData = agentDoc.data();
      
      // Get owner details
      const ownerDoc = await firestore.collection(COLLECTIONS.USERS).doc(agentData.userId).get();
      const ownerEmail = ownerDoc.exists ? ownerDoc.data()?.email : 'unknown';

      // Count unique users and domains
      const uniqueUsers = new Set<string>();
      const domains = new Set<string>();
      const accessLevels = { view: 0, use: 0, admin: 0 };

      shares.forEach(share => {
        share.sharedWith.forEach((target: any) => {
          if (target.type === 'user') {
            uniqueUsers.add(target.id);
            if (target.domain) domains.add(target.domain);
          }
        });
        
        if (share.accessLevel === 'view') accessLevels.view++;
        else if (share.accessLevel === 'use') accessLevels.use++;
        else if (share.accessLevel === 'admin') accessLevels.admin++;
      });

      // Analyze messages for this agent
      const agentMessages = messagesSnapshot.docs.filter(doc => {
        const data = doc.data();
        return data.conversationId === agentId || 
               (data.conversationId && data.conversationId.includes) && 
               data.conversationId.includes(agentId);
      });

      // Calculate metrics
      let ownerQueries = 0;
      let sharedQueries = 0;
      let totalReferences = 0;
      let referencesSucceeded = 0; // RAG chunks
      let referencesFailed = 0;    // Full docs or emergency
      let totalSimilarity = 0;
      let similarityCount = 0;

      const sourceUsage = new Map<string, { count: number; similarity: number[] }>();

      const now = Date.now();
      const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);
      const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
      let queriesLast7Days = 0;
      let queriesLast30Days = 0;

      agentMessages.forEach(doc => {
        const data = doc.data();
        const msgTime = data.timestamp?.toDate?.()?.getTime() || 0;

        // Time-based counting
        if (msgTime > sevenDaysAgo) queriesLast7Days++;
        if (msgTime > thirtyDaysAgo) queriesLast30Days++;

        // Owner vs shared
        if (data.sharedAccessMetadata?.accessType === 'shared') {
          sharedQueries++;
        } else if (data.userId === agentData.userId) {
          ownerQueries++;
        }

        // References analysis
        const refs = data.references || [];
        totalReferences += refs.length;

        if (refs.length > 0) {
          // Check if RAG chunks or full documents
          const hasRAGChunks = refs.some((r: any) => r.metadata?.isRAGChunk === true);
          const hasFullDocs = refs.some((r: any) => r.metadata?.isFullDocument === true);
          const hasRealChunks = refs.some((r: any) => r.chunkIndex >= 0);

          if (hasRAGChunks || hasRealChunks) {
            referencesSucceeded++;
          } else if (hasFullDocs) {
            referencesFailed++;
          }

          // Calculate average similarity
          refs.forEach((ref: any) => {
            if (ref.similarity !== undefined && ref.similarity > 0.3) {
              totalSimilarity += ref.similarity;
              similarityCount++;
            }

            // Track source usage
            if (ref.sourceName) {
              if (!sourceUsage.has(ref.sourceName)) {
                sourceUsage.set(ref.sourceName, { count: 0, similarity: [] });
              }
              const usage = sourceUsage.get(ref.sourceName)!;
              usage.count++;
              if (ref.similarity !== undefined) {
                usage.similarity.push(ref.similarity);
              }
            }
          });
        } else {
          referencesFailed++; // No references at all
        }
      });

      // Calculate top sources
      const topSources = Array.from(sourceUsage.entries())
        .map(([name, data]) => ({
          name,
          timesReferenced: data.count,
          avgSimilarity: data.similarity.length > 0
            ? (data.similarity.reduce((a, b) => a + b, 0) / data.similarity.length) * 100
            : 0
        }))
        .sort((a, b) => b.timesReferenced - a.timesReferenced)
        .slice(0, 10);

      // Calculate costs (estimates)
      const indexingCost = 5.85; // Estimated cost to index 117 sources
      const queryCost = (ownerQueries + sharedQueries) * 0.01; // $0.01 per query estimate
      const costPerQuery = queryCost / (ownerQueries + sharedQueries) || 0;
      const roi = uniqueUsers.size > 0 ? uniqueUsers.size : 1; // ROI multiplier

      agentStats.push({
        agentId,
        agentName: agentData.title || 'Untitled',
        ownerId: agentData.userId,
        ownerEmail,
        
        totalShares: shares.length,
        activeUsers: uniqueUsers.size,
        domains: Array.from(domains),
        accessLevels,
        
        totalQueries: ownerQueries + sharedQueries,
        queriesLast7Days,
        queriesLast30Days,
        avgQueriesPerUser: uniqueUsers.size > 0 ? sharedQueries / uniqueUsers.size : 0,
        
        totalReferences,
        referencesSucceeded,
        referencesFailed,
        referenceSuccessRate: totalReferences > 0 
          ? (referencesSucceeded / (referencesSucceeded + referencesFailed)) * 100
          : 0,
        avgSimilarity: similarityCount > 0 ? (totalSimilarity / similarityCount) * 100 : 0,
        
        ownerQueries,
        sharedQueries,
        
        topSources,
        
        indexingCost,
        queryCost,
        costPerQuery,
        roi
      });
    }

    // 5. Analyze users with shared access
    const userStatsMap = new Map<string, any>();

    messagesSnapshot.docs.forEach(doc => {
      const data = doc.data();
      
      // Only count messages with shared access
      if (data.sharedAccessMetadata?.accessType === 'shared') {
        const userId = data.userId;
        
        if (!userStatsMap.has(userId)) {
          userStatsMap.set(userId, {
            userId,
            userEmail: data.userEmail || 'unknown',
            domain: data.userEmail ? data.userEmail.split('@')[1] : 'unknown',
            sharedAgentsAccessed: new Set(),
            totalQueries: 0,
            uniqueSourcesAccessed: new Set(),
            similarities: [],
            referenceCounts: [],
            firstAccess: data.timestamp,
            lastAccess: data.timestamp,
            queriesLast7Days: 0
          });
        }

        const stats = userStatsMap.get(userId)!;
        stats.totalQueries++;
        stats.sharedAgentsAccessed.add(data.conversationId);

        const msgTime = data.timestamp?.toDate?.()?.getTime() || 0;
        if (msgTime > now - (7 * 24 * 60 * 60 * 1000)) {
          stats.queriesLast7Days++;
        }

        if (data.timestamp < stats.firstAccess) stats.firstAccess = data.timestamp;
        if (data.timestamp > stats.lastAccess) stats.lastAccess = data.timestamp;

        // Track references
        const refs = data.references || [];
        stats.referenceCounts.push(refs.length);
        
        refs.forEach((ref: any) => {
          if (ref.sourceName) stats.uniqueSourcesAccessed.add(ref.sourceName);
          if (ref.similarity !== undefined && ref.similarity > 0.3) {
            stats.similarities.push(ref.similarity);
          }
        });
      }
    });

    // Convert to array and calculate aggregates
    const userStats = Array.from(userStatsMap.values()).map(stats => ({
      userId: stats.userId,
      userEmail: stats.userEmail,
      domain: stats.domain,
      sharedAgentsAccessed: stats.sharedAgentsAccessed.size,
      totalQueries: stats.totalQueries,
      uniqueSourcesAccessed: stats.uniqueSourcesAccessed.size,
      avgSimilarity: stats.similarities.length > 0
        ? (stats.similarities.reduce((a: number, b: number) => a + b, 0) / stats.similarities.length) * 100
        : 0,
      referenceSuccessRate: stats.referenceCounts.length > 0
        ? (stats.referenceCounts.filter((c: number) => c > 0).length / stats.referenceCounts.length) * 100
        : 0,
      topAgent: { name: 'N/A', queries: 0 }, // Would need more complex logic
      topSource: { name: 'N/A', references: 0 }, // Would need more complex logic
      firstAccess: stats.firstAccess?.toDate?.() || new Date(),
      lastAccess: stats.lastAccess?.toDate?.() || new Date(),
      queriesLast7Days: stats.queriesLast7Days
    }));

    // 6. Calculate overall quality metrics
    let ownerMessagesTotal = 0;
    let ownerMessagesWithRefs = 0;
    let ownerRefCount = 0;
    let ownerSimilarities: number[] = [];

    let sharedMessagesTotal = 0;
    let sharedMessagesWithRefs = 0;
    let sharedRefCount = 0;
    let sharedSimilarities: number[] = [];

    let ragChunks = 0;
    let fullDocuments = 0;
    let noReferences = 0;

    const failureReasonsMap = new Map<string, number>();

    messagesSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const refs = data.references || [];
      const isShared = data.sharedAccessMetadata?.accessType === 'shared';

      if (isShared) {
        sharedMessagesTotal++;
        if (refs.length > 0) {
          sharedMessagesWithRefs++;
          sharedRefCount += refs.length;
        }
      } else {
        ownerMessagesTotal++;
        if (refs.length > 0) {
          ownerMessagesWithRefs++;
          ownerRefCount += refs.length;
        }
      }

      // Categorize by search method
      if (refs.length === 0) {
        noReferences++;
        
        // Try to determine why no references
        if (!data.context || data.context.length === 0) {
          failureReasonsMap.set('No context sources assigned', 
            (failureReasonsMap.get('No context sources assigned') || 0) + 1);
        } else {
          failureReasonsMap.set('RAG search failed (unknown reason)', 
            (failureReasonsMap.get('RAG search failed (unknown reason)') || 0) + 1);
        }
      } else {
        const hasRAGChunks = refs.some((r: any) => r.metadata?.isRAGChunk === true);
        const hasFullDocs = refs.some((r: any) => r.metadata?.isFullDocument === true);
        const hasRealChunks = refs.some((r: any) => r.chunkIndex >= 0);

        if (hasRAGChunks || hasRealChunks) {
          ragChunks++;
        } else if (hasFullDocs) {
          fullDocuments++;
          failureReasonsMap.set('Documents not indexed (using full documents)', 
            (failureReasonsMap.get('Documents not indexed (using full documents)') || 0) + 1);
        } else {
          failureReasonsMap.set('Unknown reference type', 
            (failureReasonsMap.get('Unknown reference type') || 0) + 1);
        }

        // Track similarities
        refs.forEach((ref: any) => {
          if (ref.similarity !== undefined && ref.similarity > 0.3) {
            if (isShared) {
              sharedSimilarities.push(ref.similarity);
            } else {
              ownerSimilarities.push(ref.similarity);
            }
          }
        });
      }
    });

    // Calculate quality metrics
    const qualityMetrics = {
      totalMessages: messagesSnapshot.size,
      messagesWithReferences: ownerMessagesWithRefs + sharedMessagesWithRefs,
      messagesWithoutReferences: noReferences,
      
      ownerMessages: {
        total: ownerMessagesTotal,
        withRefs: ownerMessagesWithRefs,
        avgRefsPerMessage: ownerMessagesTotal > 0 ? ownerRefCount / ownerMessagesTotal : 0,
        avgSimilarity: ownerSimilarities.length > 0
          ? (ownerSimilarities.reduce((a, b) => a + b, 0) / ownerSimilarities.length) * 100
          : 0,
        successRate: ownerMessagesTotal > 0
          ? (ownerMessagesWithRefs / ownerMessagesTotal) * 100
          : 0
      },
      
      sharedMessages: {
        total: sharedMessagesTotal,
        withRefs: sharedMessagesWithRefs,
        avgRefsPerMessage: sharedMessagesTotal > 0 ? sharedRefCount / sharedMessagesTotal : 0,
        avgSimilarity: sharedSimilarities.length > 0
          ? (sharedSimilarities.reduce((a, b) => a + b, 0) / sharedSimilarities.length) * 100
          : 0,
        successRate: sharedMessagesTotal > 0
          ? (sharedMessagesWithRefs / sharedMessagesTotal) * 100
          : 0
      },
      
      ragChunks,
      fullDocuments,
      noReferences,
      
      failureReasons: Array.from(failureReasonsMap.entries())
        .map(([reason, count]) => ({
          reason,
          count,
          percentage: (count / noReferences) * 100
        }))
        .sort((a, b) => b.count - a.count)
    };

    console.log('✅ Analytics calculated');
    console.log(`   Agents: ${agentStats.length}`);
    console.log(`   Users: ${userStats.length}`);
    console.log(`   Quality: ${qualityMetrics.ragChunks} RAG, ${qualityMetrics.fullDocuments} fallback`);

    return new Response(
      JSON.stringify({
        agents: agentStats,
        users: userStats,
        quality: qualityMetrics,
        generatedAt: new Date().toISOString()
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('❌ Error loading shared agents analytics:', error);
    
    return new Response(
      JSON.stringify({
        error: 'Failed to load analytics',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};

