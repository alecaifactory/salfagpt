/**
 * Analyze Context Sources by Tag and Agent Assignment
 * 
 * Creates comprehensive mapping table showing:
 * - Documents by tag
 * - Original userId (pre-migration)
 * - Current userId (post-migration)  
 * - Assigned agents
 * - Proper hash mapping needed
 */

import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import crypto from 'crypto';

const app = initializeApp({
  projectId: process.env.GOOGLE_CLOUD_PROJECT || 'salfagpt'
});

const db = getFirestore(app);

// Helper to generate usr_ format from email or Google ID
function generateUserId(input) {
  const hash = crypto.createHash('sha256')
    .update(input.toLowerCase())
    .digest('base64url')
    .substring(0, 20);
  return `usr_${hash}`;
}

async function analyzeSourceAssignments() {
  console.log('📊 Context Source Assignment Analysis');
  console.log('='.repeat(80));
  console.log('');

  // 1. Get all users
  console.log('Step 1: Loading users...');
  const usersSnapshot = await db.collection('users').get();
  
  const userMap = new Map();
  usersSnapshot.docs.forEach(doc => {
    const data = doc.data();
    userMap.set(doc.id, {
      docId: doc.id,
      email: data.email,
      googleUserId: data.googleUserId,
      role: data.role
    });
  });
  
  console.log(`  Found ${userMap.size} users\n`);

  // 2. Get all context sources
  console.log('Step 2: Loading context sources...');
  const sourcesSnapshot = await db.collection('context_sources').get();
  
  console.log(`  Found ${sourcesSnapshot.size} sources\n`);

  // 3. Group by tags
  const sourcesByTag = new Map();
  const sourcesWithoutTags = [];
  
  sourcesSnapshot.docs.forEach(doc => {
    const data = doc.data();
    const tags = data.tags || [];
    const labels = data.labels || [];
    const allTags = [...new Set([...tags, ...labels])];
    
    if (allTags.length === 0) {
      sourcesWithoutTags.push({ id: doc.id, data });
    } else {
      allTags.forEach(tag => {
        if (!sourcesByTag.has(tag)) {
          sourcesByTag.set(tag, []);
        }
        sourcesByTag.get(tag).push({ id: doc.id, data });
      });
    }
  });

  console.log(`  Tags found: ${sourcesByTag.size}`);
  console.log(`  Sources without tags: ${sourcesWithoutTags.length}\n`);

  // 4. For each tag, show assignment details
  console.log('Step 3: Building assignment table...\n');
  console.log('='.repeat(80));
  console.log('');

  const allMappings = [];

  for (const [tag, sources] of Array.from(sourcesByTag.entries()).sort()) {
    console.log(`📌 TAG: ${tag} (${sources.length} sources)`);
    console.log('─'.repeat(80));
    
    for (const source of sources.slice(0, 10)) { // Limit to first 10 per tag
      const data = source.data;
      const userId = data.userId;
      const assignedAgents = data.assignedToAgents || [];
      
      // Get user info
      const userInfo = userMap.get(userId) || {};
      
      // Build mapping entry
      const mapping = {
        tag,
        sourceId: source.id,
        sourceName: data.name || 'Unknown',
        currentUserId: userId,
        userEmail: userInfo.email || 'Unknown',
        googleUserId: userInfo.googleUserId || data.googleUserId || 'Unknown',
        assignedAgents: assignedAgents.length,
        agentIds: assignedAgents.slice(0, 3).join(', ') + (assignedAgents.length > 3 ? '...' : ''),
        ragEnabled: data.ragEnabled || false,
        hasChunks: !!data.ragEnabled,
      };
      
      allMappings.push(mapping);
      
      console.log(`  Source: ${source.id}`);
      console.log(`    Name: ${data.name}`);
      console.log(`    Current userId: ${userId}`);
      console.log(`    User email: ${userInfo.email || 'N/A'}`);
      console.log(`    Google ID: ${userInfo.googleUserId || 'N/A'}`);
      console.log(`    Assigned agents: ${assignedAgents.length} (${assignedAgents.slice(0, 2).join(', ')}${assignedAgents.length > 2 ? '...' : ''})`);
      console.log(`    RAG enabled: ${data.ragEnabled ? 'Yes' : 'No'}`);
      console.log('');
    }
    
    if (sources.length > 10) {
      console.log(`  ... and ${sources.length - 10} more sources\n`);
    }
  }

  // 5. Generate comprehensive mapping table
  console.log('');
  console.log('='.repeat(80));
  console.log('📋 COMPREHENSIVE MAPPING TABLE');
  console.log('='.repeat(80));
  console.log('');

  // CSV format
  console.log('Tag,Source ID,Source Name,Current userId,User Email,Google ID,Assigned Agents,Suggested Hash ID');
  
  for (const m of allMappings) {
    const suggestedHashId = m.googleUserId !== 'Unknown' 
      ? generateUserId(m.googleUserId)
      : m.currentUserId;
    
    console.log(`${m.tag},"${m.sourceId}","${m.sourceName}","${m.currentUserId}","${m.userEmail}","${m.googleUserId}",${m.assignedAgents},"${suggestedHashId}"`);
  }

  console.log('');
  console.log('='.repeat(80));
  console.log('📊 SUMMARY BY TAG');
  console.log('='.repeat(80));
  console.log('');

  for (const [tag, sources] of Array.from(sourcesByTag.entries()).sort()) {
    const uniqueUsers = new Set(sources.map(s => s.data.userId)).size;
    const totalAssignments = sources.reduce((sum, s) => sum + (s.data.assignedToAgents?.length || 0), 0);
    const ragEnabled = sources.filter(s => s.data.ragEnabled).length;
    
    console.log(`${tag}:`);
    console.log(`  Sources: ${sources.length}`);
    console.log(`  Users: ${uniqueUsers}`);
    console.log(`  Total agent assignments: ${totalAssignments}`);
    console.log(`  RAG-enabled: ${ragEnabled}`);
    console.log('');
  }

  process.exit(0);
}

analyzeSourceAssignments().catch(console.error);

