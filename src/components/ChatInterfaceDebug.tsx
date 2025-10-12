import { useState } from 'react';
import { Plus, MessageSquare, Send } from 'lucide-react';
import ContextManager from './ContextManager';
import type { ContextSource } from '../types/context';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: { text?: string } | string;
  timestamp: Date;
}

export default function ChatInterfaceDebug({ userId }: { userId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [contextSources, setContextSources] = useState<ContextSource[]>([
    {
      id: 'demo-1',
      name: 'Documento Demo.pdf',
      type: 'pdf',
      addedAt: new Date(),
      enabled: true,
      status: 'active',
      extractedData: 'Contenido demo'
    }
  ]);
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Left Sidebar */}
      <div className="w-80 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-4 border-b border-slate-200 bg-gradient-to-r from-blue-600 to-indigo-600">
          <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white text-blue-600 rounded-lg">
            <Plus className="w-5 h-5" />
            <span className="font-bold">Nuevo Agente</span>
          </button>
        </div>
        
        <div className="flex-1 p-4">
          <p className="text-sm text-slate-600 mb-4">Conversaciones</p>
        </div>

        {/* Context Manager */}
        <div className="border-t border-slate-200">
          <ContextManager
            sources={contextSources}
            validations={new Map()}
            onToggleSource={(id) => {
              setContextSources(prev =>
                prev.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s)
              );
            }}
            onSourceClick={setSelectedSourceId}
            onRemoveSource={(id) => {
              setContextSources(prev => prev.filter(s => s.id !== id));
            }}
            onAddSource={() => console.log('Add source')}
            onSourceSettings={() => console.log('Settings')}
          />
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto p-6">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-400">
              Comienza una conversación...
            </div>
          ) : (
            messages.map(msg => (
              <div key={msg.id} className="mb-4">
                <div className={`inline-block p-4 rounded-lg ${
                  msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white border'
                }`}>
                  {typeof msg.content === 'string' ? msg.content : msg.content.text || ''}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="border-t bg-white p-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribe un mensaje..."
              className="flex-1 px-4 py-3 border border-slate-300 rounded-lg"
            />
            <button className="px-6 py-3 bg-blue-600 text-white rounded-lg">
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

