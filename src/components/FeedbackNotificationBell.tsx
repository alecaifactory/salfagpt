/**
 * 🔔 Feedback Notification Bell
 * 
 * Notification bell for admins/superadmins to see new feedback from users.
 * Shows count of unread feedback tickets and allows quick access.
 * 
 * Features:
 * - Real-time count of new feedback
 * - Dropdown with recent feedback items
 * - Click to open Roadmap filtered by feedback
 * - Visual indicator for new items
 * 
 * Access: Admin, SuperAdmin only
 */

import React, { useState, useEffect } from 'react';
import { MessageCircle, Bug, Lightbulb, TrendingUp, ExternalLink, X } from 'lucide-react';

interface FeedbackTicket {
  id: string;
  ticketId: string;
  category: 'bug' | 'feature' | 'improvement';
  title: string;
  createdBy: string;
  createdByEmail: string;
  createdByName: string;
  createdAt: Date;
  isRead: boolean;
}

interface FeedbackNotificationBellProps {
  userId: string;
  userRole: string;
  onOpenRoadmap: () => void;
}

export default function FeedbackNotificationBell({
  userId,
  userRole,
  onOpenRoadmap,
}: FeedbackNotificationBellProps) {
  const [feedbackTickets, setFeedbackTickets] = useState<FeedbackTicket[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);

  // Only show for admins
  if (!['admin', 'superadmin'].includes(userRole)) {
    return null;
  }

  // Load feedback tickets
  useEffect(() => {
    loadFeedbackTickets();
    
    // Poll for new tickets every 30 seconds
    const interval = setInterval(loadFeedbackTickets, 30000);
    return () => clearInterval(interval);
  }, [userId]);

  async function loadFeedbackTickets() {
    try {
      const response = await fetch(`/api/stella/feedback-tickets?userId=${userId}`);
      if (!response.ok) throw new Error('Failed to load feedback tickets');
      
      const data = await response.json();
      setFeedbackTickets(data.tickets || []);
      
      // Count unread
      const unread = (data.tickets || []).filter((t: FeedbackTicket) => !t.isRead).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Error loading feedback tickets:', error);
    }
  }

  async function markAsRead(ticketId: string) {
    try {
      await fetch(`/api/stella/mark-feedback-read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId, userId }),
      });
      
      // Update local state
      setFeedbackTickets(prev =>
        prev.map(t => (t.id === ticketId ? { ...t, isRead: true } : t))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking feedback as read:', error);
    }
  }

  function getCategoryIcon(category: string) {
    switch (category) {
      case 'bug':
        return <Bug className="w-3.5 h-3.5 text-red-600" />;
      case 'feature':
        return <Lightbulb className="w-3.5 h-3.5 text-blue-600" />;
      case 'improvement':
        return <TrendingUp className="w-3.5 h-3.5 text-green-600" />;
      default:
        return <MessageCircle className="w-3.5 h-3.5 text-violet-600" />;
    }
  }

  function getTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Hace ${diffHours}h`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `Hace ${diffDays}d`;
  }

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 rounded-lg transition-colors"
        title="Feedback de Usuarios"
      >
        <MessageCircle className="w-5 h-5" />
        
        {/* Unread badge */}
        {unreadCount > 0 && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 rounded-full flex items-center justify-center">
            <span className="text-white text-[10px] font-bold">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </div>
        )}
        
        {/* Pulse animation for new feedback */}
        {unreadCount > 0 && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 rounded-full animate-ping opacity-75" />
        )}
      </button>

      {/* Dropdown */}
      {showDropdown && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowDropdown(false)}
          />
          
          {/* Dropdown Panel */}
          <div className="absolute top-full right-0 mt-2 w-96 bg-white dark:bg-slate-800 rounded-lg shadow-2xl border border-violet-200 dark:border-violet-700 z-50">
            {/* Header */}
            <div className="p-4 border-b border-violet-200 dark:border-violet-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-violet-600" />
                <h3 className="font-bold text-slate-800 dark:text-white">
                  Feedback de Usuarios
                </h3>
              </div>
              <button
                onClick={() => setShowDropdown(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Tickets List */}
            <div className="max-h-96 overflow-y-auto">
              {feedbackTickets.length === 0 ? (
                <div className="p-6 text-center text-slate-500 dark:text-slate-400">
                  <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No hay feedback pendiente</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-700">
                  {feedbackTickets.slice(0, 10).map((ticket) => (
                    <div
                      key={ticket.id}
                      className={`p-3 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors cursor-pointer ${
                        !ticket.isRead ? 'bg-violet-50/50 dark:bg-violet-900/10' : ''
                      }`}
                      onClick={() => {
                        markAsRead(ticket.id);
                        onOpenRoadmap();
                        setShowDropdown(false);
                      }}
                    >
                      <div className="flex items-start gap-2">
                        {/* Category icon */}
                        <div className="flex-shrink-0 mt-0.5">
                          {getCategoryIcon(ticket.category)}
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm mb-1 line-clamp-2 ${
                            !ticket.isRead
                              ? 'font-semibold text-slate-900 dark:text-white'
                              : 'font-medium text-slate-700 dark:text-slate-300'
                          }`}>
                            {ticket.title}
                          </p>
                          
                          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                            <span className="font-mono font-semibold text-violet-600 dark:text-violet-400">
                              {ticket.ticketId}
                            </span>
                            <span>•</span>
                            <span>{ticket.createdByName}</span>
                            <span>•</span>
                            <span>{getTimeAgo(ticket.createdAt)}</span>
                          </div>
                        </div>
                        
                        {/* Unread dot */}
                        {!ticket.isRead && (
                          <div className="flex-shrink-0">
                            <div className="w-2 h-2 bg-red-600 rounded-full" />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Footer */}
            {feedbackTickets.length > 0 && (
              <div className="p-3 border-t border-violet-200 dark:border-violet-700">
                <button
                  onClick={() => {
                    onOpenRoadmap();
                    setShowDropdown(false);
                  }}
                  className="w-full px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-lg hover:from-violet-700 hover:to-purple-700 transition-all flex items-center justify-center gap-2 font-semibold text-sm"
                >
                  <ExternalLink className="w-4 h-4" />
                  Ver Todos en Roadmap
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

