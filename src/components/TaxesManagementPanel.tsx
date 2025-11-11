/**
 * Taxes Management Panel - MVP
 * 
 * Manage tax compliance across organizations
 * Created: 2025-11-11
 */

import React, { useState } from 'react';
import { FileText, AlertCircle, CheckCircle, DollarSign, Calendar } from 'lucide-react';

export default function TaxesManagementPanel() {
  const [taxRecords] = useState([
    { id: '1', org: 'Salfa Corp', period: 'Q4 2024', taxAmount: 12500, status: 'filed', dueDate: '2025-01-31', filedDate: '2025-01-15' },
    { id: '2', org: 'Salfa Corp', period: 'Q1 2025', taxAmount: 15000, status: 'pending', dueDate: '2025-04-30', filedDate: null },
  ]);

  const totalTaxes = taxRecords.reduce((s, r) => s + r.taxAmount, 0);
  const filed = taxRecords.filter(r => r.status === 'filed').length;
  const pending = taxRecords.filter(r => r.status === 'pending').length;

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">Tax Management</h2>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <p className="text-sm font-medium text-slate-600">Filed</p>
          </div>
          <p className="text-2xl font-bold text-slate-800">{filed}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
            <p className="text-sm font-medium text-slate-600">Pending</p>
          </div>
          <p className="text-2xl font-bold text-slate-800">{pending}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-slate-600" />
            <p className="text-sm font-medium text-slate-600">Total Taxes</p>
          </div>
          <p className="text-2xl font-bold text-slate-800">${totalTaxes.toLocaleString()}</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Organization</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Period</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700 uppercase">Tax Amount</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Due Date</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Filed Date</th>
            </tr>
          </thead>
          <tbody>
            {taxRecords.map(record => (
              <tr key={record.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-800">{record.org}</td>
                <td className="px-4 py-3 text-sm text-slate-700">{record.period}</td>
                <td className="px-4 py-3 text-right font-semibold text-slate-800">${record.taxAmount.toLocaleString()}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{record.dueDate}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    record.status === 'filed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {record.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">{record.filedDate || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

