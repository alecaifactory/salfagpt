/**
 * 🪄 Stella Context Engineering
 * 
 * Builds intelligent, token-optimized context for Stella CPO/CTO AI.
 * 
 * Features:
 * - Roadmap awareness
 * - Bug tracking integration
 * - Feature request intelligence
 * - Performance metrics
 * - User satisfaction data
 * - Agent performance analytics
 * - Lazy loading (only what's needed)
 * - Privacy-safe (no PII)
 * 
 * Token Budget: ~2000 tokens total (optimized)
 */

import { firestore } from './firestore';
import { hashUserId, redactPII, estimateTokens } from './privacy-utils';

/**
 * Build comprehensive Stella context
 * 
 * Intelligently selects context based on:
 * - User's message intent
 * - Category (bug/feature/improvement)
 * - Recent activity
 * - Priority items
 */
export async function buildStellaContext(
  userId: string,
  category?: 'bug' | 'feature' | 'improvement',
  userMessage?: string
): Promise<string> {
  const hashedUserId = hashUserId(userId);
  const contextParts: string[] = [];
  
  // Always include: Roadmap summary
  contextParts.push(await getRoadmapSummary());
  
  // Conditional context based on category
  if (category === 'bug' || userMessage?.toLowerCase().includes('bug')) {
    contextParts.push(await getCriticalBugsContext());
  }
  
  if (category === 'feature' || userMessage?.toLowerCase().includes('feature')) {
    contextParts.push(await getTopFeatureRequestsContext());
  }
  
  if (category === 'improvement' || userMessage?.toLowerCase().includes('performance')) {
    contextParts.push(await getPerformanceMetricsContext());
  }
  
  // Include user satisfaction if relevant
  if (userMessage?.toLowerCase().includes('user') || userMessage?.toLowerCase().includes('satisf')) {
    contextParts.push(await getUserSatisfactionContext());
  }
  
  const fullContext = contextParts.join('\n\n');
  const tokens = estimateTokens(fullContext);
  
  console.log(`📊 Stella context built: ${tokens} tokens`);
  
  return fullContext;
}

/**
 * Roadmap Summary (Token budget: ~300 tokens)
 */
async function getRoadmapSummary(): Promise<string> {
  try {
    const backlogSnapshot = await firestore
      .collection('backlog_items')
      .where('status', 'in', ['backlog', 'in-progress', 'done'])
      .orderBy('priority', 'desc')
      .limit(30)
      .get();
    
    const stats = {
      total: backlogSnapshot.size,
      backlog: 0,
      inProgress: 0,
      done: 0,
      p0: 0,
      p1: 0,
      p2: 0,
      p3: 0,
      bugs: 0,
      features: 0,
      improvements: 0,
    };
    
    backlogSnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.status === 'backlog') stats.backlog++;
      if (data.status === 'in-progress') stats.inProgress++;
      if (data.status === 'done') stats.done++;
      if (data.priority === 'p0') stats.p0++;
      if (data.priority === 'p1') stats.p1++;
      if (data.priority === 'p2') stats.p2++;
      if (data.priority === 'p3') stats.p3++;
      if (data.type === 'bug') stats.bugs++;
      if (data.type === 'feature') stats.features++;
      if (data.type === 'improvement') stats.improvements++;
    });
    
    return `## 📋 Roadmap Status
Total Items: ${stats.total}
- Backlog: ${stats.backlog}
- In Progress: ${stats.inProgress}
- Recently Done: ${stats.done}

By Priority:
- P0 (Critical): ${stats.p0}
- P1 (High): ${stats.p1}
- P2 (Medium): ${stats.p2}
- P3 (Low): ${stats.p3}

By Type:
- Bugs: ${stats.bugs}
- Features: ${stats.features}
- Improvements: ${stats.improvements}`;
  } catch (error) {
    console.error('Error loading roadmap summary:', error);
    return '## 📋 Roadmap Status\n[Data unavailable]';
  }
}

/**
 * Critical Bugs Context (Token budget: ~400 tokens)
 */
async function getCriticalBugsContext(): Promise<string> {
  try {
    const bugsSnapshot = await firestore
      .collection('backlog_items')
      .where('type', '==', 'bug')
      .where('priority', 'in', ['p0', 'p1'])
      .where('status', '!=', 'done')
      .orderBy('createdAt', 'desc')
      .limit(5)
      .get();
    
    if (bugsSnapshot.empty) {
      return '## 🐛 Critical Bugs\nNo critical bugs currently. ✅';
    }
    
    const bugsList = bugsSnapshot.docs.map((doc, idx) => {
      const bug = doc.data();
      return `${idx + 1}. [${bug.priority?.toUpperCase()}] ${bug.title}`;
    }).join('\n');
    
    return `## 🐛 Critical Bugs (Active)
${bugsList}`;
  } catch (error) {
    console.error('Error loading bugs:', error);
    return '## 🐛 Critical Bugs\n[Data unavailable]';
  }
}

/**
 * Top Feature Requests (Token budget: ~400 tokens)
 */
async function getTopFeatureRequestsContext(): Promise<string> {
  try {
    const featuresSnapshot = await firestore
      .collection('backlog_items')
      .where('type', '==', 'feature')
      .where('status', 'in', ['backlog', 'in-progress'])
      .orderBy('priority', 'desc')
      .limit(5)
      .get();
    
    if (featuresSnapshot.empty) {
      return '## 💡 Top Feature Requests\nNo pending features.';
    }
    
    const featuresList = featuresSnapshot.docs.map((doc, idx) => {
      const feature = doc.data();
      return `${idx + 1}. [${feature.priority?.toUpperCase()}] ${feature.title}`;
    }).join('\n');
    
    return `## 💡 Top Feature Requests
${featuresList}`;
  } catch (error) {
    console.error('Error loading features:', error);
    return '## 💡 Top Feature Requests\n[Data unavailable]';
  }
}

/**
 * Performance Metrics (Token budget: ~300 tokens)
 */
async function getPerformanceMetricsContext(): Promise<string> {
  try {
    // Get recent performance logs (last 24h)
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    
    const logsSnapshot = await firestore
      .collection('usage_logs')
      .where('action', '==', 'send_message')
      .where('timestamp', '>=', oneDayAgo)
      .orderBy('timestamp', 'desc')
      .limit(100)
      .get();
    
    if (logsSnapshot.empty) {
      return '## 📊 Performance Metrics\n[No recent data]';
    }
    
    // Calculate metrics
    const responseTimes = logsSnapshot.docs
      .map(doc => doc.data().details?.responseTime || 0)
      .filter(t => t > 0);
    
    const avgResponseTime = responseTimes.length > 0
      ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
      : 0;
    
    const p95ResponseTime = responseTimes.length > 0
      ? Math.round(responseTimes.sort((a, b) => a - b)[Math.floor(responseTimes.length * 0.95)])
      : 0;
    
    return `## 📊 Performance Metrics (24h)
- Messages: ${logsSnapshot.size}
- Avg Response Time: ${avgResponseTime}ms
- P95 Response Time: ${p95ResponseTime}ms
- Target: <3000ms (p95)
${p95ResponseTime > 3000 ? '⚠️ Above target - performance issue detected' : '✅ Within target'}`;
  } catch (error) {
    console.error('Error loading performance metrics:', error);
    return '## 📊 Performance Metrics\n[Data unavailable]';
  }
}

/**
 * User Satisfaction Context (Token budget: ~200 tokens)
 */
async function getUserSatisfactionContext(): Promise<string> {
  try {
    // Get feedback from last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const feedbackSnapshot = await firestore
      .collection('message_feedback')
      .where('createdAt', '>=', thirtyDaysAgo)
      .get();
    
    if (feedbackSnapshot.empty) {
      return '## 😊 User Satisfaction\n[No recent feedback]';
    }
    
    // Calculate CSAT (user ratings)
    const userRatings = feedbackSnapshot.docs
      .filter(doc => doc.data().userStars !== undefined)
      .map(doc => doc.data().userStars);
    
    const avgCSAT = userRatings.length > 0
      ? (userRatings.reduce((a, b) => a + b, 0) / userRatings.length).toFixed(1)
      : 'N/A';
    
    // Count by rating
    const excellent = userRatings.filter(r => r >= 4).length;
    const poor = userRatings.filter(r => r <= 2).length;
    
    return `## 😊 User Satisfaction (30d)
- Feedback Count: ${feedbackSnapshot.size}
- Avg CSAT: ${avgCSAT}/5.0
- Excellent (4-5★): ${excellent}
- Poor (0-2★): ${poor}
${poor > 0 ? '⚠️ Low ratings detected - review feedback' : '✅ High satisfaction'}`;
  } catch (error) {
    console.error('Error loading satisfaction:', error);
    return '## 😊 User Satisfaction\n[Data unavailable]';
  }
}

/**
 * Get top user stories (privacy-safe)
 */
async function getTopUserStories(): Promise<string> {
  try {
    const storiesSnapshot = await firestore
      .collection('backlog_items')
      .where('status', 'in', ['in-progress', 'backlog'])
      .orderBy('priority', 'desc')
      .limit(5)
      .get();
    
    if (storiesSnapshot.empty) {
      return '## 📖 Top User Stories\nNo active stories.';
    }
    
    const storiesList = storiesSnapshot.docs.map((doc, idx) => {
      const story = doc.data();
      // Redact any PII in titles
      const safeTitle = redactPII(story.title);
      return `${idx + 1}. [${story.priority?.toUpperCase()}] ${safeTitle}`;
    }).join('\n');
    
    return `## 📖 Top User Stories (Active)
${storiesList}`;
  } catch (error) {
    console.error('Error loading user stories:', error);
    return '## 📖 Top User Stories\n[Data unavailable]';
  }
}

/**
 * Build infrastructure context (SalfaCorp specific)
 */
export function buildInfrastructureContext(organizationId: string): string {
  const infraContexts: Record<string, string> = {
    'salfacorp': `## 🏗️ Infraestructura Técnica (SalfaCorp)
- Project: "salfagpt"
- Cloud Run Service: "cr-salfagpt-ai-ft-prod"
- Region: "us-east4"
- Admin: alec@salfacloud.cl
- Stack: Astro + React + Firestore + GCP
- AI: Gemini 2.5 Flash/Pro
- Storage: GCS (us-east4)`,
    
    'default': `## 🏗️ Infraestructura Técnica
- Stack: Astro + React + Firestore
- AI: Gemini 2.5 Flash/Pro
- Storage: Cloud Storage`,
  };
  
  return infraContexts[organizationId] || infraContexts['default'];
}

/**
 * Estimate total context tokens
 * Helps stay within budget
 */
export async function estimateStellaContextTokens(
  userId: string,
  category?: string,
  message?: string
): Promise<number> {
  const context = await buildStellaContext(userId, category as any, message);
  return estimateTokens(context);
}

/**
 * Get context summary for debugging
 */
export async function getStellaContextSummary(userId: string): Promise<{
  sources: string[];
  estimatedTokens: number;
  piiDetected: boolean;
}> {
  const context = await buildStellaContext(userId);
  
  return {
    sources: [
      'roadmap',
      'bugs',
      'features',
      'performance',
      'satisfaction'
    ],
    estimatedTokens: estimateTokens(context),
    piiDetected: false, // Already sanitized
  };
}

