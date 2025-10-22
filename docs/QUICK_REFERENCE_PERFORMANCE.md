# Performance Quick Reference

**Last Updated**: 2025-10-21  
**Status**: ✅ Production Ready

---

## ⚡ Performance at a Glance

| Operation | Target | Current | Status |
|-----------|--------|---------|--------|
| Context Assignment | <500ms | ~100ms | ✅ 5x better |
| Modal Close | <500ms | ~200ms | ✅ 2.5x better |
| Agent Switch | <3s | ~2s | ✅ 1.5x better |
| Message Send | <2s | ~1.5s | ✅ 1.3x better |

---

## 🎯 Three-Tier Loading Strategy

### Tier 1: Optimistic (~50ms)
**Use for**: Instant feedback operations  
**Example**: Assignment, toggles, renames  
**Pattern**: Update state → API in background

### Tier 2: Lightweight (~200ms)
**Use for**: Simple refreshes  
**Example**: Modal close, metadata updates  
**Pattern**: Single API call, metadata only

### Tier 3: Full Load (~2-5s)
**Use for**: Critical accuracy needed  
**Example**: Agent switch, post-indexing  
**Pattern**: Full verification with RAG checks

---

## 📡 API Endpoints

### Metadata Only (Fast)

```typescript
// All user sources (metadata)
GET /api/context-sources-metadata?userId=X
Time: ~100ms

// Agent-specific sources (filtered)  ⭐ NEW
GET /api/conversations/:id/context-sources-metadata
Time: ~50ms

// All sources (admin only)
GET /api/context-sources/all-metadata
Time: ~200ms
```

### Full Data (Slower)

```typescript
// Complete source with content
GET /api/context-sources/:id
Time: ~500ms-2s

// RAG chunks
GET /api/context-sources/:id/chunks
Time: ~200ms per source
```

---

## 🚀 Usage Patterns

### Optimistic Update Pattern

```typescript
// 1. Update UI immediately
setState(newValue);

// 2. Save to backend (background)
await api.save(newValue);

// 3. Rollback on error (if needed)
if (error) setState(oldValue);
```

---

### Lightweight Refresh Pattern

```typescript
// Use lightweight endpoint
const data = await fetch(
  `/api/conversations/${id}/context-sources-metadata`
);
setState(data.sources);
```

---

### Full Load Pattern

```typescript
// Load with verification
const sources = await loadWithVerification(id);
setState(sources);
```

---

## 🎯 Decision Tree

```
User Action
    ↓
Need instant feedback?
    ├─ YES → Tier 1 (Optimistic)
    └─ NO ↓
         │
         Need current metadata?
             ├─ YES, no verification → Tier 2 (Lightweight)
             ├─ YES, with verification → Tier 3 (Full)
             └─ NO → Don't load
```

---

## 📊 Performance Gains (2025-10-21)

### Context Assignment Optimization

| Metric | Before | After | Gain |
|--------|--------|-------|------|
| Time | 5-8s | ~300ms | **15-25x** |
| API Calls | 25-35 | 2 | **12-17x** |
| Data | 800KB-3MB | ~11KB | **70-270x** |

---

## 🔧 Quick Commands

### Check Performance

```bash
# Monitor in DevTools
# Network tab → Count calls
# Performance tab → Measure time
```

### Verify Optimization

```bash
# Assignment should be 1 call
POST /api/context-sources/bulk-assign

# Modal close should be 1 call
GET /api/conversations/:id/context-sources-metadata
```

---

## 📚 Full Documentation

See `docs/platform-performance.md` for complete guide.

---

**Fast UI = Happy Users** ⚡✨

