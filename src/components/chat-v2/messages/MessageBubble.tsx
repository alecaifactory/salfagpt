/**
 * MessageBubble - Single message display
 */

import React from 'react';
import type { Message } from '../core/types';

interface MessageBubbleProps {
  message: Message;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  
  return (
    <div className={`mb-4 ${isUser ? 'text-right' : 'text-left'}`}>
      <div className={`inline-block max-w-3xl p-4 rounded-lg ${
        isUser
          ? 'bg-blue-600 text-white'
          : 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-600'
      }`}>
        <div className="whitespace-pre-wrap text-sm">
          {message.content}
        </div>
        
        {/* References */}
        {message.references && message.references.length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-600">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
              {message.references.length} referencias
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

