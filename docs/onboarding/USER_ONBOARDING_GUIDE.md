# 🎓 SalfaGPT - Guía de Onboarding para Usuarios

**Versión:** 1.0  
**Fecha:** Noviembre 14, 2025  
**Audiencia:** Todos los usuarios nuevos  
**Tiempo estimado:** 10 minutos para dominio completo

---

## 🎯 Bienvenido a SalfaGPT

**En 10 minutos aprenderás a:**
- ⚡ Obtener respuestas en 8 segundos (vs 60 minutos manualmente)
- 📚 Verificar que cada respuesta es 100% confiable
- 🎯 Dar feedback que mejora el sistema para todos
- 🏆 Maximizar tu productividad 100x

---

## ⚡ **QUICK START: Tu Primera Pregunta (3 minutos)**

### **Paso 1: Login (30 segundos)**

```
1. Abre: https://[salfagpt-url]
2. Click: "Login con Google"
3. Usa tu email: [nombre]@[dominio-salfa].cl
4. Autoriza acceso
5. ✅ Estás dentro!
```

**Tip:** Guarda el link en tus favoritos para acceso rápido.

---

### **Paso 2: Selecciona Tu Agente (30 segundos)**

**Mira el sidebar izquierdo → Lista de agentes**

**¿Cuál usar?** Depende de tu área:

| Tu Área | Agente Recomendado | Para Qué |
|---|---|---|
| **Legal / Normativas** | M001 (Legal Territorial) | OGUC, permisos, regulaciones |
| **Seguridad / SSOMA** | SSOMA | Protocolos de seguridad, procedimientos |
| **Bodegas / Logística** | S001 (Gestión Bodegas) | Inventario, procesos operacionales |
| **Construcción** | MAQSA | Proyectos, especificaciones técnicas |
| **Contratos** | M003 (Legal Contratos) | Cláusulas, negociaciones |

**Acción:** Click en el agente de tu área.

**¿No estás seguro?** Empieza con cualquiera. Si no tiene la info, te dirá cuál agente contactar.

---

### **Paso 3: Haz Tu Primera Pregunta (2 minutos)**

**En el cuadro de texto inferior, escribe tu pregunta:**

**✅ Ejemplos de BUENAS preguntas:**
```
"¿Qué normativa aplica para un proyecto residencial en zona de expansión urbana?"

"¿Cuál es el protocolo ante derrame de combustible en bodega?"

"¿Diferencia entre condominio tipo A y tipo B según OGUC?"

"¿Proceso para solicitar vacaciones según política HR?"
```

**❌ Evita preguntas muy genéricas:**
```
"¿Qué dice el documento?"  ← ¿Qué documento? ¿Sobre qué?
"Ayuda"  ← ¿Con qué necesitas ayuda?
```

**Teclea tu pregunta y presiona Enter** (o click en "Enviar")

---

### **Paso 4: Recibe Respuesta (5-8 segundos)**

**Verás:**
```
1. "💭 Pensando..." (instant)
2. "🔍 Buscando contexto relevante..." (1-2s)
3. "✅✅✅✅ Seleccionando chunks..." (1-2s)
4. "✨ Generando respuesta..." (2-3s)
5. Respuesta aparece progresivamente (streaming)
```

**Resultado:** Respuesta completa con referencias en <8 segundos.

**Compara:** Esto te habría tomado 30-60 minutos manualmente.

**🎉 ¡Acabas de ahorrar 1 hora!**

---

## 📚 **DOMINIO COMPLETO: Referencias Verificables**

### **¿Qué son los números [1][2][3]?**

Cada número entre corchetes es una **cita de un documento real**.

**Ejemplo de respuesta:**
```
"Según el artículo 4.14.2 de la OGUC [1], los condominios tipo A requieren..."

"La normativa establece que [2] las zonas de expansión..."

"En contraste, el tipo B permite [3] mayor densidad habitacional..."
```

Los números [1], [2], [3] son **clickables** y te muestran:
- ✅ Fragmento exacto del documento
- ✅ Score de similitud semántica (70-95%)
- ✅ Metadata (documento fuente, página, modelo usado)
- ✅ Opción para ver documento completo

---

### **Cómo Verificar una Respuesta (30 segundos)**

**Método rápido:**
```
1. Lee la respuesta
2. ¿Tiene [1][2][3]? → Buena señal (hay fuentes)
3. Click en [1]
4. Modal abre con fragmento exacto
5. ¿El fragmento dice lo que el AI afirma? → ✅ Confiable
```

**Método completo (para info crítica):**
```
1. Click en cada [1][2][3]
2. Lee los fragmentos completos
3. Verifica que la interpretación es correcta
4. Si necesitas más contexto:
   → Click "Ver documento original"
   → Lee sección completa
5. Si aún tienes dudas:
   → Contacta al experto del área
```

**Regla de oro:** Para decisiones importantes, SIEMPRE verifica las referencias.

---

### **¿Qué significa el "Score de Similitud"?**

**Ejemplo:** `85.3% Similitud semántica`

**Significa:**
- El fragmento es **85.3% relevante** a tu pregunta
- Calculado por AI usando embeddings vectoriales
- >70% = Alta relevancia ✅
- 50-70% = Relevancia media 🟡
- <50% = Baja relevancia ⚠️

**Entre más alto el %, más relevante es el fragmento.**

**Si ves "50.0%" en TODAS las referencias:**
- Es un bug (modo fallback activado)
- Reporta via feedback
- Estamos trabajando en arreglarlo

---

## 🎯 **FEATURES AVANZADAS: Maximiza Tu Productividad**

### **1. Organiza con Folders (Opcional pero Útil)**

**¿Tienes muchas conversaciones?**

**Crea folders por proyecto/tema:**
```
Sidebar → Click "📁 +" → Nombre: "Proyecto Edificio Norte"
```

**Arrastra conversaciones al folder:**
```
Hover sobre conversación → Drag & drop al folder
```

**Resultado:** Organización perfecta, fácil encontrar después.

---

### **2. Cambia de Modelo (Si Necesitas Mayor Precisión)**

**Dos modelos disponibles:**

| Modelo | Velocidad | Precisión | Costo | Cuándo Usar |
|---|---|---|---|---|
| **Flash** (Default) | ⚡ Muy rápido | ✅ Buena | 💰 Económico | Preguntas generales |
| **Pro** | 🐢 Más lento | 🎯 Excelente | 💰💰 6x más caro | Análisis complejo, legal crítico |

**Cómo cambiar:**
```
User Menu → ⚙️ Configuración → Modelo Preferido
```

**Recomendación:** Empieza con Flash. Solo usa Pro si Flash no es suficientemente preciso.

**94% de los casos Flash es perfecto.**

---

### **3. Personaliza las Instrucciones del Sistema (Avanzado)**

**¿Quieres que el AI responda de cierta forma?**

**Ejemplos:**
```
"Responde siempre con listas numeradas y ejemplos prácticos"

"Usa lenguaje técnico preciso, no simplificaciones"

"Incluye siempre tabla comparativa si la pregunta compara opciones"

"Responde en un máximo de 3 párrafos, sé conciso"
```

**Cómo configurar:**
```
User Menu → ⚙️ Configuración → Instrucciones del Sistema
```

**Aplica a:** Todas las conversaciones nuevas que crees después.

---

## 💬 **DAR FEEDBACK: Cómo Tu Input Mejora el Sistema**

### **¿Por qué dar feedback?**

**Tu feedback no es solo para ti:**
- ✅ Feedback → Mejora detectada → Priorizada → Implementada → **TODOS se benefician**

**Ejemplo real:**
```
Usuario Sebastian reportó: "Referencias inventadas [7] cuando solo hay 5"
  ↓
Identificamos bug crítico
  ↓
Fix implementado en 24 horas
  ↓
0% alucinación de referencias
  ↓
TODOS los usuarios ahora tienen referencias confiables
```

**Una persona reporta, 20+ se benefician.** Ese es el poder del feedback.

---

### **Cómo Dar Feedback Efectivo (1 minuto)**

**Método rápido: Calificación (10 segundos)**
```
Después de cada respuesta:
1. Hover sobre el mensaje del AI
2. Ve botones: 👍 Me sirvió | 👎 Mejorar
3. Click según tu experiencia
4. Listo!
```

**Método completo: Con comentario (1 minuto)**
```
1. Click "👎 Mejorar"
2. Califica: ⭐⭐⭐⭐⭐ (1-5 estrellas)
3. Escribe comentario específico:
   ✅ "Faltó explicar diferencia entre tipo A y B"
   ❌ "No me gustó" (no es accionable)
4. Opcional: Screenshot (si hay problema visual)
5. Submit
```

**Tu ticket se crea automáticamente y puedes seguirlo:**
```
User Menu → "📋 Mi Feedback" → Ve todos tus tickets
```

---

### **Qué Reportar (Prioridades)**

**🔴 Crítico - Reporta INMEDIATO:**
- Referencias inventadas (AI usa [7] cuando solo hay 5)
- Información completamente incorrecta
- App no responde / crash
- No puedes hacer algo que antes podías

**🟡 Importante - Reporta cuando puedas:**
- Respuesta parcialmente incorrecta
- Falta información clave
- Referencias son de baja calidad
- Fragmentos no relevantes

**🟢 Mejora - Reporta si tienes tiempo:**
- Formato de respuesta podría ser mejor
- Falta un feature que te haría más productivo
- UI podría ser más intuitiva

**Todos los reportes se leen y priorizan por impacto.**

---

## 📊 **TRACKING TU IMPACTO**

### **Vista: "Mi Feedback"**

**Cómo acceder:**
```
User Menu (esquina inferior izquierda)
  ↓
Click "📋 Mi Feedback"
  ↓
Modal abre con tu historial completo
```

**Qué verás:**
```
┌────────────────────────────────────────────────┐
│ 📊 Resumen                                     │
│ Total: 5 | En Cola: 2 | En Progreso: 1 | ✅: 2 │
└────────────────────────────────────────────────┘

Tus Tickets:

┌────────────────────────────────────────────────┐
│ ▶ Mejorar referencias en M001         ✨ NUEVO │
│ [P1] [Posición: #2/8] [Hoy 14:30]             │
│                                                │
│ Expande para ver:                              │
│ - Posición en cola                             │
│ - Timeline de progreso                         │
│ - Tu feedback original                         │
│ - Próximos pasos                               │
│ - Estimación de tiempo                         │
└────────────────────────────────────────────────┘

┌────────────────────────────────────────────────┐
│ ▼ UI lenta en mobile              🔨 EN PROGRESO│
│ [P0] [Posición: #1/3] [Ayer]                   │
├────────────────────────────────────────────────┤
│ Progreso: ▓▓▓▓▓▓▓░░░ 66%                      │
│                                                │
│ Timeline:                                      │
│ ✅ Recibido (13/11 10:00)                      │
│ ✅ Revisado (13/11 15:00)                      │
│ ✅ En Desarrollo (14/11 09:00)                 │
│ ⏱️ En revisión (próximo)                       │
│                                                │
│ Estimado: Listo en 2-3 días                    │
└────────────────────────────────────────────────┘
```

**Actualizar:** Click "🔄 Actualizar" para ver cambios más recientes.

---

### **Notificaciones de Impacto**

**Cuando tu feedback genera mejora real:**

```
╔════════════════════════════════════════════════════╗
║  ✨ ¡IMPACTO DETECTADO!                            ║
╠════════════════════════════════════════════════════╣
║                                                    ║
║  La respuesta que acabas de recibir mejoró         ║
║  gracias a TU feedback del 28 de octubre.          ║
║                                                    ║
║  📊 Tu Contribución:                               ║
║  • Evaluaste: "Referencias inventadas [7]"         ║
║  • Expert validó tu reporte                        ║
║  • Admin aprobó corrección                         ║
║  • Sistema mejorado: 0% alucinación                ║
║                                                    ║
║  🎯 Impacto:                                       ║
║  • 15 respuestas mejoradas esta semana             ║
║  • 20+ usuarios beneficiados                       ║
║  • Tu feedback escaló 100x                         ║
║                                                    ║
║  🏆 Recompensa: +10 puntos                         ║
║  Badge: Quality Contributor 🎯                     ║
║                                                    ║
║       [Ver Mi Dashboard]  [Compartir Logro]        ║
╚════════════════════════════════════════════════════╝
```

**Esto aparece automáticamente cuando tu feedback impacta.**

---

## 🎓 **TUTORIAL INTERACTIVO (En la App)**

### **Primera Vez que Inicias Sesión**

El sistema te guía paso a paso:

```
[Paso 1/6] 👋 Bienvenido
↓
Highlight: Sidebar con agentes
Texto: "Estos son tus agentes especializados"
Acción: Click en un agente
↓
[Paso 2/6] 💬 Tu Primera Pregunta
↓
Highlight: Input de chat
Texto: "Escribe una pregunta. Ej: ¿Qué es un OGUC?"
Acción: Escribe y envía
↓
[Paso 3/6] ✨ Respuesta del AI
↓
Highlight: Respuesta generándose
Texto: "En 5-8 segundos obtienes respuesta con fuentes"
Acción: Espera respuesta completa
↓
[Paso 4/6] 📚 Referencias Verificables
↓
Highlight: [1][2][3] en respuesta
Texto: "Click para ver fuente exacta"
Acción: Click en [1]
↓
[Paso 5/6] ⭐ Da Feedback
↓
Highlight: Botones 👍👎
Texto: "Califica para mejorar el sistema"
Acción: Click en rating
↓
[Paso 6/6] 🎯 Sigue Tu Impacto
↓
Highlight: User Menu → "Mi Feedback"
Texto: "Aquí sigues tus tickets"
Acción: Click "Finalizar"
↓
✅ Tutorial Completado!
Badge Earned: 🎓 "SalfaGPT Graduate"
```

**Puedes saltear en cualquier momento:** Click "Saltar tutorial"

**Puedes repetir cuando quieras:** User Menu → "? Ayuda" → "Tutorial"

---

## 🏆 **PRO TIPS: Usuarios Avanzados**

### **Tip 1: Usa Contexto en Tus Preguntas**

**Nivel Básico:**
```
"¿Qué es un OGUC?"
```

**Nivel Pro:**
```
"Tengo un proyecto residencial de 120 departamentos en zona de expansión urbana en Puente Alto. ¿Qué artículos del OGUC aplican y qué permisos necesito según la normativa vigente?"
```

**Por qué funciona mejor:**
- El AI tiene CONTEXTO para buscar
- Referencias son más específicas
- Respuesta es inmediatamente aplicable

**Resultado:** De respuesta genérica → Respuesta accionable para tu caso específico.

---

### **Tip 2: Crea Threads por Tema**

**No hagas esto (mezclar temas):**
```
Chat 1:
- Pregunta sobre OGUC
- Pregunta sobre seguridad
- Pregunta sobre contratos
- Pregunta sobre bodegas
```
❌ Difícil de encontrar después, contexto mezclado

**Haz esto (threads especializados):**
```
Chat 1: "Proyecto Edificio Norte - OGUC"
- Todas las preguntas sobre normativa de ese proyecto

Chat 2: "Procedimientos SSOMA Bodega Central"
- Todas las preguntas sobre seguridad en esa bodega

Chat 3: "Contrato Proveedor X - Cláusulas"
- Todas las preguntas sobre ese contrato
```
✅ Organizado, fácil de encontrar, mejor contexto

**Plus:** Usa folders para agrupar chats relacionados.

---

### **Tip 3: Aprovecha la Memoria del Agente**

**El agente recuerda tu conversación:**

```
Tú: "¿Qué es un OGUC?"
AI: [Explica OGUC...]

Tú: "¿Qué dice sobre condominios?"
AI: [Busca en OGUC sobre condominios...] ← Recuerda que ya hablaron de OGUC

Tú: "¿Y para zona rural específicamente?"
AI: [Filtra info de condominios en zona rural...] ← Contexto completo
```

**No necesitas repetir contexto en cada pregunta.**

El agente construye sobre la conversación previa.

---

### **Tip 4: Feedback Específico = Mejoras Específicas**

**Feedback vago (poco accionable):**
```
⭐⭐ (2 estrellas)
Comentario: "No me sirvió"
```
→ No sabemos qué arreglar

**Feedback específico (muy accionable):**
```
⭐⭐ (2 estrellas)
Comentario: "La respuesta explica qué es un condominio tipo A, pero NO explica la diferencia con tipo B. Necesito tabla comparativa o lista de diferencias específicas."
Screenshot: [Muestra la respuesta que falta info]
```
→ Sabemos EXACTAMENTE qué agregar

**Resultado:** Feedback específico se implementa 10x más rápido.

---

## 📱 **USO EN MOBILE (Teléfono/Tablet)**

### **Responsive Design**

SalfaGPT funciona en cualquier dispositivo:

**En tu teléfono:**
- Vista simplificada (chat principal)
- Agentes en menú hamburguesa
- Input optimizado para touch
- Referencias clickables (touch-friendly)

**En tablet:**
- Vista intermedia (sidebar + chat)
- Keyboard shortcuts funcionan

**Tips para mobile:**
1. Usa voz para input (🔄 próximamente)
2. Screenshot con botón nativo del teléfono
3. Feedback rápido con stars (no necesitas comentario)

---

## 🔒 **Seguridad y Privacidad (Tu Derecho)**

### **¿Quién puede ver mis conversaciones?**

**SOLO TÚ.** Period.

- ❌ Otros usuarios: NO
- ❌ Admins: NO (a menos que les compartas)
- ❌ Sistema: Solo metadata para analytics (anónimo)
- ✅ TÚ: 100% acceso completo

**Privacidad garantizada por diseño.**

---

### **¿Qué datos se guardan?**

**SÍ se guarda:**
- Tus preguntas y respuestas (para tu historial)
- Tus calificaciones y feedback (para mejorar el sistema)
- Metadata de uso (cuándo, qué agente, tiempos - anónimo en reportes)

**NO se guarda:**
- Info personal sensible
- Conversaciones fuera del trabajo
- Datos no relacionados con Salfa

**Puedes exportar o eliminar tus datos cuando quieras.**

---

### **¿Es seguro para información confidencial?**

**Sí, con consideraciones:**

**✅ Seguro:**
- Conexión encriptada (HTTPS)
- Datos en reposo encriptados (Firestore)
- Acceso solo con autenticación
- Compliance con regulaciones de privacidad

**⚠️ Consideración:**
- El AI procesa tus preguntas (Gemini API)
- No envíes información ULTRA confidencial (secretos comerciales)
- Usa para información institucional ya documentada

**Si tienes dudas sobre qué preguntar, consulta con tu admin.**

---

## 📞 **SOPORTE Y RECURSOS**

### **¿Tienes Preguntas?**

**Email Soporte:**  
sorellanac@salfagestion.cl  
Respuesta: <24 horas

**In-App Help:**  
User Menu → "? Ayuda" → FAQ, Tutorial, Contacto

**Feedback Sistema:**  
User Menu → "📋 Mi Feedback" → Tracking completo

**Ver Roadmap:**  
User Menu → "🗺️ Roadmap" → Features próximas

---

### **Recursos Disponibles**

**Video Tutorial:** [5 minutos - Link]  
**Quick Start PDF:** [1 página - Link]  
**FAQ Completo:** [Link]  
**Best Practices:** [Link]  
**Changelog:** [Link - ver qué cambió]

---

## 🎯 **CHECKLIST DE ÉXITO**

### **Después de 1 Semana:**
- [ ] Hiciste al menos 5 preguntas
- [ ] Verificaste al menos 3 referencias
- [ ] Diste feedback en al menos 2 respuestas
- [ ] Ahorraste al menos 2 horas vs búsqueda manual
- [ ] Recomendarías a un colega (NPS >7)

**Si completaste 5/5:** ✅ Eres un power user!  
**Si completaste 3-4/5:** ✅ Buen progreso!  
**Si completaste <3/5:** ⚠️ ¿Necesitas ayuda? Email us.

---

### **Después de 1 Mes:**
- [ ] Usas SalfaGPT al menos 3x por semana
- [ ] Creaste folders para organizar tus chats
- [ ] Diste feedback que generó mejora (viste notificación de impacto)
- [ ] Ahorraste 10+ horas total
- [ ] Le contaste a 2+ colegas sobre SalfaGPT

**Si completaste 5/5:** 🏆 Badge: "SalfaGPT Champion"  
**Reconocimiento:** Apareces en dashboard de power users (opt-in)

---

## 🚀 **PRÓXIMOS PASOS**

1. **Pruébalo ahora:** [Link to app]
2. **Haz tu primera pregunta:** Toma 30 segundos
3. **Da feedback:** Ayúdanos a mejorar

**Si tienes alguna pregunta, estamos aquí para ayudar.**

Bienvenido a la transformación de cómo trabajamos con conocimiento.

---

**Equipo SalfaGPT**  
_De 60 minutos a 60 segundos_ ⚡






