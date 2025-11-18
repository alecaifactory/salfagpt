/**
 * Full Test Endpoint - Returns complete extraction result
 */

import type { APIRoute } from 'astro';
import fs from 'fs';

export const GET: APIRoute = async () => {
  try {
    const { extractNuboxCartola } = await import('../../lib/nubox-cartola-extraction.js');
    
    const pdfPath = '/Users/alec/salfagpt/upload-queue/cartolas/Banco de Chile.pdf';
    const buffer = fs.readFileSync(pdfPath);
    
    const result = await extractNuboxCartola(buffer, {
      fileName: 'Banco de Chile.pdf',
      model: 'gemini-2.5-flash',
      currency: 'CLP',
    });
    
    return new Response(JSON.stringify(result, null, 2), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
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

