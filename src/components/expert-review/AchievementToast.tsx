// Achievement Toast Component
// Created: 2025-11-09
// Purpose: Simple toast for quick achievements and milestones

import React, { useEffect, useState } from 'react';
import { CheckCircle, TrendingUp, Award, Users, Zap } from 'lucide-react';

interface AchievementToastProps {
  type: 'milestone' | 'progress' | 'rank' | 'social' | 'speed';
  title: string;
  message: string;
  icon?: React.ReactNode;
  onClose: () => void;
  autoCloseMs?: number;
}

export default function AchievementToast({
  type,
  title,
  message,
  icon,
  onClose,
  autoCloseMs = 4000
}: AchievementToastProps) {
  
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setTimeout(() => setIsVisible(true), 100);
    
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, autoCloseMs);

    return () => clearTimeout(timer);
  }, [autoCloseMs, onClose]);

  const typeConfig = {
    milestone: {
      icon: icon || <CheckCircle className="w-5 h-5" />,
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-900',
      iconBg: 'bg-green-500',
      iconColor: 'text-white'
    },
    progress: {
      icon: icon || <TrendingUp className="w-5 h-5" />,
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-900',
      iconBg: 'bg-blue-500',
      iconColor: 'text-white'
    },
    rank: {
      icon: icon || <Award className="w-5 h-5" />,
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      text: 'text-purple-900',
      iconBg: 'bg-purple-500',
      iconColor: 'text-white'
    },
    social: {
      icon: icon || <Users className="w-5 h-5" />,
      bg: 'bg-pink-50',
      border: 'border-pink-200',
      text: 'text-pink-900',
      iconBg: 'bg-pink-500',
      iconColor: 'text-white'
    },
    speed: {
      icon: icon || <Zap className="w-5 h-5" />,
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-900',
      iconBg: 'bg-yellow-500',
      iconColor: 'text-white'
    }
  };

  const config = typeConfig[type];

  return (
    <div
      className={`fixed bottom-4 right-4 z-40 transition-all duration-300 transform ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      }`}
    >
      <div className={`
        ${config.bg} ${config.border} border rounded-lg shadow-lg p-4
        flex items-start gap-3 max-w-sm
      `}>
        <div className={`
          ${config.iconBg} ${config.iconColor}
          w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
        `}>
          {config.icon}
        </div>

        <div className="flex-1 min-w-0">
          <h4 className={`text-sm font-bold ${config.text} mb-1`}>
            {title}
          </h4>
          <p className="text-xs text-slate-600">
            {message}
          </p>
        </div>
      </div>
    </div>
  );
}

