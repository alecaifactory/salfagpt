# V1 vs V2 Feature Comparison

**Created:** 2025-11-15  
**V1 Component:** `src/components/ChatInterfaceWorking.tsx` (8,253 lines)  
**V2 Component:** `src/components/chat-v2/ChatContainer.tsx` + modules  
**Current:** V2 Active (`USE_CHAT_V2 = true` in chat.astro)

---

## 🎯 Objetivo de V2

**Meta:** Mantener TODAS las funcionalidades de V1, pero con:
- ✅ Arquitectura modular (sin flickering)
- ✅ Performance optimizada
- ✅ Código más mantenible
- ✅ Mismo look & feel

**Status Actual:** V2 tiene solo ~30% de las funcionalidades de V1 ❌

---

## 📊 PANEL IZQUIERDO (Sidebar)

### 🔹 Header Section

| Funcionalidad | V1 | V2 | Notas |
|---|---|---|---|
| **Logo Salfacorp** | ✅ | ✅ | Ambos tienen |
| **Título "SALFAGPT"** | ✅ | ✅ | Ambos tienen |
| **Subtítulo/Version** | ❌ | ✅ | V2: "Chat V2 - Arquitectura Optimizada" |
| **Notification Bell** | ✅ | ❌ | V1: NotificationBell component |
| **FeedbackNotificationBell** | ✅ | ❌ | V1: Feedback notifications |
| **Botón "+ Nuevo Agente"** | ✅ | ✅ | Ambos tienen |
| **Role-based visibility** | ✅ | ❌ | V1: Oculto para role='user' |

### 🔹 Agentes Section

| Funcionalidad | V1 | V2 | Notas |
|---|---|---|---|
| **Lista de agentes** | ✅ | ✅ | Ambos tienen |
| **Contador de agentes** | ✅ | ✅ | Ambos tienen |
| **Click para seleccionar** | ✅ | ✅ | Ambos tienen |
| **Colapsable (▶)** | ✅ | ❌ | V1: Sección colapsable |
| **Auto-crear chat** | ✅ | ❌ | V1: Al click agente, crea chat |
| **Badge "Compartido"** | ✅ | ❌ | V1: Verde para agentes compartidos |
| **Botones de acción (hover)** | ✅ | ❌ | V1: 6 botones por agente |
| → Configurar Contexto | ✅ | ❌ | Settings icon |
| → Compartir Agente | ✅ | ❌ | Share2 icon |
| → Editar Nombre | ✅ | ❌ | Pencil icon |
| → Archivar (admin) | ✅ | ❌ | Archive icon |
| → Eliminar (admin) | ✅ | ❌ | X icon |
| → Nuevo Chat | ✅ | ❌ | MessageSquare+Plus icon |
| **Inline editing** | ✅ | ❌ | V1: Click editar, input inline |
| **Timestamps/fechas** | ❌ | ❌ | Ninguno muestra fechas en agentes |
| **Loading state** | ✅ | ❌ | V1: Loader2 spinner |

### 🔹 Carpetas/Proyectos Section

| Funcionalidad | V1 | V2 | Notas |
|---|---|---|---|
| **Sección Carpetas** | ✅ | ❌ | V2: No existe |
| **Lista de carpetas** | ✅ | ❌ | |
| **Contador de carpetas** | ✅ | ❌ | |
| **Colapsable** | ✅ | ❌ | |
| **Botón + Nueva Carpeta** | ✅ | ❌ | |
| **Modal elegante** | ✅ | ❌ | CreateFolderModal |
| **Carpetas jerárquicas (3 niveles)** | ✅ | ❌ | Subcarpetas recursivas |
| **Drag & Drop** | ✅ | ❌ | Arrastrar chats a carpetas |
| **Visual indicators** | ✅ | ❌ | Highlight on drag over |
| **Expandir/colapsar carpetas** | ✅ | ❌ | ▶ arrow per folder |
| **Contador por carpeta** | ✅ | ❌ | Muestra # de chats |
| **Botones de carpeta (hover)** | ✅ | ❌ | |
| → Crear Subcarpeta | ✅ | ❌ | FolderPlus icon |
| → Renombrar | ✅ | ❌ | Pencil icon |
| → Eliminar | ✅ | ❌ | X icon |
| **Inline editing** | ✅ | ❌ | Editar nombre inline |
| **Subcarpetas dentro de padre** | ✅ | ❌ | Renderizado recursivo |
| **Separador visual** | ✅ | ❌ | border-t entre contenido |
| **Background diferenciado** | ✅ | ❌ | Subfolders have bg-slate-50 |

### 🔹 Historial Section

| Funcionalidad | V1 | V2 | Notas |
|---|---|---|---|
| **Lista de conversaciones** | ✅ | ✅ | Ambos tienen |
| **Contador** | ✅ | ✅ | Ambos tienen |
| **Colapsable** | ✅ | ❌ | V1: ▶ arrow |
| **Filtrado por agente** | ✅ | ❌ | V1: Muestra "(filtrado)" |
| **Agent Tag** | ✅ | ❌ | V1: Badge azul con nombre agente |
| **Timestamps** | ✅ | ❌ | V1: lastMessageAt date |
| **Drag & Drop** | ✅ | ❌ | V1: Draggable |
| **Botones de acción (hover)** | ✅ | ❌ | V1: 2 botones por chat |
| → Editar Nombre | ✅ | ❌ | Pencil icon |
| → Archivar | ✅ | ❌ | Archive icon |
| **Inline editing** | ✅ | ❌ | V1: Input inline con Enter/Esc |
| **Empty state** | ✅ | ❌ | V1: Mensaje personalizado |
| **Límite de items** | ❌ | ✅ | V2: Solo 20 items (performance) |
| **Highlight selected** | ✅ | ❌ | V1: bg-purple-50 border |

### 🔹 Archivados Section

| Funcionalidad | V1 | V2 | Notas |
|---|---|---|---|
| **Sección Archivados** | ✅ | ❌ | V2: No existe |
| **Colapsable** | ✅ | ❌ | |
| **Contador total** | ✅ | ❌ | |
| **Subsección Agentes** | ✅ | ❌ | Folder dentro de archivados |
| **Subsección Chats** | ✅ | ❌ | Folder dentro de archivados |
| **Botón Restaurar** | ✅ | ❌ | ArchiveRestore icon |
| **Mostrar solo 3** | ✅ | ❌ | V1: slice(0,3) para no saturar |
| **Expandible por tipo** | ✅ | ❌ | Separado agentes/chats |

### 🔹 User Menu (Footer)

| Funcionalidad | V1 | V2 | Notas |
|---|---|---|---|
| **User avatar/inicial** | ✅ | ❌ | V1: Círculo con gradiente |
| **Nombre de usuario** | ✅ | ✅ | V2: Solo texto simple |
| **Email de usuario** | ✅ | ❌ | V1: Muestra email |
| **Dropdown menu** | ✅ | ❌ | V1: Click abre menú |
| → Configuración | ✅ | ❌ | Settings icon |
| → Cerrar Sesión | ✅ | ❌ | LogOut icon |
| **Estadísticas** | ❌ | ✅ | V2: "X agentes, Y conversaciones" |
| **Admin menu items** | ✅ | ❌ | V1: Items solo para admin/superadmin |
| → User Management | ✅ | ❌ | |
| → Context Management | ✅ | ❌ | |
| → Agent Management | ✅ | ❌ | |
| → Analytics | ✅ | ❌ | |
| → Domain Management | ✅ | ❌ | |
| → Expert Review Panels | ✅ | ❌ | Supervisor/Specialist |
| → Organizations | ✅ | ❌ | SuperAdmin only |

### 🔹 Resize Handle

| Funcionalidad | V1 | V2 | Notas |
|---|---|---|---|
| **Sidebar resizable** | ✅ | ❌ | V1: Drag handle, 240-480px |
| **Visual indicator** | ✅ | ❌ | V1: Hover bg-blue-500 |
| **Cursor change** | ✅ | ❌ | V1: col-resize |

---

## 📊 PANEL CENTRAL (Messages Area)

### 🔹 Header

| Funcionalidad | V1 | V2 | Notas |
|---|---|---|---|
| **Conversation title** | ✅ | ✅ | Ambos muestran título |
| **Agent tag** | ✅ | ❌ | V1: Badge con nombre de agente |
| **Notification Bell** | ✅ | ❌ | V1: En header superior |
| **FeedbackNotificationBell** | ✅ | ❌ | V1: Notificaciones de feedback |
| **Botón "Nueva Conversación"** | ✅ | ❌ | V1: Botón morado superior |
| **Botón "Abrir Stella"** | ✅ | ❌ | V1: Gradient violet-purple |
| **Feature Notification** | ✅ | ❌ | V1: FeatureNotificationCenter |
| **Empty state** | ✅ | ✅ | Mensaje cuando no hay conversación |

### 🔹 Messages List

| Funcionalidad | V1 | V2 | Notas |
|---|---|---|---|
| **User messages** | ✅ | ✅ | Ambos |
| **AI messages** | ✅ | ✅ | Ambos |
| **Markdown rendering** | ✅ | ❓ | V1: MessageRenderer con remark-gfm |
| **Code blocks** | ✅ | ❓ | V1: Syntax highlighting |
| **Tables** | ✅ | ❓ | V1: Formatted tables |
| **Links** | ✅ | ❓ | V1: External + source references |
| **Images** | ✅ | ❓ | V1: Image cards |
| **Source references** | ✅ | ❌ | V1: [1], [2] clickable |
| **Reference panel** | ✅ | ❌ | V1: Expandible debajo del mensaje |
| **Copy button** | ✅ | ❓ | V1: Copy code blocks |
| **Thinking steps** | ✅ | ❌ | V1: "Pensando...", "Buscando..." |
| **Streaming effect** | ✅ | ✅ | Ambos tienen |
| **Loading indicators** | ✅ | ✅ | Ambos tienen |
| **Error messages** | ✅ | ❓ | V1: Error bubbles |
| **Timestamps** | ✅ | ❌ | V1: Muestra hora |
| **Auto-scroll** | ✅ | ✅ | Probablemente ambos |
| **Message actions** | ✅ | ❌ | V1: Copy, regenerate, etc. |

### 🔹 Sample Questions

| Funcionalidad | V1 | V2 | Notas |
|---|---|---|---|
| **Sample questions carousel** | ✅ | ❌ | V1: 3-10 preguntas por agente |
| **Navigation arrows** | ✅ | ❌ | V1: < > para navegar |
| **Click to use** | ✅ | ❌ | V1: Click llena input |
| **Contador "X de 10"** | ✅ | ❌ | V1: Muestra posición |
| **Agent-specific** | ✅ | ❌ | V1: Preguntas por agente ID |

### 🔹 Chat Input Area

| Funcionalidad | V1 | V2 | Notas |
|---|---|---|---|
| **Textarea input** | ✅ | ✅ | Ambos |
| **Botón Enviar** | ✅ | ✅ | Ambos |
| **Placeholder** | ✅ | ✅ | Ambos |
| **Shift+Enter nueva línea** | ✅ | ❓ | V1: Sí, V2: Unknown |
| **Auto-resize** | ✅ | ❓ | V1: Up to 5 rows |
| **Botón Stop** | ✅ | ❌ | V1: StopCircle cuando procesando |
| **Context indicator** | ✅ | ❌ | V1: "Contexto: 0% • ✨ Model" |
| **Model display** | ✅ | ❌ | V1: Sparkles + model name |
| **Active sources count** | ✅ | ❌ | V1: "X fuentes" |
| **Disclaimer text** | ✅ | ❌ | V1: "SalfaGPT puede cometer errores..." |
| **Feedback buttons** | ✅ | ❌ | V1: 👍 Experto, 💬 Calificar |
| **Loading state** | ✅ | ✅ | Ambos |
| **Disabled when no agent** | ✅ | ✅ | Ambos |

---

## 📊 PANEL DERECHO (Context/Workflows)

### 🔹 Stella Sidebar

| Funcionalidad | V1 | V2 | Notas |
|---|---|---|---|
| **Stella chatbot** | ✅ | ❌ | V1: StellaSidebarChat |
| **Botón "Abrir Stella"** | ✅ | ❌ | V1: En header |
| **Stella config (SuperAdmin)** | ✅ | ❌ | V1: StellaConfigurationPanel |
| **Screenshot annotation** | ✅ | ❌ | V1: ScreenshotAnnotator |
| **Marker tool** | ✅ | ❌ | V1: StellaMarkerTool_v2 |

### 🔹 Context Panel

| Funcionalidad | V1 | V2 | Notas |
|---|---|---|---|
| **Context button** | ✅ | ❌ | V1: Botón para expandir panel |
| **Context stats** | ✅ | ❌ | V1: Tokens used/available |
| **Context sections breakdown** | ✅ | ❌ | V1: System, History, Context, etc. |
| **Active sources list** | ✅ | ❌ | V1: Cards clickables |
| **Source details modal** | ✅ | ❌ | V1: ContextSourceSettingsModal |
| **Context logs table** | ✅ | ❌ | V1: Tabla con todas las interacciones |
| **RAG configuration** | ✅ | ❌ | V1: topK, minSimilarity controls |
| **RAG stats** | ✅ | ❌ | V1: Chunks used, similarity avg |

### 🔹 Workflows Panel

| Funcionalidad | V1 | V2 | Notas |
|---|---|---|---|
| **Workflows panel** | ✅ | ❌ | V2: No existe |
| **Workflow list** | ✅ | ❌ | V1: 6+ workflows |
| **Status per workflow** | ✅ | ❌ | V1: available, running, completed |
| **Execute button** | ✅ | ❌ | V1: Por workflow |
| **Configure button** | ✅ | ❌ | V1: Settings por workflow |
| **Progress tracking** | ✅ | ❌ | V1: Loader, percentage |
| **Output preview** | ✅ | ❌ | V1: Green box con resultado |

---

## 📊 TOP BAR (Header Superior)

| Funcionalidad | V1 | V2 | Notas |
|---|---|---|---|
| **Breadcrumb/Title** | ✅ | ❌ | V1: Muestra conversación actual |
| **Agent badge** | ✅ | ❌ | V1: Badge con agente padre |
| **Notification Bell** | ✅ | ❌ | V1: NotificationBell |
| **Feedback Bell** | ✅ | ❌ | V1: FeedbackNotificationBell |
| **Novedades button** | ✅ | ❌ | V1: Changelog |
| **Nueva Conversación button** | ✅ | ❌ | V1: Botón morado |
| **Abrir Stella button** | ✅ | ❌ | V1: Gradient violet |
| **Theme toggle** | ❌ | ❌ | Ninguno tiene visible |
| **User menu** | ✅ | ❌ | V1: En sidebar footer |

---

## 📊 MODALS & OVERLAYS

### 🔹 Modals de Configuración

| Modal | V1 | V2 | Notas |
|---|---|---|---|
| **UserSettingsModal** | ✅ | ❌ | Configuración global |
| **AgentConfigurationModal** | ✅ | ❌ | Config por agente |
| **WorkflowConfigModal** | ✅ | ❌ | Config de workflows |
| **AddSourceModal** | ✅ | ❌ | Agregar fuentes contexto |
| **ContextSourceSettingsModal** | ✅ | ❌ | Detalles de fuente |
| **AgentContextModal** | ✅ | ❌ | Asignar contexto a agente |
| **CreateFolderModal** | ✅ | ❌ | Crear carpetas (NEW) |
| **DomainPromptModal** | ✅ | ❌ | Prompt por dominio |
| **AgentPromptModal** | ✅ | ❌ | Prompt por agente |
| **AgentPromptEnhancer** | ✅ | ❌ | AI-powered enhancement |
| **PromptVersionHistory** | ✅ | ❌ | Historial de versiones |

### 🔹 Modals de Gestión

| Modal | V1 | V2 | Notas |
|---|---|---|---|
| **AgentSharingModal** | ✅ | ❌ | Compartir agentes |
| **ContextManagementDashboard** | ✅ | ❌ | Gestión de contexto |
| **AgentManagementDashboard** | ✅ | ❌ | Gestión de agentes |
| **UserManagementPanel** | ✅ | ❌ | Gestión de usuarios |
| **DomainManagementModal** | ✅ | ❌ | Gestión de dominios |
| **OrganizationsSettingsPanel** | ✅ | ❌ | Multi-org config |

### 🔹 Modals de Analytics

| Modal | V1 | V2 | Notas |
|---|---|---|---|
| **AnalyticsDashboard** | ✅ | ❌ | Analytics general |
| **SalfaAnalyticsDashboard** | ✅ | ❌ | Analytics específico |
| **CostTrackingPanel** | ✅ | ❌ | Seguimiento de costos |

### 🔹 Modals de Expert Review

| Modal | V1 | V2 | Notas |
|---|---|---|---|
| **AgentEvaluationDashboard** | ✅ | ❌ | Evaluación de agentes |
| **EvaluationPanel** | ✅ | ❌ | Panel de evaluación |
| **SupervisorExpertPanel** | ✅ | ❌ | Panel supervisor |
| **SpecialistExpertPanel** | ✅ | ❌ | Panel especialista |
| **DomainQualityDashboard** | ✅ | ❌ | Quality por dominio |
| **AdminApprovalPanel** | ✅ | ❌ | Aprobación admin |
| **DomainConfigPanel** | ✅ | ❌ | Config por dominio |
| **SuperAdminDomainAssignment** | ✅ | ❌ | Asignación de dominios |

### 🔹 Modals de Feedback

| Modal | V1 | V2 | Notas |
|---|---|---|---|
| **ExpertFeedbackPanel** | ✅ | ❌ | Feedback de expertos |
| **UserFeedbackPanel** | ✅ | ❌ | Feedback de usuarios |
| **MyFeedbackView** | ✅ | ❌ | Ver mi feedback |
| **RoadmapModal** | ✅ | ❌ | Sistema de roadmap |
| **FeedbackSuccessToast** | ✅ | ❌ | Notificación de éxito |

### 🔹 Modals de Canales

| Modal | V1 | V2 | Notas |
|---|---|---|---|
| **WhatsAppChannelPanel** | ✅ | ❌ | Integración WhatsApp |
| **GenericChannelPanel** | ✅ | ❌ | Canales genéricos |
| **Google Chat panel** | ✅ | ❌ | Integración Google Chat |

### 🔹 Modals de Finanzas

| Modal | V1 | V2 | Notas |
|---|---|---|---|
| **BrandingManagementPanel** | ✅ | ❌ | Gestión de marca |
| **InvoicingManagementPanel** | ✅ | ❌ | Facturación |
| **MonetizationManagementPanel** | ✅ | ❌ | Monetización |
| **CollectionsManagementPanel** | ✅ | ❌ | Cobranzas |
| **ConciliationManagementPanel** | ✅ | ❌ | Conciliación |
| **PaymentsManagementPanel** | ✅ | ❌ | Pagos |
| **TaxesManagementPanel** | ✅ | ❌ | Impuestos |

### 🔹 Other Modals

| Modal | V1 | V2 | Notas |
|---|---|---|---|
| **ChangelogModal** | ✅ | ❌ | In-app changelog |
| **ProviderManagementDashboard** | ✅ | ❌ | Gestión de providers |
| **RAGConfigPanel** | ✅ | ❌ | Configuración RAG |
| **DocumentViewerModal** | ✅ | ❌ | Ver documentos |

---

## 📊 FUNCIONALIDADES CORE

### 🔹 Data Loading

| Funcionalidad | V1 | V2 | Status |
|---|---|---|---|
| **Load conversations** | ✅ | ✅ | Ambos |
| **Load messages** | ✅ | ✅ | Ambos |
| **Load folders** | ✅ | ❌ | V2: No implementado |
| **Load context sources** | ✅ | ❌ | V2: No implementado |
| **Load user settings** | ✅ | ❌ | V2: No implementado |
| **Load agent config** | ✅ | ❓ | V2: En store? |
| **Load shared agents** | ✅ | ❌ | V2: No implementado |
| **Coordinated loading** | ❌ | ✅ | V2: useCoordinatedLoad hook |
| **Caching** | ✅ | ✅ | V2: ChatStore con cache |
| **Error handling** | ✅ | ❓ | V1: Comprehensive |

### 🔹 Message Sending

| Funcionalidad | V1 | V2 | Status |
|---|---|---|---|
| **Send message** | ✅ | ✅ | Ambos |
| **Streaming response** | ✅ | ✅ | Ambos |
| **Context injection** | ✅ | ❓ | V1: Comprehensive |
| **RAG search** | ✅ | ❓ | V1: Optimized |
| **Fragment mapping** | ✅ | ❌ | V1: Citation tracking |
| **Token counting** | ✅ | ❌ | V1: Real-time stats |
| **Context logs** | ✅ | ❌ | V1: Per-interaction logs |
| **Auto-generate title** | ✅ | ❌ | V1: After first message |

### 🔹 Conversation Management

| Funcionalidad | V1 | V2 | Status |
|---|---|---|---|
| **Create agent** | ✅ | ✅ | Ambos |
| **Create chat** | ✅ | ❌ | V1: Chat linked to agent |
| **Edit title** | ✅ | ❌ | V1: Inline editing |
| **Archive** | ✅ | ❌ | V2: No implementado |
| **Unarchive** | ✅ | ❌ | V2: No implementado |
| **Delete** | ✅ | ❌ | V2: No implementado |
| **Share agent** | ✅ | ❌ | V2: No implementado |
| **Move to folder** | ✅ | ❌ | V2: No folders |
| **Drag & drop** | ✅ | ❌ | V2: No implementado |

### 🔹 Folder Management

| Funcionalidad | V1 | V2 | Status |
|---|---|---|---|
| **Create folder** | ✅ | ❌ | V2: No existe |
| **Create subfolder** | ✅ | ❌ | V2: No existe |
| **Rename folder** | ✅ | ❌ | V2: No existe |
| **Delete folder** | ✅ | ❌ | V2: No existe |
| **Hierarchical (3 levels)** | ✅ | ❌ | V2: No existe |
| **Drag chats to folder** | ✅ | ❌ | V2: No existe |

### 🔹 Context Management

| Funcionalidad | V1 | V2 | Status |
|---|---|---|---|
| **Upload documents** | ✅ | ❌ | V2: No implementado |
| **Toggle sources on/off** | ✅ | ❌ | V2: No implementado |
| **Re-extract** | ✅ | ❌ | V2: No implementado |
| **Validate source** | ✅ | ❌ | V2: No implementado |
| **View source details** | ✅ | ❌ | V2: No implementado |
| **Agent-specific assignment** | ✅ | ❌ | V2: No implementado |

---

## 📊 RESUMEN CUANTITATIVO

### Por Categoría

| Categoría | V1 Features | V2 Features | Missing in V2 | % Complete |
|---|---|---|---|---|
| **Sidebar - Header** | 7 | 2 | 5 | 29% |
| **Sidebar - Agentes** | 14 | 3 | 11 | 21% |
| **Sidebar - Carpetas** | 20 | 0 | 20 | 0% |
| **Sidebar - Historial** | 13 | 4 | 9 | 31% |
| **Sidebar - Archivados** | 8 | 0 | 8 | 0% |
| **Sidebar - User Menu** | 13 | 2 | 11 | 15% |
| **Messages Area - Header** | 7 | 2 | 5 | 29% |
| **Messages Area - Display** | 15 | 6 | 9 | 40% |
| **Messages Area - Input** | 13 | 5 | 8 | 38% |
| **Sample Questions** | 5 | 0 | 5 | 0% |
| **Context Panel** | 7 | 0 | 7 | 0% |
| **Workflows** | 6 | 0 | 6 | 0% |
| **Stella Sidebar** | 4 | 0 | 4 | 0% |
| **Modals - Config** | 12 | 0 | 12 | 0% |
| **Modals - Management** | 6 | 0 | 6 | 0% |
| **Modals - Analytics** | 3 | 0 | 3 | 0% |
| **Modals - Expert** | 8 | 0 | 8 | 0% |
| **Modals - Feedback** | 5 | 0 | 5 | 0% |
| **Modals - Channels** | 3 | 0 | 3 | 0% |
| **Modals - Finanzas** | 7 | 0 | 7 | 0% |
| **Core Functions** | 10 | 5 | 5 | 50% |
| **TOTAL** | **186** | **29** | **157** | **15.6%** |

---

## 🎯 CONCLUSIÓN

**V2 tiene solo ~16% de las funcionalidades de V1** ❌

**Funcionalidades críticas faltantes:**
1. ❌ Carpetas jerárquicas (0%)
2. ❌ Archivados (0%)
3. ❌ Botones de acción (0%)
4. ❌ Context management (0%)
5. ❌ Sample questions (0%)
6. ❌ Workflows (0%)
7. ❌ Stella (0%)
8. ❌ Todos los modals de gestión (0%)
9. ❌ Expert review system (0%)
10. ❌ Multi-org features (0%)

---

## 💡 RECOMENDACIÓN

### Opción A: Completar V2 (4-6 semanas) ⏰

**Portar TODAS las funcionalidades de V1 a V2:**
- Semana 1-2: Sidebar completo (carpetas, archivados, botones)
- Semana 3: Context management
- Semana 4: Modals principales
- Semana 5-6: Expert review, analytics, canales

### Opción B: Revertir a V1 y Optimizar (1-2 semanas) ⚡ RECOMENDADO

**Desactivar V2 temporalmente:**
```typescript
// src/pages/chat.astro
const USE_CHAT_V2 = false; // ← Cambiar a false
```

**Optimizar V1 para resolver problemas de carga:**
- Lazy loading de componentes pesados
- Virtualización de listas largas
- Memoización de computaciones caras
- Code splitting

### Opción C: Híbrido (2-3 semanas) 🔄

**Usar arquitectura de V2 pero con componentes de V1:**
- ChatStore de V2 (state management)
- useCoordinatedLoad de V2 (loading optimization)
- Pero UI completa de V1

---

## 🎯 Mi Recomendación

**Opción B** - Revertir a V1 temporalmente y optimizar:

1. Cambiar `USE_CHAT_V2 = false`
2. Identificar bottlenecks específicos en V1
3. Optimizar solo lo necesario
4. Mantener TODAS las funcionalidades

**Por qué:**
- ✅ Usuarios no pierden funcionalidades
- ✅ Más rápido que portar 157 features
- ✅ Podemos optimizar V1 mientras V2 madura
- ✅ V2 puede seguir desarrollándose en paralelo

---

¿Qué opción prefieres? 🤔
