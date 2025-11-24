#!/bin/bash

# Migración BigQuery us-central1 → us-east4
# Paso a paso manual

set -e

echo "🚀 MIGRACIÓN BIGQUERY TO US-EAST4"
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "BLUE: flow_analytics.document_embeddings (us-central1)"
echo "GREEN: flow_analytics_east4.document_embeddings (us-east4)"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# STEP 1: Create dataset
echo "📦 STEP 1: Creating dataset flow_analytics_east4..."
bq mk --dataset --location=us-east4 --description="RAG embeddings us-east4" salfagpt:flow_analytics_east4 2>&1 || echo "Dataset may already exist"
echo ""

# STEP 2: Create table
echo "📋 STEP 2: Creating table..."
bq mk --table \
  --location=us-east4 \
  --time_partitioning_field=created_at \
  --clustering_fields=user_id,source_id \
  salfagpt:flow_analytics_east4.document_embeddings \
  chunk_id:STRING,source_id:STRING,user_id:STRING,chunk_index:INTEGER,text_preview:STRING,full_text:STRING,embedding:FLOAT64,metadata:JSON,created_at:TIMESTAMP \
  2>&1 || echo "Table may already exist"
echo ""

# STEP 3: Export from BLUE
echo "📥 STEP 3: Exporting from BLUE (this will take 5-15 minutes)..."
bq extract \
  --destination_format=AVRO \
  --location=us-central1 \
  'salfagpt:flow_analytics.document_embeddings' \
  'gs://salfagpt-backups-us/migration-east4/data-*.avro'
echo "✅ Export complete"
echo ""

# STEP 4: Import to GREEN  
echo "📤 STEP 4: Importing to GREEN (this will take 5-15 minutes)..."
bq load \
  --source_format=AVRO \
  --location=us-east4 \
  --replace \
  salfagpt:flow_analytics_east4.document_embeddings \
  'gs://salfagpt-backups-us/migration-east4/data-*.avro'
echo "✅ Import complete"
echo ""

# STEP 5: Verify
echo "🔍 STEP 5: Verifying data..."
echo ""
echo "BLUE (us-central1):"
bq query --use_legacy_sql=false --format=pretty "SELECT COUNT(*) as chunks FROM \`salfagpt.flow_analytics.document_embeddings\`"
echo ""
echo "GREEN (us-east4):"
bq query --use_legacy_sql=false --location=us-east4 --format=pretty "SELECT COUNT(*) as chunks FROM \`salfagpt.flow_analytics_east4.document_embeddings\`"
echo ""

echo "═══════════════════════════════════════════════════════════════"
echo "✅ MIGRATION COMPLETE"
echo ""
echo "Next steps:"
echo "1. Update code: DATASET_ID = 'flow_analytics_east4'"
echo "2. Test localhost"
echo "3. Deploy to production"
echo "═══════════════════════════════════════════════════════════════"

