#!/usr/bin/env node

/**
 * SalfaGPT CLI - Developer Tool for Context Management
 * 
 * Simple v1: Upload documents from local folders to Flow context system
 * 
 * Usage:
 *   npx salfagpt upload <folder-path>
 *   npx salfagpt upload contextos/pdf/agentes/M001
 */

import { readdir, readFile, stat } from 'fs/promises';
import { join, basename, extname } from 'path';
import { existsSync } from 'fs';
import { config } from 'dotenv';
import { 
  generateSessionId, 
  getCLIUser, 
  trackCLIEvent,
  trackFileUpload,
  trackFileExtraction,
  trackUploadSession 
} from './lib/analytics';
import { uploadFileToGCS, ensureBucketExists } from './lib/storage';
import { extractDocument } from './lib/extraction';
import { firestore } from '../src/lib/firestore';

// Load environment variables from .env file
config();

// Colors for CLI output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// CLI Version
const CLI_VERSION = '0.2.0';

interface ProcessedFile {
  success: boolean;
  fileName: string;
  filePath: string;
  fileSize: number;
  gcsPath?: string;
  firestoreDocId?: string;
  extractedChars?: number;
  extractionModel?: string;
  extractionCost?: number;
  extractionDuration?: number;
  error?: string;
}

/**
 * Upload documents from a folder to Flow context system
 */
async function uploadFolder(folderPath: string): Promise<void> {
  // Initialize session tracking
  const sessionId = generateSessionId();
  const sessionStartTime = Date.now();
  const user = getCLIUser();
  
  log('\n🚀 SalfaGPT CLI - Document Upload Tool', 'cyan');
  log('=' .repeat(50), 'cyan');
  log(`\n👤 User: ${user.email}`, 'blue');
  log(`📍 Session: ${sessionId}`, 'blue');
  
  // Resolve path (handle both absolute and relative)
  const absolutePath = folderPath.startsWith('/') 
    ? folderPath 
    : join(process.cwd(), folderPath);
  
  log(`\n📁 Scanning folder: ${absolutePath}`, 'blue');
  
  // Track upload start
  await trackCLIEvent({
    eventType: 'cli_upload_start',
    userId: user.userId,
    userEmail: user.email,
    cliVersion: CLI_VERSION,
    operation: 'upload',
    folderPath: absolutePath,
    success: true,
    sessionId,
  });
  
  // Check if folder exists
  if (!existsSync(absolutePath)) {
    log(`\n❌ Error: Folder does not exist: ${absolutePath}`, 'red');
    log(`\n💡 Tip: Create the folder first or check the path`, 'yellow');
    
    // Track error
    await trackCLIEvent({
      eventType: 'cli_error',
      userId: user.userId,
      userEmail: user.email,
      cliVersion: CLI_VERSION,
      operation: 'upload',
      folderPath: absolutePath,
      success: false,
      errorMessage: 'Folder does not exist',
      sessionId,
    });
    
    process.exit(1);
  }
  
  // Check if it's a directory
  const folderStat = await stat(absolutePath);
  if (!folderStat.isDirectory()) {
    log(`\n❌ Error: Path is not a directory: ${absolutePath}`, 'red');
    process.exit(1);
  }
  
  // Read directory contents
  const files = await readdir(absolutePath);
  
  // Filter for supported document types
  const supportedExtensions = ['.pdf', '.docx', '.doc', '.csv', '.xlsx', '.xls'];
  const documents = files.filter(file => {
    const ext = extname(file).toLowerCase();
    return supportedExtensions.includes(ext);
  });
  
  if (documents.length === 0) {
    log(`\n⚠️  No documents found in folder`, 'yellow');
    log(`\n💡 Supported formats: ${supportedExtensions.join(', ')}`, 'yellow');
    
    // Track empty folder event
    await trackCLIEvent({
      eventType: 'cli_upload_complete',
      userId: user.userId,
      userEmail: user.email,
      cliVersion: CLI_VERSION,
      operation: 'upload',
      folderPath: absolutePath,
      success: true,
      filesProcessed: 0,
      filesSucceeded: 0,
      filesFailed: 0,
      duration: Date.now() - sessionStartTime,
      sessionId,
    });
    
    process.exit(0);
  }
  
  log(`\n✅ Found ${documents.length} document(s) to process:`, 'green');
  documents.forEach(doc => log(`   - ${doc}`, 'reset'));
  
  // Ensure GCS bucket exists
  log(`\n🪣 Verificando bucket de GCS...`, 'blue');
  const bucketReady = await ensureBucketExists();
  if (!bucketReady) {
    log(`\n❌ Error: No se pudo acceder al bucket de GCS`, 'red');
    log(`💡 Verifica: gcloud auth application-default login`, 'yellow');
    process.exit(1);
  }
  log(`   ✅ Bucket listo`, 'green');
  
  // Get extraction model (default: flash)
  const extractionModel = 'gemini-2.5-flash'; // Can be made configurable
  log(`\n🤖 Modelo de extracción: ${extractionModel}`, 'blue');
  
  // Process each document
  const results: ProcessedFile[] = [];
  
  for (const fileName of documents) {
    const filePath = join(absolutePath, fileName);
    const fileStats = await stat(filePath);
    
    log(`\n📄 Procesando: ${fileName}`, 'blue');
    log(`   📊 Tamaño: ${(fileStats.size / 1024).toFixed(2)} KB`, 'reset');
    
    const fileStartTime = Date.now();
    
    try {
      // STEP 1: Upload to GCP Storage
      log(`   ⏳ Paso 1/3: Subiendo a GCP Storage...`, 'cyan');
      
      const uploadResult = await uploadFileToGCS(
        filePath,
        user.userId,
        'cli-upload', // Default agent (can be made configurable)
        (progress) => {
          // Show progress
          if (progress.percentage % 25 === 0) {
            log(`      ${progress.percentage.toFixed(0)}% (${(progress.bytesUploaded / 1024).toFixed(0)} KB / ${(progress.totalBytes / 1024).toFixed(0)} KB)`, 'reset');
          }
        }
      );
      
      if (!uploadResult.success) {
        throw new Error(`Upload falló: ${uploadResult.error}`);
      }
      
      log(`   ✅ Paso 1/3: Subido a: ${uploadResult.gcsPath}`, 'green');
      
      // Track upload
      await trackFileUpload({
        sessionId,
        fileName,
        fileSize: fileStats.size,
        success: true,
        duration: uploadResult.duration,
        gcsPath: uploadResult.gcsPath,
      });
      
      // STEP 2: Extract text with Gemini AI
      log(`   ⏳ Paso 2/3: Extrayendo texto con Gemini AI...`, 'cyan');
      
      const extractionResult = await extractDocument(filePath, extractionModel);
      
      if (!extractionResult.success) {
        throw new Error(`Extracción falló: ${extractionResult.error}`);
      }
      
      log(`   ✅ Paso 2/3: Texto extraído`, 'green');
      log(`      📝 ${extractionResult.charactersExtracted.toLocaleString()} caracteres`, 'reset');
      log(`      🎯 ~${extractionResult.tokensEstimate.toLocaleString()} tokens`, 'reset');
      log(`      💰 Costo: $${extractionResult.estimatedCost.toFixed(6)}`, 'reset');
      log(`      ⏱️  Tiempo: ${(extractionResult.duration / 1000).toFixed(1)}s`, 'reset');
      
      // Show preview of extracted text
      log(`\n   📖 Preview del texto extraído:`, 'cyan');
      log(`   ${'─'.repeat(60)}`, 'reset');
      const preview = extractionResult.extractedText.substring(0, 300);
      log(`   ${preview}...`, 'reset');
      log(`   ${'─'.repeat(60)}`, 'reset');
      
      // Track extraction
      await trackFileExtraction({
        sessionId,
        fileName,
        model: extractionModel,
        inputTokens: extractionResult.inputTokens,
        outputTokens: extractionResult.outputTokens,
        charactersExtracted: extractionResult.charactersExtracted,
        duration: extractionResult.duration,
        estimatedCost: extractionResult.estimatedCost,
        success: true,
      });
      
      // STEP 3: Save to Firestore
      log(`   ⏳ Paso 3/3: Guardando en Firestore...`, 'cyan');
      
      const contextSource = await firestore.collection('context_sources').add({
        userId: user.userId,
        name: fileName,
        type: getDocumentType(fileName),
        enabled: true,
        status: 'active',
        addedAt: new Date(),
        extractedData: extractionResult.extractedText,
        assignedToAgents: ['cli-upload'], // Default assignment
        metadata: {
          originalFileName: fileName,
          originalFileSize: fileStats.size,
          uploadedVia: 'cli',
          cliVersion: CLI_VERSION,
          gcsPath: uploadResult.gcsPath,
          extractionDate: new Date(),
          extractionTime: extractionResult.duration,
          model: extractionModel,
          charactersExtracted: extractionResult.charactersExtracted,
          tokensEstimate: extractionResult.tokensEstimate,
          inputTokens: extractionResult.inputTokens,
          outputTokens: extractionResult.outputTokens,
          estimatedCost: extractionResult.estimatedCost,
        },
        source: process.env.NODE_ENV === 'production' ? 'production' : 'localhost',
      });
      
      log(`   ✅ Paso 3/3: Guardado en Firestore`, 'green');
      log(`      🔑 Document ID: ${contextSource.id}`, 'reset');
      log(`      📍 Ver en: https://console.firebase.google.com/project/gen-lang-client-0986191192/firestore/data/~2Fcontext_sources~2F${contextSource.id}`, 'reset');
      
      const totalDuration = Date.now() - fileStartTime;
      
      log(`\n   ✨ Archivo completado en ${(totalDuration / 1000).toFixed(1)}s`, 'green');
      
      results.push({
        success: true,
        fileName,
        filePath,
        fileSize: fileStats.size,
        gcsPath: uploadResult.gcsPath,
        firestoreDocId: contextSource.id,
        extractedChars: extractionResult.charactersExtracted,
        extractionModel: extractionModel,
        extractionCost: extractionResult.estimatedCost,
        extractionDuration: extractionResult.duration,
      });
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      log(`   ❌ Error processing file: ${errorMessage}`, 'red');
      
      // Track file failure
      await trackFileUpload({
        sessionId,
        fileName,
        fileSize: fileStats.size,
        success: false,
        errorMessage,
      });
      
      results.push({
        success: false,
        fileName,
        filePath,
        fileSize: fileStats.size,
        error: errorMessage,
      });
    }
  }
  
  // Summary
  log('\n' + '='.repeat(70), 'cyan');
  log('📊 Resumen del Proceso:', 'cyan');
  log('=' .repeat(70), 'cyan');
  
  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;
  const totalSize = results.reduce((sum, r) => sum + r.fileSize, 0);
  const totalChars = results.reduce((sum, r) => sum + (r.extractedChars || 0), 0);
  const totalCost = results.reduce((sum, r) => sum + (r.extractionCost || 0), 0);
  const totalDuration = Date.now() - sessionStartTime;
  
  log(`\n📁 Archivos Procesados:`, 'blue');
  log(`   Total: ${results.length}`, 'reset');
  log(`   ✅ Exitosos: ${successCount}`, 'green');
  log(`   ❌ Fallidos: ${failCount}`, 'red');
  log(`   📦 Tamaño Total: ${(totalSize / 1024 / 1024).toFixed(2)} MB`, 'reset');
  
  if (successCount > 0) {
    log(`\n📝 Extracción de Texto:`, 'blue');
    log(`   Caracteres Totales: ${totalChars.toLocaleString()}`, 'reset');
    log(`   Modelo Usado: ${extractionModel}`, 'reset');
    log(`   Tiempo Total Extracción: ${(results.reduce((sum, r) => sum + (r.extractionDuration || 0), 0) / 1000).toFixed(1)}s`, 'reset');
    log(`   Promedio por Archivo: ${((results.reduce((sum, r) => sum + (r.extractionDuration || 0), 0) / successCount) / 1000).toFixed(1)}s`, 'reset');
    
    log(`\n💰 Costos:`, 'blue');
    log(`   Costo Total Extracción: $${totalCost.toFixed(6)}`, 'reset');
    log(`   Costo Promedio por Archivo: $${(totalCost / successCount).toFixed(6)}`, 'reset');
    
    log(`\n☁️  Recursos Creados en GCP:`, 'blue');
    log(`   Storage: ${successCount} archivo(s) en gs://${process.env.GOOGLE_CLOUD_PROJECT}-context-documents/`, 'reset');
    log(`   Firestore: ${successCount} documento(s) en collection 'context_sources'`, 'reset');
  }
  
  log(`\n⏱️  Tiempo Total: ${(totalDuration / 1000).toFixed(1)}s`, 'blue');
  
  // Show failures if any
  const failures = results.filter(r => !r.success);
  if (failures.length > 0) {
    log('\n⚠️  Failed uploads:', 'yellow');
    failures.forEach(f => {
      log(`   - ${f.fileName}: ${f.error}`, 'red');
    });
  }
  
  log('\n✅ Proceso completado!', 'green');
  log('\n💡 Próximos pasos:', 'yellow');
  log('   1. Revisar salfagpt-cli-log.md para detalles completos', 'reset');
  log('   2. Ver archivos en GCP Console:', 'reset');
  log(`      https://console.cloud.google.com/storage/browser/${process.env.GOOGLE_CLOUD_PROJECT}-context-documents`, 'reset');
  log('   3. Ver documentos en Firestore:', 'reset');
  log('      https://console.firebase.google.com/project/gen-lang-client-0986191192/firestore/data/~2Fcontext_sources', 'reset');
  log('   4. Usar en webapp: Los documentos ya están disponibles en Flow', 'reset');
  
  // Track session completion
  const sessionEndTime = Date.now();
  await trackUploadSession({
    sessionId,
    command: `upload ${folderPath}`,
    folderPath: absolutePath,
    startedAt: new Date(sessionStartTime),
    endedAt: new Date(sessionEndTime),
    filesProcessed: results.length,
    filesSucceeded: results.filter(r => r.success).length,
    filesFailed: results.filter(r => !r.success).length,
    totalDuration: sessionEndTime - sessionStartTime,
    totalCost: results.reduce((sum, r) => sum + (r.extractionCost || 0), 0),
    success: results.some(r => r.success), // At least one success
  });
  
  // Log to file
  await logToFile(folderPath, results, sessionId, user);
}

/**
 * Log upload results to salfagpt-cli-log.md
 */
async function logToFile(
  folderPath: string, 
  results: UploadResult[],
  sessionId: string,
  user: { userId: string; email: string }
): Promise<void> {
  const { appendFile } = await import('fs/promises');
  const logPath = join(process.cwd(), 'salfagpt-cli-log.md');
  
  const timestamp = new Date().toISOString();
  const successResults = results.filter(r => r.success);
  const totalChars = successResults.reduce((sum, r) => sum + (r.extractedChars || 0), 0);
  const totalCost = successResults.reduce((sum, r) => sum + (r.extractionCost || 0), 0);
  const extractionModel = successResults.length > 0 ? (successResults[0].extractionModel || 'gemini-2.5-flash') : 'gemini-2.5-flash';
  
  const logEntry = `
## Upload Session - ${timestamp}

**Session ID:** \`${sessionId}\`  
**User:** ${user.email} (\`${user.userId}\`)  
**Source:** CLI v${CLI_VERSION}  
**Folder:** \`${folderPath}\`  
**Total Files:** ${results.length}  
**Success:** ${successResults.length}  
**Failed:** ${results.filter(r => !r.success).length}  

### Files Processed

| File | Size (KB) | GCS Path | Firestore ID | Chars | Model | Cost | Status |
|------|-----------|----------|--------------|-------|-------|------|--------|
${results.map(r => {
  if (r.success) {
    return `| ${r.fileName} | ${(r.fileSize / 1024).toFixed(2)} | \`${r.gcsPath}\` | \`${r.firestoreDocId}\` | ${(r.extractedChars || 0).toLocaleString()} | ${r.extractionModel} | $${(r.extractionCost || 0).toFixed(6)} | ✅ |`;
  } else {
    return `| ${r.fileName} | ${(r.fileSize / 1024).toFixed(2)} | - | - | - | - | - | ❌ |`;
  }
}).join('\n')}

### Extracción de Texto

- **Caracteres Totales:** ${totalChars.toLocaleString()}
- **Modelo Usado:** ${extractionModel}
- **Costo Total:** $${totalCost.toFixed(6)}

### Recursos en GCP

${successResults.map(r => `
#### ${r.fileName}
- **GCS:** ${r.gcsPath}
- **Firestore:** \`context_sources/${r.firestoreDocId}\`
- **Texto Extraído:** ${(r.extractedChars || 0).toLocaleString()} caracteres
- **Preview:** ${results.find(res => res.fileName === r.fileName)?.extractedChars ? 'Ver en Firestore' : 'N/A'}
`).join('\n')}

${results.filter(r => !r.success).length > 0 ? `
### Errors

${results.filter(r => !r.success).map(r => `- **${r.fileName}**: ${r.error}`).join('\n')}
` : ''}

### Traceability

All operations tracked in Firestore:
- **Collection:** \`cli_events\`
- **Session Collection:** \`cli_sessions\`
- **User Attribution:** All events linked to \`${user.email}\`
- **Origin Tracking:** Source field = \`cli\` (distinguishes from webapp)

---

`;
  
  await appendFile(logPath, logEntry);
  log(`\n📝 Log appended to: salfagpt-cli-log.md`, 'cyan');
  log(`📊 Events tracked to Firestore (collection: cli_events)`, 'cyan');
}

/**
 * Show help information
 */
function showHelp() {
  log('\n🔷 SalfaGPT CLI - v0.1.0', 'cyan');
  log('=' .repeat(50), 'cyan');
  log('\nUsage:', 'blue');
  log('  npx salfagpt <command> [options]', 'reset');
  log('\nCommands:', 'blue');
  log('  upload <folder>    Upload documents from folder to Flow', 'reset');
  log('  help              Show this help message', 'reset');
  log('\nExamples:', 'blue');
  log('  npx salfagpt upload contextos/pdf/agentes/M001', 'reset');
  log('  npx salfagpt upload /absolute/path/to/documents', 'reset');
  log('\nSupported Formats:', 'blue');
  log('  PDF, Word (.docx, .doc), Excel (.xlsx, .xls), CSV', 'reset');
  log('\n');
}

/**
 * Main CLI entry point
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args[0] === 'help' || args[0] === '--help' || args[0] === '-h') {
    showHelp();
    process.exit(0);
  }
  
  const command = args[0];
  
  switch (command) {
    case 'upload':
      if (args.length < 2) {
        log('\n❌ Error: Missing folder path', 'red');
        log('Usage: npx salfagpt upload <folder-path>', 'yellow');
        process.exit(1);
      }
      await uploadFolder(args[1]);
      break;
      
    default:
      log(`\n❌ Unknown command: ${command}`, 'red');
      log('Run "npx salfagpt help" for usage information', 'yellow');
      process.exit(1);
  }
}

/**
 * Get document type from file extension
 */
function getDocumentType(fileName: string): 'pdf' | 'csv' | 'excel' | 'word' {
  const ext = fileName.toLowerCase().split('.').pop();
  
  const typeMap: Record<string, 'pdf' | 'csv' | 'excel' | 'word'> = {
    pdf: 'pdf',
    csv: 'csv',
    xlsx: 'excel',
    xls: 'excel',
    docx: 'word',
    doc: 'word',
  };
  
  return typeMap[ext || ''] || 'pdf';
}

// Run CLI
main().catch((error) => {
  log(`\n❌ Fatal error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});

