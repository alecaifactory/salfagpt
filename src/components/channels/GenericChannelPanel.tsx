/**
 * Generic Channel Integration Panel
 * 
 * Reusable component for all channel integrations
 * (Gmail, Outlook, Google Chat, Slack, WhatsApp)
 * 
 * Created: 2025-11-11
 */

import React, { useState } from 'react';
import { Plus, Settings, BarChart3, CheckCircle, AlertCircle, Building2, Loader2, Link as LinkIcon, Bot, MessageCircle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface ChannelConnection {
  id: string;
  organizationName: string;
  accountId: string;
  status: 'active' | 'inactive' | 'error';
  messagesMonth: number;
  botsActive: number;
  lastSync: string;
}

interface ChannelConfig {
  name: string;
  icon: LucideIcon;
  color: string;
  description: string;
  setupInstructions: string[];
}

interface Props {
  config: ChannelConfig;
}

export default function GenericChannelPanel({ config }: Props) {
  const [connections] = useState<ChannelConnection[]>([
    {
      id: '1',
      organizationName: 'Salfa Corp',
      accountId: 'demo@example.com',
      status: 'active',
      messagesMonth: 850,
      botsActive: 2,
      lastSync: '2 hours ago'
    }
  ]);

  const [showSetup, setShowSetup] = useState(false);

  const Icon = config.icon;
  const totalMessages = connections.reduce((s, c) => s + c.messagesMonth, 0);
  const totalBots = connections.reduce((s, c) => s + c.botsActive, 0);
  const activeConns = connections.filter(c => c.status === 'active').length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <Icon className={`w-7 h-7 ${config.color}`} />
            {config.name} Integration
          </h2>
          <p className="text-sm text-slate-600 mt-1">{config.description}</p>
        </div>
        <button 
          onClick={() => setShowSetup(true)}
          className={`flex items-center gap-2 px-4 py-2 ${config.color.replace('text-', 'bg-')} text-white rounded-lg hover:opacity-90`}
        >
          <Plus className="w-5 h-5" />
          Connect Account
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <LinkIcon className={`w-5 h-5 ${config.color}`} />
            <p className="text-sm font-medium text-slate-600">Connected</p>
          </div>
          <p className="text-2xl font-bold text-slate-800">{activeConns}</p>
          <p className="text-xs text-slate-500 mt-1">organizations</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <MessageCircle className="w-5 h-5 text-blue-600" />
            <p className="text-sm font-medium text-slate-600">Messages/Month</p>
          </div>
          <p className="text-2xl font-bold text-slate-800">{totalMessages.toLocaleString()}</p>
          <p className="text-xs text-green-600 mt-1">+15% vs last month</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Bot className="w-5 h-5 text-purple-600" />
            <p className="text-sm font-medium text-slate-600">Active Bots</p>
          </div>
          <p className="text-2xl font-bold text-slate-800">{totalBots}</p>
          <p className="text-xs text-slate-500 mt-1">AI assistants</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <p className="text-sm font-medium text-slate-600">Success Rate</p>
          </div>
          <p className="text-2xl font-bold text-slate-800">96%</p>
          <p className="text-xs text-slate-500 mt-1">delivery rate</p>
        </div>
      </div>

      {/* Setup Instructions (collapsible) */}
      {showSetup && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800">Setup Instructions</h3>
            <button onClick={() => setShowSetup(false)} className="text-slate-500 hover:text-slate-700">
              Close
            </button>
          </div>
          <ol className="space-y-2 text-sm text-slate-700">
            {config.setupInstructions.map((instruction, idx) => (
              <li key={idx} className="flex gap-3">
                <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 bg-blue-600 text-white rounded-full text-xs font-bold">
                  {idx + 1}
                </span>
                <span>{instruction}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Connections Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
          <h3 className="font-bold text-slate-800">Active Connections</h3>
        </div>
        <table className="w-full">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Organization</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Account</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-slate-700 uppercase">Messages/Mo</th>
              <th className="px-6 py-3 text-center text-xs font-semibold text-slate-700 uppercase">Bots</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Last Sync</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-slate-700 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {connections.map(conn => (
              <tr key={conn.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-6 py-4 font-medium text-slate-800">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-slate-400" />
                    {conn.organizationName}
                  </div>
                </td>
                <td className="px-6 py-4 font-mono text-sm text-slate-700">{conn.accountId}</td>
                <td className="px-6 py-4 text-right text-sm text-slate-800">{conn.messagesMonth.toLocaleString()}</td>
                <td className="px-6 py-4 text-center text-sm text-slate-800">{conn.botsActive}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{conn.lastSync}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    conn.status === 'active' ? 'bg-green-100 text-green-700' :
                    conn.status === 'inactive' ? 'bg-slate-100 text-slate-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {conn.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                      <Settings className="w-4 h-4" />
                    </button>
                    <button className="p-1 text-slate-600 hover:bg-slate-50 rounded">
                      <BarChart3 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-4">
        <button className="p-4 border-2 border-dashed border-slate-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors text-center">
          <Bot className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="text-sm font-medium text-slate-700">Create Bot</p>
          <p className="text-xs text-slate-500">AI-powered assistant</p>
        </button>
        <button className="p-4 border-2 border-dashed border-slate-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors text-center">
          <MessageCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="text-sm font-medium text-slate-700">Message Template</p>
          <p className="text-xs text-slate-500">Reusable messages</p>
        </button>
        <button className="p-4 border-2 border-dashed border-slate-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors text-center">
          <BarChart3 className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="text-sm font-medium text-slate-700">View Analytics</p>
          <p className="text-xs text-slate-500">Message insights</p>
        </button>
      </div>
    </div>
  );
}





