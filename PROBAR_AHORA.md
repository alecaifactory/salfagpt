# 🚀 PROBAR SISTEMA DE PERSISTENCIA - GUÍA RÁPIDA

## ✅ TODO ESTÁ LISTO

He implementado el sistema completo de persistencia en Firestore. Ahora puedes probarlo en 3 pasos:

---

## 📋 Paso 1: Crear Datos de Muestra

```bash
npm run seed:firestore
```

**Esperado:**
```
🌱 Iniciando seeding de datos de muestra en Firestore...

👤 Creando User Settings...
✅ User Settings creado

🤖 Creando Agent Configs...
✅ Agent Config creado: flash-demo
✅ Agent Config creado: pro-demo

⚙️ Creando Workflow Configs...
✅ Workflow Config creado: process-pdf-builder
✅ Workflow Config creado: import-csv-builder
✅ Workflow Config creado: connect-api-builder

📊 Creando Conversation Context...
✅ Conversation Context creado: conv_flash
✅ Conversation Context creado: conv_pro

📝 Creando Usage Logs...
✅ 5 Usage Logs creados

✨ Seeding completado exitosamente!
```

---

## 📋 Paso 2: Verificar Sistema

```bash
npm run verify:persistence
```

**Esperado:**
```
🔍 Verificando sistema de persistencia...

1️⃣  Verificando User Settings...
   ✅ User Settings encontrado
   ✅ Campo 'source' presente: localhost
   
2️⃣  Verificando Agent Configs...
   ✅ Agent Config encontrado: flash-demo
   ✅ Campo 'source' presente: localhost
   
3️⃣  Verificando Workflow Configs...
   ✅ Workflow Config encontrado
   ✅ Campo 'source' presente: localhost
   
4️⃣  Verificando Conversation Context...
   ✅ Conversation Context encontrado
   ✅ Campo 'source' presente: localhost
   
5️⃣  Verificando Usage Logs...
   ✅ 5 Usage Logs encontrados
   
6️⃣  Verificando conversaciones...
   ✅ Conversaciones encontradas

✅ Verificaciones exitosas: 6
❌ Errores encontrados: 0

✨ ¡Sistema de persistencia funcionando correctamente!
```

---

## 📋 Paso 3: Iniciar y Probar

```bash
npm run dev
```

Abre: http://localhost:3000/chat

---

## 🧪 Flujo de Prueba

### 1. Ver Configuración del Usuario
1. Click en tu usuario (abajo izquierda)
2. Click "Configuración"
3. **Deberías ver:** Model: "Gemini Pro" (cargado de Firestore)
4. Cambiar a "Gemini Flash"
5. Guardar
6. **Verificar en console:** `✅ Configuración del usuario guardada en Firestore`

### 2. Crear Nuevo Agente
1. Click "Nuevo Agente"
2. Enviar mensaje: "Hola"
3. **Verificar:** Respuesta usa modelo configurado

### 3. Cambiar Entre Agentes
1. Crear segundo agente
2. Configurar diferente (Pro vs Flash)
3. Cambiar entre agentes
4. **Verificar:** Cada agente mantiene su configuración

### 4. Context Sources
1. Agregar fuente de contexto
2. Activar/desactivar
3. Cambiar de agente
4. Regresar
5. **Verificar:** Estado de context se mantiene

---

## 🔗 Ver en Firestore Console

### Todas las Colecciones:
```
https://console.firebase.google.com/project/gen-lang-client-0986191192/firestore
```

### Colecciones Específicas:

**User Settings:**
```
https://console.firebase.google.com/project/gen-lang-client-0986191192/firestore/data/~2Fuser_settings
```
- Busca documento: `builder`
- Deberías ver: preferredModel, systemPrompt, source: "localhost"

**Agent Configs:**
```
https://console.firebase.google.com/project/gen-lang-client-0986191192/firestore/data/~2Fagent_configs
```
- Busca documentos: `flash-demo`, `pro-demo`
- Deberías ver: model, systemPrompt, temperature, maxOutputTokens

**Conversation Context:**
```
https://console.firebase.google.com/project/gen-lang-client-0986191192/firestore/data/~2Fconversation_context
```
- Busca documentos: `conv_flash`, `conv_pro`
- Deberías ver: activeContextSourceIds[], contextWindowUsage

---

## ✅ Checklist de Verificación

### Backend:
- [ ] `npm run seed:firestore` ejecutado sin errores
- [ ] `npm run verify:persistence` muestra 6 verificaciones exitosas
- [ ] Firestore console muestra datos en 5 colecciones nuevas

### Frontend:
- [ ] Chat carga sin errores
- [ ] User settings se cargan de Firestore
- [ ] User settings se guardan en Firestore
- [ ] Cada agente puede tener configuración diferente
- [ ] Context state persiste al cambiar agentes
- [ ] Recargar página mantiene toda la configuración

### Consola del Navegador:
- [ ] "✅ User Settings cargado desde Firestore"
- [ ] "✅ Configuración del usuario guardada en Firestore"
- [ ] "✅ Agent Config cargado desde Firestore"
- [ ] No hay errores en rojo

---

## 🐛 Troubleshooting

### Error: "Firestore connection failed"
```bash
# Autenticar de nuevo
gcloud auth application-default login
```

### Error: "No user settings found"
```bash
# Re-crear datos de muestra
npm run seed:firestore
```

### Error: "Cannot find module 'tsx'"
```bash
# Instalar dependencias
npm install
```

### Ver logs detallados:
```bash
# En la consola del navegador
Deberías ver logs como:
✅ User Settings cargado desde Firestore
✅ Agent Config cargado desde Firestore
✅ Configuración guardada en Firestore
```

---

## 📝 Lo Que Se Implementó

### Backend (`src/lib/firestore.ts`):
- ✅ 5 nuevas colecciones
- ✅ 15 funciones de persistencia
- ✅ Campo `source` en todos los documentos

### APIs (`src/pages/api/`):
- ✅ `/api/user-settings` (GET/POST)
- ✅ `/api/agent-config` (GET/POST)
- ✅ `/api/workflow-config` (GET/POST)
- ✅ `/api/conversation-context` (GET/POST)

### Frontend (`src/components/ChatInterfaceWorking.tsx`):
- ✅ Reemplazado localStorage por Firestore
- ✅ Carga automática de user settings
- ✅ Carga automática de agent config
- ✅ Todo persiste en Firestore

### Scripts:
- ✅ `npm run seed:firestore` - Crea datos de muestra
- ✅ `npm run verify:persistence` - Verifica sistema

### Documentación:
- ✅ `FIRESTORE_PERSISTENCE_SYSTEM.md` - Técnico completo
- ✅ `PERSISTENCIA_COMPLETA_RESUMEN.md` - Resumen ejecutivo
- ✅ `docs/TESTING_PERSISTENCE_SYSTEM.md` - Guía de testing
- ✅ `docs/QUICK_START_PERSISTENCE.md` - Quick start

---

## 🎉 ¡Listo para Probar!

**Comandos:**
```bash
npm run seed:firestore        # Crear datos
npm run verify:persistence    # Verificar
npm run dev                   # Iniciar
```

**Verificar en:**
- Localhost: http://localhost:3000/chat
- Firestore: https://console.firebase.google.com/project/gen-lang-client-0986191192/firestore

---

**¡Todo está implementado y listo para usar!** 🚀

