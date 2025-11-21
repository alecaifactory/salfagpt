import { config } from 'dotenv';
import * as fs from 'fs';
import FormData from 'form-data';

config();

const TEST_FILE = '/Users/alec/salfagpt/upload-queue/S002-20251118/Documentación /Segunda Carga de Documentos - 07-11-25/scania/Manual de Operaciones Scania P450 B 8x4.pdf';
const API_KEY = process.env.GOOGLE_AI_API_KEY!;

async function extractScania() {
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║   SCANIA P450 - GEMINI FILE API (FULL REST)                  ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');
  
  const fileName = TEST_FILE.split('/').pop()!;
  const fileStats = fs.statSync(TEST_FILE);
  const fileSizeMB = fileStats.size / (1024 * 1024);
  
  console.log(`📄 File: ${fileName}`);
  console.log(`📊 Size: ${fileSizeMB.toFixed(2)} MB`);
  console.log(`🔑 API: Gemini REST API (multipart resumable upload)`);
  console.log(`🤖 Model: gemini-2.5-pro\n`);
  console.log('═'.repeat(70) + '\n');
  
  try {
    // 1. UPLOAD FILE
    console.log('[1/4] 📤 UPLOADING FILE');
    console.log('─'.repeat(70));
    
    const fileBuffer = fs.readFileSync(TEST_FILE);
    
    // Using multipart upload
    const formData = new FormData();
    formData.append('file', fileBuffer, {
      filename: fileName,
      contentType: 'application/pdf'
    });
    
    const uploadUrl = `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${API_KEY}`;
    
    const uploadResponse = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
      headers: formData.getHeaders()
    });
    
    if (!uploadResponse.ok) {
      throw new Error(`Upload failed: ${await uploadResponse.text()}`);
    }
    
    const uploadData: any = await uploadResponse.json();
    const fileUri = uploadData.file.uri;
    const fileId = uploadData.file.name;
    
    console.log(`   ✅ Uploaded: ${fileId}`);
    console.log(`   📍 URI: ${fileUri}\n`);
    
    // 2. WAIT FOR PROCESSING
    console.log('[2/4] ⏳ WAITING FOR FILE PROCESSING');
    console.log('─'.repeat(70));
    
    let ready = false;
    let attempts = 0;
    
    while (attempts < 60 && !ready) {
      const statusUrl = `https://generativelanguage.googleapis.com/v1beta/${fileId}?key=${API_KEY}`;
      const statusResp = await fetch(statusUrl);
      const status: any = await statusResp.json();
      
      if (status.state === 'ACTIVE') {
        ready = true;
        console.log(`   ✅ File active after ${attempts}s\n`);
        break;
      }
      
      await new Promise(r => setTimeout(r, 1000));
      attempts++;
    }
    
    if (!ready) {
      throw new Error('Timeout waiting for file');
    }
    
    // 3. GENERATE CONTENT
    console.log('[3/4] 📖 EXTRACTING TEXT');
    console.log('─'.repeat(70));
    
    const extractStart = Date.now();
    
    const extractUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${API_KEY}`;
    
    const extractPayload = {
      contents: [
        {
          role: 'user',
          parts: [
            {
              fileData: {
                mimeType: 'application/pdf',
                fileUri: fileUri
              }
            },
            {
              text: `Extract ALL text from this complete PDF manual (all pages).

Include EVERYTHING:
- All text content from every page
- All tables (convert to markdown format)
- All technical specifications
- All maintenance procedures
- All safety warnings
- Preserve structure with headings

DO NOT skip any pages. DO NOT summarize. Extract the COMPLETE content.`
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 100000
      }
    };
    
    console.log(`   📤 Sending extraction request to Gemini...`);
    
    const extractResp = await fetch(extractUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(extractPayload)
    });
    
    if (!extractResp.ok) {
      throw new Error(`Extraction failed: ${await extractResp.text()}`);
    }
    
    const extractData: any = await extractResp.json();
    const extractedText = extractData.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const extractTime = Date.now() - extractStart;
    
    console.log(`   ✅ Extraction complete: ${extractedText.length.toLocaleString()} chars in ${(extractTime/1000).toFixed(1)}s\n`);
    
    // 4. QUALITY CHECK
    console.log('[4/4] 🔍 CONTENT QUALITY');
    console.log('═'.repeat(70));
    
    const keywords = {
      'aceite': (extractedText.toLowerCase().match(/aceite/g) || []).length,
      'filtro': (extractedText.toLowerCase().match(/filtro/g) || []).length,
      'mantenimiento': (extractedText.toLowerCase().match(/mantenimiento/g) || []).length,
      'hidráulico': (extractedText.toLowerCase().match(/hidráulico/g) || []).length,
      '500 horas': (extractedText.toLowerCase().match(/500\s*horas/g) || []).length,
      '1000 horas': (extractedText.toLowerCase().match(/1000\s*horas/g) || []).length,
      '2000 horas': (extractedText.toLowerCase().match(/2000\s*horas/g) || []).length,
    };
    
    console.log('\n   Keyword Analysis:');
    Object.entries(keywords).forEach(([kw, count]) => {
      const status = count > 5 ? '✅' : count > 0 ? '⚠️' : '❌';
      console.log(`      ${kw.padEnd(15)}: ${count.toString().padStart(4)} ${status}`);
    });
    
    const total = Object.values(keywords).reduce((a, b) => a + b, 0);
    
    console.log(`\n   Total: ${total} keyword mentions`);
    
    // Sample content
    console.log('\n   📝 Content Sample (chars 30000-30500):');
    console.log('   ┌' + '─'.repeat(68) + '┐');
    const sample = extractedText.substring(30000, 30500);
    sample.split('\n').slice(0, 15).forEach(line => {
      console.log(`   │ ${line}`.substring(0, 69).padEnd(69) + '│');
    });
    console.log('   └' + '─'.repeat(68) + '┘');
    
    console.log('\n' + '═'.repeat(70));
    console.log('RESULT:');
    console.log('═'.repeat(70));
    console.log(`File size: ${fileSizeMB.toFixed(2)} MB`);
    console.log(`Extracted: ${extractedText.length.toLocaleString()} chars`);
    console.log(`Keywords: ${total}`);
    console.log(`Method: ✅ Gemini File API (REST)`);
    console.log(`Quality: ${total >= 20 ? '✅ Excellent' : total >= 10 ? '✅ Good' : total >= 5 ? '⚠️  Limited' : '❌ TOC only'}`);
    console.log('═'.repeat(70));
    
    if (total >= 10) {
      console.log('\n✅ This method works for large PDFs! Can be used for 10MB-500MB files.');
    } else {
      console.log('\n⚠️  Content quality is low - may need alternative approach.');
    }
    
    process.exit(0);
    
  } catch (e: any) {
    console.error('\n❌ FAILED:', e.message);
    console.error(e.stack);
    process.exit(1);
  }
}

extractScania().catch(e => {
  console.error('\n❌ FATAL:', e);
  process.exit(1);
});

