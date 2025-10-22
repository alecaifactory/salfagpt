/**
 * Debug Script para Context State
 * 
 * Ejecuta esto en la consola del navegador para diagnosticar
 * por qué no aparecen fuentes/referencias
 * 
 * Instrucciones:
 * 1. Abre DevTools (F12)
 * 2. Ve a Console
 * 3. Copia y pega todo este código
 * 4. Presiona Enter
 * 5. Envíame el output completo
 */

console.clear();
console.log('🔍 DIAGNÓSTICO DE CONTEXTO Y REFERENCIAS');
console.log('='.repeat(60));
console.log('');

// Check React DevTools
console.log('1️⃣ REACT STATE:');
try {
  // Try to access React internals
  const root = document.querySelector('#root');
  if (root && root._reactRootContainer) {
    console.log('✅ React root found');
  } else {
    console.log('⚠️ React root structure different');
  }
  
  // Check for React DevTools
  if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    console.log('✅ React DevTools available');
  } else {
    console.log('⚠️ React DevTools not installed');
  }
} catch (e) {
  console.log('❌ Cannot access React internals');
}
console.log('');

// Check network requests
console.log('2️⃣ ÚLTIMAS PETICIONES DE CONTEXTO:');
console.log('Busca en Network tab:');
console.log('- GET /api/agents/.../context-stats');
console.log('- POST /api/conversations/.../messages-stream');
console.log('');
console.log('Verifica:');
console.log('  ✓ Status 200');
console.log('  ✓ Response incluye: activeContextSourceIds, totalCount, activeCount');
console.log('');

// Check localStorage
console.log('3️⃣ LOCALSTORAGE:');
const keys = Object.keys(localStorage);
console.log(`  Total keys: ${keys.length}`);
if (keys.length > 0) {
  console.log('  Keys:', keys);
}
console.log('');

// Check sessionStorage
console.log('4️⃣ SESSIONSTORAGE:');
const sessionKeys = Object.keys(sessionStorage);
console.log(`  Total keys: ${sessionKeys.length}`);
if (sessionKeys.length > 0) {
  console.log('  Keys:', sessionKeys);
}
console.log('');

// Version check
console.log('5️⃣ VERSIÓN DEL CÓDIGO:');
console.log('Busca en el código fuente de la página:');
console.log('  View → Developer → View Source (Cmd+Option+U)');
console.log('  Busca: "Loading minimal context stats"');
console.log('  ');
console.log('  ✅ Si dice "IDs only" → código NUEVO');
console.log('  ❌ Si dice "count only" → código VIEJO (hard refresh!)');
console.log('');

// Cache status
console.log('6️⃣ CACHÉ DEL NAVEGADOR:');
console.log('  Haz hard refresh:');
console.log('  • Mac: Cmd + Shift + R');
console.log('  • Windows: Ctrl + Shift + R');
console.log('  • Chrome: También puedes hacer click derecho en reload → "Empty Cache and Hard Reload"');
console.log('');

// Messages check
console.log('7️⃣ MENSAJES EN PANTALLA:');
const messages = document.querySelectorAll('[class*="message"]');
console.log(`  Total message elements: ${messages.length}`);
console.log('');

// References check
console.log('8️⃣ REFERENCIAS (BADGES):');
const badges = document.querySelectorAll('.reference-badge');
console.log(`  Total reference badges: ${badges.length}`);
if (badges.length === 0) {
  console.log('  ❌ No se encontraron badges [1], [2], etc.');
  console.log('  ');
  console.log('  Causas posibles:');
  console.log('    1. Backend no devolvió referencias (revisar logs)');
  console.log('    2. Frontend no las recibió (revisar Network)');
  console.log('    3. MessageRenderer no las renderizó (revisar props)');
} else {
  console.log(`  ✅ Se encontraron ${badges.length} badges`);
  console.log('  IDs:', Array.from(badges).map(b => b.textContent).join(', '));
}
console.log('');

// Final recommendation
console.log('='.repeat(60));
console.log('📋 RECOMENDACIÓN:');
console.log('');
if (badges.length === 0) {
  console.log('❌ Referencias no aparecen.');
  console.log('');
  console.log('Pasos:');
  console.log('1. Hard refresh (Cmd+Shift+R)');
  console.log('2. Verifica logs del servidor (terminal)');
  console.log('3. Envía nuevo mensaje');
  console.log('4. Ejecuta este script de nuevo');
  console.log('');
  console.log('Si después del hard refresh sigue igual:');
  console.log('• Restart dev server (Ctrl+C, npm run dev)');
  console.log('• Clear browser cache completamente');
  console.log('• Intenta en modo incognito');
} else {
  console.log('✅ Referencias están apareciendo correctamente!');
}
console.log('='.repeat(60));

