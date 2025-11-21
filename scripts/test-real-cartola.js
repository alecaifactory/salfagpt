/**
 * Test Real Cartola - Direct Import Test
 * Tests the new implementation with a real PDF
 */

import fs from 'fs';
import { extractNuboxCartola } from '../src/lib/nubox-cartola-extraction.js';

const PDF_PATH = '/Users/alec/salfagpt/upload-queue/cartolas/Banco de Chile.pdf';

console.log(`
╔═══════════════════════════════════════════════════════════════╗
║         REAL CARTOLA TEST - Banco de Chile                    ║
╚═══════════════════════════════════════════════════════════════╝
`);

async function testRealCartola() {
  try {
    console.log('📄 Loading PDF...');
    console.log(`   File: ${PDF_PATH}`);
    
    if (!fs.existsSync(PDF_PATH)) {
      throw new Error(`PDF not found: ${PDF_PATH}`);
    }
    
    const buffer = fs.readFileSync(PDF_PATH);
    const fileSizeMB = (buffer.length / (1024 * 1024)).toFixed(2);
    console.log(`   Size: ${fileSizeMB} MB`);
    console.log('');
    
    console.log('🚀 Starting extraction with NEW IMPLEMENTATION...');
    console.log('   Model: gemini-2.5-flash');
    console.log('   Bank: auto-detect');
    console.log('');
    
    const startTime = Date.now();
    
    const result = await extractNuboxCartola(buffer, {
      fileName: 'Banco de Chile.pdf',
      model: 'gemini-2.5-flash',
      currency: 'CLP',
    });
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    
    console.log('─'.repeat(80));
    console.log('✅ EXTRACTION COMPLETE!');
    console.log('─'.repeat(80));
    console.log('');
    
    // Summary
    console.log('📊 SUMMARY:');
    console.log(`   Bank:       ${result.bank_name}`);
    console.log(`   Account:    ${result.account_number}`);
    console.log(`   Holder:     ${result.account_holder}`);
    console.log(`   RUT:        ${result.account_holder_rut}`);
    console.log(`   Period:     ${result.period_start} → ${result.period_end}`);
    console.log(`   Movements:  ${result.movements.length}`);
    console.log(`   Duration:   ${duration}s`);
    console.log(`   Cost:       $${result.metadata.cost.toFixed(4)}`);
    console.log(`   Confidence: ${(result.metadata.confidence * 100).toFixed(1)}%`);
    console.log('');
    
    // Balance
    console.log('💰 BALANCE:');
    console.log(`   Opening:    $${result.opening_balance.toLocaleString()}`);
    console.log(`   Credits:    +$${result.total_credits.toLocaleString()}`);
    console.log(`   Debits:     -$${result.total_debits.toLocaleString()}`);
    console.log(`   Closing:    $${result.closing_balance.toLocaleString()}`);
    console.log('');
    
    // Quality
    console.log('⭐ QUALITY:');
    console.log(`   Fields Complete:    ${result.quality.fields_complete ? '✅' : '❌'}`);
    console.log(`   Movements Complete: ${result.quality.movements_complete ? '✅' : '❌'}`);
    console.log(`   Balance Matches:    ${result.quality.balance_matches ? '✅' : '❌'}`);
    console.log(`   Confidence Score:   ${(result.quality.confidence_score * 100).toFixed(1)}%`);
    console.log(`   Recommendation:     ${result.quality.recommendation}`);
    console.log('');
    
    // First 3 movements
    console.log('─'.repeat(80));
    console.log('📋 FIRST 3 MOVEMENTS (DETAILED):');
    console.log('─'.repeat(80));
    console.log('');
    
    result.movements.slice(0, 3).forEach((mov, idx) => {
      console.log(`${idx + 1}. ${mov.description}`);
      console.log(`   ID:          ${mov.id}`);
      console.log(`   Type:        ${mov.type}`);
      console.log(`   Amount:      $${mov.amount.toLocaleString()} ${mov.amount > 0 ? '(credit)' : '(debit)'}`);
      console.log(`   Currency:    ${mov.currency || 'null'}`);
      console.log(`   Date:        ${mov.post_date}`);
      console.log(`   Pending:     ${mov.pending}`);
      
      if (mov.sender_account) {
        console.log(`   Sender:`);
        console.log(`     - holder_id:   "${mov.sender_account.holder_id}"`);
        console.log(`     - dv:          "${mov.sender_account.dv}"`);
        console.log(`     - holder_name: ${mov.sender_account.holder_name || 'null'}`);
      } else {
        console.log(`   Sender:      N/A`);
      }
      
      console.log(`   Insights:`);
      console.log(`     - errores:     [${mov.insights.errores.join(', ')}]`);
      console.log(`     - calidad:     ${mov.insights.calidad}`);
      console.log(`     - banco:       ${mov.insights.banco}`);
      console.log(`     - proximity:   ${mov.insights.extraction_proximity_pct}%`);
      console.log('');
    });
    
    // Verification
    console.log('─'.repeat(80));
    console.log('🔍 VERIFICATION CHECKS:');
    console.log('─'.repeat(80));
    console.log('');
    
    let allChecksPass = true;
    
    // Check 1: Amounts have decimals (if applicable)
    const hasDecimals = result.movements.some(m => m.amount % 1 !== 0);
    console.log(`✓ Decimals preserved:       ${hasDecimals ? '✅ YES' : '⚠️  NO (all integers)'}`);
    
    // Check 2: holder_id includes DV
    const movementsWithRUT = result.movements.filter(m => m.sender_account?.holder_id);
    const allHaveDV = movementsWithRUT.every(m => {
      const id = m.sender_account.holder_id;
      return id && /[0-9k]$/i.test(id); // Ends with digit or k
    });
    console.log(`✓ holder_id includes DV:    ${allHaveDV ? '✅ YES' : '❌ NO'}`);
    if (!allHaveDV) allChecksPass = false;
    
    // Check 3: Currency is CLP or null (not "0")
    const allCurrencyValid = result.movements.every(m => 
      m.currency === 'CLP' || m.currency === null
    );
    console.log(`✓ Currency valid (not "0"): ${allCurrencyValid ? '✅ YES' : '❌ NO'}`);
    if (!allCurrencyValid) allChecksPass = false;
    
    // Check 4: All movements have insights
    const allHaveInsights = result.movements.every(m => m.insights);
    console.log(`✓ All have insights:        ${allHaveInsights ? '✅ YES' : '❌ NO'}`);
    if (!allHaveInsights) allChecksPass = false;
    
    // Check 5: Insights key naming
    const firstInsights = result.movements[0]?.insights;
    const hasNewKey = firstInsights && ('extraction_proximity_pct' in firstInsights);
    const hasOldKey = firstInsights && ('cercania % de extraccion' in firstInsights);
    console.log(`✓ New insights key name:    ${hasNewKey ? '✅ YES' : (hasOldKey ? '❌ NO (old key)' : '⚠️  N/A')}`);
    if (hasOldKey) allChecksPass = false;
    
    console.log('');
    console.log('─'.repeat(80));
    
    if (allChecksPass) {
      console.log('🎉 ALL CHECKS PASSED! New implementation working correctly.');
    } else {
      console.log('⚠️  SOME CHECKS FAILED - Review output above');
    }
    
    console.log('─'.repeat(80));
    console.log('');
    
    // Save full output to file
    const outputPath = 'TEST_OUTPUT_BANCO_CHILE.json';
    fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
    console.log(`💾 Full output saved to: ${outputPath}`);
    console.log('');
    
    // Show sample JSON
    console.log('📄 SAMPLE MOVEMENT JSON:');
    console.log(JSON.stringify(result.movements[0], null, 2));
    
  } catch (error) {
    console.error('');
    console.error('❌ ERROR:', error.message);
    console.error('');
    if (error.stack) {
      console.error('Stack trace:');
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Run test
testRealCartola();


