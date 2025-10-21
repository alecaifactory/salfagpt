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
// Use bucket name based on current project
export const BUCKET_NAME = PROJECT_ID === 'salfagpt' 
  ? 'salfagpt-uploads' 
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
 */
export async function downloadFile(storagePath: string): Promise<Buffer> {
  try {
    console.log(`📥 Downloading from Cloud Storage: ${storagePath}`);
    
    const bucket = storage.bucket(BUCKET_NAME);
    const file = bucket.file(storagePath);
    
    // Check if file exists
    const [exists] = await file.exists();
    if (!exists) {
      throw new Error(`File not found in storage: ${storagePath}`);
    }
    
    // Download file
    const [buffer] = await file.download();
    
    console.log(`✅ File downloaded: ${buffer.length} bytes`);
    
    return buffer;
    
  } catch (error) {
    console.error('❌ Error downloading from Cloud Storage:', error);
    throw new Error(`Cloud Storage download failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
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

