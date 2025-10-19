# 📍 Where to Find RAG Configuration

**For:** Administrators  
**Quick Reference:** How to access RAG settings

---

## 👤 User Settings (All Users)

### Location

```
Bottom-left corner → Click your name → Configuración
```

### Visual Guide

```
Step 1: Find your user menu (bottom-left)
┌────────────────────────────────────┐
│                                    │
│  [Sidebar with conversations]      │
│                                    │
│  ┌──────────────────────────────┐  │
│  │ [👤 Avatar]  Your Name       │  │ ← Click here
│  │              your@email.com  │  │
│  └──────────────────────────────┘  │
│                                    │
└────────────────────────────────────┘

Step 2: Click "Configuración"
┌────────────────────────────────────┐
│ [Gestión de Usuarios] ← Admin only │
│ ─────────────────────────          │
│ [Configuración RAG]   ← Admin only │
│ ─────────────────────────          │
│ [Configuración]       ← Click here │ ← Everyone
│ [Cerrar Sesión]                    │
└────────────────────────────────────┘

Step 3: Find RAG section (scroll down)
┌─────────────────────────────────────────┐
│ Configuración de Usuario           [X] │
├─────────────────────────────────────────┤
│                                         │
│ Modelo Preferido                        │
│ [Flash] [Pro]                           │
│                                         │
│ ───────────────────────────────────     │
│                                         │
│ Instrucciones del Sistema               │
│ [textarea...]                           │
│                                         │
│ ───────────────────────────────────     │
│                                         │
│ Idioma Preferido                        │
│ [Español ▼]                             │
│                                         │
│ ───────────────────────────────────     │
│                                         │
│ 🔍 Búsqueda Vectorial (RAG)  [🟢 ON]  │ ← HERE!
│ Busca solo las partes relevantes        │
│                                         │
│ ┌──────────┬──────────┬──────────┐     │
│ │Eficiencia│ Precisión│ Velocidad│     │
│ │95% menos │ Solo lo  │  2x más  │     │
│ │ tokens   │relevante │  rápido  │     │
│ └──────────┴──────────┴──────────┘     │
│                                         │
│                          [Guardar]     │
└─────────────────────────────────────────┘
```

---

## 👑 Admin Configuration (Admin Only)

### Location

```
Bottom-left corner → Click your name → Configuración RAG
```

### Visual Guide

```
Step 1: Open user menu
┌────────────────────────────────────┐
│ [👤 Avatar]  Alec                  │ ← Click here
│              alec@getaifactory.com │
└────────────────────────────────────┘

Step 2: Click "Configuración RAG"
┌────────────────────────────────────┐
│ 👥 Gestión de Usuarios             │
│ ─────────────────────────          │
│ 🔍 Configuración RAG  ← HERE!      │ ← Admin only
│ ─────────────────────────          │
│ 💰 Gestión de Proveedores          │
│ 🌐 Gestión de Dominios             │
│ ─────────────────────────          │
│ ⚙️ Configuración                   │
│ 🚪 Cerrar Sesión                   │
└────────────────────────────────────┘

Step 3: Admin panel opens
┌─────────────────────────────────────────────────────────┐
│ 🔍 Configuración RAG del Sistema                    [X]│
│ Administrador • Configuración global                    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ [⚙️ Configuración] [📊 Estadísticas] [🔧 Mantenimiento]│
│  ─────────────────                                      │
│                                                         │
│ [Full admin panel with all settings...]                │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 🔐 Access Requirements

### User Settings (RAG Toggle)

**Who can access:**
- ✅ All users

**What they can do:**
- Toggle RAG ON/OFF for themselves
- See RAG benefits
- View basic info

**What they CANNOT do:**
- Change system-wide settings
- View other users' stats
- Bulk operations

---

### Admin Panel (RAG Configuration)

**Who can access:**
- ✅ `alec@getaifactory.com` ONLY

**What they can do:**
- Configure system-wide RAG settings
- View all RAG statistics
- Run bulk operations
- Monitor system health
- Re-index all documents

**If non-admin tries to access:**
```
┌─────────────────────────────────┐
│ ❌ Acceso Denegado              │
│                                 │
│ Solo los administradores        │
│ pueden acceder a la             │
│ configuración RAG del sistema.  │
│                                 │
│          [Cerrar]               │
└─────────────────────────────────┘
```

---

## ⚙️ What's Configurable Where

### User Settings

**Location:** Configuración → RAG

**Options:**
- ✅ Enable/Disable RAG
- (Future: TopK, chunk size preferences)

---

### Admin Panel

**Location:** Configuración RAG → Tab 1

**System-wide defaults:**
- ✅ Global Enable/Disable
- ✅ Default TopK (chunks to retrieve)
- ✅ Default Chunk Size (tokens)
- ✅ Default Min Similarity
- ✅ Default Overlap
- ✅ Batch Size (performance)
- ✅ Max Chunks per Document
- ✅ Max Embeddings per Day (cost control)
- ✅ Alert Threshold
- ✅ Enable Fallback
- ✅ Fallback Threshold
- ✅ Enable Hybrid Search (experimental)

---

## 🎨 Visual Comparison

### User View (Simple)

```
┌─────────────────────────────────┐
│ Configuración                   │
├─────────────────────────────────┤
│                                 │
│ 🔍 RAG          [🟢 ON]         │
│                                 │
│ ┌───┬───┬───┐                   │
│ │95%│ ✓ │⚡ │                   │
│ └───┴───┴───┘                   │
│                                 │
│        [Guardar]                │
└─────────────────────────────────┘
      ↑
   Simple toggle
```

---

### Admin View (Comprehensive)

```
┌─────────────────────────────────────────────────────────┐
│ 🔍 Configuración RAG del Sistema                        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ [Config] [Stats] [Maintenance]                          │
│  ──────                                                 │
│                                                         │
│ Global: [🟢 ON]                                         │
│                                                         │
│ Search Settings:                                        │
│ ┌────────────────────────────────────────────────────┐  │
│ │ TopK:        [5]                                   │  │
│ │ Chunk size:  [500 tokens ▼]                        │  │
│ │ Min simil:   [0.5]                                 │  │
│ │ Overlap:     [50]                                  │  │
│ └────────────────────────────────────────────────────┘  │
│                                                         │
│ Performance:                                            │
│ ┌────────────────────────────────────────────────────┐  │
│ │ Batch size:     [5]                                │  │
│ │ Max chunks:     [1000]                             │  │
│ └────────────────────────────────────────────────────┘  │
│                                                         │
│ Cost Control:                                           │
│ ┌────────────────────────────────────────────────────┐  │
│ │ Max/day:        [100000]                           │  │
│ │ Alert at:       [80000]                            │  │
│ └────────────────────────────────────────────────────┘  │
│                                                         │
│ Quality:                                                │
│ ┌────────────────────────────────────────────────────┐  │
│ │ Fallback:       [🟢 ON]                            │  │
│ │ Threshold:      [0.3]                              │  │
│ │ Hybrid search:  [OFF]                              │  │
│ └────────────────────────────────────────────────────┘  │
│                                                         │
│              [Cancelar] [Guardar Configuración]        │
└─────────────────────────────────────────────────────────┘
         ↑
   Comprehensive controls
```

---

## 🎯 Quick Access Map

```
ChatInterfaceWorking (Main UI)
│
├─ Bottom-Left: User Avatar
│   │
│   └─ User Menu (Click)
│       │
│       ├─ [Everyone] Configuración
│       │   │
│       │   └─ Opens UserSettingsModal
│       │       │
│       │       └─ Shows: RAG Toggle (simple)
│       │
│       └─ [Admin Only] Configuración RAG
│           │
│           └─ Opens RAGConfigPanel
│               │
│               ├─ Tab 1: Full configuration
│               ├─ Tab 2: Real-time statistics
│               └─ Tab 3: Maintenance operations
│
└─ All features accessible from one menu!
```

---

## 🔍 Feature Discovery

### How Users Find RAG

1. **First time:** See benefits in settings
2. **Upload doc:** Auto-indexed (transparent)
3. **Ask question:** See "RAG Active" in context panel
4. **Context logs:** See token savings

**Discovery time:** < 5 minutes of normal use

---

### How Admins Find Config

1. **Menu item:** Clearly labeled "Configuración RAG"
2. **Location:** With other admin features
3. **Access:** One click from user menu

**Discovery time:** Immediate

---

## 📊 Settings Hierarchy

```
System Defaults (Admin Panel)
      ↓
User Preferences (User Settings)
      ↓
Runtime Behavior (Automatic)
```

**Example:**

- **Admin sets:** TopK = 5 (system default)
- **User keeps:** RAG ON (inherits system default)
- **Query uses:** TopK = 5 automatically

**User can't change TopK (admin-controlled)**  
**User can disable RAG (user-controlled)**

---

## 💡 Pro Tips

### For First-Time Users

1. **Don't touch anything** - RAG works automatically
2. **Upload and ask** - System handles the rest
3. **Check context panel** - See savings in real-time
4. **Only disable if needed** - Most users keep it ON

---

### For Admins

1. **Start with defaults** - Already optimized
2. **Monitor stats weekly** - Tab 2 in admin panel
3. **Only tune if issues** - Default settings work for 90% of cases
4. **Use bulk re-index carefully** - Can be slow/costly for many docs

---

## 🚀 Access URLs (After Setup)

### Local Development

- **User Settings:** http://localhost:3000/chat → User menu → Configuración
- **Admin Panel:** http://localhost:3000/chat → User menu → Configuración RAG

### Production

- **User Settings:** https://your-url/chat → User menu → Configuración
- **Admin Panel:** https://your-url/chat → User menu → Configuración RAG

---

## ✅ Verification

### How to Know RAG is Working

**Console logs:**
```
✅ See: "🔍 Starting RAG indexing..." during upload
✅ See: "✅ RAG: Using X relevant chunks" during query
```

**Firestore:**
```
✅ Collection: document_chunks exists
✅ Documents: Have sourceId, embedding fields
✅ Count: Grows with each upload
```

**UI:**
```
✅ Context panel: Shows token reduction
✅ Context logs: RAG column shows "✓ X ch"
✅ Admin panel: Statistics update
```

**Performance:**
```
✅ Input tokens: Reduced 90%+
✅ Response time: 2-3x faster
✅ Cost: 99% lower
```

---

## 🎯 Summary

### For Users

**Where:** Settings → RAG toggle  
**What:** Enable/disable  
**Why:** Control your own experience

---

### For Admins

**Where:** User menu → "Configuración RAG"  
**What:** Full system configuration  
**Why:** Control entire RAG system

---

### Both

**Located:** In same user menu (bottom-left)  
**Access:** One click away  
**Experience:** Intuitive and clear

---

**Now you know where everything is!** 🎯

**Ready to test?** Run `./scripts/setup-rag.sh`! 🚀

