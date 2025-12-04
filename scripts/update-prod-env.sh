#!/bin/bash

# ============================================================================
# Update Production Environment Variables - Cloud Run
# ============================================================================
# 
# Purpose: Safely update all environment variables in production Cloud Run
#          from local .env file
#
# Project: salfagpt
# Service: cr-salfagpt-ai-ft-prod
# Region: us-east4
#
# Usage: ./scripts/update-prod-env.sh
#
# Prerequisites:
#   1. gcloud CLI authenticated as alec@salfacloud.cl
#   2. .env file exists in project root with all required variables
#   3. Permissions to update Cloud Run service
#
# ============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID="salfagpt"
SERVICE_NAME="cr-salfagpt-ai-ft-prod"
REGION="us-east4"
EXPECTED_USER="alec@salfacloud.cl"

echo -e "${BLUE}============================================================================${NC}"
echo -e "${BLUE}  Actualización de Variables de Entorno en Producción${NC}"
echo -e "${BLUE}============================================================================${NC}"
echo ""
echo -e "📦 Proyecto:  ${GREEN}${PROJECT_ID}${NC}"
echo -e "☁️  Servicio:  ${GREEN}${SERVICE_NAME}${NC}"
echo -e "🌍 Región:    ${GREEN}${REGION}${NC}"
echo ""

# ============================================================================
# Step 1: Verify gcloud authentication
# ============================================================================
echo -e "${YELLOW}[1/6]${NC} Verificando autenticación de gcloud..."

CURRENT_USER=$(gcloud config get-value account 2>/dev/null || echo "none")

if [ "$CURRENT_USER" != "$EXPECTED_USER" ]; then
    echo -e "${RED}❌ Error: Usuario actual ($CURRENT_USER) no coincide con el esperado ($EXPECTED_USER)${NC}"
    echo ""
    echo -e "Por favor ejecuta:"
    echo -e "  ${BLUE}gcloud auth login $EXPECTED_USER${NC}"
    echo ""
    exit 1
fi

echo -e "${GREEN}✅ Autenticado como: ${CURRENT_USER}${NC}"
echo ""

# ============================================================================
# Step 2: Verify project is set correctly
# ============================================================================
echo -e "${YELLOW}[2/6]${NC} Verificando proyecto de GCP..."

CURRENT_PROJECT=$(gcloud config get-value project 2>/dev/null || echo "none")

if [ "$CURRENT_PROJECT" != "$PROJECT_ID" ]; then
    echo -e "${YELLOW}⚠️  Proyecto actual ($CURRENT_PROJECT) no coincide. Configurando...${NC}"
    gcloud config set project "$PROJECT_ID"
    echo -e "${GREEN}✅ Proyecto configurado: ${PROJECT_ID}${NC}"
else
    echo -e "${GREEN}✅ Proyecto correcto: ${PROJECT_ID}${NC}"
fi
echo ""

# ============================================================================
# Step 3: Load and verify .env file
# ============================================================================
echo -e "${YELLOW}[3/6]${NC} Cargando variables desde .env..."

ENV_FILE=".env"

if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}❌ Error: Archivo .env no encontrado en la raíz del proyecto${NC}"
    exit 1
fi

# Source the .env file with proper parsing
# This handles numeric values and special characters correctly
set -a  # Automatically export all variables
while IFS='=' read -r key value; do
    # Skip empty lines and comments
    [[ -z "$key" || "$key" =~ ^#.* ]] && continue
    
    # Remove leading/trailing whitespace
    key=$(echo "$key" | xargs)
    value=$(echo "$value" | xargs)
    
    # Remove quotes if present
    value="${value%\"}"
    value="${value#\"}"
    value="${value%\'}"
    value="${value#\'}"
    
    # Export the variable
    export "$key=$value"
done < "$ENV_FILE"
set +a

# Required variables
REQUIRED_VARS=(
    "GOOGLE_CLOUD_PROJECT"
    "NODE_ENV"
    "GOOGLE_AI_API_KEY"
    "GOOGLE_CLIENT_ID"
    "GOOGLE_CLIENT_SECRET"
    "JWT_SECRET"
    "PUBLIC_BASE_URL"
    "SESSION_COOKIE_NAME"
    "SESSION_MAX_AGE"
    "CHUNK_SIZE"
    "CHUNK_OVERLAP"
    "EMBEDDING_BATCH_SIZE"
    "TOP_K"
    "EMBEDDING_MODEL"
)

# Apply default values for production deployment
[ -z "$NODE_ENV" ] && export NODE_ENV="production"
[ -z "$SESSION_COOKIE_NAME" ] && export SESSION_COOKIE_NAME="flow_session"
[ -z "$SESSION_MAX_AGE" ] && export SESSION_MAX_AGE="604800"

# Verify critical variables are set (no defaults for these)
CRITICAL_VARS=(
    "GOOGLE_CLOUD_PROJECT"
    "GOOGLE_AI_API_KEY"
    "GOOGLE_CLIENT_ID"
    "GOOGLE_CLIENT_SECRET"
    "JWT_SECRET"
    "PUBLIC_BASE_URL"
    "CHUNK_SIZE"
    "CHUNK_OVERLAP"
    "EMBEDDING_BATCH_SIZE"
    "TOP_K"
    "EMBEDDING_MODEL"
)

MISSING_VARS=()
for var in "${CRITICAL_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        MISSING_VARS+=("$var")
    fi
done

if [ ${#MISSING_VARS[@]} -ne 0 ]; then
    echo -e "${RED}❌ Error: Faltan variables críticas en .env:${NC}"
    for var in "${MISSING_VARS[@]}"; do
        echo -e "   - ${RED}$var${NC}"
    done
    exit 1
fi

echo -e "${GREEN}✅ Todas las variables requeridas encontradas (${#REQUIRED_VARS[@]})${NC}"
echo ""

# Display loaded variables (without sensitive values)
echo "📋 Variables cargadas:"
for var in "${REQUIRED_VARS[@]}"; do
    if [[ "$var" == *"SECRET"* ]] || [[ "$var" == *"KEY"* ]]; then
        echo -e "   ${GREEN}✓${NC} $var = ${YELLOW}[REDACTED]${NC}"
    else
        echo -e "   ${GREEN}✓${NC} $var = ${!var}"
    fi
done
echo ""

# ============================================================================
# Step 4: Confirmation prompt
# ============================================================================
echo -e "${YELLOW}[4/6]${NC} Confirmación requerida"
echo ""
echo -e "${YELLOW}⚠️  ATENCIÓN: Esto actualizará las variables de entorno en PRODUCCIÓN${NC}"
echo ""
echo -e "Servicio: ${GREEN}${SERVICE_NAME}${NC}"
echo -e "Región:   ${GREEN}${REGION}${NC}"
echo -e "Proyecto: ${GREEN}${PROJECT_ID}${NC}"
echo ""
echo -e "Variables a actualizar: ${GREEN}${#REQUIRED_VARS[@]}${NC}"
echo ""

read -p "¿Continuar con la actualización? (escribe 'yes' para confirmar): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo -e "${YELLOW}❌ Actualización cancelada por el usuario${NC}"
    exit 0
fi

echo ""

# ============================================================================
# Step 5: Update Cloud Run environment variables
# ============================================================================
echo -e "${YELLOW}[5/6]${NC} Actualizando variables de entorno en Cloud Run..."
echo ""

# Build the env vars string
ENV_VARS="GOOGLE_CLOUD_PROJECT=${GOOGLE_CLOUD_PROJECT}"
ENV_VARS+=",NODE_ENV=${NODE_ENV}"
ENV_VARS+=",GOOGLE_AI_API_KEY=${GOOGLE_AI_API_KEY}"
ENV_VARS+=",GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}"
ENV_VARS+=",GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}"
ENV_VARS+=",JWT_SECRET=${JWT_SECRET}"
ENV_VARS+=",PUBLIC_BASE_URL=${PUBLIC_BASE_URL}"
ENV_VARS+=",SESSION_COOKIE_NAME=${SESSION_COOKIE_NAME}"
ENV_VARS+=",SESSION_MAX_AGE=${SESSION_MAX_AGE}"
ENV_VARS+=",CHUNK_SIZE=${CHUNK_SIZE}"
ENV_VARS+=",CHUNK_OVERLAP=${CHUNK_OVERLAP}"
ENV_VARS+=",EMBEDDING_BATCH_SIZE=${EMBEDDING_BATCH_SIZE}"
ENV_VARS+=",TOP_K=${TOP_K}"
ENV_VARS+=",EMBEDDING_MODEL=${EMBEDDING_MODEL}"

# Update the service
echo "🚀 Ejecutando actualización..."
if gcloud run services update "$SERVICE_NAME" \
    --region="$REGION" \
    --project="$PROJECT_ID" \
    --update-env-vars="$ENV_VARS" \
    --quiet; then
    echo ""
    echo -e "${GREEN}✅ Variables de entorno actualizadas exitosamente${NC}"
else
    echo ""
    echo -e "${RED}❌ Error al actualizar variables de entorno${NC}"
    exit 1
fi

echo ""

# ============================================================================
# Step 6: Verify deployment
# ============================================================================
echo -e "${YELLOW}[6/6]${NC} Verificando despliegue..."
echo ""

# Get service URL
SERVICE_URL=$(gcloud run services describe "$SERVICE_NAME" \
    --region="$REGION" \
    --project="$PROJECT_ID" \
    --format='value(status.url)' 2>/dev/null)

if [ -z "$SERVICE_URL" ]; then
    echo -e "${RED}❌ No se pudo obtener la URL del servicio${NC}"
    exit 1
fi

echo -e "🌐 URL del servicio: ${GREEN}${SERVICE_URL}${NC}"
echo ""

# Test health endpoint
echo "🏥 Verificando health check..."
HEALTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "${SERVICE_URL}/api/health" || echo "000")

if [ "$HEALTH_RESPONSE" == "200" ]; then
    echo -e "${GREEN}✅ Health check exitoso (HTTP 200)${NC}"
else
    echo -e "${YELLOW}⚠️  Health check respondió con HTTP ${HEALTH_RESPONSE}${NC}"
    echo -e "   Esto puede ser normal si el endpoint no existe o requiere autenticación"
fi

echo ""

# ============================================================================
# Success summary
# ============================================================================
echo -e "${GREEN}============================================================================${NC}"
echo -e "${GREEN}  ✅ Actualización Completada${NC}"
echo -e "${GREEN}============================================================================${NC}"
echo ""
echo "📝 Resumen:"
echo -e "   • Servicio:   ${SERVICE_NAME}"
echo -e "   • Región:     ${REGION}"
echo -e "   • Variables:  ${#REQUIRED_VARS[@]} actualizadas"
echo -e "   • Estado:     ${GREEN}Activo${NC}"
echo ""
echo "🔗 Enlaces útiles:"
echo -e "   • Servicio:   https://console.cloud.google.com/run/detail/${REGION}/${SERVICE_NAME}?project=${PROJECT_ID}"
echo -e "   • Logs:       https://console.cloud.google.com/logs/query?project=${PROJECT_ID}"
echo -e "   • URL:        ${SERVICE_URL}"
echo ""
echo "⚡ Próximos pasos recomendados:"
echo "   1. Verificar que la aplicación funciona correctamente"
echo "   2. Probar integración con Gemini AI (nuevo API key)"
echo "   3. Revisar logs por si hay errores"
echo ""
echo -e "${BLUE}Tip: Puedes verificar las variables con:${NC}"
echo -e "     gcloud run services describe ${SERVICE_NAME} --region=${REGION} --project=${PROJECT_ID} --format='value(spec.template.spec.containers[0].env)'"
echo ""


