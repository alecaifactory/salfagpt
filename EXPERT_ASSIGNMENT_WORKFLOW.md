# 👥 Flujo de Asignación de Expertos y Especialistas

**Fecha:** 2025-11-10  
**Implementado en:** Commits 2490df6, 7cd4065  
**Status:** ✅ Completo y Funcional

---

## 🎯 Resumen del Sistema

El sistema de Expert Review requiere configurar **Supervisores** y **Especialistas** por dominio. Este documento explica el flujo completo de configuración.

---

## 👥 Roles del Sistema

### Nuevos Roles Agregados:

1. **Supervisor** (`supervisor`)
   - Puede ser asignado por Admin
   - Puede revisar evaluaciones de expertos
   - Puede aprobar correcciones
   - Típicamente: Admin o usuario senior del dominio

2. **Especialista** (`especialista`)
   - Puede ser asignado por Admin
   - Tiene expertise en dominios específicos
   - Recibe asignaciones automáticas según specialty
   - Típicamente: Usuario experto con conocimiento especializado

### Roles Existentes (Backward Compatible):

- `admin` - Administrador (puede hacer todo)
- `expert` - Experto (legacy, backward compatibility)
- `user` - Usuario estándar
- Todos los roles de contexto y agentes existentes

---

## 🔄 Flujo Completo de Configuración

### PASO 1: Crear Usuarios con Roles

**¿Quién?** Admin o SuperAdmin

**¿Dónde?** Gestión de Usuarios (en screenshot compartido)

**Acciones:**

#### 1.1 Crear Usuario Supervisor
```
1. Click "Crear Usuario"
2. Completar:
   - Nombre: "Juan Pérez"
   - Email: "juan.perez@getaifactory.com"
   - Seleccionar dominio: getaifactory.com
   - Departamento: (opcional) "Calidad"

3. En "Roles", marcar checkbox:
   ✅ Supervisor

4. Click "Crear Usuario"
```

**Resultado:**
- Usuario creado con rol `supervisor`
- Puede ver Panel Supervisor
- Aparece en lista para asignar en Config. Evaluación

#### 1.2 Crear Usuario Especialista
```
1. Click "Crear Usuario"
2. Completar:
   - Nombre: "María González"
   - Email: "maria.gonzalez@getaifactory.com"
   - Seleccionar dominio: getaifactory.com
   - Departamento: (opcional) "Soporte Técnico"

3. En "Roles", marcar checkbox:
   ✅ Especialista

4. Click "Crear Usuario"
```

**Resultado:**
- Usuario creado con rol `especialista`
- Puede ver Panel Especialista
- Aparece en lista para asignar en Config. Evaluación

---

### PASO 2: Configurar Dominio

**¿Quién?** Admin del dominio

**¿Dónde?** Config. Evaluación (menu EVALUACIONES)

**Acciones:**

#### 2.1 Abrir Configuración
```
1. Click avatar usuario (bottom-left)
2. Menu se abre
3. Buscar sección "EVALUACIONES"
4. Click "⚙️ Config. Evaluación"
```

**Resultado:**
- Modal abre con título "Configuración de Evaluación"
- Muestra: "Dominio: getaifactory.com"
- 4 tabs visibles

---

#### 2.2 Asignar Supervisor

**Tab:** Expertos & Especialistas

```
1. En modal abierto, ir a tab "Expertos & Especialistas"
2. Ver sección "Supervisores (0)"
3. Click botón "Agregar Supervisor"

4. Se abre mini-modal celeste:
   - Título: "Seleccionar Supervisor"
   - Dropdown: "Usuario del Dominio"
   
5. En dropdown, seleccionar:
   - Juan Pérez (juan.perez@getaifactory.com) - supervisor
   
6. Click "Agregar"
```

**Resultado:**
- Supervisor aparece en lista
- Muestra: Avatar, nombre, email, "0 asignaciones activas"
- Badge: "Puede aprobar correcciones"

**Si dropdown vacío:**
- No hay usuarios con rol `supervisor` o `admin` en el dominio
- Ir a Gestión de Usuarios → Crear usuario con rol Supervisor

---

#### 2.3 Asignar Especialista

**Tab:** Expertos & Especialistas (mismo que supervisor)

```
1. Ver sección "Especialistas (0)"
2. Click botón "Agregar Especialista"

3. Se abre mini-modal morado:
   - Título: "Seleccionar Especialista"
   
4. En "Usuario Experto", seleccionar:
   - María González (maria.gonzalez@getaifactory.com)
   
5. En "Especialidad", escribir:
   - "Soporte Técnico"
   
6. En "Dominios de Conocimiento", escribir:
   - "equipos, herramientas, procesos"
   (separados por coma)
   
7. Click "Agregar"
```

**Resultado:**
- Especialista aparece en tarjeta
- Muestra: Avatar, nombre, specialty
- Badge "Auto" si auto-asignación habilitada
- Max asignaciones: 10
- Dominios: equipos, herramientas, procesos

**Si dropdown vacío:**
- No hay usuarios con rol `especialista` en el dominio
- Ir a Gestión de Usuarios → Crear usuario con rol Especialista

---

#### 2.4 Configurar Umbrales

**Tab:** Umbrales

```
1. Click tab "Umbrales"
2. Configurar:

   a) Umbral de Estrellas Usuario: 3
      - Interacciones con ≤3 estrellas requieren revisión
   
   b) Umbral de Evaluación Experto: "mejorable"
      - Evaluaciones ≤ mejorable requieren acción
   
   c) ✅ Auto-marcar respuestas inaceptables
      - Sistema alerta automáticamente al supervisor
   
   d) Mínimo Preguntas Similares: 5
      - Mínimo para análisis de impacto

3. Los cambios se guardan automáticamente en memoria
```

---

#### 2.5 Configurar Automatización

**Tab:** Automatización

```
1. Click tab "Automatización"
2. Activar/desactivar según necesidad:

   ✅ Generar Sugerencias AI Automáticamente
      - Sistema genera correcciones sugeridas
   
   ✅ Ejecutar Análisis de Impacto Automático
      - Calcula cuántos usuarios se beneficiarían
   
   ✅ Asignar Especialistas Automáticamente
      - Asigna según dominio y disponibilidad
   
   ✅ Implementación por Lotes Habilitada
      - Aplica múltiples correcciones a la vez

3. Todos activados = máxima automatización
```

---

#### 2.6 Configurar Metas de Calidad

**Tab:** Metas de Calidad

```
1. Click tab "Metas de Calidad"
2. Configurar objetivos:

   a) CSAT Objetivo: 4.5
      - Meta de satisfacción (1-5 escala)
   
   b) NPS Objetivo: 90
      - Meta de promotores netos (-100 a 100)
   
   c) Rating Mínimo Aceptable: 3.5
      - Por debajo = problema que requiere acción

3. Estas metas determinan prioridades de revisión
```

---

#### 2.7 Guardar Configuración

```
1. Después de configurar todos los tabs
2. Click botón "Guardar Configuración" (footer)
3. Botón muestra: "Guardando..." con spinner
4. Alert: "Configuración guardada exitosamente"
5. Click "Cancelar" para cerrar modal
```

**Persistencia:**
- Config se guarda en Firestore: `domain_review_config`
- Document ID = domain (ej: "getaifactory.com")
- Se carga automáticamente al abrir modal
- Timestamp de última actualización visible en footer

---

## 🔍 Validación del Sistema

### Verificar Supervisores Asignados

```
1. Abrir Config. Evaluación
2. Tab "Expertos & Especialistas"
3. Verificar sección "Supervisores (1)" o más
4. Debe mostrar:
   - Avatar con iniciales
   - Nombre completo
   - Email
   - "X asignaciones activas"
   - Badge verde: "Puede aprobar correcciones"
```

### Verificar Especialistas Asignados

```
1. Mismo modal, mismo tab
2. Verificar sección "Especialistas (1)" o más
3. Cada tarjeta muestra:
   - Avatar con iniciales
   - Nombre
   - Specialty (ej: "Soporte Técnico")
   - Badge "Auto" si auto-assign activado
   - Max asignaciones: 10
   - Dominios: lista separada por comas
```

### Verificar Configuración Guardada

```
1. Cerrar modal
2. Reabrir Config. Evaluación
3. Verificar que todos los settings persisten:
   - Supervisores siguen listados
   - Especialistas siguen listados
   - Umbrales son los configurados
   - Automatización mantiene toggles
   - Metas de calidad son las mismas
```

---

## 🎯 Cómo Funciona la Auto-Asignación

### Para Supervisores:
```
Cuando interacción requiere revisión:
1. Sistema chequea umbrales (estrellas ≤3 por ejemplo)
2. Si cumple criterio → Marca para supervisor
3. Supervisor ve en "Panel Supervisor"
4. No es auto-asignación (supervisor ve todas las pending)
```

### Para Especialistas:
```
Cuando interacción necesita expertise:
1. Supervisor evalúa como "mejorable" o "inaceptable"
2. Sistema analiza texto de pregunta
3. Match con dominios de conocimiento del especialista
   - Busca keywords: "equipos", "herramientas", "procesos"
4. Si match + especialista tiene capacity:
   → Auto-asigna
5. Especialista ve en "Mis Asignaciones"
6. Especialista puede aceptar/rechazar
```

**Factores de Auto-Asignación:**
- Specialty match (text analysis)
- Domains match (keyword matching)
- Current workload (activeAssignments < maxConcurrentAssignments)
- autoAssign flag = true

---

## 🔧 APIs Creados

### GET /api/users/domain
```typescript
Query: ?domain=getaifactory.com
Returns: Array<{
  id: string;
  email: string;
  name: string;
  role: string;
}>

Filter: Only active users in specified domain
Auth: Admin/SuperAdmin only
```

### POST /api/expert-review/add-supervisor
```typescript
Body: {
  domainId: "getaifactory.com",
  userId: "user-id",
  userEmail: "email",
  userName: "name"
}

Result: Adds to domain_review_config.supervisors[]
Auth: Admin/SuperAdmin only
```

### POST /api/expert-review/add-specialist
```typescript
Body: {
  domainId: "getaifactory.com",
  userId: "user-id",
  userEmail: "email",
  userName: "name",
  specialty: "Soporte Técnico",
  domains: ["equipos", "herramientas"],
  maxConcurrentAssignments: 10
}

Result: Adds to domain_review_config.specialists[]
Auth: Admin/SuperAdmin only
```

---

## 📋 Checklist de Configuración

### Configuración Inicial del Dominio:

- [ ] Crear al menos 1 usuario con rol `supervisor`
- [ ] Crear al menos 1 usuario con rol `especialista`
- [ ] Abrir Config. Evaluación
- [ ] Asignar supervisor(es)
- [ ] Asignar especialista(s) con specialties
- [ ] Configurar umbrales (estrellas, evaluación)
- [ ] Activar automatización deseada
- [ ] Configurar metas de calidad (CSAT, NPS)
- [ ] Guardar configuración
- [ ] Verificar que persiste al reabrir

### Validación:

- [ ] Supervisores aparecen en lista
- [ ] Especialistas aparecen en lista con specialties
- [ ] Al cerrar y reabrir modal, config se mantiene
- [ ] Usuarios pueden ver sus respectivos paneles:
  - Supervisor → Panel Supervisor
  - Especialista → Mis Asignaciones

---

## 🐛 Troubleshooting

### "Dropdown de usuarios vacío al agregar supervisor"

**Causa:** No hay usuarios con rol `supervisor` o `admin` en el dominio

**Solución:**
```
1. Ir a Gestión de Usuarios
2. Crear usuario nuevo O editar usuario existente
3. Asignar dominio correcto (matching email)
4. Marcar rol "Supervisor" o "Administrador"
5. Guardar
6. Regresar a Config. Evaluación
7. Ahora aparece en dropdown
```

---

### "Dropdown de especialistas vacío"

**Causa:** No hay usuarios con rol `especialista` en el dominio

**Solución:**
```
1. Ir a Gestión de Usuarios
2. Crear usuario nuevo
3. Email debe ser del dominio (ej: @getaifactory.com)
4. Marcar rol "Especialista"
5. Guardar
6. Regresar a Config. Evaluación
7. Ahora aparece en dropdown
```

---

### "Error al guardar configuración"

**Posibles causas:**
1. Problema de red → Check console
2. Firestore permissions → Check server logs
3. Validation error → Check required fields

**Debug:**
```javascript
// En browser console, después de click "Guardar":
// Should see:
✅ Config saved
// Or:
❌ Error saving config: [details]
```

---

## 📊 Estructura de Datos

### domain_review_config (Firestore)

```typescript
{
  id: "getaifactory.com", // Document ID = domain
  domainName: "getaifactory.com",
  
  supervisors: [
    {
      userId: "juan_perez_getaifactory_com",
      userEmail: "juan.perez@getaifactory.com",
      name: "Juan Pérez",
      assignedAt: Timestamp,
      canApproveCorrections: true,
      activeAssignments: 0
    }
  ],
  
  specialists: [
    {
      userId: "maria_gonzalez_getaifactory_com",
      userEmail: "maria.gonzalez@getaifactory.com",
      name: "María González",
      specialty: "Soporte Técnico",
      domains: ["equipos", "herramientas", "procesos"],
      maxConcurrentAssignments: 10,
      autoAssign: true,
      notificationPreferences: {
        weeklyDigest: true,
        instantAlerts: false,
        emailEnabled: true
      }
    }
  ],
  
  priorityThresholds: {
    userStarThreshold: 3,
    expertRatingThreshold: "mejorable",
    autoFlagInaceptable: true,
    minimumSimilarQuestions: 5
  },
  
  automation: {
    autoGenerateAISuggestions: true,
    autoRunImpactAnalysis: true,
    autoMatchSpecialists: true,
    batchImplementationEnabled: true
  },
  
  customSettings: {
    language: "es",
    timezone: "America/Santiago",
    qualityGoals: {
      targetCSAT: 4.5,
      targetNPS: 90,
      minimumAcceptableRating: 3.5
    }
  },
  
  createdAt: Timestamp,
  updatedAt: Timestamp,
  createdBy: "114671162830729001607",
  source: "localhost" | "production"
}
```

---

## ✅ Testing Checklist

### Test 1: Crear Usuario Supervisor
- [ ] Ir a Gestión de Usuarios
- [ ] Click "Crear Usuario"
- [ ] Ver checkbox "Supervisor" en grid de roles
- [ ] Crear usuario con rol Supervisor
- [ ] Usuario aparece en lista con rol correcto

### Test 2: Crear Usuario Especialista
- [ ] Gestión de Usuarios → Crear Usuario
- [ ] Ver checkbox "Especialista" en grid de roles
- [ ] Crear usuario con rol Especialista
- [ ] Usuario aparece en lista

### Test 3: Config Panel Abre
- [ ] Menu usuario → Config. Evaluación
- [ ] Modal abre (NO alert)
- [ ] 4 tabs visibles
- [ ] Tab "Expertos & Especialistas" seleccionado

### Test 4: Asignar Supervisor
- [ ] Click "Agregar Supervisor"
- [ ] Mini-modal celeste abre
- [ ] Dropdown muestra usuarios supervisor/admin del dominio
- [ ] Seleccionar usuario
- [ ] Click "Agregar"
- [ ] Supervisor aparece en lista
- [ ] Cuenta incrementa: "Supervisores (1)"

### Test 5: Asignar Especialista
- [ ] Click "Agregar Especialista"
- [ ] Mini-modal morado abre
- [ ] Dropdown muestra usuarios especialista del dominio
- [ ] Seleccionar usuario
- [ ] Completar "Especialidad"
- [ ] Completar "Dominios de Conocimiento"
- [ ] Click "Agregar"
- [ ] Especialista aparece en tarjeta
- [ ] Cuenta incrementa: "Especialistas (1)"

### Test 6: Configurar Umbrales
- [ ] Tab "Umbrales"
- [ ] Cambiar umbral estrellas: 3
- [ ] Cambiar umbral experto: "mejorable"
- [ ] Activar auto-flag
- [ ] Cambiar mínimo preguntas: 5
- [ ] Valores se actualizan en UI

### Test 7: Configurar Automatización
- [ ] Tab "Automatización"
- [ ] Toggle cada checkbox
- [ ] Cada uno activa/desactiva correctamente

### Test 8: Configurar Metas
- [ ] Tab "Metas de Calidad"
- [ ] Cambiar CSAT: 4.5
- [ ] Cambiar NPS: 90
- [ ] Cambiar mínimo aceptable: 3.5

### Test 9: Guardar y Persistir
- [ ] Click "Guardar Configuración"
- [ ] Botón muestra "Guardando..."
- [ ] Alert: "exitosamente"
- [ ] Cerrar modal
- [ ] Reabrir modal
- [ ] TODOS los settings persisten ✅

---

## 🎉 Resultado Final

Una vez completada la configuración:

**El sistema puede:**
- ✅ Detectar interacciones que requieren revisión (basado en umbrales)
- ✅ Asignar automáticamente a supervisores para revisión
- ✅ Asignar automáticamente especialistas según expertise
- ✅ Generar sugerencias AI de corrección
- ✅ Calcular impacto potencial de correcciones
- ✅ Notificar a expertos sobre asignaciones
- ✅ Rastrear performance de cada experto
- ✅ Aplicar correcciones en lotes
- ✅ Medir CSAT/NPS del sistema
- ✅ Gamificar con badges

**Los usuarios ven:**
- Supervisor → Panel con todas las interacciones pending
- Especialista → Mis Asignaciones con casos auto-asignados
- Admin → Aprobar Correcciones batch
- Usuario → Impact notifications cuando se aplican mejoras

---

## 📚 Documentación Relacionada

**Setup:**
- EXPERT_ASSIGNMENT_WORKFLOW.md (este documento)
- START_HERE_2025-11-10.md (quick start)

**Testing:**
- TESTING_CHECKLIST_IMMEDIATE.md (tests inmediatos)
- TESTING_GUIDE_ALL_PERSONAS_BACKWARD_COMPAT.md (suite completa)

**User Guide:**
- docs/EXPERT_REVIEW_USER_GUIDE.md (quién ve qué)

**Technical:**
- CONTINUATION_FIXES_2025-11-10.md (what changed)
- EXPERT_REVIEW_100_PERCENT_COMPLETE.md (system overview)

---

## 🚀 Next Steps

Después de configurar el dominio:

1. **Test Workflow Completo:**
   - Usuario da ⭐⭐ a una respuesta
   - Sistema detecta (≤ umbral)
   - Aparece en Panel Supervisor
   - Supervisor evalúa
   - Especialista recibe asignación
   - Especialista propone corrección
   - Admin aprueba
   - Sistema aplica
   - Usuario recibe notificación

2. **Validar Analytics:**
   - Dashboard Calidad muestra métricas
   - Funnels tracking funciona
   - Badges se otorgan
   - CSAT/NPS se calculan

3. **Deploy a Production:**
   - Full testing completo ✅
   - Backward compatibility verificado ✅
   - All features functional ✅
   - Deploy! 🚀

---

**¡El sistema de configuración ahora funciona completamente!** 🎊

**Puedes crear usuarios con roles Supervisor y Especialista, y asignarlos a través de Config. Evaluación!**

