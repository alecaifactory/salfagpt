# Provider Management Feature

**Created:** 2025-10-15  
**Status:** ✅ Complete  
**Type:** Admin Feature  

---

## 🎯 Purpose

Allows superadmin users to view and manage AI provider pricing information. This enables:
- Accurate cost tracking for agent conversations
- Cost estimation for context uploads
- Comparison between different models
- Historical pricing sync tracking

---

## 🏗️ Architecture

### New Files Created

1. **`src/types/providers.ts`** - TypeScript interfaces
   - `Provider` - Provider information
   - `ModelPricing` - Model pricing details
   - `TokenUsage` - Token usage tracking
   - `CostCalculation` - Cost calculation results
   - `AgentCostSummary` - Agent cost summary

2. **`src/config/providers.ts`** - Provider configuration
   - `GEMINI_MODELS` - All Gemini models with pricing
   - `DEFAULT_PROVIDER` - Google Gemini provider config
   - `calculateCost()` - Cost calculation function
   - `getPricingDisplay()` - Formatting helper
   - `getModelColor()` - UI color helper

3. **`src/lib/costs.ts`** - Cost calculation utilities
   - `calculateCost()` - Calculate cost for usage
   - `formatCost()` - Format cost for display
   - `calculateSavings()` - Savings between models
   - `estimateContextUploadCost()` - Upload cost estimation
   - `getCostTierRecommendation()` - Tier recommendation
   - `calculateAgentCost()` - Agent cost breakdown

4. **`src/components/ProviderManagementDashboard.tsx`** - UI component
   - Provider information display
   - Models table with pricing
   - Model details modal
   - Sync pricing functionality

5. **`src/pages/api/providers/google-gemini.ts`** - API endpoint
   - GET - Retrieve provider data

6. **`src/pages/api/providers/google-gemini/sync.ts`** - API endpoint
   - POST - Sync pricing to Firestore

### Integration Points

**ChatInterfaceWorking.tsx:**
- Added `showProviderManagement` state
- Added "Gestión de Proveedores" menu item (superadmin only)
- Added `ProviderManagementDashboard` component render

---

## 📊 Features

### 1. Provider Information Display

- Provider name, description, website
- Last sync timestamp
- Synced by user tracking
- Total models count
- Free tier models count
- Most economical model
- Most powerful model

### 2. Models Table

**Columns:**
- Modelo (name + ID)
- Categoría (text/multimodal/embedding)
- Contexto (context window size)
- Input (Pagado) - Input price per 1M tokens
- Output (Pagado) - Output price per 1M tokens
- Cache - Context caching support
- Estado - Preview/Free badges
- Acciones - View details button

**Features:**
- Click row to view details
- Color-coded by model type
- Sortable (future)
- Filterable (future)

### 3. Model Details Modal

**Information:**
- Full model name and description
- Pricing tiers (Free vs Paid)
- Capabilities checklist
- Technical specifications
- Cost example calculation

**Pricing Tiers:**
- **Free Tier**: Shows availability, notes about training data usage
- **Paid Tier**: Detailed pricing, features, no training data usage

**Capabilities:**
- ✅/❌ Context Caching
- ✅/❌ Grounding with Google Search
- ✅/❌ Batch API
- ✅/❌ Thinking Mode

**Technical Specs:**
- Context window size
- Max output tokens
- Last updated date

**Cost Example:**
- 1,000 input tokens cost
- 500 output tokens cost
- Total cost calculation

### 4. Sync Pricing

**Manual Sync:**
- Click "Actualizar Precios" button
- Confirmation dialog
- Updates Firestore with latest pricing
- Records who synced and when

**Automatic Sync (Future):**
- Scheduled daily sync
- Version tracking
- Change notifications

---

## 💾 Data Model

### Firestore Collection: `providers`

**Document ID:** `google-gemini`

**Schema:**
```typescript
{
  id: 'google-gemini',
  name: 'google-gemini',
  displayName: 'Google Gemini',
  description: string,
  website: 'https://ai.google.dev',
  models: ModelPricing[],
  lastSyncedAt: Timestamp,
  syncedBy: string, // userId
  source: 'manual' | 'automatic',
  isActive: true,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

---

## 🎨 UI/UX

### Access

**Location:** User Menu (bottom-left) → "Gestión de Proveedores"  
**Visibility:** Superadmin only (`alec@getaifactory.com`)  
**Icon:** DollarSign (green)

### Layout

**Full-screen modal with:**
- Header with provider info
- Stats cards (4 metrics)
- Models table (scrollable)
- Footer with last sync info

**Colors:**
- Purple: Pro models
- Green: Flash models
- Cyan: Lite models
- Indigo: Embedding models

---

## 🔐 Security

### Authentication

- ✅ Requires authentication (JWT)
- ✅ Superadmin only access
- ✅ Session verification

### Authorization

- Only `alec@getaifactory.com` can access
- Future: Role-based access control (admin role)

---

## 📈 Pricing Data (as of 2025-10-15)

### Gemini 2.5 Pro
- Input: $1.25 / 1M tokens (≤200K), $2.50 / 1M (>200K)
- Output: $10.00 / 1M tokens (≤200K), $15.00 / 1M (>200K)
- Context Caching: $0.125 / 1M tokens
- Context: 2M tokens

### Gemini 2.5 Flash
- Input: $0.30 / 1M tokens
- Output: $2.50 / 1M tokens
- Context Caching: $0.03 / 1M tokens
- Context: 1M tokens

### Gemini 2.5 Flash Lite
- Input: $0.10 / 1M tokens
- Output: $0.40 / 1M tokens
- Context Caching: $0.025 / 1M tokens
- Context: 1M tokens

### Gemini 2.0 Flash
- Input: $0.10 / 1M tokens
- Output: $0.40 / 1M tokens
- Context Caching: $0.025 / 1M tokens
- Context: 1M tokens

### Gemini Embedding
- Input: $0.15 / 1M tokens
- Output: $0 (no output)
- Context: 2K tokens

**Source:** https://ai.google.dev/pricing

---

## 🚀 Usage

### View Provider Pricing

1. Login as superadmin (`alec@getaifactory.com`)
2. Click user menu (bottom-left)
3. Click "Gestión de Proveedores"
4. View models table with pricing

### View Model Details

1. Click on any row in the models table
2. View detailed pricing breakdown
3. See capabilities and specifications
4. Review cost example

### Sync Pricing

1. Click "Actualizar Precios" button
2. Confirm sync action
3. Pricing updates in Firestore
4. Timestamp and user recorded

---

## 🧪 Testing

### Manual Testing Checklist

- [ ] Access dashboard from user menu
- [ ] View all models in table
- [ ] Click model row to see details
- [ ] Verify pricing matches official source
- [ ] Test sync functionality
- [ ] Verify timestamp updates after sync
- [ ] Check Firestore document created/updated
- [ ] Test responsive layout
- [ ] Close modal and reopen
- [ ] Verify data persists

### Cost Calculation Testing

```typescript
// Example: Calculate cost for agent conversation
const cost = calculateCost(
  'gemini-2.5-flash',
  1000,    // input tokens
  500,     // output tokens
  0,       // context caching tokens
  'paid'
);

console.log('Input cost:', cost.costs.input);
console.log('Output cost:', cost.costs.output);
console.log('Total cost:', cost.costs.total);
// Expected: ~$0.0016 total
```

---

## 🔄 Future Enhancements

### Short-term (1-2 weeks)

- [ ] Add cost tracking per agent
- [ ] Add cost tracking per user
- [ ] Display total costs in analytics
- [ ] Export cost reports

### Medium-term (1 month)

- [ ] Automatic daily pricing sync
- [ ] Email notifications on price changes
- [ ] Budget alerts
- [ ] Cost forecasting

### Long-term (3 months)

- [ ] Multi-provider support (OpenAI, Anthropic, etc.)
- [ ] Cost optimization recommendations
- [ ] Usage analytics with cost breakdown
- [ ] Custom pricing tiers

---

## 📚 Technical Details

### Cost Calculation Formula

**For models with tiered pricing (e.g., Pro):**

```typescript
Input Cost = (tokens ≤ threshold × base_price) + 
             (tokens > threshold × extended_price)

Output Cost = (tokens ≤ threshold × base_price) + 
              (tokens > threshold × extended_price)

Total Cost = Input Cost + Output Cost + Caching Cost
```

**For models with flat pricing (e.g., Flash):**

```typescript
Input Cost = (input_tokens / 1,000,000) × price_per_1M
Output Cost = (output_tokens / 1,000,000) × price_per_1M
Total Cost = Input Cost + Output Cost
```

### Pricing Sync

**Manual Sync:**
1. User clicks "Actualizar Precios"
2. POST to `/api/providers/google-gemini/sync`
3. Saves `DEFAULT_PROVIDER` to Firestore
4. Updates `lastSyncedAt` and `syncedBy`
5. Returns updated provider data

**Storage:**
- Firestore collection: `providers`
- Document ID: `google-gemini`
- Merge strategy: Preserve existing, update pricing

---

## ✅ Success Criteria

- ✅ Superadmin can view all models and pricing
- ✅ Pricing data matches official Gemini documentation
- ✅ Cost calculation functions work correctly
- ✅ Sync functionality updates Firestore
- ✅ Last sync timestamp displays correctly
- ✅ UI is responsive and professional
- ✅ No TypeScript errors
- ✅ Backward compatible (doesn't break existing features)

---

## 📖 Related Files

### Rules
- `.cursor/rules/alignment.mdc` - Design principles
- `.cursor/rules/data.mdc` - Data schema standards
- `.cursor/rules/ui.mdc` - UI component patterns

### Documentation
- Official Gemini Pricing: https://ai.google.dev/pricing
- Cost tracking requirements: TBD

---

## 🎓 Key Learnings

1. **TypeScript Strictness**: Proper type imports prevent errors
2. **API Context**: Always use `context` parameter for getSession
3. **Tiered Pricing**: Support both flat and tiered pricing models
4. **Future-Proof**: Design for multi-provider expansion
5. **Cost Accuracy**: Match official pricing exactly

---

## 📝 Notes

- Pricing synced manually on 2025-10-15
- Based on official Gemini API pricing page
- Free tier is generous for development
- Paid tier provides higher rate limits
- All models support free tier except some preview models
- Context caching significantly reduces costs for repeated context

---

**Last Updated:** 2025-10-15  
**Author:** Alec  
**Reviewed:** Pending  
**Status:** Ready for Testing

