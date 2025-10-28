/**
 * Text Chunking Service for RAG
 * 
 * Splits documents into optimal chunks for embedding and retrieval
 */

/**
 * Text chunk with metadata
 */
export interface TextChunk {
  text: string;
  chunkIndex: number;
  startChar: number;
  endChar: number;
  tokenCount: number;
  metadata?: {
    startPage?: number;
    endPage?: number;
  };
}

/**
 * Basic text chunking with overlap
 * 
 * @param text - Text to chunk
 * @param chunkSize - Target tokens per chunk
 * @param overlap - Tokens to overlap between chunks
 */
export function chunkText(
  text: string,
  chunkSize: number = 500,
  overlap: number = 50
): TextChunk[] {
  // Estimate ~4 chars per token
  const charsPerToken = 4;
  const chunkSizeChars = chunkSize * charsPerToken;
  const overlapChars = overlap * charsPerToken;

  const chunks: TextChunk[] = [];
  let startChar = 0;
  let chunkIndex = 0;

  while (startChar < text.length) {
    const endChar = Math.min(startChar + chunkSizeChars, text.length);
    const chunkText = text.slice(startChar, endChar);
    
    chunks.push({
      text: chunkText,
      chunkIndex,
      startChar,
      endChar,
      tokenCount: Math.ceil(chunkText.length / charsPerToken)
    });

    // Move to next chunk with overlap
    startChar = endChar - overlapChars;
    chunkIndex++;

    // Prevent infinite loop
    if (startChar >= text.length - overlapChars) break;
  }

  return chunks;
}

/**
 * Smart chunking by paragraphs/sections
 * Tries to keep semantic units together
 * 
 * @param text - Text to chunk
 * @param maxChunkSize - Maximum tokens per chunk
 */
export function chunkTextSmart(
  text: string,
  maxChunkSize: number = 500
): TextChunk[] {
  // Split by double newlines (paragraphs) or section markers
  const paragraphs = text.split(/\n\n+|---+|\*\*\*+/);
  const chunks: TextChunk[] = [];
  
  let currentChunk = '';
  let currentStartChar = 0;
  let chunkIndex = 0;

  for (const para of paragraphs) {
    const paraText = para.trim();
    if (!paraText) continue;

    const estimatedTokens = Math.ceil((currentChunk + paraText).length / 4);

    if (estimatedTokens > maxChunkSize && currentChunk.length > 0) {
      // Save current chunk
      chunks.push({
        text: currentChunk.trim(),
        chunkIndex,
        startChar: currentStartChar,
        endChar: currentStartChar + currentChunk.length,
        tokenCount: Math.ceil(currentChunk.length / 4)
      });

      // Start new chunk
      currentStartChar += currentChunk.length;
      currentChunk = paraText + '\n\n';
      chunkIndex++;
    } else {
      currentChunk += paraText + '\n\n';
    }
  }

  // Add final chunk
  if (currentChunk.trim().length > 0) {
    chunks.push({
      text: currentChunk.trim(),
      chunkIndex,
      startChar: currentStartChar,
      endChar: currentStartChar + currentChunk.length,
      tokenCount: Math.ceil(currentChunk.length / 4)
    });
  }

  return chunks;
}

/**
 * Chunk text by sentence boundaries
 * Most precise, but can create very small chunks
 */
export function chunkTextBySentences(
  text: string,
  maxChunkSize: number = 500
): TextChunk[] {
  // Split by sentence endings
  const sentences = text.split(/[.!?]+\s+/);
  const chunks: TextChunk[] = [];
  
  let currentChunk = '';
  let currentStartChar = 0;
  let chunkIndex = 0;

  for (const sentence of sentences) {
    const sentenceText = sentence.trim();
    if (!sentenceText) continue;

    const estimatedTokens = Math.ceil((currentChunk + sentenceText).length / 4);

    if (estimatedTokens > maxChunkSize && currentChunk.length > 0) {
      chunks.push({
        text: currentChunk.trim() + '.',
        chunkIndex,
        startChar: currentStartChar,
        endChar: currentStartChar + currentChunk.length,
        tokenCount: Math.ceil(currentChunk.length / 4)
      });

      currentStartChar += currentChunk.length;
      currentChunk = sentenceText + '. ';
      chunkIndex++;
    } else {
      currentChunk += sentenceText + '. ';
    }
  }

  if (currentChunk.trim().length > 0) {
    chunks.push({
      text: currentChunk.trim(),
      chunkIndex,
      startChar: currentStartChar,
      endChar: currentStartChar + currentChunk.length,
      tokenCount: Math.ceil(currentChunk.length / 4)
    });
  }

  return chunks;
}

/**
 * Filter out low-quality chunks (headers, footers, TOC, page numbers, etc.)
 * 
 * ✅ NEW: Prevents garbage chunks from polluting RAG search results
 */
export function filterGarbageChunks(chunks: TextChunk[]): TextChunk[] {
  const GARBAGE_PATTERNS = [
    /^[\d\s\.]+$/,                          // Only numbers and dots (TOC)
    /^página\s+\d+\s+de\s+\d+$/i,           // "Página X de Y"
    /^page\s+\d+\s+of\s+\d+$/i,             // "Page X of Y"
    /^[\.\s]{20,}$/,                        // Only dots and spaces (20+ chars)
    /^[-=_]{10,}$/,                         // Only separators (10+ chars)
    /^\d+\.\s+[A-ZÁÉÍÓÚ\s]{1,50}\.{5,}$/,   // TOC entries: "1. INTRODUCCIÓN ........"
    /^índice$/i,                            // "ÍNDICE"
    /^tabla\s+de\s+contenido/i,             // "Tabla de contenido"
    /^introducción\s*\.{5,}$/i,             // "INTRODUCCIÓN ........"
  ];
  
  const MIN_MEANINGFUL_CHARS = 50; // Minimum 50 chars for a chunk to be useful
  const MAX_DOT_RATIO = 0.3;        // Max 30% dots in text
  
  return chunks.filter(chunk => {
    const text = chunk.text.trim();
    
    // 1. Too short - probably not useful
    if (text.length < MIN_MEANINGFUL_CHARS) {
      return false;
    }
    
    // 2. Matches garbage pattern
    if (GARBAGE_PATTERNS.some(pattern => pattern.test(text))) {
      return false;
    }
    
    // 3. Too many dots (TOC formatting)
    const dotCount = (text.match(/\./g) || []).length;
    const dotRatio = dotCount / text.length;
    if (dotRatio > MAX_DOT_RATIO) {
      return false;
    }
    
    // 4. Only whitespace and punctuation
    const contentChars = text.replace(/[\s\.\-=_]/g, '').length;
    if (contentChars < 30) {
      return false;
    }
    
    // ✅ Chunk passed all filters
    return true;
  });
}

/**
 * Get chunking statistics
 */
export function getChunkingStats(chunks: TextChunk[]) {
  const tokenCounts = chunks.map(c => c.tokenCount);
  const avgTokens = tokenCounts.reduce((sum, t) => sum + t, 0) / chunks.length;
  const minTokens = Math.min(...tokenCounts);
  const maxTokens = Math.max(...tokenCounts);

  return {
    totalChunks: chunks.length,
    avgTokensPerChunk: Math.round(avgTokens),
    minTokensPerChunk: minTokens,
    maxTokensPerChunk: maxTokens,
    totalTokens: tokenCounts.reduce((sum, t) => sum + t, 0)
  };
}

