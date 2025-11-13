# Carpetas Jerárquicas (3 Niveles)

**Created:** 2025-11-13  
**Status:** ✅ Implemented  
**Branch:** feat/multi-org-system-2025-11-10

---

## 🎯 Purpose

Permitir a los usuarios organizar sus conversaciones en carpetas jerárquicas de hasta 3 niveles de profundidad, mejorando la organización y navegación.

---

## 📋 Changes Summary

### 1. Nomenclatura

**Cambios de texto:**
- ✅ "Proyectos" → "Carpetas"
- ✅ "Nuevo Proyecto" → "Nueva Carpeta"
- ✅ "Chats" → "Historial"
- ✅ "Nuevo Chat" → "Nueva Conversación"

### 2. Estructura Jerárquica

**Niveles permitidos:**
```
Nivel 0 (Root)
  ├─ Nivel 1 (Subcarpeta)
  │   └─ Nivel 2 (Sub-subcarpeta)
  │
  └─ Nivel 1 (Subcarpeta)
      └─ Nivel 2 (Sub-subcarpeta)
```

**Límite:** Máximo 3 niveles (0, 1, 2) ✅

---

## 🔧 Technical Implementation

### Data Model Changes

**File:** `src/lib/firestore.ts`

**Interface Updated:**
```typescript
export interface Folder {
  id: string;
  userId: string;
  name: string;
  createdAt: Date;
  conversationCount: number;
  parentFolderId?: string; // ✅ NEW: For hierarchical folders
  level?: number; // ✅ NEW: Folder depth (0=root, 1, 2) - Max 3 levels
}
```

**Function Updated:**
```typescript
export async function createFolder(
  userId: string, 
  name: string, 
  parentFolderId?: string, // ✅ NEW: Optional parent
  level?: number // ✅ NEW: Depth level
): Promise<Folder> {
  const folder: Folder = {
    id: folderRef.id,
    userId,
    name,
    createdAt: new Date(),
    conversationCount: 0,
    parentFolderId, // ✅ NEW
    level: level || 0, // ✅ NEW: Default 0 (root)
  };
  // ...
}
```

---

### Backend API Changes

**File:** `src/pages/api/folders/index.ts`

**POST Endpoint Updated:**
```typescript
export const POST: APIRoute = async ({ request }) => {
  const { userId, name, parentFolderId, level } = body;
  
  // ✅ VALIDATION: Enforce max 3 levels
  if (level !== undefined && level >= 3) {
    return new Response(
      JSON.stringify({ error: 'Maximum 3 folder levels allowed' }),
      { status: 400 }
    );
  }
  
  const folder = await createFolder(userId, name, parentFolderId, level);
  return folder;
};
```

---

### Frontend Implementation

**File:** `src/components/ChatInterfaceWorking.tsx`

#### 1. Build Hierarchy Function

```typescript
// ✅ NEW: Build hierarchical folder structure
const buildFolderHierarchy = (flatFolders: Folder[]): Folder[] => {
  const folderMap = new Map<string, Folder>();
  flatFolders.forEach(folder => {
    folderMap.set(folder.id, { ...folder, children: [] });
  });
  
  const rootFolders: Folder[] = [];
  
  folderMap.forEach(folder => {
    if (folder.parentFolderId) {
      // This is a subfolder - add to parent's children
      const parent = folderMap.get(folder.parentFolderId);
      if (parent) {
        parent.children = parent.children || [];
        parent.children.push(folder);
      } else {
        // Parent not found - treat as root
        rootFolders.push(folder);
      }
    } else {
      // Root level folder
      rootFolders.push(folder);
    }
  });
  
  return rootFolders;
};
```

#### 2. Recursive Render Function

```typescript
// ✅ NEW: Recursive function to render folder with children
const renderFolderWithChildren = (folder: Folder, depth: number): React.ReactNode => {
  const folderChats = conversations.filter(c => c.folderId === folder.id && c.status !== 'archived');
  const isExpanded = expandedFolders.has(folder.id);
  const indentClass = depth > 0 ? `ml-${depth * 3}` : ''; // Indent subfolders
  const canAddSubfolder = (folder.level || 0) < 2; // Max 3 levels (0, 1, 2)
  
  return (
    <div key={folder.id} className={indentClass}>
      {/* Folder header, conversations, etc. */}
      
      {/* Subfolders (recursive) */}
      {isExpanded && folder.children && folder.children.length > 0 && (
        <div className="px-2 py-1 space-y-1 bg-slate-50 dark:bg-slate-700/30">
          {folder.children.map(child => renderFolderWithChildren(child, depth + 1))}
        </div>
      )}
    </div>
  );
};
```

#### 3. Create Subfolder

**Updated `createNewFolder` function:**
```typescript
const createNewFolder = async (name: string, parentFolderId?: string) => {
  // Calculate level based on parent
  let level = 0;
  if (parentFolderId) {
    const parentFolder = folders.find(f => f.id === parentFolderId);
    if (parentFolder) {
      level = (parentFolder.level || 0) + 1;
      
      // ✅ LIMIT: Maximum 3 levels (0, 1, 2)
      if (level >= 3) {
        alert('Máximo 3 niveles de carpetas permitidos');
        return;
      }
    }
  }
  
  const response = await fetch('/api/folders', {
    method: 'POST',
    body: JSON.stringify({ 
      userId, 
      name,
      parentFolderId,
      level,
    }),
  });
  // ...
};
```

#### 4. UI Changes

**Botón "Crear Subcarpeta":**
- Aparece en hover sobre cada carpeta
- Solo visible si `canAddSubfolder === true` (level < 2)
- Icono: `FolderPlus`
- Prompt: "Nombre de la subcarpeta:"

**Render:**
```typescript
{buildFolderHierarchy(folders).map(folder => renderFolderWithChildren(folder, 0))}
```

---

## 🎨 User Experience

### Visual Hierarchy

```
📁 Carpetas (sección colapsable)
  ▼ 📂 Marketing (carpeta expandida)
      📄 Conversación: "Plan de Marketing 2025"
      📄 Conversación: "Estrategia Redes Sociales"
      ─────────────────────────────────────
      ▼ 📁 Campañas (subcarpeta nivel 1)
          📄 Conversación: "Campaña Verano"
          ─────────────────────────────────────
          ▼ 📁 Q1 2025 (subcarpeta nivel 2)
              📄 Conversación: "Análisis Q1"
              [Sin botón FolderPlus - max nivel]
  
  ▶ 📂 Ventas (carpeta colapsada)
```

**Jerarquía visual:**
- Las subcarpetas aparecen DENTRO de la carpeta padre cuando está expandida
- Un borde sutil (`border-t`) separa subcarpetas de conversaciones
- Background diferenciado (`bg-slate-50`) para subcarpetas
- Recursión completa hasta 3 niveles
```

### Interactions

**Crear carpeta raíz:**
1. Click en botón "+" junto a "Carpetas"
2. **Modal elegante aparece** con:
   - Título: "Nueva carpeta"
   - Input con placeholder: "Ej: Marketing"
   - Indicador: "Nivel 1 de 3" con 3 círculos (● ○ ○)
3. Escribir nombre y Enter (o click "Crear carpeta")
4. Carpeta aparece en la lista

**Crear subcarpeta:**
1. Hover sobre carpeta existente (nivel 0 o 1)
2. Click en ícono `FolderPlus` (solo visible si level < 2)
3. **Modal elegante aparece** con:
   - Título: "Nueva subcarpeta"
   - Badge verde: "Se creará dentro de: [Nombre Padre]"
   - Input con placeholder: "Ej: Campañas Digitales"
   - Indicador: "Nivel 2 de 3" con círculos (● ● ○)
4. Escribir nombre y Enter
5. **Subcarpeta aparece DENTRO de la carpeta padre** (cuando está expandida)

**Límite alcanzado:**
1. En carpetas de nivel 2, NO aparece el botón `FolderPlus`
2. Validación en frontend: No permite abrir modal
3. Validación en backend: API rechaza si level >= 3

---

## 📊 Examples

### Ejemplo 1: Organización por Departamento

```
📁 Recursos Humanos
  ├─ 📁 Reclutamiento
  │   ├─ 📁 Vacantes Abiertas
  │   │   ├─ Conversación: "Ingeniero Senior"
  │   │   └─ Conversación: "Product Manager"
  │   └─ 📁 Entrevistas
  │
  └─ 📁 Onboarding
      └─ 📁 Semana 1
```

### Ejemplo 2: Organización por Cliente

```
📁 Clientes
  ├─ 📁 Salfa Corp
  │   ├─ 📁 SSOMA
  │   │   └─ Conversación: "Manual SSOMA"
  │   └─ 📁 Legal
  │
  └─ 📁 GetAI Factory
      └─ 📁 Productos
```

---

## ✅ Validation & Limits

### Level Calculation
```typescript
// Root folder
level = 0

// Subfolder
level = parent.level + 1 = 0 + 1 = 1

// Sub-subfolder
level = parent.level + 1 = 1 + 1 = 2

// Attempting third level
level = parent.level + 1 = 2 + 1 = 3 ❌ BLOCKED
```

### Frontend Validation
- Button `FolderPlus` only shows if `(folder.level || 0) < 2`
- Before API call: Check if level would be >= 3

### Backend Validation
- API rejects if `level >= 3`
- Returns HTTP 400 with error message

---

## 🔒 Backward Compatibility

- ✅ **Existing folders:** Treated as level 0 (root) if `level` is undefined
- ✅ **Existing conversations:** Continue to work with `folderId` (no changes needed)
- ✅ **No data migration:** Optional fields don't break existing data
- ✅ **Graceful fallback:** If parent not found, folder becomes root

---

## 🔐 Security

All existing security measures preserved:
- ✅ Folders filtered by `userId`
- ✅ Only user can create their folders
- ✅ Only user can delete their folders
- ✅ Conversations remain isolated per user

---

## 🧪 Testing

### Manual Testing Steps

**Test 1: Create Root Folder**
1. Click "+" next to "Carpetas"
2. Enter: "Marketing"
3. Verify folder appears

**Test 2: Create Subfolder (Level 1)**
1. Hover over "Marketing"
2. Click `FolderPlus` icon
3. Enter: "Campañas"
4. Verify subfolder appears indented under "Marketing"

**Test 3: Create Sub-Subfolder (Level 2)**
1. Expand "Marketing"
2. Hover over "Campañas"
3. Click `FolderPlus` icon
4. Enter: "Q1 2025"
5. Verify sub-subfolder appears indented under "Campañas"

**Test 4: Attempt Level 3 (Should Block)**
1. Expand to Level 2 folder
2. Hover over Level 2 folder
3. Verify `FolderPlus` button does NOT appear ✅
4. Or if manually calling API: Receive "Maximum 3 folder levels allowed" error

**Test 5: Drag & Drop**
1. Create conversation in "Marketing"
2. Drag to "Campañas" subfolder
3. Verify conversation moves
4. Expand "Campañas" - conversation should be there

**Test 6: Delete Parent Folder**
1. Delete parent folder with subfolders
2. Verify conversations move to "Sin Carpeta"
3. Verify subfolders are also deleted (cascade)

---

## 📝 Console Logs

**Creating root folder:**
```
🚀 Starting createNewFolder with name: Marketing
📋 userId: 114671162830729001607
📁 parentFolderId: undefined
✅ Carpeta creada en Firestore: abc123 Name: Marketing Level: 0
```

**Creating subfolder:**
```
🚀 Starting createNewFolder with name: Campañas
📋 userId: 114671162830729001607
📁 parentFolderId: abc123
✅ Carpeta creada en Firestore: xyz789 Name: Campañas Level: 1
```

**Attempting level 3:**
```
Alert: "Máximo 3 niveles de carpetas permitidos"
(No API call made)
```

---

## 💡 Future Enhancements

- [ ] **Folder icons:** Different icons per level or type
- [ ] **Folder colors:** Custom colors per folder
- [ ] **Bulk operations:** Move multiple conversations at once
- [ ] **Folder templates:** Pre-defined folder structures
- [ ] **Search within folders:** Filter conversations by folder hierarchy
- [ ] **Folder sharing:** Share entire folder structure with team
- [ ] **Folder metadata:** Description, tags, owner

---

## 📚 References

**Data Model:**
- `src/lib/firestore.ts:Folder` interface
- `src/lib/firestore.ts:createFolder()` function

**API:**
- `src/pages/api/folders/index.ts:POST` - Create folder

**Frontend:**
- `src/components/ChatInterfaceWorking.tsx:buildFolderHierarchy()` - Build tree
- `src/components/ChatInterfaceWorking.tsx:renderFolderWithChildren()` - Recursive render
- `src/components/ChatInterfaceWorking.tsx:createNewFolder()` - Create with parent

---

## 🎨 UI Details

### Visual Indicators

**Indentation:**
- Level 0: No indent
- Level 1: `ml-3` (12px)
- Level 2: `ml-6` (24px)

**Subfolder Button:**
- Icon: `FolderPlus`
- Tooltip: "Crear subcarpeta"
- Visibility: `opacity-0 group-hover:opacity-100`
- Condition: Only shown if `canAddSubfolder` (level < 2)

**Background Colors:**
- Root folders: `bg-slate-50`
- Subfolders container: `bg-slate-50 dark:bg-slate-700/30`

---

## ✅ Backward Compatibility

### Data Migration

**Not required!** ✅

- Existing folders without `level` field: Treated as level 0 (root)
- Existing folders without `parentFolderId`: Treated as root folders
- All existing functionality preserved

### API Compatibility

**Request format (backward compatible):**
```typescript
// Old format (still works - creates root folder)
{
  userId: "123",
  name: "Folder Name"
}

// New format (creates subfolder)
{
  userId: "123",
  name: "Subfolder Name",
  parentFolderId: "parent-id",
  level: 1
}
```

---

**Last Updated:** 2025-11-13  
**Version:** 1.0.0  
**Aligned With:** `alignment.mdc`, `data.mdc`, `firestore.mdc`

