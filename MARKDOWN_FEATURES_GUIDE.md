# 📚 Guía de Renderizado Markdown Enriquecido - Flow

## 🎯 Nuevas Capacidades del Chat

Flow ahora soporta **Markdown enriquecido** en las respuestas del asistente, permitiendo:

- 💻 **Código con syntax highlighting**
- 📊 **Tablas formateadas**
- 🔗 **Enlaces externos e internos**
- 🖼️ **Imágenes con descripciones**
- 📋 **Listas ordenadas y sin orden**
- 📝 **Citas y blockquotes**
- 📎 **Referencias a fuentes de contexto**

---

## 💻 Ejemplo 1: Código con Syntax Highlighting

Prueba preguntando al asistente:

> "Muéstrame un ejemplo de función en Python que calcule fibonacci"

**Respuesta esperada:**

```python
def fibonacci(n):
    """Calcula el n-ésimo número de Fibonacci."""
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

# Uso
print(fibonacci(10))  # Output: 55
```

**Características:**
- ✅ Syntax highlighting automático
- ✅ Botón "Copiar" al hacer hover
- ✅ Código inline con: `variable = value`

---

## 📊 Ejemplo 2: Tablas Formateadas

Prueba preguntando:

> "Crea una tabla comparando los modelos Gemini Flash y Pro"

**Respuesta esperada:**

| Modelo | Velocidad | Costo | Ventana Contexto | Mejor Para |
|--------|-----------|-------|------------------|------------|
| Gemini 2.5 Flash | 🚀 Rápido | 💰 $0.001875/1M tokens | 1M tokens | Casos generales, análisis simples |
| Gemini 2.5 Pro | 🐢 Más lento | 💸 $0.03125/1M tokens | 2M tokens | Análisis complejos, mayor precisión |

---

## 🔗 Ejemplo 3: Enlaces

### Enlaces Externos
Prueba preguntando:

> "Dame el link a la documentación de Gemini"

**Respuesta esperada:**

Puedes ver la documentación oficial aquí: [Documentación de Gemini AI](https://ai.google.dev/gemini-api/docs)

**Características:**
- ✅ Ícono de enlace externo automático
- ✅ Abre en nueva pestaña

### Referencias a Fuentes de Contexto

**Cómo usar:**
1. Sube un documento PDF al contexto
2. Pregunta algo relacionado al documento
3. El asistente puede referenciar la fuente con:

```markdown
Según el [Documento Demo](#source-abc123), la política es...
```

**Resultado:**
- ✅ Link clickable a la fuente
- ✅ Badge "✓ Validado" si está aprobada
- ✅ Abre modal con detalles al hacer click

---

## 🖼️ Ejemplo 4: Imágenes

Prueba preguntando:

> "Genera markdown de ejemplo con una imagen"

**Respuesta esperada:**

![Arquitectura del Sistema](https://ejemplo.com/arquitectura.png)

**Características:**
- ✅ Imagen en tarjeta con border y shadow
- ✅ Descripción en el footer
- ✅ Lazy loading automático

---

## 📋 Ejemplo 5: Listas

### Lista sin orden:
- ✅ Item 1
- ✅ Item 2
- ✅ Item 3

### Lista ordenada:
1. Primer paso
2. Segundo paso
3. Tercer paso

---

## 📝 Ejemplo 6: Citas y Blockquotes

Prueba preguntando:

> "Usa una cita célebre en tu respuesta"

**Respuesta esperada:**

> "La mejor manera de predecir el futuro es inventarlo." - Alan Kay

**Características:**
- ✅ Border azul a la izquierda
- ✅ Background azul claro
- ✅ Texto en itálica

---

## 🎨 Ejemplo 7: Headings

```markdown
# Título Principal (H1)
## Subtítulo (H2)
### Sección (H3)
```

**Características:**
- ✅ H1 con border-bottom
- ✅ Tamaños y pesos diferenciados
- ✅ Colores apropiados

---

## 📎 Fuentes de Contexto Clickables

### En el Desglose de Contexto:

1. Abre el panel "Contexto" (botón arriba del input)
2. Ve la sección "Fuentes de Contexto"
3. Cada fuente activa es **clickable**
4. Al hacer click:
   - ✅ Abre modal con detalles completos
   - ✅ Muestra metadata de extracción
   - ✅ Badge "✓ Validado" si fue aprobada
   - ✅ Permite re-extraer con nueva configuración

### En las Respuestas del Asistente:

El asistente puede crear referencias con formato:

```markdown
[Ver Documento Demo](#source-{id})
```

Al hacer click:
- ✅ Abre modal de la fuente
- ✅ Muestra extracto y metadata
- ✅ Indica si está validada

---

## 🧪 Casos de Prueba

### Test 1: System Prompt con Emojis

**Setup:**
1. Ve a Configuración (menú usuario abajo izquierda)
2. En "Instrucciones del Sistema" escribe: "Utiliza emojis en todas tus respuestas 🎉"
3. Guarda

**Pregunta:**
> "Hola, ¿cómo estás?"

**Resultado esperado:**
> "¡Hola! 👋 Estoy muy bien, gracias por preguntar 😊 ¿En qué puedo ayudarte hoy? 🚀"

---

### Test 2: Logs de Contexto

**Setup:**
1. Haz varias preguntas al asistente
2. Abre el panel "Contexto"
3. Scroll hasta "📊 Log de Contexto por Interacción"

**Verificar:**
- ✅ Tabla con todas las interacciones
- ✅ Hora, pregunta, modelo usado
- ✅ Tokens de input/output
- ✅ Uso de ventana de contexto (%)
- ✅ Click en fila para expandir detalles

---

### Test 3: Código en Respuesta

**Pregunta:**
> "Muéstrame un componente React que use useState"

**Verificar:**
- ✅ Código con syntax highlighting
- ✅ Botón "Copiar" visible al hover
- ✅ Colores apropiados (VSCode Dark)
- ✅ Inline code con background gris

---

### Test 4: Tabla en Respuesta

**Pregunta:**
> "Crea una tabla con 3 productos, sus precios y stock"

**Verificar:**
- ✅ Tabla bien formateada
- ✅ Header con background gris
- ✅ Borders y espaciado correcto
- ✅ Responsive (scroll horizontal si necesario)

---

### Test 5: Fuentes Clickables

**Setup:**
1. Sube un PDF al contexto (ej. "Documento Demo.pdf")
2. Activa la fuente con el toggle
3. Pregunta algo relacionado

**En el Desglose:**
1. Abre panel "Contexto"
2. Ve "Fuentes de Contexto"
3. **Click en la tarjeta verde del documento**

**Verificar:**
- ✅ Se abre modal con detalles
- ✅ Muestra nombre, tipo, tamaño
- ✅ Muestra metadata de extracción
- ✅ Badge "✓ Validado" si aplica
- ✅ Botón "Re-extraer" funcional

**En la Respuesta:**
Si el asistente menciona: `[Ver documento](#source-abc123)`

**Verificar:**
- ✅ Link es clickable
- ✅ Tiene ícono de documento
- ✅ Badge de validación si aplica
- ✅ Click abre modal de detalles

---

## 📈 Beneficios

### Para Usuarios:
- 📖 Respuestas más legibles y profesionales
- 💻 Código copiable con un click
- 🔍 Trazabilidad de fuentes de contexto
- 📊 Visualización de datos en tablas
- 🎨 Formato rico sin perder información

### Para Desarrollo:
- ♻️ Componente reutilizable (`MessageRenderer`)
- 🎯 Tipos bien definidos
- 🛡️ Manejo de errores robusto
- 📦 Librerías estándar (react-markdown)
- 🧪 Fácil de probar y mantener

---

## 🔧 Componentes Técnicos

### MessageRenderer
- **Props:**
  - `content: string` - Markdown a renderizar
  - `contextSources?: Array` - Fuentes disponibles para referencias
  - `onSourceClick?: (id) => void` - Callback para clicks en fuentes

### Plugins Usados:
- **remark-gfm** - GitHub Flavored Markdown (tablas, strikethrough, etc.)
- **rehype-raw** - Permite HTML en Markdown
- **react-syntax-highlighter** - Highlighting de código

### Estilos de Código:
- **vscDarkPlus** - Tema VSCode Dark para syntax highlighting

---

## 📝 Notas Importantes

1. **Markdown solo en respuestas del asistente**: Los mensajes del usuario se muestran como texto plano (por diseño).

2. **Referencias a fuentes**: Formato `#source-{id}` es interno, el usuario no necesita saberlo - el asistente lo usa automáticamente.

3. **Validación de fuentes**: El badge "✓ Validado" solo aparece si `metadata.validated === true`.

4. **Performance**: Componentes optimizados con lazy loading de imágenes y código.

---

## 🚀 Próximos Pasos

- [ ] Agregar soporte para videos embebidos
- [ ] Implementar diff highlighting para código
- [ ] Agregar tabs para múltiples bloques de código
- [ ] Soporte para mermaid diagrams
- [ ] Exportar conversación como PDF con formato

---

**¡Disfruta del nuevo renderizado Markdown enriquecido en Flow!** ✨

