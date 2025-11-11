/**
 * Invoicing Management Panel
 * 
 * SuperAdmin interface for managing invoicing across organizations
 * Features:
 * - View invoices for all organizations
 * - Create invoices
 * - Track payment status
 * - Export invoices
 * 
 * Created: 2025-11-11
 */

import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Plus, 
  Download, 
  Eye, 
  DollarSign,
  Building2,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  Search
} from 'lucide-react';

interface Invoice {
  id: string;
  organizationId: string;
  organizationName: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  dueDate: Date;
  createdAt: Date;
  paidAt?: Date;
}

interface Props {
  currentUserId: string;
  currentUserRole: string;
}

export default function InvoicingManagementPanel({ currentUserId, currentUserRole }: Props) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadInvoices();
  }, []);

  async function loadInvoices() {
    try {
      setLoading(true);
      // Mock data for MVP
      const mockInvoices: Invoice[] = [
        {
          id: 'inv-001',
          organizationId: 'salfa-corp',
          organizationName: 'Salfa Corp',
          invoiceNumber: 'INV-2025-001',
          amount: 5000,
          currency: 'USD',
          status: 'paid',
          dueDate: new Date('2025-01-15'),
          createdAt: new Date('2025-01-01'),
          paidAt: new Date('2025-01-10'),
        },
        {
          id: 'inv-002',
          organizationId: 'salfa-corp',
          organizationName: 'Salfa Corp',
          invoiceNumber: 'INV-2025-002',
          amount: 5000,
          currency: 'USD',
          status: 'sent',
          dueDate: new Date('2025-02-15'),
          createdAt: new Date('2025-02-01'),
        },
      ];
      setInvoices(mockInvoices);
    } catch (error) {
      console.error('Error loading invoices:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredInvoices = invoices.filter(inv => {
    if (filter !== 'all' && inv.status !== filter) return false;
    if (searchQuery && !inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !inv.organizationName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const statusColors = {
    draft: 'bg-slate-100 text-slate-700',
    sent: 'bg-blue-100 text-blue-700',
    paid: 'bg-green-100 text-green-700',
    overdue: 'bg-red-100 text-red-700',
    cancelled: 'bg-slate-100 text-slate-500',
  };

  const statusIcons = {
    draft: Clock,
    sent: FileText,
    paid: CheckCircle,
    overdue: XCircle,
    cancelled: XCircle,
  };

  const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.amount, 0);
  const pendingAmount = invoices.filter(i => i.status === 'sent').reduce((sum, i) => sum + i.amount, 0);
  const overdueAmount = invoices.filter(i => i.status === 'overdue').reduce((sum, i) => sum + i.amount, 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Invoicing</h2>
          <p className="text-sm text-slate-600">Manage invoices across all organizations</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus className="w-5 h-5" />
          New Invoice
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <p className="text-sm font-medium text-slate-600">Total Revenue</p>
          </div>
          <p className="text-2xl font-bold text-slate-800">${totalRevenue.toLocaleString()}</p>
        </div>
        
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-blue-600" />
            <p className="text-sm font-medium text-slate-600">Pending</p>
          </div>
          <p className="text-2xl font-bold text-slate-800">${pendingAmount.toLocaleString()}</p>
        </div>
        
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <XCircle className="w-5 h-5 text-red-600" />
            <p className="text-sm font-medium text-slate-600">Overdue</p>
          </div>
          <p className="text-2xl font-bold text-slate-800">${overdueAmount.toLocaleString()}</p>
        </div>
        
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-5 h-5 text-slate-600" />
            <p className="text-sm font-medium text-slate-600">Total Invoices</p>
          </div>
          <p className="text-2xl font-bold text-slate-800">{invoices.length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search invoices..."
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <select
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Status</option>
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
        </select>
      </div>

      {/* Invoice Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Invoice #</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Organization</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Amount</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Due Date</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Status</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredInvoices.map(invoice => {
              const StatusIcon = statusIcons[invoice.status];
              return (
                <tr key={invoice.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-sm text-slate-800">{invoice.invoiceNumber}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">{invoice.organizationName}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-slate-800">
                    {invoice.currency} ${invoice.amount.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {invoice.dueDate.toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${statusColors[invoice.status]}`}>
                      <StatusIcon className="w-3 h-3" />
                      {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-1 text-slate-600 hover:bg-slate-50 rounded">
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

