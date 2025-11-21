import { extractDocument } from '../cli/lib/extraction.js';
import { chunkText } from '../src/lib/chunking.js';
import { generateEmbedding } from '../src/lib/embeddings.js';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { BigQuery } from '@google-cloud/bigquery';

// Initialize
initializeApp({ projectId: 'salfagpt' });
const firestore = getFirestore();
const bigquery = new BigQuery({ projectId: 'salfagpt' });

const TEST_FILE = '/Users/alec/salfagpt/upload-queue/S002-20251118/Documentación /Segunda Carga de Documentos - 07-11-25/scania/Manual de Mantenimiento Periodico Scania L P G R y S.pdf';
const AGENT_ID = '1lgr33ywq5qed67sqCYi'; // S2-v2
const USER_ID = 'usr_uhwqffaqag1wrryd82tw';

async function testScaniaSimple() {
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║     TEST SCANIA - MÉTODO CLI (extractDocument)               ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');
  
  const fileName = TEST_FILE.split('/').pop()!;
  
  console.log(`📄 File: ${fileName}`);
  console.log(`🤖 Model: gemini-2.5-pro`);
  console.log(`📍 Method: CLI extractDocument (inline data)\n`);
  console.log('═'.repeat(70) + '\n');
  
  try {
    // 1. EXTRACTION
    console.log('📥 [1/5] EXTRACTING');
    console.log('─'.repeat(70));
    
    const extraction = await extractDocument(TEST_FILE, 'gemini-2.5-pro');
    
    if (!extraction.success) {
      throw new Error(`Extraction failed: ${extraction.error}`);
    }
    
    console.log(`   ✅ Extracted ${extraction.extractedText.length.toLocaleString()} chars`);
    console.log(`   ⏱️  Time: ${extraction.duration.toFixed(1)}s`);
    console.log(`   💰 Cost: $${extraction.estimatedCost.toFixed(6)}`);
    
    // Show DETAILED preview to check if it's TOC or real content
    console.log('\n   📝 PREVIEW (first 2000 chars):');
    console.log('   ┌' + '─'.repeat(68) + '┐');
    const preview = extraction.extractedText.substring(0, 2000);
    preview.split('\n').forEach(line => {
      console.log(`   │ ${line}`.substring(0, 69).padEnd(69) + '│');
    });
    console.log('   └' + '─'.repeat(68) + '┘\n');
    
    // Check if it's mostly TOC (lots of dots and page numbers)
    const dotCount = (extraction.extractedText.match(/\.\.\./g) || []).length;
    const pageNumCount = (extraction.extractedText.match(/\s\d{1,3}\s/g) || []).length;
    const tocRatio = (dotCount + pageNumCount) / (extraction.extractedText.length / 100);
    
    console.log(`   📊 TOC Detection:`);
    console.log(`      Dots (...): ${dotCount}`);
    console.log(`      Page numbers: ${pageNumCount}`);
    console.log(`      TOC ratio: ${tocRatio.toFixed(2)} (>5 = likely TOC only)`);
    
    if (tocRatio > 5) {
      console.warn(`\n   ⚠️  WARNING: Content appears to be mostly Table of Contents!`);
      console.warn(`      Gemini may not be extracting the full manual content.`);
      console.warn(`      This is a known issue with large scanned manuals.`);
    }
    
    // 2. CHECK FIRESTORE
    console.log('\n💾 [2/5] CHECKING FIRESTORE');
    console.log('─'.repeat(70));
    
    const existingSnapshot = await firestore.collection('context_sources')
      .where('userId', '==', USER_ID)
      .where('metadata.originalFileName', '==', fileName)
      .limit(1)
      .get();
    
    if (existingSnapshot.empty) {
      console.log('   ℹ️  Source not found in Firestore - would create new');
    } else {
      const sourceId = existingSnapshot.docs[0].id;
      const currentData = existingSnapshot.docs[0].data();
      console.log(`   ✅ Found existing source: ${sourceId}`);
      console.log(`      Current extractedData: ${currentData.extractedData?.length || 0} chars`);
      console.log(`      Would update with: ${extraction.extractedText.length} chars`);
    }
    
    console.log('\n✅ TEST COMPLETE (Extraction only - not updating Firestore)');
    console.log('═'.repeat(70));
    console.log(`Result: ${extraction.extractedText.length.toLocaleString()} chars extracted`);
    console.log(`Quality: ${tocRatio > 5 ? '⚠️  TOC ONLY' : '✅ Full content'}`);
    console.log('═'.repeat(70));
    
    process.exit(0);
    
  } catch (e: any) {
    console.error('\n❌ TEST FAILED:', e.message);
    console.error(e.stack);
    process.exit(1);
  }
}

testScaniaSimple().catch(e => {
  console.error('\n❌ FATAL ERROR:', e);
  process.exit(1);
});



