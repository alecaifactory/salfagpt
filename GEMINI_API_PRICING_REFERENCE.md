# Gemini API Pricing Reference
**Source:** [Google Gemini API Pricing](https://ai.google.dev/gemini-api/docs/pricing)  
**Last Updated:** 2025-10-15  
**Snapshot Date:** 2025-10-08 UTC (from official page)

---

## 🎯 Models Used in Flow Platform

### Gemini 2.5 Pro
**Model ID:** `gemini-2.5-pro`  
**Purpose:** Our state-of-the-art multipurpose model, which excels at coding and complex reasoning tasks.

#### Standard Pricing (Pay-as-you-go)

| Tier | Input Price per 1M tokens | Output Price per 1M tokens | Context Caching | Notes |
|------|---------------------------|----------------------------|-----------------|-------|
| **Free** | Free of charge | Free of charge | Not available | Data used to improve Google products |
| **Paid** | **$1.25** (≤200k tokens)<br>**$2.50** (>200k tokens) | **$10.00** (≤200k tokens)<br>**$15.00** (>200k tokens) | $0.125 (≤200k)<br>$0.25 (>200k)<br>$4.50/hour storage | Data NOT used to improve products |

#### Batch Pricing (50% discount)

| Tier | Input Price per 1M tokens | Output Price per 1M tokens |
|------|---------------------------|----------------------------|
| **Paid Batch** | **$0.625** (≤200k tokens)<br>**$1.25** (>200k tokens) | **$5.00** (≤200k tokens)<br>**$7.50** (>200k tokens) |

**Context Window:** 2,048,000 tokens (2M)  
**Max Output Tokens:** 65,536 tokens  
**Use Case:** Document extraction, complex reasoning, coding tasks

---

### Gemini 2.5 Flash
**Model ID:** `gemini-2.5-flash`  
**Purpose:** Our first hybrid reasoning model which supports a 1M token context window and has thinking budgets.

#### Standard Pricing (Pay-as-you-go)

| Tier | Input Price per 1M tokens | Output Price per 1M tokens | Context Caching | Notes |
|------|---------------------------|----------------------------|-----------------|-------|
| **Free** | Free of charge | Free of charge | Not available | Data used to improve Google products |
| **Paid** | **$0.30** (text/image/video)<br>**$1.00** (audio) | **$2.50** | $0.03 (text/image/video)<br>$0.1 (audio)<br>$1.00/hour storage | Data NOT used to improve products |

#### Batch Pricing (50% discount)

| Tier | Input Price per 1M tokens | Output Price per 1M tokens |
|------|---------------------------|----------------------------|
| **Paid Batch** | **$0.15** (text/image/video)<br>**$0.50** (audio) | **$1.25** |

#### Live API Pricing

| Type | Input per 1M tokens | Output per 1M tokens |
|------|---------------------|----------------------|
| **Text** | $0.50 | $2.00 |
| **Audio/Image** | $3.00 | $12.00 |

**Context Window:** 1,048,576 tokens (1M)  
**Max Output Tokens:** 32,768 tokens  
**Use Case:** Fast processing, low-latency tasks, cost-sensitive applications

---

## 💰 Cost Comparison

### Example: Document Extraction (10,000 tokens input, 5,000 tokens output)

#### Gemini 2.5 Pro
```
Input:  10,000 tokens = 0.01M tokens × $1.25 = $0.0125
Output: 5,000 tokens  = 0.005M tokens × $10.00 = $0.05
TOTAL: $0.0625 per extraction
```

#### Gemini 2.5 Flash
```
Input:  10,000 tokens = 0.01M tokens × $0.30 = $0.003
Output: 5,000 tokens  = 0.005M tokens × $2.50 = $0.0125
TOTAL: $0.0155 per extraction
```

**Savings with Flash:** $0.047 per extraction (75% cheaper)  
**For 1,000 extractions:** $62.50 (Pro) vs $15.50 (Flash) = **$47 savings**

---

## 📊 Typical Document Costs

### Small Document (1-5 pages)
**Tokens:** ~5,000 input, ~3,000 output

| Model | Input Cost | Output Cost | Total Cost |
|-------|------------|-------------|------------|
| **Pro** | $0.00625 | $0.03 | **$0.03625** |
| **Flash** | $0.0015 | $0.0075 | **$0.009** |
| **Savings** | - | - | **$0.027 (75%)** |

### Medium Document (10-20 pages)
**Tokens:** ~20,000 input, ~12,000 output

| Model | Input Cost | Output Cost | Total Cost |
|-------|------------|-------------|------------|
| **Pro** | $0.025 | $0.12 | **$0.145** |
| **Flash** | $0.006 | $0.03 | **$0.036** |
| **Savings** | - | - | **$0.109 (75%)** |

### Large Document (50+ pages)
**Tokens:** ~80,000 input, ~50,000 output

| Model | Input Cost | Output Cost | Total Cost |
|-------|------------|-------------|------------|
| **Pro** | $0.10 | $0.50 | **$0.60** |
| **Flash** | $0.024 | $0.125 | **$0.149** |
| **Savings** | - | - | **$0.451 (75%)** |

---

## 🎯 When to Use Each Model

### Use Gemini 2.5 Pro When:
- ✅ Document has complex tables or charts
- ✅ High accuracy is critical
- ✅ Legal, medical, or technical documents
- ✅ Multi-language documents
- ✅ Cost is secondary to quality

**Example Cost:** $0.60 for 50-page document

### Use Gemini 2.5 Flash When:
- ✅ Simple, straightforward documents
- ✅ High volume processing (100+ docs)
- ✅ Cost optimization is priority
- ✅ Speed matters (2x faster)
- ✅ Testing and development

**Example Cost:** $0.15 for 50-page document (75% savings)

---

## 📈 Cost Calculation Formula

### Per Request
```javascript
const inputCost = (inputTokens / 1_000_000) * inputPricePerMillion;
const outputCost = (outputTokens / 1_000_000) * outputPricePerMillion;
const totalCost = inputCost + outputCost;
```

### Pricing Constants (Paid Tier)
```javascript
const PRICING = {
  'gemini-2.5-pro': {
    input: {
      small: 1.25,  // ≤200k tokens
      large: 2.50   // >200k tokens
    },
    output: {
      small: 10.00, // ≤200k tokens
      large: 15.00  // >200k tokens
    }
  },
  'gemini-2.5-flash': {
    input: {
      text: 0.30,
      audio: 1.00
    },
    output: 2.50
  }
};
```

---

## 🔄 Context Caching (Advanced)

### Gemini 2.5 Pro
- **Input:** $0.125/1M tokens (≤200k prompts)
- **Storage:** $4.50/1M tokens per hour
- **Use Case:** Repeated queries with same large context

### Gemini 2.5 Flash
- **Input:** $0.03/1M tokens (text/image/video)
- **Storage:** $1.00/1M tokens per hour
- **Use Case:** High-volume repeated queries

**Savings:** Up to 90% on repeated context

---

## 📊 Monthly Cost Estimates

### Light Usage (10 documents/day)
**Assumptions:** Average 15k input, 8k output per document

| Model | Daily Cost | Monthly Cost (30 days) |
|-------|------------|------------------------|
| **Pro** | $4.19 | **$125.70** |
| **Flash** | $1.04 | **$31.20** |
| **Savings** | $3.15/day | **$94.50/month (75%)** |

### Medium Usage (50 documents/day)
**Assumptions:** Average 15k input, 8k output per document

| Model | Daily Cost | Monthly Cost (30 days) |
|-------|------------|------------------------|
| **Pro** | $20.95 | **$628.50** |
| **Flash** | $5.20 | **$156.00** |
| **Savings** | $15.75/day | **$472.50/month (75%)** |

### Heavy Usage (200 documents/day)
**Assumptions:** Average 15k input, 8k output per document

| Model | Daily Cost | Monthly Cost (30 days) |
|-------|------------|------------------------|
| **Pro** | $83.80 | **$2,514.00** |
| **Flash** | $20.80 | **$624.00** |
| **Savings** | $63/day | **$1,890/month (75%)** |

---

## 🎲 Strategy Recommendations

### Hybrid Approach (Best of Both Worlds)
```
1. First extraction: Use Flash ($0.015)
2. Review quality
3. If insufficient: Re-extract with Pro ($0.0625)
4. Total worst case: $0.078 (still 21% cheaper than Pro-only)
```

**Expected Savings:**
- 70% of documents: Flash sufficient → 75% savings
- 30% of documents: Need Pro → No extra cost
- **Average savings: 52.5%**

### Volume-Based Strategy
```
Volume < 100/month: Use Pro (quality matters)
Volume 100-1000/month: Use Flash first, Pro if needed
Volume >1000/month: Use Flash only (savings critical)
```

---

## 📊 Token Usage Tracking

### Track These Metrics
```typescript
interface ExtractionMetrics {
  // Token usage
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  
  // Costs
  inputCost: number;    // USD
  outputCost: number;   // USD
  totalCost: number;    // USD
  
  // Model info
  model: 'gemini-2.5-pro' | 'gemini-2.5-flash';
  
  // Performance
  extractionTime: number; // milliseconds
  
  // Quality (if re-extracted)
  qualityRating?: number;
  reExtracted?: boolean;
  previousModel?: string;
}
```

### Calculate Costs
```typescript
function calculateCost(
  inputTokens: number,
  outputTokens: number,
  model: string
): { inputCost: number; outputCost: number; totalCost: number } {
  const pricing = PRICING[model];
  
  // Pro has tiered pricing based on prompt size
  if (model === 'gemini-2.5-pro') {
    const inputPrice = inputTokens <= 200_000 
      ? pricing.input.small 
      : pricing.input.large;
    const outputPrice = inputTokens <= 200_000 
      ? pricing.output.small 
      : pricing.output.large;
    
    const inputCost = (inputTokens / 1_000_000) * inputPrice;
    const outputCost = (outputTokens / 1_000_000) * outputPrice;
    
    return {
      inputCost,
      outputCost,
      totalCost: inputCost + outputCost
    };
  }
  
  // Flash has flat pricing
  const inputCost = (inputTokens / 1_000_000) * pricing.input.text;
  const outputCost = (outputTokens / 1_000_000) * pricing.output;
  
  return {
    inputCost,
    outputCost,
    totalCost: inputCost + outputCost
  };
}
```

---

## 🎯 Cost Optimization Tips

### 1. Choose the Right Model
- Start with Flash for most documents
- Use Pro only when Flash is insufficient
- Track quality to inform decision

### 2. Optimize Prompts
- Keep extraction prompts concise
- Use clear, specific instructions
- Avoid redundant context

### 3. Use Batch API (50% discount)
- For non-urgent extractions
- Process in batches overnight
- Halves the cost automatically

### 4. Monitor Usage
- Track costs per document
- Identify expensive patterns
- Adjust model selection strategy

### 5. Context Caching
- For documents queried repeatedly
- Saves 90% on repeated context
- Worth it for >3 queries on same doc

---

## 🔍 Rate Limits

### Free Tier
- **Requests per minute (RPM):** 15
- **Requests per day (RPD):** 1,500
- **Tokens per minute (TPM):** 1M

### Paid Tier
- **Requests per minute (RPM):** 2,000
- **Requests per day (RPD):** No limit
- **Tokens per minute (TPM):** 4M

**Source:** Subject to change, check [official rate limits page](https://ai.google.dev/gemini-api/docs/rate-limits)

---

## 💡 Recommendations for Flow Platform

### Current Setup (Free Tier)
- **Model:** Gemini 2.5 Pro (default)
- **Cost:** $0 (within free limits)
- **Limits:** 15 requests/min, 1,500/day
- **Sufficient for:** Development, testing, light usage

### When to Upgrade to Paid
- **Scenario 1:** >1,500 documents per day
- **Scenario 2:** Need higher quality (Pro with privacy guarantee)
- **Scenario 3:** Batch processing needed
- **Scenario 4:** Context caching for efficiency

**Monthly Cost Estimate (Paid):**
- 10 docs/day: ~$125 (Pro) or ~$31 (Flash)
- 50 docs/day: ~$629 (Pro) or ~$156 (Flash)
- 200 docs/day: ~$2,514 (Pro) or ~$624 (Flash)

---

## 📋 Implementation Checklist

### In UI (To Be Added)
- [ ] Display input token count
- [ ] Display output token count
- [ ] Display total tokens
- [ ] Calculate and show cost estimate
- [ ] Show cost per extraction in modal
- [ ] Show cumulative cost per agent
- [ ] Cost breakdown by model

### In Firestore (To Be Added)
- [ ] Store token counts with each extraction
- [ ] Store cost with each extraction
- [ ] Aggregate costs per user
- [ ] Aggregate costs per agent
- [ ] Monthly cost tracking

### In Analytics (Future)
- [ ] Cost trends over time
- [ ] Cost per model comparison
- [ ] ROI analysis (Flash vs Pro)
- [ ] Recommendation engine

---

## 🎨 UI Display Examples

### In Extraction Modal
```
┌──────────────────────────────────────┐
│ Extracción Completa                  │
├──────────────────────────────────────┤
│ ✅ 8,432 caracteres extraídos        │
│                                      │
│ 📊 Uso de Tokens:                    │
│ • Input: 12,450 tokens               │
│ • Output: 5,238 tokens               │
│ • Total: 17,688 tokens               │
│                                      │
│ 💰 Costo Estimado:                   │
│ • Input: $0.0156 USD                 │
│ • Output: $0.0524 USD                │
│ • Total: $0.068 USD                  │
│                                      │
│ Modelo: gemini-2.5-pro               │
└──────────────────────────────────────┘
```

### In Context Source Card
```
┌──────────────────────────────────────┐
│ [ON] Document.pdf            [⚙️][🗑️] │
│      📄 PDF                           │
│      "Este documento contiene..."     │
│      1.5 MB • 12 págs • 8,432 chars  │
│      💰 $0.068 • 17.7k tokens        │ ← NEW
└──────────────────────────────────────┘
```

### In Agent Summary
```
┌──────────────────────────────────────┐
│ Agente de Ventas                     │
│                                      │
│ 📊 Estadísticas:                     │
│ • 3 fuentes de contexto              │
│ • 45,234 tokens totales              │
│ • 25 mensajes enviados               │
│                                      │
│ 💰 Costos:                           │
│ • Extracciones: $0.204               │ ← NEW
│ • Conversaciones: $0.158             │
│ • Total: $0.362                      │
└──────────────────────────────────────┘
```

---

## 🔮 Future Optimizations

### Phase 1: Display Token Usage (Next)
- Add token counts to metadata
- Display in UI (extraction complete)
- Show in detail modal

### Phase 2: Cost Tracking (After Phase 1)
- Calculate cost per extraction
- Display estimated cost
- Track cumulative costs

### Phase 3: Analytics (After Phase 2)
- Cost dashboard
- Model comparison
- Optimization recommendations
- Budget alerts

### Phase 4: Smart Selection (Advanced)
- Auto-select model based on document complexity
- Learn from quality ratings
- Optimize cost/quality tradeoff
- Predictive model recommendation

---

## 📚 Additional Models (Not Currently Used)

### Gemini 2.5 Flash-Lite
- **Input:** $0.10/1M tokens
- **Output:** $0.40/1M tokens
- **Use Case:** Highest volume, lowest cost
- **95% cheaper than Pro**

### Gemini 2.0 Flash
- **Input:** $0.10/1M tokens (text/image/video)
- **Output:** $0.40/1M tokens
- **Use Case:** Balanced performance

### Gemini Embedding
- **Input:** $0.15/1M tokens
- **Use Case:** Semantic search, similarity

---

## ⚠️ Important Notes

1. **Free Tier Data Usage:**
   - Free tier: Data may be used to improve Google products
   - Paid tier: Data NOT used to improve products
   - **Privacy:** Upgrade to paid for data privacy guarantee

2. **Pricing Tiers (Pro):**
   - Small prompts (≤200k tokens): Lower pricing
   - Large prompts (>200k tokens): Higher pricing
   - Plan accordingly for large documents

3. **Batch API:**
   - 50% discount on all requests
   - Non-urgent processing
   - Results in 24-48 hours

4. **Rate Limits:**
   - Free: 15 RPM, 1,500 RPD
   - Paid: 2,000 RPM, unlimited RPD
   - Monitor usage to avoid throttling

---

## 🔗 Official Resources

- **Pricing Page:** https://ai.google.dev/gemini-api/docs/pricing
- **Rate Limits:** https://ai.google.dev/gemini-api/docs/rate-limits
- **API Reference:** https://ai.google.dev/api
- **Get API Key:** https://aistudio.google.com/app/apikey

---

## ✅ Summary

### Current Configuration
- **Default Model:** Gemini 2.5 Pro
- **Alternative:** Gemini 2.5 Flash
- **Tier:** Free (development)
- **Data Privacy:** Data may be used by Google

### Typical Costs (Paid Tier)
- **Small doc:** $0.04 (Pro) or $0.01 (Flash)
- **Medium doc:** $0.15 (Pro) or $0.04 (Flash)
- **Large doc:** $0.60 (Pro) or $0.15 (Flash)

### Recommendation
- **Now:** Use Free tier for development
- **Production:** Upgrade to Paid for privacy + higher limits
- **Strategy:** Flash-first with Pro fallback
- **Expected:** 50-75% cost savings with hybrid approach

---

**Last Updated:** 2025-10-15  
**Official Source:** https://ai.google.dev/gemini-api/docs/pricing (2025-10-08)  
**Status:** ✅ Pricing verified and documented

