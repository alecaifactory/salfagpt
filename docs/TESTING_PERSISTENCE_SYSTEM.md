# Guía de Testing del Sistema de Persistencia Completa

## 🎯 Objetivo

Esta guía te ayudará a probar el nuevo sistema de persistencia completa en Firestore que incluye:
- ✅ User Settings (configuración global del usuario)
- ✅ Agent Configs (configuración por conversación/agente)
- ✅ Workflow Configs (configuración de workflows)
- ✅ Conversation Context (contexto activo por conversación)
- ✅ Usage Logs (registro de uso)

---

## 🚀 Setup Rápido

### 1. Autenticación con Firestore

```bash
# Autenticar con Google Cloud
gcloud auth application-default login

# Verificar proyecto
gcloud config get-value project
# Debe mostrar: gen-lang-client-0986191192
```

### 2. Crear Datos de Muestra

```bash
# Ejecutar script de seeding
npx tsx scripts/seed-firestore-data.ts
```

**Output esperado:**
```
🌱 Iniciando seeding de datos de muestra en Firestore...

👤 Creando User Settings...
✅ User Settings creados: { userId: 'builder', model: 'gemini-2.5-pro', source: 'localhost' }

💬 Obteniendo conversaciones existentes...
📊 Encontradas X conversaciones

🤖 Creando Agent Configs...
  ✅ Agent Config creado para conversación: abc12345...

⚙️ Creando Workflow Configs...
  ✅ Workflow Config creado: Extracción de PDF
  ✅ Workflow Config creado: Análisis de CSV
  ✅ Workflow Config creado: Scraping Web

📚 Creando Conversation Context...
  ✅ Conversation Context creado para: abc12345...

📊 Creando Usage Logs...
  ✅ Usage Log: create_conversation
  ✅ Usage Log: send_message
  ✅ Usage Log: add_context_source

✅ ¡Seeding completado exitosamente!
```

### 3. Iniciar Servidor Local

```bash
npm run dev
```

---

## 🧪 Tests Manuales

### Test 1: User Settings

**Objetivo:** Verificar que la configuración del usuario se carga y guarda correctamente.

**Pasos:**
1. Abrir http://localhost:3000/chat
2. Hacer clic en el menú del usuario (abajo izquierda)
3. Seleccionar "Configuración"
4. Cambiar modelo a "Gemini 2.5 Pro"
5. Modificar el system prompt
6. Guardar

**Verificación:**
```bash
# Opción 1: Ver logs en consola del navegador
# Buscar: "✅ Configuración del usuario guardada en Firestore: gemini-2.5-pro"

# Opción 2: Ver en Firestore Console
# https://console.firebase.google.com/project/gen-lang-client-0986191192/firestore
# Navegar a: user_settings > builder
```

**Resultado esperado:**
- ✅ Logs muestran guardado exitoso
- ✅ Documento en `user_settings/builder` existe
- ✅ Campo `source` = "localhost"
- ✅ `preferredModel` y `systemPrompt` actualizados
- ✅ Al recargar página, configuración se mantiene

---

### Test 2: Agent Config (Configuración por Agente)

**Objetivo:** Verificar que cada agente puede tener su propia configuración.

**Pasos:**
1. Crear nuevo agente (botón "Nuevo Agente")
2. Enviar un mensaje con configuración Flash
3. Abrir configuración y cambiar a Pro
4. Crear otro agente
5. Este nuevo agente debe usar la configuración global (Pro)
6. Cambiar al primer agente
7. Verificar que mantiene su configuración Flash

**Verificación:**
```bash
# Ver en Firestore Console
# https://console.firebase.google.com/project/gen-lang-client-0986191192/firestore
# Navegar a: agent_configs
# Debe haber un documento por conversación
```

**Resultado esperado:**
- ✅ Cada agente tiene su propia entrada en `agent_configs`
- ✅ Cambiar entre agentes carga la configuración correcta
- ✅ Logs muestran: "✅ Configuración del agente cargada: gemini-2.5-flash"
- ✅ Campo `source` = "localhost"

---

### Test 3: Conversation Context

**Objetivo:** Verificar que el contexto activo se guarda por conversación.

**Pasos:**
1. En Agente 1: Activar fuente de contexto "Documento Demo.pdf"
2. Crear Agente 2: No activar ninguna fuente
3. Volver a Agente 1
4. Verificar que "Documento Demo.pdf" sigue activo
5. Ir a Agente 2
6. Verificar que no hay fuentes activas

**Verificación:**
```bash
# Ver en Firestore Console
# Navegar a: conversation_context
# Debe haber un documento por conversación con contexto activo
```

**Resultado esperado:**
- ✅ Cada conversación mantiene su propio estado de contexto
- ✅ `activeContextSourceIds` refleja las fuentes activadas
- ✅ `contextWindowUsage` se actualiza con el uso
- ✅ Campo `source` = "localhost"

---

### Test 4: Workflow Configs

**Objetivo:** Verificar que las configuraciones de workflow se guardan.

**Pasos:**
1. Hacer clic en panel de Workflows (derecha)
2. Seleccionar "Procesar PDF"
3. Hacer clic en ⚙️ (configurar)
4. Cambiar modelo a Pro
5. Modificar tamaño máximo de archivo
6. Guardar configuración
7. Recargar página
8. Abrir configuración de "Procesar PDF"
9. Verificar que los cambios persisten

**Verificación:**
```bash
# Ver en Firestore Console
# Navegar a: workflow_configs
# Filtrar por userId = 'builder'
```

**Resultado esperado:**
- ✅ Documento en `workflow_configs` con configuración guardada
- ✅ Configuración persiste después de recargar
- ✅ Campo `source` = "localhost"

---

### Test 5: Usage Logs

**Objetivo:** Verificar que las acciones del usuario se registran.

**Pasos:**
1. Realizar varias acciones:
   - Crear conversación
   - Enviar mensaje
   - Cambiar modelo
   - Activar/desactivar fuente de contexto
2. Ver logs en consola

**Verificación:**
```bash
# Ver en Firestore Console
# Navegar a: usage_logs
# Filtrar por userId = 'builder'
# Ordenar por timestamp DESC
```

**Resultado esperado:**
- ✅ Cada acción tiene una entrada en `usage_logs`
- ✅ `action` describe la acción realizada
- ✅ `details` contiene información adicional
- ✅ Campo `source` = "localhost"
- ✅ `timestamp` es reciente

---

## 🔍 Verificación en Firestore Console

### URLs Directas

**Todas las colecciones:**
https://console.firebase.google.com/project/gen-lang-client-0986191192/firestore/data

**Colecciones específicas:**
- User Settings: https://console.firebase.google.com/project/gen-lang-client-0986191192/firestore/data/~2Fuser_settings
- Agent Configs: https://console.firebase.google.com/project/gen-lang-client-0986191192/firestore/data/~2Fagent_configs
- Workflow Configs: https://console.firebase.google.com/project/gen-lang-client-0986191192/firestore/data/~2Fworkflow_configs
- Conversation Context: https://console.firebase.google.com/project/gen-lang-client-0986191192/firestore/data/~2Fconversation_context
- Usage Logs: https://console.firebase.google.com/project/gen-lang-client-0986191192/firestore/data/~2Fusage_logs

### Qué buscar en cada colección:

#### user_settings
- **Document ID**: `builder` (o tu userId)
- **Campos esperados**:
  - `userId`: "builder"
  - `preferredModel`: "gemini-2.5-flash" o "gemini-2.5-pro"
  - `systemPrompt`: (string con instrucciones)
  - `language`: "es"
  - `createdAt`: (timestamp)
  - `updatedAt`: (timestamp)
  - `source`: "localhost" o "production"

#### agent_configs
- **Document ID**: `{conversationId}_config`
- **Campos esperados**:
  - `conversationId`: (ID de conversación)
  - `userId`: "builder"
  - `model`: "gemini-2.5-flash" o "gemini-2.5-pro"
  - `systemPrompt`: (string)
  - `temperature`: 0.7
  - `maxOutputTokens`: 8192
  - `createdAt`: (timestamp)
  - `updatedAt`: (timestamp)
  - `source`: "localhost" o "production"

#### workflow_configs
- **Document ID**: Auto-generado
- **Campos esperados**:
  - `userId`: "builder"
  - `workflowType`: "extract-pdf", "parse-csv", etc.
  - `config`: (objeto con configuración)
  - `createdAt`: (timestamp)
  - `updatedAt`: (timestamp)
  - `source`: "localhost" o "production"

#### conversation_context
- **Document ID**: `{conversationId}_context`
- **Campos esperados**:
  - `conversationId`: (ID de conversación)
  - `userId`: "builder"
  - `activeContextSourceIds`: (array de IDs)
  - `contextWindowUsage`: (número 0-100)
  - `createdAt`: (timestamp)
  - `updatedAt`: (timestamp)
  - `source`: "localhost" o "production"

#### usage_logs
- **Document ID**: Auto-generado
- **Campos esperados**:
  - `userId`: "builder"
  - `action`: (string describiendo acción)
  - `details`: (objeto con información adicional)
  - `timestamp`: (timestamp)
  - `source`: "localhost" o "production"

---

## 🐛 Troubleshooting

### Error: "Firestore: Missing or insufficient permissions"

**Solución:**
```bash
# Re-autenticar
gcloud auth application-default login

# Verificar proyecto
gcloud config get-value project
```

### Error: "Cannot find module '@google-cloud/firestore'"

**Solución:**
```bash
npm install @google-cloud/firestore
```

### No se ven datos en Firestore

**Posibles causas:**
1. No ejecutaste el script de seeding
2. Firestore rules están muy restrictivas
3. Proyecto GCP incorrecto

**Solución:**
```bash
# 1. Ejecutar seeding
npx tsx scripts/seed-firestore-data.ts

# 2. Verificar proyecto
echo $GOOGLE_CLOUD_PROJECT
# Debe ser: gen-lang-client-0986191192

# 3. Ver logs en consola del navegador
# Buscar errores 403 (Forbidden) o 401 (Unauthorized)
```

### Datos no se guardan desde localhost

**Verificar:**
1. Servidor corriendo (`npm run dev`)
2. APIs respondiendo correctamente
3. Campo `source` debe ser "localhost"

**Logs esperados en consola del navegador:**
```
⚙️ Cargando configuración del usuario desde Firestore...
✅ Configuración del usuario cargada: gemini-2.5-pro
💾 Guardando configuración del usuario en Firestore...
✅ Configuración del usuario guardada en Firestore: gemini-2.5-pro
```

---

## 📊 Queries de Verificación

### Ver todos los datos de localhost

```javascript
// En Firestore Console > Query
where: source == "localhost"
```

### Ver últimos usage logs

```javascript
// En usage_logs collection
order by: timestamp desc
limit: 10
```

### Ver configs por usuario

```javascript
// En cualquier colección con userId
where: userId == "builder"
```

---

## ✅ Checklist de Validación Completa

- [ ] User Settings se cargan al abrir /chat
- [ ] User Settings se guardan al modificar configuración
- [ ] User Settings persisten después de recargar página
- [ ] Agent Config se carga al cambiar de conversación
- [ ] Cada agente mantiene su propia configuración
- [ ] Conversation Context se carga al cambiar de agente
- [ ] Context sources activas persisten por conversación
- [ ] Workflow Config se carga al abrir configuración
- [ ] Workflow Config persiste después de guardar
- [ ] Usage Logs se crean al realizar acciones
- [ ] Todos los documentos tienen campo `source` = "localhost"
- [ ] Firestore Console muestra todos los datos
- [ ] No hay errores en consola del navegador
- [ ] No hay errores en logs del servidor

---

## 🎉 Resultado Final

Si todos los tests pasan:
- ✅ Sistema de persistencia completo funcionando
- ✅ Todos los datos guardados en Firestore
- ✅ Tracking de source (localhost/production) activo
- ✅ APIs integradas correctamente
- ✅ UI sincronizada con backend

**¡Listo para usar en producción!** 🚀

