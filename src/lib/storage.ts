/**
 * Cloud Storage Service
 * 
 * Manages file uploads, downloads, and deletions in Google Cloud Storage
 */

import { Storage } from '@google-cloud/storage';

// Initialize Cloud Storage client
const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT || 
  (typeof import.meta !== 'undefined' && import.meta.env 
    ? import.meta.env.GOOGLE_CLOUD_PROJECT 
    : undefined);

const storage = new Storage({
  projectId: PROJECT_ID,
});

// Bucket configuration
// ✅ GREEN deployment: us-east4 buckets (same region as Cloud Run)
export const BUCKET_NAME = process.env.USE_EAST4_STORAGE === 'true'
  ? 'salfagpt-context-documents-east4'  // GREEN: us-east4 ⚡
  : PROJECT_ID === 'salfagpt'
    ? 'salfagpt-uploads'                 // BLUE: us-central1
    : 'gen-lang-client-0986191192-uploads';
export const DOCUMENTS_FOLDER = 'documents';

/**
 * Upload file to Cloud Storage
 */
export async function uploadFile(
  buffer: Buffer,
  filename: string,
  contentType: string,
  metadata?: Record<string, any>
): Promise<{
  storagePath: string;
  publicUrl: string;
  bucketName: string;
}> {
  try {
    // Generate unique filename with timestamp
    const timestamp = Date.now();
    const sanitizedName = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = `${DOCUMENTS_FOLDER}/${timestamp}-${sanitizedName}`;
    
    console.log(`📤 Uploading to Cloud Storage: ${storagePath}`);
    
    // Get bucket and file reference
    const bucket = storage.bucket(BUCKET_NAME);
    const file = bucket.file(storagePath);
    
    // Upload file
    await file.save(buffer, {
      contentType,
      metadata: {
        originalName: filename,
        uploadedAt: new Date().toISOString(),
        contentType,
        size: buffer.length,
        ...metadata,
      },
    });
    
    // Generate public URL (not signed - for reference only)
    const publicUrl = `https://storage.googleapis.com/${BUCKET_NAME}/${storagePath}`;
    
    console.log(`✅ File uploaded successfully: ${storagePath}`);
    console.log(`📍 URL: ${publicUrl}`);
    
    return {
      storagePath,
      publicUrl,
      bucketName: BUCKET_NAME,
    };
    
  } catch (error) {
    console.error('❌ Error uploading to Cloud Storage:', error);
    throw new Error(`Cloud Storage upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Download file from Cloud Storage
 * ✅ MIGRATION: Try us-east4 first, fallback to us-central1
 */
export async function downloadFile(storagePath: string): Promise<Buffer> {
  console.log(`📥 Downloading from Cloud Storage: ${storagePath}`);
  
  // Try buckets in order: us-east4 (GREEN) → us-central1 (BLUE)
  const bucketsToTry = [
    'salfagpt-context-documents-east4',  // GREEN: us-east4 (new)
    'salfagpt-uploads',                   // BLUE: us-central1 (old)
  ];
  
  for (const bucketName of bucketsToTry) {
    try {
      console.log(`  🔍 Trying bucket: ${bucketName}`);
      
      const bucket = storage.bucket(bucketName);
      const file = bucket.file(storagePath);
      
      // Check if file exists
      const [exists] = await file.exists();
      if (!exists) {
        console.log(`  ⚠️  File not in ${bucketName}`);
        continue; // Try next bucket
      }
      
      // Download file
      const [buffer] = await file.download();
      
      console.log(`✅ File downloaded from ${bucketName}: ${buffer.length} bytes`);
      
      return buffer;
      
    } catch (error) {
      console.log(`  ❌ Failed from ${bucketName}:`, error instanceof Error ? error.message : 'Unknown');
      // Continue to next bucket
    }
  }
  
  // All buckets failed
  throw new Error(`File not found in any bucket: ${storagePath} (tried: ${bucketsToTry.join(', ')})`);
}

/**
 * Delete file from Cloud Storage
 */
export async function deleteFile(storagePath: string): Promise<void> {
  try {
    console.log(`🗑️ Deleting from Cloud Storage: ${storagePath}`);
    
    const bucket = storage.bucket(BUCKET_NAME);
    const file = bucket.file(storagePath);
    
    // Delete file
    await file.delete();
    
    console.log(`✅ File deleted: ${storagePath}`);
    
  } catch (error) {
    console.error('❌ Error deleting from Cloud Storage:', error);
    // Don't throw - file might already be deleted
    console.warn('⚠️ File deletion failed, continuing anyway');
  }
}

/**
 * Generate signed URL for temporary access
 * Useful for downloading or viewing files
 */
export async function getSignedUrl(
  storagePath: string,
  expiresInMinutes: number = 60
): Promise<string> {
  try {
    const bucket = storage.bucket(BUCKET_NAME);
    const file = bucket.file(storagePath);
    
    const [signedUrl] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + expiresInMinutes * 60 * 1000,
    });
    
    return signedUrl;
    
  } catch (error) {
    console.error('❌ Error generating signed URL:', error);
    throw new Error(`Signed URL generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Check if file exists in storage
 */
export async function fileExists(storagePath: string): Promise<boolean> {
  try {
    const bucket = storage.bucket(BUCKET_NAME);
    const file = bucket.file(storagePath);
    const [exists] = await file.exists();
    return exists;
  } catch (error) {
    console.error('❌ Error checking file existence:', error);
    return false;
  }
}

/**
 * Get file metadata
 */
export async function getFileMetadata(storagePath: string): Promise<{
  size: number;
  contentType: string;
  created: Date;
  updated: Date;
} | null> {
  try {
    const bucket = storage.bucket(BUCKET_NAME);
    const file = bucket.file(storagePath);
    
    const [metadata] = await file.getMetadata();
    
    return {
      size: parseInt(String(metadata.size || '0')),
      contentType: metadata.contentType || 'application/octet-stream',
      created: new Date(metadata.timeCreated || Date.now()),
      updated: new Date(metadata.updated || Date.now()),
    };
    
  } catch (error) {
    console.error('❌ Error getting file metadata:', error);
    return null;
  }
}

/**
 * Generate signed URL with progress tracking support
 * Returns both the URL and file metadata for client-side progress
 */
export async function getSignedUrlWithMetadata(
  storagePath: string,
  expiresInMinutes: number = 60
): Promise<{
  url: string;
  size: number;
  contentType: string;
}> {
  try {
    const bucket = storage.bucket(BUCKET_NAME);
    const file = bucket.file(storagePath);
    
    // Get metadata first for size info
    const [metadata] = await file.getMetadata();
    
    // Generate signed URL
    const [signedUrl] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + expiresInMinutes * 60 * 1000,
    });
    
    return {
      url: signedUrl,
      size: parseInt(String(metadata.size || '0')),
      contentType: metadata.contentType || 'application/pdf',
    };
    
  } catch (error) {
    console.error('❌ Error generating signed URL with metadata:', error);
    throw new Error(`Signed URL generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

