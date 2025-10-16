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

  // Create a wrapper component that processes the entire content after ReactMarkdown
  const ContentWithReferences = () => {
    const contentRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
      if (!contentRef.current || !references || references.length === 0) return;

      // Find all text nodes with [1], [2], etc. and make them clickable
      const walker = document.createTreeWalker(
        contentRef.current,
        NodeFilter.SHOW_TEXT,
        null
      );

      const nodesToReplace: { node: Text; refId: number; reference: SourceReference }[] = [];
      let currentNode: Text | null;

      while ((currentNode = walker.nextNode() as Text | null)) {
        const text = currentNode.textContent || '';
        const matches = text.matchAll(/\[(\d+)\]/g);
        
        for (const match of matches) {
          const refId = parseInt(match[1]);
          const reference = references.find(r => r.id === refId);
          if (reference) {
            nodesToReplace.push({ node: currentNode, refId, reference });
          }
        }
      }

      // Replace text nodes with elements containing buttons
      nodesToReplace.forEach(({ node, refId, reference }) => {
        const text = node.textContent || '';
        const parts = text.split(new RegExp(`(\\[${refId}\\])`));
        
        const span = document.createElement('span');
        parts.forEach(part => {
          if (part === `[${refId}]`) {
            const sup = document.createElement('sup');
            const button = document.createElement('button');
            button.textContent = `[${refId}]`;
            button.className = 'inline-flex items-center text-blue-600 hover:text-blue-800 font-semibold px-0.5 hover:underline transition-colors cursor-pointer';
            button.title = `Ver referencia ${refId}`;
            button.onclick = (e) => {
              e.preventDefault();
              setSelectedReference(reference);
            };
            sup.appendChild(button);
            span.appendChild(sup);
          } else {
            span.appendChild(document.createTextNode(part));
          }
        });
        
        node.parentNode?.replaceChild(span, node);
      });
    }, [references]);

    return (
      <div ref={contentRef}>
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
        {content}
      </ReactMarkdown>
      </div>
    );
  };

  return (
    <>
      <div className="prose prose-slate max-w-none">
        <ContentWithReferences />
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

