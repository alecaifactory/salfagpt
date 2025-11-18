/**
 * Upload Limits & Validation System
 * Centralized configuration for file upload limits and batch operation constraints
 * 
 * Purpose: Ensure reliable and stable document uploads with clear user communication
 * Created: 2025-11-18
 */

// ============================================================================
// FILE SIZE LIMITS
// ============================================================================

export const FILE_SIZE_LIMITS = {
  // Individual file limits
  ABSOLUTE_MAX_MB: 500,              // Hard limit - prevents system crashes
  RECOMMENDED_MAX_MB: 100,           // Soft limit - requires user confirmation
  VISION_API_MAX_MB: 40,             // Vision API optimized limit
  COMFORTABLE_UPLOAD_MB: 20,         // Best user experience
  
  // In bytes (for validation)
  ABSOLUTE_MAX_BYTES: 500 * 1024 * 1024,
  RECOMMENDED_MAX_BYTES: 100 * 1024 * 1024,
  VISION_API_MAX_BYTES: 40 * 1024 * 1024,
  COMFORTABLE_UPLOAD_BYTES: 20 * 1024 * 1024,
} as const;

// ============================================================================
// BATCH OPERATION LIMITS
// ============================================================================

export const BATCH_LIMITS = {
  // Concurrent operations
  MAX_CONCURRENT_UPLOADS: 3,         // Maximum files processing simultaneously
  MAX_QUEUE_SIZE: 50,                // Maximum files in upload queue
  
  // Total batch constraints
  MAX_BATCH_SIZE_GB: 2,              // Maximum total size per batch (2GB)
  MAX_FILES_PER_BATCH: 20,           // Maximum files per batch operation
  
  // Rate limiting
  MAX_UPLOADS_PER_MINUTE: 10,        // Rate limit per user per minute
  MAX_UPLOADS_PER_HOUR: 100,         // Rate limit per user per hour
} as const;

// ============================================================================
// PROCESSING TIME ESTIMATES
// ============================================================================

export const PROCESSING_TIME_ESTIMATES = {
  // Per MB, in seconds (conservative estimates)
  VISION_API_PER_MB: 3,              // ~3 seconds per MB with Vision API
  GEMINI_PER_MB: 8,                  // ~8 seconds per MB with Gemini extraction
  
  // Base overhead
  UPLOAD_BASE_SECONDS: 2,            // Base upload time
  STORAGE_SAVE_SECONDS: 1,           // Save to Cloud Storage
  FIRESTORE_SAVE_SECONDS: 0.5,       // Save to Firestore
  
  // Timeouts
  SMALL_FILE_TIMEOUT_SECONDS: 60,    // <20MB files
  MEDIUM_FILE_TIMEOUT_SECONDS: 300,  // 20-100MB files
  LARGE_FILE_TIMEOUT_SECONDS: 900,   // 100-500MB files (15 min)
} as const;

// ============================================================================
// SUPPORTED FILE TYPES
// ============================================================================

export const SUPPORTED_FILE_TYPES = {
  PDF: {
    mimeTypes: ['application/pdf'],
    extensions: ['.pdf'],
    displayName: 'PDF',
    icon: '📄',
  },
  IMAGE: {
    mimeTypes: ['image/png', 'image/jpeg', 'image/jpg'],
    extensions: ['.png', '.jpg', '.jpeg'],
    displayName: 'Imagen',
    icon: '🖼️',
  },
  EXCEL: {
    mimeTypes: [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ],
    extensions: ['.xlsx', '.xls'],
    displayName: 'Excel',
    icon: '📊',
  },
  WORD: {
    mimeTypes: [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
    ],
    extensions: ['.docx', '.doc'],
    displayName: 'Word',
    icon: '📝',
  },
} as const;

// Get all supported MIME types
export const ALL_SUPPORTED_MIME_TYPES = Object.values(SUPPORTED_FILE_TYPES)
  .flatMap(type => type.mimeTypes);

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  errorCode?: string;
  warnings?: string[];
  estimatedProcessingTime?: number;  // in seconds
  recommendedMethod?: 'vision-api' | 'gemini';
}

/**
 * Validate a single file upload
 */
export function validateFile(file: File): FileValidationResult {
  const fileSizeMB = file.size / (1024 * 1024);
  const warnings: string[] = [];
  
  // 1. Check file type
  if (!ALL_SUPPORTED_MIME_TYPES.includes(file.type)) {
    const supportedNames = Object.values(SUPPORTED_FILE_TYPES)
      .map(t => t.displayName)
      .join(', ');
    
    return {
      valid: false,
      error: `Tipo de archivo no soportado. Tipos válidos: ${supportedNames}`,
      errorCode: 'INVALID_FILE_TYPE',
    };
  }
  
  // 2. Check absolute maximum size
  if (file.size > FILE_SIZE_LIMITS.ABSOLUTE_MAX_BYTES) {
    return {
      valid: false,
      error: `Archivo demasiado grande: ${fileSizeMB.toFixed(1)} MB. Máximo absoluto: ${FILE_SIZE_LIMITS.ABSOLUTE_MAX_MB} MB`,
      errorCode: 'FILE_TOO_LARGE',
      warnings: [
        'Reduce el tamaño del archivo o divídelo en partes más pequeñas',
        'Puedes comprimir PDFs con Adobe Acrobat u otras herramientas',
      ],
    };
  }
  
  // 3. Check recommended maximum (requires confirmation)
  if (file.size > FILE_SIZE_LIMITS.RECOMMENDED_MAX_BYTES) {
    warnings.push(
      `⚠️ Archivo grande: ${fileSizeMB.toFixed(1)} MB (>100 MB)`,
      'El procesamiento tomará 5-15 minutos',
      'Se usará extracción Gemini (más lenta pero más robusta)',
    );
  }
  
  // 4. Estimate processing time
  const isLargeFile = file.size > FILE_SIZE_LIMITS.VISION_API_MAX_BYTES;
  const secondsPerMB = isLargeFile 
    ? PROCESSING_TIME_ESTIMATES.GEMINI_PER_MB 
    : PROCESSING_TIME_ESTIMATES.VISION_API_PER_MB;
  
  const estimatedProcessingTime = 
    PROCESSING_TIME_ESTIMATES.UPLOAD_BASE_SECONDS +
    PROCESSING_TIME_ESTIMATES.STORAGE_SAVE_SECONDS +
    (fileSizeMB * secondsPerMB) +
    PROCESSING_TIME_ESTIMATES.FIRESTORE_SAVE_SECONDS;
  
  // 5. Recommend extraction method
  const recommendedMethod = isLargeFile ? 'gemini' : 'vision-api';
  
  // 6. Add size-based warnings
  if (file.size > FILE_SIZE_LIMITS.COMFORTABLE_UPLOAD_BYTES) {
    warnings.push(
      `Archivo grande detectado: ${fileSizeMB.toFixed(1)} MB`,
      `Tiempo estimado de procesamiento: ${Math.ceil(estimatedProcessingTime / 60)} minutos`,
    );
  }
  
  return {
    valid: true,
    warnings: warnings.length > 0 ? warnings : undefined,
    estimatedProcessingTime: Math.ceil(estimatedProcessingTime),
    recommendedMethod,
  };
}

/**
 * Validate a batch upload operation
 */
export function validateBatch(files: File[]): FileValidationResult {
  // 1. Check batch size (number of files)
  if (files.length > BATCH_LIMITS.MAX_FILES_PER_BATCH) {
    return {
      valid: false,
      error: `Demasiados archivos: ${files.length}. Máximo por lote: ${BATCH_LIMITS.MAX_FILES_PER_BATCH}`,
      errorCode: 'BATCH_TOO_LARGE',
      warnings: [
        `Divide tu carga en lotes de ${BATCH_LIMITS.MAX_FILES_PER_BATCH} archivos o menos`,
      ],
    };
  }
  
  // 2. Check total batch size
  const totalSizeBytes = files.reduce((sum, f) => sum + f.size, 0);
  const totalSizeGB = totalSizeBytes / (1024 * 1024 * 1024);
  const maxBatchGB = BATCH_LIMITS.MAX_BATCH_SIZE_GB;
  
  if (totalSizeGB > maxBatchGB) {
    return {
      valid: false,
      error: `Lote demasiado grande: ${totalSizeGB.toFixed(2)} GB. Máximo: ${maxBatchGB} GB`,
      errorCode: 'BATCH_SIZE_EXCEEDED',
      warnings: [
        'Reduce el número de archivos o el tamaño de los archivos',
        `Tamaño actual: ${files.length} archivos, ${totalSizeGB.toFixed(2)} GB`,
      ],
    };
  }
  
  // 3. Validate each file
  const invalidFiles: Array<{ name: string; reason: string }> = [];
  
  for (const file of files) {
    const validation = validateFile(file);
    if (!validation.valid) {
      invalidFiles.push({
        name: file.name,
        reason: validation.error || 'Error desconocido',
      });
    }
  }
  
  if (invalidFiles.length > 0) {
    return {
      valid: false,
      error: `${invalidFiles.length} archivo(s) inválido(s)`,
      errorCode: 'INVALID_FILES_IN_BATCH',
      warnings: invalidFiles.map(f => `${f.name}: ${f.reason}`),
    };
  }
  
  // 4. Estimate total processing time
  const totalProcessingTime = files.reduce((sum, file) => {
    const validation = validateFile(file);
    return sum + (validation.estimatedProcessingTime || 0);
  }, 0);
  
  const warnings: string[] = [];
  
  if (totalProcessingTime > 300) { // >5 minutes
    warnings.push(
      `⏱️ Tiempo estimado total: ${Math.ceil(totalProcessingTime / 60)} minutos`,
      'El procesamiento continuará en segundo plano',
      'Recibirás una notificación cuando complete',
    );
  }
  
  if (files.length > 10) {
    warnings.push(
      `📦 Lote grande: ${files.length} archivos`,
      `Procesamiento en grupos de ${BATCH_LIMITS.MAX_CONCURRENT_UPLOADS} simultáneos`,
    );
  }
  
  return {
    valid: true,
    warnings: warnings.length > 0 ? warnings : undefined,
    estimatedProcessingTime: totalProcessingTime,
  };
}

/**
 * Get user-friendly file size display
 */
export function formatFileSize(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  const gb = bytes / (1024 * 1024 * 1024);
  
  if (gb >= 1) {
    return `${gb.toFixed(2)} GB`;
  }
  return `${mb.toFixed(1)} MB`;
}

/**
 * Get estimated processing time display
 */
export function formatEstimatedTime(seconds: number): string {
  if (seconds < 60) {
    return `~${Math.ceil(seconds)} segundos`;
  }
  
  const minutes = Math.ceil(seconds / 60);
  if (minutes < 60) {
    return `~${minutes} minuto${minutes > 1 ? 's' : ''}`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `~${hours} hora${hours > 1 ? 's' : ''}${remainingMinutes > 0 ? ` ${remainingMinutes} min` : ''}`;
}

/**
 * Get timeout for file based on size
 */
export function getTimeoutForFile(fileSizeBytes: number): number {
  if (fileSizeBytes <= FILE_SIZE_LIMITS.COMFORTABLE_UPLOAD_BYTES) {
    return PROCESSING_TIME_ESTIMATES.SMALL_FILE_TIMEOUT_SECONDS * 1000;
  }
  
  if (fileSizeBytes <= FILE_SIZE_LIMITS.RECOMMENDED_MAX_BYTES) {
    return PROCESSING_TIME_ESTIMATES.MEDIUM_FILE_TIMEOUT_SECONDS * 1000;
  }
  
  return PROCESSING_TIME_ESTIMATES.LARGE_FILE_TIMEOUT_SECONDS * 1000;
}

/**
 * Check if file type is supported
 */
export function isFileTypeSupported(mimeType: string): boolean {
  return ALL_SUPPORTED_MIME_TYPES.includes(mimeType);
}

/**
 * Get file type display info
 */
export function getFileTypeInfo(mimeType: string) {
  for (const [key, type] of Object.entries(SUPPORTED_FILE_TYPES)) {
    if (type.mimeTypes.includes(mimeType)) {
      return type;
    }
  }
  return null;
}

// ============================================================================
// RATE LIMITING (User-level)
// ============================================================================

interface RateLimitState {
  uploads: Array<{ timestamp: number }>;
}

const userRateLimits = new Map<string, RateLimitState>();

/**
 * Check if user can upload (rate limiting)
 */
export function canUserUpload(userId: string): {
  allowed: boolean;
  reason?: string;
  retryAfter?: number; // seconds
} {
  const now = Date.now();
  const state = userRateLimits.get(userId) || { uploads: [] };
  
  // Clean old uploads (>1 hour)
  state.uploads = state.uploads.filter(
    u => now - u.timestamp < 60 * 60 * 1000
  );
  
  // Check per-minute limit
  const lastMinuteUploads = state.uploads.filter(
    u => now - u.timestamp < 60 * 1000
  );
  
  if (lastMinuteUploads.length >= BATCH_LIMITS.MAX_UPLOADS_PER_MINUTE) {
    const oldestUpload = Math.min(...lastMinuteUploads.map(u => u.timestamp));
    const retryAfter = Math.ceil((oldestUpload + 60 * 1000 - now) / 1000);
    
    return {
      allowed: false,
      reason: `Límite de ${BATCH_LIMITS.MAX_UPLOADS_PER_MINUTE} cargas por minuto alcanzado`,
      retryAfter,
    };
  }
  
  // Check per-hour limit
  if (state.uploads.length >= BATCH_LIMITS.MAX_UPLOADS_PER_HOUR) {
    const oldestUpload = Math.min(...state.uploads.map(u => u.timestamp));
    const retryAfter = Math.ceil((oldestUpload + 60 * 60 * 1000 - now) / 1000);
    
    return {
      allowed: false,
      reason: `Límite de ${BATCH_LIMITS.MAX_UPLOADS_PER_HOUR} cargas por hora alcanzado`,
      retryAfter,
    };
  }
  
  return { allowed: true };
}

/**
 * Record user upload (for rate limiting)
 */
export function recordUserUpload(userId: string): void {
  const state = userRateLimits.get(userId) || { uploads: [] };
  state.uploads.push({ timestamp: Date.now() });
  userRateLimits.set(userId, state);
}

/**
 * Get user upload stats (for UI display)
 */
export function getUserUploadStats(userId: string): {
  uploadsLastMinute: number;
  uploadsLastHour: number;
  remainingMinute: number;
  remainingHour: number;
} {
  const now = Date.now();
  const state = userRateLimits.get(userId) || { uploads: [] };
  
  const lastMinute = state.uploads.filter(
    u => now - u.timestamp < 60 * 1000
  ).length;
  
  const lastHour = state.uploads.filter(
    u => now - u.timestamp < 60 * 60 * 1000
  ).length;
  
  return {
    uploadsLastMinute: lastMinute,
    uploadsLastHour: lastHour,
    remainingMinute: BATCH_LIMITS.MAX_UPLOADS_PER_MINUTE - lastMinute,
    remainingHour: BATCH_LIMITS.MAX_UPLOADS_PER_HOUR - lastHour,
  };
}

