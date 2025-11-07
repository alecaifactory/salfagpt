/**
 * Diagnostic script specifically for MAQSA Mantenimiento S2 agent
 * Checks why references are not showing for non-admin users
 * 
 * Usage:
 *   npx tsx scripts/diagnose-maqsa-references.ts
 */

import { firestore, COLLECTIONS } from '../src/lib/firestore';

async function diagnoseMaqsaReferences() {
  try {
    console.log('🔍 Diagnosing MAQSA Mantenimiento S2 - References Issue\n');
    console.log('='.repeat(80) + '\n');

    // Find MAQSA agent
    const agentsSnapshot = await firestore
      .collection(COLLECTIONS.CONVERSATIONS)
      .get();

    const maqsaAgent = agentsSnapshot.docs.find(doc => 
      doc.data().title?.includes('MAQSA Mantenimiento')
    );

    if (!maqsaAgent) {
      console.log('❌ MAQSA agent not found');
      process.exit(1);
    }

    const agentId = maqsaAgent.id;
    const agentData = maqsaAgent.data();

    console.log('📋 AGENT INFORMATION:');
    console.log(`   Title: ${agentData.title}`);
    console.log(`   ID: ${agentId}`);
    console.log(`   Owner userId: ${agentData.userId}`);
    console.log(`   Created: ${agentData.createdAt?.toDate().toISOString()}`);
    console.log('');

    // Check context sources assigned to this agent
    console.log('📚 CONTEXT SOURCES ASSIGNED TO AGENT:');
    const sourcesSnapshot = await firestore
      .collection(COLLECTIONS.CONTEXT_SOURCES)
      .where('assignedToAgents', 'array-contains', agentId)
      .get();

    console.log(`   Total sources: ${sourcesSnapshot.size}\n`);

    if (sourcesSnapshot.size === 0) {
      console.log('   ❌ PROBLEM FOUND: No context sources assigned to this agent!');
      console.log('   This is why no references are generated.');
      console.log('');
      console.log('   SOLUTION:');
      console.log('   1. Upload documents to this agent, OR');
      console.log('   2. Assign existing sources to this agent');
      console.log('');
      
      // Check if there are unassigned sources for this owner
      const ownerSourcesSnapshot = await firestore
        .collection(COLLECTIONS.CONTEXT_SOURCES)
        .where('userId', '==', agentData.userId)
        .get();
      
      const unassignedSources = ownerSourcesSnapshot.docs.filter(doc => {
        const data = doc.data();
        return !data.assignedToAgents || !data.assignedToAgents.includes(agentId);
      });
      
      if (unassignedSources.length > 0) {
        console.log(`   ℹ️ Found ${unassignedSources.length} sources owned by agent owner that are NOT assigned to this agent:`);
        unassignedSources.slice(0, 5).forEach(doc => {
          const data = doc.data();
          console.log(`     - ${data.name} (${data.type})`);
        });
        console.log('');
      }
      
      process.exit(1);
    }

    // List sources
    sourcesSnapshot.docs.forEach((doc, index) => {
      const sourceData = doc.data();
      console.log(`   ${index + 1}. ${sourceData.name}`);
      console.log(`      ID: ${doc.id}`);
      console.log(`      Owner: ${sourceData.userId}`);
      console.log(`      Type: ${sourceData.type}`);
      console.log(`      Status: ${sourceData.status}`);
      console.log(`      AssignedToAgents: ${sourceData.assignedToAgents?.join(', ') || 'none'}`);
      console.log('');
    });

    // Check if sources have chunks in Firestore (indexed for RAG)
    console.log('🔍 CHECKING IF SOURCES ARE INDEXED:');
    const sourceIds = sourcesSnapshot.docs.map(doc => doc.id);
    
    const chunksSnapshot = await firestore
      .collection('document_chunks')
      .where('sourceId', 'in', sourceIds.slice(0, 10)) // Firestore 'in' limit
      .limit(1)
      .get();

    if (chunksSnapshot.empty) {
      console.log('   ❌ PROBLEM FOUND: Sources exist but are NOT indexed!');
      console.log('   No chunks found in document_chunks collection');
      console.log('');
      console.log('   SOLUTION:');
      console.log('   Run the indexing process for these sources:');
      sourcesSnapshot.docs.forEach(doc => {
        console.log(`     npx tsx scripts/index-source.ts ${doc.id}`);
      });
      console.log('');
      process.exit(1);
    }

    console.log(`   ✅ Sources are indexed (found chunks in Firestore)\n`);

    // Check agent shares
    console.log('🔐 AGENT SHARING:');
    const sharesSnapshot = await firestore
      .collection(COLLECTIONS.AGENT_SHARES)
      .where('agentId', '==', agentId)
      .get();

    if (sharesSnapshot.empty) {
      console.log('   ℹ️ Agent is NOT explicitly shared');
      console.log('   Fallback mechanism will be used to access owner\'s sources\n');
    } else {
      console.log(`   ✅ Agent is shared (${sharesSnapshot.size} shares):\n`);
      sharesSnapshot.docs.forEach((doc, index) => {
        const shareData = doc.data();
        console.log(`   Share ${index + 1}:`);
        console.log(`     Type: ${shareData.sharedWithType}`);
        console.log(`     ID: ${shareData.sharedWithId}`);
        console.log(`     Access: ${shareData.accessLevel}`);
        console.log(`     Active: ${shareData.isActive}`);
        console.log('');
      });
    }

    // Check recent messages
    console.log('📨 RECENT MESSAGES:');
    const messagesSnapshot = await firestore
      .collection(COLLECTIONS.MESSAGES)
      .where('conversationId', '==', agentId)
      .orderBy('timestamp', 'desc')
      .limit(5)
      .get();

    console.log(`   Total messages: ${messagesSnapshot.size}\n`);

    messagesSnapshot.docs.forEach((doc, index) => {
      const msgData = doc.data();
      const hasRefs = msgData.references && msgData.references.length > 0;
      
      console.log(`   Message ${index + 1}:`);
      console.log(`     Role: ${msgData.role}`);
      console.log(`     Timestamp: ${msgData.timestamp?.toDate().toISOString()}`);
      console.log(`     References: ${hasRefs ? `✅ ${msgData.references.length}` : '❌ None'}`);
      
      if (hasRefs) {
        msgData.references.forEach((ref: any) => {
          console.log(`       [${ref.id}] ${ref.sourceName}`);
        });
      }
      console.log('');
    });

    // SUMMARY
    console.log('='.repeat(80));
    console.log('📊 DIAGNOSIS SUMMARY:\n');

    const hasContextSources = sourcesSnapshot.size > 0;
    const hasChunks = !chunksSnapshot.empty;
    const hasShares = sharesSnapshot.size > 0;
    const recentMessagesHaveRefs = messagesSnapshot.docs.some(doc => {
      const data = doc.data();
      return data.references && data.references.length > 0;
    });

    console.log(`✅ Agent exists: YES`);
    console.log(`${hasContextSources ? '✅' : '❌'} Context sources assigned: ${hasContextSources ? 'YES (' + sourcesSnapshot.size + ')' : 'NO'}`);
    console.log(`${hasChunks ? '✅' : '❌'} Sources indexed (chunks exist): ${hasChunks ? 'YES' : 'NO'}`);
    console.log(`${hasShares ? '✅' : 'ℹ️ '} Agent shared: ${hasShares ? 'YES (' + sharesSnapshot.size + ')' : 'NO (will use fallback)'}`);
    console.log(`${recentMessagesHaveRefs ? '✅' : '❌'} Recent messages have references: ${recentMessagesHaveRefs ? 'YES' : 'NO'}`);
    console.log('');

    if (hasContextSources && hasChunks) {
      console.log('✅ All prerequisites met - References SHOULD be working!');
      console.log('');
      console.log('If references still not showing for non-admin users:');
      console.log('   1. Check browser console for detailed logs');
      console.log('   2. Verify the fallback mechanism is executing');
      console.log('   3. Check if BigQuery search is returning results');
      console.log('');
      console.log('Next step: Test in browser with enhanced logging');
    } else if (!hasContextSources) {
      console.log('❌ Missing: Context sources');
      console.log('   Action: Upload documents to agent or assign existing sources');
    } else if (!hasChunks) {
      console.log('❌ Missing: Document indexing');
      console.log('   Action: Run indexing for the sources');
    }

    console.log('='.repeat(80));

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

diagnoseMaqsaReferences();

