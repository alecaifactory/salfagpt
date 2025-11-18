/**
 * Tool Manager - Serverless Tool Execution
 * 
 * Enables Cloud Function execution for heavy processing:
 * - PDF splitting (300MB+ files → 20MB chunks)
 * - Document embedding
 * - Batch processing
 */

import { firestore } from './firestore';
import { Storage } from '@google-cloud/storage';

const storage = new Storage();

// ==================== INTERFACES ====================

export interface ToolExecution {
  id: string;
  userId: string;
  toolId: string;
  
  // Input
  inputFileUrl?: string;
  inputFileName?: string;
  inputSizeMB: number;
  parameters: Record<string, any>;
  
  // Execution
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  functionExecutionId?: string;
  
  // Progress
  progressPercentage?: number;
  progressMessage?: string;
  
  // Results
  outputFiles?: Array<{
    url: string;
    fileName: string;
    sizeMB: number;
    type: string;
    metadata?: Record<string, any>;
  }>;
  metadata?: Record<string, any>;
  
  // Timing
  startedAt: Date;
  completedAt?: Date;
  durationMs?: number;
  
  // Error
  error?: {
    message: string;
    code: string;
    details?: string;
  };
  
  // Cost
  estimatedCost?: number;
  
  // Source
  source: 'localhost' | 'production';
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// ==================== CRUD OPERATIONS ====================

/**
 * Create a new tool execution record
 */
export async function createToolExecution(
  userId: string,
  toolId: string,
  inputFileName: string,
  inputSizeMB: number,
  parameters: Record<string, any> = {}
): Promise<ToolExecution> {
  const executionId = `exec_${Date.now()}_${randomString(6)}`;
  
  const execution: ToolExecution = {
    id: executionId,
    userId,
    toolId,
    inputFileName,
    inputSizeMB,
    parameters,
    status: 'pending',
    startedAt: new Date(),
    source: getEnvironmentSource(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  await firestore
    .collection('tool_executions')
    .doc(executionId)
    .set(execution);
  
  console.log('✅ Tool execution created:', executionId);
  return execution;
}

/**
 * Get tool execution by ID
 */
export async function getToolExecution(
  executionId: string
): Promise<ToolExecution | null> {
  try {
    const doc = await firestore
      .collection('tool_executions')
      .doc(executionId)
      .get();
    
    if (!doc.exists) return null;
    
    const data = doc.data();
    return {
      ...data,
      startedAt: data?.startedAt?.toDate(),
      completedAt: data?.completedAt?.toDate(),
      createdAt: data?.createdAt?.toDate(),
      updatedAt: data?.updatedAt?.toDate(),
    } as ToolExecution;
  } catch (error) {
    console.error('Error getting tool execution:', error);
    return null;
  }
}

/**
 * Update tool execution status
 */
export async function updateToolExecution(
  executionId: string,
  updates: Partial<ToolExecution>
): Promise<void> {
  await firestore
    .collection('tool_executions')
    .doc(executionId)
    .update({
      ...updates,
      updatedAt: new Date(),
    });
}

/**
 * Get user's tool executions
 */
export async function getUserToolExecutions(
  userId: string,
  limit: number = 50
): Promise<ToolExecution[]> {
  try {
    const snapshot = await firestore
      .collection('tool_executions')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        startedAt: data.startedAt?.toDate(),
        completedAt: data.completedAt?.toDate(),
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
      } as ToolExecution;
    });
  } catch (error) {
    console.error('Error getting user tool executions:', error);
    return [];
  }
}

// ==================== CLOUD FUNCTION INVOCATION ====================

/**
 * Invoke Cloud Function via HTTP
 */
export async function invokeCloudFunction(
  functionUrl: string,
  payload: Record<string, any>
): Promise<any> {
  console.log('☁️  Invoking Cloud Function:', functionUrl);
  
  const response = await fetch(functionUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Cloud Function failed: ${response.status} ${error}`);
  }
  
  return await response.json();
}

/**
 * Upload file to GCS and get URL
 */
export async function uploadToGCS(
  buffer: Buffer,
  userId: string,
  fileName: string
): Promise<string> {
  const path = `tool-inputs/${userId}/${Date.now()}-${fileName}`;
  const bucket = storage.bucket('salfagpt-uploads');
  const file = bucket.file(path);
  
  await file.save(buffer, {
    contentType: 'application/pdf',
    metadata: {
      uploadedBy: userId,
      uploadedAt: new Date().toISOString()
    }
  });
  
  return `gs://salfagpt-uploads/${path}`;
}

// ==================== UTILITIES ====================

function randomString(length: number): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function getEnvironmentSource(): 'localhost' | 'production' {
  const isDev = process.env.NODE_ENV === 'development';
  return isDev ? 'localhost' : 'production';
}











