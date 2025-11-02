# 📋 Preguntas de Evaluación M001 - Asistente Legal Territorial RDI

**Total:** 19 preguntas  
**Nivel:** Especialista (técnico-legal)  
**Agente:** M001  
**URL Testing:** http://localhost:3000/chat

---

## 🎯 Instrucciones de Uso

1. Abrir http://localhost:3000/chat
2. Seleccionar agente: **Asistente Legal Territorial RDI (M001)**
3. Para cada pregunta:
   - Copiar pregunta exacta
   - Enviar
   - Esperar respuesta (30-60s)
   - Verificar:
     - ✅ Referencias mostradas
     - ✅ Números en texto ≤ Badges totales
     - ✅ Contenido útil y accionable
   - Calificar calidad 1-10

---

## 📝 Lista de Preguntas

### **Categoría: Conceptos y Diferencias**

#### **Q1** ✅ PROBADA - 9.5/10
```
Me puedes decir la diferencia entre un Loteo DFL2 y un Loteo con Construcción Simultánea?
```

#### **Q2** ⏳ PROCESANDO
```
Cuál es la diferencia entre condominio tipo a y tipo b.
```

---

### **Categoría: Requisitos de Permisos**

#### **Q3** ✅ PROBADA - 9.5/10
```
Qué requisitos se necesitan para aprobar un permiso de edificios, un permiso de urbanización, permiso de subdivisión, permiso de loteo.
```

#### **Q4**
```
Qué documentos se deben presentar para los trámites de loteo, subdivisión, permiso de edificación.
```

---

### **Categoría: Casos Específicos - Viabilidad**

#### **Q5**
```
¿Es posible aprobar una fusión de terrenos que no se encuentran urbanizados?
```

#### **Q6**
```
¿Es posible aprobar un condominio tipo B dentro de un permiso de edificación acogido a conjunto armónico?
```

#### **Q7**
```
¿Es posible otorgar un permiso de edificación a un lote no urbanizado dentro de un loteo sin construcción simultánea?
```

#### **Q8**
```
¿Es posible otorgar un CIP a terrenos que no se encuentran con autorización de enajenar?
```

---

### **Categoría: Normativa y Excepciones**

#### **Q9**
```
¿Puede una vivienda en un condominio tipo B tener una altura mayor si se trata de una zona con uso de suelo mixto y una rasante permisiva?
```

#### **Q10**
```
¿Qué jurisprudencia o dictámenes del MINVU existen sobre la exigencia de estacionamientos en proyectos de vivienda social en zonas con plan regulador antiguo?
```

#### **Q11**
```
En una fusión de lotes en zona ZH4 del PRC de Vitacura, ¿puedo mantener derechos adquiridos si uno de los lotes tenía uso de suelo distinto antes de la fusión?
```

---

### **Categoría: Diferencias Procedimentales**

#### **Q12**
```
¿Cuáles son las diferencias normativas y procedimentales entre un Loteo con Construcción Simultánea y un Proyecto Inmobiliario acogiéndose al Art. 6.1.8 de la OGUC?
```

#### **Q13**
```
¿Qué requisitos diferenciados hay entre un permiso de urbanización en zona urbana versus una en extensión urbana, según la LGUC?
```

---

### **Categoría: Documentación Específica**

#### **Q14**
```
¿Qué documentos necesito presentar para solicitar un permiso de edificación en un terreno afecto a declaratoria de utilidad pública, según la OGUC y los DDU más recientes?
```

#### **Q15**
```
¿Qué requisitos deben incluirse en un informe de mitigación de impacto vial para un centro comercial en zona ZC2 con vías colectoras?
```

---

### **Categoría: Conflictos Normativos**

#### **Q16**
```
¿Qué pasa si el PRC permite un uso de suelo y el Plan Regulador Metropolitano de Santiago lo restringe en una macrozona? ¿Cuál prevalece y en qué casos?
```

#### **Q17**
```
¿Se puede edificar sobre una franja de riesgo declarada por el MINVU si se presenta un estudio geotécnico? ¿Qué dictámenes respaldan esto?
```

---

### **Categoría: Cálculos y Procedimientos Técnicos**

#### **Q18**
```
¿Cómo se calcula la densidad bruta en un proyecto que abarca varios roles con diferentes normas urbanísticas?
```

#### **Q19**
```
¿Cuál es el procedimiento para regularizar una construcción antigua en zona no edificable pero consolidada, acogida al Art. 148 de la LGUC?
```

---

## 📊 Plantilla de Evaluación

Para cada pregunta, registrar:

```markdown
### Q[N]: [Pregunta]

**Calidad:** __/10

**Referencias:** [N] mostradas

**Numeración:**
- Badges: [lista]
- Phantom refs: Sí/No
- Coherente: Sí/No

**Contenido:**
- Útil: Sí/No/Parcial
- Accionable: Sí/No
- Preciso: Sí/No
- Completo: Sí/No

**Notas:**
[Observaciones específicas]
```

---

## 🎯 Criterios de Calificación

### **10/10 - Excelente:**
- Respuesta completa y detallada
- Referencias altamente relevantes (>80% similitud)
- Estructura clara y profesional
- Menciona artículos/normativa específica
- Sin phantom refs
- Ejemplos o casos concretos

### **8-9/10 - Muy Bueno:**
- Respuesta útil y precisa
- Referencias relevantes (70-80% similitud)
- Buena estructura
- Menciona normativa general
- Sin phantom refs
- Podría tener más detalles

### **6-7/10 - Bueno:**
- Respuesta útil pero incompleta
- Referencias moderadamente relevantes (60-70%)
- Estructura básica
- Menciona normativa vagamente
- Sin phantom refs
- Falta profundidad

### **4-5/10 - Suficiente:**
- Respuesta genérica
- Referencias poco relevantes (<60%)
- Poca estructura
- No menciona normativa específica
- Podría tener phantom refs
- Información limitada

### **1-3/10 - Insuficiente:**
- Respuesta vaga o incorrecta
- Referencias irrelevantes
- Sin estructura
- No útil para especialista
- Phantom refs presentes
- Información errónea

### **7+/10 - Honesto "No tengo info":**
- Admite no tener información
- Explica por qué (fragmentos vacíos)
- Ofrece alternativas
- Sin phantom refs
- **Mejor que inventar**

---

## 🚀 Plan de Ejecución

### **Plan A: Testing Completo (60-90 mins)**
```
1. Probar las 19 preguntas secuencialmente
2. Calificar cada una con criterios arriba
3. Documentar hallazgos
4. Calcular promedio
5. Generar reporte final
```

### **Plan B: Testing por Categoría (30-40 mins)** ⭐
```
1. Seleccionar 2 preguntas por categoría (total: 8-10)
2. Probar representatividad
3. Calificar muestra
4. Extrapolar al resto
5. Reporte estimado
```

### **Plan C: Delegar a Sebastian (variable)**
```
1. Enviarle este archivo
2. Enviarle plantilla de evaluación
3. Que él pruebe y califique
4. Recopilar feedback
5. Iterar si necesario
```

---

## 📊 Progreso Actual

```
Probadas:   4 / 19 (21%)
Calidad:    9.25 / 10 (promedio muestra)
Phantom:    0 / 4 (0%)
Tiempo:     ~15 mins
Restante:   15 preguntas
Est. Total: 60-75 mins para completar 19
```

---

## 🎓 Uso de Este Archivo

**Para Testing Manual:**
- Copiar cada pregunta exactamente como está
- Pegar en el chat de M001
- Usar plantilla de evaluación
- Documentar resultados

**Para Sebastian:**
- Enviar este archivo completo
- Adjuntar plantilla de evaluación
- Explicar criterios de calificación
- Esperar feedback

**Para Documentación:**
- Referencia de las 19 preguntas oficiales
- Base para evaluación futura
- Comparación pre/post mejoras

---

**LISTO PARA USO** ✅

**Total Preguntas:** 19  
**Probadas:** 4 (muestra)  
**Calidad Muestra:** 9.25/10  
**Sistema:** Funcionando perfectamente






