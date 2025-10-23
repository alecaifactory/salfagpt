# 🏢 SalfaGPT - Plataforma de Agentes IA para SalfaCorp

**Estado:** ✅ En Producción  
**URL:** https://salfagpt-3snj65wckq-uc.a.run.app  
**Proyecto GCP:** salfagpt  
**Última Actualización:** 2025-10-23  

---

## 🌟 Resumen Ejecutivo

SalfaGPT es una plataforma conversacional de IA diseñada para SalfaCorp, que permite a los usuarios:

- 🤖 **Crear múltiples agentes IA** con diferentes configuraciones
- 📚 **Gestionar contexto documental** (PDFs, Excel, Word, URLs, APIs)
- 💬 **Conversar con IA** usando Gemini 2.5 Flash o Pro
- 🔐 **Autenticación segura** con Google OAuth
- 📊 **Análisis y métricas** de uso y costos

---

## 🚀 Acceso Rápido

### Para Usuarios

**URL de Producción:** https://salfagpt-3snj65wckq-uc.a.run.app

**Cómo Iniciar:**
1. Visita la URL
2. Click en "Continuar con Google"
3. Inicia sesión con tu correo corporativo (`@salfacloud.cl`)
4. ¡Empieza a conversar!

### Para Desarrolladores

**Despliegue Rápido:**
```bash
./deploy-salfagpt-production.sh
```

**Documentación:**
- 📖 [Guía de Producción](docs/PRODUCCION_SALFAGPT_GCP.md) - Completa
- ⚡ [Quickstart](QUICKSTART_PRODUCCION.md) - Despliegue en 3 minutos
- ✅ [Verificación](docs/VERIFICACION_PRODUCCION.md) - Checklist post-despliegue

---

## 🏗️ Arquitectura

```
┌──────────────────────────────────────────────────────┐
│                   ARQUITECTURA                        │
├──────────────────────────────────────────────────────┤
│                                                       │
│  Usuario                                              │
│    ↓                                                  │
│  Cloud Run (salfagpt)                                │
│    ├─→ Astro + React Frontend                        │
│    ├─→ API Routes (Backend)                          │
│    └─→ OAuth 2.0 (Google Sign-In)                    │
│         ↓                                             │
│  Firestore (Database)                                 │
│    ├─ conversations (agentes)                         │
│    ├─ messages (mensajes)                             │
│    ├─ context_sources (documentos)                    │
│    └─ users (usuarios)                                │
│         ↓                                             │
│  Gemini AI (Google)                                   │
│    ├─ gemini-2.5-flash (rápido, económico)          │
│    └─ gemini-2.5-pro (preciso, costoso)             │
│                                                       │
└──────────────────────────────────────────────────────┘
```

---

## 🔐 Configuración de Seguridad

### OAuth 2.0

**Proveedor:** Google Sign-In  
**Client ID:** `82892384200-va003qnnoj9q0jf19j3jf0vects0st9h.apps.googleusercontent.com`  
**Redirect URI:** `https://salfagpt-3snj65wckq-uc.a.run.app/auth/callback`

**Usuarios Autorizados:**
- Dominios permitidos: `@salfacloud.cl`, `@getaifactory.com`
- Control en Firestore: Colección `domains`

### Autenticación de Sesión

**Método:** JWT (JSON Web Tokens)  
**Storage:** HTTP-only cookies  
**Duración:** 24 horas (86400 segundos)  
**Cookie Name:** `salfagpt_session`

### Datos

**Base de Datos:** Google Firestore  
**Región:** us-central1  
**Backup:** Automático (Google Firestore)  
**Encriptación:** At-rest (default de Firestore)

---

## 📋 Variables de Entorno

### Variables Críticas (Obligatorias)

```bash
GOOGLE_CLOUD_PROJECT=salfagpt
GOOGLE_CLIENT_ID=82892384200-va003qnnoj9q0jf19j3jf0vects0st9h.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
GOOGLE_AI_API_KEY=AIzaSyALvlJm5pl5Ygp_P-nM1ey7vWP7E6O4mV0
JWT_SECRET=df45d920393b23177f56675c5bac8d99058b3388be154b620ef2e8eb7ad58dfdaeaa76514fd268837c60bfd616cbf28be65a736818fed62f8a0a90b766e6542f
PUBLIC_BASE_URL=https://salfagpt-3snj65wckq-uc.a.run.app  # En producción
NODE_ENV=production  # En producción
```

### Variables Opcionales (Con Defaults)

```bash
SESSION_COOKIE_NAME=salfagpt_session
SESSION_MAX_AGE=86400
CHUNK_SIZE=8000
CHUNK_OVERLAP=2000
EMBEDDING_BATCH_SIZE=32
TOP_K=5
EMBEDDING_MODEL=gemini-embedding-001
```

---

## 🛠️ Stack Tecnológico

### Frontend
- **Framework:** Astro 5.1.x
- **UI Library:** React 18.3.x
- **Styling:** Tailwind CSS v3.4.17
- **Icons:** Lucide React
- **Markdown:** react-markdown + remark-gfm

### Backend
- **API:** Astro API Routes
- **Runtime:** Node.js 20
- **Auth:** JWT + Google OAuth2
- **Database:** Google Firestore
- **AI:** Google Gemini 2.5 (Flash & Pro)

### Infrastructure
- **Cloud Platform:** Google Cloud Platform (GCP)
- **Hosting:** Cloud Run
- **Region:** us-central1
- **Database:** Firestore (us-central1)
- **Storage:** Cloud Storage (para uploads)

---

## 📊 Métricas y KPIs

### Performance
- **Latencia API:** < 2s (p95)
- **Tiempo de Respuesta AI:** 2-5s (Flash), 5-10s (Pro)
- **Uptime:** > 99.5%

### Costos
- **Cloud Run:** ~$5-20/mes (depende de tráfico)
- **Firestore:** ~$1-5/mes (depende de uso)
- **Gemini AI:** Variable (Flash: $0.075/1M tokens, Pro: $1.25/1M tokens)

### Uso
- **Usuarios Activos:** Monitorear en Firestore
- **Conversaciones:** Colección `conversations`
- **Mensajes:** Colección `messages`
- **Documentos Procesados:** Colección `context_sources`

---

## 🔧 Desarrollo Local

### Setup Inicial

```bash
# 1. Clonar repositorio
git clone <repo-url>
cd salfagpt

# 2. Instalar dependencias
npm install

# 3. Configurar .env (ver archivo .env.example)
cp .env.example .env
# Editar .env con tus valores

# 4. Autenticar con GCP
gcloud auth application-default login

# 5. Configurar proyecto
gcloud config set project salfagpt

# 6. Iniciar servidor
npm run dev
```

### Comandos de Desarrollo

```bash
npm run dev          # Servidor local :3000
npm run build        # Build para producción
npm run type-check   # Verificar TypeScript
```

---

## 📚 Documentación Adicional

### Guías de Usuario
- `docs/MANUAL_USUARIO.md` - Manual de usuario (crear)
- `docs/FAQ.md` - Preguntas frecuentes (crear)

### Guías Técnicas
- `docs/PRODUCCION_SALFAGPT_GCP.md` - **Guía completa de producción** ⭐
- `QUICKSTART_PRODUCCION.md` - Despliegue rápido en 3 minutos
- `docs/VERIFICACION_PRODUCCION.md` - Checklist de verificación

### Troubleshooting
- `docs/OAUTH_TROUBLESHOOTING.md` - Solución de problemas OAuth
- `docs/FIRESTORE_ISSUES.md` - Problemas de Firestore
- `docs/GEMINI_ERRORS.md` - Errores de Gemini AI

---

## 🤝 Soporte

### Para Usuarios
**Email:** soporteia@salfagestion.cl  
**Descripción:** Soporte para problemas de uso de la plataforma

### Para Desarrolladores
**Repository:** (agregar URL de GitHub)  
**Issues:** (agregar URL de issues)  
**Technical Lead:** Alec (alec@salfacloud.cl)

---

## 📝 Changelog

### 2025-10-23
- ✅ OAuth completamente funcional en producción
- ✅ Todas las variables de entorno configuradas correctamente
- ✅ Documentación de producción actualizada
- ✅ Script de despliegue automático creado

### 2025-10-22
- ✅ Sistema de compartir agentes implementado
- ✅ Optimizaciones de BigQuery
- ✅ Mejoras en UI de contexto

### 2025-10-21
- ✅ Índices de Firestore optimizados
- ✅ Sistema de folders mejorado

---

## 🎯 Roadmap

### Corto Plazo (1-2 semanas)
- [ ] Panel de analytics para usuarios
- [ ] Exportar conversaciones como PDF
- [ ] Notificaciones por email

### Mediano Plazo (1-2 meses)
- [ ] API pública para integraciones
- [ ] Mobile app (iOS/Android)
- [ ] Soporte multiidioma

### Largo Plazo (3-6 meses)
- [ ] Fine-tuning de modelos personalizados
- [ ] Marketplace de agentes
- [ ] Integraciones con Slack/Teams

---

## ⚖️ Licencia

Uso interno de SalfaCorp. Todos los derechos reservados.

---

**Versión:** 1.0.0  
**Última Actualización:** 2025-10-23  
**Mantenido por:** GetAI Factory

