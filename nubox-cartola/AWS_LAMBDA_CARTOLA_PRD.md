# PRD: Extracción de Cartolas Bancarias con AWS Lambda
## Sistema Serverless de Reconocimiento Inteligente para Nubox

**Versión:** 2.0.0  
**Fecha:** 2025-11-24  
**Estado:** ✅ Listo para Migración a AWS Lambda  
**Stack:** Node.js + AWS Lambda + S3 + DynamoDB + Gemini AI

---

## 📋 Índice

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Arquitectura AWS Lambda](#arquitectura-aws-lambda)
3. [Estructura de Datos](#estructura-de-datos)
4. [Especificaciones Técnicas](#especificaciones-técnicas)
5. [APIs y Endpoints](#apis-y-endpoints)
6. [Seguridad y Compliance](#seguridad-y-compliance)
7. [Migración desde GCP](#migración-desde-gcp)
8. [Despliegue en AWS](#despliegue-en-aws)
9. [Testing y Validación](#testing-y-validación)
10. [Costos Estimados](#costos-estimados)

---

## 🎯 Resumen Ejecutivo

### Objetivo

Desplegar un sistema serverless en **AWS Lambda** que extraiga automáticamente datos estructurados de cartolas bancarias chilenas usando **Gemini AI**, retornando JSON compatible con Nubox.

### Estado Actual (GCP)

✅ **Sistema funcional en Google Cloud Platform:**
- Motor de extracción con Gemini AI 2.5 Flash/Pro
- Precisión: 95%+ en campos críticos
- Validación automática de balance
- Soporte para 7+ bancos chilenos
- 10/10 movimientos extraídos correctamente en pruebas reales

### Migración a AWS

**Por qué AWS Lambda:**
- ✅ **Serverless**: Pago por uso, sin servidores que gestionar
- ✅ **Escalable**: Auto-scaling automático (0 → miles de ejecuciones)
- ✅ **Node.js nativo**: Compatibilidad directa con código existente
- ✅ **Costos optimizados**: Solo paga por tiempo de ejecución
- ✅ **Integración**: S3, DynamoDB, API Gateway en mismo ecosistema

---

## 🏗️ Arquitectura AWS Lambda

### Diagrama de Alto Nivel

```
┌─────────────────────────────────────────────────────────────────┐
│                    AWS LAMBDA ARCHITECTURE                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Usuario/Cliente                                                │
│       ↓                                                          │
│  API Gateway (REST API)                                         │
│  ├─ POST /cartola/extract        → Lambda: ProcessCartola      │
│  ├─ GET  /cartola/{id}           → Lambda: GetCartolaStatus    │
│  └─ GET  /cartola/list           → Lambda: ListCartolas        │
│       ↓                                                          │
│  Lambda Function: ProcessCartola (Node.js 20.x)                │
│  ├─ 1. Descarga PDF desde S3                                   │
│  ├─ 2. Llama Gemini AI (API externa)                           │
│  ├─ 3. Parsea y valida JSON                                    │
│  ├─ 4. Guarda resultado en DynamoDB                            │
│  └─ 5. Envía webhook (opcional)                                │
│       ↓                                                          │
│  AWS S3                                                          │
│  ├─ Bucket: nubox-cartola-uploads                              │
│  ├─ Lifecycle: 7 días retención                                │
│  └─ Encriptación: AES-256                                       │
│       ↓                                                          │
│  DynamoDB                                                        │
│  ├─ Tabla: cartola_extractions                                 │
│  ├─ Índices: userId, organizationId, status                    │
│  └─ TTL: 90 días                                                │
│       ↓                                                          │
│  CloudWatch                                                      │
│  ├─ Logs estructurados                                          │
│  ├─ Métricas de rendimiento                                     │
│  └─ Alarmas automáticas                                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Componentes AWS

#### 1. **Lambda Functions**

**ProcessCartolaExtraction** (Función principal)
- Runtime: Node.js 20.x
- Memoria: 2GB (ajustable según tamaño de archivo)
- Timeout: 15 minutos (máximo)
- Concurrencia: 100 ejecuciones simultáneas
- Environment Variables: GEMINI_API_KEY, S3_BUCKET, DYNAMODB_TABLE

**GetCartolaStatus** (Consulta estado)
- Runtime: Node.js 20.x
- Memoria: 512MB
- Timeout: 30 segundos
- Operación: Query DynamoDB por ID

**ListUserCartolas** (Lista extracciones)
- Runtime: Node.js 20.x
- Memoria: 512MB
- Timeout: 30 segundos
- Operación: Query DynamoDB por userId

#### 2. **API Gateway**

**REST API Configuration:**
```yaml
Resources:
  /cartola:
    POST:
      Integration: Lambda (ProcessCartolaExtraction)
      Auth: Cognito User Pool / API Key
      Request: multipart/form-data
      Response: JSON
    
    GET:
      Integration: Lambda (ListUserCartolas)
      Auth: Cognito User Pool / API Key
      Query Parameters: limit, status
      Response: JSON
  
  /cartola/{id}:
    GET:
      Integration: Lambda (GetCartolaStatus)
      Auth: Cognito User Pool / API Key
      Path Parameters: id
      Response: JSON
```

**Autenticación:**
- Cognito User Pool (OAuth 2.0 compatible)
- API Keys para integraciones
- Rate Limiting: 100 requests/min por usuario

#### 3. **S3 Bucket**

**Configuración:**
```yaml
Bucket: nubox-cartola-uploads
Region: us-east-1 (o región preferida)
Encryption: AES-256 (SSE-S3)
Versioning: Disabled
Public Access: Blocked

Lifecycle Policy:
  - Delete after 7 days (cartola originals)
  - Transition to Glacier after 30 days (archivos)

Access Policy:
  - Lambda execution role: Read/Write
  - Users: Pre-signed URLs only (7 días)
```

#### 4. **DynamoDB Table**

**Tabla: cartola_extractions**

```yaml
Primary Key:
  - id (String) - Partition Key

Global Secondary Indexes:
  - userId-createdAt-index
    - Partition: userId (String)
    - Sort: createdAt (Number - epoch ms)
  
  - organizationId-createdAt-index
    - Partition: organizationId (String)
    - Sort: createdAt (Number - epoch ms)
  
  - status-createdAt-index
    - Partition: status (String)
    - Sort: createdAt (Number - epoch ms)

Attributes:
  - id (String)
  - userId (String)
  - organizationId (String, optional)
  - status (String: pending, processing, completed, failed)
  - fileName (String)
  - fileSize (Number)
  - s3Key (String)
  - bankName (String, optional)
  - extractionResult (Map - JSON completo)
  - error (Map, optional)
  - webhookUrl (String, optional)
  - createdAt (Number - epoch ms)
  - updatedAt (Number - epoch ms)
  - completedAt (Number - epoch ms, optional)
  - processingTime (Number - milliseconds, optional)
  - ttl (Number - epoch seconds, for auto-deletion)

On-Demand Capacity Mode: Yes (auto-scaling)
Point-in-Time Recovery: Enabled
Encryption: AWS-managed key (KMS)
```

---

## 📊 Estructura de Datos

### JSON de Salida (Compatible Nubox)

```json
{
  "document_id": "doc_a1b2c3d4e5f6",
  "bank_name": "Banco de Chile",
  "account_number": "000484021004",
  "account_holder": "Gino Marcelo Ramirez Berrios",
  "account_holder_rut": "16416697-K",
  "period_start": "2024-09-30T00:00:00Z",
  "period_end": "2024-10-30T00:00:00Z",
  "statement_date": "2024-11-13T00:00:00Z",
  "opening_balance": 2260904,
  "closing_balance": 1022952,
  "total_credits": 317000,
  "total_debits": 1554952,
  "movements": [
    {
      "id": "mov_1a2b3c4d5e6f",
      "type": "transfer",
      "amount": -50000,
      "pending": false,
      "currency": "CLP",
      "post_date": "2024-10-30T00:00:00Z",
      "description": "Traspaso A:Gino Superdigital",
      "balance": 0,
      "insights": {
        "errores": [],
        "calidad": "alta",
        "banco": "Banco de Chile",
        "extraction_proximity_pct": 95
      }
    }
  ],
  "balance_validation": {
    "saldo_inicial": 2260904,
    "total_abonos": 317000,
    "total_cargos": 1554952,
    "saldo_calculado": 1022952,
    "saldo_final_documento": 1022952,
    "coincide": true,
    "diferencia": 0
  },
  "metadata": {
    "total_pages": 1,
    "total_movements": 10,
    "extraction_time": 57602,
    "confidence": 0.98,
    "model": "gemini-2.5-flash",
    "cost": 0.0008598
  },
  "quality": {
    "fields_complete": true,
    "movements_complete": true,
    "balance_matches": true,
    "confidence_score": 0.98,
    "recommendation": "✅ Lista para Nubox",
    "average_extraction_proximity_pct": 95,
    "extraction_bank": "Banco de Chile"
  }
}
```

### Campos Críticos (Validación Obligatoria)

**Nivel 1 - Identificación:**
- ✅ `document_id`: ID único generado
- ✅ `bank_name`: Nombre del banco detectado
- ✅ `account_number`: Número de cuenta extraído
- ✅ `account_holder`: Titular de la cuenta
- ✅ `account_holder_rut`: RUT del titular

**Nivel 2 - Período:**
- ✅ `period_start`: Fecha inicio (ISO 8601)
- ✅ `period_end`: Fecha fin (ISO 8601)
- ✅ `statement_date`: Fecha emisión del documento

**Nivel 3 - Balances:**
- ✅ `opening_balance`: Saldo inicial (número sin separadores)
- ✅ `closing_balance`: Saldo final (número sin separadores)
- ✅ `total_credits`: Total abonos/créditos
- ✅ `total_debits`: Total cargos/débitos

**Nivel 4 - Movimientos:**
- ✅ `movements[]`: Array de transacciones (mínimo 1)
  - `id`: ID único por movimiento
  - `type`: Tipo de transacción (transfer, deposit, withdrawal, payment, fee, other)
  - `amount`: Monto (+ abono, - cargo)
  - `currency`: "CLP" o null
  - `post_date`: Fecha del movimiento (ISO 8601)
  - `description`: Descripción completa
  - `balance`: Saldo después del movimiento
  - `insights`: Métricas de calidad

**Nivel 5 - Validación:**
- ✅ `balance_validation`: Validación matemática del balance
  - `coincide`: true/false (tolerancia ±1)
  - `diferencia`: Diferencia absoluta

---

## 🔧 Especificaciones Técnicas

### Lambda Function: ProcessCartolaExtraction

**Código Principal (handler.js):**

```javascript
// handler.js - Lambda entry point
const { GoogleGenAI } = require('@google/genai');
const AWS = require('aws-sdk');

const s3 = new AWS.S3();
const dynamoDB = new AWS.DynamoDB.DocumentClient();
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

exports.handler = async (event) => {
  console.log('🏦 ProcessCartolaExtraction started');
  
  try {
    // 1. Parse input
    const { s3Key, userId, organizationId, bankName, extractionId } = JSON.parse(event.body);
    
    // 2. Update status to processing
    await updateStatus(extractionId, 'processing');
    
    // 3. Download PDF from S3
    const pdfBuffer = await downloadFromS3(s3Key);
    
    // 4. Extract with Gemini AI
    const extractionResult = await extractBankStatement(pdfBuffer, s3Key, {
      bankName,
      model: 'gemini-2.5-flash'
    });
    
    // 5. Save to DynamoDB
    await saveExtraction(extractionId, {
      status: 'completed',
      extractionResult,
      completedAt: Date.now(),
      processingTime: Date.now() - startTime
    });
    
    // 6. Send webhook (if configured)
    if (webhookUrl) {
      await sendWebhook(webhookUrl, {
        id: extractionId,
        status: 'completed',
        result: extractionResult
      });
    }
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        id: extractionId,
        status: 'completed',
        result: extractionResult
      })
    };
    
  } catch (error) {
    console.error('❌ Extraction failed:', error);
    
    await updateStatus(extractionId, 'failed', {
      error: {
        message: error.message,
        code: 'EXTRACTION_FAILED',
        timestamp: Date.now()
      }
    });
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Extraction failed',
        details: error.message
      })
    };
  }
};

// Helper functions
async function downloadFromS3(s3Key) {
  const params = {
    Bucket: process.env.S3_BUCKET,
    Key: s3Key
  };
  const data = await s3.getObject(params).promise();
  return data.Body;
}

async function updateStatus(id, status, updates = {}) {
  await dynamoDB.update({
    TableName: process.env.DYNAMODB_TABLE,
    Key: { id },
    UpdateExpression: 'SET #status = :status, updatedAt = :now, #updates',
    ExpressionAttributeNames: {
      '#status': 'status',
      '#updates': Object.keys(updates).join(', ')
    },
    ExpressionAttributeValues: {
      ':status': status,
      ':now': Date.now(),
      ...Object.fromEntries(Object.entries(updates).map(([k, v]) => [`:${k}`, v]))
    }
  }).promise();
}

async function saveExtraction(id, data) {
  await dynamoDB.put({
    TableName: process.env.DYNAMODB_TABLE,
    Item: {
      id,
      ...data,
      ttl: Math.floor(Date.now() / 1000) + (90 * 24 * 60 * 60) // 90 días
    }
  }).promise();
}

async function extractBankStatement(buffer, fileName, options) {
  const startTime = Date.now();
  
  // Convert Buffer to Blob for Gemini
  const blob = new Blob([buffer], { type: 'application/pdf' });
  
  // Upload to Gemini Files API
  const uploadedFile = await genAI.files.upload({
    file: blob,
    config: {
      mimeType: 'application/pdf',
      displayName: fileName
    }
  });
  
  // Wait for processing
  let fileStatus = await genAI.files.get({ name: uploadedFile.name });
  let attempts = 0;
  
  while (fileStatus.state !== 'ACTIVE' && attempts < 30) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    fileStatus = await genAI.files.get({ name: uploadedFile.name });
    attempts++;
  }
  
  if (fileStatus.state !== 'ACTIVE') {
    throw new Error('File processing timeout');
  }
  
  // Extract with Gemini
  const prompt = buildExtractionPrompt(options.bankName || 'auto', 'CLP');
  
  const result = await genAI.models.generateContent({
    model: options.model || 'gemini-2.5-flash',
    contents: [{
      role: 'user',
      parts: [
        { fileData: { fileUri: uploadedFile.uri, mimeType: 'application/pdf' } },
        { text: prompt }
      ]
    }],
    config: {
      temperature: 0.1,
      maxOutputTokens: 16000
    }
  });
  
  // Parse JSON response
  const responseText = result.text || '{}';
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No JSON found in AI response');
  }
  
  const parsed = JSON.parse(jsonMatch[0]);
  
  // Clean up Gemini file
  try {
    await genAI.files.delete({ name: uploadedFile.name });
  } catch {}
  
  // Normalize and validate
  const normalized = normalizeCartolaData(parsed);
  validateCartolaData(normalized);
  
  return normalized;
}

function buildExtractionPrompt(bank, currency) {
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
  "opening_balance": 1500000,
  "closing_balance": 2345678,
  "total_credits": 5000000,
  "total_debits": 4154321,
  "movements": [
    {
      "id": "mov_abc123",
      "type": "transfer",
      "amount": 14994,
      "pending": false,
      "currency": "CLP",
      "post_date": "2024-04-24T00:00:00Z",
      "description": "77.352.453-K Transf. FERRETERI",
      "balance": 2345678,
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
  "balance_validation": {
    "saldo_inicial": 1500000,
    "total_abonos": 5000000,
    "total_cargos": 4154321,
    "saldo_calculado": 2345679,
    "saldo_final_documento": 2345678,
    "coincide": true,
    "diferencia": 0
  },
  "metadata": {
    "total_pages": 3,
    "total_movements": 1,
    "extraction_time": 0,
    "confidence": 0.98,
    "model": "gemini-2.5-flash",
    "cost": 0.0
  },
  "quality": {
    "fields_complete": true,
    "movements_complete": true,
    "balance_matches": true,
    "confidence_score": 0.98,
    "recommendation": "✅ Lista para Nubox",
    "average_extraction_proximity_pct": 95,
    "extraction_bank": "Banco de Chile"
  }
}

REGLAS CRÍTICAS:

1. ID: Generar único "mov_" + random para cada movimiento

2. Type: Solo usar: "transfer", "deposit", "withdrawal", "payment", "fee", "other"

3. Amount (MUY IMPORTANTE - USA LAS COLUMNAS CORRECTAMENTE):
   - Busca 3 columnas: ABONOS/CRÉDITOS, CARGOS/DÉBITOS, SALDO/BALANCE
   - Si valor en ABONOS/CRÉDITOS: amount = POSITIVO (+)
   - Si valor en CARGOS/DÉBITOS: amount = NEGATIVO (-)
   - Número SIN separadores (ni puntos ni comas)
   - Ejemplo: 50.000 en ABONOS → amount: 50000
   - Ejemplo: 757.864 en CARGOS → amount: -757864

4. Balance (OBLIGATORIO):
   - SALDO después de cada movimiento
   - De columna SALDO/BALANCE
   - Sin separadores
   - Ejemplo: 1.237.952 → balance: 1237952

5. Currency: "CLP" si es chilena, null si no

6. Post_date: ISO 8601 "YYYY-MM-DDTHH:mm:ssZ"

7. Description: Texto completo, mantener RUT si aparece

8. Sender_account.holder_id: RUT SIN puntos pero CON DV: "77352453k"

9. Insights (OBLIGATORIO en cada movimiento):
   - errores: array de strings ([] si no hay)
   - calidad: "alta", "media", "baja"
   - banco: nombre del banco
   - extraction_proximity_pct: 0-100

10. Balance_validation (AL FINAL):
    - saldo_calculado = saldo_inicial + total_abonos - total_cargos
    - coincide: true si iguales (tolerancia ±1)
    - diferencia: diferencia absoluta

VALIDACIONES:
- opening_balance + total_credits - total_debits = closing_balance
- Todos montos son números sin separadores
- Todas fechas ISO 8601
- TODOS movimientos tienen insights
- TODOS movimientos tienen balance
- balance_validation presente y validando

Responde ÚNICAMENTE con el JSON (sin markdown, sin explicaciones).`;
}

function normalizeCartolaData(parsed) {
  // Normalize movements
  const movements = (parsed.movements || []).map(mov => {
    const normalizedAmount = parseChileanAmount(mov.amount);
    const normalizedBalance = parseChileanAmount(mov.balance);
    const normalizedCurrency = mov.currency?.toUpperCase() === 'CLP' ? 'CLP' : null;
    
    return {
      id: mov.id || generateMovementId(),
      type: mov.type || 'other',
      amount: normalizedAmount,
      pending: mov.pending !== undefined ? mov.pending : false,
      currency: normalizedCurrency,
      post_date: mov.post_date || new Date().toISOString(),
      description: mov.description || '',
      balance: normalizedBalance,
      sender_account: mov.sender_account,
      insights: mov.insights || {
        errores: [],
        calidad: 'media',
        banco: parsed.bank_name || 'Unknown',
        extraction_proximity_pct: 80
      }
    };
  });
  
  // Calculate balance validation
  const totalAbonos = movements
    .filter(m => m.amount > 0)
    .reduce((sum, m) => sum + m.amount, 0);
  
  const totalCargos = Math.abs(movements
    .filter(m => m.amount < 0)
    .reduce((sum, m) => sum + m.amount, 0));
  
  const saldoCalculado = (parsed.opening_balance || 0) + totalAbonos - totalCargos;
  const saldoFinal = parsed.closing_balance || 0;
  const diferencia = Math.abs(saldoCalculado - saldoFinal);
  const coincide = diferencia <= 1;
  
  // Calculate average extraction proximity
  const avgProximity = movements.length > 0
    ? Math.round(movements.reduce((sum, m) => sum + m.insights.extraction_proximity_pct, 0) / movements.length)
    : 0;
  
  return {
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
    movements: movements,
    balance_validation: {
      saldo_inicial: parsed.opening_balance || 0,
      total_abonos: totalAbonos,
      total_cargos: totalCargos,
      saldo_calculado: saldoCalculado,
      saldo_final_documento: saldoFinal,
      coincide: coincide,
      diferencia: diferencia
    },
    metadata: {
      total_pages: parsed.metadata?.total_pages || 1,
      total_movements: movements.length,
      extraction_time: 0, // Will be updated
      confidence: parsed.metadata?.confidence || 0.95,
      model: 'gemini-2.5-flash',
      cost: 0 // Will be calculated
    },
    quality: {
      fields_complete: Boolean(parsed.bank_name && parsed.account_number && parsed.account_holder),
      movements_complete: movements.length > 0,
      balance_matches: coincide,
      confidence_score: parsed.metadata?.confidence || 0.95,
      recommendation: movements.length > 0 && coincide ? '✅ Lista para Nubox' : '⚠️ Revisar extracción',
      average_extraction_proximity_pct: avgProximity,
      extraction_bank: parsed.bank_name || 'Unknown'
    }
  };
}

function parseChileanAmount(amountStr) {
  if (typeof amountStr === 'number') return amountStr;
  
  let cleaned = String(amountStr).trim();
  cleaned = cleaned.replace(/\./g, '');      // Remove thousands separator
  cleaned = cleaned.replace(/,/g, '.');      // Convert decimal separator
  cleaned = cleaned.replace(/[^\d.-]/g, ''); // Remove currency symbols
  
  return parseFloat(cleaned) || 0;
}

function generateMovementId() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `mov_${timestamp}${random}`;
}

function generateDocumentId() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `doc_${timestamp}_${random}`;
}

function validateCartolaData(data) {
  const errors = [];
  
  if (!data.bank_name) errors.push('bank_name is required');
  if (!data.account_number) errors.push('account_number is required');
  if (!Array.isArray(data.movements)) errors.push('movements must be array');
  if (data.movements.length === 0) errors.push('movements array is empty');
  
  // Validate each movement
  data.movements.forEach((mov, idx) => {
    if (!mov.id) errors.push(`Movement ${idx}: missing id`);
    if (!mov.type) errors.push(`Movement ${idx}: missing type`);
    if (typeof mov.amount !== 'number') errors.push(`Movement ${idx}: amount must be number`);
    if (!mov.post_date) errors.push(`Movement ${idx}: missing post_date`);
    if (!mov.description) errors.push(`Movement ${idx}: missing description`);
    if (typeof mov.balance !== 'number') errors.push(`Movement ${idx}: balance must be number`);
    if (!mov.insights) errors.push(`Movement ${idx}: missing insights`);
  });
  
  if (errors.length > 0) {
    throw new Error(`Validation failed:\n${errors.join('\n')}`);
  }
}

async function sendWebhook(url, payload) {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000)
    });
    
    if (!response.ok) {
      throw new Error(`Webhook failed: ${response.status}`);
    }
    
    console.log('✅ Webhook sent successfully');
  } catch (error) {
    console.error('❌ Webhook failed:', error);
    // Don't throw - webhook failure shouldn't fail extraction
  }
}
```

### package.json para Lambda

```json
{
  "name": "nubox-cartola-lambda",
  "version": "1.0.0",
  "description": "AWS Lambda function for bank statement extraction using Gemini AI",
  "main": "handler.js",
  "scripts": {
    "test": "jest",
    "build": "npm install --production",
    "deploy": "serverless deploy",
    "invoke-local": "serverless invoke local -f processCartola"
  },
  "dependencies": {
    "@google/genai": "^1.23.0",
    "aws-sdk": "^2.1691.0"
  },
  "devDependencies": {
    "serverless": "^3.38.0",
    "serverless-offline": "^13.3.0",
    "@types/node": "^20.10.0",
    "jest": "^29.7.0"
  },
  "engines": {
    "node": ">=20.0.0"
  }
}
```

### serverless.yml (Serverless Framework)

```yaml
service: nubox-cartola-extraction

provider:
  name: aws
  runtime: nodejs20.x
  region: us-east-1
  stage: ${opt:stage, 'dev'}
  memorySize: 2048
  timeout: 900  # 15 minutes
  
  environment:
    GEMINI_API_KEY: ${env:GEMINI_API_KEY}
    S3_BUCKET: ${self:custom.s3Bucket}
    DYNAMODB_TABLE: ${self:custom.dynamoTable}
  
  iam:
    role:
      statements:
        - Effect: Allow
          Action:
            - s3:GetObject
            - s3:PutObject
            - s3:DeleteObject
          Resource: 
            - arn:aws:s3:::${self:custom.s3Bucket}/*
        
        - Effect: Allow
          Action:
            - dynamodb:GetItem
            - dynamodb:PutItem
            - dynamodb:UpdateItem
            - dynamodb:Query
            - dynamodb:Scan
          Resource:
            - arn:aws:dynamodb:${self:provider.region}:*:table/${self:custom.dynamoTable}
            - arn:aws:dynamodb:${self:provider.region}:*:table/${self:custom.dynamoTable}/index/*
        
        - Effect: Allow
          Action:
            - logs:CreateLogGroup
            - logs:CreateLogStream
            - logs:PutLogEvents
          Resource:
            - arn:aws:logs:${self:provider.region}:*:*

custom:
  s3Bucket: nubox-cartola-uploads-${self:provider.stage}
  dynamoTable: cartola_extractions_${self:provider.stage}

functions:
  processCartola:
    handler: handler.handler
    events:
      - http:
          path: cartola/extract
          method: post
          cors: true
          authorizer:
            type: COGNITO_USER_POOLS
            authorizerId: !Ref CognitoAuthorizer
  
  getCartolaStatus:
    handler: handlers/get-status.handler
    memorySize: 512
    timeout: 30
    events:
      - http:
          path: cartola/{id}
          method: get
          cors: true
          request:
            parameters:
              paths:
                id: true
          authorizer:
            type: COGNITO_USER_POOLS
            authorizerId: !Ref CognitoAuthorizer
  
  listUserCartolas:
    handler: handlers/list.handler
    memorySize: 512
    timeout: 30
    events:
      - http:
          path: cartola/list
          method: get
          cors: true
          request:
            parameters:
              querystrings:
                limit: false
                status: false
          authorizer:
            type: COGNITO_USER_POOLS
            authorizerId: !Ref CognitoAuthorizer

resources:
  Resources:
    # S3 Bucket
    CartolaUploadsBucket:
      Type: AWS::S3::Bucket
      Properties:
        BucketName: ${self:custom.s3Bucket}
        BucketEncryption:
          ServerSideEncryptionConfiguration:
            - ServerSideEncryptionByDefault:
                SSEAlgorithm: AES256
        PublicAccessBlockConfiguration:
          BlockPublicAcls: true
          BlockPublicPolicy: true
          IgnorePublicAcls: true
          RestrictPublicBuckets: true
        LifecycleConfiguration:
          Rules:
            - Id: DeleteAfter7Days
              Status: Enabled
              ExpirationInDays: 7
              Prefix: uploads/
    
    # DynamoDB Table
    CartolaExtractionsTable:
      Type: AWS::DynamoDB::Table
      Properties:
        TableName: ${self:custom.dynamoTable}
        BillingMode: PAY_PER_REQUEST
        AttributeDefinitions:
          - AttributeName: id
            AttributeType: S
          - AttributeName: userId
            AttributeType: S
          - AttributeName: createdAt
            AttributeType: N
          - AttributeName: status
            AttributeType: S
          - AttributeName: organizationId
            AttributeType: S
        KeySchema:
          - AttributeName: id
            KeyType: HASH
        GlobalSecondaryIndexes:
          - IndexName: userId-createdAt-index
            KeySchema:
              - AttributeName: userId
                KeyType: HASH
              - AttributeName: createdAt
                KeyType: RANGE
            Projection:
              ProjectionType: ALL
          
          - IndexName: organizationId-createdAt-index
            KeySchema:
              - AttributeName: organizationId
                KeyType: HASH
              - AttributeName: createdAt
                KeyType: RANGE
            Projection:
              ProjectionType: ALL
          
          - IndexName: status-createdAt-index
            KeySchema:
              - AttributeName: status
                KeyType: HASH
              - AttributeName: createdAt
                KeyType: RANGE
            Projection:
              ProjectionType: ALL
        TimeToLiveSpecification:
          AttributeName: ttl
          Enabled: true
        PointInTimeRecoverySpecification:
          PointInTimeRecoveryEnabled: true
        SSESpecification:
          SSEEnabled: true
    
    # Cognito User Pool (if not already exists)
    CognitoAuthorizer:
      Type: AWS::ApiGateway::Authorizer
      Properties:
        Name: CognitoAuthorizer
        Type: COGNITO_USER_POOLS
        IdentitySource: method.request.header.Authorization
        RestApiId: !Ref ApiGatewayRestApi
        ProviderARNs:
          - arn:aws:cognito-idp:${self:provider.region}:YOUR_ACCOUNT_ID:userpool/YOUR_USER_POOL_ID

plugins:
  - serverless-offline
```

---

## 🔐 Seguridad y Compliance

### Autenticación

**AWS Cognito User Pool:**
```javascript
// Configuración de Cognito
const cognitoConfig = {
  UserPoolId: process.env.COGNITO_USER_POOL_ID,
  ClientId: process.env.COGNITO_CLIENT_ID,
  Region: 'us-east-1'
};

// Validar token JWT de Cognito
async function validateCognitoToken(authToken) {
  const cognitoIss = `https://cognito-idp.${cognitoConfig.Region}.amazonaws.com/${cognitoConfig.UserPoolId}`;
  // Validate JWT with Cognito public keys
  // Return user claims
}
```

### Encriptación

**En Tránsito:**
- ✅ TLS 1.2+ en API Gateway
- ✅ HTTPS obligatorio
- ✅ Certificate Manager para SSL

**En Reposo:**
- ✅ S3: AES-256 (SSE-S3)
- ✅ DynamoDB: AWS managed KMS key
- ✅ Lambda environment variables: Encriptadas con KMS

**Datos Sensibles:**
```javascript
// Enmascarar números de cuenta en logs
function maskAccountNumber(accountNumber) {
  if (!accountNumber || accountNumber.length < 4) return '****';
  return '****' + accountNumber.slice(-4);
}

// Hashear RUTs para analytics
const crypto = require('crypto');
function hashRUT(rut) {
  return crypto.createHash('sha256').update(rut).digest('hex').substring(0, 16);
}
```

### Compliance (Ley 19.628 Chile)

**Datos Personales Protegidos:**
1. ✅ RUT del titular
2. ✅ Nombre del titular
3. ✅ Número de cuenta
4. ✅ Montos de transacciones
5. ✅ Descripciones de movimientos

**Medidas de Protección:**
- ✅ Consentimiento explícito (términos de servicio)
- ✅ Derecho de acceso (GET /api/cartola/list)
- ✅ Derecho de eliminación (DELETE /api/cartola/{id})
- ✅ Retención limitada (TTL en DynamoDB)
- ✅ Encriptación en reposo y tránsito
- ✅ Logs de auditoría (CloudWatch)

---

## 🌐 APIs y Endpoints

### POST /cartola/extract

**Descripción:** Sube y procesa una cartola bancaria.

**Request:**
```http
POST /cartola/extract
Content-Type: multipart/form-data
Authorization: Bearer {cognito-jwt-token}

Body (form-data):
  - file: [binary PDF/JPEG/PNG]
  - bankName: "Banco de Chile" (opcional)
  - webhookUrl: "https://api.cliente.com/webhook" (opcional)
  - model: "gemini-2.5-flash" (opcional, default: flash)
```

**Response (202 Accepted):**
```json
{
  "id": "ext_abc123xyz",
  "status": "pending",
  "message": "Extracción en cola para procesamiento",
  "estimatedTime": 30000,
  "statusUrl": "/cartola/ext_abc123xyz"
}
```

**Errores:**
- 400: Archivo inválido
- 401: No autenticado
- 413: Archivo muy grande (>50MB)
- 500: Error interno

---

### GET /cartola/{id}

**Descripción:** Obtiene estado y resultado de una extracción.

**Request:**
```http
GET /cartola/ext_abc123xyz
Authorization: Bearer {cognito-jwt-token}
```

**Response (200 OK) - En Proceso:**
```json
{
  "id": "ext_abc123xyz",
  "status": "processing",
  "progress": 45,
  "message": "Extrayendo movimientos...",
  "createdAt": "2025-11-24T10:00:00Z",
  "estimatedCompletion": "2025-11-24T10:00:30Z"
}
```

**Response (200 OK) - Completado:**
```json
{
  "id": "ext_abc123xyz",
  "status": "completed",
  "extractionResult": {
    "document_id": "doc_a1b2c3d4",
    "bank_name": "Banco de Chile",
    "movements": [...],
    "balance_validation": {...},
    "quality": {...}
  },
  "createdAt": "2025-11-24T10:00:00Z",
  "completedAt": "2025-11-24T10:00:28Z",
  "processingTime": 28000
}
```

**Errores:**
- 401: No autenticado
- 403: Sin permiso (no es dueño)
- 404: Extracción no encontrada

---

### GET /cartola/list

**Descripción:** Lista extracciones del usuario.

**Request:**
```http
GET /cartola/list?limit=20&status=completed
Authorization: Bearer {cognito-jwt-token}
```

**Response (200 OK):**
```json
{
  "extractions": [
    {
      "id": "ext_abc123",
      "status": "completed",
      "fileName": "cartola_nov_2025.pdf",
      "bankName": "Banco de Chile",
      "createdAt": "2025-11-24T10:00:00Z",
      "completedAt": "2025-11-24T10:00:28Z"
    }
  ],
  "total": 15,
  "limit": 20,
  "nextToken": null
}
```

---

## 📦 Migración desde GCP

### Código a Migrar

**Archivos Críticos (de GCP a AWS):**

| Archivo GCP | Destino AWS | Cambios Necesarios |
|-------------|-------------|-------------------|
| `src/lib/nubox-cartola-extraction.ts` | `lambda/lib/extractor.js` | ✅ Convertir a CommonJS<br>✅ Cambiar Firestore → DynamoDB<br>✅ Cambiar Cloud Storage → S3 |
| `src/types/cartola.ts` | `lambda/types/index.js` | ✅ Exportar como JSDoc comments<br>✅ No usar TypeScript en Lambda |
| `src/pages/api/test-nubox-simple.ts` | `lambda/handlers/extract.js` | ✅ Adaptar a Lambda handler format<br>✅ API Gateway event parsing |

### Mapeo de Servicios

| Servicio GCP | Servicio AWS | Notas |
|--------------|--------------|-------|
| Cloud Run | AWS Lambda | ✅ Serverless equivalente |
| Cloud Storage | S3 | ✅ Almacenamiento de objetos |
| Firestore | DynamoDB | ✅ Base de datos NoSQL |
| Cloud Functions | Lambda Functions | ✅ Ejecución serverless |
| Cloud Logging | CloudWatch Logs | ✅ Logging centralizado |
| Cloud Monitoring | CloudWatch Metrics | ✅ Métricas y alarmas |

### Código GCP → AWS

**Firestore (GCP) → DynamoDB (AWS):**

```javascript
// ANTES (GCP Firestore)
const { firestore } = require('./firestore');

await firestore.collection('cartola_extractions').doc(id).set(data);
const doc = await firestore.collection('cartola_extractions').doc(id).get();
const snapshot = await firestore.collection('cartola_extractions')
  .where('userId', '==', userId)
  .orderBy('createdAt', 'desc')
  .limit(50)
  .get();

// DESPUÉS (AWS DynamoDB)
const AWS = require('aws-sdk');
const dynamoDB = new AWS.DynamoDB.DocumentClient();

await dynamoDB.put({
  TableName: 'cartola_extractions',
  Item: { id, ...data }
}).promise();

const result = await dynamoDB.get({
  TableName: 'cartola_extractions',
  Key: { id }
}).promise();

const queryResult = await dynamoDB.query({
  TableName: 'cartola_extractions',
  IndexName: 'userId-createdAt-index',
  KeyConditionExpression: 'userId = :userId',
  ExpressionAttributeValues: { ':userId': userId },
  ScanIndexForward: false,
  Limit: 50
}).promise();
```

**Cloud Storage (GCP) → S3 (AWS):**

```javascript
// ANTES (GCP Cloud Storage)
const { Storage } = require('@google-cloud/storage');
const storage = new Storage();

await storage.bucket('bucket-name').file(path).save(buffer);
const [data] = await storage.bucket('bucket-name').file(path).download();
await storage.bucket('bucket-name').file(path).delete();

// DESPUÉS (AWS S3)
const AWS = require('aws-sdk');
const s3 = new AWS.S3();

await s3.putObject({
  Bucket: 'bucket-name',
  Key: path,
  Body: buffer,
  ContentType: 'application/pdf'
}).promise();

const data = await s3.getObject({
  Bucket: 'bucket-name',
  Key: path
}).promise();

await s3.deleteObject({
  Bucket: 'bucket-name',
  Key: path
}).promise();
```

**Gemini AI (Sin Cambios):**

```javascript
// IGUAL en GCP y AWS (API externa)
const { GoogleGenAI } = require('@google/genai');

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const result = await genAI.models.generateContent({
  model: 'gemini-2.5-flash',
  contents: [...],
  config: {...}
});
```

---

## 🚀 Despliegue en AWS

### Pre-requisitos

**Herramientas:**
```bash
# 1. AWS CLI
aws --version
# aws-cli/2.x.x

# 2. Node.js 20+
node --version
# v20.x.x

# 3. Serverless Framework (opcional pero recomendado)
npm install -g serverless
serverless --version
# Framework Core: 3.38.0
```

**Credenciales AWS:**
```bash
# Configurar AWS CLI
aws configure
# AWS Access Key ID: YOUR_ACCESS_KEY
# AWS Secret Access Key: YOUR_SECRET_KEY
# Default region: us-east-1
# Default output format: json

# Verificar configuración
aws sts get-caller-identity
```

### Paso 1: Crear Infraestructura

**Crear S3 Bucket:**
```bash
# Crear bucket
aws s3 mb s3://nubox-cartola-uploads-prod --region us-east-1

# Configurar encriptación
aws s3api put-bucket-encryption \
  --bucket nubox-cartola-uploads-prod \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "AES256"
      }
    }]
  }'

# Configurar lifecycle (7 días)
aws s3api put-bucket-lifecycle-configuration \
  --bucket nubox-cartola-uploads-prod \
  --lifecycle-configuration file://s3-lifecycle.json

# Bloquear acceso público
aws s3api put-public-access-block \
  --bucket nubox-cartola-uploads-prod \
  --public-access-block-configuration \
    "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"
```

**s3-lifecycle.json:**
```json
{
  "Rules": [
    {
      "Id": "DeleteAfter7Days",
      "Status": "Enabled",
      "Prefix": "uploads/",
      "Expiration": {
        "Days": 7
      }
    }
  ]
}
```

**Crear DynamoDB Table:**
```bash
aws dynamodb create-table \
  --table-name cartola_extractions_prod \
  --attribute-definitions \
    AttributeName=id,AttributeType=S \
    AttributeName=userId,AttributeType=S \
    AttributeName=createdAt,AttributeType=N \
    AttributeName=status,AttributeType=S \
    AttributeName=organizationId,AttributeType=S \
  --key-schema \
    AttributeName=id,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --global-secondary-indexes file://dynamodb-indexes.json \
  --sse-specification Enabled=true \
  --point-in-time-recovery-specification PointInTimeRecoveryEnabled=true \
  --region us-east-1
```

**dynamodb-indexes.json:**
```json
[
  {
    "IndexName": "userId-createdAt-index",
    "KeySchema": [
      {"AttributeName": "userId", "KeyType": "HASH"},
      {"AttributeName": "createdAt", "KeyType": "RANGE"}
    ],
    "Projection": {"ProjectionType": "ALL"}
  },
  {
    "IndexName": "organizationId-createdAt-index",
    "KeySchema": [
      {"AttributeName": "organizationId", "KeyType": "HASH"},
      {"AttributeName": "createdAt", "KeyType": "RANGE"}
    ],
    "Projection": {"ProjectionType": "ALL"}
  },
  {
    "IndexName": "status-createdAt-index",
    "KeySchema": [
      {"AttributeName": "status", "KeyType": "HASH"},
      {"AttributeName": "createdAt", "KeyType": "RANGE"}
    ],
    "Projection": {"ProjectionType": "ALL"}
  }
]
```

### Paso 2: Preparar Código Lambda

**Estructura de Directorios:**
```
lambda/
├── handler.js                 # Main Lambda handler
├── handlers/
│   ├── get-status.js         # GET /cartola/{id}
│   └── list.js               # GET /cartola/list
├── lib/
│   ├── extractor.js          # Gemini AI extraction logic
│   ├── validators.js         # Data validation
│   ├── parsers.js            # Chilean format parsers
│   └── utils.js              # Utility functions
├── package.json              # Dependencies
├── serverless.yml            # Serverless config
├── .env.example              # Environment variables template
└── README.md                 # Documentation
```

**Instalar Dependencias:**
```bash
cd lambda
npm install @google/genai aws-sdk
npm install --save-dev serverless serverless-offline
```

### Paso 3: Configurar Variables de Entorno

**Crear archivo .env:**
```bash
# Gemini AI
GEMINI_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# AWS Resources
S3_BUCKET=nubox-cartola-uploads-prod
DYNAMODB_TABLE=cartola_extractions_prod
AWS_REGION=us-east-1

# Cognito (Authentication)
COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
COGNITO_CLIENT_ID=XXXXXXXXXXXXXXXXXXXXXXXXXX

# Optional
WEBHOOK_SECRET=your-webhook-secret-key
ENVIRONMENT=production
```

**Encriptar Variables en AWS:**
```bash
# Crear secreto en AWS Secrets Manager
aws secretsmanager create-secret \
  --name nubox-cartola/gemini-api-key \
  --secret-string $GEMINI_API_KEY \
  --region us-east-1

# Configurar Lambda para usar secreto
# (En serverless.yml o Lambda console)
```

### Paso 4: Desplegar Lambda

**Usando Serverless Framework (Recomendado):**
```bash
# 1. Configurar credenciales AWS
serverless config credentials \
  --provider aws \
  --key YOUR_ACCESS_KEY \
  --secret YOUR_SECRET_KEY

# 2. Desplegar a staging
serverless deploy --stage staging

# 3. Verificar funcionamiento
serverless invoke -f processCartola --data '{"body": "{\"test\": true}"}'

# 4. Desplegar a producción
serverless deploy --stage prod

# 5. Ver logs
serverless logs -f processCartola --tail
```

**Usando AWS CLI (Alternativa):**
```bash
# 1. Empaquetar código
zip -r function.zip handler.js handlers/ lib/ node_modules/ package.json

# 2. Crear función Lambda
aws lambda create-function \
  --function-name nubox-cartola-extract \
  --runtime nodejs20.x \
  --role arn:aws:iam::ACCOUNT_ID:role/lambda-execution-role \
  --handler handler.handler \
  --zip-file fileb://function.zip \
  --memory-size 2048 \
  --timeout 900 \
  --environment Variables="{GEMINI_API_KEY=$GEMINI_API_KEY,S3_BUCKET=nubox-cartola-uploads-prod}"

# 3. Actualizar función (deploys subsecuentes)
aws lambda update-function-code \
  --function-name nubox-cartola-extract \
  --zip-file fileb://function.zip
```

### Paso 5: Configurar API Gateway

**Crear REST API:**
```bash
# 1. Crear API
aws apigateway create-rest-api \
  --name nubox-cartola-api \
  --description "Bank statement extraction API"

# 2. Crear recursos y métodos (via console o CLI)
# 3. Integrar con Lambda functions
# 4. Configurar autenticación con Cognito
# 5. Desplegar a stage

# 6. Obtener URL
aws apigateway get-rest-apis
# Endpoint URL: https://xxxxx.execute-api.us-east-1.amazonaws.com/prod
```

### Paso 6: Configurar Monitoring

**CloudWatch Alarms:**
```bash
# Alarma de errores
aws cloudwatch put-metric-alarm \
  --alarm-name nubox-cartola-errors \
  --metric-name Errors \
  --namespace AWS/Lambda \
  --statistic Sum \
  --period 300 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 1 \
  --dimensions Name=FunctionName,Value=nubox-cartola-extract

# Alarma de duración
aws cloudwatch put-metric-alarm \
  --alarm-name nubox-cartola-duration \
  --metric-name Duration \
  --namespace AWS/Lambda \
  --statistic Average \
  --period 300 \
  --threshold 60000 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2
```

---

## 🧪 Testing y Validación

### Tests Locales

**Con Serverless Offline:**
```bash
# 1. Instalar plugin
npm install --save-dev serverless-offline

# 2. Ejecutar local
serverless offline start

# 3. Test endpoint
curl -X POST http://localhost:3000/cartola/extract \
  -H "Content-Type: multipart/form-data" \
  -F "file=@test-docs/Banco de Chile.pdf" \
  -F "bankName=Banco de Chile"
```

**Tests Unitarios:**
```javascript
// tests/extractor.test.js
const { extractBankStatement } = require('../lib/extractor');
const fs = require('fs');

describe('Bank Statement Extraction', () => {
  test('should extract Banco de Chile statement', async () => {
    const buffer = fs.readFileSync('./test-docs/Banco de Chile.pdf');
    
    const result = await extractBankStatement(buffer, 'test.pdf', {
      bankName: 'Banco de Chile'
    });
    
    expect(result.bank_name).toBe('Banco de Chile');
    expect(result.movements.length).toBeGreaterThan(0);
    expect(result.balance_validation.coincide).toBe(true);
    expect(result.quality.average_extraction_proximity_pct).toBeGreaterThan(90);
  });
  
  test('should handle invalid PDF gracefully', async () => {
    const invalidBuffer = Buffer.from('not a pdf');
    
    await expect(
      extractBankStatement(invalidBuffer, 'invalid.pdf', {})
    ).rejects.toThrow();
  });
});

// Ejecutar tests
npm test
```

### Tests de Integración

**Test completo del flujo:**
```bash
#!/bin/bash
# test-integration.sh

echo "🧪 Integration Test - Cartola Extraction"

# 1. Upload PDF
EXTRACTION_ID=$(curl -X POST https://api.nubox.com/cartola/extract \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -F "file=@test-docs/Banco de Chile.pdf" \
  -F "bankName=Banco de Chile" \
  | jq -r '.id')

echo "📤 Extraction ID: $EXTRACTION_ID"

# 2. Poll for completion (max 60 seconds)
for i in {1..60}; do
  STATUS=$(curl -s https://api.nubox.com/cartola/$EXTRACTION_ID \
    -H "Authorization: Bearer $JWT_TOKEN" \
    | jq -r '.status')
  
  echo "⏳ Status: $STATUS (attempt $i/60)"
  
  if [ "$STATUS" = "completed" ]; then
    echo "✅ Extraction completed!"
    break
  elif [ "$STATUS" = "failed" ]; then
    echo "❌ Extraction failed!"
    exit 1
  fi
  
  sleep 1
done

# 3. Get result
RESULT=$(curl -s https://api.nubox.com/cartola/$EXTRACTION_ID \
  -H "Authorization: Bearer $JWT_TOKEN")

# 4. Validate structure
MOVEMENTS=$(echo $RESULT | jq '.extractionResult.movements | length')
BALANCE_OK=$(echo $RESULT | jq '.extractionResult.balance_validation.coincide')

echo "📊 Movements extracted: $MOVEMENTS"
echo "✅ Balance validation: $BALANCE_OK"

if [ "$BALANCE_OK" = "true" ] && [ $MOVEMENTS -gt 0 ]; then
  echo "✅ Integration test PASSED"
  exit 0
else
  echo "❌ Integration test FAILED"
  exit 1
fi
```

---

## 💰 Costos Estimados

### AWS Lambda

**Pricing (us-east-1):**
- Requests: $0.20 por 1 millón de requests
- Duration: $0.0000166667 por GB-segundo

**Estimación por Extracción:**
```
Memoria: 2GB
Duración promedio: 30 segundos
Costo por extracción: 2GB × 30s × $0.0000166667 = $0.001

1,000 extracciones/mes = $1.00
10,000 extracciones/mes = $10.00
100,000 extracciones/mes = $100.00
```

### S3 Storage

**Pricing:**
- Storage: $0.023 per GB/month
- PUT requests: $0.005 per 1,000 requests
- GET requests: $0.0004 per 1,000 requests

**Estimación:**
```
Archivo promedio: 5MB
Retención: 7 días
1,000 archivos/mes = 5GB × (7/30) = 1.17GB/mes = $0.027

Requests:
  1,000 PUT = $0.005
  1,000 GET = $0.0004
  
Total S3: ~$0.03/mes por 1,000 archivos
```

### DynamoDB

**Pricing (On-Demand):**
- Write: $1.25 per million writes
- Read: $0.25 per million reads
- Storage: $0.25 per GB/month

**Estimación:**
```
1,000 extracciones/mes:
  - Writes: 3,000 (create, update, complete) = $0.00375
  - Reads: 2,000 (status checks, list) = $0.0005
  - Storage: ~5MB = $0.00125
  
Total DynamoDB: ~$0.005/mes por 1,000 extracciones
```

### Gemini AI

**Pricing (Gemini 2.5 Flash):**
- Input: $0.075 per 1M tokens
- Output: $0.30 per 1M tokens

**Estimación por Extracción:**
```
Input: ~50,000 tokens (PDF pages)
Output: ~5,000 tokens (JSON)

Costo = (50K × $0.075/1M) + (5K × $0.30/1M)
      = $0.00375 + $0.0015
      = $0.00525 por extracción

1,000 extracciones = $5.25
10,000 extracciones = $52.50
```

### Costo Total Estimado

**Por 1,000 Extracciones/Mes:**
```
Lambda:      $1.00
S3:          $0.03
DynamoDB:    $0.01
Gemini AI:   $5.25
───────────────────
TOTAL:       $6.29

Costo por extracción: $0.00629
```

**Por 10,000 Extracciones/Mes:**
```
Lambda:      $10.00
S3:          $0.30
DynamoDB:    $0.10
Gemini AI:   $52.50
───────────────────
TOTAL:       $62.90

Costo por extracción: $0.00629
```

**Escalabilidad de Costos:**
- ✅ Modelo serverless = pago por uso
- ✅ Sin costos fijos de infraestructura
- ✅ Auto-scaling sin costo adicional
- ✅ Gemini AI es el 80%+ del costo total

---

## 📚 Referencias de Migración

### Código Fuente GCP (Referencia)

**Archivos a revisar para migración:**

1. **Lógica de Extracción:**
   - `src/lib/nubox-cartola-extraction.ts` (593 líneas)
   - Contiene toda la lógica de parsing y validación
   - ✅ Migrar parseChileanAmount(), normalizeRUT(), buildExtractionPrompt()

2. **Tipos TypeScript:**
   - `NuboxMovement`, `NuboxCartola` interfaces
   - Convertir a JSDoc para JavaScript puro

3. **Documentación Completa:**
   - `NUBOX_COLUMNAS_ABONOS_CARGOS.md` - Interpretación de columnas
   - `FORMATO_NUBOX_VERIFICACION.md` - Validación de formato
   - `QUALITY_SUMMARY_FIELDS.md` - Métricas de calidad
   - `docs/NB-Cartola-Implementation-Plan.md` - Plan original

4. **Tests Reales:**
   - `scripts/test-real-cartola-simple.mjs` - Test con documento real
   - Resultados verificados: 10/10 movimientos correctos
   - Balance validation: ✅ PASS

### Base de Datos

**Firestore (GCP) → DynamoDB (AWS) Mapping:**

```javascript
// Collection: cartola_extractions (Firestore)
// → Table: cartola_extractions (DynamoDB)

{
  // Firestore document
  id: 'doc-id',                    // → Partition Key
  userId: 'user-123',              // → GSI: userId-createdAt-index
  organizationId: 'org-abc',       // → GSI: organizationId-createdAt-index
  status: 'completed',             // → GSI: status-createdAt-index
  createdAt: Timestamp,            // → Number (epoch ms)
  extractionResult: {...}          // → Map (JSON)
}
```

### Dependencias Node.js

**package.json para Lambda:**
```json
{
  "name": "nubox-cartola-lambda",
  "version": "1.0.0",
  "description": "AWS Lambda for Nubox bank statement extraction",
  "main": "handler.js",
  "scripts": {
    "test": "jest",
    "deploy": "serverless deploy --stage prod",
    "deploy:staging": "serverless deploy --stage staging",
    "invoke": "serverless invoke local -f processCartola --data '{}'",
    "logs": "serverless logs -f processCartola --tail"
  },
  "dependencies": {
    "@google/genai": "^1.23.0",
    "aws-sdk": "^2.1691.0"
  },
  "devDependencies": {
    "serverless": "^3.38.0",
    "serverless-offline": "^13.3.0",
    "jest": "^29.7.0"
  },
  "engines": {
    "node": ">=20.0.0"
  }
}
```

---

## 🔒 Seguridad AWS

### IAM Roles y Políticas

**Lambda Execution Role:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::nubox-cartola-uploads-prod/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:Query"
      ],
      "Resource": [
        "arn:aws:dynamodb:us-east-1:*:table/cartola_extractions_prod",
        "arn:aws:dynamodb:us-east-1:*:table/cartola_extractions_prod/index/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue"
      ],
      "Resource": "arn:aws:secretsmanager:us-east-1:*:secret:nubox-cartola/*"
    }
  ]
}
```

### Cognito User Pool

**Configuración de Autenticación:**
```bash
# Crear User Pool
aws cognito-idp create-user-pool \
  --pool-name nubox-cartola-users \
  --policies '{
    "PasswordPolicy": {
      "MinimumLength": 12,
      "RequireUppercase": true,
      "RequireLowercase": true,
      "RequireNumbers": true,
      "RequireSymbols": true
    }
  }' \
  --auto-verified-attributes email \
  --mfa-configuration OPTIONAL

# Crear App Client
aws cognito-idp create-user-pool-client \
  --user-pool-id us-east-1_XXXXXXXXX \
  --client-name nubox-cartola-api \
  --generate-secret \
  --explicit-auth-flows ALLOW_USER_PASSWORD_AUTH ALLOW_REFRESH_TOKEN_AUTH
```

---

## 📋 Checklist de Despliegue

### Pre-Despliegue

- [ ] **AWS Account Setup**
  - [ ] Cuenta AWS creada
  - [ ] IAM user con permisos necesarios
  - [ ] AWS CLI configurado
  - [ ] Región seleccionada (us-east-1 recomendado)

- [ ] **Código Preparado**
  - [ ] Código migrado de GCP a Lambda format
  - [ ] Dependencies instaladas (`npm install`)
  - [ ] Tests unitarios pasando
  - [ ] Variables de entorno documentadas

- [ ] **Infraestructura AWS**
  - [ ] S3 bucket creado y configurado
  - [ ] DynamoDB table creada con índices
  - [ ] Lambda execution role creado
  - [ ] Cognito User Pool configurado (si aplica)

- [ ] **Seguridad**
  - [ ] GEMINI_API_KEY en Secrets Manager
  - [ ] S3 encriptación habilitada
  - [ ] DynamoDB encriptación habilitada
  - [ ] Acceso público bloqueado en S3
  - [ ] Lifecycle policies configuradas

### Despliegue

- [ ] **Deploy Staging**
  - [ ] `serverless deploy --stage staging`
  - [ ] Verificar Lambda functions deployed
  - [ ] Verificar API Gateway endpoints
  - [ ] Test con archivo de prueba
  - [ ] Validar estructura JSON

- [ ] **Deploy Producción**
  - [ ] Backup de configuración actual
  - [ ] `serverless deploy --stage prod`
  - [ ] Verificar endpoints production
  - [ ] Configurar alarmas CloudWatch
  - [ ] Habilitar monitoring

### Post-Despliegue

- [ ] **Validación**
  - [ ] Test end-to-end con 7 bancos diferentes
  - [ ] Validar precisión >95%
  - [ ] Validar balance validation funciona
  - [ ] Verificar tiempos de respuesta <30s

- [ ] **Monitoring**
  - [ ] CloudWatch alarms configuradas
  - [ ] Dashboard creado
  - [ ] Logs estructurados verificados
  - [ ] Métricas de costos habilitadas

- [ ] **Documentación**
  - [ ] API documentation actualizada
  - [ ] Runbook de operaciones creado
  - [ ] Incident response plan documentado

---

## 🎯 Criterios de Éxito

### Funcionales

- ✅ **Precisión**: >95% en extracción de campos críticos
- ✅ **Bancos Soportados**: Mínimo 7 bancos chilenos
- ✅ **Balance Validation**: 100% de validaciones correctas
- ✅ **Formato**: JSON 100% compatible con Nubox

### Técnicos

- ✅ **Latencia**: <30 segundos para archivos <10MB
- ✅ **Throughput**: 100+ extracciones concurrentes
- ✅ **Disponibilidad**: 99.9% uptime
- ✅ **Escalabilidad**: Auto-scaling sin intervención

### Seguridad

- ✅ **Encriptación**: AES-256 en reposo, TLS 1.2+ en tránsito
- ✅ **Autenticación**: Cognito o API Keys
- ✅ **Aislamiento**: Datos por usuario/organización
- ✅ **Compliance**: Ley 19.628 Chile

### Costos

- ✅ **Por Extracción**: <$0.01 USD
- ✅ **Mensual (1,000 ext)**: <$10 USD
- ✅ **Serverless**: Sin costos fijos

---

## 🔗 Recursos Adicionales

### Documentación Técnica

- **GCP Implementation (Referencia):**
  - `src/lib/nubox-cartola-extraction.ts` - Código fuente validado
  - `NUBOX_COLUMNAS_ABONOS_CARGOS.md` - Reglas de parsing
  - `FORMATO_NUBOX_VERIFICACION.md` - Validación de formato

- **AWS Lambda:**
  - [AWS Lambda Node.js Runtime](https://docs.aws.amazon.com/lambda/latest/dg/lambda-nodejs.html)
  - [Serverless Framework Docs](https://www.serverless.com/framework/docs)
  - [API Gateway REST API](https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-rest-api.html)

- **Gemini AI:**
  - [Gemini API Documentation](https://ai.google.dev/docs)
  - [@google/genai SDK](https://www.npmjs.com/package/@google/genai)

### Soporte

**Contacto Técnico:**
- Email: dev@nubox.com
- Slack: #cartola-extraction
- GitHub: [Repo privado de migración]

---

**Última Actualización:** 2025-11-24  
**Versión:** 2.0.0  
**Estado:** ✅ Listo para AWS Lambda Migration  
**Backward Compatible:** ✅ Yes (código GCP preservado como referencia)  
**Stack:** Node.js 20.x + AWS Lambda + S3 + DynamoDB + Gemini AI

---

## 🚀 Quick Start

```bash
# 1. Clonar repositorio
git clone [repo-url]
cd nubox-cartola-lambda

# 2. Instalar dependencias
npm install

# 3. Configurar AWS credentials
aws configure

# 4. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus keys

# 5. Desplegar infraestructura
serverless deploy --stage staging

# 6. Test
curl -X POST https://YOUR_API_URL/cartola/extract \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@test.pdf"

# 7. Monitorear
serverless logs -f processCartola --tail
```

**¡Sistema listo para producción en AWS Lambda!** 🎉




