import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';

/**
 * GET /api/gmail/connect
 * Initiate Gmail OAuth flow
 * 
 * Query params:
 * - userId: User ID
 * - returnTo: URL to return to after connection
 */
export const GET: APIRoute = async ({ request, cookies }) => {
  try {
    const session = getSession({ cookies } as any);
    if (!session) {
      return new Response('Unauthorized', { status: 401 });
    }

    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const returnTo = url.searchParams.get('returnTo') || '/chat';

    if (!userId) {
      return new Response('userId required', { status: 400 });
    }

    if (session.id !== userId) {
      return new Response('Forbidden', { status: 403 });
    }

    // TODO: Implement Gmail OAuth flow
    // For now, show instructions page
    
    const instructionsHtml = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Conectar Gmail - Flow</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 600px;
      margin: 40px auto;
      padding: 20px;
      background: #f8fafc;
    }
    .card {
      background: white;
      border-radius: 12px;
      padding: 32px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    h1 {
      color: #1e293b;
      margin-bottom: 16px;
    }
    p {
      color: #64748b;
      line-height: 1.6;
      margin-bottom: 16px;
    }
    .step {
      background: #f1f5f9;
      padding: 16px;
      border-radius: 8px;
      margin-bottom: 12px;
    }
    .step strong {
      color: #0f172a;
    }
    .note {
      background: #dbeafe;
      border-left: 4px solid #3b82f6;
      padding: 12px;
      border-radius: 4px;
      margin-top: 20px;
    }
    .note strong {
      color: #1e40af;
    }
    .btn {
      display: inline-block;
      padding: 12px 24px;
      background: #3b82f6;
      color: white;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 500;
      margin-top: 20px;
    }
    .btn:hover {
      background: #2563eb;
    }
  </style>
</head>
<body>
  <div class="card">
    <h1>📧 Conectar Gmail con Flow</h1>
    
    <p>Para enviar invitaciones de colaboración directamente desde tu cuenta de Gmail, necesitarás configurar la integración de Gmail OAuth.</p>
    
    <div class="step">
      <strong>1. Configurar Google Cloud Console</strong>
      <p style="margin-top: 8px; font-size: 14px;">
        Ve a <a href="https://console.cloud.google.com/apis/credentials" target="_blank">Google Cloud Console</a>
        y crea credenciales OAuth 2.0.
      </p>
    </div>
    
    <div class="step">
      <strong>2. Agregar Scopes Requeridos</strong>
      <p style="margin-top: 8px; font-size: 14px;">
        - https://www.googleapis.com/auth/gmail.send<br>
        - https://www.googleapis.com/auth/gmail.compose
      </p>
    </div>
    
    <div class="step">
      <strong>3. Configurar Redirect URI</strong>
      <p style="margin-top: 8px; font-size: 14px;">
        Agrega: <code>${process.env.PUBLIC_BASE_URL || 'http://localhost:3000'}/api/gmail/callback</code>
      </p>
    </div>
    
    <div class="note">
      <strong>Nota:</strong> Esta funcionalidad está en desarrollo. Por ahora, cuando crees una invitación,
      recibirás un enlace que puedes compartir manualmente con tus colaboradores.
    </div>
    
    <a href="${returnTo}" class="btn">Volver</a>
  </div>
</body>
</html>
    `;

    return new Response(instructionsHtml, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });

  } catch (error) {
    console.error('Error in Gmail connect:', error);
    return new Response('Internal server error', { status: 500 });
  }
};

