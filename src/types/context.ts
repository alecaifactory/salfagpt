// Types for Context Management and Workflows

export type SourceType = 'pdf' | 'csv' | 'excel' | 'word' | 'folder' | 'web-url' | 'api';

export interface ExtractionMetadata {
  // Original file info
  originalFileName?: string;
  originalFileType?: string;
  originalFileSize?: number;
  
  // Extraction details
  workflowId?: string;
  workflowName?: string;
  extractionConfig?: WorkflowConfig;
  extractionDate?: Date;
  extractionTime?: number; // milliseconds
  extractedAt?: string; // ISO date string
  model?: string; // AI model used
  
  // Upload source tracking (CLI vs Webapp)
  uploadedVia?: 'cli' | 'webapp'; // How the file was uploaded
  cliVersion?: string; // CLI version if uploaded via CLI
  userEmail?: string; // Email of uploader (for attribution)
  gcsPath?: string; // ✅ CRITICAL: GCS path to original file
  
  // Output details
  charactersExtracted?: number;
  tokensEstimate?: number;
  modelUsed?: string;
  
  // Token usage (actual, from API response)
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  
  // Cost breakdown (calculated from official pricing)
  inputCost?: number;      // USD
  outputCost?: number;     // USD
  totalCost?: number;      // USD
  costFormatted?: string;  // Formatted as $0.0123
  
  // Quality metadata
  pageCount?: number;
  url?: string;
  apiEndpoint?: string;
  
  // Validation metadata
  validated?: boolean;
  validatedBy?: string; // User email or ID
  validatedAt?: Date;
  validationNotes?: string;
  
  // Cloud Storage reference (NEW)
  storagePath?: string;      // Path in Cloud Storage
  bucketName?: string;       // Bucket name
  originalFileUrl?: string;  // Public URL
  
  // Chunking/RAG history (NEW - 2025-10-19)
  chunkingHistory?: Array<{
    timestamp: Date;
    userId: string;
    userName?: string;
    method: 'initial' | 'reindex' | 'auto';
    chunksCreated: number;
    embeddingModel: string;
    duration: number; // milliseconds
    success: boolean;
    error?: string;
  }>;
}

export interface ContextSource {
  id: string;
  name: string;
  type: SourceType;
  enabled: boolean;
  status: 'active' | 'processing' | 'error' | 'disabled';
  addedAt: Date;
  metadata?: ExtractionMetadata;
  extractedData?: string;
  
  // For re-extraction
  originalFile?: File;
  originalFileUrl?: string; // Cloud Storage URL for viewing/downloading
  
  // Agent assignment
  assignedToAgents?: string[]; // Conversation IDs this source is assigned to
  
  // Tags (system-level, e.g., PUBLIC for auto-assignment to new agents)
  tags?: string[]; // System tags (e.g., "PUBLIC", "PRIVATE", "RESTRICTED")
  
  // Labels and qualification (for expert review)
  labels?: string[]; // User-defined labels (e.g., "CV", "Contrato", "Manual")
  qualityRating?: number; // 1-5 stars
  qualityNotes?: string; // Expert notes on quality
  
  // Expert certification
  certified?: boolean; // Expert has certified this extraction
  certifiedBy?: string; // Email or userId of certifier
  certifiedAt?: Date; // When it was certified
  certificationNotes?: string; // Notes from certifier
  
  // RAG configuration (NEW)
  ragEnabled?: boolean; // Whether RAG is enabled for this source
  ragMetadata?: {
    chunkCount?: number;
    avgChunkSize?: number;
    indexedAt?: Date;
    embeddingModel?: string;
  };
  useRAGMode?: boolean; // User preference: use RAG (true) or full-text (false) for this source
  
  // Progress tracking
  progress?: {
    stage: 'uploading' | 'processing' | 'complete' | 'error';
    percentage: number;
    message: string;
    startTime?: number; // Timestamp when processing started
    elapsedSeconds?: number; // Elapsed time in seconds
    estimatedCost?: number; // Estimated cost so far
  };
  
  // Pipeline logs (NEW - detailed step tracking)
  pipelineLogs?: PipelineLog[];
  
  // Indexing history (NEW - track all indexing attempts)
  indexingHistory?: Array<{
    timestamp: Date;
    userId: string;
    userName?: string;
    method: 'initial' | 'reindex' | 'auto';
    chunksCreated: number;
    embeddingModel: string;
    duration: number; // milliseconds
    success: boolean;
    error?: string;
  }>;
  
  // Usage history (NEW - track when chunks are used in conversations)
  usageHistory?: Array<{
    timestamp: Date;
    conversationId: string;
    conversationTitle?: string;
    userId: string;
    userName?: string;
    chunksUsed: number; // How many chunks were selected
    avgSimilarity: number; // Average similarity score
    query: string; // User's question
    chunkIndices?: number[]; // Which specific chunks were used
  }>;
  
  // Error details
  error?: {
    message: string;
    details?: string;
    timestamp: Date;
    suggestions?: string[]; // Specific suggestions to fix the error
  };
  
  // Citations (for referencing in responses)
  citations?: Citation[];
}

export interface Citation {
  id: string;
  sourceId: string;
  sourceName: string;
  excerpt: string; // The specific text passage cited
  pageNumber?: number;
  startChar?: number; // Position in extractedData
  endChar?: number;
  confidence?: number; // 0-1 score of relevance
}

export interface WorkflowConfig {
  maxFileSize?: number; // in MB
  maxOutputLength?: number; // in tokens
  language?: string;
  model?: 'gemini-2.5-flash' | 'gemini-2.5-pro'; // AI model for extraction
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  sourceType: SourceType;
  icon: string;
  status: 'available' | 'running' | 'completed' | 'failed';
  config: WorkflowConfig;
  output?: string;
  startedAt?: Date;
  completedAt?: Date;
  isTemplate?: boolean;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  workflow: Workflow;
  createdAt: Date;
}

// Default workflow configurations
export const DEFAULT_WORKFLOWS: Omit<Workflow, 'id' | 'status'>[] = [
  {
    name: 'Procesar PDF',
    description: 'Extrae texto, tablas e imágenes (descritas como texto) automáticamente',
    sourceType: 'pdf',
    icon: '📄',
    config: {
      maxFileSize: 50,
      maxOutputLength: 20000,
      model: 'gemini-2.5-flash', // Default to Flash, can upgrade to Pro in settings
    },
  },
  {
    name: 'Procesar CSV',
    description: 'Lee y analiza archivos CSV',
    sourceType: 'csv',
    icon: '📈',
    config: {
      maxFileSize: 20,
      maxOutputLength: 50000,
    },
  },
  {
    name: 'Analizar Excel',
    description: 'Procesa hojas de cálculo Excel',
    sourceType: 'excel',
    icon: '📊',
    config: {
      maxFileSize: 50,
      maxOutputLength: 50000,
    },
  },
  {
    name: 'Extraer Texto de Word',
    description: 'Lee documentos de Microsoft Word',
    sourceType: 'word',
    icon: '📝',
    config: {
      maxFileSize: 30,
      maxOutputLength: 15000,
    },
  },
  {
    name: 'Indexar Carpeta',
    description: 'Procesa todos los archivos en una carpeta',
    sourceType: 'folder',
    icon: '📁',
    config: {
      maxFileSize: 200,
      maxOutputLength: 100000,
    },
  },
];

// Pipeline execution log entry
export interface PipelineLog {
  step: 'upload' | 'extract' | 'chunk' | 'embed' | 'complete';
  status: 'pending' | 'in_progress' | 'success' | 'error';
  startTime: Date;
  endTime?: Date;
  duration?: number; // milliseconds
  message: string;
  details?: {
    // Upload step
    fileSize?: number;
    storagePath?: string;
    
    // Extract step
    model?: string;
    inputTokens?: number;
    outputTokens?: number;
    charactersExtracted?: number;
    cost?: number;
    
    // Chunk step
    chunkCount?: number;
    avgChunkSize?: number;
    
    // Embed step
    embeddingCount?: number;
    embeddingModel?: string;
    
    // Error details
    error?: string;
    suggestions?: string[];
  };
}

