// Basic data extractors for different file types
// In production, these would use actual libraries like pdf-parse, xlsx, etc.

import type { WorkflowConfig } from '../types/context';

export async function extractPdfText(file: File, config: WorkflowConfig): Promise<string> {
  // Mock implementation - in production use pdf-parse or similar
  return new Promise((resolve) => {
    setTimeout(() => {
      const mockText = `Contenido extraído del PDF: ${file.name}
      
Este es un texto de ejemplo extraído del documento PDF.
El archivo tiene ${(file.size / 1024).toFixed(1)} KB de tamaño.

Sección 1: Introducción
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.

Sección 2: Desarrollo
Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

Sección 3: Conclusión
Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.

Configuración aplicada:
- Tamaño máximo: ${config.maxFileSize} MB
- Longitud máxima: ${config.maxOutputLength} tokens
- Extraer imágenes: ${config.extractImages ? 'Sí' : 'No'}
- Extraer tablas: ${config.extractTables ? 'Sí' : 'No'}`;

      const truncated = mockText.slice(0, config.maxOutputLength || 10000);
      resolve(truncated);
    }, 1500);
  });
}

export async function extractPdfWithImages(file: File, config: WorkflowConfig): Promise<string> {
  // Mock implementation - in production use pdf.js + Tesseract.js for OCR
  return new Promise((resolve) => {
    setTimeout(() => {
      const mockText = `PDF con imágenes procesado: ${file.name}

Texto extraído:
${file.name} contiene múltiples imágenes que han sido procesadas.

Imagen 1: Gráfico de barras
- Análisis: Muestra tendencia creciente del 23% año tras año
- OCR habilitado: ${config.ocrEnabled ? 'Sí' : 'No'}

Imagen 2: Diagrama de flujo
- Análisis: Proceso de 5 pasos identificado
- Resolución: Alta calidad

Imagen 3: Fotografía
- Análisis: Imagen decorativa, sin texto relevante

Texto adicional del documento:
Esta sección combina texto y elementos visuales para una mejor comprensión del contenido.

Total de imágenes procesadas: 3
Idioma detectado: ${config.language || 'es'}`;

      resolve(mockText.slice(0, config.maxOutputLength || 15000));
    }, 2000);
  });
}

export async function extractPdfTables(file: File, config: WorkflowConfig): Promise<string> {
  // Mock implementation - in production use tabula-js or similar
  return new Promise((resolve) => {
    setTimeout(() => {
      const mockText = `Tablas extraídas del PDF: ${file.name}

TABLA 1: Ventas por Trimestre
| Trimestre | Ventas | Crecimiento |
|-----------|--------|-------------|
| Q1 2024   | $125K  | +12%        |
| Q2 2024   | $142K  | +13.6%      |
| Q3 2024   | $168K  | +18.3%      |
| Q4 2024   | $195K  | +16.1%      |

TABLA 2: Distribución por Región
| Región     | Porcentaje | Monto   |
|------------|------------|---------|
| Norte      | 35%        | $227K   |
| Sur        | 28%        | $182K   |
| Este       | 22%        | $143K   |
| Oeste      | 15%        | $98K    |

TABLA 3: Top 5 Productos
| Producto   | Unidades | Ingreso |
|------------|----------|---------|
| Producto A | 1,250    | $156K   |
| Producto B | 980      | $122K   |
| Producto C | 875      | $109K   |
| Producto D | 650      | $81K    |
| Producto E | 540      | $67K    |

Total de tablas identificadas: 3
Formato de salida: Markdown`;

      resolve(mockText.slice(0, config.maxOutputLength || 20000));
    }, 1800);
  });
}

export async function extractCsv(file: File, config: WorkflowConfig): Promise<string> {
  // Mock implementation - in production use papaparse or similar
  return new Promise((resolve) => {
    setTimeout(() => {
      const mockText = `Datos CSV procesados: ${file.name}

Resumen del archivo:
- Total de filas: 1,247
- Total de columnas: 8
- Tamaño: ${(file.size / 1024).toFixed(1)} KB

Columnas identificadas:
1. ID (numérico)
2. Fecha (fecha)
3. Cliente (texto)
4. Producto (texto)
5. Cantidad (numérico)
6. Precio Unitario (decimal)
7. Total (decimal)
8. Estado (categoría)

Primeras 5 filas de ejemplo:
| ID  | Fecha      | Cliente        | Producto   | Cantidad | Precio | Total    | Estado    |
|-----|------------|----------------|------------|----------|--------|----------|-----------|
| 001 | 2024-01-15 | Empresa A      | Widget X   | 25       | $45.00 | $1,125.00| Completado|
| 002 | 2024-01-16 | Empresa B      | Gadget Y   | 10       | $89.99 | $899.90  | Completado|
| 003 | 2024-01-17 | Empresa C      | Tool Z     | 5        | $125.50| $627.50  | Pendiente |
| 004 | 2024-01-18 | Empresa D      | Widget X   | 15       | $45.00 | $675.00  | Completado|
| 005 | 2024-01-19 | Empresa E      | Service A  | 3        | $299.00| $897.00  | Completado|

Estadísticas:
- Total ventas: $1,247,856.50
- Promedio por transacción: $1,001.49
- Estados únicos: 3 (Completado, Pendiente, Cancelado)`;

      resolve(mockText.slice(0, config.maxOutputLength || 50000));
    }, 1200);
  });
}

export async function extractExcel(file: File, config: WorkflowConfig): Promise<string> {
  // Mock implementation - in production use xlsx package
  return new Promise((resolve) => {
    setTimeout(() => {
      const mockText = `Archivo Excel procesado: ${file.name}

Hojas detectadas: 3
1. Ventas_2024
2. Presupuesto
3. Análisis

--- HOJA 1: Ventas_2024 ---
Dimensiones: 156 filas × 12 columnas

Encabezados:
Mes, Región, Vendedor, Producto, Unidades, Precio_Unit, Total, Comisión, Gastos, Utilidad, Cliente, Notas

Resumen de datos:
- Período: Enero - Diciembre 2024
- Total registros: 156
- Ventas totales: $2,456,789.00
- Mejor mes: Diciembre ($285,450.00)
- Mejor región: Norte (35% del total)

--- HOJA 2: Presupuesto ---
Dimensiones: 24 filas × 6 columnas

Categorías de presupuesto:
| Categoría      | Planificado | Real      | Varianza | % Usado |
|----------------|-------------|-----------|----------|---------|
| Marketing      | $250,000    | $235,678  | -$14,322 | 94.3%   |
| Operaciones    | $450,000    | $467,890  | +$17,890 | 104.0%  |
| Ventas         | $180,000    | $172,345  | -$7,655  | 95.7%   |
| Tecnología     | $320,000    | $298,567  | -$21,433 | 93.3%   |

--- HOJA 3: Análisis ---
Contiene gráficos y fórmulas complejas
- 12 gráficos incrustados
- 45 fórmulas activas
- Tablas dinámicas: 3`;

      resolve(mockText.slice(0, config.maxOutputLength || 50000));
    }, 1600);
  });
}

export async function extractWord(file: File, config: WorkflowConfig): Promise<string> {
  // Mock implementation - in production use mammoth.js or similar
  return new Promise((resolve) => {
    setTimeout(() => {
      const mockText = `Documento Word procesado: ${file.name}

TÍTULO: Propuesta de Proyecto - Sistema de Gestión

1. RESUMEN EJECUTIVO
Este documento presenta una propuesta integral para la implementación de un sistema de gestión empresarial. El proyecto abarca múltiples fases y se estima una duración de 6 meses.

2. OBJETIVOS
2.1 Objetivo General
Implementar una solución tecnológica que optimice los procesos operativos de la organización.

2.2 Objetivos Específicos
- Digitalizar los procesos manuales existentes
- Mejorar la trazabilidad de las operaciones
- Reducir tiempos de respuesta en un 40%
- Incrementar la satisfacción del cliente

3. ALCANCE DEL PROYECTO
3.1 Módulos Incluidos
- Gestión de inventario
- Control de ventas
- Facturación electrónica
- Reportes y análisis
- Gestión de clientes

3.2 Fases de Implementación
Fase 1: Análisis y diseño (2 meses)
Fase 2: Desarrollo (3 meses)
Fase 3: Pruebas y despliegue (1 mes)

4. PRESUPUESTO
Inversión total estimada: $125,000
Desglose por categoría disponible en anexo financiero.

5. CONCLUSIONES
La implementación de este sistema representará un avance significativo en la modernización de la empresa.

Documento contiene:
- 15 páginas
- 8 secciones principales
- 3 tablas
- 2 imágenes incrustadas
- Idioma: ${config.language || 'es'}`;

      resolve(mockText.slice(0, config.maxOutputLength || 15000));
    }, 1400);
  });
}

export async function extractFromFolder(files: FileList, config: WorkflowConfig): Promise<string> {
  // Mock implementation - would process multiple files
  return new Promise((resolve) => {
    setTimeout(() => {
      const mockText = `Carpeta procesada con éxito

Total de archivos: ${files.length}

Tipos de archivo detectados:
- PDFs: 12 archivos
- Excel: 5 archivos
- Word: 8 archivos
- CSV: 3 archivos
- Imágenes: 15 archivos

Contenido indexado:
Todos los documentos han sido procesados y su contenido está disponible para búsqueda.

Tamaño total: ${Array.from(files).reduce((acc, f) => acc + f.size, 0) / 1024 / 1024} MB

Archivos destacados:
1. proyecto_2024.pdf - Contiene plan estratégico
2. ventas_q4.xlsx - Datos de ventas del último trimestre
3. propuesta_cliente.docx - Documento de propuesta comercial

Índice creado con ${Math.floor(Math.random() * 50000) + 10000} términos únicos.`;

      resolve(mockText.slice(0, config.maxOutputLength || 100000));
    }, 3000);
  });
}

export async function extractFromUrl(url: string, config: WorkflowConfig): Promise<string> {
  // Mock implementation - in production use cheerio or similar for web scraping
  return new Promise((resolve) => {
    setTimeout(() => {
      const mockText = `Contenido extraído de URL: ${url}

TÍTULO DE LA PÁGINA
Este es el contenido principal extraído del sitio web.

Secciones identificadas:
1. Encabezado principal
2. Contenido del artículo
3. Información relevante
4. Enlaces relacionados

El texto ha sido limpiado y formateado para facilitar su uso como contexto.

Metadatos:
- Fecha de publicación: Estimada hace 3 días
- Autor: No especificado
- Idioma: ${config.language || 'es'}
- Longitud original: ~5,000 palabras

Nota: Solo se extrajo contenido textual, excluyendo elementos de navegación y publicidad.`;

      resolve(mockText.slice(0, config.maxOutputLength || 10000));
    }, 1000);
  });
}

export async function extractFromApi(endpoint: string, config: WorkflowConfig): Promise<string> {
  // Mock implementation - would make actual API call
  return new Promise((resolve) => {
    setTimeout(() => {
      const mockText = `Datos extraídos de API: ${endpoint}

Respuesta de la API procesada exitosamente.

Estructura de datos:
{
  "status": "success",
  "data": {
    "records": 125,
    "summary": "Información actualizada obtenida del endpoint",
    "timestamp": "${new Date().toISOString()}"
  }
}

Datos relevantes extraídos:
- Total de registros: 125
- Última actualización: ${new Date().toLocaleString('es-ES')}
- Formato: JSON
- Compresión: Gzip

El contenido ha sido formateado para su uso como contexto en conversaciones.`;

      resolve(mockText.slice(0, config.maxOutputLength || 10000));
    }, 800);
  });
}

