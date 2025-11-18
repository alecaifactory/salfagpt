#!/usr/bin/env node

/**
 * Complete Upload Script - Full pipeline integration
 * Uploads PDFs and saves them to Firestore with tags and RAG
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import FormData from 'form-data';
import axios from 'axios';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CONFIG = {
  apiBaseUrl: 'http://localhost:3000',
  organization: 'salfa-corp',
  organizationName: 'Salfa-Corp',
  domain: 'maqsa.cl',
  model: 'gemini-2.5-flash',
  tag: 'S001-20251118',
  userId: 'alec@getaifactory.com',
};

// Test files
const TEST_FILES = [
  {
    name: 'MAQ-LOG-CBO-P-001 Gestión de Bodegas de Obras Rev.08.pdf',
    path: 'upload-queue/S001-20251118',
    description: 'Main procedure document'
  },
  {
    name: 'MAQ-LOG-CBO-I-001 Toma de Inventario Rev.05.pdf',
    path: 'upload-queue/S001-20251118/DOCUMENTOS',
    description: 'Inventory taking procedure'
  },
  {
    name: 'MAQ-LOG-CBO-I-002 Cierre de Bodegas Rev.08.pdf',
    path: 'upload-queue/S001-20251118/DOCUMENTOS',
    description: 'Warehouse closing procedure'
  },
  {
    name: 'MAQ-LOG-CBO-I-005 Solic. recep. y entrega de mat. serv. y EPP Rev.04.pdf',
    path: 'upload-queue/S001-20251118/DOCUMENTOS',
    description: 'Material and PPE request/delivery'
  },
];

// Initialize Firebase Admin
let db;
try {
  // Try to initialize Firebase Admin (if credentials exist)
  const serviceAccountPath = path.join(__dirname, '../service-account-key.json');
  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    initializeApp({
      credential: cert(serviceAccount)
    });
    db = getFirestore();
    console.log('✅ Firebase Admin initialized\n');
  } else {
    console.log('⚠️  No service account found, will use API only\n');
  }
} catch (error) {
  console.log('⚠️  Firebase Admin initialization skipped:', error.message, '\n');
}

const uploadResults = [];

/**
 * Upload and process a single file
 */
async function uploadFile(fileInfo, index) {
  const filePath = path.join(__dirname, '..', fileInfo.path, fileInfo.name);
  
  console.log(`\n${'='.repeat(80)}`);
  console.log(`📤 UPLOADING FILE ${index + 1}/${TEST_FILES.length}`);
  console.log(`${'='.repeat(80)}`);
  console.log(`📄 File: ${fileInfo.name}`);
  console.log(`📁 Location: ${fileInfo.path}`);
  console.log(`📝 Description: ${fileInfo.description}`);
  
  const result = {
    file: fileInfo.name,
    description: fileInfo.description,
    status: 'pending',
    startTime: new Date(),
    sourceId: null,
    extractedText: null,
    chunkCount: 0,
    ragEnabled: false,
    error: null,
  };
  
  try {
    // Check file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    
    const stats = fs.statSync(filePath);
    console.log(`📊 Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    
    // Step 1: Extract text via API
    console.log(`\n⬆️  Step 1/3: Uploading and extracting...`);
    
    const formData = new FormData();
    const fileStream = fs.createReadStream(filePath);
    formData.append('file', fileStream, fileInfo.name);
    formData.append('userId', CONFIG.userId);
    formData.append('model', CONFIG.model);
    
    const extractResponse = await axios.post(
      `${CONFIG.apiBaseUrl}/api/extract-document`,
      formData,
      {
        headers: formData.getHeaders(),
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        timeout: 300000,
      }
    );
    
    if (!extractResponse.data.success) {
      throw new Error(extractResponse.data.error || 'Extraction failed');
    }
    
    result.extractedText = extractResponse.data.extractedText;
    const metadata = extractResponse.data.metadata;
    
    console.log(`   ✅ Extracted: ${(result.extractedText.length / 1024).toFixed(1)}KB text`);
    console.log(`   📊 Characters: ${metadata.characters}`);
    
    // Step 2: Save to Firestore
    if (db) {
      console.log(`\n💾 Step 2/3: Saving to Firestore...`);
      
      const sourceId = `source-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      result.sourceId = sourceId;
      
      const sourceData = {
        id: sourceId,
        name: fileInfo.name,
        type: 'document',
        userId: CONFIG.userId,
        organizationId: CONFIG.organization,
        domainId: CONFIG.domain,
        tags: [CONFIG.tag],
        enabled: true,
        ragEnabled: false,
        extractedText: result.extractedText,
        metadata: {
          ...metadata,
          originalFileName: fileInfo.name,
          uploadDate: new Date(),
          organization: CONFIG.organizationName,
          domain: CONFIG.domain,
          tag: CONFIG.tag,
          subfolder: fileInfo.path.includes('DOCUMENTOS') ? 'DOCUMENTOS' : 'root',
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      await db.collection('context_sources').doc(sourceId).set(sourceData);
      console.log(`   ✅ Saved to Firestore: ${sourceId}`);
      
      // Step 3: Enable RAG (chunk and embed)
      console.log(`\n⚡ Step 3/3: Enabling RAG indexing...`);
      
      try {
        const ragResponse = await axios.post(
          `${CONFIG.apiBaseUrl}/api/context-sources/${sourceId}/enable-rag`,
          {
            userId: CONFIG.userId,
            chunkSize: 1000,
            overlap: 100,
          },
          {
            headers: { 'Content-Type': 'application/json' },
            timeout: 300000,
          }
        );
        
        if (ragResponse.data.success) {
          result.chunkCount = ragResponse.data.chunksCreated;
          result.ragEnabled = true;
          
          // Update Firestore with RAG status
          await db.collection('context_sources').doc(sourceId).update({
            ragEnabled: true,
            chunkCount: result.chunkCount,
            updatedAt: new Date(),
          });
          
          console.log(`   ✅ RAG enabled: ${result.chunkCount} chunks created`);
        }
      } catch (ragError) {
        console.log(`   ⚠️  RAG indexing skipped: ${ragError.message}`);
        console.log(`   💡 You can enable RAG manually later via the UI`);
      }
      
      result.status = 'completed';
      
    } else {
      console.log(`\n⚠️  Firestore not available - extraction successful but not saved`);
      console.log(`   Use the UI to complete the upload process`);
      result.status = 'extracted';
    }
    
  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);
    if (error.response?.data) {
      console.error(`   API Response:`, error.response.data);
    }
    result.status = 'failed';
    result.error = error.message;
  }
  
  result.endTime = new Date();
  result.duration = Math.round((result.endTime - result.startTime) / 1000);
  uploadResults.push(result);
  
  console.log(`\n⏱️  Duration: ${result.duration}s`);
  console.log(`📊 Status: ${result.status === 'completed' ? '✅ COMPLETED' : result.status === 'extracted' ? '⚠️ EXTRACTED' : '❌ FAILED'}`);
  
  return result;
}

/**
 * Print summary
 */
function printSummary() {
  console.log(`\n\n${'='.repeat(120)}`);
  console.log(`📊 UPLOAD SUMMARY`);
  console.log(`${'='.repeat(120)}`);
  console.log(
    'File'.padEnd(60) +
    'Status'.padEnd(15) +
    'Duration'.padEnd(12) +
    'Chunks'.padEnd(10) +
    'RAG'
  );
  console.log('─'.repeat(120));
  
  for (const result of uploadResults) {
    const fileName = result.file.length > 58 
      ? result.file.substring(0, 55) + '...' 
      : result.file;
    
    const statusIcon = {
      completed: '✅',
      extracted: '⚠️',
      failed: '❌',
    }[result.status] || '❓';
    
    console.log(
      fileName.padEnd(60) +
      `${statusIcon} ${result.status}`.padEnd(15) +
      `${result.duration}s`.padEnd(12) +
      `${result.chunkCount || '-'}`.padEnd(10) +
      (result.ragEnabled ? '✅' : '❌')
    );
  }
  
  console.log('─'.repeat(120));
  
  const stats = {
    total: uploadResults.length,
    completed: uploadResults.filter(r => r.status === 'completed').length,
    extracted: uploadResults.filter(r => r.status === 'extracted').length,
    failed: uploadResults.filter(r => r.status === 'failed').length,
    totalChunks: uploadResults.reduce((sum, r) => sum + (r.chunkCount || 0), 0),
  };
  
  console.log(`\n📈 Statistics:`);
  console.log(`   Total Files: ${stats.total}`);
  console.log(`   ✅ Completed (with RAG): ${stats.completed}`);
  console.log(`   ⚠️  Extracted (no Firestore): ${stats.extracted}`);
  console.log(`   ❌ Failed: ${stats.failed}`);
  console.log(`   🔨 Total Chunks: ${stats.totalChunks}`);
  
  if (stats.completed > 0) {
    console.log(`\n✅ SUCCESS! ${stats.completed} files fully processed and ready to use!`);
  } else if (stats.extracted > 0) {
    console.log(`\n⚠️  Files extracted but need Firestore save. Use the UI to complete.`);
  } else {
    console.log(`\n❌ All uploads failed. Check errors above.`);
  }
  
  console.log(`${'='.repeat(120)}\n`);
}

/**
 * Main execution
 */
async function main() {
  console.log(`╔${'═'.repeat(118)}╗`);
  console.log(`║${' '.repeat(118)}║`);
  console.log(`║${'COMPLETE UPLOAD - S001-20251118 (1 + 3 Documents)'.padStart(82).padEnd(118)}║`);
  console.log(`║${' '.repeat(118)}║`);
  console.log(`╚${'═'.repeat(118)}╝`);
  
  console.log(`\n📋 Configuration:`);
  console.log(`   API URL: ${CONFIG.apiBaseUrl}`);
  console.log(`   Organization: ${CONFIG.organization}`);
  console.log(`   Domain: ${CONFIG.domain}`);
  console.log(`   Tag: ${CONFIG.tag}`);
  console.log(`   User: ${CONFIG.userId}`);
  console.log(`   Firestore: ${db ? '✅ Connected' : '❌ Not available'}`);
  
  if (!db) {
    console.log(`\n⚠️  WARNING: Firestore not available`);
    console.log(`   Files will be extracted but not saved to database`);
    console.log(`   To fix: Add service-account-key.json to project root`);
  }
  
  console.log(`\n🚀 Starting upload process...`);
  
  // Upload each file
  for (let i = 0; i < TEST_FILES.length; i++) {
    await uploadFile(TEST_FILES[i], i);
    
    if (i < TEST_FILES.length - 1) {
      console.log(`\n⏸️  Pausing 2s before next upload...\n`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  // Print summary
  printSummary();
  
  // Save results
  const outputPath = path.join(__dirname, '../complete-upload-results.json');
  fs.writeFileSync(outputPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    config: CONFIG,
    results: uploadResults,
  }, null, 2));
  console.log(`💾 Results saved to: ${outputPath}\n`);
}

// Run
main().catch(error => {
  console.error('\n💥 Fatal error:', error);
  process.exit(1);
});

export { uploadFile, TEST_FILES };

