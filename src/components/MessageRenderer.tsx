import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { ExternalLink, FileText, CheckCircle, Image as ImageIcon, Video, ChevronDown, ChevronRight } from 'lucide-react';
import type { SourceReference } from '../lib/gemini';

interface MessageRendererProps {
  content: string;
  contextSources?: Array<{
    id: string;
    name: string;
    validated?: boolean;
  }>;
  references?: SourceReference[];
  isLoadingReferences?: boolean; // ✅ NEW: Show loading indicator for references
  onReferenceClick?: (reference: SourceReference) => void;
  onSourceClick?: (sourceId: string) => void;
}

export default function MessageRenderer({ 
  content, 
  contextSources = [],
  references = [],
  isLoadingReferences = false,
  onReferenceClick,
  onSourceClick 
}: MessageRendererProps) {
  const [referencesExpanded, setReferencesExpanded] = useState(false); // Collapsed by default
  
  // Debug: Log references received
  React.useEffect(() => {
    if (references && references.length > 0) {
      console.log('📚 MessageRenderer received references:', references.length);
      references.forEach(ref => {
        console.log(`  [${ref.id}] ${ref.sourceName} - ${ref.similarity ? `${(ref.similarity * 100).toFixed(1)}%` : 'N/A'} - Chunk #${ref.chunkIndex}`);
      });
    } else {
      console.log('📚 MessageRenderer: No references received');
    }
  }, [references]);

  // Pre-process content to make references VISUALLY OBVIOUS and clickable
  const processedContent = React.useMemo(() => {
    if (!references || references.length === 0) {
      return content;
    }

    let processed = content;
    
    // ✅ OPTIMIZED: Show reference badge only on FIRST occurrence (cleaner UX)
    const MAX_OCCURRENCES_PER_REFERENCE = 1; // Show each reference badge max 1 time
    
    // First, try to replace existing [1], [2] markers if AI included them
    references.forEach(ref => {
      const pattern = new RegExp(`\\[${ref.id}\\]`, 'g');
      
      // Enhanced badge with similarity indicator
      const similarityColor = ref.similarity !== undefined
        ? ref.similarity >= 0.8 ? 'bg-green-100 text-green-700 border-green-400 hover:bg-green-200'
        : ref.similarity >= 0.6 ? 'bg-yellow-100 text-yellow-700 border-yellow-400 hover:bg-yellow-200'
        : 'bg-orange-100 text-orange-700 border-orange-400 hover:bg-orange-200'
        : 'bg-blue-100 text-blue-700 border-blue-400 hover:bg-blue-200';
      
      // Custom replacer function: Show badge only on first occurrence, remove others
      let replacementCount = 0;
      processed = processed.replace(
        pattern, 
        (match) => {
          replacementCount++;
          
          if (replacementCount > MAX_OCCURRENCES_PER_REFERENCE) {
            // Remove subsequent occurrences completely for cleaner text
            return '';
          }
          
          const isFirstOccurrence = replacementCount === 1;
          
          // Only show percentage badge on first occurrence
          const similarityBadge = isFirstOccurrence && ref.similarity !== undefined
            ? `<span class="ml-1 text-[9px] font-black">${(ref.similarity * 100).toFixed(0)}%</span>`
            : '';
          
          return `<sup><span class="reference-badge inline-flex items-center px-2 py-1 mx-1 ${similarityColor} rounded-lg font-bold text-sm border-2 cursor-pointer transition-all shadow-sm hover:shadow-md" data-ref-id="${ref.id}" title="Click para ver detalles del fragmento - Similitud: ${ref.similarity ? (ref.similarity * 100).toFixed(1) + '%' : 'N/A'}">[${ref.id}]${similarityBadge}</span></sup>`;
        }
      );
    });
    
    // If AI didn't include markers, try to smart-match source names and insert references
    // Look for mentions of source names in the content
    references.forEach(ref => {
      // Check if this reference badge was already inserted
      if (processed.includes(`data-ref-id="${ref.id}"`)) {
        return; // Already has badge, skip
      }
      
      // Try to find mentions of the source name in the text
      const sourceName = ref.sourceName.replace(/\.(pdf|docx?|xlsx?|csv)$/i, ''); // Remove extension
      const sourcePattern = new RegExp(`(${escapeRegExp(sourceName)})(?!.*\\[\\d+\\])`, 'gi');
      
      const similarityColor = ref.similarity !== undefined
        ? ref.similarity >= 0.8 ? 'bg-green-100 text-green-700 border-green-400 hover:bg-green-200'
        : ref.similarity >= 0.6 ? 'bg-yellow-100 text-yellow-700 border-yellow-400 hover:bg-yellow-200'
        : 'bg-orange-100 text-orange-700 border-orange-400 hover:bg-orange-200'
        : 'bg-blue-100 text-blue-700 border-blue-400 hover:bg-blue-200';
      
      const similarityBadge = ref.similarity !== undefined
        ? `<span class="ml-1 text-[9px] font-black">${(ref.similarity * 100).toFixed(0)}%</span>`
        : '';
      
      // Replace first occurrence with source name + reference badge
      let replaced = false;
      processed = processed.replace(sourcePattern, (match) => {
        if (replaced) return match; // Only replace first occurrence
        replaced = true;
        return `${match} <sup><span class="reference-badge inline-flex items-center px-2 py-1 mx-1 ${similarityColor} rounded-lg font-bold text-sm border-2 cursor-pointer transition-all shadow-sm hover:shadow-md" data-ref-id="${ref.id}" title="Click para ver detalles del fragmento - Similitud: ${ref.similarity ? (ref.similarity * 100).toFixed(1) + '%' : 'N/A'}">[${ref.id}]${similarityBadge}</span></sup>`;
      });
    });
    
    return processed;
  }, [content, references]);
  
  // Helper function to escape special regex characters
  function escapeRegExp(string: string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // Add click listeners to reference badges after render
  React.useEffect(() => {
    const handleReferenceClick = (e: Event) => {
      const target = e.target as HTMLElement;
      const badge = target.closest('.reference-badge');
      
      if (badge) {
        const refId = parseInt(badge.getAttribute('data-ref-id') || '0');
        const reference = references.find(r => r.id === refId);
        
        if (reference) {
          console.log('🔍 Referencia clicada:', refId);
          // Use the callback to open reference panel in parent component
          if (onReferenceClick) {
            onReferenceClick(reference);
          }
        }
      }
    };

    document.addEventListener('click', handleReferenceClick);
    
    return () => {
      document.removeEventListener('click', handleReferenceClick);
    };
  }, [references, onReferenceClick]);

  return (
    <>
      <div className="prose prose-slate max-w-none">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw]}
          components={{
          
          // Código con syntax highlighting
          code(props: any) {
            const { node, inline, className, children, ...rest } = props;
            const match = /language-(\w+)/.exec(className || '');
            return !inline && match ? (
              <div className="relative group">
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(String(children).replace(/\n$/, ''));
                    }}
                    className="px-2 py-1 bg-slate-700 text-white text-xs rounded hover:bg-slate-600 transition-colors"
                  >
                    Copiar
                  </button>
                </div>
                <SyntaxHighlighter
                  style={vscDarkPlus as any}
                  language={match[1]}
                  PreTag="div"
                  className="rounded-lg"
                  {...rest}
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              </div>
            ) : (
              <code className="px-1.5 py-0.5 bg-slate-100 text-slate-800 rounded text-sm font-mono" {...rest}>
                {children}
              </code>
            );
          },
          
          // Enlaces con icono externo
          a({ node, children, href, ...props }) {
            if (!href) return <span>{children}</span>;
            
            const isExternal = href.startsWith('http');
            const isSourceReference = href.startsWith('#source-');
            
            if (isSourceReference && contextSources) {
              const sourceId = href.replace('#source-', '');
              const source = contextSources.find(s => s.id === sourceId);
              
              if (source) {
                return (
                  <button
                    onClick={() => onSourceClick?.(sourceId)}
                    className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline font-medium transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    {children}
                    {source.validated && (
                      <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                    )}
                  </button>
                );
              }
            }
            
            return (
              <a
                href={href}
                target={isExternal ? '_blank' : undefined}
                rel={isExternal ? 'noopener noreferrer' : undefined}
                className="text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-1 transition-colors"
                {...props}
              >
                {children}
                {isExternal && <ExternalLink className="w-3.5 h-3.5" />}
              </a>
            );
          },
          
          // Imágenes con card
          img({ node, src, alt, ...props }) {
            return (
              <div className="my-4 rounded-xl overflow-hidden border border-slate-200 shadow-lg">
                <img
                  src={src}
                  alt={alt}
                  className="w-full h-auto"
                  loading="lazy"
                  {...props}
                />
                {alt && (
                  <div className="px-4 py-2 bg-slate-50 text-sm text-slate-600 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" />
                    {alt}
                  </div>
                )}
              </div>
            );
          },
          
          // Blockquotes con estilo
          blockquote({ node, children, ...props }) {
            return (
              <blockquote className="border-l-4 border-blue-500 pl-4 py-2 my-4 bg-blue-50 text-slate-700 italic" {...props}>
                {children}
              </blockquote>
            );
          },
          
          // Tablas con estilo mejorado
          table({ node, children, ...props }) {
            return (
              <div className="overflow-x-auto my-4">
                <table className="min-w-full divide-y divide-slate-200 border border-slate-200 rounded-lg" {...props}>
                  {children}
                </table>
              </div>
            );
          },
          thead({ node, children, ...props }) {
            return (
              <thead className="bg-slate-100" {...props}>
                {children}
              </thead>
            );
          },
          th({ node, children, ...props }) {
            return (
              <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider" {...props}>
                {children}
              </th>
            );
          },
          td({ node, children, ...props }) {
            return (
              <td className="px-4 py-2 text-sm text-slate-800 border-t border-slate-200" {...props}>
                {children}
              </td>
            );
          },
          
          // Listas con mejor espaciado
          ul({ node, children, ...props }) {
            return (
              <ul className="list-disc list-inside space-y-1 my-3 text-slate-800" {...props}>
                {children}
              </ul>
            );
          },
          ol({ node, children, ...props }) {
            return (
              <ol className="list-decimal list-inside space-y-1 my-3 text-slate-800" {...props}>
                {children}
              </ol>
            );
          },
          
          // Headings con mejor estilo
          h1({ node, children, ...props }) {
            return (
              <h1 className="text-2xl font-bold text-slate-900 mt-6 mb-3 border-b border-slate-200 pb-2" {...props}>
                {children}
              </h1>
            );
          },
          h2({ node, children, ...props }) {
            return (
              <h2 className="text-xl font-bold text-slate-900 mt-5 mb-2" {...props}>
                {children}
              </h2>
            );
          },
          h3({ node, children, ...props }) {
            return (
              <h3 className="text-lg font-semibold text-slate-800 mt-4 mb-2" {...props}>
                {children}
              </h3>
            );
          },
          
          // Párrafos con mejor espaciado
          p({ node, children, ...props }) {
            return (
              <p className="text-slate-800 leading-relaxed my-2" {...props}>
                {children}
              </p>
            );
          },
        }}
      >
        {processedContent}
      </ReactMarkdown>
      
      {/* References Footer - Enhanced with similarity prominence */}
      {/* ✅ LOADING STATE: Show loading indicator while references are being fetched */}
      {isLoadingReferences && (
        <div className="mt-6 pt-4 border-t-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-b-lg -mx-4 -mb-4 px-4 pb-4 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
              <div className="h-full bg-blue-600 rounded-full animate-pulse" style={{ width: '60%' }} />
            </div>
            <span className="text-xs text-slate-600 font-medium whitespace-nowrap">
              Cargando referencias...
            </span>
          </div>
        </div>
      )}
      
      {/* Loading indicator for references */}
      {isLoadingReferences && (
        <div className="mt-6 pt-4 border-t-2 border-slate-200 bg-slate-50 rounded-b-lg -mx-4 -mb-4 px-4 pb-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full animate-pulse" 
                style={{ width: '70%', animation: 'pulse 1.5s ease-in-out infinite' }} 
              />
            </div>
          </div>
          <p className="text-xs text-slate-600 text-center font-medium flex items-center justify-center gap-2">
            <svg className="animate-spin h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Cargando referencias...
          </p>
        </div>
      )}
      
      {/* ✅ SMOOTH APPEARANCE: References appear after loading */}
      {!isLoadingReferences && references.length > 0 && (
        <div className="mt-6 pt-4 border-t-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-b-lg -mx-4 -mb-4 px-4 pb-4 animate-fade-in">
          <button
            onClick={() => setReferencesExpanded(!referencesExpanded)}
            className="w-full flex items-center justify-between mb-3 hover:bg-blue-100/50 p-2 rounded-lg transition-colors"
          >
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                {referencesExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                📚 Referencias utilizadas
                <span className="px-2 py-0.5 bg-blue-600 text-white rounded-full text-xs font-semibold">
                  {references.length}
                </span>
              </h4>
            </div>
            <p className="text-xs text-slate-500 italic">
              {referencesExpanded ? 'Click para colapsar' : 'Click para expandir'}
            </p>
          </button>
          {referencesExpanded && (
            <div className="space-y-2">
              {references.map(ref => (
              <button
                key={ref.id}
                onClick={() => onReferenceClick?.(ref)}
                className="w-full text-left bg-white hover:bg-blue-50 border-2 border-slate-200 hover:border-blue-400 rounded-lg p-3 transition-all group shadow-sm hover:shadow-md"
              >
                <div className="flex items-start gap-3">
                  <span className="inline-flex items-center px-2.5 py-1.5 bg-blue-600 text-white rounded-lg font-bold text-sm group-hover:bg-blue-700 flex-shrink-0 shadow-sm">
                    [{ref.id}]
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <p className="text-sm font-bold text-slate-900 truncate">
                        {ref.sourceName}
                      </p>
                      {ref.similarity !== undefined && (
                        <div className="flex flex-col items-end gap-1">
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                              <div 
                                className={`h-full transition-all ${
                                  ref.similarity >= 0.8 ? 'bg-green-500' :
                                  ref.similarity >= 0.6 ? 'bg-yellow-500' :
                                  'bg-orange-500'
                                }`}
                                style={{ width: `${ref.similarity * 100}%` }}
                              />
                            </div>
                            <span className={`text-sm font-black px-2 py-1 rounded-lg ${
                              ref.similarity >= 0.8 ? 'bg-green-100 text-green-700 border border-green-300' :
                              ref.similarity >= 0.6 ? 'bg-yellow-100 text-yellow-700 border border-yellow-300' :
                              'bg-orange-100 text-orange-700 border border-orange-300'
                            }`}>
                              {(ref.similarity * 100).toFixed(1)}%
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-medium">
                            Similitud semántica
                          </span>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-slate-700 line-clamp-2 leading-relaxed mb-2">
                      {ref.snippet}
                    </p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      {ref.chunkIndex !== undefined && (
                        <span className={`px-2 py-1 rounded-md font-mono text-xs font-semibold ${
                          ref.metadata?.isRAGChunk 
                            ? 'bg-green-100 text-green-800 border border-green-300'
                            : 'bg-slate-100 text-slate-700 border border-slate-300'
                        }`}>
                          {ref.chunkIndex >= 0 ? `📄 Fragmento ${ref.chunkIndex}` : '📝 Doc. Completo'}
                        </span>
                      )}
                      {ref.metadata?.tokenCount && (
                        <span className="text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded-md font-medium">
                          {ref.metadata.tokenCount.toLocaleString()} tokens
                        </span>
                      )}
                      {ref.metadata?.isRAGChunk && (
                        <span className="bg-green-600 text-white px-2 py-1 rounded-md text-[10px] font-bold flex items-center gap-1">
                          <span>🔍</span>
                          <span>RAG</span>
                        </span>
                      )}
                      {ref.metadata?.isFullDocument && (
                        <span className="bg-blue-600 text-white px-2 py-1 rounded-md text-[10px] font-bold">
                          📝 Full-Text
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
              ))}
            </div>
          )}
          {!referencesExpanded && (
            <p className="text-xs text-slate-500 text-center italic">
              💡 Click arriba para ver los {references.length} fragmentos utilizados
            </p>
          )}
          {referencesExpanded && (
            <p className="text-xs text-slate-500 mt-3 text-center italic">
              💡 Los números entre corchetes [1] [2] en el texto son clickables
            </p>
          )}
        </div>
      )}
    </div>
  </>
  );
}

