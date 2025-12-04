#!/usr/bin/env node
/**
 * Feedback por Agente y Usuario - Plataforma Flow
 * 
 * Genera un reporte en markdown organizado por agente y usuario
 * con toda la información de feedback, CSAT y NPS
 * 
 * Uso: node scripts/feedback-por-agente-usuario.mjs
 */

import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Leer variables de entorno
const envPath = join(__dirname, '..', '.env');
const envContent = readFileSync(envPath, 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length) {
    envVars[key.trim()] = valueParts.join('=').trim();
  }
});

const PROJECT_ID = envVars.GOOGLE_CLOUD_PROJECT || 'salfagpt';

console.log('🔧 Inicializando conexión a Firestore...');
console.log(`📊 Proyecto: ${PROJECT_ID}\n`);

// Inicializar Firebase Admin
try {
  initializeApp({
    projectId: PROJECT_ID,
  });
} catch (error) {
  if (!error.message.includes('already exists')) {
    console.error('❌ Error al inicializar Firebase:', error);
    process.exit(1);
  }
}

const firestore = getFirestore();

/**
 * Hash de user ID para privacidad
 */
function hashUserId(userId) {
  if (!userId) return 'desconocido';
  return userId.substring(0, 8) + '...';
}

/**
 * Extraer dominio del email
 */
function obtenerDominio(email) {
  if (!email) return 'desconocido';
  const partes = email.split('@');
  return partes.length > 1 ? partes[1] : 'desconocido';
}

/**
 * Obtener organización del dominio
 */
function obtenerOrganizacion(dominio) {
  const mapaOrg = {
    'salfagestion.cl': 'Salfa Corp',
    'salfa.cl': 'Salfa Corp',
    'maqsa.cl': 'Salfa Corp',
    'getaifactory.com': 'AI Factory',
    'gmail.com': 'Personal/Externo',
  };
  
  return mapaOrg[dominio] || 'Desconocido';
}

/**
 * Formatear fecha
 */
function formatearFecha(timestamp) {
  if (!timestamp) return 'N/A';
  const fecha = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return fecha.toISOString().substring(0, 16).replace('T', ' ');
}

/**
 * Obtener estrella de rating
 */
function obtenerEstrellas(rating, max = 5) {
  if (typeof rating !== 'number') return 'N/A';
  return '⭐'.repeat(rating) + '☆'.repeat(max - rating);
}

/**
 * Función principal
 */
async function generarReportePorAgenteUsuario() {
  try {
    console.log('📥 Obteniendo todos los feedbacks...\n');
    
    // Obtener todos los feedbacks
    const feedbackSnapshot = await firestore
      .collection('message_feedback')
      .orderBy('timestamp', 'desc')
      .get();
    
    console.log(`✅ Encontrados ${feedbackSnapshot.size} feedbacks\n`);
    
    // Obtener todos los agentes únicos de los feedbacks
    const conversationIds = new Set();
    feedbackSnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.conversationId) {
        conversationIds.add(data.conversationId);
      }
    });
    
    console.log(`📊 Encontrados ${conversationIds.size} agentes únicos\n`);
    
    // Obtener información de agentes
    const agentes = {};
    for (const convId of conversationIds) {
      try {
        const convDoc = await firestore.collection('conversations').doc(convId).get();
        if (convDoc.exists) {
          const convData = convDoc.data();
          agentes[convId] = {
            id: convId,
            titulo: convData.title || 'Sin título',
            modelo: convData.agentModel || 'gemini-2.5-flash',
            ownerId: convData.userId,
          };
        } else {
          agentes[convId] = {
            id: convId,
            titulo: 'Agente eliminado o no disponible',
            modelo: 'N/A',
            ownerId: 'N/A',
          };
        }
      } catch (error) {
        console.warn(`⚠️  No se pudo obtener info del agente ${convId}`);
        agentes[convId] = {
          id: convId,
          titulo: 'Error al cargar',
          modelo: 'N/A',
          ownerId: 'N/A',
        };
      }
    }
    
    // Organizar por agente, luego por usuario
    const reportePorAgente = {};
    
    for (const doc of feedbackSnapshot.docs) {
      const data = doc.data();
      const agentId = data.conversationId || 'sin-agente';
      const userId = data.userId;
      
      if (!reportePorAgente[agentId]) {
        reportePorAgente[agentId] = {
          agente: agentes[agentId] || { id: agentId, titulo: 'Desconocido', modelo: 'N/A' },
          usuarios: {},
        };
      }
      
      if (!reportePorAgente[agentId].usuarios[userId]) {
        reportePorAgente[agentId].usuarios[userId] = {
          userId,
          hashId: hashUserId(userId),
          email: data.userEmail,
          rol: data.userRole,
          dominio: obtenerDominio(data.userEmail),
          organizacion: obtenerOrganizacion(obtenerDominio(data.userEmail)),
          feedbacks: [],
        };
      }
      
      // Extraer datos del feedback
      let rating, comentario, csat, nps;
      
      if (data.feedbackType === 'expert') {
        rating = data.expertRating || 'N/A';
        comentario = data.expertNotes || '';
        csat = data.csatScore !== undefined ? data.csatScore : null;
        nps = data.npsScore !== undefined ? data.npsScore : null;
      } else {
        rating = data.userStars !== undefined ? data.userStars : null;
        comentario = data.userComment || '';
        csat = data.userStars !== undefined ? data.userStars : null;
        nps = null;
      }
      
      reportePorAgente[agentId].usuarios[userId].feedbacks.push({
        id: doc.id,
        tipo: data.feedbackType,
        rating,
        comentario,
        csat,
        nps,
        fecha: formatearFecha(data.timestamp),
        ticketId: data.ticketId || 'N/A',
      });
    }
    
    // Generar markdown
    let markdown = '';
    
    markdown += '# 📊 Reporte de Feedback por Agente y Usuario\n\n';
    markdown += `**Fecha de generación:** ${new Date().toISOString().substring(0, 10)}\n\n`;
    markdown += `**Total de feedbacks:** ${feedbackSnapshot.size}\n\n`;
    markdown += `**Total de agentes:** ${Object.keys(reportePorAgente).length}\n\n`;
    markdown += '---\n\n';
    
    // Ordenar agentes por cantidad de feedback (descendente)
    const agentesOrdenados = Object.entries(reportePorAgente)
      .sort((a, b) => {
        const totalA = Object.values(a[1].usuarios).reduce((sum, u) => sum + u.feedbacks.length, 0);
        const totalB = Object.values(b[1].usuarios).reduce((sum, u) => sum + u.feedbacks.length, 0);
        return totalB - totalA;
      });
    
    for (const [agentId, agenteData] of agentesOrdenados) {
      const { agente, usuarios } = agenteData;
      const totalFeedbacksAgente = Object.values(usuarios).reduce((sum, u) => sum + u.feedbacks.length, 0);
      
      markdown += `## 🤖 Agente: ${agente.titulo}\n\n`;
      markdown += `- **ID Agente:** \`${agentId.substring(0, 12)}...\`\n`;
      markdown += `- **Modelo:** ${agente.modelo}\n`;
      markdown += `- **Total Feedbacks:** ${totalFeedbacksAgente}\n\n`;
      
      // Ordenar usuarios por cantidad de feedback
      const usuariosOrdenados = Object.values(usuarios)
        .sort((a, b) => b.feedbacks.length - a.feedbacks.length);
      
      for (const usuario of usuariosOrdenados) {
        markdown += `### 👤 Usuario: ${usuario.email}\n\n`;
        markdown += `| Campo | Valor |\n`;
        markdown += `|-------|-------|\n`;
        markdown += `| **Hash ID** | \`${usuario.hashId}\` |\n`;
        markdown += `| **User ID Completo** | \`${usuario.userId}\` |\n`;
        markdown += `| **Email** | ${usuario.email} |\n`;
        markdown += `| **Rol** | ${usuario.rol} |\n`;
        markdown += `| **Organización** | ${usuario.organizacion} |\n`;
        markdown += `| **Dominio** | ${usuario.dominio} |\n`;
        markdown += `| **Total Feedbacks** | ${usuario.feedbacks.length} |\n\n`;
        
        // Calcular promedios
        const csatScores = usuario.feedbacks.map(f => f.csat).filter(s => s !== null);
        const npsScores = usuario.feedbacks.map(f => f.nps).filter(s => s !== null);
        
        if (csatScores.length > 0) {
          const promedioCSAT = csatScores.reduce((a, b) => a + b, 0) / csatScores.length;
          markdown += `**📊 Promedio CSAT:** ${promedioCSAT.toFixed(2)}/5 ${obtenerEstrellas(Math.round(promedioCSAT))}\n\n`;
        }
        
        if (npsScores.length > 0) {
          const promedioNPS = npsScores.reduce((a, b) => a + b, 0) / npsScores.length;
          const categoria = promedioNPS >= 9 ? 'Promotor' : promedioNPS >= 7 ? 'Pasivo' : 'Detractor';
          markdown += `**📊 Promedio NPS:** ${promedioNPS.toFixed(2)}/10 (${categoria})\n\n`;
        }
        
        markdown += `#### 📝 Historial de Feedbacks\n\n`;
        
        usuario.feedbacks.forEach((f, idx) => {
          markdown += `**${idx + 1}. [${f.fecha}] - ${f.tipo.toUpperCase()}**\n\n`;
          
          if (f.tipo === 'expert') {
            markdown += `- **Rating Experto:** ${f.rating}\n`;
            markdown += `- **CSAT:** ${f.csat ?? 'N/A'}/5`;
            if (f.csat !== null) {
              markdown += ` ${obtenerEstrellas(f.csat)}`;
            }
            markdown += '\n';
            markdown += `- **NPS:** ${f.nps ?? 'N/A'}/10\n`;
          } else {
            markdown += `- **Estrellas:** ${f.rating}/5`;
            if (typeof f.rating === 'number') {
              markdown += ` ${obtenerEstrellas(f.rating)}`;
            }
            markdown += '\n';
            markdown += `- **CSAT:** ${f.csat ?? 'N/A'}/5\n`;
          }
          
          if (f.comentario) {
            markdown += `- **Comentario:**\n  > ${f.comentario}\n`;
          }
          
          markdown += `- **Ticket ID:** \`${f.ticketId}\`\n`;
          markdown += `- **Feedback ID:** \`${f.id}\`\n\n`;
        });
        
        markdown += '\n---\n\n';
      }
    }
    
    // Agregar resumen estadístico
    markdown += '## 📈 Resumen Estadístico General\n\n';
    
    const todosLosUsuarios = [];
    for (const agenteData of Object.values(reportePorAgente)) {
      todosLosUsuarios.push(...Object.values(agenteData.usuarios));
    }
    
    const usuariosUnicos = [...new Set(todosLosUsuarios.map(u => u.userId))];
    const totalFeedbacks = todosLosUsuarios.reduce((sum, u) => sum + u.feedbacks.length, 0);
    
    markdown += `### Totales\n\n`;
    markdown += `- **Usuarios únicos:** ${usuariosUnicos.length}\n`;
    markdown += `- **Agentes con feedback:** ${Object.keys(reportePorAgente).length}\n`;
    markdown += `- **Total feedbacks:** ${totalFeedbacks}\n\n`;
    
    // Por organización
    markdown += `### Por Organización\n\n`;
    const porOrg = {};
    todosLosUsuarios.forEach(u => {
      const org = u.organizacion;
      if (!porOrg[org]) porOrg[org] = { usuarios: new Set(), feedbacks: 0 };
      porOrg[org].usuarios.add(u.userId);
      porOrg[org].feedbacks += u.feedbacks.length;
    });
    
    markdown += '| Organización | Usuarios | Feedbacks |\n';
    markdown += '|--------------|----------|----------|\n';
    Object.entries(porOrg)
      .sort((a, b) => b[1].feedbacks - a[1].feedbacks)
      .forEach(([org, data]) => {
        markdown += `| ${org} | ${data.usuarios.size} | ${data.feedbacks} |\n`;
      });
    
    markdown += '\n';
    
    // Por dominio
    markdown += `### Por Dominio\n\n`;
    const porDominio = {};
    todosLosUsuarios.forEach(u => {
      const dom = u.dominio;
      if (!porDominio[dom]) porDominio[dom] = { usuarios: new Set(), feedbacks: 0 };
      porDominio[dom].usuarios.add(u.userId);
      porDominio[dom].feedbacks += u.feedbacks.length;
    });
    
    markdown += '| Dominio | Usuarios | Feedbacks |\n';
    markdown += '|---------|----------|----------|\n';
    Object.entries(porDominio)
      .sort((a, b) => b[1].feedbacks - a[1].feedbacks)
      .forEach(([dom, data]) => {
        markdown += `| ${dom} | ${data.usuarios.size} | ${data.feedbacks} |\n`;
      });
    
    markdown += '\n';
    
    // CSAT y NPS globales
    const todosCSAT = [];
    const todosNPS = [];
    
    todosLosUsuarios.forEach(u => {
      u.feedbacks.forEach(f => {
        if (f.csat !== null) todosCSAT.push(f.csat);
        if (f.nps !== null) todosNPS.push(f.nps);
      });
    });
    
    markdown += `### Métricas de Satisfacción\n\n`;
    
    if (todosCSAT.length > 0) {
      const promedioCSAT = todosCSAT.reduce((a, b) => a + b, 0) / todosCSAT.length;
      markdown += `- **CSAT Promedio:** ${promedioCSAT.toFixed(2)}/5 ${obtenerEstrellas(Math.round(promedioCSAT))} (de ${todosCSAT.length} ratings)\n`;
    }
    
    if (todosNPS.length > 0) {
      const promedioNPS = todosNPS.reduce((a, b) => a + b, 0) / todosNPS.length;
      const promotores = todosNPS.filter(s => s >= 9).length;
      const pasivos = todosNPS.filter(s => s >= 7 && s < 9).length;
      const detractores = todosNPS.filter(s => s < 7).length;
      const npsScore = ((promotores - detractores) / todosNPS.length) * 100;
      
      markdown += `- **NPS Promedio:** ${promedioNPS.toFixed(2)}/10 (de ${todosNPS.length} scores)\n`;
      markdown += `- **NPS Score:** ${npsScore.toFixed(0)}% (Promotores: ${promotores}, Pasivos: ${pasivos}, Detractores: ${detractores})\n`;
    }
    
    markdown += '\n---\n\n';
    markdown += `*Reporte generado automáticamente el ${new Date().toLocaleString('es-ES')}*\n`;
    
    // Guardar archivo
    const outputPath = join(__dirname, '..', 'REPORTE_FEEDBACK_POR_AGENTE_USUARIO.md');
    writeFileSync(outputPath, markdown, 'utf-8');
    
    console.log(`✅ Reporte generado exitosamente: REPORTE_FEEDBACK_POR_AGENTE_USUARIO.md\n`);
    
    // También mostrar en consola las primeras líneas
    console.log('═'.repeat(100));
    console.log('PREVIEW DEL REPORTE');
    console.log('═'.repeat(100));
    console.log(markdown.split('\n').slice(0, 50).join('\n'));
    console.log('\n... (ver archivo completo en REPORTE_FEEDBACK_POR_AGENTE_USUARIO.md)\n');
    
  } catch (error) {
    console.error('❌ Error al generar reporte:', error);
    throw error;
  }
}

// Ejecutar
generarReportePorAgenteUsuario()
  .then(() => {
    console.log('✅ Script completado exitosamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script falló:', error);
    process.exit(1);
  });




