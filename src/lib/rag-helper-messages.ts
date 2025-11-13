/**
 * RAG Helper Messages
 * 
 * Generates helpful messages for users when RAG cannot find relevant documents
 * Includes admin contact information and feedback encouragement
 */

import { firestore } from './firestore.js';

/**
 * Get organization admin emails for a user (excluding superadmins)
 * Returns regular admins that the user can contact
 */
export async function getOrgAdminContactsForUser(userEmail: string): Promise<string[]> {
  try {
    const userDomain = userEmail.split('@')[1]?.toLowerCase();
    if (!userDomain) {
      console.warn('⚠️ Could not extract domain from email:', userEmail);
      return [];
    }
    
    console.log(`📧 Finding admins for domain: ${userDomain}`);
    
    // 1. Find organization by domain
    const orgsSnapshot = await firestore
      .collection('organizations')
      .where('domains', 'array-contains', userDomain)
      .where('isActive', '==', true)
      .limit(1)
      .get();
    
    if (orgsSnapshot.empty) {
      console.log('  ℹ️ No organization found for domain');
      return [];
    }
    
    const orgData = orgsSnapshot.docs[0].data();
    const orgId = orgsSnapshot.docs[0].id;
    const adminUserIds = orgData.admins || [];
    
    console.log(`  ✅ Found org: ${orgData.name}, ${adminUserIds.length} admins`);
    
    if (adminUserIds.length === 0) {
      return [];
    }
    
    // 2. Get admin user documents
    const adminEmails: string[] = [];
    const superadminEmails = ['alec@getaifactory.com', 'admin@getaifactory.com'];
    
    for (const adminId of adminUserIds) {
      try {
        const userDoc = await firestore.collection('users').doc(adminId).get();
        if (userDoc.exists) {
          const email = userDoc.data()?.email;
          // Exclude superadmins - users should contact org admins, not platform admins
          if (email && !superadminEmails.includes(email.toLowerCase())) {
            adminEmails.push(email);
          }
        }
      } catch (err) {
        console.error(`  ⚠️ Could not fetch admin ${adminId}:`, err);
      }
    }
    
    console.log(`  ✅ Found ${adminEmails.length} org admin emails:`, adminEmails);
    
    return adminEmails;
    
  } catch (error) {
    console.error('❌ Error getting admin contacts:', error);
    return [];
  }
}

/**
 * Generate message for AI when no relevant documents found above 70% threshold
 * Instructs AI to inform user and provide admin contact
 */
export function generateNoRelevantDocsMessage(
  adminEmails: string[],
  query: string
): string {
  const hasAdmins = adminEmails.length > 0;
  const adminContactInfo = hasAdmins 
    ? `Puedes contactar a tu administrador para solicitar documentos relevantes:\n${adminEmails.map(email => `  • ${email}`).join('\n')}`
    : 'Puedes contactar a tu administrador para solicitar documentos relevantes.';
  
  return `NOTA IMPORTANTE: No se encontraron documentos con alta relevancia (>70% de similitud) para esta consulta específica.

INSTRUCCIONES PARA TU RESPUESTA:
1. Informa al usuario que no encontramos el documento que estaba buscando
2. Explica que los documentos actuales no contienen información suficientemente relevante para su pregunta
3. Invita al usuario a reportar esto usando el botón "Calificar" (⭐ en la esquina superior derecha)
4. Sugiere que mencione en los comentarios:
   - Los nombres de los documentos donde debería estar esta información (si los conoce)
   - Puede subir los documentos si los tiene, para que el Admin los revise
5. Proporciona la siguiente información de contacto:
   ${adminContactInfo}

EJEMPLO DE RESPUESTA:
"No encontramos el documento que buscabas, o la información disponible en los documentos actuales no tiene suficiente relevancia para tu pregunta.

📋 **Por favor, repórtalo:**
- Haz clic en el botón **"Calificar"** (⭐) en la esquina superior derecha
- En los comentarios, menciona los nombres de los documentos donde debería estar esta información (si los conoces)
- Si tienes los documentos, puedes subirlos para que el Admin los revise y los agregue a la plataforma

📧 **Contacto directo:**
${adminContactInfo}

💡 **Ayúdanos a mejorar:**
Tu feedback ayuda al equipo a identificar qué documentación hace falta y priorizarla.

¿Hay algo más en lo que pueda ayudarte con la información disponible?"`;
}

/**
 * Check if RAG results meet quality threshold (70%+)
 * Returns true if we should use RAG results, false if we should inform user
 */
export function meetsQualityThreshold(
  ragResults: Array<{ similarity?: number }>,
  minThreshold: number = 0.7
): boolean {
  if (!ragResults || ragResults.length === 0) {
    return false;
  }
  
  // Check if at least one chunk meets the threshold
  const hasHighQualityMatch = ragResults.some(r => (r.similarity || 0) >= minThreshold);
  
  if (!hasHighQualityMatch) {
    const maxSimilarity = Math.max(...ragResults.map(r => r.similarity || 0));
    console.log(`⚠️ Quality threshold not met: Best similarity ${(maxSimilarity * 100).toFixed(1)}% < ${(minThreshold * 100).toFixed(0)}%`);
  }
  
  return hasHighQualityMatch;
}

/**
 * Log when no relevant documents found (for analytics)
 */
export async function logNoRelevantDocuments(data: {
  userId: string;
  conversationId: string;
  query: string;
  bestSimilarity: number;
  threshold: number;
  totalChunksSearched: number;
}): Promise<void> {
  try {
    await firestore.collection('rag_quality_logs').add({
      ...data,
      type: 'no_relevant_docs',
      timestamp: new Date(),
      source: process.env.NODE_ENV === 'production' ? 'production' : 'localhost',
    });
    
    console.log('📊 Logged no-relevant-docs event for analytics');
  } catch (error) {
    console.warn('⚠️ Could not log no-relevant-docs (non-critical):', error);
  }
}

