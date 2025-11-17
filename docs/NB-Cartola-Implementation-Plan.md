# Proyecto Cartola Inteligente Nubox - Implementation Plan

**Document:** NB-Cartola Implementation Plan  
**Version:** 1.0.0  
**Date:** 2025-11-10  
**Status:** 🚧 Planning Phase  
**Backward Compatible:** ✅ Yes (separate endpoint & collection)

---

## 🎯 Overview

This document outlines the 10-step implementation plan for building the Bank Statement Extraction API (`/api/cartola/*`) that extracts structured JSON data from bank statement PDFs/images while maintaining complete backward compatibility with the existing architecture.

**Key Principles:**
- ✅ **Backward Compatible**: Separate endpoint (`/api/cartola/*`) and Firestore collection (`cartola_extractions`)
- ✅ **Secure**: OAuth 2.0 authentication, role-based access, AES-256 encryption
- ✅ **Asynchronous**: Queue-based processing with webhook notifications
- ✅ **Production Ready**: Error handling, logging, monitoring, compliance

---

## 📋 Implementation Steps

### **Step 1: Define Data Models & Types** ⏱️ 2-3 hours

**Objective:** Create TypeScript interfaces for bank statement data structures that match the PRD specification.

**Tasks:**
1. Create `src/types/cartola.ts` with interfaces:
   ```typescript
   // Bank statement extraction request
   interface CartolaExtractionRequest {
     file: File | Buffer;
     userId: string;
     organizationId?: string;
     bankName?: string; // Optional hint for better recognition
     extractionOptions?: {
       includeImages?: boolean;
       includeMetadata?: boolean;
     };
   }

   // Bank statement movement (per PRD specification)
   interface CartolaMovement {
     fecha: string; // ISO 8601 format
     descripcion: string;
     monto: number; // Positive for credits, negative for debits
     tipo: 'credito' | 'debito';
     categoria?: string; // Optional categorization
     referencia?: string; // Optional reference number
   }

   // Complete bank statement extraction result
   interface CartolaExtractionResult {
     documento: {
       banco: string;
       tipoCuenta: string;
       numeroCuenta: string;
       periodo: {
         inicio: string; // ISO 8601
         fin: string; // ISO 8601
       };
       moneda: string; // CLP, USD, EUR, etc.
       saldoInicial: number;
       saldoFinal: number;
       totalCreditos: number;
       totalDebitos: number;
     };
     movimientos: CartolaMovement[];
     metadatos: {
       fechaProcesamiento: string; // ISO 8601
       metodoExtraccion: 'vision-api' | 'gemini' | 'hybrid';
       confianza: number; // 0-100 confidence score
       versionModelo: string; // Model version used
       tiempoProcesamiento: number; // milliseconds
     };
   }

   // Firestore document structure
   interface CartolaExtraction {
     id: string;
     userId: string;
     organizationId?: string;
     status: 'pending' | 'processing' | 'completed' | 'failed';
     fileName: string;
     fileSize: number;
     fileUrl?: string; // Cloud Storage URL
     bankName?: string;
     extractionResult?: CartolaExtractionResult;
     error?: {
       code: string;
       message: string;
       details?: string;
       timestamp: Date;
     };
     webhookUrl?: string;
     createdAt: Date;
     updatedAt: Date;
     completedAt?: Date;
     processingTime?: number; // milliseconds
   }
   ```

2. Export types from `src/types/index.ts`:
   ```typescript
   export * from './cartola';
   ```

3. Create validation schemas (optional, for runtime validation):
   ```typescript
   // src/lib/validation/cartola.ts
   export function validateCartolaExtractionResult(result: CartolaExtractionResult): ValidationResult {
     // ... validation logic ...
   }
   ```

**Deliverables:**
- ✅ `src/types/cartola.ts` with all interfaces
- ✅ Types exported from `src/types/index.ts`
- ✅ Validation helper functions (optional)

**Testing:**
- ✅ TypeScript compilation: `npm run type-check`
- ✅ Verify no type errors

---

### **Step 2: Create Firestore Collection Schema** ⏱️ 1-2 hours

**Objective:** Define the `cartola_extractions` collection schema with proper indexes and security rules.

**Tasks:**
1. Add to `src/lib/firestore.ts`:
   ```typescript
   export const COLLECTIONS = {
     // ... existing collections ...
     CARTOLA_EXTRACTIONS: 'cartola_extractions', // NEW
   } as const;
   ```

2. Create Firestore helper functions:
   ```typescript
   // src/lib/firestore-cartola.ts (NEW FILE)
   import { firestore } from './firestore';
   import type { CartolaExtraction } from '../types/cartola';

   export async function createCartolaExtraction(
     extraction: Omit<CartolaExtraction, 'id' | 'createdAt' | 'updatedAt'>
   ): Promise<CartolaExtraction> {
     const ref = firestore.collection('cartola_extractions').doc();
     const now = new Date();
     const doc: CartolaExtraction = {
       ...extraction,
       id: ref.id,
       createdAt: now,
       updatedAt: now,
     };
     await ref.set(doc);
     return doc;
   }

   export async function getCartolaExtraction(id: string): Promise<CartolaExtraction | null> {
     const doc = await firestore.collection('cartola_extractions').doc(id).get();
     if (!doc.exists) return null;
     return { id: doc.id, ...doc.data() } as CartolaExtraction;
   }

   export async function updateCartolaExtraction(
     id: string,
     updates: Partial<CartolaExtraction>
   ): Promise<void> {
     await firestore.collection('cartola_extractions').doc(id).update({
       ...updates,
       updatedAt: new Date(),
     });
   }

   export async function getUserCartolaExtractions(
     userId: string,
     limit: number = 50
   ): Promise<CartolaExtraction[]> {
     const snapshot = await firestore
       .collection('cartola_extractions')
       .where('userId', '==', userId)
       .orderBy('createdAt', 'desc')
       .limit(limit)
       .get();
     return snapshot.docs.map(doc => ({
       id: doc.id,
       ...doc.data(),
       createdAt: doc.data().createdAt.toDate(),
       updatedAt: doc.data().updatedAt.toDate(),
       completedAt: doc.data().completedAt?.toDate(),
     })) as CartolaExtraction[];
   }
   ```

3. Create Firestore indexes (add to `firestore.indexes.json`):
   ```json
   {
     "indexes": [
       {
         "collectionGroup": "cartola_extractions",
         "queryScope": "COLLECTION",
         "fields": [
           { "fieldPath": "userId", "order": "ASCENDING" },
           { "fieldPath": "createdAt", "order": "DESCENDING" }
         ]
       },
       {
         "collectionGroup": "cartola_extractions",
         "queryScope": "COLLECTION",
         "fields": [
           { "fieldPath": "userId", "order": "ASCENDING" },
           { "fieldPath": "status", "order": "ASCENDING" },
           { "fieldPath": "createdAt", "order": "DESCENDING" }
         ]
       },
       {
         "collectionGroup": "cartola_extractions",
         "queryScope": "COLLECTION",
         "fields": [
           { "fieldPath": "organizationId", "order": "ASCENDING" },
           { "fieldPath": "createdAt", "order": "DESCENDING" }
         ]
       }
     ]
   }
   ```

4. Add Firestore security rules (add to `firestore.rules`):
   ```javascript
   // Bank statement extractions
   match /cartola_extractions/{extractionId} {
     allow read: if isAuthenticated() && 
                   resource.data.userId == request.auth.uid;
     allow create: if isAuthenticated() && 
                     request.resource.data.userId == request.auth.uid;
     allow update: if isAuthenticated() && 
                     resource.data.userId == request.auth.uid;
     allow delete: if isAuthenticated() && 
                     resource.data.userId == request.auth.uid;
   }
   ```

**Deliverables:**
- ✅ `src/lib/firestore-cartola.ts` with CRUD functions
- ✅ Firestore indexes defined
- ✅ Security rules updated

**Testing:**
- ✅ Deploy indexes: `firebase deploy --only firestore:indexes`
- ✅ Test CRUD operations locally
- ✅ Verify security rules work

---

### **Step 3: Implement Bank Statement Extraction Logic** ⏱️ 6-8 hours

**Objective:** Create a specialized extraction function that uses Gemini AI to extract structured bank statement data from PDFs/images.

**Tasks:**
1. Create `src/lib/cartola-extractor.ts` (NEW FILE):
   ```typescript
   import { GoogleGenAI } from '@google/genai';
   import type { CartolaExtractionResult, CartolaMovement } from '../types/cartola';

   const genAI = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY });

   /**
    * Extract bank statement data from PDF/image
    * Uses Gemini AI with specialized prompt for bank statement recognition
    */
   export async function extractBankStatement(
     fileBuffer: Buffer,
     fileName: string,
     options?: {
       bankName?: string;
       model?: 'gemini-2.5-flash' | 'gemini-2.5-pro';
     }
   ): Promise<CartolaExtractionResult> {
     const model = options?.model || 'gemini-2.5-flash';
     const startTime = Date.now();

     // Convert PDF/image to base64 for Gemini
     const base64Data = fileBuffer.toString('base64');
     const mimeType = fileName.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg';

     // Build specialized prompt for bank statement extraction
     const systemInstruction = buildBankStatementPrompt(options?.bankName);

     // Call Gemini with structured output
     const result = await genAI.models.generateContent({
       model: model,
       contents: [
         {
           role: 'user',
           parts: [
             {
               text: `Extract all bank statement data from this document and return it in the exact JSON format specified.`,
             },
             {
               inlineData: {
                 data: base64Data,
                 mimeType: mimeType,
               },
             },
           ],
         },
       ],
       config: {
         systemInstruction: systemInstruction,
         temperature: 0.1, // Low temperature for consistent extraction
         maxOutputTokens: 4096, // Sufficient for structured JSON
         responseMimeType: 'application/json', // Force JSON output
       },
     });

     const extractionTime = Date.now() - startTime;
     const text = result.text || '{}';
     const extractionResult: CartolaExtractionResult = JSON.parse(text);

     // Validate and enhance result
     validateExtractionResult(extractionResult);
     addMetadata(extractionResult, {
       metodoExtraccion: 'gemini',
       versionModelo: model,
       tiempoProcesamiento: extractionTime,
     });

     return extractionResult;
   }

   /**
    * Build specialized prompt for bank statement extraction
    */
   function buildBankStatementPrompt(bankName?: string): string {
     return `You are an expert at extracting structured data from bank statements.

Your task is to extract all bank statement information and return it in the exact JSON format specified below.

${bankName ? `This statement is from: ${bankName}` : 'Identify the bank name from the document.'}

**Required JSON Format:**
{
  "documento": {
    "banco": "string (bank name)",
    "tipoCuenta": "string (account type: Cuenta Corriente, Cuenta Vista, etc.)",
    "numeroCuenta": "string (account number, masked if sensitive)",
    "periodo": {
      "inicio": "ISO 8601 date (YYYY-MM-DD)",
      "fin": "ISO 8601 date (YYYY-MM-DD)"
    },
    "moneda": "string (CLP, USD, EUR, etc.)",
    "saldoInicial": number,
    "saldoFinal": number,
    "totalCreditos": number,
    "totalDebitos": number
  },
  "movimientos": [
    {
      "fecha": "ISO 8601 date (YYYY-MM-DD)",
      "descripcion": "string (transaction description)",
      "monto": number (positive for credits, negative for debits),
      "tipo": "credito" | "debito",
      "categoria": "string (optional)",
      "referencia": "string (optional reference number)"
    }
  ],
  "metadatos": {
    "fechaProcesamiento": "ISO 8601 timestamp",
    "metodoExtraccion": "gemini",
    "confianza": number (0-100),
    "versionModelo": "string",
    "tiempoProcesamiento": number (milliseconds)
  }
}

**Important Rules:**
1. Extract ALL movements from the statement
2. Ensure dates are in ISO 8601 format (YYYY-MM-DD)
3. Amounts must be numbers (positive for credits, negative for debits)
4. If information is missing, use reasonable defaults or null
5. Calculate totals (saldoInicial, saldoFinal, totalCreditos, totalDebitos) accurately
6. Assign "tipo" based on whether amount increases (credito) or decreases (debito) the balance
7. Confidence score should reflect how confident you are in the extraction (0-100)

Return ONLY valid JSON, no additional text.`;
   }

   /**
    * Validate extraction result
    */
   function validateExtractionResult(result: CartolaExtractionResult): void {
     // Validate required fields
     if (!result.documento) {
       throw new Error('Missing required field: documento');
     }
     if (!result.documento.banco) {
      throw new Error('Missing required field: documento.banco');
     }
     if (!Array.isArray(result.movimientos)) {
      throw new Error('movimientos must be an array');
     }
     // ... more validation ...
   }

   /**
    * Add metadata to extraction result
    */
   function addMetadata(
     result: CartolaExtractionResult,
     metadata: Partial<CartolaExtractionResult['metadatos']>
   ): void {
     result.metadatos = {
       fechaProcesamiento: new Date().toISOString(),
       metodoExtraccion: 'gemini',
       confianza: 85, // Default confidence
       versionModelo: 'gemini-2.5-flash',
       tiempoProcesamiento: 0,
       ...metadata,
     };
   }
   ```

2. Handle large files with chunked extraction (reuse existing logic):
   ```typescript
   // For files >20MB, use chunked extraction
   if (fileBuffer.length > 20 * 1024 * 1024) {
     // Use chunked extraction logic from extract-document.ts
     // Then combine results intelligently
   }
   ```

3. Support multiple bank formats:
   - Banco de Chile
   - BancoEstado
   - Banco Itaú
   - Banco Scotiabank
   - MachBank
   - TenpoBank
   - Generic format (fallback)

**Deliverables:**
- ✅ `src/lib/cartola-extractor.ts` with extraction logic
- ✅ Specialized prompts for each bank format
- ✅ Validation and error handling

**Testing:**
- ✅ Test with each sample PDF in `public/test-docs/`
- ✅ Verify JSON structure matches PRD specification
- ✅ Test with various file sizes
- ✅ Test error handling (invalid PDFs, corrupted files)

---

### **Step 4: Create API Endpoints** ⏱️ 4-5 hours

**Objective:** Create RESTful API endpoints for bank statement extraction with proper authentication, validation, and error handling.

**Tasks:**
1. Create `src/pages/api/cartola/extract.ts` (POST endpoint):
   ```typescript
   import type { APIRoute } from 'astro';
   import { getSession } from '../../../lib/auth';
   import { createCartolaExtraction, updateCartolaExtraction } from '../../../lib/firestore-cartola';
   import { extractBankStatement } from '../../../lib/cartola-extractor';
   import { uploadToCloudStorage } from '../../../lib/storage';
   import type { CartolaExtractionRequest } from '../../../types/cartola';

   export const POST: APIRoute = async ({ request, cookies }) => {
     try {
       // 1. Authenticate
       const session = getSession({ cookies });
       if (!session) {
         return new Response(
           JSON.stringify({ error: 'Unauthorized', code: 'UNAUTHORIZED' }),
           { status: 401, headers: { 'Content-Type': 'application/json' } }
         );
       }

       // 2. Parse request
       const formData = await request.formData();
       const file = formData.get('file') as File;
       const bankName = formData.get('bankName') as string | null;
       const webhookUrl = formData.get('webhookUrl') as string | null;

       if (!file) {
         return new Response(
           JSON.stringify({ error: 'File is required', code: 'MISSING_FILE' }),
           { status: 400, headers: { 'Content-Type': 'application/json' } }
         );
       }

       // 3. Validate file type
       const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
       if (!allowedTypes.includes(file.type)) {
         return new Response(
           JSON.stringify({
             error: 'Invalid file type. Only PDF, JPEG, PNG allowed',
             code: 'INVALID_FILE_TYPE',
           }),
           { status: 400, headers: { 'Content-Type': 'application/json' } }
         );
       }

       // 4. Validate file size (max 50MB)
       const maxSize = 50 * 1024 * 1024; // 50MB
       if (file.size > maxSize) {
         return new Response(
           JSON.stringify({
             error: `File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB. Maximum: 50MB`,
             code: 'FILE_TOO_LARGE',
           }),
           { status: 400, headers: { 'Content-Type': 'application/json' } }
         );
       }

       // 5. Upload file to Cloud Storage
       const fileBuffer = Buffer.from(await file.arrayBuffer());
       const fileUrl = await uploadToCloudStorage(
         fileBuffer,
         `cartola/${session.id}/${Date.now()}-${file.name}`,
         file.type
       );

       // 6. Create extraction record in Firestore
       const extraction = await createCartolaExtraction({
         userId: session.id,
         organizationId: session.organizationId,
         status: 'pending',
         fileName: file.name,
         fileSize: file.size,
         fileUrl: fileUrl,
         bankName: bankName || undefined,
         webhookUrl: webhookUrl || undefined,
       });

       // 7. Process asynchronously (add to queue)
       // Will be implemented in Step 5

       // 8. Return extraction ID immediately
       return new Response(
         JSON.stringify({
           id: extraction.id,
           status: 'pending',
           message: 'Extraction queued for processing',
           webhookUrl: webhookUrl || undefined,
         }),
         {
           status: 202, // Accepted (async processing)
           headers: { 'Content-Type': 'application/json' },
         }
       );

     } catch (error) {
       console.error('❌ Cartola extraction error:', error);
       return new Response(
         JSON.stringify({
           error: 'Internal server error',
           code: 'INTERNAL_ERROR',
           details: error instanceof Error ? error.message : 'Unknown error',
         }),
         { status: 500, headers: { 'Content-Type': 'application/json' } }
       );
     }
   };
   ```

2. Create `src/pages/api/cartola/[id].ts` (GET endpoint):
   ```typescript
   import type { APIRoute } from 'astro';
   import { getSession } from '../../../lib/auth';
   import { getCartolaExtraction } from '../../../lib/firestore-cartola';

   export const GET: APIRoute = async ({ params, cookies }) => {
     try {
       // 1. Authenticate
       const session = getSession({ cookies });
       if (!session) {
         return new Response(
           JSON.stringify({ error: 'Unauthorized', code: 'UNAUTHORIZED' }),
           { status: 401, headers: { 'Content-Type': 'application/json' } }
         );
       }

       // 2. Get extraction
       const { id } = params;
       if (!id) {
         return new Response(
           JSON.stringify({ error: 'Extraction ID required', code: 'MISSING_ID' }),
           { status: 400, headers: { 'Content-Type': 'application/json' } }
         );
       }

       const extraction = await getCartolaExtraction(id);
       if (!extraction) {
         return new Response(
           JSON.stringify({ error: 'Extraction not found', code: 'NOT_FOUND' }),
           { status: 404, headers: { 'Content-Type': 'application/json' } }
         );
       }

       // 3. Verify ownership
       if (extraction.userId !== session.id) {
         return new Response(
           JSON.stringify({ error: 'Forbidden', code: 'FORBIDDEN' }),
           { status: 403, headers: { 'Content-Type': 'application/json' } }
         );
       }

       // 4. Return extraction
       return new Response(JSON.stringify(extraction), {
         status: 200,
         headers: { 'Content-Type': 'application/json' },
       });

     } catch (error) {
       console.error('❌ Error fetching cartola extraction:', error);
       return new Response(
         JSON.stringify({
           error: 'Internal server error',
           code: 'INTERNAL_ERROR',
         }),
         { status: 500, headers: { 'Content-Type': 'application/json' } }
       );
     }
   };
   ```

3. Create `src/pages/api/cartola/index.ts` (GET list endpoint):
   ```typescript
   import type { APIRoute } from 'astro';
   import { getSession } from '../../../lib/auth';
   import { getUserCartolaExtractions } from '../../../lib/firestore-cartola';

   export const GET: APIRoute = async ({ request, cookies }) => {
     try {
       // 1. Authenticate
       const session = getSession({ cookies });
       if (!session) {
         return new Response(
           JSON.stringify({ error: 'Unauthorized', code: 'UNAUTHORIZED' }),
           { status: 401, headers: { 'Content-Type': 'application/json' } }
         );
       }

       // 2. Get query parameters
       const url = new URL(request.url);
       const limit = parseInt(url.searchParams.get('limit') || '50');
       const status = url.searchParams.get('status') as 'pending' | 'processing' | 'completed' | 'failed' | null;

       // 3. Get user's extractions
       const extractions = await getUserCartolaExtractions(session.id, limit);
       const filtered = status ? extractions.filter(e => e.status === status) : extractions;

       // 4. Return list
       return new Response(
         JSON.stringify({
           extractions: filtered,
           total: filtered.length,
           limit: limit,
         }),
         {
           status: 200,
           headers: { 'Content-Type': 'application/json' },
         }
       );

     } catch (error) {
       console.error('❌ Error listing cartola extractions:', error);
       return new Response(
         JSON.stringify({
           error: 'Internal server error',
           code: 'INTERNAL_ERROR',
         }),
         { status: 500, headers: { 'Content-Type': 'application/json' } }
       );
     }
   };
   ```

**Deliverables:**
- ✅ `src/pages/api/cartola/extract.ts` (POST)
- ✅ `src/pages/api/cartola/[id].ts` (GET)
- ✅ `src/pages/api/cartola/index.ts` (GET list)

**Testing:**
- ✅ Test authentication (should fail without session)
- ✅ Test file validation (type, size)
- ✅ Test ownership verification
- ✅ Test error handling

---

### **Step 5: Integrate with Queue System for Async Processing** ⏱️ 3-4 hours

**Objective:** Use the existing queue system to process bank statement extractions asynchronously.

**Tasks:**
1. Create queue processor function:
   ```typescript
   // src/lib/cartola-queue-processor.ts (NEW FILE)
   import { QueueProcessor } from './queue-processor';
   import { extractBankStatement } from './cartola-extractor';
   import { getCartolaExtraction, updateCartolaExtraction } from './firestore-cartola';
   import { getFileFromCloudStorage } from './storage';
   import { sendWebhook } from './webhooks';
   import type { CartolaExtraction } from '../types/cartola';

   /**
    * Process a bank statement extraction from the queue
    */
   export async function processCartolaExtraction(extractionId: string): Promise<void> {
     const extraction = await getCartolaExtraction(extractionId);
     if (!extraction) {
       throw new Error(`Extraction not found: ${extractionId}`);
     }

     if (extraction.status !== 'pending') {
       console.log(`⏸️ Extraction ${extractionId} already processed`);
       return;
     }

     const startTime = Date.now();

     try {
       // 1. Update status to processing
       await updateCartolaExtraction(extractionId, {
         status: 'processing',
       });

       // 2. Download file from Cloud Storage
       const fileBuffer = await getFileFromCloudStorage(extraction.fileUrl!);

       // 3. Extract bank statement data
       const extractionResult = await extractBankStatement(
         fileBuffer,
         extraction.fileName,
         {
           bankName: extraction.bankName,
           model: 'gemini-2.5-flash', // Use Flash for faster processing
         }
       );

       // 4. Update extraction with result
       const processingTime = Date.now() - startTime;
       await updateCartolaExtraction(extractionId, {
         status: 'completed',
         extractionResult: extractionResult,
         completedAt: new Date(),
         processingTime: processingTime,
       });

       // 5. Send webhook notification (if configured)
       if (extraction.webhookUrl) {
         await sendWebhook(extraction.webhookUrl, {
           id: extractionId,
           status: 'completed',
           extractionResult: extractionResult,
           timestamp: new Date().toISOString(),
         });
       }

       console.log(`✅ Cartola extraction completed: ${extractionId} (${processingTime}ms)`);

     } catch (error) {
       console.error(`❌ Cartola extraction failed: ${extractionId}`, error);

       // Update with error
       await updateCartolaExtraction(extractionId, {
         status: 'failed',
         error: {
           code: 'EXTRACTION_FAILED',
           message: error instanceof Error ? error.message : 'Unknown error',
           details: error instanceof Error ? error.stack : undefined,
           timestamp: new Date(),
         },
         completedAt: new Date(),
         processingTime: Date.now() - startTime,
       });

       // Send error webhook
       if (extraction.webhookUrl) {
         await sendWebhook(extraction.webhookUrl, {
           id: extractionId,
           status: 'failed',
           error: {
             code: 'EXTRACTION_FAILED',
             message: error instanceof Error ? error.message : 'Unknown error',
           },
           timestamp: new Date().toISOString(),
         });
       }

       throw error; // Re-throw to mark queue item as failed
     }
   }
   ```

2. Update extract endpoint to add to queue:
   ```typescript
   // In src/pages/api/cartola/extract.ts
   import { QueueProcessor } from '../../../lib/queue-processor';
   import { processCartolaExtraction } from '../../../lib/cartola-queue-processor';

   // After creating extraction record:
   // Add to queue for async processing
   const queueItem = await QueueProcessor.addItem({
     conversationId: `cartola-${extraction.id}`, // Use extraction ID as conversation ID
     userId: session.id,
     message: `Process bank statement: ${extraction.fileName}`,
     executionMode: 'auto',
     priority: 5, // Medium priority
   });

   // Process immediately (queue will handle async)
   processCartolaExtraction(extraction.id).catch(console.error);
   ```

3. Create webhook sending utility:
   ```typescript
   // src/lib/webhooks.ts (NEW FILE)
   export async function sendWebhook(
     url: string,
     payload: any
   ): Promise<void> {
     try {
       const response = await fetch(url, {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
           'User-Agent': 'Flow-Cartola-API/1.0',
         },
         body: JSON.stringify(payload),
         signal: AbortSignal.timeout(10000), // 10s timeout
       });

       if (!response.ok) {
         throw new Error(`Webhook failed: ${response.status} ${response.statusText}`);
       }

       console.log(`✅ Webhook sent successfully: ${url}`);
     } catch (error) {
       console.error(`❌ Webhook failed: ${url}`, error);
       // Don't throw - webhook failures shouldn't fail the extraction
     }
   }
   ```

**Deliverables:**
- ✅ `src/lib/cartola-queue-processor.ts` with processing logic
- ✅ Queue integration in extract endpoint
- ✅ Webhook sending utility

**Testing:**
- ✅ Test async processing flow
- ✅ Test webhook notifications
- ✅ Test error handling and retries
- ✅ Test queue with multiple extractions

---

### **Step 6: Implement Cloud Storage Integration** ⏱️ 2-3 hours

**Objective:** Upload files to Cloud Storage with proper encryption and access control.

**Tasks:**
1. Create storage utility functions:
   ```typescript
   // src/lib/storage.ts (NEW FILE or extend existing)
   import { Storage } from '@google-cloud/storage';

   const storage = new Storage({
     projectId: process.env.GOOGLE_CLOUD_PROJECT,
   });

   const BUCKET_NAME = process.env.CARTOLA_STORAGE_BUCKET || 'salfagpt-cartola-extractions';

   /**
    * Upload file to Cloud Storage
    */
   export async function uploadToCloudStorage(
     buffer: Buffer,
     path: string,
     contentType: string
   ): Promise<string> {
     const bucket = storage.bucket(BUCKET_NAME);
     const file = bucket.file(path);

     await file.save(buffer, {
       contentType: contentType,
       metadata: {
         cacheControl: 'private, max-age=3600',
         contentDisposition: `attachment; filename="${path.split('/').pop()}"`,
       },
     });

     // Return Cloud Storage URL
     return `gs://${BUCKET_NAME}/${path}`;
   }

   /**
    * Get file from Cloud Storage
    */
   export async function getFileFromCloudStorage(gsUrl: string): Promise<Buffer> {
     const [bucketName, ...pathParts] = gsUrl.replace('gs://', '').split('/');
     const path = pathParts.join('/');

     const bucket = storage.bucket(bucketName);
     const file = bucket.file(path);

     const [buffer] = await file.download();
     return buffer;
   }

   /**
    * Delete file from Cloud Storage
    */
   export async function deleteFileFromCloudStorage(gsUrl: string): Promise<void> {
     const [bucketName, ...pathParts] = gsUrl.replace('gs://', '').split('/');
     const path = pathParts.join('/');

     const bucket = storage.bucket(bucketName);
     const file = bucket.file(path);

     await file.delete();
     console.log(`✅ Deleted file: ${gsUrl}`);
   }

   /**
    * Generate signed URL for temporary access (7 days)
    */
   export async function generateSignedUrl(
     gsUrl: string,
     expiresInHours: number = 168 // 7 days
   ): Promise<string> {
     const [bucketName, ...pathParts] = gsUrl.replace('gs://', '').split('/');
     const path = pathParts.join('/');

     const bucket = storage.bucket(bucketName);
     const file = bucket.file(path);

     const [url] = await file.getSignedUrl({
       action: 'read',
       expires: Date.now() + expiresInHours * 60 * 60 * 1000,
     });

     return url;
   }
   ```

2. Ensure bucket exists with proper permissions:
   ```bash
   # Create bucket if it doesn't exist
   gsutil mb -p gen-lang-client-0986191192 gs://salfagpt-cartola-extractions

   # Set lifecycle policy (auto-delete after retention period)
   gsutil lifecycle set lifecycle.json gs://salfagpt-cartola-extractions
   ```

   `lifecycle.json`:
   ```json
   {
     "lifecycle": {
       "rule": [
         {
           "action": { "type": "Delete" },
           "condition": {
             "age": 90, // Delete after 90 days
             "matchesPrefix": ["cartola/"]
           }
         }
       ]
     }
   }
   ```

**Deliverables:**
- ✅ `src/lib/storage.ts` with Cloud Storage functions
- ✅ Bucket created with lifecycle policy
- ✅ Environment variable for bucket name

**Testing:**
- ✅ Test file upload
- ✅ Test file download
- ✅ Test signed URL generation
- ✅ Test file deletion
- ✅ Verify lifecycle policy works

---

### **Step 7: Add Security & Encryption** ⏱️ 3-4 hours

**Objective:** Implement security measures per PRD requirements (TLS 1.2+, AES-256 encryption, role-based access).

**Tasks:**
1. Add encryption for sensitive data:
   ```typescript
   // src/lib/encryption.ts (NEW FILE or extend existing)
   import crypto from 'crypto';

   const ENCRYPTION_KEY = process.env.CARTOLA_ENCRYPTION_KEY // 32-byte key for AES-256
     || crypto.randomBytes(32).toString('hex');
   const ALGORITHM = 'aes-256-gcm';

   /**
    * Encrypt sensitive bank statement data
    */
   export function encryptCartolaData(data: string): {
     encrypted: string;
     iv: string;
     authTag: string;
   } {
     const iv = crypto.randomBytes(16);
     const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);

     let encrypted = cipher.update(data, 'utf8', 'hex');
     encrypted += cipher.final('hex');

     const authTag = cipher.getAuthTag();

     return {
       encrypted,
       iv: iv.toString('hex'),
       authTag: authTag.toString('hex'),
     };
   }

   /**
    * Decrypt sensitive bank statement data
    */
   export function decryptCartolaData(
     encrypted: string,
     iv: string,
     authTag: string
   ): string {
     const decipher = crypto.createDecipheriv(
       ALGORITHM,
       Buffer.from(ENCRYPTION_KEY, 'hex'),
       Buffer.from(iv, 'hex')
     );

     decipher.setAuthTag(Buffer.from(authTag, 'hex'));

     let decrypted = decipher.update(encrypted, 'hex', 'utf8');
     decrypted += decipher.final('utf8');

     return decrypted;
   }

   /**
    * Hash account numbers for privacy
    */
   export function hashAccountNumber(accountNumber: string): string {
     return crypto
       .createHash('sha256')
       .update(accountNumber)
       .digest('hex')
       .substring(0, 16); // First 16 chars of hash
   }
   ```

2. Update Firestore to store encrypted data:
   ```typescript
   // In cartola-extractor.ts, encrypt sensitive fields before storing
   import { encryptCartolaData, hashAccountNumber } from './encryption';

   // After extraction, encrypt sensitive data
   if (extractionResult.documento.numeroCuenta) {
     extractionResult.documento.numeroCuenta = hashAccountNumber(
       extractionResult.documento.numeroCuenta
     );
   }

   // Encrypt full JSON before storing
   const encrypted = encryptCartolaData(JSON.stringify(extractionResult));
   ```

3. Add role-based access control:
   ```typescript
   // src/lib/permissions.ts (extend existing)
   export function canAccessCartolaExtraction(
     user: User,
     extraction: CartolaExtraction
   ): boolean {
     // User owns the extraction
     if (user.id === extraction.userId) {
       return true;
     }

     // Admin can access all
     if (user.role === 'admin') {
       return true;
     }

     // Organization admin can access org extractions
     if (user.role === 'admin' && user.organizationId === extraction.organizationId) {
       return true;
     }

     return false;
   }
   ```

4. Add API key authentication support (for CLI/automation):
   ```typescript
   // In extract endpoint, support API key auth
   const apiKey = request.headers.get('X-API-Key');
   if (apiKey) {
     const apiKeySession = await verifyAPIKey(apiKey);
     if (apiKeySession) {
       // Use API key session
     }
   }
   ```

**Deliverables:**
- ✅ `src/lib/encryption.ts` with AES-256 encryption
- ✅ Account number hashing
- ✅ Role-based access control
- ✅ API key authentication support

**Testing:**
- ✅ Test encryption/decryption
- ✅ Test access control (user, admin, org admin)
- ✅ Test API key authentication
- ✅ Verify data is encrypted at rest

---

### **Step 8: Implement Error Handling & Logging** ⏱️ 2-3 hours

**Objective:** Comprehensive error handling and logging per PRD requirements.

**Tasks:**
1. Create error response utility:
   ```typescript
   // src/lib/cartola-errors.ts (NEW FILE)
   export enum CartolaErrorCode {
     UNAUTHORIZED = 'UNAUTHORIZED',
     INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',
     FILE_TOO_LARGE = 'FILE_TOO_LARGE',
     EXTRACTION_FAILED = 'EXTRACTION_FAILED',
     BANK_NOT_RECOGNIZED = 'BANK_NOT_RECOGNIZED',
     INVALID_JSON = 'INVALID_JSON',
     PROCESSING_TIMEOUT = 'PROCESSING_TIMEOUT',
     INTERNAL_ERROR = 'INTERNAL_ERROR',
   }

   export interface CartolaErrorResponse {
     error: string;
     code: CartolaErrorCode;
     details?: string;
     suggestions?: string[];
     timestamp: string;
   }

   export function createErrorResponse(
     code: CartolaErrorCode,
     message: string,
     details?: string,
     suggestions?: string[]
   ): CartolaErrorResponse {
     return {
       error: message,
       code,
       details,
       suggestions,
       timestamp: new Date().toISOString(),
     };
   }
   ```

2. Add structured logging:
   ```typescript
   // src/lib/cartola-logger.ts (NEW FILE)
   export function logCartolaExtraction(
     action: string,
     extractionId: string,
     metadata: Record<string, any>
   ): void {
     console.log(JSON.stringify({
       service: 'cartola-extraction',
      action,
      extractionId,
      timestamp: new Date().toISOString(),
      ...metadata,
    }));
  }

  export function logCartolaError(
    extractionId: string,
    error: Error,
    context: Record<string, any>
  ): void {
    console.error(JSON.stringify({
      service: 'cartola-extraction',
      action: 'error',
      extractionId,
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name,
      },
      timestamp: new Date().toISOString(),
      ...context,
    }));
  }
   ```

3. Add retry logic for transient failures:
   ```typescript
   // In cartola-queue-processor.ts
   async function processCartolaExtractionWithRetry(
     extractionId: string,
     maxRetries: number = 3
   ): Promise<void> {
     let lastError: Error | null = null;

     for (let attempt = 1; attempt <= maxRetries; attempt++) {
       try {
         await processCartolaExtraction(extractionId);
         return; // Success
       } catch (error) {
         lastError = error instanceof Error ? error : new Error(String(error));
         
         if (attempt < maxRetries) {
           const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
           console.log(`⏳ Retry ${attempt}/${maxRetries} in ${delay}ms...`);
           await new Promise(resolve => setTimeout(resolve, delay));
         }
       }
     }

     throw lastError || new Error('Max retries exceeded');
   }
   ```

**Deliverables:**
- ✅ `src/lib/cartola-errors.ts` with error codes
- ✅ `src/lib/cartola-logger.ts` with structured logging
- ✅ Retry logic for transient failures

**Testing:**
- ✅ Test all error scenarios
- ✅ Verify error responses match PRD format
- ✅ Test retry logic
- ✅ Verify logs are structured and searchable

---

### **Step 9: Create Testing Suite** ⏱️ 4-5 hours

**Objective:** Comprehensive test suite using the sample files in `public/test-docs/`.

**Tasks:**
1. Create test script:
   ```typescript
   // scripts/test-cartola-extraction.ts
   import { extractBankStatement } from '../src/lib/cartola-extractor';
   import * as fs from 'fs';
   import * as path from 'path';

   const TEST_DOCS_DIR = path.join(__dirname, '../public/test-docs');

   async function testExtraction(fileName: string) {
     console.log(`\n🧪 Testing: ${fileName}`);
     console.log('='.repeat(50));

     const filePath = path.join(TEST_DOCS_DIR, fileName);
     const fileBuffer = fs.readFileSync(filePath);

     try {
       const startTime = Date.now();
       const result = await extractBankStatement(fileBuffer, fileName);
       const duration = Date.now() - startTime;

       console.log(`✅ Extraction completed in ${duration}ms`);
       console.log(`\n📊 Results:`);
       console.log(`   Bank: ${result.documento.banco}`);
       console.log(`   Account Type: ${result.documento.tipoCuenta}`);
       console.log(`   Period: ${result.documento.periodo.inicio} to ${result.documento.periodo.fin}`);
       console.log(`   Movements: ${result.movimientos.length}`);
       console.log(`   Initial Balance: ${result.documento.saldoInicial}`);
       console.log(`   Final Balance: ${result.documento.saldoFinal}`);
       console.log(`   Confidence: ${result.metadatos.confianza}%`);

       // Save result to file
       const outputPath = path.join(
         __dirname,
         '../test-results',
         fileName.replace('.pdf', '.json')
       );
       fs.mkdirSync(path.dirname(outputPath), { recursive: true });
       fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
       console.log(`\n💾 Saved to: ${outputPath}`);

       // Validate structure
       validateResult(result);

     } catch (error) {
       console.error(`❌ Extraction failed:`, error);
       throw error;
     }
   }

   function validateResult(result: any): void {
     const errors: string[] = [];

     // Validate required fields
     if (!result.documento) errors.push('Missing documento');
     if (!result.documento?.banco) errors.push('Missing documento.banco');
     if (!Array.isArray(result.movimientos)) errors.push('movimientos must be array');
     if (!result.metadatos) errors.push('Missing metadatos');

     // Validate movements
     result.movimientos?.forEach((mov: any, idx: number) => {
       if (!mov.fecha) errors.push(`Movement ${idx}: missing fecha`);
       if (!mov.descripcion) errors.push(`Movement ${idx}: missing descripcion`);
       if (typeof mov.monto !== 'number') errors.push(`Movement ${idx}: monto must be number`);
       if (!['credito', 'debito'].includes(mov.tipo)) {
         errors.push(`Movement ${idx}: tipo must be 'credito' or 'debito'`);
       }
     });

     if (errors.length > 0) {
       throw new Error(`Validation failed:\n${errors.join('\n')}`);
     }

     console.log(`✅ Structure validation passed`);
   }

   // Run tests
   async function runAllTests() {
     const files = [
       'Banco de Chile.pdf',
       'Banco del Estado de Chile (BancoEstado).pdf',
       'Banco Itaú Chile.pdf',
       'Banco Scotiabank (Correo).pdf',
       'Banco Scotiabank (descarga web).pdf',
       'MachBank.pdf',
       'TenpoBank.pdf',
     ];

     console.log('🚀 Starting Cartola Extraction Tests\n');

     for (const file of files) {
       await testExtraction(file);
     }

     console.log('\n✅ All tests completed!');
   }

   runAllTests().catch(console.error);
   ```

2. Create API integration tests:
   ```typescript
   // scripts/test-cartola-api.ts
   // Test POST /api/cartola/extract
   // Test GET /api/cartola/[id]
   // Test GET /api/cartola/index
   // Test error scenarios
   ```

3. Create performance benchmarks:
   ```typescript
   // scripts/benchmark-cartola.ts
   // Measure extraction time per file size
   // Measure API response times
   // Measure queue processing times
   ```

**Deliverables:**
- ✅ `scripts/test-cartola-extraction.ts` with file tests
- ✅ `scripts/test-cartola-api.ts` with API tests
- ✅ `scripts/benchmark-cartola.ts` with performance tests
- ✅ Test results directory with JSON outputs

**Testing:**
- ✅ Run all 7 sample PDFs through extraction
- ✅ Verify JSON structure matches PRD
- ✅ Test API endpoints with sample files
- ✅ Measure performance metrics

---

### **Step 10: Documentation & Deployment** ⏱️ 2-3 hours

**Objective:** Complete documentation and deployment configuration.

**Tasks:**
1. Create API documentation:
   ```markdown
   # docs/API-CARTOLA.md
   ## Bank Statement Extraction API

   ### POST /api/cartola/extract
   Upload and extract bank statement data.

   **Request:**
   - Content-Type: multipart/form-data
   - Body:
     - file: PDF/JPEG/PNG file
     - bankName: (optional) Bank name hint
     - webhookUrl: (optional) Webhook URL for notifications

   **Response:**
   ```json
   {
     "id": "extraction-id",
     "status": "pending",
     "message": "Extraction queued for processing"
   }
   ```

   ### GET /api/cartola/[id]
   Get extraction status and result.

   **Response:**
   ```json
   {
     "id": "extraction-id",
     "status": "completed",
     "extractionResult": { ... },
     "completedAt": "2025-11-10T10:00:00Z"
   }
   ```

   ### GET /api/cartola/index
   List user's extractions.

   **Query Parameters:**
   - limit: Number of results (default: 50)
   - status: Filter by status (pending, processing, completed, failed)

   ### Webhooks
   Standardized webhook payload when extraction completes.
   ```

2. Update environment variables:
   ```bash
   # .env
   CARTOLA_STORAGE_BUCKET=salfagpt-cartola-extractions
   CARTOLA_ENCRYPTION_KEY=<32-byte hex key>
   CARTOLA_WEBHOOK_SECRET=<secret for webhook verification>
   ```

3. Create deployment checklist:
   ```markdown
   # docs/CARTOLA-DEPLOYMENT-CHECKLIST.md
   ## Pre-Deployment
   - [ ] Firestore indexes deployed
   - [ ] Security rules updated
   - [ ] Cloud Storage bucket created
   - [ ] Lifecycle policy configured
   - [ ] Environment variables set
   - [ ] Encryption key generated

   ## Post-Deployment
   - [ ] Test extraction with sample files
   - [ ] Verify webhook notifications
   - [ ] Monitor error rates
   - [ ] Verify encryption at rest
   - [ ] Check performance metrics
   ```

4. Update main README:
   ```markdown
   ## Bank Statement Extraction API

   See [docs/API-CARTOLA.md](./docs/API-CARTOLA.md) for complete API documentation.
   ```

**Deliverables:**
- ✅ `docs/API-CARTOLA.md` with API documentation
- ✅ `docs/CARTOLA-DEPLOYMENT-CHECKLIST.md`
- ✅ Environment variables documented
- ✅ README updated

**Testing:**
- ✅ Documentation reviewed
- ✅ Deployment checklist verified
- ✅ Sample code examples work

---

## 🔄 Backward Compatibility Implementation

**Separate Feature** - Works alongside existing architecture without conflicts.

### **Key Design Decisions:**

1. **Separate Endpoint**: `/api/cartola/*` (not `/api/extract-document`)
2. **Separate Collection**: `cartola_extractions` (not `context_sources`)
3. **Shared Infrastructure**: Uses same auth, Firestore, Cloud Storage, queue system
4. **No Conflicts**: Doesn't modify existing `extract-document` API or `context_sources` collection

### **Integration Points:**

```typescript
// Uses existing authentication
import { getSession } from '../../../lib/auth';

// Uses existing Firestore connection
import { firestore } from '../../../lib/firestore';

// Uses existing queue system
import { QueueProcessor } from '../../../lib/queue-processor';

// Uses existing storage
import { uploadToCloudStorage } from '../../../lib/storage';

// Uses existing Gemini AI integration
import { GoogleGenAI } from '@google/genai';
```

### **Security:**

- ✅ Same OAuth 2.0 authentication
- ✅ Same user isolation (userId filtering)
- ✅ Same organization isolation (if applicable)
- ✅ Additional encryption for sensitive bank data
- ✅ Role-based access control

### **No Breaking Changes:**

- ✅ Existing `/api/extract-document` endpoint unchanged
- ✅ Existing `context_sources` collection unchanged
- ✅ Existing UI components unchanged
- ✅ All existing functionality preserved

---

## 📊 Success Criteria

### **Functional Requirements:**

- ✅ Extract data from all 7 sample bank statement formats
- ✅ Return JSON matching PRD specification exactly
- ✅ Process asynchronously with webhook notifications
- ✅ Handle errors gracefully with standardized responses
- ✅ Support file sizes up to 50MB

### **Technical Requirements:**

- ✅ RESTful API with OAuth 2.0 authentication
- ✅ AES-256 encryption for sensitive data
- ✅ TLS 1.2+ for all communications
- ✅ Role-based access control
- ✅ Compliance with Ley 19.628
- ✅ Automatic file deletion after retention period

### **Performance Requirements:**

- ✅ Extraction completes in <30 seconds for typical files
- ✅ API responds in <200ms (p95)
- ✅ Queue processing handles 10+ concurrent extractions
- ✅ 99%+ accuracy in data extraction

### **Backward Compatibility:**

- ✅ No modifications to existing endpoints
- ✅ No modifications to existing collections
- ✅ No breaking changes to existing APIs
- ✅ All existing functionality preserved

---

## 🔍 Risk Mitigation

### **Identified Risks:**

1. **Large File Processing**
   - **Risk**: Files >50MB may timeout
   - **Mitigation**: Use chunked extraction, increase timeout limits

2. **Bank Format Recognition**
   - **Risk**: New bank formats not recognized
   - **Mitigation**: Extensible prompt system, fallback to generic extraction

3. **Data Privacy**
   - **Risk**: Sensitive financial data exposure
   - **Mitigation**: Encryption at rest, access control, automatic deletion

4. **API Rate Limits**
   - **Risk**: Gemini API rate limits
   - **Mitigation**: Queue system, retry logic, rate limit handling

### **Testing Strategy:**

- ✅ Unit tests for extraction logic
- ✅ Integration tests for API endpoints
- ✅ End-to-end tests with sample files
- ✅ Performance tests for large files
- ✅ Security tests for access control

---

## 📅 Timeline Estimate

**Total Estimated Time:** 30-40 hours

- Step 1: 2-3 hours
- Step 2: 1-2 hours
- Step 3: 6-8 hours
- Step 4: 4-5 hours
- Step 5: 3-4 hours
- Step 6: 2-3 hours
- Step 7: 3-4 hours
- Step 8: 2-3 hours
- Step 9: 4-5 hours
- Step 10: 2-3 hours

**Recommended Schedule:**
- **Week 1**: Steps 1-4 (Foundation & API)
- **Week 2**: Steps 5-7 (Queue, Storage, Security)
- **Week 3**: Steps 8-10 (Testing, Documentation, Deployment)

---

## 🚀 Next Steps

1. **Review this plan** with stakeholders
2. **Set up development environment** (Firestore, Cloud Storage, etc.)
3. **Create feature branch**: `feat/cartola-extraction-api-2025-11-10`
4. **Begin Step 1**: Create data models and types
5. **Daily progress updates** in `docs/BranchLog.md`

---

**Last Updated**: 2025-11-10  
**Status**: 📋 Ready for Implementation  
**Backward Compatible**: ✅ Yes  
**Security**: ✅ TLS 1.2+, AES-256, OAuth 2.0  
**Compliance**: ✅ Ley 19.628


