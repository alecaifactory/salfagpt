/**
 * Nubox Cartola Inteligente - Extraction System
 * 
 * Spec: Proyecto Cartola Inteligente Nubox
 * Purpose: Extract bank statements into Nubox-compatible JSON format
 * 
 * Output Format (Per Movement):
 * {
 *   "id": "mov_r0xNzXHr1DL7KeVG",
 *   "type": "transfer",
 *   "amount": 14994,
 *   "pending": false,
 *   "currency": "CLP",
 *   "post_date": "2024-04-24T00:00:00Z",
 *   "description": "77.352.453-K Transf. FERRETERI",
 *   "sender_account": {
 *     "holder_id": "77352453k"
 *   }
 * }
 * 
 * Created: 2025-11-17
 */

import { GoogleGenAI } from '@google/genai';

// Lazy initialization
let genAI: GoogleGenAI | null = null;

function getGenAI(): GoogleGenAI {
  if (genAI) return genAI;
  
  const API_KEY = process.env.GOOGLE_AI_API_KEY || 
    (typeof import.meta !== 'undefined' && import.meta.env 
      ? (import.meta.env.GOOGLE_AI_API_KEY || import.meta.env.GEMINI_API_KEY)
      : undefined);

  if (!API_KEY) {
    throw new Error('GOOGLE_AI_API_KEY not configured');
  }

  genAI = new GoogleGenAI({ apiKey: API_KEY });
  return genAI;
}

// ============================================================================
// TYPES (Nubox Format)
// ============================================================================

export type MovementType = 
  | 'transfer'        // Transferencia
  | 'deposit'         // Depósito
  | 'withdrawal'      // Retiro
  | 'payment'         // Pago
  | 'fee'             // Comisión
  | 'interest'        // Interés
  | 'tax'             // Impuesto
  | 'other';          // Otro

export interface NuboxMovement {
  id: string;                     // Unique ID (mov_xxxxx)
  type: MovementType;             // Movement type
  amount: number;                 // Amount (positive = credit, negative = debit)
  pending: boolean;               // Confirmation status
  currency: 'CLP' | 'USD' | 'EUR'; // Currency code
  post_date: string;              // ISO 8601 date (YYYY-MM-DDTHH:mm:ssZ)
  description: string;            // Movement description (includes RUT if available)
  sender_account?: {
    holder_id?: string;           // RUT or ID of sender/receiver
  };
}

export interface NuboxCartola {
  // Document metadata
  document_id: string;            // Unique document ID
  bank_name: string;              // Bank name (Banco de Chile, BCI, etc.)
  account_number: string;         // Account number
  account_holder: string;         // Account holder name
  account_holder_rut: string;     // Account holder RUT
  
  // Period information
  period_start: string;           // ISO 8601 date
  period_end: string;             // ISO 8601 date
  statement_date: string;         // ISO 8601 date
  
  // Balance information
  opening_balance: number;        // Opening balance
  closing_balance: number;        // Closing balance
  total_credits: number;          // Total deposits/credits
  total_debits: number;           // Total withdrawals/debits
  
  // Movements (transactions)
  movements: NuboxMovement[];
  
  // Metadata
  metadata: {
    total_pages: number;
    total_movements: number;
    extraction_time: number;      // milliseconds
    confidence: number;           // 0-1 score
    model: string;
    cost: number;
  };
  
  // Quality assessment
  quality: {
    fields_complete: boolean;     // All expected fields found
    movements_complete: boolean;  // All movements extracted
    balance_matches: boolean;     // Opening + credits - debits = closing
    confidence_score: number;
    recommendation: string;
  };
}

// ============================================================================
// BANK-SPECIFIC GUIDES (Nubox Format)
// ============================================================================

const NUBOX_BANK_GUIDES = {
  'banco_chile': {
    name: 'Banco de Chile',
    patterns: {
      bank_name: /banco\s+de\s+chile/i,
      account: /cuenta\s+(?:corriente|vista)?\s*n[°º]?\s*(\d{8,15})/i,
      rut: /rut[:\s]+([\d\.]+-[\dkK])/i,
      period: /per[ií]odo[:\s]+(\d{2}\/\d{2}\/\d{4})\s+al?\s+(\d{2}\/\d{2}\/\d{4})/i,
      movement: /(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+([\d\.,]+)\s+(Abono|Cargo)/i,
    },
    movementTypes: {
      'transf\.': 'transfer',
      'transferencia': 'transfer',
      'dep[óo]sito': 'deposit',
      'retiro': 'withdrawal',
      'pago': 'payment',
      'comisi[óo]n': 'fee',
      'inter[ée]s': 'interest',
    },
  },
  
  'bci': {
    name: 'BCI',
    patterns: {
      bank_name: /bci|banco\s+de\s+cr[eé]dito/i,
      account: /n[°º]\s*cuenta[:\s]+(\d{8,15})/i,
      rut: /rut[:\s]+([\d\.]+-[\dkK])/i,
    },
    movementTypes: {
      'transf\.': 'transfer',
      'transferencia': 'transfer',
      'dep[óo]sito': 'deposit',
    },
  },
  
  'santander': {
    name: 'Santander',
    patterns: {
      bank_name: /santander/i,
      account: /cuenta[:\s]+(\d{8,15})/i,
    },
    movementTypes: {
      'transf\.': 'transfer',
      'transferencia': 'transfer',
    },
  },
};

// ============================================================================
// MAIN EXTRACTION FUNCTION (Nubox Format)
// ============================================================================

export async function extractNuboxCartola(
  buffer: Buffer,
  options: {
    fileName: string;
    bank?: string;                // 'auto' | 'banco_chile' | 'bci' | 'santander'
    model?: 'gemini-2.5-flash' | 'gemini-2.5-pro';
    currency?: 'CLP' | 'USD' | 'EUR';
  }
): Promise<NuboxCartola> {
  
  const startTime = Date.now();
  const { fileName, bank = 'auto', model = 'gemini-2.5-flash', currency = 'CLP' } = options;
  
  console.log('🏦 [Nubox Cartola] Starting extraction...');
  console.log(`   File: ${fileName}`);
  console.log(`   Bank: ${bank}`);
  console.log(`   Model: ${model}`);

  try {
    console.log('🏦 [Nubox] Step 1: Initializing Gemini client...');
    const genAIClient = getGenAI();
    
    console.log('🏦 [Nubox] Step 2: Converting buffer to blob...');
    const blob = new Blob([buffer], { type: 'application/pdf' });
    console.log(`   Blob size: ${blob.size} bytes`);
    
    console.log('🏦 [Nubox] Step 3: Uploading to Gemini...');
    const uploadedFile = await genAIClient.files.upload({
      file: blob,
      config: {
        mimeType: 'application/pdf',
        displayName: fileName,
      }
    });
    
    console.log(`🏦 [Nubox] Upload successful:`, uploadedFile.name);
    
    // Wait for processing
    let fileStatus = await genAIClient.files.get({ name: uploadedFile.name || '' });
    let attempts = 0;
    
    while (fileStatus.state !== 'ACTIVE' && attempts < 30) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      fileStatus = await genAIClient.files.get({ name: uploadedFile.name || '' });
      attempts++;
    }
    
    if (fileStatus.state !== 'ACTIVE') {
      throw new Error('File processing timeout');
    }
    
    // Extract with Nubox-specific prompt
    const extractionPrompt = buildNuboxExtractionPrompt(bank, currency);
    
    const result = await genAIClient.models.generateContent({
      model: model,
      contents: [{
        role: 'user',
        parts: [
          { fileData: { fileUri: uploadedFile.uri || '', mimeType: 'application/pdf' } },
          { text: extractionPrompt }
        ]
      }],
      config: {
        temperature: 0.1,
        maxOutputTokens: 16000, // More tokens for movements
      }
    });

    const responseText = result.text || '';
    
    // Parse JSON
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }
    
    const parsed = JSON.parse(jsonMatch[0]);
    
    // Cleanup
    try {
      await genAIClient.files.delete({ name: uploadedFile.name || '' });
    } catch {}
    
    // Get metadata
    const usageMetadata = (result as any).usageMetadata;
    const extractionTime = Date.now() - startTime;
    const cost = calculateCost(model, usageMetadata?.promptTokenCount || 0, usageMetadata?.candidatesTokenCount || 0);
    
    // Build Nubox format
    const nuboxCartola: NuboxCartola = {
      document_id: parsed.document_id || generateDocumentId(),
      bank_name: parsed.bank_name || 'Unknown',
      account_number: parsed.account_number || '',
      account_holder: parsed.account_holder || '',
      account_holder_rut: parsed.account_holder_rut || '',
      period_start: parsed.period_start || '',
      period_end: parsed.period_end || '',
      statement_date: parsed.statement_date || new Date().toISOString(),
      opening_balance: parsed.opening_balance || 0,
      closing_balance: parsed.closing_balance || 0,
      total_credits: parsed.total_credits || 0,
      total_debits: parsed.total_debits || 0,
      movements: parsed.movements || [],
      metadata: {
        total_pages: parsed.metadata?.total_pages || 1,
        total_movements: parsed.movements?.length || 0,
        extraction_time: extractionTime,
        confidence: parsed.metadata?.confidence || 0.95,
        model: model,
        cost: cost,
      },
      quality: assessNuboxQuality(parsed),
    };
    
    console.log(`✅ [Nubox Cartola] Extraction complete!`);
    console.log(`   Movements: ${nuboxCartola.movements.length}`);
    console.log(`   Confidence: ${(nuboxCartola.metadata.confidence * 100).toFixed(1)}%`);
    console.log(`   Time: ${(extractionTime / 1000).toFixed(1)}s`);
    
    return nuboxCartola;
    
  } catch (error) {
    console.error('❌ [Nubox Cartola] Error:', error);
    console.error('Error details:', error instanceof Error ? error.message : String(error));
    console.error('Stack:', error instanceof Error ? error.stack : 'No stack');
    
    // Return a helpful error message
    throw new Error(
      `Nubox extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}. ` +
      `This might be due to: API key not configured, file too large, or network issues.`
    );
  }
}

// ============================================================================
// PROMPT BUILDER (Nubox Spec)
// ============================================================================

function buildNuboxExtractionPrompt(bank: string, currency: string): string {
  const guide = NUBOX_BANK_GUIDES[bank as keyof typeof NUBOX_BANK_GUIDES] || NUBOX_BANK_GUIDES.banco_chile;
  
  return `Extrae TODOS los datos de esta cartola bancaria en formato JSON compatible con Nubox.

═══════════════════════════════════════════════════════════
FORMATO DE SALIDA (ESPECIFICACIÓN NUBOX)
═══════════════════════════════════════════════════════════

{
  "document_id": "doc_abc123xyz",
  "bank_name": "${guide.name}",
  "account_number": "1234567890",
  "account_holder": "Nombre Titular",
  "account_holder_rut": "12345678-9",
  
  "period_start": "2024-04-01T00:00:00Z",
  "period_end": "2024-04-30T00:00:00Z",
  "statement_date": "2024-05-01T00:00:00Z",
  
  "opening_balance": 1500000.50,
  "closing_balance": 2345678.90,
  "total_credits": 5000000.00,
  "total_debits": 4154321.60,
  
  "movements": [
    {
      "id": "mov_abc123",
      "type": "transfer",
      "amount": 14994,
      "pending": false,
      "currency": "${currency}",
      "post_date": "2024-04-24T00:00:00Z",
      "description": "77.352.453-K Transf. FERRETERI",
      "sender_account": {
        "holder_id": "77352453k"
      }
    }
  ],
  
  "metadata": {
    "total_pages": 3,
    "confidence": 0.98
  }
}

═══════════════════════════════════════════════════════════
REGLAS DE EXTRACCIÓN
═══════════════════════════════════════════════════════════

MOVIMIENTOS (movements):
1. ✅ Extrae CADA movimiento de la cartola
2. ✅ ID único por movimiento: "mov_" + random string
3. ✅ Type según descripción:
   - "transf./transferencia" → "transfer"
   - "depósito/abono" → "deposit"
   - "retiro/cargo" → "withdrawal"
   - "pago" → "payment"
   - "comisión" → "fee"
   - "interés" → "interest"
   - Otro → "other"

4. ✅ Amount:
   - Positivo para ABONOS/CRÉDITOS
   - Negativo para CARGOS/DÉBITOS
   - Sin separadores de miles
   - Decimal con punto (12345.67)

5. ✅ Pending:
   - false si movimiento confirmado
   - true si pendiente/provisorio

6. ✅ Post_date:
   - Formato ISO 8601: "YYYY-MM-DDTHH:mm:ssZ"
   - Usar 00:00:00 si solo hay fecha

7. ✅ Description:
   - Texto completo del movimiento
   - MANTENER RUT si aparece (formato: 12.345.678-K)

8. ✅ Sender_account.holder_id:
   - Extraer RUT de la descripción
   - Formato normalizado sin puntos: "12345678k"
   - null si no hay RUT en descripción

INFORMACIÓN GENERAL:
1. ✅ Document_id: Generar único "doc_" + timestamp
2. ✅ Bank_name: Detectar automáticamente (${guide.name})
3. ✅ Account_number: Sin guiones ni espacios
4. ✅ Account_holder_rut: Formato sin puntos (12345678-9)
5. ✅ Fechas: ISO 8601 con timezone Z
6. ✅ Balances: Números sin separadores, decimal con punto

VALIDACIÓN:
- ✅ opening_balance + total_credits - total_debits = closing_balance
- ✅ Sum de movements debe coincidir con total_credits y total_debits
- ✅ Todas las fechas dentro del período
- ✅ Todos los amounts son números válidos

═══════════════════════════════════════════════════════════
EJEMPLO COMPLETO DE MOVIMIENTO
═══════════════════════════════════════════════════════════

Input (en cartola):
  24/04/2024    77.352.453-K Transf. FERRETERI    $14.994    Abono

Output JSON:
{
  "id": "mov_r0xNzXHr1DL7KeVG",
  "type": "transfer",
  "amount": 14994,
  "pending": false,
  "currency": "CLP",
  "post_date": "2024-04-24T00:00:00Z",
  "description": "77.352.453-K Transf. FERRETERI",
  "sender_account": {
    "holder_id": "77352453k"
  }
}

═══════════════════════════════════════════════════════════
TU RESPUESTA
═══════════════════════════════════════════════════════════

Responde ÚNICAMENTE con el objeto JSON (sin markdown, sin explicaciones).
Incluye TODOS los movimientos que encuentres.
Asegura que los balances cuadren matemáticamente.
`;
}

// ============================================================================
// HELPERS
// ============================================================================

function generateDocumentId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `doc_${timestamp}_${random}`;
}

export function generateMovementId(): string {
  const random = Math.random().toString(36).substring(2, 15);
  return `mov_${random}`;
}

function calculateCost(model: string, inputTokens: number, outputTokens: number): number {
  const inputCost = model === 'gemini-2.5-pro'
    ? (inputTokens / 1_000_000) * 1.25
    : (inputTokens / 1_000_000) * 0.075;
  
  const outputCost = model === 'gemini-2.5-pro'
    ? (outputTokens / 1_000_000) * 5.00
    : (outputTokens / 1_000_000) * 0.30;
  
  return inputCost + outputCost;
}

function assessNuboxQuality(parsed: any): NuboxCartola['quality'] {
  const hasAllFields = Boolean(
    parsed.bank_name &&
    parsed.account_number &&
    parsed.account_holder &&
    parsed.opening_balance !== undefined &&
    parsed.closing_balance !== undefined
  );
  
  const hasMovements = (parsed.movements?.length || 0) > 0;
  
  // Validate balance equation
  const opening = parsed.opening_balance || 0;
  const closing = parsed.closing_balance || 0;
  const credits = parsed.total_credits || 0;
  const debits = parsed.total_debits || 0;
  
  const calculatedClosing = opening + credits - debits;
  const balanceMatches = Math.abs(calculatedClosing - closing) < 1; // Allow 1 peso difference for rounding
  
  const confidence = parsed.metadata?.confidence || 0.95;
  
  let recommendation = '';
  if (hasAllFields && hasMovements && balanceMatches && confidence > 0.9) {
    recommendation = '✅ Extracción de alta calidad - Lista para Nubox';
  } else if (hasMovements && confidence > 0.8) {
    recommendation = '⚠️ Extracción buena - Revisar balances';
  } else {
    recommendation = '❌ Extracción incompleta - Revisión manual requerida';
  }
  
  return {
    fields_complete: hasAllFields,
    movements_complete: hasMovements,
    balance_matches: balanceMatches,
    confidence_score: confidence,
    recommendation: recommendation,
  };
}

// ============================================================================
// WEBHOOK NOTIFICATION (Nubox Spec)
// ============================================================================

export interface NuboxWebhookPayload {
  document_id: string;
  status: 'completed' | 'failed' | 'processing';
  processed_at: string;           // ISO 8601
  message: string;
  result_url?: string;            // URL to get result
  error_code?: string;            // If failed
}

export async function sendNuboxWebhook(
  webhookUrl: string,
  payload: NuboxWebhookPayload
): Promise<void> {
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      console.warn(`⚠️ Webhook delivery failed: HTTP ${response.status}`);
    } else {
      console.log(`✅ Webhook delivered to ${webhookUrl}`);
    }
  } catch (error) {
    console.error('❌ Webhook delivery error:', error);
  }
}

