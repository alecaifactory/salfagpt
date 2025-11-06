# Drag & Drop Individual Card Fix - 2025-11-06

**Issue:** Dragging one card moved all cards in a block instead of individually

**Root Cause:** Event bubbling caused parent elements to also receive drag events

---

## 🐛 The Problem

When dragging a card from Backlog to Roadmap:
- User drags "Hola" card
- ALL cards in Backlog would move together
- Instead of just the one card

**Why:** 
- Drag events were bubbling up the DOM tree
- Parent container was also handling drag/drop
- Multiple cards were being selected

---

## ✅ The Fix

Added `stopPropagation()` to prevent event bubbling:

### 1. handleDragStart
```typescript
function handleDragStart(cardId: string, e: React.DragEvent) {
  e.stopPropagation(); // ✅ Prevent bubbling
  setDraggedCard(cardId);
  console.log('🎯 [DRAG] Started dragging card:', cardId);
}
```

### 2. handleDragOver
```typescript
function handleDragOver(e: React.DragEvent) {
  e.preventDefault();
  e.stopPropagation(); // ✅ Prevent bubbling
}
```

### 3. handleDrop
```typescript
async function handleDrop(targetLane: Lane, e: React.DragEvent) {
  e.preventDefault();
  e.stopPropagation(); // ✅ Prevent bubbling
  
  // ... rest of logic
}
```

### 4. Card Rendering
```typescript
<div
  key={card.id}
  draggable
  onDragStart={(e) => handleDragStart(card.id, e)}  // Pass event
  ...
>
```

### 5. Drop Zone
```typescript
<div
  onDragOver={handleDragOver}
  onDrop={(e) => handleDrop(lane.id, e)}  // Pass event
>
```

---

## 🧪 Testing

**Before Fix:**
1. Drag "Hola" card from Backlog
2. Drop on Roadmap lane
3. ❌ ALL Backlog cards move to Roadmap

**After Fix:**
1. Drag "Hola" card from Backlog
2. Drop on Roadmap lane
3. ✅ ONLY "Hola" card moves to Roadmap
4. Other cards stay in Backlog

---

## 🔍 Enhanced Debugging

Added console logs to trace drag & drop:

```
🎯 [DRAG] Started dragging card: B2aI2ZeXwnDwNzkmEJhW
📦 [DROP] Dropping card: {
  cardId: 'B2aI2ZeXwnDwNzkmEJhW',
  fromLane: 'backlog',
  toLane: 'roadmap',
  cardTitle: 'Hola'
}
  ✓ Updating card: B2aI2ZeXwnDwNzkmEJhW to lane: roadmap
✅ [DROP] Card moved to roadmap in backend
```

**Benefits:**
- See exactly which card is being dragged
- Verify only one card updates
- Track backend sync success/failure

---

## 📋 Key Learnings

1. **Event Propagation:** Always use `stopPropagation()` in drag & drop handlers
2. **Pass Events:** Pass the event object to handlers, don't use arrow functions without params
3. **Unique IDs:** Ensure each card has unique `id` (we use Firestore doc ID)
4. **Debug Logging:** Add detailed logs to trace complex UI interactions

---

## ✅ Success Criteria

Drag & drop now works correctly:
- ✅ Only dragged card moves
- ✅ Other cards stay in place
- ✅ Backend updates only one ticket
- ✅ Console shows clear drag & drop flow
- ✅ Optimistic UI updates immediately
- ✅ Reloads on error to ensure consistency

---

**Fixed:** 2025-11-06, 7:25 AM  
**File:** `src/components/RoadmapModal.tsx`  
**Impact:** Individual card drag & drop working correctly


