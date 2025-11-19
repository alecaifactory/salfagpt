/**
 * CLI Upload Command - Batch Document Upload with RAG
 * 
 * Usage:
 *   npx tsx cli/commands/upload.ts \
 *     --folder=/path/to/folder \
 *     --tag=TAG-NAME \
 *     --agent=AGENT_ID \
 *     --user=USER_ID
 * 
 * Features:
 * - Batch upload all PDFs in folder
 * - Automatic extraction with Gemini
 * - Chunking & embedding for RAG
 * - Progress tracking
 * - Error recovery
 * - Performance metrics
 * - Test query after upload
 * 
 * Created: 2025-11-18
 */

import { readdir, stat } from 'fs/promises';
import { join, basename } from 'path';
import { uploadFileToGCS, ensureBucketExists } from '../lib/storage';
import { extractDocument } from '../lib/extraction';
import { processForRAG } from '../lib/embeddings';
import { trackUploadSession, trackFileUpload, trackFileExtraction } from '../lib/analytics';
import { firestore } from '../../src/lib/firestore';
import { GoogleGenAI } from '@google/genai';

// Generate unique session ID
const SESSION_ID = `cli-upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

interface UploadConfig {
  folderPath: string;
  tag: string;
  agentId: string;
  userId: string;  // Hash ID (e.g., usr_uhwqffaqag1wrryd82tw) - PRIMARY
  userEmail: string;
  model?: 'gemini-2.5-flash' | 'gemini-2.5-pro';
  testQuery?: string;
  googleUserId?: string;  // Optional: Google OAuth numeric ID for reference
}

interface FileUploadResult {
  fileName: string;
  success: boolean;
  sourceId?: string;
  gcsPath?: string;
  extractedChars?: number;
  chunks?: number;
  embeddings?: number;
  duration?: number;
  error?: string;
}

interface UploadSummary {
  totalFiles: number;
  succeeded: number;
  failed: number;
  totalDuration: number;
  totalCost: number;
  results: FileUploadResult[];
}

/**
 * Main upload command
 */
async function uploadCommand(config: UploadConfig): Promise<UploadSummary> {
  const startTime = Date.now();
  
  console.log('\n🚀 SalfaGPT CLI - Batch Document Upload');
  console.log('═══════════════════════════════════════\n');
  
  console.log('📋 Configuration:');
  console.log(`   📁 Folder: ${config.folderPath}`);
  console.log(`   🏷️  Tag: ${config.tag}`);
  console.log(`   🤖 Agent: ${config.agentId}`);
  console.log(`   👤 User: ${config.userId} (${config.userEmail})`);
  console.log(`   ⚡ Model: ${config.model || 'gemini-2.5-flash'}`);
  console.log(`   🔑 Session: ${SESSION_ID}\n`);
  
  // Ensure bucket exists
  console.log('📦 Checking GCS bucket...');
  const bucketReady = await ensureBucketExists();
  if (!bucketReady) {
    throw new Error('Failed to initialize GCS bucket');
  }
  console.log('✅ Bucket ready\n');
  
  // Get all PDF files from folder
  console.log('📂 Scanning folder for PDFs...');
  const files = await getPDFFiles(config.folderPath);
  console.log(`✅ Found ${files.length} PDF files\n`);
  
  if (files.length === 0) {
    console.log('⚠️  No PDF files found in folder');
    return {
      totalFiles: 0,
      succeeded: 0,
      failed: 0,
      totalDuration: 0,
      totalCost: 0,
      results: [],
    };
  }
  
  // Track upload session start
  await trackUploadSession({
    sessionId: SESSION_ID,
    command: `upload --folder=${config.folderPath} --tag=${config.tag} --agent=${config.agentId}`,
    folderPath: config.folderPath,
    agentId: config.agentId,
    startedAt: new Date(),
    filesProcessed: files.length,
  });
  
  // Process each file
  const results: FileUploadResult[] = [];
  let totalCost = 0;
  let totalChars = 0;
  let totalChunks = 0;
  
  for (let i = 0; i < files.length; i++) {
    const filePath = files[i];
    const fileName = basename(filePath);
    
    console.log(`\n${'═'.repeat(70)}`);
    console.log(`📄 ARCHIVO ${i + 1} de ${files.length}`);
    console.log(`${'═'.repeat(70)}`);
    console.log(`📁 Archivo: ${fileName}`);
    console.log(`📊 Progreso global: ${i} completados, ${files.length - i} restantes`);
    console.log(`${'═'.repeat(70)}\n`);
    
    try {
      const result = await uploadSingleFile(filePath, config, SESSION_ID);
      results.push(result);
      
      if (result.success) {
        // Accumulate totals
        if (result.extractedChars) totalChars += result.extractedChars;
        if (result.chunks) totalChunks += result.chunks;
        totalCost += result.duration ? estimateCost(config.model || 'gemini-2.5-flash', result.extractedChars || 0) : 0;
        
        // Show running totals
        console.log(`\n📊 PROGRESO ACUMULADO (${i + 1}/${files.length}):`);
        console.log(`   ✅ Exitosos: ${results.filter(r => r.success).length}`);
        console.log(`   ❌ Fallidos: ${results.filter(r => !r.success).length}`);
        console.log(`   📝 Total caracteres: ${totalChars.toLocaleString()}`);
        console.log(`   📐 Total chunks: ${totalChunks}`);
        console.log(`   💰 Costo acumulado: $${totalCost.toFixed(4)}`);
      } else {
        console.log(`\n❌ ${fileName} failed: ${result.error}`);
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.log(`\n❌ ${fileName} failed: ${errorMessage}`);
      
      results.push({
        fileName,
        success: false,
        error: errorMessage,
      });
    }
    
    // Small delay between files to avoid rate limits
    if (i < files.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  const totalDuration = Date.now() - startTime;
  const succeeded = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  // Update upload session with final results
  await trackUploadSession({
    sessionId: SESSION_ID,
    command: `upload --folder=${config.folderPath} --tag=${config.tag} --agent=${config.agentId}`,
    folderPath: config.folderPath,
    agentId: config.agentId,
    startedAt: new Date(startTime),
    endedAt: new Date(),
    filesProcessed: files.length,
    filesSucceeded: succeeded,
    filesFailed: failed,
    totalDuration: totalDuration,
    totalCost: totalCost,
    success: failed === 0,
  });
  
  // Print summary
  printSummary({
    totalFiles: files.length,
    succeeded,
    failed,
    totalDuration,
    totalCost,
    results,
  });
  
  // Run test query if requested
  if (config.testQuery && succeeded > 0) {
    console.log('\n📝 Running test query...\n');
    await runTestQuery(config.agentId, config.testQuery, config.userId);
  }
  
  return {
    totalFiles: files.length,
    succeeded,
    failed,
    totalDuration,
    totalCost,
    results,
  };
}

/**
 * Upload single file through complete pipeline
 */
async function uploadSingleFile(
  filePath: string,
  config: UploadConfig,
  sessionId: string
): Promise<FileUploadResult> {
  const fileName = basename(filePath);
  const fileStartTime = Date.now();
  
  try {
    // Step 1: Upload to GCS (0-20%)
    console.log('📤 Paso 1/5: Subiendo a Cloud Storage...');
    const uploadStart = Date.now();
    
    const uploadResult = await uploadFileToGCS(
      filePath,
      config.userId,
      config.agentId,
      (progress) => {
        const pct = progress.percentage.toFixed(1);
        const speed = progress.bytesUploaded / ((Date.now() - uploadStart) / 1000);
        const speedStr = formatBytes(speed);
        process.stdout.write(`\r   📤 ${pct}% (${formatBytes(progress.bytesUploaded)}/${formatBytes(progress.totalBytes)}) @ ${speedStr}/s`);
      }
    );
    
    console.log(); // New line after progress
    
    if (!uploadResult.success) {
      throw new Error(`Upload failed: ${uploadResult.error}`);
    }
    
    const uploadDuration = Date.now() - uploadStart;
    const avgSpeed = uploadResult.fileSize / (uploadDuration / 1000);
    console.log(`   ✅ Upload exitoso en ${(uploadDuration / 1000).toFixed(1)}s (${formatBytes(avgSpeed)}/s)`);
    console.log(`   📍 GCS Path: ${uploadResult.gcsPath}`);
    
    // Track file upload event
    await trackFileUpload({
      sessionId,
      fileName,
      fileSize: uploadResult.fileSize,
      agentId: config.agentId,
      success: true,
      duration: uploadDuration,
      gcsPath: uploadResult.gcsPath,
    });
    
    // Step 2: Extract with Gemini (20-50%)
    console.log('\n🤖 Paso 2/5: Extrayendo contenido con Gemini AI...');
    console.log(`   📄 Archivo: ${fileName}`);
    console.log(`   📊 Tamaño: ${(uploadResult.fileSize / 1024).toFixed(2)} KB`);
    console.log(`   🤖 Modelo: ${config.model || 'gemini-2.5-flash'}`);
    console.log(`   ⏳ Procesando con Gemini...`);
    const extractStart = Date.now();
    
    const extraction = await extractDocument(
      filePath,
      config.model || 'gemini-2.5-flash'
    );
    
    if (!extraction.success) {
      throw new Error(`Extraction failed: ${extraction.error}`);
    }
    
    const extractDuration = Date.now() - extractStart;
    
    console.log(`   ✅ Extracción exitosa en ${(extractDuration / 1000).toFixed(1)}s`);
    console.log(`   📝 Caracteres extraídos: ${extraction.charactersExtracted.toLocaleString()}`);
    console.log(`   🎯 Tokens estimados: ~${extraction.tokensEstimate.toLocaleString()}`);
    console.log(`   📥 Input tokens: ${extraction.inputTokens.toLocaleString()}`);
    console.log(`   📤 Output tokens: ${extraction.outputTokens.toLocaleString()}`);
    console.log(`   💰 Costo: $${extraction.estimatedCost.toFixed(6)}`);
    
    // Track extraction event
    await trackFileExtraction({
      sessionId,
      fileName,
      agentId: config.agentId,
      model: extraction.model,
      charactersExtracted: extraction.charactersExtracted,
      inputTokens: extraction.inputTokens,
      outputTokens: extraction.outputTokens,
      estimatedCost: extraction.estimatedCost,
      success: true,
      duration: extractDuration,
    });
    
    // Step 3: Save to Firestore (50-60%)
    console.log('\n💾 Paso 3/5: Guardando en Firestore...');
    console.log(`   📦 Collection: context_sources`);
    console.log(`   🏷️  Tags: [${config.tag}]`);
    console.log(`   🤖 Assigned to: ${config.agentId}`);
    const firestoreStart = Date.now();
    
    const sourceDoc = await firestore.collection('context_sources').add({
      userId: config.userId, // ✅ HASH ID - PRIMARY (e.g., usr_uhwqffaqag1wrryd82tw)
      name: fileName,
      type: 'pdf',
      enabled: true,
      status: 'active',
      addedAt: new Date(),
      extractedData: extraction.extractedText,
      originalFileUrl: uploadResult.gcsPath,
      tags: [config.tag],
      assignedToAgents: [config.agentId],
      ...(config.googleUserId && { googleUserId: config.googleUserId }), // ✅ Optional: Google OAuth ID for reference
      metadata: {
        originalFileName: fileName,
        originalFileSize: uploadResult.fileSize,
        extractionDate: new Date(),
        extractionTime: extractDuration,
        model: extraction.model,
        charactersExtracted: extraction.charactersExtracted,
        tokensEstimate: extraction.tokensEstimate,
        ...(extraction.pageCount && { pageCount: extraction.pageCount }),
        inputTokens: extraction.inputTokens,
        outputTokens: extraction.outputTokens,
        estimatedCost: extraction.estimatedCost,
        uploadedVia: 'cli',
        uploadedBy: config.userEmail,
        sessionId: sessionId,
      },
      source: 'localhost', // CLI runs locally
    });
    
    const sourceId = sourceDoc.id;
    const firestoreDuration = Date.now() - firestoreStart;
    
    console.log(`   ✅ Documento guardado exitosamente`);
    console.log(`   🆔 Source ID: ${sourceId}`);
    console.log(`   ⏱️  Tiempo: ${(firestoreDuration / 1000).toFixed(1)}s`);
    
    // Step 4: RAG Processing (60-90%)
    console.log('\n🧬 Paso 4/5: Procesando para RAG (chunking + embeddings)...');
    console.log(`   📊 Texto a procesar: ${extraction.extractedText.length.toLocaleString()} caracteres`);
    console.log(`   📊 Tokens estimados: ~${extraction.tokensEstimate.toLocaleString()} tokens`);
    const ragStart = Date.now();
    
    const ragResult = await processForRAG(
      sourceId,
      fileName,
      extraction.extractedText,
      config.userId,
      config.agentId,
      {
        chunkSize: 1000,  // Match webapp default
        embeddingModel: 'text-embedding-004',
        uploadedVia: 'cli',
        cliVersion: '0.2.0',
        userEmail: config.userEmail,
      }
    );
    
    if (!ragResult.success) {
      console.log(`   ⚠️  RAG processing failed: ${ragResult.error}`);
      console.log(`   ℹ️  Document saved but not indexed for RAG`);
    } else {
      console.log(`   ✅ Chunking completado: ${ragResult.totalChunks} chunks creados`);
      console.log(`   ✅ Embeddings generados: ${ragResult.totalChunks} vectores (768 dimensiones)`);
      console.log(`   📊 Promedio tokens/chunk: ${Math.round(ragResult.totalTokens / ragResult.totalChunks)}`);
      console.log(`   💰 Costo embeddings: $${ragResult.estimatedCost.toFixed(6)}`);
    }
    
    const ragDuration = Date.now() - ragStart;
    console.log(`   ⏱️  Tiempo RAG: ${(ragDuration / 1000).toFixed(1)}s`);
    
    // Step 5: Update metadata (90-100%)
    console.log('\n📝 Paso 5/5: Actualizando metadata RAG...');
    
    await firestore.collection('context_sources').doc(sourceId).update({
      ragEnabled: ragResult.success,
      ragMetadata: ragResult.success ? {
        chunkCount: ragResult.totalChunks,
        avgChunkSize: Math.round(ragResult.totalTokens / ragResult.totalChunks),
        indexedAt: new Date(),
        embeddingModel: 'text-embedding-004',
        processingTime: ragDuration,
      } : undefined,
      useRAGMode: ragResult.success, // Enable RAG by default if available
    });
    
    console.log(`   ✅ Metadata actualizada`);
    console.log(`   🔍 RAG enabled: ${ragResult.success ? 'Yes' : 'No'}`);
    
    // Assign to agent's active context
    console.log('\n🔗 Asignando a agente...');
    console.log(`   🤖 Agente: ${config.agentId}`);
    const { saveConversationContext, loadConversationContext } = await import('../../src/lib/firestore');
    
    const currentActive = await loadConversationContext(config.agentId);
    const previousCount = currentActive.length;
    await saveConversationContext(config.agentId, [...currentActive, sourceId]);
    
    console.log(`   ✅ Documento asignado y activado`);
    console.log(`   📚 Contextos activos: ${previousCount} → ${previousCount + 1}`);
    
    const totalDuration = Date.now() - fileStartTime;
    
    // Final summary for this file
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`✅ ARCHIVO COMPLETADO: ${fileName}`);
    console.log(`${'─'.repeat(60)}`);
    console.log(`⏱️  Tiempo total: ${(totalDuration / 1000).toFixed(1)}s`);
    console.log(`📝 Caracteres: ${extraction.charactersExtracted.toLocaleString()}`);
    console.log(`📐 Chunks: ${ragResult.totalChunks}`);
    console.log(`🧬 Embeddings: ${ragResult.totalChunks}`);
    console.log(`💰 Costo total: $${(extraction.estimatedCost + ragResult.estimatedCost).toFixed(6)}`);
    console.log(`🆔 Source ID: ${sourceId}`);
    console.log(`${'─'.repeat(60)}\n`);
    
    return {
      fileName,
      success: true,
      sourceId,
      gcsPath: uploadResult.gcsPath,
      extractedChars: extraction.charactersExtracted,
      chunks: ragResult.totalChunks,
      embeddings: ragResult.totalChunks,
      duration: totalDuration,
    };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const totalDuration = Date.now() - fileStartTime;
    
    // Track failed file
    await trackFileUpload({
      sessionId,
      fileName,
      fileSize: 0, // Unknown size for failed upload
      agentId: config.agentId,
      success: false,
      duration: totalDuration,
      errorMessage,
    });
    
    return {
      fileName,
      success: false,
      duration: totalDuration,
      error: errorMessage,
    };
  }
}

/**
 * Get all PDF files from a folder (including subfolders)
 */
async function getPDFFiles(folderPath: string): Promise<string[]> {
  try {
    const pdfFiles: string[] = [];
    
    async function scanDirectory(dir: string) {
      const entries = await readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = join(dir, entry.name);
        
        if (entry.isDirectory()) {
          // Recursively scan subdirectories
          await scanDirectory(fullPath);
        } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.pdf')) {
          pdfFiles.push(fullPath);
        }
      }
    }
    
    await scanDirectory(folderPath);
    return pdfFiles.sort(); // Alphabetical order
  } catch (error) {
    console.error(`❌ Error reading folder: ${folderPath}`);
    throw error;
  }
}

/**
 * Print upload summary
 */
function printSummary(summary: UploadSummary): void {
  console.log('\n\n' + '═'.repeat(60));
  console.log('📊 RESUMEN DE CARGA');
  console.log('═'.repeat(60) + '\n');
  
  console.log(`📁 Total de archivos: ${summary.totalFiles}`);
  console.log(`✅ Exitosos: ${summary.succeeded} (${((summary.succeeded / summary.totalFiles) * 100).toFixed(1)}%)`);
  console.log(`❌ Fallidos: ${summary.failed}`);
  console.log(`⏱️  Tiempo total: ${(summary.totalDuration / 1000).toFixed(1)}s`);
  console.log(`💰 Costo estimado: $${summary.totalCost.toFixed(4)}\n`);
  
  // Success breakdown
  if (summary.succeeded > 0) {
    console.log('✅ Archivos Exitosos:');
    console.log('   ' + '-'.repeat(56));
    
    const successful = summary.results.filter(r => r.success);
    for (const result of successful) {
      console.log(`   📄 ${result.fileName}`);
      console.log(`      🆔 Source ID: ${result.sourceId}`);
      console.log(`      📝 Chars: ${result.extractedChars?.toLocaleString()}`);
      console.log(`      📐 Chunks: ${result.chunks}`);
      console.log(`      🧬 Embeddings: ${result.embeddings}`);
      console.log(`      ⏱️  Duration: ${result.duration ? (result.duration / 1000).toFixed(1) : '?'}s`);
      console.log('');
    }
  }
  
  // Failure details
  if (summary.failed > 0) {
    console.log('\n❌ Archivos Fallidos:');
    console.log('   ' + '-'.repeat(56));
    
    const failed = summary.results.filter(r => !r.success);
    for (const result of failed) {
      console.log(`   📄 ${result.fileName}`);
      console.log(`      ⚠️  Error: ${result.error}`);
      console.log('');
    }
    
    console.log('\n💡 Sugerencias:');
    console.log('   • Revisar archivos dañados o protegidos');
    console.log('   • Verificar permisos de lectura');
    console.log('   • Intentar extracción manual para archivos fallidos');
    console.log('');
  }
  
  console.log('═'.repeat(60) + '\n');
}

/**
 * Run test query to verify RAG search
 */
async function runTestQuery(
  agentId: string,
  query: string,
  userId: string
): Promise<void> {
  console.log('📝 Test Query:');
  console.log(`   🔍 Pregunta: "${query}"\n`);
  
  try {
    // Search for relevant chunks using RAG
    const { searchRelevantChunks } = await import('../../src/lib/rag-search');
    
    console.log('   🔍 Buscando chunks relevantes...');
    const searchStart = Date.now();
    
    const results = await searchRelevantChunks(userId, query, {
      topK: 5,
      activeSourceIds: undefined, // Use all agent's sources
    });
    
    const searchDuration = Date.now() - searchStart;
    
    console.log(`   ✅ Encontrados ${results.length} chunks en ${(searchDuration / 1000).toFixed(2)}s\n`);
    
    if (results.length === 0) {
      console.log('   ⚠️  No se encontraron chunks relevantes');
      console.log('   💡 Posibles razones:');
      console.log('      • Query no relacionada con documentos');
      console.log('      • Embeddings aún no generados');
      console.log('      • Documentos sin contenido relevante\n');
      return;
    }
    
    // Display top 3 results
    console.log('   📄 Top 3 Chunks Relevantes:\n');
    for (let i = 0; i < Math.min(3, results.length); i++) {
      const result = results[i];
      console.log(`   ${i + 1}. ${result.sourceName} (similarity: ${(result.similarity * 100).toFixed(1)}%)`);
      console.log(`      ${result.text.substring(0, 150)}...`);
      console.log('');
    }
    
    // Generate AI response using RAG context
    console.log('   🤖 Generando respuesta con Gemini...');
    
    const ragContext = results
      .slice(0, 5)
      .map((r, i) => `[Documento ${i + 1}: ${r.sourceName}]\n${r.text}`)
      .join('\n\n---\n\n');
    
    const API_KEY = process.env.GOOGLE_AI_API_KEY;
    if (!API_KEY) {
      throw new Error('GOOGLE_AI_API_KEY not configured');
    }
    
    const genAI = new GoogleGenAI({ apiKey: API_KEY });
    
    const aiResponse = await genAI.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Contexto relevante:\n\n${ragContext}\n\n---\n\nPregunta del usuario: ${query}\n\nResponde basándote en el contexto proporcionado.`,
      config: {
        temperature: 0.3,
        maxOutputTokens: 2048,
      },
    });
    
    const responseText = aiResponse.text || 'No response';
    
    console.log('\n   💬 Respuesta del AI:\n');
    console.log('   ' + '-'.repeat(56));
    console.log(wrapText(responseText, 56, '   '));
    console.log('   ' + '-'.repeat(56) + '\n');
    
  } catch (error) {
    console.log(`\n   ❌ Error en test query: ${error instanceof Error ? error.message : error}\n`);
  }
}

/**
 * Estimate cost for extraction
 */
function estimateCost(model: string, chars: number): number {
  const tokens = Math.ceil(chars / 4);
  
  const pricing: Record<string, { input: number; output: number }> = {
    'gemini-2.5-flash': { input: 0.075, output: 0.30 },
    'gemini-2.5-pro': { input: 1.25, output: 5.00 },
  };
  
  const modelPricing = pricing[model] || pricing['gemini-2.5-flash'];
  
  // Rough estimate: input ≈ output for extraction
  return ((tokens / 1_000_000) * modelPricing.input) + ((tokens / 1_000_000) * modelPricing.output);
}

/**
 * Format bytes for display
 */
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Wrap text to specified width
 */
function wrapText(text: string, width: number, indent: string = ''): string {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = indent;
  
  for (const word of words) {
    if ((currentLine + word).length > width + indent.length) {
      lines.push(currentLine);
      currentLine = indent + word + ' ';
    } else {
      currentLine += word + ' ';
    }
  }
  
  if (currentLine.trim().length > 0) {
    lines.push(currentLine);
  }
  
  return lines.join('\n');
}

/**
 * CLI entry point
 */
async function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  
  const config: Partial<UploadConfig> = {};
  
  for (const arg of args) {
    if (arg.startsWith('--folder=')) {
      config.folderPath = arg.split('=')[1];
    } else if (arg.startsWith('--tag=')) {
      config.tag = arg.split('=')[1];
    } else if (arg.startsWith('--agent=')) {
      config.agentId = arg.split('=')[1];
    } else if (arg.startsWith('--user=')) {
      config.userId = arg.split('=')[1]; // HASH ID (primary)
    } else if (arg.startsWith('--google-user=')) {
      config.googleUserId = arg.split('=')[1]; // Optional: Google OAuth numeric ID
    } else if (arg.startsWith('--email=')) {
      config.userEmail = arg.split('=')[1];
    } else if (arg.startsWith('--model=')) {
      config.model = arg.split('=')[1] as 'gemini-2.5-flash' | 'gemini-2.5-pro';
    } else if (arg.startsWith('--test=')) {
      config.testQuery = arg.split('=')[1].replace(/"/g, '');
    }
  }
  
  // Validate required arguments
  if (!config.folderPath || !config.tag || !config.agentId || !config.userId) {
    console.error('\n❌ Missing required arguments\n');
    console.error('Usage:');
    console.error('  npx tsx cli/commands/upload.ts \\');
    console.error('    --folder=/path/to/folder \\');
    console.error('    --tag=TAG-NAME \\');
    console.error('    --agent=AGENT_ID \\');
    console.error('    --user=USER_HASH_ID \\');
    console.error('    --email=user@example.com \\');
    console.error('    --model=gemini-2.5-flash \\  (optional, default: flash)');
    console.error('    --test="Your question here"  (optional)\n');
    console.error('Example:');
    console.error('  npx tsx cli/commands/upload.ts \\');
    console.error('    --folder=/Users/alec/salfagpt/upload-queue/salfacorp/S001-20251118 \\');
    console.error('    --tag=S001-20251118-1545 \\');
    console.error('    --agent=TestApiUpload_S001 \\');
    console.error('    --user=usr_uhwqffaqag1wrryd82tw \\');
    console.error('    --email=alec@getaifactory.com \\');
    console.error('    --test="¿Cuáles son los requisitos de seguridad?"\n');
    console.error('\n💡 Note: USER_HASH_ID should be the hash ID (e.g., usr_xxx), not the Google numeric ID');
    process.exit(1);
  }
  
  if (!config.userEmail) {
    config.userEmail = 'cli@salfagpt.com'; // Default
  }
  
  try {
    const summary = await uploadCommand(config as UploadConfig);
    
    // Exit with appropriate code
    if (summary.failed > 0) {
      console.log(`\n⚠️  Upload completed with ${summary.failed} failures`);
      process.exit(1);
    } else {
      console.log('\n✅ Upload completed successfully!');
      process.exit(0);
    }
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

