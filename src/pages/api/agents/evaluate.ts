import type { APIRoute } from 'astro';
import { GoogleGenAI } from '@google/genai';

// Initialize Gemini
const API_KEY = process.env.GOOGLE_AI_API_KEY || 
  (typeof import.meta !== 'undefined' && import.meta.env 
    ? import.meta.env.GOOGLE_AI_API_KEY 
    : undefined);

if (!API_KEY) {
  console.error('❌ GOOGLE_AI_API_KEY not configured');
}

const genAI = new GoogleGenAI({ 
  apiKey: API_KEY || '' 
});

interface EvaluationCriterion {
  criterion: string;
  description: string;
  weight: number;
  isRequired: boolean;
  testable: boolean;
  howToTest: string;
}

interface EvaluationResult {
  criterion: string;
  passed: boolean;
  score: number; // 0-100
  feedback: string;
  testQuery: string;
  agentResponse: string;
  evaluatorReasoning: string;
}

export const POST: APIRoute = async ({ request }) => {
  try {
    console.log('🧪 Starting agent evaluation...');
    
    if (!API_KEY) {
      return new Response(
        JSON.stringify({ error: 'Gemini API key not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const body = await request.json();
    const { 
      agentConfig,
      qualityCriteria,
      acceptanceCriteria,
      undesirableOutputs 
    } = body;
    
    console.log('📋 Evaluating agent:', agentConfig.agentName);
    console.log('📊 Quality criteria:', qualityCriteria?.length || 0);
    console.log('✅ Acceptance criteria:', acceptanceCriteria?.length || 0);
    
    const evaluationResults: EvaluationResult[] = [];
    
    // Combine quality and acceptance criteria
    const allCriteria = [
      ...(qualityCriteria || []).map((qc: any) => ({
        criterion: qc.criterion,
        description: qc.description,
        weight: qc.weight,
        isRequired: true,
        testable: true,
        howToTest: `Test if agent demonstrates: ${qc.description}`
      })),
      ...(acceptanceCriteria || []).map((ac: any) => ({
        criterion: ac.criterion,
        description: ac.description,
        weight: 1.0,
        isRequired: ac.isRequired || true,
        testable: ac.testable || true,
        howToTest: ac.howToTest || `Verify: ${ac.description}`
      }))
    ];
    
    console.log('🎯 Total criteria to evaluate:', allCriteria.length);
    
    // For each criterion, run actual evaluation
    for (let i = 0; i < allCriteria.length; i++) {
      const criterion = allCriteria[i];
      console.log(`\n📝 Evaluating criterion ${i + 1}/${allCriteria.length}: ${criterion.criterion}`);
      
      try {
        // Generate test query for this criterion
        const testQueryPrompt = `Given this evaluation criterion for an AI agent:

Criterion: ${criterion.criterion}
Description: ${criterion.description}
How to test: ${criterion.howToTest}

Generate a realistic user query that would test whether the agent meets this criterion.
Return ONLY the user query, no explanation.`;

        const testQueryResult = await genAI.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: testQueryPrompt,
          config: {
            temperature: 0.7,
            maxOutputTokens: 200
          }
        });

        const testQuery = (testQueryResult.text || '').trim();
        console.log('  ❓ Test query:', testQuery);
        
        // Get agent's response to test query
        const agentPrompt = agentConfig.systemPrompt || '';
        
        // Validate and correct model name (fix gemini-1.5-pro -> gemini-2.5-pro)
        let modelToUse = agentConfig.recommendedModel || 'gemini-2.5-flash';
        if (modelToUse === 'gemini-1.5-pro' || modelToUse === 'gemini-pro') {
          console.log(`  🔧 Correcting invalid model name: ${modelToUse} -> gemini-2.5-pro`);
          modelToUse = 'gemini-2.5-pro';
        } else if (modelToUse === 'gemini-1.5-flash' || modelToUse === 'gemini-flash') {
          console.log(`  🔧 Correcting invalid model name: ${modelToUse} -> gemini-2.5-flash`);
          modelToUse = 'gemini-2.5-flash';
        }
        
        const agentResponseResult = await genAI.models.generateContent({
          model: modelToUse,
          contents: testQuery,
          config: {
            systemInstruction: agentPrompt,
            temperature: 0.7,
            maxOutputTokens: 1024
          }
        });

        const agentResponse = (agentResponseResult.text || '').trim();
        console.log('  🤖 Agent response preview:', agentResponse.substring(0, 100));
        
        // Evaluate the agent's response against the criterion
        const evaluationPrompt = `You are an expert AI agent evaluator. Evaluate the following agent response against the specified criterion.

CRITERION TO EVALUATE:
- Name: ${criterion.criterion}
- Description: ${criterion.description}
- Test method: ${criterion.howToTest}
- Weight: ${(criterion.weight * 100).toFixed(0)}%

TEST QUERY:
"${testQuery}"

AGENT RESPONSE:
"${agentResponse}"

UNDESIRABLE PATTERNS TO AVOID:
${(undesirableOutputs || []).map((uo: any) => `- ${uo.example} (Reason: ${uo.reason})`).join('\n')}

Evaluate and return ONLY a JSON object:
{
  "passed": true/false,
  "score": 0-100,
  "reasoning": "Detailed explanation of why it passed/failed",
  "strengths": ["What the agent did well"],
  "weaknesses": ["What could be improved"],
  "recommendation": "Specific recommendation for improvement"
}`;

        const evaluationResult = await genAI.models.generateContent({
          model: 'gemini-2.5-pro', // Use Pro for evaluation accuracy
          contents: evaluationPrompt,
          config: {
            temperature: 0.3,
            maxOutputTokens: 1024
          }
        });

        const evaluationText = (evaluationResult.text || '').trim();
        
        // Extract JSON from evaluation
        const evalJsonMatch = evaluationText.match(/\{[\s\S]*\}/);
        if (!evalJsonMatch) {
          throw new Error('No JSON in evaluation response');
        }
        
        const evaluation = JSON.parse(evalJsonMatch[0]);
        
        console.log(`  ${evaluation.passed ? '✅' : '❌'} Score: ${evaluation.score}/100`);
        
        evaluationResults.push({
          criterion: criterion.criterion,
          passed: evaluation.passed,
          score: evaluation.score,
          feedback: evaluation.reasoning,
          testQuery: testQuery,
          agentResponse: agentResponse,
          evaluatorReasoning: JSON.stringify(evaluation, null, 2)
        });
        
      } catch (criterionError: any) {
        console.error(`  ❌ Error evaluating criterion ${criterion.criterion}:`, criterionError.message);
        
        // Add failed evaluation
        evaluationResults.push({
          criterion: criterion.criterion,
          passed: false,
          score: 0,
          feedback: `Evaluation failed: ${criterionError.message}`,
          testQuery: 'Error generating test query',
          agentResponse: 'Error getting agent response',
          evaluatorReasoning: 'Evaluation error'
        });
      }
    }
    
    // Calculate overall score
    const totalWeight = allCriteria.reduce((sum: number, c: any) => sum + (c.weight || 1), 0);
    const weightedScore = evaluationResults.reduce((sum, result, idx) => {
      const weight = allCriteria[idx]?.weight || 1;
      return sum + (result.score * weight);
    }, 0);
    const overallScore = totalWeight > 0 ? weightedScore / totalWeight : 0;
    const passedCount = evaluationResults.filter(r => r.passed).length;
    
    console.log('\n🎯 Evaluation complete!');
    console.log(`   Overall score: ${overallScore.toFixed(1)}/100`);
    console.log(`   Passed: ${passedCount}/${evaluationResults.length} criteria`);
    
    return new Response(
      JSON.stringify({
        success: true,
        evaluation: {
          overallScore: Math.round(overallScore),
          totalCriteria: evaluationResults.length,
          passedCriteria: passedCount,
          failedCriteria: evaluationResults.length - passedCount,
          results: evaluationResults,
          recommendation: overallScore >= 80 
            ? 'Agent meets quality standards' 
            : overallScore >= 60 
            ? 'Agent needs improvements before deployment'
            : 'Agent requires significant improvements',
          evaluatedAt: new Date().toISOString(),
          evaluationModel: 'gemini-2.5-pro'
        }
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('❌ Error during agent evaluation:', error);
    console.error('Error stack:', error.stack);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to evaluate agent',
        details: error.message
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};

