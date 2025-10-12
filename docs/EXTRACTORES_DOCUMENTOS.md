# Sistema de Extracción de Documentos - Flow

## 📚 Resumen

El sistema de extracción de documentos de Flow permite procesar múltiples formatos de archivos y extraer contenido estructurado para usarlo como contexto en conversaciones con IA.

## ✅ Formatos Soportados

### 1. **PDF - Extracción de Texto** (`pdf-text`)
- **Biblioteca**: `pdf-parse`
- **Capacidades**:
  - Extrae todo el texto del PDF
  - Cuenta páginas automáticamente
  - Muestra metadatos (tamaño, páginas, caracteres)
  - Soporta truncado configurable
  
**Ejemplo de salida**:
```
📄 Archivo: documento.pdf
📊 Total de páginas: 15
📝 Caracteres extraídos: 25,430
📅 Fecha de extracción: 11/10/2025 22:20:00

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Contenido extraído del PDF...]
```

**Configuración**:
```typescript
{
  maxOutputLength: 50000, // Máximo de caracteres
  maxFileSize: 10485760   // 10 MB
}
```

---

### 2. **PDF con Imágenes** (`pdf-with-images`)
- **Biblioteca**: `pdf-parse`
- **Capacidades**:
  - Extrae texto del PDF
  - Detecta presencia de imágenes
  - OCR disponible próximamente
  
**Nota**: Para OCR completo se requiere integración con:
- Google Vision API
- AWS Textract  
- Azure Computer Vision
- Tesseract.js (cliente)

---

### 3. **PDF - Tablas** (`pdf-tables`)
- **Biblioteca**: `pdf-parse` + heurística personalizada
- **Capacidades**:
  - Detecta líneas con estructura tabular
  - Identifica columnas por espaciado
  - Extrae datos estructurados
  
**Heurística de detección**:
- Líneas con múltiples espacios (`\s{2,}`)
- Líneas con tabs (`\t`)
- Alineación consistente

**Mejora futura**: Integrar con `tabula-js` o `camelot-py`

---

### 4. **CSV** (`csv`)
- **Biblioteca**: `papaparse`
- **Capacidades**:
  - Auto-detecta headers
  - Parsea múltiples delimitadores (`,` `;` `\t`)
  - Validación de estructura
  - Preview de primeras 100 filas
  
**Ejemplo de salida**:
```
📄 Archivo: ventas.csv
📊 Columnas: 5
📋 Filas totales: 1,250
📝 Filas mostradas: 100
📅 Fecha de extracción: 11/10/2025 22:20:00

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Columnas encontradas: fecha, producto, cantidad, precio, total

Fila 1:
  • fecha: 2025-01-01
  • producto: Laptop HP
  • cantidad: 3
  • precio: 15000
  • total: 45000

[...]
```

---

### 5. **Excel** (`excel`)
- **Biblioteca**: `xlsx` (SheetJS)
- **Capacidades**:
  - Procesa múltiples hojas
  - Detecta estructura de celdas
  - Extrae fórmulas y valores
  - Preview de primeras 20 filas por hoja
  
**Formatos soportados**:
- `.xlsx` (Office Open XML)
- `.xls` (Excel 97-2003)
- `.xlsm` (con macros)
- `.xlsb` (binario)
- `.csv` (también funciona)

**Ejemplo de salida**:
```
📄 Archivo: reporte_mensual.xlsx
📊 Hojas: 3 (Ventas, Compras, Inventario)
📅 Fecha de extracción: 11/10/2025 22:20:00

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### Hoja 1: Ventas

Filas: 150

Fila 1: Producto | Cantidad | Precio | Total
Fila 2: Laptop | 5 | 15000 | 75000
[...]
```

---

### 6. **Word** (`word`)
- **Biblioteca**: `mammoth`
- **Capacidades**:
  - Extrae texto plano de `.docx`
  - Preserva estructura de párrafos
  - Ignora formato visual
  - Extrae contenido de tablas
  
**Formatos soportados**:
- `.docx` (Office Open XML) ✅
- `.doc` (Word 97-2003) ❌ (requiere conversión)

**Ejemplo de salida**:
```
📄 Archivo: informe_anual.docx
📝 Caracteres extraídos: 12,450
📅 Fecha de extracción: 11/10/2025 22:20:00

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Informe Anual 2024

Resumen Ejecutivo

Durante el año 2024, la empresa...
[...]
```

---

### 7. **URL / Web Scraping** (`web-url`)
- **Biblioteca**: `fetch` + regex
- **Capacidades**:
  - Descarga contenido de URLs
  - Limpia HTML (scripts, styles)
  - Normaliza espacios
  - Detecta content-type
  
**Tipos de contenido**:
- HTML (limpiado)
- Plain text
- JSON
- XML (como texto)

**Ejemplo de salida**:
```
🌐 URL: https://example.com/articulo
📄 Tipo de contenido: text/html
📝 Caracteres extraídos: 5,230
📅 Fecha de extracción: 11/10/2025 22:20:00

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Título del Artículo

Contenido del artículo...
[...]
```

**Mejora futura**: Integrar con Cheerio o Puppeteer para mejor extracción

---

### 8. **API Endpoint** (`api`)
- **Biblioteca**: `fetch`
- **Capacidades**:
  - Llamadas GET/POST a APIs
  - Soporte para autenticación Bearer
  - Custom headers
  - Formateo JSON automático
  
**Configuración**:
```typescript
{
  endpoint: 'https://api.example.com/data',
  method: 'GET',
  apiKey: 'your_api_key',
  customHeaders: {
    'X-Custom-Header': 'value'
  },
  maxOutputLength: 100000
}
```

**Ejemplo de salida**:
```
🔌 API Endpoint: https://api.example.com/users
📝 Método: GET
📊 Caracteres en respuesta: 3,450
📅 Fecha de extracción: 11/10/2025 22:20:00

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{
  "users": [
    {
      "id": 1,
      "name": "Juan Pérez",
      "email": "juan@example.com"
    },
    [...]
  ]
}
```

---

## 🔧 Configuración de Workflows

Cada workflow puede configurarse con parámetros específicos:

### Parámetros Comunes

```typescript
interface WorkflowConfig {
  maxFileSize?: number;        // Tamaño máximo en bytes (default: 10 MB)
  maxOutputLength?: number;    // Máximo de caracteres en salida
  timeout?: number;            // Timeout en ms (default: 30000)
}
```

### Parámetros por Tipo

#### PDF
```typescript
{
  maxFileSize: 20971520,  // 20 MB
  maxOutputLength: 100000,
  extractImages: false,    // Futuro: activar OCR
  extractTables: true      // Detectar tablas
}
```

#### CSV/Excel
```typescript
{
  maxRows: 1000,           // Máximo de filas a procesar
  headers: true,           // Usar primera fila como headers
  delimiter: ',',          // Para CSV: delimitador
  maxOutputLength: 50000
}
```

#### URL
```typescript
{
  timeout: 10000,          // Timeout de descarga
  maxOutputLength: 50000,
  cleanHTML: true,         // Limpiar tags HTML
  followRedirects: true    // Seguir redirecciones
}
```

#### API
```typescript
{
  method: 'GET',
  apiKey: 'Bearer token',
  customHeaders: {},
  maxOutputLength: 100000,
  timeout: 15000
}
```

---

## 🚀 Uso desde el UI

### 1. Agregar Nueva Fuente

1. Click en botón **"+ Agregar"** en "Fuentes de Contexto"
2. Seleccionar tipo de fuente:
   - Archivo (PDF, Excel, Word, CSV)
   - URL de sitio web
   - API Endpoint
3. Configurar parámetros del workflow
4. Subir archivo o ingresar URL/endpoint
5. Click en **"Agregar Fuente"**

### 2. Ejecutar Workflow Manualmente

1. En panel derecho "Workflows Disponibles"
2. Click en botón **"Ejecutar"**
3. Seleccionar archivo
4. Esperar procesamiento
5. Ver resultados en sección "Resultados"

### 3. Configurar Workflow

1. Click en icono de engranaje ⚙️
2. Ajustar parámetros:
   - Tamaño máximo de archivo
   - Longitud de salida
   - Opciones específicas
3. Click en **"Guardar Configuración"**
4. Opcionalmente guardar como template

---

## 📊 Uso Programático

### Llamar Extractor Directamente

```typescript
import { extractPdfText, extractCsv, extractExcel } from '@/lib/workflowExtractors';

// Extraer PDF
const pdfFile = new File([pdfBlob], 'documento.pdf');
const pdfContent = await extractPdfText(pdfFile, {
  maxOutputLength: 50000
});

// Extraer CSV
const csvFile = new File([csvBlob], 'datos.csv');
const csvContent = await extractCsv(csvFile, {
  maxOutputLength: 100000
});

// Extraer Excel
const excelFile = new File([excelBlob], 'reporte.xlsx');
const excelContent = await extractExcel(excelFile);
```

### Integrar en API Route

```typescript
// src/pages/api/extract.ts
import { extractPdfText } from '@/lib/workflowExtractors';

export const POST: APIRoute = async ({ request }) => {
  const formData = await request.formData();
  const file = formData.get('file') as File;
  const type = formData.get('type') as string;
  
  let content = '';
  
  if (type === 'pdf-text') {
    content = await extractPdfText(file);
  }
  // ... otros tipos
  
  return new Response(JSON.stringify({ content }), {
    headers: { 'Content-Type': 'application/json' }
  });
};
```

---

## ⚡ Optimizaciones

### 1. Cache de Extractiones

Para archivos grandes, implementar cache:

```typescript
const cacheKey = `extract_${file.name}_${file.size}_${file.lastModified}`;
const cached = localStorage.getItem(cacheKey);

if (cached) {
  return JSON.parse(cached);
}

const content = await extractPdfText(file);
localStorage.setItem(cacheKey, JSON.stringify(content));
```

### 2. Progress Bars

Para archivos muy grandes:

```typescript
const extractWithProgress = async (file: File, onProgress: (p: number) => void) => {
  onProgress(0);
  
  const arrayBuffer = await file.arrayBuffer();
  onProgress(30);
  
  const content = await extractPdfText(file);
  onProgress(100);
  
  return content;
};
```

### 3. Batch Processing

Procesar múltiples archivos:

```typescript
const files = [file1, file2, file3];
const results = await Promise.all(
  files.map(file => extractPdfText(file))
);
```

---

## 🔒 Seguridad

### Validación de Archivos

```typescript
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB
const ALLOWED_TYPES = ['application/pdf', 'text/csv', 'application/vnd.openxmlformats'];

function validateFile(file: File): boolean {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('Archivo demasiado grande');
  }
  
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Tipo de archivo no permitido');
  }
  
  return true;
}
```

### Sanitización de URLs

```typescript
function sanitizeUrl(url: string): string {
  const parsed = new URL(url);
  
  // Solo permitir https
  if (parsed.protocol !== 'https:') {
    throw new Error('Solo se permiten URLs HTTPS');
  }
  
  // Blacklist de dominios
  const blockedDomains = ['malicious-site.com'];
  if (blockedDomains.includes(parsed.hostname)) {
    throw new Error('Dominio bloqueado');
  }
  
  return url;
}
```

---

## 📈 Métricas y Monitoreo

### Logging de Extractiones

```typescript
console.log({
  action: 'document_extraction',
  type: 'pdf-text',
  fileSize: file.size,
  fileName: file.name,
  extractedLength: content.length,
  timestamp: new Date().toISOString(),
  duration_ms: endTime - startTime,
  success: true
});
```

### Analytics

Track en Google Analytics:

```typescript
gtag('event', 'extract_document', {
  document_type: 'pdf',
  file_size_kb: Math.round(file.size / 1024),
  extraction_time_ms: duration
});
```

---

## 🐛 Troubleshooting

### Error: "Cannot find module 'pdf-parse'"

```bash
npm install pdf-parse
npm install -D @types/pdf-parse
```

### Error: "Buffer is not defined"

Agregar polyfill para navegador:

```typescript
import { Buffer } from 'buffer';
globalThis.Buffer = Buffer;
```

### PDF no se procesa correctamente

- Verificar que el PDF no esté encriptado
- Algunos PDFs escaneados requieren OCR
- PDFs con muchas imágenes son más lentos

### CSV con encoding incorrecto

```typescript
const decoder = new TextDecoder('iso-8859-1'); // o 'windows-1252'
const text = decoder.decode(await file.arrayBuffer());
```

---

## 🔮 Roadmap

### Próximas Características

- [ ] **OCR Real**: Google Vision API / Tesseract
- [ ] **Extracción Avanzada de Tablas**: Tabula/Camelot
- [ ] **Soporte para más formatos**:
  - PowerPoint (.pptx)
  - Markdown (.md)
  - HTML/XML avanzado
  - Imágenes (JPEG, PNG) con OCR
- [ ] **Chunking inteligente**: Dividir documentos grandes
- [ ] **Embeddings**: Generar vectores para búsqueda semántica
- [ ] **Resúmenes automáticos**: Con Gemini API
- [ ] **Detección de idioma**: Procesamiento multi-idioma
- [ ] **Cache distribuido**: Redis/Memcached
- [ ] **Queue system**: Bull/BullMQ para procesamiento asíncrono

---

## 📚 Referencias

- [pdf-parse](https://www.npmjs.com/package/pdf-parse)
- [xlsx (SheetJS)](https://sheetjs.com/)
- [mammoth.js](https://github.com/mwilliamson/mammoth.js)
- [PapaParse](https://www.papaparse.com/)
- [Google Vision OCR](https://cloud.google.com/vision/docs/ocr)
- [Tesseract.js](https://tesseract.projectnaptha.com/)

---

**Última actualización**: 11 de octubre de 2025  
**Versión**: 1.0.0  
**Autor**: Flow Team

