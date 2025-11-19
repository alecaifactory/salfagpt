/**
 * Community Groups Browser
 * 
 * Browse, search, and join community groups
 * Shows member count, industry, description
 * One-click join functionality
 * 
 * Created: 2025-11-18
 */

import { useState, useEffect } from 'react';
import { Users, Search, Check, Plus, Sparkles } from 'lucide-react';
import type { CommunityGroup } from '../types/subscriptions';
import { INDUSTRIES } from '../types/subscriptions';

interface CommunityGroupsBrowserProps {
  userId: string;
  userDomain?: string;
  onClose?: () => void;
}

export function CommunityGroupsBrowser({ userId, userDomain, onClose }: CommunityGroupsBrowserProps) {
  const [groups, setGroups] = useState<CommunityGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [industryFilter, setIndustryFilter] = useState('');
  const [joining, setJoining] = useState<string | null>(null);

  useEffect(() => {
    loadGroups();
  }, [industryFilter]);

  async function loadGroups() {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (industryFilter) params.set('industry', industryFilter);
      params.set('limit', '100');

      const response = await fetch(`/api/groups/list?${params}`);
      const data = await response.json();
      
      if (response.ok) {
        setGroups(data.groups || []);
      }
    } catch (error) {
      console.error('Error loading groups:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleJoin(groupId: string, groupDomain: string) {
    try {
      setJoining(groupId);
      
      const response = await fetch('/api/groups/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId })
      });

      if (response.ok) {
        // Update UI to show joined
        setGroups(groups.map(g => 
          g.id === groupId 
            ? { ...g, memberCount: g.memberCount + 1 }
            : g
        ));
        
        alert(`Joined ${groups.find(g => g.id === groupId)?.name}!`);
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to join group');
      }
    } catch (error) {
      console.error('Error joining group:', error);
      alert('Error joining group');
    } finally {
      setJoining(null);
    }
  }

  // Filter groups
  const filteredGroups = groups.filter(group => {
    const matchesSearch = group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         group.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const isInGroup = (group: CommunityGroup) => userDomain === group.domain;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b border-slate-200">
        <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Users className="w-6 h-6 text-blue-600" />
          Community Groups
        </h2>
        
        {/* Filters */}
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search groups..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={industryFilter}
            onChange={(e) => setIndustryFilter(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Industries</option>
            {INDUSTRIES.map(industry => (
              <option key={industry} value={industry}>{industry}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Groups Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="border border-slate-200 rounded-lg p-4 animate-pulse">
                <div className="h-6 bg-slate-200 rounded mb-2"></div>
                <div className="h-4 bg-slate-100 rounded mb-3"></div>
                <div className="h-8 bg-slate-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : filteredGroups.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600">No groups found</p>
            <p className="text-sm text-slate-500 mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredGroups.map(group => (
              <div 
                key={group.id}
                className={`border rounded-lg p-4 transition-all ${
                  isInGroup(group)
                    ? 'border-green-300 bg-green-50'
                    : 'border-slate-200 hover:border-blue-300 hover:shadow-md'
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-slate-800 flex-1">{group.name}</h3>
                  
                  {group.industry && (
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-medium ml-2">
                      {group.industry}
                    </span>
                  )}
                </div>

                {/* Description */}
                {group.description && (
                  <p className="text-sm text-slate-600 mb-3 line-clamp-2">
                    {group.description}
                  </p>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    {group.memberCount} member{group.memberCount !== 1 ? 's' : ''}
                  </span>

                  {isInGroup(group) ? (
                    <div className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white text-sm rounded-full">
                      <Check className="w-3.5 h-3.5" />
                      <span className="font-medium">Joined</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleJoin(group.id, group.domain)}
                      disabled={joining === group.id}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:bg-slate-300 transition-colors font-medium"
                    >
                      {joining === group.id ? 'Joining...' : 'Join'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-200 bg-slate-50">
        <div className="flex items-center justify-between">
          <div className="text-sm text-slate-600">
            <span className="font-medium">{filteredGroups.length}</span> groups available
          </div>
          
          <button
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <Plus className="w-4 h-4" />
            Create Group
          </button>
        </div>
      </div>
    </div>
  );
}

