# Instant Performance - Quick Reference Guide

**For:** All developers working on Flow  
**Purpose:** Quick lookup for performance patterns  
**Last Updated:** 2025-11-18

---

## ⚡ The Instant Standard

```
<50ms    = One frame (instant feedback)
<100ms   = Human perception threshold (instant reaction)
<300ms   = Feels instant (instant completion)
<1000ms  = Acceptable (good experience)
>1000ms  = Slow (needs optimization)
```

---

## 🚀 Quick Patterns

### 1. Skeleton Screens (Instant Perceived Load)

```typescript
// ✅ DO THIS
{loading ? (
  <div className="space-y-4">
    <Skeleton className="h-16 w-full rounded-lg" />
    <Skeleton className="h-16 w-full rounded-lg" />
    <Skeleton className="h-16 w-full rounded-lg" />
  </div>
) : (
  data.map(item => <Card key={item.id} {...item} />)
)}

// ❌ NOT THIS
{loading ? <Spinner /> : <Cards />}
{loading ? null : <Cards />}
```

**Impact:** 2-3x faster perceived load

---

### 2. Optimistic Updates (Instant Feedback)

```typescript
// ✅ DO THIS
const handleCreate = async (item) => {
  // 1. Add immediately (optimistic)
  const tempId = `temp-${Date.now()}`;
  setItems(prev => [{ id: tempId, ...item, loading: true }, ...prev]);
  
  try {
    // 2. Save to backend
    const saved = await createItem(item);
    
    // 3. Replace optimistic with real
    setItems(prev => prev.map(i => 
      i.id === tempId ? saved : i
    ));
  } catch (error) {
    // 4. Remove on error
    setItems(prev => prev.filter(i => i.id !== tempId));
    showError('Failed to create');
  }
};

// ❌ NOT THIS
const handleCreate = async (item) => {
  setLoading(true);
  const saved = await createItem(item);
  setItems(prev => [saved, ...prev]);
  setLoading(false);
};
```

**Impact:** Zero perceived latency

---

### 3. Progressive Loading (Show Results Incrementally)

```typescript
// ✅ DO THIS
const loadDashboard = async () => {
  // Phase 1: KPIs (fastest, show first)
  setLoadingKPIs(true);
  const kpis = await fetchKPIs();
  setKPIs(kpis);
  setLoadingKPIs(false);
  
  // Phase 2: Charts (medium, show next)
  setLoadingCharts(true);
  const charts = await fetchCharts();
  setCharts(charts);
  setLoadingCharts(false);
  
  // Phase 3: Tables (slowest, show last)
  setLoadingTables(true);
  const tables = await fetchTables();
  setTables(tables);
  setLoadingTables(false);
};

// ❌ NOT THIS
const loadDashboard = async () => {
  setLoading(true);
  const [kpis, charts, tables] = await Promise.all([...]);
  setAllData({ kpis, charts, tables });
  setLoading(false);
};
```

**Impact:** Users see results 5x faster

---

### 4. Lazy Loading (Defer Non-Critical)

```typescript
// ✅ DO THIS
const Analytics = lazy(() => import('./Analytics'));
const Settings = lazy(() => import('./Settings'));

{showAnalytics && (
  <Suspense fallback={<Skeleton />}>
    <Analytics />
  </Suspense>
)}

// ❌ NOT THIS
import Analytics from './Analytics'; // Loaded upfront
import Settings from './Settings';   // 95KB + 78KB in initial bundle

{showAnalytics && <Analytics />}
```

**Impact:** 30% smaller initial bundle

---

### 5. Request Caching (Never Fetch Twice)

```typescript
// ✅ DO THIS
const cache = useRef<{ data: any; timestamp: number } | null>(null);

const loadData = async (key: string) => {
  const TTL = 30000; // 30 seconds
  const now = Date.now();
  
  if (cache.current && (now - cache.current.timestamp) < TTL) {
    console.log('⚡ Cache hit');
    return cache.current.data;
  }
  
  const data = await fetchData(key);
  cache.current = { data, timestamp: now };
  return data;
};

// ❌ NOT THIS
const loadData = async (key: string) => {
  return await fetchData(key); // Always fetch
};
```

**Impact:** 78% fewer API calls

---

### 6. Parallel Queries (Never Sequential)

```typescript
// ✅ DO THIS
const [convs, sources, messages] = await Promise.all([
  fetch('/api/conversations'),
  fetch('/api/context-sources'),
  fetch('/api/messages'),
]);

// ❌ NOT THIS
const convs = await fetch('/api/conversations');
const sources = await fetch('/api/context-sources');
const messages = await fetch('/api/messages');
```

**Impact:** 3x faster (if 3 queries)

---

### 7. Field Selection (Minimal Data)

```typescript
// ✅ DO THIS
const snapshot = await firestore
  .collection('conversations')
  .where('userId', '==', userId)
  .select('title', 'lastMessageAt', 'messageCount')
  .get();

// ❌ NOT THIS
const snapshot = await firestore
  .collection('conversations')
  .where('userId', '==', userId)
  .get(); // Fetches ALL fields including large ones
```

**Impact:** 80% less data transferred

---

### 8. Streaming (Show Partial Results)

```typescript
// ✅ DO THIS
const handleSend = async () => {
  const response = await fetch('/api/chat', { method: 'POST' });
  const reader = response.body.getReader();
  
  let accumulated = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    accumulated += new TextDecoder().decode(value);
    setMessages(prev => [...prev.slice(0, -1), {
      ...prev[prev.length - 1],
      content: accumulated
    }]);
  }
};

// ❌ NOT THIS
const handleSend = async () => {
  const response = await fetch('/api/chat', { method: 'POST' });
  const full = await response.text();
  setMessages(prev => [...prev, { content: full }]);
};
```

**Impact:** Instant start vs 45s wait

---

### 9. Abort Controllers (Cancel Stale)

```typescript
// ✅ DO THIS
const abortController = useRef<AbortController | null>(null);

const loadData = async (id: string) => {
  // Cancel previous request
  if (abortController.current) {
    abortController.current.abort();
  }
  
  // Create new controller
  abortController.current = new AbortController();
  
  try {
    const data = await fetch(`/api/data/${id}`, {
      signal: abortController.current.signal
    });
    return data;
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('Request cancelled');
      return;
    }
    throw error;
  }
};

// ❌ NOT THIS
const loadData = async (id: string) => {
  const data = await fetch(`/api/data/${id}`);
  return data;
};
```

**Impact:** Prevent wasted work, faster switching

---

### 10. Virtual Scrolling (Smooth Large Lists)

```typescript
// ✅ DO THIS (for 100+ items)
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={messages.length}
  itemSize={80}
  width="100%"
>
  {({ index, style }) => (
    <div style={style}>
      <Message message={messages[index]} />
    </div>
  )}
</FixedSizeList>

// ❌ NOT THIS (for 100+ items)
{messages.map(msg => <Message key={msg.id} message={msg} />)}
```

**Impact:** 60fps scroll vs janky

---

## 🔍 Debugging Slow Operations

### Quick Diagnostic Checklist

**If operation feels slow:**

1. **Measure it:**
   ```typescript
   const start = performance.now();
   await operation();
   console.log(`⏱️ Duration: ${performance.now() - start}ms`);
   ```

2. **Check network tab:**
   - Waterfall view
   - Slow requests?
   - Redundant requests?

3. **Check React DevTools Profiler:**
   - Which component is slow?
   - Unnecessary re-renders?
   - Heavy computations?

4. **Check for common issues:**
   - [ ] Sequential queries? → Parallelize
   - [ ] Fetching full docs? → Use `.select()`
   - [ ] No caching? → Add cache
   - [ ] Eager loading? → Lazy load
   - [ ] Blocking render? → Defer

---

## 📊 Performance Checklist

### Before Every Commit

- [ ] All new operations measured
- [ ] All async ops have loading states
- [ ] No blocking operations in render
- [ ] Heavy components lazy loaded
- [ ] Queries use field selection
- [ ] Parallel where possible
- [ ] Cache where appropriate

### Before Every PR

- [ ] `npm run benchmark` passes
- [ ] No performance regressions
- [ ] Bundle size within budget
- [ ] Lighthouse score maintained
- [ ] Manual testing feels instant

### Before Every Deploy

- [ ] All performance tests pass
- [ ] Production metrics reviewed
- [ ] Rollback plan ready
- [ ] Performance monitoring enabled

---

## 🎯 Common Scenarios

### Scenario 1: Adding New API Endpoint

```typescript
// ✅ Performance checklist
export const GET: APIRoute = async (context) => {
  const startTime = performance.now();
  
  try {
    // 1. Use field selection
    const snapshot = await firestore
      .collection('items')
      .select('field1', 'field2') // Only needed fields
      .get();
    
    // 2. Transform efficiently
    const items = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // 3. Log performance
    const duration = performance.now() - startTime;
    console.log(`✅ GET /items completed in ${duration}ms`);
    
    // 4. Warn if slow
    if (duration > 500) {
      console.warn(`⚠️ Slow endpoint: ${duration}ms`);
    }
    
    return new Response(JSON.stringify(items), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    const duration = performance.now() - startTime;
    console.error(`❌ GET /items failed in ${duration}ms:`, error);
    throw error;
  }
};
```

---

### Scenario 2: Adding New Component

```typescript
// ✅ Performance checklist
export default function NewComponent({ data }: Props) {
  // 1. Lazy load if heavy
  if (isHeavyComponent) {
    return (
      <Suspense fallback={<Skeleton />}>
        <LazyHeavyComponent />
      </Suspense>
    );
  }
  
  // 2. Memoize expensive computations
  const processed = useMemo(() => 
    expensiveOperation(data),
    [data]
  );
  
  // 3. Memoize callbacks
  const handleClick = useCallback((id: string) => {
    doSomething(id);
  }, []);
  
  // 4. Skeleton for loading
  if (loading) {
    return <Skeleton className="h-64 w-full" />;
  }
  
  // 5. Virtual scrolling for lists
  if (items.length > 100) {
    return <VirtualList items={items} />;
  }
  
  return <div>{/* Component */}</div>;
}

// 6. Memoize component if used in lists
export default memo(NewComponent);
```

---

### Scenario 3: Adding New Modal

```typescript
// ✅ Performance checklist
// 1. Lazy load the modal
const MyModal = lazy(() => import('./MyModal'));

// 2. Only render when needed
{showModal && (
  <Suspense fallback={<div>Loading...</div>}>
    <MyModal
      isOpen={showModal}
      onClose={() => setShowModal(false)}
    />
  </Suspense>
)}

// 3. Inside modal: skeleton while loading data
export default function MyModal({ isOpen, onClose }: Props) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);
  
  if (loading) {
    return (
      <Modal isOpen={isOpen} onClose={onClose}>
        <Skeleton className="h-64" />
      </Modal>
    );
  }
  
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      {/* Content */}
    </Modal>
  );
}
```

---

### Scenario 4: Adding Dashboard/Analytics

```typescript
// ✅ Performance checklist
export default function Dashboard() {
  // 1. Progressive loading states
  const [loadingKPIs, setLoadingKPIs] = useState(true);
  const [loadingCharts, setLoadingCharts] = useState(true);
  const [loadingTables, setLoadingTables] = useState(true);
  
  // 2. Load in phases
  useEffect(() => {
    loadDashboard();
  }, []);
  
  const loadDashboard = async () => {
    // Phase 1: KPIs (show first)
    const kpis = await fetchKPIs();
    setKPIs(kpis);
    setLoadingKPIs(false);
    
    // Phase 2: Charts (show next)
    const charts = await fetchCharts();
    setCharts(charts);
    setLoadingCharts(false);
    
    // Phase 3: Tables (show last)
    const tables = await fetchTables();
    setTables(tables);
    setLoadingTables(false);
  };
  
  return (
    <div className="dashboard">
      {/* KPIs load first */}
      {loadingKPIs ? <Skeleton /> : <KPIs data={kpis} />}
      
      {/* Charts load second */}
      {loadingCharts ? <Skeleton /> : <Charts data={charts} />}
      
      {/* Tables load last */}
      {loadingTables ? <Skeleton /> : <Tables data={tables} />}
    </div>
  );
}

// 3. Lazy load Chart.js
useEffect(() => {
  if (!chartJsLoaded && charts) {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
    script.onload = () => setChartJsLoaded(true);
    document.head.appendChild(script);
  }
}, [charts]);
```

---

## 🔥 Common Issues & Quick Fixes

### Issue 1: Slow API Response

**Symptoms:**
- API takes >500ms
- Network tab shows long wait

**Quick Fixes:**
1. Add field selection: `.select('field1', 'field2')`
2. Add caching: 30s TTL
3. Use parallel queries: `Promise.all()`
4. Check indexes exist
5. Reduce query scope: `.limit(100)`

**Example:**
```typescript
// Before: 2000ms
const docs = await firestore.collection('items').get();

// After: 200ms
const docs = await firestore
  .collection('items')
  .where('userId', '==', userId)
  .select('name', 'status')
  .limit(100)
  .get();
```

---

### Issue 2: Janky Scrolling

**Symptoms:**
- Scroll feels laggy
- Frame drops visible

**Quick Fixes:**
1. Virtual scrolling: `react-window`
2. Reduce re-renders: `memo(Component)`
3. Optimize list items: Remove heavy components
4. Use CSS `will-change`
5. GPU acceleration: `transform` instead of `top/left`

**Example:**
```typescript
// Before: Janky with 200+ messages
{messages.map(msg => <Message {...msg} />)}

// After: Smooth 60fps
<FixedSizeList
  height={600}
  itemCount={messages.length}
  itemSize={80}
>
  {({ index, style }) => (
    <div style={style}>
      <Message message={messages[index]} />
    </div>
  )}
</FixedSizeList>
```

---

### Issue 3: Slow Component Render

**Symptoms:**
- Component takes >100ms to render
- React DevTools Profiler shows red

**Quick Fixes:**
1. Memoize component: `memo(Component)`
2. Memoize computed values: `useMemo()`
3. Memoize callbacks: `useCallback()`
4. Split component: Extract heavy parts
5. Defer heavy work: `requestIdleCallback()`

**Example:**
```typescript
// Before: Re-renders on every parent update
function HeavyComponent({ data }) {
  const processed = expensiveOperation(data);
  return <div>{processed}</div>;
}

// After: Only re-renders when data changes
const HeavyComponent = memo(function HeavyComponent({ data }) {
  const processed = useMemo(
    () => expensiveOperation(data),
    [data]
  );
  return <div>{processed}</div>;
});
```

---

### Issue 4: Large Bundle Size

**Symptoms:**
- Initial bundle >300KB
- Slow first load

**Quick Fixes:**
1. Lazy load heavy components
2. Dynamic imports: `const X = await import('./X')`
3. Remove unused dependencies
4. Code splitting: Route-based
5. Tree shaking: Ensure working

**Example:**
```bash
# Analyze bundle
npm run build
npx vite-bundle-visualizer

# Identify heavy imports
# Replace with lazy loading
```

---

### Issue 5: Redundant API Calls

**Symptoms:**
- Same endpoint called multiple times
- Network tab shows duplicates

**Quick Fixes:**
1. Add caching: `useRef` or `localStorage`
2. Request deduplication
3. Batch requests
4. Use React Query or SWR
5. Lift state up

**Example:**
```typescript
// Before: N components = N API calls
function Component1() {
  const data = await fetch('/api/data');
}
function Component2() {
  const data = await fetch('/api/data'); // Duplicate!
}

// After: Shared cache, 1 API call
const cache = new Map();
async function fetchWithCache(key) {
  if (cache.has(key)) return cache.get(key);
  const data = await fetch(`/api/${key}`);
  cache.set(key, data);
  return data;
}
```

---

## 📋 Quick Checklist

### Is Your Code Instant?

**Visual Feedback:**
- [ ] User action → feedback in <100ms
- [ ] Loading states for all async ops
- [ ] Progress bars for >1s ops
- [ ] Skeleton screens for data loading

**Data Loading:**
- [ ] Parallel queries where possible
- [ ] Field selection used
- [ ] Caching implemented (30s TTL)
- [ ] Lazy loading for heavy features

**Rendering:**
- [ ] First render <50ms
- [ ] Components memoized
- [ ] Virtual scrolling for lists
- [ ] No blocking operations

**Optimization:**
- [ ] Bundle size checked
- [ ] Performance measured
- [ ] No regressions detected
- [ ] Targets met

---

## 🎯 Target Reference

**Memorize these:**

```
Typing:           <16ms   (60fps)
Clicks:           <100ms  (instant feel)
Data load:        <300ms  (feels instant)
Page load:        <1000ms (acceptable)
AI first token:   <2000ms (good)
```

**If your operation exceeds target:**
1. Measure it: `performance.now()`
2. Profile it: React DevTools
3. Optimize it: Apply patterns above
4. Verify it: Re-measure
5. Document it: Update perf docs

---

## 🔗 Resources

**Internal:**
- `.cursor/rules/instant.mdc` - Full manifest
- `docs/PERFORMANCE_BENCHMARKS_2025-11-18.md` - Current benchmarks
- `docs/PERFORMANCE_ROADMAP_2025.md` - Optimization plan
- `scripts/benchmark-performance.ts` - Automated testing

**External:**
- [Web Vitals](https://web.dev/vitals/)
- [React Performance](https://react.dev/learn/render-and-commit)
- [Lighthouse](https://developer.chrome.com/docs/lighthouse/)

---

## 🚀 Quick Start

### Measure Your Feature

```typescript
// Add this to your component
useEffect(() => {
  const start = performance.now();
  
  loadYourData().then(() => {
    const duration = performance.now() - start;
    console.log(`⏱️ Feature loaded in ${duration}ms`);
    
    if (duration > TARGET) {
      console.warn(`⚠️ Exceeds target of ${TARGET}ms`);
    }
  });
}, []);
```

### Test Your Feature

```bash
# Run benchmark
npm run benchmark -- --test=YOUR_TEST_ID

# Check if passes
# If fails, optimize using patterns above
```

### Optimize Your Feature

1. Identify bottleneck (measure)
2. Apply pattern (from above)
3. Re-measure (verify improvement)
4. Repeat until target met

---

## 💡 Pro Tips

**Tip 1: Measure Before Optimizing**
> Don't guess where the slowness is. Measure. Profile. Know.

**Tip 2: Optimize Perception First**
> Users care about perceived speed more than actual speed.  
> Skeleton + slow load > spinner + fast load.

**Tip 3: Cache Everything (with TTL)**
> 30 seconds of staleness is acceptable for 78% fewer API calls.

**Tip 4: Lazy Load Aggressively**
> If user doesn't see it on first render, lazy load it.

**Tip 5: Parallelize Everything**
> Independent queries should always run in parallel.

---

## ⚡ The Instant Mindset

**Ask yourself:**
- Could a skeleton screen help here?
- Can I show this optimistically?
- Is this loading in parallel?
- Am I fetching only what I need?
- Does the user see progress?

**Remember:**
- Instant is a choice, not magic
- Measure everything
- Optimize perception
- Never block the user
- Speed is respect

---

**Keep this open while coding. Quick reference = instant answers.** ⚡

---

**Last Updated:** 2025-11-18  
**Version:** 1.0.0  
**Status:** Living Document  
**Maintained By:** Performance Team

