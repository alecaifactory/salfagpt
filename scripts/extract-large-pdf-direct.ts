import { GoogleGenAI } from '@google/genai';
import { config } from 'dotenv';
import { chunkText } from '../src/lib/chunking.js';
import { generateEmbedding } from '../src/lib/embeddings.js';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { BigQuery } from '@google-cloud/bigquery';
import * as fs from 'fs';
import FormData from 'form-data';
import fetch from 'node-fetch';

config();

// Initialize Firebase
initializeApp({ projectId: 'salfagpt' });
const firestore = getFirestore();
const bigquery = new BigQuery({ projectId: 'salfagpt' });
const genAI = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY! });

const TEST_FILE = '/Users/alec/salfagpt/upload-queue/S002-20251118/Documentación /Segunda Carga de Documentos - 07-11-25/scania/Manual de Operaciones Scania P450 B 8x4.pdf';
const AGENT_ID = '1lgr33ywq5qed67sqCYi'; 
const USER_ID = 'usr_uhwqffaqag1wrryd82tw';
const API_KEY = process.env.GOOGLE_AI_API_KEY!;

async function uploadFileToGemini(fileBuffer: Buffer, fileName: string): Promise<{uri: string; name: string}> {
  console.log('📤 Uploading file to Gemini File API via REST...');
  
  const formData = new FormData();
  formData.append('file', fileBuffer, {
    filename: fileName,
    contentType: 'application/pdf'
  });
  
  const uploadUrl = `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${API_KEY}`;
  
  const response = await fetch(uploadUrl, {
    method: 'POST',
    body: formData,
    headers: formData.getHeaders()
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Upload failed: ${error}`);
  }
  
  const result: any = await response.json();
  console.log(`✅ Uploaded: ${result.file.name}`);
  
  return {
    uri: result.file.uri,
    name: result.file.name
  };
}

async function testLargePDF() {
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║   EXTRACT LARGE PDF - GEMINI FILE API REST (10-500MB)        ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');
  
  const fileName = TEST_FILE.split('/').pop()!;
  const fileStats = fs.statSync(TEST_FILE);
  const fileSizeMB = fileStats.size / (1024 * 1024);
  
  console.log(`📄 File: ${fileName}`);
  console.log(`📊 Size: ${fileSizeMB.toFixed(2)} MB`);
  console.log(`🔑 Method: Gemini File API (REST) - Supports up to 2GB`);
  console.log(`🤖 Model: gemini-2.5-pro\n`);
  console.log('═'.repeat(70) + '\n');
  
  try {
    // 1. Upload file
    console.log('[1/5] 📤 UPLOAD TO GEMINI');
    console.log('─'.repeat(70));
    
    const pdfBuffer = fs.readFileSync(TEST_FILE);
    const uploadedFile = await uploadFileToGemini(pdfBuffer, fileName);
    
    console.log(`   URI: ${uploadedFile.uri}\n`);
    
    // 2. Wait for file to be ready (poll state)
    console.log('[2/5] ⏳ WAITING FOR FILE PROCESSING');
    console.log('─'.repeat(70));
    
    let attempts = 0;
    let fileReady = false;
    
    while (attempts < 60 && !fileReady) {
      const getUrl = `https://generativelanguage.googleapis.com/v1beta/${uploadedFile.name}?key=${API_KEY}`;
      const statusResp = await fetch(getUrl);
      const statusData: any = await statusResp.json();
      
      if (statusData.state === 'ACTIVE') {
        fileReady = true;
        console.log(`   ✅ File ready after ${attempts}s\n`);
        break;
      }
      
      await new Promise(r => setTimeout(r, 1000));
      attempts++;
      
      if (attempts % 5 === 0) {
        console.log(`   ⏳ Still processing... ${attempts}s (state: ${statusData.state || 'unknown'})`);
      }
    }
    
    if (!fileReady) {
      throw new Error('File processing timeout (60s)');
    }
    
    // 3. Extract with generateContent
    console.log('[3/5] 📖 EXTRACTING TEXT');
    console.log('─'.repeat(70));
    
    const extractStart = Date.now();
    
    const result = await genAI.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: [
        {
          role: 'user',
          parts: [
            {
              fileData: {
                mimeType: 'application/pdf',
                fileUri: uploadedFile.uri
              }
            },
            {
              text: `Extract ALL text from this complete PDF manual.

Include EVERYTHING:
- All pages
- All sections
- All tables (in markdown format)
- All technical specifications
- All procedures
- All maintenance schedules

DO NOT skip pages. DO NOT summarize. Extract COMPLETE text.`
            }
          ]
        }
      ],
      config: {
        temperature: 0.1,
        maxOutputTokens: 100000 // Max available
      }
    });
    
    const extractedText = result.text || '';
    const extractTime = Date.now() - extractStart;
    
    console.log(`   ✅ Extracted: ${extractedText.length.toLocaleString()} chars`);
    console.log(`   ⏱️  Time: ${extractTime.toFixed(1)}s\n`);
    
    // 4. Quality check
    console.log('[4/5] 📊 QUALITY CHECK');
    console.log('─'.repeat(70));
    
    const keywords = {
      'aceite': (extractedText.toLowerCase().match(/aceite/g) || []).length,
      'filtro': (extractedText.toLowerCase().match(/filtro/g) || []).length,
      'mantenimiento': (extractedText.toLowerCase().match(/mantenimiento/g) || []).length,
      'horas': (extractedText.toLowerCase().match(/\d{3,4}\s*horas/g) || []).length,
    };
    
    Object.entries(keywords).forEach(([kw, count]) => {
      const status = count > 10 ? '✅' : count > 0 ? '⚠️' : '❌';
      console.log(`   ${kw.padEnd(15)}: ${count.toString().padStart(4)} ${status}`);
    });
    
    const total = Object.values(keywords).reduce((a, b) => a + b, 0);
    
    if (total < 10) {
      console.warn('\n   ⚠️  WARNING: Low keyword count - may be TOC only');
    } else {
      console.log(`\n   ✅ GOOD: ${total} technical keywords found`);
    }
    
    // Show preview
    console.log('\n   📝 Sample (chars 50000-50500):');
    console.log('   ' + extractedText.substring(50000, 50500).substring(0, 400));
    
    // 5. Cleanup uploaded file
    console.log('\n\n🧹 [5/5] CLEANUP');
    console.log('─'.repeat(70));
    
    try {
      const deleteUrl = `https://generativelanguage.googleapis.com/v1beta/${uploadedFile.name}?key=${API_KEY}`;
      await fetch(deleteUrl, { method: 'DELETE' });
      console.log(`   ✅ Deleted uploaded file from Gemini\n`);
    } catch (e) {
      console.warn(`   ⚠️  Cleanup failed (non-critical)\n`);
    }
    
    // Summary
    console.log('═'.repeat(70));
    
    if (total >= 20 && extractedText.length > 50000) {
      console.log('✅✅✅ SUCCESS: File API works for large PDFs!');
      console.log(`   - Size: ${fileSizeMB.toFixed(2)} MB`);
      console.log(`   - Extracted: ${extractedText.length.toLocaleString()} chars`);
      console.log(`   - Keywords: ${total}`);
      console.log(`   - Time: ${extractTime.toFixed(1)}s`);
      console.log(`   - Ready for chunking & RAG`);
    } else if (total >= 5) {
      console.log('⚠️  PARTIAL: Extracted but limited content');
    } else {
      console.log('❌ FAILED: Mostly TOC, no technical content');
    }
    
    console.log('═'.repeat(70));
    
    process.exit(total >= 20 ? 0 : 1);
    
  } catch (e: any) {
    console.error('\n❌ FAILED:', e.message);
    console.error(e.stack);
    process.exit(1);
  }
}

testLargePDF().catch(e => {
  console.error('\n❌ FATAL:', e);
  process.exit(1);
});

