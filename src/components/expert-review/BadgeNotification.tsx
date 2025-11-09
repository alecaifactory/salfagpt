// Badge Notification Component
// Created: 2025-11-09
// Purpose: Animated celebration when user earns a badge

import React, { useEffect, useState } from 'react';
import { X, Sparkles } from 'lucide-react';
import type { Badge } from '../../types/analytics';

interface BadgeNotificationProps {
  badge: Badge;
  onClose: () => void;
  autoCloseMs?: number;
}

export default function BadgeNotification({ 
  badge, 
  onClose,
  autoCloseMs = 8000 
}: BadgeNotificationProps) {
  
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Slide in animation
    setTimeout(() => setIsVisible(true), 100);

    // Auto-close
    const timer = setTimeout(() => {
      handleClose();
    }, autoCloseMs);

    return () => clearTimeout(timer);
  }, [autoCloseMs]);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const rarityColors = {
    common: 'from-slate-500 to-slate-600',
    uncommon: 'from-green-500 to-green-600',
    rare: 'from-blue-500 to-blue-600',
    epic: 'from-purple-500 to-purple-600',
    legendary: 'from-amber-500 to-amber-600'
  };

  const rarityGlow = {
    common: 'shadow-slate-500/50',
    uncommon: 'shadow-green-500/50',
    rare: 'shadow-blue-500/50',
    epic: 'shadow-purple-500/50',
    legendary: 'shadow-amber-500/50'
  };

  const rarityBorder = {
    common: 'border-slate-300',
    uncommon: 'border-green-300',
    rare: 'border-blue-300',
    epic: 'border-purple-300',
    legendary: 'border-amber-300'
  };

  return (
    <div
      className={`fixed top-4 right-4 z-50 transition-all duration-300 transform ${
        isVisible && !isLeaving ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      <div className={`
        bg-white rounded-xl shadow-2xl ${rarityGlow[badge.rarity]} 
        border-2 ${rarityBorder[badge.rarity]}
        p-6 max-w-md
        animate-bounce-gentle
      `}>
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`
              w-16 h-16 rounded-full bg-gradient-to-br ${rarityColors[badge.rarity]}
              flex items-center justify-center text-4xl
              shadow-lg ${rarityGlow[badge.rarity]}
              animate-pulse-slow
            `}>
              {badge.icon}
            </div>
            
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className={`w-4 h-4 text-${badge.color}-500`} />
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {badge.rarity} Badge
                </span>
              </div>
              <h3 className="text-xl font-bold text-slate-900">
                {badge.name}
              </h3>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Description */}
        <p className="text-sm text-slate-600 mb-4">
          {badge.description}
        </p>

        {/* Earned Date */}
        {badge.earnedAt && (
          <p className="text-xs text-slate-500">
            Ganado: {new Date(badge.earnedAt).toLocaleDateString('es-CL', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        )}

        {/* Celebration particles (CSS animation) */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-amber-400 rounded-full animate-confetti"
              style={{
                left: `${20 + i * 15}%`,
                animationDelay: `${i * 0.1}s`
              }}
            />
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes bounce-gentle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        @keyframes pulse-slow {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }

        @keyframes confetti {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100px) rotate(360deg);
            opacity: 0;
          }
        }

        .animate-bounce-gentle {
          animation: bounce-gentle 2s ease-in-out;
        }

        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }

        .animate-confetti {
          animation: confetti 1.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

