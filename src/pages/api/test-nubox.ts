/**
 * Simple test endpoint for Nubox extraction
 * Tests with a dummy buffer to see if the basic flow works
 */

import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  try {
    console.log('🧪 Testing Nubox extraction setup...');
    
    // Test 1: Can we import?
    console.log('Test 1: Importing nubox-cartola-extraction...');
    const { extractNuboxCartola } = await import('../../lib/nubox-cartola-extraction.js');
    console.log('✅ Import successful');
    
    // Test 2: Can we import Google Gen AI?
    console.log('Test 2: Checking @google/genai...');
    const { GoogleGenAI } = await import('@google/genai');
    console.log('✅ GoogleGenAI available');
    
    // Test 3: Is API key set?
    console.log('Test 3: Checking API key...');
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (apiKey) {
      console.log('✅ API key configured:', apiKey.substring(0, 20) + '...');
    } else {
      console.log('❌ API key NOT configured');
    }
    
    return new Response(JSON.stringify({
      success: true,
      tests: {
        import: 'passed',
        googleGenAI: 'passed',
        apiKey: apiKey ? 'configured' : 'missing',
      },
      message: 'All imports working. Ready to test with real PDF.',
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

