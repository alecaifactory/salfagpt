// Intelligent document extractors using Gemini AI
import type { WorkflowConfig } from '../types/context';

// PDF extraction using Gemini AI (text, tables, and image descriptions)
export async function extractPdf(file: File, config?: WorkflowConfig): Promise<string> {
  try {
    // Call our API endpoint that uses Gemini AI
    const formData = new FormData();
    formData.append('file', file);
    formData.append('model', config?.model || 'gemini-2.5-flash');

    const response = await fetch('/api/extract-document', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.details || error.error || 'Failed to extract document');
    }

    const result = await response.json();
    
    if (!result.success) {
      // ✅ Enhanced error with suggestions
      const suggestions = result.suggestions || [
        'Intenta con modelo Pro',
        'Verifica que el PDF tenga texto seleccionable',
        'Aumenta el límite de tokens en configuración'
      ];
      
      let errorMessage = result.error || 'Extraction failed';
      if (result.details) {
        errorMessage += `\n\n${result.details}`;
      }
      if (suggestions.length > 0) {
        errorMessage += '\n\nSugerencias:\n' + suggestions.map((s: string) => `  • ${s}`).join('\n');
      }
      
      throw new Error(errorMessage);
    }

    let extractedText = result.extractedText || result.text;

    // ✅ CRITICAL: Validate extracted content is not empty
    if (!extractedText || extractedText.trim().length === 0) {
      throw new Error(
        'No se extrajo contenido del documento.\n\n' +
        'Posibles causas:\n' +
        '  • El PDF es una imagen escaneada sin OCR\n' +
        '  • El documento está protegido/encriptado\n' +
        '  • El archivo es muy grande para el modelo Flash\n\n' +
        'Soluciones:\n' +
        '  • Re-extrae con modelo Pro (mejor para documentos complejos)\n' +
        '  • Verifica que el PDF tenga texto seleccionable\n' +
        '  • Aumenta maxOutputTokens en configuración'
      );
    }

    // ✅ Warn if extraction is suspiciously short
    if (extractedText.length < 100) {
      console.warn(`⚠️ Very short extraction (${extractedText.length} chars) - may indicate incomplete processing`);
    }

    // ✅ Show model warning if present
    if (result.metadata?.modelWarning) {
      console.warn(`💡 ${result.metadata.modelWarning.message}`);
    }

    // Apply maxOutputLength if specified
    if (config?.maxOutputLength && extractedText.length > config.maxOutputLength * 4) {
      // Note: maxOutputLength is in tokens, approximately 4 chars per token
      const charLimit = config.maxOutputLength * 4;
      extractedText = extractedText.substring(0, charLimit) + '\n\n[Texto truncado...]';
    }

    return extractedText;
  } catch (error) {
    console.error('Error extracting PDF:', error);
    return `❌ Error al extraer contenido del PDF: ${error instanceof Error ? error.message : 'Error desconocido'}`;
  }
}

// CSV extraction
export async function extractCsv(file: File, config?: WorkflowConfig): Promise<string> {
  try {
    const Papa = await import('papaparse');
    
    const text = await file.text();
    
    const result = Papa.default.parse(text, {
      header: true,
      skipEmptyLines: true,
    });
    
    if (result.errors.length > 0) {
      console.warn('CSV parsing warnings:', result.errors);
    }
    
    // Convert to readable format
    const headers = result.meta.fields || [];
    const rows = result.data as Record<string, any>[];
    
    let output = `Columnas encontradas: ${headers.join(', ')}\n\n`;
    output += `Total de filas: ${rows.length}\n\n`;
    output += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';
    
    // Show first rows
    const maxRows = config?.maxOutputLength ? Math.min(rows.length, 100) : rows.length;
    rows.slice(0, maxRows).forEach((row, index) => {
      output += `Fila ${index + 1}:\n`;
      headers.forEach(header => {
        output += `  • ${header}: ${row[header]}\n`;
      });
      output += '\n';
    });
    
    if (rows.length > maxRows) {
      output += `\n[... ${rows.length - maxRows} filas adicionales no mostradas]\n`;
    }
    
    const metadata = `
📄 Archivo: ${file.name}
📊 Columnas: ${headers.length}
📋 Filas totales: ${rows.length}
📝 Filas mostradas: ${maxRows}
📅 Fecha de extracción: ${new Date().toLocaleString('es-ES')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${output}
`;
    
    return metadata;
  } catch (error) {
    console.error('Error extracting CSV:', error);
    return `❌ Error al extraer CSV: ${error instanceof Error ? error.message : 'Error desconocido'}`;
  }
}

// Excel extraction
export async function extractExcel(file: File, config?: WorkflowConfig): Promise<string> {
  try {
    const XLSX = await import('xlsx');
    
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    
    let output = `📊 Hojas encontradas: ${workbook.SheetNames.join(', ')}\n\n`;
    output += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';
    
    workbook.SheetNames.forEach((sheetName, index) => {
      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      
      output += `\n### Hoja ${index + 1}: ${sheetName}\n\n`;
      output += `Filas: ${jsonData.length}\n\n`;
      
      // Show first rows
      const maxRows = config?.maxOutputLength ? Math.min(jsonData.length, 20) : jsonData.length;
      jsonData.slice(0, maxRows).forEach((row: any, rowIndex) => {
        output += `Fila ${rowIndex + 1}: ${Array.isArray(row) ? row.join(' | ') : row}\n`;
      });
      
      if (jsonData.length > maxRows) {
        output += `\n[... ${jsonData.length - maxRows} filas adicionales no mostradas]\n`;
      }
      
      output += '\n';
    });
    
    const metadata = `
📄 Archivo: ${file.name}
📊 Hojas: ${workbook.SheetNames.length}
📅 Fecha de extracción: ${new Date().toLocaleString('es-ES')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${output}
`;
    
    return metadata;
  } catch (error) {
    console.error('Error extracting Excel:', error);
    return `❌ Error al extraer Excel: ${error instanceof Error ? error.message : 'Error desconocido'}`;
  }
}

// Word extraction
export async function extractWord(file: File, config?: WorkflowConfig): Promise<string> {
  try {
    const mammoth = await import('mammoth');
    
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    
    let extractedText = result.value;
    
    if (config?.maxOutputLength && extractedText.length > config.maxOutputLength) {
      extractedText = extractedText.substring(0, config.maxOutputLength) + '\n\n[Texto truncado...]';
    }
    
    const metadata = `
📄 Archivo: ${file.name}
📝 Caracteres extraídos: ${extractedText.length}
📅 Fecha de extracción: ${new Date().toLocaleString('es-ES')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${extractedText}
`;
    
    if (result.messages.length > 0) {
      console.warn('Word extraction warnings:', result.messages);
    }
    
    return metadata;
  } catch (error) {
    console.error('Error extracting Word:', error);
    return `❌ Error al extraer documento Word: ${error instanceof Error ? error.message : 'Error desconocido'}`;
  }
}

// URL extraction (fetch and parse)
export async function extractFromUrl(url: string, config?: WorkflowConfig): Promise<string> {
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const contentType = response.headers.get('content-type');
    let content = '';
    
    if (contentType?.includes('text/html')) {
      const html = await response.text();
      // Basic HTML stripping (for better extraction, use a proper HTML parser)
      content = html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    } else {
      content = await response.text();
    }
    
    if (config?.maxOutputLength && content.length > config.maxOutputLength) {
      content = content.substring(0, config.maxOutputLength) + '\n\n[Contenido truncado...]';
    }
    
    const metadata = `
🌐 URL: ${url}
📄 Tipo de contenido: ${contentType || 'Desconocido'}
📝 Caracteres extraídos: ${content.length}
📅 Fecha de extracción: ${new Date().toLocaleString('es-ES')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${content}
`;
    
    return metadata;
  } catch (error) {
    console.error('Error extracting from URL:', error);
    return `❌ Error al extraer contenido de URL: ${error instanceof Error ? error.message : 'Error desconocido'}`;
  }
}

// API extraction
export async function extractFromApi(endpoint: string, config?: any): Promise<string> {
  try {
    const headers: Record<string, string> = {};
    
    if (config?.apiKey) {
      headers['Authorization'] = `Bearer ${config.apiKey}`;
    }
    
    if (config?.customHeaders) {
      Object.assign(headers, config.customHeaders);
    }
    
    const response = await fetch(endpoint, {
      method: config?.method || 'GET',
      headers,
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    const formatted = JSON.stringify(data, null, 2);
    
    let content = formatted;
    if (config?.maxOutputLength && content.length > config.maxOutputLength) {
      content = content.substring(0, config.maxOutputLength) + '\n\n[Respuesta truncada...]';
    }
    
    const metadata = `
🔌 API Endpoint: ${endpoint}
📝 Método: ${config?.method || 'GET'}
📊 Caracteres en respuesta: ${content.length}
📅 Fecha de extracción: ${new Date().toLocaleString('es-ES')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${content}
`;
    
    return metadata;
  } catch (error) {
    console.error('Error extracting from API:', error);
    return `❌ Error al extraer datos de API: ${error instanceof Error ? error.message : 'Error desconocido'}`;
  }
}
