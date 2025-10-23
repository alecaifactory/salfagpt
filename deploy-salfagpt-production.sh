#!/bin/bash
# Script de Despliegue a Producción - SalfaGPT
# Proyecto: salfagpt
# Última actualización: 2025-10-23

set -e  # Exit on error

echo "🚀 Desplegando SalfaGPT a Producción"
echo "===================================="
echo ""

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuración
PROJECT_ID="salfagpt"
REGION="us-central1"
SERVICE_NAME="salfagpt"

# Verificar autenticación
echo "🔐 Verificando autenticación..."
if ! gcloud auth list --filter="status:ACTIVE" | grep -q "@"; then
  echo "❌ No estás autenticado con gcloud"
  echo "Ejecuta: gcloud auth login"
  exit 1
fi
echo -e "${GREEN}✅ Autenticado${NC}"
echo ""

# Configurar proyecto
echo "🔧 Configurando proyecto..."
gcloud config set project $PROJECT_ID
echo -e "${GREEN}✅ Proyecto: $PROJECT_ID${NC}"
echo ""

# Verificar build local
echo "🏗️  Verificando build local..."
if ! npm run build > /dev/null 2>&1; then
  echo "❌ Error en build local"
  echo "Ejecuta: npm run build"
  exit 1
fi
echo -e "${GREEN}✅ Build exitoso${NC}"
echo ""

# Cargar variables del .env
echo "📄 Cargando variables del .env..."
if [ ! -f .env ]; then
  echo "❌ Archivo .env no encontrado"
  exit 1
fi

# Leer variables del .env
GOOGLE_CLIENT_ID=$(grep "^GOOGLE_CLIENT_ID=" .env | cut -d '=' -f2)
GOOGLE_CLIENT_SECRET=$(grep "^GOOGLE_CLIENT_SECRET=" .env | cut -d '=' -f2)
GOOGLE_AI_API_KEY=$(grep "^GOOGLE_AI_API_KEY=" .env | cut -d '=' -f2)
JWT_SECRET=$(grep "^JWT_SECRET=" .env | cut -d '=' -f2)

# Verificar que todas las variables existen
if [ -z "$GOOGLE_CLIENT_ID" ] || [ -z "$GOOGLE_CLIENT_SECRET" ] || [ -z "$GOOGLE_AI_API_KEY" ] || [ -z "$JWT_SECRET" ]; then
  echo "❌ Faltan variables en .env"
  echo "Verifica que existan:"
  echo "  - GOOGLE_CLIENT_ID"
  echo "  - GOOGLE_CLIENT_SECRET"
  echo "  - GOOGLE_AI_API_KEY"
  echo "  - JWT_SECRET"
  exit 1
fi

echo -e "${GREEN}✅ Variables cargadas del .env${NC}"
echo ""

# Desplegar
echo "🚀 Desplegando a Cloud Run..."
echo ""

gcloud run deploy $SERVICE_NAME \
  --source . \
  --project=$PROJECT_ID \
  --region=$REGION \
  --platform=managed \
  --allow-unauthenticated \
  --min-instances=0 \
  --max-instances=10 \
  --memory=1Gi \
  --cpu=1 \
  --timeout=300 \
  --update-env-vars="GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID,GOOGLE_CLIENT_SECRET=$GOOGLE_CLIENT_SECRET,PUBLIC_BASE_URL=https://salfagpt-3snj65wckq-uc.a.run.app,NODE_ENV=production,GOOGLE_CLOUD_PROJECT=$PROJECT_ID,JWT_SECRET=$JWT_SECRET,GOOGLE_AI_API_KEY=$GOOGLE_AI_API_KEY"

echo ""
echo -e "${GREEN}✅ Despliegue completo!${NC}"
echo ""

# Verificar salud
echo "🧪 Verificando salud del servicio..."
sleep 3
HEALTH_STATUS=$(curl -s https://salfagpt-3snj65wckq-uc.a.run.app/api/health/firestore | jq -r '.status' 2>/dev/null || echo "error")

if [ "$HEALTH_STATUS" = "healthy" ]; then
  echo -e "${GREEN}✅ Servicio saludable${NC}"
else
  echo -e "${YELLOW}⚠️  No se pudo verificar salud (puede estar iniciando)${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}🌐 URL de Producción:${NC}"
echo "   https://salfagpt-3snj65wckq-uc.a.run.app"
echo ""
echo -e "${BLUE}🧪 Prueba el login:${NC}"
echo "   1. Limpia caché del navegador"
echo "   2. Visita la URL de arriba"
echo "   3. Click en 'Continuar con Google'"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

