# ✅ Instrucciones Testing Final - Similitud Real

**Fecha:** 2025-11-13  
**Status:** Código implementado, listo para testing en navegador

---

## 🎯 DESCUBRIMIENTO IMPORTANTE

### **✅ Similitudes REALES Confirmadas:**

Ejecuté query directa a BigQuery:

```
Query: "¿Cuáles son los pasos para cambiar filtro aire motor Cummins?"

SIMILITUDES REALES:
  1. 70.9% 🟢 ← PASA threshold 70%!
  2. 70.8% 🟢
  3. 70.7% 🟢  
  4. 70.6% 🟢
  5. 70.4% 🟢
  6. 70.2% 🟢
  7. 70.2% 🟢

Total chunks ≥70%: 7
```

**Estos chunks DEBERÍAN aparecer como referencias.**

---

## 🚨 Por Qué Aún Ves 50%

**Los mensajes con 50% son VIEJOS** (guardados en Firestore antes de los cambios).

**Para ver el código nuevo, necesitas:**

### **1. Refrescar Navegador**
```
Cmd + R (Mac)
F5 (Windows)
```

### **2. Crear NUEVO Chat**

**CRÍTICO:** NO uses el chat "GOP GPT M3" existente.

**Hacer:**
- Click en **"+ Nuevo Chat"** (botón morado arriba derecha)
- O **"+ Nuevo Agente"** (botón azul sidebar)

### **3. Hacer Pregunta de Prueba**

**Query recomendada:**
```
¿Cuáles son los pasos para cambiar el filtro de aire de un motor Cummins?
```

**DEBERÍAS VER:**

```
📚 Referencias utilizadas (7)
  [1] Manual International 7600 - 70.9% 🟢
  [2] Manual Ford Cargo - 70.8% 🟢
  [3] Control Mantenimiento - 70.7% 🟢
  [4] Procedimiento - 70.6% 🟢
  [5] Guía Operador - 70.4% 🟢
  [6] Especificaciones - 70.2% 🟢
  [7] Manual Técnico - 70.2% 🟢
```

**Y el AI debería incluir:**
```
⚠️ Nota: La información encontrada tiene relevancia moderada (70.2-70.9%).
Recomiendo verificar con el manual específico de Cummins para procedimientos detallados.

📧 Para documentos más específicos sobre Cummins, contacta a:
  • sorellanac@salfagestion.cl

💡 Si esta información no fue suficiente, deja feedback en el Roadmap...
```

---

## ✅ Cambios Implementados

### **1. User ID Migration (APLICADO)**

```sql
UPDATE `salfagpt.flow_analytics.document_embeddings`
SET user_id = 'usr_uhwqffaqag1wrryd82tw'
WHERE user_id = '114671162830729001607';

Result: 9,765 rows updated ✅
```

### **2. Search Strategy (IMPLEMENTADO)**

```typescript
// Buscar con threshold BAJO (0.3)
searchByAgent(userId, agentId, message, {
  topK: 20,
  minSimilarity: 0.3 // ← Obtiene TODOS los candidatos
})

// Filtrar DESPUÉS por 70%
if (meetsQualityThreshold(results, 0.7)) {
  // Usar chunks ≥70%
} else if (results.length > 0) {
  // Usar chunks con similitud REAL + warning
}
```

### **3. Mostrar Similitud REAL (IMPLEMENTADO)**

```typescript
// NO más esto:
similarity: 0.5 // Fallback

// AHORA esto:
similarity: avgSimilarity // REAL (ej: 70.9%)
```

### **4. Warning de Calidad (IMPLEMENTADO)**

Cuando similitud 60-70%:
```
AI avisa: "Relevancia moderada-baja, verifica con documento completo"
Muestra: Email admin + Roadmap
Similitud: REAL (NO 50%)
```

---

## 🧪 Testing en Navegador

### **Paso 1: Preparar**

```bash
# Verificar servidor corriendo
lsof -ti:3000

# Si no hay output, iniciar:
npm run dev
```

### **Paso 2: Abrir Navegador**

```
http://localhost:3000/chat
```

### **Paso 3: Refrescar**

```
Cmd + R
```

### **Paso 4: Nuevo Chat**

Click: **"+ Nuevo Chat"** (botón morado)

### **Paso 5: Preguntar**

```
¿Cuáles son los pasos para cambiar el filtro de aire de un motor Cummins?
```

### **Paso 6: Observar**

**DEBERÍAS VER:**
- ✅ Referencias: 5-10 (NO 0)
- ✅ Similitudes: 69-71% (NO 50%)
- ✅ Variedad de % (NO todas iguales)
- ✅ Warning del AI sobre relevancia moderada
- ✅ Email admin mencionado
- ✅ Roadmap mencionado

**SI AÚN VES 50%:**
- El servidor está usando código viejo
- Necesita hard restart (ver Troubleshooting)

---

## 🐛 Troubleshooting

### **Problema: Sigo viendo 0 referencias**

**Diagnóstico:**

```bash
# Ver logs del servidor
tail -f test-server.log | grep "RAG:"

# Deberías ver:
# ✅ RAG: Using 7 relevant chunks
# o
# ⚠️ RAG: Found 10 chunks but best 69.8% < 70%
```

**Si ves:**
```
⚠️ RAG: No chunks found
```

**Entonces:** `searchByAgent()` tiene un bug - no retorna los chunks que BigQuery sí encuentra.

---

### **Problema: Sigo viendo 50%**

**Causa:** Mensaje viejo en chat existente

**Solución:** Crear NUEVO chat (no reusar)

---

### **Problema: Server no responde**

```bash
# Hard restart
pkill -9 -f "node.*astro"
rm -rf node_modules/.vite .astro dist
npm run dev
```

---

## 📊 Métricas de Éxito

### **Metric #1: References Show Real Similarities**

**Success Criteria:**
```
Similitudes mostradas ≠ 50.0%
Variedad: Range > 5%
```

**Test:**
```bash
npx tsx scripts/test-similarity-e2e.ts | grep "PASS.*vary"
# Should show: ✅ PASS: Similarities vary
```

---

### **Metric #2: High Quality Refs When Available**

**Success Criteria:**
```
Si BigQuery retorna chunks ≥70%
→ API debe retornar esos chunks
→ Usuario debe verlos
```

**Test:**
Query específica debería mostrar refs con 70-90%

---

### **Metric #3: Warning When Moderate Quality**

**Success Criteria:**
```
Si similitud 60-70%
→ Mostrar refs con % REAL
→ AI avisa sobre calidad moderada
→ Menciona admin + Roadmap
```

**Test:**
Query general debería mostrar warning

---

## 📝 Checklist Pre-Commit

- [x] User IDs migrados en BigQuery
- [x] Threshold 70% en frontend
- [x] Search con 0.3, filter 0.7 en backend
- [x] Similitud real usada (no 50%)
- [x] Warning implementado
- [x] Admin contact implementado
- [x] Roadmap mention implementado
- [ ] **Testing en navegador** ← PENDIENTE
- [ ] Ver similitudes reales (NO 50%)
- [ ] Confirmar 7 referencias aparecen
- [ ] Git commit

---

## 🚀 Estado Actual

**Servidor:** Corriendo en localhost:3000  
**BigQuery:** 9,765 chunks con user ID correcto  
**Similitudes:** 69-71% calculadas correctamente  
**Código:** Implementado para mostrar REAL  
**Pendiente:** Testing en navegador para confirmar

---

**SIGUIENTE ACCIÓN:** 
1. Refrescar navegador
2. Crear nuevo chat
3. Hacer query
4. Verificar si ves 70.9%, 70.8%, etc. (NO 50%)

Si aún ves 50% o 0 refs, hay un bug en `searchByAgent()` que necesito investigar más.





