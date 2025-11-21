# Context Freshness - Quick Start Implementation

**Date**: 2025-11-18  
**Priority**: 🔴 CRITICAL  
**Time to implement**: 1 week for Phase 1 (Manual Refresh)

---

## 🚀 Quick Start: Manual Refresh (This Week)

### What We're Building

**Goal:** Allow users to manually refresh web-based context sources with one click

**User Experience:**
```
Before: "Este documento está desactualizado" → 😞 User frustrated
After:  Click "🔄 Actualizar" → Content refreshed → ✅ User happy
```

---

## 📋 Step-by-Step Implementation

### Step 1: Update TypeScript Types (30 min)

**File:** `src/types/context.ts`

Add freshness fields to `ContextSource` interface:

```typescript
export interface ContextSource {
  // ... existing fields ...
  
  // ✅ NEW: Source URL for refreshable sources
  sourceUrl?: string;
  
  // ✅ NEW: Freshness tracking
  freshness?: {
    lastRefreshed?: Date;
    refreshSchedule?: 'manual' | 'daily' | 'weekly' | 'monthly';
    nextRefreshDue?: Date;
    autoRefreshEnabled?: boolean;
    changeDetected?: boolean;
    lastChangeDate?: Date;
    refreshHistory?: Array<{
      timestamp: Date;
      success: boolean;
      changesDetected: boolean;
      bytesChanged?: number;
      error?: string;
      triggeredBy?: string;
      triggerType?: 'manual' | 'automatic';
    }>;
  };
  
  // ✅ NEW: Version control
  versions?: Array<{
    version: number;
    extractedAt: Date;
    extractedData: string;
    metadata: any;
  }>;
  currentVersion?: number;
}
```

### Step 2: API Endpoints (Already Created ✅)

We've created three endpoints:

1. **`/api/extract-url`** - Extract content from URL
   - Used by both manual and automatic refresh
   
2. **`/api/context-sources/[id]/refresh`** - Manual refresh single source
   - User clicks "Refresh" button → calls this
   
3. **`/api/context/refresh-all`** - Automatic batch refresh
   - Called by Cloud Scheduler (Phase 2)

### Step 3: Add UI Components (2 hours)

#### 3.1 Add Refresh Button to Context Source Card

**File:** `src/components/ContextManagementDashboard.tsx`

Find the source card rendering and add:

```typescript
{/* In the source card, add refresh button for web/API sources */}
{(source.type === 'web-url' || source.type === 'api') && (
  <button
    onClick={(e) => {
      e.stopPropagation();
      handleRefreshSource(source.id);
    }}
    disabled={isRefreshing[source.id]}
    className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100 disabled:opacity-50"
    title="Actualizar contenido"
  >
    {isRefreshing[source.id] ? (
      <>
        <Loader2 className="w-3 h-3 animate-spin" />
        Actualizando...
      </>
    ) : (
      <>
        <RefreshCw className="w-3 h-3" />
        Actualizar
      </>
    )}
  </button>
)}
```

#### 3.2 Add Freshness Indicator

```typescript
{/* Show freshness status */}
{source.freshness?.lastRefreshed && (
  <div className="text-xs text-slate-500">
    Actualizado: {formatDistanceToNow(source.freshness.lastRefreshed)} ago
  </div>
)}

{/* Show staleness warning */}
{source.freshness?.lastRefreshed && 
 (Date.now() - source.freshness.lastRefreshed.getTime()) > 30 * 24 * 60 * 60 * 1000 && (
  <div className="text-xs text-orange-600 flex items-center gap-1">
    <AlertCircle className="w-3 h-3" />
    Puede estar desactualizado
  </div>
)}
```

#### 3.3 Add Refresh Handler

```typescript
const [isRefreshing, setIsRefreshing] = useState<Record<string, boolean>>({});

const handleRefreshSource = async (sourceId: string) => {
  setIsRefreshing(prev => ({ ...prev, [sourceId]: true }));
  
  try {
    const response = await fetch(`/api/context-sources/${sourceId}/refresh`, {
      method: 'POST',
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error('Refresh failed');
    }
    
    const data = await response.json();
    
    // Show success message
    if (data.hasChanged) {
      alert(`✅ Contenido actualizado!\n\nCambios: ${data.bytesChanged} bytes\nNueva versión: v${data.newVersion}`);
    } else {
      alert('ℹ️ El contenido está actualizado (sin cambios)');
    }
    
    // Reload sources to show updated data
    await loadFirstPage();
    
  } catch (error) {
    console.error('Refresh failed:', error);
    alert('❌ Error al actualizar. Por favor intenta nuevamente.');
  } finally {
    setIsRefreshing(prev => ({ ...prev, [sourceId]: false }));
  }
};
```

### Step 4: Update Context Source Creation (1 hour)

**File:** `src/components/ChatInterfaceWorking.tsx`

When creating web-url sources, save the sourceUrl:

```typescript
// In handleAddSource function
if (type === 'web-url' && url) {
  // ... existing extraction code ...
  
  // ✅ NEW: Save sourceUrl for future refresh
  const contextSource = {
    // ... existing fields ...
    sourceUrl: url, // Store original URL
    freshness: {
      lastRefreshed: new Date(),
      refreshSchedule: 'manual',
      autoRefreshEnabled: false,
      refreshHistory: [{
        timestamp: new Date(),
        success: true,
        changesDetected: false,
        triggeredBy: userEmail,
        triggerType: 'manual'
      }]
    },
    currentVersion: 0
  };
  
  // Create in Firestore
  await createContextSource(userId, contextSource);
}
```

### Step 5: Test (30 min)

**Test Checklist:**

1. **Create Web URL Source**
   - [ ] Add a web URL (e.g., https://example.com)
   - [ ] Verify it extracts content
   - [ ] Check that `sourceUrl` is saved

2. **Manual Refresh**
   - [ ] Click "🔄 Actualizar" button
   - [ ] Verify loading state shows
   - [ ] Check content refreshes
   - [ ] Confirm success message

3. **Change Detection**
   - [ ] Refresh unchanged source
   - [ ] Verify "no changes" message
   - [ ] Update source externally
   - [ ] Refresh again
   - [ ] Verify "content updated" message

4. **Error Handling**
   - [ ] Refresh with broken URL
   - [ ] Verify error message
   - [ ] Check error logged in history

5. **Permissions**
   - [ ] Try refresh as different user
   - [ ] Verify access control works

---

## 📊 Success Metrics - Week 1

After deploying manual refresh, track:

1. **Adoption:**
   - How many users click "Refresh"?
   - What sources are refreshed most?

2. **Success Rate:**
   - % of refreshes that succeed
   - Common errors

3. **User Satisfaction:**
   - NPS change after deployment
   - Feedback mentions of "outdated" (should decrease)

**Target:** 
- ✅ 80%+ users with web sources use refresh
- ✅ >95% refresh success rate
- ✅ NPS +10 points improvement

---

## 🔄 Phase 2: Automatic Refresh (Week 2)

### Setup Cloud Scheduler

**Run the setup script:**

```bash
cd /Users/alec/salfagpt
./scripts/setup-context-refresh-scheduler.sh
```

This will:
1. Create service account
2. Grant permissions
3. Setup Cloud Scheduler job
4. Test the job

### Enable Auto-Refresh in UI

**Add toggle to Context Source Settings:**

```typescript
{/* In ContextSourceSettingsModal */}
<label className="flex items-center gap-2">
  <input
    type="checkbox"
    checked={source.freshness?.autoRefreshEnabled || false}
    onChange={async (e) => {
      await updateContextSource(source.id, {
        'freshness.autoRefreshEnabled': e.target.checked,
        'freshness.refreshSchedule': 'daily',
        'freshness.nextRefreshDue': calculateNextRefresh('daily')
      });
    }}
  />
  <span>Actualizar automáticamente</span>
</label>

{source.freshness?.autoRefreshEnabled && (
  <select
    value={source.freshness?.refreshSchedule || 'daily'}
    onChange={async (e) => {
      await updateContextSource(source.id, {
        'freshness.refreshSchedule': e.target.value,
        'freshness.nextRefreshDue': calculateNextRefresh(e.target.value)
      });
    }}
  >
    <option value="daily">Diariamente</option>
    <option value="weekly">Semanalmente</option>
    <option value="monthly">Mensualmente</option>
  </select>
)}
```

### Test Automatic Refresh

```bash
# Trigger manual test
gcloud scheduler jobs run context-refresh-daily --location=us-east4

# View logs
gcloud logging read "resource.type=cloud_scheduler_job" --limit=50
```

---

## 🎯 Phase 3: Web Search (Week 3-4)

See full implementation in `docs/CONTEXT_FRESHNESS_STRATEGY_2025-11-18.md`

Key components:
1. Google Custom Search API integration
2. Agent web search toggle
3. Query-time web lookup
4. Source attribution

---

## 💬 User Communication

### In-App Notification

**When Phase 1 deploys:**

```
🎉 Nuevo: Actualiza tus Fuentes de Contexto

Ahora puedes actualizar manualmente el contenido de URLs y APIs.

✅ Click "🔄 Actualizar" en cualquier fuente web
✅ Ve cuándo fue la última actualización
✅ Detecta cambios automáticamente

Próximamente: Actualización automática programada! 📅
```

### Email to Active Users

**Subject:** "Respondemos a tu feedback: Contexto siempre actualizado"

**Body:**
```
Hola [Name],

Escuchamos tu preocupación sobre documentos desactualizados. 

✅ Ya está disponible:
• Actualización manual con un click
• Indicadores de frescura de contenido
• Historial de cambios

🔜 Próximamente (esta semana):
• Actualización automática diaria/semanal
• Búsqueda web en tiempo real
• Control de versiones

Flow ahora combina tu contexto privado con información siempre actualizada.

¿Quieres probar? → [Link to chat]

Saludos,
El equipo de Flow
```

---

## 🐛 Common Issues & Solutions

### Issue 1: Refresh Times Out

**Problem:** URL takes too long to fetch

**Solution:** Add timeout to fetch
```typescript
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout

const response = await fetch(url, {
  signal: controller.signal,
  // ... other options
});

clearTimeout(timeout);
```

### Issue 2: Firestore Write Limit

**Problem:** Too many version updates hit write limits

**Solution:** Limit version history to 10
```typescript
updates.versions = [...existingVersions.slice(-9), oldVersion]; // Keep last 10
```

### Issue 3: Large Content Size

**Problem:** Extracted text exceeds Firestore document size (1MB)

**Solution:** Store large extractions in Cloud Storage
```typescript
if (extractedText.length > 500000) { // 500KB threshold
  // Upload to Cloud Storage
  const storageUrl = await uploadToCloudStorage(extractedText);
  updates.extractedDataUrl = storageUrl;
  updates.extractedDataSize = extractedText.length;
  updates.truncated = false;
} else {
  updates.extractedData = extractedText;
}
```

### Issue 4: Rate Limiting

**Problem:** Google API rate limits

**Solution:** Add exponential backoff
```typescript
async function fetchWithRetry(url: string, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fetch(url);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
    }
  }
}
```

---

## 📈 Monitoring Dashboard

**Metrics to track in Firestore Analytics:**

```javascript
// Track refresh events
analytics.logEvent('context_refresh', {
  source_id: sourceId,
  source_type: source.type,
  trigger_type: 'manual' | 'automatic',
  success: true | false,
  changes_detected: true | false,
  bytes_changed: number,
  duration_ms: number
});

// Track user adoption
analytics.logEvent('auto_refresh_enabled', {
  user_id: userId,
  schedule: 'daily' | 'weekly' | 'monthly'
});
```

**Cloud Monitoring Queries:**

```sql
-- Refresh success rate
SELECT 
  COUNT(*) as total_refreshes,
  COUNTIF(success) as successful,
  ROUND(COUNTIF(success) / COUNT(*) * 100, 2) as success_rate_percent
FROM `context_refresh_logs`
WHERE timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 7 DAY)

-- Most refreshed sources
SELECT 
  source_name,
  COUNT(*) as refresh_count,
  COUNTIF(changes_detected) as times_changed
FROM `context_refresh_logs`
WHERE timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 30 DAY)
GROUP BY source_name
ORDER BY refresh_count DESC
LIMIT 20
```

---

## ✅ Deployment Checklist

### Pre-Deployment

- [ ] All TypeScript types updated
- [ ] API endpoints tested locally
- [ ] UI components implemented
- [ ] Error handling added
- [ ] Monitoring configured
- [ ] User documentation written

### Deployment Steps

1. **Deploy API endpoints**
   ```bash
   npm run build
   gcloud app deploy
   ```

2. **Test in production**
   - [ ] Create test web source
   - [ ] Refresh manually
   - [ ] Check logs
   - [ ] Verify data in Firestore

3. **Setup Cloud Scheduler** (Phase 2)
   ```bash
   ./scripts/setup-context-refresh-scheduler.sh
   ```

4. **Announce to users**
   - [ ] In-app notification
   - [ ] Email to active users
   - [ ] Update help docs

### Post-Deployment

- [ ] Monitor error rates (target: <1%)
- [ ] Track adoption metrics
- [ ] Collect user feedback
- [ ] Iterate based on usage

---

## 🎓 Resources

**Documentation:**
- Full strategy: `docs/CONTEXT_FRESHNESS_STRATEGY_2025-11-18.md`
- Architecture: `docs/architecture/CONTEXT_LOADING_STRATEGY.md`
- API reference: (to create) `docs/api/context-refresh.md`

**Scripts:**
- Setup scheduler: `scripts/setup-context-refresh-scheduler.sh`
- Test refresh: (to create) `scripts/test-context-refresh.ts`

**API Endpoints:**
- `/api/extract-url` - Extract from URL
- `/api/context-sources/[id]/refresh` - Manual refresh
- `/api/context/refresh-all` - Batch refresh

---

## 🔥 Quick Wins for Immediate Impact

**This afternoon (2 hours):**
1. Add `sourceUrl` field to new web sources
2. Add "🔄 Actualizar" button (no functionality yet)
3. Show "Última actualización: hace X" text

**Tomorrow (4 hours):**
1. Implement manual refresh endpoint
2. Connect button to endpoint
3. Add loading state
4. Test with real URL

**Day 3 (2 hours):**
1. Add success/error messages
2. Show change detection
3. Deploy to production
4. Announce to users

**Total: 8 hours to significant NPS improvement** 🚀

---

**Remember:** Users don't care about our implementation complexity. They just want current information. Ship fast, iterate based on feedback, and measure impact. 💪


