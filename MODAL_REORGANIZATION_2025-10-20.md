# Reorganización del Modal de Configuración del Documento
**Fecha:** 2025-10-20
**Archivo:** `src/components/ContextSourceSettingsModalSimple.tsx`

## 📊 Nuevo Layout (Diseño ASCII)

```
╔════════════════════════════════════════════════════════════════════════╗
║  ⚙️ Configuración del Documento                                   [X] ║
║  DDU-ESP-075-07.pdf                                                    ║
╠═══════════════════════════════════╦════════════════════════════════════╣
║ COLUMNA IZQUIERDA (space-y-4)     ║ COLUMNA DERECHA (space-y-4)        ║
╠═══════════════════════════════════╬════════════════════════════════════╣
║                                   ║                                    ║
║ 📄 TEXTO EXTRAÍDO (flex-1) ✅     ║ 💾 INDEXACIÓN RAG (flex-1) ✅      ║
║ ┌───────────────────────────────┐ ║ ┌──────────────────────────────┐  ║
║ │ # GOBIERNO DE CHILE           │ ║ │ ✅ RAG Indexado  (3 chunks)  │  ║
║ │ ## MINVU                      │ ║ │ Tamaño prom: 1,846 caracteres│  ║
║ │ ### División Desarrollo...    │ ║ │ Indexado: 19/10/2025         │  ║
║ │                               │ ║ └──────────────────────────────┘  ║
║ │ Un logo circular que contiene │ ║                                    ║
║ │ el escudo nacional...         │ ║ 📊 HISTORIAL (tabla) ✅            ║
║ │                               │ ║ ┌──────────────────────────────┐  ║
║ │ [SCROLL VERTICAL]             │ ║ │Fecha │Mét│Chu│Mod│Tiempo│✓  │  ║
║ │                               │ ║ ├──────┼───┼───┼───┼──────┼───┤  ║
║ │                               │ ║ │19/10 │Ini│ 3 │Fla│ 2.1s │✓  │  ║
║ │ ...texto truncado...          │ ║ │20/10 │Rei│ 3 │Pro│ 3.4s │✓  │  ║
║ │ total: 5,538 caracteres       │ ║ └──────────────────────────────┘  ║
║ └───────────────────────────────┘ ║                                    ║
║ 5,538 caracteres│≈ 1,385 tokens  ║ [🔄 Re-indexar con RAG] ✅         ║
║                                   ║                                    ║
║ ════════════════════════════════  ║ ════════════════════════════════   ║
║                                   ║                                    ║
║ ⚡ INFO DE EXTRACCIÓN ✅          ║ 👁️ ARCHIVO ORIGINAL ✅             ║
║ ┌──────────┬──────────────────┐  ║ ┌──────────────────────────────┐  ║
║ │Modelo:   │ ✨ Flash         │  ║ │ ✅ Archivo en Cloud Storage  │  ║
║ │Tamaño:   │ 1.24 MB          │  ║ │                              │  ║
║ ├──────────┼──────────────────┤  ║ │ Ruta: documents/176...       │  ║
║ │Caracteres│ 5,538 ✅         │  ║ │                              │  ║
║ │Tokens:   │ 1,385 ✅         │  ║ │ [👁️ Ver archivo]             │  ║
║ ├──────────┼──────────────────┤  ║ │                              │  ║
║ │Tiempo:   │ 14.75s           │  ║ │ [PDF Viewer si se abre]      │  ║
║ │Costo:    │ $0.0139          │  ║ │                              │  ║
║ └──────────┴──────────────────┘  ║ └──────────────────────────────┘  ║
║                                   ║                                    ║
║ Archivo: DDU-ESP-075-07.pdf       ║                                    ║
║ Tipo: PDF                         ║                                    ║
║                                   ║                                    ║
╚═══════════════════════════════════╩════════════════════════════════════╝
                              [Cerrar]
```

## 🎯 Cambios Realizados

### Columna Izquierda (Top → Bottom):

1. **📄 Texto Extraído** (ARRIBA)
   - Muestra el texto completo con scroll vertical
   - Contador de caracteres y tokens
   - Truncado a 3,000 caracteres para preview
   - Fondo gris claro con tipografía monoespaciada

2. **⚡ Información de Extracción** (DEBAJO)
   - Grid 2x3 con 6 métricas clave
   - **FIX CRÍTICO**: Ahora usa `source.extractedData?.length` en lugar de `source.metadata?.charactersExtracted`
   - Esto asegura coherencia con el texto mostrado arriba
   - Muestra: Modelo, Tamaño, Caracteres, Tokens, Tiempo, Costo
   - Metadata del archivo al final (nombre, tipo)

### Columna Derecha (Top → Bottom):

3. **💾 Indexación RAG** (ARRIBA)
   - Estado de indexación (indexado o no)
   - Estadísticas: chunk count, tamaño promedio, fecha
   - **📊 HISTORIAL DE PROCESAMIENTO** (tabla compacta)
     - Columnas: Fecha | Método | Chunks | Modelo | Tiempo | Estado
     - Una fila por cada operación de chunking
     - Badges de color por método (Inicial=azul, Reindex=morado, Auto=gris)
     - Iconos de éxito/error
   - **Botón Re-indexar** debajo de la tabla

4. **👁️ Archivo Original** (DEBAJO)
   - Estado de Cloud Storage
   - Ruta de almacenamiento
   - Botón "Ver archivo" (toggle)
   - Iframe viewer cuando está abierto
   - Altura reducida (h-64 en lugar de h-96)

## 🔧 Fixes Técnicos

### 1. Coherencia de Datos
**Problema:** Mostraba N/A para caracteres y tokens
**Solución:** Ahora usa `source.extractedData?.length` que siempre tiene el valor real

```typescript
// ❌ ANTES (mostraba N/A):
{source.metadata?.charactersExtracted?.toLocaleString() || 'N/A'}

// ✅ AHORA (muestra valor real):
{source.extractedData?.length.toLocaleString() || 
 source.metadata?.charactersExtracted?.toLocaleString() || 'N/A'}
```

### 2. Tabla de Historial
**Nueva:** Tabla compacta con todas las operaciones de chunking

```typescript
<table className="w-full text-[10px]">
  <thead>
    <tr>
      <th>Fecha</th>
      <th>Método</th>
      <th>Chunks</th>
      <th>Modelo</th>
      <th>Tiempo</th>
      <th>✓</th>
    </tr>
  </thead>
  <tbody>
    {source.indexingHistory?.map(entry => (
      <tr>
        <td>{formatDate(entry.timestamp)}</td>
        <td><Badge>{entry.method}</Badge></td>
        <td>{entry.chunksCreated}</td>
        <td>{entry.embeddingModel}</td>
        <td>{entry.duration}s</td>
        <td>{entry.success ? '✓' : '✗'}</td>
      </tr>
    ))}
  </tbody>
</table>
```

### 3. Tipos TypeScript
**Agregado a** `src/types/context.ts`:

```typescript
interface ExtractionMetadata {
  // ... campos existentes ...
  
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
```

## 📋 Por Qué Mostraba N/A Antes

### Problema Raíz
El modal estaba usando `source.metadata?.charactersExtracted` para mostrar los caracteres, pero este campo:
1. **No siempre se guarda** durante la extracción
2. **No es coherente** con `extractedData` que sí contiene el texto real
3. **Puede estar desincronizado** si el texto se re-procesa

### Solución
Ahora priorizamos:
1. **`source.extractedData?.length`** - El valor REAL de caracteres
2. **Fallback a `metadata.charactersExtracted`** - Por compatibilidad
3. **Cálculo de tokens coherente** - `Math.ceil(caracteres / 4)`

Esto garantiza que lo que ves en "Información de Extracción" sea exactamente coherente con el "Texto Extraído" mostrado arriba.

## ✅ Checklist de Implementación

- [x] Texto extraído en columna izquierda ARRIBA
- [x] Información de extracción coherente con texto (usa extractedData.length)
- [x] Historial de chunkings en tabla compacta en columna derecha
- [x] Botón Re-indexar debajo de la tabla
- [x] Archivo original en columna derecha DEBAJO
- [x] Viewer de PDF opcional (toggle)
- [x] Tipos TypeScript actualizados
- [x] Sin errores de linting
- [x] Layout responsive con flex-col

## 🎨 Estilos Aplicados

- **Texto extraído**: `flex-1` para ocupar espacio disponible, scroll vertical
- **Grids**: `grid-cols-2` para la información de extracción
- **Tabla**: Compacta con `text-[10px]`, bordes sutiles
- **Colores**: 
  - Badges método: Azul (inicial), Morado (reindex), Gris (auto)
  - Estados: Verde (✓), Rojo (✗)
  - Modelo: Verde (Flash), Morado (Pro)

## 🚀 Próximos Pasos

1. Verificar en localhost que todo se ve correcto
2. Confirmar que los datos de caracteres/tokens ahora muestran valores reales
3. Si aún muestra N/A, verificar que `extractedData` existe en el source
4. Commit de los cambios

