/**
 * Collections Management Panel - MVP
 * 
 * Manage receivables and collections across organizations
 * Created: 2025-11-11
 */

import React, { useState } from 'react';
import { Archive, DollarSign, Clock, CheckCircle, AlertCircle } from 'lucide-react';

export default function CollectionsManagementPanel() {
  const [collections] = useState([
    { id: '1', org: 'Salfa Corp', amount: 25000, dueDate: '2025-01-15', status: 'pending', daysOverdue: 0 },
    { id: '2', org: 'Salfa Corp', amount: 15000, dueDate: '2024-12-20', status: 'overdue', daysOverdue: 22 },
  ]);

  const totalPending = collections.filter(c => c.status === 'pending').reduce((s, c) => s + c.amount, 0);
  const totalOverdue = collections.filter(c => c.status === 'overdue').reduce((s, c) => s + c.amount, 0);

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">Collections</h2>
      
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-blue-600" />
            <p className="text-sm font-medium text-slate-600">Pending</p>
          </div>
          <p className="text-2xl font-bold text-slate-800">${totalPending.toLocaleString()}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-sm font-medium text-slate-600">Overdue</p>
          </div>
          <p className="text-2xl font-bold text-red-700">${totalOverdue.toLocaleString()}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <p className="text-sm font-medium text-slate-600">Collection Rate</p>
          </div>
          <p className="text-2xl font-bold text-slate-800">92%</p>
        </div>
      </div>

      {/* Collections Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Organization</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700 uppercase">Amount</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Due Date</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Days Overdue</th>
            </tr>
          </thead>
          <tbody>
            {collections.map(item => (
              <tr key={item.id} className="border-b border-slate-100">
                <td className="px-4 py-3 font-medium text-slate-800">{item.org}</td>
                <td className="px-4 py-3 text-right font-semibold text-slate-800">${item.amount.toLocaleString()}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{item.dueDate}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    item.status === 'paid' ? 'bg-green-100 text-green-700' :
                    item.status === 'pending' ? 'bg-blue-100 text-blue-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {item.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-red-600 font-medium">
                  {item.daysOverdue > 0 ? `${item.daysOverdue} days` : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

