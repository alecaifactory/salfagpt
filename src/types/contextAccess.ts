// Context Access Management Types

export type GroupType = 
  | 'compras'
  | 'ventas'
  | 'operaciones'
  | 'marketing'
  | 'finanzas'
  | 'cobranza'
  | 'adquisicion'
  | 'retencion'
  | 'gerencia'
  | 'rrhh'
  | 'legal'
  | 'ti';

export interface Group {
  id: string;
  name: string;
  type: GroupType;
  description: string;
  memberIds: string[]; // User IDs
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  isActive: boolean;
}

export interface ContextAccessRule {
  id: string;
  contextId: string;
  contextName: string;
  grantedTo: {
    type: 'user' | 'group';
    id: string; // userId or groupId
    name: string;
  };
  permissions: {
    canView: boolean;
    canEdit: boolean;
    canShare: boolean;
    canDelete: boolean;
  };
  expiresAt?: Date;
  duration?: number; // in days
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  isActive: boolean;
}

export interface ContextOverview {
  id: string;
  name: string;
  type: string;
  size: number;
  accessRules: ContextAccessRule[];
  totalUsers: number;
  totalGroups: number;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export const GROUP_LABELS: Record<GroupType, string> = {
  compras: 'Área de Compras',
  ventas: 'Área de Ventas',
  operaciones: 'Área de Operaciones',
  marketing: 'Marketing',
  finanzas: 'Finanzas',
  cobranza: 'Cobranza',
  adquisicion: 'Adquisición',
  retencion: 'Retención',
  gerencia: 'Gerencia',
  rrhh: 'Recursos Humanos',
  legal: 'Legal',
  ti: 'Tecnología de la Información',
};

export const GROUP_COLORS: Record<GroupType, string> = {
  compras: 'bg-blue-100 text-blue-800',
  ventas: 'bg-green-100 text-green-800',
  operaciones: 'bg-purple-100 text-purple-800',
  marketing: 'bg-pink-100 text-pink-800',
  finanzas: 'bg-yellow-100 text-yellow-800',
  cobranza: 'bg-red-100 text-red-800',
  adquisicion: 'bg-indigo-100 text-indigo-800',
  retencion: 'bg-cyan-100 text-cyan-800',
  gerencia: 'bg-slate-100 text-slate-800',
  rrhh: 'bg-orange-100 text-orange-800',
  legal: 'bg-gray-100 text-gray-800',
  ti: 'bg-teal-100 text-teal-800',
};

export interface ContextAccessStats {
  totalContexts: number;
  totalAccessRules: number;
  totalGroups: number;
  activeRules: number;
  expiringSoon: number; // Expiring in next 7 days
  byGroup: Record<string, number>;
  byUser: Record<string, number>;
}

