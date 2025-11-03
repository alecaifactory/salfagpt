/**
 * Extraction Checkpoint System
 * 
 * Enables resumable extraction for large files
 * Saves progress during PDF section extraction
 * Allows resume from last successful section on failure
 * 
 * Created: 2025-11-02
 */

import { Storage } from '@google-cloud/storage';

const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT || 
  (typeof import.meta !== 'undefined' && import.meta.env 
    ? import.meta.env.GOOGLE_CLOUD_PROJECT 
    : undefined) || 'salfagpt';

const BUCKET_NAME = `${PROJECT_ID}-uploads`;
const CHECKPOINT_FOLDER = 'extraction-checkpoints';
const CHECKPOINT_EXPIRY_DAYS = 7; // Auto-delete after 7 days

export interface ExtractionCheckpoint {
  // Identity
  checkpointId: string;
  sourceId?: string; // May not have sourceId yet during extraction
  userId: string;
  fileName: string;
  
  // Progress
  stage: 'analyzing' | 'extracting' | 'combining' | 'complete' | 'failed';
  totalSections: number;
  completedSections: number;
  progressPercentage: number;
  
  // Extracted data so far
  sectionsData: Array<{
    sectionIndex: number;
    pageRange: string; // "1-108"
    extractedText: string;
    extractionTime: number; // ms
    tokenCount: number;
    cost: number;
  }>;
  
  // Metadata
  totalPages: number;
  model: string;
  extractionMethod: string;
  startTime: number; // Timestamp
  lastUpdateTime: number; // Timestamp
  
  // Costs so far
  totalCostSoFar: number;
  totalTimeSoFar: number; // ms
  
  // Error info (if failed)
  error?: {
    message: string;
    failedSection?: number;
    timestamp: number;
  };
  
  // Resume info
  canResume: boolean;
  resumeFromSection: number;
}

/**
 * Save checkpoint during extraction
 */
export async function saveCheckpoint(checkpoint: ExtractionCheckpoint): Promise<void> {
  try {
    const storage = new Storage({ projectId: PROJECT_ID });
    const bucket = storage.bucket(BUCKET_NAME);
    
    // Checkpoint filename: checkpoints/{userId}/{fileName}/{timestamp}.json
    const checkpointPath = `${CHECKPOINT_FOLDER}/${checkpoint.userId}/${checkpoint.fileName}/${Date.now()}.json`;
    const checkpointFile = bucket.file(checkpointPath);
    
    const checkpointData = JSON.stringify(checkpoint, null, 2);
    
    await checkpointFile.save(checkpointData, {
      contentType: 'application/json',
      metadata: {
        checkpointId: checkpoint.checkpointId,
        userId: checkpoint.userId,
        fileName: checkpoint.fileName,
        completedSections: checkpoint.completedSections,
        totalSections: checkpoint.totalSections,
        stage: checkpoint.stage,
        canResume: checkpoint.canResume,
      }
    });
    
    console.log(`✅ Checkpoint saved: ${checkpointPath}`);
    console.log(`   Progress: ${checkpoint.completedSections}/${checkpoint.totalSections} sections (${checkpoint.progressPercentage.toFixed(1)}%)`);
    
  } catch (error) {
    console.error('❌ Failed to save checkpoint (non-critical):', error);
    // Don't throw - checkpoint is optional
  }
}

/**
 * Load latest checkpoint for a file
 */
export async function loadLatestCheckpoint(
  userId: string,
  fileName: string
): Promise<ExtractionCheckpoint | null> {
  try {
    const storage = new Storage({ projectId: PROJECT_ID });
    const bucket = storage.bucket(BUCKET_NAME);
    
    // List all checkpoints for this file
    const [files] = await bucket.getFiles({
      prefix: `${CHECKPOINT_FOLDER}/${userId}/${fileName}/`,
    });
    
    if (files.length === 0) {
      console.log(`ℹ️ No checkpoints found for: ${fileName}`);
      return null;
    }
    
    // Get the most recent checkpoint (files are named with timestamps)
    const latestFile = files.sort((a, b) => {
      const aTime = parseInt(a.name.split('/').pop()?.replace('.json', '') || '0');
      const bTime = parseInt(b.name.split('/').pop()?.replace('.json', '') || '0');
      return bTime - aTime; // Descending
    })[0];
    
    const [contents] = await latestFile.download();
    const checkpoint: ExtractionCheckpoint = JSON.parse(contents.toString('utf-8'));
    
    console.log(`✅ Loaded checkpoint: ${latestFile.name}`);
    console.log(`   Progress: ${checkpoint.completedSections}/${checkpoint.totalSections} sections`);
    console.log(`   Can resume: ${checkpoint.canResume}`);
    
    return checkpoint;
    
  } catch (error) {
    console.error('❌ Failed to load checkpoint:', error);
    return null;
  }
}

/**
 * Check if checkpoint exists for a file
 */
export async function hasCheckpoint(
  userId: string,
  fileName: string
): Promise<boolean> {
  try {
    const storage = new Storage({ projectId: PROJECT_ID });
    const bucket = storage.bucket(BUCKET_NAME);
    
    const [files] = await bucket.getFiles({
      prefix: `${CHECKPOINT_FOLDER}/${userId}/${fileName}/`,
      maxResults: 1,
    });
    
    return files.length > 0;
  } catch (error) {
    console.error('❌ Failed to check for checkpoint:', error);
    return false;
  }
}

/**
 * Delete checkpoints for a file (after successful completion)
 */
export async function deleteCheckpoints(
  userId: string,
  fileName: string
): Promise<void> {
  try {
    const storage = new Storage({ projectId: PROJECT_ID });
    const bucket = storage.bucket(BUCKET_NAME);
    
    const [files] = await bucket.getFiles({
      prefix: `${CHECKPOINT_FOLDER}/${userId}/${fileName}/`,
    });
    
    if (files.length === 0) {
      return;
    }
    
    // Delete all checkpoint files
    await Promise.all(files.map(file => file.delete()));
    
    console.log(`✅ Deleted ${files.length} checkpoint(s) for: ${fileName}`);
    
  } catch (error) {
    console.error('❌ Failed to delete checkpoints:', error);
    // Don't throw - cleanup is optional
  }
}

/**
 * Delete old checkpoints (>7 days)
 */
export async function cleanupOldCheckpoints(): Promise<number> {
  try {
    const storage = new Storage({ projectId: PROJECT_ID });
    const bucket = storage.bucket(BUCKET_NAME);
    
    const [files] = await bucket.getFiles({
      prefix: CHECKPOINT_FOLDER,
    });
    
    const now = Date.now();
    const maxAge = CHECKPOINT_EXPIRY_DAYS * 24 * 60 * 60 * 1000; // 7 days in ms
    
    let deletedCount = 0;
    
    for (const file of files) {
      const timestamp = parseInt(file.name.split('/').pop()?.replace('.json', '') || '0');
      const age = now - timestamp;
      
      if (age > maxAge) {
        await file.delete();
        deletedCount++;
      }
    }
    
    if (deletedCount > 0) {
      console.log(`✅ Cleaned up ${deletedCount} old checkpoint(s)`);
    }
    
    return deletedCount;
    
  } catch (error) {
    console.error('❌ Failed to cleanup old checkpoints:', error);
    return 0;
  }
}

/**
 * Get checkpoint info for UI display
 */
export async function getCheckpointInfo(
  userId: string,
  fileName: string
): Promise<{
  exists: boolean;
  resumable: boolean;
  progress?: number;
  completedSections?: number;
  totalSections?: number;
  timeSaved?: number;
  costSaved?: number;
} | null> {
  const checkpoint = await loadLatestCheckpoint(userId, fileName);
  
  if (!checkpoint) {
    return { exists: false, resumable: false };
  }
  
  // Calculate potential savings
  const remainingSections = checkpoint.totalSections - checkpoint.completedSections;
  const avgTimePerSection = checkpoint.totalTimeSoFar / Math.max(checkpoint.completedSections, 1);
  const avgCostPerSection = checkpoint.totalCostSoFar / Math.max(checkpoint.completedSections, 1);
  
  const timeSaved = Math.round(avgTimePerSection * checkpoint.completedSections / 1000); // seconds
  const costSaved = avgCostPerSection * checkpoint.completedSections;
  
  return {
    exists: true,
    resumable: checkpoint.canResume && checkpoint.stage !== 'complete',
    progress: checkpoint.progressPercentage,
    completedSections: checkpoint.completedSections,
    totalSections: checkpoint.totalSections,
    timeSaved,
    costSaved,
  };
}

