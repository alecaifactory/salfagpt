import type { APIRoute } from 'astro';
import { GoogleGenAI } from '@google/genai';
import { estimateTokens, calculateGeminiCost, formatCost } from '../../lib/pricing';
import { uploadFile } from '../../lib/storage';
import { extractTextChunked, shouldUseChunkedExtraction } from '../../lib/chunked-extraction';

// Initialize Gemini AI client
const IS_DEVELOPMENT = import.meta.env.DEV;

let geminiClient: GoogleGenAI | null = null;

function getGeminiClient() {
  if (!geminiClient) {
    try {
      const apiKey = process.env.GOOGLE_AI_API_KEY || import.meta.env.GOOGLE_AI_API_KEY;
      
      if (!apiKey) {
        throw new Error('GOOGLE_AI_API_KEY not configured');
      }
      
      geminiClient = new GoogleGenAI({ apiKey });
      console.log('✅ Gemini AI client initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Gemini AI client:', error);
      throw error;
    }
  }
  return geminiClient;
}

// POST /api/extract-document - Extract text from PDF/image using Gemini AI
export const POST: APIRoute = async ({ request }) => {
  try {
    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const model = formData.get('model') as string || 'gemini-2.5-flash';
    let extractionMethod = formData.get('extractionMethod') as string || 'vision-api'; // ✅ DEFAULT TO VISION API (using let to allow fallback)

    if (!file) {
      return new Response(
        JSON.stringify({ error: 'No file provided' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate file type
    const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid file type. Supported: PDF, PNG, JPEG',
          receivedType: file.type
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // ✅ UPDATED: Smart file size limits with >100MB exception (2025-11-02)
    // Vision API: Best for <50MB
    // Gemini API: Better for 50-500MB (with user approval for >100MB)
    const maxVisionSize = 50 * 1024 * 1024; // 50MB
    const recommendedMaxSize = 100 * 1024 * 1024; // 100MB recommended limit
    const absoluteMaxSize = 500 * 1024 * 1024; // 500MB absolute limit (prevent crashes)
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
    
    // ✅ Absolute limit: Reject files >500MB (prevent system crashes)
    if (file.size > absoluteMaxSize) {
      return new Response(
        JSON.stringify({ 
          error: `File too large: ${fileSizeMB} MB. Absolute maximum: 500MB`,
          suggestion: 'File is too large to process. Please compress or split the PDF.',
          fileSize: file.size,
          maxSize: absoluteMaxSize
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // ✅ Warn about files >100MB (user must approve in frontend)
    if (file.size > recommendedMaxSize) {
      console.warn(`🚨 EXCESSIVE FILE SIZE: ${fileSizeMB} MB (>100MB)`);
      console.warn(`   User must have approved this in frontend`);
      console.warn(`   Processing time: 5-15 minutes estimated`);
      console.warn(`   Using Gemini extraction with maximum output tokens`);
    }
    
    // ✅ Auto-route based on file size
    if (file.size > maxVisionSize && extractionMethod === 'vision-api') {
      console.warn(`⚠️ File size ${fileSizeMB} MB exceeds Vision API limit (50MB)`);
      console.warn(`   Auto-switching to Gemini extraction for better large file handling`);
      extractionMethod = 'gemini'; // Override to Gemini for large files
    }

    console.log(`📄 Extracting text from: ${file.name} (${file.type}, ${file.size} bytes) using ${model}`);

    // Initialize pipeline logs
    const pipelineLogs: any[] = [];
    const overallStartTime = Date.now();

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // STEP 1: Save to Cloud Storage FIRST (before processing)
    console.log('💾 Step 1/3: Saving original file to Cloud Storage...');
    const uploadStepStart = Date.now();
    pipelineLogs.push({
      step: 'upload',
      status: 'in_progress',
      startTime: new Date(uploadStepStart),
      message: 'Guardando archivo original en Cloud Storage...',
    });
    
    const storageResult = await uploadFile(
      buffer,
      file.name,
      file.type,
      {
        model,
        fileSize: file.size,
        uploadedBy: formData.get('userId') || 'unknown',
      }
    );
    
    const uploadStepEnd = Date.now();
    pipelineLogs[pipelineLogs.length - 1] = {
      ...pipelineLogs[pipelineLogs.length - 1],
      status: 'success',
      endTime: new Date(uploadStepEnd),
      duration: uploadStepEnd - uploadStepStart,
      message: 'Archivo guardado exitosamente en Cloud Storage',
      details: {
        fileSize: file.size,
        storagePath: storageResult.storagePath,
      }
    };
    
    console.log(`✅ File saved to storage: ${storageResult.storagePath}`);
    
    // STEP 2: Extract text (Gemini or Vision API)
    const extractStepStart = Date.now();
    let extractStepEnd = extractStepStart; // ✅ Initialize
    let extractedText = '';
    let extractionTime = 0;
    let extractionMetadata: any = {};
    
    // Initialize token tracking variables (used by both paths)
    let inputTokens = 0;
    let outputTokens = 0;
    let totalTokens = 0;
    let costBreakdown = { inputCost: 0, outputCost: 0, totalCost: 0 };
    let maxOutputTokens = 8192; // Default
    
    if (extractionMethod === 'vision-api' && file.type === 'application/pdf') {
      // Use Google Cloud Vision API for PDFs (with fallback)
      console.log('👁️ Step 2/3: Extracting text with Google Cloud Vision API...');
      pipelineLogs.push({
        step: 'extract',
        status: 'in_progress',
        startTime: new Date(extractStepStart),
        message: 'Extrayendo texto con Vision API...',
      });
      
      try {
        const { extractTextWithVisionAPI } = await import('../../lib/vision-extraction.js');
        const visionResult = await extractTextWithVisionAPI(buffer);
        
        extractedText = visionResult.text;
        extractionTime = visionResult.extractionTime;
        extractStepEnd = Date.now(); // ✅ Track end time
        
        // Calculate token estimates for Vision API path
        outputTokens = estimateTokens(extractedText);
        inputTokens = 0; // Vision API doesn't use token-based input
        totalTokens = outputTokens;
        
        // Vision API cost (different pricing)
        const visionCost = 0.024; // ~$0.024 per document (estimated)
        costBreakdown = {
          inputCost: 0,
          outputCost: visionCost,
          totalCost: visionCost,
        };
        
        extractionMetadata = {
          method: 'vision-api',
          confidence: visionResult.confidence,
          pages: visionResult.pages,
          language: visionResult.language,
          inputTokens,
          outputTokens,
          totalTokens,
          cost: visionCost,
        };
        
        console.log(`✅ Vision API extraction: ${extractedText.length} chars in ${extractionTime}ms`);
        console.log(`  Confidence: ${(visionResult.confidence * 100).toFixed(1)}%`);
        
        // If Vision API returned no text, fallback to Gemini
        if (!extractedText || extractedText.trim().length < 100) {
          console.warn('⚠️ Vision API returned insufficient text, falling back to Gemini...');
          console.warn('   This PDF may be scanned images requiring Gemini\'s multimodal capabilities');
          extractionMethod = 'gemini'; // Fall through to Gemini extraction
        }
      } catch (visionError) {
        // ✅ CRITICAL FIX: Auto-fallback to Gemini when Vision API fails
        const errorMsg = visionError instanceof Error ? visionError.message : 'Unknown error';
        console.warn('⚠️ Vision API failed:', errorMsg);
        
        // Check if error is due to file size
        if (errorMsg.includes('too large') || errorMsg.includes('RESOURCE_EXHAUSTED')) {
          console.warn('   Reason: File exceeds Vision API bandwidth/memory limits');
          console.warn('   ✅ Auto-falling back to Gemini extraction (better for large files)...\n');
        } else {
          console.warn('   ✅ Auto-falling back to Gemini extraction...\n');
        }
        
        // Fall through to Gemini extraction
        extractionMethod = 'gemini';
        
        // Update pipeline log to show fallback
        pipelineLogs[pipelineLogs.length - 1] = {
          ...pipelineLogs[pipelineLogs.length - 1],
          status: 'warning',
          message: `Vision API no disponible, usando Gemini ${model}`,
          details: {
            visionError: errorMsg,
            fallbackMethod: 'gemini',
          }
        };
      }
    }
    
    if (extractionMethod === 'gemini' || extractedText.trim().length < 100) {
      // ✅ NEW: Check if file needs PDF section extraction (>20MB)
      if (shouldUseChunkedExtraction(buffer.length)) {
        console.log('📄 File >20MB - Using PDF SECTION extraction...');
        console.log(`   PDF will be split into ~15MB sections (by page ranges)`);
        console.log(`   Each section processed separately with ${model}`);
        console.log(`   Sections processed in parallel (5 at a time)`);
        console.log(`   Results will be combined automatically\n`);
        
        pipelineLogs.push({
          step: 'extract',
          status: 'in_progress',
          startTime: new Date(extractStepStart),
          message: `Extrayendo documento en secciones PDF (parallel section extraction)...`,
        });
        
        try {
          const chunkedResult = await extractTextChunked(buffer, {
            model: model,
            sectionSizeMB: 12, // ✅ OPTIMIZED: 12MB PDF sections (faster processing)
            onProgress: (progress) => {
              console.log(`  📄 PDF Section ${progress.section}/${progress.total}: ${progress.message} (${progress.percentage}%)`);
            }
          });
          
          extractedText = chunkedResult.text;
          
          console.log(`✅ PDF section extraction complete!`);
          console.log(`   Total PDF sections: ${chunkedResult.totalPdfSections}`);
          console.log(`   Total pages: ${chunkedResult.totalPages}`);
          console.log(`   Extracted text: ${extractedText.length} characters\n`);
          
          pipelineLogs[pipelineLogs.length - 1] = {
            ...pipelineLogs[pipelineLogs.length - 1],
            status: 'success',
            endTime: new Date(),
            duration: Date.now() - extractStepStart,
            message: `Texto extraído exitosamente (${chunkedResult.totalPdfSections} secciones PDF, ${chunkedResult.totalPages} páginas)`,
            details: {
              method: 'pdf-section-extraction',
              pdfSections: chunkedResult.totalPdfSections,
              pages: chunkedResult.totalPages,
              charactersExtracted: extractedText.length,
            }
          };
          
        } catch (error) {
          console.error('❌ Chunked extraction failed:', error);
          pipelineLogs[pipelineLogs.length - 1] = {
            ...pipelineLogs[pipelineLogs.length - 1],
            status: 'error',
            endTime: new Date(),
            message: `Error en extracción por bloques: ${error instanceof Error ? error.message : 'Unknown'}`,
          };
          
          throw error;
        }
        
      } else {
        // Regular Gemini extraction for files <20MB
        console.log('🤖 Step 2/3: Extracting text with Gemini AI...');
        pipelineLogs.push({
          step: 'extract',
          status: 'in_progress',
          startTime: new Date(extractStepStart),
          message: `Extrayendo texto con ${model}...`,
        });
      
      const base64Data = buffer.toString('base64');

    // Determine mime type
    const mimeType = file.type;

    // Call Gemini AI
    const client = getGeminiClient();
    const startTime = Date.now();

    // ✅ UPDATED: Calculate dynamic maxOutputTokens for very large files (2025-11-02)
    const calculateMaxOutputTokens = (fileSizeBytes: number, modelName: string): number => {
      const fileSizeMB = fileSizeBytes / (1024 * 1024);
      
      if (modelName === 'gemini-2.5-pro') {
        // Pro has 2M context, can handle larger outputs
        if (fileSizeMB > 100) return 65536; // ✅ NEW: Huge files (100-500MB) - max tokens
        if (fileSizeMB > 50) return 65536; // Very large files (50-100MB)
        if (fileSizeMB > 20) return 65536; // Large files (20-50MB)
        if (fileSizeMB > 10) return 65536; // Medium-large files (10-20MB)
        if (fileSizeMB > 5) return 32768;
        if (fileSizeMB > 2) return 16384;
        return 8192;
      } else {
        // Flash has 1M context
        if (fileSizeMB > 100) return 65536; // ✅ NEW: Huge files need max tokens
        if (fileSizeMB > 50) return 65536; // Very large files
        if (fileSizeMB > 20) return 65536; // Large files
        if (fileSizeMB > 10) return 32768; // Medium-large files
        if (fileSizeMB > 5) return 32768;
        if (fileSizeMB > 2) return 16384;
        if (fileSizeMB > 1) return 12288;
        return 8192;
      }
    };

    maxOutputTokens = calculateMaxOutputTokens(file.size, model);
    const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);

    console.log(`🎯 File: ${file.name} (${fileSizeMB} MB)`);
    console.log(`🎯 Using maxOutputTokens: ${maxOutputTokens.toLocaleString()}`);

    // ✅ UPDATED: Recommend or enforce Pro for large files (2025-11-02)
    if (file.size > 20 * 1024 * 1024 && model === 'gemini-2.5-flash') {
      console.warn(`⚠️ Very large file (${fileSizeMB} MB) - Pro model STRONGLY recommended`);
      console.warn(`   Flash may struggle with files >20MB`);
      console.warn(`   Consider re-uploading with Pro model for better extraction quality`);
    } else if (file.size > 5 * 1024 * 1024 && model === 'gemini-2.5-flash') {
      console.warn(`💡 Large file (${fileSizeMB} MB) - Pro model recommended for better results`);
    }

    // Use Gemini's native PDF/image processing
    const result = await client.models.generateContent({
      model: model,
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType: mimeType,
                data: base64Data,
              },
            },
            {
              text: `Extrae TODO el contenido de este documento con MÁXIMA FIDELIDAD usando formato markdown:

# REQUISITOS DE EXTRACCIÓN:

## 1. TEXTO:
- Extrae todo el texto exactamente como está escrito
- Usa markdown para estructura:
  - # para títulos principales
  - ## para subtítulos
  - ### para sub-secciones
  - **negrita** para énfasis
  - *cursiva* para términos técnicos
- Preserva párrafos, listas, numeración

## 2. TABLAS (CRÍTICO):
- Convierte TODAS las tablas a formato markdown
- Preserva estructura, alineación y TODOS los datos
- Ejemplo:

| Columna 1 | Columna 2 | Columna 3 |
|-----------|-----------|-----------|
| Dato A    | Dato B    | Dato C    |
| **Total** | **100**   | **200**   |

## 3. IMÁGENES, GRÁFICOS Y DIAGRAMAS (CRÍTICO):
Para CADA imagen/gráfico/diagrama proporciona:

a) **Descripción Detallada:** Qué muestra, elementos clave, propósito

b) **Representación Visual ASCII:** Recrea visualmente usando caracteres

Ejemplo para gráfico de barras:
**Descripción:** Ventas trimestrales Q1-Q4 mostrando crecimiento
**Visual ASCII:**
\`\`\`
  $200K ┤                               ╭──╮
  $150K ┤                       ╭──╮    │Q4│
  $100K ┤           ╭──╮        │Q3│    │██│
   $50K ┤   ╭──╮    │Q2│        │██│    │██│
     $0 └───┴Q1┴────┴──┴────────┴──┴────┴──┴───
\`\`\`

Ejemplo para diagrama de flujo:
\`\`\`
  ┌─────────┐     ┌─────────┐     ┌─────────┐
  │ Inicio  │ ──→ │ Proceso │ ──→ │  Fin    │
  └─────────┘     └─────────┘     └─────────┘
       │               │               │
       ▼               ▼               ▼
   Decisión        Validar         Guardar
\`\`\`

## 4. ESTRUCTURA:
- Usa "---" para separar secciones/páginas
- Mantén flujo lógico del documento
- Indica números de página cuando sea relevante

## 5. FORMATO FINAL:
- Markdown bien estructurado
- Fácil de leer y verificar
- Completo (NO resumas)
- Preserva TODA la información

OBJETIVO: Crear representación de texto que capture el 100% de la información del documento original, incluyendo visual ASCII de todos los gráficos y diagramas.`,
            },
          ],
        },
      ],
      config: {
        temperature: 0.1, // Low temperature for accurate extraction
        maxOutputTokens: maxOutputTokens, // ✅ Dynamic based on file size
      },
    });

      extractStepEnd = Date.now(); // ✅ Track end time
      extractionTime = extractStepEnd - extractStepStart;
      extractedText = result.text || '';
      
      // Calculate token usage
      outputTokens = estimateTokens(extractedText);
      inputTokens = estimateTokens(base64Data); // Approximate
      totalTokens = inputTokens + outputTokens;
      
      // Calculate costs
      costBreakdown = calculateGeminiCost(
        inputTokens, 
        outputTokens, 
        model as 'gemini-2.5-pro' | 'gemini-2.5-flash'
      );
      
      extractionMetadata = {
        method: 'gemini',
        model,
        inputTokens,
        outputTokens,
        totalTokens,
        cost: costBreakdown.totalCost,
      };
      
        console.log(`✅ Gemini extraction: ${extractedText.length} chars in ${extractionTime}ms`);
        console.log(`📊 Tokens: ${inputTokens.toLocaleString()} input + ${outputTokens.toLocaleString()} output`);
        console.log(`💰 Cost: $${costBreakdown.totalCost.toFixed(3)}`);
      } // ✅ Close else block for regular extraction
    }

    // ✅ CRITICAL: Validate extraction success - don't mark empty as successful
    if (!extractedText || extractedText.trim().length === 0) {
      // Update extract step log with error
      pipelineLogs[pipelineLogs.length - 1] = {
        ...pipelineLogs[pipelineLogs.length - 1],
        status: 'error',
        endTime: new Date(extractStepEnd),
        duration: extractionTime,
        message: 'No se pudo extraer texto del documento',
        details: {
          error: 'El documento puede estar vacío o ser una imagen escaneada sin OCR',
          suggestions: [
            'Intenta re-extraer con modelo Pro',
            'Verifica que el PDF contenga texto seleccionable',
          ],
          model,
        }
      };
      console.warn(`⚠️ No text extracted from ${file.name} using ${model}`);
      
      return new Response(
        JSON.stringify({ 
          success: false, // ← Mark as failed
          error: 'No se pudo extraer texto del documento',
          details: 'El documento puede estar vacío, ser una imagen escaneada sin OCR, o exceder el límite de tokens',
          suggestions: [
            'Intenta re-extraer con modelo Pro (mejor manejo de documentos complejos)',
            'Verifica que el PDF contenga texto seleccionable (no solo imágenes)',
            'Si el documento es muy largo, aumenta el límite de tokens en configuración'
          ],
          metadata: {
            fileSize: file.size,
            fileSizeMB: (file.size / 1024 / 1024).toFixed(2),
            fileName: file.name,
            attemptedModel: model,
            extractionTime
          }
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } } // ✅ Return error status
      );
    }

    // Update extract step log with success
    pipelineLogs[pipelineLogs.length - 1] = {
      ...pipelineLogs[pipelineLogs.length - 1],
      status: 'success',
      endTime: new Date(extractStepEnd),
      duration: extractionTime,
      message: `Texto extraído exitosamente: ${extractedText.length.toLocaleString()} caracteres`,
      details: {
        model,
        inputTokens,
        outputTokens,
        charactersExtracted: extractedText.length,
        cost: costBreakdown.totalCost,
      }
    };
    
    // ✅ Warn if extraction is suspiciously short
    if (extractedText.length < 100) {
      console.warn(`⚠️ Very short extraction (${extractedText.length} chars) for ${file.name} (${file.size} bytes)`);
    }

    // Build metadata object
    const documentMetadata = {
      fileName: file.name,
      fileSize: file.size,
      fileSizeMB: (file.size / 1024 / 1024).toFixed(2),
      fileType: file.type,
      characters: extractedText.length,
      extractionTime,
      model,
      maxOutputTokens, // ✅ Track what limit was used
      service: 'Gemini AI',
      extractedAt: new Date().toISOString(),
      
      // Token usage
      inputTokens,
      outputTokens,
      totalTokens,
      
      // Cost breakdown
      inputCost: costBreakdown.inputCost,
      outputCost: costBreakdown.outputCost,
      totalCost: costBreakdown.totalCost,
      costFormatted: formatCost(costBreakdown.totalCost),
      
      // Cloud Storage information (NEW)
      storagePath: storageResult.storagePath,
      bucketName: storageResult.bucketName,
      originalFileUrl: storageResult.publicUrl,
    };

    // ✅ Add model recommendation for large files
    let modelWarning = undefined;
    if (file.size > 1 * 1024 * 1024 && model === 'gemini-2.5-flash') {
      modelWarning = {
        message: 'Archivo grande detectado - Pro recomendado para mejor precisión',
        currentModel: 'gemini-2.5-flash',
        recommendedModel: 'gemini-2.5-pro',
        reason: `Archivo de ${documentMetadata.fileSizeMB} MB puede beneficiarse de Pro`,
      };
    }

    console.log(`✅ Text extracted: ${extractedText.length} characters in ${extractionTime}ms using ${model}`);
    console.log(`📊 Token usage: ${inputTokens.toLocaleString()} input + ${outputTokens.toLocaleString()} output = ${totalTokens.toLocaleString()} total`);
    console.log(`💰 Cost: ${formatCost(costBreakdown.totalCost)} (Input: ${formatCost(costBreakdown.inputCost)}, Output: ${formatCost(costBreakdown.outputCost)})`);
    if (modelWarning) {
      console.log(`⚠️ ${modelWarning.message}`);
    }

    // STEP 3: Auto-index with RAG (optional, based on flag)
    const autoIndexRAG = formData.get('autoIndexRAG') !== 'false'; // Default: true
    let ragMetadata = null;
    
    if (autoIndexRAG) {
      try {
        console.log('🔍 Step 3/3: Auto-indexing with RAG...');
        
        // We'll get sourceId after frontend creates the context source
        // For now, just indicate RAG is ready
        ragMetadata = {
          autoIndexEnabled: true,
          textReady: true,
          charactersExtracted: extractedText.length,
        };
        
        console.log('✅ Text ready for RAG indexing (will index after source creation)');
      } catch (error) {
        console.warn('⚠️ RAG auto-index preparation failed, will be available for manual indexing:', error);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        extractedText: extractedText,
        metadata: {
          ...documentMetadata,
          modelWarning, // ✅ Include recommendation
          ragMetadata, // ✅ Include RAG readiness
        },
        pipelineLogs, // ✅ Include pipeline execution logs
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error extracting document:', error);
    
    // Provide detailed error information
    let errorMessage = 'Failed to extract document';
    let errorDetails = 'Unknown error';
    let suggestions: string[] = [];
    
    if (error instanceof Error) {
      errorDetails = error.message;
      
      // Categorize errors and provide suggestions
      if (errorDetails.includes('API key') || errorDetails.includes('GEMINI_API_KEY')) {
        errorMessage = 'Gemini API Key no configurado';
        errorDetails = 'La variable de entorno GEMINI_API_KEY no está disponible';
        suggestions = [
          'Verifica que GEMINI_API_KEY esté en el archivo .env',
          'Reinicia el servidor después de agregar la key',
          'Confirma que la key sea válida en https://aistudio.google.com/app/apikey'
        ];
      } else if (errorDetails.includes('network') || errorDetails.includes('fetch') || errorDetails.includes('ENOTFOUND')) {
        errorMessage = 'Error de conexión a Gemini AI';
        errorDetails = `No se pudo conectar al servicio: ${errorDetails}`;
        suggestions = [
          'Verifica tu conexión a internet',
          'Comprueba que no haya firewall bloqueando la conexión',
          'Intenta nuevamente en unos momentos'
        ];
      } else if (errorDetails.includes('quota') || errorDetails.includes('rate limit')) {
        errorMessage = 'Límite de uso alcanzado';
        errorDetails = 'Has excedido el límite de solicitudes de la API de Gemini';
        suggestions = [
          'Espera unos minutos antes de intentar nuevamente',
          'Verifica tu cuota en https://aistudio.google.com/',
          'Considera actualizar tu plan de Gemini AI'
        ];
      } else if (errorDetails.includes('model') || errorDetails.includes('not found')) {
        errorMessage = 'Modelo no encontrado';
        errorDetails = `El modelo especificado no está disponible: ${errorDetails}`;
        suggestions = [
          'Intenta con gemini-2.5-flash en lugar de gemini-2.5-pro',
          'Verifica que tu API key tenga acceso al modelo solicitado'
        ];
      } else if (errorDetails.includes('timeout')) {
        errorMessage = 'Timeout procesando el documento';
        errorDetails = 'El documento tardó demasiado en procesarse';
        suggestions = [
          'El archivo puede ser muy grande, intenta con uno más pequeño',
          'Intenta nuevamente, el servicio puede estar lento temporalmente'
        ];
      }
    }
    
    return new Response(
      JSON.stringify({
        error: errorMessage,
        details: errorDetails,
        suggestions: suggestions.length > 0 ? suggestions : undefined,
        timestamp: new Date().toISOString()
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

