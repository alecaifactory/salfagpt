import type { APIRoute } from 'astro';
import { getContextSource, getExtractedData, getUserById } from '../../../../lib/firestore';
import { getSession } from '../../../../lib/auth';
import { downloadFile } from '../../../../lib/storage';

/**
 * GET /api/context-sources/:id/file
 * 
 * Serves the original document file for viewing
 * 
 * Strategy:
 * 1. If storagePath exists: Download from Cloud Storage and stream
 * 2. If no storagePath (legacy): Generate HTML preview from extracted text
 * 
 * Security:
 * - Requires authentication
 * - Verifies user owns the document
 * - Proxies file through authenticated endpoint
 */
export const GET: APIRoute = async ({ params, cookies }) => {
  try {
    // 1. Verify authentication
    const session = getSession({ cookies } as any);
    if (!session) {
      return new Response(
        '<html><body><h1>401 No Autorizado</h1><p>Por favor inicia sesión</p></body></html>',
        { status: 401, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      );
    }

    const sourceId = params.id;
    if (!sourceId) {
      return new Response(
        '<html><body><h1>400 Error</h1><p>ID de documento requerido</p></body></html>',
        { status: 400, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      );
    }

    console.log('📄 File request for source:', sourceId);

    // 2. Load context source
    const source = await getContextSource(sourceId);
    
    if (!source) {
      console.error('❌ Source not found:', sourceId);
      return new Response(
        '<html><body><h1>404 No Encontrado</h1><p>Documento no existe</p></body></html>',
        { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      );
    }

    console.log('📋 Source loaded:', source.name, 'User:', source.userId);

    // 3. SECURITY: Verify ownership (support both hash ID and legacy Google OAuth ID)
    // Load user to get googleUserId for backward compatibility
    const user = await getUserById(session.id);
    const googleUserId = user?.googleUserId;
    
    const isOwner = source.userId === session.id || 
                    (googleUserId && source.userId === googleUserId) ||
                    session.email === 'alec@getaifactory.com';
    
    if (!isOwner) {
      console.error('🚫 Access denied - userId mismatch', {
        sourceUserId: source.userId,
        sessionId: session.id,
        googleUserId: googleUserId || 'N/A'
      });
      return new Response(
        '<html><body><h1>403 Prohibido</h1><p>No puedes acceder a documentos de otros usuarios</p></body></html>',
        { status: 403, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      );
    }
    
    console.log('✅ Ownership verified', {
      method: source.userId === session.id ? 'hash-id' : 'google-oauth-id'
    });


    // 4. Try to get storage path
    const metadata = source.metadata as any;
    const storagePath = metadata?.storagePath || metadata?.gcsPath;
    
    console.log('🔍 Storage path check:', {
      hasStoragePath: !!storagePath,
      storagePath: storagePath || 'NONE'
    });

    // STRATEGY 1: Download from Cloud Storage (if available)
    if (storagePath) {
      try {
        const cleanPath = storagePath.replace(/^gs:\/\/[^/]+\//, '');
        console.log('📥 Downloading from Cloud Storage:', cleanPath);
        
        const fileBuffer = await downloadFile(cleanPath);
        
        const contentType = metadata?.contentType || 
                           source.type === 'pdf' ? 'application/pdf' : 
                           'application/octet-stream';

        console.log('✅ Serving file from Cloud Storage:', {
          size: `${(fileBuffer.length / 1024 / 1024).toFixed(2)} MB`,
          type: contentType
        });

        return new Response(fileBuffer, {
          status: 200,
          headers: {
            'Content-Type': contentType,
            'Content-Disposition': `inline; filename="${source.name}"`,
            'Cache-Control': 'private, max-age=3600',
          }
        });
      } catch (error: any) {
        console.error('❌ Cloud Storage download failed:', error.message);
        // Fall through to Strategy 2
      }
    }

    // STRATEGY 2: Generate HTML preview from extracted text (legacy/fallback)
    console.log('📄 Generating HTML preview from extracted text...');
    
    const extractedText = await getExtractedData(source);
    
    if (!extractedText) {
      return new Response(
        '<html><body style="font-family: sans-serif; padding: 20px;"><h1>⚠️ Sin Contenido</h1><p>Este documento no tiene texto extraído disponible.</p><p>Intenta re-indexar el documento.</p></body></html>',
        { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      );
    }

    // Generate enhanced HTML preview with recovery options
    const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${source.name}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      background: #f8f9fa;
    }
    .header {
      background: white;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .header h1 {
      margin: 0 0 10px 0;
      color: #1e293b;
      font-size: 20px;
    }
    .header .meta {
      color: #64748b;
      font-size: 14px;
    }
    .content {
      background: white;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      white-space: pre-wrap;
      font-size: 14px;
      color: #334155;
    }
    .notice {
      background: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 16px 20px;
      margin-bottom: 20px;
      border-radius: 8px;
      font-size: 13px;
    }
    .notice-title {
      color: #92400e;
      font-weight: 600;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .notice-text {
      color: #78350f;
      margin-bottom: 12px;
      line-height: 1.5;
    }
    .explanation {
      background: #fffbeb;
      padding: 12px;
      border-radius: 6px;
      font-size: 12px;
      margin-bottom: 12px;
    }
    .explanation-title {
      font-weight: 600;
      color: #92400e;
      margin-bottom: 6px;
    }
    .explanation ul {
      margin: 0;
      padding-left: 20px;
      color: #78350f;
    }
    .explanation li {
      margin: 4px 0;
    }
    .recovery-actions {
      display: flex;
      gap: 8px;
      margin-top: 12px;
    }
    .btn {
      flex: 1;
      padding: 10px 16px;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      border: none;
      display: flex;
      align-items: center;
      justify-center;
      gap: 6px;
      transition: all 0.2s;
    }
    .btn-primary {
      background: #2563eb;
      color: white;
    }
    .btn-primary:hover {
      background: #1d4ed8;
    }
    .btn-danger {
      background: #dc2626;
      color: white;
    }
    .btn-danger:hover {
      background: #b91c1c;
    }
    .btn-secondary {
      background: #64748b;
      color: white;
    }
    .btn-secondary:hover {
      background: #475569;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>📄 ${source.name}</h1>
    <div class="meta">
      Texto extraído • ${(extractedText.length / 1024).toFixed(1)} KB
      ${metadata?.pageCount ? ` • ${metadata.pageCount} páginas` : ''}
    </div>
  </div>
  
  <div class="notice">
    <div class="notice-title">
      ⚠️ Vista de solo texto - Archivo PDF original no disponible
    </div>
    <div class="notice-text">
      El texto extraído está disponible abajo, pero el archivo PDF original no se encuentra en Cloud Storage.
    </div>
    
    <div class="explanation">
      <div class="explanation-title">¿Por qué ocurre esto?</div>
      <ul>
        <li>Documento subido antes de Octubre 2025 (solo se guardó el texto)</li>
        <li>Ruta de almacenamiento cambió tras migración de formato de usuario</li>
        <li>Archivo eliminado o no disponible en Google Cloud Storage</li>
      </ul>
    </div>
    
    <div class="recovery-actions">
      <button class="btn btn-danger" onclick="reportMissingFile()">
        🐛 Reportar Problema
      </button>
      <button class="btn btn-secondary" onclick="window.parent.postMessage({action: 'close'}, '*')">
        ✓ Entendido, Ver Texto
      </button>
    </div>
  </div>
  
  <div class="content">${extractedText.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
  
  <script>
    function reportMissingFile() {
      // Send message to parent window to open bug report dialog
      window.parent.postMessage({
        action: 'reportMissingFile',
        sourceId: '${source.id}',
        sourceName: '${source.name.replace(/'/g, "\\'")}',
        storagePath: '${metadata?.storagePath || metadata?.gcsPath || 'N/A'}',
        diagnostic: {
          hasExtractedData: true,
          hasStoragePath: ${!!(metadata?.storagePath || metadata?.gcsPath)},
          extractedDataSize: ${extractedText.length},
          sourceUserId: '${source.userId}',
        }
      }, '*');
      
      alert('✅ Abriendo formulario de reporte...');
    }
  </script>
</body>
</html>`;

    console.log('✅ Serving HTML preview:', {
      sourceId,
      name: source.name,
      textLength: extractedText.length
    });

    return new Response(htmlContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'private, max-age=3600',
      }
    });

  } catch (error: any) {
    console.error('❌ Error serving file:', error);
    
    const errorHtml = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Error</title>
  <style>
    body {
      font-family: sans-serif;
      padding: 40px;
      text-align: center;
      background: #fee;
    }
    h1 { color: #c00; }
    .details {
      background: white;
      padding: 20px;
      border-radius: 8px;
      margin-top: 20px;
      text-align: left;
      max-width: 600px;
      margin-left: auto;
      margin-right: auto;
    }
  </style>
</head>
<body>
  <h1>❌ Error al cargar archivo</h1>
  <p>${error.message || 'Error desconocido'}</p>
  <div class="details">
    <strong>Detalles técnicos:</strong>
    <pre>${error.stack || 'No disponible'}</pre>
  </div>
</body>
</html>`;

    return new Response(errorHtml, {
      status: 500,
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }
};

