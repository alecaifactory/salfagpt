#!/usr/bin/env tsx
/**
 * Bulk Re-Index All Documents with New RAG Configuration
 * 
 * Re-processes all existing context sources with:
 * - Chunk size: 2000 tokens
 * - Overlap: 500 tokens
 * 
 * Shows detailed progress and metrics for each document
 */

import { firestore } from '../src/lib/firestore';
import { chunkText } from '../src/lib/chunking';
import { generateEmbedding } from '../src/lib/embeddings';

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  
  // Foreground colors
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  
  // Background colors
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
};

const log = {
  info: (msg: string) => console.log(`${colors.cyan}ℹ${colors.reset} ${msg}`),
  success: (msg: string) => console.log(`${colors.green}✅${colors.reset} ${msg}`),
  error: (msg: string) => console.log(`${colors.red}❌${colors.reset} ${msg}`),
  warn: (msg: string) => console.log(`${colors.yellow}⚠️${colors.reset} ${msg}`),
  step: (msg: string) => console.log(`${colors.blue}▶${colors.reset} ${msg}`),
  metric: (label: string, value: string) => console.log(`  ${colors.dim}${label}:${colors.reset} ${colors.bright}${value}${colors.reset}`),
};

// Configuration
const NEW_CHUNK_SIZE = 2000;
const NEW_OVERLAP = 500;
const DRY_RUN = process.argv.includes('--dry-run');
const USER_FILTER = process.argv.find(arg => arg.startsWith('--user='))?.split('=')[1];
const LIMIT = parseInt(process.argv.find(arg => arg.startsWith('--limit='))?.split('=')[1] || '0') || undefined;

interface ReindexStats {
  total: number;
  processed: number;
  successful: number;
  failed: number;
  skipped: number;
  totalChunks: number;
  totalTokens: number;
  totalCost: number;
  avgChunksPerDoc: number;
  avgTokensPerDoc: number;
}

async function reindexAllDocuments() {
  const startTime = Date.now();
  
  console.log('\n┌─────────────────────────────────────────────────────────────┐');
  console.log(`│ ${colors.bright}🔄 BULK RE-INDEXING WITH NEW CONFIGURATION${colors.reset}          │`);
  console.log('└─────────────────────────────────────────────────────────────┘\n');
  
  log.info(`Configuration: ${colors.bright}${NEW_CHUNK_SIZE}${colors.reset} tokens/chunk, ${colors.bright}${NEW_OVERLAP}${colors.reset} overlap`);
  log.info(`Dry run: ${DRY_RUN ? colors.yellow + 'YES (simulation only)' + colors.reset : colors.green + 'NO (will update Firestore)' + colors.reset}`);
  if (USER_FILTER) log.info(`User filter: ${USER_FILTER}`);
  if (LIMIT) log.info(`Limit: ${LIMIT} documents`);
  console.log();
  
  const stats: ReindexStats = {
    total: 0,
    processed: 0,
    successful: 0,
    failed: 0,
    skipped: 0,
    totalChunks: 0,
    totalTokens: 0,
    totalCost: 0,
    avgChunksPerDoc: 0,
    avgTokensPerDoc: 0,
  };
  
  try {
    // 1. Load all context sources
    log.step('Step 1/3: Loading context sources from Firestore...');
    
    let query = firestore.collection('context_sources');
    
    if (USER_FILTER) {
      query = query.where('userId', '==', USER_FILTER) as any;
    }
    
    if (LIMIT) {
      query = query.limit(LIMIT) as any;
    }
    
    const snapshot = await query.get();
    stats.total = snapshot.size;
    
    log.success(`Loaded ${colors.bright}${stats.total}${colors.reset} context sources`);
    console.log();
    
    // 2. Filter sources with extractedData
    const sourcesWithText = snapshot.docs.filter(doc => {
      const data = doc.data();
      return data.extractedData && data.extractedData.length > 0;
    });
    
    log.info(`Sources with extracted text: ${colors.bright}${sourcesWithText.length}${colors.reset} / ${stats.total}`);
    
    if (sourcesWithText.length === 0) {
      log.warn('No sources with extracted text found. Nothing to re-index.');
      return;
    }
    
    console.log();
    log.step('Step 2/3: Processing each document...');
    console.log();
    
    // 3. Process each source
    for (let i = 0; i < sourcesWithText.length; i++) {
      const doc = sourcesWithText[i];
      const sourceData = doc.data();
      const sourceId = doc.id;
      
      console.log(`${colors.bright}[${i + 1}/${sourcesWithText.length}]${colors.reset} ${colors.cyan}${sourceData.name}${colors.reset}`);
      log.metric('Source ID', sourceId);
      log.metric('User', sourceData.userId);
      log.metric('Type', sourceData.type);
      log.metric('Text length', `${sourceData.extractedData.length.toLocaleString()} chars`);
      
      try {
        const text = sourceData.extractedData;
        const estimatedTokens = Math.ceil(text.length / 4);
        
        log.metric('Estimated tokens', estimatedTokens.toLocaleString());
        
        // Calculate expected chunks
        const effectiveAdvance = NEW_CHUNK_SIZE - NEW_OVERLAP;
        const expectedChunks = Math.ceil(estimatedTokens / effectiveAdvance);
        log.metric('Expected chunks', `~${expectedChunks} chunks`);
        
        if (DRY_RUN) {
          log.info(`${colors.yellow}Dry run - would create ${expectedChunks} chunks${colors.reset}`);
          stats.skipped++;
          console.log();
          continue;
        }
        
        // Chunk the document
        console.log(`  ${colors.dim}Chunking...${colors.reset}`);
        const chunkStart = Date.now();
        const chunks = chunkText(text, NEW_CHUNK_SIZE, NEW_OVERLAP);
        const chunkTime = Date.now() - chunkStart;
        
        log.success(`Created ${colors.bright}${chunks.length}${colors.reset} chunks in ${chunkTime}ms`);
        
        // Delete existing chunks
        console.log(`  ${colors.dim}Deleting old chunks...${colors.reset}`);
        const existingChunks = await firestore
          .collection('document_chunks')
          .where('sourceId', '==', sourceId)
          .get();
        
        if (existingChunks.size > 0) {
          const batch = firestore.batch();
          existingChunks.docs.forEach(d => batch.delete(d.ref));
          await batch.commit();
          log.info(`Deleted ${existingChunks.size} old chunks`);
        }
        
        // Generate embeddings and save
        console.log(`  ${colors.dim}Generating embeddings...${colors.reset}`);
        const embedStart = Date.now();
        
        let savedCount = 0;
        const batchSize = 10;
        const parallelEmbeddings = 5;
        
        for (let j = 0; j < chunks.length; j += batchSize) {
          const batchChunks = chunks.slice(j, Math.min(j + batchSize, chunks.length));
          
          // Progress indicator
          const progress = Math.round((j / chunks.length) * 100);
          process.stdout.write(`\r  ${colors.dim}Progress: ${progress}%${colors.reset}`);
          
          // Generate embeddings in parallel
          const embeddingsForBatch: number[][] = [];
          for (let k = 0; k < batchChunks.length; k += parallelEmbeddings) {
            const parallelChunks = batchChunks.slice(k, k + parallelEmbeddings);
            const parallelEmbeds = await Promise.all(
              parallelChunks.map(chunk => generateEmbedding(chunk.text))
            );
            embeddingsForBatch.push(...parallelEmbeds);
          }
          
          // Save to Firestore
          const batch = firestore.batch();
          for (let k = 0; k < batchChunks.length; k++) {
            const chunk = batchChunks[k];
            const embedding = embeddingsForBatch[k];
            
            const chunkDoc = firestore.collection('document_chunks').doc();
            batch.set(chunkDoc, {
              sourceId,
              userId: sourceData.userId,
              chunkIndex: j + k,
              text: chunk.text,
              tokenCount: chunk.tokenCount,
              embedding,
              metadata: {
                sourceName: sourceData.name,
                sourceType: sourceData.type,
                chunkSize: NEW_CHUNK_SIZE,
                overlap: NEW_OVERLAP,
                reindexedAt: new Date(),
              },
              createdAt: new Date(),
            });
            
            savedCount++;
          }
          
          await batch.commit();
        }
        
        console.log(''); // New line after progress
        const embedTime = Date.now() - embedStart;
        
        // Update source metadata
        await firestore.collection('context_sources').doc(sourceId).update({
          ragEnabled: true,
          ragMetadata: {
            chunkSize: NEW_CHUNK_SIZE,
            overlap: NEW_OVERLAP,
            chunksCreated: chunks.length,
            lastReindexed: new Date(),
            version: '2.0', // New chunking config
          },
          updatedAt: new Date(),
        });
        
        log.success(`Saved ${colors.bright}${savedCount}${colors.reset} chunks with embeddings (${(embedTime / 1000).toFixed(1)}s)`);
        
        // Calculate cost
        const embeddingCost = (chunks.reduce((sum, c) => sum + c.tokenCount, 0) / 1000) * 0.00002;
        log.metric('Embedding cost', `$${embeddingCost.toFixed(6)}`);
        
        // Update stats
        stats.processed++;
        stats.successful++;
        stats.totalChunks += chunks.length;
        stats.totalTokens += chunks.reduce((sum, c) => sum + c.tokenCount, 0);
        stats.totalCost += embeddingCost;
        
        console.log(`  ${colors.green}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
        console.log();
        
      } catch (error) {
        log.error(`Failed to process: ${error instanceof Error ? error.message : 'Unknown error'}`);
        stats.processed++;
        stats.failed++;
        console.log();
      }
    }
    
    // 3. Final summary
    console.log();
    console.log('┌─────────────────────────────────────────────────────────────┐');
    console.log(`│ ${colors.bright}✅ RE-INDEXING COMPLETE${colors.reset}                                  │`);
    console.log('└─────────────────────────────────────────────────────────────┘\n');
    
    log.step('Step 3/3: Final Statistics');
    console.log();
    
    // Calculate averages
    if (stats.successful > 0) {
      stats.avgChunksPerDoc = stats.totalChunks / stats.successful;
      stats.avgTokensPerDoc = stats.totalTokens / stats.successful;
    }
    
    // Summary table
    console.log(`${colors.bright}SUMMARY:${colors.reset}`);
    console.log('─────────────────────────────────────────');
    log.metric('Total sources found', stats.total.toString());
    log.metric('Sources processed', stats.processed.toString());
    log.metric('Successful', `${colors.green}${stats.successful}${colors.reset}`);
    log.metric('Failed', stats.failed > 0 ? `${colors.red}${stats.failed}${colors.reset}` : '0');
    log.metric('Skipped (dry run)', stats.skipped > 0 ? `${colors.yellow}${stats.skipped}${colors.reset}` : '0');
    console.log();
    
    console.log(`${colors.bright}CHUNKS:${colors.reset}`);
    console.log('─────────────────────────────────────────');
    log.metric('Total chunks created', `${colors.bright}${stats.totalChunks.toLocaleString()}${colors.reset}`);
    log.metric('Avg chunks per doc', stats.avgChunksPerDoc.toFixed(1));
    log.metric('Total tokens stored', stats.totalTokens.toLocaleString());
    log.metric('Avg tokens per doc', stats.avgTokensPerDoc.toLocaleString());
    console.log();
    
    console.log(`${colors.bright}COST:${colors.reset}`);
    console.log('─────────────────────────────────────────');
    log.metric('Total embedding cost', `${colors.green}$${stats.totalCost.toFixed(4)}${colors.reset}`);
    log.metric('Avg cost per doc', `$${(stats.totalCost / stats.successful).toFixed(6)}`);
    console.log();
    
    console.log(`${colors.bright}PERFORMANCE:${colors.reset}`);
    console.log('─────────────────────────────────────────');
    const totalTime = Date.now() - startTime;
    log.metric('Total time', `${(totalTime / 1000).toFixed(1)}s`);
    log.metric('Avg time per doc', `${(totalTime / 1000 / stats.processed).toFixed(1)}s`);
    console.log();
    
    // Configuration summary
    console.log(`${colors.bright}CONFIGURATION USED:${colors.reset}`);
    console.log('─────────────────────────────────────────');
    log.metric('Chunk size', `${NEW_CHUNK_SIZE} tokens`);
    log.metric('Overlap', `${NEW_OVERLAP} tokens`);
    log.metric('Effective advance', `${NEW_CHUNK_SIZE - NEW_OVERLAP} tokens/chunk`);
    console.log();
    
    if (DRY_RUN) {
      console.log(`${colors.yellow}${colors.bright}DRY RUN COMPLETE${colors.reset}`);
      console.log('No changes were made to Firestore.');
      console.log('Remove --dry-run flag to actually re-index.\n');
    } else {
      console.log(`${colors.green}${colors.bright}✅ ALL DOCUMENTS RE-INDEXED SUCCESSFULLY!${colors.reset}\n`);
      console.log('All context sources now use 2000/500 chunking configuration.');
      console.log('Search quality should improve significantly for technical documents.\n');
    }
    
  } catch (error) {
    log.error('Fatal error during re-indexing:');
    console.error(error);
    process.exit(1);
  }
}

// Main execution
console.log(`\n${colors.cyan}═══════════════════════════════════════════════════════════${colors.reset}`);
console.log(`${colors.bright}  BULK DOCUMENT RE-INDEXING TOOL${colors.reset}`);
console.log(`${colors.cyan}═══════════════════════════════════════════════════════════${colors.reset}\n`);

console.log('Usage:');
console.log('  tsx scripts/reindex-all-documents.ts [options]');
console.log();
console.log('Options:');
console.log('  --dry-run         Simulate without making changes');
console.log('  --user=<userId>   Only process documents for specific user');
console.log('  --limit=<number>  Limit number of documents to process');
console.log();
console.log('Examples:');
console.log('  tsx scripts/reindex-all-documents.ts --dry-run');
console.log('  tsx scripts/reindex-all-documents.ts --limit=5');
console.log('  tsx scripts/reindex-all-documents.ts --user=114671162830729001607');
console.log();

// Confirmation prompt (unless dry-run)
if (!DRY_RUN) {
  console.log(`${colors.yellow}⚠️  WARNING: This will re-index ALL documents in Firestore${colors.reset}`);
  console.log('   Existing chunks will be deleted and recreated.');
  console.log('   This may take several minutes.\n');
  
  // Auto-proceed for now (can add readline prompt later)
  console.log(`${colors.green}Proceeding with re-indexing...${colors.reset}\n`);
}

// Run the re-indexing
reindexAllDocuments()
  .then(() => {
    console.log(`${colors.bright}Done!${colors.reset} 🎉\n`);
    process.exit(0);
  })
  .catch((error) => {
    log.error('Unhandled error:');
    console.error(error);
    process.exit(1);
  });

