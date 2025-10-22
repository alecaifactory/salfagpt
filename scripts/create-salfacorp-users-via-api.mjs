#!/usr/bin/env node

/**
 * Create Salfacorp Users via API
 * 
 * Creates all Salfacorp users and enables their domains using the API
 * - All users get 'user' role (simplest profile)
 * - Domains are automatically enabled
 * - Each user gets basic permissions
 */

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

// Extract unique domains
const UNIQUE_DOMAINS = [...new Set(USERS_DATA.map(u => u.domain))];

const API_BASE = 'http://localhost:3000';

console.log(`\n📊 Summary:`);
console.log(`   Total users: ${USERS_DATA.length}`);
console.log(`   Unique domains: ${UNIQUE_DOMAINS.length}`);
console.log(`   Domains: ${UNIQUE_DOMAINS.join(', ')}`);
console.log('');

/**
 * Enable all domains in batch via API
 */
async function enableAllDomains(domains) {
  try {
    const domainObjects = domains.map(d => ({
      domain: d,
      name: d,
      description: `Salfacorp domain - ${d}`,
    }));
    
    const response = await fetch(`${API_BASE}/api/domains/enable-batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        domains: domainObjects,
        adminEmail: 'alec@getaifactory.com', // Admin who is enabling
      }),
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.log(`   ⚠️  API error: ${error}`);
      return [];
    }
    
    const result = await response.json();
    return result.results || [];
  } catch (error) {
    console.error(`   ❌ Failed to enable domains:`, error.message);
    return [];
  }
}

/**
 * Create a user via API
 */
async function createUser(userData) {
  try {
    const response = await fetch(`${API_BASE}/api/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: userData.email,
        name: userData.fullName,
        roles: ['user'], // API expects array
        company: userData.domain,
        department: '',
        createdBy: 'alec@getaifactory.com', // Admin creating users
      }),
    });
    
    if (!response.ok) {
      const error = await response.text();
      if (error.includes('already exists')) {
        console.log(`   ⏭️  User already exists: ${userData.email}`);
        return 'exists';
      }
      console.log(`   ⚠️  API error for user ${userData.email}: ${error}`);
      return 'error';
    }
    
    const result = await response.json();
    console.log(`   ✅ User created: ${userData.email} (${userData.fullName})`);
    return 'created';
  } catch (error) {
    console.error(`   ❌ Failed to create user ${userData.email}:`, error.message);
    return 'error';
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('\n🚀 Creating Salfacorp Users and Enabling Domains');
  console.log('='.repeat(60));
  console.log(`📍 API: ${API_BASE}\n`);
  
  // Step 1: Enable all unique domains
  console.log('📍 Step 1: Enabling domains...\n');
  const domainResults = await enableAllDomains(UNIQUE_DOMAINS);
  
  const domainsEnabled = domainResults.filter(r => r.status === 'success').length;
  console.log(`\n✅ ${domainsEnabled}/${UNIQUE_DOMAINS.length} domains processed\n`);
  
  // Step 2: Create all users
  console.log('👥 Step 2: Creating users...\n');
  const userResults = {
    created: 0,
    exists: 0,
    error: 0,
  };
  
  for (const userData of USERS_DATA) {
    const result = await createUser(userData);
    if (result === 'created') userResults.created++;
    else if (result === 'exists') userResults.exists++;
    else if (result === 'error') userResults.error++;
  }
  
  console.log(`\n✅ All ${USERS_DATA.length} users processed\n`);
  
  // Step 3: Summary
  console.log('=' .repeat(60));
  console.log('🎉 COMPLETE SUMMARY');
  console.log('=' .repeat(60));
  console.log(`\n📋 Domains:`);
  console.log(`   Total: ${UNIQUE_DOMAINS.length}`);
  console.log(`   Enabled: ${domainsEnabled}`);
  domainResults.forEach(r => {
    const icon = r.status === 'success' ? '✅' : '❌';
    console.log(`   ${icon} ${r.domain} - ${r.action}`);
  });
  
  console.log(`\n👥 Users:`);
  console.log(`   Total: ${USERS_DATA.length}`);
  console.log(`   Created: ${userResults.created}`);
  console.log(`   Already existed: ${userResults.exists}`);
  console.log(`   Errors: ${userResults.error}`);
  console.log(`   All users have role: user`);
  console.log(`   All users have basic permissions\n`);
  
  if (userResults.created > 0 || domainsEnabled > 0) {
    console.log('✅ Operations completed successfully!\n');
  } else {
    console.log('⚠️  No new users or domains created (all already exist)\n');
  }
}

main().catch(console.error);

