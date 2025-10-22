import type { APIRoute } from 'astro';
import { getSession } from '../../lib/auth';
import { firestore } from '../../lib/firestore';

// Gemini API Pricing (Official rates as of 2025)
const PROVIDER_PRICING = {
  'gemini-2.5-flash': {
    name: 'Gemini 2.5 Flash',
    provider: 'Google',
    input: 0.30,  // $0.30 per 1M tokens
    output: 2.50, // $2.50 per 1M tokens
    contextCache: 0.03, // $0.03 per 1M tokens
    contextCacheStorage: 1.00, // $1.00 per 1M tokens per hour
  },
  'gemini-2.5-pro': {
    name: 'Gemini 2.5 Pro',
    provider: 'Google',
    // Tiered pricing based on prompt size
    inputUnder200k: 1.25,  // $1.25 per 1M tokens (prompts <= 200k)
    inputOver200k: 2.50,   // $2.50 per 1M tokens (prompts > 200k)
    outputUnder200k: 10.00, // $10.00 per 1M tokens
    outputOver200k: 15.00,  // $15.00 per 1M tokens
    contextCache: 0.125,    // $0.125 per 1M tokens
    contextCacheStorage: 4.50, // $4.50 per 1M tokens per hour
  },
  'gemini-2.0-flash': {
    name: 'Gemini 2.0 Flash',
    provider: 'Google',
    input: 0.10,  // $0.10 per 1M tokens
    output: 0.40, // $0.40 per 1M tokens
    contextCache: 0.025,
    contextCacheStorage: 1.00,
  },
} as const;

// Calculate cost based on actual pricing tiers
function calculateTransactionCost(
  model: string,
  inputTokens: number,
  outputTokens: number,
  contextTokens: number = 0
): { inputCost: number; outputCost: number; totalCost: number; breakdown: any } {
  const modelKey = model as keyof typeof PROVIDER_PRICING;
  const pricing = PROVIDER_PRICING[modelKey] || PROVIDER_PRICING['gemini-2.5-flash'];
  
  let inputCost = 0;
  let outputCost = 0;
  let breakdown: any = {
    model: pricing.name,
    provider: pricing.provider,
  };
  
  if (model === 'gemini-2.5-pro') {
    // Use tiered pricing for Pro
    const proPricing = pricing as typeof PROVIDER_PRICING['gemini-2.5-pro'];
    const isLargePrompt = inputTokens > 200_000;
    const inputRate = isLargePrompt ? proPricing.inputOver200k : proPricing.inputUnder200k;
    const outputRate = isLargePrompt ? proPricing.outputOver200k : proPricing.outputUnder200k;
    
    inputCost = (inputTokens / 1_000_000) * inputRate;
    outputCost = (outputTokens / 1_000_000) * outputRate;
    
    breakdown.inputRate = `$${inputRate}/1M (${isLargePrompt ? '>200k' : '≤200k'})`;
    breakdown.outputRate = `$${outputRate}/1M (${isLargePrompt ? '>200k' : '≤200k'})`;
  } else {
    // Simple pricing for Flash models
    const flashPricing = pricing as typeof PROVIDER_PRICING['gemini-2.5-flash'];
    inputCost = (inputTokens / 1_000_000) * flashPricing.input;
    outputCost = (outputTokens / 1_000_000) * flashPricing.output;
    
    breakdown.inputRate = `$${flashPricing.input}/1M`;
    breakdown.outputRate = `$${flashPricing.output}/1M`;
  }
  
  breakdown.inputTokens = inputTokens;
  breakdown.outputTokens = outputTokens;
  breakdown.contextTokens = contextTokens;
  breakdown.inputCost = inputCost;
  breakdown.outputCost = outputCost;
  
  return {
    inputCost,
    outputCost,
    totalCost: inputCost + outputCost,
    breakdown,
  };
}

export const GET: APIRoute = async (context) => {
  const { request, cookies } = context;
  
  try {
    // Verify authentication
    const session = getSession(context);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    if (!userId || session.id !== userId) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
    }

    console.log('📊 Loading agent metrics for user:', userId);

    // Load all conversations for this user, then filter for agents in memory
    // NOTE: Once Firestore index is ready, we can use a compound query
    // For now, filter client-side to avoid index requirement
    const conversationsSnapshot = await firestore
      .collection('conversations')
      .where('userId', '==', userId)
      .orderBy('lastMessageAt', 'desc')
      .get();
    
    // Filter to ONLY agents (isAgent: true) in memory
    const agentDocs = conversationsSnapshot.docs.filter(doc => {
      const data = doc.data();
      // Include if explicitly marked as agent, or if not marked (legacy behavior)
      // Exclude if explicitly marked as conversation (isAgent: false)
      return data.isAgent !== false;
    });

    console.log(`📊 Found ${conversationsSnapshot.docs.length} total, ${agentDocs.length} agents (isAgent !== false)`);

    const agentMetrics = await Promise.all(
      agentDocs.map(async (convDoc) => {
        const conv = convDoc.data();
        const agentId = convDoc.id;

        // Load messages for this agent
        const messagesSnapshot = await firestore
          .collection('messages')
          .where('conversationId', '==', agentId)
          .orderBy('timestamp', 'asc')
          .get();

        const messages = messagesSnapshot.docs.map(doc => doc.data());

        // Load context sources for this agent
        const contextSnapshot = await firestore
          .collection('conversation_context')
          .doc(agentId)
          .get();
        
        const activeContextIds = contextSnapshot.exists 
          ? (contextSnapshot.data()?.activeContextSourceIds || [])
          : [];

        // Load setup doc if exists
        const setupDocSnapshot = await firestore
          .collection('agent_setup_docs')
          .doc(agentId)
          .get();

        const setupDoc = setupDocSnapshot.exists ? setupDocSnapshot.data() : null;

        // Calculate detailed metrics with context tracing
        const transactionDetails: Array<{
          date: Date;
          messageId: string;
          userMessage: string;
          aiResponse: string;
          inputTokens: number;
          outputTokens: number;
          contextTokens: number;
          contextSources: string[];
          cost: number;
          breakdown: any;
        }> = [];

        let totalInputTokens = 0;
        let totalOutputTokens = 0;
        let totalContextTokens = 0;
        let totalCost = 0;

        // Process messages in pairs (user + assistant)
        for (let i = 0; i < messages.length; i += 2) {
          const userMsg = messages[i];
          const aiMsg = messages[i + 1];
          
          if (!userMsg || !aiMsg) continue;

          // Extract token counts from message metadata or estimate
          const userContent = typeof userMsg.content === 'string' 
            ? userMsg.content 
            : userMsg.content?.text || JSON.stringify(userMsg.content);
          const aiContent = typeof aiMsg.content === 'string' 
            ? aiMsg.content 
            : aiMsg.content?.text || JSON.stringify(aiMsg.content);

          // Estimate tokens (1 token ≈ 4 characters)
          const inputTokens = Math.ceil(userContent.length / 4);
          const outputTokens = Math.ceil(aiContent.length / 4);
          
          // Context tokens from contextSections if available
          const contextSections = aiMsg.contextSections || [];
          const contextTokens = contextSections.reduce((sum: number, section: any) => 
            sum + (section.tokenCount || 0), 0);

          const contextSourceNames = contextSections.map((s: any) => s.name);

          totalInputTokens += inputTokens;
          totalOutputTokens += outputTokens;
          totalContextTokens += contextTokens;

          // Calculate cost for this transaction
          const costCalc = calculateTransactionCost(
            conv.agentModel || 'gemini-2.5-flash',
            inputTokens + contextTokens, // Input includes context
            outputTokens,
            contextTokens
          );

          totalCost += costCalc.totalCost;

          transactionDetails.push({
            date: userMsg.timestamp?.toDate() || new Date(),
            messageId: aiMsg.id || `msg-${i}`,
            userMessage: userContent.substring(0, 100),
            aiResponse: aiContent.substring(0, 100),
            inputTokens,
            outputTokens,
            contextTokens,
            contextSources: contextSourceNames,
            cost: costCalc.totalCost,
            breakdown: costCalc.breakdown,
          });
        }

        // Group by date for daily metrics
        const usageByDate = new Map<string, {
          inputTokens: number;
          outputTokens: number;
          contextTokens: number;
          cost: number;
          transactionCount: number;
        }>();

        transactionDetails.forEach(tx => {
          const dateKey = tx.date.toISOString().split('T')[0];
          const existing = usageByDate.get(dateKey) || {
            inputTokens: 0,
            outputTokens: 0,
            contextTokens: 0,
            cost: 0,
            transactionCount: 0,
          };
          
          existing.inputTokens += tx.inputTokens;
          existing.outputTokens += tx.outputTokens;
          existing.contextTokens += tx.contextTokens;
          existing.cost += tx.cost;
          existing.transactionCount += 1;
          
          usageByDate.set(dateKey, existing);
        });

        const usageHistory = Array.from(usageByDate.entries()).map(([dateStr, data]) => ({
          date: dateStr,
          ...data,
        })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        return {
          agentId,
          agentTitle: conv.title,
          model: conv.agentModel || 'gemini-2.5-flash',
          conversationCount: 1,
          totalMessages: messages.length,
          totalInputTokens,
          totalOutputTokens,
          totalContextTokens,
          totalCost,
          contextSourcesCount: activeContextIds.length,
          usersWithAccess: [userId], // TODO: Load from sharing rules
          createdAt: conv.createdAt?.toDate() || new Date(),
          lastActivityAt: conv.lastMessageAt?.toDate() || conv.createdAt?.toDate() || new Date(),
          setupDoc: setupDoc ? {
            fileName: setupDoc.fileName,
            uploadedAt: setupDoc.uploadedAt?.toDate() || new Date(),
            uploadedBy: setupDoc.uploadedBy,
            extractedData: setupDoc.extractedData,
            agentPurpose: setupDoc.agentPurpose,
            setupInstructions: setupDoc.setupInstructions,
            inputExamples: setupDoc.inputExamples || [],
            correctOutputs: setupDoc.correctOutputs || [],
            incorrectOutputs: setupDoc.incorrectOutputs || [],
            domainExpert: setupDoc.domainExpert || {},
          } : undefined,
          qualityMetrics: setupDoc?.qualityMetrics ? {
            overallScore: setupDoc.qualityMetrics.overallScore || 0,
            lastEvaluatedAt: setupDoc.qualityMetrics.lastEvaluatedAt?.toDate() || new Date(),
            evaluationCount: setupDoc.qualityMetrics.evaluationCount || 0,
            accuracyScore: setupDoc.qualityMetrics.accuracyScore || 0,
            responseTimeAvg: setupDoc.qualityMetrics.responseTimeAvg || 0,
            userSatisfaction: setupDoc.qualityMetrics.userSatisfaction || 0,
            evaluationHistory: setupDoc.qualityMetrics.evaluationHistory || [],
          } : undefined,
          usageHistory,
          transactionDetails, // Full trace for transparency
          pricingModel: PROVIDER_PRICING[conv.agentModel as keyof typeof PROVIDER_PRICING] || PROVIDER_PRICING['gemini-2.5-flash'],
        };
      })
    );

    console.log('✅ Loaded metrics for', agentMetrics.length, 'agents');

    return new Response(JSON.stringify({
      agents: agentMetrics,
      pricingReference: PROVIDER_PRICING,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Error loading agent metrics:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to load agent metrics',
      details: error instanceof Error ? error.message : 'Unknown error',
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

