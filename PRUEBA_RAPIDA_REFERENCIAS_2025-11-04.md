# ⚡ Prueba Rápida: Referencias para Usuario No-Admin

**Objetivo:** Verificar que usuario no-admin VE referencias en respuestas del agente M3

**Tiempo:** 2 minutos

---

## 🧪 Pasos de la Prueba

### 1. Login como Usuario No-Admin

- URL: `http://localhost:3000/chat`
- Usuario: Cualquier usuario que NO sea admin
- Ejemplo: `user@demo.com`, `expert@demo.com`, `hello@getaifactory.com`

---

### 2. Seleccionar Agente M3

- Buscar en sidebar izquierdo: "GOP GPT M3"
- Click para seleccionar
- Esperar que se carguen mensajes existentes

---

### 3. Abrir DevTools (IMPORTANTE)

- Presionar F12 (o Cmd+Option+I en Mac)
- Ir a pestaña "Console"
- Dejar abierta para ver logs

---

### 4. Enviar Mensaje NUEVO

**Escribir en el input:**
```
¿Qué procedimientos están asociados al plan de calidad?
```

**Presionar Enviar**

---

### 5. Observar Respuesta del AI

#### ✅ LO QUE DEBES VER:

**En la respuesta del AI:**
- Badges inline: `[1]`, `[2]`, `[3]` dentro del texto
- Footer al final: "📚 Referencias utilizadas (5)" o similar
- Click para expandir

**En la consola:**
```
📚 Built 5 references from RAG results
📚 MessageRenderer received references: 5
  [1] SSOMA.pdf - 87.0% - Chunk #23
  [2] Manual.pdf - 73.0% - Chunk #45
  ...
```

---

#### ❌ SI NO VES REFERENCIAS:

**Revisar consola:**
- ¿Aparece "No chunks found"?
- ¿Aparece "No chunks above similarity threshold"?
- ¿Aparece "No messages with references found"?

**Verificar:**
- ¿Hay fuentes de contexto activas? (toggles verdes en panel izquierdo)
- ¿El mensaje es relevante a los documentos?
- ¿Los documentos están indexados?

---

### 6. Refrescar Página

- Presionar F5
- Volver a seleccionar agente M3
- Scroll al último mensaje (el que acabas de enviar)

#### ✅ LO QUE DEBES VER:

**Referencias persisten:**
- Badges `[1]`, `[2]` siguen visibles
- Footer sigue presente
- Puedes hacer click y abrir panel

**En consola:**
```
📥 [LOAD MESSAGES] Received 11 messages
📚 Loaded 1 messages with references  ← Tu mensaje nuevo
  Message msg-abc123: 5 references
```

---

## 🎯 Resultado Esperado

### ✅ ÉXITO: Referencias Funcionan

```
1. Usuario no-admin envía mensaje
2. AI responde con referencias [1], [2], [3]
3. Footer muestra "📚 Referencias utilizadas"
4. Puede expandir y ver detalles
5. Puede hacer click en badges
6. Después de refresh → Referencias persisten
```

### ❌ FALLO: Referencias No Aparecen

**Si el mensaje NUEVO no tiene referencias:**
1. Captura screenshot de la respuesta (sin referencias)
2. Copia los logs de consola
3. Verifica:
   - ¿Hay fuentes activas?
   - ¿RAG se ejecutó?
   - ¿Se construyeron referencias?
4. Reporta con evidencia

---

## 📸 Comparación Visual

### Admin (Funcionando):
```
╔══════════════════════════════════════════╗
║ SalfaGPT:                                ║
║                                          ║
║ El procedimiento es Trazabilidad [1],    ║
║ Certificados [2] y Ensayos [3].          ║
║                                          ║
║ ──────────────────────────────────────   ║
║ 📚 Referencias utilizadas (3) ▼          ║
╚══════════════════════════════════════════╝
```

### No-Admin (Esperado IGUAL):
```
╔══════════════════════════════════════════╗
║ SalfaGPT:                                ║
║                                          ║
║ El procedimiento es Trazabilidad [1],    ║
║ Certificados [2] y Ensayos [3].          ║
║                                          ║
║ ──────────────────────────────────────   ║
║ 📚 Referencias utilizadas (3) ▼          ║
╚══════════════════════════════════════════╝
```

### No-Admin (SI FALLA):
```
╔══════════════════════════════════════════╗
║ SalfaGPT:                                ║
║                                          ║
║ El procedimiento es Trazabilidad,        ║
║ Certificados y Ensayos.                  ║
║                                          ║
║ (Sin badges [1], [2], [3])              ║
║ (Sin footer de referencias)              ║
╚══════════════════════════════════════════╝
```

---

## 💡 Nota Importante

**Mensajes antiguos NO tendrán referencias:**
- Sistema implementado el 2025-11-04
- Mensajes creados antes de esa fecha están en Firestore sin campo `references`
- Esto es NORMAL y esperado
- Solo mensajes NUEVOS tendrán referencias

**Para probar correctamente:**
- ✅ Enviar mensaje NUEVO
- ✅ Verificar respuesta NUEVA tiene referencias
- ❌ NO esperar referencias en mensajes antiguos

---

## 🚀 Ejecuta Esta Prueba Ahora

1. Usuario no-admin → Login
2. Seleccionar agente M3
3. DevTools → Console
4. Enviar mensaje nuevo
5. Verificar referencias aparecen
6. Refresh y verificar persisten

**Tiempo total:** ~2 minutos

**Si funciona:** ✅ Sistema correcto, solo mensajes antiguos no tienen referencias  
**Si NO funciona:** 🚨 Reportar con logs y screenshots

---

**Última Actualización:** 2025-11-04  
**Creado por:** Alec (Cursor AI Assistant)  
**Propósito:** Diagnóstico rápido de referencias para no-admin





