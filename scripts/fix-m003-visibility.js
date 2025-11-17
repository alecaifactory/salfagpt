/**
 * Script de Corrección: Agente M003 Visibilidad
 * 
 * Propósito:
 * - Verificar y corregir userId en documento de usuario Alec
 * - Asegurar que M003 esté visible para Alec y usuarios compartidos
 * - Generar reporte de ANTES/DURANTE/DESPUÉS de la migración
 */

const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const app = initializeApp({ projectId: 'salfagpt' });
const firestore = getFirestore(app);

const M003_ID = 'eKUSLAQNrf2Ru96hKGeA';

async function fixM003Visibility() {
  console.log('🔧 CORRECCIÓN DE VISIBILIDAD - AGENTE M003\n');
  console.log('='.repeat(70));
  
  // === PASO 1: Verificar estado actual ===
  console.log('\n📋 PASO 1: Verificar Estado Actual');
  console.log('-'.repeat(70));
  
  // 1.1 Get Alec's user document
  const alecByEmail = await firestore.collection('users')
    .where('email', '==', 'alec@getaifactory.com')
    .get();
  
  if (alecByEmail.empty) {
    console.log('❌ ERROR: Usuario alec@getaifactory.com no encontrado');
    process.exit(1);
  }
  
  const alecDoc = alecByEmail.docs[0];
  const alecData = alecDoc.data();
  
  const ALEC_DOC_ID = alecDoc.id;
  const ALEC_USER_ID_FIELD = alecData.userId;
  const ALEC_GOOGLE_ID = alecData.googleUserId;
  
  console.log('Usuario Alec:');
  console.log('  📄 Document ID:', ALEC_DOC_ID);
  console.log('  📝 userId field:', ALEC_USER_ID_FIELD);
  console.log('  🔐 googleUserId:', ALEC_GOOGLE_ID);
  
  // 1.2 Get M003 agent
  const m003Doc = await firestore.collection('conversations').doc(M003_ID).get();
  
  if (!m003Doc.exists) {
    console.log('❌ ERROR: Agente M003 no encontrado');
    process.exit(1);
  }
  
  const m003Data = m003Doc.data();
  
  console.log('\nAgente M003:');
  console.log('  userId:', m003Data.userId);
  console.log('  title:', m003Data.title);
  console.log('  tags:', m003Data.tags);
  console.log('  sharedWith:', m003Data.sharedWith?.length || 0, 'entidades');
  
  // === PASO 2: Identificar inconsistencias ===
  console.log('\n📊 PASO 2: Análisis de Consistencia');
  console.log('-'.repeat(70));
  
  const inconsistencies = [];
  
  // Check 1: Document ID vs userId field
  if (ALEC_DOC_ID !== ALEC_USER_ID_FIELD) {
    inconsistencies.push({
      issue: 'userId field en documento de usuario NO coincide con Document ID',
      current: { docId: ALEC_DOC_ID, userIdField: ALEC_USER_ID_FIELD },
      fix: 'Actualizar userId field a Document ID'
    });
  }
  
  // Check 2: M003 userId matches Alec's document ID
  if (m003Data.userId !== ALEC_DOC_ID) {
    inconsistencies.push({
      issue: 'M003 userId NO coincide con Document ID de Alec',
      current: { m003UserId: m003Data.userId, alecDocId: ALEC_DOC_ID },
      fix: 'Actualizar M003 userId'
    });
  }
  
  console.log('Inconsistencias encontradas:', inconsistencies.length);
  inconsistencies.forEach((inc, i) => {
    console.log(`\n  ${i + 1}. ${inc.issue}`);
    console.log('     Current:', JSON.stringify(inc.current));
    console.log('     Fix:', inc.fix);
  });
  
  // === PASO 3: Aplicar correcciones ===
  if (inconsistencies.length > 0) {
    console.log('\n🔧 PASO 3: Aplicando Correcciones');
    console.log('-'.repeat(70));
    
    const batch = firestore.batch();
    
    // Fix 1: Update Alec's userId field
    if (ALEC_DOC_ID !== ALEC_USER_ID_FIELD) {
      console.log('\n✏️  Corrigiendo userId en documento de Alec...');
      batch.update(alecDoc.ref, {
        userId: ALEC_DOC_ID, // Make it match document ID
        _userIdCorrectedAt: new Date().toISOString(),
        _userIdCorrectedFrom: ALEC_USER_ID_FIELD
      });
      console.log('  ✅ userId: ' + ALEC_USER_ID_FIELD + ' → ' + ALEC_DOC_ID);
    }
    
    // Fix 2: Update M003 userId (if needed)
    if (m003Data.userId !== ALEC_DOC_ID) {
      console.log('\n✏️  Corrigiendo userId en M003...');
      batch.update(m003Doc.ref, {
        userId: ALEC_DOC_ID,
        _userIdCorrectedAt: new Date().toISOString(),
        _userIdCorrectedFrom: m003Data.userId
      });
      console.log('  ✅ userId: ' + m003Data.userId + ' → ' + ALEC_DOC_ID);
    }
    
    // Commit batch
    await batch.commit();
    console.log('\n✅ Correcciones aplicadas');
  } else {
    console.log('\n✅ No se requieren correcciones - todo está consistente');
  }
  
  // === PASO 4: Verificar comparticiones ===
  console.log('\n📊 PASO 4: Verificar Comparticiones');
  console.log('-'.repeat(70));
  
  const updatedM003 = await firestore.collection('conversations').doc(M003_ID).get();
  const updatedM003Data = updatedM003.data();
  const sharedWith = updatedM003Data.sharedWith || [];
  
  const sharedUsers = sharedWith.filter(s => s.type === 'user');
  const sharedDomains = sharedWith.filter(s => s.type === 'domain');
  
  console.log('Compartido con:');
  console.log('  - Usuarios:', sharedUsers.length);
  console.log('  - Dominios:', sharedDomains.length);
  
  // Verificar formato de IDs compartidos
  const oldFormatCount = sharedUsers.filter(s => /^\d+$/.test(s.id)).length;
  const newFormatCount = sharedUsers.filter(s => s.id.startsWith('usr_')).length;
  
  console.log('\nFormato de IDs compartidos:');
  console.log('  ❌ OLD format (Google):', oldFormatCount);
  console.log('  ✅ NEW format (usr_):', newFormatCount);
  
  if (oldFormatCount > 0) {
    console.log('\n⚠️  ADVERTENCIA: Hay IDs en formato antiguo en sharedWith');
    console.log('   Esto puede causar problemas de visibilidad');
  }
  
  // === PASO 5: Reporte Final ===
  console.log('\n📊 REPORTE FINAL DE MIGRACIÓN');
  console.log('='.repeat(70));
  
  console.log('\n✅ OWNER (Alec):');
  console.log('   OLD ID: ' + ALEC_GOOGLE_ID);
  console.log('   NEW ID: ' + ALEC_DOC_ID);
  console.log('   M003 userId: ' + updatedM003Data.userId);
  console.log('   Status: ' + (updatedM003Data.userId === ALEC_DOC_ID ? '✅ CORRECTO' : '❌ MISMATCH'));
  
  console.log('\n✅ SHARED USERS: ' + sharedUsers.length + ' usuarios');
  console.log('   Formato nuevo: ' + newFormatCount + ' ✅');
  console.log('   Formato viejo: ' + oldFormatCount + (oldFormatCount > 0 ? ' ⚠️' : ' ✅'));
  
  console.log('\n✅ SHARED DOMAINS: ' + sharedDomains.length + ' dominios');
  sharedDomains.forEach(d => console.log('   - ' + d.domain));
  
  console.log('\n' + '='.repeat(70));
  console.log('✅ CORRECCIÓN COMPLETADA\n');
  console.log('Próximos pasos:');
  console.log('1. Verificar sesión en: http://localhost:3000/api/debug/session');
  console.log('2. Si JWT tiene OLD ID, usuario debe cerrar sesión y volver a entrar');
  console.log('3. Refrescar página para ver M003');
  
  process.exit(0);
}

fixM003Visibility().catch(console.error);

