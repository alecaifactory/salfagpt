/**
 * Support Ticket Form
 * 
 * Create priority support tickets (max 5/month)
 * Categories: bug, feature-request, use-case, question
 * Priority levels: low, normal, high, urgent
 * 
 * Created: 2025-11-18
 */

import { useState } from 'react';
import { Ticket, Send, X, AlertCircle } from 'lucide-react';
import type { Subscription } from '../types/subscriptions';
import { canCreateTicket, getRemainingTickets } from '../types/subscriptions';

interface SupportTicketFormProps {
  subscription: Subscription;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function SupportTicketForm({ 
  subscription, 
  isOpen, 
  onClose,
  onSuccess 
}: SupportTicketFormProps) {
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('use-case');
  const [priority, setPriority] = useState('normal');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const canCreate = canCreateTicket(subscription);
  const ticketsRemaining = getRemainingTickets(subscription);
  const ticketsUsed = subscription.currentPeriodUsage.ticketsUsed;
  const ticketsTotal = subscription.features.priorityTickets;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!canCreate || !subject.trim() || !description.trim()) return;

    setSubmitting(true);

    try {
      const response = await fetch('/api/tickets/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: subject.trim(),
          description: description.trim(),
          category,
          priority,
        })
      });

      const data = await response.json();

      if (response.ok) {
        alert(`✅ Ticket ${data.ticket.ticketNumber} created!\n\nWe'll respond within 24 hours.`);
        
        // Reset form
        setSubject('');
        setDescription('');
        setCategory('use-case');
        setPriority('normal');
        
        onSuccess?.();
        onClose();
      } else {
        alert(data.message || 'Failed to create ticket');
      }
    } catch (error) {
      console.error('Error creating ticket:', error);
      alert('Error creating support ticket');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <Ticket className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-bold text-slate-800">Create Support Ticket</h2>
              <p className="text-sm text-slate-600">
                {ticketsUsed} of {ticketsTotal} used this month • {ticketsRemaining} remaining
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6">
          {!canCreate ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-800 mb-1">
                    Monthly ticket limit reached
                  </p>
                  <p className="text-sm text-yellow-700">
                    You've used all {ticketsTotal} priority tickets this month. 
                    Your counter resets on {new Date(subscription.nextBillingDate).toLocaleDateString()}.
                  </p>
                  <p className="text-sm text-yellow-700 mt-2">
                    For urgent issues, email support@latamlab.ai directly.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Subject */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Subject <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Brief description of your issue"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  maxLength={100}
                />
                <p className="text-xs text-slate-500 mt-1">
                  {subject.length}/100 characters
                </p>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Category
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'bug', label: '🐛 Bug Report', desc: 'Something isn\'t working' },
                    { value: 'feature-request', label: '💡 Feature Request', desc: 'Suggest an improvement' },
                    { value: 'use-case', label: '🎯 Use Case Help', desc: 'How do I accomplish X?' },
                    { value: 'question', label: '❓ Question', desc: 'General inquiry' },
                  ].map(cat => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => setCategory(cat.value)}
                      className={`p-3 border-2 rounded-lg text-left transition-all ${
                        category === cat.value
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="font-medium text-sm mb-1">{cat.label}</div>
                      <div className="text-xs text-slate-500">{cat.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Priority
                </label>
                <div className="flex gap-3">
                  {[
                    { value: 'low', label: 'Low', color: 'slate' },
                    { value: 'normal', label: 'Normal', color: 'blue' },
                    { value: 'high', label: 'High', color: 'yellow' },
                    { value: 'urgent', label: 'Urgent', color: 'red' },
                  ].map(pri => (
                    <button
                      key={pri.value}
                      type="button"
                      onClick={() => setPriority(pri.value)}
                      className={`flex-1 py-2 px-3 border-2 rounded-lg font-medium text-sm transition-all ${
                        priority === pri.value
                          ? `border-${pri.color}-600 bg-${pri.color}-50 text-${pri.color}-700`
                          : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {pri.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Description <span className="text-red-600">*</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Please provide detailed information about your issue or question..."
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={6}
                  required
                  maxLength={2000}
                />
                <p className="text-xs text-slate-500 mt-1">
                  {description.length}/2000 characters
                </p>
              </div>

              {/* Response Time Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800 font-medium mb-2">
                  📬 Response Time Guarantee
                </p>
                <div className="space-y-1 text-sm text-blue-700">
                  <div>• Normal/Low: Within 24 hours</div>
                  <div>• High: Within 8 hours</div>
                  <div>• Urgent: Within 2 hours</div>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={submitting || !subject.trim() || !description.trim()}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    'Creating...'
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Create Ticket
                    </>
                  )}
                </button>
                
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-3 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

