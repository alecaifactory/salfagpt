/**
 * Analytics & Event Tracking for SalfaGPT CLI
 * 
 * Tracks all CLI operations for:
 * - Traceability (who did what, when, from where)
 * - Cost monitoring
 * - Usage analytics
 * - Debugging
 * - Compliance
 */

import { firestore } from '../../src/lib/firestore';
import type { Timestamp } from '@google-cloud/firestore';

/**
 * CLI Event Types
 */
export type CLIEventType = 
  | 'cli_upload_start'
  | 'cli_upload_complete'
  | 'cli_upload_failed'
  | 'cli_file_uploaded'
  | 'cli_file_extracted'
  | 'cli_file_failed'
  | 'cli_search_query'
  | 'cli_index_rebuild'
  | 'cli_config_updated'
  | 'cli_error';

/**
 * CLI Event Data
 */
interface CLIEvent {
  // Identity & Attribution
  eventType: CLIEventType;
  userId: string;                   // User who ran the CLI
  userEmail: string;                // User email for easy identification
  source: 'cli';                    // Always 'cli' to distinguish from webapp
  cliVersion: string;               // CLI version (e.g., '0.1.0')
  
  // Context
  agentId?: string;                 // Target agent (if applicable)
  conversationId?: string;          // Target conversation (if applicable)
  
  // Operation Details
  operation: string;                // Command run (e.g., 'upload', 'search')
  folderPath?: string;              // Folder being processed
  fileName?: string;                // Specific file (for file-level events)
  
  // Results
  success: boolean;                 // Operation success
  duration?: number;                // Duration in milliseconds
  filesProcessed?: number;          // Count of files
  filesSucceeded?: number;          // Count of successful
  filesFailed?: number;             // Count of failed
  
  // Resource Details
  model?: string;                   // AI model used (e.g., 'gemini-2.5-flash')
  inputTokens?: number;             // Tokens sent to AI
  outputTokens?: number;            // Tokens received from AI
  estimatedCost?: number;           // Cost in USD
  
  // Storage
  gcsPath?: string;                 // GCS path created
  firestoreDocId?: string;          // Firestore document created
  
  // Error Tracking
  errorMessage?: string;            // Error message if failed
  errorStack?: string;              // Stack trace (redacted)
  
  // Metadata
  timestamp: Date;                  // When event occurred
  hostname: string;                 // Machine running CLI
  nodeVersion: string;              // Node.js version
  platform: string;                 // OS platform
  
  // Batch/Session
  sessionId: string;                // Groups related events
  batchId?: string;                 // For batch operations
}

/**
 * CLI Session - Groups related events
 */
interface CLISession {
  id: string;
  userId: string;
  userEmail: string;
  command: string;                  // Full command run
  startedAt: Date;
  endedAt?: Date;
  duration?: number;
  eventsCount: number;
  success: boolean;
  cliVersion: string;
}

/**
 * Generate unique session ID
 */
export function generateSessionId(): string {
  return `cli-session-${Date.now()}-${Math.random().toString(36).substring(7)}`;
}

/**
 * Get CLI user from environment
 */
export function getCLIUser(): { userId: string; email: string } {
  // For now, hardcode for alec@getaifactory.com
  // In future: read from config file or auth
  return {
    userId: '114671162830729001607',  // Alec's userId
    email: 'alec@getaifactory.com',
  };
}

/**
 * Get system metadata
 */
function getSystemMetadata() {
  return {
    hostname: 'cli-machine', // Simplified for v0.1
    nodeVersion: process.version,
    platform: process.platform,
  };
}

/**
 * Track CLI event to Firestore
 */
export async function trackCLIEvent(
  eventData: Omit<CLIEvent, 'timestamp' | 'hostname' | 'nodeVersion' | 'platform' | 'source'>
): Promise<void> {
  const IS_DEVELOPMENT = process.env.NODE_ENV !== 'production';
  
  const event: CLIEvent = {
    ...eventData,
    source: 'cli',
    timestamp: new Date(),
    ...getSystemMetadata(),
  };
  
  if (IS_DEVELOPMENT) {
    console.log('📊 [DEV] Would track CLI event:', {
      type: event.eventType,
      user: event.userEmail,
      operation: event.operation,
      success: event.success,
    });
    return;
  }
  
  try {
    // Save to Firestore collection: cli_events
    await firestore.collection('cli_events').add({
      ...event,
      timestamp: new Date(),  // Firestore Timestamp
    });
    
    console.log('✅ Event tracked:', event.eventType);
  } catch (error) {
    console.warn('⚠️  Failed to track event (non-critical):', error instanceof Error ? error.message : 'Unknown error');
    // Don't throw - analytics failure shouldn't break CLI
  }
}

/**
 * Track CLI session
 */
export async function trackCLISession(
  sessionData: Omit<CLISession, 'id'>
): Promise<void> {
  const IS_DEVELOPMENT = process.env.NODE_ENV !== 'production';
  
  if (IS_DEVELOPMENT) {
    console.log('📊 [DEV] Would track CLI session:', {
      command: sessionData.command,
      user: sessionData.userEmail,
      duration: sessionData.duration,
      events: sessionData.eventsCount,
    });
    return;
  }
  
  try {
    // Save to Firestore collection: cli_sessions
    await firestore.collection('cli_sessions').add({
      ...sessionData,
      id: generateSessionId(),
      startedAt: sessionData.startedAt,
      endedAt: sessionData.endedAt || null,
    });
    
    console.log('✅ Session tracked');
  } catch (error) {
    console.warn('⚠️  Failed to track session (non-critical):', error instanceof Error ? error.message : 'Unknown error');
  }
}

/**
 * Track file upload event
 */
export async function trackFileUpload(data: {
  sessionId: string;
  fileName: string;
  fileSize: number;
  agentId?: string;
  success: boolean;
  duration?: number;
  gcsPath?: string;
  firestoreDocId?: string;
  errorMessage?: string;
}): Promise<void> {
  const user = getCLIUser();
  
  await trackCLIEvent({
    eventType: data.success ? 'cli_file_uploaded' : 'cli_file_failed',
    userId: user.userId,
    userEmail: user.email,
    cliVersion: '0.1.0',
    operation: 'upload',
    fileName: data.fileName,
    agentId: data.agentId,
    success: data.success,
    duration: data.duration,
    filesProcessed: 1,
    filesSucceeded: data.success ? 1 : 0,
    filesFailed: data.success ? 0 : 1,
    gcsPath: data.gcsPath,
    firestoreDocId: data.firestoreDocId,
    errorMessage: data.errorMessage,
    sessionId: data.sessionId,
  });
}

/**
 * Track extraction event
 */
export async function trackFileExtraction(data: {
  sessionId: string;
  fileName: string;
  agentId?: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  charactersExtracted: number;
  duration: number;
  estimatedCost: number;
  success: boolean;
  errorMessage?: string;
}): Promise<void> {
  const user = getCLIUser();
  
  await trackCLIEvent({
    eventType: data.success ? 'cli_file_extracted' : 'cli_file_failed',
    userId: user.userId,
    userEmail: user.email,
    cliVersion: '0.1.0',
    operation: 'extract',
    fileName: data.fileName,
    agentId: data.agentId,
    success: data.success,
    duration: data.duration,
    model: data.model,
    inputTokens: data.inputTokens,
    outputTokens: data.outputTokens,
    estimatedCost: data.estimatedCost,
    errorMessage: data.errorMessage,
    sessionId: data.sessionId,
  });
}

/**
 * Track upload session (batch)
 */
export async function trackUploadSession(data: {
  sessionId: string;
  command: string;
  folderPath: string;
  agentId?: string;
  startedAt: Date;
  endedAt?: Date;
  filesProcessed: number;
  filesSucceeded?: number;
  filesFailed?: number;
  totalDuration?: number;
  totalCost?: number;
  success?: boolean;
}): Promise<void> {
  const user = getCLIUser();
  
  // Track completion event
  await trackCLIEvent({
    eventType: data.success ? 'cli_upload_complete' : 'cli_upload_failed',
    userId: user.userId,
    userEmail: user.email,
    cliVersion: '0.1.0',
    operation: 'upload',
    folderPath: data.folderPath,
    agentId: data.agentId,
    success: data.success,
    duration: data.totalDuration,
    filesProcessed: data.filesProcessed,
    filesSucceeded: data.filesSucceeded,
    filesFailed: data.filesFailed,
    estimatedCost: data.totalCost,
    sessionId: data.sessionId,
  });
  
  // Track session
  await trackCLISession({
    userId: user.userId,
    userEmail: user.email,
    command: data.command,
    startedAt: data.startedAt,
    endedAt: data.endedAt,
    duration: data.totalDuration,
    eventsCount: data.filesProcessed,
    success: data.success,
    cliVersion: '0.1.0',
  });
}

/**
 * Usage example:
 * 
 * // Start session
 * const sessionId = generateSessionId();
 * const user = getCLIUser();
 * 
 * // Track individual file
 * await trackFileUpload({
 *   sessionId,
 *   fileName: 'manual.pdf',
 *   fileSize: 1240000,
 *   agentId: 'agent-M001',
 *   success: true,
 *   duration: 2300,
 *   gcsPath: 'gs://bucket/path/manual.pdf',
 *   firestoreDocId: 'source-abc123'
 * });
 * 
 * // Track session summary
 * await trackUploadSession({
 *   sessionId,
 *   command: 'upload contextos/pdf/agentes/M001',
 *   folderPath: 'contextos/pdf/agentes/M001',
 *   agentId: 'agent-M001',
 *   startedAt: new Date(),
 *   endedAt: new Date(),
 *   filesProcessed: 3,
 *   filesSucceeded: 3,
 *   filesFailed: 0,
 *   totalDuration: 45300,
 *   totalCost: 0.0041,
 *   success: true
 * });
 */

