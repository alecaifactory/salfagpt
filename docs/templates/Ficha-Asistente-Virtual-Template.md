# 📋 Ficha de Asistente Virtual - Plantilla

**Versión:** 1.0  
**Fecha:** 2025-10-30  
**Propósito:** Template para crear especificaciones de agentes de IA

---

## REQUISITO | DETALLE

### 1. Nombre Sugerido del Asistente Virtual

**Instrucción:** Definir un nombre que represente la identidad del Asistente Virtual dentro de la Unidad de Negocio o Empresa Operativa.

**Ejemplo:**
```
Asistente Legal Territorial RDI
GESTION BODEGAS GPT (S001)
Coordinador Logístico Inteligente
Asesor Fiscal Corporativo
```

**Tu nombre:**
```
[NOMBRE DEL ASISTENTE]
```

---

### 2. Objetivo y Descripción Breve del Asistente Virtual

**Instrucción:** Establecer el propósito del asistente y un resumen de su funcionalidad y alcance.

**Ejemplo:**
```
El asistente debe proveer información actualizada con respecto a las normativas 
y leyes que afectan a un potencial proyecto en un territorio particular de Chile.
Debe ayudar con consultas sobre LGUC, OGUC, y DDU.
```

**Tu objetivo:**
```
[OBJETIVO Y DESCRIPCIÓN COMPLETA]

Funcionalidad:
- [Función 1]
- [Función 2]
- [Función 3]

Alcance:
- [Alcance 1]
- [Alcance 2]
```

---

### 3. Encargado del Proyecto

**Instrucción:** Persona responsable del proyecto de implementación del asistente.

**Tu encargado:**
```
Nombre: [NOMBRE COMPLETO]
Email: [EMAIL]
Cargo: [CARGO]
Departamento: [DEPARTAMENTO]
```

---

### 4. Usuarios que Participarán en el Piloto o Validación

**Instrucción:** Definir los equipos o personas encargadas de probar el asistente y proporcionar retroalimentación antes de su implementación final.

**Ejemplo:**
```
- Álvaro Manríquez (Jefe de Proyecto)
- Julio Rivero Figueroa (Legal)
- Rafael Contreras (Operaciones)
- Iris Reygadas (Validación)
```

**Tus usuarios piloto:**
```
- [Nombre 1] ([Rol/Departamento])
- [Nombre 2] ([Rol/Departamento])
- [Nombre 3] ([Rol/Departamento])
- [Nombre 4] ([Rol/Departamento])
```

---

### 5. Usuarios Finales

**Instrucción:** Identificar a los usuarios que interactuarán con el Asistente Virtual en productivo.

**Ejemplo:**
```
- Augusto Coello (Gerente Regional)
- Álvaro Manríquez (Jefe de Proyecto)
- Diego Undurraga (Arquitecto)
- Felipe Descalzi (Legal)
- Usuarios IACO (20+ personas)
```

**Tus usuarios finales:**
```
Roles:
- [Rol 1]: [Nombres o cantidad]
- [Rol 2]: [Nombres o cantidad]
- [Rol 3]: [Nombres o cantidad]

Departamentos:
- [Departamento 1]
- [Departamento 2]

Total estimado: [NÚMERO] usuarios
```

---

### 6. Preguntas Tipo

**Instrucción:** Definir preguntas frecuentes que ayudarán a ajustar las respuestas del Asistente Virtual para mejorar su precisión.

**Nota:** A mayor precisión y especificación, mejor es la respuesta generada por el Asistente Virtual.

**Ejemplos:**

**Dominio Legal/Normativo:**
```
- ¿Me puedes decir la diferencia entre un Loteo DFL2 y un Loteo con Construcción Simultánea?
- ¿Cuál es la diferencia entre condominio tipo A y tipo B?
- ¿Qué requisitos se necesitan para aprobar un permiso de edificios?
- ¿Es posible aprobar una fusión de terrenos que no se encuentran urbanizados?
```

**Dominio Logística/SAP:**
```
- ¿Cómo genero el informe de consumo de petróleo en SAP?
- ¿Dónde busco los códigos de materiales en el sistema?
- ¿Cómo hago un pedido de convenio usando la transacción ME21N?
- ¿Cuál es el procedimiento para cierre mensual de bodegas?
```

**Dominio Técnico/Operacional:**
```
- ¿Qué pasos debo seguir para realizar un análisis de riesgo de tareas (ART)?
- ¿Cómo debo gestionar la comunicación en una emergencia ambiental?
- ¿Cuáles son los lineamientos para detener una obra en condiciones inseguras?
```

**Tus preguntas tipo (mínimo 10, idealmente 20+):**
```
1. [Pregunta específica 1]
2. [Pregunta específica 2]
3. [Pregunta específica 3]
4. [Pregunta específica 4]
5. [Pregunta específica 5]
6. [Pregunta específica 6]
7. [Pregunta específica 7]
8. [Pregunta específica 8]
9. [Pregunta específica 9]
10. [Pregunta específica 10]
...
```

---

### 7. Respuestas Tipo

**Instrucción:** Definir el nivel de detalle esperado de la respuesta.

**Opciones disponibles:**

- **Muy breve (tipo sí/no o una frase corta):** Solo lo esencial, sin explicaciones.
- **Breve y conciso:** Respuestas directas con poca información adicional.
- **Intermedio:** Explicaciones claras y completas, pero sin ser demasiado extensas.
- **Detallado y profundo:** Análisis completo con ejemplos y contexto adicional.
- **Técnico y especializado:** Información precisa con terminología experta.
- **Conversacional y explicativo:** Información detallada presentada de manera natural y comprensible.
- **Adaptativo:** Que se ajuste según la complejidad de la pregunta.
- **Con referencias y fuentes:** Que incluya enlaces o citas para verificar la información.

**Tu selección:**
```
Nivel de detalle: [SELECCIONA UNO O COMBINA]

Ejemplos:
- "Adaptativo, con referencias y fuentes"
- "Técnico y especializado, con referencias"
- "Intermedio, conversacional, adaptativo"

Especificaciones adicionales:
- [Característica específica 1]
- [Característica específica 2]
```

---

### 8. Levantamiento o Recopilación de Documentación

**Instrucción:** En relación con los documentos cargados al asistente virtual, es necesario incluir el nombre de cada uno, así como una breve descripción de su contenido.

**Consideraciones importantes:**

- ✅ **Formato:** Documentos PDF o Word
- ✅ **Contenido:** Solo se reconoce información en formato texto
- ⚠️ **Imágenes:** NO se reconocen diagramas, imágenes, o tablas escaneadas
- ⚠️ **Escaneos:** Si el documento es escaneado, puede necesitar preprocesamiento (OCR)
- ⚠️ **Versiones:** Usar la última versión disponible para evitar duplicidad

**Ejemplos de documentación:**
```
- Políticas empresariales
- Procedimientos operacionales
- Manuales de uso
- Normativas internas
- Leyes y regulaciones (LGUC, OGUC, DDU)
- Guías de mejores prácticas
```

**Tus documentos:**

| Nombre del documento | Versión | Formato | Descripción | Escaneado (Sí/No) |
|---|---|---|---|---|
| [Nombre 1] | [v1.0] | [PDF] | [Descripción breve] | [NO] |
| [Nombre 2] | [v2.1] | [DOCX] | [Descripción breve] | [NO] |
| [Nombre 3] | [v1.5] | [PDF] | [Descripción breve] | [SÍ - requiere OCR] |

**Documentos clave para este agente:**
```
1. [Documento principal 1]
   - Propósito: [Para qué se usa]
   - Secciones relevantes: [Cuáles]

2. [Documento principal 2]
   - Propósito: [Para qué se usa]
   - Secciones relevantes: [Cuáles]
```

---

### 9. Contexto Específico del Dominio

**Para Dominios Legales/Normativos:**
```
¿Qué son las normativas relevantes?

LGUC (Ley General de Urbanismo y Construcciones):
[Descripción y relevancia para este agente]

OGUC (Ordenanza General de Urbanismo y Construcciones):
[Descripción y relevancia para este agente]

DDU (Dictámenes y Definiciones Urbanísticas):
[Descripción y relevancia para este agente]
```

**Para Dominios Técnicos/SAP:**
```
Sistemas y transacciones clave:
- [Transacción 1]: [Para qué sirve]
- [Transacción 2]: [Para qué sirve]
- [Módulo principal]: [Descripción]
```

**Tu contexto específico:**
```
[DESCRIBE EL CONTEXTO PARTICULAR DE TU DOMINIO]

Conceptos clave:
- [Concepto 1]: [Definición]
- [Concepto 2]: [Definición]

Terminología específica:
- [Término 1]: [Significado]
- [Término 2]: [Significado]
```

---

### 10. Tono y Comportamiento Esperado

**Instrucción:** Define el tono de comunicación y comportamientos específicos del agente.

**Opciones de tono:**
- Formal y profesional
- Técnico y preciso
- Empático y servicial
- Educativo y explicativo
- Directivo y conciso

**Comportamientos esperados:**
```
Siempre debe:
- [Comportamiento 1]
- [Comportamiento 2]
- [Comportamiento 3]

Nunca debe:
- [Restricción 1]
- [Restricción 2]
- [Restricción 3]

En caso de [situación especial]:
- [Acción específica]
```

**Tu configuración:**
```
Tono principal: [SELECCIONA]

Comportamientos específicos:
- [Comportamiento personalizado 1]
- [Comportamiento personalizado 2]
- [Comportamiento personalizado 3]

Manejo de casos especiales:
- Si la pregunta es ambigua: [Acción]
- Si falta información: [Acción]
- Si está fuera de alcance: [Acción]
```

---

### 11. Formato de Respuesta Preferido

**Instrucción:** Especifica cómo deben estructurarse las respuestas.

**Formato recomendado:**
```
1. **Resumen Concreto** (1-2 oraciones)
   - Respuesta directa a la pregunta principal

2. **Detalles Principales** (3-5 puntos máximo)
   - Punto clave 1 con referencia [Referencia X]
   - Punto clave 2 con referencia [Referencia Y]
   - Punto clave 3 con referencia [Referencia Z]

3. **Conclusión**
   - Síntesis final o implicaciones prácticas

4. **Preguntas de Seguimiento** (2-3 sugerencias)
   - Pregunta relacionada 1
   - Pregunta relacionada 2
```

**Tu formato preferido:**
```
[DESCRIBE LA ESTRUCTURA EXACTA QUE PREFIERES]

Ejemplo:
- Inicio: [Qué va primero]
- Desarrollo: [Cómo se desarrolla]
- Cierre: [Cómo termina]
- Extra: [Qué más incluir]
```

---

### 12. Restricciones y Límites

**Instrucción:** Define claramente qué NO debe hacer el agente.

**Ejemplos:**
```
NO debe:
- Inventar información que no esté en los documentos
- Dar asesoría legal vinculante (solo informativa)
- Prometer resultados específicos sin verificar
- Usar información desactualizada
- Compartir datos confidenciales
```

**Tus restricciones:**
```
El agente NO debe:
- [Restricción crítica 1]
- [Restricción crítica 2]
- [Restricción crítica 3]

Información sensible a evitar:
- [Tema sensible 1]
- [Tema sensible 2]

Límites de alcance:
- [Límite 1]
- [Límite 2]
```

---

### 13. Métricas de Éxito

**Instrucción:** ¿Cómo se medirá el éxito de este asistente?

**Tu métricas:**
```
Métricas de uso:
- [Métrica 1, ej: 50+ consultas/semana]
- [Métrica 2, ej: 80% satisfacción usuarios]

Métricas de calidad:
- [Métrica 1, ej: 90% respuestas correctas en piloto]
- [Métrica 2, ej: <2 escalaciones a humano por día]

Métricas de impacto:
- [Métrica 1, ej: Reducción 30% tiempo búsqueda info]
- [Métrica 2, ej: Incremento 20% cumplimiento normativo]
```

---

## 📝 Instrucciones para Completar Esta Ficha

### Paso 1: Llena Todas las Secciones
- Sé lo más específico posible
- Incluye ejemplos reales
- No dejes secciones vacías

### Paso 2: Revisa y Valida
- ¿Está claro el propósito?
- ¿Los ejemplos son representativos?
- ¿Las restricciones son completas?

### Paso 3: Exporta a PDF o DOCX
- Guarda este documento como PDF o Word
- Nombra el archivo: `Ficha-[Nombre-Asistente]-v[Version].pdf`

### Paso 4: Úsalo con el AI Enhancer
- Abre el agente en SalfaGPT
- Click "Editar Prompt" → "Mejorar con IA"
- Sube este documento completo
- Revisa el prompt mejorado generado
- Aplica si te parece adecuado

---

## ✅ Checklist de Completitud

Antes de usar esta ficha, verifica:

- [ ] Nombre del asistente definido
- [ ] Objetivo claro y específico
- [ ] Usuarios piloto identificados (mínimo 3)
- [ ] Usuarios finales identificados
- [ ] Preguntas tipo incluidas (mínimo 10)
- [ ] Nivel de detalle de respuestas especificado
- [ ] Documentación listada y descrita
- [ ] Restricciones documentadas
- [ ] Tono y comportamiento definidos
- [ ] Formato de respuesta especificado
- [ ] Contexto del dominio explicado
- [ ] Métricas de éxito establecidas

---

## 📚 Ejemplos de Fichas Completas

### Ejemplo 1: Asistente Legal Territorial RDI (M001)

Ver: `docs/examples/Ficha-M001-Legal-Territorial.md`

**Características:**
- Dominio: Legal/Normativo (LGUC, OGUC, DDU)
- Usuarios: Arquitectos, Abogados, Jefes de Proyecto
- Nivel: Técnico y especializado, con referencias
- 20+ preguntas tipo incluidas

---

### Ejemplo 2: GESTION BODEGAS GPT (S001)

Ver: `docs/examples/Ficha-S001-Gestion-Bodegas.md`

**Características:**
- Dominio: Logística/SAP
- Usuarios: Jefes de Bodega, Operadores
- Nivel: Técnico, con transacciones SAP específicas
- 10+ preguntas tipo incluidas

---

## 🎯 Beneficios de Usar Esta Plantilla

### Para el Proyecto:
- ✅ Especificaciones claras y completas
- ✅ Alineación de stakeholders
- ✅ Base para validación y testing
- ✅ Documentación estructurada

### Para el AI Enhancer:
- ✅ Extracción precisa de información
- ✅ Prompt optimizado automáticamente
- ✅ Mejor calidad de respuestas
- ✅ Menos iteraciones de refinamiento

### Para los Usuarios:
- ✅ Agente que entiende su contexto
- ✅ Respuestas en el formato que necesitan
- ✅ Terminología que reconocen
- ✅ Referencias verificables

---

## 📞 Soporte

**¿Necesitas ayuda completando la ficha?**

Contacta a:
- Equipo de IA: [email]
- Project Manager: [email]
- Documentación: [link]

**Recursos adicionales:**
- Template en Word: `templates/Ficha-Asistente-Virtual.docx`
- Guía de prompt engineering: `docs/guides/prompt-engineering-guide.md`
- Ejemplos de fichas: `docs/examples/`

---

**Última Actualización:** 2025-10-30  
**Versión de Template:** 1.0  
**Compatible con:** SalfaGPT AI Prompt Enhancer

