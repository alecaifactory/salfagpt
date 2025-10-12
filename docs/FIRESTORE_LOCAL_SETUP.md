# Firestore Local Development Setup

## 🎯 Objetivo

Conectar tu entorno de desarrollo local al Firestore de producción en GCP para que las conversaciones y el estado se guarden correctamente, incluso durante el desarrollo.

---

## ⚡ Quick Start

```bash
# 1. Autenticar con Google Cloud
gcloud auth application-default login

# 2. Configurar proyecto
gcloud config set project YOUR_PROJECT_ID

# 3. Verificar configuración
gcloud config list

# 4. Iniciar servidor de desarrollo
npm run dev
```

✅ **¡Listo!** Tu aplicación local ahora se conecta al Firestore de producción.

---

## 📋 Setup Detallado

### Paso 1: Instalar Google Cloud SDK

Si aún no lo tienes instalado:

**MacOS:**
```bash
brew install --cask google-cloud-sdk
```

**Linux:**
```bash
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
```

**Windows:**
Descarga el instalador desde: https://cloud.google.com/sdk/docs/install

### Paso 2: Inicializar gcloud

```bash
# Inicializar configuración
gcloud init

# Selecciona:
# 1. Tu cuenta de Google
# 2. Tu proyecto GCP (debe coincidir con GOOGLE_CLOUD_PROJECT en .env)
```

### Paso 3: Configurar Application Default Credentials (ADC)

```bash
# Esto abre un navegador para autenticarte
gcloud auth application-default login

# Salida esperada:
# Credentials saved to file: [/Users/you/.config/gcloud/application_default_credentials.json]
```

**¿Qué hace esto?**
- Crea credenciales locales que la aplicación usará automáticamente
- Las guarda en `~/.config/gcloud/application_default_credentials.json`
- Permite que el SDK de Firestore se autentique sin claves de servicio

### Paso 4: Verificar Proyecto

```bash
# Ver proyecto actual
gcloud config get-value project

# Debe coincidir con tu .env:
cat .env | grep GOOGLE_CLOUD_PROJECT

# Si no coincide, configurar:
gcloud config set project YOUR_PROJECT_ID
```

### Paso 5: Verificar Permisos

Tu cuenta de Google necesita estos roles en el proyecto:

```bash
# Ver tus roles actuales
gcloud projects get-iam-policy YOUR_PROJECT_ID \
  --flatten="bindings[].members" \
  --filter="bindings.members:user:YOUR_EMAIL@gmail.com"

# Roles necesarios:
# - roles/datastore.user (para Firestore)
# - roles/firebase.admin (para Firebase)
```

Si no tienes permisos, pídele a un administrador que te los otorgue:

```bash
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="user:YOUR_EMAIL@gmail.com" \
  --role="roles/datastore.user"
```

---

## 🔧 Configuración del .env

Tu archivo `.env` debe tener:

```bash
# Google Cloud Project (REQUERIDO)
GOOGLE_CLOUD_PROJECT=your-project-id-12345

# NO necesitas estas líneas con ADC:
# ❌ GOOGLE_APPLICATION_CREDENTIALS=./service-account.json
# ❌ FIRESTORE_EMULATOR_HOST=localhost:8080

# Otras variables...
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-secret
JWT_SECRET=your-jwt-secret
PUBLIC_BASE_URL=http://localhost:3000
```

---

## ✅ Verificación

### Test 1: Verificar Conexión

```bash
# Iniciar servidor
npm run dev

# Deberías ver en la consola:
# 🔧 Initializing Firestore client...
# 📦 Project ID: your-project-id
# 🌍 Environment: development
# ✅ Firestore client initialized successfully
# 💡 Local dev: Ensure you have run "gcloud auth application-default login"
```

### Test 2: Crear Conversación

1. Abre http://localhost:3000/chat
2. Inicia sesión
3. Crea una nueva conversación ("Nuevo Agente")
4. Envía un mensaje

**Verificar en consola:**
```bash
# Deberías ver logs como:
✅ Conversation created: [conversation-id]
✅ Message saved: [message-id]
💾 Saved context for conversation: [conversation-id]
```

### Test 3: Verificar en Firebase Console

1. Ve a https://console.firebase.google.com/
2. Selecciona tu proyecto
3. Ve a "Firestore Database"
4. Busca la colección `conversations`
5. Deberías ver tu conversación recién creada

---

## 🚨 Troubleshooting

### Error: "Project ID not set"

```bash
❌ GOOGLE_CLOUD_PROJECT is not set!
```

**Solución:**
```bash
# Verificar .env
cat .env | grep GOOGLE_CLOUD_PROJECT

# Si falta, agregar:
echo "GOOGLE_CLOUD_PROJECT=your-project-id" >> .env

# Reiniciar servidor
npm run dev
```

### Error: "Permission denied"

```bash
Error: 7 PERMISSION_DENIED: Missing or insufficient permissions
```

**Solución:**
```bash
# 1. Verificar autenticación
gcloud auth application-default print-access-token

# Si no hay token, re-autenticar:
gcloud auth application-default login

# 2. Verificar proyecto
gcloud config get-value project

# 3. Pedir permisos al admin si es necesario
```

### Error: "Not authenticated"

```bash
Error: Could not load the default credentials
```

**Solución:**
```bash
# Re-ejecutar ADC login
gcloud auth application-default login

# Verificar archivo de credenciales existe
ls -la ~/.config/gcloud/application_default_credentials.json

# Si no existe, el login falló - intenta de nuevo
```

### Error: "Wrong project"

Las conversaciones no aparecen o aparecen conversaciones extrañas.

**Solución:**
```bash
# Verificar proyecto actual
gcloud config get-value project

# Comparar con .env
cat .env | grep GOOGLE_CLOUD_PROJECT

# Deben ser EXACTAMENTE iguales
# Si no, actualizar:
gcloud config set project YOUR_CORRECT_PROJECT_ID

# Reiniciar servidor
npm run dev
```

### Error: "Temporary conversations" (temp-12345...)

Si ves IDs de conversación que empiezan con `temp-`, significa que Firestore no está conectado.

**Diagnóstico:**
```bash
# 1. Ver logs del servidor
# Busca líneas como:
⚠️ Firestore unavailable, creating temporary conversation

# 2. Verificar ADC
gcloud auth application-default print-access-token

# 3. Verificar proyecto
gcloud config list

# 4. Re-autenticar
gcloud auth application-default login
```

---

## 🌐 Production vs Local

| Aspecto | Local Development | Production (Cloud Run) |
|---------|-------------------|------------------------|
| **Auth Method** | Application Default Credentials | Workload Identity |
| **Setup Command** | `gcloud auth application-default login` | Configurado automáticamente |
| **Project** | Configurado en `.env` | Configurado en `.env` |
| **Database** | **MISMO Firestore de producción** | **MISMO Firestore de producción** |
| **Data Persistence** | ✅ Sí - se guarda en GCP | ✅ Sí - se guarda en GCP |

**⚠️ IMPORTANTE**: Local y producción usan la **MISMA base de datos** Firestore. Los datos que crees localmente **aparecerán en producción**.

### Best Practices

1. **Desarrollo aislado**: Considera usar un proyecto de desarrollo separado
2. **Testing**: Usa prefijos en los datos de prueba (e.g., `test-`)
3. **Cleanup**: Elimina datos de prueba regularmente
4. **Backups**: Firestore hace backups automáticos, pero ten cuidado con datos sensibles

---

## 📊 Monitoring

### Ver Conversaciones en Tiempo Real

```bash
# Consola web de Firebase
open https://console.firebase.google.com/project/YOUR_PROJECT_ID/firestore

# O usar gcloud CLI
gcloud firestore databases list --project=YOUR_PROJECT_ID
```

### Ver Logs de la Aplicación

```bash
# Logs del servidor de desarrollo
npm run dev

# Busca estos indicadores:
✅ Firestore client initialized successfully
💾 Saved context for conversation: [id]
🔥 Creating conversation for user: [userId]
```

### Verificar Conexión Programáticamente

Agrega este snippet a tu código para debugging:

```typescript
// En ChatInterface.tsx o cualquier componente
useEffect(() => {
  const testFirestore = async () => {
    try {
      const response = await fetch('/api/conversations?userId=test');
      const data = await response.json();
      console.log('🔍 Firestore test:', data);
      console.log('✅ Connection: OK');
    } catch (error) {
      console.error('❌ Firestore test failed:', error);
    }
  };
  
  testFirestore();
}, []);
```

---

## 🔐 Security Best Practices

### 1. Never Commit Credentials

```bash
# Asegúrate de que .gitignore incluye:
.env
.env.local
.env.*.local
*.json (service account keys)
```

### 2. Use ADC Instead of Service Account Keys

```bash
# ❌ NO HACER:
export GOOGLE_APPLICATION_CREDENTIALS="./service-account-key.json"

# ✅ HACER:
gcloud auth application-default login
```

### 3. Rotate Credentials Regularly

```bash
# Re-generar ADC cada mes
gcloud auth application-default login --force
```

### 4. Limit Permissions

Solo otorga los roles mínimos necesarios:
- `roles/datastore.user` - Para leer/escribir en Firestore
- **NO** uses `roles/owner` o `roles/editor` para desarrollo

---

## 📚 Additional Resources

- [Firestore Documentation](https://cloud.google.com/firestore/docs)
- [Application Default Credentials](https://cloud.google.com/docs/authentication/application-default-credentials)
- [gcloud CLI Reference](https://cloud.google.com/sdk/gcloud/reference)
- [Workload Identity](https://cloud.google.com/kubernetes-engine/docs/how-to/workload-identity)

---

## ✅ Checklist Final

Antes de empezar a desarrollar, verifica:

- [ ] `gcloud auth application-default login` ejecutado
- [ ] `gcloud config set project YOUR_PROJECT_ID` configurado
- [ ] Proyecto en `.env` coincide con proyecto de gcloud
- [ ] Permisos de Firestore otorgados a tu cuenta
- [ ] Servidor inicia sin errores de Firestore
- [ ] Conversaciones se guardan (no tienen prefijo `temp-`)
- [ ] Datos aparecen en Firebase Console

---

**🎉 ¡Felicitaciones!** Ahora tu entorno local está conectado a Firestore en GCP y todas las conversaciones se guardarán correctamente, preparando tu aplicación para producción.

