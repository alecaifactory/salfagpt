# 🚀 Próximo Paso: Configurar M1-v2

**Fecha:** 22 noviembre 2025, 19:30 PST  
**Agentes completados:** S2-v2 ✅, S1-v2 ✅  
**Próximo:** M1-v2  
**Proceso:** 100% probado y exitoso

---

## 📋 **CONTEXTO PARA PRÓXIMA CONVERSACIÓN:**

```
RESUMEN: Completamos S2-v2 (12,219 chunks) y S1-v2 (1,217 chunks) exitosamente.

LOGROS:
- ✅ 2/4 agentes configurados
- ✅ 13,436 chunks totales indexados
- ✅ 13,436 embeddings semánticos (768 dims)
- ✅ RAG funcional con 77.8% similarity promedio
- ✅ Proceso replicable probado 2 veces
- ✅ Scripts base listos para M1-v2 y M3-v2

PRÓXIMO: M1-v2 (y luego M3-v2)

DOCUMENTACIÓN CLAVE:
- CONTEXT_HANDOFF_M1_M3.md: Proceso completo para M1 y M3
- S1_DEPLOYMENT_SUCCESS.md: Resumen S1-v2
- AGENTS_PROGRESS_2025-11-22.md: Estado general

SCRIPTS BASE (copiar y adaptar):
- scripts/find-s1-agent.mjs
- scripts/check-s001-status.mjs
- scripts/assign-all-s001-to-s1v2.mjs
- scripts/process-s1v2-chunks.mjs
- scripts/test-s1v2-evaluation.mjs
```

---

## 🎯 **COMANDO INICIAL:**

```bash
# 1. Verificar que M1-v2 agent existe
echo "📋 Buscar M1-v2 agent ID en Firestore..."

npx tsx -e "
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
initializeApp({ projectId: 'salfagpt' });
const db = getFirestore();

const snapshot = await db.collection('conversations')
  .where('userId', '==', 'usr_uhwqffaqag1wrryd82tw')
  .get();

snapshot.docs.forEach(doc => {
  const title = doc.data().title || '';
  if (title.includes('M1') || title.includes('M001') || 
      title.toLowerCase().includes('m1-v2')) {
    console.log('✅ M1-v2 encontrado:');
    console.log('   ID:', doc.id);
    console.log('   Title:', title);
    console.log('   Sources:', (doc.data().activeContextSourceIds || []).length);
  }
});
process.exit(0);
"

# Si no existe, preguntar al usuario por el nombre exacto del agente M1-v2
```

---

## 📁 **VERIFICAR CARPETA M001:**

```bash
# Verificar documentos en carpeta
ls -la upload-queue/M001-20251118/

# Contar documentos
ls -1 upload-queue/M001-20251118/DOCUMENTOS/ 2>/dev/null | wc -l || echo "Verificar ruta"

# Si la carpeta no existe o está vacía, preguntar al usuario
```

---

## 🔧 **PROCESO COMPLETO M1-v2:**

### **Paso 1: Copiar Scripts (5 min)**

```bash
# Copiar todos los scripts de S1-v2 a M1-v2
cp scripts/find-s1-agent.mjs scripts/find-m1-agent.mjs
cp scripts/check-s001-status.mjs scripts/check-m001-status.mjs
cp scripts/assign-all-s001-to-s1v2.mjs scripts/assign-all-m001-to-m1v2.mjs
cp scripts/process-s1v2-chunks.mjs scripts/process-m1v2-chunks.mjs
cp scripts/test-s1v2-evaluation.mjs scripts/test-m1v2-evaluation.mjs

echo "✅ Scripts copiados"
```

---

### **Paso 2: Adaptar IDs (10 min)**

**En cada archivo `scripts/*m001*` y `scripts/*m1v2*`:**

Buscar/Reemplazar:
```
S1V2_AGENT_ID              → M1V2_AGENT_ID
iQmdg3bMSJ1AdqqlFpye       → [M1 agent ID from step 1]
S001-20251118              → M001-20251118
s001                       → m001
s1v2                       → m1v2
S1-v2                      → M1-v2
GESTION BODEGAS GPT        → [Nombre oficial M1-v2]
```

**Archivos a editar:**
- `scripts/find-m1-agent.mjs`
- `scripts/check-m001-status.mjs`
- `scripts/assign-all-m001-to-m1v2.mjs`
- `scripts/process-m1v2-chunks.mjs`
- `scripts/test-m1v2-evaluation.mjs`

---

### **Paso 3: Ejecutar Secuencia (1-2h)**

```bash
# Análisis inicial
npx tsx scripts/check-m001-status.mjs

# Asignación masiva
npx tsx scripts/assign-all-m001-to-m1v2.mjs

# Procesamiento (background)
nohup npx tsx scripts/process-m1v2-chunks.mjs > /tmp/m1v2-chunks.log 2>&1 &

# Monitorear progreso
tail -f /tmp/m1v2-chunks.log

# Verificar completitud (cada 30 min)
grep "PROCESSING COMPLETE" /tmp/m1v2-chunks.log

# Testing RAG (cuando complete)
npx tsx scripts/test-m1v2-evaluation.mjs
```

---

## 📊 **RESULTADOS ESPERADOS M1-v2:**

| Métrica | Estimado | Confianza |
|---------|----------|-----------|
| Docs en carpeta | ~75 | 80% |
| Docs en Firestore | ~75 | 80% |
| Sources asignados | 2,188 | 100% ✅ |
| Chunks generados | ~4,000 | 70% |
| Embeddings | ~4,000 | 70% |
| Similarity RAG | ~75% | 90% |
| Evaluaciones passed | 4/4 | 70% |
| Tiempo procesamiento | ~1-2h | 90% |
| Costo | ~$0.04 | 90% |

**Basado en:** Promedio S2-v2 y S1-v2

---

## ⚠️ **PREGUNTAS PARA EL USUARIO:**

### **Antes de empezar M1-v2:**

1. **¿Cuál es el nombre exacto del agente M1-v2?**
   - Necesito para buscar en Firestore
   - Ejemplo S1-v2: "GESTION BODEGAS GPT (S001)"

2. **¿Existe la carpeta `upload-queue/M001-20251118`?**
   - Si no, ¿cuál es la ruta correcta?
   - Necesito para análisis de documentos

3. **¿Tienes la ficha de asistente de M1-v2?**
   - Con preguntas tipo para evaluación
   - Objetivo del agente
   - Usuarios piloto

4. **¿Cuántos documentos hay en M001?**
   - Para estimar tiempo de procesamiento
   - Para planificar recursos

---

## 🎯 **INFORMACIÓN QUE NECESITO:**

### **Mínimo requerido:**
- [ ] Agent ID de M1-v2 (o nombre para buscar)
- [ ] Ruta carpeta documentos M001
- [ ] Confirmación que documentos están subidos a Firestore

### **Opcional (mejora evaluación):**
- [ ] Ficha de asistente M1-v2
- [ ] Preguntas tipo para testing
- [ ] Objetivo/propósito del agente
- [ ] Usuarios piloto

---

## 📋 **CUANDO TENGAS ESTA INFO:**

**Responde con:**
```
INFORMACIÓN M1-v2:
- Agent ID o nombre: [...]
- Carpeta docs: [...]
- Docs subidos: Sí/No/Verificar
- Ficha asistente: Sí (adjuntar)/No (usar genérico)
```

**Y ejecutaremos:**
1. Scripts de análisis
2. Asignación masiva
3. Procesamiento chunks
4. Evaluación RAG
5. Resumen final

**Tiempo estimado:** 1-2 horas  
**Resultado:** M1-v2 listo para producción ✅

---

## 🚀 **ESTADO ACTUAL:**

```
Agentes:     2/4 completados (50%)
Chunks:      13,436 indexados
Similarity:  77.8% promedio
Costo:       $0.24 acumulado
Tiempo:      5h 24min invertido

Próximo:     M1-v2 → ~1-2h, ~$0.04
Luego:       M3-v2 → ~45min-1h, ~$0.025

Final:       4/4 agentes, ~20,000 chunks, ~$0.30, ~7-8h
```

---

**LISTO PARA CONTINUAR CUANDO TENGAS INFO DE M1-v2** ✅

**Ver:** `CONTEXT_HANDOFF_M1_M3.md` para detalles completos




