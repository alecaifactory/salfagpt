# Message Tracking & Analytics System

**Date**: January 11, 2025  
**Purpose**: Comprehensive tracking of all AI interactions for optimization and cost analysis

## Overview

Track every AI interaction with complete metadata including:
- Input/Output content
- Model configuration
- Context usage
- Performance metrics
- Token counts
- Cost estimation

## Architecture

### Dual Storage Strategy

1. **Firestore**: Operational data (quick access, real-time queries)
2. **BigQuery**: Analytics data (reporting, optimization, cost analysis)

### Data Flow
```
User Message → API → Gemini AI → Response
                ↓                    ↓
           Track Input      Track Output + Metadata
                ↓                    ↓
         [Firestore] ←──────────────┘
                ↓
         [BigQuery] (async)
```

## Schema Design

### Firestore: `messages` Collection

```typescript
interface Message {
  // Identity
  id: string;
  conversationId: string;
  userId: string;
  
  // Content
  role: 'user' | 'assistant' | 'system';
  content: MessageContent;
  
  // Timestamps
  timestamp: Date;
  
  // Token Tracking
  tokenCount: number;
  
  // Metadata (for assistant messages)
  metadata?: {
    // Model Configuration
    model: 'gemini-2.5-pro' | 'gemini-2.5-flash';
    systemPrompt: string;
    temperature: number;
    maxTokens: number;
    
    // Context Info
    contextWindowUsage: number; // Percentage
    contextSections: {
      systemInstructions: number;
      conversationHistory: number;
      userContext: number;
    };
    
    // Performance Metrics
    latencyMs: number; // Response time
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    
    // Cost Estimation
    inputCost: number; // USD
    outputCost: number; // USD
    totalCost: number; // USD
    
    // Generation Info
    generatedAt: Date;
    finishReason?: string; // 'stop', 'length', 'safety', etc.
  };
}
```

### BigQuery: `ai_interactions` Table

```sql
CREATE TABLE `salfagpt.analytics.ai_interactions` (
  -- Identity
  interaction_id STRING NOT NULL,
  conversation_id STRING NOT NULL,
  user_id STRING NOT NULL,
  message_id STRING NOT NULL,
  
  -- Timestamps (for partitioning)
  timestamp TIMESTAMP NOT NULL,
  date DATE NOT NULL, -- Partition key
  
  -- Input
  user_message STRING NOT NULL,
  user_message_tokens INT64 NOT NULL,
  
  -- Output
  assistant_response STRING NOT NULL,
  assistant_response_tokens INT64 NOT NULL,
  
  -- Model Configuration
  model STRING NOT NULL,
  system_prompt STRING,
  temperature FLOAT64,
  max_tokens INT64,
  
  -- Context Usage
  context_window_usage_percent FLOAT64,
  system_instruction_tokens INT64,
  conversation_history_tokens INT64,
  user_context_tokens INT64,
  total_context_tokens INT64,
  
  -- Performance Metrics
  latency_ms INT64,
  input_tokens INT64,
  output_tokens INT64,
  total_tokens INT64,
  
  -- Cost Analysis
  input_cost_usd NUMERIC(10, 6),
  output_cost_usd NUMERIC(10, 6),
  total_cost_usd NUMERIC(10, 6),
  
  -- Generation Info
  finish_reason STRING,
  generated_at TIMESTAMP,
  
  -- Additional Metadata
  session_id STRING,
  user_agent STRING,
  ip_address STRING
)
PARTITION BY date
CLUSTER BY user_id, conversation_id, model;
```

## Pricing (as of January 2025)

### Gemini 2.5 Pro
- Input: $0.000125 per 1K tokens ($0.125 per 1M)
- Output: $0.0005 per 1K tokens ($0.50 per 1M)

### Gemini 2.5 Flash
- Input: $0.000075 per 1K tokens ($0.075 per 1M)
- Output: $0.0003 per 1K tokens ($0.30 per 1M)

## Implementation Plan

### Phase 1: Metadata Capture
1. Update `generateAIResponse()` to return full metadata
2. Capture start/end time for latency
3. Extract token counts from API response
4. Calculate costs based on pricing

### Phase 2: Firestore Storage
1. Update `addMessage()` to accept metadata
2. Store metadata with assistant messages
3. Index on conversationId, userId, timestamp

### Phase 3: BigQuery Integration
1. Create dataset and table
2. Implement `insertAIInteraction()` function
3. Batch inserts for efficiency
4. Handle retries and errors

### Phase 4: Analytics & Reporting
1. Create BigQuery views for common queries
2. Build cost dashboards
3. Performance analytics
4. Model comparison reports

## Key Features

### 1. Complete Auditability
- Every interaction fully logged
- Recreate exact conditions of any response
- Debug issues with complete context

### 2. Cost Optimization
- Track costs per user, conversation, model
- Identify expensive queries
- Optimize model selection

### 3. Performance Analytics
- Latency tracking
- Token usage patterns
- Context window efficiency

### 4. Model Comparison
- A/B test different models
- Compare quality vs cost
- Optimize model selection strategy

## Best Practices

### 1. Data Retention
- Firestore: 90 days hot data
- BigQuery: Unlimited with partitioning
- Archive old data to Cloud Storage

### 2. Privacy & Security
- Hash PII in BigQuery
- Encrypt sensitive data
- Implement data retention policies

### 3. Performance
- Async BigQuery inserts (don't block API)
- Batch insertions (1000 rows at a time)
- Use streaming inserts for real-time

### 4. Cost Management
- Monitor BigQuery query costs
- Use materialized views for dashboards
- Partition and cluster tables properly

## Analytics Queries

### Total Cost by User
```sql
SELECT 
  user_id,
  COUNT(*) as interactions,
  SUM(total_tokens) as total_tokens,
  SUM(total_cost_usd) as total_cost,
  AVG(latency_ms) as avg_latency_ms
FROM `salfagpt.analytics.ai_interactions`
WHERE date >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
GROUP BY user_id
ORDER BY total_cost DESC;
```

### Model Performance Comparison
```sql
SELECT 
  model,
  COUNT(*) as requests,
  AVG(latency_ms) as avg_latency,
  AVG(output_tokens) as avg_output_tokens,
  AVG(total_cost_usd) as avg_cost,
  SUM(total_cost_usd) as total_cost
FROM `salfagpt.analytics.ai_interactions`
WHERE date >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY)
GROUP BY model;
```

### Context Window Usage Analysis
```sql
SELECT 
  CAST(context_window_usage_percent AS INT64) as usage_bucket,
  COUNT(*) as interactions,
  AVG(latency_ms) as avg_latency,
  AVG(total_tokens) as avg_tokens
FROM `salfagpt.analytics.ai_interactions`
WHERE date >= CURRENT_DATE()
GROUP BY usage_bucket
ORDER BY usage_bucket;
```

### Expensive Queries
```sql
SELECT 
  conversation_id,
  user_id,
  user_message,
  total_tokens,
  total_cost_usd,
  latency_ms,
  timestamp
FROM `salfagpt.analytics.ai_interactions`
WHERE date >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY)
  AND total_cost_usd > 0.01
ORDER BY total_cost_usd DESC
LIMIT 100;
```

## Dashboard Metrics

### Real-Time Metrics
- Requests per minute
- Average latency
- Error rate
- Active users

### Cost Metrics
- Daily/Monthly spend
- Cost per user
- Cost per model
- Trend analysis

### Performance Metrics
- P50, P95, P99 latency
- Token usage patterns
- Context window efficiency
- Model utilization

### Quality Metrics
- Finish reasons distribution
- Long conversations
- High token usage
- User satisfaction (future)

## Migration Plan

### Step 1: Update Schema
- Add metadata fields to Message interface
- Update TypeScript types
- No breaking changes (metadata optional)

### Step 2: Update API
- Capture metadata in message endpoint
- Store in Firestore
- Log to console initially

### Step 3: Add BigQuery
- Create dataset and table
- Implement insert function
- Test with sample data

### Step 4: Enable Analytics
- Create views and dashboards
- Set up alerts
- Train team on queries

### Step 5: Optimize
- Monitor costs
- Tune indexes
- Adjust retention policies

## Success Metrics

- ✅ 100% of interactions tracked
- ✅ < 50ms overhead for tracking
- ✅ < $10/month BigQuery costs
- ✅ Real-time cost visibility
- ✅ Performance insights actionable

## Future Enhancements

1. **Machine Learning**
   - Predict optimal model selection
   - Auto-optimize based on patterns
   - Anomaly detection

2. **Advanced Analytics**
   - User behavior analysis
   - Conversation quality scoring
   - Sentiment analysis

3. **Real-Time Optimization**
   - Dynamic model selection
   - Context window optimization
   - Cost-aware routing

---

**Status**: Design complete, ready for implementation

