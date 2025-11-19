#!/usr/bin/env node

/**
 * Find SSOMA documents for S1-v2
 */

import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

initializeApp({ projectId: 'salfagpt' });
const db = getFirestore();

async function findSSOMADocuments() {
  const userId = 'usr_uhwqffaqag1wrryd82tw';
  
  console.log('🔍 Searching for SSOMA-related documents...\n');
  
  try {
    // Get all sources for user
    const allSources = await db.collection('context_sources')
      .where('userId', '==', userId)
      .get();
    
    console.log(`📚 Total sources: ${allSources.size}\n`);
    
    // Search for SSOMA-related documents
    const ssomaKeywords = ['SSOMA', 'SEGURIDAD', 'SALUD', 'RIESGO', 'PROCEDIMIENTO'];
    
    const categorizedDocs = {
      ssoma: [],
      gop: [],
      maq: [],
      ddu: [],
      other: []
    };
    
    allSources.docs.forEach(doc => {
      const data = doc.data();
      const name = data.name || '';
      const upperName = name.toUpperCase();
      
      const docInfo = {
        id: doc.id,
        name: data.name,
        ragEnabled: data.ragEnabled || false,
        extractedData: !!data.extractedData
      };
      
      if (ssomaKeywords.some(keyword => upperName.includes(keyword))) {
        categorizedDocs.ssoma.push(docInfo);
      } else if (upperName.startsWith('GOP-')) {
        categorizedDocs.gop.push(docInfo);
      } else if (upperName.startsWith('MAQ-')) {
        categorizedDocs.maq.push(docInfo);
      } else if (upperName.startsWith('DDU')) {
        categorizedDocs.ddu.push(docInfo);
      } else {
        categorizedDocs.other.push(docInfo);
      }
    });
    
    console.log('📊 Document categories:\n');
    console.log(`   SSOMA documents: ${categorizedDocs.ssoma.length}`);
    console.log(`   GOP documents: ${categorizedDocs.gop.length}`);
    console.log(`   MAQ documents: ${categorizedDocs.maq.length}`);
    console.log(`   DDU documents: ${categorizedDocs.ddu.length}`);
    console.log(`   Other documents: ${categorizedDocs.other.length}`);
    
    // Show SSOMA documents
    if (categorizedDocs.ssoma.length > 0) {
      console.log(`\n\n✅ Found ${categorizedDocs.ssoma.length} SSOMA documents:`);
      categorizedDocs.ssoma.forEach((doc, idx) => {
        if (idx < 20) {
          console.log(`   ${idx + 1}. ${doc.name} (RAG: ${doc.ragEnabled ? '✅' : '❌'})`);
        }
      });
      
      if (categorizedDocs.ssoma.length > 20) {
        console.log(`   ... and ${categorizedDocs.ssoma.length - 20} more`);
      }
      
      // If we have exactly 75 SSOMA docs, that's likely the batch
      if (categorizedDocs.ssoma.length === 75) {
        console.log('\n🎯 PERFECT MATCH: Exactly 75 SSOMA documents!');
        console.log('   These are likely the documents to assign to S1-v2');
      }
    }
    
    // Ask user which category
    console.log('\n\n❓ Which documents should be assigned to S1-v2?');
    console.log('   Based on the categories above:');
    console.log(`   - If S1-v2 is for SSOMA topics: Use ${categorizedDocs.ssoma.length} SSOMA documents`);
    console.log(`   - If S1-v2 is for GOP procedures: Use ${categorizedDocs.gop.length} GOP documents`);
    console.log(`   - If S1-v2 is for MAQ (machinery): Use ${categorizedDocs.maq.length} MAQ documents`);
    console.log(`   - If S1-v2 is for DDU (urban dev): Use ${categorizedDocs.ddu.length} DDU documents`);
    
    // Save all categories for reference
    const fs = await import('fs');
    fs.writeFileSync(
      'scripts/document-categories.json',
      JSON.stringify({
        ssoma: {
          count: categorizedDocs.ssoma.length,
          sourceIds: categorizedDocs.ssoma.map(d => d.id),
          sourceNames: categorizedDocs.ssoma.map(d => d.name)
        },
        gop: {
          count: categorizedDocs.gop.length,
          sourceIds: categorizedDocs.gop.map(d => d.id),
          sourceNames: categorizedDocs.gop.map(d => d.name)
        },
        maq: {
          count: categorizedDocs.maq.length,
          sourceIds: categorizedDocs.maq.map(d => d.id),
          sourceNames: categorizedDocs.maq.map(d => d.name)
        },
        ddu: {
          count: categorizedDocs.ddu.length,
          sourceIds: categorizedDocs.ddu.map(d => d.id),
          sourceNames: categorizedDocs.ddu.map(d => d.name)
        }
      }, null, 2)
    );
    
    console.log('\n✅ Saved categories to: scripts/document-categories.json');
    console.log('\n💡 Tell me which category should be assigned to S1-v2!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

findSSOMADocuments();

