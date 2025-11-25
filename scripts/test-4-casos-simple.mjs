#!/usr/bin/env node

import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { BigQuery } from '@google-cloud/bigquery';
import { GoogleGenAI } from '@google/genai';

if (getApps().length === 0) {
  initializeApp({ projectId: 'salfagpt' });
}

const db = getFirestore();
const bq = new BigQuery({ projectId: 'salfagpt' });
const genAI = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY });

const USER_ID = 'usr_uhwqffaqag1wrryd82tw';
const DATASET = 'flow_analytics_east4';

const CASOS = [
  {
    id: 1,
    q: "Indicame que filtros debo utilizar para una mantencion de 2000 Hrs para una grua Sany CR900C",
    agent: '1lgr33ywq5qed67sqCYi',
    name: "S2-v2",
    orig: "Inaceptable (1/5)",
  },
  {
    id: 2,
    q: "Camion tolva 10163090 TCBY-56 indica en el panel forros de frenos desgastados",
    agent: '1lgr33ywq5qed67sqCYi',
    name: "S2-v2",
    orig: "Sobresaliente (5/5)",
  },
  {
    id: 3,
    q: "Cuanto torque se le debe suministrar a las ruedas del camion tolva 10163090 TCBY-56",
    agent: '1lgr33ywq5qed67sqCYi',
    name: "S2-v2",
    orig: "Aceptable (2/5)",
  },
  {
    id: 4,
    q: "Cada cuantas horas se debe cambiar el aceite hidraulico en un camion pluma SCANIA P450",
    agent: 'vStojK73ZKbjNsEnqANJ',
    name: "M3-v2",
    orig: "Inaceptable (1/5)",
  },
];

async function genEmb(text) {
  const result = await genAI.models.embedContent({
    model: 'text-embedding-004',
    contents: [{ parts: [{ text }] }]
  });
  return result.embeddings[0].values;
}

async function test(caso) {
  console.log(`\n${'═'.repeat(70)}`);
  console.log(`CASO ${caso.id}: ${caso.q.substring(0, 50)}...`);
  console.log(`Agent: ${caso.name} | Original: ${caso.orig}`);
  console.log('─'.repeat(70));
  
  const t0 = Date.now();
  
  // Get sources
  const agent = await db.collection('conversations').doc(caso.agent).get();
  const sources = agent.data()?.activeContextSourceIds || [];
  console.log(`Sources: ${sources.length}`);
  
  if (sources.length === 0) {
    console.log('❌ Sin sources\n');
    return { case: caso.id, ok: false, why: 'no-sources' };
  }
  
  // Embedding
  const t1 = Date.now();
  const emb = await genEmb(caso.q);
  const tEmb = Date.now() - t1;
  console.log(`Embedding: ${tEmb}ms`);
  
  // Search
  const t2 = Date.now();
  const sql = `
    WITH sims AS (
      SELECT 
        source_id,
        full_text,
        metadata,
        (SELECT SUM(a*b)/( SQRT((SELECT SUM(a*a) FROM UNNEST(embedding) a))* SQRT((SELECT SUM(b*b) FROM UNNEST(@emb) b)))
         FROM UNNEST(embedding) a WITH OFFSET p JOIN UNNEST(@emb) b WITH OFFSET p2 ON p=p2) AS sim
      FROM \`salfagpt.${DATASET}.document_embeddings\`
      WHERE user_id=@uid AND source_id IN UNNEST(@srcs)
    )
    SELECT * FROM sims WHERE sim>=0.6 ORDER BY sim DESC LIMIT 10
  `;
  
  const [rows] = await bq.query({
    query: sql,
    params: { uid: USER_ID, srcs: sources.slice(0, 100), emb },
    location: 'us-east4',
  });
  
  const tSearch = Date.now() - t2;
  const tTotal = Date.now() - t0;
  
  console.log(`BigQuery: ${tSearch}ms | Found: ${rows.length} chunks`);
  
  if (rows.length === 0) {
    console.log(`❌ No docs (threshold 0.6) | Time: ${tTotal}ms\n`);
    return { case: caso.id, ok: false, why: 'no-docs', t: tTotal };
  }
  
  // Get names
  const ids = [...new Set(rows.map(r => r.source_id))];
  const names = await db.collection('context_sources')
    .where('__name__', 'in', ids.slice(0, 10))
    .select('name').get();
  
  const nameMap = {};
  names.docs.forEach(d => { nameMap[d.id] = d.data().name; });
  
  // Results
  const top = rows[0].sim;
  const avg = rows.reduce((s, r) => s + r.sim, 0) / rows.length;
  
  console.log(`Top: ${(top * 100).toFixed(1)}% | Avg: ${(avg * 100).toFixed(1)}%`);
  console.log(`Top doc: ${nameMap[rows[0].source_id]?.substring(0, 40) || 'N/A'}`);
  console.log(`Time: ${tTotal}ms búsqueda + ~4000ms Gemini = ~${tTotal + 4000}ms (~${((tTotal + 4000) / 1000).toFixed(1)}s)`);
  
  const quality = top >= 0.7 ? '✅ ALTA' : top >= 0.6 ? '⚠️  MEDIA' : '❌ BAJA';
  console.log(`Calidad: ${quality}`);
  
  return {
    case: caso.id,
    ok: top >= 0.6,
    top,
    avg,
    chunks: rows.length,
    tEmb,
    tSearch,
    tTotal,
    tFull: tTotal + 4000,
    topDoc: nameMap[rows[0].source_id],
  };
}

console.log('🧪 TEST 4 CASOS - CONFIGURACIÓN OPTIMIZADA');
console.log('Threshold: 0.6 | Dataset: us-east4');
console.log('');

const results = [];
for (const caso of CASOS) {
  const res = await test(caso);
  results.push(res);
}

console.log('\n' + '═'.repeat(70));
console.log('📊 RESUMEN');
console.log('═'.repeat(70));

const ok = results.filter(r => r.ok);
console.log(`\n✅ Exitosos: ${ok.length}/4`);
if (ok.length > 0) {
  const avgT = ok.reduce((s, r) => s + r.tFull, 0) / ok.length;
  console.log(`⏱️  Tiempo promedio: ~${(avgT / 1000).toFixed(1)}s`);
  console.log(avgT < 8000 ? '   ✅ <8s OBJETIVO CUMPLIDO' : avgT < 10000 ? '   ⚠️  8-10s Cercano' : '   ❌ >10s');
}

const fail = results.filter(r => !r.ok);
if (fail.length > 0) {
  console.log(`\n❌ Fallidos: ${fail.length}/4`);
  console.log('   Acción: Cargar documentos faltantes');
}

process.exit(0);

