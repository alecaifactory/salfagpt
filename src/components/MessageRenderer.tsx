import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { ExternalLink, FileText, CheckCircle, Image as ImageIcon, Video } from 'lucide-react';
import type { SourceReference } from '../lib/gemini';
import ReferencePanel from './ReferencePanel';

interface MessageRendererProps {
  content: string;
  contextSources?: Array<{
    id: string;
    name: string;
    validated?: boolean;
  }>;
  references?: SourceReference[];
  onSourceClick?: (sourceId: string) => void;
}

export default function MessageRenderer({ 
  content, 
  contextSources = [],
  references = [],
  onSourceClick 
}: MessageRendererProps) {
  const [selectedReference, setSelectedReference] = useState<SourceReference | null>(null);

  // Pre-process content to make references VISUALLY OBVIOUS and clickable
  const processedContent = React.useMemo(() => {
    if (!references || references.length === 0) {
      return content;
    }

    let processed = content;
    
    // Replace [1], [2], etc. with styled span with data attribute
    references.forEach(ref => {
      const pattern = new RegExp(`\\[${ref.id}\\]`, 'g');
      // Use bold, larger, colored reference markers - NO onclick inline
      processed = processed.replace(
        pattern, 
        `<sup><span class="reference-badge inline-flex items-center px-1.5 py-0.5 mx-0.5 bg-blue-100 text-blue-700 rounded font-bold text-sm border border-blue-300 cursor-pointer hover:bg-blue-200 hover:border-blue-400 transition-colors shadow-sm" data-ref-id="${ref.id}" title="Click para ver fuente">[${ref.id}]</span></sup>`
      );
    });
    
    return processed;
  }, [content, references]);

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
          setSelectedReference(reference);
        }
      }
    };

    document.addEventListener('click', handleReferenceClick);
    
    return () => {
      document.removeEventListener('click', handleReferenceClick);
    };
  }, [references]);

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
      
      {/* References Footer */}
      {references.length > 0 && (
        <div className="mt-6 pt-4 border-t border-slate-200">
          <h4 className="text-xs font-semibold text-slate-600 mb-3">
            📚 Referencias utilizadas ({references.length})
          </h4>
          <div className="space-y-2">
            {references.map(ref => (
              <button
                key={ref.id}
                onClick={() => setSelectedReference(ref)}
                className="w-full text-left bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-lg p-3 transition-all group"
              >
                <div className="flex items-start gap-3">
                  <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-700 rounded font-bold text-sm border border-blue-300 group-hover:bg-blue-200 flex-shrink-0">
                    [{ref.id}]
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="text-xs font-semibold text-slate-800 truncate">
                        {ref.sourceName}
                      </p>
                      {ref.similarity !== undefined && (
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          ref.similarity >= 0.8 ? 'bg-green-100 text-green-700' :
                          ref.similarity >= 0.6 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-orange-100 text-orange-700'
                        }`}>
                          {(ref.similarity * 100).toFixed(1)}% similar
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-2">
                      {ref.snippet}
                    </p>
                    {ref.chunkIndex !== undefined && (
                      <p className="text-xs text-slate-500 mt-1">
                        Chunk #{ref.chunkIndex + 1}
                        {ref.metadata?.tokenCount && ` • ${ref.metadata.tokenCount} tokens`}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
    
    {/* Reference Panel */}
    {selectedReference && (
      <ReferencePanel
        reference={selectedReference}
        onClose={() => setSelectedReference(null)}
        onViewFullDocument={onSourceClick}
      />
    )}
  </>
  );
}

