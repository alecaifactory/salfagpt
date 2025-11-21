/**
 * Firestore Chunked Storage for Large Extracted Text
 * 
 * Problem: Firestore has 1MB limit per field
 * Solution: Split large extracted text into chunks, store in subcollection
 * 
 * Created: 2025-11-21
 */

import type { Firestore } from 'firebase-admin/firestore';

const FIRESTORE_FIELD_LIMIT = 1_000_000; // 1MB in bytes
const CHUNK_SIZE = 900_000; // 900KB to be safe

export interface ChunkedStorageResult {
  sourceId: string;
  chunksStored: number;
  totalBytes: number;
  method: 'direct' | 'chunked';
}

/**
 * Store extracted text in Firestore (handles >1MB automatically)
 * 
 * @param firestore - Firestore instance (must be initialized)
 * @param sourceId - Context source document ID
 * @param extractedText - Full extracted text
 * @param metadata - Metadata to store
 */
export async function storeExtractedText(
  firestore: Firestore,
  sourceId: string,
  extractedText: string,
  metadata: Record<string, any>
): Promise<ChunkedStorageResult> {
  const textSizeBytes = Buffer.byteLength(extractedText, 'utf8');
  const textSizeMB = textSizeBytes / (1024 * 1024);
  
  console.log(`   💾 Storing ${textSizeMB.toFixed(2)}MB of extracted text...`);
  
  // If under 1MB, store directly
  if (textSizeBytes < FIRESTORE_FIELD_LIMIT) {
    console.log('   ✅ Direct storage (under 1MB)');
    
    await firestore.collection('context_sources').doc(sourceId).update({
      extractedData: extractedText,
      metadata: {
        ...metadata,
        storageMethod: 'direct',
        textSizeMB: textSizeMB
      }
    });
    
    return {
      sourceId,
      chunksStored: 0,
      totalBytes: textSizeBytes,
      method: 'direct'
    };
  }
  
  // If over 1MB, use chunked storage
  console.log(`   ⚠️  Text exceeds 1MB (${textSizeMB.toFixed(2)}MB), using chunked storage`);
  
  // Calculate number of chunks needed
  const numChunks = Math.ceil(textSizeBytes / CHUNK_SIZE);
  console.log(`   📦 Splitting into ${numChunks} chunks...`);
  
  // Delete old chunks if they exist
  const oldChunks = await firestore
    .collection('context_sources')
    .doc(sourceId)
    .collection('text_chunks')
    .get();
  
  if (!oldChunks.empty) {
    const batch = firestore.batch();
    oldChunks.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
    console.log(`   🗑️  Deleted ${oldChunks.size} old chunks`);
  }
  
  // Store chunks
  const chunks: Array<{ index: number; text: string }> = [];
  
  for (let i = 0; i < numChunks; i++) {
    const start = i * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, extractedText.length);
    const chunkText = extractedText.substring(start, end);
    
    chunks.push({
      index: i,
      text: chunkText
    });
  }
  
  // Batch write chunks
  const chunksBatch = firestore.batch();
  
  for (const chunk of chunks) {
    const chunkRef = firestore
      .collection('context_sources')
      .doc(sourceId)
      .collection('text_chunks')
      .doc(`chunk_${chunk.index.toString().padStart(3, '0')}`);
    
    chunksBatch.set(chunkRef, {
      index: chunk.index,
      text: chunk.text,
      sizeBytes: Buffer.byteLength(chunk.text, 'utf8'),
      createdAt: new Date().toISOString()
    });
  }
  
  await chunksBatch.commit();
  console.log(`   ✅ Stored ${numChunks} chunks in subcollection`);
  
  // Update main document with pointer and preview
  const preview = extractedText.substring(0, 50000); // First 50K chars as preview
  
  await firestore.collection('context_sources').doc(sourceId).update({
    extractedData: preview + '\n\n[... Full text stored in text_chunks subcollection ...]',
    metadata: {
      ...metadata,
      storageMethod: 'chunked',
      textSizeMB: textSizeMB,
      totalChunks: numChunks,
      fullTextAvailable: true
    }
  });
  
  console.log(`   ✅ Main document updated with preview`);
  
  return {
    sourceId,
    chunksStored: numChunks,
    totalBytes: textSizeBytes,
    method: 'chunked'
  };
}

/**
 * Retrieve full extracted text (handles chunked storage)
 * 
 * @param firestore - Firestore instance (must be initialized)
 * @param sourceId - Context source document ID
 */
export async function retrieveExtractedText(
  firestore: Firestore,
  sourceId: string
): Promise<string> {
  const doc = await firestore.collection('context_sources').doc(sourceId).get();
  
  if (!doc.exists) {
    throw new Error(`Source ${sourceId} not found`);
  }
  
  const data = doc.data();
  const storageMethod = data?.metadata?.storageMethod;
  
  // If direct storage, return as-is
  if (storageMethod === 'direct' || !storageMethod) {
    return data?.extractedData || '';
  }
  
  // If chunked storage, retrieve all chunks
  console.log(`   📦 Retrieving ${data?.metadata?.totalChunks} chunks...`);
  
  const chunksSnapshot = await firestore
    .collection('context_sources')
    .doc(sourceId)
    .collection('text_chunks')
    .orderBy('index', 'asc')
    .get();
  
  if (chunksSnapshot.empty) {
    throw new Error(`No chunks found for source ${sourceId}`);
  }
  
  // Combine chunks
  const fullText = chunksSnapshot.docs
    .map(doc => doc.data().text)
    .join('');
  
  console.log(`   ✅ Retrieved ${fullText.length.toLocaleString()} chars from chunks`);
  
  return fullText;
}

/**
 * Check if text will exceed Firestore limit
 */
export function willExceedFirestoreLimit(text: string): boolean {
  const sizeBytes = Buffer.byteLength(text, 'utf8');
  return sizeBytes >= FIRESTORE_FIELD_LIMIT;
}

/**
 * Get storage recommendation
 */
export function getStorageRecommendation(textSizeBytes: number): {
  method: 'direct' | 'chunked';
  reason: string;
} {
  if (textSizeBytes < FIRESTORE_FIELD_LIMIT) {
    return {
      method: 'direct',
      reason: `Text is ${(textSizeBytes / 1024 / 1024).toFixed(2)}MB (under 1MB limit)`
    };
  } else {
    const chunks = Math.ceil(textSizeBytes / CHUNK_SIZE);
    return {
      method: 'chunked',
      reason: `Text is ${(textSizeBytes / 1024 / 1024).toFixed(2)}MB (requires ${chunks} chunks)`
    };
  }
}

