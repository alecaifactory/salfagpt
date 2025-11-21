-- Tim v2.0 - BigQuery Setup
-- Create vector store table for semantic search across Tim sessions
--
-- Usage:
-- bq query --project_id=salfagpt --use_legacy_sql=false < scripts/setup-tim-bigquery.sql

-- ============================================================================
-- CREATE DATASET (if not exists)
-- ============================================================================

CREATE SCHEMA IF NOT EXISTS `salfagpt.flow_data`
OPTIONS(
  location="us-east4",
  description="Flow platform data including Tim session vectors"
);

-- ============================================================================
-- CREATE TIM SESSION VECTORS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS `salfagpt.flow_data.tim_session_vectors` (
  -- Identity
  session_id STRING NOT NULL,
  user_id STRING NOT NULL,
  chunk_index INT64 NOT NULL,
  
  -- Chunk data
  chunk_type STRING NOT NULL,          -- screenshot, console, network, interaction, state, performance, analysis
  chunk_text STRING NOT NULL,          -- Text description for embedding
  chunk_data JSON,                     -- Full structured data
  
  -- Embedding
  embedding ARRAY<FLOAT64>,            -- 768-dimensional vector
  
  -- Metadata
  timestamp TIMESTAMP NOT NULL,
  importance STRING,                   -- critical, high, medium, low
  tags ARRAY<STRING>,
  
  -- Access control
  access_level STRING NOT NULL,        -- user, admin, superadmin
  organization_id STRING,
  
  -- Audit
  created_at TIMESTAMP NOT NULL,
  source STRING NOT NULL               -- localhost, production
)
PARTITION BY DATE(created_at)
CLUSTER BY user_id, chunk_type, importance
OPTIONS(
  description="Tim session diagnostic data with embeddings for semantic search",
  require_partition_filter=false
);

-- ============================================================================
-- CREATE VECTOR INDEX FOR SEMANTIC SEARCH
-- ============================================================================

-- Note: Vector indexes can take 30-60 minutes to build
-- Check status with: bq show --schema salfagpt.flow_data.tim_session_vectors

CREATE VECTOR INDEX IF NOT EXISTS tim_vector_index
ON `salfagpt.flow_data.tim_session_vectors`(embedding)
OPTIONS(
  distance_type="COSINE",
  index_type="IVF"
);

-- ============================================================================
-- CREATE AGGREGATED ANALYTICS VIEW
-- ============================================================================

CREATE OR REPLACE VIEW `salfagpt.flow_data.tim_session_summary` AS
SELECT
  session_id,
  user_id,
  MIN(timestamp) as session_start,
  MAX(timestamp) as session_end,
  TIMESTAMP_DIFF(MAX(timestamp), MIN(timestamp), SECOND) as duration_seconds,
  COUNT(*) as total_chunks,
  COUNTIF(chunk_type = 'screenshot') as screenshot_count,
  COUNTIF(chunk_type = 'console' AND importance = 'critical') as error_count,
  COUNTIF(chunk_type = 'network' AND JSON_EXTRACT_SCALAR(chunk_data, '$.status') >= '400') as failed_request_count,
  COUNTIF(chunk_type = 'interaction') as interaction_count,
  ARRAY_AGG(DISTINCT chunk_type IGNORE NULLS) as chunk_types,
  ARRAY_AGG(DISTINCT tags IGNORE NULLS LIMIT 10) as all_tags,
  MAX(importance) as max_severity,
  DATE(created_at) as session_date,
  source
FROM `salfagpt.flow_data.tim_session_vectors`
GROUP BY session_id, user_id, DATE(created_at), source;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant service account access to table
-- Note: Replace with your service account
-- GRANT `roles/bigquery.dataEditor` 
-- ON TABLE `salfagpt.flow_data.tim_session_vectors`
-- TO "serviceAccount:YOUR-SERVICE-ACCOUNT@salfagpt.iam.gserviceaccount.com";

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Count total chunks
SELECT 
  chunk_type,
  COUNT(*) as count,
  COUNT(DISTINCT session_id) as unique_sessions,
  COUNT(DISTINCT user_id) as unique_users
FROM `salfagpt.flow_data.tim_session_vectors`
GROUP BY chunk_type
ORDER BY count DESC;

-- Recent sessions
SELECT
  session_id,
  session_start,
  duration_seconds,
  total_chunks,
  error_count,
  max_severity
FROM `salfagpt.flow_data.tim_session_summary`
ORDER BY session_start DESC
LIMIT 20;

-- Sessions with errors
SELECT
  session_id,
  user_id,
  error_count,
  failed_request_count,
  session_date
FROM `salfagpt.flow_data.tim_session_summary`
WHERE error_count > 0
ORDER BY error_count DESC
LIMIT 50;

-- ============================================================================
-- EXAMPLE SEMANTIC SEARCH QUERY
-- ============================================================================

-- Find sessions similar to a query
-- Note: Replace @query_embedding with actual embedding vector

DECLARE query_embedding ARRAY<FLOAT64>;

-- This would be populated by: generateEmbedding("slow loading performance")
-- SET query_embedding = [...];

SELECT
  session_id,
  user_id,
  chunk_type,
  chunk_text,
  timestamp,
  importance,
  -- Calculate cosine similarity
  (1 - ML.DISTANCE(embedding, query_embedding, 'COSINE')) AS similarity
FROM `salfagpt.flow_data.tim_session_vectors`
WHERE access_level IN ('admin', 'superadmin')
ORDER BY similarity DESC
LIMIT 50;

-- ============================================================================
-- SUCCESS INDICATOR
-- ============================================================================

SELECT 'Tim BigQuery setup complete! ✅' as status;





