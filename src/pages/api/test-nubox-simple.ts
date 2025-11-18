/**
 * Simple Test Endpoint for Nubox Extraction
 * This bypasses the playground logic to test directly
 */

import type { APIRoute } from 'astro';
import fs from 'fs';

export const GET: APIRoute = async () => {
  try {
    console.log('🧪 [Test] Simple Nubox test starting...');
    
    // Test 1: Check if module exists
    console.log('📦 [Test] Checking module...');
    const { extractNuboxCartola } = await import('../../lib/nubox-cartola-extraction.js');
    console.log('✅ [Test] Module loaded');
    
    // Test 2: Check if PDF exists
    const pdfPath = '/Users/alec/salfagpt/upload-queue/cartolas/Banco de Chile.pdf';
    console.log(`📄 [Test] Checking PDF: ${pdfPath}`);
    
    if (!fs.existsSync(pdfPath)) {
      throw new Error('PDF not found');
    }
    
    const buffer = fs.readFileSync(pdfPath);
    console.log(`✅ [Test] PDF loaded: ${(buffer.length / 1024).toFixed(2)} KB`);
    
    // Test 3: Try extraction
    console.log('🚀 [Test] Starting extraction...');
    const result = await extractNuboxCartola(buffer, {
      fileName: 'Banco de Chile.pdf',
      model: 'gemini-2.5-flash',
      currency: 'CLP',
    });
    
    console.log('✅ [Test] Extraction complete!');
    console.log(`   Bank: ${result.bank_name}`);
    console.log(`   Movements: ${result.movements.length}`);
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Test passed!',
      summary: {
        bank: result.bank_name,
        movements: result.movements.length,
        confidence: result.metadata.confidence,
        cost: result.metadata.cost,
      },
      firstMovement: result.movements[0],
    }, null, 2), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('❌ [Test] Error:', error);
    console.error('Error details:', error instanceof Error ? error.message : String(error));
    console.error('Stack:', error instanceof Error ? error.stack : 'No stack');
    
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    }, null, 2), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

