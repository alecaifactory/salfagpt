# 🧪 Instrucciones de Testing Manual - Post Re-indexing

**Estado:** Re-indexing 100% completo (614 docs, 1,896 chunks basura eliminados)  
**Ahora:** Testing manual requerido (API requiere sesión autenticada)

---

## ✅ TESTING VALIDACIÓN (2 Preguntas Clave)

### **Test 1: M001 - Validar FB-002 y FB-003**

**Pasos:**
1. Abrir: `http://localhost:3000/chat`
2. Login con tu cuenta
3. Click en **"Asistente Legal Territorial RDI (M001)"**
4. Preguntar: **"¿Qué es un OGUC?"**
5. Esperar respuesta

**Verificar:**

✅ **FB-002 (Anti-Alucinación):**
```
Contar badges amarillos al final: ¿Cuántos hay? (ej: 5)
Leer la respuesta: ¿Usa SOLO [1][2][3][4][5]?
¿Aparece [6], [7], [8] u otro número fuera del rango?

✅ PASS: Solo usa refs válidas
❌ FAIL: Inventa [7] o números que no existen
```

✅ **FB-003 (Calidad Fragmentos):**
```
Click en cada badge [1], [2], [3], [4], [5]
Panel derecho muestra el fragmento

Para cada fragmento, verificar:
❌ ¿Es "1. INTRODUCCIÓN ............."? (basura)
❌ ¿Es "Página X de Y"? (basura)
❌ ¿Tiene <50 caracteres? (muy corto)
✅ ¿Contiene texto útil sobre OGUC?

Contar: ¿Cuántos de 5 son útiles?

✅ PASS: 4-5 de 5 son útiles (80-100%)
⚠️ PARCIAL: 3 de 5 son útiles (60%)
❌ FAIL: <3 de 5 son útiles (<60%)
```

**Screenshot:** Toma captura de pantalla de la respuesta con referencias

---

### **Test 2: S001 - Validar FB-001 y FB-005**

**Pasos:**
1. En mismo browser (ya logueado)
2. Click en **"GESTION BODEGAS GPT (S001)"**
3. Preguntar: **"¿Cómo genero el informe de consumo de petróleo?"**
4. Esperar respuesta

**Verificar:**

✅ **FB-001 (Referencias Aparecen):**
```
¿Aparecen badges amarillos al final?
¿Cuántos badges hay?

✅ PASS: Hay al menos 1 badge clickeable
❌ FAIL: No hay badges/referencias
```

✅ **FB-005 (Usa Contenido, No Solo Menciona):**
```
Leer la respuesta:

¿Dice pasos concretos? Ejemplo:
"1. Revisar últimas rebajas de consumo..."
"2. Dejar enviado el último informe..."

O solo dice:
"Debes consultar el instructivo MAQ-LOG-CBO-PP-009"

✅ PASS: Da pasos concretos/información específica
❌ FAIL: Solo menciona que consultes otro documento
```

**Screenshot:** Toma captura de la respuesta

---

## 📊 Formato de Reporte

**Después de testing, reportar así:**

### **M1 - "¿Qué es un OGUC?"**
```
✅/❌ FB-002 (Anti-Alucinación):
   Referencias mostradas: [cantidad]
   Referencias usadas en respuesta: [listar números]
   Números inválidos: [si hay, listar]
   
✅/❌ FB-003 (Calidad Fragmentos):
   Total fragmentos: [cantidad]
   Fragmentos útiles: [cantidad]
   Fragmentos basura: [cantidad]
   Tipos de basura: [ej: "INTRODUCCIÓN...", "Página X de Y"]
   
Screenshot: [adjuntar]
```

### **S001 - "Informe de petróleo"**
```
✅/❌ FB-001 (Referencias Aparecen):
   Referencias mostradas: Sí/No
   Cantidad: [número]
   
✅/❌ FB-005 (Usa Contenido):
   Da pasos concretos: Sí/No
   O solo menciona doc: Sí/No
   Respuesta útil: Sí/No
   
Screenshot: [adjuntar]
```

---

## 🎯 Decisión Basada en Resultados

### **Si AMBOS tests pasan:**
```
✅ Validación exitosa
→ Proceder con Parte B (86 preguntas masivas)
→ Mover tickets FB-002 y FB-003 a "Done"
```

### **Si 1 test pasa, 1 falla:**
```
⚠️ Validación parcial
→ Investigar el que falló
→ Fix adicional si es necesario
→ Re-probar antes de masivo
```

### **Si AMBOS tests fallan:**
```
❌ Validación fallida
→ Investigar causa raíz
→ Verificar re-indexing aplicó correctamente
→ Posible bug en sistema de referencias
```

---

## 📝 Notas Importantes

### **Lo que YA debería funcionar:**
- ✅ Re-indexing completado (614 docs)
- ✅ 1,896 chunks basura eliminados
- ✅ Filtro aplicado correctamente
- ✅ System prompt reforzado (anti-alucinación)

### **Lo que estamos validando:**
- ¿El re-indexing realmente mejoró la calidad?
- ¿Las referencias ahora son útiles (no basura)?
- ¿El AI ya no inventa referencias?
- ¿S001 ahora muestra referencias?

---

**Por favor ejecuta estos 2 tests y reporta resultados con screenshots.** 🧪

Basado en tus resultados, procederé con Parte B (evaluación masiva) o investigación adicional.

