/**
 * KanbanBacklogBoard - Drag & drop backlog management
 * 
 * Features:
 * - 4 lanes: Backlog, Next, Now, Done
 * - Drag & drop between lanes
 * - Priority visualization
 * - CSAT/NPS impact scores
 * - Effort estimates (T-shirt sizing)
 * - Viral indicators (upvotes, shares)
 * - OKR alignment badges
 * - Quick actions per card
 */

import React, { useState, useEffect } from 'react';
import {
  GripVertical,
  TrendingUp,
  Users,
  Clock,
  Target,
  CheckCircle,
  AlertCircle,
  Sparkles,
  ThumbsUp,
  Share2,
  ExternalLink,
  MoreVertical
} from 'lucide-react';
import type { BacklogItem } from '../types/feedback';

interface KanbanBacklogBoardProps {
  companyId: string;
}

type Lane = 'backlog' | 'next' | 'now' | 'done';

const LANES: Array<{ id: Lane; title: string; color: string }> = [
  { id: 'backlog', title: 'Backlog', color: 'slate' },
  { id: 'next', title: 'Next', color: 'blue' },
  { id: 'now', title: 'Now', color: 'purple' },
  { id: 'done', title: 'Done', color: 'green' },
];

export default function KanbanBacklogBoard({ companyId }: KanbanBacklogBoardProps) {
  const [items, setItems] = useState<BacklogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<BacklogItem | null>(null);
  
  // Load backlog items
  useEffect(() => {
    loadBacklogItems();
  }, [companyId]);
  
  async function loadBacklogItems() {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/backlog/items?companyId=${companyId}`);
      
      if (!response.ok) throw new Error('Failed to load backlog');
      
      const data = await response.json();
      setItems(data);
      
    } catch (error) {
      console.error('Failed to load backlog:', error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }
  
  // Drag & drop handlers
  function handleDragStart(itemId: string) {
    setDraggedItem(itemId);
  }
  
  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
  }
  
  async function handleDrop(targetLane: Lane) {
    if (!draggedItem) return;
    
    const item = items.find(i => i.id === draggedItem);
    if (!item || item.lane === targetLane) {
      setDraggedItem(null);
      return;
    }
    
    try {
      // Optimistic update
      setItems(prev => prev.map(i => 
        i.id === draggedItem ? { ...i, lane: targetLane } : i
      ));
      
      // Update in Firestore
      await fetch(`/api/backlog/items/${draggedItem}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lane: targetLane }),
      });
      
      console.log('✅ Moved to', targetLane);
      
    } catch (error) {
      console.error('Failed to move item:', error);
      // Revert on error
      loadBacklogItems();
    } finally {
      setDraggedItem(null);
    }
  }
  
  // Get items for lane
  function getItemsForLane(lane: Lane): BacklogItem[] {
    return items
      .filter(item => item.lane === lane)
      .sort((a, b) => a.position - b.position);
  }
  
  // Get priority color
  function getPriorityColor(priority: string): string {
    const colors: Record<string, string> = {
      'critical': 'red',
      'high': 'orange',
      'medium': 'yellow',
      'low': 'slate',
    };
    return colors[priority] || 'slate';
  }
  
  // Get effort badge
  function getEffortBadge(effort: string): { label: string; color: string } {
    const badges: Record<string, { label: string; color: string }> = {
      'xs': { label: 'XS', color: 'green' },
      's': { label: 'S', color: 'blue' },
      'm': { label: 'M', color: 'yellow' },
      'l': { label: 'L', color: 'orange' },
      'xl': { label: 'XL', color: 'red' },
    };
    return badges[effort] || { label: effort.toUpperCase(), color: 'slate' };
  }
  
  return (
    <div className="h-full flex flex-col bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Target className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Backlog & Roadmap</h1>
              <p className="text-sm text-slate-600">
                {items.length} items total • {getItemsForLane('now').length} in progress
              </p>
            </div>
          </div>
          
          <button
            onClick={() => {/* Create new item */}}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            New Item
          </button>
        </div>
      </div>
      
      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto p-6">
        <div className="flex gap-4 h-full min-w-max">
          {LANES.map((lane) => {
            const laneItems = getItemsForLane(lane.id);
            
            return (
              <div
                key={lane.id}
                className="flex-1 min-w-[320px] max-w-[400px] flex flex-col"
              >
                {/* Lane Header */}
                <div className={`bg-${lane.color}-50 border border-${lane.color}-200 rounded-t-lg p-4`}>
                  <div className="flex items-center justify-between">
                    <h2 className={`text-lg font-bold text-${lane.color}-800`}>
                      {lane.title}
                    </h2>
                    <span className={`px-2 py-1 bg-${lane.color}-200 text-${lane.color}-800 rounded-full text-sm font-semibold`}>
                      {laneItems.length}
                    </span>
                  </div>
                </div>
                
                {/* Lane Content */}
                <div
                  className="flex-1 bg-white border-l border-r border-b border-slate-200 rounded-b-lg p-3 space-y-3 overflow-y-auto"
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(lane.id)}
                >
                  {loading ? (
                    <div className="flex items-center justify-center h-32">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                    </div>
                  ) : laneItems.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">
                      <p className="text-sm">No items in {lane.title}</p>
                    </div>
                  ) : (
                    laneItems.map((item) => (
                      <div
                        key={item.id}
                        draggable
                        onDragStart={() => handleDragStart(item.id)}
                        onClick={() => setSelectedItem(item)}
                        className={`bg-white border-2 rounded-lg p-4 cursor-move hover:shadow-lg transition-all ${
                          draggedItem === item.id 
                            ? 'opacity-50 border-blue-400' 
                            : 'border-slate-200 hover:border-blue-300'
                        }`}
                      >
                        {/* Header */}
                        <div className="flex items-start gap-2 mb-3">
                          <GripVertical className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-slate-800 text-sm line-clamp-2">
                              {item.title}
                            </h3>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              // Show menu
                            }}
                            className="text-slate-400 hover:text-slate-600"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
                        
                        {/* User Story */}
                        {item.userStory && (
                          <p className="text-xs text-slate-600 mb-3 line-clamp-2 italic">
                            {item.userStory}
                          </p>
                        )}
                        
                        {/* Badges */}
                        <div className="flex items-center gap-2 flex-wrap mb-3">
                          {/* Priority */}
                          <span className={`px-2 py-0.5 bg-${getPriorityColor(item.priority)}-100 text-${getPriorityColor(item.priority)}-700 rounded text-xs font-semibold`}>
                            {item.priority}
                          </span>
                          
                          {/* Effort */}
                          {(() => {
                            const effort = getEffortBadge(item.estimatedEffort);
                            return (
                              <span className={`px-2 py-0.5 bg-${effort.color}-100 text-${effort.color}-700 rounded text-xs font-semibold`}>
                                {effort.label}
                              </span>
                            );
                          })()}
                          
                          {/* Type */}
                          <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs font-semibold">
                            {item.type}
                          </span>
                        </div>
                        
                        {/* Impact Metrics */}
                        <div className="space-y-1.5 mb-3">
                          {/* CSAT Impact */}
                          {item.estimatedCSATImpact > 0 && (
                            <div className="flex items-center gap-2">
                              <TrendingUp className="w-3.5 h-3.5 text-purple-600" />
                              <span className="text-xs text-slate-600">CSAT:</span>
                              <span className="text-xs font-semibold text-purple-700">
                                +{item.estimatedCSATImpact}/5
                              </span>
                            </div>
                          )}
                          
                          {/* NPS Impact */}
                          {item.estimatedNPSImpact !== 0 && (
                            <div className="flex items-center gap-2">
                              <Users className="w-3.5 h-3.5 text-indigo-600" />
                              <span className="text-xs text-slate-600">NPS:</span>
                              <span className="text-xs font-semibold text-indigo-700">
                                {item.estimatedNPSImpact > 0 ? '+' : ''}{item.estimatedNPSImpact}
                              </span>
                            </div>
                          )}
                          
                          {/* Affected Users */}
                          {item.affectedUsers > 0 && (
                            <div className="flex items-center gap-2">
                              <Users className="w-3.5 h-3.5 text-blue-600" />
                              <span className="text-xs text-slate-600">Users:</span>
                              <span className="text-xs font-semibold text-blue-700">
                                ~{item.affectedUsers}
                              </span>
                            </div>
                          )}
                          
                          {/* OKR Alignment */}
                          {item.okrImpactScore > 0 && (
                            <div className="flex items-center gap-2">
                              <Target className="w-3.5 h-3.5 text-green-600" />
                              <span className="text-xs text-slate-600">OKR:</span>
                              <span className="text-xs font-semibold text-green-700">
                                {item.okrImpactScore}/10
                              </span>
                            </div>
                          )}
                        </div>
                        
                        {/* Viral Indicators */}
                        {(item.feedbackSessionIds.length > 0) && (
                          <div className="flex items-center gap-3 text-xs border-t border-slate-200 pt-3">
                            {/* Get ticket info for viral metrics */}
                            <div className="flex items-center gap-1 text-slate-600">
                              <ThumbsUp className="w-3.5 h-3.5" />
                              <span className="font-medium">
                                {/* Would show upvotes from linked tickets */}
                                0
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-1 text-slate-600">
                              <Share2 className="w-3.5 h-3.5" />
                              <span className="font-medium">
                                {/* Would show shares from linked tickets */}
                                0
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-1 text-purple-600">
                              <Sparkles className="w-3.5 h-3.5" />
                              <span className="font-medium">
                                {item.feedbackSessionIds.length} feedback
                              </span>
                            </div>
                          </div>
                        )}
                        
                        {/* Assignment & Timeline */}
                        <div className="flex items-center justify-between text-xs text-slate-500 mt-3 pt-3 border-t border-slate-200">
                          {item.assignedTo ? (
                            <div className="flex items-center gap-1">
                              <div className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px] font-bold">
                                {item.assignedTo.substring(0, 2).toUpperCase()}
                              </div>
                              <span>Assigned</span>
                            </div>
                          ) : (
                            <span className="text-slate-400">Unassigned</span>
                          )}
                          
                          {item.targetReleaseDate && (
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>{new Date(item.targetReleaseDate).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-start justify-between p-6 border-b border-slate-200">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-1 bg-${getPriorityColor(selectedItem.priority)}-100 text-${getPriorityColor(selectedItem.priority)}-700 rounded text-xs font-semibold`}>
                    {selectedItem.priority}
                  </span>
                  <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs font-semibold">
                    {selectedItem.type}
                  </span>
                  {(() => {
                    const effort = getEffortBadge(selectedItem.estimatedEffort);
                    return (
                      <span className={`px-2 py-1 bg-${effort.color}-100 text-${effort.color}-700 rounded text-xs font-semibold`}>
                        {effort.label}
                      </span>
                    );
                  })()}
                </div>
                
                <h2 className="text-2xl font-bold text-slate-800 mb-2">
                  {selectedItem.title}
                </h2>
                
                {selectedItem.userStory && (
                  <p className="text-sm text-slate-600 italic">
                    {selectedItem.userStory}
                  </p>
                )}
              </div>
              
              <button
                onClick={() => setSelectedItem(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <ExternalLink className="w-6 h-6" />
              </button>
            </div>
            
            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Description */}
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-2">Description</h3>
                <p className="text-sm text-slate-700">{selectedItem.description}</p>
              </div>
              
              {/* Acceptance Criteria */}
              {selectedItem.acceptanceCriteria.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-2">Acceptance Criteria</h3>
                  <ul className="space-y-1">
                    {selectedItem.acceptanceCriteria.map((criteria, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-slate-700">{criteria}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Impact Analysis */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                    <span className="text-sm font-medium text-purple-700">CSAT Impact</span>
                  </div>
                  <p className="text-3xl font-bold text-purple-800">
                    +{selectedItem.estimatedCSATImpact}/5
                  </p>
                </div>
                
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-5 h-5 text-indigo-600" />
                    <span className="text-sm font-medium text-indigo-700">NPS Impact</span>
                  </div>
                  <p className="text-3xl font-bold text-indigo-800">
                    {selectedItem.estimatedNPSImpact > 0 ? '+' : ''}{selectedItem.estimatedNPSImpact}
                  </p>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-medium text-blue-700">Users Affected</span>
                  </div>
                  <p className="text-3xl font-bold text-blue-800">
                    ~{selectedItem.affectedUsers}
                  </p>
                </div>
              </div>
              
              {/* OKR Alignment */}
              {selectedItem.alignedOKRs.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-2">OKR Alignment</h3>
                  <div className="space-y-2">
                    {selectedItem.alignedOKRs.map((okrId) => (
                      <div key={okrId} className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded">
                        <Target className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-green-800">{okrId}</span>
                        <span className="ml-auto text-xs font-semibold text-green-700">
                          Impact: {selectedItem.okrImpactScore}/10
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Related Feedback */}
              {selectedItem.feedbackSessionIds.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-2">
                    Related Feedback ({selectedItem.feedbackSessionIds.length})
                  </h3>
                  <div className="space-y-2">
                    {selectedItem.feedbackSessionIds.slice(0, 3).map((sessionId) => (
                      <div key={sessionId} className="flex items-center justify-between p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                        <span className="text-blue-800 font-mono text-xs">{sessionId.substring(0, 12)}...</span>
                        <button className="text-blue-600 hover:text-blue-800 text-xs font-medium">
                          View →
                        </button>
                      </div>
                    ))}
                    {selectedItem.feedbackSessionIds.length > 3 && (
                      <p className="text-xs text-slate-500 text-center">
                        +{selectedItem.feedbackSessionIds.length - 3} more
                      </p>
                    )}
                  </div>
                </div>
              )}
              
              {/* Development Info */}
              {(item.worktreeId || item.branchName || item.prUrl) && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-slate-700 mb-3">Development</h3>
                  <div className="space-y-2 text-sm">
                    {item.branchName && (
                      <div className="flex items-center gap-2">
                        <span className="text-slate-600">Branch:</span>
                        <code className="px-2 py-0.5 bg-slate-200 rounded font-mono text-xs">
                          {item.branchName}
                        </code>
                      </div>
                    )}
                    {item.prUrl && (
                      <div className="flex items-center gap-2">
                        <span className="text-slate-600">PR:</span>
                        <a 
                          href={item.prUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-xs"
                        >
                          View Pull Request →
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={() => setSelectedItem(null)}
                className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
              >
                Close
              </button>
              
              <div className="flex items-center gap-2">
                {item.lane !== 'done' && (
                  <button
                    onClick={() => {/* Assign to worktree */}}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold flex items-center gap-2"
                  >
                    <Target className="w-4 h-4" />
                    Assign to Worktree
                  </button>
                )}
                
                <button
                  onClick={() => {/* Edit item */}}
                  className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 font-semibold"
                >
                  Edit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

