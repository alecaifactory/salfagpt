#!/usr/bin/env tsx
/**
 * Bulk Create Salfacorp Users using Firebase Admin SDK
 * 
 * Uses Firebase Admin SDK which bypasses Firestore security rules.
 * All users created with 'user' role (standard permissions).
 * 
 * Usage:
 *   npx tsx scripts/create-salfacorp-users-admin.ts
 */

import admin from 'firebase-admin';
import type { UserRole } from '../src/types/users.js';
import { ROLE_PERMISSIONS } from '../src/types/users.js';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: process.env.GOOGLE_CLOUD_PROJECT || 'gen-lang-client-0986191192',
  });
}

const db = admin.firestore();

// CSV data parsed from user request
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

/**
 * Map domain to company name
 */
function getCompanyFromDomain(domain: string): string {
  const domainMap: Record<string, string> = {
    'salfagestion.cl': 'Salfa Gestión',
    'salfamontajes.com': 'Salfa Montajes',
    'fegrande.cl': 'FE Grande',
    'geovita.cl': 'Geovita',
    'salfaustral.cl': 'Salfa Austral',
    'novatec.cl': 'Novatec',
    'salfamantenciones.cl': 'Salfa Mantenciones',
    'tecsa.cl': 'Tecsa',
    'maqsa.cl': 'Maqsa',
    'salfacorp.com': 'Salfa Corp',
    'salfacloud.cl': 'Salfa Cloud',
    'iaconcagua.com': 'IA Concagua',
    'inoval.cl': 'Inoval',
  };

  return domainMap[domain] || domain;
}

/**
 * Get merged permissions for multiple roles
 */
function getMergedPermissions(roles: UserRole[]): any {
  const merged: any = {};
  roles.forEach(role => {
    const rolePerms = ROLE_PERMISSIONS[role] || {};
    Object.keys(rolePerms).forEach(key => {
      merged[key] = merged[key] || rolePerms[key] || false;
    });
  });
  return merged;
}

/**
 * Main function to create all users
 */
async function createSalfacorpUsers() {
  console.log('👥 Creando usuarios de Salfacorp usando Firebase Admin SDK...');
  console.log('========================================================');
  console.log(`📊 Total usuarios a crear: ${USERS_DATA.length}`);
  console.log(`🔧 Proyecto: ${process.env.GOOGLE_CLOUD_PROJECT || 'gen-lang-client-0986191192'}`);
  console.log('');

  const results = {
    created: [] as string[],
    skipped: [] as string[],
    errors: [] as Array<{ email: string; error: string }>,
  };

  for (const userData of USERS_DATA) {
    try {
      const userId = userData.email.replace(/[@.]/g, '_');
      const company = getCompanyFromDomain(userData.domain);
      
      console.log(`📝 Procesando: ${userData.fullName} (${userData.email})...`);
      
      // Check if user already exists
      const existingUser = await db.collection('users').doc(userId).get();
      
      if (existingUser.exists) {
        console.log(`   ⏭️  Usuario ya existe, omitiendo: ${userId}`);
        results.skipped.push(userData.email);
        continue;
      }
      
      const now = new Date();
      const roles: UserRole[] = ['user'];
      
      const newUser = {
        email: userData.email,
        name: userData.fullName,
        role: 'user' as UserRole,
        roles,
        permissions: getMergedPermissions(roles),
        company,
        department: undefined,
        createdBy: 'alec@getaifactory.com',
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        isActive: true,
        agentAccessCount: 0,
        contextAccessCount: 0,
      };

      await db.collection('users').doc(userId).set(newUser);

      results.created.push(userData.email);
      console.log(`   ✅ Usuario creado: ${userId}`);
      console.log(`   📧 Email: ${userData.email}`);
      console.log(`   🏢 Company: ${company}`);
      console.log(`   👤 Role: user`);
      console.log('');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`   ❌ Error creando ${userData.email}:`, errorMessage);
      results.errors.push({ email: userData.email, error: errorMessage });
      console.log('');
    }
  }

  // Summary
  console.log('');
  console.log('📊 Resumen de Creación de Usuarios');
  console.log('====================================');
  console.log(`✅ Creados exitosamente: ${results.created.length}`);
  console.log(`⏭️  Omitidos (ya existían): ${results.skipped.length}`);
  console.log(`❌ Errores: ${results.errors.length}`);
  console.log('');

  if (results.created.length > 0) {
    console.log('✅ Usuarios creados:');
    results.created.forEach(email => {
      console.log(`   - ${email}`);
    });
    console.log('');
  }

  if (results.skipped.length > 0) {
    console.log('⏭️  Usuarios omitidos:');
    results.skipped.forEach(email => {
      console.log(`   - ${email}`);
    });
    console.log('');
  }

  if (results.errors.length > 0) {
    console.log('❌ Errores:');
    results.errors.forEach(({ email, error }) => {
      console.log(`   - ${email}: ${error}`);
    });
    console.log('');
  }

  // Company breakdown
  const companyCounts = new Map<string, number>();
  USERS_DATA.forEach(userData => {
    const company = getCompanyFromDomain(userData.domain);
    companyCounts.set(company, (companyCounts.get(company) || 0) + 1);
  });

  console.log('📊 Desglose por Empresa:');
  Array.from(companyCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .forEach(([company, count]) => {
      console.log(`   ${company}: ${count} usuarios`);
    });
  console.log('');

  console.log('✅ Script completado');
  console.log('');
  console.log('💡 Los usuarios han sido creados con rol "user" (permisos estándar)');
  console.log('💡 Pueden iniciar sesión con Google OAuth usando sus emails corporativos');
  console.log('💡 Si necesitas cambiar roles, usa el panel de User Management en la UI');
  console.log('💡 O actualiza manualmente en Firestore Console');
  
  process.exit(0);
}

// Run the script
createSalfacorpUsers().catch(error => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});

