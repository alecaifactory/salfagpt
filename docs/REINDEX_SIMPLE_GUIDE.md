# 🎯 Guía Simple: Re-indexar S001 y M001

**Para:** Sebastian / Alec  
**Propósito:** Aplicar filtro de basura a documentos existentes  
**Tiempo:** 2-3 minutos por documento

---

## ✅ MÉTODO MÁS SIMPLE: Via Webapp

### **Opción 1: Re-indexar TODO de un agente** ⚡ RECOMENDADO

1. **Ir a:** `http://localhost:3000/chat`

2. **Abrir agente M001:**
   - Click en "Asistente Legal Territorial RDI (M001)" en sidebar izquierdo

3. **Abrir Context Management:**
   - Click en el **header del agente** (título en la parte superior)
   - Buscar opción **"Configurar Contexto"** o **ícono de configuración** ⚙️
   - O click en **"Ver Contexto"** en panel izquierdo

4. **Re-indexar todos los docs:**
   - Buscar botón **"Re-indexar Todos"** o **"Refresh All"**
   - O hacer uno por uno (ver Opción 2)

---

### **Opción 2: Re-indexar Documento por Documento**

**Para cada PDF en M001:**

1. **Abrir agente M001**

2. **Panel de "Fuentes de Contexto" (izquierda):**
   - Verás lista de PDFs con badges verdes

3. **Para cada documento:**
   ```
   Click en ⚙️ (settings) del documento
   → Modal se abre
   → Click botón "Re-extraer" o "Re-indexar"
   → Esperar progress bar
   → Verificar console: "🗑️ Filtered X garbage chunks"
   → Cerrar modal
   → Repetir con siguiente PDF
   ```

**Documentos de M001 (ejemplo):**
- DDU-493-.pdf
- CIR-182.pdf
- CIR-231.pdf
- CIR-232.pdf
- ... (rest)

---

### **Para S001:**

**Primero verificar si tiene documentos:**

1. **Abrir agente S001:**
   - Click en "GESTION BODEGAS GPT (S001)"

2. **Mirar panel "Fuentes de Contexto":**
   - ✅ Si ves PDFs → Seguir mismo proceso que M001
   - ❌ Si está vacío → **Este es el problema!**

3. **Si NO tiene PDFs:**
   ```
   Problema confirmado: S001 sin documentos
   
   Por eso no muestra referencias ❌
   
   Solución:
   a) Subir PDFs de gestión de bodegas
   b) Asignar a S001
   c) Activar toggles
   d) Entonces re-indexar
   ```

---

## 🎯 QUÉ PROBAR DESPUÉS

### **M001 - Después de Re-index:**

**Test de Calidad de Fragmentos:**
```
Pregunta: "¿Qué es un OGUC?"

ANTES del re-index:
[1] "1. INTRODUCCIÓN .............." ❌
[2] "1. INTRODUCCIÓN .............." ❌
[3] "Página 2 de 3" ❌
[4] "1. INTRODUCCIÓN .............." ❌
[5] Texto útil ✅
= 1 de 5 útil (20%)

DESPUÉS del re-index:
[1] "La OGUC (Ordenanza General..." ✅
[2] "El artículo 4.14.2..." ✅
[3] "Las construcciones..." ✅
[4] "La Ley 19.537..." ✅
[5] Texto útil ✅
= 4-5 de 5 útiles (80-100%)
```

**Cómo verificar:**
1. Hacer pregunta: "¿Qué es un OGUC?"
2. Esperar respuesta
3. Click en cada badge amarillo [1][2][3][4][5]
4. Panel derecho muestra el fragmento
5. Contar cuántos son útiles vs basura

---

### **M001 - Test Anti-Alucinación:**

**Puedes probar AHORA (sin re-index):**

```
Pregunta: "¿Qué es un OGUC?"

Verificar:
1. Contar badges amarillos al final (ej: 5 badges)
2. Leer la respuesta
3. ¿Usa SOLO [1][2][3][4][5]?
4. ¿O usa [7], [8], [9] que NO existen?

✅ PASA: Solo usa números que existen
❌ FALLA: Usa [7] o números inventados
```

---

## 📊 Checklist de Testing

### **M001:**
```
□ Test anti-alucinación (SIN re-index necesario)
  Pregunta: "¿Qué es un OGUC?"
  □ Solo usa referencias válidas
  □ NO inventa [7], [8], etc.

□ Re-indexar documentos
  □ Via UI (manual)
  □ Verificar console: "Filtered X garbage chunks"

□ Test calidad fragmentos (DESPUÉS de re-index)
  Pregunta: "¿Qué es un OGUC?"
  □ 4-5 de 5 fragmentos útiles
  □ NO aparecen "INTRODUCCIÓN ..."
  □ NO aparecen "Página X de Y"
```

### **S001:**
```
□ Verificar tiene documentos asignados
  □ Abrir agente
  □ Ver panel "Fuentes de Contexto"
  □ Screenshot

□ Si tiene docs: Re-indexar
  □ Mismo proceso que M001

□ Si NO tiene docs: Reportar
  □ Confirmar que este es el problema FB-001
  □ Necesita subir PDFs de bodegas primero
```

---

## 💡 Si No Encuentras Botón "Re-indexar"

**Método alternativo via Console (F12):**

```javascript
// 1. Abrir agente M001
// 2. F12 → Console
// 3. Pegar y ejecutar:

async function reindexCurrentAgent() {
  // Get current agent ID from URL or state
  const agentId = window.location.search.match(/conversationId=([^&]+)/)?.[1];
  
  if (!agentId) {
    console.error('No agent selected');
    return;
  }
  
  console.log('🔄 Re-indexing agent:', agentId);
  
  const result = await fetch('/api/admin/reindex-agent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ agentId })
  }).then(r => r.json());
  
  console.log('✅ Result:', result);
  return result;
}

// Ejecutar
reindexCurrentAgent();
```

---

## 📞 Reportar Resultados

**Después de testing, reporta:**

### **M001:**
```
Re-index:
✅ Completado: Sí/No
📄 Documentos procesados: X
🗑️ Chunks basura filtrados: Y

Testing Anti-Alucinación (FB-002):
✅ Funciona: Sí/No
📝 Detalles: [si no funciona, qué número inventó]

Testing Calidad Fragmentos (FB-003):
✅ Funciona: Sí/No
📊 Fragmentos útiles: X de 5
```

### **S001:**
```
Documentos asignados:
✅ Tiene PDFs: Sí/No
📄 Cantidad: X
📸 Screenshot: [adjuntar]

Si tiene docs:
✅ Re-index completado: Sí/No
✅ Referencias aparecen: Sí/No

Si NO tiene docs:
❌ Problema confirmado: S001 sin documentos
📝 Solución: Subir PDFs de gestión bodegas primero
```

---

**¿Necesitas ayuda?** Pregunta y te guío paso a paso. 🚀

---

**Archivos:**
- `docs/INSTRUCCIONES_REINDEX_MANUAL.md` - Guía detallada
- `docs/REINDEX_SIMPLE_GUIDE.md` - Esta guía (simple)
- `scripts/reindex-s001-m001.ts` - Script automático (requiere auth)

