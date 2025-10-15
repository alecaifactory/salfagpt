# Agent Configuration System - 2025-10-15

## ✅ Feature Complete

### 🎯 Vision Implemented

Sistema completo de configuración de agentes que permite:
- ✅ Subir documento de requerimientos
- ✅ Ver progreso de extracción en tiempo real
- ✅ Configuración guiada con prompts
- ✅ Vista previa de configuración extraída
- ✅ Link al documento fuente para verificación
- ✅ Aplicación automática de configuración

---

## 🎨 UI/UX del Modal

### Modo de Selección (Inicial)

```
┌────────────────────────────────────────────┐
│ Configuración del Agente              [X] │
├────────────────────────────────────────────┤
│                                            │
│ ¿Cómo deseas configurar el agente?        │
│                                            │
│ ┌──────────────┐  ┌──────────────┐        │
│ │ 📄 Subir     │  │ 🧠 Describir │        │
│ │  Documento   │  │  con Prompts │        │
│ └──────────────┘  └──────────────┘        │
│                                            │
└────────────────────────────────────────────┘
```

---

### Modo Archivo: Upload

```
┌────────────────────────────────────────────┐
│ Click para subir o arrastra aquí          │
│                                            │
│        📤                                  │
│   PDF, Word, o texto                       │
│                                            │
│ 💡 ¿Qué debe incluir el documento?        │
│ • Propósito del agente                     │
│ • Audiencia objetivo                       │
│ • Tipos de inputs esperados                │
│ • Outputs correctos (ejemplos)             │
│ • Outputs incorrectos (anti-ejemplos)      │
│ • Criterios de calidad                     │
│                                            │
│              [Procesar Documento]          │
└────────────────────────────────────────────┘
```

---

### Progreso de Extracción

```
┌────────────────────────────────────────────┐
│         ⏳ Procesando Documento            │
│   Extrayendo configuración del agente...   │
│                                            │
│ Extrayendo propósito y objetivos... 65%   │
│ ████████████████████░░░░░░░░░░            │
│ Paso 3 de 8               12s transcurridos│
│                                            │
│ Etapas del Proceso:                        │
│ ✅ Subiendo documento                      │
│ ✅ Analizando estructura                   │
│ ⏳ Extrayendo propósito        ← Actual    │
│ ⚪ Mapeando entradas                       │
│ ⚪ Mapeando salidas                        │
│ ⚪ Extrayendo criterios                    │
│ ⚪ Generando configuración                 │
└────────────────────────────────────────────┘
```

**Etapas visuales:**
1. 📤 Subiendo documento (0-12%)
2. 👁️ Analizando estructura (13-25%)
3. 🎯 Extrayendo propósito (26-38%)
4. 💬 Mapeando entradas (39-51%)
5. ✅ Mapeando salidas (52-64%)
6. ✨ Extrayendo criterios (65-77%)
7. ⚙️ Generando configuración (78-90%)
8. ✅ Complete (100%)

---

### Configuración Extraída

```
┌────────────────────────────────────────────┐
│ ✅ Configuración Generada                  │
│ Revisa y ajusta si es necesario            │
│                        [Ver Documento]     │
├────────────────────────────────────────────┤
│                                            │
│ 🎯 Información Básica    │ Especificaciones│
│                          │                 │
│ Nombre: Agente Ventas    │ Tipos de Input: │
│ Propósito: Asistir...    │ • Consultas     │
│ Audiencia:               │ • Solicitudes   │
│ • Equipo ventas          │                 │
│ • Gerentes               │ Formato Output: │
│                          │ Conciso con     │
│ Modelo: ✨ Flash         │ ejemplos        │
│                          │                 │
│ System Prompt:           │ Tono:          │
│ ┌──────────────┐         │ Professional    │
│ │ Eres un...   │         │                 │
│ └──────────────┘         │                 │
│                                            │
│ 📄 Documento Fuente: requirements.pdf     │
│                            [Descargar]     │
│                                            │
│ [Cancelar]           [Guardar Configuración]│
└────────────────────────────────────────────┘
```

---

### Modo Prompts: Guiado

```
┌────────────────────────────────────────────┐
│ 💡 Te guiaremos paso a paso                │
│                                            │
│ 1. ¿Cuál es el propósito de este agente?  │
│ ┌────────────────────────────────────────┐ │
│ │ Ejemplo: Asistir al equipo de ventas   │ │
│ │ con información sobre productos...     │ │
│ └────────────────────────────────────────┘ │
│                                            │
│ 2. ¿Quiénes usarán este agente?           │
│ ┌────────────────────────────────────────┐ │
│ │ Ejemplo: Equipo ventas, gerentes...    │ │
│ └────────────────────────────────────────┘ │
│                                            │
│ ... (6 preguntas total)                    │
│                                            │
│ [Cancelar]       [Generar Configuración]  │
└────────────────────────────────────────────┘
```

**6 Preguntas Guiadas:**
1. **Propósito:** ¿Qué hace el agente?
2. **Audiencia:** ¿Quiénes lo usan?
3. **Inputs:** ¿Qué preguntas recibirá?
4. **Outputs:** ¿Cómo debe responder?
5. **Calidad:** ¿Qué hace buena una respuesta?
6. **Undesirable:** ¿Qué NO debe hacer?

---

## 🎯 Nueva Integración en Chat

### Agent Header

Nuevo header en área de chat mostrando:

```
┌────────────────────────────────────────────┐
│ 💬 Agente Ventas    [Flash]  [Configurar] │
└────────────────────────────────────────────┘
```

**Elementos:**
- Icono MessageSquare
- Nombre del agente (editable)
- Badge del modelo (Flash/Pro)
- Botón "Configurar Agente"

**Click en "Configurar Agente":**
- Abre AgentConfigurationModal
- Permite subir documento o usar prompts
- Muestra progreso de extracción
- Aplica configuración al agente actual

---

## 🔧 Tipos Creados

### agent-config.ts

**AgentConfiguration:**
- Información básica (nombre, propósito, audiencia)
- Modelo recomendado y system prompt
- Input/Output specifications
- Criterios de calidad
- Outputs no deseables
- Context sources requeridos
- Domain expert info
- Criterios de evaluación

**ExtractionProgress:**
- 8 etapas: uploading → complete
- Porcentaje, mensaje, paso actual
- Tiempo transcurrido

**AgentEvaluation:** (Para sistema de evaluación)
- Test inputs/results
- Scores por criterio
- Fortalezas/debilidades
- Recomendaciones
- Aprobación

---

## 🔄 Flujo Completo

### Opción 1: Con Documento

```
1. Usuario click "Configurar Agente"
   ↓
2. Selecciona "Subir Documento"
   ↓
3. Arrastra/selecciona archivo PDF
   ↓
4. Click "Procesar Documento"
   ↓
5. Ve progreso en tiempo real:
   ⏳ Subiendo... (5%)
   ⏳ Analizando... (18%)
   ⏳ Extrayendo propósito... (35%)
   ... (continúa hasta 100%)
   ↓
6. Ve configuración extraída
   ↓
7. Click "Ver Documento Fuente" (verifica)
   ↓
8. Click "Guardar Configuración"
   ↓
9. Agente configurado ✅
```

### Opción 2: Con Prompts

```
1. Usuario click "Configurar Agente"
   ↓
2. Selecciona "Describir con Prompts"
   ↓
3. Responde 6 preguntas guiadas
   ↓
4. Click "Generar Configuración"
   ↓
5. Sistema procesa respuestas
   ↓
6. Ve configuración generada
   ↓
7. Click "Guardar Configuración"
   ↓
8. Agente configurado ✅
```

---

## 💡 Template de Documento

### Estructura Recomendada:

```markdown
# Configuración del Agente: [Nombre]

## Propósito
Para qué sirve este agente y qué problemas resuelve.

## Audiencia
- Rol 1 (ej: Equipo de ventas)
- Rol 2 (ej: Gerentes)
- Departamento X

## Tipos de Entrada Esperados
- Tipo 1: Consultas sobre precios
- Tipo 2: Solicitudes de información de productos
- Tipo 3: Comparaciones

## Ejemplos de Outputs Correctos
### Ejemplo 1:
**Input:** ¿Cuánto cuesta el producto X?
**Output:** El producto X tiene un precio de $50 USD...
**Por qué es correcto:** Precio específico, moneda clara

## Ejemplos de Outputs Incorrectos
### Ejemplo 1:
**Output:** "No sé"
**Por qué es incorrecto:** Debe buscar en contexto

## Criterios de Calidad
- Precisión de datos
- Claridad
- Inclusión de fuentes
- Tono profesional

## Experto del Dominio
- Nombre: Juan Pérez
- Email: juan@empresa.com
- Departamento: Ventas
```

---

## 🧪 Testing

### Test 1: Upload y Progreso
```bash
1. Abrir agente
2. Click "Configurar Agente"
3. Subir documento
4. ✅ Ver barra de progreso
5. ✅ Ver etapas completándose
6. ✅ Ver timer
```

### Test 2: Configuración Generada
```bash
1. Esperar a que complete
2. ✅ Ver configuración extraída
3. ✅ Click "Ver Documento Fuente"
4. ✅ Se abre el PDF
5. Click "Guardar"
6. ✅ Agente se configura
```

### Test 3: Modo Prompts
```bash
1. Seleccionar "Describir con Prompts"
2. Llenar las 6 preguntas
3. Click "Generar Configuración"
4. ✅ Ver progreso
5. ✅ Ver configuración
6. Guardar
```

### Test 4: Aplicación de Config
```bash
1. Guardar configuración
2. ✅ Nombre del agente actualizado
3. ✅ Modelo cambia (si diferente)
4. ✅ System prompt actualizado
5. ✅ Config persiste
```

---

## 📊 Components Created

### Files:
1. `src/components/AgentConfigurationModal.tsx` (550+ lines)
2. `src/types/agent-config.ts` (200+ lines)

### Integrations:
- ChatInterfaceWorking.tsx (new header, modal integration)
- Agent header in chat area
- Configuration button

---

## 🚀 Future Enhancements (Next Steps)

### Real API Implementation
```typescript
// Replace simulation with:
POST /api/agents/extract-config
Body: FormData with file

Response: {
  config: AgentConfiguration,
  fileUrl: string,
  extractionTime: number
}
```

### Agent Evaluation System
```typescript
// For experts to test and approve agents
interface AgentEvaluation {
  testInputs: TestResult[];
  overallScore: number;
  approved: boolean;
  // ... (types already created)
}
```

### Evaluation Dashboard
- Run test inputs against agent
- Score responses automatically
- Expert review interface
- Approval workflow
- Quality reports

---

## ✅ Success Criteria

- ✅ Modal opens from "Configurar Agente" button
- ✅ Dual mode: File upload OR guided prompts
- ✅ Progress bar shows extraction stages
- ✅ Extracted config displays correctly
- ✅ Source document link works
- ✅ Configuration saves and applies
- ✅ Agent name and model update
- ✅ System prompt applies

---

## 📝 Notes

### Current Implementation:
- Progress simulation (1.5s per stage)
- Mock extraction (returns template config)
- File stored in memory (not Cloud Storage yet)

### Production Requirements:
- Implement real Gemini extraction API
- Save files to Cloud Storage
- Store configurations in Firestore
- Track extraction metrics
- Build evaluation system

---

**Status:** ✅ UI Complete, Ready for API Integration  
**Complexity:** High  
**User Impact:** High - enables structured agent creation  
**Next:** Evaluation system for experts

