#!/usr/bin/env tsx
/**
 * Script para cambiar el tema de un usuario específico en Firestore
 * 
 * Uso: npx tsx scripts/set-user-theme.ts <email> <theme>
 * Ejemplo: npx tsx scripts/set-user-theme.ts alec@getaifactory.com dark
 */

import { firestore } from '../src/lib/firestore.js';

async function setUserTheme(email: string, theme: 'light' | 'dark') {
  console.log(`🎨 Configurando tema para: ${email}`);
  console.log(`   Tema solicitado: ${theme}`);
  console.log('');

  try {
    // 1. Find user by email
    console.log('1️⃣ Buscando usuario...');
    const usersSnapshot = await firestore
      .collection('users')
      .where('email', '==', email)
      .get();

    if (usersSnapshot.empty) {
      console.log(`❌ Usuario no encontrado: ${email}`);
      process.exit(1);
    }

    const userDoc = usersSnapshot.docs[0];
    const userDocId = userDoc.id;
    const userData = userDoc.data();
    
    // Use the numeric userId if it exists, otherwise use doc ID
    const userId = userData.id || userDocId;
    
    console.log(`✅ Usuario encontrado:`);
    console.log(`   Document ID: ${userDocId}`);
    console.log(`   User ID (numeric): ${userId}`);
    console.log('');

    // 2. Update theme in users collection
    console.log('2️⃣ Actualizando tema en collection "users"...');
    await firestore.collection('users').doc(userId).update({
      theme: theme,
      updatedAt: new Date(),
    });
    console.log(`✅ Tema actualizado en "users": ${theme}`);
    console.log('');

    // 3. Check if user_settings exists
    console.log('3️⃣ Verificando user_settings...');
    const settingsDoc = await firestore
      .collection('user_settings')
      .doc(userId)
      .get();

    if (settingsDoc.exists) {
      // Update existing settings
      console.log('   📝 user_settings existe, actualizando...');
      await firestore.collection('user_settings').doc(userId).update({
        theme: theme,
        updatedAt: new Date(),
      });
      console.log(`✅ Tema actualizado en "user_settings": ${theme}`);
    } else {
      // Create new settings with theme
      console.log('   📝 user_settings no existe, creando con valores default...');
      await firestore.collection('user_settings').doc(userId).set({
        userId: userId,
        preferredModel: 'gemini-2.5-flash',
        systemPrompt: 'Eres un asistente útil y profesional. Responde de manera clara y concisa.',
        language: 'es',
        theme: theme,
        createdAt: new Date(),
        updatedAt: new Date(),
        source: 'localhost',
      });
      console.log(`✅ user_settings creado con tema: ${theme}`);
    }
    console.log('');

    // 4. Verify changes
    console.log('4️⃣ Verificando cambios...');
    const updatedUserDoc = await firestore.collection('users').doc(userId).get();
    const updatedSettingsDoc = await firestore.collection('user_settings').doc(userId).get();
    
    const verifyUserData = updatedUserDoc.data();
    const verifySettingsData = updatedSettingsDoc.data();

    console.log('✅ Verificación completa:');
    console.log(`   users.theme: ${verifyUserData?.theme}`);
    console.log(`   user_settings.theme: ${verifySettingsData?.theme}`);
    console.log('');

    console.log('🎉 Tema actualizado exitosamente!');
    console.log('');
    console.log('📌 Próximos pasos:');
    console.log('   1. Abre la aplicación en el navegador');
    console.log('   2. Haz login con: ' + email);
    console.log('   3. La interfaz debería cargar en modo oscuro');
    console.log('   4. Verifica que los colores cambien correctamente');
    console.log('');

  } catch (error) {
    console.error('❌ Error al actualizar tema:', error);
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
if (args.length !== 2) {
  console.log('❌ Uso incorrecto');
  console.log('');
  console.log('Uso: npx tsx scripts/set-user-theme.ts <email> <theme>');
  console.log('');
  console.log('Ejemplos:');
  console.log('  npx tsx scripts/set-user-theme.ts alec@getaifactory.com dark');
  console.log('  npx tsx scripts/set-user-theme.ts alec@getaifactory.com light');
  console.log('');
  process.exit(1);
}

const [email, theme] = args;

if (theme !== 'light' && theme !== 'dark') {
  console.log('❌ Tema inválido. Debe ser "light" o "dark"');
  process.exit(1);
}

setUserTheme(email, theme as 'light' | 'dark')
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  });

