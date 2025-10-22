import React, { useState, useEffect } from 'react';
import { X, Users, User as UserIcon, Lock, Eye, Edit, Shield, Calendar, Search } from 'lucide-react';
import type { Group, AgentShare, Conversation } from '../lib/firestore';
import type { User } from '../types/users';

interface AgentSharingModalProps {
  agent: Conversation;
  currentUser: User;
  onClose: () => void;
  onShareUpdated?: () => void;
}

export function AgentSharingModal({ 
  agent, 
  currentUser, 
  onClose,
  onShareUpdated 
}: AgentSharingModalProps) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [existingShares, setExistingShares] = useState<AgentShare[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form states
  const [shareType, setShareType] = useState<'user' | 'group'>('group');
  const [selectedTargets, setSelectedTargets] = useState<Array<{ type: 'user' | 'group'; id: string }>>([]);
  const [accessLevel, setAccessLevel] = useState<'view' | 'use' | 'admin'>('view');
  const [expiresAt, setExpiresAt] = useState<string>('');
  
  // Determine if admin level is allowed (only for individual users, not groups)
  const isAdminAllowed = shareType === 'user';
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, [agent.id]);

  // Reset access level if switching to group and current level is admin
  useEffect(() => {
    if (shareType === 'group' && accessLevel === 'admin') {
      setAccessLevel('use'); // Reset to max allowed for groups
    }
  }, [shareType]);

  async function loadData() {
    setLoading(true);
    setError(null);
    
    try {
      // Load groups
      const groupsRes = await fetch('/api/groups');
      if (!groupsRes.ok) throw new Error('Failed to load groups');
      const groupsData = await groupsRes.json();
      setGroups(groupsData.groups || []);

      // Load users
      const usersRes = await fetch('/api/users');
      if (!usersRes.ok) throw new Error('Failed to load users');
      const usersData = await usersRes.json();
      setAllUsers(usersData.users || []);

      // Load existing shares
      const sharesRes = await fetch(`/api/agents/${agent.id}/share`);
      if (!sharesRes.ok) throw new Error('Failed to load shares');
      const sharesData = await sharesRes.json();
      setExistingShares(sharesData.shares || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  async function handleShare() {
    if (selectedTargets.length === 0) {
      setError('Selecciona al menos un usuario o grupo');
      return;
    }

    try {
      const response = await fetch(`/api/agents/${agent.id}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerId: currentUser.id,
          sharedWith: selectedTargets,
          accessLevel,
          expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
        }),
      });

      if (!response.ok) throw new Error('Failed to share agent');

      const { share } = await response.json();
      setExistingShares([...existingShares, share]);
      setSelectedTargets([]);
      setSuccess('¡Agente compartido exitosamente!');
      
      if (onShareUpdated) {
        onShareUpdated();
      }
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to share agent');
    }
  }

  async function handleRevokeShare(shareId: string) {
    if (!confirm('¿Revocar este acceso compartido?')) {
      return;
    }

    try {
      const response = await fetch(`/api/agents/${agent.id}/share?shareId=${shareId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to revoke share');

      setExistingShares(existingShares.filter(s => s.id !== shareId));
      setSuccess('Acceso revocado');
      
      if (onShareUpdated) {
        onShareUpdated();
      }
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to revoke share');
    }
  }

  const toggleTarget = (type: 'user' | 'group', id: string) => {
    const exists = selectedTargets.some(t => t.type === type && t.id === id);
    
    if (exists) {
      setSelectedTargets(selectedTargets.filter(t => !(t.type === type && t.id === id)));
    } else {
      setSelectedTargets([...selectedTargets, { type, id }]);
    }
  };

  const getAccessLevelIcon = (level: AgentShare['accessLevel']) => {
    switch (level) {
      case 'view': return <Eye className="w-4 h-4" />;
      case 'use': return <Edit className="w-4 h-4" />;
      case 'admin': return <Shield className="w-4 h-4" />;
    }
  };

  const getAccessLevelLabel = (level: AgentShare['accessLevel']) => {
    switch (level) {
      case 'view': return 'Solo ver';
      case 'use': return 'Usar agente';
      case 'admin': return 'Administrador';
    }
  };

  const getAccessLevelColor = (level: AgentShare['accessLevel']) => {
    switch (level) {
      case 'view': return 'blue';
      case 'use': return 'green';
      case 'admin': return 'purple';
    }
  };

  const getTargetName = (target: { type: 'user' | 'group'; id: string }) => {
    if (target.type === 'group') {
      const group = groups.find(g => g.id === target.id);
      return group?.name || 'Grupo desconocido';
    } else {
      const user = allUsers.find(u => u.id === target.id);
      return user?.name || 'Usuario desconocido';
    }
  };

  const filteredItems = shareType === 'group' 
    ? groups.filter(g => 
        g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : allUsers.filter(u => 
        u.id !== currentUser.id && // Don't show current user
        // When sharing individually, all users are allowed (including experts, admins)
        (u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
         u.email.toLowerCase().includes(searchTerm.toLowerCase()))
      );

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Compartir Agente</h2>
            <p className="text-sm text-slate-600 mt-1">{agent.title}</p>
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
          {/* Share Form (Left) */}
          <div className="w-1/2 border-r border-slate-200 flex flex-col">
            <div className="p-6 space-y-4">
              <h3 className="font-semibold text-slate-800 mb-4">Compartir con</h3>

              {/* Type Selector */}
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShareType('group');
                    setSelectedTargets([]);
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                    shareType === 'group'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <Users className="w-5 h-5" />
                  Grupos
                </button>
                <button
                  onClick={() => {
                    setShareType('user');
                    setSelectedTargets([]);
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                    shareType === 'user'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <UserIcon className="w-5 h-5" />
                  Usuarios
                </button>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder={`Buscar ${shareType === 'group' ? 'grupos' : 'usuarios'}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* List */}
              <div className="max-h-64 overflow-y-auto border border-slate-200 rounded-lg">
                {loading ? (
                  <div className="p-4 text-center text-slate-500">Cargando...</div>
                ) : filteredItems.length === 0 ? (
                  <div className="p-4 text-center text-slate-500">
                    No hay {shareType === 'group' ? 'grupos' : 'usuarios'} disponibles
                  </div>
                ) : (
                  <div className="p-2 space-y-1">
                    {shareType === 'group' ? (
                      groups.filter(g => 
                        g.name.toLowerCase().includes(searchTerm.toLowerCase())
                      ).map(group => (
                        <label
                          key={group.id}
                          className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedTargets.some(t => t.type === 'group' && t.id === group.id)}
                            onChange={() => toggleTarget('group', group.id)}
                            className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-800">
                              {group.name}
                            </p>
                            <p className="text-xs text-slate-500">
                              {group.members.length} miembros
                            </p>
                          </div>
                        </label>
                      ))
                    ) : (
                      allUsers.filter(u => 
                        u.id !== currentUser.id &&
                        (u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         u.email.toLowerCase().includes(searchTerm.toLowerCase()))
                      ).map(user => (
                        <label
                          key={user.id}
                          className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedTargets.some(t => t.type === 'user' && t.id === user.id)}
                            onChange={() => toggleTarget('user', user.id)}
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
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Access Level */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Nivel de Acceso
                </label>
                {!isAdminAllowed && (
                  <p className="text-xs text-amber-600 mb-2 bg-amber-50 border border-amber-200 rounded p-2">
                    ⚠️ Los grupos solo pueden tener acceso "Ver" o "Usar".
                    Para acceso "Admin", comparte con usuarios individuales.
                  </p>
                )}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setAccessLevel('view')}
                    className={`flex flex-col items-center gap-2 p-3 rounded-lg border transition-colors ${
                      accessLevel === 'view'
                        ? 'bg-blue-50 border-blue-500 text-blue-700'
                        : 'border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <Eye className="w-5 h-5" />
                    <span className="text-xs font-medium">Solo Ver</span>
                  </button>
                  <button
                    onClick={() => setAccessLevel('use')}
                    className={`flex flex-col items-center gap-2 p-3 rounded-lg border transition-colors ${
                      accessLevel === 'use'
                        ? 'bg-green-50 border-green-500 text-green-700'
                        : 'border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <Edit className="w-5 h-5" />
                    <span className="text-xs font-medium">Usar</span>
                  </button>
                  <button
                    onClick={() => setAccessLevel('admin')}
                    disabled={!isAdminAllowed}
                    className={`flex flex-col items-center gap-2 p-3 rounded-lg border transition-colors ${
                      accessLevel === 'admin'
                        ? 'bg-purple-50 border-purple-500 text-purple-700'
                        : isAdminAllowed
                        ? 'border-slate-300 hover:bg-slate-50'
                        : 'border-slate-200 bg-slate-50 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <Shield className="w-5 h-5" />
                    <span className="text-xs font-medium">Admin</span>
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  {accessLevel === 'view' && '👁️ Pueden ver mensajes pero no enviar nuevos'}
                  {accessLevel === 'use' && '✏️ Pueden ver y usar el agente (enviar mensajes)'}
                  {accessLevel === 'admin' && '🛡️ Control total: ver, usar, configurar, compartir, eliminar'}
                </p>
              </div>

              {/* Expiration (Optional) */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Expiración (opcional)
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="datetime-local"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Dejar vacío para acceso permanente
                </p>
              </div>

              {/* Selected Summary */}
              {selectedTargets.length > 0 && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm font-medium text-blue-800 mb-2">
                    Compartir con:
                  </p>
                  <div className="space-y-1">
                    {selectedTargets.map((target, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs">
                        <span className="text-blue-700">
                          {target.type === 'group' ? '👥' : '👤'} {getTargetName(target)}
                        </span>
                        <button
                          onClick={() => toggleTarget(target.type, target.id)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Share Button */}
              <button
                onClick={handleShare}
                disabled={selectedTargets.length === 0}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors font-medium"
              >
                Compartir Agente
              </button>
            </div>
          </div>

          {/* Existing Shares (Right) */}
          <div className="w-1/2 flex flex-col">
            <div className="p-6">
              <h3 className="font-semibold text-slate-800 mb-4">
                Accesos Compartidos ({existingShares.length})
              </h3>

              {existingShares.length === 0 ? (
                <div className="text-center text-slate-500 py-8">
                  <Lock className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p className="text-sm">Este agente no está compartido</p>
                  <p className="text-xs mt-1">Comparte con grupos o usuarios para colaborar</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {existingShares.map(share => (
                    <div
                      key={share.id}
                      className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          {share.sharedWith.map((target, idx) => (
                            <div key={idx} className="flex items-center gap-2 mb-2">
                              {target.type === 'group' ? (
                                <Users className="w-4 h-4 text-blue-600" />
                              ) : (
                                <UserIcon className="w-4 h-4 text-green-600" />
                              )}
                              <span className="text-sm font-medium text-slate-800">
                                {getTargetName(target)}
                              </span>
                            </div>
                          ))}
                        </div>
                        <button
                          onClick={() => handleRevokeShare(share.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Revocar acceso"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex items-center gap-3 text-xs">
                        <span className={`flex items-center gap-1 px-2 py-1 bg-${getAccessLevelColor(share.accessLevel)}-100 text-${getAccessLevelColor(share.accessLevel)}-700 rounded-full font-semibold`}>
                          {getAccessLevelIcon(share.accessLevel)}
                          {getAccessLevelLabel(share.accessLevel)}
                        </span>
                        
                        {share.expiresAt && (
                          <span className="flex items-center gap-1 text-slate-600">
                            <Calendar className="w-3 h-3" />
                            Expira: {new Date(share.expiresAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-500 mt-2">
                        Compartido {new Date(share.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Messages */}
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

        {success && (
          <div className="mx-6 mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800">{success}</p>
          </div>
        )}

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

