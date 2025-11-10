import { useState, useEffect } from 'react';
import { X, Users, UserCog, Settings, Plus, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import type { User, UserRole, ImpersonationState } from '../types/user';
import { getRoleInfo, hasPermission } from '../lib/permissions';

interface UserManagementSectionProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onImpersonate: (targetUser: User) => Promise<void>;
}

export default function UserManagementSection({
  isOpen,
  onClose,
  currentUser,
  onImpersonate,
}: UserManagementSectionProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateUser, setShowCreateUser] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadUsers();
    }
  }, [isOpen]);

  async function loadUsers() {
    if (!hasPermission(currentUser, 'canManageUsers')) {
      setError('No tienes permiso para gestionar usuarios');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/users');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setUsers(data);
    } catch (err) {
      console.error('Failed to load users:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  async function updateUserRole(userId: string, newRole: UserRole) {
    try {
      const response = await fetch(`/api/users/${userId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      });

      if (!response.ok) throw new Error('Failed to update role');

      // Reload users
      await loadUsers();
      
      console.log('✅ Role updated:', userId, newRole);
    } catch (error) {
      console.error('❌ Failed to update role:', error);
      alert('Error al actualizar rol');
    }
  }

  async function handleImpersonate(targetUser: User) {
    const confirmed = confirm(
      `Actuar como ${targetUser.name} (${getRoleInfo(targetUser.role).label})?\n\n` +
      `Verás la interfaz y tendrás los permisos de este usuario.\n` +
      `Podrás volver a tu sesión de admin en cualquier momento.`
    );

    if (!confirmed) return;

    try {
      await onImpersonate(targetUser);
      onClose(); // Close user management panel
    } catch (error) {
      console.error('❌ Failed to impersonate:', error);
      alert('Error al impersonar usuario');
    }
  }

  function formatDate(date: Date | undefined): string {
    if (!date) return 'Never';
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800">User Management</h2>
              <p className="text-sm text-slate-600">Gestionar usuarios y permisos</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-slate-600">Cargando usuarios...</span>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-600" />
                <p className="font-semibold text-red-800">Error: {error}</p>
              </div>
              <button
                onClick={loadUsers}
                className="mt-2 text-red-600 hover:underline text-sm"
              >
                Reintentar
              </button>
            </div>
          )}

          {!loading && !error && users.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              <Users className="w-12 h-12 mx-auto mb-3 text-slate-400" />
              <p>No hay usuarios registrados</p>
            </div>
          )}

          {!loading && !error && users.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-100 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Usuario</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Rol</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Empresa</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Departamento</th>
                    <th className="px-4 py-3 text-center font-semibold text-slate-700">Estado</th>
                    <th className="px-4 py-3 text-center font-semibold text-slate-700">Último Login</th>
                    <th className="px-4 py-3 text-right font-semibold text-slate-700">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => {
                    const roleInfo = getRoleInfo(user.role);
                    const isCurrentUser = user.id === currentUser.id;
                    
                    return (
                      <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold">
                              {user.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-slate-800 flex items-center gap-2">
                                {user.name}
                                {isCurrentUser && (
                                  <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[10px] rounded-full font-semibold">
                                    You
                                  </span>
                                )}
                              </p>
                              <p className="text-xs text-slate-500">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={user.role}
                            onChange={(e) => updateUserRole(user.id, e.target.value as UserRole)}
                            disabled={isCurrentUser}
                            className="px-2 py-1 border border-slate-300 rounded text-xs disabled:bg-slate-100 disabled:cursor-not-allowed"
                            title={roleInfo.description}
                          >
                            <option value="admin">👑 Admin</option>
                            <option value="supervisor">👨‍💼 Supervisor</option>
                            <option value="especialista">🎓 Especialista</option>
                            <option value="expert">🎓 Experto (Legacy)</option>
                            <option value="user">👤 User</option>
                            <option value="context_signoff">✅ Context Signoff</option>
                            <option value="context_reviewer">👁️ Context Reviewer</option>
                            <option value="context_creator">📝 Context Creator</option>
                            <option value="context_feedback">💬 Context Feedback</option>
                            <option value="agent_signoff">🤖✅ Agent Signoff</option>
                            <option value="agent_reviewer">🤖👁️ Agent Reviewer</option>
                            <option value="agent_creator">🤖📝 Agent Creator</option>
                            <option value="agent_feedback">🤖💬 Agent Feedback</option>
                          </select>
                        </td>
                        <td className="px-4 py-3 text-slate-700">{user.company}</td>
                        <td className="px-4 py-3 text-slate-600 text-xs">{user.department || '-'}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1 ${
                            user.isActive 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {user.isActive ? (
                              <>
                                <CheckCircle className="w-3 h-3" />
                                Active
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3 h-3" />
                                Inactive
                              </>
                            )}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-xs text-slate-600">
                          {formatDate(user.lastLoginAt)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            {!isCurrentUser && (
                              <button
                                onClick={() => handleImpersonate(user)}
                                className="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs font-medium flex items-center gap-1 transition-colors"
                                title={`Actuar como ${user.name}`}
                              >
                                <UserCog className="w-3.5 h-3.5" />
                                Impersonate
                              </button>
                            )}
                            <button
                              className="px-2 py-1.5 border border-slate-300 rounded hover:bg-slate-50 text-xs transition-colors"
                              title="Edit user"
                            >
                              <Settings className="w-3.5 h-3.5 text-slate-600" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 flex justify-between items-center">
          <div className="text-sm text-slate-600">
            <span className="font-semibold">{users.length}</span> usuarios totales
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowCreateUser(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Crear Usuario
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

