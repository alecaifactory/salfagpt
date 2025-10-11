# 🎯 Message Tracking & Analytics System - Implementation Status

**Date**: January 11, 2025  
**Branch**: `feat/chat-config-persistence-2025-10-10`  
**Status**: 🚧 In Progress

---

## ✅ Completed

### 1. Architecture Design
- **File**: `docs/architecture/message-tracking-system.md`
- Comprehensive system design
- Dual storage strategy (Firestore + BigQuery)
- Cost estimation formulas
- Analytics queries
- Best practices

### 2. Schema Updates

#### Firestore Schema
**New Interface**: `MessageMetadata`
```typescript
interface MessageMetadata {
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
  latencyMs: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  
  // Cost Estimation
  inputCost: number; // USD
  outputCost: number; // USD
  totalCost: number; // USD
  
  // Generation Info
  generatedAt: Date;
  finishReason?: string;
}
```

**Updated**: `Message` interface
- Added optional `metadata?: MessageMetadata`
- Backward compatible (metadata only on assistant messages)

**Updated**: `addMessage()` function
- Now accepts optional `metadata` parameter
- Stores metadata with assistant messages

---

## 🚧 Next Steps (In Order)

### Step 1: Update Gemini Function (HIGH PRIORITY)
**File**: `src/lib/gemini.ts`
**Function**: `generateAIResponse()`

**Changes Needed**:
```typescript
export interface AIResponse {
  content: MessageContent;
  tokenCount: number;
  contextSections?: ContextSection[];
  // 🆕 ADD THESE:
  metadata: {
    inputTokens: number;
    outputTokens: number;
    latencyMs: number;
    finishReason?: string;
  };
}
```

**Implementation**:
1. Capture `startTime = Date.now()` before API call
2. Call Gemini API
3. Extract token counts from response
4. Calculate `latencyMs = Date.now() - startTime`
5. Return metadata with response

---

### Step 2: Calculate Costs (HIGH PRIORITY)
**File**: `src/lib/costs.ts` (NEW)

**Create Cost Calculator**:
```typescript
// Gemini Pricing (USD per 1M tokens)
const PRICING = {
  'gemini-2.5-pro': {
    input: 0.125,  // $0.125 per 1M tokens
    output: 0.50,  // $0.50 per 1M tokens
  },
  'gemini-2.5-flash': {
    input: 0.075,  // $0.075 per 1M tokens
    output: 0.30,  // $0.30 per 1M tokens
  },
};

export function calculateCost(
  model: 'gemini-2.5-pro' | 'gemini-2.5-flash',
  inputTokens: number,
  outputTokens: number
) {
  const pricing = PRICING[model];
  const inputCost = (inputTokens / 1000000) * pricing.input;
  const outputCost = (outputTokens / 1000000) * pricing.output;
  const totalCost = inputCost + outputCost;
  
  return { inputCost, outputCost, totalCost };
}
```

---

### Step 3: Update Messages API (HIGH PRIORITY)
**File**: `src/pages/api/conversations/[id]/messages.ts`

**Changes**:
1. Capture context window usage from `calculateContextWindowUsage()`
2. Capture model and system prompt from request
3. Call `generateAIResponse()` - get metadata
4. Call `calculateCost()` - get costs
5. Build complete `MessageMetadata` object
6. Pass to `addMessage()` with metadata

**Example**:
```typescript
// Get context before generation
const { usage, sections } = await calculateContextWindowUsage(conversationId, userId);

// Generate AI response
const startTime = Date.now();
const aiResponse = await generateAIResponse(message, {
  model: model || 'gemini-2.5-pro',
  systemInstruction: systemPrompt,
  // ...
});

// Calculate costs
const { inputCost, outputCost, totalCost } = calculateCost(
  model || 'gemini-2.5-pro',
  aiResponse.metadata.inputTokens,
  aiResponse.metadata.outputTokens
);

// Build metadata
const metadata: MessageMetadata = {
  model: model || 'gemini-2.5-pro',
  systemPrompt: systemPrompt,
  temperature: 0.7,
  maxTokens: 8192,
  contextWindowUsage: usage,
  contextSections: {
    systemInstructions: sections[0].tokenCount,
    conversationHistory: sections[1].tokenCount,
    userContext: sections[2].tokenCount,
  },
  latencyMs: aiResponse.metadata.latencyMs,
  inputTokens: aiResponse.metadata.inputTokens,
  outputTokens: aiResponse.metadata.outputTokens,
  totalTokens: aiResponse.metadata.inputTokens + aiResponse.metadata.outputTokens,
  inputCost,
  outputCost,
  totalCost,
  generatedAt: new Date(),
  finishReason: aiResponse.metadata.finishReason,
};

// Save with metadata
const assistantMessage = await addMessage(
  conversationId,
  userId,
  'assistant',
  aiResponse.content,
  aiResponse.tokenCount,
  aiResponse.contextSections,
  metadata  // 🆕 NEW!
);
```

---

### Step 4: BigQuery Integration (MEDIUM PRIORITY)
**File**: `src/lib/bigquery-analytics.ts` (NEW)

**Create Function**:
```typescript
import { BigQuery } from '@google-cloud/bigquery';

const bigquery = new BigQuery({
  projectId: process.env.GOOGLE_CLOUD_PROJECT,
});

const DATASET_ID = process.env.BIGQUERY_DATASET || 'analytics';
const TABLE_ID = 'ai_interactions';

export async function insertAIInteraction(
  message: Message,
  userMessage: Message,
  metadata: MessageMetadata
) {
  const row = {
    interaction_id: `${message.conversationId}-${message.id}`,
    conversation_id: message.conversationId,
    user_id: message.userId,
    message_id: message.id,
    timestamp: message.timestamp,
    date: message.timestamp.toISOString().split('T')[0],
    
    // Input
    user_message: userMessage.content.text || '',
    user_message_tokens: userMessage.tokenCount,
    
    // Output
    assistant_response: message.content.text || '',
    assistant_response_tokens: message.tokenCount,
    
    // Model Configuration
    model: metadata.model,
    system_prompt: metadata.systemPrompt,
    temperature: metadata.temperature,
    max_tokens: metadata.maxTokens,
    
    // Context Usage
    context_window_usage_percent: metadata.contextWindowUsage,
    system_instruction_tokens: metadata.contextSections.systemInstructions,
    conversation_history_tokens: metadata.contextSections.conversationHistory,
    user_context_tokens: metadata.contextSections.userContext,
    total_context_tokens: Object.values(metadata.contextSections).reduce((a, b) => a + b, 0),
    
    // Performance Metrics
    latency_ms: metadata.latencyMs,
    input_tokens: metadata.inputTokens,
    output_tokens: metadata.outputTokens,
    total_tokens: metadata.totalTokens,
    
    // Cost Analysis
    input_cost_usd: metadata.inputCost,
    output_cost_usd: metadata.outputCost,
    total_cost_usd: metadata.totalCost,
    
    // Generation Info
    finish_reason: metadata.finishReason,
    generated_at: metadata.generatedAt,
  };

  try {
    await bigquery.dataset(DATASET_ID).table(TABLE_ID).insert([row]);
    console.log(`✅ BigQuery: Inserted interaction ${row.interaction_id}`);
  } catch (error) {
    console.error('❌ BigQuery insert failed:', error);
    // Don't throw - this shouldn't break the API
  }
}
```

**Call from Messages API**:
```typescript
// After saving assistant message
try {
  await insertAIInteraction(assistantMessage, userMessage, metadata);
} catch (error) {
  console.error('BigQuery logging failed:', error);
  // Don't fail the request
}
```

---

### Step 5: BigQuery Table Setup (MEDIUM PRIORITY)
**File**: `scripts/setup-bigquery.sh` (NEW)

**Create Script**:
```bash
#!/bin/bash

# Setup BigQuery table for AI interactions analytics

PROJECT_ID=${GOOGLE_CLOUD_PROJECT}
DATASET_ID="analytics"
TABLE_ID="ai_interactions"

# Create dataset
bq mk --dataset --location=US ${PROJECT_ID}:${DATASET_ID}

# Create table with schema
bq mk --table \
  --time_partitioning_field=date \
  --clustering_fields=user_id,conversation_id,model \
  ${PROJECT_ID}:${DATASET_ID}.${TABLE_ID} \
  ./bigquery-schema.json

echo "✅ BigQuery table created: ${PROJECT_ID}:${DATASET_ID}.${TABLE_ID}"
```

**Schema File**: `bigquery-schema.json`
```json
[
  {"name": "interaction_id", "type": "STRING", "mode": "REQUIRED"},
  {"name": "conversation_id", "type": "STRING", "mode": "REQUIRED"},
  {"name": "user_id", "type": "STRING", "mode": "REQUIRED"},
  {"name": "message_id", "type": "STRING", "mode": "REQUIRED"},
  {"name": "timestamp", "type": "TIMESTAMP", "mode": "REQUIRED"},
  {"name": "date", "type": "DATE", "mode": "REQUIRED"},
  
  {"name": "user_message", "type": "STRING", "mode": "REQUIRED"},
  {"name": "user_message_tokens", "type": "INTEGER", "mode": "REQUIRED"},
  
  {"name": "assistant_response", "type": "STRING", "mode": "REQUIRED"},
  {"name": "assistant_response_tokens", "type": "INTEGER", "mode": "REQUIRED"},
  
  {"name": "model", "type": "STRING", "mode": "REQUIRED"},
  {"name": "system_prompt", "type": "STRING"},
  {"name": "temperature", "type": "FLOAT"},
  {"name": "max_tokens", "type": "INTEGER"},
  
  {"name": "context_window_usage_percent", "type": "FLOAT"},
  {"name": "system_instruction_tokens", "type": "INTEGER"},
  {"name": "conversation_history_tokens", "type": "INTEGER"},
  {"name": "user_context_tokens", "type": "INTEGER"},
  {"name": "total_context_tokens", "type": "INTEGER"},
  
  {"name": "latency_ms", "type": "INTEGER"},
  {"name": "input_tokens", "type": "INTEGER"},
  {"name": "output_tokens", "type": "INTEGER"},
  {"name": "total_tokens", "type": "INTEGER"},
  
  {"name": "input_cost_usd", "type": "NUMERIC"},
  {"name": "output_cost_usd", "type": "NUMERIC"},
  {"name": "total_cost_usd", "type": "NUMERIC"},
  
  {"name": "finish_reason", "type": "STRING"},
  {"name": "generated_at", "type": "TIMESTAMP"}
]
```

---

## 📊 What This Enables

### 1. Cost Analysis
```sql
-- Total cost by user (last 30 days)
SELECT 
  user_id,
  COUNT(*) as interactions,
  SUM(total_tokens) as total_tokens,
  SUM(total_cost_usd) as total_cost
FROM `openflow.analytics.ai_interactions`
WHERE date >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
GROUP BY user_id
ORDER BY total_cost DESC;
```

### 2. Model Performance
```sql
-- Compare models
SELECT 
  model,
  COUNT(*) as requests,
  AVG(latency_ms) as avg_latency,
  AVG(output_tokens) as avg_output_tokens,
  AVG(total_cost_usd) as avg_cost
FROM `openflow.analytics.ai_interactions`
WHERE date >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY)
GROUP BY model;
```

### 3. Expensive Queries
```sql
-- Find costly interactions
SELECT 
  conversation_id,
  user_message,
  total_tokens,
  total_cost_usd,
  latency_ms
FROM `openflow.analytics.ai_interactions`
WHERE date >= CURRENT_DATE()
  AND total_cost_usd > 0.01
ORDER BY total_cost_usd DESC
LIMIT 100;
```

---

## 🎯 Implementation Priority

### Phase 1 (HIGH - Do Now)
1. ✅ Update TypeScript interfaces
2. ✅ Update `addMessage()` function
3. ⏳ Update `generateAIResponse()` to capture metadata
4. ⏳ Create cost calculator
5. ⏳ Update messages API to use metadata

### Phase 2 (MEDIUM - This Week)
1. Create BigQuery integration function
2. Setup BigQuery table/schema
3. Test end-to-end flow
4. Deploy to staging

### Phase 3 (LOW - Future)
1. Create analytics dashboards
2. Cost optimization tools
3. Automated alerts
4. Model selection optimization

---

## 📝 Testing Checklist

- [ ] Send message in chat
- [ ] Verify metadata saved in Firestore
- [ ] Check token counts are accurate
- [ ] Verify costs calculated correctly
- [ ] Confirm BigQuery row inserted
- [ ] Query BigQuery for interaction
- [ ] Test cost analysis query
- [ ] Test performance query

---

## 📚 Documentation

- ✅ `docs/architecture/message-tracking-system.md` - Complete design
- ⏳ `docs/guides/cost-optimization.md` - Cost analysis guide
- ⏳ `docs/guides/bigquery-analytics.md` - Analytics queries
- ⏳ `docs/api/metadata-schema.md` - Metadata reference

---

## 🚀 Benefits

1. **Complete Auditability**: Every interaction fully logged
2. **Cost Optimization**: Track and optimize spending
3. **Performance Insights**: Latency and token usage patterns
4. **Model Comparison**: Data-driven model selection
5. **Debug Capability**: Reproduce exact conditions of any response

---

**Status**: Schema ready, implementation in progress  
**Next**: Update `generateAIResponse()` to capture metadata

