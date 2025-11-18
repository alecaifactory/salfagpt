/**
 * Upload Limits Information Component
 * Displays clear, user-friendly information about upload limits
 * 
 * Shows before upload to set proper expectations
 */

import React from 'react';
import { AlertCircle, Info, FileText, Clock, HardDrive } from 'lucide-react';
import {
  FILE_SIZE_LIMITS,
  BATCH_LIMITS,
  formatFileSize,
  formatEstimatedTime,
  PROCESSING_TIME_ESTIMATES,
} from '../lib/upload-limits';

interface UploadLimitsInfoProps {
  variant?: 'compact' | 'detailed';
  showBatchLimits?: boolean;
}

export default function UploadLimitsInfo({
  variant = 'compact',
  showBatchLimits = false,
}: UploadLimitsInfoProps) {
  
  if (variant === 'compact') {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-blue-800">
            <p className="font-semibold mb-1">Límites de Carga</p>
            <ul className="space-y-0.5 text-blue-700">
              <li>• Tamaño máximo por archivo: <strong>{FILE_SIZE_LIMITS.ABSOLUTE_MAX_MB} MB</strong></li>
              <li>• Recomendado: <strong>≤{FILE_SIZE_LIMITS.RECOMMENDED_MAX_MB} MB</strong> (procesamiento más rápido)</li>
              {showBatchLimits && (
                <>
                  <li>• Máximo por lote: <strong>{BATCH_LIMITS.MAX_FILES_PER_BATCH} archivos</strong></li>
                  <li>• Tamaño total del lote: <strong>≤{BATCH_LIMITS.MAX_BATCH_SIZE_GB} GB</strong></li>
                </>
              )}
            </ul>
          </div>
        </div>
      </div>
    );
  }
  
  // Detailed view
  return (
    <div className="space-y-4">
      {/* File Size Limits */}
      <div className="bg-white border-2 border-slate-200 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <HardDrive className="w-5 h-5 text-blue-600" />
          <h3 className="font-bold text-slate-800">Límites de Tamaño de Archivo</h3>
        </div>
        
        <div className="space-y-2 text-sm">
          {/* Comfortable size */}
          <div className="flex items-start gap-3 p-2 bg-green-50 border border-green-200 rounded-lg">
            <div className="w-2 h-2 rounded-full bg-green-600 mt-1.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-semibold text-green-800">
                Óptimo: ≤{FILE_SIZE_LIMITS.COMFORTABLE_UPLOAD_MB} MB
              </p>
              <p className="text-green-700 text-xs mt-0.5">
                Procesamiento rápido (~{PROCESSING_TIME_ESTIMATES.VISION_API_PER_MB * 20} segundos)
              </p>
            </div>
          </div>
          
          {/* Vision API limit */}
          <div className="flex items-start gap-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="w-2 h-2 rounded-full bg-yellow-600 mt-1.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-semibold text-yellow-800">
                Aceptable: {FILE_SIZE_LIMITS.COMFORTABLE_UPLOAD_MB}-{FILE_SIZE_LIMITS.VISION_API_MAX_MB} MB
              </p>
              <p className="text-yellow-700 text-xs mt-0.5">
                Procesamiento moderado (~2-4 minutos)
              </p>
            </div>
          </div>
          
          {/* Recommended maximum */}
          <div className="flex items-start gap-3 p-2 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="w-2 h-2 rounded-full bg-orange-600 mt-1.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-semibold text-orange-800">
                Grande: {FILE_SIZE_LIMITS.VISION_API_MAX_MB}-{FILE_SIZE_LIMITS.RECOMMENDED_MAX_MB} MB
              </p>
              <p className="text-orange-700 text-xs mt-0.5">
                Requiere confirmación, procesamiento lento (5-15 minutos)
              </p>
            </div>
          </div>
          
          {/* Absolute maximum */}
          <div className="flex items-start gap-3 p-2 bg-red-50 border border-red-200 rounded-lg">
            <div className="w-2 h-2 rounded-full bg-red-600 mt-1.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-semibold text-red-800">
                Máximo Absoluto: {FILE_SIZE_LIMITS.ABSOLUTE_MAX_MB} MB
              </p>
              <p className="text-red-700 text-xs mt-0.5">
                Archivos mayores serán rechazados para evitar problemas de sistema
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Batch Limits */}
      {showBatchLimits && (
        <div className="bg-white border-2 border-slate-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-5 h-5 text-purple-600" />
            <h3 className="font-bold text-slate-800">Límites de Operaciones en Lote</h3>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-3 p-2 bg-slate-50 rounded-lg">
              <div className="w-2 h-2 rounded-full bg-slate-600 mt-1.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-slate-800">
                  Máximo {BATCH_LIMITS.MAX_FILES_PER_BATCH} archivos por lote
                </p>
                <p className="text-slate-600 text-xs mt-0.5">
                  Si tienes más archivos, súbelos en múltiples lotes
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-2 bg-slate-50 rounded-lg">
              <div className="w-2 h-2 rounded-full bg-slate-600 mt-1.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-slate-800">
                  Tamaño total máximo: {BATCH_LIMITS.MAX_BATCH_SIZE_GB} GB por lote
                </p>
                <p className="text-slate-600 text-xs mt-0.5">
                  Suma total de todos los archivos en un lote
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-2 bg-slate-50 rounded-lg">
              <div className="w-2 h-2 rounded-full bg-slate-600 mt-1.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-slate-800">
                  Procesamiento simultáneo: {BATCH_LIMITS.MAX_CONCURRENT_UPLOADS} archivos
                </p>
                <p className="text-slate-600 text-xs mt-0.5">
                  Archivos adicionales esperan en cola
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Processing Time */}
      <div className="bg-white border-2 border-slate-200 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-5 h-5 text-indigo-600" />
          <h3 className="font-bold text-slate-800">Tiempos de Procesamiento Estimados</h3>
        </div>
        
        <div className="space-y-2 text-sm">
          <div className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
            <span className="text-slate-700">Archivo pequeño (≤20 MB):</span>
            <span className="font-semibold text-slate-800">30-60 segundos</span>
          </div>
          
          <div className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
            <span className="text-slate-700">Archivo mediano (20-40 MB):</span>
            <span className="font-semibold text-slate-800">1-3 minutos</span>
          </div>
          
          <div className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
            <span className="text-slate-700">Archivo grande (40-100 MB):</span>
            <span className="font-semibold text-slate-800">3-8 minutos</span>
          </div>
          
          <div className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
            <span className="text-slate-700">Archivo muy grande (100-500 MB):</span>
            <span className="font-semibold text-slate-800">8-15 minutos</span>
          </div>
        </div>
        
        <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800">
          <p className="flex items-start gap-2">
            <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>
              Los tiempos son estimados. Archivos complejos con muchas imágenes o tablas pueden tomar más tiempo.
            </span>
          </p>
        </div>
      </div>
      
      {/* Supported Formats */}
      <div className="bg-white border-2 border-slate-200 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <FileText className="w-5 h-5 text-green-600" />
          <h3 className="font-bold text-slate-800">Formatos Soportados</h3>
        </div>
        
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-lg">
            <span className="text-lg">📄</span>
            <div>
              <p className="font-semibold text-green-800">PDF</p>
              <p className="text-green-700 text-xs">.pdf</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
            <span className="text-lg">🖼️</span>
            <div>
              <p className="font-semibold text-blue-800">Imágenes</p>
              <p className="text-blue-700 text-xs">.png, .jpg, .jpeg</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 p-2 bg-purple-50 border border-purple-200 rounded-lg">
            <span className="text-lg">📊</span>
            <div>
              <p className="font-semibold text-purple-800">Excel</p>
              <p className="text-purple-700 text-xs">.xlsx, .xls</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 p-2 bg-indigo-50 border border-indigo-200 rounded-lg">
            <span className="text-lg">📝</span>
            <div>
              <p className="font-semibold text-indigo-800">Word</p>
              <p className="text-indigo-700 text-xs">.docx, .doc</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * File Validation Warning Component
 * Shows warnings for files that are valid but may have issues
 */
interface FileValidationWarningProps {
  warnings: string[];
  severity?: 'info' | 'warning' | 'error';
}

export function FileValidationWarning({
  warnings,
  severity = 'warning',
}: FileValidationWarningProps) {
  
  const config = {
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-800',
      icon: <Info className="w-5 h-5 text-blue-600" />,
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-800',
      icon: <AlertCircle className="w-5 h-5 text-yellow-600" />,
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-800',
      icon: <AlertCircle className="w-5 h-5 text-red-600" />,
    },
  }[severity];
  
  return (
    <div className={`${config.bg} border ${config.border} rounded-lg p-4`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          {config.icon}
        </div>
        <div className="flex-1">
          <h4 className={`font-semibold ${config.text} mb-2`}>
            {severity === 'error' ? 'Error' : severity === 'warning' ? 'Advertencias' : 'Información'}
          </h4>
          <ul className={`space-y-1 text-sm ${config.text}`}>
            {warnings.map((warning, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="flex-shrink-0 mt-1">•</span>
                <span>{warning}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

/**
 * Batch Upload Summary Component
 * Shows summary before starting batch upload
 */
interface BatchUploadSummaryProps {
  fileCount: number;
  totalSizeBytes: number;
  estimatedTimeSeconds: number;
  onProceed: () => void;
  onCancel: () => void;
}

export function BatchUploadSummary({
  fileCount,
  totalSizeBytes,
  estimatedTimeSeconds,
  onProceed,
  onCancel,
}: BatchUploadSummaryProps) {
  
  const totalSizeMB = totalSizeBytes / (1024 * 1024);
  const totalSizeGB = totalSizeBytes / (1024 * 1024 * 1024);
  const displaySize = totalSizeGB >= 1 
    ? `${totalSizeGB.toFixed(2)} GB` 
    : `${totalSizeMB.toFixed(0)} MB`;
  
  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-xl p-6">
      <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
        <FileText className="w-6 h-6 text-blue-600" />
        Resumen de Carga
      </h3>
      
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="bg-white rounded-lg p-3 border border-blue-200">
          <p className="text-xs text-slate-600 mb-1">Archivos</p>
          <p className="text-2xl font-bold text-blue-600">{fileCount}</p>
        </div>
        
        <div className="bg-white rounded-lg p-3 border border-blue-200">
          <p className="text-xs text-slate-600 mb-1">Tamaño Total</p>
          <p className="text-2xl font-bold text-purple-600">{displaySize}</p>
        </div>
        
        <div className="bg-white rounded-lg p-3 border border-blue-200">
          <p className="text-xs text-slate-600 mb-1">Tiempo Estimado</p>
          <p className="text-2xl font-bold text-indigo-600">
            {formatEstimatedTime(estimatedTimeSeconds)}
          </p>
        </div>
      </div>
      
      <div className="bg-white border border-blue-200 rounded-lg p-4 mb-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-slate-700">
            <p className="font-semibold mb-2">Lo que sucederá:</p>
            <ul className="space-y-1">
              <li className="flex items-center gap-2">
                <span className="text-green-600">1.</span>
                <span>Los archivos se procesarán en grupos de {BATCH_LIMITS.MAX_CONCURRENT_UPLOADS}</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-600">2.</span>
                <span>Cada archivo se subirá a Cloud Storage primero (seguro)</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-600">3.</span>
                <span>Se extraerá el contenido con Gemini AI</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-600">4.</span>
                <span>El texto se guardará en Firestore</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-600">5.</span>
                <span>Podrás ver el progreso en tiempo real</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
      
      {estimatedTimeSeconds > 300 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 text-sm">
          <div className="flex items-start gap-2">
            <Clock className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
            <p className="text-yellow-800">
              <strong>Nota:</strong> El procesamiento tomará varios minutos. Puedes continuar trabajando en otras pestañas mientras procesa.
            </p>
          </div>
        </div>
      )}
      
      <div className="flex gap-3">
        <button
          onClick={onProceed}
          className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold flex items-center justify-center gap-2 transition-colors"
        >
          <FileText className="w-5 h-5" />
          Iniciar Carga de {fileCount} Archivo{fileCount > 1 ? 's' : ''}
        </button>
        
        <button
          onClick={onCancel}
          className="px-6 py-3 border-2 border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-semibold transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

