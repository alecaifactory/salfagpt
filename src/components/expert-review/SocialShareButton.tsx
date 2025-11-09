// Social Share Button
// Created: 2025-11-09
// Purpose: Enable sharing improvements, achievements, and milestones

import React, { useState } from 'react';
import { Share2, Mail, MessageSquare, Users, X, Copy, Check } from 'lucide-react';

interface SocialShareButtonProps {
  userId: string;
  domainId: string;
  shareType: 'improvement' | 'achievement' | 'milestone' | 'success_story';
  content: {
    title: string;
    description: string;
    url?: string;
    badgeEarned?: string;
    improvementId?: string;
    dqsGain?: number;
  };
  onShare?: (platform: string, recipientCount: number) => void;
}

export default function SocialShareButton({
  userId,
  domainId,
  shareType,
  content,
  onShare
}: SocialShareButtonProps) {
  
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleShare = async (platform: 'email' | 'slack' | 'teams' | 'internal') => {
    try {
      // Track sharing event
      await fetch('/api/expert-review/sharing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          domainId,
          shareType,
          platform,
          recipientCount: platform === 'internal' ? 1 : 5, // Estimate
          context: content
        })
      });

      if (onShare) {
        onShare(platform, 5);
      }

      // Generate share message
      const message = generateShareMessage(shareType, content);

      if (platform === 'email') {
        window.location.href = `mailto:?subject=${encodeURIComponent(content.title)}&body=${encodeURIComponent(message)}`;
      } else if (platform === 'slack') {
        // Copy to clipboard for Slack
        await navigator.clipboard.writeText(message);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else if (platform === 'internal') {
        // Copy link for internal sharing
        const url = content.url || window.location.href;
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }

      setShowMenu(false);

    } catch (error) {
      console.error('❌ Failed to share:', error);
    }
  };

  function generateShareMessage(
    type: string,
    content: any
  ): string {
    const base = `🎉 ${content.title}\n\n${content.description}\n\n`;
    
    if (type === 'achievement' && content.badgeEarned) {
      return base + `Badge ganado: ${content.badgeEarned} 🏆`;
    }
    
    if (type === 'improvement' && content.improvementId) {
      return base + `Esta mejora impactará múltiples respuestas similares.`;
    }
    
    if (type === 'milestone' && content.dqsGain) {
      return base + `DQS aumentó en +${content.dqsGain.toFixed(1)} puntos 📈`;
    }
    
    return base + (content.url ? `\n${content.url}` : '');
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-200 transition-colors"
        title="Compartir"
      >
        <Share2 className="w-4 h-4" />
        <span className="hidden sm:inline">Compartir</span>
      </button>

      {showMenu && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowMenu(false)}
          />

          {/* Menu */}
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-slate-200 z-50 animate-scale-in">
            <div className="p-2 space-y-1">
              <button
                onClick={() => handleShare('email')}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
              >
                <Mail className="w-4 h-4 text-blue-600" />
                <span>Email</span>
              </button>

              <button
                onClick={() => handleShare('slack')}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
              >
                <MessageSquare className="w-4 h-4 text-purple-600" />
                <span>Slack (copiar)</span>
                {copied && <Check className="w-4 h-4 text-green-600 ml-auto" />}
              </button>

              <button
                onClick={() => handleShare('teams')}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
              >
                <Users className="w-4 h-4 text-indigo-600" />
                <span>Teams</span>
              </button>

              <div className="border-t border-slate-200 my-1" />

              <button
                onClick={() => handleShare('internal')}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
              >
                <Copy className="w-4 h-4 text-slate-600" />
                <span>Copiar link</span>
                {copied && <Check className="w-4 h-4 text-green-600 ml-auto" />}
              </button>
            </div>
          </div>
        </>
      )}

      <style jsx>{`
        @keyframes scale-in {
          from {
            transform: scale(0.95);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        .animate-scale-in {
          animation: scale-in 0.15s ease-out;
        }
      `}</style>
    </div>
  );
}

