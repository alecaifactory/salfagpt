# 📊 Campos de Resumen en quality

**Actualizado:** 2025-11-18  
**Estado:** ✅ IMPLEMENTADO Y VERIFICADO

---

## 🆕 Nuevos Campos Agregados

La sección `quality` ahora incluye dos campos adicionales para proporcionar un resumen completo de la extracción:

### 1. `average_extraction_proximity_pct`

**Tipo:** `number`  
**Descripción:** Promedio de `extraction_proximity_pct` de todos los movimientos extraídos  
**Rango:** 0-100  
**Cálculo:** `(suma de todos los extraction_proximity_pct) / cantidad de movimientos`

**Propósito:**
- Proporciona una métrica única de calidad de la extracción completa
- Permite comparar la calidad entre diferentes documentos o bancos
- Útil para análisis estadísticos y reportes

**Ejemplo:**
```json
{
  "quality": {
    "average_extraction_proximity_pct": 95
  }
}
```

Si los movimientos tienen proximity de `[95, 95, 95, 95, 95, 95, 95, 95, 95, 95]`:
- Suma: 950
- Total: 10 movimientos
- Promedio: 950 / 10 = 95

---

### 2. `extraction_bank`

**Tipo:** `string`  
**Descripción:** Nombre del banco que generó esta extracción  
**Valor:** Nombre completo del banco detectado en el documento

**Propósito:**
- Identificar rápidamente el origen del documento
- Facilitar filtrado y agrupación por banco
- Útil para análisis comparativo de calidad entre bancos
- Permite personalización de lógica por banco

**Ejemplo:**
```json
{
  "quality": {
    "extraction_bank": "Banco de Chile"
  }
}
```

Valores posibles:
- "Banco de Chile"
- "Banco Santander"
- "Banco Estado"
- "BCI"
- "Banco Itaú"
- "Banco Falabella"
- "Scotiabank"
- etc.

---

## 📋 Estructura Completa de quality

```typescript
interface Quality {
  fields_complete: boolean;              // ¿Todos los campos requeridos presentes?
  movements_complete: boolean;           // ¿Se extrajeron movimientos?
  balance_matches: boolean;              // ¿El balance matemático coincide?
  confidence_score: number;              // Confianza del modelo (0-1)
  recommendation: string;                // Recomendación final
  average_extraction_proximity_pct: number;  // 🆕 Promedio de proximidad
  extraction_bank: string;               // 🆕 Banco fuente
}
```

---

## 📊 Ejemplo Real

### JSON Completo

```json
{
  "document_id": "doc_abc123xyz",
  "bank_name": "Banco de Chile",
  "account_number": "000484021004",
  "account_holder": "Gino Marcelo Ramirez Berrios",
  "account_holder_rut": "16416697k",
  
  "movements": [
    {
      "id": "mov_1a2b3c4d",
      "insights": {
        "extraction_proximity_pct": 95
      }
    },
    {
      "id": "mov_e5f6g7h8",
      "insights": {
        "extraction_proximity_pct": 95
      }
    },
    // ... 8 movimientos más con 95% cada uno
  ],
  
  "quality": {
    "fields_complete": true,
    "movements_complete": true,
    "balance_matches": true,
    "confidence_score": 0.98,
    "recommendation": "✅ Lista para Nubox",
    "average_extraction_proximity_pct": 95,    // 🆕 Promedio: (950 / 10)
    "extraction_bank": "Banco de Chile"        // 🆕 Banco detectado
  }
}
```

---

## 🎯 Casos de Uso

### 1. Dashboard de Calidad

```typescript
// Agrupar por banco y calcular promedios
const qualityByBank = documents
  .groupBy(doc => doc.quality.extraction_bank)
  .map(group => ({
    bank: group.key,
    avgProximity: group.values
      .reduce((sum, doc) => sum + doc.quality.average_extraction_proximity_pct, 0) 
      / group.values.length,
    totalDocs: group.values.length
  }));

// Resultado:
// [
//   { bank: "Banco de Chile", avgProximity: 95, totalDocs: 145 },
//   { bank: "Banco Santander", avgProximity: 92, totalDocs: 98 },
//   { bank: "BCI", avgProximity: 94, totalDocs: 76 }
// ]
```

### 2. Filtrado por Calidad

```typescript
// Obtener documentos con alta calidad (>90%)
const highQualityDocs = documents.filter(
  doc => doc.quality.average_extraction_proximity_pct > 90
);

// Obtener documentos con problemas por banco
const lowQualityByBank = documents
  .filter(doc => doc.quality.average_extraction_proximity_pct < 80)
  .groupBy(doc => doc.quality.extraction_bank);
```

### 3. Análisis Comparativo

```typescript
// Comparar calidad entre bancos
const bankComparison = {
  "Banco de Chile": {
    avgProximity: 95,
    avgConfidence: 0.98,
    totalProcessed: 145
  },
  "Banco Santander": {
    avgProximity: 92,
    avgConfidence: 0.95,
    totalProcessed: 98
  }
};
```

### 4. Alertas de Calidad

```typescript
// Detectar extracciones con baja calidad
function checkQuality(document) {
  const { average_extraction_proximity_pct, extraction_bank } = document.quality;
  
  if (average_extraction_proximity_pct < 70) {
    console.warn(`⚠️ Baja calidad en ${extraction_bank}: ${average_extraction_proximity_pct}%`);
    return {
      status: 'review_required',
      message: `Documento de ${extraction_bank} requiere revisión manual`
    };
  }
  
  return { status: 'ok' };
}
```

---

## 🔍 Logs de Consola

Cuando se ejecuta la extracción, los nuevos campos se muestran en los logs:

```
✅ [Nubox Cartola] Extraction complete!
   Bank: Banco de Chile
   Movements: 10
   Confidence: 98.0%
   Avg Extraction Proximity: 95%    ← 🆕 Nuevo log
   Cost: $0.0007
   Balance Validation:
      Saldo Inicial: $1,237,952
      Total Abonos: +$317,000
      Total Cargos: -$1,554,952
      Saldo Calculado: $0
      Saldo Final (Doc): $0
      ✅ Balance CORRECTO (diff: 0)
```

---

## 📈 Ventajas

1. **Visibilidad Rápida**: Un solo número (average_proximity) indica la calidad general
2. **Comparación Fácil**: Permite comparar documentos y bancos objetivamente
3. **Trazabilidad**: extraction_bank permite rastrear el origen sin procesar todo el JSON
4. **Optimización**: Identificar qué bancos tienen peor calidad para mejorar prompts específicos
5. **Reportes**: Datos listos para dashboards y análisis

---

## ✅ Verificación con Datos Reales

**Documento:** Banco de Chile - Octubre 2024  
**Movimientos:** 10  
**Proximity individual:** 95% en todos los movimientos  
**Promedio calculado:** (950 / 10) = 95% ✅  
**Banco detectado:** Banco de Chile ✅

---

## 🔄 Compatibilidad

Los campos nuevos son **no-breaking** - se agregan a la estructura existente sin modificar campos anteriores. Código legacy que no use estos campos seguirá funcionando normalmente.

**Antes:**
```json
{
  "quality": {
    "fields_complete": true,
    "confidence_score": 0.98
  }
}
```

**Ahora:**
```json
{
  "quality": {
    "fields_complete": true,
    "confidence_score": 0.98,
    "average_extraction_proximity_pct": 95,  // 🆕
    "extraction_bank": "Banco de Chile"      // 🆕
  }
}
```

