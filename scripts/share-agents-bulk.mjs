#!/usr/bin/env node
/**
 * Bulk Agent Sharing Script
 * 
 * Shares all 4 agents with their designated pilot users
 * 
 * Total: 55 shares across 4 agents
 * - S1-v2: 16 users
 * - S2-v2: 11 users
 * - M1-v2: 14 users
 * - M3-v2: 14 users
 * 
 * Usage: npx tsx scripts/share-agents-bulk.mjs
 */

import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

initializeApp({ projectId: 'salfagpt' });
const db = getFirestore();

const SHARED_BY = 'usr_uhwqffaqag1wrryd82tw'; // alec@getaifactory.com (SuperAdmin)

// Complete sharing configuration
const SHARING_CONFIG = {
  'iQmdg3bMSJ1AdqqlFpye': { // S1-v2
    name: 'S1-v2 GESTION BODEGAS GPT',
    users: [
      // Business Users (Expert)
      { email: 'abhernandez@maqsa.cl', name: 'ALEJANDRO HERNANDEZ QUEZADA', accessLevel: 'expert' },
      { email: 'cvillalon@maqsa.cl', name: 'CONSTANZA CATALINA VILLALON GUZMAN', accessLevel: 'expert' },
      { email: 'hcontrerasp@salfamontajes.com', name: 'HERNAN HUMBERTO CONTRERAS PEÑA', accessLevel: 'expert' },
      { email: 'iojedaa@maqsa.cl', name: 'INGRID OJEDA ALVARADO', accessLevel: 'expert' },
      { email: 'jefarias@maqsa.cl', name: 'JONATHAN EDUARDO FARIAS SANCHEZ', accessLevel: 'expert' },
      { email: 'msgarcia@maqsa.cl', name: 'MAURICIO SEBASTIAN GARCIA RIVEROS', accessLevel: 'expert' },
      { email: 'ojrodriguez@maqsa.cl', name: 'ORLANDO JOSE RODRIGUEZ TRAVIEZO', accessLevel: 'expert' },
      { email: 'paovalle@maqsa.cl', name: 'PAULA ANDREA OVALLE URRUTIA', accessLevel: 'expert' },
      { email: 'salegria@maqsa.cl', name: 'Sebastian ALEGRIA LEIVA', accessLevel: 'expert' },
      { email: 'vaaravena@maqsa.cl', name: 'VALERIA ALEJANDRA ARAVENA BARRA', accessLevel: 'expert' },
      { email: 'vclarke@maqsa.cl', name: 'VANESSA CLARKE MEZA', accessLevel: 'expert' },
      
      // TI Users
      { email: 'fdiazt@salfagestion.cl', name: 'Francis Diaz', accessLevel: 'user' },
      { email: 'sorellanac@salfagestion.cl', name: 'Sebastian Orellana', accessLevel: 'admin' },
      { email: 'nfarias@salfagestion.cl', name: 'Nenett Farias', accessLevel: 'user' },
      { email: 'alecdickinson@gmail.com', name: 'Alec Dickinson', accessLevel: 'user' },
      { email: 'alec@salfacloud.cl', name: 'Alec Dickinson', accessLevel: 'user' }
    ]
  },
  
  '1lgr33ywq5qed67sqCYi': { // S2-v2
    name: 'S2-v2 MAQSA MANTENIMIENTO',
    users: [
      // Business Users (Expert)
      { email: 'svillegas@maqsa.cl', name: 'Sebastian Villegas', accessLevel: 'expert' },
      { email: 'csolis@maqsa.cl', name: 'Cristobal Solis', accessLevel: 'expert' },
      { email: 'fmelin@maqsa.cl', name: 'Francisco Melin', accessLevel: 'expert' },
      { email: 'riprado@maqsa.cl', name: 'Ricardo Prado', accessLevel: 'expert' },
      { email: 'jcalfin@maqsa.cl', name: 'Jorge CALFIN BELLO', accessLevel: 'expert' },
      { email: 'mmichael@maqsa.cl', name: 'MAURICIO MICHAEL FERNANDEZ', accessLevel: 'expert' },
      
      // TI Users
      { email: 'fdiazt@salfagestion.cl', name: 'Francis Diaz', accessLevel: 'user' },
      { email: 'sorellanac@salfagestion.cl', name: 'Sebastian Orellana', accessLevel: 'admin' },
      { email: 'nfarias@salfagestion.cl', name: 'Nenett Farias', accessLevel: 'user' },
      { email: 'alecdickinson@gmail.com', name: 'Alec Dickinson', accessLevel: 'user' },
      { email: 'alec@salfacloud.cl', name: 'Alec Dickinson', accessLevel: 'user' }
    ]
  },
  
  'cjn3bC0HrUYtHqu69CKS': { // M1-v2
    name: 'M1-v2 ASISTENTE LEGAL TERRITORIAL',
    users: [
      // Business Users (Expert)
      { email: 'jriverof@iaconcagua.com', name: 'JULIO IGNACIO RIVERO FIGUEROA', accessLevel: 'expert' },
      { email: 'afmanriquez@iaconcagua.com', name: 'ALVARO FELIPE MANRIQUEZ JIMENEZ', accessLevel: 'expert' },
      { email: 'cquijadam@iaconcagua.com', name: 'CHRISTIAN QUIJADA MARTINEZ', accessLevel: 'expert' },
      { email: 'ireygadas@iaconcagua.com', name: 'IRIS ANDREA REYGADAS ARIAS', accessLevel: 'expert' },
      { email: 'jmancilla@iaconcagua.com', name: 'JOSE LUIS MANCILLA COFRE', accessLevel: 'expert' },
      { email: 'mallende@iaconcagua.com', name: 'MARIA PAZ ALLENDE BARRAZA', accessLevel: 'expert' },
      { email: 'recontreras@iaconcagua.com', name: 'RAFAEL ESTEBAN CONTRERAS', accessLevel: 'expert' },
      { email: 'dundurraga@iaconcagua.com', name: 'DIEGO UNDURRAGA RIVERA', accessLevel: 'expert' },
      { email: 'rfuentesm@inoval.cl', name: 'RICARDO FUENTES MOISAN', accessLevel: 'expert' },
      
      // TI Users
      { email: 'fdiazt@salfagestion.cl', name: 'Francis Diaz', accessLevel: 'user' },
      { email: 'sorellanac@salfagestion.cl', name: 'Sebastian Orellana', accessLevel: 'admin' },
      { email: 'nfarias@salfagestion.cl', name: 'Nenett Farias', accessLevel: 'user' },
      { email: 'alecdickinson@gmail.com', name: 'Alec Dickinson', accessLevel: 'user' },
      { email: 'alec@salfacloud.cl', name: 'Alec Dickinson', accessLevel: 'user' }
    ]
  },
  
  'vStojK73ZKbjNsEnqANJ': { // M3-v2
    name: 'M3-v2 GOP GPT',
    users: [
      // Business Users (Expert)
      { email: 'mfuenzalidar@novatec.cl', name: 'MARCELO FUENZALIDA REYES', accessLevel: 'expert' },
      { email: 'phvaldivia@novatec.cl', name: 'PATRICK HERNAN VALDIVIA URRUTIA', accessLevel: 'expert' },
      { email: 'yzamora@inoval.cl', name: 'YENNIFER ZAMORA BLANCO', accessLevel: 'expert' },
      { email: 'jcancinoc@inoval.cl', name: 'JAIME ANTONIO CANCINO CASTILLO', accessLevel: 'expert' },
      { email: 'lurriola@novatec.cl', name: 'LEONEL EDUARDO URRIOLA RONDON', accessLevel: 'expert' },
      { email: 'fcerda@constructorasalfa.cl', name: 'FELIPE IGNACIO CERDA QUIJADA', accessLevel: 'expert' },
      { email: 'gfalvarez@novatec.cl', name: 'GONZALO FERNANDO ALVAREZ GONZALEZ', accessLevel: 'expert' },
      { email: 'dortega@novatec.cl', name: 'DANIEL ADOLFO ORTEGA VIDELA', accessLevel: 'expert' },
      { email: 'mburgoa@novatec.cl', name: 'MANUEL ALEJANDRO BURGOA MARAMBIO', accessLevel: 'expert' },
      
      // TI Users
      { email: 'fdiazt@salfagestion.cl', name: 'Francis Diaz', accessLevel: 'user' },
      { email: 'sorellanac@salfagestion.cl', name: 'Sebastian Orellana', accessLevel: 'admin' },
      { email: 'nfarias@salfagestion.cl', name: 'Nenett Farias', accessLevel: 'user' },
      { email: 'alecdickinson@gmail.com', name: 'Alec Dickinson', accessLevel: 'user' },
      { email: 'alec@salfacloud.cl', name: 'Alec Dickinson', accessLevel: 'user' }
    ]
  }
};

async function shareAgentWithUsers(agentId, config) {
  console.log(`\n${'═'.repeat(80)}`);
  console.log(`📤 Sharing: ${config.name}`);
  console.log(`${'═'.repeat(80)}`);
  console.log(`Agent ID: ${agentId}`);
  console.log(`Users to share: ${config.users.length}\n`);

  const agentRef = db.collection('conversations').doc(agentId);
  
  // Verify agent exists
  const agentDoc = await agentRef.get();
  if (!agentDoc.exists) {
    console.log(`❌ Agent not found in Firestore!\n`);
    return { success: false, shared: 0, failed: config.users.length };
  }

  console.log(`✅ Agent found: ${agentDoc.data().title}\n`);

  let successCount = 0;
  let failCount = 0;

  // Share with each user
  for (const user of config.users) {
    try {
      await agentRef.update({
        sharedWith: FieldValue.arrayUnion({
          type: 'user',
          email: user.email,
          name: user.name,
          accessLevel: user.accessLevel,
          sharedAt: new Date(),
          sharedBy: SHARED_BY
        }),
        updatedAt: new Date()
      });

      console.log(`✅ Shared with: ${user.email} (${user.accessLevel})`);
      successCount++;
      
    } catch (error) {
      console.log(`❌ Failed to share with: ${user.email}`);
      console.log(`   Error: ${error.message}`);
      failCount++;
    }

    // Small delay to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log(`\n📊 Results: ${successCount} shared, ${failCount} failed\n`);

  return {
    success: failCount === 0,
    shared: successCount,
    failed: failCount
  };
}

async function main() {
  console.log('\n🚀 BULK AGENT SHARING\n');
  console.log('Sharing all 4 agents with 55 pilot users...\n');
  console.log('Configuration:');
  console.log('  - Business users: Expert access');
  console.log('  - TI users: User access (except Sebastian Orellana: Admin)');
  console.log('  - Shared by: alec@getaifactory.com (SuperAdmin)\n');

  const results = [];
  let totalShared = 0;
  let totalFailed = 0;

  for (const [agentId, config] of Object.entries(SHARING_CONFIG)) {
    const result = await shareAgentWithUsers(agentId, config);
    results.push({ agent: config.name, ...result });
    totalShared += result.shared;
    totalFailed += result.failed;
    
    // Pause between agents
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Summary
  console.log('\n' + '═'.repeat(80));
  console.log('📊 SHARING SUMMARY');
  console.log('═'.repeat(80));
  console.log();

  console.log('| Agent | Expected | Shared | Failed | Status |');
  console.log('|-------|----------|--------|--------|--------|');
  
  results.forEach(r => {
    const status = r.success ? '✅ SUCCESS' : '⚠️ PARTIAL';
    const total = r.shared + r.failed;
    console.log(`| ${r.agent} | ${total} | ${r.shared} | ${r.failed} | ${status} |`);
  });

  console.log();
  console.log('═'.repeat(80));
  console.log();

  console.log(`Total shares attempted:  55`);
  console.log(`Successfully shared:     ${totalShared}`);
  console.log(`Failed:                  ${totalFailed}`);
  console.log(`Success rate:            ${((totalShared/55)*100).toFixed(1)}%`);
  console.log();

  const allSuccess = totalFailed === 0;
  
  console.log('═'.repeat(80));
  console.log(`\n${allSuccess ? '✅ ALL SHARING COMPLETE!' : '⚠️ SOME SHARES FAILED'}\n`);
  console.log('═'.repeat(80));
  console.log();

  if (allSuccess) {
    console.log('🎉 Next steps:');
    console.log('  1. Verify: npx tsx scripts/verify-agent-sharing.mjs');
    console.log('  2. Notify users via email');
    console.log('  3. Monitor usage\n');
  } else {
    console.log('⚠️ Next steps:');
    console.log('  1. Review failed shares above');
    console.log('  2. Fix issues and re-run');
    console.log('  3. Or share manually via UI\n');
  }

  process.exit(allSuccess ? 0 : 1);
}

main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});

