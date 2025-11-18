/**
 * VERBOSE VERSION - Shows EVERY step of extraction
 */

import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  const logs: string[] = [];
  
  function log(message: string) {
    const timestamp = new Date().toISOString();
    const logLine = `[${timestamp}] ${message}`;
    console.log(logLine);
    logs.push(logLine);
  }
  
  try {
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    log('🎬 STARTING EXTRACTION - VERBOSE MODE');
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    log('Step 1: Parsing form data...');
    const formData = await request.formData();
    log('✅ Form data parsed');
    
    log('Step 2: Getting file from form...');
    const file = formData.get('file') as File;
    if (!file) {
      log('❌ No file in form data');
      throw new Error('No file provided');
    }
    log(`✅ File received: ${file.name} (${file.size} bytes, ${file.type})`);
    
    log('Step 3: Getting parameters...');
    const model = (formData.get('model') as string) || 'gemini-2.5-flash';
    const outputFormat = (formData.get('outputFormat') as string) || 'nubox';
    const structured = formData.get('structured') === 'true';
    log(`✅ Parameters: model=${model}, format=${outputFormat}, structured=${structured}`);
    
    log('Step 4: Converting file to buffer...');
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileSizeMB = buffer.length / (1024 * 1024);
    log(`✅ Buffer created: ${fileSizeMB.toFixed(2)} MB`);
    
    if (structured && outputFormat === 'nubox') {
      log('Step 5: Loading Nubox extraction module...');
      const { extractNuboxCartola } = await import('../../../lib/nubox-cartola-extraction.js');
      log('✅ Nubox module loaded');
      
      log('Step 6: Calling extractNuboxCartola...');
      log(`   Parameters: fileName=${file.name}, model=${model}`);
      
      const result = await extractNuboxCartola(buffer, {
        fileName: file.name,
        model: model as any,
        currency: 'CLP',
      });
      
      log('✅ Nubox extraction completed!');
      log(`   Movements: ${result.movements?.length || 0}`);
      log(`   Bank: ${result.bank_name}`);
      log(`   Quality: ${result.quality?.recommendation}`);
      
      log('Step 7: Building response...');
      const response = {
        success: true,
        result: {
          ...result,
          mode: 'nubox',
        },
        logs: logs,
        verbose: true,
      };
      
      log('✅ Response ready');
      log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      return new Response(JSON.stringify(response, null, 2), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
      
    } else {
      log('⚠️ Not using Nubox format or not structured');
      log(`   outputFormat=${outputFormat}, structured=${structured}`);
      
      throw new Error('Only Nubox format supported in verbose mode');
    }
    
  } catch (error) {
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    log('❌ ERROR OCCURRED');
    log(`Error type: ${error?.constructor?.name}`);
    log(`Error message: ${error instanceof Error ? error.message : String(error)}`);
    if (error instanceof Error && error.stack) {
      log('Stack trace:');
      error.stack.split('\n').forEach(line => log(`  ${line}`));
    }
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    return new Response(JSON.stringify({
      success: false,
      result: null,
      error: error instanceof Error ? error.message : 'Unknown error',
      logs: logs,
      verbose: true,
    }, null, 2), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

