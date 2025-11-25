# 🧪 TEST MANUAL - 4 Casos de Evaluación

**Fecha:** 24 Noviembre 2025  
**Configuración Aplicada:**
- ✅ Threshold: 0.6 (bajado desde 0.7)
- ✅ Font size: 14px (reducido desde 16px)
- ✅ Referencias: Siempre se muestran
- ✅ us-east4: Configurado

---

## 📋 **INSTRUCCIONES DE TESTING:**

### **Preparación:**
1. Abrir: http://localhost:3000/chat
2. DevTools abierto (F12) → Network tab
3. Clear console

### **Por Cada Caso:**
1. Seleccionar agente indicado
2. Copiar pregunta exacta
3. Enviar
4. **Medir:**
   - Tiempo total (Network tab)
   - # Referencias mostradas
   - Similarity de referencias
5. **Verificar:**
   - ¿Respuesta basada en docs correctos?
   - ¿Referencias clickeables?
   - ¿Sin pantalla blanca / crash?

---

## 🧪 **CASO 1: Filtros Grúa Sany CR900C**

### **Setup:**
- Agente: **S2-v2 (Gestion Bodegas)**
- ID: `1lgr33ywq5qed67sqCYi`

### **Pregunta:**
```
Indicame que filtros debo utilizar para una mantencion de 2000 Hrs para una grua Sany CR900C
```

### **Evaluación Original:**
- Rating: ❌ Inaceptable (1/5)
- Problema: "Probablemente no esté cargada las hojas de ruta"
- UI: "Se puso blanca la pantalla"

### **Resultados Esperados con Fix:**
- ⏱️ Tiempo: <10s
- 📚 Referencias: 0-2 (si hojas de ruta no están cargadas aún)
- ✅ Similarity: Si encuentra algo, debería mostrar (incluso <60%)
- ✅ Sin crash: No pantalla blanca

### **Registrar:**

**Tiempo total:** _______ segundos

**# Referencias:** _______

**Top similarity:** _______%

**Documentos mostrados:**
1. _______________________________
2. _______________________________
3. _______________________________

**Calidad respuesta (tu evaluación):**
- [ ] Inaceptable (no responde, docs incorrectos)
- [ ] Aceptable (responde algo pero incompleto)
- [ ] Sobresaliente (respuesta completa y correcta)

**Issues encontrados:**
- [ ] Pantalla blanca / crash
- [ ] Timeout (>30s)
- [ ] No muestra referencias
- [ ] Otro: _______________________

---

## 🧪 **CASO 2: Forros de Frenos TCBY-56**

### **Setup:**
- Agente: **S2-v2 (Gestion Bodegas)**

### **Pregunta:**
```
Camion tolva 10163090 TCBY-56 indica en el panel forros de frenos desgastados
```

### **Evaluación Original:**
- Rating: ✅ Sobresaliente (5/5) 
- Nota: "No tenía la información pero asoció la falla a otro tipo de camión y respondió"
- Problema: "Falta cargar manual de servicio"
- UI: "Se puso blanca la pantalla nuevamente"

### **Resultados Esperados:**
- ⏱️ Tiempo: <10s
- 📚 Referencias: 1-3 (manual International 7600 usado como referencia)
- ✅ Similarity: 50-70% (referencia indirecta)
- ✅ Sin crash

### **Registrar:**

**Tiempo total:** _______ segundos

**# Referencias:** _______

**Top similarity:** _______%

**Documentos mostrados:**
1. _______________________________
2. _______________________________

**Calidad respuesta:**
- [ ] Inaceptable
- [ ] Aceptable
- [ ] Sobresaliente

**¿Asoció correctamente a otro manual?** [ ] Sí [ ] No

**Issues:**
- [ ] Pantalla blanca
- [ ] Timeout
- [ ] Otro: _______________________

---

## 🧪 **CASO 3: Torque Ruedas TCBY-56**

### **Setup:**
- Agente: **S2-v2 (Gestion Bodegas)**

### **Pregunta:**
```
Cuanto torque se le debe suministrar a las ruedas del camion tolva 10163090 TCBY-56 y cual es el procedimiento correcto
```

### **Evaluación Original:**
- Rating: ⚠️ Aceptable (2/5)
- Problema: "Me da el valor del neumático de otro camión, creo que no analiza si hay diferencias en los equipos"
- Problema: "Falta cargar manual de servicio"
- UI: "Nuevamente debo actualizar la página"

### **Resultados Esperados:**
- ⏱️ Tiempo: <10s
- 📚 Referencias: 1-2 (manual International 7600)
- ✅ Similarity: 60-70%
- ✅ Sin crash

### **Registrar:**

**Tiempo total:** _______ segundos

**# Referencias:** _______

**Top similarity:** _______%

**Documentos mostrados:**
1. _______________________________
2. _______________________________

**Valor de torque mostrado:** _______ lb/pie

**Calidad respuesta:**
- [ ] Inaceptable
- [ ] Aceptable
- [ ] Sobresaliente

**Issues:**
- [ ] Pantalla blanca
- [ ] Timeout
- [ ] Otro: _______________________

---

## 🧪 **CASO 4: Cambio Aceite Scania P450**

### **Setup:**
- Agente: **M3-v2 (Mantenimiento Maqsa)**
- ID: `vStojK73ZKbjNsEnqANJ`

### **Pregunta:**
```
Cada cuantas horas se debe cambiar el aceite hidraulico en un camion pluma SCANIA P450 B 6x4
```

### **Evaluación Original:**
- Rating: ❌ Inaceptable (1/5)
- Problema: "La respuesta debería ser lo que indica el fabricante"
- Nota: IA dice que no encuentra info específica

### **Resultados Esperados:**
- ⏱️ Tiempo: <10s
- 📚 Referencias: 1-3 (manual HIAB o Scania si cargado)
- ✅ Similarity: 60-70%
- ✅ Debería encontrar intervalo de mantenimiento

### **Registrar:**

**Tiempo total:** _______ segundos

**# Referencias:** _______

**Top similarity:** _______%

**Documentos mostrados:**
1. _______________________________
2. _______________________________
3. _______________________________

**Intervalo mostrado:** _______ horas (si encuentra)

**Calidad respuesta:**
- [ ] Inaceptable (no encuentra intervalo)
- [ ] Aceptable (da información general)
- [ ] Sobresaliente (da intervalo exacto)

**Issues:**
- [ ] Pantalla blanca
- [ ] Timeout
- [ ] Otro: _______________________

---

## 📊 **RESUMEN FINAL:**

### **Performance:**

**Caso 1:** _____ s
**Caso 2:** _____ s
**Caso 3:** _____ s
**Caso 4:** _____ s

**Promedio:** _____ s

**Objetivo:** <10s aceptable, <8s excelente, <6s perfecto

---

### **Calidad:**

**Casos Sobresalientes:** ___/4
**Casos Aceptables:** ___/4
**Casos Inaceptables:** ___/4

---

### **Estabilidad:**

**Pantallas blancas:** ___/4
**Timeouts:** ___/4
**Referencias faltantes:** ___/4

---

### **Mejora vs Original:**

| Caso | Original Rating | Nuevo Rating | Mejora |
|------|-----------------|--------------|--------|
| 1 | Inaceptable (1/5) | __________ | ______ |
| 2 | Sobresaliente (5/5) | __________ | ______ |
| 3 | Aceptable (2/5) | __________ | ______ |
| 4 | Inaceptable (1/5) | __________ | ______ |

---

## 🎯 **PRÓXIMOS PASOS BASADOS EN RESULTADOS:**

### **Si 3-4 casos exitosos:**
```
✅ Quick wins funcionaron
→ Deploy a producción
→ Monitor feedback real
```

### **Si 1-2 casos exitosos:**
```
⚠️  Parcial
→ Identificar qué docs faltan
→ Cargar docs específicos
→ Re-test
```

### **Si 0 casos exitosos:**
```
❌ Problema mayor
→ Verificar us-east4 funcionando
→ Check agent activeContextSourceIds
→ Diagnóstico profundo
```

---

**READY TO TEST - Por favor ejecuta los 4 casos y completa este documento** 📝

