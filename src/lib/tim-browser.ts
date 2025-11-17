/**
 * Tim Browser Automation
 * Uses MCP Browser tools for automated testing
 * 
 * Created: 2025-11-16
 * Purpose: Execute reproduction steps, capture diagnostics, analyze UI
 */

import type {
  CapturedData,
  ConsoleLog,
  NetworkRequest,
  Screenshot,
  PerformanceMetrics,
  AccessibilityIssue
} from '../types/tim';

// Note: MCP browser tools are available via the AI assistant context
// They don't need to be imported - they're called directly

// ============================================================================
// CONFIGURATION
// ============================================================================

const STEP_DELAY_MS = 1000; // Wait 1s between steps
const SCREENSHOT_STORAGE = 'tim-screenshots/'; // GCS path

// ============================================================================
// TEST EXECUTION
// ============================================================================

/**
 * Execute reproduction steps and capture comprehensive diagnostics
 * 
 * This function coordinates browser automation via MCP tools.
 * The actual browser actions are performed by the AI assistant.
 */
export async function executeReproductionSteps(
  steps: string[],
  baseUrl: string = 'http://localhost:3000'
): Promise<CapturedData> {
  console.log('🧪 Tim starting test execution...');
  console.log('📋 Steps to execute:', steps.length);
  
  const capturedData: CapturedData = {
    consoleLogs: [],
    networkRequests: [],
    screenshots: [],
    performanceMetrics: {},
    accessibilityIssues: []
  };
  
  // Note: The actual execution will be done by the AI assistant
  // using MCP browser tools. This function provides the structure
  // and coordinates the capture process.
  
  console.log('✅ Execution framework ready');
  console.log('💡 AI assistant will execute steps via MCP browser tools');
  
  return capturedData;
}

/**
 * Capture current browser diagnostics
 * 
 * This function defines what data should be captured.
 * The AI assistant will use MCP tools to collect it.
 */
export interface DiagnosticCapture {
  consoleLogs: boolean;
  networkRequests: boolean;
  screenshot: boolean;
  performance: boolean;
  accessibility: boolean;
}

export async function captureDiagnostics(
  sessionId: string,
  step: string,
  options: DiagnosticCapture = {
    consoleLogs: true,
    networkRequests: true,
    screenshot: true,
    performance: true,
    accessibility: true
  }
): Promise<Partial<CapturedData>> {
  console.log('📸 Capturing diagnostics for step:', step);
  
  const captured: Partial<CapturedData> = {};
  
  // The AI assistant will fill this data using:
  // - browser_console_messages() → consoleLogs
  // - browser_network_requests() → networkRequests  
  // - browser_take_screenshot() → screenshots
  // - browser_evaluate() → performanceMetrics
  // - browser_snapshot() → accessibilityIssues
  
  console.log('✅ Diagnostic capture structure ready');
  
  return captured;
}

// ============================================================================
// STEP PARSING & EXECUTION HELPERS
// ============================================================================

/**
 * Parse natural language step into executable action
 */
export function parseStep(step: string): {
  action: string;
  target?: string;
  value?: string;
} {
  const stepLower = step.toLowerCase();
  
  // Click actions
  if (stepLower.includes('click') || stepLower.includes('press')) {
    const target = extractTarget(step);
    return { action: 'click', target };
  }
  
  // Type actions
  if (stepLower.includes('type') || stepLower.includes('enter') || stepLower.includes('write')) {
    const target = extractTarget(step);
    const value = extractValue(step);
    return { action: 'type', target, value };
  }
  
  // Navigate actions
  if (stepLower.includes('go to') || stepLower.includes('navigate') || stepLower.includes('open')) {
    const value = extractURL(step);
    return { action: 'navigate', value };
  }
  
  // Wait actions
  if (stepLower.includes('wait')) {
    const value = extractWaitCondition(step);
    return { action: 'wait', value };
  }
  
  // Verify actions
  if (stepLower.includes('verify') || stepLower.includes('check') || stepLower.includes('expect')) {
    const value = extractExpectation(step);
    return { action: 'verify', value };
  }
  
  // Default: manual execution needed
  return { action: 'manual', value: step };
}

function extractTarget(step: string): string {
  // Extract button names, input labels, etc.
  const quotedMatch = step.match(/["']([^"']+)["']/);
  if (quotedMatch) return quotedMatch[1];
  
  const buttonMatch = step.match(/button.*?(\w+)/i);
  if (buttonMatch) return buttonMatch[1];
  
  return 'unknown';
}

function extractValue(step: string): string {
  const quotedMatch = step.match(/["']([^"']+)["']/);
  return quotedMatch ? quotedMatch[1] : '';
}

function extractURL(step: string): string {
  const urlMatch = step.match(/https?:\/\/[^\s]+/);
  if (urlMatch) return urlMatch[0];
  
  const pathMatch = step.match(/\/[^\s]+/);
  return pathMatch ? pathMatch[0] : '/';
}

function extractWaitCondition(step: string): string {
  const forMatch = step.match(/for\s+(.+)/i);
  return forMatch ? forMatch[1] : '2 seconds';
}

function extractExpectation(step: string): string {
  const thatMatch = step.match(/that\s+(.+)/i);
  return thatMatch ? thatMatch[1] : step;
}

// ============================================================================
// ANALYSIS HELPERS
// ============================================================================

/**
 * Analyze console logs for errors and patterns
 */
export function analyzeConsoleLogs(logs: ConsoleLog[]): {
  errorCount: number;
  warningCount: number;
  criticalErrors: ConsoleLog[];
  patterns: string[];
} {
  const errorCount = logs.filter(log => log.level === 'error').length;
  const warningCount = logs.filter(log => log.level === 'warn').length;
  
  const criticalErrors = logs.filter(log =>
    log.level === 'error' &&
    (log.message.includes('Failed') ||
     log.message.includes('Cannot') ||
     log.message.includes('undefined') ||
     log.message.includes('null'))
  );
  
  // Find patterns
  const messageCounts = new Map<string, number>();
  logs.forEach(log => {
    const key = log.message.substring(0, 50); // First 50 chars
    messageCounts.set(key, (messageCounts.get(key) || 0) + 1);
  });
  
  const patterns = Array.from(messageCounts.entries())
    .filter(([, count]) => count > 2)
    .map(([message]) => message);
  
  return { errorCount, warningCount, criticalErrors, patterns };
}

/**
 * Analyze network requests for failures and slow requests
 */
export function analyzeNetworkRequests(requests: NetworkRequest[]): {
  failedRequests: NetworkRequest[];
  slowRequests: NetworkRequest[];
  averageLatency: number;
} {
  const failedRequests = requests.filter(req => req.status >= 400);
  const slowRequests = requests.filter(req => req.duration > 3000); // >3s
  
  const totalDuration = requests.reduce((sum, req) => sum + req.duration, 0);
  const averageLatency = requests.length > 0 ? totalDuration / requests.length : 0;
  
  return { failedRequests, slowRequests, averageLatency };
}

/**
 * Analyze performance metrics for issues
 */
export function analyzePerformanceMetrics(metrics: PerformanceMetrics): {
  isGood: boolean;
  issues: string[];
  recommendations: string[];
} {
  const issues: string[] = [];
  const recommendations: string[] = [];
  let isGood = true;
  
  // Load time check
  if (metrics.loadTime && metrics.loadTime > 3000) {
    isGood = false;
    issues.push(`Slow load time: ${metrics.loadTime}ms (target: <3000ms)`);
    recommendations.push('Optimize bundle size, lazy load components');
  }
  
  // DOM ready check
  if (metrics.domReady && metrics.domReady > 2000) {
    isGood = false;
    issues.push(`Slow DOM ready: ${metrics.domReady}ms (target: <2000ms)`);
    recommendations.push('Reduce initial JavaScript execution');
  }
  
  // API latency check
  if (metrics.apiLatency && metrics.apiLatency > 1000) {
    isGood = false;
    issues.push(`High API latency: ${metrics.apiLatency}ms (target: <1000ms)`);
    recommendations.push('Optimize API responses, add caching');
  }
  
  // Memory usage check
  if (metrics.memoryUsage && metrics.memoryUsage > 100 * 1024 * 1024) { // 100MB
    isGood = false;
    issues.push(`High memory usage: ${(metrics.memoryUsage / 1024 / 1024).toFixed(2)}MB`);
    recommendations.push('Check for memory leaks, optimize data structures');
  }
  
  return { isGood, issues, recommendations };
}

// ============================================================================
// SCREENSHOT ANALYSIS
// ============================================================================

/**
 * Generate description of screenshot for AI analysis
 */
export function describeScreenshot(screenshot: Screenshot): string {
  return `Screenshot ${screenshot.filename} taken at step "${screenshot.step}" (${screenshot.timestamp.toISOString()})`;
}

/**
 * Organize screenshots by test step
 */
export function organizeScreenshots(screenshots: Screenshot[]): Map<string, Screenshot[]> {
  const organized = new Map<string, Screenshot[]>();
  
  screenshots.forEach(screenshot => {
    const existing = organized.get(screenshot.step) || [];
    existing.push(screenshot);
    organized.set(screenshot.step, existing);
  });
  
  return organized;
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  executeReproductionSteps,
  captureDiagnostics,
  parseStep,
  analyzeConsoleLogs,
  analyzeNetworkRequests,
  analyzePerformanceMetrics,
  describeScreenshot,
  organizeScreenshots
};

