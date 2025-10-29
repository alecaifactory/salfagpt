# Feedback System - Quick Start Guide

**Para:** Testing y primeras interacciones  
**Tiempo:** 5 minutos

---

## 🚀 Testing Rápido

### Como Usuario Experto (Purple)

```bash
# 1. Login como admin/expert
# Email: alec@getaifactory.com

# 2. Ve a cualquier agente y envía mensaje
"Explícame cómo funcionas"

# 3. Espera respuesta del agente

# 4. Click botón PURPLE "Experto" bajo la respuesta

# 5. En el modal:
   - Selecciona: ⭐ Sobresaliente
   - NPS: 9
   - CSAT: 5
   - Notas: "Excelente explicación, muy clara"
   - [Opcional] Click "Capturar Pantalla"
     → Dibuja un círculo
     → Agrega texto
     → Confirma
   - Click "Enviar Feedback"

# 6. Verás: "Feedback enviado. Ticket creado: ticket-xyz"

# 7. Abre backlog:
   - User menu (abajo-izquierda)
   - Click "Backlog de Feedback"
   - Ve tu ticket en la lista
```

### Como Usuario Estándar (Violet-Yellow)

```bash
# 1. Login como usuario normal

# 2. Envía mensaje al agente
"¿Qué es Salfa?"

# 3. Espera respuesta

# 4. Click botón GRADIENT "Calificar" bajo la respuesta

# 5. En el modal:
   - Selecciona: ⭐⭐⭐⭐ (4 estrellas)
   - Comentario: "Muy útil, gracias"
   - Click "Enviar"

# 6. Verás confirmación

# 7. Ticket creado (visible para admins en backlog)
```

---

## 🎨 Visual Guide

### Dónde están los botones

```
┌─────────────────────────────────────┐
│ SalfaGPT:                     [Copy]│
├─────────────────────────────────────┤
│                                     │
│ Aquí está la respuesta del agente... │
│ (Contenido con Markdown)             │
│                                     │
├─────────────────────────────────────┤ ← Nueva sección
│ ¿Te fue útil esta respuesta?        │
│                                     │
│  [👑 Experto]    [⭐ Calificar]     │
│   (Purple)       (Violet-Yellow)    │
└─────────────────────────────────────┘
```

### Feedback Expert

```
Purple theme, profesional
┌────────────────────────┐
│ 👑 Feedback Experto    │
├────────────────────────┤
│ [❌] [✔️] [⭐]         │
│  Inac  Acep  Sobre     │
│                        │
│ NPS: [0-10 scale]      │
│ CSAT: [1-5 scale]      │
│ Notas: [textarea]      │
│ 📸 Capturas: [button]  │
│                        │
│    [Cancelar] [Enviar] │
└────────────────────────┘
```

### Feedback Usuario

```
Violet-yellow gradient, friendly
┌────────────────────────┐
│ ⭐ Tu Opinión Importa  │
├────────────────────────┤
│                        │
│  ★ ★ ★ ★ ★             │
│ (Click para calificar)  │
│                        │
│ Comentario: [textarea] │
│ 📸 Captura: [button]   │
│                        │
│    [Cancelar] [Enviar] │
└────────────────────────┘
```

---

## 🎯 Screenshot Annotator

### Cómo usar

```
1. Click "Capturar Pantalla" en modal de feedback
2. Annotator abre en pantalla completa
3. Selecciona herramienta:
   ⭕ Círculo - Click centro, arrastra
   ▭ Rectángulo - Click esquina, arrastra
   ➡️ Flecha - Click inicio, arrastra a fin
   📝 Texto - Click posición, escribe

4. Selecciona color (5 opciones)
5. Dibuja múltiples anotaciones
6. [Opcional] Click "Deshacer" para última
7. [Opcional] Click "Limpiar Todo"
8. Click "Confirmar"
9. Screenshot aparece en modal de feedback
```

### Ejemplo de uso

```
Quieres señalar un botón que no funciona:

1. Herramienta: Círculo
2. Color: Red
3. Dibuja círculo alrededor del botón
4. Herramienta: Texto
5. Click al lado del círculo
6. Escribe: "Este botón no responde"
7. Confirmar
8. Listo! Anotación guardada
```

---

## 🔍 Verificación

### En Firestore Console

```
1. Ir a: console.firebase.google.com
2. Proyecto: gen-lang-client-0986191192
3. Firestore Database
4. Buscar colecciones:
   - message_feedback → Ver feedbacks
   - feedback_tickets → Ver tickets
```

### En Backlog

```
1. Login como admin
2. User menu → "Backlog de Feedback"
3. Deberías ver:
   - Stats cards con números
   - Lista de tickets
   - Filtros funcionando
   - Tickets expandibles
```

---

## ⚡ Testing Checklist Rápido

**Basic Flow (2 min):**
- [ ] Envía mensaje
- [ ] Click feedback button
- [ ] Llena rating
- [ ] Submit
- [ ] Ve confirmación
- ✅ DONE!

**Complete Flow (5 min):**
- [ ] Envía mensaje
- [ ] Click feedback (expert o user)
- [ ] Llena todos los campos
- [ ] Captura pantalla
- [ ] Dibuja 2-3 anotaciones
- [ ] Submit
- [ ] Abre backlog (si admin)
- [ ] Encuentra ticket
- [ ] Expande detalles
- [ ] Ve screenshot anotado
- ✅ DONE!

---

## 🐛 Troubleshooting

### "No veo botones de feedback"
→ Verifica que mensaje es del asistente (no tuyo)  
→ Verifica que no esté en streaming  
→ Verifica imports en ChatInterfaceWorking.tsx

### "Modal no abre"
→ Check console para errores  
→ Verifica estado `showExpertFeedback` o `showUserFeedback`  
→ Click en botón correcto

### "Screenshot no captura"
→ Usa navegador moderno (Chrome/Firefox)  
→ Check permisos de pantalla  
→ Ver console para errores Canvas

### "Ticket no aparece en backlog"
→ Verifica rol es admin/expert  
→ Check Firestore: feedback_tickets collection  
→ Refresh backlog dashboard

---

## 🎉 ¡Listo para Usar!

El sistema está completamente implementado y listo para testing.

**Feedback bienvenido** sobre el sistema de feedback 😄

---

**Docs completas:**
- `docs/features/FEEDBACK_SYSTEM_2025-10-29.md`
- `docs/features/FEEDBACK_DEPLOYMENT_GUIDE.md`
- `docs/FEEDBACK_SYSTEM_SUMMARY.md`
- Este archivo: `docs/FEEDBACK_QUICK_START.md`

