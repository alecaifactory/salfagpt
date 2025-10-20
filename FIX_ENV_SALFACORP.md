# INSTRUCCIONES: Arreglar .env.salfacorp

## Problemas a Corregir

Tu archivo `.env.salfacorp` tiene estos problemas:

### 1. Espacios en Variables RAG (líneas 26-30)

❌ **INCORRECTO (actual):**
```bash
CHUNK_SIZE= 8000
CHUNK_OVERLAP= 2000
EMBEDDING_BATCH_SIZE= 32
TOP_K = 5
EMBEDDING_MODEL= gemini-embedding-001
```

✅ **CORRECTO (sin espacios):**
```bash
CHUNK_SIZE=8000
CHUNK_OVERLAP=2000
EMBEDDING_BATCH_SIZE=32
TOP_K=5
EMBEDDING_MODEL=gemini-embedding-001
```

### 2. OAuth Client ID (línea 9)

❌ **INCORRECTO (es de AI Factory):**
```bash
GOOGLE_CLIENT_ID=1030147139179-20gjd3cru9jhgmhlkj88majubn2130ic.apps.googleusercontent.com
```

✅ **CORRECTO (debe ser de Salfacorp):**
```bash
# Obtener de: https://console.cloud.google.com/apis/credentials?project=salfagpt
GOOGLE_CLIENT_ID=82892384200-XXXXXXXXXX.apps.googleusercontent.com
```

## 📝 Cómo Arreglar

1. **Abre** `.env.salfacorp` en tu editor
2. **Quita todos los espacios** alrededor de `=` en líneas 26-30
3. **Actualiza** `GOOGLE_CLIENT_ID` con el de Salfacorp (empieza con 82892384200-)
4. **Actualiza** `GOOGLE_CLIENT_SECRET` con el secret de Salfacorp
5. **Guarda** el archivo

## 🚀 Después de Arreglar

```bash
# Copiar a .env
cp .env.salfacorp .env

# Iniciar servidor
npm run dev

# Debería mostrar:
# ┃ Local    http://localhost:3001/
# 📦 Project: salfagpt
```

## 🔑 Dónde Obtener OAuth Credentials de Salfacorp

1. Ve a: https://console.cloud.google.com/apis/credentials?project=salfagpt
2. Busca "OAuth 2.0 Client IDs"
3. Si no existe, crear uno:
   - Type: Web application
   - Authorized redirect URIs: `http://localhost:3001/auth/callback`
4. Copiar Client ID y Secret
5. Actualizar en `.env.salfacorp`

---

**Una vez arreglado, solo necesitas:**
```bash
cp .env.salfacorp .env
npm run dev
```

