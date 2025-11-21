import { extractDocument } from '../cli/lib/extraction.js';
import { chunkText } from '../src/lib/chunking.js';
import { generateEmbedding } from '../src/lib/embeddings.js';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { BigQuery } from '@google-cloud/bigquery';
import * as fs from 'fs';
import * as path from 'path';

// Initialize
initializeApp({ projectId: 'salfagpt' });
const firestore = getFirestore();
const bigquery = new BigQuery({ projectId: 'salfagpt' });

const SCANIA_FOLDER = '/Users/alec/salfagpt/upload-queue/S002-20251118/Documentación /Segunda Carga de Documentos - 07-11-25/scania';
const AGENT_ID = '1lgr33ywq5qed67sqCYi'; // S2-v2
const USER_ID = 'usr_uhwqffaqag1wrryd82tw';
const MODEL = 'gemini-2.5-pro'; // Using Pro for better OCR on scanned PDFs

async function uploadAndProcessScaniaDocs() {
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║        UPLOAD & PROCESS SCANIA DOCUMENTS - S2-v2              ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');
  
  // Get all PDFs
  const files = fs.readdirSync(SCANIA_FOLDER).filter(f => f.endsWith('.pdf'));
  
  console.log(`📁 Found ${files.length} Scania PDFs to process:\n`);
  files.forEach((f, idx) => console.log(`   ${idx+1}. ${f}`));
  
  console.log('\n' + '═'.repeat(70) + '\n');
  
  const stats = {
    total: files.length,
    extracted: 0,
    chunked: 0,
    indexed: 0,
    failed: []
  };
  
  for (let i = 0; i < files.length; i++) {
    const fileName = files[i];
    const filePath = path.join(SCANIA_FOLDER, fileName);
    
    console.log(`[${i+1}/${files.length}] 📄 ${fileName}`);
    console.log('─'.repeat(70));
    
    try {
      // 1. Check file size and use appropriate extraction method
      const fileStats = fs.statSync(filePath);
      const fileSizeMB = fileStats.size / (1024 * 1024);
      
      console.log(`   [1/4] 📥 Extracting... (${fileSizeMB.toFixed(1)}MB)`);
      
      let extractedText: string;
      let extractionTime: number;
      let extractionCost: number;
      
      // ✅ Use chunked extraction for files >10MB (better content extraction)
      if (fileSizeMB > 10) {
        console.log(`      🔪 File >10MB - Using PDF Section Extraction for complete content`);
        
        const { extractTextChunked } = await import('../src/lib/chunked-extraction.js');
        const pdfBuffer = fs.readFileSync(filePath);
        
        const chunkedResult = await extractTextChunked(pdfBuffer, {
          model: MODEL,
          sectionSizeMB: 12, // 12MB sections
          userId: USER_ID,
          fileName: fileName,
          onProgress: (p) => {
            if (p.section % 5 === 0 || p.section === p.total) {
              console.log(`      📄 Section ${p.section}/${p.total} (${p.percentage}%): ${p.message}`);
            }
          }
        });
        
        extractedText = chunkedResult.text;
        extractionTime = chunkedResult.extractionTime;
        extractionCost = 0; // TODO: Calculate from chunkedResult
        
        console.log(`      ✅ ${extractedText.length.toLocaleString()} chars extracted from ${chunkedResult.totalPdfSections} sections.`);
        
      } else {
        console.log(`      📄 File <10MB - Using standard extraction`);
        
        const extraction = await extractDocument(filePath, MODEL);
        
        if (!extraction.success || extraction.extractedText.length < 500) {
          console.log(`      ❌ Extraction failed. Chars: ${extraction.extractedText.length}`);
          throw new Error(`Extraction failed: ${extraction.error || 'Empty text - corrupted or unreadable PDF'}`);
        }
        
        extractedText = extraction.extractedText;
        extractionTime = extraction.extractionTimeSeconds;
        extractionCost = extraction.estimatedCost;
        
        console.log(`      ✅ ${extraction.charactersExtracted.toLocaleString()} chars extracted.`);
      }
      
      stats.extracted++;
      
      // 2. Create source in Firestore
      console.log('   [2/4] 💾 Creating source...');
      const sourceRef = await firestore.collection('context_sources').add({
        userId: USER_ID,
        name: fileName,
        type: 'pdf',
        status: 'active',
        assignedToAgents: [AGENT_ID],
        extractedData: extractedText,
        extractionModel: MODEL,
        addedAt: new Date(),
        metadata: {
          originalFileName: fileName,
          extractionDate: new Date(),
          charactersExtracted: extractedText.length,
          tokensEstimate: Math.ceil(extractedText.length / 4),
          extractionCost: extractionCost,
          extractionTime: extractionTime
        }
      });
      
      console.log(`      ✅ Source created: ${sourceRef.id}`);
      
      // 3. Chunk
      console.log('   [3/4] ✂️  Chunking...');
      const chunks = chunkText(extractedText, 500, 50);
      console.log(`      ✅ ${chunks.length} chunks generated.`);
      stats.chunked += chunks.length;
      
      // 4. Embed & Index
      console.log(`   [4/4] 🧠 Embedding & Indexing ${chunks.length} chunks...`);
      
      let success = 0;
      for (let ci = 0; ci < chunks.length; ci++) {
        const chunk = chunks[ci];
        const chunkId = `${sourceRef.id}_chunk_${ci}`;
        
        if (ci % 5 === 0 || ci === chunks.length - 1) {
          process.stdout.write(`      Progress: ${ci+1}/${chunks.length}...\r`);
        }
        
        try {
          const embedding = await generateEmbedding(chunk.text);
          
          // Save to Firestore
          await firestore.collection('document_chunks').doc(chunkId).set({
            sourceId: sourceRef.id,
            chunkIndex: ci,
            text: chunk.text,
            embedding: embedding,
            createdAt: new Date()
          });
          
          // Sync to BigQuery
          await bigquery.dataset('flow_rag_optimized').table('document_chunks_vectorized').insert([{
            chunk_id: chunkId,
            source_id: sourceRef.id,
            user_id: USER_ID,
            chunk_index: ci,
            text_preview: chunk.text.substring(0, 500),
            full_text: chunk.text,
            embedding: embedding,
            metadata: JSON.stringify({ source: fileName }),
            created_at: new Date().toISOString()
          }]);
          
          success++;
          stats.indexed++;
        } catch (e: any) {
          console.error(`\n      ⚠️  Chunk ${ci} failed: ${e.message}`);
        }
      }
      
      console.log(`      ✅ ${success}/${chunks.length} chunks indexed.\n`);
      
    } catch (e: any) {
      console.error(`   ❌ FAILED: ${e.message}\n`);
      stats.failed.push({ file: fileName, error: e.message });
    }
    
    // Small delay between files
    if (i < files.length - 1) {
      console.log('   ⏳ Waiting 2s...\n');
      await new Promise(r => setTimeout(r, 2000));
    }
  }
  
  // Summary
  console.log('\n' + '═'.repeat(70));
  console.log('📊 FINAL SUMMARY');
  console.log('═'.repeat(70));
  console.log(`Total files: ${stats.total}`);
  console.log(`✅ Extracted: ${stats.extracted}`);
  console.log(`📦 Total chunks: ${stats.chunked}`);
  console.log(`☁️  Indexed in BigQuery: ${stats.indexed}`);
  console.log(`❌ Failed: ${stats.failed.length}`);
  
  if (stats.failed.length > 0) {
    console.log('\n⚠️  FAILED FILES:');
    stats.failed.forEach(f => console.log(`   - ${f.file}: ${f.error}`));
  }
  
  console.log('\n✅ Scania documents processing complete!');
  process.exit(stats.failed.length > 0 ? 1 : 0);
}

uploadAndProcessScaniaDocs().catch(e => {
  console.error('\n❌ FATAL ERROR:', e);
  process.exit(1);
});

