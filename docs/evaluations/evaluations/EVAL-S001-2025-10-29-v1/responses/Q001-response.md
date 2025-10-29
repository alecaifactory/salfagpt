# S001-Q001 - ¿Dónde busco los códigos de materiales?

**Evaluation:** EVAL-S001-2025-10-29-v1
**Timestamp:** 2025-10-29T20:15:00Z
**Model:** gemini-2.5-flash
**Status:** ✅ TESTED

---

## 📋 Pregunta

**ID:** S001-Q001
**Categoría:** cat-01 (Códigos y Catálogos)
**Prioridad:** CRITICAL

```
¿Dónde busco los códigos de materiales?
```

**Expected Topics:** SAP, código material, transacción, catálogo

---

## 💬 Respuesta del Agente

Puedes buscar los códigos de materiales en dos lugares principales, según los documentos proporcionados:

1. **En el ANEXO: CÓDIGOS DE MATERIAL INSUMOS DE TECNOLOGÍA** del documento "Paso a Paso Solicitud de Pedido de Insumos Tecnológicos-GTI[1].pdf" (Referencia 1). Este anexo contiene tablas con el "TIPO", "CÓDIGO" y "DESCRIPCIÓN" para diversos insumos tecnológicos, clasificados en categorías como Conectividad, Escritorio, Hardware, Servicio y Software. Por ejemplo, encontrarás códigos para "ACCESS POINT GTI" (35055740) o "PC DESKTOP ESTANDAR GTI" (35055770).

2. **Dentro del sistema SAP**, utilizando la función de búsqueda de materiales, como se describe en el documento "Paso a Paso Solicitud de Pedido ZCRE Solped Costo Reembolsable[5].pdf" (Referencia 5).
   - Para buscar un código de material, debes ir a la columna *Material* y usar la opción de búsqueda por *Texto breve material*.
   - Puedes indicar una palabra clave o abreviación entre asteriscos (por ejemplo, `*ASCENSOR*`) para desplegar un listado de opciones y seleccionar el material deseado.

---

## 📚 Referencias Utilizadas (6)

### [1] Paso a Paso Solicitud de Pedido de Insumos Tecnológicos-GTI.pdf (74.8% similitud)
- **Fragmento:** 2
- **Tokens:** 4,000
- **Tipo:** RAG
- **Preview:** ANEXO: CÓDIGOS DE MATERIAL INSUMOS DE TECNOLOGÍA con tablas de códigos

### [2] MAQ-GG-CAL-PP-002 Evaluación Proveedores en SAP Rev.00.pdf (73.5% similitud)
- **Fragmento:** 8
- **Tokens:** 4,000
- **Tipo:** RAG

### [3] MAQ-ADM-AUD-P-002 Auditorias Operacionales Rev.06.pdf (73.4% similitud)
- **Fragmento:** 1
- **Tokens:** 4,000
- **Tipo:** RAG

### [4] Instructivo Capacitación Salfacorp.pdf (73.4% similitud)
- **Fragmento:** 2
- **Tokens:** 555
- **Tipo:** RAG

### [5] Paso a Paso Solicitud de Pedido ZCRE Solped Costo Reembolsable.pdf (73.2% similitud)
- **Fragmento:** 1
- **Tokens:** 4,000
- **Tipo:** RAG
- **Preview:** Búsqueda por Texto breve material con asteriscos

### [6] MAQ-ABA-GC-P-001 Gestión de Compras Nacionales Rev.09.PDF (73.0% similitud)
- **Fragmento:** 0
- **Tokens:** 2,000
- **Tipo:** RAG

---

## ✅ Validación Técnica

### Numeración:
- ✅ Phantom refs: NO
- ✅ Referencias en rango: SÍ (solo usa [1] y [5], ambos ≤ 6)
- Máx ref usado: 5
- Total badges: 6
- Consistencia: 100%

### Calidad:
- ✅ Respuesta completa: SÍ
- ✅ Contenido técnico: SÍ
- ✅ Referencias relevantes: SÍ
- ✅ Útil para especialista: SÍ
- ✅ Dos ubicaciones específicas
- ✅ Ejemplos concretos de códigos
- ✅ Procedimiento SAP explicado

### Calificación Técnica: 9/10

**Motivos:**
- Respuesta completa y bien estructurada (2 ubicaciones)
- Ejemplos específicos de códigos (35055740, 35055770)
- Procedimiento SAP con pasos claros (búsqueda por texto breve)
- 6 referencias relevantes (73-75% similitud)
- NO phantom refs
- Menciona documentos específicos
- Podría tener más detalle sobre transacciones SAP específicas (-1 punto)

---

## 👥 Evaluación de Experto

**Status:** ⏳ PENDIENTE (para Sebastian)

---

**Última Actualización:** 2025-10-29T20:15:00Z

