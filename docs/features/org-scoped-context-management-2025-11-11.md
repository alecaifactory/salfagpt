# Organization-Scoped Context Management

**Created:** 2025-11-11  
**Branch:** feat/multi-org-system-2025-11-10  
**Status:** ✅ Implemented

---

## 🎯 Objective

Enable SuperAdmins and Admins to view context sources grouped by Organization and Domain in the Context Management dashboard, while maintaining user data isolation for regular users.

---

## 🏗️ Architecture

### Access Control

**SuperAdmins:**
- See ALL organizations
- See ALL domains within each organization
- See ALL context sources within each domain
- Grouped view: Organization → Domain → Sources

**Admins:**
- See ONLY their organization(s)
- See ONLY domains they have access to
- See ONLY context sources in their org
- Same grouped view: Organization → Domain → Sources

**Regular Users:**
- See ONLY their own context sources
- Tag-based grouped view (existing behavior)
- No organization/domain grouping

---

## 📊 Data Flow

### SuperAdmin Flow

```
1. Open Context Management Dashboard
   ↓
2. System detects userRole = 'superadmin'
   ↓
3. Calls GET /api/context-sources/by-organization
   ↓
4. API loads ALL organizations
   ↓
5. For each organization:
   - Get users in org (organizationId filter)
   - Get context sources for those users
   - Group sources by domain (from user email)
   ↓
6. Return hierarchical structure:
   organizations: [
     {
       id, name, domains: [
         {
           domainId, sources: [...]
         }
       ]
     }
   ]
   ↓
7. UI renders collapsible tree:
   🏢 Organization Name (3 domains • 245 sources)
     └─ 📁 salfagestion.cl (180 sources)
         └─ 📄 Manual_M001.pdf
         └─ 📄 Procedures_S001.pdf
     └─ 📁 salfa.cl (65 sources)
         └─ 📄 Training_Guide.pdf
```

### Admin Flow

```
1. Open Context Management Dashboard
   ↓
2. System detects userRole = 'admin'
   ↓
3. Calls GET /api/context-sources/by-organization
   ↓
4. API determines user's organization from email domain
   ↓
5. Loads ONLY user's organization(s)
   ↓
6. Same hierarchical structure (filtered to user's org)
   ↓
7. UI renders same collapsible tree (limited scope)
```

---

## 🔧 Implementation Details

### New API Endpoint

**File:** `src/pages/api/context-sources/by-organization.ts`

**Endpoint:** `GET /api/context-sources/by-organization`

**Features:**
- ✅ Role-based access control
- ✅ Organization filtering (SuperAdmin vs Admin)
- ✅ User lookup by organizationId
- ✅ Batched queries (Firestore 'in' limit of 10)
- ✅ Domain grouping from user emails
- ✅ Minimal metadata (no extractedData for performance)

**Query Strategy:**
```typescript
// 1. Get users in organization
users = await firestore
  .collection('users')
  .where('organizationId', '==', orgId)
  .get();

// 2. Batch query sources (10 users at a time)
for (userBatch of users) {
  sources = await firestore
    .collection('context_sources')
    .where('userId', 'in', userBatch)
    .get();
}

// 3. Group by domain (from user email)
domainGroups = groupBy(sources, s => getUserDomain(s.userId));
```

---

### Component Updates

**File:** `src/components/ContextManagementDashboard.tsx`

**Changes:**
1. ✅ Added `userRole` prop
2. ✅ Added `isSuperAdmin` and `isAdmin` detection
3. ✅ Added `organizationsData` state
4. ✅ Added `expandedOrgs` and `expandedDomains` state
5. ✅ Updated `loadFirstPage()` to use org API for admins
6. ✅ Added organization-scoped rendering section
7. ✅ Preserved tag-based view for regular users

**UI Structure:**
```
Organization View (Admins):
┌─────────────────────────────────────────┐
│ 🏢 SuperAdmin View - 2 organizations    │
├─────────────────────────────────────────┤
│                                         │
│ 🌐 Salfa Corp                           │
│    2 domains • 245 sources              │
│    ├─ 📁 salfagestion.cl (180)          │
│    │   └─ [sources...]                  │
│    └─ 📁 salfa.cl (65)                  │
│        └─ [sources...]                  │
│                                         │
│ 🌐 GetAI Factory                        │
│    1 domain • 12 sources                │
│    └─ 📁 getaifactory.com (12)          │
│        └─ [sources...]                  │
└─────────────────────────────────────────┘

Tag View (Regular Users):
┌─────────────────────────────────────────┐
│ 📁 M001 (538 documents)                 │
│    └─ [sources...]                      │
│ 📁 S001 (76 documents)                  │
│    └─ [sources...]                      │
└─────────────────────────────────────────┘
```

**File:** `src/components/ChatInterfaceWorking.tsx`

**Changes:**
1. ✅ Pass `userRole` prop to ContextManagementDashboard

---

## 🔒 Security

### Data Isolation

**SuperAdmin:**
```typescript
// Can see all orgs
const allOrgs = await getAllOrganizations();
```

**Admin:**
```typescript
// Can see only their org(s)
const userOrgs = await getUserOrganizationsByEmail(userEmail);
```

**Regular User:**
```typescript
// Original behavior preserved - only their sources
const sources = await getContextSources(userId);
```

### Verification

Each layer verifies access:
1. ✅ Session authentication
2. ✅ Role verification (admin/superadmin required)
3. ✅ Organization membership check (for admins)
4. ✅ Firestore queries filter by organizationId

---

## 📋 Testing Checklist

### SuperAdmin Testing

- [ ] Login as SuperAdmin (alec@getaifactory.com)
- [ ] Open Context Management Dashboard
- [ ] Verify sees multiple organizations
- [ ] Expand organization → see domains
- [ ] Expand domain → see sources
- [ ] Verify source details show uploader email
- [ ] Verify can select sources across orgs

### Admin Testing

- [ ] Login as Admin (sorellanac@salfagestion.cl)
- [ ] Open Context Management Dashboard
- [ ] Verify sees ONLY Salfa Corp organization
- [ ] Verify sees ONLY salfagestion.cl and salfa.cl domains
- [ ] Verify CANNOT see GetAI Factory sources
- [ ] Verify can select sources in their org
- [ ] Verify cannot see sources from other orgs

### Regular User Testing

- [ ] Login as regular user
- [ ] Open Context Management (if accessible)
- [ ] Verify sees tag-based view (existing behavior)
- [ ] Verify sees ONLY their own sources
- [ ] Verify organization view NOT shown

---

## 🎨 UX Improvements

### Visual Hierarchy

```
Organization (Blue border, blue header)
  ├─ Domain (Gray header)
      └─ Sources (White cards)
```

**Color Coding:**
- Organization level: Blue (`blue-50`, `blue-300`, `blue-700`)
- Domain level: Gray (`gray-50`, `gray-200`, `gray-600`)
- Source level: White with gray borders

**Badges:**
- Organization: `{org.domainCount} domains • {org.totalSources} sources`
- Domain: `{domain.sourceCount} sources`
- Source: Validated badge, page count, uploader email

### Expandable Sections

- Organizations default expanded on first load
- Domains default collapsed
- Click header to toggle
- Smooth transitions
- ChevronRight icon rotates 90° when expanded

---

## 🚀 Performance

### Optimization Strategies

1. **Minimal Metadata**
   - No `extractedData` loaded (can be 100KB+ per source)
   - Only essential fields returned
   - Lazy-load full details on demand

2. **Batched Queries**
   - Users queried in batches of 10 (Firestore 'in' limit)
   - Prevents multiple round-trips

3. **Smart Grouping**
   - Group sources by domain in backend
   - Frontend receives pre-grouped data
   - No client-side filtering needed

4. **Lazy Expansion**
   - Only first org expanded by default
   - Other orgs/domains load on-demand

---

## 📝 API Documentation

### GET /api/context-sources/by-organization

**Access:** SuperAdmin, Admin only

**Query Parameters:** None

**Headers:**
- Cookie: `flow_session` (required)

**Response:**
```json
{
  "organizations": [
    {
      "id": "salfa-corp",
      "name": "Salfa Corp",
      "slug": "salfa-corp",
      "domainCount": 2,
      "totalSources": 245,
      "domains": [
        {
          "domainId": "salfagestion.cl",
          "domainName": "salfagestion.cl",
          "sourceCount": 180,
          "sources": [
            {
              "id": "source-123",
              "name": "Manual_M001.pdf",
              "type": "pdf",
              "status": "active",
              "labels": ["M001", "Manual"],
              "addedAt": "2025-11-10T...",
              "userId": "usr_...",
              "metadata": {
                "originalFileName": "Manual_M001.pdf",
                "pageCount": 45,
                "validated": true,
                "validatedBy": "expert@...",
                "uploaderEmail": "user@salfagestion.cl"
              }
            }
          ]
        },
        {
          "domainId": "salfa.cl",
          "domainName": "salfa.cl",
          "sourceCount": 65,
          "sources": [...]
        }
      ]
    }
  ],
  "metadata": {
    "totalOrganizations": 2,
    "totalSources": 257,
    "loadedBy": "superadmin",
    "durationMs": 1234
  }
}
```

**Error Responses:**
- 401: Unauthorized (not logged in)
- 403: Forbidden (not admin/superadmin)
- 404: User not found
- 500: Server error

---

## ✅ Backward Compatibility

### Preserved Behaviors

1. ✅ Regular users still see tag-based view
2. ✅ Existing `/api/context-sources` endpoint unchanged
3. ✅ All existing props still work
4. ✅ No breaking changes to data model

### New Behaviors

1. ✅ Admins now see organization-scoped view
2. ✅ SuperAdmins see multi-organization view
3. ✅ New prop `userRole` is optional (defaults to regular user)

### Data Model

**No changes to existing documents:**
- ✅ `organizationId` is optional on users
- ✅ Existing sources without org assignment still work
- ✅ All queries still filter by userId first

---

## 🔮 Future Enhancements

### Phase 2 (Next)

- [ ] Add "Select All in Organization" button
- [ ] Add "Select All in Domain" button
- [ ] Filter by organization in tag filter
- [ ] Bulk operations across organizations
- [ ] Organization-level statistics

### Phase 3 (Future)

- [ ] Export context sources by organization
- [ ] Cross-organization source sharing
- [ ] Organization templates
- [ ] Automated organization discovery

---

## 📚 Related Documentation

### Implementation Files
- `src/pages/api/context-sources/by-organization.ts` - NEW API endpoint
- `src/components/ContextManagementDashboard.tsx` - Updated UI
- `src/components/ChatInterfaceWorking.tsx` - Pass userRole prop
- `src/lib/organizations.ts` - Organization utilities
- `src/types/organizations.ts` - Type definitions

### Rules & Principles
- `.cursor/rules/privacy.mdc` - User data isolation
- `.cursor/rules/multi-org.mdc` - Multi-org architecture
- `.cursor/rules/alignment.mdc` - Backward compatibility

---

## 🎉 Success Criteria

✅ **Implemented:**
- [x] SuperAdmins see all organizations
- [x] Admins see only their organization(s)
- [x] Context sources grouped by Org → Domain
- [x] Collapsible organization/domain sections
- [x] Source selection still works
- [x] Regular users unaffected
- [x] Type-safe implementation
- [x] No linter errors
- [x] Backward compatible

🔄 **Pending Testing:**
- [ ] Manual testing with SuperAdmin account
- [ ] Manual testing with Admin account
- [ ] Verify data isolation
- [ ] Verify performance with large datasets

---

**Last Updated:** 2025-11-11  
**Version:** 1.0.0  
**Backward Compatible:** ✅ YES

