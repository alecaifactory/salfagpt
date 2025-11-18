#!/bin/bash
# Setup Cloud Scheduler for automatic context refresh
# This script creates a Cloud Scheduler job that runs daily at 2 AM Santiago time
# to automatically refresh web-based context sources

set -e

# Configuration
PROJECT_ID="gen-lang-client-0986191192"
REGION="us-east4"
SERVICE_NAME="cr-salfagpt-ai-ft-prod-mmxiou2jna-uk.a.run.app"
JOB_NAME="context-refresh-daily"
SCHEDULE="0 2 * * *"  # 2 AM every day
TIMEZONE="America/Santiago"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}  Context Refresh Scheduler Setup${NC}"
echo -e "${YELLOW}========================================${NC}"
echo ""

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ Error: gcloud CLI not found${NC}"
    echo "Please install: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

echo -e "${GREEN}✅ gcloud CLI found${NC}"

# Set project
echo ""
echo "Setting project to: $PROJECT_ID"
gcloud config set project $PROJECT_ID

# Check if scheduler job already exists
if gcloud scheduler jobs describe $JOB_NAME --location=$REGION &> /dev/null; then
    echo ""
    echo -e "${YELLOW}⚠️  Scheduler job '$JOB_NAME' already exists${NC}"
    read -p "Do you want to delete and recreate it? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Deleting existing job..."
        gcloud scheduler jobs delete $JOB_NAME --location=$REGION --quiet
        echo -e "${GREEN}✅ Deleted existing job${NC}"
    else
        echo "Exiting without changes"
        exit 0
    fi
fi

# Create service account for scheduler (if doesn't exist)
SERVICE_ACCOUNT_NAME="context-refresh-scheduler"
SERVICE_ACCOUNT_EMAIL="${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

echo ""
echo "Checking service account: $SERVICE_ACCOUNT_EMAIL"

if gcloud iam service-accounts describe $SERVICE_ACCOUNT_EMAIL &> /dev/null; then
    echo -e "${GREEN}✅ Service account exists${NC}"
else
    echo "Creating service account..."
    gcloud iam service-accounts create $SERVICE_ACCOUNT_NAME \
        --display-name="Context Refresh Scheduler" \
        --description="Service account for Cloud Scheduler context refresh job"
    
    echo -e "${GREEN}✅ Created service account${NC}"
fi

# Grant necessary permissions to service account
echo ""
echo "Granting Cloud Run Invoker permission..."
gcloud run services add-iam-policy-binding $SERVICE_NAME \
    --region=$REGION \
    --member="serviceAccount:${SERVICE_ACCOUNT_EMAIL}" \
    --role="roles/run.invoker" \
    --platform=managed

echo -e "${GREEN}✅ Permissions granted${NC}"

# Create the scheduler job
echo ""
echo "Creating Cloud Scheduler job..."
echo "  Name: $JOB_NAME"
echo "  Schedule: $SCHEDULE ($TIMEZONE)"
echo "  Target: https://${SERVICE_NAME}/api/context/refresh-all"

gcloud scheduler jobs create http $JOB_NAME \
    --location=$REGION \
    --schedule="$SCHEDULE" \
    --uri="https://${SERVICE_NAME}/api/context/refresh-all" \
    --http-method=POST \
    --oidc-service-account-email=$SERVICE_ACCOUNT_EMAIL \
    --time-zone="$TIMEZONE" \
    --description="Daily automatic refresh of web-based context sources at 2 AM Santiago time" \
    --max-retry-attempts=3 \
    --min-backoff=5s \
    --max-backoff=1h \
    --max-doublings=5

echo -e "${GREEN}✅ Cloud Scheduler job created successfully!${NC}"

# Test the job (optional)
echo ""
read -p "Do you want to test the job now? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Running test job..."
    gcloud scheduler jobs run $JOB_NAME --location=$REGION
    echo ""
    echo -e "${YELLOW}⏳ Job triggered. Check logs in Cloud Console:${NC}"
    echo "https://console.cloud.google.com/logs/query;query=resource.type%3D%22cloud_scheduler_job%22%0Aresource.labels.job_id%3D%22${JOB_NAME}%22?project=${PROJECT_ID}"
else
    echo "Skipping test. Job will run automatically at scheduled time."
fi

# Summary
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  ✅ Setup Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Job Details:"
echo "  • Name: $JOB_NAME"
echo "  • Schedule: Every day at 2:00 AM (Santiago time)"
echo "  • Target: Context refresh endpoint"
echo "  • Location: $REGION"
echo ""
echo "Management:"
echo "  • View job: gcloud scheduler jobs describe $JOB_NAME --location=$REGION"
echo "  • Pause job: gcloud scheduler jobs pause $JOB_NAME --location=$REGION"
echo "  • Resume job: gcloud scheduler jobs resume $JOB_NAME --location=$REGION"
echo "  • Run now: gcloud scheduler jobs run $JOB_NAME --location=$REGION"
echo "  • View logs: https://console.cloud.google.com/logs/query?project=${PROJECT_ID}"
echo ""
echo -e "${GREEN}✨ Context sources will now refresh automatically!${NC}"
echo ""

