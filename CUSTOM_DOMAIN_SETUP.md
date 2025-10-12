# 🌐 Custom Domain Setup - Cloud Run

## Mejor Solución: Domain Mapping en Cloud Run

### ✅ Beneficios
- URL fija y profesional (ej: `chat.salfacorp.com`)
- SSL automático gestionado por Google
- No requiere Load Balancer adicional
- Configuración simple en ~15 minutos
- OAuth URIs permanecen constantes

---

## 📋 Configuración Rápida

### Paso 1: Verificar Dominio
```bash
# Ve a: https://console.cloud.google.com/apis/credentials/domainverification
# Agrega tu dominio y sigue las instrucciones
```

### Paso 2: Crear Domain Mapping
```bash
gcloud run domain-mappings create \
  --service flow-chat \
  --domain chat.salfacorp.com \
  --region us-central1 \
  --project gen-lang-client-0986191192
```

### Paso 3: Configurar DNS
Agrega estos A records en tu DNS provider:
```
chat    A    216.239.32.21
chat    A    216.239.34.21
chat    A    216.239.36.21
chat    A    216.239.38.21
```

### Paso 4: Actualizar OAuth
```
https://chat.salfacorp.com
https://chat.salfacorp.com/auth/callback
```

---

## 💰 Costos
- Dominio: $10-15/año
- Cloud Run: $10-30/mes
- SSL: $0 (incluido)
**Total: ~$12-18/mes**

---

**Dominios sugeridos:**
- `chat.salfacorp.com` ⭐
- `flow.getaifactory.com`
- `ai.salfacorp.com`
