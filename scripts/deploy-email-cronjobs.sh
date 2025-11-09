#!/bin/bash
# Deploy Email Notification Cronjobs
# Created: 2025-11-09

set -e

PROJECT_ID=${GOOGLE_CLOUD_PROJECT:-salfagpt}
REGION="us-central1"

echo "📧 Deploying Email Notification Cronjobs"
echo "Project: $PROJECT_ID"
echo "Region: $REGION"
echo ""

# 1. Deploy Cloud Function for Specialist Emails
echo "1️⃣  Deploying Specialist Weekly Email function..."
gcloud functions deploy sendWeeklySpecialistEmails \
  --gen2 \
  --runtime=nodejs20 \
  --region=$REGION \
  --source=./functions \
  --entry-point=sendWeeklySpecialistEmails \
  --trigger-http \
  --allow-unauthenticated=false \
  --set-env-vars="GOOGLE_CLOUD_PROJECT=$PROJECT_ID" \
  --project=$PROJECT_ID

echo "✅ Specialist email function deployed"
echo ""

# 2. Deploy Cloud Function for Supervisor Alerts
echo "2️⃣  Deploying Supervisor Volume Alert function..."
gcloud functions deploy sendSupervisorVolumeAlerts \
  --gen2 \
  --runtime=nodejs20 \
  --region=$REGION \
  --source=./functions \
  --entry-point=sendSupervisorVolumeAlerts \
  --trigger-http \
  --allow-unauthenticated=false \
  --set-env-vars="GOOGLE_CLOUD_PROJECT=$PROJECT_ID" \
  --project=$PROJECT_ID

echo "✅ Supervisor alert function deployed"
echo ""

# 3. Create Cloud Scheduler job for Specialist Emails (Every Monday 9am)
echo "3️⃣  Creating Cloud Scheduler job for Specialist Emails..."
gcloud scheduler jobs create http specialist-weekly-emails \
  --location=$REGION \
  --schedule="0 9 * * 1" \
  --time-zone="America/Santiago" \
  --uri="https://$REGION-$PROJECT_ID.cloudfunctions.net/sendWeeklySpecialistEmails" \
  --http-method=POST \
  --oidc-service-account-email="$PROJECT_ID@appspot.gserviceaccount.com" \
  --project=$PROJECT_ID \
  || echo "⚠️  Job may already exist, updating..."

# Update if exists
gcloud scheduler jobs update http specialist-weekly-emails \
  --location=$REGION \
  --schedule="0 9 * * 1" \
  --time-zone="America/Santiago" \
  --project=$PROJECT_ID \
  2>/dev/null || true

echo "✅ Specialist email schedule created (Every Monday 9am)"
echo ""

# 4. Create Cloud Scheduler job for Supervisor Alerts (Every 4 hours)
echo "4️⃣  Creating Cloud Scheduler job for Supervisor Alerts..."
gcloud scheduler jobs create http supervisor-volume-alerts \
  --location=$REGION \
  --schedule="0 */4 * * *" \
  --time-zone="America/Santiago" \
  --uri="https://$REGION-$PROJECT_ID.cloudfunctions.net/sendSupervisorVolumeAlerts" \
  --http-method=POST \
  --oidc-service-account-email="$PROJECT_ID@appspot.gserviceaccount.com" \
  --project=$PROJECT_ID \
  || echo "⚠️  Job may already exist, updating..."

# Update if exists
gcloud scheduler jobs update http supervisor-volume-alerts \
  --location=$REGION \
  --schedule="0 */4 * * *" \
  --time-zone="America/Santiago" \
  --project=$PROJECT_ID \
  2>/dev/null || true

echo "✅ Supervisor alert schedule created (Every 4 hours)"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ ALL EMAIL CRONJOBS DEPLOYED"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Verify:"
echo "  gcloud scheduler jobs list --location=$REGION --project=$PROJECT_ID"
echo ""
echo "Test manually:"
echo "  gcloud scheduler jobs run specialist-weekly-emails --location=$REGION --project=$PROJECT_ID"
echo "  gcloud scheduler jobs run supervisor-volume-alerts --location=$REGION --project=$PROJECT_ID"
echo ""

