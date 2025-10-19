# Guía Rápida de Prueba - Referencias
**Date:** October 19, 2025

---

## 🧪 Test Rápido

### Paso 1: Abrir DevTools

1. Abre http://localhost:3000/chat
2. Presiona F12 (abre consola del navegador)
3. Ve a la pestaña "Console"

### Paso 2: Enviar Mensaje de Prueba

**Escribe en el chat:**
```
¿Cómo se calcula la superficie edificada de escaleras según la normativa chilena?
```

### Paso 3: Observar Logs

**En la consola del navegador, busca:**

```javascript
// 1. Thinking steps
✅ Message complete event received

// 2. Referencias en completion
📚 References in completion: X  // ← ¿Qué número sale aquí?

// 3. Referencias en MessageRenderer  
📚 MessageRenderer received references: X  // ← ¿Y aquí?
```

### Paso 4: Observar UI

**En el mensaje del AI, busca:**

1. **Durante generación:**
   - ✓ Pensando...
   - ✓ Buscando Contexto Relevante...
   - ⏳ Seleccionando Chunks...
   - ⏳ Generando Respuesta...

2. **Después de generación:**
   - Texto de respuesta
   - Scroll hacia abajo
   - **Buscar línea divisoria** (border-top)
   - **Buscar "📚 Referencias utilizadas"**

---

## 📊 Resultados Esperados

### Escenario 1: Todo Funciona ✅

**Logs:**
```
📚 References in completion: 3
📚 MessageRenderer received references: 3
  [1] Circular DDU.pdf - 87.3% - Chunk #2
  [2] OGUC.pdf - 76.5% - Chunk #5  
  [3] Manual.pdf - 68.2% - Chunk #8
```

**UI:**
- Footer visible con 3 referencias
- Cada una muestra: número, nombre, similitud, snippet
- Click abre panel derecho

### Escenario 2: RAG No Genera Referencias ❌

**Logs:**
```
📚 References in completion: 0
📚 MessageRenderer: No references received
```

**Causa:** RAG no encontró chunks relevantes o no está activo

**Fix:** Ver TROUBLESHOOTING_REFERENCES_2025-10-19.md

### Escenario 3: Referencias Se Pierden ❌

**Logs:**
```
📚 References in completion: 3  ← OK
📚 MessageRenderer: No references received  ← ¡PROBLEMA!
```

**Causa:** Referencias no se pasan en props o se pierden en transform

**Fix:** Verificar línea 2690 de ChatInterfaceWorking.tsx

---

## 🎯 Reporte

**Por favor, copia y pega:**

1. **Los logs de la consola** (todo lo que veas relacionado con "references")
2. **Screenshot de la UI** (el mensaje del AI completo)
3. **Dime si ves el footer** de referencias o no

**Con esa información puedo identificar exactamente el problema.** 🔍


