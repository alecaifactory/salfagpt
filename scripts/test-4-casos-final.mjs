#!/usr/bin/env node

import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { BigQuery } from '@google-cloud/bigquery';
import { GoogleGenAI } from '@google/genai';

const genAI = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY });

async function generateEmbedding(text) {
  const result = await genAI.models.embedContent({
    model: 'text-embedding-004',
    contents: [{ parts: [{ text }] }]
  });
  return result.embeddings[0].values;
}

if (getApps().length === 0) {
  initializeApp({ projectId: 'salfagpt' });
}

const db = getFirestore();
const bq = new BigQuery({ projectId: 'salfagpt' });

const USER_ID = 'usr_uhwqffaqag1wrryd82tw';
const DATASET = 'flow_analytics_east4';

const CASOS = [
  { id: 1, q: "Indicame que filtros debo utilizar para una mantencion de 2000 Hrs para una grua Sany CR900C", agent: '1lgr33ywq5qed67sqCYi', name: "S2-v2", orig: "Inaceptable" },
  { id: 2, q: "Camion tolva 10163090 TCBY-56 indica en el panel forros de frenos desgastados", agent: '1lgr33ywq5qed67sqCYi', name: "S2-v2", orig: "Sobresaliente" },
  { id: 3, q: "Cuanto torque se le debe suministrar a las ruedas del camion tolva 10163090 TCBY-56", agent: '1lgr33ywq5qed67sqCYi', name: "S2-v2", orig: "Aceptable" },
  { id: 4, q: "Cada cuantas horas se debe cambiar el aceite hidraulico en un camion pluma SCANIA P450", agent: 'vStojK73ZKbjNsEnqANJ', name: "M3-v2", orig: "Inaceptable" },
];

async function test(c) {
  console.log(`\n${'═'.repeat(70)}`);
  console.log(`CASO ${c.id}: ${c.q.substring(0, 50)}...`);
  console.log(`${c.name} | Eval original: ${c.orig}`);
  console.log('─'.repeat(70));
  
  const t0 = Date.now();
  
  const agent = await db.collection('conversations').doc(c.agent).get();
  const srcs = agent.data()?.activeContextSourceIds || [];
  console.log(`Sources: ${srcs.length} | `, new Date().toLocaleTimeString());
  
  if (srcs.length === 0) {
    console.log('❌ FALLO: Sin sources\n');
    return { id: c.id, ok: false, why: 'no-sources' };
  }
  
  const t1 = Date.now();
  const emb = await generateEmbedding(c.q);
  console.log(`Embedding: ${Date.now() - t1}ms | 768 dims ✅`);
  
  const t2 = Date.now();
  const sql = `
    WITH sims AS (
      SELECT source_id, full_text, metadata,
        (SELECT SUM(a*b)/(SQRT((SELECT SUM(a*a) FROM UNNEST(embedding) a))*SQRT((SELECT SUM(b*b) FROM UNNEST(@e) b)))
         FROM UNNEST(embedding) a WITH OFFSET p JOIN UNNEST(@e) b WITH OFFSET p2 ON p=p2) AS sim
      FROM \`salfagpt.${DATASET}.document_embeddings\`
      WHERE user_id=@u AND source_id IN UNNEST(@s)
    )
    SELECT * FROM sims WHERE sim>=0.6 ORDER BY sim DESC LIMIT 10
  `;
  
  const [rows] = await bq.query({ query: sql, params: { u: USER_ID, s: srcs.slice(0, 100), e: emb }, location: 'us-east4' });
  
  console.log(`BigQuery: ${Date.now() - t2}ms | Chunks: ${rows.length}`);
  
  if (rows.length === 0) {
    const tT = Date.now() - t0;
    console.log(`❌ FALLO: No docs ≥60% | Total: ${tT}ms (~${((tT + 4000) / 1000).toFixed(1)}s con Gemini)\n`);
    return { id: c.id, ok: false, why: 'no-docs-threshold', t: tT };
  }
  
  const ids = [...new Set(rows.map(r => r.source_id))];
  const names = await db.collection('context_sources').where('__name__', 'in', ids.slice(0, 10)).select('name').get();
  const nm = {};
  names.docs.forEach(d => { nm[d.id] = d.data().name; });
  
  const top = rows[0].sim;
  const avg = rows.reduce((s, r) => s + r.sim, 0) / rows.length;
  const tT = Date.now() - t0;
  const tFull = tT + 4000;
  
  console.log(`Top sim: ${(top * 100).toFixed(1)}% | Avg: ${(avg * 100).toFixed(1)}%`);
  console.log(`Top doc: ${nm[rows[0].source_id]?.substring(0, 50) || rows[0].source_id.substring(0, 10)}`);
  console.log(`Búsqueda: ${tT}ms | Con Gemini: ~${tFull}ms (~${(tFull / 1000).toFixed(1)}s)`);
  
  const q = top >= 0.7 ? '✅ ALTA (≥70%)' : top >= 0.6 ? '⚠️  MEDIA (60-70%)' : '❌ BAJA (<60%)';
  const ok = top >= 0.6;
  console.log(`Calidad: ${q} | Resultado: ${ok ? '✅ ÉXITO' : '❌ FALLO'}`);
  
  return { id: c.id, ok, top, avg, n: rows.length, tT, tFull, doc: nm[rows[0].source_id] };
}

console.log('🧪 TEST 4 CASOS - Threshold 0.6 | us-east4');
console.log('');

const res = [];
for (const c of CASOS) {
  const r = await test(c);
  res.push(r);
}

console.log('\n' + '═'.repeat(70));
console.log('📊 RESUMEN FINAL');
console.log('═'.repeat(70));

const ok = res.filter(r => r.ok);
const fail = res.filter(r => !r.ok);

console.log(`\n✅ Exitosos: ${ok.length}/4 (${(ok.length/4*100).toFixed(0)}%)`);
if (ok.length > 0) {
  const avgT = ok.reduce((s, r) => s + r.tFull, 0) / ok.length;
  const avgTop = ok.reduce((s, r) => s + r.top, 0) / ok.length;
  console.log(`   Avg tiempo: ~${(avgT / 1000).toFixed(1)}s`);
  console.log(`   Avg similarity: ${(avgTop * 100).toFixed(1)}%`);
  console.log(`   ${avgT < 8000 ? '✅ <8s OBJETIVO' : avgT < 10000 ? '⚠️  8-10s' : '❌ >10s'}`);
  
  console.log('\n   Detalles:');
  ok.forEach(r => {
    const caso = CASOS[r.id - 1];
    console.log(`   Caso ${r.id}: ${(r.top * 100).toFixed(1)}% | ~${(r.tFull / 1000).toFixed(1)}s | ${caso.orig} → ${r.top >= 0.7 ? 'Sobresaliente' : 'Aceptable'}`);
  });
}

if (fail.length > 0) {
  console.log(`\n❌ Fallidos: ${fail.length}/4`);
  fail.forEach(r => {
    const caso = CASOS[r.id - 1];
    console.log(`   Caso ${r.id}: ${r.why || 'unknown'} | ${caso.q.substring(0, 40)}...`);
  });
  console.log('\n   Acción: Cargar documentos faltantes para estos casos');
}

console.log('\n' + '═'.repeat(70));
console.log(ok.length >= 3 ? '🎯 SISTEMA FUNCIONANDO BIEN' : ok.length >= 1 ? '⚠️  FUNCIONAMIENTO PARCIAL' : '❌ REQUIERE ATENCIÓN');
console.log('═'.repeat(70) + '\n');

process.exit(0);

