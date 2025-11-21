# 📊 User Analytics Interface - Visual Preview

## Layout Overview

```
┌────────────────────────────────────────────────────────────────────────────────┐
│ 📊 Analíticas SalfaGPT                                            [Exportar] [X]│
│ Análisis y métricas de rendimiento de asistentes IA                           │
├────────────────────────────────────────────────────────────────────────────────┤
│                                                                                │
│ 📅 [Date Range]  [Últimos 7 días] [Últimos 30 días] [Todo el tiempo]         │
│ [Agentes ▼] [Efectividad ▼] [Dominios ▼]                                     │
│                                                                                │
├────────────────────────────────────────────────────────────────────────────────┤
│                          📊 Analíticas por Usuario                             │
│                    Selecciona un usuario para ver métricas detalladas         │
├─────────────────────────────────┬──────────────────────────────────────────────┤
│ USER LIST (Left Pane)           │ USER DETAILS (Right Pane)                   │
├─────────────────────────────────┼──────────────────────────────────────────────┤
│                                 │                                              │
│ ┌─────────────────────────────┐ │  (Empty state when no user selected)         │
│ │ [AA] Alec                   │ │                                              │
│ │ alec@getaifactory.com       │ │          👥                                  │
│ │ 💬 234 msgs 📊 15 convs     │ │   Selecciona un usuario                      │
│ │ 🕐 Nov 4                    │ │   para ver detalles                          │
│ └─────────────────────────────┘ │                                              │
│ ┌─────────────────────────────┐ │                                              │
│ │ [JD] Juan Pérez             │ │                                              │
│ │ juan@salfacorp.cl           │ │                                              │
│ │ 💬 45 msgs 📊 3 convs       │ │                                              │
│ │ 🕐 Nov 3                    │ │                                              │
│ └─────────────────────────────┘ │                                              │
│ ┌─────────────────────────────┐ │                                              │
│ │ [MP] María González         │ │                                              │
│ │ maria@salfacorp.cl          │ │                                              │
│ │ 💬 23 msgs 📊 2 convs       │ │                                              │
│ │ 🕐 Oct 28                   │ │                                              │
│ └─────────────────────────────┘ │                                              │
│                                 │                                              │
└─────────────────────────────────┴──────────────────────────────────────────────┘
```

## After User Selection

```
┌────────────────────────────────────────────────────────────────────────────────┐
│ 📊 Analíticas SalfaGPT                                            [Exportar] [X]│
├────────────────────────────────────────────────────────────────────────────────┤
│                          📊 Analíticas por Usuario                             │
├─────────────────────────────────┬──────────────────────────────────────────────┤
│ USER LIST                       │ USER DETAILS - Alec                          │
├─────────────────────────────────┼──────────────────────────────────────────────┤
│                                 │                                              │
│ ┌─────────────────────────────┐ │ ┌──────────────────────────────────────────┐│
│ │▌ [AA] Alec              ◄───┼─┤ │  [AA]  Alec                              ││
│ │▌ alec@getaifactory.com      │ │ │        alec@getaifactory.com             ││
│ │▌ 💬 234 msgs 📊 15 convs    │ │ │  [admin] [GetAI Factory]                 ││
│ │▌ 🕐 Nov 4                   │ │ └──────────────────────────────────────────┘│
│ └─────────────────────────────┘ │                                              │
│   (selected with blue border)   │ ┌──────────────────────────────────────────┐│
│                                 │ │ 📅 Información de Creación               ││
│ ┌─────────────────────────────┐ │ ├──────────────────────────────────────────┤│
│ │ [JD] Juan Pérez             │ │ │ Método:       OAuth (Google)             ││
│ │ juan@salfacorp.cl           │ │ │ Fecha:        15 de enero de 2025        ││
│ │ 💬 45 msgs 📊 3 convs       │ │ └──────────────────────────────────────────┘│
│ │ 🕐 Nov 3                    │ │                                              │
│ └─────────────────────────────┘ │ ┌──────────────────────────────────────────┐│
│                                 │ │ 💬 Agentes Asignados (15)                ││
│ ┌─────────────────────────────┐ │ ├──────────────────────────────────────────┤│
│ │ [MP] María González         │ │ │ Q1 Plan de Calidad                       ││
│ │ maria@salfacorp.cl          │ │ │ 45 mensajes      Último: Nov 3           ││
│ │ 💬 23 msgs 📊 2 convs       │ │ ├──────────────────────────────────────────┤│
│ │ 🕐 Oct 28                   │ │ │ SSOMA L1                                 ││
│ └─────────────────────────────┘ │ │ 32 mensajes      Último: Nov 2           ││
│                                 │ │ ├──────────────────────────────────────────┤│
│ (more users...)                 │ │ Q3 Transacción SAP                       ││
│                                 │ │ 28 mensajes      Último: Nov 1           ││
│                                 │ │ (scrollable list)                        ││
│                                 │ └──────────────────────────────────────────┘│
│                                 │                                              │
│                                 │ ┌──────────────────────────────────────────┐│
│                                 │ │ 📈 Actividad del Usuario                 ││
│                                 │ ├──────────────────────────────────────────┤│
│                                 │ │ 🕐 Último Login                          ││
│                                 │ │    Nov 4, 08:30                          ││
│                                 │ ├──────────────────────────────────────────┤│
│                                 │ │ 📊 Total de Logins                       ││
│                                 │ │    12                                     ││
│                                 │ ├──────────────────────────────────────────┤│
│                                 │ │ Mensajes Enviados  │  Conversaciones     ││
│                                 │ │      234           │       15             ││
│                                 │ ├──────────────────────────────────────────┤│
│                                 │ │ 📊 Mensajes por Login                    ││
│                                 │ │    19.5                                   ││
│                                 │ └──────────────────────────────────────────┘│
│                                 │                                              │
└─────────────────────────────────┴──────────────────────────────────────────────┘
```

## Component Breakdown

### Left Pane - User List

**Features**:
- ✅ Scrollable list of all users
- ✅ Sorted by activity (most messages first)
- ✅ Avatar with 2-letter initials
- ✅ Gradient blue background (blue-500 to indigo-600)
- ✅ Name (bold) and email (smaller)
- ✅ Quick metrics in compact format
- ✅ Selection highlighting (blue-50 bg + blue-600 border-left)
- ✅ Hover state (gray-50)
- ✅ Inactive user badge (red) if not active

**User Card Layout**:
```
┌─────────────────────────────────┐
│ [AA]  Alec                      │  ← Selected state
│       alec@getaifactory.com     │
│  💬 234 msgs  📊 15 convs  🕐 Nov 4
└─────────────────────────────────┘
  ↑          ↑           ↑        ↑
Avatar    Messages  Conversations Last Login
```

### Right Pane - User Details

When **no user selected**:
```
        👥 (large icon)
  Selecciona un usuario
   para ver detalles
```

When **user selected**:

#### 1. User Header
```
┌──────────────────────────────────┐
│  [AA]   Alec                     │
│         alec@getaifactory.com    │
│   [admin] [GetAI Factory] [IT]   │
└──────────────────────────────────┘
```
- Large avatar (64x64)
- Name (xl, bold)
- Email (sm, gray)
- Badges: role (blue), company (gray), department (gray)

#### 2. Creation Info
```
┌──────────────────────────────────┐
│ 📅 Información de Creación       │
├──────────────────────────────────┤
│ Método:       OAuth (Google)     │
│ Fecha:        15 de enero de 2025│
│ [if admin-created]               │
│ Creado por:   admin@example.com  │
└──────────────────────────────────┘
```

#### 3. Assigned Agents
```
┌──────────────────────────────────┐
│ 💬 Agentes Asignados (15)        │
├──────────────────────────────────┤
│ Q1 Plan de Calidad               │
│ 45 mensajes  Último: Nov 3       │
├──────────────────────────────────┤
│ SSOMA L1                         │
│ 32 mensajes  Último: Nov 2       │
├──────────────────────────────────┤
│ (scrollable, max-h-64)           │
└──────────────────────────────────┘
```
- Gray-50 background per agent
- Title (medium, truncated)
- Message count
- Last used date

#### 4. User Engagement
```
┌──────────────────────────────────┐
│ 📈 Actividad del Usuario         │
├──────────────────────────────────┤
│ 🕐 Último Login                  │
│    Nov 4, 08:30         (blue-50)│
├──────────────────────────────────┤
│ 📊 Total de Logins               │
│    12                   (green-50)│
├──────────────────────────────────┤
│ Mensajes │ Conversaciones         │
│   234    │      15      (grid 2)  │
├──────────────────────────────────┤
│ Mensajes por Login      (yellow)│
│    19.5                           │
└──────────────────────────────────┘
```
- Color-coded sections
- Large numbers (bold)
- Clear labels
- Engagement rate calculation

## Color Palette

### User List
- **Background**: White
- **Hover**: Gray-50
- **Selected**: Blue-50 + Blue-600 border-left
- **Avatar**: Blue-500 to Indigo-600 gradient
- **Inactive badge**: Red-100 bg, Red-700 text

### User Details
- **Background**: Gray-50
- **Cards**: White with Gray-200 border
- **Last Login**: Blue-50 bg
- **Login Count**: Green-50 bg
- **Messages/Convs**: Purple-50 / Indigo-50
- **Engagement**: Yellow-50

## Interaction Flow

1. **Dashboard Opens**
   - Loads KPIs, charts (existing)
   - Loads user list automatically
   - Shows skeleton loaders

2. **User List Loads**
   - Displays all users sorted by activity
   - Shows quick metrics per user
   - Ready for selection

3. **User Clicks on User**
   - User card highlights (blue)
   - Right pane shows loading skeleton
   - API call for detailed metrics

4. **Details Load**
   - Header appears with avatar
   - Creation info displays
   - Assigned agents list populates
   - Engagement metrics calculate
   - All animated smoothly

5. **User Switches User**
   - Previous user unhighlights
   - New user highlights
   - Right pane reloads
   - Smooth transition

## Data Displayed

### Per User (List View)
- ✅ Name
- ✅ Email
- ✅ Total messages (period)
- ✅ Total conversations (period)
- ✅ Last login date
- ✅ Active/inactive status

### Per User (Detail View)
- ✅ All list view data
- ✅ Role(s)
- ✅ Company
- ✅ Department (if set)
- ✅ Creation method (OAuth vs Admin)
- ✅ Creation date (full format)
- ✅ Created by (if admin-created)
- ✅ All assigned agents
- ✅ Message count per agent
- ✅ Last used per agent
- ✅ Total login count (estimated)
- ✅ Engagement rate (msgs/login)

## Metrics Calculated

### Messages per User
Sum of all messages in conversations owned by user within date range.

### Conversations per User
Count of active conversations created by user within date range.

### Login Count (Estimated)
Count of distinct days where user had message activity.

**Note**: This is an approximation. For accurate login tracking, we should implement a `login_sessions` or `usage_logs` tracking system.

### Messages per Login
Total messages divided by login count. Higher number = more engaged per session.

## API Contracts

### GET Users List
```http
POST /api/analytics/users
Authorization: Bearer {jwt-token}
Content-Type: application/json

{
  "filters": {
    "startDate": "2025-10-01T00:00:00Z",
    "endDate": "2025-11-04T23:59:59Z"
  }
}
```

**Response**:
```json
{
  "users": [
    {
      "id": "usr_xxx",
      "email": "user@example.com",
      "name": "User Name",
      "role": "user",
      "totalMessages": 234,
      "totalConversations": 15,
      "loginCount": 12,
      "lastLogin": "2025-11-04T08:30:00Z",
      "isActive": true,
      ...
    }
  ],
  "metadata": {
    "totalUsers": 25,
    "activeUsers": 18
  }
}
```

### GET User Details
```http
POST /api/analytics/user-details
Authorization: Bearer {jwt-token}
Content-Type: application/json

{
  "userId": "usr_xxx",
  "filters": {
    "startDate": "2025-10-01T00:00:00Z",
    "endDate": "2025-11-04T23:59:59Z"
  }
}
```

**Response**:
```json
{
  "assignedAgents": [
    {
      "id": "conv_abc",
      "title": "Q1 Plan de Calidad",
      "messageCount": 45,
      "lastUsed": "2025-11-03T14:25:00Z"
    }
  ],
  "totalMessages": 234,
  "totalConversations": 15,
  "loginCount": 12
}
```

## Loading States

### User List Loading
```
┌─────────────────────────────┐
│ ████████ (pulsing gray)     │
│ ████ ████████               │
│ ████ ████ ████              │
└─────────────────────────────┘
× 5 skeleton cards
```

### User Details Loading
```
┌──────────────────────────────┐
│ ████████ (pulsing)           │
│                              │
│ ████████████                 │
│ ████████████                 │
│ ████████████                 │
└──────────────────────────────┘
× 4 skeleton sections
```

## Empty States

### No Users
```
        👥
   (large gray icon)
   
No hay usuarios en el
  período seleccionado
```

### No Assigned Agents
```
No hay agentes asignados
  (centered, gray text)
```

## Responsive Behavior

### Desktop (≥ 1024px)
- Side-by-side layout (50/50 split)
- Full height: 600px
- Both panes scrollable independently

### Tablet (768-1023px)
- Stacked layout (user list on top)
- Collapsible details pane
- Full width utilization

### Mobile (< 768px)
- Single column
- Users list as primary view
- Details open as overlay/modal
- Full screen optimization

## Accessibility

### Keyboard Navigation
- ✅ Tab through user list
- ✅ Enter to select user
- ✅ Escape to close details
- ✅ Arrow keys to navigate list

### Screen Readers
- ✅ Proper heading hierarchy
- ✅ ARIA labels for all sections
- ✅ Semantic HTML (article, section)
- ✅ Focus management

### Visual
- ✅ High contrast text
- ✅ Clear focus indicators
- ✅ Color not sole indicator (icons + text)
- ✅ Readable font sizes (≥ 12px)

## Performance Expectations

### Initial Load
- Users list: < 2s (for 100 users)
- Skeleton shown immediately

### User Selection
- Details load: < 1s
- Skeleton shown during load
- Smooth transition

### Large Datasets
- User list: Virtualized if > 100 users
- Agents list: Scroll container
- Date range: Indexed queries

## Next Steps

### To Test
1. Login as admin
2. Click "Analytics" button
3. Scroll to "Analíticas por Usuario" section
4. Click on any user
5. Verify all sections load correctly
6. Try different date ranges
7. Check multiple users

### Known Limitations
- Login count is estimated (needs dedicated tracking)
- No real-time updates (manual refresh needed)
- Limited to admin access only

### Future Enhancements
- User activity timeline chart
- Export individual user report
- Search/filter users
- Comparison view (multiple users)
- User segmentation/cohorts

---

**Status**: ✅ Implemented, Ready for Testing  
**Commit**: 7941037  
**Date**: November 4, 2025









