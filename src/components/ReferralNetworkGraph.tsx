/**
 * ReferralNetworkGraph - Visualize the invitation/referral network
 * 
 * Shows an anonymized graph of how users discover the platform through personal invitations
 * Creates natural, trusted networks based on real collaborations
 */

import React, { useEffect, useState, useRef } from 'react';
import { Users, Link2, TrendingUp, Award } from 'lucide-react';
import type { ReferralNetwork } from '../types/collaboration';

interface ReferralNetworkGraphProps {
  userId?: string; // If provided, highlights user's position
  isOpen: boolean;
  onClose: () => void;
}

interface NetworkNode {
  id: string; // Hashed ID
  invitedBy?: string; // Parent node
  directReferrals: number;
  networkSize: number;
  depth: number;
  status: 'invited' | 'active' | 'trial' | 'premium';
  x: number; // Calculated position
  y: number;
}

export default function ReferralNetworkGraph({
  userId,
  isOpen,
  onClose,
}: ReferralNetworkGraphProps) {
  const [nodes, setNodes] = useState<NetworkNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    averageDepth: 0,
    largestNetwork: 0,
  });
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    if (isOpen) {
      loadNetworkData();
    }
  }, [isOpen]);
  
  useEffect(() => {
    if (nodes.length > 0 && canvasRef.current) {
      drawNetwork();
    }
  }, [nodes]);
  
  const loadNetworkData = async () => {
    setLoading(true);
    
    try {
      const response = await fetch('/api/referral-network');
      
      if (response.ok) {
        const data = await response.json();
        setNodes(data.nodes || []);
        setStats(data.stats || {});
      }
    } catch (error) {
      console.error('Error loading network:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const drawNetwork = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Calculate positions for nodes (tree layout)
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const levelHeight = height / (Math.max(...nodes.map(n => n.depth)) + 1);
    
    // Draw connections first (so they appear behind nodes)
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 2;
    
    nodes.forEach(node => {
      if (node.invitedBy) {
        const parent = nodes.find(n => n.id === node.invitedBy);
        if (parent) {
          ctx.beginPath();
          ctx.moveTo(parent.x, parent.y);
          ctx.lineTo(node.x, node.y);
          ctx.stroke();
        }
      }
    });
    
    // Draw nodes
    nodes.forEach(node => {
      // Node color based on status
      const color = 
        node.status === 'premium' ? '#8b5cf6' :
        node.status === 'active' ? '#3b82f6' :
        node.status === 'trial' ? '#10b981' :
        '#94a3b8';
      
      // Node size based on network size
      const radius = Math.min(30, Math.max(8, 5 + Math.log(node.networkSize + 1) * 3));
      
      // Draw node
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw border
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Draw node label (first 4 chars of hash)
      ctx.fillStyle = 'white';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(node.id.substring(0, 4), node.x, node.y);
    });
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-[90vw] h-[85vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-gradient-to-r from-purple-50 to-indigo-50">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-purple-600" />
            <div>
              <h2 className="text-xl font-bold text-slate-800">Red de Referencias</h2>
              <p className="text-sm text-slate-500">Cómo los usuarios descubren Flow</p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-2 hover:bg-white rounded-lg transition-colors"
          >
            <span className="text-2xl">×</span>
          </button>
        </div>
        
        {/* Stats Bar */}
        <div className="grid grid-cols-4 gap-4 p-6 border-b border-slate-200 bg-slate-50">
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">{stats.totalUsers}</p>
            <p className="text-xs text-slate-600">Usuarios Totales</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{stats.activeUsers}</p>
            <p className="text-xs text-slate-600">Activos</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{stats.averageDepth.toFixed(1)}</p>
            <p className="text-xs text-slate-600">Profundidad Promedio</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-orange-600">{stats.largestNetwork}</p>
            <p className="text-xs text-slate-600">Red Más Grande</p>
          </div>
        </div>
        
        {/* Canvas */}
        <div className="flex-1 relative overflow-hidden">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4" />
                <p className="text-sm text-slate-600">Cargando red...</p>
              </div>
            </div>
          ) : (
            <canvas
              ref={canvasRef}
              className="w-full h-full"
            />
          )}
        </div>
        
        {/* Legend */}
        <div className="p-4 border-t border-slate-200 bg-slate-50">
          <div className="flex items-center justify-center gap-6 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-600" />
              <span className="text-slate-600">Premium</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-600" />
              <span className="text-slate-600">Activo</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-600" />
              <span className="text-slate-600">Trial (30 días)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-slate-400" />
              <span className="text-slate-600">Invitado</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

