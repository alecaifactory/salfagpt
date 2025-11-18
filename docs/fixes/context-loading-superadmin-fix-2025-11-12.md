# Fix: Context Management No Carga para SuperAdmin

**Fecha:** 2025-11-12  
**Usuario Afectado:** SuperAdmin (alec@getaifactory.com)  
**Síntoma:** Modal de "Context Management" muestra "No context sources found" a pesar de que existen 885 fuentes en la base de datos  
**Severidad:** Alta (funcionalidad crítica no disponible)

---

## 🔍 Diagnóstico

### Síntoma Reportado

Al abrir el modal de "Context Management" como SuperAdmin, se mostraba:
- ✅ Modal se abre correctamente
- ❌ "No context sources found" 
- ❌ No se muestran las organizaciones ni los dominios

### Investigación

1. **Verificación de datos en Firestore:**
   ```bash
   Total context sources: 885
   Con organizationId: 885
   Organizaciones: 4
   ```

2. **Verificación de permisos de usuario:**
   ```
   Email: alec@getaifactory.com
   Role: superadmin
   OrganizationId: getaifactory.com ✅
   ```

3. **Análisis del código:**
   - Component: `ContextManagementDashboard.tsx`
   - API Endpoint: `/api/context-sources/by-organization`
   - Lógica: SuperAdmin debe ver TODAS las organizaciones

### Causa Raíz

**Problema en:** `src/pages/api/context-sources/by-organization.ts` líneas 128-148

**Lógica incorrecta:**
```typescript
// ❌ ANTES (INCORRECTO):
// 1. Obtener usuarios de la organización
const usersSnapshot = await firestore
  .collection(COLLECTIONS.USERS)
  .where('organizationId', '==', org.id)
  .get();

const orgUserIds = usersSnapshot.docs.map(doc => doc.id);

// 2. Consultar fuentes por userId (PROBLEMA AQUÍ)
for (let i = 0; i < orgUserIds.length; i += batchSize) {
  const batch = orgUserIds.slice(i, i + batchSize);
  const sourcesSnapshot = await firestore
    .collection(COLLECTIONS.CONTEXT_SOURCES)
    .where('userId', 'in', batch)  // ❌ Solo encuentra fuentes por userId
    .get();
}
```

**Por qué fallaba:**

1. Para org "GetAI Factory" (ID: `getaifactory.com`):
   - Encuentra usuario: `alec@getaifactory.com` con userId: `usr_uhwqffaqag1wrryd82tw`
   - Consulta fuentes con `userId == usr_uhwqffaqag1wrryd82tw`
   
2. PERO las context sources tienen:
   ```
   {
     id: "...",
     userId: "114671162830729001607",  // ← Usuario diferente (CLI uploads)
     organizationId: "getaifactory.com", // ← ID de organización correcto
     name: "documento.pdf"
   }
   ```

3. Resultado: **0 fuentes encontradas** porque el `userId` no coincide

**El problema fundamental:**
- Las fuentes tienen `organizationId` correcto
- Pero fueron creadas por un usuario diferente (via CLI con userId 114671162830729001607)
- La consulta por `userId` no las encontraba

---

## ✅ Solución Implementada

**Cambio en:** `src/pages/api/context-sources/by-organization.ts`

**Lógica corregida:**
```typescript
// ✅ DESPUÉS (CORRECTO):
// Consultar directamente por organizationId
const sourcesSnapshot = await firestore
  .collection(COLLECTIONS.CONTEXT_SOURCES)
  .where('organizationId', '==', org.id)  // ✅ Consulta directa
  .get();

sourcesSnapshot.docs.forEach(doc => {
  const data = doc.data();
  allOrgSources.push({
    id: doc.id,
    ...data,
    addedAt: data.addedAt?.toDate?.() || new Date(data.addedAt),
  });
});
```

**Beneficios del cambio:**

1. ✅ **Más eficiente**: Una sola consulta en lugar de múltiples batches
2. ✅ **Más correcto**: Encuentra fuentes por su organización, no por usuarios específicos
3. ✅ **Más escalable**: No está limitado por el límite de 10 items en `where IN` de Firestore
4. ✅ **Más robusto**: Funciona sin importar qué usuario subió las fuentes

---

## 🧪 Verificación

### Antes del Fix
```bash
GET /api/context-sources/by-organization
Response:
{
  "organizations": [
    {
      "name": "GetAI Factory",
      "totalSources": 0,  // ❌ INCORRECTO
      "domains": []
    },
    // ... otras orgs también vacías
  ]
}
```

### Después del Fix (Esperado)
```bash
GET /api/context-sources/by-organization
Response:
{
  "organizations": [
    {
      "name": "GetAI Factory",
      "totalSources": 885,  // ✅ CORRECTO
      "domains": [
        {
          "domainId": "getaifactory.com",
          "domainName": "getaifactory.com",
          "sourceCount": 885,
          "sources": [...]
        }
      ]
    },
    {
      "name": "Salfa Corp",
      "totalSources": ...,
      "domains": [...]
    }
  ]
}
```

---

## 📋 Testing Checklist

### Pruebas Manuales (en http://localhost:3000)

**Como SuperAdmin (alec@getaifactory.com):**
- [ ] Abrir modal "Context Management"
- [ ] Verificar que se muestren las 4 organizaciones
- [ ] Expandir "GetAI Factory" → Ver 885 fuentes
- [ ] Expandir "Salfa Corp" → Ver fuentes de Salfa
- [ ] Verificar que cada fuente muestra metadata correcta
- [ ] Seleccionar una fuente → Ver detalles completos
- [ ] Verificar que no hay errores en consola

**Como Admin de Salfa (ej: fdiazt@salfagestion.cl):**
- [ ] Abrir modal "Context Management"
- [ ] Verificar que solo ve "Salfa Corp"
- [ ] NO debe ver "GetAI Factory" u otras orgs
- [ ] Verificar fuentes de su organización

---

## 🚀 Deployment

### Pre-Deployment
```bash
# 1. Type check
npm run type-check

# 2. Build
npm run build

# 3. Test local
npm run dev
# Abrir http://localhost:3000 y verificar
```

### Deployment to Production
```bash
# Staging first
gcloud run deploy cr-salfagpt-ai-ft-staging \
  --region=us-east4 \
  --project=salfagpt

# If successful, deploy to production
gcloud run deploy cr-salfagpt-ai-ft-prod \
  --region=us-east4 \
  --project=salfagpt
```

### Post-Deployment Verification
```bash
# Check logs for errors
gcloud logging read "resource.type=cloud_run_revision AND severity>=ERROR" \
  --limit=20 \
  --project=salfagpt

# Test SuperAdmin access
# Login as alec@getaifactory.com
# Open Context Management
# Verify 885 sources load
```

---

## 📊 Impact Assessment

### Backward Compatibility
- ✅ **100% Backward Compatible**
- ✅ No breaking changes
- ✅ Existing data structure unchanged
- ✅ API response format unchanged

### Performance Impact
- ✅ **Mejor performance**: 1 consulta en lugar de N batches
- ✅ Menos latencia para organizaciones grandes
- ✅ No cambia para usuarios regulares (no usan este endpoint)

### User Impact
- ✅ **SuperAdmin**: Ahora puede ver todas las fuentes
- ✅ **Admin**: Ahora puede ver las fuentes de su org
- ✅ **Regular Users**: Sin cambios (usan endpoint diferente)

---

## 🔗 Files Modified

1. **src/pages/api/context-sources/by-organization.ts**
   - Líneas 128-147: Cambio de query de userId a organizationId
   - Eliminado: Batching por userId
   - Agregado: Query directa por organizationId

---

## 📚 Related Documentation

- `.cursor/rules/privacy.mdc` - User data isolation (still preserved)
- `.cursor/rules/organizations.mdc` - Multi-org architecture
- `.cursor/rules/data.mdc` - Context source schema
- `docs/features/org-scoped-context-management-2025-11-11.md` - Feature doc

---

## 🎯 Root Cause Analysis

**Why did this happen?**

1. **Original implementation** assumed all context sources belong to users who belong to organizations
2. **CLI uploads** created sources with `organizationId` but with a technical user (`114671162830729001607`)
3. That technical user is NOT in the `users` collection with `organizationId == 'getaifactory.com'`
4. Therefore, the query for users → then sources by userId → found 0 results

**Prevention for future:**

- ✅ **Direct queries by organizationId** when data already has that field
- ✅ **Don't assume user-based filtering** for org-scoped data
- ✅ **Test with CLI-uploaded content** (different userId patterns)
- ✅ **Add integration tests** for SuperAdmin access

---

## ✅ Success Criteria

Fix is successful when:
- [x] Code changes complete
- [ ] Type check passes
- [ ] Build succeeds
- [ ] Manual testing complete (SuperAdmin sees 885 sources)
- [ ] Manual testing complete (Admin sees only their org)
- [ ] No console errors
- [ ] Deployed to staging
- [ ] Verified in staging
- [ ] Deployed to production

---

**Status:** ✅ Fix implemented, ready for testing  
**Next Step:** User should refresh page and test Context Management modal  
**Rollback:** Simply revert commit if issues arise (backward compatible)





