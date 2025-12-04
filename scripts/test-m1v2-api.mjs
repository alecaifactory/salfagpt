#!/usr/bin/env node
/**
 * Test M1-v2 Share API
 * 
 * Simulates what the frontend does when loading shares
 */

import fetch from 'node-fetch';

const M1_AGENT_ID = 'cjn3bC0HrUYtHqu69CKS';
const API_URL = 'http://localhost:3000'; // or production URL

async function main() {
  console.log('\n🔍 Testing M1-v2 Share API\n');
  console.log(`Agent ID: ${M1_AGENT_ID}`);
  console.log(`Endpoint: /api/agents/${M1_AGENT_ID}/share\n`);
  
  try {
    const response = await fetch(`${API_URL}/api/agents/${M1_AGENT_ID}/share`);
    
    console.log(`Status: ${response.status}`);
    console.log(`OK: ${response.ok}\n`);
    
    if (!response.ok) {
      const text = await response.text();
      console.log(`❌ Error response:`);
      console.log(text);
      process.exit(1);
    }
    
    const data = await response.json();
    
    console.log(`✅ Response received:`);
    console.log(`   shares array length: ${data.shares?.length || 0}`);
    
    if (data.shares && data.shares.length > 0) {
      console.log(`\nFirst share document:`);
      const share = data.shares[0];
      console.log(`   id: ${share.id}`);
      console.log(`   agentId: ${share.agentId}`);
      console.log(`   sharedWith length: ${share.sharedWith?.length || 0}`);
      
      if (share.sharedWith && share.sharedWith.length > 0) {
        console.log(`\n   First 3 users in sharedWith:`);
        share.sharedWith.slice(0, 3).forEach((user, idx) => {
          console.log(`     ${idx + 1}. ${user.email} (${user.name || 'no name'})`);
        });
      } else {
        console.log(`\n   ❌ sharedWith array is EMPTY or MISSING`);
      }
    } else {
      console.log(`\n❌ shares array is EMPTY`);
      console.log(`   This is why UI shows 0 users`);
    }
    
    console.log(`\n📋 Full response structure:`);
    console.log(JSON.stringify({
      hasShares: !!data.shares,
      sharesLength: data.shares?.length || 0,
      firstShareId: data.shares?.[0]?.id,
      firstShareHasSharedWith: !!data.shares?.[0]?.sharedWith,
      firstShareSharedWithLength: data.shares?.[0]?.sharedWith?.length || 0
    }, null, 2));
    
  } catch (error) {
    console.error('❌ Error calling API:', error.message);
    process.exit(1);
  }
  
  process.exit(0);
}

main();




