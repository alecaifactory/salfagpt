import { extractTextChunked } from '../src/lib/chunked-extraction.js';
import { chunkText } from '../src/lib/chunking.js';
import { generateEmbedding } from '../src/lib/embeddings.js';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { BigQuery } from '@google-cloud/bigquery';
import * as fs from 'fs';

// Initialize
initializeApp({ projectId: 'salfagpt' });
const firestore = getFirestore();
const bigquery = new BigQuery({ projectId: 'salfagpt' });

const TEST_FILE = '/Users/alec/salfagpt/upload-queue/S002-20251118/Documentación /Segunda Carga de Documentos - 07-11-25/scania/Manual de Operaciones Scania P450 B 8x4.pdf';
const AGENT_ID = '1lgr33ywq5qed67sqCYi'; 
const USER_ID = 'usr_uhwqffaqag1wrryd82tw';

async function testChunkedFileAPI() {
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║   TEST CHUNKED EXTRACTION WITH FILE API (13MB Scania)        ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');
  
  const fileName = TEST_FILE.split('/').pop()!;
  const fileStats = fs.statSync(TEST_FILE);
  const fileSizeMB = fileStats.size / (1024 * 1024);
  
  console.log(`📄 File: ${fileName}`);
  console.log(`📊 Size: ${fileSizeMB.toFixed(2)} MB`);
  console.log(`🔪 Strategy: Split into PDF sections → File API → Combine`);
  console.log(`🤖 Model: gemini-2.5-pro\n`);
  console.log('═'.repeat(70) + '\n');
  
  try {
    // 1. CHUNKED EXTRACTION
    console.log('📥 [1/3] CHUNKED EXTRACTION (WITH FILE API FIX)');
    console.log('─'.repeat(70));
    
    const pdfBuffer = fs.readFileSync(TEST_FILE);
    
    const extraction = await extractTextChunked(pdfBuffer, {
      model: 'gemini-2.5-pro',
      sectionSizeMB: 12, 
      userId: USER_ID,
      fileName: fileName,
      onProgress: (p) => {
        console.log(`   📄 Section ${p.section}/${p.total} (${p.percentage.toFixed(0)}%): ${p.message}`);
      }
    });
    
    console.log('\n   ✅ EXTRACTION COMPLETE:');
    console.log(`      Text: ${extraction.text.length.toLocaleString()} chars`);
    console.log(`      PDF Sections: ${extraction.totalPdfSections}`);
    console.log(`      Pages: ${extraction.totalPages}`);
    console.log(`      Time: ${extraction.extractionTime.toFixed(1)}s`);
    
    // 2. CHECK CONTENT QUALITY
    console.log('\n📊 [2/3] CONTENT QUALITY CHECK');
    console.log('─'.repeat(70));
    
    const keywords = {
      'aceite': (extraction.text.toLowerCase().match(/aceite/g) || []).length,
      'filtro': (extraction.text.toLowerCase().match(/filtro/g) || []).length,
      'mantenimiento': (extraction.text.toLowerCase().match(/mantenimiento/g) || []).length,
      'hidráulico': (extraction.text.toLowerCase().match(/hidráulico/g) || []).length,
      'horas': (extraction.text.toLowerCase().match(/\d{3,4}\s*horas/g) || []).length,
    };
    
    console.log('   Keyword counts:');
    Object.entries(keywords).forEach(([kw, count]) => {
      console.log(`      ${kw}: ${count} mentions ${count > 5 ? '✅' : count > 0 ? '⚠️' : '❌'}`);
    });
    
    const totalKeywords = Object.values(keywords).reduce((a, b) => a + b, 0);
    
    if (totalKeywords < 10) {
      console.warn('\n      ⚠️  LOW KEYWORD COUNT - May be mostly TOC');
    } else {
      console.log('\n      ✅ GOOD KEYWORD COUNT - Likely has technical content');
    }
    
    // Show sample from middle
    console.log('\n   📝 Sample from middle (chars 50000-50500):');
    console.log('   ┌─────────────────────────────────────────────┐');
    const sample = extraction.text.substring(50000, 50500);
    sample.split('\n').slice(0, 10).forEach(line => {
      console.log(`   │ ${line}`.substring(0, 69).padEnd(69) + '│');
    });
    console.log('   └─────────────────────────────────────────────┘\n');
    
    // 3. SUMMARY
    console.log('═'.repeat(70));
    if (totalKeywords >= 10 && extraction.text.length > 50000) {
      console.log('✅✅ SUCCESS: Chunked extraction with File API works!');
      console.log(`   - Extracted ${extraction.text.length.toLocaleString()} chars`);
      console.log(`   - ${totalKeywords} technical keywords found`);
      console.log(`   - Ready for chunking & indexing`);
    } else {
      console.log('⚠️  PARTIAL: Extraction completed but content may be limited');
    }
    console.log('═'.repeat(70));
    
    process.exit(totalKeywords >= 10 ? 0 : 1);
    
  } catch (e: any) {
    console.error('\n❌ TEST FAILED:', e.message);
    console.error(e.stack);
    process.exit(1);
  }
}

testChunkedFileAPI().catch(e => {
  console.error('\n❌ FATAL:', e);
  process.exit(1);
});

