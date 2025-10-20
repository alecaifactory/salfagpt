# Setup Multi-Tenant con Selector de Proyecto

## 🎯 Sistema Actualizado

Ahora usamos un archivo `.env` selector que determina qué configuración cargar.

## 📁 Estructura de Archivos

```
/Users/alec/salfagpt/
├── .env                    # SELECTOR (define CURRENT_PROJECT)
├── .env.aifactory          # Credenciales AI Factory
├── .env.salfacorp          # Credenciales Salfacorp
└── .env.example            # Template (safe to commit)
```

## 📝 Paso 1: Crear .env (Selector)

Crea el archivo `.env` con:

```bash
# ===== PROJECT SELECTOR =====
# Change this to switch between projects
CURRENT_PROJECT=AIFACTORY
# Options: AIFACTORY or SALFACORP

# Env file locations
ENV_SALFACORP=.env.salfacorp
ENV_AIFACTORY=.env.aifactory
```

## 📝 Paso 2: Crear .env.aifactory

Crea `.env.aifactory` con las credenciales de AI Factory:

```bash
# Google Cloud Project - AI Factory
GOOGLE_CLOUD_PROJECT=gen-lang-client-0986191192
GOOGLE_CLOUD_PROJECT_NUMBER=1030147139179

# Google AI API Key (for Gemini)
GOOGLE_AI_API_KEY=tu-api-key-aifactory

# Google OAuth (for login)
GOOGLE_CLIENT_ID=1030147139179-xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxx

# JWT Secret
JWT_SECRET=tu-jwt-secret-aifactory

# Development Server
DEV_PORT=3000

# Application URL
PUBLIC_BASE_URL=http://localhost:3000

# Session Configuration
SESSION_COOKIE_NAME=flow_session
SESSION_MAX_AGE=604800

# Environment
NODE_ENV=development
```

## 📝 Paso 3: Verificar .env.salfacorp

Tu `.env.salfacorp` debe tener:

```bash
# Google Cloud Project - Salfacorp
GOOGLE_CLOUD_PROJECT=salfagpt
GOOGLE_CLOUD_PROJECT_NUMBER=82892384200

# Google AI API Key (for Gemini)
GOOGLE_AI_API_KEY=tu-api-key-salfacorp

# Google OAuth (for login) - DEBE SER DE SALFACORP
GOOGLE_CLIENT_ID=82892384200-xxx.apps.googleusercontent.com  # ← De Salfacorp
GOOGLE_CLIENT_SECRET=GOCSPX-xxx  # ← De Salfacorp

# JWT Secret
JWT_SECRET=tu-jwt-secret-salfacorp

# Development Server
DEV_PORT=3001

# Application URL
PUBLIC_BASE_URL=http://localhost:3001

# Session Configuration
SESSION_COOKIE_NAME=salfagpt_session
SESSION_MAX_AGE=86400

# Environment
NODE_ENV=development

# RAG/Embeddings (sin espacios!)
CHUNK_SIZE=8000
CHUNK_OVERLAP=2000
EMBEDDING_BATCH_SIZE=32
TOP_K=5
EMBEDDING_MODEL=gemini-embedding-001
```

## 🚀 Uso

### Para AI Factory:

1. Edita `.env`:
   ```bash
   CURRENT_PROJECT=AIFACTORY
   ```

2. Inicia servidor:
   ```bash
   npm run dev
   ```

3. Verás:
   ```
   ✅ Loaded environment from: .env.aifactory
   📦 Project: gen-lang-client-0986191192
   🔌 Port: 3000
   ┃ Local    http://localhost:3000/
   ```

### Para Salfacorp:

1. Edita `.env`:
   ```bash
   CURRENT_PROJECT=SALFACORP
   ```

2. Inicia servidor:
   ```bash
   npm run dev
   ```

3. Verás:
   ```
   ✅ Loaded environment from: .env.salfacorp
   📦 Project: salfagpt
   🔌 Port: 3001
   ┃ Local    http://localhost:3001/
   ```

## ✅ Ventajas

- ✅ **Un solo cambio**: Solo editas una línea en `.env`
- ✅ **Credenciales separadas**: Cada tenant tiene su archivo
- ✅ **Automático**: `astro.config.mjs` carga el correcto
- ✅ **Seguro**: Todos los `.env.*` en `.gitignore`
- ✅ **Simple**: No scripts complicados

## 🔒 Seguridad

Todos estos archivos están protegidos en `.gitignore`:
```gitignore
.env
.env.*
!.env.example
```

## 🧪 Verificación

Después de iniciar el servidor, verifica:

```bash
# Check puerto correcto
lsof -i :3000  # AI Factory
lsof -i :3001  # Salfacorp

# Health check
curl http://localhost:3000/api/health/firestore  # AI Factory
curl http://localhost:3001/api/health/firestore  # Salfacorp
```

## ⚠️ Importante

**Para Salfacorp**, asegúrate de que tu `.env.salfacorp` tenga:

1. ✅ OAuth Client ID de Salfacorp (empieza con `82892384200-`)
2. ✅ Sin espacios en variables RAG:
   ```bash
   CHUNK_SIZE=8000          # ✅ Sin espacio
   TOP_K=5                  # ✅ Sin espacio
   ```

---

**Siguiente paso:** Crea el archivo `.env` selector y prueba!

