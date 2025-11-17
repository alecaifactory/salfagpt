#!/bin/bash
# Deploy to production with all environment variables

set -e

cd /Users/alec/salfagpt

# Source environment variables
set -a
source .env
set +a

# Deploy with all env vars
gcloud run deploy cr-salfagpt-ai-ft-prod \
  --source . \
  --project salfagpt \
  --region us-east4 \
  --allow-unauthenticated \
  --min-instances 1 \
  --max-instances 50 \
  --memory 4Gi \
  --cpu 2 \
  --timeout 300 \
  --set-env-vars="\
GOOGLE_CLOUD_PROJECT=salfagpt,\
NODE_ENV=production,\
GOOGLE_AI_API_KEY=${GOOGLE_AI_API_KEY},\
GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID},\
GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET},\
JWT_SECRET=${JWT_SECRET},\
PUBLIC_BASE_URL=${PUBLIC_BASE_URL},\
SESSION_COOKIE_NAME=${SESSION_COOKIE_NAME:-flow_session},\
SESSION_MAX_AGE=${SESSION_MAX_AGE:-604800},\
CHUNK_SIZE=${CHUNK_SIZE:-8000},\
CHUNK_OVERLAP=${CHUNK_OVERLAP:-2000},\
EMBEDDING_BATCH_SIZE=${EMBEDDING_BATCH_SIZE:-32},\
EMBEDDING_MODEL=${EMBEDDING_MODEL:-gemini-embedding-001}"

echo "✅ Deployment complete"

