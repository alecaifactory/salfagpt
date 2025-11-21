/**
 * Gemini File API - REST Implementation
 * 
 * Purpose: Direct REST API calls for file upload/extraction (bypasses SDK limitations)
 * Use Case: Large PDFs (10-500MB) that fail with inline data or SDK
 * 
 * Created: 2025-11-21
 * Status: Production Ready
 */

import fetch from 'node-fetch';
import { readFile } from 'fs/promises';
import { basename } from 'path';
import { config } from 'dotenv';

// Load .env file
config();

const API_KEY = process.env.GOOGLE_AI_API_KEY;

if (!API_KEY) {
  console.error('❌ GOOGLE_AI_API_KEY not found in environment');
  console.error('💡 Make sure .env file exists in project root');
  console.error('💡 Current working directory:', process.cwd());
  throw new Error('GOOGLE_AI_API_KEY not configured');
}

const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

export interface FileUploadResult {
  fileUri: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  state: 'PROCESSING' | 'ACTIVE' | 'FAILED';
}

export interface ExtractionResult {
  text: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cost: number;
  duration: number;
}

/**
 * Upload file to Gemini File API using multipart/form-data
 */
export async function uploadFileToGemini(
  filePath: string
): Promise<FileUploadResult> {
  console.log('📤 [REST] Uploading file to Gemini...');
  
  const fileBuffer = await readFile(filePath);
  const fileName = basename(filePath);
  const mimeType = 'application/pdf';
  const fileSizeMB = fileBuffer.length / (1024 * 1024);
  
  console.log(`   File: ${fileName}`);
  console.log(`   Size: ${fileSizeMB.toFixed(2)}MB`);
  
  // Use resumable upload for large files
  // Reference: https://ai.google.dev/api/files#method:-media.upload
  const uploadUrl = `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${API_KEY}`;
  
  // Create multipart form data boundary
  const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
  
  // Build metadata
  const metadata = {
    file: {
      displayName: fileName
    }
  };
  
  // Build multipart body
  const parts: Buffer[] = [];
  
  // Part 1: Metadata (JSON)
  parts.push(Buffer.from(
    `--${boundary}\r\n` +
    `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
    `${JSON.stringify(metadata)}\r\n`
  ));
  
  // Part 2: File data
  parts.push(Buffer.from(
    `--${boundary}\r\n` +
    `Content-Type: ${mimeType}\r\n\r\n`
  ));
  parts.push(fileBuffer);
  parts.push(Buffer.from(`\r\n--${boundary}--\r\n`));
  
  const body = Buffer.concat(parts);
  
  console.log(`📤 [REST] Uploading ${fileSizeMB.toFixed(2)}MB to Gemini...`);
  
  const uploadResponse = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      'Content-Type': `multipart/related; boundary=${boundary}`,
      'X-Goog-Upload-Protocol': 'multipart',
    },
    body: body
  });

  if (!uploadResponse.ok) {
    const error = await uploadResponse.text();
    console.error('❌ Upload failed:', uploadResponse.status);
    console.error('   Response:', error);
    throw new Error(`File upload failed: ${uploadResponse.status} - ${error}`);
  }

  const uploadResult = await uploadResponse.json() as any;
  
  console.log('✅ [REST] File uploaded successfully');
  console.log(`   File URI: ${uploadResult.file?.uri}`);
  console.log(`   File Name: ${uploadResult.file?.name}`);
  
  return {
    fileUri: uploadResult.file.uri,
    fileName: uploadResult.file.name,
    mimeType: uploadResult.file.mimeType || mimeType,
    sizeBytes: parseInt(uploadResult.file.sizeBytes || '0'),
    state: uploadResult.file.state || 'PROCESSING',
  };
}

/**
 * Wait for file to be in ACTIVE state
 */
export async function waitForFileActive(
  fileName: string,
  maxWaitSeconds: number = 60
): Promise<void> {
  console.log('⏳ [REST] Waiting for file to be ACTIVE...');
  
  const startTime = Date.now();
  let attempts = 0;
  
  while (true) {
    const fileInfoUrl = `${BASE_URL}/${fileName}?key=${API_KEY}`;
    const response = await fetch(fileInfoUrl);
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Check file status failed: ${response.status} - ${error}`);
    }
    
    const result = await response.json() as any;
    
    // File info can be at root or in 'file' property
    const fileInfo = result.file || result;
    const state = fileInfo.state;
    
    if (!state) {
      console.error('❌ No state in response:', JSON.stringify(result, null, 2));
      throw new Error('Invalid file info response - no state field');
    }
    
    if (state === 'ACTIVE') {
      console.log(`✅ [REST] File is ACTIVE (${attempts}s)`);
      return;
    }
    
    if (state === 'FAILED') {
      throw new Error('File processing FAILED on Gemini side');
    }
    
    const elapsed = (Date.now() - startTime) / 1000;
    if (elapsed > maxWaitSeconds) {
      throw new Error(`File processing timeout after ${elapsed.toFixed(0)}s. State: ${state}`);
    }
    
    if (attempts % 5 === 0 && attempts > 0) {
      console.log(`   Still ${state}... (${attempts}s)`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    attempts++;
  }
}

/**
 * Extract text from uploaded file using REST API
 */
export async function extractTextFromFile(
  fileUri: string,
  options: {
    model?: 'gemini-2.5-pro' | 'gemini-2.5-flash';
    maxOutputTokens?: number;
  } = {}
): Promise<ExtractionResult> {
  const startTime = Date.now();
  const { model = 'gemini-2.5-flash', maxOutputTokens = 65000 } = options;
  
  console.log('📖 [REST] Extracting text from file...');
  console.log(`   Model: ${model}`);
  console.log(`   Max tokens: ${maxOutputTokens.toLocaleString()}`);
  
  const prompt = `Extract the COMPLETE text from this PDF document, processing EVERY PAGE from beginning to end.

CRITICAL REQUIREMENTS:
1. Process ALL pages sequentially (page 1, page 2, page 3... to the end)
2. Extract ALL content from each page:
   - Headers and titles
   - Body text and paragraphs
   - Tables (convert to Markdown format)
   - Technical specifications
   - Procedures and instructions
   - Safety warnings and notices
   - Diagrams and images (describe briefly)
3. DO NOT stop at table of contents
4. DO NOT summarize - extract verbatim
5. DO NOT skip pages or sections

For scanned PDFs:
- Perform complete OCR on every page
- Extract all visible text accurately
- Preserve table structure

For complex layouts:
- Process column by column
- Preserve reading order
- Include all footnotes and annotations

OUTPUT FORMAT:
- Clean, structured text
- Use markdown headings (##) for sections
- Preserve all technical terminology
- Include ALL numerical data and specifications

START from page 1 and continue to the last page.`;

  const url = `${BASE_URL}/models/${model}:generateContent?key=${API_KEY}`;
  
  const requestBody = {
    contents: [
      {
        role: 'user',
        parts: [
          {
            fileData: {
              fileUri: fileUri,
              mimeType: 'application/pdf'
            }
          },
          {
            text: prompt
          }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: maxOutputTokens,
    },
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
    ]
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Extraction request failed: ${response.status} - ${error}`);
  }

  const result = await response.json() as any;
  
  // Extract text from response
  const text = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
  
  // Extract token usage
  const usageMetadata = result.usageMetadata || {};
  const inputTokens = usageMetadata.promptTokenCount || 0;
  const outputTokens = usageMetadata.candidatesTokenCount || 0;
  const totalTokens = usageMetadata.totalTokenCount || (inputTokens + outputTokens);
  
  // Calculate cost
  const pricing = model === 'gemini-2.5-pro' 
    ? { input: 1.25, output: 5.00 } 
    : { input: 0.075, output: 0.30 };
  
  const cost = (inputTokens / 1_000_000) * pricing.input + 
               (outputTokens / 1_000_000) * pricing.output;
  
  const duration = Date.now() - startTime;
  
  console.log('✅ [REST] Extraction complete!');
  console.log(`   Characters: ${text.length.toLocaleString()}`);
  console.log(`   Tokens: ${totalTokens.toLocaleString()}`);
  console.log(`   Cost: $${cost.toFixed(4)}`);
  console.log(`   Duration: ${(duration / 1000).toFixed(1)}s`);
  
  return {
    text,
    inputTokens,
    outputTokens,
    totalTokens,
    cost,
    duration
  };
}

/**
 * Delete file from Gemini
 */
export async function deleteGeminiFile(fileName: string): Promise<void> {
  const url = `${BASE_URL}/${fileName}?key=${API_KEY}`;
  
  const response = await fetch(url, {
    method: 'DELETE'
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Delete file failed: ${response.status} - ${error}`);
  }
  
  console.log('🗑️ [REST] File deleted from Gemini');
}

