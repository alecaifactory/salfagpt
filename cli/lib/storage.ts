/**
 * GCP Storage Operations for CLI
 * Handles file uploads to Cloud Storage
 */

import { Storage } from '@google-cloud/storage';
import { createReadStream } from 'fs';
import { basename } from 'path';

const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT || 'gen-lang-client-0986191192';
const BUCKET_NAME = `${PROJECT_ID}-context-documents`;

// Initialize storage client
const storage = new Storage({
  projectId: PROJECT_ID,
});

export interface UploadProgress {
  bytesUploaded: number;
  totalBytes: number;
  percentage: number;
}

export interface UploadResult {
  success: boolean;
  gcsPath: string;
  publicUrl: string;
  bucket: string;
  fileName: string;
  fileSize: number;
  duration: number;
  error?: string;
}

/**
 * Upload file to GCP Storage with progress tracking
 */
export async function uploadFileToGCS(
  localFilePath: string,
  userId: string,
  agentId: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
  const startTime = Date.now();
  const fileName = basename(localFilePath);
  const destinationPath = `${userId}/${agentId}/${fileName}`;
  
  console.log(`   📤 Subiendo a GCS: gs://${BUCKET_NAME}/${destinationPath}`);
  
  try {
    const bucket = storage.bucket(BUCKET_NAME);
    const file = bucket.file(destinationPath);
    
    // Get file size for progress tracking
    const fs = await import('fs/promises');
    const stats = await fs.stat(localFilePath);
    const totalBytes = stats.size;
    let bytesUploaded = 0;
    
    // Upload with progress tracking
    await new Promise<void>((resolve, reject) => {
      const readStream = createReadStream(localFilePath);
      const writeStream = file.createWriteStream({
        metadata: {
          contentType: getContentType(fileName),
          metadata: {
            uploadedBy: userId,
            uploadedVia: 'cli',
            agentId: agentId,
            originalFileName: fileName,
          },
        },
      });
      
      readStream.on('data', (chunk) => {
        bytesUploaded += chunk.length;
        const percentage = (bytesUploaded / totalBytes) * 100;
        
        if (onProgress) {
          onProgress({
            bytesUploaded,
            totalBytes,
            percentage,
          });
        }
      });
      
      readStream.on('error', reject);
      writeStream.on('error', reject);
      writeStream.on('finish', resolve);
      
      readStream.pipe(writeStream);
    });
    
    const duration = Date.now() - startTime;
    const gcsPath = `gs://${BUCKET_NAME}/${destinationPath}`;
    
    console.log(`   ✅ Subido en ${(duration / 1000).toFixed(1)}s: ${gcsPath}`);
    
    return {
      success: true,
      gcsPath,
      publicUrl: `https://storage.googleapis.com/${BUCKET_NAME}/${destinationPath}`,
      bucket: BUCKET_NAME,
      fileName,
      fileSize: totalBytes,
      duration,
    };
    
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    console.log(`   ❌ Error subiendo: ${errorMessage}`);
    
    return {
      success: false,
      gcsPath: '',
      publicUrl: '',
      bucket: BUCKET_NAME,
      fileName,
      fileSize: 0,
      duration,
      error: errorMessage,
    };
  }
}

/**
 * Get content type from file extension
 */
function getContentType(fileName: string): string {
  const ext = fileName.toLowerCase().split('.').pop();
  
  const contentTypes: Record<string, string> = {
    pdf: 'application/pdf',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    doc: 'application/msword',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    xls: 'application/vnd.ms-excel',
    csv: 'text/csv',
  };
  
  return contentTypes[ext || ''] || 'application/octet-stream';
}

/**
 * Check if bucket exists, create if not
 */
export async function ensureBucketExists(): Promise<boolean> {
  try {
    const bucket = storage.bucket(BUCKET_NAME);
    const [exists] = await bucket.exists();
    
    if (!exists) {
      console.log(`   📦 Creando bucket: ${BUCKET_NAME}...`);
      await storage.createBucket(BUCKET_NAME, {
        location: 'US-CENTRAL1',
        storageClass: 'STANDARD',
      });
      console.log(`   ✅ Bucket creado`);
    }
    
    return true;
  } catch (error) {
    console.error(`   ❌ Error con bucket:`, error instanceof Error ? error.message : error);
    return false;
  }
}

