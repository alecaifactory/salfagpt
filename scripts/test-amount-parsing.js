/**
 * Simple Test: Amount Parsing Comparison
 * Shows the bug in current implementation
 */

console.log(`
╔═══════════════════════════════════════════════════════════════╗
║     AMOUNT PARSING TEST - Current vs Improved                 ║
╚═══════════════════════════════════════════════════════════════╝
`);

// ============================================================================
// CURRENT IMPLEMENTATION (BROKEN)
// ============================================================================

function parseAmountCurrent(amountStr) {
  if (typeof amountStr === 'number') return amountStr;
  
  // ❌ WRONG: Removes ALL dots and commas indiscriminately
  return parseFloat(amountStr.replace(/[.,]/g, '')) || 0;
}

// ============================================================================
// IMPROVED IMPLEMENTATION (FIXED)
// ============================================================================

function parseChileanAmount(amountStr) {
  if (typeof amountStr === 'number') return amountStr;
  
  let cleaned = amountStr.trim();
  cleaned = cleaned.replace(/\./g, '');      // Remove thousands separator (dot)
  cleaned = cleaned.replace(/,/g, '.');      // Convert decimal separator (comma → dot)
  cleaned = cleaned.replace(/[^\d.-]/g, ''); // Remove currency symbols
  
  return parseFloat(cleaned) || 0;
}

// ============================================================================
// TEST CASES (Real Chilean formats)
// ============================================================================

const testCases = [
  { input: '14.994', expected: 14994, desc: 'Integer with thousands separator' },
  { input: '14.994,50', expected: 14994.50, desc: 'Decimal with Chilean format' },
  { input: '1.234.567', expected: 1234567, desc: 'Large integer' },
  { input: '1.234.567,89', expected: 1234567.89, desc: 'Large decimal' },
  { input: '$14.994,50', expected: 14994.50, desc: 'With currency symbol' },
  { input: 'CLP 14.994', expected: 14994, desc: 'With currency code' },
  { input: '-1.500', expected: -1500, desc: 'Negative amount (debit)' },
  { input: '-14.994,50', expected: -14994.50, desc: 'Negative decimal' },
  { input: '150', expected: 150, desc: 'Simple integer' },
  { input: '150,25', expected: 150.25, desc: 'Simple decimal' },
];

console.log('Testing Chilean currency format parsing...\n');
console.log('─'.repeat(100));
console.log(
  'Input'.padEnd(20) + 
  'Expected'.padEnd(15) + 
  'Current'.padEnd(15) + 
  'Improved'.padEnd(15) + 
  'Status'
);
console.log('─'.repeat(100));

let currentErrors = 0;
let improvedErrors = 0;

testCases.forEach(({ input, expected, desc }) => {
  const currentResult = parseAmountCurrent(input);
  const improvedResult = parseChileanAmount(input);
  
  const currentOK = currentResult === expected;
  const improvedOK = improvedResult === expected;
  
  if (!currentOK) currentErrors++;
  if (!improvedOK) improvedErrors++;
  
  const status = currentOK 
    ? (improvedOK ? '✅✅ Both OK' : '✅❌ Only Current')
    : (improvedOK ? '❌✅ FIXED!' : '❌❌ Both Fail');
  
  console.log(
    input.padEnd(20) +
    String(expected).padEnd(15) +
    String(currentResult).padEnd(15) +
    String(improvedResult).padEnd(15) +
    status
  );
});

console.log('─'.repeat(100));
console.log(`\n📊 RESULTS:\n`);
console.log(`   Current implementation:  ${currentErrors} errors out of ${testCases.length} tests (${((currentErrors/testCases.length)*100).toFixed(1)}% failure rate)`);
console.log(`   Improved implementation: ${improvedErrors} errors out of ${testCases.length} tests (${((improvedErrors/testCases.length)*100).toFixed(1)}% failure rate)`);

if (currentErrors > 0) {
  console.log(`\n🔴 CRITICAL: Current implementation fails on Chilean decimal format!`);
  console.log(`   Example: "14.994,50" → ${parseAmountCurrent('14.994,50')} (WRONG, should be 14994.50)`);
  console.log(`   Impact: All movements with decimals will have incorrect amounts`);
}

if (improvedErrors === 0) {
  console.log(`\n✅ SUCCESS: Improved implementation handles all test cases correctly!`);
}

console.log(`\n${'═'.repeat(100)}`);
console.log(`\n💡 EXPLANATION:\n`);
console.log(`   Chilean Format: 1.234.567,89 (dot for thousands, comma for decimals)`);
console.log(`   US Format:      1,234,567.89 (comma for thousands, dot for decimals)`);
console.log(``);
console.log(`   Current code: removes ALL dots and commas → breaks decimals`);
console.log(`   Improved code: respects Chilean format → works correctly`);
console.log(`\n${'═'.repeat(100)}\n`);

// Show real-world example
console.log(`📋 REAL-WORLD EXAMPLE FROM CARTOLA:\n`);
console.log(`   Banco de Chile statement shows: "$14.994,50" (Abono)`);
console.log(`   `);
console.log(`   Current parsing:  $${parseAmountCurrent('14.994,50')}`);
console.log(`   Improved parsing: $${parseChileanAmount('14.994,50')}`);
console.log(`   Expected:         $14994.50`);
console.log(`   `);
console.log(`   ❌ Current is WRONG by $${Math.abs(parseAmountCurrent('14.994,50') - 14994.50)} pesos!`);
console.log(`   ✅ Improved is CORRECT\n`);

console.log(`${'═'.repeat(100)}\n`);


