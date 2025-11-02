# Tool Manager Architecture - Flow Platform

## 🎯 Purpose

The Tool Manager enables serverless execution of compute-intensive document processing tasks via Cloud Functions, with an admin UI for configuration, monitoring, and cost control.

---

## 🏗️ System Architecture

### High-Level Flow

```
User uploads 300MB PDF
    ↓
Flow Platform API
    ↓
Tool Manager orchestrates:
    ├─ Upload to GCS (signed URL)
    ├─ Invoke Cloud Function (pdf-splitter-tool)
    ├─ Track execution status
    └─ Retrieve results
    ↓
Return to user:
    - 15x 20MB PDF chunks
    - Metadata (page ranges, quality metrics)
    - Optional: Embeddings + chunk mappings
```

---

## 📊 Firestore Collections

### 1. `tools`

**Purpose:** Registry of available tools

```typescript
interface Tool {
  // Identity
  id: string;                         // e.g., 'pdf-splitter'
  name: string;                       // 'PDF Splitter'
  description: string;                // User-facing description
  version: string;                    // '1.0.0'
  
  // Cloud Function
  functionName: string;               // 'pdf-splitter-tool'
  functionUrl: string;                // Cloud Function invoke URL
  region: string;                     // 'us-central1'
  
  // Configuration
  enabled: boolean;                   // Global enable/disable
  availableFor: string[];             // ['admin', 'expert', 'user']
  maxConcurrentExecutions: number;    // Rate limiting
  timeoutSeconds: number;             // Max execution time
  
  // Capabilities
  inputTypes: string[];               // ['application/pdf']
  outputTypes: string[];              // ['application/pdf', 'application/json']
  maxInputSizeMB: number;             // 500 for pdf-splitter
  
  // Pricing
  costPer1000Pages?: number;          // For cost estimation
  freeQuota?: {
    perUser: number;                  // Free executions per user
    perMonth: number;                 // Free executions per month
  };
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;                  // User ID
}
```

**Sample Document:**
```typescript
{
  id: 'pdf-splitter',
  name: 'PDF Splitter',
  description: 'Split large PDFs into 20MB chunks without quality loss',
  version: '1.0.0',
  functionName: 'pdf-splitter-tool',
  functionUrl: 'https://us-central1-gen-lang-client-0986191192.cloudfunctions.net/pdf-splitter-tool',
  region: 'us-central1',
  enabled: true,
  availableFor: ['admin', 'expert', 'user'],
  maxConcurrentExecutions: 5,
  timeoutSeconds: 540, // 9 minutes
  inputTypes: ['application/pdf'],
  outputTypes: ['application/pdf', 'application/json'],
  maxInputSizeMB: 500,
  costPer1000Pages: 0.10,
  freeQuota: {
    perUser: 5,
    perMonth: 100
  },
  createdAt: new Date('2025-11-02'),
  updatedAt: new Date('2025-11-02'),
  createdBy: 'admin-user-id'
}
```

---

### 2. `tool_configs`

**Purpose:** User-specific tool configuration

```typescript
interface ToolConfig {
  // Identity
  id: string;                         // userId_toolId
  userId: string;                     // Owner
  toolId: string;                     // Tool being configured
  
  // Configuration
  enabled: boolean;                   // User-level enable/disable
  parameters: Record<string, any>;    // Tool-specific parameters
  
  // Quotas
  monthlyQuota?: number;              // Max executions per month
  quotaUsed: number;                  // Current month usage
  quotaResetDate: Date;               // Next reset date
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}
```

**Sample Document:**
```typescript
{
  id: '114671162830729001607_pdf-splitter',
  userId: '114671162830729001607',
  toolId: 'pdf-splitter',
  enabled: true,
  parameters: {
    chunkSizeMB: 20,
    preserveQuality: true,
    outputFormat: 'pdf',
    includeMetadata: true
  },
  monthlyQuota: 20,
  quotaUsed: 3,
  quotaResetDate: new Date('2025-12-01'),
  createdAt: new Date('2025-11-02'),
  updatedAt: new Date('2025-11-02')
}
```

---

### 3. `tool_executions`

**Purpose:** Track all tool invocations

```typescript
interface ToolExecution {
  // Identity
  id: string;                         // Auto-generated
  userId: string;                     // Who triggered it
  toolId: string;                     // Tool executed
  
  // Input
  inputFileUrl?: string;              // GCS URL of input
  inputFileName?: string;             // Original filename
  inputSizeMB: number;                // Size in MB
  parameters: Record<string, any>;    // Execution parameters
  
  // Execution
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  functionExecutionId?: string;       // Cloud Function execution ID
  
  // Progress
  progressPercentage?: number;        // 0-100
  progressMessage?: string;           // Current step
  
  // Results
  outputFiles?: Array<{
    url: string;                      // GCS URL
    fileName: string;                 // Generated filename
    sizeMB: number;                   // Size
    type: string;                     // MIME type
    metadata?: Record<string, any>;   // File-specific metadata
  }>;
  metadata?: Record<string, any>;     // Execution metadata
  
  // Timing
  startedAt: Date;
  completedAt?: Date;
  durationMs?: number;
  
  // Error
  error?: {
    message: string;
    code: string;
    details?: string;
  };
  
  // Cost
  estimatedCost?: number;             // USD
  
  // Source
  source: 'localhost' | 'production';
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}
```

**Sample Document (PDF Splitter):**
```typescript
{
  id: 'exec_20251102_abc123',
  userId: '114671162830729001607',
  toolId: 'pdf-splitter',
  inputFileUrl: 'gs://salfagpt-uploads/user-114/massive-manual.pdf',
  inputFileName: 'massive-manual.pdf',
  inputSizeMB: 312,
  parameters: {
    chunkSizeMB: 20,
    preserveQuality: true
  },
  status: 'completed',
  functionExecutionId: 'cf-exec-xyz789',
  progressPercentage: 100,
  progressMessage: 'Completed successfully',
  outputFiles: [
    {
      url: 'gs://salfagpt-uploads/user-114/chunks/massive-manual-chunk-001.pdf',
      fileName: 'massive-manual-chunk-001.pdf',
      sizeMB: 19.8,
      type: 'application/pdf',
      metadata: {
        pageRange: '1-45',
        originalPages: 450
      }
    },
    // ... 15 more chunks
  ],
  metadata: {
    totalChunks: 16,
    totalPages: 450,
    avgChunkSizeMB: 19.5,
    compressionRatio: 1.0 // No compression
  },
  startedAt: new Date('2025-11-02T10:00:00'),
  completedAt: new Date('2025-11-02T10:02:30'),
  durationMs: 150000, // 2.5 minutes
  estimatedCost: 0.045,
  source: 'production',
  createdAt: new Date('2025-11-02T10:00:00'),
  updatedAt: new Date('2025-11-02T10:02:30')
}
```

---

### 4. `tool_results` (Future - for large results)

**Purpose:** Store tool outputs that don't fit in executions document

```typescript
interface ToolResult {
  id: string;                         // executionId_resultType
  executionId: string;                // Parent execution
  userId: string;                     // Owner
  toolId: string;                     // Tool that generated this
  
  // Result data
  resultType: string;                 // 'chunks' | 'embeddings' | 'metadata'
  data: any;                          // Large JSON data
  
  // Storage
  gcsUrl?: string;                    // If stored in GCS
  
  // Timestamps
  createdAt: Date;
  expiresAt?: Date;                   // Auto-delete after X days
}
```

---

## 🛠️ Available Tools (Planned)

### Tool 1: PDF Splitter ⭐ Priority 1

**Function:** Split large PDFs into chunks without quality loss

**Input:**
```typescript
{
  inputFileUrl: string;     // GCS URL
  chunkSizeMB: number;      // Target chunk size (default: 20)
  preserveQuality: boolean; // No compression (default: true)
  outputFormat: 'pdf';      // Output format
}
```

**Output:**
```typescript
{
  chunks: [
    {
      url: 'gs://bucket/chunk-001.pdf',
      fileName: 'chunk-001.pdf',
      sizeMB: 19.8,
      pageRange: '1-45',
      metadata: { ... }
    }
  ],
  metadata: {
    totalChunks: 16,
    totalPages: 450,
    processingTime: 150000
  }
}
```

---

### Tool 2: Document Embedder ⭐ Priority 2

**Function:** Generate text embeddings for document chunks

**Input:**
```typescript
{
  inputFileUrl: string | string[];  // Single PDF or chunk URLs
  embeddingModel: 'text-embedding-004';
  chunkStrategy: 'page' | 'paragraph' | 'sentence';
  chunkSize?: number;               // Tokens per chunk
  chunkOverlap?: number;            // Overlap tokens
}
```

**Output:**
```typescript
{
  embeddings: [
    {
      chunkId: 'chunk-001-page-01',
      text: 'Original text content...',
      embedding: [0.123, -0.456, ...], // 768-dim vector
      metadata: {
        pageNumber: 1,
        wordCount: 234,
        sourceChunk: 'chunk-001.pdf'
      }
    }
  ],
  metadata: {
    totalEmbeddings: 450,
    model: 'text-embedding-004',
    dimensions: 768,
    totalCost: 0.034
  }
}
```

---

### Tool 3: Multimodal Embedder (Future)

**Function:** Generate multimodal embeddings (text + images)

**Input:**
```typescript
{
  inputFileUrl: string;
  embeddingModel: 'multimodal-embedding-001';
  extractImages: boolean;
}
```

**Output:**
```typescript
{
  embeddings: [
    {
      chunkId: 'chunk-001',
      textEmbedding: [...],
      imageEmbeddings: [
        {
          pageNumber: 3,
          imageId: 'img-003-001',
          embedding: [...]
        }
      ]
    }
  ]
}
```

---

## 🔐 Security Architecture

### Layer 1: Authentication
```typescript
// All tool executions require valid session
const session = getSession({ cookies });
if (!session) return 401;
```

### Layer 2: Authorization
```typescript
// Check if user role can use this tool
const tool = await getTool(toolId);
if (!tool.availableFor.includes(user.role)) return 403;
```

### Layer 3: Quota Management
```typescript
// Check user hasn't exceeded quota
const config = await getToolConfig(userId, toolId);
if (config.quotaUsed >= config.monthlyQuota) {
  return { error: 'Monthly quota exceeded' };
}
```

### Layer 4: Signed URLs
```typescript
// Cloud Function only accepts signed URLs with expiration
const signedUrl = await generateSignedURL(gcsPath, {
  action: 'read',
  expires: Date.now() + 3600000, // 1 hour
});
```

---

## 🚀 Cloud Function Implementation

### PDF Splitter Function

**Deployment:**
```bash
gcloud functions deploy pdf-splitter-tool \
  --gen2 \
  --runtime=nodejs20 \
  --region=us-central1 \
  --source=./functions/pdf-splitter \
  --entry-point=splitPDF \
  --trigger-http \
  --allow-unauthenticated=false \
  --memory=4GB \
  --timeout=540s \
  --max-instances=10 \
  --set-env-vars="GOOGLE_CLOUD_PROJECT=gen-lang-client-0986191192"
```

**Function Code (functions/pdf-splitter/index.ts):**
```typescript
import { PDFDocument } from 'pdf-lib';
import { Storage } from '@google-cloud/storage';
import type { Request, Response } from '@google-cloud/functions-framework';

const storage = new Storage();
const BUCKET_NAME = 'salfagpt-tool-outputs';

interface SplitPDFRequest {
  inputFileUrl: string;      // gs://bucket/file.pdf
  chunkSizeMB: number;       // Target chunk size
  userId: string;            // For output path
  executionId: string;       // For tracking
}

export async function splitPDF(req: Request, res: Response) {
  try {
    const { inputFileUrl, chunkSizeMB, userId, executionId }: SplitPDFRequest = req.body;
    
    // Validate inputs
    if (!inputFileUrl || !userId || !executionId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Download PDF from GCS
    const inputFile = storage.bucket(inputFileUrl.replace('gs://', '').split('/')[0])
      .file(inputFileUrl.replace(/^gs:\/\/[^/]+\//, ''));
    
    const [pdfBuffer] = await inputFile.download();
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const totalPages = pdfDoc.getPageCount();
    
    console.log(`📄 Processing PDF: ${totalPages} pages, ${(pdfBuffer.length / 1024 / 1024).toFixed(2)} MB`);
    
    // Calculate chunk strategy
    const avgPageSizeBytes = pdfBuffer.length / totalPages;
    const targetChunkSizeBytes = chunkSizeMB * 1024 * 1024;
    const pagesPerChunk = Math.floor(targetChunkSizeBytes / avgPageSizeBytes);
    
    console.log(`📦 Splitting into chunks of ~${pagesPerChunk} pages each`);
    
    // Split into chunks
    const chunks: Array<{
      url: string;
      fileName: string;
      sizeMB: number;
      pageRange: string;
      pageCount: number;
    }> = [];
    
    for (let startPage = 0; startPage < totalPages; startPage += pagesPerChunk) {
      const endPage = Math.min(startPage + pagesPerChunk, totalPages);
      const chunkNum = chunks.length + 1;
      
      // Create new PDF with this page range
      const chunkPdf = await PDFDocument.create();
      const copiedPages = await chunkPdf.copyPages(
        pdfDoc,
        Array.from({ length: endPage - startPage }, (_, i) => startPage + i)
      );
      copiedPages.forEach(page => chunkPdf.addPage(page));
      
      // Save chunk
      const chunkBytes = await chunkPdf.save();
      const chunkFileName = `chunk-${String(chunkNum).padStart(3, '0')}.pdf`;
      const chunkPath = `tool-outputs/${userId}/${executionId}/${chunkFileName}`;
      
      const chunkFile = storage.bucket(BUCKET_NAME).file(chunkPath);
      await chunkFile.save(Buffer.from(chunkBytes));
      
      // Generate signed URL (expires in 7 days)
      const [signedUrl] = await chunkFile.getSignedUrl({
        action: 'read',
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
      });
      
      chunks.push({
        url: signedUrl,
        fileName: chunkFileName,
        sizeMB: parseFloat((chunkBytes.length / 1024 / 1024).toFixed(2)),
        pageRange: `${startPage + 1}-${endPage}`,
        pageCount: endPage - startPage
      });
      
      console.log(`✅ Chunk ${chunkNum}: ${chunkFileName} (${chunks[chunks.length - 1].sizeMB} MB)`);
    }
    
    // Return results
    const response = {
      success: true,
      executionId,
      chunks,
      metadata: {
        totalChunks: chunks.length,
        totalPages,
        avgChunkSizeMB: chunks.reduce((sum, c) => sum + c.sizeMB, 0) / chunks.length,
        processingTimeMs: Date.now() - Date.parse(new Date().toISOString())
      }
    };
    
    console.log(`✅ Completed: ${chunks.length} chunks generated`);
    res.status(200).json(response);
    
  } catch (error) {
    console.error('❌ PDF splitting failed:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
```

---

## 📡 API Endpoints

### Execute Tool

**Endpoint:** `POST /api/tools/execute`

**Request:**
```typescript
{
  toolId: string;           // 'pdf-splitter'
  inputFile: File;          // Browser File object
  parameters?: Record<string, any>;
}
```

**Response:**
```typescript
{
  executionId: string;      // Track execution
  status: 'pending';
  estimatedTimeSeconds: number;
  pollUrl: string;          // Status polling endpoint
}
```

**Implementation (src/pages/api/tools/execute.ts):**
```typescript
export const POST: APIRoute = async ({ request, cookies }) => {
  // 1. Authenticate
  const session = getSession({ cookies });
  if (!session) return unauthorized();
  
  // 2. Parse request
  const formData = await request.formData();
  const toolId = formData.get('toolId') as string;
  const inputFile = formData.get('inputFile') as File;
  const parameters = JSON.parse(formData.get('parameters') as string || '{}');
  
  // 3. Validate tool
  const tool = await getTool(toolId);
  if (!tool || !tool.enabled) {
    return notFound('Tool not found or disabled');
  }
  
  // 4. Check authorization
  const user = await getUser(session.id);
  if (!tool.availableFor.includes(user.role)) {
    return forbidden('You do not have access to this tool');
  }
  
  // 5. Check quota
  const config = await getToolConfig(session.id, toolId);
  if (config.quotaUsed >= config.monthlyQuota) {
    return quotaExceeded();
  }
  
  // 6. Upload input to GCS
  const gcsPath = `tool-inputs/${session.id}/${Date.now()}-${inputFile.name}`;
  const bucket = storage.bucket('salfagpt-uploads');
  const file = bucket.file(gcsPath);
  
  const buffer = Buffer.from(await inputFile.arrayBuffer());
  await file.save(buffer);
  
  // 7. Create execution record
  const executionId = `exec_${Date.now()}_${randomString(6)}`;
  const execution: ToolExecution = {
    id: executionId,
    userId: session.id,
    toolId,
    inputFileUrl: `gs://salfagpt-uploads/${gcsPath}`,
    inputFileName: inputFile.name,
    inputSizeMB: buffer.length / 1024 / 1024,
    parameters,
    status: 'pending',
    source: 'production',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  await firestore.collection('tool_executions').doc(executionId).set(execution);
  
  // 8. Invoke Cloud Function (async)
  invokeCloudFunction(tool.functionUrl, {
    inputFileUrl: `gs://salfagpt-uploads/${gcsPath}`,
    ...parameters,
    userId: session.id,
    executionId,
  }).catch(error => {
    console.error('Cloud Function invocation failed:', error);
    // Update execution with error
    firestore.collection('tool_executions').doc(executionId).update({
      status: 'failed',
      error: {
        message: error.message,
        code: 'INVOCATION_FAILED'
      },
      updatedAt: new Date(),
    });
  });
  
  // 9. Return immediately (don't wait for completion)
  return new Response(JSON.stringify({
    executionId,
    status: 'pending',
    pollUrl: `/api/tools/status/${executionId}`,
    estimatedTimeSeconds: estimateExecutionTime(tool, buffer.length),
  }), {
    status: 202, // Accepted
    headers: { 'Content-Type': 'application/json' }
  });
};
```

---

### Check Tool Status

**Endpoint:** `GET /api/tools/status/:executionId`

**Response:**
```typescript
{
  executionId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progressPercentage?: number;
  progressMessage?: string;
  startedAt: string;
  completedAt?: string;
  error?: { message: string };
}
```

---

### Get Tool Results

**Endpoint:** `GET /api/tools/results/:executionId`

**Response:**
```typescript
{
  executionId: string;
  status: 'completed';
  outputFiles: [
    {
      url: string; // Signed URL (expires in 24h)
      fileName: string;
      sizeMB: number;
      metadata: { ... }
    }
  ],
  metadata: { ... }
}
```

---

## 🎨 Admin UI: Tool Manager

### Location
Admin Panel → Bottom-left menu → "Tools" button

### UI Structure

```typescript
// src/components/admin/ToolManager.tsx

interface ToolManagerProps {
  currentUser: User;
}

export function ToolManager({ currentUser }: ToolManagerProps) {
  const [tools, setTools] = useState<Tool[]>([]);
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [executions, setExecutions] = useState<ToolExecution[]>([]);
  
  return (
    <div className="h-full flex">
      {/* Left: Tool List */}
      <div className="w-80 border-r border-slate-200 flex flex-col">
        <div className="p-4 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-800">Available Tools</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {tools.map(tool => (
            <button
              key={tool.id}
              onClick={() => setSelectedTool(tool)}
              className={`w-full p-3 rounded-lg border text-left transition-all ${
                selectedTool?.id === tool.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-slate-200 hover:border-blue-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-slate-800">{tool.name}</span>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  tool.enabled ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                }`}>
                  {tool.enabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <p className="text-xs text-slate-600">{tool.description}</p>
            </button>
          ))}
        </div>
      </div>
      
      {/* Right: Tool Details & Configuration */}
      <div className="flex-1 flex flex-col">
        {selectedTool ? (
          <>
            {/* Tool Header */}
            <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-2xl font-bold text-slate-800">{selectedTool.name}</h3>
                  <p className="text-sm text-slate-600 mt-1">{selectedTool.description}</p>
                </div>
                
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedTool.enabled}
                    onChange={() => toggleTool(selectedTool.id)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-checked:bg-green-600 rounded-full peer-focus:ring-2 peer-focus:ring-green-300"></div>
                </label>
              </div>
              
              {/* Quick Stats */}
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-slate-600">Version</p>
                  <p className="font-semibold text-slate-800">{selectedTool.version}</p>
                </div>
                <div>
                  <p className="text-slate-600">Executions</p>
                  <p className="font-semibold text-slate-800">{executions.length}</p>
                </div>
                <div>
                  <p className="text-slate-600">Quota (Month)</p>
                  <p className="font-semibold text-slate-800">
                    {config.quotaUsed}/{config.monthlyQuota}
                  </p>
                </div>
                <div>
                  <p className="text-slate-600">Est. Cost/Use</p>
                  <p className="font-semibold text-slate-800">
                    ${selectedTool.costPer1000Pages?.toFixed(4) || '0.00'}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Tool Configuration */}
            <ToolConfiguration tool={selectedTool} />
            
            {/* Recent Executions */}
            <ToolExecutionHistory executions={executions} />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-400">
            <p>Select a tool to view details</p>
          </div>
        )}
      </div>
    </div>
  );
}
```

---

## 💰 Cost Analysis

### PDF Splitter Tool

**Costs:**
- Cloud Function compute: ~$0.40 per GB-second
- Cloud Storage: $0.02 per GB/month
- Network egress: $0.12 per GB

**Example (300MB PDF):**
- Processing time: ~2.5 min (4GB memory)
- Compute cost: ~$0.007
- Storage (15 chunks for 30 days): ~$0.009
- **Total: ~$0.016 per execution**

**Volume pricing:**
- 100 executions/month: ~$1.60
- 1,000 executions/month: ~$16.00

---

## 📋 Implementation Difficulty Assessment

### ⭐ Difficulty: MEDIUM (6/10)

**Easy Parts:**
1. ✅ Cloud Function deployment (standard GCP pattern)
2. ✅ PDF splitting logic (already exists in vision-extraction.ts)
3. ✅ Firestore schema (straightforward)
4. ✅ API endpoints (standard patterns)

**Medium Difficulty:**
1. ⚠️ GCS signed URL generation (need IAM setup)
2. ⚠️ Async execution tracking (polling/webhooks)
3. ⚠️ Error handling & retries
4. ⚠️ Quota management system

**Challenging Parts:**
1. 🔴 Multimodal embeddings (new Gemini feature)
2. 🔴 Cost optimization (minimize GCS storage)
3. 🔴 Progress reporting (Cloud Function → Firestore)
4. 🔴 UI polish (real-time updates, error recovery)

---

## ⏱️ Estimated Implementation Time

**Phase 1: Core Infrastructure (3-5 days)**
- Firestore schemas
- Cloud Function deployment
- Basic API endpoints

**Phase 2: PDF Splitter Tool (2-3 days)**
- Refactor existing chunking logic
- Deploy Cloud Function
- Test with large PDFs

**Phase 3: Admin UI (3-4 days)**
- Tool Manager component
- Configuration forms
- Execution monitoring

**Phase 4: Document Embedder (4-6 days)**
- Chunking strategy
- Embedding generation
- Vector storage

**Total: 12-18 days** for complete system

---

## 🎯 Recommended Approach

### Option A: Incremental (Recommended ✅)

**Start simple, add complexity:**
1. Week 1: Deploy PDF splitter Cloud Function (reuse existing code)
2. Week 2: Build basic Tool Manager UI (enable/disable, view executions)
3. Week 3: Add embeddings support
4. Week 4: Polish UI, optimize costs, add monitoring

**Pros:**
- Ship value quickly
- Learn from real usage
- Adjust based on feedback
- Lower risk

### Option B: Complete Build

**Build everything upfront:**
- 2-3 weeks of development
- Deploy complete system
- All tools ready

**Pros:**
- Cohesive architecture
- All features at once

**Cons:**
- Longer time to value
- Higher risk of changes
- May build unused features

---

## ✅ My Recommendation

**START WITH PDF SPLITTER TOOL** (Priority 1):

**Why:**
1. ✅ **80% of code already exists** in vision-extraction.ts
2. ✅ **Immediate value** - unblocks 300MB+ PDF uploads
3. ✅ **Low complexity** - proven chunking logic
4. ✅ **Fast to deploy** - 2-3 days max
5. ✅ **Foundation for embeddings** - chunks feed into embedding tool

**Next Steps:**
1. Extract chunking logic to Cloud Function
2. Deploy to Cloud Functions (2nd gen)
3. Create minimal API endpoint
4. Add "Split PDF" button in context upload modal
5. Test with 300MB+ PDF
6. **THEN** build full Tool Manager UI

---

## 🤔 Questions for You

Before I proceed with implementation:

1. **Start with PDF Splitter only?** Or build full Tool Manager infrastructure first?

2. **Cloud Function region:** `us-central1` (same as Cloud Run)?

3. **Storage bucket:** Reuse existing or create new `salfagpt-tool-outputs`?

4. **Quota defaults:** 
   - Free tier: 5 executions/user/month?
   - Paid tier: 50 executions/user/month?

5. **UI placement:** 
   - Admin Panel → "Tools" tab? OR
   - Context upload modal → "Advanced Tools" section?

6. **Priority order:**
   - PDF Splitter → Embedder → Tool Manager UI?
   - Tool Manager UI → PDF Splitter → Embedder?

**My recommendation:** Start with PDF Splitter Cloud Function + minimal API, get it working with real 300MB PDF, THEN build full Tool Manager UI if needed. This gives fastest time-to-value.

What would you like me to build first? 🚀
