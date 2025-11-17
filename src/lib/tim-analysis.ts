/**
 * Tim AI Analysis Engine
 * Uses Gemini Pro to analyze test results and diagnose issues
 * 
 * Created: 2025-11-16
 * Purpose: AI-powered root cause analysis and recommendations
 */

import { GoogleGenAI } from '@google/genai';
import type {
  CapturedData,
  AIAnalysis,
  TimTestSession
} from '../types/tim';
import {
  analyzeConsoleLogs,
  analyzeNetworkRequests,
  analyzePerformanceMetrics
} from './tim-browser';

// ============================================================================
// CONFIGURATION
// ============================================================================

const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY ||
  (typeof import.meta !== 'undefined' && import.meta.env
    ? import.meta.env.GOOGLE_AI_API_KEY
    : undefined);

if (!GOOGLE_AI_API_KEY) {
  console.warn('⚠️ GOOGLE_AI_API_KEY not set - Tim analysis will fail');
}

const genAI = new GoogleGenAI({ apiKey: GOOGLE_AI_API_KEY || '' });

// ============================================================================
// AI ANALYSIS
// ============================================================================

/**
 * Analyze test results using Gemini Pro
 */
export async function analyzeTestResults(
  sessionId: string,
  capturedData: CapturedData,
  testScenario: TimTestSession['testScenario']
): Promise<AIAnalysis> {
  console.log('🤖 Tim analyzing test results with Gemini Pro...');
  
  try {
    // Pre-analyze data for structured context
    const consoleAnalysis = analyzeConsoleLogs(capturedData.consoleLogs);
    const networkAnalysis = analyzeNetworkRequests(capturedData.networkRequests);
    const perfAnalysis = analyzePerformanceMetrics(capturedData.performanceMetrics);
    
    // Build comprehensive context for AI
    const context = buildAnalysisContext(
      testScenario,
      capturedData,
      consoleAnalysis,
      networkAnalysis,
      perfAnalysis
    );
    
    // Call Gemini Pro for analysis
    const result = await genAI.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: context,
      config: {
        systemInstruction: TIM_SYSTEM_PROMPT,
        temperature: 0.1, // Low temperature for consistent analysis
        maxOutputTokens: 4096
      }
    });
    
    const responseText = result.text || '{}';
    
    // Parse AI response
    const analysis = parseAIResponse(responseText);
    
    console.log('✅ Tim analysis complete');
    console.log('📊 Root cause:', analysis.rootCause);
    console.log('🎯 Severity:', analysis.severity);
    
    return analysis;
    
  } catch (error) {
    console.error('❌ Tim analysis failed:', error);
    
    // Fallback analysis
    return {
      rootCause: 'AI analysis failed. Manual review required.',
      reproducible: false,
      severity: 'high',
      affectedUsers: 'Unknown',
      recommendedFix: 'Review captured diagnostics manually',
      estimatedEffort: 'Unknown',
      confidence: 0
    };
  }
}

// ============================================================================
// CONTEXT BUILDING
// ============================================================================

function buildAnalysisContext(
  testScenario: TimTestSession['testScenario'],
  capturedData: CapturedData,
  consoleAnalysis: ReturnType<typeof analyzeConsoleLogs>,
  networkAnalysis: ReturnType<typeof analyzeNetworkRequests>,
  perfAnalysis: ReturnType<typeof analyzePerformanceMetrics>
): string {
  return `# Tim Digital Twin Test Analysis

## Test Scenario
**User Action:** ${testScenario.userAction}
**Expected Behavior:** ${testScenario.expectedBehavior}
**Actual Behavior:** ${testScenario.actualBehavior}

## Reproduction Steps
${testScenario.reproductionSteps.map((step, i) => `${i + 1}. ${step}`).join('\n')}

## Console Logs Analysis
**Total Logs:** ${capturedData.consoleLogs.length}
**Errors:** ${consoleAnalysis.errorCount}
**Warnings:** ${consoleAnalysis.warningCount}

### Critical Errors
${consoleAnalysis.criticalErrors.map(log => 
  `- [${log.level.toUpperCase()}] ${log.message}`
).join('\n') || 'None'}

### Patterns Detected
${consoleAnalysis.patterns.map(pattern => `- ${pattern}`).join('\n') || 'None'}

### Recent Logs (last 10)
${capturedData.consoleLogs.slice(-10).map(log =>
  `[${log.level.toUpperCase()}] ${log.timestamp.toISOString()} - ${log.message}`
).join('\n')}

## Network Requests Analysis
**Total Requests:** ${capturedData.networkRequests.length}
**Failed Requests:** ${networkAnalysis.failedRequests.length}
**Slow Requests (>3s):** ${networkAnalysis.slowRequests.length}
**Average Latency:** ${networkAnalysis.averageLatency.toFixed(0)}ms

### Failed Requests
${networkAnalysis.failedRequests.map(req =>
  `- ${req.method} ${req.url} - ${req.status} ${req.statusText} (${req.duration}ms)`
).join('\n') || 'None'}

### Slow Requests
${networkAnalysis.slowRequests.map(req =>
  `- ${req.method} ${req.url} - ${req.duration}ms`
).join('\n') || 'None'}

## Performance Metrics
${Object.entries(capturedData.performanceMetrics).map(([key, value]) =>
  `**${key}:** ${value}ms`
).join('\n')}

### Performance Issues
${perfAnalysis.issues.join('\n') || 'None detected'}

### Recommendations
${perfAnalysis.recommendations.join('\n') || 'Performance is good'}

## Accessibility Issues
**Total Issues:** ${capturedData.accessibilityIssues.length}

${capturedData.accessibilityIssues.map(issue =>
  `- [${issue.severity.toUpperCase()}] ${issue.description}\n  Element: ${issue.element}\n  Recommendation: ${issue.recommendation || 'Review manually'}`
).join('\n\n') || 'No accessibility issues found'}

## Screenshots
**Total Screenshots:** ${capturedData.screenshots.length}
${capturedData.screenshots.map((screenshot, i) =>
  `${i + 1}. ${screenshot.step} - ${screenshot.filename}`
).join('\n')}

---

## Analysis Task

Based on all the above data, provide a structured JSON analysis:

\`\`\`json
{
  "rootCause": "Precise technical explanation of what caused the issue",
  "reproducible": true/false,
  "severity": "critical" | "high" | "medium" | "low",
  "affectedUsers": "Description of who is affected (e.g., 'All users', 'Users with role X')",
  "recommendedFix": "Specific technical steps to fix the issue",
  "estimatedEffort": "Time estimate (e.g., '2 hours', '1 day')",
  "confidence": 0-100 (how confident you are in this analysis)
}
\`\`\`

Analyze comprehensively and provide actionable insights.`;
}

// ============================================================================
// SYSTEM PROMPT
// ============================================================================

const TIM_SYSTEM_PROMPT = `You are Tim, a Digital Twin Testing Agent for the Flow platform.

Your purpose is to:
1. Analyze captured test data (console logs, network requests, screenshots, performance)
2. Identify the root cause of user-reported issues
3. Provide precise, actionable diagnostics
4. Recommend specific fixes with effort estimates

Analysis Guidelines:
- Be technical and precise
- Focus on root cause, not symptoms
- Consider all data sources (console, network, performance, accessibility)
- Prioritize user impact
- Provide actionable recommendations
- Include confidence level in your analysis

Output Format:
- Respond ONLY with valid JSON (no additional text)
- Include all required fields
- Be concise but complete
- Use technical terminology appropriately

Remember: You are helping developers fix real user issues. Accuracy and actionability are critical.`;

// ============================================================================
// RESPONSE PARSING
// ============================================================================

function parseAIResponse(responseText: string): AIAnalysis {
  try {
    // Extract JSON from response (may be wrapped in markdown)
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }
    
    const parsed = JSON.parse(jsonMatch[0]);
    
    // Validate required fields
    if (!parsed.rootCause || !parsed.recommendedFix) {
      throw new Error('Missing required fields in AI response');
    }
    
    return {
      rootCause: parsed.rootCause,
      reproducible: parsed.reproducible ?? false,
      severity: parsed.severity || 'medium',
      affectedUsers: parsed.affectedUsers || 'Unknown',
      recommendedFix: parsed.recommendedFix,
      estimatedEffort: parsed.estimatedEffort || 'Unknown',
      confidence: parsed.confidence || 50
    };
    
  } catch (error) {
    console.error('❌ Failed to parse AI response:', error);
    
    // Return fallback analysis
    return {
      rootCause: 'Failed to parse AI analysis. Raw response: ' + responseText.substring(0, 200),
      reproducible: false,
      severity: 'medium',
      affectedUsers: 'Unknown',
      recommendedFix: 'Manual review required',
      estimatedEffort: 'Unknown',
      confidence: 0
    };
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  analyzeTestResults
};

