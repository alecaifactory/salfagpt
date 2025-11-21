/**
 * Verify BigQuery Embeddings Sync
 * 
 * Compares Firestore document_chunks with BigQuery document_chunks_vectorized
 * to identify sync issues.
 * 
 * Usage:
 *   npx tsx scripts/verify-bigquery-embeddings.ts
 *   npx tsx scripts/verify-bigquery-embeddings.ts --agent=AGENT_ID
 *   npx tsx scripts/verify-bigquery-embeddings.ts --user=USER_ID
 */

import { firestore } from '../src/lib/firestore';
import { BigQuery } from '@google-cloud/bigquery';

const bigquery = new BigQuery({ projectId: 'salfagpt' });

interface VerificationReport {
  firestoreChunks: number;
  bigqueryChunks: number;
  firestoreSources: number;
  bigquerySources: number;
  syncRate: number;
  missingInBigQuery: number;
  status: 'ok' | 'warning' | 'critical';
  recommendations: string[];
}

async function verifyEmbeddings(
  agentId?: string,
  userId?: string
): Promise<VerificationReport> {
  console.log('🔍 Verificando sincronización de embeddings...\n');

  // 1. Count chunks in Firestore
  console.log('📊 Consultando Firestore...');
  let firestoreQuery = firestore.collection('document_chunks');
  
  if (agentId) {
    firestoreQuery = firestoreQuery.where('agentId', '==', agentId) as any;
    console.log(`   🎯 Filtrando por agente: ${agentId}`);
  }
  if (userId) {
    firestoreQuery = firestoreQuery.where('userId', '==', userId) as any;
    console.log(`   👤 Filtrando por usuario: ${userId}`);
  }
  
  const firestoreSnapshot = await firestoreQuery.get();
  const firestoreChunks = firestoreSnapshot.size;
  
  // Get unique source IDs
  const firestoreSources = new Set(
    firestoreSnapshot.docs.map(doc => doc.data().sourceId)
  ).size;
  
  console.log(`   ✅ Chunks en Firestore: ${firestoreChunks}`);
  console.log(`   ✅ Documentos únicos: ${firestoreSources}\n`);

  // 2. Count chunks in BigQuery
  console.log('📊 Consultando BigQuery...');
  
  let whereClause = '1=1';
  const params: any = {};
  
  if (userId) {
    whereClause += ' AND user_id = @userId';
    params.userId = userId;
  }
  
  const query = `
    SELECT 
      COUNT(*) as total_chunks,
      COUNT(DISTINCT source_id) as unique_sources
    FROM \`salfagpt.flow_rag_optimized.document_chunks_vectorized\`
    WHERE ${whereClause}
  `;
  
  const [rows] = await bigquery.query({ query, params });
  const bigqueryChunks = parseInt(rows[0].total_chunks || '0');
  const bigquerySources = parseInt(rows[0].unique_sources || '0');
  
  console.log(`   ✅ Chunks en BigQuery: ${bigqueryChunks}`);
  console.log(`   ✅ Documentos únicos: ${bigquerySources}\n`);

  // 3. Calculate sync rate
  const syncRate = firestoreChunks > 0 
    ? (bigqueryChunks / firestoreChunks) * 100 
    : 0;
  
  const missingInBigQuery = Math.max(0, firestoreChunks - bigqueryChunks);

  // 4. Determine status
  let status: 'ok' | 'warning' | 'critical';
  const recommendations: string[] = [];

  if (syncRate >= 95) {
    status = 'ok';
    recommendations.push('✅ Sync está funcionando correctamente');
  } else if (syncRate >= 50) {
    status = 'warning';
    recommendations.push('⚠️ Sync parcial detectado');
    recommendations.push('📋 Algunos chunks no se sincronizaron a BigQuery');
    recommendations.push('🔧 Recomendación: Re-sincronizar chunks faltantes');
  } else {
    status = 'critical';
    recommendations.push('🚨 CRÍTICO: Sync de BigQuery está fallando');
    recommendations.push('❌ La mayoría de chunks NO están en BigQuery');
    recommendations.push('❌ RAG NO funcionará correctamente');
    recommendations.push('🔧 ACCIÓN REQUERIDA: Re-sincronizar todos los chunks');
  }

  if (firestoreSources !== bigquerySources) {
    recommendations.push(`⚠️ Discrepancia en documentos: ${firestoreSources} en Firestore vs ${bigquerySources} en BigQuery`);
  }

  return {
    firestoreChunks,
    bigqueryChunks,
    firestoreSources,
    bigquerySources,
    syncRate,
    missingInBigQuery,
    status,
    recommendations
  };
}

function printReport(report: VerificationReport) {
  console.log('═'.repeat(70));
  console.log('📊 REPORTE DE VERIFICACIÓN DE EMBEDDINGS');
  console.log('═'.repeat(70));
  console.log();
  
  // Status badge
  const statusEmoji = {
    ok: '✅',
    warning: '⚠️',
    critical: '🚨'
  };
  
  console.log(`Estado: ${statusEmoji[report.status]} ${report.status.toUpperCase()}`);
  console.log();
  
  // Metrics
  console.log('📈 MÉTRICAS:');
  console.log(`   Chunks en Firestore:     ${report.firestoreChunks.toLocaleString()}`);
  console.log(`   Chunks en BigQuery:      ${report.bigqueryChunks.toLocaleString()}`);
  console.log(`   Documentos en Firestore: ${report.firestoreSources}`);
  console.log(`   Documentos en BigQuery:  ${report.bigquerySources}`);
  console.log(`   Tasa de sincronización:  ${report.syncRate.toFixed(1)}%`);
  console.log(`   Faltantes en BigQuery:   ${report.missingInBigQuery.toLocaleString()}`);
  console.log();
  
  // Recommendations
  console.log('💡 RECOMENDACIONES:');
  report.recommendations.forEach(rec => {
    console.log(`   ${rec}`);
  });
  console.log();
  
  console.log('═'.repeat(70));
}

async function main() {
  const args = process.argv.slice(2);
  
  let agentId: string | undefined;
  let userId: string | undefined;
  
  for (const arg of args) {
    if (arg.startsWith('--agent=')) {
      agentId = arg.split('=')[1];
    }
    if (arg.startsWith('--user=')) {
      userId = arg.split('=')[1];
    }
  }
  
  try {
    const report = await verifyEmbeddings(agentId, userId);
    printReport(report);
    
    // Exit code based on status
    process.exit(report.status === 'ok' ? 0 : 1);
    
  } catch (error) {
    console.error('❌ Error during verification:', error);
    process.exit(1);
  }
}

main();


