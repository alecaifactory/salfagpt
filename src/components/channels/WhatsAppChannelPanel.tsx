/**
 * WhatsApp Channel Integration Panel - MVP
 * 
 * Manage WhatsApp Business integration across organizations
 * Features:
 * - Connect WhatsApp Business accounts
 * - Manage phone numbers
 * - Bot configuration
 * - Message templates
 * - Analytics
 * 
 * Created: 2025-11-11
 */

import React, { useState } from 'react';
import { MessageCircle, Plus, Settings, BarChart3, CheckCircle, Clock, Building2, Phone, Bot } from 'lucide-react';

export default function WhatsAppChannelPanel() {
  const [connections] = useState([
    { id: '1', org: 'Salfa Corp', phoneNumber: '+56 9 1234 5678', status: 'active', messagesMonth: 1250, botsActive: 3 },
  ]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <MessageCircle className="w-7 h-7 text-green-600" />
            WhatsApp Business Integration
          </h2>
          <p className="text-sm text-slate-600">Manage WhatsApp across all organizations</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
          <Plus className="w-5 h-5" />
          Connect Number
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Phone className="w-5 h-5 text-green-600" />
            <p className="text-sm font-medium text-slate-600">Connected Numbers</p>
          </div>
          <p className="text-2xl font-bold text-slate-800">{connections.length}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <MessageCircle className="w-5 h-5 text-blue-600" />
            <p className="text-sm font-medium text-slate-600">Messages/Month</p>
          </div>
          <p className="text-2xl font-bold text-slate-800">{connections.reduce((s, c) => s + c.messagesMonth, 0).toLocaleString()}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Bot className="w-5 h-5 text-purple-600" />
            <p className="text-sm font-medium text-slate-600">Active Bots</p>
          </div>
          <p className="text-2xl font-bold text-slate-800">{connections.reduce((s, c) => s + c.botsActive, 0)}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <p className="text-sm font-medium text-slate-600">Response Rate</p>
          </div>
          <p className="text-2xl font-bold text-slate-800">94%</p>
        </div>
      </div>

      {/* Connections Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
          <h3 className="font-bold text-slate-800">WhatsApp Connections</h3>
        </div>
        <table className="w-full">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Organization</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Phone Number</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-slate-700 uppercase">Messages/Month</th>
              <th className="px-6 py-3 text-center text-xs font-semibold text-slate-700 uppercase">Bots</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-slate-700 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {connections.map(conn => (
              <tr key={conn.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-6 py-4 font-medium text-slate-800">{conn.org}</td>
                <td className="px-6 py-4 font-mono text-sm text-slate-700">{conn.phoneNumber}</td>
                <td className="px-6 py-4 text-right text-sm text-slate-800">{conn.messagesMonth.toLocaleString()}</td>
                <td className="px-6 py-4 text-center text-sm text-slate-800">{conn.botsActive}</td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                    {conn.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                    <Settings className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


