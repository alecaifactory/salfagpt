# 🚨 Issue Detectado - Phantom Refs con Formato [N][M]

**Fecha:** 2025-10-29 00:30  
**Reportado Por:** Usuario (Alec)  
**Severity:** 🟡 MEDIA (no bloqueante, pero confuso)  
**Status:** 🔧 Fix en progreso

---

## 🔍 Problema Detectado

### **Lo que el usuario ve:**

**Texto de respuesta:**
```
"...pasos en SAP [7][8]:"
"...transacción ZMM_IE [7][8]."
```

**Badges disponibles:**
```
[1] I-006... (80%)
[2] PP-009... (81%)
```

**Confusión:**
> "Me confunde que en el texto dice [7,8] pero habla de referencias [1] y [2]."

---

## 🎯 Root Cause Analysis

### **Flujo Actual:**

```
1. BigQuery devuelve: 10 chunks
   [1] → Chunk A de Doc I-006
   [2] → Chunk B de Doc I-006
   [3] → Chunk C de Doc I-006
   [4] → Chunk D de Doc I-006
   [5] → Chunk A de Doc PP-009
   [6] → Chunk B de Doc PP-009
   [7] → Chunk E de Doc I-006
   [8] → Chunk F de Doc I-006
   [9] → Chunk A de Doc PP-007
   [10] → Chunk B de Doc PP-007

2. Frontend envía fragmentMapping con [1]-[10]

3. AI recibe instrucciones:
   "Tienes fragmentos numerados [1]-[10]"
   
4. AI genera respuesta usando [7][8]

5. Backend consolida por documento único:
   Chunks [1][2][3][4][7][8] → Ref [1] (Doc I-006)
   Chunks [5][6] → Ref [2] (Doc PP-009)
   Chunks [9][10] → Ref [3] (Doc PP-007)
   
6. Referencias finales: [1][2][3]

7. Post-procesamiento debería remover [7][8]
   porque no están en validNumbers [1, 2, 3]
   
8. ❌ PROBLEMA: [7][8] juntos NO se están removiendo
```

---

## 🔧 Diagnóstico Técnico

### **Variantes de formato que AI puede usar:**

1. **[7, 8]** - Con coma y espacio
   - Regex Step 1: `\[(\d+(?:,\s*\d+)*)\]` ✅ CAPTURA
   - Ejemplo: `[7, 8]` → nums = [7, 8] → allValid = false → REMUEVE

2. **[7][8]** - Consecutivos sin comas (ACTUAL)
   - Regex Step 1: `\[(\d+(?:,\s*\d+)*)\]` ❌ NO CAPTURA (no hay comas)
   - Regex Step 2: `\[(\d+)\]` ✅ DEBERÍA CAPTURAR cada uno
   - Ejemplo: `[7][8]` → Match `[7]` → validNumbers.includes(7) → false → REMUEVE
   - **Pero no está funcionando** ⚠️

3. **[7] [8]** - Separados con espacio
   - Regex Step 2: ✅ CAPTURA y remueve cada uno

---

## 🧪 Hipótesis

**Hipótesis 1:** El Step 2 NO se está ejecutando
- Posible: Error de TypeScript silencioso
- Verificar: Logs del servidor

**Hipótesis 2:** Los logs se pierden antes de llegar al post-procesamiento
- Posible: Streaming termina antes de save
- Verificar: Orden de ejecución

**Hipótesis 3:** `[7][8]` se trata como una sola match, no dos
- Regex `\[(\d+)\]` con flag `g` debería encontrar AMBOS
- Pero tal vez hay overlap issue

---

## ✅ Fix Aplicado (Intento #1)

### **Cambios en `messages-stream.ts`:**

**Step 1 - Multi-number citations [N, M]:**
```typescript
fullResponse.replace(/\[(\d+(?:,\s*\d+)*)\]/g, (match, numsStr) => {
  const nums = numsStr.split(',').map(s => parseInt(s.trim()));
  const allValid = nums.every(n => validNumbers.includes(n));
  return allValid ? match : ''; // Remove if ANY number invalid
});
```

**Step 2 - Single number citations [N]:**
```typescript
fullResponse.replace(/\[(\d+)\]/g, (match, numStr) => {
  const num = parseInt(numStr);
  return validNumbers.includes(num) ? match : '';
});
```

**Logging agregado:**
```typescript
console.log(`📋 Citations in original: ${matches}`);
console.log(`📋 After Step 1: ${matches}`);
console.log(`📋 After Step 2: ${matches}`);
console.log(`✅ Removed ${removedCount} citations`);
```

---

## 🧪 Testing del Fix

### **Test Case 1: [7, 8] con comas**
```
Input: "...transacción [7, 8]..."
validNumbers: [1, 2, 3]
Step 1: Match [7, 8] → nums=[7,8] → allValid=false → REMOVE ✅
Output: "...transacción ..."
```

**Status:** ✅ SHOULD WORK

---

### **Test Case 2: [7][8] sin comas (ACTUAL)**
```
Input: "...transacción [7][8]..."
validNumbers: [1, 2, 3]

Step 1: Match [7][8]?
Regex: \[(\d+(?:,\s*\d+)*)\]
[7][8] → NO match (no hay comas) ❌

Step 2: Match [7] and [8] separately?
Regex: \[(\d+)\]
[7] → Match → validNumbers.includes(7) → false → REMOVE ✅
[8] → Match → validNumbers.includes(8) → false → REMOVE ✅

Expected Output: "...transacción ..."
```

**Status:** ✅ SHOULD WORK pero ❌ NO ESTÁ FUNCIONANDO

---

## 🔍 Diagnóstico Necesario

### **Próximo Paso:**
1. ✅ Logging detallado agregado
2. ⏳ Reiniciar servidor
3. ⏳ Re-probar pregunta S001
4. ⏳ Revisar logs del servidor (console.log outputs)
5. ⏳ Identificar en qué paso falla

### **Posibles Soluciones:**

**Opción A - Regex más agresivo:**
```typescript
// Remover CUALQUIER [N] o [N][M] donde N o M no estén en validNumbers
fullResponse.replace(/\[(\d+)\]/g, (match, num) => {
  return validNumbers.includes(parseInt(num)) ? match : '';
});
```

**Opción B - Explicitar el formato sin comas en prompt:**
```typescript
"CRÍTICO: Usa [1][2] SIN ESPACIOS para múltiples refs.
NO uses [1, 2] con comas.
NO uses [1] [2] con espacios.
FORMATO OBLIGATORIO: [1][2][3] pegados."
```

**Opción C - Renumerar en runtime:**
```typescript
// Map [7][8] → [2] automáticamente
// Si chunk 7 y 8 son del mismo doc que ref 2
```

---

## 📊 Impacto del Issue

### **Severity:**
- 🟡 MEDIA (no bloqueante)
- Usuario puede entender que debe mirar badges [1][2]
- La información es correcta (PP-009 encontrado)
- Solo la numeración es confusa

### **User Experience:**
- ⚠️ Confusión: "¿Cuál es la ref correcta?"
- ✅ Funcionalidad: Referencias funcionan
- ✅ Contenido: Correcto y útil
- ⚠️ Confianza: Disminuye ligeramente

### **Workaround Temporal:**
```
Sebastian puede:
1. Ignorar números en texto [N]
2. Usar SOLO la sección "Referencias" al final
3. Click en badges [1][2][3] para ver detalles
```

---

## 🎯 Plan de Resolución

### **Corto Plazo (Hoy):**
1. ✅ Logging detallado agregado
2. ⏳ Re-testing con logs
3. ⏳ Identificar root cause exacto
4. ⏳ Aplicar fix apropiado (A, B, o C)
5. ⏳ Validar que [7][8] se remueve

### **Mediano Plazo (Si no se resuelve hoy):**
1. Documentar workaround para Sebastian
2. Crear ticket específico
3. Resolver en próxima sesión
4. No bloqueante para entrega

---

## 📝 Status Update para Sebastian

### **Lo que funciona:**
- ✅ S001 muestra referencias (3 badges)
- ✅ PP-009 encontrado correctamente
- ✅ Pasos SAP concretos y accionables
- ✅ Modal funciona
- ✅ Fragmentos 100% útiles
- ✅ Sin [7, 8] con comas (mejorado)

### **Issue menor pendiente:**
- ⚠️ AI usa [7][8] en texto pero badges son [1][2][3]
- 🔧 Fix en progreso
- 💡 Workaround: Usar badges [1][2] de la sección Referencias
- 🎯 No bloqueante: Información es correcta, solo numeración confusa

### **Recomendación:**
**Proceder con validación** usando badges de sección "Referencias" como fuente de verdad. Issue de numeración se resolverá en iteración siguiente (no crítico).

---

## 🎓 Lecciones

### **1. AI puede usar múltiples formatos:**
- [N, M] con comas
- [N][M] sin comas pero consecutivos
- [N] [M] con espacios
- Necesitamos capturar TODOS

### **2. Consolidación crea gap numérico:**
- Chunks 1-10 → Refs 1-3
- AI conoce chunks 1-10
- Referencias finales son 1-3
- Gap de 7 números causa confusión

### **3. Solución ideal:**
- Renumerar chunks 1-10 → 1-3 ANTES de enviar al AI
- O explicar mejor la consolidación
- O forzar AI a usar solo refs finales [1][2][3]

---

## 🚀 Próxima Acción

1. ⏳ Re-testing con logging (pendiente)
2. ⏳ Identificar root cause exacto
3. ⏳ Aplicar fix definitivo
4. ⏳ Validar 100%

**Mientras tanto:**
- Sebastian puede proceder con testing
- Issue conocido y en resolución
- No bloqueante para entrega

---

**Commit:** 706be9c  
**Status:** Debug en progreso  
**ETA Fix:** <1 hora

