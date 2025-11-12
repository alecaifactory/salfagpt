import React, { useState } from 'react';
import { X, Calendar, ArrowUpDown } from 'lucide-react';

interface AccessRecord {
  userId: string;
  userEmail: string;
  userName: string;
  domain: string;
  organizationId: string | null;
  organizationName: string;
  accessLevel: 'view' | 'use' | 'admin';
  grantedBy: string;
  grantedByEmail: string;
  grantedAt: Date;
  shareId: string;
  revokedBy?: string;
  revokedByEmail?: string;
  revokedAt?: Date;
  isActive: boolean;
}

interface AgentAccessTableProps {
  activeAccess: AccessRecord[];
  revokedAccess: AccessRecord[];
  onRevokeAccess: (userEmail: string, shareId: string, userName: string) => Promise<void>;
}

export default function AgentAccessTable({ 
  activeAccess, 
  revokedAccess, 
  onRevokeAccess 
}: AgentAccessTableProps) {
  const [sortBy, setSortBy] = useState<'name' | 'email' | 'date' | 'domain' | 'org'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  const toggleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };
  
  const sortedActive = [...activeAccess].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'name':
        comparison = a.userName.localeCompare(b.userName);
        break;
      case 'email':
        comparison = a.userEmail.localeCompare(b.userEmail);
        break;
      case 'domain':
        comparison = a.domain.localeCompare(b.domain);
        break;
      case 'org':
        comparison = (a.organizationName || '').localeCompare(b.organizationName || '');
        break;
      case 'date':
      default:
        comparison = new Date(b.grantedAt).getTime() - new Date(a.grantedAt).getTime();
    }
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });
  
  const getAccessLevelBadge = (level: string) => {
    const colors = {
      view: 'bg-blue-100 text-blue-700',
      use: 'bg-green-100 text-green-700',
      admin: 'bg-purple-100 text-purple-700',
    };
    
    const labels = {
      view: 'Ver',
      use: 'Usar',
      admin: 'Admin',
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-[10px] font-semibold ${colors[level] || colors.view}`}>
        {labels[level] || level}
      </span>
    );
  };

  const SortableHeader = ({ column, children }: { column: typeof sortBy; children: React.ReactNode }) => (
    <th 
      className="px-3 py-2 text-left font-semibold text-slate-700 cursor-pointer hover:bg-slate-200 transition-colors"
      onClick={() => toggleSort(column)}
    >
      <div className="flex items-center gap-1">
        {children}
        {sortBy === column && (
          <span className="text-blue-600">{sortOrder === 'asc' ? '↑' : '↓'}</span>
        )}
      </div>
    </th>
  );

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Active Access Table */}
      <div className="flex-1 overflow-auto">
        <div className="text-sm font-semibold text-slate-700 mb-2">
          ✅ Usuarios Activos ({sortedActive.length})
        </div>
        
        {sortedActive.length === 0 ? (
          <div className="text-center text-slate-500 py-8">
            <p className="text-sm">No hay usuarios con acceso activo</p>
          </div>
        ) : (
          <table className="w-full text-xs border-collapse">
            <thead className="bg-slate-100 sticky top-0 z-10">
              <tr className="border-b border-slate-200">
                <SortableHeader column="name">Nombre</SortableHeader>
                <SortableHeader column="email">Email</SortableHeader>
                <SortableHeader column="org">Organización</SortableHeader>
                <SortableHeader column="domain">Dominio</SortableHeader>
                <th className="px-3 py-2 text-center font-semibold text-slate-700">Nivel</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-700">Otorgado por</th>
                <SortableHeader column="date">Fecha</SortableHeader>
                <th className="px-3 py-2 text-center font-semibold text-slate-700">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedActive.map((access) => (
                <tr 
                  key={`${access.shareId}-${access.userEmail}`}
                  className="hover:bg-green-50 transition-colors"
                >
                  <td className="px-3 py-2 font-medium text-slate-800">
                    {access.userName}
                  </td>
                  <td className="px-3 py-2 text-slate-600">
                    <span className="font-mono text-[11px]">{access.userEmail}</span>
                  </td>
                  <td className="px-3 py-2 text-slate-600">
                    {access.organizationName || '-'}
                  </td>
                  <td className="px-3 py-2">
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] font-medium">
                      {access.domain}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-center">
                    {getAccessLevelBadge(access.accessLevel)}
                  </td>
                  <td className="px-3 py-2 text-slate-600">
                    <span className="text-[10px]">{access.grantedByEmail}</span>
                  </td>
                  <td className="px-3 py-2 text-slate-600">
                    {new Date(access.grantedAt).toLocaleDateString('es-CL')}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <button
                      onClick={() => onRevokeAccess(access.userEmail, access.shareId, access.userName)}
                      className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                      title={`Revocar acceso para ${access.userName}`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Revoked Access Table (History) */}
      {revokedAccess.length > 0 && (
        <div className="border-t border-slate-200 pt-4">
          <div className="text-sm font-semibold text-slate-500 mb-2">
            📜 Historial de Accesos Revocados ({revokedAccess.length})
          </div>
          
          <table className="w-full text-xs border-collapse opacity-60">
            <thead className="bg-slate-50">
              <tr className="border-b border-slate-200">
                <th className="px-3 py-2 text-left font-semibold text-slate-600">Nombre</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-600">Email</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-600">Organización</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-600">Acceso</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-600">Revocado por</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-600">Fecha Revocación</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {revokedAccess.map((access) => (
                <tr 
                  key={`revoked-${access.shareId}-${access.userEmail}`}
                  className="hover:bg-slate-50"
                >
                  <td className="px-3 py-2 text-slate-500 line-through">
                    {access.userName}
                  </td>
                  <td className="px-3 py-2 text-slate-500">
                    <span className="font-mono text-[11px]">{access.userEmail}</span>
                  </td>
                  <td className="px-3 py-2 text-slate-500">
                    {access.organizationName || '-'}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full text-[10px]">
                      {access.accessLevel}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-slate-500">
                    <span className="text-[10px]">{access.revokedByEmail || '-'}</span>
                  </td>
                  <td className="px-3 py-2 text-slate-500">
                    {access.revokedAt ? new Date(access.revokedAt).toLocaleDateString('es-CL') : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

