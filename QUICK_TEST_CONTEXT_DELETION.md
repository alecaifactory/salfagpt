# 🧪 Quick Test - Borrado de Contexto por Agente

**Servidor:** `http://localhost:3000`  
**Tiempo:** ~3 minutos

---

## ✅ Test Rápido: Documento en Múltiples Agentes

### Setup (30 segundos):
1. **Login** en la aplicación
2. **Crea Agente A** (click + Nuevo Agente)
3. **Sube un PDF** en Agente A (cualquier PDF pequeño)
4. **Crea Agente B**
5. **Sube el MISMO PDF** en Agente B

**Estado esperado:**
- ✅ PDF visible en Agente A
- ✅ PDF visible en Agente B

---

### Test 1: Borrar de Agente A (1 minuto)

**Pasos:**
1. **En Agente A**, encuentra el PDF en "Fuentes de Contexto"
2. **Click en el ícono de basura** 🗑️
3. **Observa:** El PDF desaparece de la lista
4. **Refresca la página** (Cmd+R o F5)

**¿Qué deberías ver?**
- ✅ PDF **NO reaparece** en Agente A
- ✅ Lista de contexto se mantiene sin el PDF

---

### Test 2: Verificar en Agente B (30 segundos)

**Pasos:**
1. **Cambia a Agente B** (click en el nombre del agente en sidebar)
2. **Observa** la lista de "Fuentes de Contexto"

**¿Qué deberías ver?**
- ✅ PDF **SIGUE visible** en Agente B
- ✅ PDF tiene toggle activo (si lo tenías activo)
- ✅ PDF funcional y usable

---

### Test 3: Borrar de Agente B (1 minuto)

**Pasos:**
1. **En Agente B**, click en 🗑️ del PDF
2. **Observa:** PDF desaparece
3. **Refresca la página**

**¿Qué deberías ver?**
- ✅ PDF **NO reaparece** en Agente B
- ✅ PDF **eliminado completamente** (era el último agente)

---

## ✅ Test Alternativo: Documento en 1 Solo Agente

### Setup:
1. **Crea Agente C**
2. **Sube un PDF** diferente (solo en Agente C)

### Test:
1. **Borra el PDF** de Agente C
2. **Refresca la página**

**¿Qué deberías ver?**
- ✅ PDF **NO reaparece**
- ✅ PDF **eliminado completamente**

---

## 📊 Logs a Verificar

**Abre DevTools → Console**

### Al borrar de agente con otros asignados:
```
🗑️ Removing source abc123 from agent agent-A
📝 Removing agent agent-A from source abc123: { before: 2, after: 1 }
✅ Agent removed from context source: abc123, 1 agents remain
✅ Fuente removida del agente (1 agente(s) restante(s))
```

### Al borrar del último agente:
```
🗑️ Removing source abc123 from agent agent-B
📝 Removing agent agent-B from source abc123: { before: 1, after: 0 }
🗑️ Context source deleted (no agents remain): abc123
✅ Fuente eliminada completamente (sin agentes asignados)
```

---

## ✅ Criterios de Éxito

Todos estos deben ser **TRUE**:

- [ ] Borrar de Agente A → NO reaparece en A después de refresh
- [ ] Borrar de Agente A → SIGUE en Agente B
- [ ] Borrar de Agente B → Eliminación completa
- [ ] Borrar de único agente → Eliminación completa
- [ ] Logs muestran mensajes correctos

---

## ❌ Si Algo Falla

**Dime exactamente qué pasó:**

Ejemplo:
- "Borré de Agente A y refresqué, pero volvió a aparecer"
- "Borré de Agente A, pero también desapareció de Agente B"
- "Al borrar, no desaparece de la lista"

---

**Esto toma ~3 minutos. Por favor, ejecuta y confirma que funciona.** 🚀

