#!/usr/bin/env tsx
/**
 * Export Normalized CSV for Analysis
 * 
 * Creates a single, properly normalized CSV with ALL dimensions:
 * - User (email, name, domain)
 * - Agent (code, title, shared status)
 * - Day (date, dayName)
 * - Activity (messages, questions, responses)
 * - Feedback (stars, comments, ratings)
 * 
 * Perfect for pivot tables, Power BI, Tableau, Excel analysis
 * 
 * Usage:
 *   npx tsx scripts/export-normalized-csv.ts --days=30
 */

import { firestore, COLLECTIONS } from '../src/lib/firestore';
import * as fs from 'fs';

interface NormalizedRow {
  // Date dimension
  date: string;
  dayName: string;
  dayOfWeek: number;
  week: number;
  month: string;
  
  // Agent dimension
  agentId: string;
  agentCode: string;
  agentTitle: string;
  agentStatus: string; // Producción / Privado
  isShared: string; // Sí / No
  sharedWithCount: number;
  agentOwnerEmail: string;
  
  // User dimension
  userId: string;
  userEmail: string;
  userName: string;
  userDomain: string;
  
  // Activity metrics
  questions: number;
  responses: number;
  totalMessages: number;
  
  // Feedback metrics (aggregated for that day/user/agent)
  hasFeedback: string; // Sí / No
  feedbackCount: number;
  avgStars: number | null;
  feedbackComments: string; // Concatenated with "; "
  expertRatings: string; // Concatenated with "; "
  npsScore: number | null;
  csatScore: number | null;
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function getDayName(date: Date): string {
  return date.toLocaleDateString('es', { weekday: 'long' });
}

function getWeekNumber(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

function getMonth(date: Date): string {
  return date.toLocaleDateString('es', { year: 'numeric', month: 'long' });
}

function escapeCSV(value: string | null | undefined): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

async function main() {
  try {
    const args = process.argv.slice(2);
    const daysArg = args.find(a => a.startsWith('--days='));
    const days = daysArg ? parseInt(daysArg.split('=')[1]) : 30;
    
    console.error('📊 Generando CSV Normalizado para Análisis\n');
    
    // Calculate date range
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - (days - 1));
    startDate.setHours(0, 0, 0, 0);
    
    console.error(`📅 Período: ${formatDate(startDate)} → ${formatDate(endDate)}\n`);
    
    // Load analytics data
    console.error('📂 Cargando analytics-complete.json...');
    const analyticsData = JSON.parse(
      fs.readFileSync('./exports/salfa-analytics/analytics-complete.json', 'utf-8')
    );
    
    console.error('📂 Cargando feedback-with-context.json...');
    const feedbackData = JSON.parse(
      fs.readFileSync('./exports/salfa-analytics/feedback-with-context.json', 'utf-8')
    );
    
    console.error('✅ Datos cargados\n');
    
    // Build feedback map (by conversation + user + date)
    console.error('⭐ Procesando feedback...');
    const feedbackMap = new Map();
    
    for (const feedback of feedbackData.feedbacksWithContext) {
      const timestamp = new Date(feedback.timestamp);
      const dateKey = formatDate(timestamp);
      const conversationId = feedback.conversation?.conversationId;
      const userId = feedback.feedbackBy?.userId;
      
      if (!conversationId || !userId) continue;
      
      const key = `${dateKey}_${conversationId}_${userId}`;
      
      if (!feedbackMap.has(key)) {
        feedbackMap.set(key, {
          feedbacks: [],
          stars: [],
          comments: [],
          expertRatings: [],
          npsScores: [],
          csatScores: []
        });
      }
      
      const feedbackEntry = feedbackMap.get(key);
      feedbackEntry.feedbacks.push(feedback);
      
      if (feedback.userStars !== undefined) {
        feedbackEntry.stars.push(feedback.userStars);
      }
      if (feedback.userComment) {
        feedbackEntry.comments.push(feedback.userComment);
      }
      if (feedback.expertRating) {
        feedbackEntry.expertRatings.push(feedback.expertRating);
      }
      if (feedback.npsScore !== undefined) {
        feedbackEntry.npsScores.push(feedback.npsScore);
      }
      if (feedback.csatScore !== undefined) {
        feedbackEntry.csatScores.push(feedback.csatScore);
      }
    }
    
    console.error(`✅ ${feedbackMap.size} combinaciones fecha/conversación/usuario con feedback\n`);
    
    // Build normalized rows
    console.error('📝 Construyendo filas normalizadas...');
    const rows: NormalizedRow[] = [];
    
    for (const daily of analyticsData.dailyInteractions) {
      const dateObj = new Date(daily.date);
      const key = `${daily.date}_${daily.agentId}_${daily.userId}`;
      
      const feedbackEntry = feedbackMap.get(key);
      const hasFeedback = feedbackEntry ? 'Sí' : 'No';
      const feedbackCount = feedbackEntry ? feedbackEntry.feedbacks.length : 0;
      const avgStars = feedbackEntry && feedbackEntry.stars.length > 0
        ? feedbackEntry.stars.reduce((a, b) => a + b, 0) / feedbackEntry.stars.length
        : null;
      const comments = feedbackEntry && feedbackEntry.comments.length > 0
        ? feedbackEntry.comments.join('; ')
        : '';
      const expertRatings = feedbackEntry && feedbackEntry.expertRatings.length > 0
        ? feedbackEntry.expertRatings.join('; ')
        : '';
      const avgNps = feedbackEntry && feedbackEntry.npsScores.length > 0
        ? feedbackEntry.npsScores.reduce((a, b) => a + b, 0) / feedbackEntry.npsScores.length
        : null;
      const avgCsat = feedbackEntry && feedbackEntry.csatScores.length > 0
        ? feedbackEntry.csatScores.reduce((a, b) => a + b, 0) / feedbackEntry.csatScores.length
        : null;
      
      rows.push({
        // Date
        date: daily.date,
        dayName: daily.dayName,
        dayOfWeek: daily.dayOfWeek,
        week: getWeekNumber(dateObj),
        month: getMonth(dateObj),
        
        // Agent
        agentId: daily.agentId,
        agentCode: daily.agentCode || '',
        agentTitle: daily.agentTitle,
        agentStatus: daily.status,
        isShared: daily.isShared ? 'Sí' : 'No',
        sharedWithCount: 0, // Will be filled from agents list
        agentOwnerEmail: '',
        
        // User
        userId: daily.userId,
        userEmail: daily.userEmail,
        userName: daily.userName,
        userDomain: daily.domain,
        
        // Activity
        questions: daily.questions,
        responses: daily.responses,
        totalMessages: daily.totalMessages,
        
        // Feedback
        hasFeedback,
        feedbackCount,
        avgStars,
        feedbackComments: comments,
        expertRatings,
        npsScore: avgNps,
        csatScore: avgCsat
      });
    }
    
    // Enrich with agent details
    console.error('🔧 Enriqueciendo con detalles de agentes...');
    const agentsMap = new Map();
    for (const agent of analyticsData.agents) {
      agentsMap.set(agent.agentId, agent);
    }
    
    for (const row of rows) {
      const agent = agentsMap.get(row.agentId);
      if (agent) {
        row.sharedWithCount = agent.sharedWithCount;
        row.agentOwnerEmail = agent.ownerEmail;
      }
    }
    
    console.error(`✅ ${rows.length} filas creadas\n`);
    
    // Generate CSV
    console.error('💾 Generando CSV...');
    
    const headers = [
      'Date', 'Day_Name', 'Day_Of_Week', 'Week', 'Month',
      'Agent_ID', 'Agent_Code', 'Agent_Title', 'Agent_Status', 'Is_Shared', 'Shared_With_Count', 'Agent_Owner_Email',
      'User_ID', 'User_Email', 'User_Name', 'User_Domain',
      'Questions', 'Responses', 'Total_Messages',
      'Has_Feedback', 'Feedback_Count', 'Avg_Stars', 'Feedback_Comments', 'Expert_Ratings', 'NPS_Score', 'CSAT_Score'
    ];
    
    const csvLines = [headers.join(',')];
    
    for (const row of rows) {
      csvLines.push([
        row.date,
        row.dayName,
        row.dayOfWeek,
        row.week,
        escapeCSV(row.month),
        row.agentId,
        row.agentCode,
        escapeCSV(row.agentTitle),
        row.agentStatus,
        row.isShared,
        row.sharedWithCount,
        row.agentOwnerEmail,
        row.userId,
        row.userEmail,
        escapeCSV(row.userName),
        row.userDomain,
        row.questions,
        row.responses,
        row.totalMessages,
        row.hasFeedback,
        row.feedbackCount,
        row.avgStars !== null ? row.avgStars.toFixed(2) : '',
        escapeCSV(row.feedbackComments),
        escapeCSV(row.expertRatings),
        row.npsScore !== null ? row.npsScore.toFixed(1) : '',
        row.csatScore !== null ? row.csatScore.toFixed(1) : ''
      ].join(','));
    }
    
    const csv = csvLines.join('\n');
    
    // Write CSV
    const outputPath = './exports/salfa-analytics/analytics-normalized.csv';
    fs.writeFileSync(outputPath, csv);
    
    const stats = fs.statSync(outputPath);
    const fileSizeKB = (stats.size / 1024).toFixed(2);
    
    console.error('═'.repeat(70));
    console.error('✅ CSV NORMALIZADO GENERADO!');
    console.error('═'.repeat(70));
    console.error(`\n📁 Archivo: ${outputPath}`);
    console.error(`📏 Tamaño: ${fileSizeKB} KB`);
    console.error(`📊 Filas: ${rows.length} + 1 header\n`);
    
    console.error('📋 COLUMNAS (26):');
    console.error('   Dimensiones Temporales (5): Date, Day_Name, Day_Of_Week, Week, Month');
    console.error('   Dimensiones de Agente (7): ID, Code, Title, Status, Shared, Count, Owner');
    console.error('   Dimensiones de Usuario (4): ID, Email, Name, Domain');
    console.error('   Métricas de Actividad (3): Questions, Responses, Total_Messages');
    console.error('   Métricas de Feedback (7): Has, Count, Avg_Stars, Comments, Ratings, NPS, CSAT\n');
    
    console.error('🎯 ANÁLISIS POSIBLES:');
    console.error('   ✅ Pivot por: User × Agent × Day');
    console.error('   ✅ Pivot por: Domain × Agent × Week');
    console.error('   ✅ Pivot por: Agent × Feedback');
    console.error('   ✅ Tendencias temporales (Day, Week, Month)');
    console.error('   ✅ Satisfacción (Avg_Stars, NPS, CSAT)');
    console.error('   ✅ Adopción (Is_Shared, Shared_With_Count)\n');
    
    // Also update the JSON file with latest data
    console.error('📂 Actualizando analytics-complete.json...');
    const jsonOutputPath = './exports/salfa-analytics/analytics-complete-latest.json';
    fs.copyFileSync(
      './exports/salfa-analytics/analytics-complete.json',
      jsonOutputPath
    );
    console.error(`✅ JSON copiado a: ${jsonOutputPath}\n`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();

