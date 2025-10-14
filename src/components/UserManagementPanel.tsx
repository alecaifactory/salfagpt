import { useState, useEffect } from 'react';
import { Users, Plus, X, Pencil, Check, Trash2, UserCog, Upload, Download, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import type { User, UserRole } from '../types/users';
import { ROLE_LABELS } from '../types/users';

interface UserManagementPanelProps {
  currentUserEmail: string;
  onClose: () => void;
  onImpersonate: (user: User) => void;
}

export default function UserManagementPanel({ currentUserEmail, onClose, onImpersonate }: UserManagementPanelProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);

  // Load all users
  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      setLoading(true);
      const response = await fetch(`/api/users?requesterEmail=${encodeURIComponent(currentUserEmail)}`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleRole(user: User, role: UserRole) {
    const currentRoles = user.roles || [user.role];
    const newRoles = currentRoles.includes(role)
      ? currentRoles.filter(r => r !== role)
      : [...currentRoles, role];

    if (newRoles.length === 0) {
      alert('El usuario debe tener al menos un rol');
      return;
    }

    try {
      const response = await fetch(`/api/users/${user.id}/roles`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roles: newRoles, requesterEmail: currentUserEmail }),
      });

      if (response.ok) {
        await loadUsers();
      }
    } catch (error) {
      console.error('Error updating roles:', error);
    }
  }

  async function handleToggleActive(user: User) {
    try {
      const response = await fetch(`/api/users/${user.id}/active`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !user.isActive, requesterEmail: currentUserEmail }),
      });

      if (response.ok) {
        await loadUsers();
      }
    } catch (error) {
      console.error('Error toggling user active:', error);
    }
  }

  async function handleDeleteUser(user: User) {
    if (!confirm(`¿Eliminar usuario ${user.name} (${user.email})?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/users/${user.id}?requesterEmail=${encodeURIComponent(currentUserEmail)}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadUsers();
      }
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  }

  const allRoles: UserRole[] = [
    'admin',
    'expert',
    'user',
    'context_signoff',
    'context_reviewer',
    'context_creator',
    'agent_signoff',
    'agent_reviewer',
    'agent_creator',
    'context_collaborator',
    'agent_collaborator',
    'context_owner',
    'agent_owner',
  ];

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-2xl p-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-lg text-slate-700">Cargando usuarios...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-[95vw] max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-3">
            <Users className="w-7 h-7 text-blue-600" />
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Gestión de Usuarios</h2>
              <p className="text-sm text-slate-600">{users.length} usuarios totales</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-2 hover:bg-white/50 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Actions Bar */}
        <div className="p-4 border-b border-slate-200 flex items-center gap-3 bg-slate-50">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Crear Usuario
          </button>
          <button
            onClick={() => setShowBulkModal(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2 text-sm font-medium transition-colors"
          >
            <Upload className="w-4 h-4" />
            Crear Múltiples (CSV)
          </button>
          <button
            onClick={() => {
              // Export users as CSV
              const csv = `Email,Name,Roles,Company,Department,Active,Created At\n${users.map(u => 
                `${u.email},${u.name},"${u.roles?.join('; ')}",${u.company},${u.department || ''},${u.isActive},${u.createdAt.toISOString()}`
              ).join('\n')}`;
              const blob = new Blob([csv], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `users-export-${new Date().toISOString()}.csv`;
              a.click();
            }}
            className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 flex items-center gap-2 text-sm font-medium transition-colors"
          >
            <Download className="w-4 h-4" />
            Exportar CSV
          </button>
        </div>

        {/* User List Table */}
        <div className="flex-1 overflow-y-auto p-6">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 border-b-2 border-slate-200 sticky top-0">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Usuario</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Roles</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Empresa</th>
                <th className="px-4 py-3 text-center font-semibold text-slate-700">Agentes</th>
                <th className="px-4 py-3 text-center font-semibold text-slate-700">Contexto</th>
                <th className="px-4 py-3 text-center font-semibold text-slate-700">Estado</th>
                <th className="px-4 py-3 text-center font-semibold text-slate-700">Último Login</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-700">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map(user => (
                <>
                  <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                    {/* User Info */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center text-white text-sm font-bold">
                          {user.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">{user.name}</p>
                          <p className="text-xs text-slate-500">{user.email}</p>
                          {user.createdBy && (
                            <p className="text-xs text-slate-400 mt-0.5">
                              Creado por: {user.createdBy}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Roles */}
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {(user.roles || [user.role]).map(role => (
                          <span
                            key={role}
                            className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                              role === 'admin'
                                ? 'bg-purple-100 text-purple-700'
                                : role === 'expert'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {ROLE_LABELS[role]}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Company */}
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-slate-700 font-medium">{user.company}</p>
                        {user.department && (
                          <p className="text-xs text-slate-500">{user.department}</p>
                        )}
                      </div>
                    </td>

                    {/* Agents Count */}
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => setExpandedUserId(expandedUserId === user.id ? null : user.id)}
                        className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full hover:bg-blue-100 font-medium"
                      >
                        {user.agentAccessCount || 0}
                      </button>
                    </td>

                    {/* Context Count */}
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => setExpandedUserId(expandedUserId === user.id ? null : user.id)}
                        className="px-3 py-1 bg-green-50 text-green-700 rounded-full hover:bg-green-100 font-medium"
                      >
                        {user.contextAccessCount || 0}
                      </button>
                    </td>

                    {/* Active Status */}
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleToggleActive(user)}
                        className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                          user.isActive
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-red-100 text-red-700 hover:bg-red-200'
                        }`}
                      >
                        {user.isActive ? (
                          <span className="flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            Activo
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <XCircle className="w-3 h-3" />
                            Inactivo
                          </span>
                        )}
                      </button>
                    </td>

                    {/* Last Login */}
                    <td className="px-4 py-3 text-center text-xs text-slate-600">
                      {user.lastLoginAt
                        ? new Date(user.lastLoginAt).toLocaleDateString('es', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'Nunca'}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setEditingUser(user)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar roles"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onImpersonate(user)}
                          className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                          title="Impersonar usuario"
                        >
                          <UserCog className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar usuario"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Expanded Details Row */}
                  {expandedUserId === user.id && (
                    <tr>
                      <td colSpan={8} className="px-4 py-4 bg-slate-50">
                        <UserDetailsExpanded user={user} />
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>

          {users.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 mb-4">No hay usuarios creados</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Crear Primer Usuario
              </button>
            </div>
          )}
        </div>

        {/* Edit User Roles Modal */}
        {editingUser && (
          <EditUserRolesModal
            user={editingUser}
            allRoles={allRoles}
            onToggleRole={(role) => handleToggleRole(editingUser, role)}
            onClose={() => setEditingUser(null)}
          />
        )}

        {/* Create User Modal */}
        {showCreateModal && (
          <CreateUserModal
            createdBy={currentUserEmail}
            onSuccess={loadUsers}
            onClose={() => setShowCreateModal(false)}
          />
        )}

        {/* Bulk Create Modal */}
        {showBulkModal && (
          <BulkCreateUsersModal
            createdBy={currentUserEmail}
            onSuccess={loadUsers}
            onClose={() => setShowBulkModal(false)}
          />
        )}
      </div>
    </div>
  );
}

// User Details Expanded Component
function UserDetailsExpanded({ user }: { user: User }) {
  const [userAgents, setUserAgents] = useState<any[]>([]);
  const [userContext, setUserContext] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, [user.id]);

  async function loadUserData() {
    try {
      setLoading(true);
      // Load user's conversations (agents)
      const convResponse = await fetch(`/api/conversations?userId=${user.email.replace(/[@.]/g, '_')}`);
      if (convResponse.ok) {
        const convData = await convResponse.json();
        const allConvs = [
          ...(convData.groups?.flatMap((g: any) => g.conversations) || []),
        ];
        setUserAgents(allConvs.slice(0, 10)); // Show first 10
      }

      // Load user's context sources
      const ctxResponse = await fetch(`/api/context-sources?userId=${user.email.replace(/[@.]/g, '_')}`);
      if (ctxResponse.ok) {
        const ctxData = await ctxResponse.json();
        setUserContext((ctxData.sources || []).slice(0, 10)); // Show first 10
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-6">
      {/* Agents */}
      <div>
        <h4 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
          🤖 Agentes ({userAgents.length})
        </h4>
        {userAgents.length === 0 ? (
          <p className="text-sm text-slate-500 italic">Sin agentes</p>
        ) : (
          <div className="space-y-2">
            {userAgents.map((agent: any) => (
              <div key={agent.id} className="p-3 bg-white border border-slate-200 rounded-lg">
                <p className="font-medium text-slate-800 text-sm">{agent.title}</p>
                <p className="text-xs text-slate-500 mt-1">
                  {agent.messageCount || 0} mensajes · {agent.agentModel}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Context Sources */}
      <div>
        <h4 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
          📚 Fuentes de Contexto ({userContext.length})
        </h4>
        {userContext.length === 0 ? (
          <p className="text-sm text-slate-500 italic">Sin fuentes de contexto</p>
        ) : (
          <div className="space-y-2">
            {userContext.map((source: any) => (
              <div key={source.id} className="p-3 bg-white border border-slate-200 rounded-lg">
                <p className="font-medium text-slate-800 text-sm">{source.name}</p>
                <p className="text-xs text-slate-500 mt-1">
                  {source.type} · {source.metadata?.tokensEstimate || 0} tokens
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Edit User Roles Modal
function EditUserRolesModal({
  user,
  allRoles,
  onToggleRole,
  onClose,
}: {
  user: User;
  allRoles: UserRole[];
  onToggleRole: (role: UserRole) => void;
  onClose: () => void;
}) {
  const currentRoles = user.roles || [user.role];

  return (
    <div className="fixed inset-0 z-[60] bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <h3 className="text-xl font-bold text-slate-800">Editar Roles</h3>
            <p className="text-sm text-slate-600 mt-1">{user.name} ({user.email})</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-sm text-slate-600 mb-4">
            Selecciona uno o más roles para este usuario. Los permisos se combinan.
          </p>

          <div className="grid grid-cols-2 gap-3">
            {allRoles.map(role => (
              <label
                key={role}
                className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all ${
                  currentRoles.includes(role)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={currentRoles.includes(role)}
                  onChange={() => onToggleRole(role)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <p className="font-medium text-slate-800 text-sm">{ROLE_LABELS[role]}</p>
                  <p className="text-xs text-slate-500">{role}</p>
                </div>
              </label>
            ))}
          </div>

          <div className="mt-6 flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
            <p className="text-xs text-blue-800">
              El usuario tendrá la unión de todos los permisos de los roles seleccionados.
            </p>
          </div>
        </div>

        <div className="p-6 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

// Create User Modal
function CreateUserModal({
  createdBy,
  onSuccess,
  onClose,
}: {
  createdBy: string;
  onSuccess: () => void;
  onClose: () => void;
}) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [department, setDepartment] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<UserRole[]>(['user']);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allRoles: UserRole[] = [
    'admin',
    'expert',
    'user',
    'context_signoff',
    'context_reviewer',
    'context_creator',
    'agent_signoff',
    'agent_reviewer',
    'agent_creator',
    'context_collaborator',
    'agent_collaborator',
    'context_owner',
    'agent_owner',
  ];

  async function handleCreate() {
    if (!email || !name || !company) {
      setError('Email, nombre y empresa son requeridos');
      return;
    }

    try {
      setCreating(true);
      setError(null);

      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name,
          roles: selectedRoles,
          company,
          department: department || undefined,
          createdBy,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al crear usuario');
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setCreating(false);
    }
  }

  function toggleRole(role: UserRole) {
    if (selectedRoles.includes(role)) {
      const newRoles = selectedRoles.filter(r => r !== role);
      if (newRoles.length > 0) {
        setSelectedRoles(newRoles);
      } else {
        alert('El usuario debe tener al menos un rol');
      }
    } else {
      setSelectedRoles([...selectedRoles, role]);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] bg-black bg-opacity-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl my-8">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <h3 className="text-xl font-bold text-slate-800">Crear Nuevo Usuario</h3>
            <p className="text-sm text-slate-600 mt-1">Completa la información del usuario</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Email <span className="text-red-600">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@empresa.com"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Nombre <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre completo"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Company */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Empresa <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Nombre de la empresa"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Department */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Departamento</label>
            <input
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="Departamento (opcional)"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Roles Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">
              Roles <span className="text-red-600">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {allRoles.map(role => (
                <label
                  key={role}
                  className={`flex items-center gap-2 p-2 border rounded-lg cursor-pointer transition-all ${
                    selectedRoles.includes(role)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedRoles.includes(role)}
                    onChange={() => toggleRole(role)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-slate-700">{ROLE_LABELS[role]}</span>
                </label>
              ))}
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-200 flex justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={handleCreate}
            disabled={creating}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:bg-slate-300 flex items-center gap-2"
          >
            {creating && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {creating ? 'Creando...' : 'Crear Usuario'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Bulk Create Users Modal
function BulkCreateUsersModal({
  createdBy,
  onSuccess,
  onClose,
}: {
  createdBy: string;
  onSuccess: () => void;
  onClose: () => void;
}) {
  const [csvText, setCsvText] = useState('');
  const [creating, setCreating] = useState(false);
  const [result, setResult] = useState<{ created: number; errors: Array<{ email: string; error: string }> } | null>(null);

  async function handleBulkCreate() {
    if (!csvText.trim()) {
      alert('Por favor ingresa los datos en formato CSV');
      return;
    }

    try {
      setCreating(true);
      setResult(null);

      const response = await fetch('/api/users/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          csvText,
          createdBy,
        }),
      });

      if (!response.ok) {
        throw new Error('Error al crear usuarios');
      }

      const data = await response.json();
      setResult({
        created: data.created?.length || 0,
        errors: data.errors || [],
      });

      if (data.created?.length > 0) {
        onSuccess();
      }
    } catch (error) {
      alert('Error al crear usuarios: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <h3 className="text-xl font-bold text-slate-800">Crear Usuarios en Masa (CSV)</h3>
            <p className="text-sm text-slate-600 mt-1">Formato: email,nombre,roles,empresa,departamento</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm font-medium text-blue-800 mb-2">Formato de ejemplo:</p>
            <code className="text-xs text-blue-900 font-mono block">
              user1@demo.com,Juan Pérez,user;expert,Demo Corp,Ventas<br />
              user2@demo.com,María González,admin,Demo Corp,TI<br />
              user3@demo.com,Carlos Ruiz,context_creator,Demo Corp,
            </code>
            <p className="text-xs text-blue-700 mt-2">
              Los roles múltiples se separan con punto y coma (;)
            </p>
          </div>

          <textarea
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            placeholder="Pega aquí los datos en formato CSV..."
            rows={12}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
          />

          {result && (
            <div className="mt-4 space-y-2">
              {result.created > 0 && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <p className="text-sm text-green-800">
                    ✅ {result.created} usuario(s) creado(s) exitosamente
                  </p>
                </div>
              )}
              {result.errors.length > 0 && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm font-medium text-red-800 mb-2">
                    ❌ Errores ({result.errors.length}):
                  </p>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {result.errors.map((err, idx) => (
                      <p key={idx} className="text-xs text-red-700">
                        • {err.email}: {err.error}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-200 flex justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 font-medium"
          >
            Cerrar
          </button>
          <button
            onClick={handleBulkCreate}
            disabled={creating || !csvText.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:bg-slate-300 flex items-center gap-2"
          >
            {creating && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {creating ? 'Creando...' : 'Crear Usuarios'}
          </button>
        </div>
      </div>
    </div>
  );
}

