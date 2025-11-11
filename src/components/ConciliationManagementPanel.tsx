/**
 * Conciliation Management Panel - MVP
 * 
 * Reconcile payments and invoices across organizations
 * Created: 2025-11-11
 */

import React, { useState } from 'react';
import { CheckCircle, XCircle, Clock, Building2, FileText } from 'lucide-react';

export default function ConciliationManagementPanel() {
  const [reconciliations] = useState([
    { id: '1', org: 'Salfa Corp', invoiceId: 'INV-001', paymentId: 'PAY-001', amount: 5000, status: 'matched', date: '2025-01-10' },
    { id: '2', org: 'Salfa Corp', invoiceId: 'INV-002', paymentId: null, amount: 5000, status: 'pending', date: '2025-02-01' },
  ]);

  const matched = reconciliations.filter(r => r.status === 'matched').length;
  const pending = reconciliations.filter(r => r.status === 'pending').length;

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">Conciliation</h2>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <p className="text-sm font-medium text-slate-600">Matched</p>
          </div>
          <p className="text-2xl font-bold text-slate-800">{matched}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-yellow-600" />
            <p className="text-sm font-medium text-slate-600">Pending</p>
          </div>
          <p className="text-2xl font-bold text-slate-800">{pending}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-5 h-5 text-slate-600" />
            <p className="text-sm font-medium text-slate-600">Match Rate</p>
          </div>
          <p className="text-2xl font-bold text-slate-800">{Math.round((matched / reconciliations.length) * 100)}%</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Organization</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Invoice</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Payment</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700 uppercase">Amount</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Status</th>
            </tr>
          </thead>
          <tbody>
            {reconciliations.map(item => (
              <tr key={item.id} className="border-b border-slate-100">
                <td className="px-4 py-3 text-sm text-slate-700">{item.org}</td>
                <td className="px-4 py-3 font-mono text-sm text-slate-800">{item.invoiceId}</td>
                <td className="px-4 py-3 font-mono text-sm text-slate-600">{item.paymentId || '-'}</td>
                <td className="px-4 py-3 text-right font-semibold text-slate-800">${item.amount.toLocaleString()}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    item.status === 'matched' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {item.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

