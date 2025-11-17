# 🎯 Prompt de Continuación - AI Prompt Enhancement System

**Fecha:** 2025-10-30  
**Sesión Anterior:** Implementación completa de AI Prompt Enhancement  
**Estado:** Sistema implementado, pendiente testing final  
**Próximos Pasos:** Debugging y validación

---

## 📋 CONTEXTO COMPLETO DE LA SESIÓN

### 🎯 Qué Se Logró

Implementamos un **sistema completo de mejora automática de prompts de agentes** usando IA y documentos de especificaciones ("Ficha de Asistente Virtual").

#### Features Implementadas:

1. ✅ **Fix de Agent Prompt Save** (3 problemas resueltos)
   - Parámetros incorrectos en `saveAgentConfig()`
   - Valores `undefined` rechazados por Firestore
   - Guardado en chat hijo en vez de agente padre

2. ✅ **Hierarchical Prompts Display**
   - Context panel muestra Domain + Agent prompts separados
   - Cálculo de tokens correcto usando prompt combinado
   - Visual badges diferenciados (blue para domain, gray para agent)

3. ✅ **AI Prompt Enhancement System**
   - Upload de documentos PDF/DOCX con especificaciones
   - Extracción completa con Gemini Flash
   - Análisis y mejora con Gemini Pro
   - Vista comparativa (actual vs mejorado)
   - Guardado en Cloud Storage

4. ✅ **Ficha de Asistente Virtual Structure**
   - Template completo de 13 secciones
   - Reconocimiento automático de estructura
   - Best practices de prompt engineering aplicadas

---

## 🗂️ Estructura del Proyecto

### Componentes Creados:

```
src/
├── components/
│   ├── AgentPromptEnhancer.tsx (560 líneas)
│   │   └── Modal para mejorar prompts con upload
│   ├── AgentPromptModal.tsx (modificado)
│   │   └── Botón "Mejorar con IA" agregado
│   └── AgentConfigurationModal.tsx (modificado)
│       └── Tercera opción "Mejorar Prompt" en grid
│
├── pages/api/agents/
│   ├── upload-setup-document.ts
│   │   └── Upload a Cloud Storage + extracción Gemini
│   └── enhance-prompt.ts
│       └── Análisis + generación con Gemini Pro
│
└── lib/
    └── prompt-utils.ts (ya existía)
        └── combineDomainAndAgentPrompts()
```

### Documentación Creada:

```
docs/
├── features/
│   ├── ai-prompt-enhancement-2025-10-30.md
│   └── hierarchical-prompts-context-display-2025-10-29.md
├── templates/
│   └── Ficha-Asistente-Virtual-Template.md
├── fixes/
│   └── agent-prompt-save-fix-2025-10-29.md
├── SETUP_CLOUD_STORAGE_BUCKET.md
└── QUICK_START_BUCKET_CREATION.md
```

---

## 🪣 Cloud Storage Setup

### Bucket Creado:

**Nombre:** `salfagpt-agent-setup-docs`  
**Proyecto:** `salfagpt`  
**Región:** `us-central1`  
**Status:** ✅ Activo

**Comando usado:**
```bash
gcloud config set project salfagpt
gsutil mb -p salfagpt -l us-central1 gs://salfagpt-agent-setup-docs
```

**Verificación:**
```bash
gsutil ls gs://salfagpt-agent-setup-docs/
# ✅ Bucket existe y está vacío (listo para usar)
```

---

## 🐛 Issue Actual - Error 400 en Upload

### Síntoma:

Usuario intenta subir "Ficha de Asistente Virtual - rev. JRF.pdf" (0.23 MB) y recibe:
```
Error
Error al subir el documento
```

**Logs de navegador:**
```
api/agents/upload-setup-document:1  Failed to load resource: 
the server responded with a status of 400 (Bad Request)
```

### Debugging Aplicado:

**Backend (`upload-setup-document.ts`):**
```typescript
console.log('📥 [UPLOAD] Request received');
console.log('📥 [UPLOAD] Content-Type:', request.headers.get('content-type'));
console.log('📥 [UPLOAD] FormData parsed');
console.log('📥 [UPLOAD] file:', !!file);
console.log('📥 [UPLOAD] agentId:', agentId);
console.log('📥 [UPLOAD] purpose:', purpose);
```

**Frontend (`AgentPromptEnhancer.tsx`):**
```typescript
console.log('📤 [FRONTEND] Uploading file:', file.name);
console.log('📤 [FRONTEND] Agent ID:', agentId);
console.log('📤 [FRONTEND] File size:', file.size);
console.log('📥 [FRONTEND] Upload response status:', uploadResponse.status);
```

### Posibles Causas:

1. **`agentId` está undefined o vacío**
   - Check: Modal recibe `agentId` como prop?
   - Solución: Verificar que ChatInterfaceWorking pasa agentId correcto

2. **FormData no se está creando correctamente**
   - Check: File object es válido?
   - Solución: Verificar que file viene del input

3. **Endpoint no cargó después de restart**
   - Check: Servidor reiniciado correctamente?
   - Solución: Hard restart del servidor

---

## 🔧 Próximos Pasos Para Debugging

### 1. Verificar Logs en Consola del Navegador

**Después de intentar upload, buscar:**
```
📤 [FRONTEND] Uploading file: [nombre]
📤 [FRONTEND] Agent ID: [id]
📥 [FRONTEND] Upload response status: 400
❌ [FRONTEND] Upload failed: [error text]
```

**Esto dirá:**
- Si el agentId se está enviando
- Qué dice el servidor en el error

### 2. Verificar Logs del Servidor (Terminal)

**Buscar en terminal donde corre `npm run dev`:**
```
📥 [UPLOAD] Request received
📥 [UPLOAD] Content-Type: multipart/form-data; boundary=...
📥 [UPLOAD] FormData parsed
📥 [UPLOAD] file: true/false
📥 [UPLOAD] agentId: [id o undefined]
```

**Si no aparecen estos logs:**
- El endpoint no está registrado
- El request no está llegando
- Problema de routing

**Si dice `file: false` o `agentId: undefined`:**
- Frontend no está enviando los datos correctamente

### 3. Hard Restart del Servidor (Si es Necesario)

```bash
# En terminal:
cd /Users/alec/salfagpt
pkill -f "astro dev"
npm run dev
# Esperar a que inicie completamente
```

---

## 📊 Arquitectura del Sistema

### Flujo Completo:

```
Usuario
  ↓
AgentPromptEnhancer Modal (src/components/AgentPromptEnhancer.tsx)
  ↓ (handleProcessDocument)
FormData: { file, agentId, purpose }
  ↓
POST /api/agents/upload-setup-document
  ↓
Backend:
  1. Valida file + agentId
  2. Upload to gs://salfagpt-agent-setup-docs/agents/{agentId}/setup-docs/
  3. Extrae contenido con Gemini Flash
  4. Retorna: { documentUrl, extractedContent }
  ↓
Frontend recibe extractedContent
  ↓
POST /api/agents/enhance-prompt
  ↓
Backend:
  1. Recibe: currentPrompt + extractedContent
  2. Analiza con Gemini Pro + system instruction especializado
  3. Genera prompt mejorado
  4. Retorna: { enhancedPrompt, metadata }
  ↓
Frontend muestra comparación
  ↓
Usuario click "Aplicar"
  ↓
handleSaveAgentPrompt(enhancedPrompt)
  ↓
PUT /api/conversations/{agentId}/prompt
  ↓
Firestore: agent_configs/{agentId}.agentPrompt = enhancedPrompt
  ↓
✅ Completado
```

---

## 📝 Ficha de Asistente Virtual - Estructura Esperada

### 10 Elementos Clave:

1. **Nombre del Asistente** - Identidad única (ej: "Asistente Legal Territorial RDI")
2. **Objetivo y Descripción** - Propósito y alcance completo
3. **Encargado del Proyecto** - Responsable del proyecto
4. **Usuarios Piloto** - Quiénes validarán (3-5 personas)
5. **Usuarios Finales** - Quiénes lo usarán en productivo (roles, departamentos)
6. **Preguntas Tipo** - 10-20 ejemplos de preguntas reales
7. **Respuestas Tipo** - Nivel de detalle esperado (breve, técnico, adaptativo, etc.)
8. **Documentación** - Normativas, manuales (LGUC, OGUC, DDU, SAP, etc.)
9. **Restricciones** - Qué NO debe hacer, límites
10. **Tono** - Formal, técnico, empático, etc.

### Ejemplo Real (M001):

```
Nombre: Asistente Legal Territorial RDI
Objetivo: Proveer información actualizada sobre normativas LGUC/OGUC/DDU
Usuarios: Arquitectos, Abogados, Jefes de Proyecto
Preguntas: 20+ ejemplos sobre permisos, loteos, condominios
Nivel: Técnico especializado, con referencias
Documentos: LGUC, OGUC, DDU
```

---

## 🧠 Prompt Engineering Best Practices (Aplicadas Automáticamente)

El sistema aplica:

1. **Identidad Clara** → "Eres [Asistente X], especializado en [dominio]..."
2. **Audiencia Específica** → "Tus usuarios son [roles específicos]..."
3. **Comportamiento** → "Siempre debes: [lista específica]..."
4. **Formato Estructurado** → "Resumen → Detalles → Conclusión → Preguntas"
5. **Referencias** → "[Referencia 1]: Documento, Sección/Artículo"
6. **Casos Especiales** → "Si [situación], entonces [acción]..."
7. **Restricciones** → "NO debes: [lista de límites]..."
8. **Dominio-Específico** → Legal=Citas leyes, SAP=Transacciones, etc.

---

## 💾 Variables de Entorno Relevantes

```bash
# .env
GOOGLE_CLOUD_PROJECT=salfagpt
GOOGLE_AI_API_KEY=AIzaSy... # Gemini API key
```

**Verificar:**
```bash
cat .env | grep GOOGLE_CLOUD_PROJECT
cat .env | grep GOOGLE_AI_API_KEY
```

---

## 📦 Commits Realizados (Última Sesión)

```bash
22a9f7a - debug: Add detailed logging to upload endpoint
4809010 - fix: Use correct bucket name for salfagpt project
552f014 - docs: Add quick start guide for bucket creation
5a2d7f6 - docs: Add Cloud Storage bucket setup guide
617746a - feat: Add "Mejorar Prompt" option to Agent Configuration Modal
be4c288 - docs: Add Ficha de Asistente Virtual template
269550a - enhance: Update AI prompt enhancer with Ficha structure recognition
2de6dfc - feat: AI-powered agent prompt enhancement from documents
f846d68 - chore: Add detailed logging for message streaming and loading
7d67e4d - docs: Add hierarchical prompts context display documentation
4ab80f3 - feat: Show hierarchical prompts in context breakdown
20669f4 - fix: Agent prompt save with parent agent detection
```

**Total:** 12 commits, 6,000+ líneas agregadas

---

## 🔍 Estado de Cada Agente

### S001 (GESTION BODEGAS GPT):
- ✅ Prompt guardado: 744 caracteres (personalizado)
- ✅ Formato de respuesta: Resumen + 3 Bullets + Conclusión + Preguntas
- ✅ 76 fuentes de contexto activas (RAG)
- ✅ Funciona correctamente

### M001 (Asistente Legal Territorial RDI):
- ✅ Configuración completa (ARD)
- ✅ 20+ preguntas tipo cargadas
- ✅ Referencias LGUC/OGUC/DDU funcionando
- ✅ Evaluaciones disponibles

### M3 (Agente en Testing):
- ⏳ Pendiente configuración
- 538 fuentes de contexto asignadas
- Candidato ideal para testing de AI enhancement

---

## 🚀 PASOS PARA CONTINUAR (Orden Exacto)

### Paso 1: Verificar Estado del Sistema

```bash
# En terminal:
cd /Users/alec/salfagpt

# Verificar servidor corriendo:
lsof -i:3000
# Debe mostrar proceso de node/astro

# Verificar bucket existe:
gsutil ls gs://salfagpt-agent-setup-docs/
# Debe responder sin error

# Verificar variables de entorno:
cat .env | grep GOOGLE_CLOUD_PROJECT
# Debe mostrar: GOOGLE_CLOUD_PROJECT=salfagpt

cat .env | grep GOOGLE_AI_API_KEY
# Debe mostrar tu API key
```

### Paso 2: Debugging del Error 400

**A. Abrir navegador en localhost:3000/chat**

**B. Abrir DevTools (F12) → Console tab**

**C. Intentar upload:**
1. Seleccionar agente (ej: M3)
2. Click "Configurar Agente"
3. Tab "Mejorar Prompt" (tercera opción con Sparkles)
4. Subir archivo "Ficha de Asistente Virtual.pdf"
5. Click "Generar Prompt Mejorado"

**D. Capturar logs:**

**Frontend logs (navegador console):**
```
📤 [FRONTEND] Uploading file: [filename]
📤 [FRONTEND] Agent ID: [id]
📤 [FRONTEND] File size: [bytes]
📥 [FRONTEND] Upload response status: [status]
❌ [FRONTEND] Upload failed: [error text]  ← CRÍTICO: Copiar este texto
```

**Backend logs (terminal donde corre npm run dev):**
```
📥 [UPLOAD] Request received
📥 [UPLOAD] Content-Type: [content-type]
📥 [UPLOAD] FormData parsed
📥 [UPLOAD] file: [true/false]  ← CRÍTICO
📥 [UPLOAD] agentId: [id/missing]  ← CRÍTICO
```

**E. Analizar el error:**

**Si logs backend NO aparecen:**
- Endpoint no está cargado
- Solución: Hard restart servidor
```bash
pkill -f "astro dev"
npm run dev
```

**Si dice `file: false`:**
- FormData no tiene el archivo
- Solución: Verificar que `file` state tiene valor en componente

**Si dice `agentId: missing`:**
- No se está pasando agentId al modal
- Solución: Check props del AgentPromptEnhancer

### Paso 3: Fix Basado en Logs

**Según lo que muestren los logs, aplicar el fix correspondiente.**

Ejemplo de fixes comunes:

**Fix 1: agentId undefined**
```typescript
// En ChatInterfaceWorking.tsx donde se renderiza AgentPromptEnhancer
agentId={currentConversation || ''}  // ❌ Podría ser un chat hijo

// Debería ser:
agentId={(() => {
  const currentConv = conversations.find(c => c.id === currentConversation);
  return currentConv?.agentId || currentConversation || '';
})()}
```

**Fix 2: file undefined**
```typescript
// Verificar que handleFileSelect está guardando el archivo:
const handleFileSelect = (selectedFile: File) => {
  setFile(selectedFile);  // ✅ Debe estar presente
  setError(null);
}
```

**Fix 3: Endpoint no cargado**
```bash
# Hard restart
pkill -f "astro dev"
npm run dev
# Esperar a ver: "Server started at http://localhost:3000"
```

---

## 📚 Archivos Clave Para Revisar

### Si Necesitas Modificar Código:

1. **Frontend Upload Logic:**
   - `src/components/AgentPromptEnhancer.tsx` (líneas 71-155)
   - Buscar: `handleProcessDocument`

2. **Backend Upload Endpoint:**
   - `src/pages/api/agents/upload-setup-document.ts` (líneas 19-120)
   - Buscar: `export const POST`

3. **Backend Enhancement Endpoint:**
   - `src/pages/api/agents/enhance-prompt.ts` (líneas 158-250)
   - Buscar: `export const POST`

4. **Integration in ChatInterfaceWorking:**
   - `src/components/ChatInterfaceWorking.tsx` (líneas 5915-5929)
   - Buscar: `<AgentPromptEnhancer`

---

## 🎯 Test Case Completo

### Setup:

**Agente:** M3 (o cualquier agente)  
**Documento:** "Ficha de Asistente Virtual - rev. JRF.pdf"  
**Contenido esperado:** Estructura de ficha con 10 elementos

### Flujo Esperado:

```
1. Upload → Cloud Storage
   ✅ Archivo en: gs://salfagpt-agent-setup-docs/agents/M3/setup-docs/{timestamp}-{filename}.pdf
   
2. Extract → Gemini Flash
   ✅ Contenido extraído: ~5,000-10,000 caracteres
   ✅ Preview mostrado en UI
   
3. Analyze → Gemini Pro
   ✅ Identifica: Nombre, Objetivo, Usuarios, Preguntas, etc.
   
4. Generate → Prompt Mejorado
   ✅ Output: 1,500-2,500 caracteres
   ✅ Estructura: Identidad + Audiencia + Comportamiento + Formato + Referencias + Restricciones
   
5. Display → Comparación
   ✅ Left: Prompt actual (193 chars)
   ✅ Right: Prompt mejorado (2,000 chars)
   ✅ Delta: +1,807 chars
   
6. Apply → Guardar
   ✅ PUT /api/conversations/{agentId}/prompt
   ✅ Firestore: agent_configs/{agentId}.agentPrompt updated
   ✅ currentAgentPrompt state updated
```

### Verificación Post-Aplicación:

```
1. Cerrar modal
2. Volver a abrir "Editar Prompt"
3. Verificar: Prompt mejorado aparece (2,000 chars)
4. Abrir panel de contexto
5. Verificar: System Prompt muestra tokens correctos (~500 tokens)
6. Enviar pregunta de prueba
7. Verificar: Respuesta sigue formato definido en prompt
```

---

## 🔑 Variables de Estado Importantes

### En ChatInterfaceWorking.tsx:

```typescript
const [currentConversation, setCurrentConversation] = useState<string | null>(null);
// ↑ ID del chat o agente actualmente seleccionado

const [currentAgentPrompt, setCurrentAgentPrompt] = useState<string>('');
// ↑ Prompt del agente cargado desde Firestore

const [currentDomainPrompt, setCurrentDomainPrompt] = useState<string>('');
// ↑ Prompt del dominio/organización (futuro)

const [showAgentPromptEnhancer, setShowAgentPromptEnhancer] = useState(false);
// ↑ Controla visibilidad del modal enhancer
```

### En AgentPromptEnhancer.tsx:

```typescript
const [file, setFile] = useState<File | null>(null);
// ↑ Archivo subido por el usuario

const [processing, setProcessing] = useState(false);
// ↑ Estado de procesamiento

const [progress, setProgress] = useState<ExtractionProgress | null>(null);
// ↑ Progreso de 5 etapas

const [extractedContent, setExtractedContent] = useState<string>('');
// ↑ Contenido extraído del documento

const [suggestedPrompt, setSuggestedPrompt] = useState<string>('');
// ↑ Prompt mejorado generado por IA
```

---

## 🎨 UI Locations

### Dónde Encontrar la Funcionalidad:

**Opción 1: Desde "Editar Prompt"**
```
Agente → Configurar Contexto → Editar Prompt (botón verde Sparkles)
  ↓
Modal "Configuración del Agente" abre
  ↓
Footer: Botón "Mejorar con IA" (purple)
  ↓
AgentPromptEnhancer modal abre
```

**Opción 2: Desde "Configurar Agente"** (Recomendado)
```
Agente → Configurar Agente
  ↓
Modal "Configuración del Agente" abre
  ↓
Grid de 3 opciones: [Subir Documento] [Describir con Prompts] [Mejorar Prompt]
  ↓
Click "Mejorar Prompt" (tercera opción, purple)
  ↓
UI cambia a modo enhancement
  ↓
Upload área aparece (purple theme)
```

---

## 🔒 Permisos y Autenticación

### Cloud Storage:

**Cuenta activa:** `alec@salfacloud.cl` (después del login)  
**Proyecto:** `salfagpt`  
**Bucket:** `salfagpt-agent-setup-docs`  
**Permisos necesarios:** Storage Object Creator (para uploads)

**Verificar permisos:**
```bash
gcloud auth list
# Debe mostrar: alec@salfacloud.cl (active)

gsutil ls gs://salfagpt-agent-setup-docs/
# Debe funcionar sin error 403
```

### Gemini AI:

**API Key:** En `.env` como `GOOGLE_AI_API_KEY`  
**Modelos usados:**
- Gemini 2.5 Flash → Extracción de contenido
- Gemini 2.5 Pro → Generación de prompt mejorado

---

## 📊 Métricas y Tiempos Esperados

### Procesamiento:

- **Upload:** 1-3 segundos
- **Extraction:** 10-20 segundos (depende del tamaño)
- **Analysis:** 5-10 segundos
- **Generation:** 10-15 segundos
- **Total:** ~30-50 segundos

### Tamaños:

- **Documento input:** 0.2-5 MB típicamente
- **Contenido extraído:** 5,000-20,000 caracteres
- **Prompt mejorado:** 1,500-3,000 caracteres

---

## 🐛 Troubleshooting Guide

### Error: "Error al subir el documento"

**Check 1: Logs del navegador**
```javascript
// Buscar en Console:
📤 [FRONTEND] Agent ID: undefined  ← PROBLEMA: agentId no se pasa
```
**Fix:** Verificar props de AgentPromptEnhancer

**Check 2: Logs del servidor**
```
❌ [UPLOAD] Missing required fields - file: false, agentId: [id]
```
**Fix:** FormData no contiene el archivo

**Check 3: Endpoint no responde**
```
(No hay logs de backend)
```
**Fix:** Restart servidor

---

### Error: "Failed to extract content"

**Causa:** Gemini API issue o archivo corrupto

**Solución:**
1. Verificar API key válido
2. Probar con archivo más pequeño
3. Verificar formato del archivo (debe ser PDF o DOCX legible)

---

### Error: "Failed to enhance prompt"

**Causa:** Gemini Pro no pudo generar mejora

**Solución:**
1. Verificar que extractedContent tiene contenido
2. Check logs de Gemini API
3. Probar con documento más estructurado

---

## 🎯 Success Criteria

**La funcionalidad está completa cuando:**

1. ✅ Upload funciona sin error 400
2. ✅ Contenido se extrae y muestra en preview
3. ✅ Prompt mejorado se genera
4. ✅ Comparación se muestra correctamente
5. ✅ "Aplicar" guarda el prompt en Firestore
6. ✅ Documento aparece en Cloud Storage bucket
7. ✅ Al recargar, prompt mejorado persiste
8. ✅ Respuestas del agente siguen nuevo formato

---

## 📱 PROMPT PARA NUEVA CONVERSACIÓN

Copia y pega esto en la nueva conversación:

```
Estoy continuando el desarrollo del sistema AI Prompt Enhancement para SalfaGPT.

CONTEXTO COMPLETO:
- Proyecto: salfagpt (GCP)
- Bucket creado: salfagpt-agent-setup-docs (us-central1) ✅
- Servidor: localhost:3000 (corriendo)
- Issue actual: Error 400 al subir documento para mejorar prompt

ESTADO:
- UI implementada: 3 opciones en "Configurar Agente" modal
  1. Subir Documento (ARD)
  2. Describir con Prompts  
  3. Mejorar Prompt ← Usando esta
- Backend endpoints creados:
  - /api/agents/upload-setup-document (con logging detallado)
  - /api/agents/enhance-prompt
- Logging agregado en frontend y backend para debugging

ARQUITECTURA:
- AgentPromptEnhancer.tsx: Modal principal
- upload-setup-document.ts: Upload + extract con Gemini
- enhance-prompt.ts: Mejora con Gemini Pro
- Ficha structure: 10 elementos (Nombre, Objetivo, Usuarios, Preguntas, etc.)

ERROR ACTUAL:
- Usuario sube "Ficha de Asistente Virtual - rev. JRF.pdf" (0.23 MB)
- Click "Generar Prompt Mejorado"
- Error 400: "Error al subir el documento"
- Logs frontend/backend agregados pero no se han capturado aún

ARCHIVOS CLAVE:
- src/components/AgentPromptEnhancer.tsx (handleProcessDocument - línea 71)
- src/pages/api/agents/upload-setup-document.ts (POST handler - línea 19)
- docs/templates/Ficha-Asistente-Virtual-Template.md (template de referencia)

PRÓXIMOS PASOS:
1. Verificar logs de consola del navegador después de intentar upload
2. Verificar logs del servidor (npm run dev output)
3. Identificar si file o agentId están undefined
4. Aplicar fix correspondiente
5. Probar upload exitoso
6. Verificar extracción de contenido
7. Confirmar generación de prompt mejorado
8. Validar guardado en Firestore
9. Verificar documento en Cloud Storage

COMMITS RECIENTES:
- 22a9f7a: debug logging agregado
- 4809010: bucket name fix para salfagpt
- 617746a: UI "Mejorar Prompt" en modal

Por favor ayúdame a:
1. Diagnosticar el error 400 usando los logs
2. Aplicar el fix necesario
3. Completar el testing end-to-end
4. Validar que todo funciona correctamente

Tengo el archivo "Ficha de Asistente Virtual - rev. JRF.pdf" listo para subir.
Los logs detallados están agregados en el código.
El bucket existe y está listo.

¿Qué logs específicos necesitas que capture para diagnosticar el 400?
```

---

## 📋 Información de Referencia Rápida

### Proyecto:
- **ID:** `salfagpt`
- **Región:** `us-central1`
- **Bucket:** `salfagpt-agent-setup-docs`

### Endpoints:
- **Upload:** `POST /api/agents/upload-setup-document`
- **Enhance:** `POST /api/agents/enhance-prompt`
- **Save Prompt:** `PUT /api/conversations/{id}/prompt`

### Agentes de Prueba:
- **M3:** ID `cjn3bC0HrUYtHqu69CKS` (538 fuentes)
- **S001:** ID `AjtQZEIMQvFnPRJRjl4y` (76 fuentes)
- **M001:** ID disponible (legal)

### Documento de Prueba:
- **Nombre:** "Ficha de Asistente Virtual - rev. JRF.pdf"
- **Tamaño:** 0.23 MB
- **Formato:** PDF
- **Contenido:** Estructura de ficha completa

---

**ÚLTIMA ACTUALIZACIÓN:** 2025-10-30 20:07 PM  
**STATUS:** Debugging error 400 en upload  
**BLOQUEADOR:** Necesita capturar logs detallados  
**SIGUIENTE:** Diagnosticar con logs y aplicar fix











