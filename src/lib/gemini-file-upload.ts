/**
 * Gemini File API Integration for Large/Corrupted PDFs
 * 
 * Purpose: Handle PDFs that fail with pdf-lib (corrupt structure)
 * Method: Upload file to Gemini, get URI, process with multimodal API
 * 
 * Created: 2025-11-17
 * Feature Flag: ENABLE_GEMINI_FILE_API
 */

import { GoogleGenAI } from '@google/genai';

// Get API key - load from .env if needed
import { config } from 'dotenv';
config(); // Load .env file

const API_KEY = process.env.GOOGLE_AI_API_KEY || 
  (typeof import.meta !== 'undefined' && import.meta.env 
    ? (import.meta.env.GOOGLE_AI_API_KEY || import.meta.env.GEMINI_API_KEY)
    : undefined);

if (!API_KEY) {
  console.error('❌ GOOGLE_AI_API_KEY not found in environment');
  console.error('💡 Make sure .env contains: GOOGLE_AI_API_KEY=your-key');
  throw new Error('GOOGLE_AI_API_KEY not configured for File API');
}

console.log('🔑 [File API] API key loaded successfully');

const genAI = new GoogleGenAI({ apiKey: API_KEY });

export interface FileAPIExtractionResult {
  text: string;
  extractionTime: number;
  metadata: {
    method: 'file-api';
    fileUri?: string;
    fileSizeMB: number;
    model: string;
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    cost: number;
  };
}

/**
 * Upload file to Gemini File API and extract text
 * 
 * This method works for PDFs that pdf-lib cannot parse (corrupt structure)
 * 
 * @param buffer - PDF file buffer
 * @param options - Extraction options
 * @returns Extracted text and metadata
 */
export async function extractWithFileAPI(
  buffer: Buffer,
  options: {
    fileName: string;
    model?: 'gemini-2.5-pro' | 'gemini-2.5-flash';
    maxOutputTokens?: number;
  }
): Promise<FileAPIExtractionResult> {
  const startTime = Date.now();
  const { fileName, model = 'gemini-2.5-flash', maxOutputTokens = 50000 } = options;
  
  const fileSizeMB = buffer.length / (1024 * 1024);
  
  console.log('📤 [File API] Starting upload and extraction...');
  console.log(`   File: ${fileName}`);
  console.log(`   Size: ${fileSizeMB.toFixed(2)} MB`);
  console.log(`   Model: ${model}`);

  try {
    // Step 1: Upload file to Gemini
    console.log('📤 [File API] Step 1/2: Uploading file to Gemini...');
    
    // Convert buffer to Blob for File API
    const blob = new Blob([buffer], { type: 'application/pdf' });
    
    // Upload using uploadFile method
    const uploadedFile = await genAI.files.uploadFile(blob, {
      mimeType: 'application/pdf',
      displayName: fileName,
    });
    
    const fileUri = uploadedFile.uri || '';
    const fileName_uploaded = uploadedFile.name || '';
    console.log(`✅ [File API] File uploaded: ${fileName_uploaded}`);
    console.log(`   URI: ${fileUri}`);
    
    // Step 2: Wait for file to be ACTIVE state
    console.log('⏳ [File API] Waiting for file processing...');
    let fileStatus = await genAI.files.get({ name: fileName_uploaded });
    let attempts = 0;
    const maxAttempts = 30; // 30 seconds max
    
    while (fileStatus.state !== 'ACTIVE' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      fileStatus = await genAI.files.get({ name: fileName_uploaded });
      attempts++;
      
      if (attempts % 5 === 0) {
        console.log(`   Still processing... (${attempts}s)`);
      }
    }
    
    if (fileStatus.state !== 'ACTIVE') {
      throw new Error(`File processing timeout after ${attempts}s. State: ${fileStatus.state}`);
    }
    
    console.log(`✅ [File API] File ready for extraction (${attempts}s)`);
    
    // Step 3: Extract text using the file
    console.log('📖 [File API] Step 2/2: Extracting text with Gemini...');
    
    const result = await genAI.models.generateContent({
      model: model,
      contents: [{
        role: 'user',
        parts: [
          {
            fileData: {
              fileUri: fileUri,
              mimeType: 'application/pdf',
            }
          },
          {
            text: `Extrae TODO el texto de este documento PDF de manera completa y precisa.

INSTRUCCIONES CRÍTICAS:
1. ✅ Extrae TODO el contenido textual sin omitir nada
2. ✅ Preserva el orden original de las secciones
3. ✅ Mantén la estructura de tablas si las hay
4. ✅ Incluye encabezados, títulos y subtítulos
5. ✅ Preserva numeración de listas y secciones
6. ❌ NO resumas ni omitas partes
7. ❌ NO agregues comentarios o análisis

FORMATO DE SALIDA:
- Texto plano y limpio
- Usa saltos de línea para separar secciones
- Si hay tablas, usa formato de texto simple
- Preserva toda información relevante

Comienza la extracción ahora:`
          }
        ]
      }],
      config: {
        temperature: 0.1, // Low temperature for factual extraction
        maxOutputTokens: maxOutputTokens,
      }
    });

    const extractedText = result.text || '';
    const extractionTime = Date.now() - startTime;
    
    // Get token usage from API
    const usageMetadata = (result as any).usageMetadata;
    const inputTokens = usageMetadata?.promptTokenCount || 0;
    const outputTokens = usageMetadata?.candidatesTokenCount || Math.ceil(extractedText.length / 4);
    const totalTokens = inputTokens + outputTokens;
    
    // Calculate cost (Gemini pricing)
    // Flash: $0.075 per 1M input, $0.30 per 1M output
    // Pro: $1.25 per 1M input, $5.00 per 1M output
    const inputCost = model === 'gemini-2.5-pro' 
      ? (inputTokens / 1_000_000) * 1.25
      : (inputTokens / 1_000_000) * 0.075;
    
    const outputCost = model === 'gemini-2.5-pro'
      ? (outputTokens / 1_000_000) * 5.00
      : (outputTokens / 1_000_000) * 0.30;
    
    const totalCost = inputCost + outputCost;
    
    console.log(`✅ [File API] Extraction complete!`);
    console.log(`   Characters: ${extractedText.length.toLocaleString()}`);
    console.log(`   Time: ${(extractionTime / 1000).toFixed(1)}s`);
    console.log(`   Tokens: ${totalTokens.toLocaleString()} (in: ${inputTokens.toLocaleString()}, out: ${outputTokens.toLocaleString()})`);
    console.log(`   Cost: $${totalCost.toFixed(4)}`);
    
    // Clean up: Delete the file from Gemini (optional, files auto-expire after 48h)
    try {
      await genAI.files.delete({ name: fileName_uploaded });
      console.log('🗑️ [File API] Uploaded file deleted from Gemini');
    } catch (deleteError) {
      console.warn('⚠️ [File API] Could not delete file:', deleteError);
      // Non-critical, file will expire anyway
    }
    
    return {
      text: extractedText,
      extractionTime,
      metadata: {
        method: 'file-api',
        fileUri,
        fileSizeMB,
        model,
        inputTokens,
        outputTokens,
        totalTokens,
        cost: totalCost,
      },
    };
    
  } catch (error) {
    const extractionTime = Date.now() - startTime;
    console.error('❌ [File API] Extraction failed:', error);
    
    throw new Error(
      `File API extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Check if File API is enabled via feature flag
 */
export function isFileAPIEnabled(): boolean {
  const enabled = process.env.ENABLE_GEMINI_FILE_API === 'true' ||
    (typeof import.meta !== 'undefined' && import.meta.env?.ENABLE_GEMINI_FILE_API === 'true');
  
  return enabled;
}

/**
 * Determine if file should use File API based on size and flag
 */
export function shouldUseFileAPI(fileSizeMB: number): boolean {
  const flagEnabled = isFileAPIEnabled();
  const fileIsLarge = fileSizeMB > 10; // Use File API for files >10MB
  
  return flagEnabled && fileIsLarge;
}

