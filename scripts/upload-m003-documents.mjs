#!/usr/bin/env node

/**
 * Upload M003-20251119 Documents to Firestore
 * 
 * Processes documents from upload-queue/M003-20251119 and uploads to:
 * 1. Firestore context_sources (with extractedData)
 * 2. Auto-assigns to M3-v2 agent
 */

import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { Storage } from '@google-cloud/storage';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname, basename } from 'path';
import pdf from 'pdf-parse/lib/pdf-parse.js';
import mammoth from 'mammoth';
import xlsx from 'xlsx';

// Initialize Firebase Admin
const PRODUCTION_PROJECT = 'salfagpt';
initializeApp({ projectId: PRODUCTION_PROJECT });
const db = getFirestore();
const storage = new Storage({ projectId: PRODUCTION_PROJECT });

// Constants
const M3V2_AGENT_ID = 'vStojK73ZKbjNsEnqANJ'; // M3-v2 GOP GPT
const USER_ID = 'usr_uhwqffaqag1wrryd82tw'; // alec@salfacloud.cl
const UPLOAD_FOLDER = '/Users/alec/salfagpt/upload-queue/M003-20251119';
const GCS_BUCKET = 'salfagpt-context-documents';

// Track stats
const stats = {
  total: 0,
  uploaded: 0,
  skipped: 0,
  failed: 0,
  extractedChars: 0,
  startTime: Date.now()
};

/**
 * Recursively find all documents
 */
function findAllDocuments(dir, fileList = []) {
  const files = readdirSync(dir);
  
  files.forEach(file => {
    const filePath = join(dir, file);
    const stat = statSync(filePath);
    
    if (stat.isDirectory()) {
      findAllDocuments(filePath, fileList);
    } else {
      const ext = extname(file).toLowerCase();
      if (['.pdf', '.xlsx', '.docx'].includes(ext)) {
        fileList.push({
          name: file,
          path: filePath,
          size: stat.size,
          type: ext.substring(1)
        });
      }
    }
  });
  
  return fileList;
}

/**
 * Extract text from PDF
 */
async function extractPDF(filePath) {
  try {
    const dataBuffer = readFileSync(filePath);
    const data = await pdf(dataBuffer);
    return data.text || '';
  } catch (error) {
    console.error(`    ❌ PDF extraction failed: ${error.message}`);
    return '';
  }
}

/**
 * Extract text from DOCX
 */
async function extractDOCX(filePath) {
  try {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value || '';
  } catch (error) {
    console.error(`    ❌ DOCX extraction failed: ${error.message}`);
    return '';
  }
}

/**
 * Extract text from XLSX
 */
function extractXLSX(filePath) {
  try {
    const workbook = xlsx.readFile(filePath);
    let text = '';
    
    workbook.SheetNames.forEach(sheetName => {
      const sheet = workbook.Sheets[sheetName];
      text += `\n=== ${sheetName} ===\n`;
      text += xlsx.utils.sheet_to_txt(sheet);
    });
    
    return text;
  } catch (error) {
    console.error(`    ❌ XLSX extraction failed: ${error.message}`);
    return '';
  }
}

/**
 * Extract text based on file type
 */
async function extractText(filePath, type) {
  switch (type) {
    case 'pdf':
      return await extractPDF(filePath);
    case 'docx':
      return await extractDOCX(filePath);
    case 'xlsx':
      return extractXLSX(filePath);
    default:
      return '';
  }
}

/**
 * Check if document already exists in Firestore
 */
async function checkExists(fileName) {
  const snapshot = await db.collection('context_sources')
    .where('userId', '==', USER_ID)
    .where('name', '==', fileName)
    .limit(1)
    .get();
  
  return !snapshot.empty;
}

/**
 * Upload document to Firestore
 */
async function uploadDocument(doc) {
  try {
    // Check if exists
    const exists = await checkExists(doc.name);
    if (exists) {
      console.log(`  ⏭️  Skipped (exists): ${doc.name}`);
      stats.skipped++;
      return null;
    }
    
    console.log(`  📄 Processing: ${doc.name}...`);
    
    // Extract text
    const extractedData = await extractText(doc.path, doc.type);
    
    if (!extractedData || extractedData.length < 10) {
      console.log(`    ⚠️  No text extracted (empty or failed)`);
      stats.failed++;
      return null;
    }
    
    console.log(`    ✅ Extracted ${extractedData.length.toLocaleString()} chars`);
    stats.extractedChars += extractedData.length;
    
    // Create context source
    const sourceData = {
      userId: USER_ID,
      name: doc.name,
      type: doc.type,
      status: 'active',
      enabled: true,
      addedAt: new Date(),
      extractedData: extractedData,
      assignedToAgents: [M3V2_AGENT_ID], // Auto-assign to M3-v2
      metadata: {
        originalFileName: doc.name,
        originalFileSize: doc.size,
        extractionDate: new Date(),
        charactersExtracted: extractedData.length,
        tokensEstimate: Math.ceil(extractedData.length / 4),
        extractionMethod: 'local-script',
        model: 'local-extraction'
      },
      source: 'localhost'
    };
    
    const sourceRef = await db.collection('context_sources').add(sourceData);
    console.log(`    💾 Firestore ID: ${sourceRef.id}`);
    
    // Create agent_sources assignment
    await db.collection('agent_sources').add({
      agentId: M3V2_AGENT_ID,
      sourceId: sourceRef.id,
      userId: USER_ID,
      assignedAt: new Date()
    });
    console.log(`    🔗 Assigned to M3-v2`);
    
    stats.uploaded++;
    return sourceRef.id;
    
  } catch (error) {
    console.error(`    ❌ Failed: ${error.message}`);
    stats.failed++;
    return null;
  }
}

/**
 * Update agent's activeContextSourceIds
 */
async function updateAgentContext(sourceIds) {
  console.log('\n📝 Updating M3-v2 activeContextSourceIds...');
  
  try {
    await db.collection('conversations').doc(M3V2_AGENT_ID).update({
      activeContextSourceIds: FieldValue.arrayUnion(...sourceIds),
      updatedAt: new Date()
    });
    
    console.log(`✅ Added ${sourceIds.length} sources to M3-v2 context`);
  } catch (error) {
    console.error(`❌ Failed to update agent: ${error.message}`);
  }
}

/**
 * Main execution
 */
async function runUpload() {
  console.log('🚀 Starting M003 document upload...\n');
  
  // Find all documents
  const documents = findAllDocuments(UPLOAD_FOLDER);
  stats.total = documents.length;
  
  console.log(`📂 Found ${documents.length} documents\n`);
  console.log('Starting upload and extraction...\n');
  
  const uploadedIds = [];
  
  // Process in batches to avoid overwhelming
  const BATCH_SIZE = 10;
  for (let i = 0; i < documents.length; i += BATCH_SIZE) {
    const batch = documents.slice(i, i + BATCH_SIZE);
    
    console.log(`\n📦 Batch ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(documents.length/BATCH_SIZE)} (${i + 1}-${Math.min(i + BATCH_SIZE, documents.length)}/${documents.length})`);
    console.log('─'.repeat(80));
    
    for (const doc of batch) {
      const sourceId = await uploadDocument(doc);
      if (sourceId) {
        uploadedIds.push(sourceId);
      }
    }
  }
  
  // Update agent context if any uploaded
  if (uploadedIds.length > 0) {
    await updateAgentContext(uploadedIds);
  }
  
  // Final summary
  const duration = ((Date.now() - stats.startTime) / 1000 / 60).toFixed(1);
  
  console.log('\n\n' + '='.repeat(80));
  console.log('📊 UPLOAD COMPLETE - M3-v2 GOP GPT');
  console.log('='.repeat(80));
  console.log(`\n| Métrica | Valor |`);
  console.log(`|---------|-------|`);
  console.log(`| Total documents | ${stats.total} |`);
  console.log(`| ✅ Uploaded | ${stats.uploaded} |`);
  console.log(`| ⏭️  Skipped (exists) | ${stats.skipped} |`);
  console.log(`| ❌ Failed | ${stats.failed} |`);
  console.log(`| 📝 Characters extracted | ${stats.extractedChars.toLocaleString()} |`);
  console.log(`| ⏱️  Duration | ${duration} min |`);
  console.log(`| 🎯 Success rate | ${((stats.uploaded/(stats.total - stats.skipped))*100).toFixed(1)}% |`);
  
  console.log(`\n✅ M3-v2 now has ${stats.skipped + stats.uploaded} sources assigned\n`);
}

runUpload()
  .then(() => {
    console.log('✅ Done!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });




