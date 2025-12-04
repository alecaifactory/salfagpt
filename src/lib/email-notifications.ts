/**
 * Email Notification Service
 * Sends automated emails for feedback submissions and updates
 */

interface FeedbackConfirmationEmail {
  userEmail: string;
  userName: string;
  feedbackType: 'user' | 'expert';
  userStars?: number;
  userComment?: string;
  expertRating?: string;
  expertNotes?: string;
  ticketId?: string;
  conversationTitle?: string;
  timestamp: Date;
}

interface TicketUpdateEmail {
  userEmail: string;
  userName: string;
  ticketId: string;
  status: string;
  updates: string;
  nextSteps?: string;
}

/**
 * Send confirmation email when user submits feedback
 */
export async function sendFeedbackConfirmationEmail(
  data: FeedbackConfirmationEmail
): Promise<boolean> {
  const IS_DEVELOPMENT = process.env.NODE_ENV !== 'production';
  
  const emailContent = generateFeedbackConfirmationEmail(data);
  
  if (IS_DEVELOPMENT) {
    // In development: Log email instead of sending
    console.log('\n' + '═'.repeat(70));
    console.log('📧 EMAIL DE CONFIRMACIÓN DE FEEDBACK (SIMULADO)');
    console.log('═'.repeat(70));
    console.log(`Para: ${data.userEmail}`);
    console.log(`Asunto: ${emailContent.subject}`);
    console.log('\nCuerpo:');
    console.log(emailContent.body);
    console.log('═'.repeat(70) + '\n');
    
    return true;
  }
  
  // In production: Send real email
  try {
    // TODO: Implement actual email sending
    // Options:
    // 1. SendGrid API
    // 2. Gmail API (OAuth)
    // 3. AWS SES
    // 4. Nodemailer with SMTP
    
    // For now, log that we would send
    console.log(`📧 Would send email to: ${data.userEmail}`);
    console.log(`   Subject: ${emailContent.subject}`);
    
    return true;
  } catch (error) {
    console.error('❌ Error sending email:', error);
    return false;
  }
}

/**
 * Send ticket status update email
 */
export async function sendTicketUpdateEmail(
  data: TicketUpdateEmail
): Promise<boolean> {
  const IS_DEVELOPMENT = process.env.NODE_ENV !== 'production';
  
  const emailContent = generateTicketUpdateEmail(data);
  
  if (IS_DEVELOPMENT) {
    console.log('\n' + '═'.repeat(70));
    console.log('📧 EMAIL DE ACTUALIZACIÓN DE TICKET (SIMULADO)');
    console.log('═'.repeat(70));
    console.log(`Para: ${data.userEmail}`);
    console.log(`Asunto: ${emailContent.subject}`);
    console.log('\nCuerpo:');
    console.log(emailContent.body);
    console.log('═'.repeat(70) + '\n');
    
    return true;
  }
  
  try {
    console.log(`📧 Would send update email to: ${data.userEmail}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending update email:', error);
    return false;
  }
}

function generateFeedbackConfirmationEmail(
  data: FeedbackConfirmationEmail
): { subject: string; body: string } {
  const userName = data.userName || 'Usuario';
  const dateStr = data.timestamp.toLocaleDateString('es-CL', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });
  
  let subject = '';
  let body = '';
  
  if (data.feedbackType === 'user') {
    // User feedback confirmation
    const starsEmoji = '⭐'.repeat(data.userStars || 0);
    
    subject = '✅ Recibimos tu feedback - SalfaGPT';
    
    body = `Hola ${userName},

¡Gracias por compartir tu experiencia con nosotros! 🙏

TU FEEDBACK (${dateStr}):
${starsEmoji} ${data.userStars}/5 estrellas
${data.userComment ? `"${data.userComment}"` : ''}

${data.conversationTitle ? `En la conversación: "${data.conversationTitle}"` : ''}

${data.ticketId ? `
SEGUIMIENTO:
Hemos creado un ticket para dar seguimiento a tu feedback.
ID del Ticket: ${data.ticketId}

Puedes ver el estado del ticket en la plataforma.
` : ''}

QUÉ SIGUE:
1. ✅ Tu feedback fue registrado
2. 🔍 Nuestro equipo lo revisará
3. 🔧 Trabajaremos en mejoras si es necesario
4. 📧 Te notificaremos cuando haya avances

TU OPINIÓN NOS AYUDA A MEJORAR
Cada feedback que compartes nos ayuda a hacer SalfaGPT mejor para todos.

Si tienes más comentarios o preguntas, responde a este email.

Saludos,
Equipo SalfaGPT

──────────────────────────────────────────────────────
Este es un email automático de confirmación de feedback.
Para más información, visita: https://salfagpt.salfagestion.cl`;
    
  } else {
    // Expert feedback confirmation
    subject = '✅ Tu evaluación de experto fue registrada - SalfaGPT';
    
    body = `Hola ${userName},

Gracias por tu evaluación como experto. 👨‍💼

TU EVALUACIÓN (${dateStr}):
Rating: ${data.expertRating?.toUpperCase()}
${data.expertNotes ? `Notas: "${data.expertNotes.substring(0, 200)}${data.expertNotes.length > 200 ? '...' : ''}"` : ''}

${data.conversationTitle ? `En: "${data.conversationTitle}"` : ''}

${data.ticketId ? `
TICKET CREADO:
ID: ${data.ticketId}

Tu evaluación ha generado un ticket en el roadmap de mejoras.
` : ''}

QUÉ SIGUE:
1. ✅ Tu evaluación fue registrada
2. 🎯 Se priorizará según severidad
3. 👨‍💻 Equipo técnico revisará
4. 📊 Se agregará a métricas de calidad

TU EXPERTISE ES VALIOSA
Tu evaluación como experto nos ayuda a mantener la calidad del sistema.

Saludos,
Equipo SalfaGPT`;
  }
  
  return { subject, body };
}

function generateTicketUpdateEmail(
  data: TicketUpdateEmail
): { subject: string; body: string } {
  const userName = data.userName || 'Usuario';
  const statusEmoji = 
    data.status === 'resolved' ? '✅' :
    data.status === 'in_progress' ? '🔧' :
    data.status === 'planned' ? '📋' :
    '📊';
  
  const statusText =
    data.status === 'resolved' ? 'Resuelto' :
    data.status === 'in_progress' ? 'En Progreso' :
    data.status === 'planned' ? 'Planificado' :
    'Actualizado';
  
  const subject = `${statusEmoji} Actualización de tu feedback - SalfaGPT`;
  
  const body = `Hola ${userName},

Tenemos una actualización sobre tu feedback.

TICKET: #${data.ticketId}
ESTADO: ${statusEmoji} ${statusText}

ACTUALIZACIÓN:
${data.updates}

${data.nextSteps ? `
PRÓXIMOS PASOS:
${data.nextSteps}
` : ''}

${data.status === 'resolved' ? `
¡TU FEEDBACK FUE IMPLEMENTADO! 🎉

Te invitamos a probar nuevamente y verificar que ahora funciona mejor.

Si todo está bien, ¡nos encantaría que nos lo confirmes!
Si aún hay algún problema, déjanos saber.
` : ''}

GRACIAS POR TU PACIENCIA
Tu feedback nos ayuda a mejorar constantemente.

Puedes ver más detalles en:
https://salfagpt.salfagestion.cl/roadmap#${data.ticketId}

Saludos,
Equipo SalfaGPT`;
  
  return { subject, body };
}

/**
 * Format email address with name
 */
export function formatEmailAddress(email: string, name?: string): string {
  return name ? `"${name}" <${email}>` : email;
}

/**
 * Send email using configured service
 * (Placeholder - implement with actual email provider)
 */
async function sendEmailViaProvider(
  to: string,
  subject: string,
  body: string
): Promise<boolean> {
  // TODO: Implement with actual email service
  // Example with SendGrid:
  /*
  const sgMail = require('@sendgrid/mail');
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  
  const msg = {
    to,
    from: 'noreply@salfagpt.com',
    subject,
    text: body,
    html: body.replace(/\n/g, '<br>')
  };
  
  await sgMail.send(msg);
  */
  
  console.log(`📧 Email would be sent to: ${to}`);
  return true;
}


