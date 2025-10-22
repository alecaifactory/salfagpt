# Left Pane Redesign - October 21, 2025

## Overview

Complete redesign of the left navigation pane to support hierarchical organization of Agents, Projects (folders), and Chats.

## What Changed

### 1. Data Model Updates

#### Conversation Interface (`ChatInterfaceWorking.tsx` + `firestore.ts`)
Added new fields to support the hierarchical structure:
- `isAgent?: boolean` - Distinguishes between agents (root) and chats (child conversations)
- `agentId?: string` - Links chats to their parent agent
- `folderId?: string` - Links chats to projects/folders (already existed)

#### New Folder Interface
```typescript
interface Folder {
  id: string;
  name: string;
  createdAt: Date;
  conversationCount: number;
}
```

### 2. State Management

Added new state variables:
- `folders` - List of user's project folders
- `selectedAgent` - Currently selected agent
- `showAgentsSection` - Collapsible state for Agentes section
- `showProjectsSection` - Collapsible state for Proyectos section
- `showChatsSection` - Collapsible state for Chats section
- `editingFolderId` / `editingFolderName` - Folder rename state
- `showAgentContextModal` - Modal visibility for agent context configuration
- `agentForContextConfig` - Which agent's context is being configured

### 3. New UI Structure

The left pane now has **three collapsible sections**:

#### 1. **Agentes** (Agents Section)
- Shows all agents (conversations where `isAgent !== false`)
- Clicking an agent selects it and shows its chats in the Chats section
- Each agent has:
  - **Settings icon** (⚙️) - Opens context configuration modal
  - **Edit icon** (✏️) - Rename the agent
- Count badge shows number of active agents

#### 2. **Proyectos** (Projects Section)
- Shows all folders/projects
- Can create new projects with the + button
- Each project can be:
  - **Renamed** (click edit icon)
  - **Deleted** (click X icon)
- **Drag-and-drop** support: Drag chats from the Chats section and drop them into projects
- Visual feedback when dragging over a project (green highlight)

#### 3. **Chats** (Conversations Section)
- Shows conversations for the currently **selected agent**
- If no agent selected: Shows message "Selecciona un agente para ver sus chats"
- **+ button appears when agent is selected** - Creates new chat for that agent
- Each chat:
  - Shows title and date
  - Can be renamed
  - Can be archived
  - Is **draggable** to projects
- Chats are color-coded purple to distinguish from agents (blue)

### 4. Context Sources Moved

**Old behavior:** Context sources shown in left sidebar for current conversation

**New behavior:** 
- Context sources **removed from left sidebar**
- Access via **Settings icon (⚙️)** next to each agent name
- Opens **Agent Context Configuration Modal** showing:
  - All context sources assigned to that agent
  - Toggle switches to enable/disable sources
  - "Agregar Fuente" button to add new sources
  - Source details and metadata
  - "Quitar" button to remove source from agent

### 5. New Functions

#### Folder Management
- `loadFolders()` - Load folders from Firestore on mount
- `createNewFolder(name)` - Create new folder
- `renameFolder(folderId, newName)` - Rename folder
- `deleteFolder(folderId)` - Delete folder (moves chats to "Sin Proyecto")
- `moveChatToFolder(chatId, folderId)` - Move chat to folder (drag-and-drop)

#### Agent & Chat Management
- `createNewAgent()` - Create new agent (root conversation)
- `createNewChatForAgent(agentId)` - Create chat linked to specific agent
- Auto-selects first agent on load
- Sets selectedAgent when clicking agent

### 6. Backend API Updates

#### Created: `/api/folders/[id].ts`
- **PUT** - Update folder name
- **DELETE** - Delete folder

#### Updated: `/api/conversations/index.ts`
- POST now accepts `isAgent` and `agentId` parameters

#### Updated: `src/lib/firestore.ts`
- `createConversation()` signature extended with `isAgent` and `agentId` parameters
- `Conversation` interface extended with new fields

### 7. User Experience Improvements

#### Visual Organization
- Clear hierarchy: Agents → Chats → Projects
- Color coding:
  - **Agents**: Blue highlights
  - **Chats**: Purple highlights
  - **Projects**: Green highlights
- Collapsible sections save space
- Count badges show at-a-glance totals

#### Interactions
- **Click agent** → Select it, show its chats
- **Click chat** → Open that conversation
- **Click Settings icon** → Configure agent's context sources
- **Drag chat** → Drop on project to organize
- **+ button in Chats header** → Create new chat for selected agent
- **+ button in Projects header** → Create new project

#### Empty States
- "Selecciona un agente para ver sus chats" - When no agent selected
- "No hay chats para este agente" - When agent has no chats
- "No hay proyectos creados" - When no folders exist

## Migration Path

### Backward Compatibility

All existing conversations will:
- Default to `isAgent = true` (treated as agents)
- Have no `agentId` (they are root level)
- Have no `folderId` (will appear in "Sin Proyecto")
- Continue to work exactly as before

### For Existing Users

1. All current conversations appear as **Agents**
2. To create chats:
   - Select an agent
   - Click + button in Chats section
3. To organize:
   - Create projects
   - Drag chats into projects

## Technical Details

### Agent → Chat Relationship

```typescript
// Agent (root conversation)
{
  id: 'agent-123',
  title: 'Mi Agente',
  isAgent: true,
  agentId: undefined
}

// Chat (child conversation)
{
  id: 'chat-456',
  title: 'Chat - Mi Agente',
  isAgent: false,
  agentId: 'agent-123' // Links to parent agent
}
```

### Chat → Project Relationship

```typescript
// Chat in project
{
  id: 'chat-456',
  title: 'Customer Support Chat',
  folderId: 'folder-789',
  agentId: 'agent-123'
}

// Project/Folder
{
  id: 'folder-789',
  name: 'Customer Support',
  conversationCount: 5
}
```

### Context Assignment

When adding a context source:
- If opened from agent settings modal: Assigned to that agent
- If `selectedAgent` is set: Assigned to selected agent
- If `currentConversation` is set: Assigned to current conversation
- If tagged as PUBLIC: Assigned to all agents

## Files Modified

### Frontend
- `src/components/ChatInterfaceWorking.tsx` - Complete left pane redesign

### Backend
- `src/lib/firestore.ts` - Updated Conversation interface and createConversation function
- `src/pages/api/conversations/index.ts` - Updated POST to accept new fields
- `src/pages/api/folders/[id].ts` - Created PUT/DELETE endpoints for folders

## Testing Checklist

- [ ] Create new agent - Should appear in Agentes section
- [ ] Select agent - Should highlight and show in Chats section
- [ ] Create new chat for agent - Should appear under selected agent in Chats
- [ ] Create new project - Should appear in Proyectos section
- [ ] Rename project - Should save and update
- [ ] Drag chat to project - Should move chat to that folder
- [ ] Open agent settings icon - Should show context configuration modal
- [ ] Add context source from modal - Should assign to that agent
- [ ] Toggle context source - Should enable/disable for that agent
- [ ] All three sections collapsible - Should expand/collapse smoothly
- [ ] Empty states display correctly
- [ ] Backward compatibility - Existing conversations appear as agents

## Additional Updates (Phase 2)

### 🎯 "Nuevo Chat" Button Placement

**Old:** Button in Chats section header  
**New:** Button in main chat header (above messages area)

- **Visibility:** Only shows when an agent is selected
- **Location:** Top-right of chat area, next to "Configurar Agente" button
- **Style:** Purple button to match chat theme
- **Behavior:** Creates new chat for the currently selected agent

### 📋 Context Inheritance

When creating a new chat from an agent:

1. **Copies active context sources** from parent agent
2. **Assigns sources to new chat** via API
3. **Saves activeContextSourceIds** to new chat's conversation_context
4. **Auto-loads context** for immediate use

This means chats start with the same context as their parent agent!

### 💡 Context Panel Enhancement

**New Feature:** When viewing a chat (not an agent), the context panel shows:

```
Desglose del Contexto
📋 Usando contexto del agente: [Agent Name]

[Rest of context stats...]
```

This visual indicator helps users understand:
- Which agent's context is being used
- That chats inherit from their parent agent
- The source of the context sources shown

### Technical Implementation

#### Context Inheritance Flow
```
1. User selects Agent A
2. User clicks "Nuevo Chat" button
3. createNewChatForAgent(agentId) is called
4. New chat created with agentId = Agent A
5. Agent A's activeContextSourceIds are fetched
6. Each source is assigned to new chat
7. activeContextSourceIds saved to chat's context
8. Context loaded for new chat
9. User can immediately use chat with agent's context
```

#### Parent Agent Detection
```typescript
// Helper function added
const getParentAgent = () => {
  const currentConv = conversations.find(c => c.id === currentConversation);
  if (currentConv?.agentId) {
    return conversations.find(c => c.id === currentConv.agentId);
  }
  return null;
};
```

#### Context Panel Logic
- If `getParentAgent()` returns an agent → Show "Usando contexto del agente: [name]"
- If `getParentAgent()` returns null → Show normal header (this is an agent)

## Next Steps

1. **Test the complete flow** in development
2. **Create demo data** with agents, chats, and projects
3. **Verify context inheritance** works correctly
4. **User feedback** on the new organization
5. **Consider adding**:
   - Folder icons/colors
   - Agent icons/avatars
   - Search/filter across sections
   - Keyboard shortcuts for navigation
   - Bulk operations (move multiple chats)
   - Option to override agent context in specific chats

## Screenshots

(See attached mockup reference provided by user)

---

**Status:** ✅ Implementation Complete (Phase 1 + Phase 2)  
**Date:** October 21, 2025  
**Developer:** AI Assistant  
**Reviewed:** Pending user testing  
**Context Inheritance:** ✅ Implemented  
**"Nuevo Chat" Button:** ✅ Moved to chat header

