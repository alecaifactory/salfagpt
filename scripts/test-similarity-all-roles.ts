/**
 * Test Similarity for All User Roles
 * 
 * Verifies that RAG similarity works correctly for:
 * - SuperAdmin (alec@getaifactory.com)
 * - Admin (sorellanac@salfagestion.cl)
 * - User (fdiazt@salfagestion.cl)
 * - Supervisor (multiple)
 * - Especialista (multiple)
 */

import { BigQuery } from '@google-cloud/bigquery';

const PROJECT_ID = 'salfagpt';
const bigquery = new BigQuery({ projectId: PROJECT_ID });

interface UserTest {
  email: string;
  userId: string;
  role: string;
  agentId: string;
  agentName: string;
}

const USERS_TO_TEST: UserTest[] = [
  {
    email: 'alec@getaifactory.com',
    userId: 'usr_uhwqffaqag1wrryd82tw',
    role: 'superadmin',
    agentId: 'KfoKcDrb6pMnduAiLlrD',
    agentName: 'MAQSA Mantenimiento S2'
  },
  {
    email: 'sorellanac@salfagestion.cl',
    userId: 'usr_le7d1qco5iq07sy8yykg',
    role: 'admin',
    agentId: 'AjtQZEIMQvFnPRJRjl4y',
    agentName: 'GESTION BODEGAS GPT (S001)'
  },
  {
    email: 'fdiazt@salfagestion.cl',
    userId: 'usr_2uvqilsx8m7vr3evr0ch',
    role: 'user',
    agentId: 'fAPZHQaocTYLwInZlVaQ',
    agentName: 'GOP GPT M2'
  },
];

async function testAllRoles() {
  console.log('🧪 Testing RAG Similarity for All User Roles\n');
  console.log('='.repeat(100));
  
  const testQuery = "¿Cómo hago un pedido de convenio?";
  
  for (const user of USERS_TO_TEST) {
    console.log(`\n👤 Testing: ${user.role.toUpperCase()} - ${user.email}`);
    console.log('─'.repeat(100));
    console.log(`   User ID: ${user.userId}`);
    console.log(`   Agent: ${user.agentName} (${user.agentId})`);
    
    try {
      // 1. Check if user has chunks in BigQuery
      console.log('\n   1️⃣  Checking BigQuery chunks...');
      
      const countQuery = `
        SELECT COUNT(*) as total
        FROM \`salfagpt.flow_analytics.document_embeddings\`
        WHERE user_id = @userId
      `;
      
      const [countRows] = await bigquery.query({
        query: countQuery,
        params: { userId: user.userId }
      });
      
      const chunkCount = countRows[0]?.total || 0;
      console.log(`      Chunks in BigQuery: ${chunkCount}`);
      
      if (chunkCount === 0) {
        console.log(`      ❌ NO CHUNKS FOR THIS USER`);
        console.log(`         This user's documents are not indexed`);
        console.log(`         Expected: Fallback to full documents with 50%`);
        console.log(`         OR: No references if strict enforcement`);
        continue;
      }
      
      console.log(`      ✅ Chunks available`);
      
      // 2. Check if user can access shared agent's chunks
      console.log(`\n   2️⃣  Checking agent access...`);
      
      // Try to get effective owner (owner if shared, self if own)
      const agentDoc = await getAgentInfo(user.agentId);
      
      if (!agentDoc) {
        console.log(`      ⚠️ Agent not found`);
        continue;
      }
      
      const agentOwner = agentDoc.userId;
      const isShared = agentOwner !== user.userId;
      
      console.log(`      Agent owner: ${agentOwner}`);
      console.log(`      Is shared: ${isShared ? 'YES' : 'NO'}`);
      
      if (isShared) {
        // Check if owner has chunks
        const [ownerRows] = await bigquery.query({
          query: countQuery,
          params: { userId: agentOwner }
        });
        
        const ownerChunks = ownerRows[0]?.total || 0;
        console.log(`      Owner's chunks: ${ownerChunks}`);
        
        if (ownerChunks === 0) {
          console.log(`      ❌ OWNER HAS NO CHUNKS`);
          console.log(`         Shared agent but owner hasn't indexed docs`);
          continue;
        }
      }
      
      // 3. Test API call
      console.log(`\n   3️⃣  Testing API endpoint...`);
      console.log(`      Query: "${testQuery}"`);
      
      const response = await fetch(`http://localhost:3000/api/conversations/${user.agentId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.userId,
          userEmail: user.email,
          message: testQuery,
          model: 'gemini-2.5-flash',
          useAgentSearch: true,
          ragEnabled: true,
          ragTopK: 10,
          ragMinSimilarity: 0.7
        })
      });
      
      if (!response.ok) {
        console.log(`      ❌ API ERROR: HTTP ${response.status}`);
        continue;
      }
      
      const data = await response.json();
      const references = data.message?.references || [];
      const ragConfig = data.ragConfiguration || {};
      
      console.log(`\n      📊 API Response:`);
      console.log(`         RAG Used: ${ragConfig.actuallyUsed}`);
      console.log(`         References: ${references.length}`);
      
      if (references.length > 0) {
        console.log(`\n      📚 References with Similarities:`);
        
        const similarities = references
          .filter((r: any) => r.similarity !== undefined)
          .map((r: any) => r.similarity);
        
        const hasReal = similarities.some((s: number) => s !== 0.5 && s > 0.3);
        const all50 = similarities.every((s: number) => Math.abs(s - 0.5) < 0.001);
        
        references.slice(0, 5).forEach((ref: any) => {
          const sim = ref.similarity !== undefined ? (ref.similarity * 100).toFixed(1) + '%' : 'N/A';
          const quality = ref.similarity >= 0.8 ? '🟢' : 
                         ref.similarity >= 0.7 ? '🟢' :
                         ref.similarity >= 0.6 ? '🟡' :
                         ref.similarity >= 0.5 ? '🟠' : '🔴';
          console.log(`         [${ref.id}] ${sim} ${quality} - ${ref.sourceName.substring(0, 50)}...`);
        });
        
        if (hasReal) {
          console.log(`\n      ✅ SUCCESS: Showing REAL similarities (not 50%)`);
          console.log(`         Range: ${(Math.min(...similarities) * 100).toFixed(1)}% to ${(Math.max(...similarities) * 100).toFixed(1)}%`);
        } else if (all50) {
          console.log(`\n      ❌ FAIL: All similarities are 50% (fallback)`);
          console.log(`         This user is experiencing the bug`);
        } else {
          console.log(`\n      ⚠️ WARNING: Mixed results`);
        }
        
      } else {
        console.log(`\n      ℹ️  No references (similarity <70% or no chunks found)`);
        console.log(`         This may be correct if query doesn't match documents`);
      }
      
      console.log();
      
    } catch (error) {
      console.error(`\n   ❌ ERROR: ${error}`);
      if (error instanceof Error) {
        console.error(`      ${error.message}`);
      }
    }
  }
  
  console.log('\n' + '='.repeat(100));
  console.log('\n🎯 SUMMARY\n');
  console.log('If ALL users show REAL similarities (not 50%), the fix works for everyone ✅');
  console.log('If SOME users show 50%, those users need their chunks migrated');
  console.log('\n' + '='.repeat(100));
}

async function getAgentInfo(agentId: string): Promise<any> {
  try {
    const { firestore } = await import('../src/lib/firestore.js');
    const doc = await firestore.collection('conversations').doc(agentId).get();
    
    if (!doc.exists) {
      return null;
    }
    
    return {
      id: doc.id,
      userId: doc.data()?.userId,
      title: doc.data()?.title
    };
  } catch (error) {
    console.error('Error getting agent:', error);
    return null;
  }
}

testAllRoles();


