# 🎯 Prompt para Continuar Sesión - Issues Sebastian

**Uso:** Copiar este texto en una nueva conversación de Cursor para continuar el trabajo.

---

## 📋 PROMPT COMPLETO

```
Hola, necesito continuar el trabajo de resolución de issues de Sebastian.

CONTEXTO COMPLETO:

1. OBJETIVO:
Resolver issues reportados por Sebastian sobre el sistema RAG (referencias) 
en agentes S001 (Gestión Bodegas) y M001 (Asistente Legal).

2. TRABAJO YA COMPLETADO (NO REPETIR):

PASO 1 ✅ - Sync BigQuery (commit 47bd90c):
- Script: scripts/sync-firestore-to-bigquery.mjs
- Sincronizados: 6,745 chunks de Firestore → BigQuery
- Resultado: S001 ahora tiene referencias (vs 0 antes)
- Issues resueltos: FB-001, FB-005

PASO 2 🟡 - Fix Phantom Refs (commits 8ddc775, 706be9c):
- Post-procesamiento en messages-stream.ts
- Prompt reforzado en gemini.ts
- Captura [N, M] con comas ✅
- Captura [N][M] sin comas ⚠️ (en progreso)
- Issue parcialmente resuelto: FB-002

PASO 3 ✅ - Fragmentos Útiles (pre-existente):
- 1,896 chunks basura eliminados
- 100% fragmentos útiles verificados
- Issue resuelto: FB-003

PASO 4 ✅ - Modal Simplificado (commit 5a1c1ad):
- ReferencePanel.tsx: 254→73 líneas (-71%)
- Solo 3 secciones: Similitud + Texto + Referencia
- Issue resuelto: FB-004

3. ESTADO ACTUAL:

Issues Resueltos: 4 de 5 (80%)
- ✅ FB-001: S001 muestra referencias
- 🟡 FB-002: Phantom refs (mejorado, [N][M] pendiente)
- ✅ FB-003: Fragmentos útiles
- ✅ FB-004: Modal simplificado
- ✅ FB-005: Pasos SAP concretos

Calidad:
- S001: 8/10 (numeración confusa -2)
- M001: 10/10
- Promedio: 9/10 (vs target 5/10)

4. ISSUE MENOR DETECTADO POR USUARIO:

Problema:
- AI usa [7][8] en texto
- Badges reales son [1][2][3]
- Usuario confundido: "¿Por qué [7][8] si refs son [1][2]?"

Causa Raíz:
- BigQuery devuelve 10 chunks
- Se consolidan en 3 referencias (por documento único)
- AI recibe fragmentMapping con [1]-[10]
- AI usa números originales [7][8]
- Referencias finales son [1][2][3]
- Post-procesamiento NO remueve [N][M] correctamente

Fix Aplicado:
- Regex mejorado para capturar [N][M] (commit 8ddc775)
- Logging detallado (commit 706be9c)
- Prompt reforzado contra formato [N, M]
- Testing pendiente

5. ARCHIVOS CLAVE:

Documentación:
- docs/SESION_COMPLETADA_RESUMEN_FINAL_2025-10-29.md ⭐ Estado actual
- docs/ISSUE_DETECTADO_PHANTOM_REFS_COMMAS_2025-10-29.md ⭐ Issue pendiente
- docs/GUIA_TESTING_PARA_SEBASTIAN_2025-10-29.md ⭐ Testing para usuario

Código Modificado:
- scripts/sync-firestore-to-bigquery.mjs (nuevo)
- src/pages/api/conversations/[id]/messages-stream.ts (post-process)
- src/lib/gemini.ts (prompts)
- src/components/ReferencePanel.tsx (modal simplificado)

6. PRÓXIMA TAREA (ELEGIR UNA):

OPCIÓN A - Validar con Sebastian (RECOMENDADO):
- Enviar mensaje de testing
- Esperar su validación
- Cerrar tickets si aprueba
- Issue numeración como mejora futura
Tiempo: 5 mins prep, esperar validación

OPCIÓN B - Resolver numeración 100%:
- Testing con logging detallado
- Identificar por qué [7][8] no se remueve
- Aplicar fix apropiado
- Re-validación completa
Tiempo: 1-2 horas

OPCIÓN C - Renumerar en frontend (MEJOR):
- Modificar frontend para enviar solo refs finales [1]-[3]
- AI nunca conoce [7][8], solo [1][2][3]
- Solución permanente y limpia
Tiempo: 30 mins

7. CONTEXTO TÉCNICO:

Usuario: 114671162830729001607
Agentes:
- S001: AjtQZEIMQvFnPRJRjl4y (76 docs, 1,773 chunks)
- M001: cjn3bC0HrUYtHqu69CKS (538 docs, ~5,000 chunks)

BigQuery:
- Dataset: salfagpt.flow_analytics
- Tabla: document_embeddings
- Chunks synced: 6,745

Preguntas de testing:
- S001: "¿Cómo genero el informe de consumo de petróleo?"
- M001: "¿Qué es un OGUC?" (sin info)
- M001: "¿Cómo hago un traspaso de bodega?" (con info)

8. DECISIÓN RECOMENDADA:

OPCIÓN A o C (no B)
- A: Validar ahora con workaround (rápido)
- C: Fix permanente renumerando (30 mins)
- B: Debugging extenso (no vale la pena para issue menor)

9. PREGUNTA PARA CONTINUAR:

¿Qué opción prefieres?
A) Enviar a Sebastian para validación (con workaround)
B) Resolver 100% numeración con debugging
C) Implementar renumeración en frontend (solución permanente)

---

ARCHIVOS A LEER PRIMERO:
1. docs/SESION_COMPLETADA_RESUMEN_FINAL_2025-10-29.md
2. docs/ISSUE_DETECTADO_PHANTOM_REFS_COMMAS_2025-10-29.md
3. docs/GUIA_TESTING_PARA_SEBASTIAN_2025-10-29.md

COMMITS IMPORTANTES:
- 47bd90c: Sync BigQuery + fix inicial
- 5a1c1ad: Modal simplificado
- 8ddc775: Regex mejorado
- ec71b41: Resumen final

SERVIDOR: 
Ejecutar: cd /Users/alec/salfagpt && npm run dev
Puerto: 3000
Estado: Código con fixes aplicados, servidor reiniciar para probar

¿Por dónde empezamos?
```

---

## 📝 Notas para Usar el Prompt

**Contexto proporcionado:**
- ✅ Objetivo claro
- ✅ Trabajo ya completado (para no repetir)
- ✅ Estado actual de issues
- ✅ Issue detectado con causa raíz
- ✅ Archivos clave para leer
- ✅ 3 opciones claras de continuación
- ✅ Decisión recomendada
- ✅ Pregunta específica para empezar

**Archivos adjuntos recomendados:**
Al pegar el prompt, puedes adjuntar con @ :
- @docs/SESION_COMPLETADA_RESUMEN_FINAL_2025-10-29.md
- @docs/ISSUE_DETECTADO_PHANTOM_REFS_COMMAS_2025-10-29.md

**Resultado esperado:**
El AI tendrá contexto completo para:
- Entender qué se hizo
- No repetir trabajo
- Continuar con opción A, B, o C
- Resolver el issue de numeración o proceder a validación







