# Feature: User Groups & Agent Sharing

## Objective
Enable collaborative agent management by allowing users to create groups, add team members, and share agents with specific users or entire groups. This enables organizations to organize their AI agents by department (e.g., Marketing Group, Engineering Group) and control access efficiently.

## Business Value
- **Team Collaboration**: Enable teams to work together with shared agents
- **Access Control**: Fine-grained permissions for agent management
- **Organization**: Logical grouping of agents by department/function
- **Scalability**: Share with groups instead of individual users (1:many vs 1:1)
- **Governance**: Track who has access to which agents and why

## Technical Approach

### Architecture
```
User Authentication (existing)
      ↓
Groups Management
      ↓
Agent Sharing
      ↓
Access Control Middleware
      ↓
Chat Interface (with shared agents)
```

### Data Model

#### Groups Table (BigQuery)
```sql
CREATE TABLE groups (
  id STRING NOT NULL,
  name STRING NOT NULL,
  description STRING,
  created_by STRING NOT NULL,  -- user_id
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL,
  metadata JSON
);
```

#### Group Members Table
```sql
CREATE TABLE group_members (
  group_id STRING NOT NULL,
  user_id STRING NOT NULL,
  role STRING NOT NULL,  -- 'admin' | 'member'
  added_at TIMESTAMP NOT NULL,
  added_by STRING NOT NULL,
  PRIMARY KEY (group_id, user_id)
);
```

#### Agent Shares Table
```sql
CREATE TABLE agent_shares (
  id STRING NOT NULL,
  agent_id STRING NOT NULL,
  shared_with_type STRING NOT NULL,  -- 'user' | 'group'
  shared_with_id STRING NOT NULL,
  permissions STRING NOT NULL,  -- 'view' | 'edit' | 'admin'
  shared_by STRING NOT NULL,
  shared_at TIMESTAMP NOT NULL,
  expires_at TIMESTAMP,
  metadata JSON,
  PRIMARY KEY (agent_id, shared_with_type, shared_with_id)
);
```

### API Endpoints

#### Groups Management
```typescript
// List user's groups
GET /api/groups
Response: { groups: Group[] }

// Create group
POST /api/groups
Body: { name: string, description?: string }
Response: { group: Group }

// Update group
PUT /api/groups/[id]
Body: { name?: string, description?: string }
Response: { group: Group }

// Delete group
DELETE /api/groups/[id]
Response: { success: boolean }

// Get group details
GET /api/groups/[id]
Response: { group: Group, members: GroupMember[] }
```

#### Group Members Management
```typescript
// Add member to group
POST /api/groups/[id]/members
Body: { user_id: string, role: 'admin' | 'member' }
Response: { member: GroupMember }

// Remove member from group
DELETE /api/groups/[id]/members/[user_id]
Response: { success: boolean }

// Update member role
PUT /api/groups/[id]/members/[user_id]
Body: { role: 'admin' | 'member' }
Response: { member: GroupMember }

// List group members
GET /api/groups/[id]/members
Response: { members: GroupMember[] }
```

#### Agent Sharing
```typescript
// Share agent
POST /api/agents/[id]/share
Body: {
  shared_with_type: 'user' | 'group',
  shared_with_id: string,
  permissions: 'view' | 'edit' | 'admin',
  expires_at?: string
}
Response: { share: AgentShare }

// Unshare agent
DELETE /api/agents/[id]/share
Body: {
  shared_with_type: 'user' | 'group',
  shared_with_id: string
}
Response: { success: boolean }

// List who agent is shared with
GET /api/agents/[id]/shared-with
Response: { shares: AgentShare[] }

// List agents shared with me
GET /api/agents/shared
Response: { agents: Agent[], shares: AgentShare[] }
```

### Permission Levels

#### Group Roles
- **Admin**: Can add/remove members, delete group, manage all shared agents
- **Member**: Can view group, use shared agents (permissions depend on share level)

#### Agent Share Permissions
- **View**: Can see and use the agent in chat
- **Edit**: Can modify agent configuration and prompts
- **Admin**: Can delete agent, manage sharing, and transfer ownership

### Access Control Logic

```typescript
// Check if user can access agent
async function canAccessAgent(userId: string, agentId: string): Promise<boolean> {
  // 1. Check if user owns the agent
  const agent = await getAgent(agentId);
  if (agent.owner_id === userId) return true;

  // 2. Check if agent is directly shared with user
  const userShare = await getAgentShare(agentId, 'user', userId);
  if (userShare) return true;

  // 3. Check if agent is shared with any of user's groups
  const userGroups = await getUserGroups(userId);
  for (const group of userGroups) {
    const groupShare = await getAgentShare(agentId, 'group', group.id);
    if (groupShare) return true;
  }

  return false;
}

// Get effective permissions for user on agent
async function getAgentPermissions(userId: string, agentId: string): Promise<Permission> {
  // Owner has admin permission
  const agent = await getAgent(agentId);
  if (agent.owner_id === userId) return 'admin';

  // Collect all permissions from direct shares and group shares
  const permissions: Permission[] = [];

  const userShare = await getAgentShare(agentId, 'user', userId);
  if (userShare) permissions.push(userShare.permissions);

  const userGroups = await getUserGroups(userId);
  for (const group of userGroups) {
    const groupShare = await getAgentShare(agentId, 'group', group.id);
    if (groupShare) permissions.push(groupShare.permissions);
  }

  // Return highest permission level
  if (permissions.includes('admin')) return 'admin';
  if (permissions.includes('edit')) return 'edit';
  if (permissions.includes('view')) return 'view';

  return null; // No access
}
```

## UI Components

### GroupsManager Component
- List all groups user is part of
- Create new group button
- Group cards showing:
  - Group name and description
  - Member count
  - Number of shared agents
  - Actions (view, edit, delete)
- Click to view group details and members

### AgentSharingModal Component
- Modal dialog for sharing an agent
- Two tabs: "Share with User" and "Share with Group"
- User/Group search input
- Permission level selector (view/edit/admin)
- Optional expiration date picker
- List of current shares with ability to revoke
- Visual indicator of inherited permissions (from groups)

### Integration with Chat Interface
- Filter agents by:
  - "My Agents" (owned by me)
  - "Shared with Me" (direct or via groups)
  - By Group (filter by specific group)
- Visual badge showing if agent is shared
- Share button on agent cards
- Permission level indicator

## Security Considerations

1. **Authentication**: All endpoints require valid JWT token
2. **Authorization**: Check user permissions before any operation
3. **Ownership**: Only agent owner can share/delete agent
4. **Group Admin**: Only group admins can add/remove members
5. **Audit Trail**: Log all sharing and permission changes
6. **Data Isolation**: Users can only see groups they belong to
7. **Expiration**: Support time-limited shares (expires_at)
8. **Validation**: Sanitize all inputs, validate IDs

## Testing Strategy

### Unit Tests
- Group CRUD operations
- Member management
- Permission calculation logic
- Access control validation

### Integration Tests
- End-to-end sharing flow
- Group-based access
- Permission inheritance
- Edge cases (expired shares, deleted groups)

### Manual Testing
1. Create group as User A
2. Add User B to group
3. Share agent with group
4. Login as User B and verify access
5. Test permission levels (view vs edit vs admin)
6. Test revoking shares
7. Test deleting groups with shared agents

## Performance Considerations

1. **Caching**: Cache user groups and permissions in session
2. **Batch Queries**: Fetch all group memberships in one query
3. **Indexing**: Index agent_shares by agent_id and shared_with_id
4. **Denormalization**: Store group member count in groups table
5. **Lazy Loading**: Load shared agents on demand

## Rollback Plan

1. Feature flag: `ENABLE_GROUPS_SHARING` in environment
2. Keep existing agent functionality unchanged
3. If issues arise, disable feature flag
4. Database schema is additive (no modifications to existing tables)
5. API endpoints are new (no changes to existing endpoints)

## Future Enhancements

1. **Nested Groups**: Groups within groups (organizational hierarchy)
2. **Public Agents**: Share agents with everyone in organization
3. **Agent Templates**: Create templates from shared agents
4. **Usage Analytics**: Track which shared agents are most used
5. **Notifications**: Notify users when agents are shared with them
6. **Bulk Operations**: Share multiple agents at once
7. **Group Invitations**: Email invitations to join groups

## Success Metrics

- Number of groups created per user
- Number of agents shared
- Percentage of users using shared agents
- Time saved by group sharing vs individual sharing
- User satisfaction with collaboration features

## Documentation Updates

- Update API reference with new endpoints
- Create user guide for groups and sharing
- Add examples to README
- Update SETUP.md with BigQuery schema changes

## Timeline

- **Day 1**: Implement backend API (groups, members, sharing)
- **Day 2**: Create BigQuery schema and migration
- **Day 3**: Build UI components (GroupsManager, AgentSharingModal)
- **Day 4**: Integration testing and bug fixes
- **Day 5**: Documentation and deployment

---

**Status**: 🔨 In Development
**Owner**: Alec
**Branch**: feat/user-groups-sharing-2025-01-09

