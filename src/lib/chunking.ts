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

