import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';
import { firestore } from '../../../lib/firestore';
import type { CollaborationInvitation } from '../../../types/collaboration';
import crypto from 'crypto';

/**
 * POST /api/invitations/send
 * Send collaboration invitation
 * 
 * Body:
 * - invitation: CollaborationInvitation data
 * - userId: User ID
 * - selectedText: Optional selected text to highlight
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // 1. Authenticate
    const session = getSession({ cookies } as any);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const body = await request.json();
    const { invitation, userId, selectedText } = body;

    if (!invitation || !userId) {
      return new Response(JSON.stringify({ error: 'invitation and userId required' }), { status: 400 });
    }

    // 2. Verify ownership
    if (session.id !== userId) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
    }

    // 3. Create invitation in Firestore
    const invitationRef = firestore.collection('collaboration_invitations').doc();
    
    // Generate unique token for invitation link
    const invitationToken = crypto.randomBytes(32).toString('hex');
    
    const invitationData = {
      ...invitation,
      id: invitationRef.id,
      invitationToken,
      selectedText,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await invitationRef.set(invitationData);

    // 4. Check if user has Gmail connected
    const gmailDoc = await firestore
      .collection('gmail_connections')
      .doc(userId)
      .get();
    
    const gmailConnected = gmailDoc.exists && gmailDoc.data()?.isConnected;

    // 5. Generate invitation link
    const baseUrl = process.env.PUBLIC_BASE_URL || 'http://localhost:3000';
    const invitationLink = `${baseUrl}/collaborate/${invitationToken}`;

    // 6. If Gmail connected, send email
    if (gmailConnected) {
      try {
        await sendGmailInvitation(userId, invitationData, invitationLink, selectedText);
        
        // Update invitation status
        await invitationRef.update({
          emailSent: true,
          emailSentAt: new Date(),
          emailProvider: 'gmail',
        });
        
        console.log('✅ Invitation sent via Gmail:', invitationRef.id);
      } catch (error) {
        console.error('❌ Failed to send via Gmail:', error);
        // Continue - invitation created but email failed
      }
    }

    return new Response(JSON.stringify({ 
      success: true,
      invitationId: invitationRef.id,
      invitationLink,
      emailSent: gmailConnected,
      invitation: {
        ...invitationData,
        createdAt: invitationData.createdAt.toISOString(),
        updatedAt: invitationData.updatedAt.toISOString(),
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error sending invitation:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500 }
    );
  }
};

/**
 * Send invitation email via Gmail API
 */
async function sendGmailInvitation(
  userId: string,
  invitation: any,
  invitationLink: string,
  selectedText?: string
): Promise<void> {
  // This will be implemented when Gmail OAuth is set up
  // For now, we'll create the email draft and log it
  
  const emailBody = `
    Hola ${invitation.recipientName || ''},

    ${invitation.senderName} te ha invitado a revisar un documento en Flow:
    
    Documento: ${invitation.sourceName}
    
    Mensaje:
    ${invitation.message}
    
    ${selectedText ? `\nTexto destacado:\n"${selectedText}"\n` : ''}
    
    Haz clic aquí para ver el documento y dejar tus comentarios:
    ${invitationLink}
    
    Este enlace es válido por 7 días.
    
    ---
    Bienvenido a Flow
    La plataforma de colaboración con IA
  `;

  console.log('📧 Email draft created:', {
    to: invitation.recipientEmail,
    subject: `${invitation.senderName} te invitó a revisar "${invitation.sourceName}"`,
    preview: emailBody.substring(0, 200),
  });

  // TODO: Implement actual Gmail API sending when OAuth is configured
  // For now, this creates the invitation and provides a shareable link
}





