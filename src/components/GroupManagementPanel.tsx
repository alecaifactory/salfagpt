import React, { useState, useEffect } from 'react';
import { Users, Plus, X, Edit2, Trash2, UserPlus, UserMinus, Search } from 'lucide-react';
import type { Group } from '../lib/firestore';
import type { User } from '../types/users';

interface GroupManagementPanelProps {
  currentUser: User;
  onClose: () => void;
}

export function GroupManagementPanel({ currentUser, onClose }: GroupManagementPanelProps) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // UI states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form states
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [newGroupType, setNewGroupType] = useState<Group['type']>('custom');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError(null);
    
    try {
      // Load groups
      const groupsRes = await fetch('/api/groups');
      if (!groupsRes.ok) throw new Error('Failed to load groups');
      const groupsData = await groupsRes.json();
      setGroups(groupsData.groups || []);

      // Load all users
      const usersRes = await fetch('/api/users');
      if (!usersRes.ok) throw new Error('Failed to load users');
      const usersData = await usersRes.json();
      setAllUsers(usersData.users || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateGroup() {
    if (!newGroupName.trim()) {
      setError('Group name is required');
      return;
    }

    try {
      const response = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newGroupName,
          description: newGroupDescription,
          type: newGroupType,
          createdBy: currentUser.id,
          members: selectedMembers,
        }),
      });

      if (!response.ok) throw new Error('Failed to create group');

      const { group } = await response.json();
      setGroups([group, ...groups]);
      
      // Reset form
      setNewGroupName('');
      setNewGroupDescription('');
      setNewGroupType('custom');
      setSelectedMembers([]);
      setShowCreateModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create group');
    }
  }

  async function handleDeleteGroup(groupId: string) {
    if (!confirm('¿Eliminar este grupo? Los permisos compartidos se mantendrán pero el grupo desaparecerá.')) {
      return;
    }

    try {
      const response = await fetch(`/api/groups/${groupId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete group');

      setGroups(groups.filter(g => g.id !== groupId));
      if (selectedGroup?.id === groupId) {
        setSelectedGroup(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete group');
    }
  }

  async function handleAddMember(groupId: string, userId: string) {
    try {
      const response = await fetch(`/api/groups/${groupId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) throw new Error('Failed to add member');

      // Update local state
      setGroups(groups.map(g => 
        g.id === groupId 
          ? { ...g, members: [...g.members, userId] }
          : g
      ));

      if (selectedGroup?.id === groupId) {
        setSelectedGroup({ ...selectedGroup, members: [...selectedGroup.members, userId] });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add member');
    }
  }

  async function handleRemoveMember(groupId: string, userId: string) {
    try {
      const response = await fetch(`/api/groups/${groupId}/members?userId=${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to remove member');

      // Update local state
      setGroups(groups.map(g => 
        g.id === groupId 
          ? { ...g, members: g.members.filter(id => id !== userId) }
          : g
      ));

      if (selectedGroup?.id === groupId) {
        setSelectedGroup({ 
          ...selectedGroup, 
          members: selectedGroup.members.filter(id => id !== userId) 
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove member');
    }
  }

  const filteredGroups = groups.filter(g => 
    g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getGroupTypeLabel = (type: Group['type']) => {
    const labels: Record<Group['type'], string> = {
      department: 'Departamento',
      team: 'Equipo',
      project: 'Proyecto',
      custom: 'Personalizado',
    };
    return labels[type];
  };

  const getGroupTypeColor = (type: Group['type']) => {
    const colors: Record<Group['type'], string> = {
      department: 'blue',
      team: 'green',
      project: 'purple',
      custom: 'slate',
    };
    return colors[type];
  };

  const getUserById = (userId: string) => {
    return allUsers.find(u => u.id === userId);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-slate-800">Gestión de Grupos</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Groups List */}
          <div className="w-1/2 border-r border-slate-200 flex flex-col">
            {/* Search and Create */}
            <div className="p-4 border-b border-slate-200 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar grupos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <button
                onClick={() => setShowCreateModal(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Crear Grupo
              </button>
            </div>

            {/* Groups List */}
            <div className="flex-1 overflow-y-auto p-4">
              {loading ? (
                <div className="text-center text-slate-500 py-8">
                  Cargando grupos...
                </div>
              ) : filteredGroups.length === 0 ? (
                <div className="text-center text-slate-500 py-8">
                  <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p className="text-sm">No hay grupos creados</p>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="mt-2 text-blue-600 hover:underline text-sm"
                  >
                    Crear el primero
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredGroups.map(group => (
                    <button
                      key={group.id}
                      onClick={() => setSelectedGroup(group)}
                      className={`w-full text-left p-4 rounded-lg border transition-all ${
                        selectedGroup?.id === group.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-slate-800 truncate">
                            {group.name}
                          </h3>
                          {group.description && (
                            <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                              {group.description}
                            </p>
                          )}
                        </div>
                        <span className={`ml-2 px-2 py-1 bg-${getGroupTypeColor(group.type)}-100 text-${getGroupTypeColor(group.type)}-700 rounded-full text-xs font-semibold`}>
                          {getGroupTypeLabel(group.type)}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          {group.members.length} miembros
                        </span>
                        <span>
                          Creado {new Date(group.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Group Details */}
          <div className="w-1/2 flex flex-col">
            {selectedGroup ? (
              <>
                {/* Group Header */}
                <div className="p-6 border-b border-slate-200">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-slate-800 mb-1">
                        {selectedGroup.name}
                      </h3>
                      {selectedGroup.description && (
                        <p className="text-sm text-slate-600">
                          {selectedGroup.description}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingGroup(selectedGroup)}
                        className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Editar grupo"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteGroup(selectedGroup.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar grupo"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-slate-600">
                    <span className={`px-3 py-1 bg-${getGroupTypeColor(selectedGroup.type)}-100 text-${getGroupTypeColor(selectedGroup.type)}-700 rounded-full font-semibold`}>
                      {getGroupTypeLabel(selectedGroup.type)}
                    </span>
                    <span>{selectedGroup.members.length} miembros</span>
                    <span className="text-xs">
                      Creado por {getUserById(selectedGroup.createdBy)?.name || 'Unknown'}
                    </span>
                  </div>
                </div>

                {/* Members List */}
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-slate-800">
                      Miembros ({selectedGroup.members.length})
                    </h4>
                    <button
                      onClick={() => {
                        // Show add member interface
                        // CRITICAL: Only users with 'user' role can be added
                        const availableUsers = allUsers.filter(
                          u => !selectedGroup.members.includes(u.id) && u.role === 'user'
                        );
                        
                        if (availableUsers.length === 0) {
                          alert(
                            'No hay usuarios disponibles para agregar.\n\n' +
                            'Solo usuarios con rol "user" pueden agregarse a grupos.\n' +
                            'Los grupos NO pueden elevar permisos.'
                          );
                          return;
                        }

                        // Simple prompt for now (can be enhanced with a modal)
                        const userList = availableUsers
                          .map((u, i) => `${i + 1}. ${u.name} (${u.email}) - rol: ${u.role}`)
                          .join('\n');
                        
                        const selection = prompt(
                          `Selecciona un usuario para agregar (solo rol 'user'):\n\n${userList}\n\nIngresa el número:`
                        );
                        
                        if (selection) {
                          const index = parseInt(selection) - 1;
                          if (index >= 0 && index < availableUsers.length) {
                            handleAddMember(selectedGroup.id, availableUsers[index].id);
                          }
                        }
                      }}
                      className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      <UserPlus className="w-4 h-4" />
                      Agregar Miembro
                    </button>
                  </div>

                  {selectedGroup.members.length === 0 ? (
                    <div className="text-center text-slate-500 py-8">
                      <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                      <p className="text-sm">No hay miembros en este grupo</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {selectedGroup.members.map(memberId => {
                        const user = getUserById(memberId);
                        if (!user) return null;

                        return (
                          <div
                            key={memberId}
                            className="flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:bg-slate-50"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center text-white text-sm font-bold">
                                {user.name.substring(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-medium text-slate-800">{user.name}</p>
                                <p className="text-xs text-slate-500">{user.email}</p>
                              </div>
                            </div>

                            <button
                              onClick={() => {
                                if (confirm(`¿Remover a ${user.name} del grupo?`)) {
                                  handleRemoveMember(selectedGroup.id, user.id);
                                }
                              }}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Remover del grupo"
                            >
                              <UserMinus className="w-4 h-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-500">
                <div className="text-center">
                  <Users className="w-16 h-16 mx-auto mb-3 text-slate-300" />
                  <p>Selecciona un grupo para ver detalles</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mx-6 mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-xs text-red-600 hover:underline mt-1"
            >
              Cerrar
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 flex justify-between items-center">
          <div className="text-sm text-slate-600">
            {groups.length} grupos totales
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[60] bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h3 className="text-xl font-bold text-slate-800">Crear Grupo</h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewGroupName('');
                  setNewGroupDescription('');
                  setSelectedMembers([]);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Nombre del Grupo <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="Ej: Equipo de Ventas"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Descripción
                </label>
                <textarea
                  value={newGroupDescription}
                  onChange={(e) => setNewGroupDescription(e.target.value)}
                  placeholder="Descripción opcional del grupo..."
                  rows={3}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Tipo de Grupo
                </label>
                <select
                  value={newGroupType}
                  onChange={(e) => setNewGroupType(e.target.value as Group['type'])}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="department">Departamento</option>
                  <option value="team">Equipo</option>
                  <option value="project">Proyecto</option>
                  <option value="custom">Personalizado</option>
                </select>
              </div>

              {/* Initial Members */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Miembros Iniciales (opcional)
                </label>
                <p className="text-xs text-slate-600 mb-2 bg-blue-50 border border-blue-200 rounded p-2">
                  ℹ️ Solo usuarios con rol 'user' pueden agregarse a grupos.
                  Los grupos NO pueden elevar permisos.
                </p>
                <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg p-2 space-y-1">
                  {allUsers
                    .filter(user => user.role === 'user') // CRITICAL: Only 'user' role
                    .map(user => (
                      <label
                        key={user.id}
                        className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedMembers.includes(user.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedMembers([...selectedMembers, user.id]);
                            } else {
                              setSelectedMembers(selectedMembers.filter(id => id !== user.id));
                            }
                          }}
                          className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-800 truncate">
                            {user.name}
                          </p>
                          <p className="text-xs text-slate-500 truncate">
                            {user.email}
                          </p>
                        </div>
                      </label>
                    ))}
                </div>
                {allUsers.filter(u => u.role === 'user').length === 0 && (
                  <p className="text-xs text-amber-600 mt-2 bg-amber-50 p-2 rounded">
                    ⚠️ No hay usuarios con rol 'user' disponibles.
                    Solo usuarios básicos pueden agregarse a grupos.
                  </p>
                )}
                {selectedMembers.length > 0 && (
                  <p className="text-xs text-slate-600 mt-2">
                    {selectedMembers.length} usuario{selectedMembers.length !== 1 ? 's' : ''} seleccionado{selectedMembers.length !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewGroupName('');
                  setNewGroupDescription('');
                  setSelectedMembers([]);
                }}
                className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateGroup}
                disabled={!newGroupName.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
              >
                Crear Grupo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

