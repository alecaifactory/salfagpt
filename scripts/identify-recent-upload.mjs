#!/usr/bin/env node

/**
 * Identify the 75 documents from the recent upload batch
 */

import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

initializeApp({ projectId: 'salfagpt' });
const db = getFirestore();

async function identifyRecentUpload() {
  const userId = 'usr_uhwqffaqag1wrryd82tw';
  
  console.log('🔍 Identifying the 75 recently uploaded documents...\n');
  
  try {
    // Get all sources for user
    const allSources = await db.collection('context_sources')
      .where('userId', '==', userId)
      .get();
    
    console.log(`📚 Total sources: ${allSources.size}\n`);
    
    // Group by upload time (to find batch uploads)
    const sourcesByDate = new Map();
    
    allSources.docs.forEach(doc => {
      const data = doc.data();
      const createdAt = data.createdAt?.toDate();
      
      if (createdAt) {
        const dateKey = createdAt.toISOString().split('T')[0]; // Group by day
        if (!sourcesByDate.has(dateKey)) {
          sourcesByDate.set(dateKey, []);
        }
        sourcesByDate.get(dateKey).push({
          id: doc.id,
          name: data.name,
          createdAt,
          tags: data.tags || [],
          ragEnabled: data.ragEnabled || false
        });
      }
    });
    
    // Sort by date descending
    const sortedDates = Array.from(sourcesByDate.entries())
      .sort((a, b) => b[0].localeCompare(a[0]));
    
    console.log('📅 Upload batches by date:');
    sortedDates.slice(0, 10).forEach(([date, sources]) => {
      console.log(`\n   ${date}: ${sources.length} documents`);
      // Show first 5 from each batch
      sources.slice(0, 5).forEach(s => {
        console.log(`      - ${s.name}`);
      });
      if (sources.length > 5) {
        console.log(`      ... and ${sources.length - 5} more`);
      }
    });
    
    // Find batch with exactly or around 75 documents
    console.log('\n\n🎯 Looking for batch of ~75 documents...');
    const candidate75Batches = sortedDates.filter(([_, sources]) => 
      sources.length >= 70 && sources.length <= 80
    );
    
    if (candidate75Batches.length > 0) {
      console.log(`\n✅ Found ${candidate75Batches.length} candidate batch(es):`);
      candidate75Batches.forEach(([date, sources]) => {
        console.log(`\n   📦 ${date}: ${sources.length} documents`);
        console.log('      Sample documents:');
        sources.slice(0, 10).forEach(s => {
          console.log(`      - ${s.name}`);
        });
        if (sources.length > 10) {
          console.log(`      ... and ${sources.length - 10} more`);
        }
        
        // Check if SSOMA related
        const ssomaCount = sources.filter(s => 
          s.name.toUpperCase().includes('SSOMA') || 
          s.name.toUpperCase().includes('SEGURIDAD') ||
          s.name.toUpperCase().includes('SALUD')
        ).length;
        
        if (ssomaCount > 0) {
          console.log(`      ✅ Contains ${ssomaCount} SSOMA-related documents`);
        }
      });
      
      // Use the most recent batch
      const [targetDate, targetSources] = candidate75Batches[0];
      
      console.log(`\n\n📋 IDENTIFIED: ${targetSources.length} documents uploaded on ${targetDate}`);
      console.log('\nDocument IDs to assign to S1-v2:');
      console.log(JSON.stringify(targetSources.map(s => s.id), null, 2));
      
      // Save to file for next script
      const fs = await import('fs');
      fs.writeFileSync(
        'scripts/s1v2-source-ids.json',
        JSON.stringify({
          date: targetDate,
          count: targetSources.length,
          sourceIds: targetSources.map(s => s.id),
          sourceNames: targetSources.map(s => s.name)
        }, null, 2)
      );
      
      console.log('\n✅ Saved source IDs to: scripts/s1v2-source-ids.json');
      
    } else {
      console.log('\n⚠️  No batch of exactly 75 documents found.');
      console.log('\nPlease tell me:');
      console.log('  1. When were these documents uploaded (approximate date)?');
      console.log('  2. What are they about (SSOMA, procedures, etc.)?');
      console.log('  3. Any keywords in the document names?');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

identifyRecentUpload();

