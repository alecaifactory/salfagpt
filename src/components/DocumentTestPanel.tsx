/**
 * Interactive Document Testing Panel
 * 
 * Allows users to:
 * 1. View document chunks
 * 2. Select text from chunks
 * 3. Get suggested questions
 * 4. Test AI responses
 * 5. Verify references match selected chunks
 */

import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, CheckCircle, XCircle, Loader2, FileText, Target } from 'lucide-react';
import MessageRenderer from './MessageRenderer';

interface ChunkData {
  id: string;
  chunkIndex: number;
  text: string;
  embedding: number[];
  metadata: {
    startChar?: number;
    endChar?: number;
    tokenCount?: number;
    startPage?: number;
    endPage?: number;
  };
  createdAt: Date;
}

interface TestMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  references?: any[];
  targetChunkIndex?: number; // Which chunk we're testing
}

interface DocumentTestPanelProps {
  sourceId: string;
  sourceName: string;
  chunks: ChunkData[];
  userId: string;
  onClose: () => void;
}

export default function DocumentTestPanel({
  sourceId,
  sourceName,
  chunks,
  userId,
  onClose
}: DocumentTestPanelProps) {
  const [selectedChunkIndex, setSelectedChunkIndex] = useState<number | null>(null);
  const [selectedText, setSelectedText] = useState('');
  const [testMessages, setTestMessages] = useState<TestMessage[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [testMessages]);

  // Generate suggested questions when text is selected
  const generateSuggestedQuestions = (text: string, chunkIndex: number): string[] => {
    const questions: string[] = [];
    
    // Extract key phrases (simple heuristic)
    if (text.includes('escalera')) {
      questions.push('¿Qué dice sobre el cálculo de escaleras?');
      questions.push('¿Cómo se mide la superficie de las escaleras?');
    }
    
    if (text.includes('superficie')) {
      questions.push('¿Cómo se calcula la superficie edificada?');
      questions.push('¿Qué superficie se debe considerar?');
    }
    
    if (text.includes('piso')) {
      questions.push('¿Cómo se contabiliza en cada piso?');
      questions.push('¿Qué dice sobre los diferentes pisos?');
    }
    
    // Generic questions
    questions.push(`Resume este fragmento del documento`);
    questions.push(`Explica en detalle lo que dice en este chunk #${chunkIndex}`);
    
    return questions.slice(0, 5); // Max 5 suggestions
  };

  const handleChunkClick = (chunkIndex: number) => {
    setSelectedChunkIndex(chunkIndex);
    setSelectedText('');
    
    // Pre-fill with a test question
    const chunk = chunks.find(c => c.chunkIndex === chunkIndex);
    if (chunk) {
      const questions = generateSuggestedQuestions(chunk.text, chunkIndex);
      setCurrentQuestion(questions[0] || '');
    }
  };

  const handleTextSelection = () => {
    const selection = window.getSelection();
    const text = selection?.toString() || '';
    
    if (text.length > 10 && selectedChunkIndex !== null) {
      setSelectedText(text);
      const questions = generateSuggestedQuestions(text, selectedChunkIndex);
      
      // Pre-fill with first suggested question
      if (questions.length > 0) {
        setCurrentQuestion(questions[0]);
      }
    }
  };

  const selectedChunk = selectedChunkIndex !== null 
    ? chunks.find(c => c.chunkIndex === selectedChunkIndex)
    : null;

  // Helper: Generate suggested questions based on text content
  const generateQuestions = (text: string, chunkIndex: number): string[] => {
    const questions: string[] = [];
    
    if (text.toLowerCase().includes('escalera')) {
      questions.push('¿Qué dice sobre el cálculo de escaleras?');
      questions.push('¿Cómo se mide la superficie de las escaleras?');
    }
    
    if (text.toLowerCase().includes('superficie')) {
      questions.push('¿Cómo se calcula la superficie edificada?');
      questions.push('¿Qué superficie se debe considerar?');
    }
    
    if (text.toLowerCase().includes('piso')) {
      questions.push('¿Cómo se contabiliza en cada piso?');
    }
    
    questions.push(`Resume este fragmento`);
    questions.push(`Explica lo que dice en chunk #${chunkIndex}`);
    
    return questions.slice(0, 4);
  };

  // Helper: Send test question to API
  const sendTestQuestion = async () => {
    if (!currentQuestion.trim()) return;
    
    setIsSending(true);
    
    const userMessage: TestMessage = {
      id: `test-user-${Date.now()}`,
      role: 'user',
      content: currentQuestion,
      timestamp: new Date(),
      targetChunkIndex: selectedChunkIndex || undefined
    };
    
    setTestMessages(prev => [...prev, userMessage]);
    const questionToSend = currentQuestion;
    setCurrentQuestion('');
    
    try {
      const response = await fetch(`/api/conversations/temp-test/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          message: questionToSend,
          model: 'gemini-2.5-flash',
          systemPrompt: 'Eres un asistente experto en normativas de construcción. Responde de manera precisa y cita las fuentes.',
          contextSources: [{
            id: sourceId,
            name: sourceName,
            type: 'pdf',
            content: chunks.map(c => c.text).join('\n\n')
          }],
          ragEnabled: true,
          ragTopK: 3,
          ragMinSimilarity: 0.3
        })
      });
      
      if (!response.ok) throw new Error('Failed to get response');
      
      const data = await response.json();
      const responseText = typeof data.assistantMessage?.content === 'string'
        ? data.assistantMessage.content
        : data.assistantMessage?.content?.text || 'No response';
      
      const assistantMessage: TestMessage = {
        id: `test-assistant-${Date.now()}`,
        role: 'assistant',
        content: responseText,
        timestamp: new Date(),
        references: data.references || [],
        targetChunkIndex: selectedChunkIndex || undefined
      };
      
      setTestMessages(prev => [...prev, assistantMessage]);
      
      if (selectedChunkIndex !== null && data.references && data.references.length > 0) {
        const referencedChunks = data.references.map((r: any) => r.chunkIndex);
        const matched = referencedChunks.includes(selectedChunkIndex);
        console.log(`🎯 Test Result: ${matched ? '✅ MATCHED' : '❌ NOT MATCHED'} - Target: ${selectedChunkIndex}, Referenced: [${referencedChunks.join(', ')}]`);
      }
      
    } catch (error) {
      console.error('Error testing question:', error);
      setTestMessages(prev => [...prev, {
        id: `test-error-${Date.now()}`,
        role: 'assistant',
        content: 'Error al procesar la pregunta. Por favor, intenta de nuevo.',
        timestamp: new Date()
      }]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <Target className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-bold text-slate-800">Prueba Interactiva de Documento</h2>
              <p className="text-sm text-slate-600">{sourceName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Main Content - Split View */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - Document Chunks */}
          <div className="w-1/2 border-r border-slate-200 flex flex-col">
            <div className="p-4 border-b border-slate-200 bg-slate-50">
              <h3 className="text-sm font-semibold text-slate-700 mb-2">
                📄 Chunks del Documento ({chunks.length})
              </h3>
              <p className="text-xs text-slate-600">
                Click en un chunk para seleccionarlo • Selecciona texto dentro del chunk para generar preguntas sugeridas
              </p>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chunks.map((chunk, index) => (
                <div
                  key={chunk.id}
                  onClick={() => handleChunkClick(chunk.chunkIndex)}
                  onMouseUp={handleTextSelection}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    selectedChunkIndex === chunk.chunkIndex
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        selectedChunkIndex === chunk.chunkIndex
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-200 text-slate-700'
                      }`}>
                        Chunk #{chunk.chunkIndex}
                      </span>
                      {chunk.metadata.startPage && (
                        <span className="text-xs text-slate-500">
                          Página {chunk.metadata.startPage}
                          {chunk.metadata.endPage && chunk.metadata.endPage !== chunk.metadata.startPage 
                            ? `-${chunk.metadata.endPage}` 
                            : ''}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-500">
                      {chunk.metadata.tokenCount} tokens
                    </span>
                  </div>
                  
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {chunk.text}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Right Panel - Test Chat */}
          <div className="w-1/2 flex flex-col">
            <div className="p-4 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <h3 className="text-sm font-semibold text-slate-700 mb-2">
                💬 Chat de Prueba
              </h3>
              {selectedChunkIndex !== null && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="px-2 py-1 bg-blue-600 text-white rounded font-bold">
                    Chunk #{selectedChunkIndex}
                  </span>
                  <span className="text-slate-600">seleccionado como objetivo</span>
                </div>
              )}
            </div>
            
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
              {testMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <Sparkles className="w-12 h-12 text-blue-400 mb-3" />
                  <p className="text-slate-600 mb-2">
                    Selecciona un chunk y haz una pregunta
                  </p>
                  <p className="text-xs text-slate-500">
                    Verás cómo el AI referencia los chunks específicos
                  </p>
                </div>
              ) : (
                testMessages.map(msg => (
                  <div
                    key={msg.id}
                    className={`${msg.role === 'user' ? 'text-right' : 'text-left'}`}
                  >
                    {msg.role === 'user' ? (
                      <div className="inline-block max-w-md p-3 rounded-lg bg-blue-600 text-white text-sm">
                        {msg.content}
                        {msg.targetChunkIndex !== undefined && (
                          <div className="mt-2 pt-2 border-t border-blue-400 text-xs opacity-80">
                            🎯 Objetivo: Chunk #{msg.targetChunkIndex}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="inline-block max-w-lg bg-white border border-slate-200 rounded-lg shadow-sm">
                        <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-700">
                            Respuesta de Prueba
                          </span>
                          {msg.targetChunkIndex !== undefined && msg.references && (
                            <span className={`text-xs font-bold px-2 py-1 rounded ${
                              msg.references.some((r: any) => r.chunkIndex === msg.targetChunkIndex)
                                ? 'bg-green-100 text-green-700'
                                : 'bg-orange-100 text-orange-700'
                            }`}>
                              {msg.references.some((r: any) => r.chunkIndex === msg.targetChunkIndex)
                                ? '✓ Chunk objetivo referenciado'
                                : '⚠ Chunk objetivo NO usado'}
                            </span>
                          )}
                        </div>
                        <div className="p-4 text-sm">
                          <MessageRenderer 
                            content={msg.content}
                            references={msg.references}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-slate-200 bg-white">
              {selectedChunkIndex !== null ? (
                <div className="space-y-3">
                  {/* Suggested Questions (if any) */}
                  {selectedText && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-xs font-semibold text-blue-800 mb-2">
                        💡 Preguntas sugeridas sobre el texto seleccionado:
                      </p>
                      <div className="space-y-1">
                        {generateQuestions(selectedText, selectedChunkIndex).map((q, i) => (
                          <button
                            key={i}
                            onClick={() => setCurrentQuestion(q)}
                            className="w-full text-left text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-100 px-2 py-1 rounded transition-colors"
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Question Input */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={currentQuestion}
                      onChange={(e) => setCurrentQuestion(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          sendTestQuestion();
                        }
                      }}
                      placeholder="Escribe una pregunta sobre el chunk seleccionado..."
                      className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={isSending}
                    />
                    <button
                      onClick={sendTestQuestion}
                      disabled={!currentQuestion.trim() || isSending}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                    >
                      {isSending ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-sm">Probando...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span className="text-sm">Probar</span>
                        </>
                      )}
                    </button>
                  </div>
                  
                  <p className="text-xs text-slate-500 text-center">
                    🎯 Chunk #{selectedChunkIndex} seleccionado • Pregunta y verifica que las referencias apunten a este chunk
                  </p>
                </div>
              ) : (
                <div className="text-center text-slate-500 py-4">
                  <p className="text-sm">Selecciona un chunk en el panel izquierdo para comenzar</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

