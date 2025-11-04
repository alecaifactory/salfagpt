# Admin Menu Structure - Visual Reference

## 📱 Complete Menu Layout

```
┌─────────────────────────────────────────┐
│  [User Avatar] Alec                     │
│  alec@getaifactory.com                  │
└─────────────────────────────────────────┘
          ▼ (Click to expand)
┌─────────────────────────────────────────┐
│                                         │
│  GESTIÓN DE DOMINIOS                    │
│  ────────────────────────────────────   │
│  🌐 Dominios                            │
│  👥 Usuarios                            │
│  📄 Prompt de Dominio                   │
│                                         │
│  ═════════════════════════════════════  │
│                                         │
│  GESTIÓN DE AGENTES                     │
│  ────────────────────────────────────   │
│  💬 Agentes                             │
│  🗄️ Contexto                             │
│  📦 Providers                           │
│  🕸️ RAG                                  │
│  ⚡ Evaluación Rápida                   │
│  🧪 Evaluación Avanzada                 │
│                                         │
│  ═════════════════════════════════════  │
│                                         │
│  ANALÍTICAS                             │
│  ────────────────────────────────────   │
│  📈 SalfaGPT                            │
│  📊 Analíticas Avanzadas                │
│                                         │
│  ═════════════════════════════════════  │
│                                         │
│  PRODUCTO                               │
│  ────────────────────────────────────   │
│  🎯 Roadmap & Backlog                   │
│     Kanban + Rudy AI                    │
│  💬 Mi Feedback                         │
│  ⚙️ Configuración                       │
│                                         │
│  ═════════════════════════════════════  │
│                                         │
│  🚪 Cerrar Sesión                       │
│                                         │
└─────────────────────────────────────────┘
```

---

## 🎨 Icon Reference

### Section 1: Gestión de Dominios (Blue)
| Item | Icon | Lucide Component | Color |
|------|------|------------------|-------|
| Dominios | 🌐 | `<Globe />` | `text-blue-600` |
| Usuarios | 👥 | `<Users />` | `text-blue-600` |
| Prompt de Dominio | 📄 | `<FileText />` | `text-blue-600` |

### Section 2: Gestión de Agentes (Indigo)
| Item | Icon | Lucide Component | Color |
|------|------|------------------|-------|
| Agentes | 💬 | `<MessageSquare />` | `text-indigo-600` |
| Contexto | 🗄️ | `<Database />` | `text-indigo-600` |
| Providers | 📦 | `<Boxes />` | `text-indigo-600` |
| RAG | 🕸️ | `<Network />` | `text-indigo-600` |
| Evaluación Rápida | ⚡ | `<Zap />` | `text-indigo-600` |
| Evaluación Avanzada | 🧪 | `<FlaskConical />` | `text-indigo-600` |

### Section 3: Analíticas (Green)
| Item | Icon | Lucide Component | Color |
|------|------|------------------|-------|
| SalfaGPT | 📈 | `<TrendingUp />` | `text-green-600` |
| Analíticas Avanzadas | 📊 | `<BarChart3 />` | `text-green-600` |

### Section 4: Producto (Purple)
| Item | Icon | Lucide Component | Color |
|------|------|------------------|-------|
| Roadmap & Backlog | 🎯 | `<Target />` | `text-purple-600` |
| Mi Feedback | 💬 | `<MessageCircle />` | `text-purple-600` |
| Configuración | ⚙️ | `<Settings />` | `text-purple-600` |

### Special Item
| Item | Icon | Lucide Component | Color |
|------|------|------------------|-------|
| Cerrar Sesión | 🚪 | `<LogOut />` | `text-red-600` |

---

## 🎯 Design System

### Typography
- **Section Headers**: `text-xs font-bold uppercase tracking-wider`
- **Menu Items**: `text-sm font-medium`
- **Subtitles**: `text-xs` (e.g., "Kanban + Rudy AI")

### Spacing
- **Icon-Text Gap**: `gap-3`
- **Padding**: `px-4 py-3`
- **Section Margins**: `my-2`

### Icon Size
- **All Icons**: `w-5 h-5` (consistent 20px × 20px)

### Colors (Light Mode)
- **Section 1 (Dominios)**: Blue - `text-blue-600`
- **Section 2 (Agentes)**: Indigo - `text-indigo-600`
- **Section 3 (Analíticas)**: Green - `text-green-600`
- **Section 4 (Producto)**: Purple - `text-purple-600`
- **Cerrar Sesión**: Red - `text-red-600`

### Colors (Dark Mode)
- **Section 1 (Dominios)**: Blue - `dark:text-blue-400`
- **Section 2 (Agentes)**: Indigo - `dark:text-indigo-400`
- **Section 3 (Analíticas)**: Green - `dark:text-green-400`
- **Section 4 (Producto)**: Purple - `dark:text-purple-400`
- **Cerrar Sesión**: Red - `dark:text-red-400`

---

## 🔒 Access Control

### Superadmin Only (alec@getaifactory.com)
✅ Section 1: Gestión de Dominios (all items)
✅ Section 2: Gestión de Agentes (Agentes, Contexto, Providers, RAG)
✅ Section 3: Analíticas (all items)
✅ Roadmap & Backlog

### Experts + Admins
✅ Evaluación Rápida
✅ Evaluación Avanzada

### All Users
✅ Mi Feedback
✅ Cerrar Sesión

### Non-user Roles
✅ Configuración

---

## 📐 Layout Specifications

### Menu Container
```typescript
className="absolute bottom-full left-0 mb-3 bg-white dark:bg-slate-800 
           rounded-xl shadow-2xl border-2 border-slate-300 dark:border-slate-600 
           py-2 min-w-[380px] z-50"
```

### Section Header
```typescript
<div className="px-4 py-2">
  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 
                uppercase tracking-wider">
    Section Name
  </p>
</div>
```

### Menu Item
```typescript
<button
  className="w-full flex items-center gap-3 px-4 py-3 text-sm 
             text-slate-700 dark:text-slate-200 
             hover:bg-slate-100 dark:hover:bg-slate-700 
             transition-colors"
>
  <Icon className="w-5 h-5 text-{color}-600 dark:text-{color}-400" />
  <span className="font-medium">Item Name</span>
</button>
```

### Section Divider
```typescript
<div className="border-t border-slate-200 dark:border-slate-600 my-2" />
```

---

## 🔄 Changes from Previous Version

### Icon Updates
| Item | Old Icon | New Icon | Reason |
|------|----------|----------|--------|
| Providers | `<DollarSign />` | `<Boxes />` | Better represents provider packages |
| RAG | `<Database />` | `<Network />` | Better represents RAG architecture |
| SalfaGPT | `<BarChart3 />` | `<TrendingUp />` | Better represents growth trends |
| Evaluación Rápida | `<Award />` | `<Zap />` | Better represents speed |
| Sistema de Evaluaciones | `<TestTube />` | `<FlaskConical />` | More advanced/scientific |
| Mi Feedback | `<ListTodo />` | `<MessageCircle />` | Better represents communication |

### Name Updates
| Old Name | New Name | Reason |
|----------|----------|--------|
| Gestión de Dominios | Dominios | Shorter, cleaner |
| Gestión de Usuarios | Usuarios | Shorter, cleaner |
| Gestión de Agentes | Agentes | Shorter, cleaner |
| Gestión de Contexto | Contexto | Shorter, cleaner |
| Gestión de Proveedores | Providers | Shorter, cleaner |
| Configuración RAG | RAG | Shorter, cleaner |
| Sistema de Evaluaciones | Evaluación Avanzada | Clearer distinction |
| Analíticas | Analíticas Avanzadas | Clearer distinction |
| Analíticas SalfaGPT | SalfaGPT | Shorter, context clear |

---

## 🎨 Visual Consistency

### Before
- Mixed icon sizes
- Inconsistent colors
- Long names
- No clear sections
- Mixed spacing

### After
✅ All icons 20px × 20px
✅ Color-coded sections
✅ Concise names
✅ Clear visual hierarchy
✅ Consistent spacing
✅ Section headers for organization

---

## 🧪 Testing Scenarios

### Visual Testing
1. Open user menu
2. Verify section headers are visible
3. Verify all icons render correctly
4. Verify colors match specifications
5. Check dark mode styling
6. Verify spacing is consistent
7. Check hover states

### Functional Testing
1. Click each menu item
2. Verify correct modal/panel opens
3. Verify menu closes after selection
4. Test access control (different user roles)
5. Test on different screen sizes

### Accessibility Testing
1. Keyboard navigation works
2. Screen reader announces sections
3. Color contrast meets WCAG standards
4. Focus states are visible

---

## 📊 Success Metrics

### User Experience
- ✅ Menu is visually organized
- ✅ Items are easy to find
- ✅ Icons are meaningful
- ✅ Colors aid navigation
- ✅ Consistent styling reduces cognitive load

### Technical
- ✅ No linter errors
- ✅ All icons imported correctly
- ✅ Dark mode fully supported
- ✅ Responsive design maintained
- ✅ Type checking passes

---

**Date**: 2025-11-04  
**Version**: 2.0  
**Status**: ✅ Complete  
**Backward Compatible**: Yes  
**Breaking Changes**: None


