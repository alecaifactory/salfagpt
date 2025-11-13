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

import React, { useState, useEffect, useMemo } from 'react';
import { MessageCircle, Bug, Lightbulb, TrendingUp, ExternalLink, X, Star, Filter, Building2 } from 'lucide-react';

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
  // Extended fields for filtering
  priority?: string;
  userStars?: number;
  domain?: string;
  organizationId?: string;
  organizationName?: string;
}

interface FeedbackNotificationBellProps {
  userId: string;
  userRole: string;
  onOpenRoadmap: (ticketId?: string) => void;
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
  
  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [selectedOrganization, setSelectedOrganization] = useState<string | null>(null);
  const [minStars, setMinStars] = useState<number>(0);

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
      
      // Don't throw on non-ok response, just handle gracefully
      if (!response.ok) {
        console.warn('⚠️ Feedback tickets endpoint returned:', response.status);
        setFeedbackTickets([]);
        setUnreadCount(0);
        return;
      }
      
      const data = await response.json();
      
      // Handle warning from API (graceful degradation)
      if (data.warning) {
        console.warn('⚠️ API warning:', data.warning);
      }
      
      setFeedbackTickets(data.tickets || []);
      
      // Count unread
      const unread = (data.tickets || []).filter((t: FeedbackTicket) => !t.isRead).length;
      setUnreadCount(unread);
    } catch (error) {
      // Only log in development to reduce console noise
      if (import.meta.env.DEV) {
        console.warn('⚠️ Could not load feedback tickets (non-critical):', error);
      }
      // Set to empty state - component still works without data
      setFeedbackTickets([]);
      setUnreadCount(0);
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
  
  // Get unique values for filters
  const uniqueDomains = useMemo(() => {
    const domains = new Set(feedbackTickets.map(t => t.domain).filter(Boolean));
    return Array.from(domains).sort();
  }, [feedbackTickets]);
  
  const uniqueOrganizations = useMemo(() => {
    const orgs = new Set(feedbackTickets.map(t => t.organizationName).filter(Boolean));
    return Array.from(orgs).sort();
  }, [feedbackTickets]);
  
  // Apply filters
  const filteredTickets = useMemo(() => {
    return feedbackTickets.filter(ticket => {
      // Category filter
      if (selectedCategory && ticket.category !== selectedCategory) return false;
      
      // Domain filter
      if (selectedDomain && ticket.domain !== selectedDomain) return false;
      
      // Organization filter (SuperAdmin only)
      if (selectedOrganization && ticket.organizationName !== selectedOrganization) return false;
      
      // Stars filter
      if (minStars > 0 && (!ticket.userStars || ticket.userStars < minStars)) return false;
      
      return true;
    });
  }, [feedbackTickets, selectedCategory, selectedDomain, selectedOrganization, minStars]);

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
          
          {/* Dropdown Panel - Enhanced with filters */}
          <div className="fixed top-16 right-4 w-[40vw] h-[70vh] bg-white dark:bg-slate-800 rounded-xl shadow-2xl border-2 border-violet-200 dark:border-violet-700 z-50 flex flex-col">
            {/* Header */}
            <div className="flex-shrink-0 p-4 border-b border-violet-200 dark:border-violet-700">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-violet-600" />
                  <h3 className="font-bold text-slate-800 dark:text-white">
                    Feedback de Usuarios
                  </h3>
                  <span className="px-2 py-0.5 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded-full text-xs font-semibold">
                    {filteredTickets.length} de {feedbackTickets.length}
                  </span>
                </div>
                <button
                  onClick={() => setShowDropdown(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Filters */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 mb-2">
                  <Filter className="w-3.5 h-3.5" />
                  <span className="font-medium">Filtros:</span>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  {/* Category Filter */}
                  <div>
                    <label className="block text-[10px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Tipo
                    </label>
                    <select
                      value={selectedCategory || ''}
                      onChange={(e) => setSelectedCategory(e.target.value || null)}
                      className="w-full px-2 py-1.5 text-xs border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                    >
                      <option value="">Todos</option>
                      <option value="bug">🐛 Bug</option>
                      <option value="feature">💡 Feature</option>
                      <option value="improvement">📈 Mejora</option>
                    </select>
                  </div>
                  
                  {/* Stars Filter */}
                  <div>
                    <label className="block text-[10px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Estrellas mín.
                    </label>
                    <select
                      value={minStars}
                      onChange={(e) => setMinStars(Number(e.target.value))}
                      className="w-full px-2 py-1.5 text-xs border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                    >
                      <option value="0">Todas</option>
                      <option value="1">⭐ 1+</option>
                      <option value="2">⭐ 2+</option>
                      <option value="3">⭐ 3+</option>
                      <option value="4">⭐ 4+</option>
                      <option value="5">⭐ 5</option>
                    </select>
                  </div>
                  
                  {/* Domain Filter */}
                  {uniqueDomains.length > 1 && (
                    <div>
                      <label className="block text-[10px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Dominio
                      </label>
                      <select
                        value={selectedDomain || ''}
                        onChange={(e) => setSelectedDomain(e.target.value || null)}
                        className="w-full px-2 py-1.5 text-xs border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                      >
                        <option value="">Todos</option>
                        {uniqueDomains.map(domain => (
                          <option key={domain} value={domain}>{domain}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  
                  {/* Organization Filter (SuperAdmin only) */}
                  {userRole === 'superadmin' && uniqueOrganizations.length > 1 && (
                    <div>
                      <label className="block text-[10px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Organización
                      </label>
                      <select
                        value={selectedOrganization || ''}
                        onChange={(e) => setSelectedOrganization(e.target.value || null)}
                        className="w-full px-2 py-1.5 text-xs border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                      >
                        <option value="">Todas</option>
                        {uniqueOrganizations.map(org => (
                          <option key={org} value={org}>{org}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
                
                {/* Active filters indicator */}
                {(selectedCategory || selectedDomain || selectedOrganization || minStars > 0) && (
                  <div className="flex items-center gap-2 flex-wrap">
                    {selectedCategory && (
                      <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-[10px] font-medium flex items-center gap-1">
                        {selectedCategory}
                        <X className="w-3 h-3 cursor-pointer hover:text-blue-900" onClick={() => setSelectedCategory(null)} />
                      </span>
                    )}
                    {minStars > 0 && (
                      <span className="px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-full text-[10px] font-medium flex items-center gap-1">
                        ⭐ {minStars}+
                        <X className="w-3 h-3 cursor-pointer hover:text-yellow-900" onClick={() => setMinStars(0)} />
                      </span>
                    )}
                    {selectedDomain && (
                      <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-[10px] font-medium flex items-center gap-1">
                        {selectedDomain}
                        <X className="w-3 h-3 cursor-pointer hover:text-green-900" onClick={() => setSelectedDomain(null)} />
                      </span>
                    )}
                    {selectedOrganization && (
                      <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-[10px] font-medium flex items-center gap-1">
                        {selectedOrganization}
                        <X className="w-3 h-3 cursor-pointer hover:text-purple-900" onClick={() => setSelectedOrganization(null)} />
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            {/* Tickets List */}
            <div className="flex-1 overflow-y-auto">
              {filteredTickets.length === 0 ? (
                <div className="p-6 text-center text-slate-500 dark:text-slate-400">
                  <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">
                    {feedbackTickets.length === 0 
                      ? 'No hay feedback pendiente'
                      : 'No hay tickets que coincidan con los filtros'}
                  </p>
                  {feedbackTickets.length > 0 && (
                    <button
                      onClick={() => {
                        setSelectedCategory(null);
                        setSelectedDomain(null);
                        setSelectedOrganization(null);
                        setMinStars(0);
                      }}
                      className="mt-3 px-3 py-1.5 text-xs text-violet-600 hover:text-violet-700 underline"
                    >
                      Limpiar filtros
                    </button>
                  )}
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-700">
                  {filteredTickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      className={`p-3 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors cursor-pointer ${
                        !ticket.isRead ? 'bg-violet-50/50 dark:bg-violet-900/10' : ''
                      }`}
                      onClick={() => {
                        markAsRead(ticket.id);
                        onOpenRoadmap(ticket.id); // Pass ticket ID to open specific ticket
                        setShowDropdown(false);
                      }}
                    >
                      <div className="flex items-start gap-3">
                        {/* Category icon */}
                        <div className="flex-shrink-0 mt-0.5">
                          {getCategoryIcon(ticket.category)}
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm mb-1.5 line-clamp-2 ${
                            !ticket.isRead
                              ? 'font-semibold text-slate-900 dark:text-white'
                              : 'font-medium text-slate-700 dark:text-slate-300'
                          }`}>
                            {ticket.title}
                          </p>
                          
                          {/* Metadata row 1: Ticket ID, user, time */}
                          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
                            <span className="font-mono font-semibold text-violet-600 dark:text-violet-400">
                              {ticket.ticketId}
                            </span>
                            <span>•</span>
                            <span>{ticket.createdByName}</span>
                            <span>•</span>
                            <span>{getTimeAgo(ticket.createdAt)}</span>
                          </div>
                          
                          {/* Metadata row 2: Stars, domain, org */}
                          <div className="flex items-center gap-2 flex-wrap">
                            {/* Stars rating */}
                            {ticket.userStars && ticket.userStars > 0 && (
                              <div className="flex items-center gap-0.5 px-1.5 py-0.5 bg-yellow-50 dark:bg-yellow-900/20 rounded">
                                {Array.from({ length: ticket.userStars }).map((_, i) => (
                                  <Star key={i} className="w-2.5 h-2.5 fill-yellow-500 text-yellow-500" />
                                ))}
                              </div>
                            )}
                            
                            {/* Domain */}
                            {ticket.domain && (
                              <span className="px-1.5 py-0.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded text-[10px] font-medium flex items-center gap-1">
                                <Building2 className="w-2.5 h-2.5" />
                                {ticket.domain}
                              </span>
                            )}
                            
                            {/* Organization (SuperAdmin only) */}
                            {userRole === 'superadmin' && ticket.organizationName && (
                              <span className="px-1.5 py-0.5 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded text-[10px] font-medium">
                                {ticket.organizationName}
                              </span>
                            )}
                            
                            {/* Priority badge */}
                            {ticket.priority && (
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                ticket.priority === 'critical' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' :
                                ticket.priority === 'high' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300' :
                                ticket.priority === 'medium' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' :
                                'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                              }`}>
                                P{ticket.priority === 'critical' ? '0' : ticket.priority === 'high' ? '1' : ticket.priority === 'medium' ? '2' : '3'}
                              </span>
                            )}
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
            <div className="flex-shrink-0 p-3 border-t border-violet-200 dark:border-violet-700 bg-slate-50 dark:bg-slate-900/50">
              <div className="flex items-center gap-2">
                {/* Stats */}
                <div className="flex-1 text-xs text-slate-600 dark:text-slate-400">
                  <span className="font-semibold">{filteredTickets.length}</span> tickets
                  {filteredTickets.length !== feedbackTickets.length && (
                    <span className="text-slate-500"> (de {feedbackTickets.length})</span>
                  )}
                  {unreadCount > 0 && (
                    <span className="ml-2 text-red-600 dark:text-red-400 font-semibold">
                      • {unreadCount} sin leer
                    </span>
                  )}
                </div>
                
                {/* View All button */}
                <button
                  onClick={() => {
                    onOpenRoadmap();
                    setShowDropdown(false);
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-lg hover:from-violet-700 hover:to-purple-700 transition-all flex items-center gap-2 font-semibold text-sm"
                >
                  <ExternalLink className="w-4 h-4" />
                  Ver en Roadmap
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

