# Sistema de Recuperación de Archivos Faltantes

**Fecha:** 2025-11-15  
**Feature:** Recovery UI para documentos sin archivo original  
**Estado:** ✅ Implementado  
**Componentes:** DocumentViewerWithBugReport, MissingFileBugReportModal, API endpoint

---

## 🎯 Problema Resuelto

### Antes
Cuando un documento no tenía archivo original disponible:
- ❌ Solo mostraba mensaje "Vista de solo texto"
- ❌ Usuario no sabía por qué faltaba el archivo
- ❌ No había forma de reportar el problema
- ❌ No había forma de recuperar el archivo

### Después
- ✅ Mensaje explicativo claro sobre por qué falta el archivo
- ✅ Explicación de las posibles causas
- ✅ Botón "Reportar Problema" que crea ticket automáticamente
- ✅ Captura automática de screenshot para contexto
- ✅ Información diagnóstica incluida para el equipo técnico
- ✅ Ticket va directo al Backlog de Stella

---

## 🏗️ Arquitectura

### Flujo Completo

```
1. Usuario abre documento en visor
   ↓
2. API intenta cargar archivo original desde Cloud Storage
   ↓
3. Si archivo no existe:
   - Genera HTML con texto extraído
   - Muestra aviso con explicación
   - Incluye botones de acción
   ↓
4. Usuario hace click en "🐛 Reportar Problema"
   ↓
5. Iframe envía mensaje a parent window vía postMessage
   ↓
6. DocumentViewerWithBugReport recibe mensaje
   ↓
7. Abre MissingFileBugReportModal con datos pre-llenados
   ↓
8. Usuario puede agregar descripción adicional (opcional)
   ↓
9. Usuario hace click en "Enviar a Backlog"
   ↓
10. POST a /api/stella/missing-file-report
   ↓
11. Se crea ticket en feedback_tickets collection
   ↓
12. Usuario ve confirmación: "✅ Reporte enviado"
   ↓
13. Equipo técnico ve ticket en Stella Backlog
```

---

## 📄 Componentes Creados

### 1. Enhanced HTML Preview (API)
**Archivo:** `src/pages/api/context-sources/[id]/file.ts`

**Cambios:**
- ✅ Mejorado el HTML de "Vista de solo texto"
- ✅ Agregado sección de explicación (por qué falta el archivo)
- ✅ Agregado botón "Reportar Problema"
- ✅ Agregado botón "Entendido, Ver Texto"
- ✅ Implementado postMessage para comunicación con parent

**Ejemplo HTML generado:**
```html
<div class="notice">
  <div class="notice-title">
    ⚠️ Vista de solo texto - Archivo PDF original no disponible
  </div>
  <div class="notice-text">
    El texto extraído está disponible abajo, pero el archivo PDF original 
    no se encuentra en Cloud Storage.
  </div>
  
  <div class="explanation">
    <div class="explanation-title">¿Por qué ocurre esto?</div>
    <ul>
      <li>Documento subido antes de Octubre 2025</li>
      <li>Ruta de almacenamiento cambió tras migración</li>
      <li>Archivo eliminado o no disponible</li>
    </ul>
  </div>
  
  <div class="recovery-actions">
    <button onclick="reportMissingFile()">
      🐛 Reportar Problema
    </button>
    <button onclick="window.parent.postMessage({action: 'close'}, '*')">
      ✓ Entendido, Ver Texto
    </button>
  </div>
</div>
```

---

### 2. Bug Report Modal
**Archivo:** `src/components/MissingFileBugReportModal.tsx`

**Características:**
- ✅ Auto-captura screenshot (si html2canvas disponible)
- ✅ Información pre-llenada del documento
- ✅ Información diagnóstica para el equipo técnico
- ✅ Campo de descripción opcional para el usuario
- ✅ Botón "Enviar a Backlog"
- ✅ Feedback visual de progreso

**Props:**
```typescript
interface MissingFileBugReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceId: string;
  sourceName: string;
  agentName?: string;
  userId: string;
  userEmail: string;
  userName: string;
  diagnostic?: {
    hasExtractedData?: boolean;
    hasStoragePath?: boolean;
    extractedDataSize?: number;
    sourceUserId?: string;
    storagePath?: string;
  };
}
```

---

### 3. Document Viewer Wrapper
**Archivo:** `src/components/DocumentViewerWithBugReport.tsx`

**Propósito:**
- Wrapper que integra DocumentViewerModal y MissingFileBugReportModal
- Escucha mensajes del iframe (postMessage)
- Abre modal de bug report cuando se detecta el mensaje
- Mantiene ambos modales sincronizados

**Uso:**
```tsx
// Reemplazar DocumentViewerModal con DocumentViewerWithBugReport
<DocumentViewerWithBugReport
  source={source}
  isOpen={showViewer}
  onClose={() => setShowViewer(false)}
  userId={userId}
  userEmail={userEmail}
  userName={userName}
  agentName={agentName}
/>
```

---

### 4. API Endpoint
**Archivo:** `src/pages/api/stella/missing-file-report.ts`

**Endpoint:** `POST /api/stella/missing-file-report`

**Request Body:**
```typescript
{
  sourceId: string;
  sourceName: string;
  agentName?: string;
  description?: string;
  storagePath?: string;
  hasStoragePath: boolean;
  hasExtractedData: boolean;
  extractedDataSize: number;
  sourceUserId: string;
  screenshot?: string; // Base64 encoded PNG
  reportedByEmail: string;
  reportedByName: string;
}
```

**Response:**
```typescript
{
  success: true;
  ticketId: string;
  message: string;
}
```

**Ticket Created in Firestore:**
```typescript
{
  title: "Archivo faltante: Documento.pdf",
  description: "Descripción del usuario...",
  category: "missing_document",
  subcategory: "storage_issue",
  priority: "medium",
  status: "open",
  
  relatedSourceId: "abc123",
  relatedSourceName: "Documento.pdf",
  relatedAgentName: "Mi Agente",
  
  diagnostic: {
    storagePath: "documents/...",
    hasStoragePath: true/false,
    hasExtractedData: true/false,
    extractedDataSize: 12345,
    sourceUserId: "usr_xxx",
    currentUserId: "usr_xxx",
    userIdMatch: true/false,
    likelyReason: "legacy_document_no_storage" | 
                  "userid_format_mismatch" | 
                  "storage_file_deleted_or_corrupted"
  },
  
  reportedBy: "usr_xxx",
  reportedByEmail: "user@domain.com",
  reportedByName: "Usuario",
  
  screenshot: "data:image/png;base64,...",
  
  createdAt: Timestamp,
  updatedAt: Timestamp,
}
```

---

## 🔍 Razones por las que Falta el Archivo

El sistema ahora identifica automáticamente la razón más probable:

### 1. Legacy Document (Pre-Cloud Storage)
**Indicador:**
```typescript
diagnostic: {
  hasStoragePath: false,
  likelyReason: "legacy_document_no_storage"
}
```

**Explicación:**
- Documento subido antes de Octubre 2025
- En ese momento solo se guardaba el texto extraído
- No se implementaba subida a Cloud Storage
- Solo existe extractedData en Firestore

**Cantidad estimada:** ~850+ documentos

**Solución:**
- Usuario debe re-subir archivo original (si lo tiene)
- O marcar documento como "solo texto" intencionalmente

---

### 2. User ID Format Mismatch
**Indicador:**
```typescript
diagnostic: {
  hasStoragePath: true,
  sourceUserId: "114671162830729001607",  // Numeric
  currentUserId: "usr_uhwqffaqag1wrryd82tw",  // Hash
  userIdMatch: false,
  likelyReason: "userid_format_mismatch"
}
```

**Explicación:**
- Archivo subido con Google OAuth numeric ID
- Ruta en Cloud Storage: `gs://bucket/114671162830729001607/agent/file.pdf`
- Usuario migrado a hash format
- Sistema busca en: `gs://bucket/usr_uhwqffaqag1wrryd82tw/agent/file.pdf`
- ❌ Archivo existe pero en ruta antigua

**Cantidad estimada:** ~30 documentos

**Solución:**
- Migrar storage paths (script automático)
- O actualizar download logic para intentar ambas rutas

---

### 3. Archivo Eliminado o Corrupto
**Indicador:**
```typescript
diagnostic: {
  hasStoragePath: true,
  userIdMatch: true,
  likelyReason: "storage_file_deleted_or_corrupted"
}
```

**Explicación:**
- Metadata indica storagePath correcto
- Pero archivo no existe en Cloud Storage
- Eliminado manualmente o error de upload

**Cantidad estimada:** <10 documentos

**Solución:**
- Usuario debe re-subir archivo original

---

## 🎯 Casos de Uso

### Caso 1: Usuario Regular ve documento faltante
1. Abre documento en visor
2. Ve aviso de archivo faltante con explicación
3. Click en "Reportar Problema"
4. Modal se abre con info pre-llenada
5. Opcionalmente agrega descripción
6. Click en "Enviar a Backlog"
7. ✅ Ticket creado, equipo técnico notificado

---

### Caso 2: SuperAdmin ve documento faltante
1. Abre documento en visor
2. Ve aviso de archivo faltante
3. **Opción A:** Reportar problema (como usuario regular)
4. **Opción B:** Re-subir archivo ahí mismo (FUTURE)
   - Modal de re-upload
   - Selecciona archivo PDF
   - Sistema actualiza storagePath
   - Documento disponible inmediatamente

---

### Caso 3: Equipo Técnico revisa ticket
1. Ve ticket en Stella Backlog
2. Revisa información diagnóstica
3. Identifica causa:
   - Legacy → Marcar como "solo texto" o pedir re-upload
   - userId mismatch → Ejecutar migrate-storage-paths
   - Eliminado → Contactar usuario para re-upload
4. Resuelve ticket
5. Usuario recibe notificación

---

## 📊 Información Capturada en Ticket

### Campos de Identificación
- ✅ Título: "Archivo faltante: [nombre documento]"
- ✅ Documento ID y nombre
- ✅ Agente relacionado
- ✅ Usuario reportador

### Información Diagnóstica
- ✅ Storage path (si existe)
- ✅ Tamaño del texto extraído
- ✅ userId del source vs userId actual
- ✅ Si coinciden los userIds
- ✅ Razón más probable del problema

### Información de Contexto
- ✅ Screenshot automático (si posible)
- ✅ Descripción del usuario (opcional)
- ✅ Email y nombre del reportador
- ✅ Timestamp del reporte

---

## 🔧 Implementación en Otros Componentes

### Para usar en cualquier modal de documentos:

**Paso 1:** Importar wrapper
```typescript
import DocumentViewerWithBugReport from './DocumentViewerWithBugReport';
```

**Paso 2:** Reemplazar DocumentViewerModal
```typescript
// ❌ ANTES
<DocumentViewerModal
  source={source}
  isOpen={showViewer}
  onClose={() => setShowViewer(false)}
  userId={userId}
  userEmail={userEmail}
  userName={userName}
/>

// ✅ DESPUÉS
<DocumentViewerWithBugReport
  source={source}
  isOpen={showViewer}
  onClose={() => setShowViewer(false)}
  userId={userId}
  userEmail={userEmail}
  userName={userName}
  agentName={agentName} // Opcional pero recomendado
/>
```

---

## 🧪 Testing

### Test 1: Ver mensaje de archivo faltante
```bash
# 1. Abrir documento legacy (sin storagePath)
# 2. Verificar que muestre aviso amarillo
# 3. Verificar que liste las 3 posibles razones
# 4. Verificar que muestre botones
```

### Test 2: Reportar problema
```bash
# 1. Click en botón "🐛 Reportar Problema"
# 2. Verificar que modal se abre
# 3. Verificar que info está pre-llenada
# 4. Agregar descripción opcional
# 5. Click en "Enviar a Backlog"
# 6. Verificar confirmación "✅ Reporte enviado"
# 7. Verificar ticket en feedback_tickets collection
```

### Test 3: Información diagnóstica
```bash
# 1. Abrir ticket creado en Firestore
# 2. Verificar que tiene diagnostic object
# 3. Verificar que likelyReason está correcto
# 4. Verificar que screenshot está incluido (si capturado)
```

---

## 📋 Próximas Mejoras

### Phase 2: Re-Upload UI (SuperAdmin)
```tsx
// Agregar botón adicional en el aviso para SuperAdmin
{userRole === 'superadmin' && (
  <button onclick="reUploadFile()">
    📤 Volver a Subir Archivo
  </button>
)}
```

Implementar modal de re-upload que:
- Permite seleccionar archivo PDF
- Sube a Cloud Storage con ruta correcta
- Actualiza metadata.storagePath
- Recarga visor automáticamente

---

### Phase 3: Auto-Recovery de userId Mismatch
```typescript
// En downloadFile(), intentar múltiples rutas automáticamente
async function downloadFileSmart(path: string, userId: string) {
  // Try 1: Hash format path
  try {
    return await downloadFile(path.replace('{userId}', userId));
  } catch (error) {
    // Try 2: Google OAuth ID path
    const user = await getUserById(userId);
    if (user?.googleUserId) {
      return await downloadFile(path.replace('{userId}', user.googleUserId));
    }
    throw error;
  }
}
```

---

### Phase 4: Migración Masiva de Storage Paths
```bash
# Script para migrar TODOS los storage paths automáticamente
npm run migrate:storage-paths

# Qué hace:
# 1. Encuentra archivos en rutas antiguas
# 2. Copia a rutas nuevas
# 3. Actualiza Firestore metadata
# 4. Verifica que archivos sean accesibles
```

---

## ✅ Checklist de Implementación

### Backend
- [x] API endpoint para generar HTML mejorado
- [x] Botón "Reportar Problema" en HTML
- [x] postMessage desde iframe a parent
- [x] API endpoint /api/stella/missing-file-report
- [x] Lógica para crear ticket con diagnóstico

### Frontend
- [x] MissingFileBugReportModal component
- [x] DocumentViewerWithBugReport wrapper
- [x] Message listener (postMessage)
- [x] Estado para bug report
- [x] Integración con existing DocumentViewerModal

### Testing
- [ ] Test manual con documento legacy
- [ ] Verificar ticket creado en Firestore
- [ ] Verificar información diagnóstica correcta
- [ ] Test en diferentes navegadores

### Deployment
- [ ] Deploy a production
- [ ] Monitor tickets creados
- [ ] Feedback de usuarios

---

## 📊 Métricas

### KPIs a Trackear
- Número de reportes de archivos faltantes por semana
- Tiempo promedio de resolución
- Razón más común (legacy vs mismatch vs eliminado)
- % de tickets resueltos exitosamente

### Queries Útiles
```typescript
// Contar tickets por razón
SELECT 
  diagnostic.likelyReason,
  COUNT(*) as count
FROM feedback_tickets
WHERE category = 'missing_document'
GROUP BY diagnostic.likelyReason
```

---

## 🎯 Impacto Esperado

### UX Mejorada
- ✅ Usuario entiende por qué falta el archivo
- ✅ Usuario puede reportar problema fácilmente
- ✅ Equipo técnico tiene contexto completo
- ✅ Resolución más rápida

### Operacional
- ✅ Tickets centralizados en un solo lugar
- ✅ Información diagnóstica automática
- ✅ Screenshot incluido para contexto visual
- ✅ Priorización automática (medium priority)

### Técnico
- ✅ Identificación automática de causa raíz
- ✅ Datos para decidir solución (migración vs re-upload)
- ✅ Métricas para priorizar mejoras
- ✅ Audit trail completo

---

**Implementado por:** AI Assistant  
**Revisado por:** Pendiente  
**Deployed:** Pendiente (tras migración de userId)

