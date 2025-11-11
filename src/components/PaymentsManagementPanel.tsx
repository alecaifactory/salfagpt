/**
 * Payments Management Panel - MVP
 * 
 * Track and manage payments across organizations
 * Created: 2025-11-11
 */

import React, { useState } from 'react';
import { DollarSign, CheckCircle, Clock, CreditCard, Building2, Calendar } from 'lucide-react';

export default function PaymentsManagementPanel() {
  const [payments] = useState([
    { id: '1', org: 'Salfa Corp', invoiceId: 'INV-001', amount: 5000, method: 'Bank Transfer', status: 'completed', date: '2025-01-10' },
    { id: '2', org: 'Salfa Corp', invoiceId: 'INV-002', amount: 5000, method: 'Credit Card', status: 'pending', date: '2025-02-01' },
  ]);

  const totalReceived = payments.filter(p => p.status === 'completed').reduce((s, p) => s + p.amount, 0);
  const totalPending = payments.filter(p => p.status === 'pending').reduce((s, p) => s + p.amount, 0);

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">Payments</h2>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <p className="text-sm font-medium text-slate-600">Received</p>
          </div>
          <p className="text-2xl font-bold text-green-700">${totalReceived.toLocaleString()}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-yellow-600" />
            <p className="text-sm font-medium text-slate-600">Pending</p>
          </div>
          <p className="text-2xl font-bold text-yellow-700">${totalPending.toLocaleString()}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <CreditCard className="w-5 h-5 text-blue-600" />
            <p className="text-sm font-medium text-slate-600">Total Payments</p>
          </div>
          <p className="text-2xl font-bold text-slate-800">{payments.length}</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Organization</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Invoice</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700 uppercase">Amount</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Method</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Date</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Status</th>
            </tr>
          </thead>
          <tbody>
            {payments.map(payment => (
              <tr key={payment.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-800">{payment.org}</td>
                <td className="px-4 py-3 font-mono text-sm text-slate-700">{payment.invoiceId}</td>
                <td className="px-4 py-3 text-right font-semibold text-slate-800">${payment.amount.toLocaleString()}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{payment.method}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{payment.date}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    payment.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {payment.status}
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

