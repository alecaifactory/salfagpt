#!/usr/bin/env node

/**
 * Upload Queue Processor for Context Management
 * 
 * This script scans folders in upload-queue/, finds all PDF files,
 * and uploads them to the Context Management system with proper tagging.
 * 
 * Features:
 * - Recursive folder scanning for .pdf files (case-insensitive)
 * - Progress tracking: Uploading → Extracting → Chunking → Embedding → Completed
 * - Organized by folder with auto-generated tags
 * - Upload to specified organization and domain
 * - Status table generation
 */

const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const axios = require('axios');

// Configuration
const CONFIG = {
  uploadQueueDir: path.join(__dirname, '../upload-queue'),
  apiBaseUrl: 'http://localhost:3001', // Adjust if needed
  organization: 'salfa-corp',
  domain: 'maqsa.cl',
  model: 'gemini-2.5-flash',
  batchSize: 5, // Process 5 files at a time
  pollingInterval: 2000, // Check status every 2 seconds
};

// Status tracking
const uploadStatus = {
  folders: {},
  stats: {
    total: 0,
    queued: 0,
    uploading: 0,
    extracting: 0,
    chunking: 0,
    embedding: 0,
    completed: 0,
    failed: 0,
  }
};

/**
 * Recursively find all PDF files in a directory
 */
function findPDFFiles(dir, baseDir = dir) {
  const results = [];
  
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relativePath = path.relative(baseDir, fullPath);
      
      if (entry.isDirectory()) {
        // Recursively search subdirectories
        results.push(...findPDFFiles(fullPath, baseDir));
      } else if (entry.isFile()) {
        // Check if it's a PDF (case-insensitive)
        const ext = path.extname(entry.name).toLowerCase();
        if (ext === '.pdf') {
          results.push({
            fullPath,
            relativePath,
            fileName: entry.name,
            size: fs.statSync(fullPath).size,
          });
        }
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error.message);
  }
  
  return results;
}

/**
 * Scan upload-queue directory and organize files by folder
 */
function scanUploadQueue() {
  console.log('🔍 Scanning upload-queue directory...\n');
  
  const folders = fs.readdirSync(CONFIG.uploadQueueDir, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
    .sort();
  
  for (const folderName of folders) {
    const folderPath = path.join(CONFIG.uploadQueueDir, folderName);
    const pdfFiles = findPDFFiles(folderPath);
    
    if (pdfFiles.length > 0) {
      uploadStatus.folders[folderName] = {
        tag: folderName,
        path: folderPath,
        files: pdfFiles.map(file => ({
          ...file,
          status: 'queued',
          progress: 0,
          sourceId: null,
          error: null,
          startTime: null,
          endTime: null,
        })),
        stats: {
          total: pdfFiles.length,
          queued: pdfFiles.length,
          uploading: 0,
          extracting: 0,
          chunking: 0,
          embedding: 0,
          completed: 0,
          failed: 0,
        }
      };
      
      uploadStatus.stats.total += pdfFiles.length;
      uploadStatus.stats.queued += pdfFiles.length;
      
      console.log(`📁 ${folderName}: ${pdfFiles.length} PDF files`);
    }
  }
  
  console.log(`\n✅ Found ${uploadStatus.stats.total} PDF files in ${Object.keys(uploadStatus.folders).length} folders\n`);
}

/**
 * Upload a single file to the API
 */
async function uploadFile(folderName, file, userId = 'system') {
  const formData = new FormData();
  
  try {
    // Update status
    updateFileStatus(folderName, file.relativePath, 'uploading', 0);
    file.startTime = new Date();
    
    // Prepare form data
    const fileStream = fs.createReadStream(file.fullPath);
    formData.append('files', fileStream, file.fileName);
    formData.append('tags', folderName);
    formData.append('userId', userId);
    formData.append('organization', CONFIG.organization);
    formData.append('domain', CONFIG.domain);
    formData.append('model', CONFIG.model);
    
    // Upload file
    const response = await axios.post(
      `${CONFIG.apiBaseUrl}/api/context/upload`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        timeout: 300000, // 5 minutes timeout
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          updateFileStatus(folderName, file.relativePath, 'uploading', percentCompleted);
        },
      }
    );
    
    if (response.data && response.data.sources && response.data.sources[0]) {
      file.sourceId = response.data.sources[0].id;
      updateFileStatus(folderName, file.relativePath, 'extracting', 25);
      
      // Start monitoring the pipeline
      await monitorPipeline(folderName, file);
      
      return { success: true, sourceId: file.sourceId };
    } else {
      throw new Error('No source ID returned from upload');
    }
  } catch (error) {
    console.error(`❌ Error uploading ${file.fileName}:`, error.message);
    updateFileStatus(folderName, file.relativePath, 'failed', 0, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Monitor pipeline progress for a file
 */
async function monitorPipeline(folderName, file) {
  return new Promise((resolve) => {
    const interval = setInterval(async () => {
      try {
        const response = await axios.get(
          `${CONFIG.apiBaseUrl}/api/context/source/${file.sourceId}`
        );
        
        const source = response.data;
        
        // Update status based on pipeline progress
        if (source.ragEnabled && source.ragMetadata) {
          updateFileStatus(folderName, file.relativePath, 'completed', 100);
          file.endTime = new Date();
          clearInterval(interval);
          resolve();
        } else if (source.chunkCount > 0) {
          updateFileStatus(folderName, file.relativePath, 'chunking', 75);
        } else if (source.extractedText) {
          updateFileStatus(folderName, file.relativePath, 'extracting', 50);
        }
        
        // Timeout after 10 minutes
        if (file.startTime && (Date.now() - file.startTime.getTime()) > 600000) {
          updateFileStatus(folderName, file.relativePath, 'failed', 0, 'Timeout: Processing took too long');
          clearInterval(interval);
          resolve();
        }
      } catch (error) {
        console.error(`Error monitoring ${file.fileName}:`, error.message);
        clearInterval(interval);
        resolve();
      }
    }, CONFIG.pollingInterval);
  });
}

/**
 * Update file status and statistics
 */
function updateFileStatus(folderName, relativePath, status, progress, error = null) {
  const folder = uploadStatus.folders[folderName];
  if (!folder) return;
  
  const file = folder.files.find(f => f.relativePath === relativePath);
  if (!file) return;
  
  // Update folder stats
  const oldStatus = file.status;
  if (oldStatus !== status) {
    if (folder.stats[oldStatus] !== undefined) folder.stats[oldStatus]--;
    if (folder.stats[status] !== undefined) folder.stats[status]++;
    
    // Update global stats
    if (uploadStatus.stats[oldStatus] !== undefined) uploadStatus.stats[oldStatus]--;
    if (uploadStatus.stats[status] !== undefined) uploadStatus.stats[status]++;
  }
  
  // Update file
  file.status = status;
  file.progress = progress;
  if (error) file.error = error;
}

/**
 * Process a folder sequentially
 */
async function processFolder(folderName, userId) {
  const folder = uploadStatus.folders[folderName];
  console.log(`\n📂 Processing folder: ${folderName}`);
  console.log(`   Tag: ${folder.tag}`);
  console.log(`   Files: ${folder.files.length}`);
  console.log(`   Organization: ${CONFIG.organization}`);
  console.log(`   Domain: ${CONFIG.domain}\n`);
  
  // Process files in batches
  for (let i = 0; i < folder.files.length; i += CONFIG.batchSize) {
    const batch = folder.files.slice(i, i + CONFIG.batchSize);
    
    console.log(`   📤 Uploading batch ${Math.floor(i / CONFIG.batchSize) + 1}/${Math.ceil(folder.files.length / CONFIG.batchSize)} (${batch.length} files)...`);
    
    // Process batch in parallel
    await Promise.all(
      batch.map(file => uploadFile(folderName, file, userId))
    );
    
    // Show progress
    printFolderProgress(folderName);
  }
  
  console.log(`\n✅ Folder ${folderName} processing complete!`);
  printFolderSummary(folderName);
}

/**
 * Print folder progress
 */
function printFolderProgress(folderName) {
  const folder = uploadStatus.folders[folderName];
  const stats = folder.stats;
  
  console.log(`   Progress: ${stats.completed}/${stats.total} completed, ${stats.failed} failed`);
}

/**
 * Print folder summary
 */
function printFolderSummary(folderName) {
  const folder = uploadStatus.folders[folderName];
  const stats = folder.stats;
  
  console.log(`\n   📊 Summary for ${folderName}:`);
  console.log(`      ✅ Completed: ${stats.completed}`);
  console.log(`      ❌ Failed: ${stats.failed}`);
  console.log(`      📁 Total: ${stats.total}`);
  
  if (stats.failed > 0) {
    console.log(`\n   ⚠️  Failed files:`);
    folder.files
      .filter(f => f.status === 'failed')
      .forEach(f => {
        console.log(`      - ${f.relativePath}: ${f.error}`);
      });
  }
}

/**
 * Generate status table for all folders
 */
function generateStatusTable() {
  console.log('\n' + '='.repeat(120));
  console.log('📊 UPLOAD STATUS TABLE');
  console.log('='.repeat(120));
  
  for (const [folderName, folder] of Object.entries(uploadStatus.folders)) {
    console.log(`\n📁 ${folderName} (Tag: ${folder.tag})`);
    console.log('─'.repeat(120));
    console.log(
      'File'.padEnd(60) +
      'Subfolder'.padEnd(25) +
      'Status'.padEnd(15) +
      'Progress'.padEnd(10) +
      'Time'
    );
    console.log('─'.repeat(120));
    
    for (const file of folder.files) {
      const subfolder = path.dirname(file.relativePath) === '.' 
        ? '(root)' 
        : path.dirname(file.relativePath);
      
      const fileName = file.fileName.length > 58 
        ? file.fileName.substring(0, 55) + '...' 
        : file.fileName;
      
      const statusIcon = {
        queued: '⏸',
        uploading: '⬆️',
        extracting: '📝',
        chunking: '🔨',
        embedding: '⚡',
        completed: '✅',
        failed: '❌',
      }[file.status] || '❓';
      
      const duration = file.startTime && file.endTime
        ? `${Math.round((file.endTime - file.startTime) / 1000)}s`
        : file.startTime
        ? `${Math.round((Date.now() - file.startTime.getTime()) / 1000)}s`
        : '-';
      
      console.log(
        fileName.padEnd(60) +
        subfolder.substring(0, 23).padEnd(25) +
        `${statusIcon} ${file.status}`.padEnd(15) +
        `${file.progress}%`.padEnd(10) +
        duration
      );
    }
    
    // Folder stats
    console.log('─'.repeat(120));
    const stats = folder.stats;
    console.log(
      `TOTAL: ${stats.total} files | ` +
      `✅ ${stats.completed} completed | ` +
      `❌ ${stats.failed} failed | ` +
      `⏳ ${stats.uploading + stats.extracting + stats.chunking + stats.embedding} processing | ` +
      `⏸ ${stats.queued} queued`
    );
  }
  
  // Global stats
  console.log('\n' + '='.repeat(120));
  console.log('📈 GLOBAL STATISTICS');
  console.log('='.repeat(120));
  const globalStats = uploadStatus.stats;
  console.log(`Total Files: ${globalStats.total}`);
  console.log(`✅ Completed: ${globalStats.completed} (${Math.round(globalStats.completed / globalStats.total * 100)}%)`);
  console.log(`❌ Failed: ${globalStats.failed} (${Math.round(globalStats.failed / globalStats.total * 100)}%)`);
  console.log(`⏳ Processing: ${globalStats.uploading + globalStats.extracting + globalStats.chunking + globalStats.embedding}`);
  console.log(`⏸ Queued: ${globalStats.queued}`);
  console.log('='.repeat(120) + '\n');
}

/**
 * Save status to JSON file
 */
function saveStatusToFile() {
  const outputPath = path.join(__dirname, '../upload-status.json');
  fs.writeFileSync(outputPath, JSON.stringify(uploadStatus, null, 2));
  console.log(`\n💾 Status saved to: ${outputPath}`);
}

/**
 * Main execution
 */
async function main() {
  console.log('╔═══════════════════════════════════════════════════════════════════╗');
  console.log('║          UPLOAD QUEUE PROCESSOR - Context Management              ║');
  console.log('╚═══════════════════════════════════════════════════════════════════╝\n');
  
  // Get user ID from command line or use default
  const userId = process.argv[2] || 'system';
  
  console.log(`Configuration:`);
  console.log(`  📁 Upload Queue: ${CONFIG.uploadQueueDir}`);
  console.log(`  🏢 Organization: ${CONFIG.organization}`);
  console.log(`  🌐 Domain: ${CONFIG.domain}`);
  console.log(`  🤖 Model: ${CONFIG.model}`);
  console.log(`  👤 User ID: ${userId}`);
  console.log(`  📦 Batch Size: ${CONFIG.batchSize} files\n`);
  
  // Step 1: Scan folders
  scanUploadQueue();
  
  if (Object.keys(uploadStatus.folders).length === 0) {
    console.log('⚠️  No PDF files found in upload-queue directory');
    return;
  }
  
  // Step 2: Process first folder (S001-20251118)
  const firstFolder = 'S001-20251118';
  if (uploadStatus.folders[firstFolder]) {
    await processFolder(firstFolder, userId);
  } else {
    console.log(`⚠️  Folder ${firstFolder} not found`);
  }
  
  // Step 3: Generate final status table
  generateStatusTable();
  
  // Step 4: Save status to file
  saveStatusToFile();
  
  console.log('\n✨ Upload processing complete!\n');
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = {
  scanUploadQueue,
  processFolder,
  generateStatusTable,
  uploadStatus,
};

