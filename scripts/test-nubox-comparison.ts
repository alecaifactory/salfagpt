/**
 * Test Script: Compare Current vs Improved Nubox Extraction
 * 
 * Purpose: Test both implementations with real bank statement PDFs
 * and show the differences in output
 */

import fs from 'fs';
import path from 'path';

// Import both implementations
import { extractNuboxCartola as extractCurrent } from '../src/lib/nubox-cartola-extraction.js';
import { extractNuboxCartolaImproved as extractImproved } from '../src/lib/nubox-cartola-extraction-improved.js';

const CARTOLAS_DIR = '/Users/alec/salfagpt/upload-queue/cartolas';

interface ComparisonResult {
  fileName: string;
  current: any;
  improved: any;
  differences: {
    amountParsing: string[];
    holderIdFormat: string[];
    currencyType: string[];
    insightsKey: string[];
  };
}

async function testFile(filePath: string): Promise<ComparisonResult> {
  const fileName = path.basename(filePath);
  console.log(`\n${'='.repeat(80)}`);
  console.log(`📄 Testing: ${fileName}`);
  console.log('='.repeat(80));
  
  const buffer = fs.readFileSync(filePath);
  
  console.log('🔄 Running CURRENT implementation...');
  let currentResult;
  try {
    currentResult = await extractCurrent(buffer, {
      fileName,
      model: 'gemini-2.5-flash',
    });
    console.log(`✅ Current: ${currentResult.movements.length} movements extracted`);
  } catch (error) {
    console.error(`❌ Current failed:`, error instanceof Error ? error.message : error);
    currentResult = { error: error instanceof Error ? error.message : 'Unknown error' };
  }
  
  console.log('\n🔄 Running IMPROVED implementation...');
  let improvedResult;
  try {
    improvedResult = await extractImproved(buffer, {
      fileName,
      model: 'gemini-2.5-flash',
    });
    console.log(`✅ Improved: ${improvedResult.movements.length} movements extracted`);
  } catch (error) {
    console.error(`❌ Improved failed:`, error instanceof Error ? error.message : error);
    improvedResult = { error: error instanceof Error ? error.message : 'Unknown error' };
  }
  
  // Analyze differences
  const differences = {
    amountParsing: [] as string[],
    holderIdFormat: [] as string[],
    currencyType: [] as string[],
    insightsKey: [] as string[],
  };
  
  if (currentResult.movements && improvedResult.movements) {
    // Compare first 3 movements
    const compareCount = Math.min(3, currentResult.movements.length, improvedResult.movements.length);
    
    for (let i = 0; i < compareCount; i++) {
      const curr = currentResult.movements[i];
      const impr = improvedResult.movements[i];
      
      // Amount parsing differences
      if (curr.amount !== impr.amount) {
        differences.amountParsing.push(
          `Movement ${i + 1}: Current=${curr.amount} vs Improved=${impr.amount}`
        );
      }
      
      // holder_id format
      if (curr.sender_account?.holder_id !== impr.sender_account?.holder_id) {
        differences.holderIdFormat.push(
          `Movement ${i + 1}: Current="${curr.sender_account?.holder_id || 'N/A'}" vs Improved="${impr.sender_account?.holder_id || 'N/A'}"`
        );
      }
      
      // Currency type
      if (curr.currency !== impr.currency) {
        differences.currencyType.push(
          `Movement ${i + 1}: Current=${JSON.stringify(curr.currency)} vs Improved=${JSON.stringify(impr.currency)}`
        );
      }
      
      // Insights key
      const currInsights = curr.insights;
      const imprInsights = impr.insights;
      
      const currHasOldKey = currInsights && ('cercania % de extraccion' in currInsights);
      const imprHasNewKey = imprInsights && ('extraction_proximity_pct' in imprInsights);
      
      if (currHasOldKey !== imprHasNewKey) {
        differences.insightsKey.push(
          `Movement ${i + 1}: Key naming changed`
        );
      }
    }
  }
  
  return {
    fileName,
    current: currentResult,
    improved: improvedResult,
    differences,
  };
}

function printDifferences(result: ComparisonResult) {
  console.log(`\n${'─'.repeat(80)}`);
  console.log(`📊 DIFFERENCES FOUND IN: ${result.fileName}`);
  console.log('─'.repeat(80));
  
  let hasDifferences = false;
  
  if (result.differences.amountParsing.length > 0) {
    console.log('\n🔴 AMOUNT PARSING DIFFERENCES:');
    result.differences.amountParsing.forEach(diff => console.log(`   ${diff}`));
    hasDifferences = true;
  }
  
  if (result.differences.holderIdFormat.length > 0) {
    console.log('\n🔴 HOLDER_ID FORMAT DIFFERENCES:');
    result.differences.holderIdFormat.forEach(diff => console.log(`   ${diff}`));
    hasDifferences = true;
  }
  
  if (result.differences.currencyType.length > 0) {
    console.log('\n🔴 CURRENCY TYPE DIFFERENCES:');
    result.differences.currencyType.forEach(diff => console.log(`   ${diff}`));
    hasDifferences = true;
  }
  
  if (result.differences.insightsKey.length > 0) {
    console.log('\n⚠️  INSIGHTS KEY NAMING:');
    result.differences.insightsKey.forEach(diff => console.log(`   ${diff}`));
    hasDifferences = true;
  }
  
  if (!hasDifferences) {
    console.log('\n✅ No significant differences found');
  }
}

function printMovementComparison(result: ComparisonResult) {
  if (!result.current.movements || !result.improved.movements) return;
  
  console.log(`\n${'─'.repeat(80)}`);
  console.log(`📋 SAMPLE MOVEMENT COMPARISON (First Movement)`);
  console.log('─'.repeat(80));
  
  const curr = result.current.movements[0];
  const impr = result.improved.movements[0];
  
  if (!curr || !impr) return;
  
  console.log('\n📌 CURRENT IMPLEMENTATION:');
  console.log(JSON.stringify(curr, null, 2));
  
  console.log('\n📌 IMPROVED IMPLEMENTATION:');
  console.log(JSON.stringify(impr, null, 2));
  
  console.log('\n🔍 KEY DIFFERENCES:');
  console.log(`   amount:      ${curr.amount} → ${impr.amount}`);
  console.log(`   holder_id:   "${curr.sender_account?.holder_id || 'N/A'}" → "${impr.sender_account?.holder_id || 'N/A'}"`);
  console.log(`   currency:    ${JSON.stringify(curr.currency)} → ${JSON.stringify(impr.currency)}`);
  console.log(`   insights:    ${curr.insights ? (('cercania % de extraccion' in curr.insights) ? 'old key' : 'new key') : 'N/A'} → ${impr.insights ? 'new key' : 'N/A'}`);
}

async function main() {
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║     NUBOX EXTRACTION COMPARISON TEST                          ║
║     Current vs Improved Implementation                        ║
╚═══════════════════════════════════════════════════════════════╝
  `);
  
  // Get all PDF files
  const files = fs.readdirSync(CARTOLAS_DIR)
    .filter(f => f.endsWith('.pdf'))
    .map(f => path.join(CARTOLAS_DIR, f));
  
  console.log(`📁 Found ${files.length} cartola PDFs`);
  console.log(`📍 Location: ${CARTOLAS_DIR}`);
  
  // Test the first file (Banco de Chile) for detailed comparison
  console.log(`\n🎯 Running detailed test on first file...`);
  
  const firstFile = files[0];
  const result = await testFile(firstFile);
  
  // Print detailed comparison
  printDifferences(result);
  printMovementComparison(result);
  
  // Summary
  console.log(`\n${'═'.repeat(80)}`);
  console.log(`📊 TEST SUMMARY`);
  console.log('═'.repeat(80));
  
  if (result.current.error) {
    console.log(`\n❌ Current implementation: FAILED`);
    console.log(`   Error: ${result.current.error}`);
  } else {
    console.log(`\n✅ Current implementation: ${result.current.movements?.length || 0} movements`);
    console.log(`   Cost: $${result.current.metadata?.cost.toFixed(4) || 'N/A'}`);
    console.log(`   Time: ${(result.current.metadata?.extraction_time / 1000).toFixed(1) || 'N/A'}s`);
  }
  
  if (result.improved.error) {
    console.log(`\n❌ Improved implementation: FAILED`);
    console.log(`   Error: ${result.improved.error}`);
  } else {
    console.log(`\n✅ Improved implementation: ${result.improved.movements?.length || 0} movements`);
    console.log(`   Cost: $${result.improved.metadata?.cost.toFixed(4) || 'N/A'}`);
    console.log(`   Time: ${(result.improved.metadata?.extraction_time / 1000).toFixed(1) || 'N/A'}s`);
  }
  
  console.log(`\n${'═'.repeat(80)}`);
  console.log(`🔍 REVIEW COMPLETE`);
  console.log(`\nNext steps:`);
  console.log(`  1. Review the differences above`);
  console.log(`  2. Check docs/IMPLEMENTATION_REVIEW_COMPARISON.md for details`);
  console.log(`  3. Decide which implementation to use`);
  console.log('═'.repeat(80));
}

// Run the test
main().catch(console.error);

