#!/usr/bin/env tsx
/**
 * Script para verificar el tema de TODOS los usuarios
 * Muestra una tabla completa del estado actual
 */

import { firestore } from '../src/lib/firestore.js';

async function checkAllUserThemes() {
  console.log('🔍 Verificando temas de TODOS los usuarios en Firestore...\n');

  try {
    // Get all users
    const usersSnapshot = await firestore.collection('users').get();
    
    if (usersSnapshot.empty) {
      console.log('⚠️ No se encontraron usuarios');
      return;
    }

    // Get all user_settings
    const settingsSnapshot = await firestore.collection('user_settings').get();
    const settingsMap = new Map();
    
    settingsSnapshot.docs.forEach(doc => {
      settingsMap.set(doc.id, doc.data());
    });

    console.log('┌────────────────────────────────────────────────────────────────────────┐');
    console.log('│              TEMAS DE USUARIOS - ESTADO ACTUAL                         │');
    console.log('├────────────────────────────────┬───────────┬──────────────────────────┤');
    console.log('│ Email                          │ Tema      │ Estado                   │');
    console.log('├────────────────────────────────┼───────────┼──────────────────────────┤');

    const results: Array<{
      email: string;
      userId: string;
      theme: string;
      hasSettings: boolean;
    }> = [];

    for (const doc of usersSnapshot.docs) {
      const userData = doc.data();
      const userId = userData.id || doc.id;
      const settings = settingsMap.get(userId);
      
      const theme = settings?.theme || userData.theme || 'undefined';
      const hasSettings = !!settings;
      
      results.push({
        email: userData.email || 'N/A',
        userId: userId,
        theme: theme,
        hasSettings: hasSettings,
      });
    }

    // Sort by email
    results.sort((a, b) => a.email.localeCompare(b.email));

    // Display table
    results.forEach(user => {
      const email = user.email.padEnd(30, ' ').substring(0, 30);
      const theme = user.theme.padEnd(9, ' ');
      const estado = user.theme === 'undefined' ? '✅ Default (light)' : 
                     user.theme === 'light' ? '✅ Light (explícito)' :
                     user.theme === 'dark' ? '⚠️ Dark (custom)' : '❓ Unknown';
      
      console.log(`│ ${email} │ ${theme} │ ${estado.padEnd(24, ' ')} │`);
    });
    
    console.log('└────────────────────────────────┴───────────┴──────────────────────────┘');
    console.log('');

    // Summary
    const totalUsers = results.length;
    const withSettings = results.filter(u => u.hasSettings).length;
    const lightTheme = results.filter(u => u.theme === 'light').length;
    const darkTheme = results.filter(u => u.theme === 'dark').length;
    const undefinedTheme = results.filter(u => u.theme === 'undefined').length;

    console.log('📊 Resumen:');
    console.log(`   Total usuarios: ${totalUsers}`);
    console.log(`   Con user_settings: ${withSettings}`);
    console.log(`   Light mode: ${lightTheme}`);
    console.log(`   Dark mode: ${darkTheme}`);
    console.log(`   Sin tema definido (usarán default light): ${undefinedTheme}`);
    console.log('');

    console.log('✅ Todos los usuarios sin tema definido usarán Light mode por defecto');
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkAllUserThemes()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  });

