# 📚 Expert Review System - Guía de Usuario

**Fecha:** 2025-11-09  
**Audiencia:** SuperAdmin, Admin, Expertos, Especialistas, Usuarios Finales  
**Objetivo:** Explicar quién ve qué, quién configura qué, y cómo usar cada interface

---

## 🎯 MENU EVALUACIONES - Guía Completa

El menu **EVALUACIONES** tiene **5 secciones**. Cada usuario ve diferentes secciones según su rol.

---

## 👥 QUIÉN VE QUÉ (Por Rol)

### 🌍 SuperAdmin (alec@getaifactory.com)

**Ve en menu EVALUACIONES:**
1. ✅ **Panel Supervisor** - Ver TODAS las interacciones de TODOS los domains
2. ✅ **Mis Asignaciones** - Si tiene asignaciones como specialist
3. ✅ **Aprobar Correcciones** - Aprobar cambios para CUALQUIER domain
4. ✅ **Config. Evaluación** - Configurar reglas GLOBALES de priorización
5. ✅ **Dashboard Calidad** - Ver DQS de TODOS los domains (cross-domain)

**Permisos especiales:**
- Ve TODO cross-domain (no restriction)
- Configura reglas globales
- Aprueba para cualquier domain
- Dashboard muestra plataforma completa

---

### 👑 Admin de Domain (admin@maqsa.cl)

**Ve en menu EVALUACIONES:**
1. ✅ **Panel Supervisor** - Ver interacciones de SU domain (maqsa.cl)
2. ❌ **Mis Asignaciones** - NO (solo si es specialist)
3. ✅ **Aprobar Correcciones** - Aprobar SOLO para SU domain
4. ✅ **Config. Evaluación** - Configurar reglas de SU domain
5. ✅ **Dashboard Calidad** - Ver DQS de SU domain únicamente

**Permisos limitados:**
- Ve SOLO su domain (domain-scoped)
- Configura SOLO su domain
- Aprueba SOLO para su domain
- Dashboard muestra solo su domain

---

### 👨‍💼 Expert Supervisor (expert@maqsa.cl)

**Ve en menu EVALUACIONES:**
1. ✅ **Panel Supervisor** - Ver interacciones de agentes ASIGNADOS a él
2. ❌ **Mis Asignaciones** - NO (no es specialist)
3. ❌ **Aprobar Correcciones** - NO (solo propone, no aprueba)
4. ❌ **Config. Evaluación** - NO (solo admins configuran)
5. ✅ **Dashboard Calidad** - Ver métricas de agentes asignados

**Permisos:**
- Ve SOLO agentes donde tiene permiso de supervisor
- Evalúa y propone correcciones
- Asigna a specialists
- Dashboard muestra su performance

---

### 👨‍⚕️ Expert Specialist (specialist@maqsa.cl)

**Ve en menu EVALUACIONES:**
1. ❌ **Panel Supervisor** - NO (no tiene ese rol)
2. ✅ **Mis Asignaciones** - Ver SOLO interactions asignadas a MÍ
3. ❌ **Aprobar Correcciones** - NO (solo propone)
4. ❌ **Config. Evaluación** - NO
5. ✅ **Dashboard Calidad** - Ver sus specialty metrics

**Permisos:**
- Ve SOLO lo asignado a él (most restricted)
- Evalúa solo sus assignments
- NO ve queue completa
- Dashboard muestra specialty performance

---

### 👤 Usuario Final (user@maqsa.cl)

**Ve en menu EVALUACIONES:**
1. ❌ **Panel Supervisor** - NO
2. ❌ **Mis Asignaciones** - NO
3. ❌ **Aprobar Correcciones** - NO
4. ❌ **Config. Evaluación** - NO
5. ✅ **Dashboard Calidad** - Ver SU contribución personal

**Puede hacer:**
- ⭐ Calificar respuestas (1-5 estrellas)
- 💬 Agregar comentarios
- 📊 Ver su dashboard de contribución
- 🏆 Ver badges ganados
- 📈 Ver su impacto (respuestas mejoradas)

---

## 🔧 1. PANEL SUPERVISOR - Quién Configura y Cómo

### SuperAdmin Configura:

#### En "Config. Evaluación" (Sección 4):

**Configuraciones GLOBALES:**

1. **Umbral de Prioridad por Rating:**
   ```
   Interacciones con rating ≤ [3] estrellas se marcan como prioritarias
   
   UI:
   - Slider: 1 - 5 estrellas
   - Default: 3 estrellas
   - Aplica a TODOS los domains
   ```

2. **Expertos Disponibles:**
   ```
   Asignar usuarios como "Experto Supervisor" para domains/agentes
   
   UI:
   - Lista de users
   - Checkbox por domain
   - Checkbox por agente
   - Save → Usuario ahora ve ese agente en Panel Supervisor
   ```

3. **Especialistas Disponibles:**
   ```
   Asignar usuarios como "Especialista" con specialty
   
   UI:
   - User dropdown
   - Specialty: Legal, Técnica, Médica, Financiera, etc.
   - Save → Usuario recibe assignments de esa specialty
   ```

---

### Admin de Domain Configura:

#### En "Config. Evaluación" (Sección 4):

**Configuraciones de SU DOMAIN:**

1. **Umbral de Prioridad (domain-specific):**
   ```
   Override del umbral global para este domain
   
   UI:
   - "Usar umbral global" (checkbox)
   - O custom: Slider 1-5
   - Aplica solo a su domain (ej: maqsa.cl)
   ```

2. **Expertos para SU domain:**
   ```
   Asignar supervisors a agentes de su domain
   
   UI:
   - Dropdown: Expertos disponibles
   - Checkboxes: Agentes de MI domain
   - Save → Expert ve esos agentes
   ```

3. **Email Alerts:**
   ```
   Umbral de volumen para alerts a supervisors
   
   UI:
   - "Alertar cuando items prioritarios > [10]"
   - Number input
   - Email frequency dropdown
   ```

---

## 🎨 2. MIS ASIGNACIONES - Cómo Funciona

### Quién Lo Ve:
- ✅ **Specialists** únicamente

### Cómo Se Asignan:

**Flujo:**
```
1. User califica respuesta ≤3 estrellas
   ↓
2. Item aparece en Panel Supervisor
   ↓
3. Expert Supervisor revisa
   ↓
4. Si compleja → Click "Asignar a Especialista"
   ↓
5. AI sugiere specialist (match score 94%)
   ↓
6. Expert confirma assignment
   ↓
7. Specialist recibe en "Mis Asignaciones"
   ↓
8. Email notification (semanal)
```

**UI que ve Specialist:**
```
┌─────────────────────────────────────────┐
│ Mis Asignaciones                        │
├─────────────────────────────────────────┤
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ 🎯 94% match - Perfect for you      │ │
│ │                                     │ │
│ │ Asignación: Legal - Condominio      │ │
│ │ Asignado por: Juan (Supervisor)     │ │
│ │ Deadline: Esta semana               │ │
│ │ Prioridad: Alta                     │ │
│ │                                     │ │
│ │ Pregunta:                           │ │
│ │ "¿Cuál es la diferencia entre..."   │ │
│ │                                     │ │
│ │ [Evaluar] [No aplica a mi specialty]│ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Total: 3 asignaciones pendientes        │
└─────────────────────────────────────────┘
```

**Opciones del Specialist:**
- ✅ **Evaluar** - Llenar formulario de evaluación
- ✅ **No aplica** - Re-route a otro specialist
- ✅ **Devolver** - Return to supervisor con comentarios

---

## ✅ 3. APROBAR CORRECCIONES - Workflow Completo

### Quién Lo Ve:
- ✅ **Admin** (su domain)
- ✅ **SuperAdmin** (todos los domains)

### Cómo Llegan Aquí las Propuestas:

**Flujo:**
```
1. Expert evalúa interaction
2. Propone corrección
3. Estado cambia a "Corregida (propuesta)"
4. Aparece en "Aprobar Correcciones" panel
```

### UI que ve Admin:

```
┌──────────────────────────────────────────────────────┐
│ Aprobar Correcciones - maqsa.cl                      │
├──────────────────────────────────────────────────────┤
│                                                      │
│ Filtros: [Todas] [Alta prioridad] [Este mes]        │
│                                                      │
│ ┌──────────────────────────────────────────────────┐ │
│ │ ⚠️ Alta Prioridad | Legal | Juan (Expert)       │ │
│ │                                                  │ │
│ │ Pregunta Original:                               │ │
│ │ "¿Diferencia entre condominio A y B?"           │ │
│ │                                                  │ │
│ │ Respuesta Actual: [Ver]                          │ │
│ │ Propuesta Corrección: [Ver diff]                 │ │
│ │                                                  │ │
│ │ 📊 Impacto Estimado:                             │ │
│ │    +23 queries similares afectadas               │ │
│ │    +45% success rate esperado                    │ │
│ │    DQS gain: +0.3 puntos                         │ │
│ │                                                  │ │
│ │ Scope: ⚪ Esta query  ⚫ Domain-wide             │ │
│ │ Risk: 🟢 Low                                     │ │
│ │                                                  │ │
│ │ [✅ Aprobar] [❌ Rechazar] [↩️ Devolver]         │ │
│ │                                                  │ │
│ │ Batch: [☐] Select para aprobar en grupo         │ │
│ └──────────────────────────────────────────────────┘ │
│                                                      │
│ 2 más pendientes...                                 │
│                                                      │
│ [Aprobar Batch (0 selected)]                        │
└──────────────────────────────────────────────────────┘
```

**Acciones Admin:**

1. **Aprobar Individual:**
   - Review propuesta
   - Ver impact preview
   - Click "Aprobar"
   - Confirmation modal
   - Estado → "Aprobada para aplicar"

2. **Aprobar en Batch (10x faster):**
   - Select checkboxes (3 items)
   - Click "Aprobar Batch"
   - Ver summary de impacto total
   - Confirm
   - Todas aprueban simultaneously

3. **Rechazar:**
   - Agregar reason
   - Estado → "Rechazada"
   - Expert notified

4. **Devolver a Revisión:**
   - Agregar comentarios
   - Estado → "En revisión"
   - Expert revises

---

## ⚙️ 4. CONFIG. EVALUACIÓN - Configuración Detallada

### SuperAdmin Ve (Config Global):

```
┌──────────────────────────────────────────────────────┐
│ Configuración de Evaluación - GLOBAL                 │
├──────────────────────────────────────────────────────┤
│                                                      │
│ 1. REGLAS DE PRIORIZACIÓN                           │
│ ────────────────────────────────────────────────────│
│                                                      │
│ Umbral de Rating para Auto-Prioridad:               │
│ ┌────────────────────────────────────────────────┐  │
│ │ ⭐⭐⭐☆☆  ≤ 3 estrellas                          │  │
│ │ [1]────●────[3]────[4]────[5]                   │  │
│ └────────────────────────────────────────────────┘  │
│                                                      │
│ Criterios Adicionales:                              │
│ [✓] Expert marca como "Inaceptable"                 │
│ [✓] Usuario marca manualmente prioritaria           │
│ [ ] Keyword detection (futuro)                      │
│                                                      │
│ ────────────────────────────────────────────────────│
│                                                      │
│ 2. ASIGNACIÓN DE EXPERTOS                           │
│ ────────────────────────────────────────────────────│
│                                                      │
│ Supervisores Disponibles:                           │
│ ┌────────────────────────────────────────────────┐  │
│ │ [✓] Juan Pérez (juan@maqsa.cl)                  │  │
│ │     Domains: maqsa.cl                           │  │
│ │     Agentes: M001, M003 (2)                     │  │
│ │                                                  │  │
│ │ [✓] María Silva (maria@iaconcagua.cl)           │  │
│ │     Domains: iaconcagua.cl                      │  │
│ │     Agentes: Todos                              │  │
│ │                                                  │  │
│ │ [+ Asignar Nuevo Supervisor]                    │  │
│ └────────────────────────────────────────────────┘  │
│                                                      │
│ Especialistas Disponibles:                          │
│ ┌────────────────────────────────────────────────┐  │
│ │ [✓] Dr. López (legal@maqsa.cl)                  │  │
│ │     Specialty: Legal                            │  │
│ │     Domains: maqsa.cl, iaconcagua.cl           │  │
│ │     Match AI: Enabled                           │  │
│ │                                                  │  │
│ │ [+ Asignar Nuevo Especialista]                  │  │
│ └────────────────────────────────────────────────┘  │
│                                                      │
│ ────────────────────────────────────────────────────│
│                                                      │
│ 3. NOTIFICACIONES                                   │
│ ────────────────────────────────────────────────────│
│                                                      │
│ Email a Supervisores:                               │
│ Alertar cuando items prioritarios > [10]            │
│ Frecuencia: Cada 4 horas                            │
│                                                      │
│ Email a Especialistas:                              │
│ Resumen semanal: Lunes 9am                          │
│                                                      │
│ [Guardar Configuración]                             │
└──────────────────────────────────────────────────────┘
```

---

### Admin de Domain Ve (Config Domain-Specific):

```
┌──────────────────────────────────────────────────────┐
│ Configuración de Evaluación - maqsa.cl               │
├──────────────────────────────────────────────────────┤
│                                                      │
│ 1. PRIORIZACIÓN (Override Global)                   │
│ ────────────────────────────────────────────────────│
│                                                      │
│ [ ] Usar umbral global (3 estrellas)                │
│ [✓] Custom para este domain:                        │
│     ⭐⭐☆☆☆  ≤ 2 estrellas (más restrictivo)        │
│                                                      │
│ ────────────────────────────────────────────────────│
│                                                      │
│ 2. EXPERTOS PARA MI DOMAIN                          │
│ ────────────────────────────────────────────────────│
│                                                      │
│ Supervisores:                                        │
│ [✓] Juan Pérez                                       │
│     Agentes: [✓] M001  [✓] M003  [ ] S001          │
│                                                      │
│ Especialistas:                                       │
│ [✓] Dr. López (Legal)                               │
│ [ ] Ing. Torres (Técnica) - Pendiente aprobación    │
│                                                      │
│ [+ Solicitar Nuevo Expert] (requiere aprobación SuperAdmin)│
│                                                      │
│ ────────────────────────────────────────────────────│
│                                                      │
│ 3. NOTIFICACIONES MI DOMAIN                         │
│ ────────────────────────────────────────────────────│
│                                                      │
│ Umbral volumen: [15] items (vs [10] global)         │
│ Email frecuencia: [Cada 4 horas]                    │
│                                                      │
│ [Guardar]                                            │
└──────────────────────────────────────────────────────┘
```

---

## 📊 5. DASHBOARD CALIDAD - Qué Ve Cada Rol

### SuperAdmin Dashboard (Cross-Domain):

```
┌──────────────────────────────────────────────────────┐
│ Dashboard de Calidad - Platform-Wide                 │
├──────────────────────────────────────────────────────┤
│                                                      │
│ 📊 PLATFORM DQS: 74.3 / 100                         │
│    Trend: ↗️ +8.2 vs Q anterior                      │
│    Goal: >85 by Q1 2026                             │
│                                                      │
│ ┌─────────────────┬─────────────────┬──────────────┐ │
│ │ Domains >85     │ Domains 70-85   │ Domains <70  │ │
│ │ 2 / 15          │ 10 / 15         │ 3 / 15       │ │
│ │ 🟢 Excellent    │ 🟡 Good         │ 🔴 Attention │ │
│ └─────────────────┴─────────────────┴──────────────┘ │
│                                                      │
│ 🏆 TOP DOMAINS:                                      │
│ 1. salfa.cl          DQS: 92 ↗️                      │
│ 2. maqsa.cl          DQS: 89 ↗️                      │
│ 3. iaconcagua.cl     DQS: 87 →                      │
│                                                      │
│ 🚨 NEED ATTENTION:                                   │
│ 13. empresa_x.cl     DQS: 68 ↘️ (bottleneck: eval)  │
│ 14. empresa_y.cl     DQS: 65 → (low expert count)   │
│                                                      │
│ 👥 EXPERT NETWORK:                                   │
│ Supervisors: 20 | Specialists: 30 | Workload: ⚖️    │
│                                                      │
│ [Ver Domain Matrix Completa]                        │
└──────────────────────────────────────────────────────┘
```

---

### Admin Dashboard (Single Domain):

```
┌──────────────────────────────────────────────────────┐
│ Dashboard Calidad - maqsa.cl                         │
├──────────────────────────────────────────────────────┤
│                                                      │
│ 📊 DOMAIN DQS: 89.0 / 100                           │
│    Change: +3.2 points este mes                     │
│    Ranking: #2 (de 15 domains)                      │
│    Trend: ↗️ Improving                               │
│                                                      │
│ Components Breakdown:                                │
│ ┌────────────────────────────────────────────────┐  │
│ │ CSAT (30%):        4.2/5.0  ▓▓▓▓▓▓▓▓▓░  84%   │  │
│ │ NPS (25%):         45/100   ▓▓▓▓▓▓▓▓▓░  45%   │  │
│ │ Expert (25%):      82/100   ▓▓▓▓▓▓▓▓░░  82%   │  │
│ │ Resolution (10%):  89%      ▓▓▓▓▓▓▓▓▓░  89%   │  │
│ │ Accuracy (10%):    94%      ▓▓▓▓▓▓▓▓▓▓  94%   │  │
│ └────────────────────────────────────────────────┘  │
│                                                      │
│ 🎯 PRÓXIMA META:                                     │
│ Alcanzar 90 puntos (Elite status)                   │
│ Faltan: 1.0 puntos                                  │
│ Path: 2-3 aprobaciones más                          │
│                                                      │
│ 💰 ROI ESTE MES:                                     │
│ Inversión: 12 horas (review time)                   │
│ Retorno: 148 horas ahorradas                        │
│ ROI: 12.3x                                          │
│                                                      │
│ [Ver Mi Scorecard Completo]                         │
└──────────────────────────────────────────────────────┘
```

---

### Expert Dashboard (Performance):

```
┌──────────────────────────────────────────────────────┐
│ Mi Performance - Juan Pérez                          │
├──────────────────────────────────────────────────────┤
│                                                      │
│ 🏅 RANKINGS:                                         │
│ Global: #2  | Domain: #1  | Speed: #3  | Quality: #2│
│                                                      │
│ 📊 ESTE MES:                                         │
│ ┌────────────┬────────────┬────────────┬──────────┐ │
│ │ Evaluated  │ AI Usage   │ Approval   │ Avg Time │ │
│ │ 42         │ 76%        │ 92%        │ 8.3 min  │ │
│ │ +12 vs mes │ +6% vs mes │ +2% vs mes │ -4min    │ │
│ └────────────┴────────────┴────────────┴──────────┘ │
│                                                      │
│ ⚡ AI EFFICIENCY:                                     │
│ Time saved with AI: 10.7 hours this month           │
│ Efficiency: 60% time savings (28min → 8min)         │
│                                                      │
│ 🏆 BADGES EARNED:                                    │
│ [🎯 Calibration Master] [⚡ Speed Demon]            │
│                                                      │
│ Next: 💎 Platinum Expert (need 8 more evals)        │
│ Progress: ▓▓▓▓▓▓▓▓░░ 84%                            │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

### Usuario Final Dashboard (Contribution):

```
┌──────────────────────────────────────────────────────┐
│ Mi Contribución - María Torres                       │
├──────────────────────────────────────────────────────┤
│                                                      │
│ 📊 ESTE MES:                                         │
│ ┌──────────┬──────────┬──────────┬──────────┐       │
│ │Feedback  │ Útiles   │Improved  │ Shares   │       │
│ │ 12       │ 8 (67%)  │ 3        │ 2        │       │
│ └──────────┴──────────┴──────────┴──────────┘       │
│                                                      │
│ ✨ TU IMPACTO:                                       │
│ Tus 3 comentarios mejoraron respuestas que          │
│ ahora ayudan a 12 personas en tu equipo             │
│                                                      │
│ 🏆 BADGES:                                           │
│ [⭐ Quality Contributor] - 5+ feedback útiles       │
│                                                      │
│ Próximo badge: 🎯 Impact Maker                      │
│ Progress: ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░ 75%                 │
│ (Necesitas 3 respuestas mejoradas, tienes 3! ✅)    │
│                                                      │
│ 📈 FUNNEL:                                           │
│ Interactions → Feedback → Improved → Shared         │
│ 20 → 12 (60%) → 3 (25%) → 2 (67%)                   │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

## 🎨 FLUJO COMPLETO - User Journey por Rol

### 1. Usuario Final → Expert → Admin (Flujo Normal)

```
USUARIO FINAL:
  1. Usa agente M001
  2. Recibe respuesta
  3. Califica 2/5 estrellas ⭐⭐☆☆☆
  4. Agrega comentario: "Falta explicar diferencias específicas"
  5. [Auto] Marca prioritaria (≤3 estrellas)
     ↓

EXPERT SUPERVISOR (Juan):
  1. Ve item en "Panel Supervisor" (filtro: Alta prioridad)
  2. Click → AI sugiere corrección (2.3s)
  3. Revisa suggestion (94% confidence)
  4. Edita si necesario
  5. Formulario:
     - Calificación: Inaceptable
     - Tipo: Regla/Prompt (agregar pasos específicos)
     - Scope: Domain-wide (afecta +23 queries)
  6. Submit → Estado: "Corregida (propuesta)"
     ↓

ADMIN (María):
  1. Ve propuesta en "Aprobar Correcciones"
  2. Review impact preview:
     - +23 queries afectadas
     - +45% success esperado
     - DQS gain: +0.3 puntos
     - Risk: Low
  3. Click "Aprobar"
  4. Confirmation → Submit
  5. Estado: "Aprobada para aplicar"
     ↓

SISTEMA (Automático):
  1. Corrección se aplica al prompt del domain
  2. Próximas queries similares usan prompt mejorado
  3. Estado: "Aplicada"
  4. Tracking: DQS updated (+0.3)
     ↓

USUARIO FINAL (Regresa):
  1. Hace pregunta similar
  2. Ve respuesta mejorada
  3. Notification aparece:
     "✨ Esta respuesta mejoró gracias a TU feedback del 8 Nov"
  4. +10 puntos de contribución
  5. Progress to badge: 75% → 100%
  6. 🏆 Badge earned: "Impact Maker"
  7. Celebration con confetti
  8. CSAT survey: "¿Qué tan útil?" → 5/5
```

---

### 2. Supervisor → Specialist → Admin (Flujo Complejo)

```
SUPERVISOR (Juan):
  1. Ve interaction muy técnica (tema legal)
  2. Click "Asignar a Especialista"
  3. AI sugiere: Dr. López (94% match - Legal specialty)
  4. Confirm assignment
  5. Email sent to Dr. López
     ↓

SPECIALIST (Dr. López):
  1. Email: "Nueva asignación - 94% match para ti"
  2. Login → "Mis Asignaciones"
  3. Ve SOLO esa interaction (privacy)
  4. Evalúa con deep legal expertise
  5. Propone corrección detallada
  6. Submit → Return to supervisor
     ↓

SUPERVISOR (Juan):
  1. Recibe proposal de specialist
  2. Review en "Panel Supervisor"
  3. Consolida con su evaluación
  4. Ajusta si necesario
  5. Submit → "Corregida (propuesta)"
     ↓

ADMIN:
  [Same flow as above]
```

---

## ⚙️ CONFIGURACIÓN - Paso a Paso

### SuperAdmin Setup Inicial:

**Paso 1: Asignar Supervisores**
```
1. Config. Evaluación
2. Sección "Asignación de Expertos"
3. Click "+ Asignar Nuevo Supervisor"
4. Modal abre:
   - Select user: juan@maqsa.cl
   - Select domains: [✓] maqsa.cl
   - Select agents: [✓] M001  [✓] M003
   - Role: Supervisor
5. Save
6. Juan ahora ve M001 y M003 en su Panel Supervisor
```

**Paso 2: Asignar Especialistas**
```
1. Config. Evaluación
2. Click "+ Asignar Nuevo Especialista"
3. Modal:
   - Select user: legal@maqsa.cl
   - Specialty: Legal (dropdown)
   - Domains: [✓] maqsa.cl  [✓] iaconcagua.cl
   - AI Matching: [✓] Enabled
4. Save
5. Specialist recibe legal assignments automáticamente
```

**Paso 3: Configurar Umbrales**
```
1. Adjust slider: ≤3 estrellas = prioritaria
2. Enable criterios adicionales
3. Save
4. Aplica a todos los domains inmediatamente
```

---

### Admin Setup para Su Domain:

**Paso 1: Override Umbral**
```
1. Config. Evaluación
2. Uncheck "Usar umbral global"
3. Set custom: ≤2 estrellas (más strict)
4. Save
5. Solo afecta maqsa.cl
```

**Paso 2: Asignar Expertos a Sus Agentes**
```
1. Lista de supervisores disponibles
2. Expand Juan Pérez
3. Checkboxes de agentes:
   [✓] M001 (ya asignado)
   [✓] M003 (ya asignado)
   [ ] S001 (nuevo)
4. Check S001
5. Save
6. Juan ahora ve S001 también
```

**Paso 3: Configurar Alerts**
```
1. Umbral volumen: 15 items (vs 10 global)
2. Frecuencia: Mantener 4 horas
3. Save
4. Alerts específicos para maqsa.cl
```

---

## 🎯 RESUMEN POR ROL

### SuperAdmin:
- **Ve:** TODO (cross-domain)
- **Configura:** Reglas globales, todos los expertos, umbrales
- **Aprueba:** Para cualquier domain
- **Dashboard:** Platform-wide DQS

### Admin de Domain:
- **Ve:** Su domain únicamente
- **Configura:** Reglas de su domain (override global), expertos para su domain
- **Aprueba:** Solo su domain
- **Dashboard:** Domain DQS + ROI

### Expert Supervisor:
- **Ve:** Agentes asignados a él
- **Hace:** Evalúa, propone correcciones, asigna a specialists
- **NO puede:** Aprobar, configurar, ver otros agentes
- **Dashboard:** Su performance (rankings, AI efficiency)

### Specialist:
- **Ve:** SOLO asignaciones a él (most restricted)
- **Hace:** Evalúa con expertise, propone, puede devolver
- **NO puede:** Ver queue completa, aprobar, asignar
- **Dashboard:** Specialty metrics (#1 status)

### Usuario Final:
- **Ve:** Sus propias conversations
- **Hace:** Califica (1-5 stars), comenta, ve su impacto
- **Dashboard:** Su contribución (badges, impact)

---

## 📋 CHECKLIST DE CONFIGURACIÓN

### Para SuperAdmin (Primera Vez):

- [ ] Asignar threshold global (default: ≤3 estrellas)
- [ ] Asignar al menos 1 supervisor por domain crítico
- [ ] Asignar al menos 1 specialist por specialty (legal, técnica)
- [ ] Configurar email notifications (weekly + volume alerts)
- [ ] Test: Expert ve su panel populated
- [ ] Test: Specialist recibe assignments

### Para Admin de Domain (Primera Vez):

- [ ] Decidir si usa umbral global o custom
- [ ] Asignar supervisors a sus agentes
- [ ] Request specialists si necesita (approval SuperAdmin)
- [ ] Configurar umbrales de alert para su domain
- [ ] Test: Propuestas llegan a su Quality Gate

---

## 🎉 CUANDO FUNCIONE

**Usuario verá:**
- ⭐ Stars debajo de cada respuesta AI
- 💬 Option to comment
- 📊 Dashboard de contribución
- 🏆 Badges earned
- ✨ Impact notifications

**Expert verá:**
- 📋 Queue de interactions prioritarias
- 🤖 AI suggestions (<3s)
- 📊 Performance dashboard
- 🏅 Rankings y badges

**Admin verá:**
- 📝 Propuestas pendientes
- 📊 Impact previews
- ⚡ Batch approval option
- 💰 ROI tracking
- 📈 DQS scorecard

**SuperAdmin verá:**
- 🌍 Platform-wide metrics
- 📊 All domains matrix
- 🎯 Cross-domain patterns
- 🏆 Excellence tracking

---

**TODA ESTA FUNCIONALIDAD YA ESTÁ IMPLEMENTADA** ✅

**Solo necesita que el deployment funcione** 🔧

---

**USE ESTA GUÍA** cuando la UI esté funcional para configurar y usar el sistema completo! 📚

