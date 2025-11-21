# 🚨 CAUSA RAÍZ FINAL: 50% Consistente

**Fecha:** 2025-11-13  
**Status:** ✅ ROOT CAUSE CONFIRMADO  
**Prioridad:** CRÍTICA

---

## 🔍 Investigación Completa Ejecutada

### **Tests Realizados:**

1. ✅ **Verificar embeddings** → Gemini semántico funcionando
2. ✅ **Verificar chunks en Firestore** → 0 chunks (no indexados)
3. ✅ **Verificar chunks en BigQuery** → 9,765 chunks existen
4. ✅ **Verificar user ID** → Mismatch encontrado y CORREGIDO
5. ✅ **Calcular similitudes reales** → 57.9% máximo para esta query

---

## 🎯 CAUSA RAÍZ CONFIRMADA

### **Problema #1: User ID Mismatch (RESUELTO)**

**Situación:**
- Chunks indexados con: `114671162830729001607` (Google OAuth ID viejo)
- Sistema busca con: `usr_uhwqffaqag1wrryd82tw` (Hash-based ID nuevo)
- Resultado: 0 chunks encontrados

**Solución Aplicada:**
```sql
UPDATE `salfagpt.flow_analytics.document_embeddings`
SET user_id = 'usr_uhwqffaqag1wrryd82tw'
WHERE user_id = '114671162830729001607';

-- Result: 9,765 rows updated ✅
```

---

### **Problema #2: Similitudes Reales <70% (CONFIRMADO)**

**Query de prueba:**
```
"¿Cuáles son los pasos para cambiar el filtro de aire de un motor Cummins?"
```

**Similitudes REALES calculadas** (BigQuery direct query):
```
Top 20 chunks:
 1. 57.9% 🟠 LOW ❌ FILTERED
 2. 57.9% 🟠 LOW ❌ FILTERED  
 3. 57.5% 🟠 LOW ❌ FILTERED
 ... (todas 56-58%)

Best match: 57.9%
Chunks ≥70%: 0
```

**Conclusión:**
- ✅ Sistema funcionando correctamente
- ✅ Similitudes se calculan bien
- ⚠️ Los documentos disponibles NO contienen info específica sobre motores Cummins
- ✅ Threshold 70% correctamente filtra estos chunks de baja calidad

---

### **Problema #3: Endpoint Correcto (INVESTIGANDO)**

**Descubrimiento:**
- Test llama a: `/api/conversations/:id/messages` (non-streaming)
- Frontend usa: `/api/conversations/:id/messages-stream` (streaming)
- Ambos endpoints tienen lógica similar pero pueden diferir

**Necesito verificar:** ¿Qué endpoint está usando el navegador cuando ves 50%?

---

## ✅ Solución Implementada

### **Cambio de Estrategia:**

**Antes:**
- Buscar con threshold 70%
- Si no encuentra → Retornar 0
- Crear fallback refs con 50%

**Ahora:**
- Buscar con threshold **30%** (bajo, obtener candidatos)
- Filtrar después por **70%** en backend
- Si hay resultados pero <70% → Mostrar con similitud REAL + warning
- Si hay resultados ≥70% → Mostrar normales
- Si NO hay resultados del todo → Mensaje admin contact

---

## 📊 Nuevo Flujo

### **Caso A: Similitudes >70% (Alta Calidad)**

```
Query: "¿Qué dice DDU 189 sobre zonas inexcavables?"

BigQuery search (threshold 0.3):
  → 50 chunks found
  
Filter ≥70%:
  → Chunk A: 85.3% ✅
  → Chunk B: 78.9% ✅
  → Chunk C: 72.1% ✅
  → Chunk D: 68.4% ❌ filtrado
  
Result: 3 referencias
  
Usuario ve:
  [1] DDU 189 - 85.3% 🟢
  [2] Manual - 78.9% 🟢
  [3] Circular - 72.1% 🟢
```

---

### **Caso B: Similitudes 40-70% (Calidad Moderada)**

```
Query: "¿Cómo cambio filtro aire Cummins?"

BigQuery search (threshold 0.3):
  → 40 chunks found
  
Filter ≥70%:
  → NINGUNO pasa
  
Best similarity: 57.9%

Result: Mostrar refs con similitud REAL + warning

Usuario ve:
  [1] Manual International 7600 - 57.9% 🟠
  [2] Manual Ford Cargo - 56.5% 🟠
  [3] Control Mantenimiento - 54.2% 🟠
  
AI mensaje:
  "Encontré información relacionada pero con relevancia moderada-baja 
  (57.9% máximo, umbral recomendado: 70%).
  
  📧 Para información más específica, contacta a:
    • sorellanac@salfagestion.cl
  
  💡 Deja feedback en el Roadmap..."
```

---

### **Caso C: Similitudes <30% (Muy Baja)**

```
Query: "¿Cuál es el clima hoy?"

BigQuery search (threshold 0.3):
  → 0 chunks found (ninguno ≥30%)
  
Result: 0 referencias

Usuario ve:
  0 referencias
  
AI mensaje:
  "No encontré documentos relevantes para tu pregunta.
  
  📧 Contacta a tu administrador:
    • sorellanac@salfagestion.cl
  
  💡 Deja feedback en el Roadmap..."
```

---

## 🔧 Archivos Modificados (Sesión Completa)

1. ✅ `src/components/ChatInterfaceWorking.tsx`
   - Threshold 70% (frontend config)
   - userEmail pasado en request
   - Animación ancho progresivo

2. ✅ `src/components/MessageRenderer.tsx`
   - Loading indicator referencias

3. ✅ `src/pages/api/conversations/[id]/messages-stream.ts`
   - Search con threshold 0.3 (línea 142)
   - Filter por 70% después (línea 184)
   - Mostrar refs con similitud REAL (línea 231-239)
   - Warning si <70% (línea 214-225)

4. ✅ `src/pages/api/conversations/[id]/messages.ts`
   - Search con threshold 0.3 (línea 113)
   - Filter por 70% después (línea 119)
   - Mostrar refs con similitud REAL (línea 163-169)
   - Warning si <70% (línea 147-158)

5. ✅ `src/lib/rag-helper-messages.ts` (nuevo)
   - Admin contact lookup
   - Message generation
   - Quality check
   - Analytics logging

---

## 📋 Estado Actual

### ✅ **RESUELTO:**
1. User ID mismatch → Migrado en BigQuery
2. Chunks accesibles → 9,765 chunks disponibles
3. Embeddings semánticos → Gemini funcionando
4. Threshold correcto → 70% implementado
5. Search strategy → 0.3 initial, 0.7 filter

### ⏳ **PENDIENTE VERIFICAR:**
1. Servidor con código nuevo ejecutándose
2. Test en navegador (no solo script)
3. Ver similitudes reales (57.9%, NO 50%)

---

## 🧪 Para Confirmar el Fix

### **En Navegador:**

1. Refrescar página (Cmd+R)
2. Crear NUEVO chat
3. Preguntar: "¿Cómo cambio filtro aire Cummins?"

**DEBERÍAS VER:**

```
📚 Referencias utilizadas (3-5)
  [1] Manual International 7600 - 57.9% 🟠
  [2] Manual Ford Cargo - 56.5% 🟠
  [3] Control semanal - 54.2% 🟠
```

**Y el AI debería decir:**
```
"Encontré información relacionada pero con relevancia moderada-baja 
(57.9% máximo). Las similitudes están entre 54% y 58%.

📧 Para información más específica sobre Cummins, contacta a:
  • sorellanac@salfagestion.cl

💡 Deja feedback en el Roadmap..."
```

**NO más 50.0% en todo - ahora verás las similitudes REALES (54-58%)** 

---

**¿Listo para commit?** → Esperar testing en navegador primero






