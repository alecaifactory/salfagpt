/**
 * Document Extraction using Gemini AI
 * Extracts text, tables, and image descriptions from documents
 */

import { GoogleGenAI } from '@google/genai';
import { readFile } from 'fs/promises';
import { config } from 'dotenv';

// Load environment variables from .env
config();

const API_KEY = process.env.GOOGLE_AI_API_KEY;

if (!API_KEY) {
  console.error('❌ Error: GOOGLE_AI_API_KEY no encontrada');
  console.error('💡 Verifica que .env contenga:');
  console.error('   GOOGLE_AI_API_KEY=tu-api-key-aqui');
  throw new Error('GOOGLE_AI_API_KEY no configurada en .env');
}

const genAI = new GoogleGenAI({ apiKey: API_KEY });

export interface ExtractionResult {
  success: boolean;
  extractedText: string;
  charactersExtracted: number;
  tokensEstimate: number;
  model: string;
  inputTokens: number;
  outputTokens: number;
  duration: number;
  estimatedCost: number;
  pageCount?: number;
  error?: string;
}

/**
 * Sleep utility for retry delays
 */
async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Extract text from document using Gemini AI with retry logic
 */
export async function extractDocument(
  filePath: string,
  model: 'gemini-2.5-flash' | 'gemini-2.5-pro' = 'gemini-2.5-flash',
  maxRetries: number = 3
): Promise<ExtractionResult> {
  const startTime = Date.now();
  
  console.log(`   🤖 Extrayendo con ${model}...`);
  console.log(`   📄 Leyendo archivo: ${filePath}`);
  
  try {
    // Read file as base64
    const fileBuffer = await readFile(filePath);
    const base64Data = fileBuffer.toString('base64');
    const mimeType = getMimeType(filePath);
    
    console.log(`   📊 Tamaño: ${(fileBuffer.length / 1024).toFixed(2)} KB`);
    console.log(`   🔄 Enviando a Gemini AI...`);
    
    // Build prompt for extraction
    const prompt = `Extrae todo el texto de este documento, incluyendo:
- Todo el contenido textual
- Tablas (conviértelas a formato markdown)
- Descripciones de imágenes (si las hay)
- Estructura del documento (títulos, secciones)

Por favor extrae el contenido de manera fiel y completa.`;
    
    // Retry logic for API calls
    let lastError: any;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
    // Call Gemini AI
    const result = await genAI.models.generateContent({
      model: model,
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: mimeType,
                data: base64Data,
              },
            },
          ],
        },
      ],
      config: {
        temperature: 0.1, // Low temperature for factual extraction
        maxOutputTokens: 20000,
      },
    });
    
        // Success! Process the result
    const extractedText = result.text || '';
    const duration = Date.now() - startTime;
    
    // Estimate tokens (rough: 1 token ≈ 4 characters)
    const tokensEstimate = Math.ceil(extractedText.length / 4);
    
    // Estimate input tokens (prompt + image tokens)
    const inputTokens = Math.ceil(
      (prompt.length / 4) + (fileBuffer.length / 1000) // Rough estimate
    );
    
    // Output tokens
    const outputTokens = tokensEstimate;
    
    // Calculate cost
    const estimatedCost = calculateCost(model, inputTokens, outputTokens);
    
    console.log(`   ✅ Extracción completa en ${(duration / 1000).toFixed(1)}s`);
    console.log(`   📝 ${extractedText.length.toLocaleString()} caracteres extraídos`);
    console.log(`   🎯 ~${tokensEstimate.toLocaleString()} tokens estimados`);
    console.log(`   💰 Costo estimado: $${estimatedCost.toFixed(6)}`);
    
    // Display first 200 characters as preview
    console.log(`   👁️  Preview: ${extractedText.substring(0, 200)}...`);
    
    return {
      success: true,
      extractedText,
      charactersExtracted: extractedText.length,
      tokensEstimate,
      model,
      inputTokens,
      outputTokens,
      duration,
      estimatedCost,
    };
        
      } catch (apiError: any) {
        lastError = apiError;
        const errorMessage = apiError.message || JSON.stringify(apiError);
        
        // Check if it's a retryable error (503, 429, or network errors)
        const isRetryable = errorMessage.includes('503') || 
                          errorMessage.includes('UNAVAILABLE') ||
                          errorMessage.includes('429') ||
                          errorMessage.includes('RESOURCE_EXHAUSTED') ||
                          errorMessage.includes('network') ||
                          errorMessage.includes('timeout');
        
        if (isRetryable && attempt < maxRetries) {
          const delayMs = Math.min(1000 * Math.pow(2, attempt - 1), 10000); // Exponential backoff, max 10s
          console.log(`   ⚠️  Intento ${attempt}/${maxRetries} falló (${errorMessage.substring(0, 50)}...)`);
          console.log(`   ⏳ Reintentando en ${(delayMs / 1000).toFixed(1)}s...`);
          await sleep(delayMs);
          continue;
        }
        
        // Non-retryable error or max retries reached
        throw apiError;
      }
    }
    
    // If we get here, all retries failed
    throw lastError;
    
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    console.log(`   ❌ Error en extracción: ${errorMessage}`);
    
    return {
      success: false,
      extractedText: '',
      charactersExtracted: 0,
      tokensEstimate: 0,
      model,
      inputTokens: 0,
      outputTokens: 0,
      duration,
      estimatedCost: 0,
      error: errorMessage,
    };
  }
}

/**
 * Calculate cost based on model and tokens
 */
function calculateCost(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  // Pricing per million tokens
  const pricing: Record<string, { input: number; output: number }> = {
    'gemini-2.5-flash': { input: 0.075, output: 0.30 },
    'gemini-2.5-pro': { input: 1.25, output: 5.00 },
  };
  
  const modelPricing = pricing[model] || pricing['gemini-2.5-flash'];
  
  return (
    (inputTokens / 1_000_000) * modelPricing.input +
    (outputTokens / 1_000_000) * modelPricing.output
  );
}

/**
 * Get MIME type from file path
 */
function getMimeType(filePath: string): string {
  const ext = filePath.toLowerCase().split('.').pop();
  
  const mimeTypes: Record<string, string> = {
    pdf: 'application/pdf',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    doc: 'application/msword',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    xls: 'application/vnd.ms-excel',
    csv: 'text/csv',
    txt: 'text/plain',
  };
  
  return mimeTypes[ext || ''] || 'application/octet-stream';
}

