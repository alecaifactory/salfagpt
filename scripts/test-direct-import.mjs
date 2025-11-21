// Direct import test - bypasses API
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PDF_PATH = '/Users/alec/salfagpt/upload-queue/cartolas/Banco de Chile.pdf';

console.log(`
╔═══════════════════════════════════════════════════════════════╗
║         DIRECT TEST - Banco de Chile                          ║
╚═══════════════════════════════════════════════════════════════╝
`);

async function main() {
  try {
    console.log('📦 Loading modules...');
    
    // Set environment variable if not set
    if (!process.env.GOOGLE_AI_API_KEY && !process.env.GEMINI_API_KEY) {
      // Try to load from .env
      try {
        const envContent = fs.readFileSync('.env', 'utf8');
        const match = envContent.match(/GOOGLE_AI_API_KEY=(.+)/);
        if (match) {
          process.env.GOOGLE_AI_API_KEY = match[1].trim();
          console.log('✅ Loaded API key from .env');
        }
      } catch (e) {
        console.warn('⚠️  Could not load .env file');
      }
    }
    
    // Dynamic import of the extraction function
    const modulePath = path.resolve(__dirname, '../src/lib/nubox-cartola-extraction.ts');
    console.log(`   Module: ${modulePath}`);
    
    // Load via node's import
    const { extractNuboxCartola } = await import(modulePath);
    
    console.log('✅ Module loaded successfully');
    console.log('');
    
    console.log('📄 Loading PDF...');
    const buffer = fs.readFileSync(PDF_PATH);
    console.log(`   Size: ${(buffer.length / 1024).toFixed(2)} KB`);
    console.log('');
    
    console.log('🚀 Starting extraction...');
    const startTime = Date.now();
    
    const result = await extractNuboxCartola(buffer, {
      fileName: 'Banco de Chile.pdf',
      model: 'gemini-2.5-flash',
      currency: 'CLP',
    });
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    
    console.log('');
    console.log('✅ EXTRACTION COMPLETE!');
    console.log('─'.repeat(80));
    console.log('');
    console.log('📊 SUMMARY:');
    console.log(`   Bank:       ${result.bank_name}`);
    console.log(`   Movements:  ${result.movements.length}`);
    console.log(`   Duration:   ${duration}s`);
    console.log(`   Confidence: ${(result.metadata.confidence * 100).toFixed(1)}%`);
    console.log('');
    
    console.log('📋 FIRST MOVEMENT:');
    const first = result.movements[0];
    console.log(JSON.stringify(first, null, 2));
    
    // Save output
    fs.writeFileSync('TEST_OUTPUT_DIRECT.json', JSON.stringify(result, null, 2));
    console.log('');
    console.log('💾 Full output saved to: TEST_OUTPUT_DIRECT.json');
    
  } catch (error) {
    console.error('');
    console.error('❌ ERROR:', error.message);
    console.error('');
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

main();


