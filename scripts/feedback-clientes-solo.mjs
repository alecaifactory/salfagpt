#!/usr/bin/env node
/**
 * Feedback Solo Clientes - Plataforma Flow
 * 
 * Genera un reporte en markdown SOLO con feedback de clientes
 * EXCLUYE: alec@getaifactory.com y organización AI Factory
 * 
 * Uso: node scripts/feedback-clientes-solo.mjs
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
 * Hash user ID para privacidad
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
  const parts = email.split('@');
  return parts.length > 1 ? parts[1] : 'desconocido';
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
 * Obtener estrellas de rating
 */
function obtenerEstrellas(rating, max = 5) {
  if (typeof rating !== 'number') return 'N/A';
  return '⭐'.repeat(rating) + '☆'.repeat(max - rating);
}

/**
 * Función principal
 */
async function generarReporteClientesSolo() {
  try {
    console.log('📥 Obteniendo todos los feedbacks...\n');
    
    // Obtener todos los feedbacks
    const feedbackSnapshot = await firestore
      .collection('message_feedback')
      .orderBy('timestamp', 'desc')
      .get();
    
    console.log(`✅ Encontrados ${feedbackSnapshot.size} feedbacks totales\n`);
    
    // FILTRAR: Excluir AI Factory
    const emailsExcluidos = [
      'alec@getaifactory.com',
      'alecdickinson@gmail.com', // También excluir personal
    ];
    
    const dominiosExcluidos = [
      'getaifactory.com',
    ];
    
    const feedbacksFiltrados = feedbackSnapshot.docs.filter(doc => {
      const data = doc.data();
      const email = data.userEmail || '';
      const dominio = obtenerDominio(email);
      
      // Excluir emails específicos
      if (emailsExcluidos.includes(email.toLowerCase())) {
        return false;
      }
      
      // Excluir dominios específicos
      if (dominiosExcluidos.includes(dominio)) {
        return false;
      }
      
      return true;
    });
    
    console.log(`🎯 Feedbacks de clientes: ${feedbacksFiltrados.length}\n`);
    console.log(`🚫 Feedbacks excluidos (AI Factory): ${feedbackSnapshot.size - feedbacksFiltrados.length}\n`);
    
    // Obtener agentes únicos
    const conversationIds = new Set();
    feedbacksFiltrados.forEach(doc => {
      const data = doc.data();
      if (data.conversationId) {
        conversationIds.add(data.conversationId);
      }
    });
    
    console.log(`📊 Agentes únicos con feedback de clientes: ${conversationIds.size}\n`);
    
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
    
    for (const doc of feedbacksFiltrados) {
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
    
    markdown += '# 📊 Reporte de Feedback de Clientes\n\n';
    markdown += '> **NOTA:** Este reporte excluye feedback de AI Factory y usuarios internos\n\n';
    markdown += `**Fecha de generación:** ${new Date().toLocaleString('es-ES')}\n\n`;
    markdown += `**Total de feedbacks de clientes:** ${feedbacksFiltrados.length}\n\n`;
    markdown += `**Total de agentes con feedback:** ${Object.keys(reportePorAgente).length}\n\n`;
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
    markdown += '## 📈 Resumen Estadístico - Solo Clientes\n\n';
    
    const todosLosUsuarios = [];
    for (const agenteData of Object.values(reportePorAgente)) {
      todosLosUsuarios.push(...Object.values(agenteData.usuarios));
    }
    
    const usuariosUnicos = [...new Set(todosLosUsuarios.map(u => u.userId))];
    const totalFeedbacks = todosLosUsuarios.reduce((sum, u) => sum + u.feedbacks.length, 0);
    
    markdown += `### Totales\n\n`;
    markdown += `- **Usuarios únicos de clientes:** ${usuariosUnicos.length}\n`;
    markdown += `- **Agentes con feedback de clientes:** ${Object.keys(reportePorAgente).length}\n`;
    markdown += `- **Total feedbacks de clientes:** ${totalFeedbacks}\n\n`;
    
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
    
    // CSAT y NPS
    const todosCSAT = [];
    const todosNPS = [];
    
    todosLosUsuarios.forEach(u => {
      u.feedbacks.forEach(f => {
        if (f.csat !== null) todosCSAT.push(f.csat);
        if (f.nps !== null) todosNPS.push(f.nps);
      });
    });
    
    markdown += `### Métricas de Satisfacción de Clientes\n\n`;
    
    if (todosCSAT.length > 0) {
      const promedioCSAT = todosCSAT.reduce((a, b) => a + b, 0) / todosCSAT.length;
      const distribucion = {
        5: todosCSAT.filter(s => s === 5).length,
        4: todosCSAT.filter(s => s === 4).length,
        3: todosCSAT.filter(s => s === 3).length,
        2: todosCSAT.filter(s => s === 2).length,
        1: todosCSAT.filter(s => s === 1).length,
        0: todosCSAT.filter(s => s === 0).length,
      };
      
      markdown += `- **CSAT Promedio:** ${promedioCSAT.toFixed(2)}/5 ${obtenerEstrellas(Math.round(promedioCSAT))} (de ${todosCSAT.length} ratings)\n\n`;
      markdown += `**Distribución de CSAT:**\n\n`;
      markdown += `| Rating | Cantidad | Porcentaje |\n`;
      markdown += `|--------|----------|------------|\n`;
      Object.entries(distribucion)
        .sort((a, b) => b[0] - a[0])
        .forEach(([rating, count]) => {
          const pct = ((count / todosCSAT.length) * 100).toFixed(1);
          markdown += `| ${rating}/5 ${obtenerEstrellas(parseInt(rating))} | ${count} | ${pct}% |\n`;
        });
      markdown += '\n';
    } else {
      markdown += `- **CSAT Promedio:** N/A (sin ratings CSAT)\n\n`;
    }
    
    if (todosNPS.length > 0) {
      const promedioNPS = todosNPS.reduce((a, b) => a + b, 0) / todosNPS.length;
      const promotores = todosNPS.filter(s => s >= 9).length;
      const pasivos = todosNPS.filter(s => s >= 7 && s < 9).length;
      const detractores = todosNPS.filter(s => s < 7).length;
      const npsScore = ((promotores - detractores) / todosNPS.length) * 100;
      
      markdown += `- **NPS Promedio:** ${promedioNPS.toFixed(2)}/10 (de ${todosNPS.length} scores)\n`;
      markdown += `- **NPS Score:** ${npsScore.toFixed(0)}% (Promotores: ${promotores}, Pasivos: ${pasivos}, Detractores: ${detractores})\n\n`;
    } else {
      markdown += `- **NPS Promedio:** N/A (sin scores NPS de clientes)\n\n`;
    }
    
    // Top issues de clientes
    markdown += `### 🔴 Principales Problemas Reportados por Clientes\n\n`;
    
    const feedbacksNegativos = [];
    todosLosUsuarios.forEach(u => {
      u.feedbacks.forEach(f => {
        if (f.csat !== null && f.csat <= 2 && f.comentario) {
          feedbacksNegativos.push({
            email: u.email,
            dominio: u.dominio,
            comentario: f.comentario,
            csat: f.csat,
            fecha: f.fecha,
          });
        }
      });
    });
    
    feedbacksNegativos
      .sort((a, b) => a.csat - b.csat)
      .slice(0, 10)
      .forEach((f, idx) => {
        markdown += `**${idx + 1}. ${f.email.split('@')[0]} (${f.dominio}) - CSAT: ${f.csat}/5**\n`;
        markdown += `   > ${f.comentario}\n`;
        markdown += `   _${f.fecha}_\n\n`;
      });
    
    markdown += '\n';
    
    // Usuarios más activos
    markdown += `### 👥 Usuarios Clientes Más Activos\n\n`;
    
    const usuariosPorActividad = todosLosUsuarios
      .sort((a, b) => b.feedbacks.length - a.feedbacks.length)
      .slice(0, 5);
    
    markdown += '| Usuario | Organización | Total Feedbacks | CSAT Promedio |\n';
    markdown += '|---------|--------------|-----------------|---------------|\n';
    
    usuariosPorActividad.forEach(u => {
      const csatScores = u.feedbacks.map(f => f.csat).filter(s => s !== null);
      const avgCSAT = csatScores.length > 0 
        ? (csatScores.reduce((a, b) => a + b, 0) / csatScores.length).toFixed(2)
        : 'N/A';
      markdown += `| ${u.email} | ${u.organizacion} | ${u.feedbacks.length} | ${avgCSAT}/5 |\n`;
    });
    
    markdown += '\n---\n\n';
    markdown += `*Reporte generado automáticamente el ${new Date().toLocaleString('es-ES')}*\n`;
    markdown += `*Excluye feedback de AI Factory y usuarios internos*\n`;
    
    // Guardar archivo
    const outputPath = join(__dirname, '..', 'REPORTE_FEEDBACK_CLIENTES.md');
    writeFileSync(outputPath, markdown, 'utf-8');
    
    console.log(`✅ Reporte de clientes generado: REPORTE_FEEDBACK_CLIENTES.md\n`);
    
    // También exportar JSON filtrado
    const exportData = {
      timestamp: new Date().toISOString(),
      nota: 'Excluye feedback de AI Factory y usuarios internos',
      totalFeedbacksClientes: feedbacksFiltrados.length,
      feedbacksExcluidos: feedbackSnapshot.size - feedbacksFiltrados.length,
      usuarios: todosLosUsuarios.map(u => ({
        ...u,
        feedbacks: u.feedbacks,
      })),
    };
    
    const jsonPath = join(__dirname, '..', 'feedback-clientes-export.json');
    writeFileSync(jsonPath, JSON.stringify(exportData, null, 2));
    
    console.log(`💾 Datos JSON exportados: feedback-clientes-export.json\n`);
    
    // Mostrar preview
    console.log('═'.repeat(100));
    console.log('PREVIEW DEL REPORTE DE CLIENTES');
    console.log('═'.repeat(100));
    console.log(markdown.split('\n').slice(0, 60).join('\n'));
    console.log('\n... (ver archivo completo en REPORTE_FEEDBACK_CLIENTES.md)\n');
    
  } catch (error) {
    console.error('❌ Error al generar reporte:', error);
    throw error;
  }
}

// Ejecutar
generarReporteClientesSolo()
  .then(() => {
    console.log('✅ Script completado exitosamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script falló:', error);
    process.exit(1);
  });

