-- Create agent_source_assignments table in BigQuery
-- This table enables fast agent-based search without querying Firestore first

CREATE TABLE IF NOT EXISTS `salfagpt.flow_analytics.agent_source_assignments` (
  -- Agent and source identifiers
  agentId STRING NOT NULL,
  sourceId STRING NOT NULL,
  userId STRING NOT NULL,
  
  -- Assignment metadata
  assignedAt TIMESTAMP NOT NULL,
  isActive BOOLEAN NOT NULL DEFAULT true,
  unassignedAt TIMESTAMP,
  
  -- Origin tracking
  source STRING NOT NULL, -- 'localhost' | 'production'
  syncedAt TIMESTAMP NOT NULL,
  
  -- For deduplication and auditing
  assignmentId STRING, -- Format: {agentId}_{sourceId}
  
  -- Metadata for context
  sourceName STRING,
  sourceType STRING,
  
  -- Audit trail
  createdBy STRING, -- userId who created the assignment
  inheritedFrom STRING -- If chat inherited from parent agent
)
PARTITION BY DATE(assignedAt)
CLUSTER BY agentId, userId, isActive
OPTIONS(
  description='Agent-source assignments for fast vector search',
  labels=[('component', 'rag-search'), ('version', 'v1')]
);

-- Create indexes for faster queries
-- Note: BigQuery automatically indexes clustered columns

COMMENT ON TABLE `salfagpt.flow_analytics.agent_source_assignments` IS 
'Tracks which context sources are assigned to which agents. Used by agent-based vector search to filter chunks without querying Firestore first.';

-- Example queries:

-- Get all sources for an agent
-- SELECT sourceId FROM `salfagpt.flow_analytics.agent_source_assignments`
-- WHERE agentId = 'abc123' AND isActive = true;

-- Get all agents using a source
-- SELECT agentId FROM `salfagpt.flow_analytics.agent_source_assignments`
-- WHERE sourceId = 'xyz789' AND isActive = true;

-- Count active assignments per agent
-- SELECT agentId, COUNT(*) as sourceCount
-- FROM `salfagpt.flow_analytics.agent_source_assignments`
-- WHERE isActive = true
-- GROUP BY agentId;

