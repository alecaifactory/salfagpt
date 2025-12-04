# Guía de Implementación AWS Lambda
## Paso a Paso para Desarrolladores

**Versión:** 1.0  
**Fecha:** 24 de Noviembre, 2025  
**Audiencia:** Desarrolladores Node.js  
**Tiempo Estimado:** 10-15 horas (2-3 días)

---

## 🎯 Objetivo

Migrar el sistema de extracción de cartolas bancarias desde **Google Cloud Platform** a **AWS Lambda** manteniendo:
- ✅ 100% de funcionalidad
- ✅ Mismo formato JSON de salida
- ✅ Misma precisión (95%+)
- ✅ Compatibilidad con Nubox

---

## 📋 Pre-requisitos

### Herramientas Necesarias

```bash
# 1. Node.js 20+ (LTS)
node --version
# Debe mostrar: v20.x.x

# Si no tienes Node 20:
nvm install 20
nvm use 20

# 2. AWS CLI
aws --version
# Debe mostrar: aws-cli/2.x

# Si no tienes AWS CLI:
# macOS: brew install awscli
# Windows: https://aws.amazon.com/cli/
# Linux: sudo apt install awscli

# 3. Serverless Framework (opcional pero recomendado)
npm install -g serverless
serverless --version
# Debe mostrar: Framework Core: 3.x

# 4. Git
git --version
```

### Credenciales AWS

```bash
# Configurar AWS CLI con tus credenciales
aws configure

# Te pedirá:
AWS Access Key ID: [Tu access key]
AWS Secret Access Key: [Tu secret key]
Default region name: us-east-1
Default output format: json

# Verificar configuración
aws sts get-caller-identity
# Debe mostrar tu Account ID y User ARN
```

### Gemini AI API Key

```bash
# Obtener API key de Google AI Studio
# https://aistudio.google.com/app/apikey

# Guardar en variable de entorno (temporal)
export GEMINI_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXX

# Para persistir, agregar a ~/.zshrc o ~/.bashrc:
echo "export GEMINI_API_KEY=AIzaSyXXXXXX" >> ~/.zshrc
```

---

## 🚀 Implementación Paso a Paso

### Paso 1: Setup del Proyecto (30 min)

#### 1.1 Crear Estructura de Directorios

```bash
# Crear proyecto
mkdir nubox-cartola-lambda
cd nubox-cartola-lambda

# Crear estructura
mkdir -p lambda/{lib,handlers,tests}
mkdir -p test-docs
mkdir -p docs

# Estructura resultante:
# nubox-cartola-lambda/
# ├── lambda/
# │   ├── handler.js
# │   ├── lib/
# │   │   ├── extractor.js
# │   │   ├── parsers.js
# │   │   └── validators.js
# │   ├── handlers/
# │   │   ├── get-status.js
# │   │   └── list.js
# │   └── tests/
# │       ├── extractor.test.js
# │       └── integration.test.js
# ├── test-docs/           # PDFs de prueba
# ├── serverless.yml       # Config Serverless Framework
# ├── package.json
# └── .env
```

#### 1.2 Inicializar Proyecto Node.js

```bash
# Inicializar package.json
npm init -y

# Editar package.json
cat > package.json << 'EOF'
{
  "name": "nubox-cartola-lambda",
  "version": "1.0.0",
  "description": "AWS Lambda para extracción de cartolas bancarias con Gemini AI",
  "main": "lambda/handler.js",
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "deploy": "serverless deploy --stage prod",
    "deploy:staging": "serverless deploy --stage staging",
    "invoke": "serverless invoke local -f processCartola",
    "logs": "serverless logs -f processCartola --tail",
    "offline": "serverless offline start"
  },
  "keywords": ["nubox", "cartola", "extraction", "gemini-ai", "aws-lambda"],
  "author": "Nubox Development Team",
  "license": "PROPRIETARY",
  "dependencies": {
    "@google/genai": "^1.23.0",
    "aws-sdk": "^2.1691.0"
  },
  "devDependencies": {
    "serverless": "^3.38.0",
    "serverless-offline": "^13.3.0",
    "jest": "^29.7.0",
    "@types/node": "^20.10.0"
  },
  "engines": {
    "node": ">=20.0.0"
  }
}
EOF

# Instalar dependencias
npm install

# Verificar instalación
npm list --depth=0
```

#### 1.3 Crear Variables de Entorno

```bash
# Crear .env
cat > .env << 'EOF'
# Gemini AI
GEMINI_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXX

# AWS Resources
AWS_REGION=us-east-1
S3_BUCKET=nubox-cartola-uploads-staging
DYNAMODB_TABLE=cartola_extractions_staging

# Optional
ENVIRONMENT=staging
LOG_LEVEL=debug
EOF

# IMPORTANTE: Agregar .env al .gitignore
echo ".env" >> .gitignore
echo "node_modules/" >> .gitignore
echo ".serverless/" >> .gitignore
```

---

### Paso 2: Migrar Código de Extracción (2-3 horas)

#### 2.1 Copiar Lógica de GCP

**Obtener código fuente GCP:**
```bash
# Desde el proyecto GCP original (salfagpt/):
# Copiar src/lib/nubox-cartola-extraction.ts
# Lo vamos a convertir a JavaScript
```

#### 2.2 Crear lib/parsers.js

```javascript
// lambda/lib/parsers.js

/**
 * Parse Chilean currency format correctly
 * Chilean format: 14.994,50 (thousands: dot, decimal: comma)
 * 
 * @param {string|number} amountStr - Amount to parse
 * @returns {number} Parsed amount without separators
 * 
 * @example
 * parseChileanAmount('1.234.567,89') // 1234567.89
 * parseChileanAmount('-757.864') // -757864
 * parseChileanAmount(50000) // 50000
 */
function parseChileanAmount(amountStr) {
  if (typeof amountStr === 'number') return amountStr;
  
  // Remove spaces
  let cleaned = String(amountStr).trim();
  
  // Chilean format: 14.994,50 → 14994.50
  // 1. Replace dots (thousands separator) with nothing
  // 2. Replace comma (decimal separator) with dot
  cleaned = cleaned.replace(/\./g, '');      // Remove thousands separator
  cleaned = cleaned.replace(/,/g, '.');      // Convert decimal separator
  cleaned = cleaned.replace(/[^\d.-]/g, ''); // Remove currency symbols
  
  return parseFloat(cleaned) || 0;
}

/**
 * Normalize RUT format
 * Accepts various formats: 77.352.453-K, 77352453K, 77352453-k
 * Returns: { fullRUT: '77352453k', rut: '77352453', dv: 'k' }
 * 
 * @param {string} rutStr - RUT string to normalize
 * @returns {Object|null} Normalized RUT or null if invalid
 */
function normalizeRUT(rutStr) {
  if (!rutStr) return null;
  
  // Remove dots, hyphens, spaces: 77.352.453-K → 77352453K
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
 * Generate unique movement ID
 * Format: mov_[timestamp36][random8]
 * 
 * @returns {string} Unique movement ID
 */
function generateMovementId() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `mov_${timestamp}${random}`;
}

/**
 * Generate unique document ID
 * Format: doc_[timestamp]_[random]
 * 
 * @returns {string} Unique document ID
 */
function generateDocumentId() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `doc_${timestamp}_${random}`;
}

module.exports = {
  parseChileanAmount,
  normalizeRUT,
  generateMovementId,
  generateDocumentId
};
```

#### 2.3 Crear lib/extractor.js

```javascript
// lambda/lib/extractor.js

const { GoogleGenAI } = require('@google/genai');
const { parseChileanAmount, normalizeRUT, generateMovementId, generateDocumentId } = require('./parsers');

// Lazy initialization
let genAI = null;

function getGenAI() {
  if (genAI) return genAI;
  
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not configured');
  }
  
  genAI = new GoogleGenAI({ apiKey });
  return genAI;
}

/**
 * Build Gemini AI prompt for bank statement extraction
 * 
 * @param {string} bank - Bank name hint (optional)
 * @param {string} currency - Currency code (default: CLP)
 * @returns {string} Extraction prompt
 */
function buildExtractionPrompt(bank = 'auto', currency = 'CLP') {
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
   - Busca 3 columnas: ABONOS/CRÉDITOS (incoming), CARGOS/DÉBITOS (outgoing), SALDO/BALANCE
   - Si valor en ABONOS/CRÉDITOS: amount = POSITIVO (+)
   - Si valor en CARGOS/DÉBITOS: amount = NEGATIVO (-)
   - Sin separadores (ni puntos ni comas)
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
- Todos montos números sin separadores
- Todas fechas ISO 8601
- TODOS movimientos tienen insights
- TODOS movimientos tienen balance
- balance_validation presente y validando

Responde ÚNICAMENTE con el JSON (sin markdown, sin explicaciones).`;
}

/**
 * Extract Nubox-compatible data from bank statement PDF
 * 
 * @param {Buffer} buffer - PDF file buffer
 * @param {string} fileName - Original file name
 * @param {Object} options - Extraction options
 * @param {string} [options.bank='auto'] - Bank name hint
 * @param {string} [options.model='gemini-2.5-flash'] - Gemini model
 * @returns {Promise<Object>} Nubox cartola JSON
 */
async function extractBankStatement(buffer, fileName, options = {}) {
  const startTime = Date.now();
  const { bank = 'auto', model = 'gemini-2.5-flash' } = options;
  
  console.log('🏦 Starting extraction:', { fileName, bank, model });
  
  try {
    const genAIClient = getGenAI();
    
    // Convert Buffer to Blob
    const blob = new Blob([buffer], { type: 'application/pdf' });
    
    // Upload to Gemini Files API
    const uploadedFile = await genAIClient.files.upload({
      file: blob,
      config: {
        mimeType: 'application/pdf',
        displayName: fileName
      }
    });
    
    console.log('📤 File uploaded to Gemini:', uploadedFile.name);
    
    // Wait for file processing
    let fileStatus = await genAIClient.files.get({ name: uploadedFile.name });
    let attempts = 0;
    
    while (fileStatus.state !== 'ACTIVE' && attempts < 30) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      fileStatus = await genAIClient.files.get({ name: uploadedFile.name });
      attempts++;
      
      if (attempts % 5 === 0) {
        console.log(`⏳ Waiting for file processing... (${attempts}s)`);
      }
    }
    
    if (fileStatus.state !== 'ACTIVE') {
      throw new Error('File processing timeout (30s)');
    }
    
    console.log('✅ File ready for extraction');
    
    // Extract with Gemini AI
    const prompt = buildExtractionPrompt(bank, 'CLP');
    
    const result = await genAIClient.models.generateContent({
      model: model,
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
    
    // Parse JSON from response
    const responseText = result.text || '{}';
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error('No JSON found in Gemini response');
    }
    
    const parsed = JSON.parse(jsonMatch[0]);
    
    // Clean up Gemini file
    try {
      await genAIClient.files.delete({ name: uploadedFile.name });
      console.log('🗑️ Gemini file deleted');
    } catch (cleanupError) {
      console.warn('⚠️ Failed to delete Gemini file:', cleanupError.message);
    }
    
    // Normalize data
    const normalized = normalizeCartolaData(parsed);
    
    // Calculate extraction time and cost
    const extractionTime = Date.now() - startTime;
    const usageMetadata = result.usageMetadata || {};
    const cost = calculateCost(
      model,
      usageMetadata.promptTokenCount || 0,
      usageMetadata.candidatesTokenCount || 0
    );
    
    normalized.metadata.extraction_time = extractionTime;
    normalized.metadata.cost = cost;
    
    console.log('✅ Extraction completed:', {
      bank: normalized.bank_name,
      movements: normalized.movements.length,
      confidence: normalized.metadata.confidence,
      time: extractionTime,
      cost: cost.toFixed(6)
    });
    
    return normalized;
    
  } catch (error) {
    console.error('❌ Extraction failed:', error);
    throw new Error(`Extraction failed: ${error.message}`);
  }
}

/**
 * Normalize extracted data to Nubox format
 */
function normalizeCartolaData(parsed) {
  const bankName = parsed.bank_name || 'Unknown';
  
  // Normalize movements
  const movements = (parsed.movements || []).map(mov => {
    const normalizedAmount = parseChileanAmount(mov.amount);
    const normalizedBalance = parseChileanAmount(mov.balance);
    const normalizedCurrency = mov.currency?.toUpperCase() === 'CLP' ? 'CLP' : null;
    
    // Normalize RUT if present
    let senderAccount = undefined;
    if (mov.sender_account?.holder_id) {
      const rutInfo = normalizeRUT(mov.sender_account.holder_id);
      if (rutInfo) {
        senderAccount = {
          holder_id: rutInfo.fullRUT,
          dv: rutInfo.dv,
          holder_name: mov.sender_account.holder_name || undefined
        };
      }
    }
    
    return {
      id: mov.id || generateMovementId(),
      type: mov.type || 'other',
      amount: normalizedAmount,
      pending: mov.pending !== undefined ? mov.pending : false,
      currency: normalizedCurrency,
      post_date: mov.post_date || new Date().toISOString(),
      description: mov.description || '',
      balance: normalizedBalance,
      sender_account: senderAccount,
      insights: mov.insights || {
        errores: [],
        calidad: 'media',
        banco: bankName,
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
  
  const saldoInicial = parsed.opening_balance || 0;
  const saldoFinal = parsed.closing_balance || 0;
  const saldoCalculado = saldoInicial + totalAbonos - totalCargos;
  const diferencia = Math.abs(saldoCalculado - saldoFinal);
  const coincide = diferencia <= 1;
  
  // Calculate average extraction proximity
  const avgProximity = movements.length > 0
    ? Math.round(movements.reduce((sum, m) => sum + m.insights.extraction_proximity_pct, 0) / movements.length)
    : 0;
  
  return {
    document_id: parsed.document_id || generateDocumentId(),
    bank_name: bankName,
    account_number: parsed.account_number || '',
    account_holder: parsed.account_holder || '',
    account_holder_rut: parsed.account_holder_rut || '',
    period_start: parsed.period_start || '',
    period_end: parsed.period_end || '',
    statement_date: parsed.statement_date || new Date().toISOString(),
    opening_balance: saldoInicial,
    closing_balance: saldoFinal,
    total_credits: parsed.total_credits || 0,
    total_debits: parsed.total_debits || 0,
    movements: movements,
    balance_validation: {
      saldo_inicial: saldoInicial,
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
      extraction_time: 0,  // Will be updated
      confidence: parsed.metadata?.confidence || 0.95,
      model: 'gemini-2.5-flash',
      cost: 0  // Will be calculated
    },
    quality: {
      fields_complete: Boolean(parsed.bank_name && parsed.account_number && parsed.account_holder),
      movements_complete: movements.length > 0,
      balance_matches: coincide,
      confidence_score: parsed.metadata?.confidence || 0.95,
      recommendation: movements.length > 0 && coincide ? '✅ Lista para Nubox' : '⚠️ Revisar extracción',
      average_extraction_proximity_pct: avgProximity,
      extraction_bank: bankName
    }
  };
}

/**
 * Calculate Gemini AI cost
 */
function calculateCost(model, inputTokens, outputTokens) {
  const inputCost = model === 'gemini-2.5-pro'
    ? (inputTokens / 1_000_000) * 1.25
    : (inputTokens / 1_000_000) * 0.075;
  
  const outputCost = model === 'gemini-2.5-pro'
    ? (outputTokens / 1_000_000) * 5.00
    : (outputTokens / 1_000_000) * 0.30;
  
  return inputCost + outputCost;
}

module.exports = {
  extractBankStatement
};
```

#### 2.4 Crear lib/validators.js

```javascript
// lambda/lib/validators.js

/**
 * Validate extracted cartola data
 * 
 * @param {Object} data - Cartola data to validate
 * @throws {Error} If validation fails
 */
function validateCartolaData(data) {
  const errors = [];
  
  // Required top-level fields
  if (!data.document_id) errors.push('document_id is required');
  if (!data.bank_name) errors.push('bank_name is required');
  if (!data.account_number) errors.push('account_number is required');
  
  // Required arrays
  if (!Array.isArray(data.movements)) {
    errors.push('movements must be an array');
  } else {
    if (data.movements.length === 0) {
      errors.push('movements array cannot be empty');
    }
    
    // Validate each movement
    data.movements.forEach((mov, idx) => {
      if (!mov.id) errors.push(`Movement ${idx}: missing id`);
      if (!mov.type) errors.push(`Movement ${idx}: missing type`);
      if (typeof mov.amount !== 'number') errors.push(`Movement ${idx}: amount must be number`);
      if (!mov.post_date) errors.push(`Movement ${idx}: missing post_date`);
      if (!mov.description) errors.push(`Movement ${idx}: missing description`);
      if (typeof mov.balance !== 'number') errors.push(`Movement ${idx}: balance must be number`);
      if (!mov.insights) errors.push(`Movement ${idx}: missing insights`);
      
      // Validate insights
      if (mov.insights) {
        if (!Array.isArray(mov.insights.errores)) {
          errors.push(`Movement ${idx}: insights.errores must be array`);
        }
        if (!['alta', 'media', 'baja'].includes(mov.insights.calidad)) {
          errors.push(`Movement ${idx}: insights.calidad must be alta/media/baja`);
        }
        if (!mov.insights.banco) {
          errors.push(`Movement ${idx}: insights.banco is required`);
        }
        if (typeof mov.insights.extraction_proximity_pct !== 'number') {
          errors.push(`Movement ${idx}: insights.extraction_proximity_pct must be number`);
        }
      }
    });
  }
  
  // Validate balance_validation
  if (!data.balance_validation) {
    errors.push('balance_validation is required');
  } else {
    const bv = data.balance_validation;
    if (typeof bv.saldo_inicial !== 'number') errors.push('balance_validation.saldo_inicial must be number');
    if (typeof bv.total_abonos !== 'number') errors.push('balance_validation.total_abonos must be number');
    if (typeof bv.total_cargos !== 'number') errors.push('balance_validation.total_cargos must be number');
    if (typeof bv.coincide !== 'boolean') errors.push('balance_validation.coincide must be boolean');
  }
  
  // Validate metadata
  if (!data.metadata) {
    errors.push('metadata is required');
  }
  
  // Validate quality
  if (!data.quality) {
    errors.push('quality is required');
  }
  
  if (errors.length > 0) {
    throw new Error(`Validation failed:\n${errors.join('\n')}`);
  }
  
  console.log('✅ Cartola data validation passed');
}

module.exports = {
  validateCartolaData
};
```

---

### Paso 3: Crear Lambda Handler (1 hora)

#### 3.1 Handler Principal

```javascript
// lambda/handler.js

const AWS = require('aws-sdk');
const { extractBankStatement } = require('./lib/extractor');
const { validateCartolaData } = require('./lib/validators');

const s3 = new AWS.S3();
const dynamoDB = new AWS.DynamoDB.DocumentClient();

/**
 * Lambda handler para procesamiento de cartolas
 * 
 * Event structure (API Gateway):
 * {
 *   body: JSON string with { s3Key, userId, bankName, extractionId }
 *   headers: { Authorization: ... }
 *   requestContext: { authorizer: { claims: {...} } }
 * }
 */
exports.handler = async (event) => {
  console.log('🚀 Lambda invoked');
  
  const startTime = Date.now();
  let extractionId;
  
  try {
    // 1. Parse request body
    const body = JSON.parse(event.body || '{}');
    const { s3Key, userId, bankName, extractionId: reqExtId } = body;
    
    extractionId = reqExtId || `ext_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log('📋 Processing extraction:', {
      extractionId,
      userId,
      s3Key,
      bankName
    });
    
    // 2. Update status to processing in DynamoDB
    await dynamoDB.put({
      TableName: process.env.DYNAMODB_TABLE,
      Item: {
        id: extractionId,
        userId: userId,
        status: 'processing',
        fileName: s3Key.split('/').pop(),
        s3Key: s3Key,
        bankName: bankName || null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        ttl: Math.floor(Date.now() / 1000) + (90 * 24 * 60 * 60)  // 90 days TTL
      }
    }).promise();
    
    // 3. Download PDF from S3
    console.log('📥 Downloading from S3:', s3Key);
    
    const s3Result = await s3.getObject({
      Bucket: process.env.S3_BUCKET,
      Key: s3Key
    }).promise();
    
    const pdfBuffer = Buffer.from(s3Result.Body);
    
    console.log('✅ PDF downloaded:', {
      size: pdfBuffer.length,
      sizeKB: (pdfBuffer.length / 1024).toFixed(2)
    });
    
    // 4. Extract with Gemini AI
    const extractionResult = await extractBankStatement(pdfBuffer, s3Key.split('/').pop(), {
      bank: bankName,
      model: 'gemini-2.5-flash'
    });
    
    // 5. Validate result
    validateCartolaData(extractionResult);
    
    // 6. Update DynamoDB with result
    await dynamoDB.update({
      TableName: process.env.DYNAMODB_TABLE,
      Key: { id: extractionId },
      UpdateExpression: 'SET #status = :status, extractionResult = :result, completedAt = :now, updatedAt = :now, processingTime = :time',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':status': 'completed',
        ':result': extractionResult,
        ':now': Date.now(),
        ':time': Date.now() - startTime
      }
    }).promise();
    
    console.log('💾 Result saved to DynamoDB');
    
    // 7. Return success response
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'POST,GET,OPTIONS'
      },
      body: JSON.stringify({
        id: extractionId,
        status: 'completed',
        extractionResult: extractionResult,
        processingTime: Date.now() - startTime
      })
    };
    
  } catch (error) {
    console.error('❌ Lambda error:', {
      extractionId,
      error: error.message,
      stack: error.stack
    });
    
    // Update DynamoDB with error
    if (extractionId) {
      try {
        await dynamoDB.update({
          TableName: process.env.DYNAMODB_TABLE,
          Key: { id: extractionId },
          UpdateExpression: 'SET #status = :status, #error = :error, completedAt = :now, updatedAt = :now',
          ExpressionAttributeNames: {
            '#status': 'status',
            '#error': 'error'
          },
          ExpressionAttributeValues: {
            ':status': 'failed',
            ':error': {
              message: error.message,
              code: error.code || 'EXTRACTION_ERROR',
              timestamp: Date.now()
            },
            ':now': Date.now()
          }
        }).promise();
      } catch (dbError) {
        console.error('❌ Failed to update error in DynamoDB:', dbError);
      }
    }
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'Extraction failed',
        message: error.message,
        code: error.code || 'INTERNAL_ERROR',
        extractionId: extractionId
      })
    };
  }
};
```

#### 3.2 Handler para GET Status

```javascript
// lambda/handlers/get-status.js

const AWS = require('aws-sdk');
const dynamoDB = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
  console.log('🔍 Get status invoked:', event.pathParameters);
  
  try {
    // 1. Get extraction ID from path
    const { id } = event.pathParameters || {};
    
    if (!id) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Extraction ID is required',
          code: 'MISSING_ID'
        })
      };
    }
    
    // 2. Get user ID from authorizer (Cognito)
    const userId = event.requestContext?.authorizer?.claims?.sub;
    
    if (!userId) {
      return {
        statusCode: 401,
        body: JSON.stringify({
          error: 'Unauthorized',
          code: 'UNAUTHORIZED'
        })
      };
    }
    
    // 3. Get extraction from DynamoDB
    const result = await dynamoDB.get({
      TableName: process.env.DYNAMODB_TABLE,
      Key: { id }
    }).promise();
    
    if (!result.Item) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          error: 'Extraction not found',
          code: 'NOT_FOUND'
        })
      };
    }
    
    // 4. Verify ownership
    if (result.Item.userId !== userId) {
      return {
        statusCode: 403,
        body: JSON.stringify({
          error: 'Forbidden - Not your extraction',
          code: 'FORBIDDEN'
        })
      };
    }
    
    // 5. Return extraction
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(result.Item)
    };
    
  } catch (error) {
    console.error('❌ Error:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      })
    };
  }
};
```

---

### Paso 4: Configurar Serverless (1 hora)

#### 4.1 Crear serverless.yml

```yaml
# serverless.yml

service: nubox-cartola-extraction

provider:
  name: aws
  runtime: nodejs20.x
  region: ${opt:region, 'us-east-1'}
  stage: ${opt:stage, 'dev'}
  memorySize: 2048
  timeout: 900  # 15 minutes
  
  environment:
    GEMINI_API_KEY: ${env:GEMINI_API_KEY}
    S3_BUCKET: ${self:custom.s3Bucket}
    DYNAMODB_TABLE: ${self:custom.dynamoTable}
    AWS_NODEJS_CONNECTION_REUSE_ENABLED: 1
  
  iam:
    role:
      statements:
        # S3 Permissions
        - Effect: Allow
          Action:
            - s3:GetObject
            - s3:PutObject
            - s3:DeleteObject
          Resource: 
            - arn:aws:s3:::${self:custom.s3Bucket}/*
        
        # DynamoDB Permissions
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
        
        # CloudWatch Logs
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
  # Main extraction function
  processCartola:
    handler: lambda/handler.handler
    description: Process bank statement PDF with Gemini AI
    events:
      - http:
          path: cartola/extract
          method: post
          cors: true
    
  # Get extraction status
  getStatus:
    handler: lambda/handlers/get-status.handler
    description: Get extraction status by ID
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

resources:
  Resources:
    # S3 Bucket for PDF uploads
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
            - Id: DeleteUploadsAfter7Days
              Status: Enabled
              ExpirationInDays: 7
              Prefix: uploads/
        CorsConfiguration:
          CorsRules:
            - AllowedOrigins:
                - '*'
              AllowedMethods:
                - GET
                - PUT
                - POST
                - DELETE
              AllowedHeaders:
                - '*'
              MaxAge: 3000
    
    # DynamoDB Table for extraction metadata
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
        
        StreamSpecification:
          StreamViewType: NEW_AND_OLD_IMAGES

plugins:
  - serverless-offline

package:
  patterns:
    - '!node_modules/aws-sdk/**'  # Excluded (provided by Lambda)
    - 'lambda/**'
    - 'package.json'
```

---

### Paso 5: Testing Local (2 horas)

#### 5.1 Crear Test Unitario

```javascript
// lambda/tests/extractor.test.js

const { extractBankStatement } = require('../lib/extractor');
const fs = require('fs');
const path = require('path');

describe('Bank Statement Extraction', () => {
  // Aumentar timeout para llamadas a Gemini AI
  jest.setTimeout(120000);
  
  test('should extract Banco de Chile statement', async () => {
    const pdfPath = path.join(__dirname, '../../test-docs/Banco de Chile.pdf');
    const buffer = fs.readFileSync(pdfPath);
    
    const result = await extractBankStatement(buffer, 'Banco de Chile.pdf', {
      bank: 'Banco de Chile'
    });
    
    // Validate structure
    expect(result).toHaveProperty('document_id');
    expect(result).toHaveProperty('bank_name');
    expect(result).toHaveProperty('movements');
    expect(result).toHaveProperty('balance_validation');
    expect(result).toHaveProperty('quality');
    
    // Validate bank name
    expect(result.bank_name).toBe('Banco de Chile');
    
    // Validate movements
    expect(Array.isArray(result.movements)).toBe(true);
    expect(result.movements.length).toBeGreaterThan(0);
    
    // Validate each movement has required fields
    result.movements.forEach(mov => {
      expect(mov).toHaveProperty('id');
      expect(mov).toHaveProperty('type');
      expect(mov).toHaveProperty('amount');
      expect(typeof mov.amount).toBe('number');
      expect(mov).toHaveProperty('balance');
      expect(typeof mov.balance).toBe('number');
      expect(mov).toHaveProperty('insights');
      expect(mov.insights).toHaveProperty('extraction_proximity_pct');
    });
    
    // Validate balance validation
    expect(result.balance_validation).toHaveProperty('coincide');
    expect(result.balance_validation.coincide).toBe(true);
    
    // Validate quality
    expect(result.quality).toHaveProperty('average_extraction_proximity_pct');
    expect(result.quality.average_extraction_proximity_pct).toBeGreaterThan(90);
    
    console.log('✅ Test passed:', {
      movements: result.movements.length,
      balance: result.balance_validation.coincide ? 'OK' : 'FAIL',
      quality: result.quality.average_extraction_proximity_pct
    });
  });
  
  test('should handle missing Gemini API key', async () => {
    // Save original key
    const originalKey = process.env.GEMINI_API_KEY;
    
    // Remove key
    delete process.env.GEMINI_API_KEY;
    
    const buffer = Buffer.from('fake pdf');
    
    await expect(
      extractBankStatement(buffer, 'test.pdf', {})
    ).rejects.toThrow('GEMINI_API_KEY not configured');
    
    // Restore key
    process.env.GEMINI_API_KEY = originalKey;
  });
});

// Ejecutar: npm test
```

#### 5.2 Test de Integración Local

```javascript
// lambda/tests/integration.test.js

const handler = require('../handler').handler;
const fs = require('fs');
const path = require('path');
const AWS = require('aws-sdk');

// Mock AWS services para testing
jest.mock('aws-sdk');

describe('Lambda Handler Integration', () => {
  jest.setTimeout(120000);
  
  const mockS3 = {
    getObject: jest.fn(),
    putObject: jest.fn()
  };
  
  const mockDynamoDB = {
    put: jest.fn(),
    update: jest.fn(),
    get: jest.fn()
  };
  
  beforeEach(() => {
    AWS.S3.mockImplementation(() => mockS3);
    AWS.DynamoDB.DocumentClient.mockImplementation(() => mockDynamoDB);
    
    // Setup mocks to return promises
    mockS3.getObject.mockReturnValue({
      promise: () => Promise.resolve({
        Body: fs.readFileSync(path.join(__dirname, '../../test-docs/Banco de Chile.pdf'))
      })
    });
    
    mockS3.putObject.mockReturnValue({
      promise: () => Promise.resolve({})
    });
    
    mockDynamoDB.put.mockReturnValue({
      promise: () => Promise.resolve({})
    });
    
    mockDynamoDB.update.mockReturnValue({
      promise: () => Promise.resolve({})
    });
  });
  
  test('should process cartola end-to-end', async () => {
    const event = {
      body: JSON.stringify({
        s3Key: 'uploads/test/banco-chile.pdf',
        userId: 'user-test-123',
        bankName: 'Banco de Chile',
        extractionId: 'test-ext-001'
      }),
      requestContext: {
        authorizer: {
          claims: {
            sub: 'user-test-123'
          }
        }
      }
    };
    
    const result = await handler(event);
    
    expect(result.statusCode).toBe(200);
    
    const body = JSON.parse(result.body);
    expect(body).toHaveProperty('id');
    expect(body).toHaveProperty('status');
    expect(body.status).toBe('completed');
    expect(body).toHaveProperty('extractionResult');
    
    const extraction = body.extractionResult;
    expect(extraction.bank_name).toBe('Banco de Chile');
    expect(extraction.movements.length).toBeGreaterThan(0);
    expect(extraction.balance_validation.coincide).toBe(true);
  });
});

// Ejecutar: npm test
```

#### 5.3 Test Manual con Serverless Offline

```bash
# 1. Instalar serverless-offline
npm install --save-dev serverless-offline

# 2. Iniciar servidor local
serverless offline start

# Output:
# offline: Starting Offline at stage dev (us-east-1)
# offline: POST http://localhost:3000/cartola/extract
# offline: GET  http://localhost:3000/cartola/{id}

# 3. Test con curl (nueva terminal)
curl -X POST http://localhost:3000/cartola/extract \
  -H "Content-Type: application/json" \
  -d '{
    "s3Key": "uploads/test/banco-chile.pdf",
    "userId": "user-test-123",
    "bankName": "Banco de Chile"
  }'

# 4. Ver logs en terminal del servidor
# Debe mostrar progreso de extracción
```

---

### Paso 6: Deploy a Staging (1 hora)

#### 6.1 Preparar Deploy

```bash
# 1. Verificar que .env tiene todas las variables
cat .env

# 2. Exportar variables para Serverless
export GEMINI_API_KEY=$(grep GEMINI_API_KEY .env | cut -d '=' -f2)

# 3. Verificar conexión AWS
aws sts get-caller-identity

# 4. Build (si usa TypeScript - en nuestro caso no)
# npm run build

# 5. Run tests
npm test

# Debe mostrar:
# ✅ All tests passed
```

#### 6.2 Ejecutar Deploy

```bash
# Deploy a staging
serverless deploy --stage staging --region us-east-1 --verbose

# Output esperado (5-10 minutos primera vez):
# Packaging...
# Uploading CloudFormation...
# Uploading artifacts...
# Updating Stack...
# 
# ✅ Service deployed successfully
# 
# endpoints:
#   POST - https://xxxxx.execute-api.us-east-1.amazonaws.com/staging/cartola/extract
#   GET  - https://xxxxx.execute-api.us-east-1.amazonaws.com/staging/cartola/{id}
# 
# functions:
#   processCartola: nubox-cartola-extraction-staging-processCartola
#   getStatus: nubox-cartola-extraction-staging-getStatus
# 
# Stack Outputs:
#   ProcessCartolaLambdaFunctionQualifiedArn: arn:aws:lambda:...
#   ServiceEndpoint: https://xxxxx.execute-api.us-east-1.amazonaws.com/staging

# Guardar endpoint URL
export API_URL="https://xxxxx.execute-api.us-east-1.amazonaws.com/staging"
```

#### 6.3 Verificar Deploy

```bash
# 1. Listar funciones
aws lambda list-functions --query 'Functions[?contains(FunctionName, `nubox-cartola`)].FunctionName'

# 2. Verificar S3 bucket
aws s3 ls | grep nubox-cartola

# 3. Verificar DynamoDB table
aws dynamodb describe-table --table-name cartola_extractions_staging

# 4. Test básico
serverless invoke -f processCartola --data '{"body": "{\"test\": true}"}' --stage staging

# 5. Ver logs
serverless logs -f processCartola --tail --stage staging
```

---

### Paso 7: Test End-to-End en Staging (1 hora)

#### 7.1 Subir PDF de Prueba a S3

```bash
# 1. Subir archivo de prueba
aws s3 cp test-docs/Banco\ de\ Chile.pdf \
  s3://nubox-cartola-uploads-staging/uploads/test/banco-chile.pdf

# 2. Verificar subida
aws s3 ls s3://nubox-cartola-uploads-staging/uploads/test/
```

#### 7.2 Ejecutar Extracción

```bash
# 1. Invocar Lambda con archivo real
serverless invoke -f processCartola --stage staging --data '{
  "body": "{\"s3Key\": \"uploads/test/banco-chile.pdf\", \"userId\": \"user-test-123\", \"bankName\": \"Banco de Chile\", \"extractionId\": \"test-ext-001\"}"
}'

# Output esperado (después de ~30-60 segundos):
# {
#   "statusCode": 200,
#   "body": "{\"id\":\"test-ext-001\",\"status\":\"completed\",\"extractionResult\":{...}}"
# }

# 2. Parsear respuesta
serverless invoke -f processCartola --stage staging --data '{...}' | jq '.body | fromjson | .extractionResult | {
  bank: .bank_name,
  movements: .movements | length,
  balance_ok: .balance_validation.coincide,
  quality: .quality.average_extraction_proximity_pct
}'

# Output esperado:
# {
#   "bank": "Banco de Chile",
#   "movements": 10,
#   "balance_ok": true,
#   "quality": 95
# }
```

#### 7.3 Verificar en DynamoDB

```bash
# 1. Query por ID
aws dynamodb get-item \
  --table-name cartola_extractions_staging \
  --key '{"id": {"S": "test-ext-001"}}'

# 2. Query por usuario
aws dynamodb query \
  --table-name cartola_extractions_staging \
  --index-name userId-createdAt-index \
  --key-condition-expression "userId = :userId" \
  --expression-attribute-values '{":userId": {"S": "user-test-123"}}' \
  --scan-index-forward false \
  --limit 10
```

---

### Paso 8: Deploy a Producción (1 hora)

#### 8.1 Pre-Deploy Checklist

```bash
# Checklist de Pre-Despliegue
echo "📋 Pre-Deploy Checklist"
echo "======================="

# 1. Tests pasan?
npm test && echo "✅ Tests OK" || echo "❌ Tests FAILED"

# 2. Staging funciona?
echo "Verificar staging funcionó correctamente (check anterior)"

# 3. Variables de entorno production listas?
cat .env.production

# 4. Backup de versión anterior (si existe)?
# (Primera vez no aplica)

# 5. Aprobación?
echo "⚠️  PRODUCTION DEPLOY - Requiere aprobación"
read -p "¿Continuar con deploy a producción? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
  echo "❌ Deploy cancelado"
  exit 1
fi
```

#### 8.2 Ejecutar Deploy Producción

```bash
# 1. Cambiar a variables de producción
export GEMINI_API_KEY=$(grep GEMINI_API_KEY .env.production | cut -d '=' -f2)

# 2. Deploy a producción
serverless deploy --stage prod --region us-east-1

# 3. Guardar outputs
serverless info --stage prod > deployment-info-prod.txt

# 4. Verificar funciones creadas
aws lambda list-functions \
  --query 'Functions[?contains(FunctionName, `nubox-cartola-extraction-prod`)].FunctionName'
```

#### 8.3 Smoke Tests Producción

```bash
# 1. Test básico
serverless invoke -f processCartola --stage prod --data '{
  "body": "{\"s3Key\": \"uploads/test/banco-chile.pdf\", \"userId\": \"user-prod-001\", \"bankName\": \"Banco de Chile\"}"
}'

# 2. Verificar respuesta
# Debe retornar statusCode: 200 con extractionResult

# 3. Monitor logs
serverless logs -f processCartola --tail --stage prod

# 4. Ver métricas en CloudWatch
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Invocations \
  --dimensions Name=FunctionName,Value=nubox-cartola-extraction-prod-processCartola \
  --start-time $(date -u -d '5 minutes ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Sum
```

---

## 🔍 Troubleshooting

### Problema 1: Lambda Timeout

**Error:**
```
Task timed out after 900.00 seconds
```

**Diagnóstico:**
```bash
# Ver logs detallados
serverless logs -f processCartola --tail --stage staging

# Buscar dónde se atasca:
# - File upload to Gemini?
# - Gemini processing?
# - S3 download?
```

**Soluciones:**
```bash
# A. Aumentar timeout (máximo 15 min)
# En serverless.yml:
# timeout: 900

# B. Aumentar memoria (más CPU)
# En serverless.yml:
# memorySize: 3008

# C. Implementar chunked processing para archivos grandes
```

### Problema 2: Gemini API Key No Funciona

**Error:**
```
Error: GEMINI_API_KEY not configured
```

**Soluciones:**
```bash
# 1. Verificar variable está en .env
grep GEMINI_API_KEY .env

# 2. Exportar para serverless
export GEMINI_API_KEY=AIzaSyXXXXXXX

# 3. Verificar en Lambda console (AWS)
aws lambda get-function-configuration \
  --function-name nubox-cartola-extraction-staging-processCartola \
  --query 'Environment.Variables.GEMINI_API_KEY'

# 4. Update si falta
aws lambda update-function-configuration \
  --function-name nubox-cartola-extraction-staging-processCartola \
  --environment "Variables={GEMINI_API_KEY=$GEMINI_API_KEY,S3_BUCKET=nubox-cartola-uploads-staging,DYNAMODB_TABLE=cartola_extractions_staging}"
```

### Problema 3: S3 Access Denied

**Error:**
```
AccessDenied: Access Denied
```

**Solución:**
```bash
# 1. Verificar IAM role tiene permisos S3
aws iam get-role-policy \
  --role-name nubox-cartola-extraction-staging-us-east-1-lambdaRole \
  --policy-name nubox-cartola-extraction-staging-lambda

# 2. Si no existe, Serverless debió crearlo automáticamente
# Verificar en serverless.yml que iam.role.statements incluye S3

# 3. Redeploy para aplicar permisos
serverless deploy --stage staging
```

### Problema 4: DynamoDB Not Found

**Error:**
```
ResourceNotFoundException: Table not found
```

**Solución:**
```bash
# 1. Verificar tabla existe
aws dynamodb list-tables | grep cartola_extractions

# 2. Si no existe, crear manualmente
aws dynamodb create-table \
  --table-name cartola_extractions_staging \
  --attribute-definitions \
    AttributeName=id,AttributeType=S \
    AttributeName=userId,AttributeType=S \
    AttributeName=createdAt,AttributeType=N \
  --key-schema AttributeName=id,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1

# 3. O mejor: dejar que Serverless lo cree
# Verificar que serverless.yml tiene Resources.CartolaExtractionsTable
```

---

## 📊 Monitoreo Post-Deploy

### CloudWatch Dashboards

**Crear Dashboard:**
```bash
# 1. Via AWS Console
# CloudWatch → Dashboards → Create dashboard → "NuboxCartolaExtraction"

# 2. Agregar widgets:
#    - Lambda Invocations (suma)
#    - Lambda Errors (suma)
#    - Lambda Duration (promedio, p95, p99)
#    - DynamoDB Consumed Capacity
#    - S3 Requests

# 3. O crear programáticamente (ver CONCILIACION_EJECUTIVA_AWS_LAMBDA.md)
```

### Alarmas Críticas

```bash
# Alarma de errores (>5 en 5 minutos)
aws cloudwatch put-metric-alarm \
  --alarm-name nubox-cartola-prod-errors \
  --metric-name Errors \
  --namespace AWS/Lambda \
  --statistic Sum \
  --period 300 \
  --threshold 5 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 1 \
  --dimensions Name=FunctionName,Value=nubox-cartola-extraction-prod-processCartola \
  --alarm-actions arn:aws:sns:us-east-1:ACCOUNT_ID:ops-alerts

# Alarma de duración (>60s promedio)
aws cloudwatch put-metric-alarm \
  --alarm-name nubox-cartola-prod-slow \
  --metric-name Duration \
  --namespace AWS/Lambda \
  --statistic Average \
  --period 300 \
  --threshold 60000 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2
```

### Logs Estructurados

**Query en CloudWatch Logs Insights:**
```sql
-- Ver todas las extracciones completadas (últimas 24h)
fields @timestamp, extractionId, bank, movements, processingTime
| filter @message like /✅ Extraction completed/
| parse @message /bank: (?<bank>[^,]+), movements: (?<movements>\d+).*time: (?<time>\d+)/
| sort @timestamp desc
| limit 100

-- Ver errores (últimas 24h)
fields @timestamp, @message, extractionId, error
| filter @message like /❌/
| sort @timestamp desc
| limit 50

-- Estadísticas de rendimiento
fields processingTime
| filter @message like /processingTime/
| stats avg(processingTime), max(processingTime), min(processingTime), count() by bin(1h)
```

---

## 🎓 Best Practices

### 1. Logging

```javascript
// ✅ CORRECTO: Logs estructurados
console.log(JSON.stringify({
  timestamp: new Date().toISOString(),
  level: 'INFO',
  service: 'cartola-extraction',
  action: 'extraction_started',
  extractionId: 'ext-123',
  metadata: {
    userId: 'user-456',
    fileName: 'cartola.pdf',
    fileSize: 1234567
  }
}));

// ❌ INCORRECTO: Logs no estructurados
console.log('Starting extraction for user-456');
```

### 2. Error Handling

```javascript
// ✅ CORRECTO: Try-catch con contexto
async function processExtraction(extractionId) {
  try {
    const result = await extractBankStatement(...);
    return result;
  } catch (error) {
    // Log error con contexto
    console.error(JSON.stringify({
      level: 'ERROR',
      action: 'extraction_failed',
      extractionId: extractionId,
      error: {
        message: error.message,
        stack: error.stack,
        code: error.code
      }
    }));
    
    // Re-throw con mensaje claro
    throw new Error(`Extraction ${extractionId} failed: ${error.message}`);
  }
}
```

### 3. Recursos AWS

```javascript
// ✅ CORRECTO: Reusar conexiones
const AWS = require('aws-sdk');

// Crear clientes una vez (fuera del handler)
const s3 = new AWS.S3();
const dynamoDB = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
  // Reusar s3 y dynamoDB
  await s3.getObject(...).promise();
  await dynamoDB.put(...).promise();
};

// ❌ INCORRECTO: Crear cliente en cada invocación
exports.handler = async (event) => {
  const s3 = new AWS.S3();  // Lento!
  const dynamoDB = new AWS.DynamoDB.DocumentClient();  // Lento!
};
```

### 4. Manejo de Memoria

```javascript
// ✅ CORRECTO: Liberar memoria grande
async function processLargePDF(buffer) {
  const result = await extractBankStatement(buffer, ...);
  
  // Liberar buffer grande
  buffer = null;
  
  // Forzar garbage collection (opcional)
  if (global.gc) {
    global.gc();
  }
  
  return result;
}
```

---

## 📈 Optimizaciones

### Reducir Cold Starts

```yaml
# serverless.yml

functions:
  processCartola:
    handler: lambda/handler.handler
    # Provisioned concurrency (costo adicional pero zero cold starts)
    provisionedConcurrency: 2  # 2 instancias siempre warm
    
    # O usar warming plugin
    # warmup:
    #   default:
    #     enabled: true
    #     events:
    #       - schedule: rate(5 minutes)

plugins:
  - serverless-plugin-warmup  # npm install --save-dev serverless-plugin-warmup
```

### Optimizar Bundle Size

```javascript
// webpack.config.js (si usas webpack)
module.exports = {
  target: 'node',
  mode: 'production',
  entry: './lambda/handler.js',
  output: {
    filename: 'handler.js',
    libraryTarget: 'commonjs2'
  },
  externals: {
    'aws-sdk': 'aws-sdk'  // Excluir (ya está en Lambda)
  },
  optimization: {
    minimize: true
  }
};

// En serverless.yml:
# package:
#   individually: true
#   patterns:
#     - '!node_modules/aws-sdk/**'
```

### Paralelizar Chunks (Archivos Grandes)

```javascript
// Para archivos >20MB, dividir y procesar en paralelo
async function extractLargeFile(buffer, fileName, options) {
  const chunkSize = 12 * 1024 * 1024;  // 12MB
  
  if (buffer.length <= chunkSize) {
    return extractBankStatement(buffer, fileName, options);
  }
  
  // Dividir en chunks
  const chunks = [];
  for (let i = 0; i < buffer.length; i += chunkSize) {
    chunks.push(buffer.slice(i, i + chunkSize));
  }
  
  // Procesar en paralelo (invocar Lambda por cada chunk)
  const results = await Promise.all(
    chunks.map((chunk, idx) => 
      extractBankStatement(chunk, `${fileName}-chunk-${idx}`, options)
    )
  );
  
  // Combinar resultados
  return combineChunkResults(results);
}
```

---

## 🔄 Rollback Plan

### Si Deploy Falla

```bash
# 1. Ver versiones anteriores
serverless deploy list --stage prod

# 2. Rollback a versión anterior
serverless rollback --timestamp YYYYMMDDHHMMSS --stage prod

# 3. Verificar rollback exitoso
serverless info --stage prod
```

### Si Función Tiene Bugs en Producción

```bash
# 1. Redireccionar tráfico a versión anterior (si usas aliases)
aws lambda update-alias \
  --function-name nubox-cartola-extraction-prod-processCartola \
  --name PROD \
  --function-version 1  # Versión anterior

# 2. Fix bugs localmente

# 3. Deploy fix
serverless deploy --stage prod

# 4. Redireccionar tráfico a nueva versión
aws lambda update-alias \
  --function-name nubox-cartola-extraction-prod-processCartola \
  --name PROD \
  --function-version 2  # Nueva versión
```

---

## 📚 Recursos Adicionales

### Documentación

- **AWS Lambda Node.js**: https://docs.aws.amazon.com/lambda/latest/dg/lambda-nodejs.html
- **Serverless Framework**: https://www.serverless.com/framework/docs
- **DynamoDB Node.js**: https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/dynamodb-examples.html
- **Gemini AI SDK**: https://www.npmjs.com/package/@google/genai

### Comandos Útiles

```bash
# Ver todas las funciones Lambda
aws lambda list-functions

# Ver logs de una función
serverless logs -f processCartola --tail --stage prod

# Invocar función localmente
serverless invoke local -f processCartola --data '{}'

# Ver información del servicio
serverless info --stage prod

# Eliminar stack completo (⚠️ CUIDADO)
serverless remove --stage staging

# Ver costos
aws ce get-cost-and-usage \
  --time-period Start=2025-11-01,End=2025-11-30 \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --filter file://cost-filter.json
```

---

## ✅ Checklist Final

### Antes de Considerar "Completo"

- [ ] **Código**
  - [ ] ✅ Migrado de TypeScript → JavaScript
  - [ ] ✅ Gemini AI integration funciona
  - [ ] ✅ Parsers Chilean format funcionan
  - [ ] ✅ Validators completos

- [ ] **Tests**
  - [ ] ✅ Tests unitarios pasan (npm test)
  - [ ] ✅ Test integración local funciona
  - [ ] ✅ Test con 7 bancos diferentes
  - [ ] ✅ Validación de balance 100% correcta

- [ ] **Infraestructura**
  - [ ] ✅ S3 bucket creado y configurado
  - [ ] ✅ DynamoDB table creada con índices
  - [ ] ✅ Lambda functions deployed
  - [ ] ✅ API Gateway configurado

- [ ] **Seguridad**
  - [ ] ✅ Gemini API key en Secrets Manager
  - [ ] ✅ S3 encriptación habilitada
  - [ ] ✅ DynamoDB encriptación habilitada
  - [ ] ✅ IAM roles con least privilege
  - [ ] ✅ Lifecycle policies configuradas

- [ ] **Monitoreo**
  - [ ] ✅ CloudWatch alarmas configuradas
  - [ ] ✅ Dashboard creado
  - [ ] ✅ Logs estructurados verificados

- [ ] **Documentación**
  - [ ] ✅ README.md actualizado
  - [ ] ✅ API documentation completa
  - [ ] ✅ Runbook de operaciones
  - [ ] ✅ Incident response plan

---

## 🎯 Próximos Pasos

### Inmediato (Esta Semana)

1. ✅ Crear proyecto Lambda (`mkdir nubox-cartola-lambda`)
2. ✅ Migrar código de parsers y extractors
3. ✅ Setup infrastructure AWS (S3, DynamoDB)
4. ✅ Deploy a staging
5. ✅ Test end-to-end

### Corto Plazo (Semanas 2-3)

1. ✅ Deploy a producción
2. ✅ Configurar monitoring
3. ✅ Crear documentación usuario
4. ✅ Training del equipo

### Mediano Plazo (Mes 2+)

1. ⏳ Optimizar performance (provisioned concurrency)
2. ⏳ Agregar más bancos
3. ⏳ Integración con Nubox Contabilidad
4. ⏳ Analytics dashboard

---

**¡Listo para implementar!** 🚀

**Tiempo estimado total:** 10-15 horas  
**Complejidad:** Media (código ya validado)  
**Riesgo:** Bajo (infraestructura managed)

**Contacto:** dev-team@nubox.com  
**Documentos de Referencia:**
- AWS_LAMBDA_CARTOLA_PRD.md (PRD completo)
- CONCILIACION_EJECUTIVA_AWS_LAMBDA.md (Executive summary)




