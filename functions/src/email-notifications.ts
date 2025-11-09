// Email Notifications for Expert Review
// Created: 2025-11-09
// Purpose: Weekly emails to specialists and volume alerts to supervisors

import * as functions from '@google-cloud/functions-framework';
import { firestore } from '../../src/lib/firestore';
import nodemailer from 'nodemailer';

// Email configuration (use environment variables)
const EMAIL_CONFIG = {
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'notifications@flow.ai',
    pass: process.env.EMAIL_PASSWORD || ''
  }
};

const transporter = nodemailer.createTransporter(EMAIL_CONFIG);

/**
 * Weekly email to specialists with pending assignments
 * Trigger: Cloud Scheduler every Monday 9am
 */
functions.http('sendWeeklySpecialistEmails', async (req, res) => {
  console.log('📧 Sending weekly specialist emails...');

  try {
    // Get all specialists with pending assignments
    const specialists = await firestore
      .collection('users')
      .where('role', '==', 'specialist')
      .where('isActive', '==', true)
      .get();

    let emailsSent = 0;

    for (const specialistDoc of specialists.docs) {
      const specialist = specialistDoc.data();
      const specialistId = specialistDoc.id;

      // Get pending assignments
      const assignments = await firestore
        .collection('expert_evaluations')
        .where('assignedTo', '==', specialistId)
        .where('status', '==', 'assigned')
        .get();

      if (assignments.empty) {
        continue; // No assignments, skip email
      }

      // Calculate match scores and deadlines
      const assignmentDetails = assignments.docs.map(doc => {
        const data = doc.data();
        return {
          interactionId: doc.id,
          query: data.userQuery || '',
          matchScore: data.matchScore || 85,
          deadline: data.deadline || 'Esta semana',
          priority: data.priority || 'medium'
        };
      });

      // Sort by match score descending
      assignmentDetails.sort((a, b) => b.matchScore - a.matchScore);

      // Send email
      const emailHtml = generateSpecialistWeeklyEmail(
        specialist.name || specialist.email,
        specialist.specialty || 'General',
        assignmentDetails
      );

      await transporter.sendMail({
        from: EMAIL_CONFIG.auth.user,
        to: specialist.email,
        subject: `📋 Asignaciones Semanales - ${assignments.size} pendientes (${assignmentDetails[0].matchScore}% match)`,
        html: emailHtml
      });

      emailsSent++;
      console.log(`✅ Email sent to ${specialist.email} (${assignments.size} assignments)`);
    }

    res.status(200).json({
      success: true,
      emailsSent,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Failed to send specialist emails:', error);
    res.status(500).json({
      error: 'Failed to send emails',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Alert email to supervisors when high volume of priority items
 * Trigger: Cloud Scheduler every 4 hours
 */
functions.http('sendSupervisorVolumeAlerts', async (req, res) => {
  console.log('🚨 Checking supervisor volume alerts...');

  try {
    // Get all supervisors
    const supervisors = await firestore
      .collection('users')
      .where('role', '==', 'supervisor')
      .where('isActive', '==', true)
      .get();

    let alertsSent = 0;

    for (const supervisorDoc of supervisors.docs) {
      const supervisor = supervisorDoc.data();
      const supervisorId = supervisorDoc.id;

      // Get priority items in queue
      const priorityItems = await firestore
        .collection('message_feedback')
        .where('domain', '==', supervisor.domain || '')
        .where('priority', 'in', ['high', 'medium'])
        .where('status', '==', 'pending')
        .get();

      // Get domain threshold (default: 10)
      const domainConfig = await firestore
        .collection('domain_configs')
        .doc(supervisor.domain || '')
        .get();

      const threshold = domainConfig.data()?.volumeAlertThreshold || 10;

      if (priorityItems.size < threshold) {
        continue; // Below threshold, no alert needed
      }

      // Check if alert was sent recently (don't spam)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const recentAlert = await firestore
        .collection('email_alerts_sent')
        .where('recipientId', '==', supervisorId)
        .where('alertType', '==', 'volume_alert')
        .where('sentAt', '>=', yesterday)
        .limit(1)
        .get();

      if (!recentAlert.empty) {
        continue; // Already alerted recently
      }

      // Send alert email
      const emailHtml = generateSupervisorVolumeAlert(
        supervisor.name || supervisor.email,
        supervisor.domain || '',
        priorityItems.size,
        threshold
      );

      await transporter.sendMail({
        from: EMAIL_CONFIG.auth.user,
        to: supervisor.email,
        subject: `🚨 Alerta de Volumen - ${priorityItems.size} items prioritarios sin revisar`,
        html: emailHtml
      });

      // Log alert sent
      await firestore.collection('email_alerts_sent').add({
        recipientId: supervisorId,
        recipientEmail: supervisor.email,
        alertType: 'volume_alert',
        itemCount: priorityItems.size,
        threshold,
        sentAt: new Date()
      });

      alertsSent++;
      console.log(`🚨 Alert sent to ${supervisor.email} (${priorityItems.size} items)`);
    }

    res.status(200).json({
      success: true,
      alertsSent,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Failed to send volume alerts:', error);
    res.status(500).json({
      error: 'Failed to send alerts',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Generate HTML for specialist weekly email
 */
function generateSpecialistWeeklyEmail(
  name: string,
  specialty: string,
  assignments: Array<{
    interactionId: string;
    query: string;
    matchScore: number;
    deadline: string;
    priority: string;
  }>
): string {
  
  const topMatch = assignments[0];
  const priorityColors = {
    high: '#ef4444',
    medium: '#f59e0b',
    low: '#10b981'
  };

  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #334155; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: white; padding: 30px; border-radius: 12px; margin-bottom: 20px; }
    .match-badge { display: inline-block; background: #10b981; color: white; padding: 4px 12px; border-radius: 20px; font-weight: bold; font-size: 14px; }
    .assignment { background: #f8fafc; border: 2px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 12px 0; }
    .priority-badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; color: white; }
    .btn { display: inline-block; background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📋 Asignaciones Semanales</h1>
      <p style="margin: 8px 0 0 0; opacity: 0.9;">Hola ${name}, tienes ${assignments.length} asignaciones pendientes</p>
    </div>

    <div style="background: #ecfdf5; border: 2px solid #10b981; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="font-size: 24px;">🎯</span>
        <div>
          <div style="font-weight: bold; color: #047857;">Top Match para ti</div>
          <div style="font-size: 14px; color: #059669;">
            <span class="match-badge">${topMatch.matchScore}% match</span>
            Perfect for your expertise in ${specialty}
          </div>
        </div>
      </div>
    </div>

    <h2 style="color: #1e293b;">Tus Asignaciones:</h2>

    ${assignments.map((assignment, i) => `
      <div class="assignment">
        <div style="display: flex; justify-content: between; align-items: start; margin-bottom: 8px;">
          <div style="flex: 1;">
            <div style="font-weight: bold; color: #1e293b; margin-bottom: 4px;">
              Asignación ${i + 1}
            </div>
            <div style="font-size: 14px; color: #64748b; font-style: italic;">
              "${assignment.query.substring(0, 120)}${assignment.query.length > 120 ? '...' : ''}"
            </div>
          </div>
          <span class="priority-badge" style="background: ${priorityColors[assignment.priority as keyof typeof priorityColors]}">
            ${assignment.priority}
          </span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 13px; color: #64748b;">
          <span>Match: <strong>${assignment.matchScore}%</strong></span>
          <span>Deadline: <strong>${assignment.deadline}</strong></span>
        </div>
      </div>
    `).join('')}

    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.PUBLIC_BASE_URL || 'http://localhost:3000'}/chat" class="btn">
        Ver Asignaciones en Panel
      </a>
    </div>

    <div style="text-align: center; font-size: 12px; color: #94a3b8; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
      <p>Flow Platform - Expert Review System</p>
      <p>Este es un email automático semanal. <a href="#" style="color: #6366f1;">Ajustar preferencias</a></p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Generate HTML for supervisor volume alert
 */
function generateSupervisorVolumeAlert(
  name: string,
  domain: string,
  itemCount: number,
  threshold: number
): string {
  
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #334155; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; border-radius: 12px; margin-bottom: 20px; }
    .alert-box { background: #fef3c7; border: 2px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .stat { font-size: 48px; font-weight: bold; color: #d97706; text-align: center; }
    .btn { display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚨 Alerta de Volumen</h1>
      <p style="margin: 8px 0 0 0; opacity: 0.9;">Domain: ${domain}</p>
    </div>

    <div class="alert-box">
      <div style="text-align: center; margin-bottom: 16px;">
        <div class="stat">${itemCount}</div>
        <div style="color: #92400e; font-weight: bold; font-size: 18px;">
          Items Prioritarios Sin Revisar
        </div>
      </div>

      <div style="background: white; border-radius: 6px; padding: 12px; text-align: center;">
        <span style="color: #78350f; font-size: 14px;">
          Umbral configurado: ${threshold} items
        </span>
      </div>
    </div>

    <div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <h3 style="color: #1e293b; margin-top: 0;">Acciones Recomendadas:</h3>
      <ul style="color: #475569; line-height: 1.8;">
        <li>Revisar items de alta prioridad primero</li>
        <li>Asignar a especialistas si aplica</li>
        <li>Usar AI suggestions para eficiencia</li>
        <li>Considerar ajustar recursos si volumen persiste</li>
      </ul>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.PUBLIC_BASE_URL || 'http://localhost:3000'}/chat" class="btn">
        Ir al Panel de Expertos
      </a>
    </div>

    <div style="text-align: center; font-size: 12px; color: #94a3b8; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
      <p>Flow Platform - Expert Review System</p>
      <p>Este email se envía cuando el volumen supera el umbral configurado.</p>
      <p><a href="#" style="color: #f59e0b;">Ajustar umbral</a> | <a href="#" style="color: #f59e0b;">Desactivar alertas</a></p>
    </div>
  </div>
</body>
</html>
  `;
}

export { sendWeeklySpecialistEmails, sendSupervisorVolumeAlerts };

