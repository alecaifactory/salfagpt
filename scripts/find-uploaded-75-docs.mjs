#!/usr/bin/env node

/**
 * Find the actual 75 documents that were uploaded for S1-v2
 * WITHOUT assumptions about content
 */

import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

initializeApp({ projectId: 'salfagpt' });
const db = getFirestore();

async function findActual75Documents() {
  const userId = 'usr_uhwqffaqag1wrryd82tw';
  const agentId = 'iQmdg3bMSJ1AdqqlFpye';
  
  console.log('🔍 Looking for the 75 documents uploaded for S1-v2...\n');
  
  try {
    // Check if there's a specific upload batch or metadata
    // Let's look at what the user told us about S1-v2
    
    // Get the agent details
    const agentDoc = await db.collection('conversations').doc(agentId).get();
    const agentData = agentDoc.data();
    
    console.log('📋 S1-v2 Agent Information:');
    console.log(`   Title: ${agentData.title}`);
    console.log(`   Created: ${agentData.createdAt?.toDate?.()}`);
    console.log(`   System Prompt: ${(agentData.systemPrompt || '').substring(0, 200)}...`);
    console.log(`   Currently active sources: ${(agentData.activeContextSourceIds || []).length}`);
    
    // Check all sources and look for patterns
    const allSources = await db.collection('context_sources')
      .where('userId', '==', userId)
      .get();
    
    console.log(`\n📚 Total user sources: ${allSources.size}`);
    
    // Group sources by different criteria to help identify the batch
    const groupings = {
      byPrefix: new Map(),
      byExtension: new Map(),
      bySize: new Map()
    };
    
    allSources.docs.forEach(doc => {
      const data = doc.data();
      const name = data.name || '';
      
      // By prefix (first few chars)
      const prefix = name.split('-')[0] || name.substring(0, 3);
      if (!groupings.byPrefix.has(prefix)) {
        groupings.byPrefix.set(prefix, []);
      }
      groupings.byPrefix.get(prefix).push({ id: doc.id, name });
      
      // By extension
      const ext = name.split('.').pop()?.toLowerCase() || 'unknown';
      if (!groupings.byExtension.has(ext)) {
        groupings.byExtension.set(ext, []);
      }
      groupings.byExtension.get(ext).push({ id: doc.id, name });
      
      // By approximate size (if extractedData exists)
      if (data.extractedData) {
        const sizeCategory = Math.floor(data.extractedData.length / 10000) * 10;
        const sizeKey = `${sizeCategory}K`;
        if (!groupings.bySize.has(sizeKey)) {
          groupings.bySize.set(sizeKey, []);
        }
        groupings.bySize.get(sizeKey).push({ id: doc.id, name });
      }
    });
    
    // Show groupings that might be around 75 documents
    console.log('\n📊 Document groupings (looking for ~75 documents):');
    
    console.log('\n   By prefix:');
    const prefixEntries = Array.from(groupings.byPrefix.entries())
      .filter(([_, docs]) => docs.length >= 60 && docs.length <= 120)
      .sort((a, b) => b[1].length - a[1].length);
    
    prefixEntries.slice(0, 10).forEach(([prefix, docs]) => {
      console.log(`      ${prefix}*: ${docs.length} documents`);
      if (docs.length >= 70 && docs.length <= 80) {
        console.log(`         ⭐ CANDIDATE (close to 75)`);
        docs.slice(0, 3).forEach(d => console.log(`            - ${d.name}`));
      }
    });
    
    // Check what's currently assigned
    console.log('\n\n🔍 Currently assigned sources to S1-v2:');
    const currentAssignments = await db.collection('agent_sources')
      .where('agentId', '==', agentId)
      .get();
    
    console.log(`   Assignments: ${currentAssignments.size}`);
    
    if (currentAssignments.size > 0) {
      console.log('\n   Currently assigned documents:');
      const assignedIds = currentAssignments.docs.map(d => d.data().sourceId);
      
      // Get names
      for (const sourceId of assignedIds.slice(0, 20)) {
        const sourceDoc = await db.collection('context_sources').doc(sourceId).get();
        if (sourceDoc.exists) {
          console.log(`      - ${sourceDoc.data().name}`);
        }
      }
      
      if (assignedIds.length > 20) {
        console.log(`      ... and ${assignedIds.length - 20} more`);
      }
      
      // Analyze the pattern of currently assigned docs
      console.log('\n   📋 Pattern analysis of assigned documents:');
      const assignedDocs = await Promise.all(
        assignedIds.slice(0, 100).map(async id => {
          const doc = await db.collection('context_sources').doc(id).get();
          return doc.exists ? doc.data().name : null;
        })
      );
      
      const validDocs = assignedDocs.filter(Boolean);
      const commonPrefixes = new Map();
      
      validDocs.forEach(name => {
        const prefix = name.split('-')[0] || name.substring(0, 5);
        commonPrefixes.set(prefix, (commonPrefixes.get(prefix) || 0) + 1);
      });
      
      const topPrefixes = Array.from(commonPrefixes.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
      
      console.log('      Common prefixes in assigned docs:');
      topPrefixes.forEach(([prefix, count]) => {
        console.log(`         ${prefix}*: ${count} documents`);
      });
    }
    
    console.log('\n\n❓ QUESTION: Can you tell me:');
    console.log('   1. What topic/domain are these 75 documents about?');
    console.log('   2. Do they share a common prefix or pattern in their names?');
    console.log('   3. When were they uploaded (approximate date)?');
    console.log('   4. Were they uploaded via CLI or web interface?');
    console.log('\n   This will help me identify the EXACT 75 documents you want!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

findActual75Documents();

