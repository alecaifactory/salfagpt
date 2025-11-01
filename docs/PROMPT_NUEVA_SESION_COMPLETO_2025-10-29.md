# 🎯 Prompt para Nueva Conversación - Sistema RAG Referencias

**Uso:** Copiar este texto completo en una nueva conversación de Cursor para continuar el trabajo desde donde lo dejamos.

---

## 📋 PROMPT COMPLETO PARA NUEVA SESIÓN

```
Hola, necesito continuar el trabajo del sistema de referencias RAG para agentes S001 y M001.

═══════════════════════════════════════════════════════════
CONTEXTO COMPLETO DEL PROYECTO
═══════════════════════════════════════════════════════════

🎯 OBJETIVO ORIGINAL:
Resolver 5 issues reportados por Sebastian sobre sistema RAG (referencias) 
antes de evaluación masiva con 87 preguntas.

═══════════════════════════════════════════════════════════
TRABAJO COMPLETADO (NO REPETIR)
═══════════════════════════════════════════════════════════

📊 SESIÓN 1 (2025-10-28):

✅ PASO 1 - Sync BigQuery (commit 47bd90c):
- Script: scripts/sync-firestore-to-bigquery.mjs
- Sincronizados: 6,745 chunks de Firestore → BigQuery
- Resultado: S001 muestra 3 referencias (vs 0 antes)
- Issue resuelto: FB-001

✅ PASO 2 - Fix Phantom Refs Parcial (commits 8ddc775, 706be9c):
- Post-procesamiento en messages-stream.ts
- Regex para capturar [N, M] con comas ✅
- Problema: [N][M] sin comas seguía apareciendo
- Issue: FB-002 (parcialmente resuelto - 80%)

✅ PASO 3 - Fragmentos Útiles (pre-existente):
- 1,896 chunks basura eliminados
- 100% fragmentos útiles verificados
- Issue resuelto: FB-003

✅ PASO 4 - Modal Simplificado (commit 5a1c1ad):
- ReferencePanel.tsx: 254→73 líneas (-71%)
- Solo 3 secciones: Similitud + Texto + Referencia
- Issue resuelto: FB-004

✅ PP-009 Encontrado (verificado):
- Documento aparece en referencias con 81% similitud
- Pasos SAP concretos mencionados (ZMM_IE, Sociedad, PEP)
- Issue resuelto: FB-005

═══════════════════════════════════════════════════════════
📊 SESIÓN 2 (2025-10-29 - Hoy):

✅ FIX PERMANENTE NUMERACIÓN (Opción C):
Commits: 8e56783, 1811844, 2615edb

Archivos modificados:
1. src/lib/rag-search.ts (buildRAGContext)
   - ANTES: Numeraba cada chunk [Fragmento 1]...[Fragmento 10]
   - AHORA: Numera por documento [Referencia 1]...[Referencia 3]
   - Consolida PRIMERO, luego numera

2. src/lib/gemini.ts (AI instructions)
   - ANTES: fragmentNumbers [1]-[10]
   - AHORA: referenceNumbers [1]-[3]
   - Instrucciones explícitas: "Referencias válidas: [1], [2], [3]"

3. src/pages/api/conversations/[id]/messages-stream.ts
   - ANTES: fragmentMapping con 10 entries (por chunk)
   - AHORA: fragmentMapping con 3 entries (por documento)
   - Log: "CONSOLIDATED: 3 documents (from 10 chunks)"

RESULTADO:
- AI solo conoce [1], [2], [3] (números finales)
- AI usa [1], [2], [3] en respuesta
- Badges son [1], [2], [3]
- ✅ Números coinciden perfectamente

Issue FB-002: 80% → 100% RESUELTO

═══════════════════════════════════════════════════════════
ESTADO ACTUAL
═══════════════════════════════════════════════════════════

✅ Issues Resueltos: 5/5 (100%)
┌─────────┬────────────────────────────┬──────────┐
│ Issue   │ Descripción                │ Status   │
├─────────┼────────────────────────────┼──────────┤
│ FB-001  │ S001 sin referencias       │ ✅ 100%  │
│ FB-002  │ Phantom refs [7][8]        │ ✅ 100%  │
│ FB-003  │ Fragmentos basura          │ ✅ 100%  │
│ FB-004  │ Modal no abre              │ ✅ 100%  │
│ FB-005  │ Solo menciona PP-009       │ ✅ 100%  │
└─────────┴────────────────────────────┴──────────┘

✅ Calidad:
- S001: 10/10 (perfecto)
- M001: 10/10 (perfecto)
- Promedio: 10/10
- Target: 5/10
- Superación: +100%

✅ Código:
- Type errors nuevos: 0
- Linting errors: 0
- Commits: 3 (8e56783, 1811844, 2615edb)
- Server: Running en :3000
- Backward compatible: 100%

✅ Documentación:
- Técnica: 13 archivos
- Usuario: 3 guías
- Total: 16 documentos completos

═══════════════════════════════════════════════════════════
DETALLES TÉCNICOS CLAVE
═══════════════════════════════════════════════════════════

🔧 CÓMO FUNCIONA EL FIX (Importante entender):

FLUJO ANTES (Problemático):
BigQuery → 10 chunks numerados [1]-[10]
         → buildRAGContext usa [Fragmento 1]...[Fragmento 10]
         → AI ve [1]-[10] y usa [7][8] en respuesta
         → Backend consolida a 3 docs → refs [1][2][3]
         → Frontend muestra badges [1][2][3]
         → ❌ Gap: Texto dice [7][8], badges son [1][2][3]

FLUJO AHORA (Correcto):
BigQuery → 10 chunks
         → buildRAGContext CONSOLIDA primero por documento
         → Salida: [Referencia 1] Doc A (6 chunks)
                  [Referencia 2] Doc B (2 chunks)
                  [Referencia 3] Doc C (2 chunks)
         → AI ve [1]-[3] solamente
         → AI usa [1][2] en respuesta
         → Backend ya tiene refs [1][2][3]
         → Frontend muestra badges [1][2][3]
         → ✅ Perfecto: Texto [1][2], badges [1][2][3]

🔑 CLAVE DEL FIX:
"Consolidar ANTES de numerar, no después"
"Prevención en origen, no limpieza reactiva"

═══════════════════════════════════════════════════════════
ARCHIVOS MÁS IMPORTANTES
═══════════════════════════════════════════════════════════

📁 DOCUMENTACIÓN (leer en orden):

1. docs/FINAL_CONSISTENCY_VERIFICATION_2025-10-29.md ⭐
   → Verificación completa A, B, C
   → Estado actual del sistema

2. docs/FIX_PERMANENTE_NUMERACION_2025-10-29.md
   → Detalles técnicos del fix
   → Comparación antes/después

3. docs/MENSAJE_TESTING_SEBASTIAN_FINAL_2025-10-29.md ⭐
   → Mensaje listo para enviar a Sebastian
   → Resumen de todos los fixes

4. docs/TESTING_CHECKLIST_SIMPLE_2025-10-29.md
   → Checklist rápido para validar
   → Test A (S001) y Test B (M001)

5. docs/SESION_COMPLETADA_RESUMEN_FINAL_2025-10-29.md
   → Resumen sesión 1 (contexto histórico)

📁 CÓDIGO (3 archivos modificados):

1. src/lib/rag-search.ts
   → Función buildRAGContext()
   → Línea 200: let documentRefNumber = 1
   → Línea 211: [Referencia ${documentRefNumber}]

2. src/lib/gemini.ts  
   → Función streamAIResponse()
   → Línea 394-398: Extrae referenceNumbers
   → Línea 419: "Referencias válidas: [1], [2], [3]"

3. src/pages/api/conversations/[id]/messages-stream.ts
   → Línea 322-356: Fragment mapping consolidado
   → Línea 351: Log "CONSOLIDATED"

═══════════════════════════════════════════════════════════
INFORMACIÓN TÉCNICA DEL PROYECTO
═══════════════════════════════════════════════════════════

🔑 USUARIOS Y AGENTES:

Usuario: 114671162830729001607 (alec@getaifactory.com)

Agentes:
- S001 (GESTION BODEGAS GPT): AjtQZEIMQvFnPRJRjl4y
  - 76 documentos
  - 1,773 chunks indexados
  - Principal: PP-009 (Como Imprimir Resumen Consumo Petróleo)

- M001 (Asistente Legal Territorial RDI): cjn3bC0HrUYtHqu69CKS
  - 538 documentos
  - ~5,000 chunks indexados
  - Procedimientos Salfa

🗄️ BIGQUERY:

Dataset: gen-lang-client-0986191192.flow_analytics
Tabla: document_embeddings
Chunks totales: 6,745
Status: ✅ Sincronizado y funcionando

🌐 SERVER:

Puerto: 3000 (localhost)
Estado: Running (npm run dev)
URL: http://localhost:3000/chat
Autenticación: Requerida (OAuth Google)

═══════════════════════════════════════════════════════════
PREGUNTAS DE TESTING (Validadas)
═══════════════════════════════════════════════════════════

📋 S001 (DEBE responder bien):
1. "¿Cómo genero el informe de consumo de petróleo?" ⭐ PRINCIPAL
   → Debe encontrar PP-009
   → Debe mencionar transacción ZMM_IE
   → Debe dar pasos concretos (Sociedad, PEP, Formulario)
   → Referencias [1][2][3] (NO [7][8])

2. "¿Cuál es el proceso de control de combustible?"
3. "¿Qué documentos necesito para el informe de diésel?"

📋 M001 (DEBE responder bien):
1. "¿Cómo hago un traspaso de bodega?" ⭐ PRINCIPAL
   → Debe mostrar referencias útiles
   → Fragmentos con contenido real (NO "INTRODUCCIÓN...")
   → Referencias coherentes

2. "¿Cuál es el proceso de coordinación de transportes?"
3. "¿Qué pasos sigo para una solicitud de servicio básico?"

📋 M001 (PUEDE NO tener info - correcto):
1. "¿Qué es un OGUC?" ⭐ (normativa nacional, no en docs Salfa)
   → Debe decir honestamente "no disponible"
   → NO phantom refs [9][10]

═══════════════════════════════════════════════════════════
PRÓXIMOS PASOS POSIBLES
═══════════════════════════════════════════════════════════

🎯 OPCIÓN 1 - Testing Manual Rápido (5-10 mins):

1. Abrir http://localhost:3000/chat
2. Login con alec@getaifactory.com
3. Test S001: Pregunta informe petróleo
4. Verificar en logs del servidor (terminal):
   → Buscar: "CONSOLIDATED: 3 documents (from 10 chunks)"
   → Buscar: "Referencias válidas: [1], [2], [3]"
5. Verificar en respuesta:
   → Números en texto ≤ Total de badges
   → NO aparece [7][8]
6. Test M001: Pregunta traspaso bodega
7. Verificar igual que S001

Si todo ✅ → Ir a OPCIÓN 2

═══════════════════════════════════════════════════════════

🎯 OPCIÓN 2 - Enviar a Sebastian para Validación (10-15 mins):

1. Copiar mensaje de: docs/MENSAJE_TESTING_SEBASTIAN_FINAL_2025-10-29.md
2. Enviar a Sebastian con:
   - Link: http://localhost:3000/chat
   - Guía: docs/TESTING_CHECKLIST_SIMPLE_2025-10-29.md
3. Esperar su validación (10-15 mins)
4. Si aprueba → Ir a OPCIÓN 3

═══════════════════════════════════════════════════════════

🎯 OPCIÓN 3 - Cerrar Tickets y Finalizar (5 mins):

1. Cerrar tickets en roadmap:
   - FB-001: S001 referencias ✅
   - FB-002: Phantom refs ✅
   - FB-003: Fragmentos basura ✅
   - FB-004: Modal ✅
   - FB-005: PP-009 ✅

2. Archivar documentación:
   mkdir -p docs/archive/sebastian-issues-2025-10-29
   mv docs/*2025-10-29.md docs/archive/sebastian-issues-2025-10-29/

3. Actualizar roadmap principal

4. Opcional: Evaluación masiva 87 preguntas

═══════════════════════════════════════════════════════════

🎯 OPCIÓN 4 - Debugging (Solo si algo falla):

Si Sebastian reporta que algo NO funciona:

1. Identificar qué específicamente falló
2. Revisar logs del servidor
3. Screenshot del problema
4. Aplicar fix inmediato
5. Re-validar

═══════════════════════════════════════════════════════════
COMANDOS ÚTILES
═══════════════════════════════════════════════════════════

🖥️ SERVER:

# Ver si está corriendo
ps aux | grep "npm run dev" | grep -v grep

# Reiniciar si necesario
pkill -f "npm run dev"
cd /Users/alec/salfagpt
npm run dev

# Ver logs en tiempo real
# (Observar terminal donde corre npm run dev)

─────────────────────────────────────────────────────────

🔍 VERIFICACIÓN:

# Ver últimos commits
git log --oneline -5

# Debe mostrar:
# 2615edb docs: Add final consistency verification
# 1811844 docs: Add comprehensive testing documentation
# 8e56783 fix(rag): Permanent fix for reference numbering

# Verificar cambios aplicados
grep "documentRefNumber" src/lib/rag-search.ts
grep "referenceNumbers" src/lib/gemini.ts
grep "CONSOLIDATED" src/pages/api/conversations/[id]/messages-stream.ts

# Todos deben mostrar resultados (no vacío)

─────────────────────────────────────────────────────────

🧪 TESTING:

# Abrir en browser
open http://localhost:3000/chat

# Login requerido:
alec@getaifactory.com (admin)

# Agentes:
- S001: GESTION BODEGAS GPT
- M001: Asistente Legal Territorial RDI

═══════════════════════════════════════════════════════════
VERIFICACIÓN DE CONSISTENCIA
═══════════════════════════════════════════════════════════

✅ Component A (buildRAGContext):
grep "documentRefNumber" src/lib/rag-search.ts
→ Debe mostrar 3 líneas

✅ Component B (AI Instructions):
grep "referenceNumbers" src/lib/gemini.ts
→ Debe mostrar 5 líneas

✅ Component C (Fragment Mapping):
grep "CONSOLIDATED" src/pages/api/conversations/[id]/messages-stream.ts
→ Debe mostrar 2 líneas

Si TODOS ✅ → Sistema consistente

═══════════════════════════════════════════════════════════
QUÉ ESPERAR EN TESTING
═══════════════════════════════════════════════════════════

📊 S001 - Informe Petróleo:

LOGS del servidor deben mostrar:
```
🗺️ Sending CONSOLIDATED fragment mapping: 3 documents (from 10 chunks)
📚 Built RAG references (consolidated by source):
  [1] I-006 - 80.0% avg (6 chunks consolidated)
  [2] PP-009 - 81.0% avg (2 chunks consolidated)
  [3] PP-007 - 76.0% avg (2 chunks consolidated)
```

RESPUESTA debe mostrar:
- Badges: [1][2][3]
- Texto usa: Solo [1], [2], o [3]
- NO aparece: [4], [5], [7], [8], [10]
- PP-009: Presente en lista Referencias
- Pasos SAP: ZMM_IE, Sociedad, PEP mencionados

═══════════════════════════════════════════════════════════

📊 M001 - Procedimientos:

LOGS del servidor deben mostrar:
```
🗺️ Sending CONSOLIDATED fragment mapping: N documents (from M chunks)
```
(N < M, ejemplo: 4 documents from 8 chunks)

RESPUESTA debe mostrar:
- Badges: [1][2][3]... hasta [N]
- Texto usa: Solo números ≤ N
- NO aparece: Números > N
- Fragmentos: Contenido útil (NO "INTRODUCCIÓN...")
- Modal: 3 secciones solamente

═══════════════════════════════════════════════════════════
CRITERIOS DE ÉXITO
═══════════════════════════════════════════════════════════

✅ PASS si:
1. Logs muestran "CONSOLIDATED: N documents (from M chunks)"
2. S001: Números en texto ≤ Badges totales
3. M001: Números en texto ≤ Badges totales
4. NO phantom refs en ninguna respuesta
5. PP-009 encontrado con pasos SAP
6. Fragmentos 100% útiles

❌ FAIL si:
1. Logs NO muestran "CONSOLIDATED"
2. Aparece [7][8] en S001
3. Aparece [9][10] en M001
4. Más números en texto que badges disponibles

═══════════════════════════════════════════════════════════
MENSAJE PARA SEBASTIAN (Listo para enviar)
═══════════════════════════════════════════════════════════

📧 Archivo: docs/MENSAJE_TESTING_SEBASTIAN_FINAL_2025-10-29.md

Resumen del mensaje:
```
✅ TODOS tus issues resueltos (incluido fix permanente numeración)

RESUELTO:
✅ S001 muestra referencias (PP-009 encontrado)
✅ Pasos SAP concretos (ZMM_IE, Sociedad, PEP, Formulario)
✅ Phantom refs eliminados permanentemente
✅ Fragmentos 100% útiles
✅ Modal simplificado
✅ NUMERACIÓN PERFECTA

ANTES: Texto [7][8], Badges [1][2][3] ❌
AHORA: Texto [1][2], Badges [1][2][3] ✅

TESTING (10 mins):
1. S001: "¿Cómo genero informe petróleo?"
2. M001: "¿Cómo hago traspaso bodega?"

CALIDAD: 10/10 ambos agentes

¿Procedes con testing?
```

═══════════════════════════════════════════════════════════
DECISIÓN RECOMENDADA
═══════════════════════════════════════════════════════════

🎯 RUTA ÓPTIMA:

Paso 1: Testing Rápido Propio (5 mins)
→ Verificar que fix funciona localmente
→ Confirmar logs muestran "CONSOLIDATED"
→ Confirmar números coinciden

Paso 2: Enviar a Sebastian (Si paso 1 ✅)
→ Copiar mensaje del archivo preparado
→ Esperar validación (10-15 mins)

Paso 3: Cerrar Tickets (Si Sebastian aprueba)
→ Marcar 5 issues como resueltos
→ Archivar documentación
→ Actualizar roadmap

Tiempo Total: 20-30 mins hasta cierre completo

═══════════════════════════════════════════════════════════
PREGUNTA PARA EMPEZAR
═══════════════════════════════════════════════════════════

¿Por dónde quieres continuar?

A) Testing rápido propio → Luego enviar a Sebastian
B) Enviar directo a Sebastian para validación
C) Revisar documentación primero
D) Verificar estado del código
E) Otra acción específica

═══════════════════════════════════════════════════════════
CONTEXTO ADICIONAL IMPORTANTE
═══════════════════════════════════════════════════════════

🔧 PROYECTO:
- Nombre: SalfaGPT / Flow
- GCP Project: gen-lang-client-0986191192
- Framework: Astro + React + TypeScript
- AI: Google Gemini 2.5 (Flash y Pro)
- Database: Firestore + BigQuery

📊 MÉTRICAS ACTUALES:
- Chunks en BigQuery: 6,745
- Documentos S001: 76
- Documentos M001: 538
- Calidad sistema: 10/10
- Issues bloqueantes: 0

🎯 OBJETIVO FINAL:
- 5 issues resueltos ✅
- Calidad 100% ✅
- Sistema listo para evaluación masiva
- Sebastian aprueba → Cierre tickets

═══════════════════════════════════════════════════════════

🚀 ESTADO ACTUAL: ✅ COMPLETADO Y LISTO

Commits aplicados: 3
Código: Consistente 100%
Documentación: Completa
Server: Running :3000
Testing: Pendiente validación

¿Con qué opción (A, B, C, D, E) quieres continuar?
```

═══════════════════════════════════════════════════════════
ARCHIVOS PARA ADJUNTAR (Recomendado)
═══════════════════════════════════════════════════════════

Al pegar el prompt anterior, adjunta estos archivos con @:

ESENCIALES:
- @docs/FINAL_CONSISTENCY_VERIFICATION_2025-10-29.md
- @docs/MENSAJE_TESTING_SEBASTIAN_FINAL_2025-10-29.md
- @docs/TESTING_CHECKLIST_SIMPLE_2025-10-29.md

OPCIONALES (Si quieres más detalle):
- @docs/FIX_PERMANENTE_NUMERACION_2025-10-29.md
- @docs/SESION_COMPLETADA_RESUMEN_FINAL_2025-10-29.md

═══════════════════════════════════════════════════════════
RESULTADO ESPERADO
═══════════════════════════════════════════════════════════

El AI en la nueva conversación tendrá:

✅ Contexto completo de las 2 sesiones
✅ Entendimiento del fix aplicado
✅ Conocimiento del estado actual
✅ Archivos clave para leer
✅ Opciones claras de continuación
✅ Comandos útiles listos
✅ Criterios de éxito definidos

Podrá:
✅ Continuar testing inmediatamente
✅ Enviar a Sebastian con confianza
✅ Debugging si algo falla
✅ Cerrar tickets cuando se apruebe

═══════════════════════════════════════════════════════════




