# 🧪 Guía de Testing para Sebastian - Validación Issues Resueltos

**Fecha:** 2025-10-29  
**Tiempo Estimado:** 15-20 minutos  
**URL:** http://localhost:3000/chat

---

## 🎯 Objetivo

Validar que TODOS los issues que reportaste están resueltos:
1. S001 sin referencias
2. M001 referencias phantom [7][9][10]
3. M001 fragmentos basura
4. M001 modal no abre
5. S001 solo menciona PP-009

---

## ✅ PRUEBA 1: S001 - Referencias y PP-009 (5 mins)

### **Setup:**
1. Ir a http://localhost:3000/chat
2. Expandir **"Agentes"** (click en el botón)
3. Seleccionar **"GESTION BODEGAS GPT (S001)"**
4. Click en **"Nuevo Chat"** (para empezar limpio)

### **Pregunta a Probar:**
```
¿Cómo genero el informe de consumo de petróleo?
```

### **Qué Verificar:**

#### ✅ **Referencias Aparecen:**
- [ ] Ves badges clickeables tipo **[1]** **[2]** en el texto
- [ ] Al final hay sección **"Referencias"** con lista
- [ ] Al final hay botón **"📚 Referencias utilizadas: N"**
- [ ] **Esperado:** 2-3 referencias inline + sección completa

#### ✅ **PP-009 Encontrado:**
- [ ] En la sección "Referencias" aparece **"PP-009 Como Imprimir Resumen..."**
- [ ] Tiene % de similitud (ej: 80.7%, 81%)
- [ ] **Esperado:** PP-009 está presente como ref [2] o [3]

#### ✅ **Pasos Concretos (NO solo mencionar):**
- [ ] Respuesta menciona **transacción SAP específica** (ZMM_IE)
- [ ] Respuesta menciona **campos específicos** (Sociedad, mes.año, PEP)
- [ ] Respuesta da **pasos numerados** (1, 2, 3)
- [ ] Respuesta menciona **"Formulario"** para imprimir PDF
- [ ] **Esperado:** Pasos accionables, no solo "consulta PP-009"

#### ✅ **NUMERACIÓN PERFECTA (FIX PERMANENTE):**
- [ ] Cuenta badges visibles: ¿cuántos? (ej: 3 badges)
- [ ] Busca TODOS los números [N] en el texto
- [ ] Verifica: ¿Todos los [N] son ≤ total de badges?
- [ ] **CRÍTICO:** Si hay 3 badges, NO debe aparecer [4], [5], [7], [8], [10]
- [ ] **Esperado:** Números en texto = {1, 2, 3}, Badges = [1][2][3] ✅
- [ ] **ANTES tenías:** Texto [7][8], Badges [1][2][3] ❌
- [ ] **AHORA debes ver:** Texto [1][2], Badges [1][2][3] ✅

### **Criterio PASS:**
```
✅ Referencias: ≥2 badges visibles
✅ PP-009: Presente en lista de referencias
✅ Pasos: Concretos (transacción + campos + pasos)
✅ Phantom refs: 0 (menciones = badges)
```

### **Si FALLA:**
- Toma screenshot
- Copia texto completo de respuesta
- Reporta qué específicamente no funciona

---

## ✅ PRUEBA 2: M001 - Phantom Refs Eliminadas (5 mins)

### **Setup:**
1. En la misma página, expandir **"Agentes"**
2. Seleccionar **"Asistente Legal Territorial RDI (M001)"**
3. Click en **"Nuevo Chat"**

### **Pregunta a Probar:**
```
¿Qué normativa regula las construcciones en Chile?
```
(O cualquier pregunta sobre leyes/normativas)

### **Qué Verificar:**

#### ✅ **Sin Phantom Refs:**
- [ ] Cuenta cuántos badges **[N]** aparecen (ej: [1][2][3][4][5])
- [ ] Busca en el texto TODA mención de **[N]** con números
- [ ] Confirma: ¿Solo aparecen números con badges? (sin [9][10] extras)
- [ ] **Esperado:** Si hay 5 badges, solo [1]-[5]. NO [6][7]...[10]

#### ✅ **Referencias Coherentes:**
- [ ] Click en sección **"📚 Referencias utilizadas: N"**
- [ ] Verifica: ¿La cantidad de referencias coincide con badges?
- [ ] **Esperado:** N referencias listadas = N badges visibles

### **Criterio PASS:**
```
✅ Phantom refs: 0
✅ Badges = Menciones en texto
✅ Lista referencias coherente
```

### **Si FALLA:**
- Screenshot de respuesta completa
- Marca con círculos rojos los números phantom
- Reporta: "Veo [N] sin badge correspondiente"

---

## ✅ PRUEBA 3: M001 - Fragmentos NO Basura (5 mins)

### **En la misma conversación M001:**

### **Pregunta a Probar:**
```
¿Cómo hago un traspaso de bodega?
```
(O cualquier pregunta sobre procedimientos internos Salfa)

### **Qué Verificar:**

#### ✅ **Expandir Referencias:**
- [ ] Click en **"📚 Referencias utilizadas: N"** para expandir
- [ ] Ves lista de documentos con nombres completos
- [ ] Cuenta total de referencias (ej: 6)

#### ✅ **Click en CADA Badge:**

**Para badges [1], [2], [3]... (todos los que veas):**

1. Click en badge **[1]**
2. Modal se abre mostrando detalles
3. **Verificar contenido NO ES:**
   - ❌ "1. INTRODUCCIÓN ............."
   - ❌ "Página 2 de 3"
   - ❌ Solo puntos y espacios
   - ❌ Headers sin contenido

4. **Verificar contenido SÍ ES:**
   - ✅ Texto real de procedimiento
   - ✅ Nombres de documentos significativos
   - ✅ Pasos, instrucciones, o información sustantiva
   
5. Presiona **ESC** para cerrar modal
6. Repite para badge **[2]**, **[3]**, etc.

#### ✅ **Contar Útiles:**
- Total badges: ___
- Útiles (contenido real): ___
- Basura (INTRODUCCIÓN/Página): ___
- **Esperado:** ≥80% útiles (ej: 5 de 6 = 83%)

### **Criterio PASS:**
```
✅ Fragmentos útiles: ≥80%
✅ Sin "INTRODUCCIÓN..."
✅ Sin "Página X de Y"
✅ Contenido sustantivo presente
```

### **Si FALLA:**
- Screenshot del fragmento basura
- Reporta: "[N] es basura, dice: [texto]"

---

## ✅ PRUEBA 4: Modal de Documento Original (2 mins)

### **En cualquier conversación con referencias:**

1. Click en un badge **[1]** o **[2]**
2. Modal se abre
3. Busca botón **"Ver documento completo"**
4. **Verificar:**
   - [ ] Botón existe
   - [ ] Opcional: Click en botón (ver qué pasa)

### **Criterio PASS:**
```
✅ Modal se abre con click en badge
✅ Muestra información del fragmento
✅ Botón "Ver documento completo" presente
```

### **Si FALLA:**
- Reporta qué esperabas ver vs qué ves
- Screenshot del modal

---

## 📋 Checklist de Validación General

### **Antes de Empezar:**
- [ ] Servidor corriendo en http://localhost:3000
- [ ] Logueado como usuario admin o final
- [ ] Navegador actualizado (Ctrl+Shift+R para hard refresh)

### **Durante Testing:**
- [ ] Probar **S001** con pregunta del informe
- [ ] Probar **M001** con pregunta de procedimientos
- [ ] Verificar **referencias** en ambos
- [ ] Click en **badges** para ver modals
- [ ] Expandir **"Referencias utilizadas"**

### **Documentar:**
- [ ] Screenshot de respuestas
- [ ] Notar qué funciona
- [ ] Notar qué no funciona (si aplica)
- [ ] Reportar diferencias vs lo esperado

---

## 🎯 Preguntas Sugeridas para Testing

### **S001 (Gestión Bodegas) - Debe Responder Bien:**
```
1. ¿Cómo genero el informe de consumo de petróleo?  ⭐ PRINCIPAL
2. ¿Cuál es el proceso de control de combustible?
3. ¿Qué documentos necesito para el informe de diésel?
4. ¿Quién es responsable de generar el informe de petróleo?
5. ¿Dónde encuentro la transacción ZMM_IE en SAP?
```

### **M001 (Asistente Legal) - Debe Responder Bien:**
```
1. ¿Cómo hago un traspaso de bodega?
2. ¿Cuál es el proceso de coordinación de transportes?
3. ¿Qué pasos sigo para una solicitud de servicio básico?
4. ¿Cómo se hace una auditoría de inventario?
5. ¿Qué procedimientos tenemos para compras técnicas?
```

### **M001 - Puede NO Tener Respuesta (Correcto):**
```
1. ¿Qué es un OGUC?  ⭐ (normativa nacional, no en docs Salfa)
2. ¿Qué dice el Código Civil sobre contratos?
3. ¿Cuál es la Ley de Urbanismo vigente?

Esperado: "La información no se encuentra disponible" (honesto)
```

---

## 📊 Métricas que Deberías Ver

### **S001:**
- Referencias: 2-3 badges
- PP-009: Presente (80-81% similitud)
- Pasos SAP: Concretos y accionables
- Phantom refs: 0
- Calidad esperada: 8-10/10

### **M001:**
- Referencias: Variable (3-8 dependiendo de pregunta)
- Phantom refs: 0
- Fragmentos útiles: 100% (sin basura)
- Respuesta: Precisa o honesta ("no disponible")
- Calidad esperada: 8-10/10

---

## ❌ Red Flags - Reportar Si Ves Esto

### **S001:**
```
❌ 0 referencias (no badges visibles)
❌ Solo dice "consulta PP-009" sin más detalles
❌ No menciona transacción específica
❌ Menciona [5][6]...[10] pero solo hay 3 badges
```

### **M001:**
```
❌ Menciona [9][10] sin badges correspondientes
❌ Fragmento dice "1. INTRODUCCIÓN ............."
❌ Fragmento dice "Página 2 de 3"
❌ Modal no abre con click en badge
```

---

## 🔄 Comparación Visual Esperada

### **ANTES (lo que reportaste):**

**S001:**
```
Pregunta: ¿Cómo genero el informe de consumo de petróleo?

Respuesta:
"Para generar el informe de consumo de petróleo, consulta el 
documento PP-009."

Referencias: [Ninguna visible]
```

**M001:**
```
Pregunta: [Sobre normativa]

Respuesta:
"La información indica que... [7]. Según el artículo... [9].
El procedimiento establece... [10]."

Referencias: [1][2][3][4][5] (solo 5 badges)
Problema: Menciona [7][9][10] que no existen

Fragmentos:
[1] "1. INTRODUCCIÓN ............."  ← Basura
[2] "1. INTRODUCCIÓN ............."  ← Basura
[3] Contenido útil ✅
[4] "1. INTRODUCCIÓN ............."  ← Basura
[5] "Página 2 de 3"  ← Basura
```

---

### **DESPUÉS (lo que deberías ver ahora):**

**S001:**
```
Pregunta: ¿Cómo genero el informe de consumo de petróleo?

Respuesta:
"Para generar el informe de consumo de petróleo, conocido como 
'Resumen de Consumo de Petróleo Diésel en Obra', la Jefatura de 
Bodega (JBOD) debe seguir los siguientes pasos en el sistema SAP [1, 2]:

1. Acceder a la transacción: Ingrese en SAP a la transacción 
   ZMM_IE - Consumos Diésel Recuperación Impuest [2].

2. Definir parámetros de selección: Anote el número de 'Sociedad' 
   correspondiente y el 'mes.año' del período a reportar, luego 
   ejecute la transacción.

3. Imprimir el informe: Una vez que se muestre el reporte, seleccione 
   el 'PEP', haga clic en el icono del 'ticket' (⧉) y luego en el 
   botón 'Formulario' para imprimirlo en formato PDF.

Este informe es crucial para la declaración y recuperación del 
Impuesto Específico al Petróleo Diésel [1, 2]."

Referencias:
[1] MAQ-LOG-CBO-I-006... (80%)
[2] MAQ-LOG-CBO-PP-009... (81%)  ← PP-009 encontrado ✅

📚 Referencias utilizadas: 3
```

**Verificar:**
- ✅ Badges [1][2] clickeables
- ✅ PP-009 en lista de referencias
- ✅ Transacción ZMM_IE mencionada
- ✅ Pasos concretos (no solo "consulta PP-009")
- ✅ NO aparece [3][4]...[10] (solo 2-3 refs)

---

**M001:**
```
Pregunta: ¿Qué es un OGUC?

Respuesta:
"La información sobre qué es un 'OGUC' no se encuentra disponible 
en los fragmentos proporcionados."

📚 Referencias utilizadas: 6
  [1] Instructivo Capacitación Salfacorp.pdf (76%)
  [2] Traspaso de Bodega Rev.02.pdf (75%)
  [3] Gestión de Compras Técnicas Rev.01.pdf (75%)
  [4] Solicitud Servicio Básico-ZBAS.pdf (75%)
  [5] Coordinación Transportes Rev.06.pdf (75%)
  [6] Auditoría Inventario General Rev.00.pdf (75%)
```

**Click en badge [1]:**
```
Modal abre mostrando:
- Documento: Instructivo Capacitación Salfacorp.pdf
- Fragmento: #2
- Tokens: 555
- Similitud: 75.7%
- Texto: [Contenido real del instructivo, NO "INTRODUCCIÓN..."]
```

**Verificar:**
- ✅ NO menciona [7][9][10] en texto
- ✅ 6 referencias todas válidas
- ✅ Fragmentos tienen contenido real
- ✅ Modal abre correctamente
- ✅ NO aparece "INTRODUCCIÓN..." ni "Página X de Y"

---

## 📸 Screenshots Sugeridos

Si quieres documentar la validación:

1. **S001 - Respuesta completa** con referencias visibles
2. **S001 - Sección Referencias** expandida mostrando PP-009
3. **M001 - Respuesta** mostrando lista de 6 referencias
4. **M001 - Modal abierto** de un fragmento (para mostrar que no es basura)
5. **Ambos - Sin phantom refs** (highlight que solo aparecen números válidos)

---

## ✅ PRUEBA 2: M001 - Phantom Refs (3 mins)

### **Pregunta:**
```
¿Qué es un OGUC?
```

### **Verificar:**
- [ ] Respuesta dice "no disponible" (correcto, no está en docs Salfa)
- [ ] Muestra N referencias (ej: 6)
- [ ] **NO** menciona [7], [8], [9], [10] u otros números mayores a N
- [ ] **Esperado:** Solo números [1] a [N] donde N = cantidad de badges

**Criterio PASS:** Referencias mencionadas = Referencias con badges

---

## ✅ PRUEBA 3: M001 - Fragmentos Útiles (5 mins)

### **Pregunta:**
```
¿Cómo hago un traspaso de bodega?
```

### **Verificar Cada Fragmento:**
1. Click en **"📚 Referencias utilizadas: N"** (expandir)
2. Click en badge **[1]**
3. Leer contenido en modal
4. ✅ ¿Es útil? o ❌ ¿Es basura ("INTRODUCCIÓN...", "Página X")?
5. Cerrar modal (ESC)
6. Repetir para **[2]**, **[3]**, ... todos los badges

### **Contar:**
- Total badges: ___
- Útiles: ___
- Basura: ___
- % útiles: ___

**Criterio PASS:** ≥80% útiles (ej: 7 de 8 = 88%)

---

## ✅ PRUEBA 4: Modal Funciona (2 mins)

### **Verificar:**
1. Click en cualquier badge **[1]**
2. Modal se abre con información del fragmento
3. Busca botón **"Ver documento completo"**
4. Opcional: Click en ese botón

**Criterio PASS:** Modal abre y muestra información completa

---

## 📊 Hoja de Resultados

### **S001 - Informe Petróleo:**
```
□ Referencias visibles: Sí / No
□ Cantidad de badges: ___ 
□ PP-009 encontrado: Sí / No
□ Pasos SAP concretos: Sí / No
□ Phantom refs: Sí / No
□ Calidad general: ___/10

Issue FB-001 resuelto: Sí / No
Issue FB-005 resuelto: Sí / No
```

### **M001 - Phantom Refs:**
```
□ Phantom refs [9][10]: Sí / No
□ Solo refs válidas: Sí / No
□ Badges = Menciones: Sí / No
□ Calidad general: ___/10

Issue FB-002 resuelto: Sí / No
```

### **M001 - Fragmentos:**
```
□ Total fragmentos: ___
□ Fragmentos útiles: ___
□ Fragmentos basura: ___
□ % útiles: ___%
□ Calidad general: ___/10

Issue FB-003 resuelto: Sí / No
```

### **Modal:**
```
□ Modal abre: Sí / No
□ Muestra información: Sí / No
□ Botón "Ver doc" existe: Sí / No

Issue FB-004 resuelto: Sí / No / Parcial
```

---

## 🎯 Decisión Final

### **Si TODO Pasa (≥4 de 5 issues):**
```
✅ APROBADO - Issues resueltos
→ Cerrar tickets en roadmap
→ Notificar equipo
→ Opcional: Evaluación masiva 87 preguntas
```

### **Si Algo Falla:**
```
❌ Reportar específico:
- Qué issue: (FB-001, FB-002, etc.)
- Qué pregunta: (copiar texto)
- Qué esperabas: (comportamiento)
- Qué viste: (screenshot + descripción)

→ Crear ticket nuevo
→ Priorizar fix
```

---

## 💡 Tips para Testing Efectivo

### **Do's:**
- ✅ Usa las preguntas sugeridas (probadas)
- ✅ Toma screenshots de cada prueba
- ✅ Prueba en nuevo chat (para evitar historial)
- ✅ Espera a que respuesta complete antes de evaluar
- ✅ Click en TODOS los badges (no solo algunos)

### **Don'ts:**
- ❌ No uses preguntas muy diferentes (puede dar otros resultados)
- ❌ No evalúes respuestas incompletas (espera "📚 Referencias...")
- ❌ No asumas que un badge funciona si solo probaste uno
- ❌ No reportes "no funciona" sin especificar qué exactamente

---

## 📞 Reporte de Resultados

### **Template para Responder:**

```
Testing Completado:

S001 - Informe Petróleo:
✅ Referencias: [cantidad] badges visibles
✅ PP-009: Encontrado / No encontrado
✅ Pasos SAP: Concretos / Solo menciona
✅ Phantom refs: 0 / [números]
Calidad: [N]/10

M001 - Normativa/Procedimientos:
✅ Phantom refs: 0 / [números]
✅ Fragmentos útiles: [%]
✅ Modal: Funciona / No funciona
Calidad: [N]/10

Issues Resueltos:
[Lista de FB-001, FB-002, etc. que confirmas resueltos]

Issues Pendientes:
[Si hay algo que no funciona, especificar]

¿Proceder a cerrar tickets? Sí / No
```

---

## 🚀 Tiempo Estimado por Prueba

```
PRUEBA 1 (S001 referencias): 5 mins
PRUEBA 2 (M001 phantom refs): 3 mins
PRUEBA 3 (M001 fragmentos): 5 mins
PRUEBA 4 (Modal): 2 mins

TOTAL: 15 minutos

Opcional (screenshots + reporte): +5 mins
TOTAL CON DOCS: 20 minutos
```

---

## ✅ Criterio de Éxito Global

**Para declarar "TODO RESUELTO":**

```
S001:
✅ Referencias ≥2
✅ PP-009 encontrado
✅ Pasos concretos SAP
✅ Phantom refs = 0

M001:
✅ Phantom refs = 0
✅ Fragmentos útiles ≥80%
✅ Modal funciona

General:
✅ 4 de 5 issues confirmados
✅ Calidad promedio ≥8/10
✅ 0 bloqueantes
```

**Si cumples esto:** Issues de Sebastian RESUELTOS ✅

---

**Listo para tu testing Sebastian. Cualquier duda, pregúntanos.** 🎯


