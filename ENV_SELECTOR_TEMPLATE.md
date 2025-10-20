# Template para .env (Selector de Proyecto)

Crea un archivo `.env` en la raíz con este contenido:

```bash
# ===== PROJECT SELECTOR =====
# Change this to switch between projects
CURRENT_PROJECT=AIFACTORY
# Options: AIFACTORY or SALFACORP

# Env file locations
ENV_SALFACORP=.env.salfacorp
ENV_AIFACTORY=.env.aifactory

# ===== CONFIGURACIÓN =====
# Las variables específicas se cargan automáticamente desde:
# - .env.aifactory (si CURRENT_PROJECT=AIFACTORY)
# - .env.salfacorp (si CURRENT_PROJECT=SALFACORP)
```

## 🔄 Cómo Cambiar de Proyecto

### Para AI Factory (Puerto 3000):
Edita `.env` y cambia:
```bash
CURRENT_PROJECT=AIFACTORY
```

### Para Salfacorp (Puerto 3001):
Edita `.env` y cambia:
```bash
CURRENT_PROJECT=SALFACORP
```

Luego simplemente:
```bash
npm run dev
```

## 📁 Estructura de Archivos

```
/Users/alec/salfagpt/
├── .env                    # Selector (CURRENT_PROJECT)
├── .env.aifactory          # AI Factory credentials
├── .env.salfacorp          # Salfacorp credentials
└── .env.example            # Template (safe to commit)
```

## ✅ Beneficios

- ✅ Un solo archivo para cambiar (`.env`)
- ✅ Credenciales separadas por tenant
- ✅ No necesitas copiar archivos
- ✅ `astro.config.mjs` carga automáticamente el correcto
- ✅ Simple: cambias una línea y reinicias

## 🎯 Workflow

```bash
# 1. Editar .env - cambiar CURRENT_PROJECT=SALFACORP
# 2. npm run dev
# 3. ✅ Servidor en puerto 3001 con credenciales de Salfacorp

# Para cambiar a AI Factory:
# 1. Editar .env - cambiar CURRENT_PROJECT=AIFACTORY
# 2. npm run dev
# 3. ✅ Servidor en puerto 3000 con credenciales de AI Factory
```

