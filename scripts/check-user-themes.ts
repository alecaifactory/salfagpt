#!/usr/bin/env tsx
/**
 * Script para verificar el tema configurado de cada usuario
 * 
 * Muestra una tabla con:
 * - Email del usuario
 * - Tema configurado (light/dark/undefined)
 * - Si usa el default
 */

import { firestore } from '../src/lib/firestore.js';

interface UserDoc {
  userId: string;
  email?: string;
  name?: string;
  theme?: 'light' | 'dark';
}

async function checkUserThemes() {
  console.log('🔍 Verificando temas de usuarios en Firestore...\n');

  try {
    // Get all users
    const usersSnapshot = await firestore.collection('users').get();
    
    if (usersSnapshot.empty) {
      console.log('⚠️ No se encontraron usuarios en Firestore');
      return;
    }

    const users: UserDoc[] = [];
    
    for (const doc of usersSnapshot.docs) {
      const data = doc.data();
      users.push({
        userId: doc.id,
        email: data.email || 'N/A',
        name: data.name || 'N/A',
        theme: data.theme,
      });
    }

    // Get user settings for each user
    const userSettingsSnapshot = await firestore.collection('user_settings').get();
    const settingsMap = new Map();
    
    userSettingsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      settingsMap.set(doc.id, {
        theme: data.theme,
      });
    });

    // Merge data
    const fullData = users.map(user => {
      const settings = settingsMap.get(user.userId);
      return {
        ...user,
        themeInSettings: settings?.theme,
      };
    });

    // Display table
    console.log('┌─────────────────────────────────────────────────────────────────────────────────┐');
    console.log('│                        TEMAS DE USUARIOS - ESTADO ACTUAL                        │');
    console.log('├──────────────────────────────────┬──────────────┬──────────────┬───────────────┤');
    console.log('│ Email                            │ Tema (users) │ Tema (sets)  │ Estado        │');
    console.log('├──────────────────────────────────┼──────────────┼──────────────┼───────────────┤');
    
    fullData.forEach(user => {
      const email = user.email.padEnd(32, ' ').substring(0, 32);
      const themeUsers = (user.theme || 'undefined').padEnd(12, ' ');
      const themeSettings = (user.themeInSettings || 'undefined').padEnd(12, ' ');
      const isDefault = (!user.theme && !user.themeInSettings) ? '✅ Default' : '⚠️ Custom';
      
      console.log(`│ ${email} │ ${themeUsers} │ ${themeSettings} │ ${isDefault}     │`);
    });
    
    console.log('└──────────────────────────────────┴──────────────┴──────────────┴───────────────┘');
    console.log('');

    // Summary statistics
    const totalUsers = fullData.length;
    const lightInUsers = fullData.filter(u => u.theme === 'light').length;
    const darkInUsers = fullData.filter(u => u.theme === 'dark').length;
    const lightInSettings = fullData.filter(u => u.themeInSettings === 'light').length;
    const darkInSettings = fullData.filter(u => u.themeInSettings === 'dark').length;
    const undefinedTheme = fullData.filter(u => !u.theme && !u.themeInSettings).length;

    console.log('📊 Resumen:');
    console.log(`   Total usuarios: ${totalUsers}`);
    console.log(`   Light mode (users collection): ${lightInUsers}`);
    console.log(`   Dark mode (users collection): ${darkInUsers}`);
    console.log(`   Light mode (user_settings): ${lightInSettings}`);
    console.log(`   Dark mode (user_settings): ${darkInSettings}`);
    console.log(`   Sin tema definido: ${undefinedTheme}`);
    console.log('');

    // Default behavior
    console.log('ℹ️ Comportamiento actual:');
    console.log('   - localStorage: Si no hay valor, usa "light" por defecto');
    console.log('   - UserSettingsModal: Inicializa con "light" si no existe');
    console.log('   - Conclusión: Light mode YA es el default');
    console.log('');

  } catch (error) {
    console.error('❌ Error al verificar temas:', error);
    process.exit(1);
  }
}

checkUserThemes()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  });

