# 🎯 Analytics Complete - Guía de Uso

**Archivo:** `analytics-complete.json`  
**Tamaño:** 215 KB  
**Período:** 30 días (Oct 31 - Nov 30, 2025)  
**Registros:** 197 conversaciones, 48 usuarios, 41 agentes

---

## ✅ TODO Lo Que Pediste - INCLUIDO

### 1. ✅ Los 4 Agentes Principales por Día (últimos 30 días)
**Datos:** `dailyInteractions`
- M3-v2: 4 días con actividad
- S1-v2: 6 días con actividad
- S2-v2: 7 días con actividad
- M1-v2: 4 días con actividad

### 2. ✅ Agrupar por Agente
**Datos:** `agents` + `dailyInteractions` + `hourlyInteractions`
- Filtrar por `agentCode` o `agentId`
- Ver métricas específicas por agente

### 3. ✅ Agrupar por Dominio
**Datos:** `domains` + todos los arrays incluyen campo `domain`
- Filtrar por `domain` (ej: "salfagestion.cl")
- Ver usuarios y actividad por dominio

### 4. ✅ Filtrar por Compartido/No Compartido
**Datos:** Campo `isShared` y `status` en todos los registros
- Filtrar donde `status === 'Producción'` (compartidos)
- Filtrar donde `status === 'Privado'` (no compartidos)

### 5. ✅ Filtrar Usuarios por Correo
**Datos:** Campo `userEmail` en todos los registros
- Filtrar por email específico
- Buscar actividad de un usuario

### 6. ✅ Filtrar por Día y Hora
**Datos:** `dailyInteractions` (día) + `hourlyInteractions` (hora)
- Filtrar por `date` (YYYY-MM-DD)
- Filtrar por `hour` (0-23)
- Filtrar por `dayName` (lunes, martes, etc.)

### 7. ✅ Ver Conversaciones Realizadas
**Datos:** `conversations` (197 conversaciones únicas)
- Cada conversación con título, usuario, fechas
- Tipo: 'agent' o 'chat'
- Mensajes totales por conversación

---

## 📊 Estructura Detallada del JSON

### metadata
```json
{
  "generated": "2025-11-29T22:59:10.564Z",
  "periodStart": "2025-10-31",
  "periodEnd": "2025-11-30",
  "totalDays": 30
}
```

### summary
```json
{
  "totalMessages": 1696,
  "totalQuestions": 865,
  "totalResponses": 831,
  "uniqueUsers": 48,
  "uniqueAgents": 41,
  "uniqueConversations": 197,
  "agentsInProduction": 5,
  "privateAgents": 36
}
```

### agents (41 agentes)
```json
[
  {
    "agentId": "vStojK73ZKbjNsEnqANJ",
    "agentCode": "M3-v2",  // ← Para filtrar fácilmente
    "agentTitle": "GOP GPT (M3-v2)",
    "ownerEmail": "alec@getaifactory.com",
    "ownerName": "Alec Dickinson",
    "isShared": true,
    "sharedWithCount": 14,
    "status": "Producción"  // ← Producción o Privado
  },
  ...
]
```

### users (48 usuarios)
```json
[
  {
    "userId": "usr_uhwqffaqag1wrryd82tw",
    "userEmail": "alec@getaifactory.com",
    "userName": "Alec Dickinson",
    "domain": "getaifactory.com"  // ← Para filtrar por dominio
  },
  ...
]
```

### domains (14 dominios)
```json
[
  {
    "domain": "salfagestion.cl",
    "userCount": 15
  },
  ...
]
```

### dailyInteractions (48 registros) ⭐ CLAVE
**Cada registro = 1 día × 1 agente × 1 usuario**

```json
[
  {
    "date": "2025-11-25",  // ← Filtrar por día
    "dayName": "lunes",
    "dayOfWeek": 1,
    "agentId": "vStojK73ZKbjNsEnqANJ",
    "agentCode": "M3-v2",  // ← Filtrar por agente
    "agentTitle": "GOP GPT (M3-v2)",
    "userId": "usr_uhwqffaqag1wrryd82tw",
    "userEmail": "alec@getaifactory.com",  // ← Filtrar por email
    "userName": "Alec Dickinson",
    "domain": "getaifactory.com",  // ← Filtrar por dominio
    "isShared": true,  // ← Filtrar por compartido
    "status": "Producción",
    "questions": 25,  // Preguntas ese día
    "responses": 25,  // Respuestas ese día
    "totalMessages": 50  // Total ese día
  },
  ...
]
```

### hourlyInteractions (79 registros) ⭐ CLAVE
**Cada registro = 1 hora × 1 agente × 1 usuario**

```json
[
  {
    "date": "2025-11-25",
    "hour": 14,  // ← Filtrar por hora (14 = 2 PM)
    "hourLabel": "14:00",
    "agentId": "vStojK73ZKbjNsEnqANJ",
    "agentCode": "M3-v2",
    "agentTitle": "GOP GPT (M3-v2)",
    "userId": "usr_uhwqffaqag1wrryd82tw",
    "userEmail": "alec@getaifactory.com",
    "userName": "Alec Dickinson",
    "domain": "getaifactory.com",
    "isShared": true,
    "status": "Producción",
    "questions": 15,  // Preguntas esa hora
    "responses": 15,  // Respuestas esa hora
    "totalMessages": 30  // Total esa hora
  },
  ...
]
```

### conversations (197 conversaciones) ⭐ LISTADO
**Cada chat session individual**

```json
[
  {
    "conversationId": "abc123",
    "conversationType": "chat",  // agent o chat
    "agentId": "vStojK73ZKbjNsEnqANJ",
    "agentCode": "M3-v2",
    "agentTitle": "GOP GPT (M3-v2)",
    "conversationTitle": "Consulta sobre GOP",  // ← Título del chat
    "userId": "usr_2uvqilsx8m7vr3evr0ch",
    "userEmail": "fdiazt@salfagestion.cl",
    "userName": "FRANCIS ANAIS DIAZ TOBAR",
    "domain": "salfagestion.cl",
    "isShared": true,
    "status": "Producción",
    "firstMessage": "2025-11-25T10:30:00.000Z",
    "lastMessage": "2025-11-25T11:45:00.000Z",
    "totalMessages": 16,
    "questions": 8,
    "responses": 8,
    "daysActive": 1
  },
  ...
]
```

---

## 🔍 Ejemplos de Consultas

### Query 1: ¿Cómo se usó M3-v2 los últimos 30 días?

```javascript
const m3Data = data.dailyInteractions.filter(d => d.agentCode === 'M3-v2');

// Agrupar por día
const byDay = {};
m3Data.forEach(d => {
  if (!byDay[d.date]) byDay[d.date] = { questions: 0, users: new Set() };
  byDay[d.date].questions += d.questions;
  byDay[d.date].users.add(d.userEmail);
});

// Ver tendencia
Object.entries(byDay).forEach(([date, stats]) => {
  console.log(`${date}: ${stats.questions} preguntas, ${stats.users.size} usuarios`);
});
```

### Query 2: ¿Qué usuarios usaron S1-v2 y cuándo?

```javascript
const s1Data = data.dailyInteractions.filter(d => d.agentCode === 'S1-v2');

// Agrupar por usuario
const byUser = {};
s1Data.forEach(d => {
  if (!byUser[d.userEmail]) {
    byUser[d.userEmail] = {
      name: d.userName,
      domain: d.domain,
      totalQuestions: 0,
      days: []
    };
  }
  byUser[d.userEmail].totalQuestions += d.questions;
  byUser[d.userEmail].days.push({
    date: d.date,
    questions: d.questions
  });
});

// Resultado
console.log(JSON.stringify(byUser, null, 2));
```

### Query 3: ¿A qué hora del día se usan más los 4 agentes?

```javascript
const mainAgents = ['M3-v2', 'S1-v2', 'S2-v2', 'M1-v2'];
const hourlyData = data.hourlyInteractions.filter(h => 
  mainAgents.includes(h.agentCode)
);

// Agrupar por hora
const byHour = {};
hourlyData.forEach(h => {
  if (!byHour[h.hour]) byHour[h.hour] = 0;
  byHour[h.hour] += h.totalMessages;
});

// Ver distribución
Object.entries(byHour)
  .sort((a, b) => b[1] - a[1])
  .forEach(([hour, messages]) => {
    console.log(`${hour}:00 - ${messages} mensajes`);
  });
```

### Query 4: ¿Qué conversaciones se crearon con S2-v2?

```javascript
const s2Conversations = data.conversations.filter(c => c.agentCode === 'S2-v2');

console.log(`Total conversaciones con S2-v2: ${s2Conversations.length}`);

s2Conversations.forEach(conv => {
  console.log(`
    Título: ${conv.conversationTitle}
    Usuario: ${conv.userEmail}
    Mensajes: ${conv.totalMessages}
    Fecha: ${conv.firstMessage.split('T')[0]}
  `);
});
```

### Query 5: ¿Uso por dominio de agentes en producción?

```javascript
const prodData = data.dailyInteractions.filter(d => d.status === 'Producción');

// Agrupar por dominio
const byDomain = {};
prodData.forEach(d => {
  if (!byDomain[d.domain]) {
    byDomain[d.domain] = {
      users: new Set(),
      questions: 0,
      agents: new Set()
    };
  }
  byDomain[d.domain].users.add(d.userEmail);
  byDomain[d.domain].questions += d.questions;
  byDomain[d.domain].agents.add(d.agentCode);
});

// Resultado
Object.entries(byDomain).forEach(([domain, stats]) => {
  console.log(`${domain}: ${stats.users.size} usuarios, ${stats.questions} preguntas, ${stats.agents.size} agentes`);
});
```

### Query 6: ¿Cuándo fue la última vez que fdiazt@ usó cada agente?

```javascript
const fdiaztData = data.conversations.filter(c => 
  c.userEmail === 'fdiazt@salfagestion.cl'
);

// Agrupar por agente
const byAgent = {};
fdiaztData.forEach(conv => {
  if (!byAgent[conv.agentCode]) {
    byAgent[conv.agentCode] = {
      title: conv.agentTitle,
      lastUsed: conv.lastMessage,
      totalMessages: 0
    };
  }
  
  if (conv.lastMessage > byAgent[conv.agentCode].lastUsed) {
    byAgent[conv.agentCode].lastUsed = conv.lastMessage;
  }
  
  byAgent[conv.agentCode].totalMessages += conv.totalMessages;
});

// Resultado
console.log(JSON.stringify(byAgent, null, 2));
```

---

## 🎨 Para el Dashboard - Filtros Avanzados

### Filtro Multi-dimensional:

```typescript
interface FilterState {
  agentCodes: string[];  // ['M3-v2', 'S1-v2'] o []
  userEmails: string[];  // ['alec@...'] o []
  domains: string[];     // ['salfagestion.cl'] o []
  dateRange: { start: string; end: string };
  hours: number[];       // [9, 10, 11, 12, 13, 14] o []
  status: 'all' | 'Producción' | 'Privado';
}

// Aplicar filtros
function filterData(data, filters) {
  let filtered = data.dailyInteractions;
  
  // Filtrar por agente
  if (filters.agentCodes.length > 0) {
    filtered = filtered.filter(d => filters.agentCodes.includes(d.agentCode));
  }
  
  // Filtrar por usuario
  if (filters.userEmails.length > 0) {
    filtered = filtered.filter(d => filters.userEmails.includes(d.userEmail));
  }
  
  // Filtrar por dominio
  if (filters.domains.length > 0) {
    filtered = filtered.filter(d => filters.domains.includes(d.domain));
  }
  
  // Filtrar por fecha
  filtered = filtered.filter(d => 
    d.date >= filters.dateRange.start && 
    d.date <= filters.dateRange.end
  );
  
  // Filtrar por status
  if (filters.status !== 'all') {
    filtered = filtered.filter(d => d.status === filters.status);
  }
  
  return filtered;
}
```

---

## 📊 Análisis que Puedes Hacer

### 1. Uso Diario de los 4 Principales

**Pregunta:** "¿Cómo se usaron M3, S1, S2, M1 cada día?"

**Datos:** `dailyInteractions`

**Código:**
```javascript
const mainAgents = ['M3-v2', 'S1-v2', 'S2-v2', 'M1-v2'];
const dailyUsage = data.dailyInteractions
  .filter(d => mainAgents.includes(d.agentCode));

// Crear tabla día × agente
const table = {};
dailyUsage.forEach(d => {
  if (!table[d.date]) table[d.date] = {};
  if (!table[d.date][d.agentCode]) {
    table[d.date][d.agentCode] = { questions: 0, users: new Set() };
  }
  table[d.date][d.agentCode].questions += d.questions;
  table[d.date][d.agentCode].users.add(d.userEmail);
});

// Resultado: tabla con días × agentes
```

**Gráfico sugerido:** Líneas múltiples (1 línea por agente, X=días, Y=mensajes)

---

### 2. Patrones por Hora de los 4 Principales

**Pregunta:** "¿A qué horas se usan M3, S1, S2, M1?"

**Datos:** `hourlyInteractions`

**Código:**
```javascript
const mainAgents = ['M3-v2', 'S1-v2', 'S2-v2', 'M1-v2'];
const hourlyUsage = data.hourlyInteractions
  .filter(h => mainAgents.includes(h.agentCode));

// Agrupar por hora × agente
const byHour = {};
hourlyUsage.forEach(h => {
  if (!byHour[h.hour]) byHour[h.hour] = {};
  if (!byHour[h.hour][h.agentCode]) byHour[h.hour][h.agentCode] = 0;
  byHour[h.hour][h.agentCode] += h.totalMessages;
});

// Resultado: heatmap hora × agente
```

**Gráfico sugerido:** Heatmap (X=hora, Y=agente, Color=intensidad)

---

### 3. Usuarios por Agente por Dominio

**Pregunta:** "¿Qué dominios usan qué agentes?"

**Datos:** `dailyInteractions`

**Código:**
```javascript
const mainAgents = ['M3-v2', 'S1-v2', 'S2-v2', 'M1-v2'];
const usage = data.dailyInteractions
  .filter(d => mainAgents.includes(d.agentCode));

// Agrupar por dominio × agente
const byDomainAgent = {};
usage.forEach(d => {
  if (!byDomainAgent[d.domain]) byDomainAgent[d.domain] = {};
  if (!byDomainAgent[d.domain][d.agentCode]) {
    byDomainAgent[d.domain][d.agentCode] = {
      users: new Set(),
      questions: 0
    };
  }
  byDomainAgent[d.domain][d.agentCode].users.add(d.userEmail);
  byDomainAgent[d.domain][d.agentCode].questions += d.questions;
});

// Resultado: tabla dominio × agente
```

**Gráfico sugerido:** Barras agrupadas (agrupadas por dominio, series por agente)

---

### 4. Conversaciones Específicas por Agente

**Pregunta:** "¿Qué conversaciones se hicieron con S1-v2?"

**Datos:** `conversations`

**Código:**
```javascript
const s1Conversations = data.conversations
  .filter(c => c.agentCode === 'S1-v2')
  .sort((a, b) => b.totalMessages - a.totalMessages);

// Mostrar lista
s1Conversations.forEach(conv => {
  console.log(`
    📝 ${conv.conversationTitle}
    👤 ${conv.userEmail}
    📅 ${conv.firstMessage.split('T')[0]}
    💬 ${conv.totalMessages} mensajes
  `);
});
```

---

### 5. Actividad de Usuario Específico

**Pregunta:** "¿Qué hizo fdiazt@salfagestion.cl?"

**Datos:** `dailyInteractions` + `conversations`

**Código:**
```javascript
const userEmail = 'fdiazt@salfagestion.cl';

// Actividad por día
const dailyActivity = data.dailyInteractions
  .filter(d => d.userEmail === userEmail)
  .sort((a, b) => a.date.localeCompare(b.date));

console.log(`Actividad de ${userEmail}:`);
dailyActivity.forEach(d => {
  console.log(`${d.date} ${d.dayName}: ${d.agentTitle} - ${d.questions} preguntas`);
});

// Conversaciones
const userConvs = data.conversations
  .filter(c => c.userEmail === userEmail);

console.log(`\nConversaciones: ${userConvs.length}`);
userConvs.forEach(c => {
  console.log(`- ${c.conversationTitle} (${c.agentCode}): ${c.totalMessages} mensajes`);
});
```

---

### 6. Comparar Producción vs Privados

**Pregunta:** "¿Cómo difiere el uso entre compartidos y privados?"

**Datos:** `dailyInteractions`

**Código:**
```javascript
const production = data.dailyInteractions.filter(d => d.status === 'Producción');
const privados = data.dailyInteractions.filter(d => d.status === 'Privado');

const prodStats = {
  totalMessages: production.reduce((sum, d) => sum + d.totalMessages, 0),
  uniqueUsers: new Set(production.map(d => d.userId)).size,
  uniqueAgents: new Set(production.map(d => d.agentId)).size
};

const privStats = {
  totalMessages: privados.reduce((sum, d) => sum + d.totalMessages, 0),
  uniqueUsers: new Set(privados.map(d => d.userId)).size,
  uniqueAgents: new Set(privados.map(d => d.agentId)).size
};

console.log('Producción:', prodStats);
console.log('Privados:', privStats);
```

---

## 🎯 Para el Dashboard - Implementación

### Component: AdvancedFilters

```typescript
interface FilterState {
  agentCodes: string[];
  userEmails: string[];
  domains: string[];
  startDate: string;
  endDate: string;
  hours: number[];
  status: 'all' | 'Producción' | 'Privado';
}

function AdvancedFilters({ data, onFilterChange }) {
  const [filters, setFilters] = useState<FilterState>({
    agentCodes: [],
    userEmails: [],
    domains: [],
    startDate: data.metadata.periodStart,
    endDate: data.metadata.periodEnd,
    hours: [],
    status: 'all'
  });
  
  // Multi-select para agentes
  <MultiSelect
    label="Agentes"
    options={data.agents.map(a => ({
      value: a.agentCode,
      label: a.agentTitle
    }))}
    selected={filters.agentCodes}
    onChange={codes => setFilters({...filters, agentCodes: codes})}
  />
  
  // Multi-select para usuarios
  <MultiSelect
    label="Usuarios"
    options={data.users.map(u => ({
      value: u.userEmail,
      label: `${u.userName} (${u.userEmail})`
    }))}
    selected={filters.userEmails}
    onChange={emails => setFilters({...filters, userEmails: emails})}
  />
  
  // Multi-select para dominios
  <MultiSelect
    label="Dominios"
    options={data.domains.map(d => ({
      value: d.domain,
      label: `${d.domain} (${d.userCount} usuarios)`
    }))}
    selected={filters.domains}
    onChange={domains => setFilters({...filters, domains: domains})}
  />
  
  // Status: Producción / Privado
  <Select
    label="Estado"
    value={filters.status}
    onChange={status => setFilters({...filters, status})}
  >
    <option value="all">Todos</option>
    <option value="Producción">Producción (5)</option>
    <option value="Privado">Privados (36)</option>
  </Select>
  
  // Date range
  <DateRangePicker
    startDate={filters.startDate}
    endDate={filters.endDate}
    onChange={(start, end) => setFilters({...filters, startDate: start, endDate: end})}
  />
  
  // Hours multi-select
  <MultiSelect
    label="Horas del día"
    options={Array.from({length: 24}, (_, i) => ({
      value: i,
      label: `${i.toString().padStart(2, '0')}:00`
    }))}
    selected={filters.hours}
    onChange={hours => setFilters({...filters, hours})}
  />
}
```

---

## 📈 Tablas/Gráficos que Puedes Crear

### Tabla 1: Uso Diario por Agente
**Fuente:** `dailyInteractions`

| Fecha | M3-v2 | S1-v2 | S2-v2 | M1-v2 |
|-------|-------|-------|-------|-------|
| Nov 25 | 50 msg | 13 msg | - | - |
| Nov 26 | - | - | 24 msg | - |
| ... | ... | ... | ... | ... |

---

### Tabla 2: Usuarios por Agente
**Fuente:** `dailyInteractions` agrupado

| Usuario | M3-v2 | S1-v2 | S2-v2 | M1-v2 | Total |
|---------|-------|-------|-------|-------|-------|
| alec@ | 50 | 91 | 64 | 26 | 231 |
| fdiazt@ | 16 | 6 | 12 | 18 | 52 |
| ... | ... | ... | ... | ... | ... |

---

### Gráfico 1: Línea de Tiempo Multi-Agente
**Tipo:** Líneas múltiples
- X: Fecha (30 días)
- Y: Mensajes
- Series: 4 líneas (M3, S1, S2, M1)

---

### Gráfico 2: Heatmap Hora × Agente
**Tipo:** Heatmap
- X: Hora (0-23)
- Y: Agente (M3, S1, S2, M1)
- Color: Intensidad de uso

---

### Gráfico 3: Barras Dominio × Agente
**Tipo:** Barras agrupadas
- X: Dominio
- Series: 4 barras por dominio (M3, S1, S2, M1)

---

## 📋 Dimensiones Disponibles

**Puedes filtrar/agrupar por:**

1. ✅ **Agente** (`agentCode`, `agentId`, `agentTitle`)
2. ✅ **Usuario** (`userId`, `userEmail`, `userName`)
3. ✅ **Dominio** (`domain`)
4. ✅ **Fecha** (`date`, `dayName`, `dayOfWeek`)
5. ✅ **Hora** (`hour`, `hourLabel`)
6. ✅ **Status** (`status`: Producción/Privado, `isShared`)
7. ✅ **Conversación** (`conversationId`, `conversationTitle`)

**Cruces posibles:**
- Agente × Día
- Agente × Usuario
- Agente × Dominio
- Agente × Hora
- Usuario × Día
- Usuario × Hora
- Dominio × Agente
- Status × cualquier dimensión
- ... ¡infinitas combinaciones!

---

## ✅ Archivo Listo

**Ubicación:** `/Users/alec/aifactory/exports/salfa-analytics/analytics-complete.json`

**Tamaño:** 215 KB

**Registros:**
- 41 agentes
- 48 usuarios
- 14 dominios
- 48 interacciones diarias (día × agente × usuario)
- 79 interacciones por hora (hora × agente × usuario)
- 197 conversaciones completas

**Todos los campos para filtrar están presentes en cada registro** ✅

---

## 🚀 Próximo Paso

1. **Cargar JSON en dashboard:**
   ```typescript
   const data = await fetch('/data/analytics-complete.json').then(r => r.json());
   ```

2. **Implementar filtros avanzados** (multi-select para cada dimensión)

3. **Crear visualizaciones dinámicas** que respondan a filtros

4. **Resultado:** Dashboard súper flexible con análisis multi-dimensional ✅

---

**✅ TIENES TODO LO QUE NECESITAS PARA ANÁLISIS AVANZADO!**


