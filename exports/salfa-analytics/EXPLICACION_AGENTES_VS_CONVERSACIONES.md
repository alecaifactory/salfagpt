# 🎯 AGENTES vs CONVERSACIONES - Explicación

## ✅ Problema Resuelto

**Antes:** El archivo `agent_performance.csv` mezclaba agentes Y conversaciones (772 registros)
**Ahora:** Solo incluye AGENTES reales con `isAgent: true` (41 registros) ✅

---

## 📊 La Diferencia

### 🤖 AGENTE (isAgent: true)
**Qué es:** Plantilla/configuración reutilizable

**Ejemplos:**
- ✅ "GOP GPT (M3-v2)" - Agente oficial
- ✅ "SSOMA" - Agente de seguridad
- ✅ "Gestion Bodegas (S1-v2)" - Agente de inventario
- ✅ "Maqsa Mantenimiento (S2-v2)" - Agente de mantenimiento

**Características:**
- Tiene configuración definida (modelo, prompt, contexto)
- Es reutilizable
- Aparece en filtros del dashboard
- Los usuarios lo seleccionan para crear chats

**En Firestore:**
```javascript
{
  id: "vStojK73ZKbjNsEnqANJ",
  title: "GOP GPT (M3-v2)",
  isAgent: true,  // ✅ ESTO LO IDENTIFICA
  userId: "...",
  agentModel: "gemini-2.5-pro",
  systemPrompt: "Eres un experto en...",
  activeContextSourceIds: ["doc1", "doc2"]
}
```

---

### 💬 CONVERSACIÓN (isAgent: false o undefined)
**Qué es:** Chat derivado de un agente

**Ejemplos:**
- ❌ "Nuevo Chat" - Chat temporal
- ❌ "Nueva Conversación" - Sesión de usuario
- ❌ "Hola, puede ayudar..." - Primera pregunta del usuario

**Características:**
- Hereda configuración del agente padre
- Es una instancia de uso
- NO debe aparecer en filtros de agentes
- Es un chat específico de un usuario

**En Firestore:**
```javascript
{
  id: "abc123",
  title: "Nuevo Chat",
  isAgent: false,  // ✅ O undefined
  agentId: "vStojK73ZKbjNsEnqANJ",  // Referencia al agente padre
  userId: "...",
  messageCount: 15
}
```

---

## 🔧 Cómo se Solucionó

### Antes (Incorrecto):
```typescript
// Incluía TODAS las conversaciones (agentes + chats)
const agentStats = messages.group(by conversationId)
// Resultado: 772 registros (41 agentes + 731 conversaciones)
```

### Ahora (Correcto):
```typescript
// Paso 1: Identificar solo agentes reales
const onlyAgentsMap = conversations.filter(c => c.isAgent === true)
// Resultado: 41 agentes

// Paso 2: Sumar mensajes de agente + sus conversaciones hijas
for (conversación with agentId) {
  sumar mensajes al agente padre
}

// Paso 3: Exportar SOLO los 41 agentes
```

---

## 📋 Resultado en agent_performance.csv

**Total registros:** 41 (solo agentes con isAgent: true)

**Top 10 Agentes:**
1. GOP GPT (M3-v2) - 164 mensajes
2. SSOMA - 152 mensajes  
3. Gestion Bodegas (S1-v2) - 149 mensajes
4. Maqsa Mantenimiento (S2-v2) - 92 mensajes
5. Asistente Legal Territorial RDI (M1-v2) - 52 mensajes
6. SSOMA Vision - 12 mensajes
7. M002 - 6 mensajes
8. SSOMA v2 - 6 mensajes
9. Nuevo Agente (nfarias) - 4 mensajes
10. SSOMA v3 - 4 mensajes

**✅ YA NO aparecen:** "Nuevo Chat", "Nueva Conversación", "Hola puede ayudar..."

---

## 🎯 Para el Dashboard

### Filtro de Asistentes (RF-02.3)

**Usar:** `agent_performance.csv`

**Dropdown debe mostrar:**
```
Todos los Asistentes
GOP GPT (M3-v2)
SSOMA
Gestion Bodegas (S1-v2)
Maqsa Mantenimiento (S2-v2)
Asistente Legal Territorial RDI (M1-v2)
... (solo 41 opciones)
```

**NO debe mostrar:**
```
❌ Nuevo Chat
❌ Nueva Conversación  
❌ Hola, puede ayudar...
❌ (ninguna conversación derivada)
```

---

## 📊 Conteo de Mensajes

**Los mensajes se suman correctamente:**

```
Agente "GOP GPT (M3-v2)" (id: vStojK73ZKbjNsEnqANJ)
├─ Mensajes directos en el agente: X
└─ Mensajes en conversaciones hijas: Y
   └─ Total: 164 mensajes ✅
```

Así que aunque un usuario haya creado 5 chats usando "GOP GPT", en el dashboard solo ves:
- **1 entrada:** "GOP GPT (M3-v2)" con la suma de todos sus mensajes

---

## ✅ Verificación

**Comando para ver solo agentes:**
```bash
head -15 agent_performance.csv
```

**Debe mostrar:**
- Solo nombres de agentes oficiales
- Sin "Nuevo Chat", "Nueva Conversación"
- 41 filas totales (+ 1 header = 42 líneas)

---

## 🔄 Si Necesitas Regenerar

```bash
# El script ahora diferencia correctamente
npx tsx scripts/export-salfagpt-dashboard.ts --days=90

# Verifica que agent_performance.csv tenga ~41 filas
wc -l exports/salfa-analytics/agent_performance.csv
# Debe mostrar: 41 (o 42 con header)
```

---

**✅ PROBLEMA RESUELTO:** 
- Agentes (41) separados de conversaciones (1,348)
- Solo agentes aparecen en filtros del dashboard
- Mensajes agregados correctamente (agente + chats hijos)


