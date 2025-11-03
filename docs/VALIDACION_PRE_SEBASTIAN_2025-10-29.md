# ✅ Validación Pre-Sebastian - Fix Numeración

**Fecha:** 2025-10-29  
**Commit:** 8e56783  
**Server:** ✅ Running on :3000  
**Status:** ✅ Ready for testing

---

## 🧪 Quick Validation Steps (5-10 mins)

### **1. Acceso al Sistema**

```bash
# Server está corriendo
http://localhost:3000/chat

# Requiere login:
- Usar cuenta admin (alec@getaifactory.com)
- O cuenta de testing que tenga acceso a S001 y M001
```

---

### **2. Test A - S001 (Gestión Bodegas)**

**Setup:**
1. Login en http://localhost:3000/chat
2. Expandir "Agentes"
3. Seleccionar "GESTION BODEGAS GPT (S001)"
4. Click "Nuevo Chat"

**Pregunta:**
```
¿Cómo genero el informe de consumo de petróleo?
```

**Verificar en LOGS del servidor (terminal donde corre npm run dev):**

```bash
# Buscar estas líneas:
🗺️ Sending CONSOLIDATED fragment mapping: X documents (from Y chunks)

# Ejemplo esperado:
🗺️ Sending CONSOLIDATED fragment mapping: 3 documents (from 10 chunks)
```

**Significado:**
- X documents = Referencias consolidadas (ej: 3)
- Y chunks = Chunks originales de BigQuery (ej: 10)
- ✅ Si X < Y = Consolidación funciona

**Buscar también:**
```bash
📚 Built RAG references (consolidated by source):
  [1] Doc A - 80.0% avg (6 chunks consolidated)
  [2] Doc B - 81.0% avg (2 chunks consolidated)
  [3] Doc C - 76.0% avg (2 chunks consolidated)
```

**Significado:**
- Cada [N] es UN documento
- "chunks consolidated" muestra cuántos chunks se unieron
- ✅ Si sumas chunks = total original (6+2+2=10)

---

**Verificar en RESPUESTA del AI:**

**Esperar ver:**
```
"...transacción ZMM_IE[2]. El proceso requiere[1][2]..."

Referencias:
[1] I-006 - Gestión Combustible (80%)
[2] PP-009 - Imprimir Resumen Petróleo (81%)
[3] PP-007 - Reporte (76%)
```

**Contar:**
- Badges visibles: 3 ([1][2][3])
- Números en texto: Solo [1], [2] (máximo [3])
- ✅ PASS: Todos los números en texto ≤ 3

**NO debe aparecer:**
- ❌ [4], [5], [6], [7], [8], [9], [10]
- ❌ "consulta [7]" o similar
- ❌ Números mayores que cantidad de badges

---

### **3. Test B - M001 (Asistente Legal)**

**Setup:**
1. En la misma sesión, expandir "Agentes"
2. Seleccionar "Asistente Legal Territorial RDI (M001)"
3. Click "Nuevo Chat"

**Pregunta:**
```
¿Cómo hago un traspaso de bodega?
```

**Verificar en LOGS:**

```bash
# Esperado:
🗺️ Sending CONSOLIDATED fragment mapping: 4 documents (from 8 chunks)

📚 Built RAG references (consolidated by source):
  [1] Traspaso.pdf - 82.0% avg (3 chunks consolidated)
  [2] Inventario.pdf - 78.0% avg (2 chunks consolidated)
  [3] Compras.pdf - 76.0% avg (2 chunks consolidated)
  [4] Coordinación.pdf - 75.0% avg (1 chunk)
```

**Significado:**
- 4 documentos únicos
- 8 chunks totales (3+2+2+1=8)
- Referencias finales: [1][2][3][4]

---

**Verificar en RESPUESTA:**

**Esperar ver:**
```
"Para realizar un traspaso de bodega[1], debes seguir el procedimiento
establecido[2][3]. El proceso incluye coordinación con transportes[4]..."

Referencias:
[1] Traspaso de Bodega Rev.02.pdf (82%)
[2] Auditoría Inventario.pdf (78%)
[3] Gestión Compras.pdf (76%)
[4] Coordinación Transportes.pdf (75%)
```

**Contar:**
- Badges visibles: 4 ([1][2][3][4])
- Números en texto: Solo [1], [2], [3], [4]
- ✅ PASS: Todos los números ≤ 4

**NO debe aparecer:**
- ❌ [5], [6], [7], [8], [9], [10]
- ❌ Números mayores que 4

---

## ✅ Criterios de PASS/FAIL

### **PASS (Todo funcionando):**
```
✅ S001: Números en texto ≤ Total badges
✅ M001: Números en texto ≤ Total badges
✅ Logs muestran "CONSOLIDATED: N documents (from M chunks)"
✅ NO phantom refs en ninguna respuesta
✅ PP-009 encontrado en S001
✅ Fragmentos útiles en M001
```

### **FAIL (Algo no funciona):**
```
❌ S001: Aparece [7][8] u otros números altos
❌ M001: Aparece [9][10] u otros phantom refs
❌ Logs NO muestran "CONSOLIDATED"
❌ Badges no coinciden con números en texto
```

---

## 🔍 Debugging si Falla

### **Si ves phantom refs todavía:**

**1. Check logs del servidor:**
```bash
# Buscar:
🗺️ Sending CONSOLIDATED fragment mapping: X documents

# Si NO aparece "CONSOLIDATED":
# → Fix no se aplicó, verificar que cambios están en código
```

**2. Check contexto enviado al AI:**
```bash
# Buscar en logs:
🔍 MODO RAG ACTIVADO - REFERENCIAS CONSOLIDADAS
Referencias válidas: [1], [2], [3]

# Si dice "Fragmentos recibidos: 10":
# → Código viejo (pre-fix), verificar git status
```

**3. Check si código está actualizado:**
```bash
cd /Users/alec/salfagpt
git log --oneline -1

# Debe mostrar:
8e56783 fix(rag): Permanent fix for reference numbering...
```

---

## 📊 Logs Esperados (Ejemplo Completo)

### **Para S001:**

```
🔍 [Streaming] Attempting RAG search...
  🚀 Using agent-based BigQuery search (OPTIMAL)...
  ✅ Agent search: 10 chunks found

📊 Chunks grouped by source: 3 unique documents from 10 chunks

🗺️ Sending CONSOLIDATED fragment mapping: 3 documents (from 10 chunks)

📚 Built RAG references (consolidated by source):
  [1] MAQ-LOG-CBO-I-006... - 80.0% avg (6 chunks consolidated) - 3245 tokens
  [2] MAQ-LOG-CBO-PP-009... - 81.0% avg (2 chunks consolidated) - 1234 tokens
  [3] MAQ-LOG-CBO-PP-007... - 76.0% avg (2 chunks consolidated) - 890 tokens
```

**Interpretación:**
- ✅ "CONSOLIDATED" aparece → Fix aplicado
- ✅ "3 documents (from 10 chunks)" → Consolidación funciona
- ✅ Refs [1][2][3] → Números correctos

---

### **Para M001:**

```
🗺️ Sending CONSOLIDATED fragment mapping: 4 documents (from 8 chunks)

📚 Built RAG references (consolidated by source):
  [1] Traspaso de Bodega... - 82.0% avg (3 chunks consolidated)
  [2] Auditoría Inventario... - 78.0% avg (2 chunks consolidated)
  [3] Gestión Compras... - 76.0% avg (2 chunks consolidated)
  [4] Coordinación Transportes... - 75.0% avg (1 chunk)
```

**Interpretación:**
- ✅ 4 documentos consolidados
- ✅ 8 chunks totales (3+2+2+1)
- ✅ Referencias [1][2][3][4]

---

## 🎯 Qué Buscar en Respuestas

### **S001 - Informe Petróleo:**

**✅ CORRECTO:**
```
"Para generar el informe de consumo de petróleo, accede a la 
transacción ZMM_IE en SAP[2]. El proceso requiere datos de 
Sociedad y PEP[1][2]. Es responsabilidad de JBOD[1]."

Referencias:
[1] I-006 (80%)
[2] PP-009 (81%)
[3] PP-007 (76%)
```

**Validación:**
- Texto usa: [1], [2] (solo estos)
- Badges: [1][2][3]
- ✅ Todos los números en texto están en badges

---

**❌ INCORRECTO (Si el fix NO funcionó):**
```
"...transacción ZMM_IE[7][8]..."

Referencias:
[1] I-006 (80%)
[2] PP-009 (81%)
```

**Problema:**
- Texto usa: [7][8]
- Badges: [1][2]
- ❌ [7] y [8] NO están en badges

---

### **M001 - Traspaso Bodega:**

**✅ CORRECTO:**
```
"El traspaso de bodega[1] requiere coordinación[4] y 
seguimiento de inventario[2][3]."

Referencias:
[1] Traspaso.pdf (82%)
[2] Inventario.pdf (78%)
[3] Compras.pdf (76%)
[4] Coordinación.pdf (75%)
```

**Validación:**
- Texto usa: [1], [2], [3], [4]
- Badges: [1][2][3][4]
- ✅ Perfecto

---

**❌ INCORRECTO:**
```
"...según procedimiento[9]..."

Referencias:
[1] Traspaso.pdf
[2] Inventario.pdf
```

**Problema:**
- Texto usa: [9]
- Badges: [1][2]
- ❌ [9] NO existe

---

## 📋 Checklist de Validación

### **Antes de Reportar a Sebastian:**

**Código:**
- [x] Commit aplicado (8e56783)
- [x] Server running (:3000)
- [x] No new type errors

**Testing Propio:**
- [ ] S001: Pregunta probada
- [ ] S001: Logs muestran "CONSOLIDATED"
- [ ] S001: Números en texto ≤ Badges
- [ ] M001: Pregunta probada
- [ ] M001: Logs muestran "CONSOLIDATED"
- [ ] M001: Números en texto ≤ Badges

**Si TODO ✅:**
- [ ] Enviar mensaje a Sebastian
- [ ] Compartir guía de testing
- [ ] Esperar validación (10-15 mins)

**Si algo ❌:**
- [ ] Revisar logs
- [ ] Identificar qué falló
- [ ] Aplicar fix
- [ ] Re-validar

---

## 🚨 Red Flags

**Si ves esto en logs:**
```
❌ "Fragmentos recibidos: 10" (debe decir "Referencias: 3")
❌ "fragmentNumbers" en lugar de "referenceNumbers"
❌ NO aparece "CONSOLIDATED"
```

**Significa:**
- Código viejo aún ejecutándose
- Posible: Cache de Node.js
- Solución: Reiniciar servidor

---

## 🔄 Reiniciar Server si Necesario

```bash
# 1. Matar proceso actual
pkill -f "npm run dev"

# 2. Esperar 2 segundos
sleep 2

# 3. Reiniciar
cd /Users/alec/salfagpt
npm run dev

# 4. Esperar 10 segundos para que inicie
sleep 10

# 5. Re-probar
```

---

## ✅ Success Indicators

**En Logs:**
```
✅ "CONSOLIDATED fragment mapping"
✅ "X documents (from Y chunks)" donde X < Y
✅ "Built RAG references (consolidated by source)"
✅ "(N chunks consolidated)" para cada referencia
```

**En Respuestas:**
```
✅ Números en texto: [1], [2], [3] solamente
✅ Badges: [1][2][3]
✅ NO números > total de badges
✅ PP-009 encontrado (S001)
✅ Fragmentos útiles (M001)
```

---

## 🎯 Conclusión

**Si validación propia pasa:**
→ Enviar a Sebastian con confianza
→ Esperado: 100% aprobación

**Si validación propia falla:**
→ Debug inmediato
→ No enviar hasta que funcione localmente

---

**Siguiente acción:** Testing manual con las 2 preguntas en el browser.

**Tiempo estimado:** 5-10 mins

**Criterio:** Si logs muestran "CONSOLIDATED" y números coinciden → ✅ LISTO para Sebastian







