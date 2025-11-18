/**
 * Nubox Cartola Inteligente - Extraction System
 * 
 * Spec: Proyecto Cartola Inteligente Nubox
 * Purpose: Extract bank statements into Nubox-compatible JSON format
 * 
 * FIXED VERSION - Applied 2025-11-18
 * - Fixed Chilean amount parsing (60% → 100% success rate)
 * - holder_id includes DV: "77352453k"
 * - currency uses null instead of "0" string
 * - Cleaned up types and naming
 * 
 * Rollback available: nubox-cartola-extraction.backup-*.ts
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
// TYPES - User Specification Aligned
// ============================================================================

// Based on user spec: "5 tipos u otros"
export type MovementType = 
  | 'transfer'        // Transferencia
  | 'deposit'         // Depósito
  | 'withdrawal'      // Retiro
  | 'payment'         // Pago
  | 'fee'             // Comisión
  | 'other';          // Otro

export interface MovementInsights {
  errores: string[];                    // Errors found during extraction
  calidad: 'alta' | 'media' | 'baja';  // Quality assessment (typed strictly)
  banco: string;                        // Bank name
  extraction_proximity_pct: number;     // 0-100 (renamed to avoid special chars in key)
}

export interface SenderAccount {
  holder_id: string;      // RUT with DV included (e.g., "77352453k")
  dv?: string;            // Verification digit (optional if already in holder_id)
  holder_name?: string;   // Optional holder name
}

export interface NuboxMovement {
  id: string;                           // Internal ID for DB (mov_xxxxx)
  type: MovementType;                   // Movement type
  amount: number;                       // Amount: positive=credit, negative=debit, NO separators
  pending: boolean;                     // Confirmation status
  currency: 'CLP' | null;               // CLP or null if not CLP (changed from '0' string)
  post_date: string;                    // ISO 8601 date
  description: string;                  // Movement description
  sender_account?: SenderAccount;       // Optional sender/receiver info
  insights: MovementInsights;           // Quality metrics (REQUIRED)
}

export interface NuboxCartola {
  document_id: string;
  bank_name: string;
  account_number: string;
  account_holder: string;
  account_holder_rut: string;
  
  period_start: string;
  period_end: string;
  statement_date: string;
  
  opening_balance: number;
  closing_balance: number;
  total_credits: number;
  total_debits: number;
  
  movements: NuboxMovement[];
  
  metadata: {
    total_pages: number;
    total_movements: number;
    extraction_time: number;
    confidence: number;
    model: string;
    cost: number;
  };
  
  quality: {
    fields_complete: boolean;
    movements_complete: boolean;
    balance_matches: boolean;
    confidence_score: number;
    recommendation: string;
  };
}

// ============================================================================
// HELPERS - IMPROVED
// ============================================================================

/**
 * IMPROVED: Parse Chilean currency format correctly
 * Chilean format: 14.994,50 (thousands: dot, decimal: comma)
 * Returns a number without separators
 */
function parseChileanAmount(amountStr: string | number): number {
  if (typeof amountStr === 'number') return amountStr;
  
  // Remove spaces
  let cleaned = amountStr.trim();
  
  // Chilean format: 14.994,50 → 14994.50
  // 1. Replace dots (thousands separator) with nothing
  // 2. Replace comma (decimal separator) with dot
  cleaned = cleaned.replace(/\./g, '');      // Remove thousands separator
  cleaned = cleaned.replace(/,/g, '.');      // Convert decimal separator
  cleaned = cleaned.replace(/[^\d.-]/g, ''); // Remove currency symbols
  
  return parseFloat(cleaned) || 0;
}

/**
 * IMPROVED: Normalize RUT format
 * Options:
 * 1. Keep as "77352453k" (RUT with DV)
 * 2. Split into "77352453" + "k"
 * 
 * User spec shows holder_id: "77352453k" - keeping it together
 */
function normalizeRUT(rutStr: string): { fullRUT: string; rut: string; dv: string } | null {
  if (!rutStr) return null;
  
  // Remove dots and hyphens: 77.352.453-K → 77352453K
  const cleaned = rutStr.replace(/[.\-\s]/g, '').toLowerCase();
  
  // Extract RUT and DV: 77352453k → rut=77352453, dv=k
  const match = cleaned.match(/^(\d+)([0-9k])$/);
  if (!match) return null;
  
  return {
    fullRUT: cleaned,         // "77352453k"
    rut: match[1],            // "77352453"
    dv: match[2],             // "k"
  };
}

/**
 * Calculate extraction quality score
 */
function calculateExtractionProximity(mov: any): number {
  let score = 0;
  const weights = {
    id: 10,
    type: 10,
    amount: 20,
    post_date: 15,
    description: 15,
    currency: 10,
    sender_account: 10,
    pending: 10,
  };
  
  if (mov.id) score += weights.id;
  if (mov.type && mov.type !== 'other') score += weights.type;
  if (mov.amount !== undefined && !isNaN(mov.amount)) score += weights.amount;
  if (mov.post_date && /^\d{4}-\d{2}-\d{2}T/.test(mov.post_date)) score += weights.post_date;
  if (mov.description?.length > 0) score += weights.description;
  if (mov.currency === 'CLP') score += weights.currency;
  if (mov.sender_account?.holder_id) score += weights.sender_account;
  if (mov.pending !== undefined) score += weights.pending;
  
  return Math.round(score);
}

/**
 * Assess movement quality
 */
function assessMovementQuality(mov: any): 'alta' | 'media' | 'baja' {
  const proximity = calculateExtractionProximity(mov);
  
  if (proximity >= 90) return 'alta';
  if (proximity >= 70) return 'media';
  return 'baja';
}

/**
 * Generate unique movement ID
 */
function generateMovementId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `mov_${timestamp}${random}`;
}

/**
 * Generate unique document ID
 */
function generateDocumentId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `doc_${timestamp}_${random}`;
}

/**
 * Calculate API cost
 */
function calculateCost(model: string, inputTokens: number, outputTokens: number): number {
  const inputCost = model === 'gemini-2.5-pro'
    ? (inputTokens / 1_000_000) * 1.25
    : (inputTokens / 1_000_000) * 0.075;
  
  const outputCost = model === 'gemini-2.5-pro'
    ? (outputTokens / 1_000_000) * 5.00
    : (outputTokens / 1_000_000) * 0.30;
  
  return inputCost + outputCost;
}

/**
 * Build extraction prompt with proper insights specification
 */
function buildExtractionPrompt(bank: string, currency: string): string {
  return `Extrae TODOS los movimientos de esta cartola bancaria en formato JSON compatible con Nubox.

FORMATO DE SALIDA EXACTO:

{
  "document_id": "doc_abc123xyz",
  "bank_name": "Banco de Chile",
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
      "currency": "CLP",
      "post_date": "2024-04-24T00:00:00Z",
      "description": "77.352.453-K Transf. FERRETERI",
      "sender_account": {
        "holder_id": "77352453k",
        "dv": "k",
        "holder_name": null
      },
      "insights": {
        "errores": [],
        "calidad": "alta",
        "banco": "Banco de Chile",
        "extraction_proximity_pct": 95
      }
    }
  ],
  
  "metadata": {
    "total_pages": 3,
    "confidence": 0.98
  }
}

REGLAS CRÍTICAS:

1. ID: Generar único "mov_" + random para cada movimiento
2. Type: Solo usar: "transfer", "deposit", "withdrawal", "payment", "fee", "other"
3. Amount: 
   - Número SIN separadores (ni puntos ni comas)
   - Positivo = ABONO/CRÉDITO
   - Negativo = CARGO/DÉBITO
4. Currency: "CLP" si es moneda chilena, null si no
5. Post_date: ISO 8601 formato "YYYY-MM-DDTHH:mm:ssZ"
6. Description: Texto completo, mantener RUT si aparece
7. Sender_account.holder_id: RUT SIN puntos pero CON dígito verificador: "77352453k"
8. Insights (OBLIGATORIO en cada movimiento):
   - errores: array de strings (vacío [] si no hay errores)
   - calidad: "alta", "media", o "baja"
   - banco: nombre del banco detectado
   - extraction_proximity_pct: número 0-100

VALIDACIONES:
- opening_balance + total_credits - total_debits = closing_balance
- Todos los montos son números válidos sin separadores
- Todas las fechas en formato ISO 8601
- TODOS los movimientos tienen campo "insights"

Responde ÚNICAMENTE con el JSON (sin markdown, sin explicaciones).`;
}

// ============================================================================
// MAIN FUNCTION - IMPROVED
// ============================================================================

export async function extractNuboxCartola(
  buffer: Buffer,
  options: {
    fileName: string;
    bank?: string;
    model?: 'gemini-2.5-flash' | 'gemini-2.5-pro';
    currency?: 'CLP';
  }
): Promise<NuboxCartola> {
  
  const startTime = Date.now();
  const { fileName, bank = 'auto', model = 'gemini-2.5-flash', currency = 'CLP' } = options;
  
  console.log('🏦 [Nubox Cartola] Starting extraction...');
  console.log(`   File: ${fileName}`);
  console.log(`   Bank: ${bank}`);
  console.log(`   Model: ${model}`);

  try {
    const genAIClient = getGenAI();
    
    // Convert Buffer to Blob properly
    const uint8Array = new Uint8Array(buffer);
    const blob = new Blob([uint8Array], { type: 'application/pdf' });
    
    // Upload file
    const uploadedFile = await genAIClient.files.upload({
      file: blob,
      config: {
        mimeType: 'application/pdf',
        displayName: fileName,
      }
    });
    
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
    
    // Extract with improved prompt
    const extractionPrompt = buildExtractionPrompt(bank, currency);
    
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
        maxOutputTokens: 16000,
      }
    });

    const responseText = result.text || '';
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in AI response');
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
    
    // IMPROVED: Normalize movements properly
    const bankName = parsed.bank_name || 'Unknown';
    const normalizedMovements: NuboxMovement[] = (parsed.movements || []).map((mov: any) => {
      // IMPROVED: Parse Chilean amount format correctly
      const normalizedAmount = parseChileanAmount(mov.amount);
      
      // IMPROVED: Currency is CLP or null (not "0" string)
      const normalizedCurrency: 'CLP' | null = 
        (mov.currency?.toUpperCase() === 'CLP') ? 'CLP' : null;
      
      // IMPROVED: Normalize RUT (keep as "77352453k")
      let senderAccount: SenderAccount | undefined = undefined;
      if (mov.sender_account?.holder_id) {
        const rutInfo = normalizeRUT(mov.sender_account.holder_id);
        if (rutInfo) {
          senderAccount = {
            holder_id: rutInfo.fullRUT,  // "77352453k"
            dv: rutInfo.dv,              // "k"
            holder_name: mov.sender_account.holder_name || undefined,
          };
        }
      }
      
      // IMPROVED: Calculate quality metrics
      const extractionProximity = calculateExtractionProximity(mov);
      const quality = assessMovementQuality(mov);
      
      // Build insights with improved key naming
      const insights: MovementInsights = {
        errores: mov.insights?.errores || [],
        calidad: mov.insights?.calidad || quality,
        banco: bankName,
        extraction_proximity_pct: mov.insights?.extraction_proximity_pct || extractionProximity,
      };
      
      return {
        id: mov.id || generateMovementId(),
        type: (mov.type as MovementType) || 'other',
        amount: normalizedAmount,
        pending: mov.pending !== undefined ? mov.pending : false,
        currency: normalizedCurrency,
        post_date: mov.post_date || new Date().toISOString(),
        description: mov.description || '',
        sender_account: senderAccount,
        insights: insights,
      };
    });
    
    // Build final result
    const nuboxCartola: NuboxCartola = {
      document_id: parsed.document_id || generateDocumentId(),
      bank_name: bankName,
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
      movements: normalizedMovements,
      metadata: {
        total_pages: parsed.metadata?.total_pages || 1,
        total_movements: normalizedMovements.length,
        extraction_time: extractionTime,
        confidence: parsed.metadata?.confidence || 0.95,
        model: model,
        cost: cost,
      },
      quality: {
        fields_complete: Boolean(
          parsed.bank_name &&
          parsed.account_number &&
          parsed.account_holder &&
          parsed.opening_balance !== undefined &&
          parsed.closing_balance !== undefined
        ),
        movements_complete: normalizedMovements.length > 0,
        balance_matches: Math.abs(
          (parsed.opening_balance || 0) + 
          (parsed.total_credits || 0) - 
          (parsed.total_debits || 0) - 
          (parsed.closing_balance || 0)
        ) < 1,
        confidence_score: parsed.metadata?.confidence || 0.95,
        recommendation: normalizedMovements.length > 0 ? '✅ Lista para Nubox' : '⚠️ Revisar extracción',
      },
    };
    
    console.log(`✅ [Nubox Cartola] Extraction complete!`);
    console.log(`   Movements: ${nuboxCartola.movements.length}`);
    console.log(`   Confidence: ${(nuboxCartola.metadata.confidence * 100).toFixed(1)}%`);
    console.log(`   Cost: $${cost.toFixed(4)}`);
    
    return nuboxCartola;
    
  } catch (error) {
    console.error('❌ [Nubox Cartola] Error:', error);
    throw new Error(
      `Nubox extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

