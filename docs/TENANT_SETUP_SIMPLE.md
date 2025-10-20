# Configuración Simple Multi-Tenant

## Problema Actual

El servidor necesita leer variables de entorno, pero:
- `loadEnv` de Vite solo lee archivos `.env`
- No puede leer `.env.salfacorp` o `.env.aifactory` directamente
- Las variables tienen espacios que causan errores en `source`

## ✅ Solución Simple

**Para AI Factory:**
```bash
# Copiar .env de AI Factory
cp .env.aifactory .env   # Si tienes .env.aifactory
# O usar .env directamente
npm run dev
# → Puerto 3000
```

**Para Salfacorp:**
```bash
# Copiar .env de Salfacorp
cp .env.salfacorp .env
npm run dev
# → Puerto 3001
```

## 📝 Archivos Necesarios

Crear estos archivos (NO commitear):
- `.env` - Se usa para desarrollo (copia de tenant activo)
- `.env.aifactory` - Credenciales AI Factory (backup)
- `.env.salfacorp` - Credenciales Salfacorp (backup)

## ⚠️ Problema Actual con .env.salfacorp

El archivo `.env.salfacorp` tiene:
- ✅ GOOGLE_CLOUD_PROJECT=salfagpt
- ✅ DEV_PORT=3001
- ✅ PUBLIC_BASE_URL=http://localhost:3001
- ❌ GOOGLE_CLIENT_ID=1030147139179-... (es de AI Factory!)

Necesitas OAuth Client ID de Salfacorp:
https://console.cloud.google.com/apis/credentials?project=salfagpt

Buscar o crear OAuth 2.0 Client ID que empiece con: 82892384200-
