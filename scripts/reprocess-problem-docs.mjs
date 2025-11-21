#!/usr/bin/env node

/**
 * Re-process problem documents for S2-v2
 * 
 * This script:
 * 1. Re-extracts text from PDFs using Gemini
 * 2. Generates chunks
 * 3. Generates embeddings
 * 4. Syncs to BigQuery
 * 
 * Usage: npx tsx scripts/reprocess-problem-docs.mjs
 */

import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { extractDocument } from '../cli/lib/extraction.js';
import { chunkText } from '../src/lib/chunking.js';
import { generateEmbedding } from '../src/lib/embeddings.js';
import { syncChunkToBigQuery } from '../src/lib/bigquery-vector-search.js';
import * as fs from 'fs';
import * as path from 'path';

initializeApp({ projectId: 'salfagpt' });
const firestore = getFirestore();

const PROBLEM_DOCS_FILE = '/tmp/s2v2-problem-docs.json';
const DOCS_FOLDER = '/Users/alec/salfagpt/upload-queue/S002-20251118';
const AGENT_ID = '1lgr33ywq5qed67sqCYi';
const USER_ID = 'usr_uhwqffaqag1wrryd82tw';

// Stats
let stats = {
  total: 0,
  extracted: 0,
  chunked: 0,
  embedded: 0,
  synced: 0,
  failed: []
};

/**
 * Find PDF file in folder (case-insensitive, recursive)
 */
function findPDFFile(folderPath, filename) {
  const cleanFilename = filename.toLowerCase();
  
  function searchRecursive(dir) {
    try {
      const files = fs.readdirSync(dir);
      
      for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          const result = searchRecursive(fullPath);
          if (result) return result;
        } else if (file.toLowerCase() === cleanFilename) {
          return fullPath;
        }
      }
    } catch (error) {
      // Skip directories we can't read
      return null;
    }
    return null;
  }
  
  return searchRecursive(folderPath);
}

/**
 * Re-extract PDF with Gemini
 */
async function reExtractPDF(sourceId, sourceName, filePath) {
  console.log(`\n📄 Processing: ${sourceName}`);
  console.log(`   Source ID: ${sourceId}`);
  console.log(`   File: ${filePath.replace(DOCS_FOLDER, '...')}`);
  
  try {
    // 1. Extract with Gemini
    console.log('   1/4 Extracting with Gemini...');
    const result = await extractDocument(filePath, 'gemini-2.5-flash');
    
    if (!result.success || !result.extractedText || result.extractedText.length < 100) {
      // If default extraction failed, try with improved prompt for scanned docs
      console.log('   ⚠️  Standard extraction yielded empty/short text. Retrying with improved OCR prompt...');
      const resultRetry = await extractDocument(filePath, 'gemini-2.5-flash'); // Function has updated prompt internally now
      
      if (!resultRetry.success || !resultRetry.extractedText || resultRetry.extractedText.length < 100) {
         throw new Error(`Extraction failed: ${resultRetry.error || 'Empty text (scanned PDF?)'}`);
      }
       // Use retry result
       Object.assign(result, resultRetry);
    }
    
    const extractedData = result.extractedText;
    console.log(`   ✓ Extracted ${extractedData.length} chars (${result.duration}ms)`);
    
    // 2. Update Firestore with extractedData
    console.log('   2/4 Updating Firestore...');
    await firestore.collection('context_sources').doc(sourceId).update({
      extractedData,
      extractedAt: new Date(),
      extractedWith: 'gemini-2.5-flash',
      extractedChars: extractedData.length,
      extractionCost: result.estimatedCost || 0
    });
    stats.extracted++;
    
    // 3. Generate chunks
    console.log('   3/4 Generating chunks...');
    // chunkText expects (text, chunkSizeInTokens, overlapInTokens)
    // We want ~2000 chars per chunk = 500 tokens, overlap ~200 chars = 50 tokens
    const chunks = chunkText(extractedData, 500, 50);
    
    console.log(`   ✓ Generated ${chunks.length} chunks`);
    
    // Delete existing chunks first (if any)
    const existingChunks = await firestore.collection('document_chunks')
      .where('sourceId', '==', sourceId)
      .get();
    
    if (!existingChunks.empty) {
      console.log(`   ⚠️  Deleting ${existingChunks.size} existing chunks...`);
      const batch = firestore.batch();
      existingChunks.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
    }
    
    // 4. Generate embeddings and save chunks
    console.log('   4/4 Generating embeddings and saving...');
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const chunkId = `${sourceId}_chunk_${i}`;
      
      // Generate embedding
      const embedding = await generateEmbedding(chunk.text);
      
      // Save to Firestore
      const chunkData = {
        sourceId,
        userId: USER_ID,
        agentId: AGENT_ID,
        chunkIndex: i,
        text: chunk.text,
        embedding,
        metadata: {
          startChar: chunk.startChar || 0,
          endChar: chunk.endChar || chunk.text.length,
          tokenCount: Math.ceil(chunk.text.length / 4), // Rough estimate
        },
        createdAt: new Date()
      };
      
      await firestore.collection('document_chunks').doc(chunkId).set(chunkData);
      
      // Sync to BigQuery
      try {
        await syncChunkToBigQuery({
          id: chunkId,
          sourceId,
          userId: USER_ID,
          chunkIndex: i,
          text: chunk.text,
          embedding,
          metadata: chunkData.metadata
        });
        stats.synced++;
      } catch (error) {
        console.log(`   ⚠️  BigQuery sync failed for chunk ${i}: ${error.message}`);
      }
      
      // Progress indicator
      if ((i + 1) % 5 === 0 || i === chunks.length - 1) {
        process.stdout.write(`\r   Progress: ${i + 1}/${chunks.length} chunks`);
      }
    }
    
    console.log(`\n   ✅ Completed: ${chunks.length} chunks with embeddings`);
    
    stats.chunked += chunks.length;
    stats.embedded += chunks.length;
    
    return { success: true, chunks: chunks.length };
    
  } catch (error) {
    console.error(`   ❌ Failed: ${error.message}`);
    stats.failed.push({ sourceId, name: sourceName, error: error.message });
    return { success: false, error: error.message };
  }
}

/**
 * Main process
 */
async function main() {
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║         RE-PROCESS PROBLEM DOCUMENTS FOR S2-V2                ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');
  
  // Load problem docs
  console.log('📁 Loading problem documents...');
  const reportData = JSON.parse(fs.readFileSync(PROBLEM_DOCS_FILE, 'utf-8'));
  const problemDocs = reportData.problemDocs;
  
  console.log(`   Found ${problemDocs.length} documents to process\n`);
  stats.total = problemDocs.length;
  
  console.log('🔍 Locating PDF files...');
  const docsToProcess = [];
  
  for (const doc of problemDocs) {
    const filePath = findPDFFile(DOCS_FOLDER, doc.name);
    
    if (!filePath) {
      console.log(`   ❌ File not found: ${doc.name}`);
      stats.failed.push({ sourceId: doc.id, name: doc.name, error: 'File not found' });
      continue;
    }
    
    console.log(`   ✓ ${doc.name}`);
    docsToProcess.push({ ...doc, filePath });
  }
  
  console.log(`\n✅ Found ${docsToProcess.length}/${problemDocs.length} PDF files\n`);
  
  if (docsToProcess.length === 0) {
    console.log('❌ No files to process. Exiting.');
    process.exit(1);
  }
  
  console.log('🚀 Starting re-processing...\n');
  console.log('═'.repeat(80));
  
  for (let i = 0; i < docsToProcess.length; i++) {
    const doc = docsToProcess[i];
    
    console.log(`\n[${i + 1}/${docsToProcess.length}] ${doc.name}`);
    
    await reExtractPDF(doc.id, doc.name, doc.filePath);
    
    // Small delay to avoid rate limiting
    if (i < docsToProcess.length - 1) {
      console.log('   ⏳ Waiting 3 seconds...');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
  
  // Summary
  console.log('\n' + '═'.repeat(80));
  console.log('\n📊 FINAL SUMMARY');
  console.log('═'.repeat(80));
  console.log(`Total documents:       ${stats.total}`);
  console.log(`✅ Successfully extracted: ${stats.extracted}`);
  console.log(`📦 Total chunks:           ${stats.chunked}`);
  console.log(`🧮 Total embeddings:       ${stats.embedded}`);
  console.log(`☁️  Synced to BigQuery:    ${stats.synced}`);
  console.log(`❌ Failed:                 ${stats.failed.length}`);
  
  if (stats.failed.length > 0) {
    console.log('\n⚠️  FAILED DOCUMENTS:');
    stats.failed.forEach((f, idx) => {
      console.log(`   ${idx + 1}. ${f.name}`);
      console.log(`      Error: ${f.error}`);
    });
  }
  
  // Save stats
  const statsFile = '/tmp/s2v2-reprocess-stats.json';
  fs.writeFileSync(statsFile, JSON.stringify(stats, null, 2));
  console.log(`\n📁 Stats saved to: ${statsFile}`);
  
  console.log('\n✅ Re-processing complete!');
  console.log('\n💡 Next steps:');
  console.log('   1. Run validation script to verify all documents are processed');
  console.log('   2. Test RAG search with sample queries');
  console.log('   3. Compare before/after metrics');
  
  process.exit(stats.failed.length > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('\n❌ Fatal error:', err);
  process.exit(1);
});
