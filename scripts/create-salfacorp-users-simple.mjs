#!/usr/bin/env node

/**
 * Create Salfacorp Users - Simple Version
 * 
 * Uses the existing Firestore functions to create users and enable domains
 * Run with: node scripts/create-salfacorp-users-simple.mjs
 */

import { createUsersBulk } from '../src/lib/firestore.js';
import { Firestore } from '@google-cloud/firestore';

const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT || 'gen-lang-client-0986191192';
const firestore = new Firestore({ projectId: PROJECT_ID });

// User data from CSV
const USERS_DATA = [
  { firstName: 'Nenett', lastName: 'Farias', fullName: 'Nenett Farias', email: 'nfarias@salfagestion.cl', domain: 'salfagestion.cl' },
  { firstName: 'Andy', lastName: 'Castillo', fullName: 'Andy Castillo', email: 'acastillo@salfagestion.cl', domain: 'salfagestion.cl' },
  { firstName: 'Marcos', lastName: 'Melin', fullName: 'Marcos Melin', email: 'mmelin@salfagestion.cl', domain: 'salfagestion.cl' },
  { firstName: 'Sebastian', lastName: 'Orellana', fullName: 'Sebastian Orellana', email: 'sorellanac@salfagestion.cl', domain: 'salfagestion.cl' },
  { firstName: 'FRANCIS', lastName: 'TOBAR', fullName: 'FRANCIS ANAIS DIAZ TOBAR', email: 'fdiazt@salfagestion.cl', domain: 'salfagestion.cl' },
  { firstName: 'Matías', lastName: 'Jaramillo', fullName: 'Matías Jaramillo', email: 'mjaramillo@salfamontajes.com', domain: 'salfamontajes.com' },
  { firstName: 'Paul', lastName: 'Lambert', fullName: 'Paul Lambert', email: 'plambert@fegrande.cl', domain: 'fegrande.cl' },
  { firstName: 'Alejandro', lastName: 'Valderrama', fullName: 'Alejandro Valderrama', email: 'avalderramad@geovita.cl', domain: 'geovita.cl' },
  { firstName: 'Ignacio', lastName: 'Webar', fullName: 'Ignacio Webar', email: 'iwebar@salfaustral.cl', domain: 'salfaustral.cl' },
  { firstName: 'Luis', lastName: 'Ramos', fullName: 'Luis Ramos', email: 'lramos@fegrande.cl', domain: 'fegrande.cl' },
  { firstName: 'Ariel', lastName: 'Becerra', fullName: 'Ariel Becerra', email: 'abecerrao@salfamontajes.com', domain: 'salfamontajes.com' },
  { firstName: 'Franco', lastName: 'Pérez', fullName: 'Franco Pérez', email: 'fpereza@salfamontajes.com', domain: 'salfamontajes.com' },
  { firstName: 'Carlos', lastName: 'Maldonado', fullName: 'Carlos Maldonado', email: 'cmaldonados@novatec.cl', domain: 'novatec.cl' },
  { firstName: 'Eduardo', lastName: 'Rioseco', fullName: 'Eduardo Rioseco', email: 'erioseco@salfamantenciones.cl', domain: 'salfamantenciones.cl' },
  { firstName: 'Gabriel', lastName: 'Herrera', fullName: 'Gabriel Herrera', email: 'gherreral@tecsa.cl', domain: 'tecsa.cl' },
  { firstName: 'John', lastName: 'Mestre', fullName: 'John Mestre', email: 'jmestre@salfaustral.cl', domain: 'salfaustral.cl' },
  { firstName: 'Lucas', lastName: 'Peña', fullName: 'Lucas Peña', email: 'lpenaag@salfamontajes.com', domain: 'salfamontajes.com' },
  { firstName: 'Tomás', lastName: 'Díaz', fullName: 'Tomás Díaz', email: 'tidiaz@maqsa.cl', domain: 'maqsa.cl' },
  { firstName: 'MATIAS', lastName: 'QUEZADA', fullName: 'MATIAS NICOLAS SOTO QUEZADA', email: 'msotoq@salfagestion.cl', domain: 'salfagestion.cl' },
  { firstName: 'Daniel', lastName: 'Mora', fullName: 'Daniel Emilio Torres Mora', email: 'dtorres@salfagestion.cl', domain: 'salfagestion.cl' },
  { firstName: 'N.', lastName: 'TORRES', fullName: 'N. IVAN MUÑOZ TORRES', email: 'nimunoz@salfacorp.com', domain: 'salfacorp.com' },
  { firstName: 'Soporte', lastName: '', fullName: 'Soporte', email: 'cesar@salfacloud.cl', domain: 'salfacloud.cl' },
  { firstName: 'RONALD', lastName: 'ORELLANA', fullName: 'RONALD JOACHIM KRAUSE ORELLANA', email: 'rkrause@tecsa.cl', domain: 'tecsa.cl' },
  { firstName: 'FRANCISCA', lastName: 'LABORDA', fullName: 'FRANCISCA TIARE TRAMON LABORDA', email: 'ftramon@tecsa.cl', domain: 'tecsa.cl' },
  { firstName: 'NICOLAS', lastName: 'MORALES', fullName: 'NICOLAS IGNACIO MUÑOZ MORALES', email: 'nmunozm@salfagestion.cl', domain: 'salfagestion.cl' },
  { firstName: 'DANIEL', lastName: 'CARRASCO', fullName: 'DANIEL EDMUNDO CIFUENTES CARRASCO', email: 'dcifuentes@salfamontajes.com', domain: 'salfamontajes.com' },
  { firstName: 'CAMILA', lastName: 'SILVA', fullName: 'CAMILA MARGARITA SAAVEDRA SILVA', email: 'cmsaavedra@salfagestion.cl', domain: 'salfagestion.cl' },
  { firstName: 'WILSON', lastName: 'CORTES', fullName: 'WILSON OCTAVIO CERDA CORTES', email: 'wcerda@salfamontajes.com', domain: 'salfamontajes.com' },
  { firstName: 'RICARDO', lastName: 'PAZ', fullName: 'RICARDO ALBERTO ESPICEL LA PAZ', email: 'respicel@salfaustral.cl', domain: 'salfaustral.cl' },
  { firstName: 'OSCAR', lastName: 'URETA', fullName: 'OSCAR PEDRO JIMENEZ URETA', email: 'ojimenez@inoval.cl', domain: 'inoval.cl' },
  { firstName: 'SEBASTIAN', lastName: 'CONTRERAS', fullName: 'SEBASTIAN IGNACIO NUÑEZ CONTRERAS', email: 'snunez@salfamontajes.com', domain: 'salfamontajes.com' },
  { firstName: 'ANIBAL', lastName: 'MORENO', fullName: 'ANIBAL IGNACIO ALVAREZ MORENO', email: 'aialvarez@geovita.cl', domain: 'geovita.cl' },
  { firstName: 'JOSE', lastName: 'ALVEAL', fullName: 'JOSE ARIEL AHUMADA ALVEAL', email: 'jahumadaa@salfamontajes.com', domain: 'salfamontajes.com' },
  { firstName: 'JULIO', lastName: 'FIGUEROA', fullName: 'JULIO IGNACIO RIVERO FIGUEROA', email: 'jriverof@iaconcagua.com', domain: 'iaconcagua.com' },
  { firstName: 'DANIEL', lastName: 'VIDELA', fullName: 'DANIEL ADOLFO ORTEGA VIDELA', email: 'dortega@novatec.cl', domain: 'novatec.cl' },
  { firstName: 'MANUEL', lastName: 'MARAMBIO', fullName: 'MANUEL ALEJANDRO BURGOA MARAMBIO', email: 'mburgoa@novatec.cl', domain: 'novatec.cl' },
  { firstName: 'GONZALO', lastName: 'GONZALEZ', fullName: 'GONZALO FERNANDO ALVAREZ GONZALEZ', email: 'gfalvarez@novatec.cl', domain: 'novatec.cl' },
  { firstName: 'AGUSTIN', lastName: 'MARDONES', fullName: 'AGUSTIN PABLO KAMKE MARDONES', email: 'akamke@salfagestion.cl', domain: 'salfagestion.cl' },
  { firstName: 'RICARDO', lastName: 'MOISAN', fullName: 'RICARDO ANDRES FUENTES MOISAN', email: 'rfuentesm@inoval.cl', domain: 'inoval.cl' },
  { firstName: 'SEBASTIAN', lastName: 'Rodriguez', fullName: 'SEBASTIAN RODRIGO Cortes Rodriguez', email: 'scortesr@salfagestion.cl', domain: 'salfagestion.cl' },
  { firstName: 'MARÍA', lastName: 'TAPIA', fullName: 'MARÍA INÉS BARRIGA TAPIA', email: 'mbarriga@salfagestion.cl', domain: 'salfagestion.cl' },
  { firstName: 'Hans', lastName: 'Castillo', fullName: 'Hans Castillo', email: 'hcastillo@fegrande.cl', domain: 'fegrande.cl' },
  { firstName: 'Capacitaciones', lastName: 'IA', fullName: 'Capacitaciones IA', email: 'capacitacionesia@salfacloud.cl', domain: 'salfacloud.cl' },
];

const UNIQUE_DOMAINS = [...new Set(USERS_DATA.map(u => u.domain))];

console.log(`\n📊 Summary:`);
console.log(`   Total users: ${USERS_DATA.length}`);
console.log(`   Unique domains: ${UNIQUE_DOMAINS.length}`);
console.log(`   Domains: ${UNIQUE_DOMAINS.join(', ')}`);
console.log('');

async function main() {
  console.log('\n🚀 Creating Salfacorp Users and Enabling Domains');
  console.log('='.repeat(60));
  console.log(`📍 Project: ${PROJECT_ID}`);
  console.log(`📍 Admin: alec@getaifactory.com\n`);
  
  try {
    // Step 1: Enable all unique domains
    console.log('📍 Step 1: Enabling domains...\n');
    const domainResults = {
      created: 0,
      exists: 0,
      error: 0,
    };
    
    for (const domain of UNIQUE_DOMAINS) {
      try {
        const domainRef = firestore.collection('domains').doc(domain);
        const doc = await domainRef.get();
        
        if (doc.exists && doc.data()?.enabled) {
          console.log(`   ⏭️  Domain already enabled: ${domain}`);
          domainResults.exists++;
          continue;
        }
        
        await domainRef.set({
          name: domain,
          enabled: true,
          createdBy: 'alec@getaifactory.com',
          createdAt: new Date(),
          updatedAt: new Date(),
          allowedAgents: [],
          allowedContextSources: [],
          userCount: 0,
          description: `Salfacorp domain - ${domain}`,
          settings: {},
        });
        
        console.log(`   ✅ Domain created: ${domain}`);
        domainResults.created++;
      } catch (error) {
        console.error(`   ❌ Failed for domain ${domain}:`, error.message);
        domainResults.error++;
      }
    }
    
    console.log(`\n✅ Domains: ${domainResults.created} created, ${domainResults.exists} already existed, ${domainResults.error} errors\n`);
    
    // Step 2: Create all users using bulk function
    console.log('👥 Step 2: Creating users in bulk...\n');
    
    const usersToCreate = USERS_DATA.map(u => ({
      email: u.email,
      name: u.fullName,
      roles: ['user'],
      company: u.domain,
      department: '',
    }));
    
    const result = await createUsersBulk(usersToCreate, 'alec@getaifactory.com');
    
    console.log(`\n✅ Users: ${result.created.length} created, ${result.errors.length} errors\n`);
    
    if (result.errors.length > 0) {
      console.log('⚠️  Errors:');
      result.errors.forEach(e => console.log(`   - ${e.email}: ${e.error}`));
      console.log('');
    }
    
    // Step 3: Summary
    console.log('='.repeat(60));
    console.log('🎉 COMPLETE SUMMARY');
    console.log('='.repeat(60));
    
    console.log(`\n📋 Domains:`);
    console.log(`   Total: ${UNIQUE_DOMAINS.length}`);
    console.log(`   Created: ${domainResults.created}`);
    console.log(`   Already existed: ${domainResults.exists}`);
    console.log(`   Errors: ${domainResults.error}`);
    UNIQUE_DOMAINS.forEach(d => console.log(`   - ${d}`));
    
    console.log(`\n👥 Users:`);
    console.log(`   Total: ${USERS_DATA.length}`);
    console.log(`   Created: ${result.created.length}`);
    console.log(`   Errors: ${result.errors.length}`);
    
    if (result.created.length > 0) {
      console.log('\n   Created users:');
      result.created.forEach(u => console.log(`   ✅ ${u.email} - ${u.name}`));
    }
    
    console.log('\n   All users have:');
    console.log(`   - Role: user`);
    console.log(`   - Company: their domain`);
    console.log(`   - Status: active\n`);
    
    if (result.created.length > 0 || domainResults.created > 0) {
      console.log('✅ Operations completed successfully!\n');
    } else {
      console.log('ℹ️  All users and domains already exist\n');
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

main().then(() => process.exit(0));


