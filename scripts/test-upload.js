#!/usr/bin/env node

/**
 * Test Upload Script - Upload 1 + 3 PDFs from S001-20251118
 * Tests the upload pipeline before processing the full batch
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import FormData from 'form-data';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CONFIG = {
  apiBaseUrl: process.env.API_URL || 'http://localhost:3000',
  organization: 'salfa-corp',
  domain: 'maqsa.cl',
  model: 'gemini-2.5-flash',
  tag: 'S001-20251118',
  userId: process.env.USER_ID || 'alec@getaifactory.com',
};

// Test files to upload
const TEST_FILES = [
  {
    name: 'MAQ-LOG-CBO-P-001 Gestión de Bodegas de Obras Rev.08.pdf',
    path: 'upload-queue/S001-20251118',
    description: 'Main procedure document (root folder)'
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

// Status tracking
const uploadResults = [];

/**
 * Upload a single file
 */
async function uploadFile(fileInfo, index) {
  const filePath = path.join(__dirname, '..', fileInfo.path, fileInfo.name);
  
  console.log(`\n${'='.repeat(80)}`);
  console.log(`📤 UPLOADING FILE ${index + 1}/${TEST_FILES.length}`);
  console.log(`${'='.repeat(80)}`);
  console.log(`📄 File: ${fileInfo.name}`);
  console.log(`📁 Location: ${fileInfo.path}`);
  console.log(`📝 Description: ${fileInfo.description}`);
  console.log(`🏷️  Tag: ${CONFIG.tag}`);
  console.log(`🏢 Organization: ${CONFIG.organization}`);
  console.log(`🌐 Domain: ${CONFIG.domain}`);
  
  const result = {
    file: fileInfo.name,
    description: fileInfo.description,
    status: 'pending',
    startTime: new Date(),
    endTime: null,
    duration: null,
    sourceId: null,
    size: null,
    extractionStatus: null,
    chunkCount: null,
    ragEnabled: false,
    error: null,
  };
  
  try {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    
    const stats = fs.statSync(filePath);
    result.size = stats.size;
    console.log(`📊 Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    
    // Prepare form data
    const formData = new FormData();
    const fileStream = fs.createReadStream(filePath);
    formData.append('files', fileStream, fileInfo.name);
    formData.append('tags', CONFIG.tag);
    formData.append('userId', CONFIG.userId);
    formData.append('organization', CONFIG.organization);
    formData.append('domain', CONFIG.domain);
    formData.append('model', CONFIG.model);
    
    console.log(`\n⬆️  Uploading...`);
    
    // Upload file
    const uploadResponse = await axios.post(
      `${CONFIG.apiBaseUrl}/api/extract-document`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        timeout: 300000, // 5 minutes
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          if (percentCompleted % 25 === 0) {
            process.stdout.write(`\r   Progress: ${'█'.repeat(percentCompleted / 5)}${'░'.repeat(20 - percentCompleted / 5)} ${percentCompleted}%`);
          }
        },
      }
    );
    
    console.log('\n✅ Upload complete!');
    
    if (uploadResponse.data && uploadResponse.data.sources && uploadResponse.data.sources[0]) {
      const source = uploadResponse.data.sources[0];
      result.sourceId = source.id;
      result.status = 'uploaded';
      
      console.log(`\n🆔 Source ID: ${source.id}`);
      console.log(`📝 Extraction: ${source.extractedText ? 'Started' : 'Pending'}`);
      
      // Monitor pipeline
      console.log(`\n⏳ Monitoring pipeline stages...`);
      await monitorPipeline(result);
      
    } else {
      throw new Error('No source ID returned from upload');
    }
    
  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);
    result.status = 'failed';
    result.error = error.message;
  }
  
  result.endTime = new Date();
  result.duration = Math.round((result.endTime - result.startTime) / 1000);
  uploadResults.push(result);
  
  console.log(`\n⏱️  Duration: ${result.duration}s`);
  console.log(`📊 Status: ${result.status === 'completed' ? '✅ COMPLETED' : result.status === 'failed' ? '❌ FAILED' : '⚠️ PARTIAL'}`);
  
  return result;
}

/**
 * Monitor pipeline progress
 */
async function monitorPipeline(result) {
  const maxAttempts = 60; // 2 minutes max
  const interval = 2000; // Check every 2 seconds
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const response = await axios.get(
        `${CONFIG.apiBaseUrl}/api/context/source/${result.sourceId}`,
        { timeout: 5000 }
      );
      
      const source = response.data;
      
      // Update extraction status
      if (source.extractedText && !result.extractionStatus) {
        result.extractionStatus = 'completed';
        console.log(`   📝 Extraction: ✅ Complete (${Math.round(source.extractedText.length / 1024)}KB text)`);
      }
      
      // Update chunk count
      if (source.chunkCount > 0 && !result.chunkCount) {
        result.chunkCount = source.chunkCount;
        console.log(`   🔨 Chunking: ✅ Complete (${source.chunkCount} chunks)`);
      }
      
      // Check RAG status
      if (source.ragEnabled && source.ragMetadata) {
        result.ragEnabled = true;
        result.status = 'completed';
        console.log(`   ⚡ Embedding: ✅ Complete (RAG enabled)`);
        console.log(`   🎉 Pipeline: ✅ FULLY COMPLETED`);
        return;
      }
      
      // Wait before next check
      await new Promise(resolve => setTimeout(resolve, interval));
      
    } catch (error) {
      console.error(`   ⚠️  Monitoring error: ${error.message}`);
    }
  }
  
  console.log(`   ⏰ Timeout: Pipeline monitoring timed out after ${maxAttempts * interval / 1000}s`);
  result.status = 'timeout';
}

/**
 * Print summary table
 */
function printSummary() {
  console.log(`\n\n${'='.repeat(120)}`);
  console.log(`📊 TEST UPLOAD SUMMARY`);
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
      uploaded: '⚠️',
      timeout: '⏰',
      failed: '❌',
      pending: '⏸',
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
    failed: uploadResults.filter(r => r.status === 'failed').length,
    timeout: uploadResults.filter(r => r.status === 'timeout').length,
    totalDuration: uploadResults.reduce((sum, r) => sum + (r.duration || 0), 0),
    totalChunks: uploadResults.reduce((sum, r) => sum + (r.chunkCount || 0), 0),
  };
  
  console.log(`\n📈 Statistics:`);
  console.log(`   Total Files: ${stats.total}`);
  console.log(`   ✅ Completed: ${stats.completed} (${Math.round(stats.completed / stats.total * 100)}%)`);
  console.log(`   ❌ Failed: ${stats.failed}`);
  console.log(`   ⏰ Timeout: ${stats.timeout}`);
  console.log(`   ⏱️  Total Duration: ${stats.totalDuration}s`);
  console.log(`   📊 Average Duration: ${Math.round(stats.totalDuration / stats.total)}s per file`);
  console.log(`   🔨 Total Chunks: ${stats.totalChunks}`);
  console.log(`   📈 Avg Chunks/File: ${Math.round(stats.totalChunks / stats.completed)}`);
  
  console.log(`\n${stats.completed === stats.total ? '✅ ALL TESTS PASSED!' : '⚠️ SOME TESTS HAD ISSUES'}`);
  console.log(`${'='.repeat(120)}\n`);
}

/**
 * Test quality with sample queries
 */
async function testQuality() {
  console.log(`\n${'='.repeat(120)}`);
  console.log(`🔍 QUALITY VERIFICATION TESTS`);
  console.log(`${'='.repeat(120)}`);
  
  const queries = [
    "¿Cuál es el procedimiento para la gestión de bodegas de obras según MAQSA?",
    "¿Cómo se realiza la toma de inventario en las bodegas?",
    "¿Cuál es el proceso para el cierre de bodegas?",
  ];
  
  console.log(`\n💡 Recommended test queries:\n`);
  for (let i = 0; i < queries.length; i++) {
    console.log(`   ${i + 1}. "${queries[i]}"`);
  }
  
  console.log(`\n📝 Instructions:`);
  console.log(`   1. Open your chat interface`);
  console.log(`   2. Select "S001-20251118" as context filter`);
  console.log(`   3. Try each query above`);
  console.log(`   4. Verify results are relevant and from uploaded documents`);
  console.log(`\n${'='.repeat(120)}\n`);
}

/**
 * Main execution
 */
async function main() {
  console.log(`╔${'═'.repeat(118)}╗`);
  console.log(`║${' '.repeat(118)}║`);
  console.log(`║${'TEST UPLOAD - S001-20251118 (1 + 3 Documents)'.padStart(82).padEnd(118)}║`);
  console.log(`║${' '.repeat(118)}║`);
  console.log(`╚${'═'.repeat(118)}╝`);
  
  console.log(`\n📋 Configuration:`);
  console.log(`   API URL: ${CONFIG.apiBaseUrl}`);
  console.log(`   Organization: ${CONFIG.organization}`);
  console.log(`   Domain: ${CONFIG.domain}`);
  console.log(`   Model: ${CONFIG.model}`);
  console.log(`   Tag: ${CONFIG.tag}`);
  console.log(`   User: ${CONFIG.userId}`);
  
  console.log(`\n📁 Files to upload: ${TEST_FILES.length}`);
  TEST_FILES.forEach((file, i) => {
    console.log(`   ${i + 1}. ${file.name}`);
    console.log(`      └─ ${file.description}`);
  });
  
  console.log(`\n🚀 Starting upload process...`);
  
  // Upload each file sequentially
  for (let i = 0; i < TEST_FILES.length; i++) {
    await uploadFile(TEST_FILES[i], i);
    
    // Brief pause between uploads
    if (i < TEST_FILES.length - 1) {
      console.log(`\n⏸️  Pausing 3s before next upload...\n`);
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
  
  // Print summary
  printSummary();
  
  // Quality test instructions
  await testQuality();
  
  // Save results
  const outputPath = path.join(__dirname, '../test-upload-results.json');
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

