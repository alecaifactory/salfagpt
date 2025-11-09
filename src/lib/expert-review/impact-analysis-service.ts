// Impact Analysis Service
// Created: 2025-11-09
// Purpose: Analyze domain-wide impact of proposed corrections

import { GoogleGenAI } from '@google/genai';
import { firestore } from '../firestore';
import type { ImpactAnalysis, CorrectionProposal } from '../../types/expert-review';

const genAI = new GoogleGenAI({ 
  apiKey: process.env.GOOGLE_AI_API_KEY || '' 
});

/**
 * Analyze potential impact of applying a correction
 * Predicts domain-wide improvement, ROI, and risks
 * 
 * @param ticketId - Ticket being analyzed
 * @param correctionProposal - Proposed correction
 * @param domainId - Domain where correction applies
 * @returns Complete impact analysis
 */
export async function analyzeCorrectionImpact(
  ticketId: string,
  correctionProposal: CorrectionProposal,
  domainId: string
): Promise<ImpactAnalysis> {
  
  console.log('📊 Analyzing correction impact for domain:', domainId);
  
  try {
    // 1. Find similar questions in domain
    const similarInteractions = await findSimilarInteractions(
      correctionProposal.correctedText,
      domainId,
      100 // Limit
    );
    
    console.log(`   Found ${similarInteractions.length} similar interactions in domain`);
    
    // 2. Get current ratings for similar questions
    const currentRatings = similarInteractions.map(i => i.rating || 3);
    const avgCurrentRating = average(currentRatings);
    
    // 3. Extract affected users
    const affectedUserIds = Array.from(new Set(similarInteractions.map(i => i.userId)));
    
    // 4. Identify affected agents in domain
    const affectedAgents = await getAffectedAgents(
      correctionProposal,
      domainId
    );
    
    // 5. AI-powered improvement prediction
    const aiPrediction = await predictQualityImprovement(
      currentRatings,
      correctionProposal,
      similarInteractions.length
    );
    
    // 6. Calculate domain ROI
    const domainROI = await calculateDomainROI(
      domainId,
      similarInteractions.length,
      aiPrediction.improvementRate
    );
    
    // 7. Risk assessment
    const riskAnalysis = assessImplementationRisk(
      correctionProposal,
      affectedAgents.affected.length,
      domainId
    );
    
    // 8. Strategy alignment (if domain has OKRs)
    const strategyAlignment = await analyzeStrategyAlignment(
      correctionProposal,
      domainId
    );
    
    const analysis: ImpactAnalysis = {
      // Quantitative
      similarQuestionsCount: similarInteractions.length,
      affectedUsersCount: affectedUserIds.length,
      averageCurrentRating: avgCurrentRating,
      projectedRatingImprovement: aiPrediction.improvementPercentage,
      
      // Domain metrics
      domainMetrics: {
        domain: domainId,
        totalDomainAgents: affectedAgents.totalInDomain,
        agentsAffected: affectedAgents.affected.length,
        domainUsersAffected: affectedUserIds.length,
        crossAgentImpact: affectedAgents.affected.map(a => ({
          agentId: a.id,
          agentName: a.name,
          similarQuestionsCount: similarInteractions.filter(i => i.agentId === a.id).length,
          currentAvgRating: avgCurrentRating,
          projectedImprovement: aiPrediction.improvementPercentage
        }))
      },
      
      // Scope
      affectedAgents: affectedAgents.affected.map(a => a.id),
      affectedContextSources: [], // TODO: Implement context source detection
      
      // Cost-benefit
      implementationEffort: estimateEffort(correctionProposal),
      estimatedTimeSavings: domainROI.timeSavingsAllAgents,
      costReduction: domainROI.costReductionDomain,
      domainROI,
      
      // Risk
      riskLevel: riskAnalysis.level,
      potentialSideEffects: riskAnalysis.sideEffects,
      testingRequired: riskAnalysis.testingLevel,
      testPlan: riskAnalysis.testPlan,
      
      // Strategy
      strategyAlignment,
      
      // Metadata
      generatedAt: new Date(),
      analysisModel: 'gemini-2.5-pro',
      analysisTokens: aiPrediction.tokensUsed,
      analysisConfidence: aiPrediction.confidence
    };
    
    console.log('✅ Impact analysis complete:', {
      similarQuestions: analysis.similarQuestionsCount,
      improvement: analysis.projectedRatingImprovement,
      roi: analysis.domainROI.paybackPeriod
    });
    
    return analysis;
    
  } catch (error) {
    console.error('❌ Error analyzing impact:', error);
    throw error;
  }
}

/**
 * Find similar interactions using basic text matching
 * TODO: Upgrade to vector similarity with embeddings
 */
async function findSimilarInteractions(
  questionText: string,
  domainId: string,
  limit: number = 100
): Promise<Array<{ userId: string; agentId: string; rating?: number }>> {
  
  // For now, return empty array (will implement with vector search later)
  // This is a placeholder for Step 3 completion
  console.log('📝 [Placeholder] Finding similar interactions in domain:', domainId);
  return [];
}

/**
 * Get affected agents in domain
 */
async function getAffectedAgents(
  proposal: CorrectionProposal,
  domainId: string
): Promise<{ totalInDomain: number; affected: Array<{ id: string; name: string }> }> {
  
  // Get all agents in domain
  const agentsSnapshot = await firestore
    .collection('conversations')
    .where('isAgent', '==', true)
    .get();
  
  const domainAgents = agentsSnapshot.docs
    .map(doc => ({
      id: doc.id,
      name: doc.data().title || 'Unnamed Agent',
      userId: doc.data().userId,
      domain: doc.data().userId // Will get from user email
    }))
    .filter(a => {
      // Filter by domain (simplified - will enhance)
      return true; // TODO: Implement proper domain filtering
    });
  
  // If affects domain prompt, all agents affected
  if (proposal.promptChanges) {
    return {
      totalInDomain: domainAgents.length,
      affected: domainAgents
    };
  }
  
  // If affects specific knowledge, filter agents using that knowledge
  // For now, return subset (will implement proper filtering)
  const affected = domainAgents.slice(0, Math.min(3, domainAgents.length));
  
  return {
    totalInDomain: domainAgents.length,
    affected
  };
}

/**
 * AI predicts quality improvement from correction
 */
async function predictQualityImprovement(
  currentRatings: number[],
  proposal: CorrectionProposal,
  similarCount: number
): Promise<{
  improvementPercentage: number;
  improvementRate: number;
  confidence: number;
  tokensUsed: number;
}> {
  
  if (currentRatings.length === 0) {
    // No historical data, use conservative estimate
    return {
      improvementPercentage: 25,
      improvementRate: 0.25,
      confidence: 60,
      tokensUsed: 0
    };
  }
  
  const avgCurrent = average(currentRatings);
  
  const prompt = `Predice la mejora en calidad al aplicar esta corrección.

DATOS HISTÓRICOS:
- Calificaciones actuales: ${currentRatings.slice(0, 10).join(', ')}${currentRatings.length > 10 ? '...' : ''}
- Promedio actual: ${avgCurrent.toFixed(2)}/5
- Total de interacciones similares: ${similarCount}

CORRECCIÓN PROPUESTA:
Tipo: ${proposal.correctionType}
Texto: "${proposal.correctedText.substring(0, 200)}..."
${proposal.knowledgeUpdates ? `Actualiza ${proposal.knowledgeUpdates.length} documentos` : ''}
${proposal.promptChanges ? 'Modifica el prompt del agente' : ''}

TAREA:
Estima el % de mejora esperado en las calificaciones si aplicamos esta corrección.

Considera:
1. ¿Qué tan clara y completa es la corrección?
2. ¿Incluye información accionable?
3. ¿Tiene referencias verificables?
4. ¿Cubre los casos similares identificados?

RESPONDE SOLO JSON:
{
  "improvementPercentage": 35,
  "improvementRate": 0.35,
  "confidence": 80,
  "reasoning": "Breve explicación..."
}`;

  try {
    const result = await genAI.models.generateContent({
      model: 'gemini-2.5-pro', // Pro for prediction accuracy
      contents: prompt,
      config: {
        temperature: 0.2,
        maxOutputTokens: 500,
        responseMimeType: 'application/json'
      }
    });
    
    const prediction = JSON.parse(result.text || '{}');
    
    return {
      improvementPercentage: prediction.improvementPercentage || 25,
      improvementRate: prediction.improvementRate || 0.25,
      confidence: prediction.confidence || 70,
      tokensUsed: result.usageMetadata?.totalTokenCount || 0
    };
    
  } catch (error) {
    console.error('❌ Error predicting improvement:', error);
    
    // Conservative fallback
    return {
      improvementPercentage: 25,
      improvementRate: 0.25,
      confidence: 60,
      tokensUsed: 0
    };
  }
}

/**
 * Calculate domain-wide ROI
 */
async function calculateDomainROI(
  domainId: string,
  similarQuestionsCount: number,
  improvementRate: number
): Promise<ImpactAnalysis['domainROI']> {
  
  // Get domain stats (simplified for now)
  const monthlyInteractions = 1000; // TODO: Get from actual domain data
  const currentPoorResponseRate = 0.25; // 25% below threshold
  const projectedPoorResponseRate = currentPoorResponseRate * (1 - improvementRate);
  
  // Calculate time savings
  // Assumption: Each poor response costs 5 minutes in follow-ups
  const monthlyPoorResponses = monthlyInteractions * currentPoorResponseRate;
  const projectedMonthlyPoorResponses = monthlyInteractions * projectedPoorResponseRate;
  const responsesSaved = monthlyPoorResponses - projectedMonthlyPoorResponses;
  const timeSavingsMinutes = responsesSaved * 5;
  const timeSavingsHours = timeSavingsMinutes / 60;
  
  // Calculate cost reduction
  // Assumption: $50/hour for user time
  const costReduction = timeSavingsHours * 50;
  
  // Investment: Assume 2-4 hours dev time based on effort
  const investmentHours = 3; // Average
  const investmentCost = investmentHours * 150; // $150/hour dev
  
  // Payback period
  const paybackMonths = investmentCost / costReduction;
  
  return {
    monthlyInteractionsInDomain: monthlyInteractions,
    currentPoorResponseRate,
    projectedPoorResponseRate,
    timeSavingsAllAgents: timeSavingsHours,
    costReductionDomain: costReduction,
    investmentRequired: investmentCost,
    paybackPeriod: Math.max(0.1, paybackMonths) // Minimum 0.1 months
  };
}

/**
 * Assess implementation risk
 */
function assessImplementationRisk(
  proposal: CorrectionProposal,
  affectedAgentsCount: number,
  domainId: string
): {
  level: ImpactAnalysis['riskLevel'];
  sideEffects: string[];
  testingLevel: ImpactAnalysis['testingRequired'];
  testPlan: ImpactAnalysis['testPlan'];
} {
  
  let riskLevel: ImpactAnalysis['riskLevel'] = 'low';
  const sideEffects: string[] = [];
  let testingLevel: ImpactAnalysis['testingRequired'] = 'minimal';
  
  // Risk factors
  if (proposal.promptChanges) {
    riskLevel = 'high';
    sideEffects.push('Cambio al prompt afecta comportamiento fundamental del agente');
    testingLevel = 'extensive';
  }
  
  if (affectedAgentsCount > 5) {
    riskLevel = riskLevel === 'low' ? 'medium' : 'high';
    sideEffects.push(`Afecta ${affectedAgentsCount} agentes simultáneamente`);
    testingLevel = testingLevel === 'minimal' ? 'standard' : 'extensive';
  }
  
  if (proposal.knowledgeUpdates && proposal.knowledgeUpdates.some(u => u.changeType === 'remove')) {
    riskLevel = 'medium';
    sideEffects.push('Elimina información existente (puede afectar otras respuestas)');
    testingLevel = testingLevel === 'minimal' ? 'standard' : testingLevel;
  }
  
  // Generate test plan based on risk
  const testPlan: ImpactAnalysis['testPlan'] = {
    sampleQuestions: [],
    validationSteps: [],
    acceptanceCriteria: [],
    estimatedTestingTime: 0
  };
  
  switch (testingLevel) {
    case 'minimal':
      testPlan.sampleQuestions = ['Pregunta similar 1', 'Pregunta similar 2', 'Pregunta similar 3'];
      testPlan.validationSteps = ['Verificar respuesta incluye cambios', 'Confirmar referencias correctas'];
      testPlan.acceptanceCriteria = ['Rating ≥4/5 en samples'];
      testPlan.estimatedTestingTime = 1; // 1 hour
      break;
      
    case 'standard':
      testPlan.sampleQuestions = Array(10).fill(0).map((_, i) => `Pregunta de test ${i + 1}`);
      testPlan.validationSteps = [
        'Probar en 1 agente primero',
        'Monitorear primeros 20 usos',
        'Validar rating mejora ≥+0.5',
        'Expandir a otros agentes si exitoso'
      ];
      testPlan.acceptanceCriteria = [
        'Rating promedio ≥4/5',
        'Sin feedback negativo',
        'Referencias verificadas'
      ];
      testPlan.estimatedTestingTime = 4; // 4 hours
      break;
      
    case 'extensive':
      testPlan.sampleQuestions = Array(30).fill(0).map((_, i) => `Pregunta test ${i + 1} (cross-agent)`);
      testPlan.validationSteps = [
        'Testing unitario (30 preguntas)',
        'Beta con 3 usuarios del domain',
        'Aplicar a 3 agentes representativos',
        'Monitorear 1 semana',
        'Rollout gradual a resto de agentes'
      ];
      testPlan.acceptanceCriteria = [
        'Rating promedio ≥4.5/5',
        'Cero feedback negativo en beta',
        'Todas las referencias validadas',
        'Sin degradación en otros agentes'
      ];
      testPlan.estimatedTestingTime = 12; // 12 hours
      break;
  }
  
  return {
    level: riskLevel,
    sideEffects: sideEffects.length > 0 ? sideEffects : ['Ningún efecto secundario identificado'],
    testingLevel,
    testPlan
  };
}

/**
 * Analyze strategy alignment with domain OKRs/KPIs
 */
async function analyzeStrategyAlignment(
  proposal: CorrectionProposal,
  domainId: string
): Promise<ImpactAnalysis['strategyAlignment']> {
  
  // Get domain info (if exists)
  const domainDoc = await firestore.collection('domains').doc(domainId).get();
  const domainData = domainDoc.data();
  
  if (!domainData?.companyInfo) {
    return undefined; // No strategy data available
  }
  
  const { mission, okrs, kpis } = domainData.companyInfo;
  
  // Simple keyword matching for now
  // TODO: Upgrade to semantic similarity
  const correctionText = proposal.correctedText.toLowerCase();
  
  const relevantOKRs = okrs?.filter((okr: any) => {
    const objectiveText = okr.objective.toLowerCase();
    // Check if correction relates to OKR
    return correctionText.includes(objectiveText) || 
           objectiveText.split(' ').some((word: string) => word.length > 4 && correctionText.includes(word));
  }).map((okr: any) => okr.objective) || [];
  
  const impactedKPIs = kpis?.map((kpi: any) => ({
    kpiName: kpi.name,
    currentValue: kpi.current || 'Unknown',
    projectedValue: 'To be measured',
    expectedImpact: 'Positive improvement expected'
  })) || [];
  
  return {
    alignsWithMission: mission ? correctionText.includes(mission.toLowerCase().split(' ')[0]) : false,
    relevantOKRs,
    impactsKPIs: impactedKPIs.slice(0, 3), // Top 3 KPIs
    strategicValue: relevantOKRs.length > 0 ? 'high' : 'medium'
  };
}

/**
 * Estimate implementation effort
 */
function estimateEffort(proposal: CorrectionProposal): ImpactAnalysis['implementationEffort'] {
  // Prompt changes are most complex
  if (proposal.promptChanges) {
    return 'l'; // Large effort
  }
  
  // Multiple knowledge updates
  if (proposal.knowledgeUpdates && proposal.knowledgeUpdates.length > 3) {
    return 'm'; // Medium effort
  }
  
  // Single knowledge update or FAQ
  if (proposal.knowledgeUpdates?.length === 1 || proposal.faqToAdd) {
    return 's'; // Small effort
  }
  
  // Simple text correction
  return 'xs'; // Extra small
}

/**
 * Helper: Calculate average
 */
function average(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  return numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
}

