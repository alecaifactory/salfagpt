/**
 * Re-index a context source for RAG
 * 
 * POST /api/reindex-source
 * Body: { sourceId: string, userId: string }
 */

import type { APIRoute } from 'astro';
import { getContextSource } from '../../lib/firestore';
import { downloadFile, fileExists } from '../../lib/storage';
import { GoogleGenAI } from '@google/genai';

// Initialize Gemini AI client
const API_KEY = process.env.GOOGLE_AI_API_KEY || 
  (typeof import.meta !== 'undefined' && import.meta.env 
    ? import.meta.env.GOOGLE_AI_API_KEY 
    : undefined);

const genAI = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { sourceId, userId } = body;

    if (!sourceId || !userId) {
      return new Response(
        JSON.stringify({ error: 'sourceId and userId required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('🔄 Re-indexing source:', sourceId);

    // Get the source
    const source = await getContextSource(sourceId);
    
    if (!source) {
      return new Response(
        JSON.stringify({ error: 'Source not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (source.userId !== userId) {
      return new Response(
        JSON.stringify({ error: 'Forbidden' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('📄 Source:', source.name);
    
    // NEW: Check if original file exists in Cloud Storage
    const storagePath = (source.metadata as any)?.storagePath;
    let textToIndex = source.extractedData;
    
    if (storagePath) {
      console.log('📥 Checking Cloud Storage for original file:', storagePath);
      const exists = await fileExists(storagePath);
      
      if (exists) {
        console.log('✅ Original file found in storage - re-extracting fresh text...');
        
        try {
          // Download original file
          const fileBuffer = await downloadFile(storagePath);
          console.log(`📥 Downloaded ${fileBuffer.length} bytes from storage`);
          
          // Re-extract with Gemini for fresh text
          if (genAI && source.type === 'pdf') {
            const base64Data = fileBuffer.toString('base64');
            
            const result = await genAI.models.generateContent({
              model: source.metadata?.model || 'gemini-2.5-flash',
              contents: [{
                role: 'user',
                parts: [{
                  inlineData: {
                    mimeType: 'application/pdf',
                    data: base64Data
                  }
                }]
              }],
              config: {
                systemInstruction: 'Extract ALL text from this PDF document...',
                maxOutputTokens: 200000,
              }
            });
            
            textToIndex = result.text || source.extractedData;
            console.log('✅ Fresh extraction complete:', textToIndex?.length, 'characters');
          } else {
            console.log('⚠️ Using existing extracted text (no Gemini client or not PDF)');
          }
        } catch (error) {
          console.warn('⚠️ Failed to re-extract from storage, using existing text:', error);
          // Continue with existing extractedData
        }
      } else {
        console.warn('⚠️ Original file not found in storage, using existing extracted text');
      }
    } else {
      console.warn('⚠️ No storage path in metadata, using existing extracted text');
    }
    
    // Check if we have text to index
    if (!textToIndex) {
      return new Response(
        JSON.stringify({ 
          error: 'No text data available',
          message: 'Document needs to be uploaded and extracted first'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Import RAG indexing function
    const { chunkAndIndexDocument } = await import('../../lib/rag-indexing.js');
    
    console.log('🔍 Starting RAG indexing...');
    
    // Chunk and index the document
    const result = await chunkAndIndexDocument({
      sourceId: source.id,
      userId: source.userId,
      sourceName: source.name,
      text: textToIndex!,  // We already checked it exists above
      chunkSize: 1000,      // ~1000 tokens per chunk
      overlap: 200,         // 200 tokens overlap
    });

    console.log(`✅ Indexing complete: ${result.chunksCreated} chunks created`);

    // Update source with RAG metadata
    const { updateContextSource } = await import('../../lib/firestore');
    await updateContextSource(sourceId, {
      ragEnabled: true,
      ragMetadata: {
        chunkCount: result.chunksCreated,
        avgChunkSize: Math.round(result.totalTokens / result.chunksCreated),
        indexedAt: new Date(),
        embeddingModel: 'text-embedding-004',
      },
    } as any);

    return new Response(
      JSON.stringify({
        success: true,
        chunksCreated: result.chunksCreated,
        totalTokens: result.totalTokens,
        message: `Successfully indexed ${result.chunksCreated} chunks`,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error re-indexing source:', error);
    
    return new Response(
      JSON.stringify({
        error: 'Failed to re-index source',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

