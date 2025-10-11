// Types for Context Management and Workflows

export type SourceType = 'pdf-text' | 'pdf-images' | 'pdf-tables' | 'csv' | 'excel' | 'word' | 'folder' | 'web-url' | 'api';

export interface ContextSource {
  id: string;
  name: string;
  type: SourceType;
  enabled: boolean;
  status: 'active' | 'processing' | 'error' | 'disabled';
  addedAt: Date;
  metadata?: {
    fileSize?: number;
    pageCount?: number;
    url?: string;
    apiEndpoint?: string;
  };
  extractedData?: string;
}

export interface WorkflowConfig {
  maxFileSize?: number; // in MB
  maxOutputLength?: number; // in tokens
  extractImages?: boolean;
  extractTables?: boolean;
  ocrEnabled?: boolean;
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
    name: 'Extraer Texto PDF',
    description: 'Extrae todo el texto de documentos PDF',
    sourceType: 'pdf-text',
    icon: '📄',
    config: {
      maxFileSize: 50,
      maxOutputLength: 10000,
      extractImages: false,
      extractTables: false,
    },
  },
  {
    name: 'Analizar PDF con Imágenes',
    description: 'Procesa PDFs con contenido visual usando OCR',
    sourceType: 'pdf-images',
    icon: '🖼️',
    config: {
      maxFileSize: 100,
      maxOutputLength: 15000,
      extractImages: true,
      ocrEnabled: true,
    },
  },
  {
    name: 'Extraer Tablas de PDF',
    description: 'Identifica y extrae tablas estructuradas',
    sourceType: 'pdf-tables',
    icon: '📊',
    config: {
      maxFileSize: 50,
      maxOutputLength: 20000,
      extractTables: true,
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

