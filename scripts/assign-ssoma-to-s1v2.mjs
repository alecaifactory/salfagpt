#!/usr/bin/env node

/**
 * Assign SSOMA documents to S1-v2
 * User can specify how many (75 or all 110)
 */

import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

initializeApp({ projectId: 'salfagpt' });
const db = getFirestore();

async function assignSSOMAToS1v2() {
  const userId = 'usr_uhwqffaqag1wrryd82tw';
  const agentId = 'iQmdg3bMSJ1AdqqlFpye';
  
  // Get command line argument for count (default 75)
  const count = parseInt(process.argv[2]) || 75;
  
  console.log(`🔧 Assigning ${count} SSOMA documents to S1-v2...\n`);
  
  try {
    // Load categories
    const categories = JSON.parse(readFileSync('scripts/document-categories.json', 'utf8'));
    const ssomaSourceIds = categories.ssoma.sourceIds;
    const ssomaSourceNames = categories.ssoma.sourceNames;
    
    console.log(`📚 Found ${ssomaSourceIds.length} SSOMA documents`);
    
    // Take only the first N documents
    const sourceIdsToAssign = ssomaSourceIds.slice(0, count);
    const sourceNamesToShow = ssomaSourceNames.slice(0, count);
    
    console.log(`✅ Will assign ${sourceIdsToAssign.length} documents\n`);
    
    // Step 1: Remove existing assignments
    console.log('Step 1: Removing existing assignments...');
    const existingAssignments = await db.collection('agent_sources')
      .where('agentId', '==', agentId)
      .get();
    
    if (existingAssignments.size > 0) {
      let batch = db.batch();
      let deleteCount = 0;
      
      for (const doc of existingAssignments.docs) {
        batch.delete(doc.ref);
        deleteCount++;
        
        if (deleteCount % 400 === 0) {
          await batch.commit();
          batch = db.batch();
        }
      }
      
      if (deleteCount % 400 !== 0) {
        await batch.commit();
      }
      
      console.log(`   Removed ${deleteCount} old assignments\n`);
    } else {
      console.log('   No existing assignments to remove\n');
    }
    
    // Step 2: Create new assignments
    console.log('Step 2: Creating new assignments...');
    let batch = db.batch();
    let assignCount = 0;
    
    for (const sourceId of sourceIdsToAssign) {
      const assignmentRef = db.collection('agent_sources').doc();
      batch.set(assignmentRef, {
        agentId,
        sourceId,
        userId,
        assignedAt: FieldValue.serverTimestamp(),
        assignedBy: userId
      });
      assignCount++;
      
      if (assignCount % 400 === 0) {
        await batch.commit();
        batch = db.batch();
      }
    }
    
    if (assignCount % 400 !== 0) {
      await batch.commit();
    }
    
    console.log(`✅ Created ${assignCount} assignments\n`);
    
    // Step 3: Enable sources on agent
    console.log('Step 3: Enabling sources on S1-v2...');
    await db.collection('conversations').doc(agentId).update({
      activeContextSourceIds: sourceIdsToAssign,
      updatedAt: FieldValue.serverTimestamp()
    });
    
    console.log(`✅ Enabled ${sourceIdsToAssign.length} sources\n`);
    
    // Step 4: Show sample of assigned documents
    console.log('📋 Sample of assigned documents:');
    sourceNamesToShow.slice(0, 15).forEach((name, idx) => {
      console.log(`   ${idx + 1}. ${name}`);
    });
    if (sourceNamesToShow.length > 15) {
      console.log(`   ... and ${sourceNamesToShow.length - 15} more`);
    }
    
    console.log('\n🎉 SUCCESS! S1-v2 now has SSOMA documents assigned\n');
    console.log('📝 Next steps:');
    console.log('  1. Refresh SalfaGPT in your browser');
    console.log('  2. Select S1-v2 agent');
    console.log('  3. Ask a question about SSOMA procedures');
    console.log('  4. RAG should now work with these documents!');
    console.log('\n💡 To assign all 110 SSOMA docs instead: node scripts/assign-ssoma-to-s1v2.mjs 110');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

assignSSOMAToS1v2();

