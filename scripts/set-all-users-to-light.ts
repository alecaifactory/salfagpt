#!/usr/bin/env tsx
/**
 * Script para establecer Light mode para todos los usuarios que tienen tema undefined
 * 
 * Esto asegura que el tema esté explícitamente guardado en Firestore
 */

async function setAllUsersToLight() {
  console.log('🎨 Estableciendo Light mode para todos los usuarios con tema undefined...\n');

  try {
    const API_BASE = 'http://localhost:3000';
    
    // Lista de todos los user IDs (basado en los logs)
    const users = [
      { email: 'alec@getaifactory.com', userId: '114671162830729001607' },
      // Los otros usuarios necesitarían sus IDs numéricos
      // Por ahora vamos a usar el API para obtenerlos
    ];

    // Para cada usuario, verificar y actualizar si es undefined
    console.log('📋 Procesando usuarios...\n');
    
    for (const user of users) {
      console.log(`Verificando: ${user.email}`);
      
      // 1. Get current settings
      const response = await fetch(`${API_BASE}/api/user-settings?userId=${user.userId}`);
      const settings = await response.json();
      
      console.log(`   Tema actual: ${settings.theme || 'undefined'}`);
      
      // 2. If undefined or not light, set to light
      if (!settings.theme || settings.theme === 'undefined') {
        console.log(`   ➡️  Actualizando a 'light'...`);
        
        const saveResponse = await fetch(`${API_BASE}/api/user-settings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.userId,
            preferredModel: settings.preferredModel || 'gemini-2.5-flash',
            systemPrompt: settings.systemPrompt || 'Eres un asistente útil y profesional. Responde de manera clara y concisa.',
            language: settings.language || 'es',
            theme: 'light',
          }),
        });
        
        if (saveResponse.ok) {
          const saved = await saveResponse.json();
          console.log(`   ✅ Actualizado a: ${saved.theme}`);
        } else {
          console.log(`   ❌ Error al actualizar`);
        }
      } else {
        console.log(`   ✅ Ya tiene tema: ${settings.theme}`);
      }
      
      console.log('');
    }
    
    console.log('🎉 Proceso completado!\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

setAllUsersToLight()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  });

