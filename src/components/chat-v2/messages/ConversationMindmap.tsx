/**
 * ConversationMindmap - Mermaid mindmap visualization
 * Shows conversation structure, context sources, and references
 * 
 * SuperAdmin-only feature
 */

import React, { useEffect, useRef } from 'react';
import mermaid from 'mermaid';
import type { Message, Reference } from '../core/types';

interface ConversationMindmapProps {
  messages: Message[];
  agentTitle?: string;
  contextSources?: Array<{
    id: string;
    name: string;
    type: string;
    enabled: boolean;
  }>;
}

export default function ConversationMindmap({ 
  messages, 
  agentTitle = 'Conversation',
  contextSources = []
}: ConversationMindmapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Initialize mermaid
  useEffect(() => {
    mermaid.initialize({
      startOnLoad: true,
      theme: 'default',
      securityLevel: 'loose',
      mindmap: {
        padding: 20,
        useMaxWidth: true,
      },
    });
  }, []);
  
  // Generate mindmap diagram
  useEffect(() => {
    if (!containerRef.current) return;
    
    const diagram = generateMindmapDiagram(messages, agentTitle, contextSources);
    
    // Clear previous diagram
    containerRef.current.innerHTML = '';
    
    // Render new diagram
    const id = `mindmap-${Date.now()}`;
    const div = document.createElement('div');
    div.className = 'mermaid';
    div.innerHTML = diagram;
    containerRef.current.appendChild(div);
    
    // Render mermaid
    mermaid.contentLoaded();
  }, [messages, agentTitle, contextSources]);
  
  if (messages.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-slate-400">
        <div className="text-center">
          <p className="text-lg font-medium mb-2">No hay conversación aún</p>
          <p className="text-sm">Envía un mensaje para ver el mapa mental</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="h-full overflow-auto p-6 bg-white dark:bg-slate-800">
      <div 
        ref={containerRef} 
        className="flex items-center justify-center min-h-full"
      />
    </div>
  );
}

/**
 * Generate mermaid mindmap syntax from conversation data
 */
function generateMindmapDiagram(
  messages: Message[], 
  agentTitle: string,
  contextSources: Array<{ id: string; name: string; type: string; enabled: boolean }>
): string {
  const lines: string[] = ['mindmap'];
  
  // Root node - Agent name
  lines.push(`  root((${sanitizeText(agentTitle)}))`);
  
  // Context Sources branch
  if (contextSources.length > 0) {
    const activeSources = contextSources.filter(s => s.enabled);
    lines.push(`    Context`);
    
    if (activeSources.length > 0) {
      activeSources.forEach(source => {
        lines.push(`      ${sanitizeText(source.name)}`);
        lines.push(`        [${source.type}]`);
      });
    } else {
      lines.push(`      (Sin fuentes activas)`);
    }
  }
  
  // Conversation flow branch
  lines.push(`    Conversación`);
  
  // Group messages to avoid overcrowding (max 10 message pairs)
  const messagePairs = groupMessagesIntoPairs(messages);
  const displayPairs = messagePairs.slice(-5); // Last 5 interactions
  
  displayPairs.forEach((pair, idx) => {
    const turnNum = messagePairs.length - displayPairs.length + idx + 1;
    
    // User message
    const userPreview = truncateText(pair.userMessage?.content || '', 30);
    lines.push(`      Turno ${turnNum}`);
    lines.push(`        Usuario: "${userPreview}"`);
    
    // Assistant message with references
    if (pair.assistantMessage) {
      const assistantPreview = truncateText(pair.assistantMessage.content, 30);
      lines.push(`        AI: "${assistantPreview}"`);
      
      // Add references if any
      if (pair.assistantMessage.references && pair.assistantMessage.references.length > 0) {
        lines.push(`          Referencias`);
        
        // Group references by source
        const refsBySource = groupReferencesBySource(pair.assistantMessage.references);
        
        refsBySource.forEach(({ sourceName, count, similarity }) => {
          const simDisplay = similarity ? ` (${(similarity * 100).toFixed(0)}%)` : '';
          lines.push(`            ${sanitizeText(sourceName)} [${count}${simDisplay}]`);
        });
      }
    }
  });
  
  // Add summary if conversation is long
  if (messagePairs.length > 5) {
    lines.push(`      ...(${messagePairs.length - 5} interacciones anteriores)`);
  }
  
  return lines.join('\n');
}

/**
 * Group messages into user-assistant pairs
 */
function groupMessagesIntoPairs(messages: Message[]): Array<{
  userMessage?: Message;
  assistantMessage?: Message;
}> {
  const pairs: Array<{ userMessage?: Message; assistantMessage?: Message }> = [];
  
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    
    if (msg.role === 'user') {
      const nextMsg = messages[i + 1];
      pairs.push({
        userMessage: msg,
        assistantMessage: nextMsg?.role === 'assistant' ? nextMsg : undefined,
      });
      
      // Skip the assistant message in next iteration
      if (nextMsg?.role === 'assistant') {
        i++;
      }
    }
  }
  
  return pairs;
}

/**
 * Group references by source document
 */
function groupReferencesBySource(references: Reference[]): Array<{
  sourceName: string;
  count: number;
  similarity?: number;
}> {
  const grouped = new Map<string, { count: number; totalSimilarity: number; hasScore: boolean }>();
  
  references.forEach(ref => {
    const existing = grouped.get(ref.sourceName) || { count: 0, totalSimilarity: 0, hasScore: false };
    existing.count++;
    
    if (ref.similarity !== undefined) {
      existing.totalSimilarity += ref.similarity;
      existing.hasScore = true;
    }
    
    grouped.set(ref.sourceName, existing);
  });
  
  return Array.from(grouped.entries()).map(([sourceName, data]) => ({
    sourceName,
    count: data.count,
    similarity: data.hasScore ? data.totalSimilarity / data.count : undefined,
  }));
}

/**
 * Sanitize text for mermaid (remove special characters)
 */
function sanitizeText(text: string): string {
  return text
    .replace(/[()[\]{}]/g, '') // Remove brackets
    .replace(/["']/g, '') // Remove quotes
    .replace(/\n/g, ' ') // Replace newlines with spaces
    .trim();
}

/**
 * Truncate text to max length
 */
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

