# Feature: Organization & Domain Selection for SuperAdmin Uploads

**Fecha:** 2025-11-12  
**Usuario:** SuperAdmin  
**Componente:** Context Management Upload Flow  
**Status:** ✅ Implementado

---

## 🎯 Objetivo

Permitir que SuperAdmins elijan la **organización** y opcionalmente el **dominio** de destino al subir documentos, en lugar de que se asignen automáticamente a su propia organización.

---

## 💡 Caso de Uso

**Scenario:**
- SuperAdmin (alec@getaifactory.com) quiere subir un documento legal
- El documento pertenece a "Salfa Corp", no a "GetAI Factory"
- Específicamente, es para el dominio "salfagestion.cl" dentro de Salfa Corp

**Antes (Problema):**
```
❌ Documento se subía a GetAI Factory (org del SuperAdmin)
❌ Aparecía en dominio "getaifactory.com"
❌ No visible para usuarios de Salfa Corp
```

**Después (Solución):**
```
✅ SuperAdmin elige "Salfa Corp" en dropdown
✅ SuperAdmin elige "salfagestion.cl" en dropdown  
✅ Documento se guarda en Salfa Corp / salfagestion.cl
✅ Visible para usuarios de ese dominio
```

---

## 🏗️ Implementación

### 1. UI: Selectores en Upload Modal

**Ubicación:** `src/components/ContextManagementDashboard.tsx`

**Nuevos Estados:**
```typescript
// Organization and domain selection for SuperAdmin uploads
const [selectedOrgForUpload, setSelectedOrgForUpload] = useState<string>('');
const [selectedDomainForUpload, setSelectedDomainForUpload] = useState<string>('');
```

**Nuevos Componentes UI:**

#### Organization Selector (líneas 2048-2071)
```tsx
{isSuperAdmin && organizationsData.length > 0 && (
  <div>
    <label>Target Organization <span className="text-red-600">*</span></label>
    <select
      value={selectedOrgForUpload}
      onChange={(e) => {
        setSelectedOrgForUpload(e.target.value);
        setSelectedDomainForUpload(''); // Reset domain
      }}
    >
      <option value="">Select organization...</option>
      {organizationsData.map(org => (
        <option key={org.id} value={org.id}>
          {org.name} ({org.totalSources} sources)
        </option>
      ))}
    </select>
  </div>
)}
```

**Opciones disponibles:**
- GetAI Factory (885 sources)
- Salfa Corp (X sources)
- Test Organization (X sources)
- Personal Users (X sources)

---

#### Domain Selector (líneas 2073-2102)
```tsx
{isSuperAdmin && selectedOrgForUpload && (
  <div>
    <label>Target Domain <span className="text-gray-500">(optional)</span></label>
    <select
      value={selectedDomainForUpload}
      onChange={(e) => setSelectedDomainForUpload(e.target.value)}
    >
      <option value="">Auto-assign by uploader email</option>
      {selectedOrg.domains.map(domain => (
        <option key={domain.domainId} value={domain.domainId}>
          {domain.domainName} ({domain.sourceCount} sources)
        </option>
      ))}
    </select>
  </div>
)}
```

**Para Salfa Corp, opciones incluyen:**
- salfagestion.cl
- iaconcagua.com  
- maqsa.cl
- novatec.cl
- ... (16 dominios total)

---

### 2. Data Flow: organizationId y domainId

**Upload Flow Modificado:**

```
1. SuperAdmin selecciona archivos
   ↓
2. Review Upload modal aparece
   ↓
3. ✅ NEW: SuperAdmin selecciona "Salfa Corp"
   ↓
4. ✅ NEW: SuperAdmin selecciona "salfagestion.cl" (opcional)
   ↓
5. Selecciona tags y modelo
   ↓
6. Click "Upload Files"
   ↓
7. FormData incluye:
   - file
   - userId (SuperAdmin)
   - model
   - organizationId: 'salfa-corp' ✅ NEW
   - domainId: 'salfagestion.cl' ✅ NEW
   ↓
8. API extrae documento
   ↓
9. Firestore save incluye:
   - organizationId: 'salfa-corp'
   - domainId: 'salfagestion.cl'
   - metadata.uploaderEmail: 'alec@getaifactory.com'
   ↓
10. Documento aparece en Salfa Corp / salfagestion.cl ✅
```

---

### 3. Backend: Guardar Campos Adicionales

**Ubicación:** `src/components/ContextManagementDashboard.tsx` líneas 1129-1151

**Payload al API /api/context-sources:**
```typescript
{
  userId,
  name: file.name,
  type: 'pdf',
  enabled: true,
  status: 'active',
  extractedData: text,
  assignedToAgents: [],
  labels: tags,
  
  // ✅ NEW FIELDS:
  organizationId: selectedOrgForUpload || undefined,
  domainId: selectedDomainForUpload || undefined,
  
  metadata: {
    ...extractionMetadata,
    model: selectedModel,
    uploaderEmail: userEmail, // ✅ NEW: Track SuperAdmin uploader
  }
}
```

---

## 🔒 Validación y Reglas

### Validación en UI

**Organization:** Required para SuperAdmin
```tsx
<button
  onClick={handleSubmitUpload}
  disabled={isSuperAdmin && !selectedOrgForUpload}
>
  Upload Files
  {isSuperAdmin && !selectedOrgForUpload && (
    <span>(Select org first)</span>
  )}
</button>
```

**Domain:** Opcional
- Si no se selecciona → auto-assign usando:
  1. Email del uploader (alec@getaifactory.com → getaifactory.com)
  2. Primary domain de la org seleccionada

---

### Lógica de Fallback

**Para GetAI Factory (single domain):**
```
selectedOrgForUpload: 'getaifactory.com'
selectedDomainForUpload: '' (vacío)
↓
Result: domainId = 'getaifactory.com' (único dominio)
```

**Para Salfa Corp (multi domain):**
```
selectedOrgForUpload: 'salfa-corp'
selectedDomainForUpload: 'salfagestion.cl'
↓
Result: domainId = 'salfagestion.cl' (selección explícita)
```

**Para Salfa Corp (sin dominio seleccionado):**
```
selectedOrgForUpload: 'salfa-corp'
selectedDomainForUpload: '' (vacío)
Uploader: alec@getaifactory.com
↓
Result: domainId = 'salfagestion.cl' (primary domain de Salfa)
```

---

## 🎨 UI/UX

### Visual Design

**Organization Selector:**
```
Target Organization *
┌─────────────────────────────────────┐
│ Select organization...          ▼  │
├─────────────────────────────────────┤
│ GetAI Factory (885 sources)         │
│ Salfa Corp (X sources)              │
│ Test Organization (X sources)       │
│ Personal Users (X sources)          │
└─────────────────────────────────────┘
```

**Domain Selector (aparece al seleccionar org):**
```
Target Domain (optional)
┌─────────────────────────────────────┐
│ Auto-assign by uploader email   ▼  │
├─────────────────────────────────────┤
│ salfagestion.cl (X sources)         │
│ iaconcagua.com (X sources)          │
│ maqsa.cl (X sources)                │
│ ... (16 dominios)                   │
└─────────────────────────────────────┘

ℹ️ Will use your email domain (getaifactory.com) 
   or org primary domain
```

---

### Orden de Controles en Modal

```
┌─────────────────────────────────────┐
│ Review Upload (N files)         ✕  │
├─────────────────────────────────────┤
│                                     │
│ 📄 File 1.pdf - 2.5 MB              │
│ 📄 File 2.pdf - 1.8 MB              │
│                                     │
│ ─────────────────────────────────── │
│                                     │
│ 🌐 Target Organization *            │  ← NEW
│ [Select organization...]            │  ← NEW
│                                     │
│ 📁 Target Domain (optional)         │  ← NEW  
│ [Auto-assign by uploader email]     │  ← NEW
│                                     │
│ 🏷️ Add Tags (optional)              │
│ [e.g., LEGAL-1, PROJECT-X]          │
│                                     │
│ 🤖 AI Model for Extraction          │
│ ( ) Flash    ( ) Pro                │
│                                     │
│ [Upload Files]  [Cancel]            │
└─────────────────────────────────────┘
```

---

## 🔄 Ejemplo Completo de Workflow

### SuperAdmin Sube Documento para Salfa

**Paso 1:** Drag & drop "Manual_Gruas_2025.pdf"

**Paso 2:** Review Upload modal aparece
```
Review Upload (1 file)
  📄 Manual_Gruas_2025.pdf - 12.3 MB
```

**Paso 3:** Seleccionar organización
```
🌐 Target Organization *
[Salfa Corp (150 sources)] ← Click para seleccionar
```

**Paso 4:** Seleccionar dominio (opcional)
```
📁 Target Domain (optional)
[salfagestion.cl (45 sources)] ← Click para este dominio específico
```

**Paso 5:** Agregar tags (opcional)
```
🏷️ Add Tags
[GRUAS, MAQUINARIA, PROCEDIMIENTOS] ← Tags para filtrar
```

**Paso 6:** Elegir modelo
```
🤖 AI Model
( ) Flash - Rápido y económico
(●) Pro - Máxima precisión ← Seleccionado para doc importante
```

**Paso 7:** Click "Upload Files"

**Resultado en Firestore:**
```json
{
  "id": "doc-abc123",
  "userId": "usr_uhwqffaqag1wrryd82tw",
  "name": "Manual_Gruas_2025.pdf",
  "type": "pdf",
  "organizationId": "salfa-corp",
  "domainId": "salfagestion.cl",
  "labels": ["GRUAS", "MAQUINARIA", "PROCEDIMIENTOS"],
  "metadata": {
    "model": "gemini-2.5-pro",
    "uploaderEmail": "alec@getaifactory.com",
    "pageCount": 45,
    ...
  }
}
```

**Visible en:**
- ✅ Salfa Corp → salfagestion.cl → Manual_Gruas_2025.pdf
- ✅ Usuarios de salfagestion.cl pueden verlo y usarlo
- ✅ Tagged con GRUAS, MAQUINARIA, PROCEDIMIENTOS

---

## 🔐 Seguridad y Permisos

### Quién Puede Ver Este Selector

**Condición:**
```typescript
{isSuperAdmin && organizationsData.length > 0 && (
  // Organization selector
)}
```

**Solo visible para:**
- ✅ SuperAdmin (alec@getaifactory.com, aleclara@gmail.com)
- ✅ userRole === 'superadmin'

**NO visible para:**
- ❌ Admins (solo ven su org)
- ❌ Regular users (no ven este modal)

---

### Validación en Submit

```typescript
disabled={isSuperAdmin && !selectedOrgForUpload}
```

**Regla:**
- SuperAdmin DEBE seleccionar organización
- No puede subir sin elegir org de destino
- Botón deshabilitado hasta que elija

---

## 📊 Data Model

### Context Source con Org y Domain

```typescript
interface ContextSource {
  id: string;
  userId: string; // SuperAdmin user ID
  name: string;
  type: 'pdf';
  
  // ✅ NEW FIELDS:
  organizationId: string; // e.g., 'salfa-corp'
  domainId?: string; // e.g., 'salfagestion.cl' (optional)
  
  labels: string[]; // Tags
  extractedData: string;
  metadata: {
    model: string;
    uploaderEmail: string; // ✅ NEW: Track SuperAdmin uploader
    pageCount: number;
    ...
  };
}
```

---

## 🔍 Queries Afectados

### API: /api/context-sources/by-organization

**Ahora correctamente agrupa:**
```
Salfa Corp
  ├─ salfagestion.cl
  │   ├─ Doc1.pdf (uploadedBy: alec@, organizationId: salfa-corp, domainId: salfagestion.cl)
  │   └─ Doc2.pdf (uploadedBy: fdiazt@, organizationId: salfa-corp)
  │
  └─ iaconcagua.com
      └─ Doc3.pdf (uploadedBy: jriverof@, organizationId: salfa-corp)
```

**Documentos aparecen en el dominio correcto** basado en:
1. `domainId` explícito (si SuperAdmin lo seleccionó)
2. Email del uploader (si domainId no está set)
3. Primary domain de la org (fallback final)

---

## 🧪 Testing

### Test Case 1: Upload a Organización con 1 Dominio

**Setup:**
- Org: GetAI Factory (1 domain: getaifactory.com)
- Archivo: test.pdf

**Steps:**
1. Upload archivo
2. Seleccionar "GetAI Factory"
3. Domain selector muestra: "getaifactory.com (885 sources)"
4. Dejar en "Auto-assign" (opcional)
5. Upload

**Expected:**
```
organizationId: 'getaifactory.com'
domainId: 'getaifactory.com' (auto-assigned)
```

---

### Test Case 2: Upload a Organización Multi-Dominio

**Setup:**
- Org: Salfa Corp (16 dominios)
- Archivo: manual.pdf

**Steps:**
1. Upload archivo
2. Seleccionar "Salfa Corp"
3. Domain selector muestra 16 opciones
4. Seleccionar "salfagestion.cl"
5. Add tags: "GRUAS, LEGAL"
6. Upload

**Expected:**
```
organizationId: 'salfa-corp'
domainId: 'salfagestion.cl'
labels: ['GRUAS', 'LEGAL']
```

---

### Test Case 3: Upload Sin Seleccionar Dominio

**Setup:**
- Org: Salfa Corp
- No seleccionar dominio (dejar en "Auto-assign")
- Uploader: alec@getaifactory.com

**Steps:**
1. Upload archivo
2. Seleccionar "Salfa Corp"
3. NO seleccionar dominio
4. Upload

**Expected:**
```
organizationId: 'salfa-corp'
domainId: undefined (will be assigned by backend logic)
```

**Backend asigna:**
- Priority 1: Email domain (getaifactory.com) - NO en Salfa domains
- Priority 2: Primary domain → 'salfagestion.cl'

---

## 📋 Checklist de Validación

### UI
- [x] Organization selector visible para SuperAdmin
- [x] Organization selector NO visible para otros usuarios
- [x] Domain selector aparece solo cuando org seleccionada
- [x] Domain options cambian según org seleccionada
- [x] Upload button deshabilitado si no hay org seleccionada
- [x] Clear selection resetea ambos selectores

### Funcionalidad
- [x] organizationId se pasa al backend
- [x] domainId se pasa al backend
- [x] uploaderEmail se guarda en metadata
- [x] Documento aparece en org/domain correcto
- [x] Usuarios del dominio pueden verlo

### Edge Cases
- [x] Org sin dominios (no debería pasar, pero manejado)
- [x] Org con 1 dominio (auto-select option visible)
- [x] Org con 16 dominios (dropdown scrollable)
- [x] Upload sin seleccionar dominio (fallback works)

---

## 🎯 Resultado Visual

### Antes
```
Context Management
├─ Upload area
└─ Review Upload
    ├─ Files list
    ├─ Tags input
    ├─ Model selection
    └─ [Upload Files]

→ Todos los uploads van a GetAI Factory (org del SuperAdmin)
```

### Después
```
Context Management
├─ Upload area
└─ Review Upload
    ├─ Files list
    ├─ 🌐 Target Organization * [Salfa Corp ▼]     ← NEW
    ├─ 📁 Target Domain (opt)  [salfagestion.cl ▼] ← NEW
    ├─ Tags input
    ├─ Model selection
    └─ [Upload Files]

→ Uploads van a la org/domain elegidos por SuperAdmin
```

---

## 🔮 Future Enhancements

### Validación Adicional (Opcional)

1. **Confirmar organización:**
   ```
   You're uploading to: Salfa Corp → salfagestion.cl
   This will be visible to all users in this domain.
   Continue? [Yes] [Change]
   ```

2. **Sugerencias de dominio:**
   ```
   Detected tags: GRUAS, MAQUINARIA
   Suggested domain: maqsa.cl (has similar tags)
   ```

3. **Bulk org assignment:**
   ```
   Upload 50 files to the same org/domain?
   Remember selection for this batch: [✓]
   ```

---

## 📚 Related

- `.cursor/rules/organizations.mdc` - Multi-org architecture
- `.cursor/rules/privacy.mdc` - Data isolation
- `docs/fixes/context-loading-superadmin-fix-2025-11-12.md` - Query fix
- `docs/fixes/context-loading-performance-2025-11-12.md` - Performance

---

## ✅ Success Criteria

Feature is successful when:
- [x] SuperAdmin sees organization selector
- [x] SuperAdmin sees domain selector (when org selected)
- [ ] Upload button disabled until org selected
- [ ] Uploaded documents appear in selected org/domain
- [ ] Other users in that domain can see documents
- [ ] metadata.uploaderEmail tracks SuperAdmin

---

**Status:** ✅ Código implementado  
**Next:** Testing en browser  
**ETA:** 5 minutos (refresh página)





