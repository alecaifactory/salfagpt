/**
 * Re-index with real-time progress using Server-Sent Events (SSE)
 * 
 * POST /api/context-sources/:id/reindex-stream
 */

import type { APIRoute } from 'astro';
import { getContextSource, updateContextSource } from '../../../../lib/firestore';
import { downloadFile, fileExists } from '../../../../lib/storage';
import { GoogleGenAI } from '@google/genai';
import { chunkAndIndexDocument } from '../../../../lib/rag-indexing';

const API_KEY = process.env.GOOGLE_AI_API_KEY || 
  (typeof import.meta !== 'undefined' && import.meta.env 
    ? import.meta.env.GOOGLE_AI_API_KEY 
    : undefined);

const genAI = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

export const POST: APIRoute = async ({ params, request }) => {
  const sourceId = params.id;
  
  if (!sourceId) {
    return new Response('Source ID required', { status: 400 });
  }

  const body = await request.json();
  const { userId } = body;

  // Create SSE stream
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const sendProgress = (stage: string, progress: number, message: string, data?: any) => {
        const event = `data: ${JSON.stringify({ stage, progress, message, ...data })}\n\n`;
        controller.enqueue(encoder.encode(event));
      };

      try {
        // Get source
        sendProgress('init', 0, 'Verificando documento...');
        const source = await getContextSource(sourceId);
        
        if (!source || source.userId !== userId) {
          sendProgress('error', 0, 'Documento no encontrado o sin permiso');
          controller.close();
          return;
        }

        // Check Cloud Storage
        sendProgress('downloading', 5, 'Verificando archivo en Cloud Storage...');
        const storagePath = (source.metadata as any)?.storagePath;
        
        if (!storagePath) {
          sendProgress('error', 0, 'No hay archivo en Cloud Storage');
          controller.close();
          return;
        }

        const exists = await fileExists(storagePath);
        if (!exists) {
          sendProgress('error', 0, 'Archivo no encontrado en storage');
          controller.close();
          return;
        }

        // Download file
        sendProgress('downloading', 10, 'Descargando archivo original...');
        const fileBuffer = await downloadFile(storagePath);
        sendProgress('downloading', 18, `Descargado: ${(fileBuffer.length / 1024 / 1024).toFixed(2)} MB`);

        // Extract text
        sendProgress('extracting', 20, 'Extrayendo texto con Gemini AI...');
        
        let textToIndex = source.extractedData;
        
        if (genAI && source.type === 'pdf') {
          const base64Data = fileBuffer.toString('base64');
          
          sendProgress('extracting', 25, 'Procesando PDF con Gemini...');
          
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
              systemInstruction: 'Extract ALL text from this PDF document including tables and structured content. Return only the extracted text.',
              maxOutputTokens: 200000,
            }
          });
          
          textToIndex = result.text || source.extractedData;
          sendProgress('extracting', 35, `Extraídos ${textToIndex?.length.toLocaleString()} caracteres`);
        }

        if (!textToIndex) {
          sendProgress('error', 0, 'No hay texto para indexar');
          controller.close();
          return;
        }

        // Chunk document
        sendProgress('chunking', 40, 'Dividiendo documento en fragmentos...');
        const { chunkText } = await import('../../../../lib/chunking');
        const chunks = chunkText(textToIndex, 1000, 200);
        sendProgress('chunking', 45, `Creados ${chunks.length} chunks`);

        // Clear old chunks
        sendProgress('cleaning', 48, 'Limpiando chunks antiguos...');
        const oldChunks = await (await import('../../../../lib/firestore')).firestore
          .collection('document_chunks')
          .where('sourceId', '==', sourceId)
          .get();
        
        if (oldChunks.size > 0) {
          const batch = (await import('../../../../lib/firestore')).firestore.batch();
          oldChunks.docs.forEach(doc => batch.delete(doc.ref));
          await batch.commit();
          sendProgress('cleaning', 50, `Eliminados ${oldChunks.size} chunks antiguos`);
        }

        // Generate embeddings and save
        sendProgress('embedding', 52, `Generando embeddings para ${chunks.length} chunks...`);
        
        const { generateEmbedding } = await import('../../../../lib/embeddings');
        const { firestore } = await import('../../../../lib/firestore');
        
        let savedCount = 0;
        const batchSize = 10;
        
        for (let i = 0; i < chunks.length; i += batchSize) {
          const batchChunks = chunks.slice(i, i + batchSize);
          const batchNum = Math.floor(i / batchSize) + 1;
          const totalBatches = Math.ceil(chunks.length / batchSize);
          
          sendProgress('embedding', 52 + Math.floor((i / chunks.length) * 38), 
            `Procesando batch ${batchNum}/${totalBatches} (chunks ${i + 1}-${Math.min(i + batchSize, chunks.length)})...`);
          
          const batch = firestore.batch();
          
          for (const chunk of batchChunks) {
            try {
              const embedding = await generateEmbedding(chunk.text);
              
              const metadata: any = {
                startChar: chunk.startChar,
                endChar: chunk.endChar,
                tokenCount: chunk.tokenCount,
              };
              
              if (chunk.metadata?.startPage !== undefined) {
                metadata.startPage = chunk.metadata.startPage;
              }
              if (chunk.metadata?.endPage !== undefined) {
                metadata.endPage = chunk.metadata.endPage;
              }
              
              const docRef = firestore.collection('document_chunks').doc();
              batch.set(docRef, {
                sourceId,
                userId,
                sourceName: source.name,
                chunkIndex: chunk.chunkIndex,
                text: chunk.text,
                embedding,
                metadata,
                createdAt: new Date(),
              });
              
              savedCount++;
              
            } catch (error) {
              console.error(`  ⚠️ Failed to process chunk ${chunk.chunkIndex}:`, error);
            }
          }
          
          await batch.commit();
          sendProgress('embedding', 52 + Math.floor((savedCount / chunks.length) * 38), 
            `✓ Guardados ${savedCount}/${chunks.length} chunks`);
          
          // Small delay to avoid rate limiting
          if (i + batchSize < chunks.length) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }

        // Update metadata
        sendProgress('saving', 92, 'Actualizando metadata...');
        
        await updateContextSource(sourceId, {
          ragEnabled: true,
          ragMetadata: {
            chunkCount: savedCount,
            avgChunkSize: Math.round(chunks.reduce((sum, c) => sum + c.tokenCount, 0) / savedCount),
            indexedAt: new Date(),
            embeddingModel: 'text-embedding-004',
          },
        } as any);

        sendProgress('complete', 100, `✅ Completado: ${savedCount} chunks indexados`, {
          chunksCreated: savedCount,
          totalTokens: chunks.reduce((sum, c) => sum + c.tokenCount, 0),
        });

        controller.close();

      } catch (error) {
        console.error('❌ Re-indexing error:', error);
        sendProgress('error', 0, error instanceof Error ? error.message : 'Error desconocido');
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
};





