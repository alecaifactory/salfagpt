import type { APIRoute } from 'astro';
import { GoogleGenAI } from '@google/genai';
import { estimateTokens, calculateGeminiCost, formatCost } from '../../lib/pricing';
import { uploadFile } from '../../lib/storage';
import { extractTextChunked, shouldUseChunkedExtraction } from '../../lib/chunked-extraction';

// Prioritize process.env for Cloud Run (follows deployment.mdc rule)
const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT || 
  (typeof import.meta !== 'undefined' && import.meta.env 
    ? import.meta.env.GOOGLE_CLOUD_PROJECT 
    : 'salfagpt'); // Fallback to salfagpt

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
    
    // ✅ NEW: Extract organization and domain context for multi-org support
    const organizationId = formData.get('organizationId') as string || undefined;
    const domainId = formData.get('domainId') as string || undefined;
    const userId = formData.get('userId') as string || 'unknown';

    if (!file) {
      return new Response(
        JSON.stringify({ error: 'No file provided' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`📍 Upload context:`, {
      organizationId: organizationId || 'none',
      domainId: domainId || 'none',
      userId,
    });

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

    // ✅ UPDATED: Centralized validation with upload-limits (2025-11-18)
    // Import from centralized limits configuration
    const { validateFile, FILE_SIZE_LIMITS } = await import('../../../lib/upload-limits');
    
    // Validate file
    const validation = validateFile(file);
    
    if (!validation.valid) {
      console.error('❌ File validation failed:', validation.error);
      
      return new Response(
        JSON.stringify({ 
          error: validation.error,
          errorCode: validation.errorCode,
          suggestions: validation.warnings || [],
          fileSize: file.size,
          fileName: file.name,
        }),
        { 
          status: 400, 
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
    
    // Log warnings if any
    if (validation.warnings && validation.warnings.length > 0) {
      console.warn(`⚠️ File validation warnings for ${file.name}:`);
      validation.warnings.forEach(w => console.warn(`   - ${w}`));
    }
    
    // Log processing estimate
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
    console.log(`📊 File validation passed:`, {
      name: file.name,
      size: `${fileSizeMB} MB`,
      estimatedTime: validation.estimatedProcessingTime 
        ? `${validation.estimatedProcessingTime}s` 
        : 'unknown',
      recommendedMethod: validation.recommendedMethod,
    });
    
    // ✅ Auto-route based on recommendation
    if (validation.recommendedMethod && extractionMethod === 'vision-api') {
      if (validation.recommendedMethod !== 'vision-api') {
        console.warn(`⚠️ Auto-switching to ${validation.recommendedMethod} for better handling`);
        extractionMethod = validation.recommendedMethod;
      }
    }

    console.log(`📄 Extracting text from: ${file.name} (${file.type}, ${file.size} bytes) using ${model}`);

    // Initialize pipeline logs
    const pipelineLogs: any[] = [];
    const overallStartTime = Date.now();

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // ✅ Helper function to add detailed logs
    const addLog = (step: string, status: string, message: string, details?: any) => {
      const log = {
        step,
        status,
        timestamp: new Date(),
        message,
        details,
      };
      pipelineLogs.push(log);
      return log;
    };
    
    // STEP 1: Save to Cloud Storage FIRST (before processing)
    console.log('💾 Step 1/3: Saving original file to Cloud Storage...');
    addLog('upload', 'in_progress', 'Iniciando subida a Cloud Storage...');
    
    const uploadStepStart = Date.now();
    
    // Add detailed upload info
    addLog('upload', 'info', `Archivo: ${file.name}`, {
      size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
      type: file.type,
    });
    
    const storageResult = await uploadFile(
      buffer,
      file.name,
      file.type,
      {
        model,
        fileSize: file.size,
        uploadedBy: userId,
        organizationId, // ✅ Pass organization context
        domainId, // ✅ Pass domain context
      }
    );
    
    const uploadStepEnd = Date.now();
    const uploadDuration = uploadStepEnd - uploadStepStart;
    
    addLog('upload', 'success', `Archivo guardado en Cloud Storage (${(uploadDuration / 1000).toFixed(1)}s)`, {
      storagePath: storageResult.storagePath,
      url: storageResult.fileUrl,
    });
    
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
      addLog('extract', 'in_progress', 'Iniciando extracción con Vision API...');
      addLog('vision-api', 'info', `PDF size: ${fileSizeMB} MB`, {
        method: 'vision-api',
        project: PROJECT_ID,
      });
      
      try {
        addLog('vision-api', 'info', 'Codificando PDF a base64...');
        const { extractTextWithVisionAPI } = await import('../../lib/vision-extraction.js');
        
        addLog('vision-api', 'info', 'Llamando Vision API...');
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
        
        // ✅ Add success log with details
        addLog('vision-api', 'success', `Texto extraído: ${extractedText.length.toLocaleString()} caracteres en ${(extractionTime / 1000).toFixed(1)}s`, {
          confidence: `${(visionResult.confidence * 100).toFixed(1)}%`,
          pages: visionResult.pages,
          language: visionResult.language,
          method: visionResult.method,
        });
        
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
      // ✅ OPTION B: Try Gemini File API for large/corrupt PDFs (with feature flag)
      const { shouldUseFileAPI, extractWithFileAPI } = await import('../../lib/gemini-file-upload.js');
      
      if (shouldUseFileAPI(fileSizeMB)) {
        console.log('📤 [File API] Enabled for large/corrupt PDF (>10MB)');
        console.log('   Using Gemini File Upload API instead of Vision/Chunked');
        
        pipelineLogs.push({
          step: 'extract',
          status: 'in_progress',
          startTime: new Date(extractStepStart),
          message: `Extrayendo con Gemini File API (${fileSizeMB.toFixed(1)} MB)...`,
        });
        
        addLog('file-api', 'info', `Subiendo archivo (${fileSizeMB.toFixed(1)} MB) a Gemini...`);
        
        try {
          const fileApiResult = await extractWithFileAPI(buffer, {
            fileName: file.name,
            model: model,
            maxOutputTokens: 50000,
          });
          
          extractedText = fileApiResult.text;
          extractionTime = fileApiResult.extractionTime;
          extractStepEnd = Date.now();
          
          inputTokens = fileApiResult.metadata.inputTokens;
          outputTokens = fileApiResult.metadata.outputTokens;
          totalTokens = fileApiResult.metadata.totalTokens;
          
          costBreakdown = {
            inputCost: fileApiResult.metadata.cost * (inputTokens / totalTokens),
            outputCost: fileApiResult.metadata.cost * (outputTokens / totalTokens),
            totalCost: fileApiResult.metadata.cost,
          };
          
          extractionMetadata = {
            method: 'file-api',
            fileUri: fileApiResult.metadata.fileUri,
            model: model,
            inputTokens,
            outputTokens,
            totalTokens,
            cost: fileApiResult.metadata.cost,
          };
          
          addLog('file-api', 'success', `Texto extraído: ${extractedText.length.toLocaleString()} caracteres`, {
            time: `${(extractionTime / 1000).toFixed(1)}s`,
            tokens: totalTokens.toLocaleString(),
            cost: `$${fileApiResult.metadata.cost.toFixed(4)}`,
          });
          
          console.log(`✅ [File API] Extraction complete!`);
          console.log(`   Characters: ${extractedText.length.toLocaleString()}`);
          console.log(`   Time: ${(extractionTime / 1000).toFixed(1)}s`);
          console.log(`   Tokens: ${totalTokens.toLocaleString()}`);
          console.log(`   Cost: $${fileApiResult.metadata.cost.toFixed(4)}`);
          
        } catch (fileApiError) {
          // File API failed - fallback to chunked extraction
          const errorMsg = fileApiError instanceof Error ? fileApiError.message : 'Unknown error';
          console.warn('⚠️ [File API] Failed:', errorMsg);
          console.warn('   ✅ Auto-falling back to chunked extraction...\n');
          
          addLog('file-api', 'warning', 'File API falló, usando chunked extraction', {
            error: errorMsg,
          });
          
          // Fall through to chunked extraction below
          // extractionMethod stays as 'gemini'
        }
      }
      
      // ✅ NEW: Check if file needs PDF section extraction (>20MB)
      // ⚠️ DISABLED for now - many PDFs have corrupt structure that pdf-lib can't parse
      // These PDFs work fine with Gemini's direct multimodal API
      const usePdfSectionExtraction = false; // TODO: Re-enable when we have better PDF repair
      
      if (usePdfSectionExtraction && shouldUseChunkedExtraction(buffer.length)) {
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
          // ✅ Add initial chunking log
          addLog('extract', 'info', 'Analizando estructura del PDF...');
          
          const chunkedResult = await extractTextChunked(buffer, {
            model: model,
            sectionSizeMB: 12, // ✅ OPTIMIZED: 12MB PDF sections (faster processing)
            userId: userId, // ✅ For checkpointing
            fileName: file.name, // ✅ For checkpointing
            organizationId, // ✅ NEW: Pass organization context
            domainId, // ✅ NEW: Pass domain context
            resumeFromCheckpoint: true, // ✅ Auto-resume if checkpoint exists
            onProgress: (progress) => {
              // Log to terminal
              console.log(`  📄 PDF Section ${progress.section}/${progress.total}: ${progress.message} (${progress.percentage}%)`);
              
              // ✅ Add detailed progress log for each section
              addLog('extract', 'in_progress', `Sección ${progress.section}/${progress.total}: ${progress.message}`, {
                section: progress.section,
                total: progress.total,
                percentage: `${progress.percentage.toFixed(1)}%`,
                status: progress.status || 'processing',
              });
            }
          });
          
          extractedText = chunkedResult.text;
          
          console.log(`✅ PDF section extraction complete!`);
          console.log(`   Total PDF sections: ${chunkedResult.totalPdfSections}`);
          console.log(`   Total pages: ${chunkedResult.totalPages}`);
          console.log(`   Extracted text: ${extractedText.length} characters\n`);
          
          // ✅ Add completion summary log
          addLog('extract', 'success', `Extracción de secciones PDF completada!`, {
            sections: chunkedResult.totalPdfSections,
            pages: chunkedResult.totalPages,
            caracteres: extractedText.length.toLocaleString(),
          });
          
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

    // ✅ CRITICAL FIX: For files >10MB, reject Flash and require Pro
    // Gemini Flash inline API has ~10MB practical limit for PDFs
    const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);
    const fileSizeNum = parseFloat(fileSizeMB);
    
    if (fileSizeNum > 10 && model === 'gemini-2.5-flash') {
      console.warn(`🚫 File too large for Flash: ${fileSizeMB} MB (limit: 10MB)`);
      console.warn(`   Gemini Flash inline API struggles with files >10MB`);
      
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Archivo demasiado grande para modelo Flash',
          details: `Este archivo de ${fileSizeMB} MB excede el límite de 10MB para gemini-2.5-flash`,
          suggestions: [
            '✅ Re-extrae con modelo Pro (recomendado para archivos >10MB)',
            'Pro tiene 2M context window vs 1M de Flash',
            'Pro maneja mejor PDFs grandes y complejos',
          ],
          metadata: {
            fileName: file.name,
            fileSize: file.size,
            fileSizeMB: fileSizeMB,
            attemptedModel: model,
            requiredModel: 'gemini-2.5-pro',
            flashLimit: '10MB',
            proLimit: '50MB',
          },
          pipelineLogs,
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // ✅ UPDATED: Calculate dynamic maxOutputTokens for very large files
    const calculateMaxOutputTokens = (fileSizeBytes: number, modelName: string): number => {
      const fileSizeMB = fileSizeBytes / (1024 * 1024);
      
      if (modelName === 'gemini-2.5-pro') {
        // Pro has 2M context, can handle larger outputs
        if (fileSizeMB > 100) return 65536; // Huge files
        if (fileSizeMB > 50) return 65536; // Very large files  
        if (fileSizeMB > 20) return 65536; // Large files
        if (fileSizeMB > 10) return 65536; // Medium-large files
        if (fileSizeMB > 5) return 32768;
        if (fileSizeMB > 2) return 16384;
        return 8192;
      } else {
        // Flash has 1M context - limited to 10MB files now
        if (fileSizeMB > 5) return 32768;
        if (fileSizeMB > 2) return 16384;
        if (fileSizeMB > 1) return 12288;
        return 8192;
      }
    };

    maxOutputTokens = calculateMaxOutputTokens(file.size, model);

    console.log(`🎯 File: ${file.name} (${fileSizeMB} MB)`);
    console.log(`🎯 Model: ${model}`);
    console.log(`🎯 Using maxOutputTokens: ${maxOutputTokens.toLocaleString()}`);

    // Use Gemini's native PDF/image processing
    try {
      console.log(`🚀 Calling Gemini ${model} for extraction...`);
      console.log(`   Base64 data size: ${base64Data.length} bytes`);
      console.log(`   Mime type: ${mimeType}`);
      console.log(`   Max output tokens: ${maxOutputTokens}`);
      
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
      
      console.log(`✅ Gemini API call successful`);
      console.log(`   Response received: ${extractedText ? extractedText.length : 0} characters`);
      console.log(`   Extraction time: ${extractionTime}ms`);
      
      // Calculate token usage (only after successful extraction)
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
      
    } catch (geminiError) {
      extractStepEnd = Date.now();
      extractionTime = extractStepEnd - extractStepStart;
      
      console.error('❌ Gemini API call failed:', geminiError);
      console.error('   Error type:', geminiError instanceof Error ? geminiError.constructor.name : typeof geminiError);
      console.error('   Error message:', geminiError instanceof Error ? geminiError.message : String(geminiError));
      console.error('   File info:', { name: file.name, size: file.size, type: file.type });
      console.error('   Model:', model);
      console.error('   Max output tokens:', maxOutputTokens);
      
      // Add error to pipeline logs
      addLog('gemini', 'error', `Error en llamada a Gemini: ${geminiError instanceof Error ? geminiError.message : 'Unknown'}`, {
        model,
        fileSize: `${fileSizeMB} MB`,
        error: geminiError instanceof Error ? geminiError.message : String(geminiError),
      });
      
      // Update extract step log with error
      pipelineLogs[pipelineLogs.length - 1] = {
        ...pipelineLogs[pipelineLogs.length - 1],
        status: 'error',
        endTime: new Date(extractStepEnd),
        duration: extractionTime,
        message: 'Error llamando a Gemini API',
        details: {
          error: geminiError instanceof Error ? geminiError.message : String(geminiError),
          model,
          fileSize: `${fileSizeMB} MB`,
        }
      };
      
      // Return error response with detailed diagnostics
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Error al llamar a Gemini API',
          details: geminiError instanceof Error ? geminiError.message : 'Error desconocido al extraer documento',
          suggestions: [
            'Verifica que el archivo no esté corrupto',
            'Intenta con un PDF más pequeño primero para validar la configuración',
            'Revisa los logs del servidor para más detalles',
            'Verifica que GOOGLE_AI_API_KEY esté configurada correctamente',
          ],
          metadata: {
            fileName: file.name,
            fileSize: file.size,
            fileSizeMB: (file.size / 1024 / 1024).toFixed(2),
            attemptedModel: model,
            extractionTime,
          },
          pipelineLogs,
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
      
        // ✅ Add detailed success logs
        addLog('gemini', 'success', `Extracción Gemini completada en ${(extractionTime / 1000).toFixed(1)}s`, {
          caracteres: extractedText.length.toLocaleString(),
          tokens: `${inputTokens.toLocaleString()} input + ${outputTokens.toLocaleString()} output`,
          total: totalTokens.toLocaleString(),
        });
        
        addLog('gemini', 'info', `💰 Costo de extracción: $${costBreakdown.totalCost.toFixed(3)}`, {
          inputCost: `$${costBreakdown.inputCost.toFixed(3)}`,
          outputCost: `$${costBreakdown.outputCost.toFixed(3)}`,
        });
        
        addLog('extract', 'success', `Texto extraído exitosamente con ${model}`);
        
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

