#!/bin/bash
# Create agent_source_assignments table in BigQuery
# Run this once to set up the table for agent-based search

set -e

PROJECT_ID=${GOOGLE_CLOUD_PROJECT:-salfagpt}
DATASET_ID="flow_analytics"
TABLE_ID="agent_source_assignments"

echo "🚀 Creating agent_source_assignments table in BigQuery"
echo "   Project: $PROJECT_ID"
echo "   Dataset: $DATASET_ID"
echo "   Table: $TABLE_ID"
echo ""

# Check if dataset exists
if ! bq ls --project_id="$PROJECT_ID" "$DATASET_ID" &> /dev/null; then
  echo "📊 Dataset $DATASET_ID doesn't exist, creating..."
  bq mk --project_id="$PROJECT_ID" \
    --dataset \
    --location=us-central1 \
    --description="Flow analytics data warehouse" \
    "$DATASET_ID"
  echo "✅ Dataset created"
fi

# Create table
echo "📋 Creating table from SQL file..."
bq query --project_id="$PROJECT_ID" \
  --use_legacy_sql=false \
  < sql/create_agent_source_assignments_table.sql

echo ""
echo "✅ Table created successfully!"
echo ""
echo "🔍 Verify table:"
echo "   bq show --project_id=$PROJECT_ID $DATASET_ID.$TABLE_ID"
echo ""
echo "📊 Query examples:"
echo "   # Get sources for an agent:"
echo "   bq query --project_id=$PROJECT_ID --use_legacy_sql=false \\"
echo "     \"SELECT sourceId FROM \\\`$PROJECT_ID.$DATASET_ID.$TABLE_ID\\\` \\"
echo "      WHERE agentId = 'your-agent-id' AND isActive = true\""

