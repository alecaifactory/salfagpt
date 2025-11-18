/**
 * API Playground - Document Extraction Endpoint
 * 
 * Purpose: Developer-friendly extraction endpoint with real-time progress
 * Features: Streaming logs, detailed metrics, better error messages
 * 
 * Created: 2025-11-17
 */

import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const model = (formData.get('model') as string) || 'gemini-2.5-flash';
    const method = (formData.get('extractionMethod') as string) || 'auto';
    const structured = formData.get('structured') === 'true'; // NEW: Structured extraction mode
    const outputFormat = (formData.get('outputFormat') as string) || 'nubox'; // NEW: Output format (nubox or generic)
    const documentType = (formData.get('documentType') as string) || 'auto';
    const bank = (formData.get('bank') as string) || 'auto';
    
    if (!file) {
      return new Response(JSON.stringify({
        error: 'No file provided',
        suggestion: 'Please upload a PDF file',
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log('🎮 [Playground] Starting extraction...');
    console.log(`   File: ${file.name}`);
    console.log(`   Size: ${(file.size / (1024 * 1024)).toFixed(2)} MB`);
    console.log(`   Method: ${method}`);
    console.log(`   Model: ${model}`);
    console.log(`   Structured: ${structured}`);

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileSizeMB = buffer.length / (1024 * 1024);

    const startTime = Date.now();
    let extractedText = '';
    let extractionMethod = method;
    let extractionMetadata: any = {};
    let structuredResult: any = null;
    
    // NEW: If structured extraction requested, use appropriate format
    if (structured) {
      if (outputFormat === 'nubox') {
        console.log('🏦 [Playground] Using Nubox format extraction...');
        
        const { extractNuboxCartola } = await import('../../../lib/nubox-cartola-extraction.js');
        
        const result = await extractNuboxCartola(buffer, {
          fileName: file.name,
          bank: bank === 'auto' ? undefined : bank,
          model: model as any,
          currency: 'CLP',
        });
        
        structuredResult = result;
        extractedText = `Nubox cartola: ${result.movements.length} movements extracted`;
        extractionMethod = 'nubox-format';
        extractionMetadata = {
          method: 'nubox-format',
          model: result.metadata.model,
          extractionTime: result.metadata.extraction_time,
          totalMovements: result.movements.length,
          avgConfidence: result.metadata.confidence,
          bank: result.bank_name,
          inputTokens: 0,
          outputTokens: 0,
          totalTokens: 0,
          cost: result.metadata.cost,
        };
        
        console.log(`✅ [Playground] Nubox extraction complete!`);
        console.log(`   Bank: ${result.bank_name}`);
        console.log(`   Movements: ${result.movements.length}`);
        console.log(`   Quality: ${result.quality.recommendation}`);
        
      } else {
        // Generic structured format
        console.log('🧠 [Playground] Using generic structured extraction...');
        
        const { extractStructuredDocument } = await import('../../../lib/document-intelligence.js');
        
        const result = await extractStructuredDocument(buffer, {
          fileName: file.name,
          documentType: documentType as any,
          bank: bank as any,
          model: model as any,
        });
      
      structuredResult = result;
      extractedText = result.fullText;
      extractionMethod = 'document-intelligence';
      extractionMetadata = {
        method: 'document-intelligence',
        model: result.metadata.model,
        extractionTime: result.metadata.extractionTime,
        totalFields: result.metadata.totalFields,
        avgConfidence: result.metadata.avgConfidence,
        category: result.category.type,
        bank: result.category.bank,
        inputTokens: result.metadata.tokens.input,
        outputTokens: result.metadata.tokens.output,
        totalTokens: result.metadata.tokens.total,
        cost: result.metadata.cost,
      };
      
      console.log(`✅ [Playground] Structured extraction complete!`);
      console.log(`   Category: ${result.category.type} (${result.category.subtype || 'generic'})`);
      console.log(`   Fields: ${result.fields.length}`);
      console.log(`   Quality: ${result.quality.recommendation}`);
      }
      
      // Skip text extraction methods when structured mode is used
      // Jump directly to response building
    } else {
      // Text extraction mode - try different methods
      
      // Step 1: Try Vision API (if method is auto or vision-api)
      if (method === 'auto' || method === 'vision-api') {
        console.log('👁️ [Playground] Trying Vision API...');
        
        try {
          const { extractTextWithVisionAPI } = await import('../../../lib/vision-extraction.js');
          const visionResult = await extractTextWithVisionAPI(buffer);
          
          extractedText = visionResult.text;
          extractionMethod = 'vision-api';
          extractionMetadata = {
            method: 'vision-api',
            model: 'vision-api',
            extractionTime: visionResult.extractionTime,
            confidence: visionResult.confidence,
            pages: visionResult.pages,
            language: visionResult.language,
            cost: 0.024, // Vision API cost
          };
          
          console.log(`✅ [Playground] Vision API success: ${extractedText.length} chars`);
          
        } catch (visionError) {
          console.warn('⚠️ [Playground] Vision API failed, trying next method...');
          extractionMethod = 'file-api'; // Try File API next
        }
      }

      // Step 2: Try File API (if Vision failed or method is file-api)
      if (!extractedText && (method === 'auto' || method === 'file-api')) {
        const { shouldUseFileAPI, extractWithFileAPI, isFileAPIEnabled } = await import('../../../lib/gemini-file-upload.js');
        
        if (isFileAPIEnabled() || method === 'file-api') {
          console.log('📤 [Playground] Trying File API...');
          
          try {
            const fileApiResult = await extractWithFileAPI(buffer, {
              fileName: file.name,
              model: model as 'gemini-2.5-flash' | 'gemini-2.5-pro',
              maxOutputTokens: 50000,
            });
            
            extractedText = fileApiResult.text;
            extractionMethod = 'file-api';
            extractionMetadata = {
              method: 'file-api',
              model: fileApiResult.metadata.model,
              extractionTime: fileApiResult.extractionTime,
              inputTokens: fileApiResult.metadata.inputTokens,
              outputTokens: fileApiResult.metadata.outputTokens,
              totalTokens: fileApiResult.metadata.totalTokens,
              cost: fileApiResult.metadata.cost,
            };
            
            console.log(`✅ [Playground] File API success: ${extractedText.length} chars`);
            
          } catch (fileApiError) {
            console.warn('⚠️ [Playground] File API failed, trying chunked...');
            extractionMethod = 'chunked';
          }
        }
      }

      // Step 3: Fallback to Chunked (if all else failed or method is chunked)
      if (!extractedText) {
        console.log('📄 [Playground] Using chunked extraction...');
        
        const { extractTextChunked } = await import('../../../lib/chunked-extraction.js');
        
        const chunkedResult = await extractTextChunked(buffer, {
          model: model as 'gemini-2.5-flash' | 'gemini-2.5-pro',
          maxChunkSizeMB: 15,
          concurrency: 5,
        });
        
        extractedText = chunkedResult.text;
        extractionMethod = 'chunked';
        extractionMetadata = {
          method: 'chunked',
          model: chunkedResult.metadata.model,
          extractionTime: chunkedResult.extractionTime,
          chunks: chunkedResult.metadata.totalChunks,
          inputTokens: chunkedResult.metadata.inputTokens,
          outputTokens: chunkedResult.metadata.outputTokens,
          totalTokens: chunkedResult.metadata.totalTokens,
          cost: chunkedResult.metadata.cost,
        };
        
        console.log(`✅ [Playground] Chunked success: ${extractedText.length} chars`);
      }
    } // End of text extraction mode (else block from line 124)

    const totalTime = Date.now() - startTime;

    // Build response (different for structured vs text)
    const responseData: any = {
      success: true,
      logs: [
        { level: 'info', message: `File uploaded: ${file.name} (${fileSizeMB.toFixed(2)} MB)` },
        { level: 'info', message: `Method: ${structured ? 'Structured (Document Intelligence)' : extractionMethod}` },
        { level: 'success', message: `Extraction complete in ${(totalTime / 1000).toFixed(1)}s` },
      ],
      apiCallExample: {
        curl: generateCurlExample(file.name, model, method, structured),
        typescript: generateTypeScriptExample(file.name, model, method, structured),
        python: generatePythonExample(file.name, model, method, structured),
      },
    };
    
    if (structured && structuredResult) {
      // Check if it's Nubox format or generic structured
      if (outputFormat === 'nubox' && structuredResult.movements) {
        // Nubox format response
        responseData.result = {
          ...structuredResult,  // Include all Nubox fields directly
          mode: 'nubox',
        };
        
        responseData.logs.push({
          level: 'success',
          message: `Extracted ${structuredResult.movements.length} movements (Nubox format)`,
          details: {
            bank: structuredResult.bank_name,
            confidence: `${(structuredResult.metadata.confidence * 100).toFixed(1)}%`,
          },
        });
      } else {
        // Generic structured format response
        responseData.result = {
          mode: 'structured',
          category: structuredResult.category,
          fields: structuredResult.fields,
          fullText: structuredResult.fullText,
          metadata: {
            fileName: file.name,
            fileSizeMB,
            method: 'document-intelligence',
            model: structuredResult.metadata.model,
            extractionTime: totalTime,
            totalPages: structuredResult.metadata.totalPages,
            totalFields: structuredResult.metadata.totalFields,
            avgConfidence: structuredResult.metadata.avgConfidence,
            tokens: structuredResult.metadata.tokens,
            cost: {
              total: structuredResult.metadata.cost,
              currency: 'USD',
            },
          },
          quality: structuredResult.quality,
        };
        
        responseData.logs.push({
          level: 'success',
          message: `Extracted ${structuredResult.fields.length} structured fields`,
          details: {
            category: structuredResult.category.type,
            confidence: `${(structuredResult.metadata.avgConfidence * 100).toFixed(1)}%`,
          },
        });
      }
      
    } else {
      // Text-only extraction response
      responseData.result = {
        mode: 'text',
        text: extractedText,
        preview: extractedText.substring(0, 500) + '...',
        metadata: {
          fileName: file.name,
          fileSizeMB,
          method: extractionMethod,
          model: extractionMetadata.model || model,
          extractionTime: totalTime,
          characters: extractedText.length,
          tokens: {
            input: extractionMetadata.inputTokens || 0,
            output: extractionMetadata.outputTokens || 0,
            total: extractionMetadata.totalTokens || 0,
          },
          cost: {
            total: extractionMetadata.cost || 0,
            currency: 'USD',
          },
          quality: {
            confidence: extractionMetadata.confidence || 0.95,
            completeness: extractedText.length > 1000 ? 0.99 : 0.8,
          },
        },
      };
      
      responseData.logs.push({
        level: 'success',
        message: `Extracted ${extractedText.length.toLocaleString()} characters`,
      });
    }

    // Return developer-friendly response
    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ [Playground] Error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    
    return new Response(JSON.stringify({
      success: false,
      result: null, // CRITICAL: Always include result field (even if null)
      error: error instanceof Error ? error.message : 'Unknown error',
      suggestion: 'Try a different method or smaller file',
      logs: [
        { level: 'error', message: error instanceof Error ? error.message : 'Unknown error' },
        { level: 'info', message: 'Check server logs for details' },
      ],
      apiCallExample: {
        curl: '# Error occurred - no example available',
        typescript: '// Error occurred',
        python: '# Error occurred',
      },
    }), {
      status: 200, // Return 200 even on error so client can parse JSON
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

/**
 * Generate curl example for developers
 */
function generateCurlExample(fileName: string, model: string, method: string, structured: boolean = false): string {
  const structuredFlag = structured ? ' \\\n  -F "structured=true" \\\n  -F "documentType=auto" \\\n  -F "bank=auto"' : '';
  return `curl -X POST https://flow.getaifactory.com/api/v1/extract \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -F "file=@${fileName}" \\
  -F "model=${model}" \\
  -F "method=${method}"${structuredFlag}`;
}

/**
 * Generate TypeScript example
 */
function generateTypeScriptExample(fileName: string, model: string, method: string, structured: boolean = false): string {
  const structuredParams = structured ? `  formData.append('structured', 'true');
  formData.append('documentType', 'auto');
  formData.append('bank', 'auto');\n` : '';
  
  const resultLog = structured 
    ? `  console.log('Fields extracted:', result.fields.length);
  console.log('Category:', result.category.type);
  console.log('Fields:', result.fields);`
    : `  console.log('Extracted:', result.text.length, 'characters');`;

  return `// TypeScript/Node.js Example - ${structured ? 'Structured Extraction' : 'Text Extraction'}
import fetch from 'node-fetch';
import fs from 'fs';

async function extractDocument() {
  const formData = new FormData();
  formData.append('file', fs.createReadStream('${fileName}'));
  formData.append('model', '${model}');
  formData.append('method', '${method}');
${structuredParams}  
  const response = await fetch('https://flow.getaifactory.com/api/v1/extract', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_API_KEY',
    },
    body: formData,
  });
  
  const result = await response.json();
${resultLog}
  console.log('Cost: $' + result.metadata.cost.total);
  
  return result;
}

extractDocument();`;
}

/**
 * Generate Python example
 */
function generatePythonExample(fileName: string, model: string, method: string, structured: boolean = false): string {
  const structuredParams = structured ? `,
            'structured': 'true',
            'documentType': 'auto',
            'bank': 'auto'` : '';
  
  const resultLog = structured
    ? `print(f"Fields extracted: {len(result['fields'])}")
        print(f"Category: {result['category']['type']}")
        print(f"Fields: {result['fields']}")`
    : `print(f"Extracted: {len(result['text'])} characters")`;

  return `# Python Example - ${structured ? 'Structured Extraction' : 'Text Extraction'}
import requests

def extract_document():
    with open('${fileName}', 'rb') as f:
        files = {'file': f}
        data = {
            'model': '${model}',
            'method': '${method}'${structuredParams}
        }
        headers = {
            'Authorization': 'Bearer YOUR_API_KEY'
        }
        
        response = requests.post(
            'https://flow.getaifactory.com/api/v1/extract',
            files=files,
            data=data,
            headers=headers
        )
        
        result = response.json()
        ${resultLog}
        print(f"Cost: ${result['metadata']['cost']['total']}")
        
        return result

extract_document()`;
}

