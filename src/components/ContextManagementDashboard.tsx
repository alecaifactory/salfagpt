import { useState, useEffect } from 'react';
import {
  Shield,
  Users,
  Clock,
  TrendingUp,
  Plus,
  Search,
  Filter,
  Calendar,
  AlertCircle,
  CheckCircle,
  XCircle,
  Edit2,
  Trash2,
  Share2,
  ArrowLeft,
  MessageSquare,
} from 'lucide-react';
import type {
  ContextOverview,
  ContextAccessRule,
  Group,
  GroupType,
  ContextAccessStats,
} from '../types/contextAccess';
import { GROUP_LABELS, GROUP_COLORS } from '../types/contextAccess';

interface ContextManagementDashboardProps {
  currentUserId: string;
  currentUserName: string;
  onBackToChat?: () => void;
}

export default function ContextManagementDashboard({
  currentUserId,
  currentUserName,
  onBackToChat,
}: ContextManagementDashboardProps) {
  const [contexts, setContexts] = useState<ContextOverview[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [stats, setStats] = useState<ContextAccessStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'contexts' | 'groups' | 'rules'>('contexts');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateContextModal, setShowCreateContextModal] = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showAccessRuleModal, setShowAccessRuleModal] = useState(false);
  const [selectedContext, setSelectedContext] = useState<ContextOverview | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // TODO: Replace with actual API calls
      // For now, using mock data
      const mockContexts: ContextOverview[] = [
        {
          id: 'ctx-1',
          name: 'Manual de Compras 2025',
          type: 'PDF con Texto',
          size: 2500000,
          accessRules: [],
          totalUsers: 5,
          totalGroups: 2,
          createdAt: new Date(),
          updatedAt: new Date(),
          isActive: true,
        },
        {
          id: 'ctx-2',
          name: 'Catálogo de Productos',
          type: 'Excel',
          size: 1800000,
          accessRules: [],
          totalUsers: 12,
          totalGroups: 4,
          createdAt: new Date(),
          updatedAt: new Date(),
          isActive: true,
        },
      ];

      const mockGroups: Group[] = [
        {
          id: 'grp-1',
          name: 'Área de Compras',
          type: 'compras',
          description: 'Equipo de compras y adquisiciones',
          memberIds: ['user1', 'user2', 'user3'],
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: currentUserId,
          isActive: true,
        },
        {
          id: 'grp-2',
          name: 'Área de Ventas',
          type: 'ventas',
          description: 'Equipo comercial y ventas',
          memberIds: ['user4', 'user5'],
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: currentUserId,
          isActive: true,
        },
      ];

      const mockStats: ContextAccessStats = {
        totalContexts: 2,
        totalAccessRules: 8,
        totalGroups: 2,
        activeRules: 7,
        expiringSoon: 2,
        byGroup: { 'Compras': 3, 'Ventas': 2, 'Operaciones': 1 },
        byUser: { 'Individual': 2 },
      };

      setContexts(mockContexts);
      setGroups(mockGroups);
      setStats(mockStats);
    } catch (error) {
      console.error('Error loading context management data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredContexts = contexts.filter((ctx) =>
    ctx.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredGroups = groups.filter((grp) =>
    grp.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Cargando gestión de contexto...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onBackToChat && (
              <button
                onClick={onBackToChat}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                title="Volver al Chat"
              >
                <ArrowLeft className="w-6 h-6 text-slate-600" />
              </button>
            )}
            <div className="p-3 bg-blue-100 rounded-xl">
              <Shield className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Gestión de Contexto</h1>
              <p className="text-sm text-slate-600">
                Administra el acceso a contextos por usuarios y grupos
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowCreateGroupModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <Users className="w-4 h-4" />
              Nuevo Grupo
            </button>
            <button
              onClick={() => setShowAccessRuleModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Asignar Acceso
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="px-6 py-4 grid grid-cols-5 gap-4">
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-600">Total Contextos</span>
              <Shield className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-slate-800">{stats.totalContexts}</p>
          </div>

          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-600">Reglas Activas</span>
              <CheckCircle className="w-4 h-4 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-slate-800">{stats.activeRules}</p>
          </div>

          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-600">Grupos</span>
              <Users className="w-4 h-4 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-slate-800">{stats.totalGroups}</p>
          </div>

          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-600">Total Reglas</span>
              <TrendingUp className="w-4 h-4 text-indigo-600" />
            </div>
            <p className="text-2xl font-bold text-slate-800">{stats.totalAccessRules}</p>
          </div>

          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-600">Expiran Pronto</span>
              <AlertCircle className="w-4 h-4 text-red-600" />
            </div>
            <p className="text-2xl font-bold text-slate-800">{stats.expiringSoon}</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="px-6 py-2 bg-white border-b border-slate-200">
        <div className="flex gap-6">
          <button
            onClick={() => setActiveTab('contexts')}
            className={`pb-3 px-1 border-b-2 transition-colors ${
              activeTab === 'contexts'
                ? 'border-blue-600 text-blue-600 font-medium'
                : 'border-transparent text-slate-600 hover:text-slate-800'
            }`}
          >
            Contextos ({contexts.length})
          </button>
          <button
            onClick={() => setActiveTab('groups')}
            className={`pb-3 px-1 border-b-2 transition-colors ${
              activeTab === 'groups'
                ? 'border-blue-600 text-blue-600 font-medium'
                : 'border-transparent text-slate-600 hover:text-slate-800'
            }`}
          >
            Grupos ({groups.length})
          </button>
          <button
            onClick={() => setActiveTab('rules')}
            className={`pb-3 px-1 border-b-2 transition-colors ${
              activeTab === 'rules'
                ? 'border-blue-600 text-blue-600 font-medium'
                : 'border-transparent text-slate-600 hover:text-slate-800'
            }`}
          >
            Reglas de Acceso
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="px-6 py-4 bg-white border-b border-slate-200">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar contextos, grupos o reglas..."
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
            <Filter className="w-4 h-4" />
            Filtros
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto px-6 py-4">
        {activeTab === 'contexts' && (
          <div className="grid grid-cols-1 gap-4">
            {filteredContexts.map((context) => (
              <div
                key={context.id}
                className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-slate-800">{context.name}</h3>
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                        {context.type}
                      </span>
                      {context.isActive ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600" />
                      )}
                    </div>
                    <div className="flex items-center gap-6 text-sm text-slate-600 mb-4">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        {context.totalUsers} usuarios
                      </div>
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        {context.totalGroups} grupos
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {new Date(context.createdAt).toLocaleDateString('es-ES')}
                      </div>
                    </div>
                    <p className="text-sm text-slate-600">
                      Tamaño: {(context.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedContext(context);
                        setShowAccessRuleModal(true);
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Asignar acceso"
                    >
                      <Share2 className="w-5 h-5" />
                    </button>
                    <button
                      className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'groups' && (
          <div className="grid grid-cols-2 gap-4">
            {filteredGroups.map((group) => (
              <div
                key={group.id}
                className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-slate-800">{group.name}</h3>
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${GROUP_COLORS[group.type]}`}>
                        {GROUP_LABELS[group.type]}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mb-3">{group.description}</p>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Users className="w-4 h-4" />
                      {group.memberIds.length} miembros
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'rules' && (
          <div className="bg-white rounded-xl p-6 border border-slate-200">
            <p className="text-center text-slate-600 py-12">
              Selecciona un contexto para ver sus reglas de acceso
            </p>
          </div>
        )}
      </div>

      {/* TODO: Add modals for creating contexts, groups, and access rules */}
    </div>
  );
}

