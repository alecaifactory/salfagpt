# 📝 Instrucciones: Re-indexar S001 y M001 Manualmente

**Propósito:** Aplicar filtro de basura a chunks existentes  
**Afecta:** FB-003 (Calidad de fragmentos RAG)  
**Tiempo estimado:** 5-10 minutos

---

## 🎯 Método Recomendado: Via Webapp UI

### **Paso 1: Abrir Context Management Dashboard**

1. Ir a: `http://localhost:3000/chat`
2. Login como admin (si no estás logueado)
3. Click en **menú usuario** (esquina inferior izquierda)
4. Click en **"Gestión de Contexto"** (si existe) o usar método alternativo

---

### **Método Alternativo: Re-indexar Documento por Documento**

#### **Para M001 (Legal Territorial):**

1. **Abrir agente M001**
   - Click en "Asistente Legal Territorial RDI (M001)" en sidebar

2. **Abrir panel de contexto**
   - Click en header del agente → "Configurar Contexto"
   - O click en ícono de configuración

3. **Re-indexar cada documento:**
   Para cada PDF listado (DDU-493, CIR-182, CIR-231, etc.):
   ```
   a) Click en ícono de configuración ⚙️ del documento
   b) Modal se abre con detalles
   c) Click en botón "Re-extraer" o "Re-indexar"
   d) Esperar proceso (progress bar)
   e) Verificar mensaje: "X chunks filtrados (basura)"
   f) Cerrar modal
   g) Repetir para siguiente documento
   ```

4. **Verificar:**
   ```
   Console (F12) debería mostrar:
   "🗑️ Filtered X garbage chunks"
   "✅ Y quality chunks remaining"
   ```

#### **Para S001 (Gestión Bodegas):**

**Primero verificar si tiene documentos:**

1. **Abrir agente S001**
   - Click en "GESTION BODEGAS GPT (S001)" en sidebar

2. **Ver panel "Fuentes de Contexto"**
   - ¿Ves PDFs listados?
   - ✅ Si hay PDFs: Seguir mismo proceso que M001
   - ❌ Si NO hay PDFs: Este es el problema de FB-001

3. **Si NO hay PDFs:**
   ```
   Problema identificado: S001 no tiene documentos asignados
   Por eso no muestra referencias
   
   Solución:
   - Subir PDFs de gestión de bodegas
   - Asignar a agente S001
   - Activar toggles
   - Luego re-indexar
   ```

---

## 🚀 Método Automático: Via API (Si webapp tiene endpoint)

### **Script vía Browser Console**

1. Abrir: `http://localhost:3000/chat`
2. Abrir Developer Tools (F12)
3. Ir a tab "Console"
4. Pegar y ejecutar:

```javascript
// Re-index M001
async function reindexM001() {
  console.log('🔄 Buscando agente M001...');
  
  // Find M001 agent ID (replace with actual ID if known)
  const conversations = await fetch('/api/conversations?userId=114671162830729001607')
    .then(r => r.json());
  
  let m001Id = null;
  for (const group of conversations.groups || []) {
    for (const conv of group.conversations || []) {
      if (conv.title?.includes('M001') || conv.title?.includes('Legal Territorial')) {
        m001Id = conv.id;
        console.log('✅ M001 encontrado:', m001Id);
        break;
      }
    }
    if (m001Id) break;
  }
  
  if (!m001Id) {
    console.error('❌ M001 no encontrado');
    return;
  }
  
  // Re-index
  console.log('🔄 Re-indexando M001...');
  const result = await fetch('/api/admin/reindex-agent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ agentId: m001Id })
  }).then(r => r.json());
  
  console.log('✅ Resultado:', result);
  console.log(`   Docs re-indexados: ${result.documentsReindexed || 0}`);
  console.log(`   Docs con error: ${result.documentsFailed || 0}`);
  
  return result;
}

// Ejecutar
reindexM001();
```

---

## ✅ Verificación de Éxito

**Después de re-indexar, verificar:**

### **M001:**
```
1. Pregunta: "¿Qué es un OGUC?"
2. Click en cada referencia [1][2][3][4][5]
3. Verificar contenido:
   ✅ Fragmentos contienen texto útil
   ❌ NO contienen "INTRODUCCIÓN ..."
   ❌ NO contienen "Página X de Y"
```

**Resultado esperado:**
- Antes: 1 de 5 útil (20%)
- Después: 4-5 de 5 útiles (80-100%)

---

## 🔍 Troubleshooting

### **Error: "No documents found"**

**Causa:** Agente no tiene documentos asignados

**Solución:**
1. Verificar que PDFs estén subidos
2. Verificar que PDFs tengan `assignedToAgents` con el agentId
3. Usar Context Management Dashboard para asignar

### **Error: "No extractedData"**

**Causa:** Documento subido pero no extraído

**Solución:**
1. Click en configuración del documento ⚙️
2. Verificar status de extracción
3. Si dice "Error" → Re-extraer
4. Si dice "Processing" → Esperar
5. Si está "Complete" pero sin data → Bug, reportar

### **Error de permisos**

**Causa:** Firestore requiere autenticación

**Solución:**
```bash
gcloud auth application-default login
```

---

## 📊 Tiempo Estimado

**Por documento:**
- Chunking: ~5-10 segundos
- Embeddings: ~10-30 segundos (depende de chunks)
- Total: ~20-40 segundos por documento

**M001 (estimado ~13 documentos):**
- Total: ~4-8 minutos

**S001 (depende de cuántos tenga):**
- Si tiene docs: Similar a M001
- Si no tiene docs: 0 minutos (problema diferente)

---

## 📞 Comunicar a Sebastian

**Mensaje sugerido:**

> Hola Sebastian,
> 
> **Fixes implementados (2 de 5):**
> - ✅ FB-002: Anti-alucinación de referencias
> - ✅ FB-003: Filtro de fragmentos basura
> 
> **Re-indexing necesario para FB-003:**
> Necesitamos re-procesar los documentos de M001 para aplicar el filtro.
> 
> **¿Puedes ayudarnos?**
> Opción A: Re-indexa manualmente (sigue instrucciones arriba)
> Opción B: Esperamos a que arreglemos permisos y lo hacemos nosotros
> 
> **Testing que puedes hacer YA:**
> - FB-002: Pregunta en M1 "¿Qué es un OGUC?" → Verifica no inventa [7]
> 
> **Testing después de re-index:**
> - FB-003: Misma pregunta → Verifica fragmentos útiles (no "INTRODUCCIÓN...")

---

**Última actualización:** 2025-10-28  
**Archivos:** docs/INSTRUCCIONES_REINDEX_MANUAL.md  
**Tickets:** Ver docs/TICKETS_SEBASTIAN_2025-10-28.md

