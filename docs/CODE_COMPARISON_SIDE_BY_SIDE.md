# Side-by-Side Code Comparison

## 🔴 Critical Issue #1: Amount Parsing

### Current Implementation (BROKEN)

```typescript
// ❌ WRONG - Removes ALL dots and commas
let normalizedAmount = typeof mov.amount === 'string' 
  ? parseFloat(mov.amount.replace(/[.,]/g, '')) 
  : mov.amount;
```

**Test Results:**
```
Input: "14.994"      → Output: 14994      ✅ OK (integer)
Input: "14.994,50"   → Output: 1499450    ❌ WRONG (should be 14994.50)
Input: "1.234.567"   → Output: 1234567    ✅ OK (integer)
Input: "1.234.567,89"→ Output: 123456789  ❌ WRONG (should be 1234567.89)
```

### Improved Implementation (FIXED)

```typescript
// ✅ CORRECT - Handles Chilean format properly
function parseChileanAmount(amountStr: string | number): number {
  if (typeof amountStr === 'number') return amountStr;
  
  let cleaned = amountStr.trim();
  cleaned = cleaned.replace(/\./g, '');      // Remove thousands separator (dot)
  cleaned = cleaned.replace(/,/g, '.');      // Convert decimal separator (comma → dot)
  cleaned = cleaned.replace(/[^\d.-]/g, ''); // Remove currency symbols ($, CLP, etc)
  
  return parseFloat(cleaned) || 0;
}

// Usage
const normalizedAmount = parseChileanAmount(mov.amount);
```

**Test Results:**
```
Input: "14.994"      → Output: 14994      ✅ OK
Input: "14.994,50"   → Output: 14994.50   ✅ FIXED!
Input: "1.234.567"   → Output: 1234567    ✅ OK
Input: "1.234.567,89"→ Output: 1234567.89 ✅ FIXED!
Input: "$14.994,50"  → Output: 14994.50   ✅ OK (removes $)
Input: "-1.500"      → Output: -1500      ✅ OK (negatives)
```

---

## 🔴 Critical Issue #2: holder_id Format

### Current Implementation

```typescript
// Extract RUT and DV from holder_id if present
let holderId = mov.sender_account?.holder_id || '';
let dv = mov.sender_account?.dv || '';

// If holder_id contains RUT with DV, extract them
if (holderId && !dv) {
  const rutMatch = holderId.match(/^(\d+)([kK\d])$/);
  if (rutMatch) {
    holderId = rutMatch[1];  // ❌ REMOVES DV: "77352453"
    dv = rutMatch[2].toLowerCase();  // Stores: "k"
  }
}

// Result structure:
sender_account: {
  holder_id: "77352453",  // ❌ WITHOUT DV
  dv: "k",
  holder_name: "..."
}
```

**Output:**
```json
"sender_account": {
  "holder_id": "77352453",
  "dv": "k"
}
```

### User's Example

```json
"sender_account": {
  "holder_id": "77352453k",  // ✅ WITH DV
  "dv": "k"
}
```

### Improved Implementation (Matches User Spec)

```typescript
// Normalize RUT - keeps DV in holder_id
function normalizeRUT(rutStr: string): { fullRUT: string; rut: string; dv: string } | null {
  if (!rutStr) return null;
  
  // Remove dots and hyphens: 77.352.453-K → 77352453K
  const cleaned = rutStr.replace(/[.\-\s]/g, '').toLowerCase();
  
  // Extract RUT and DV: 77352453k → rut=77352453, dv=k
  const match = cleaned.match(/^(\d+)([0-9k])$/);
  if (!match) return null;
  
  return {
    fullRUT: cleaned,         // "77352453k" ✅ WITH DV
    rut: match[1],            // "77352453" (for reference)
    dv: match[2],             // "k"
  };
}

// Usage
const rutInfo = normalizeRUT(mov.sender_account?.holder_id);
if (rutInfo) {
  senderAccount = {
    holder_id: rutInfo.fullRUT,  // ✅ "77352453k" - matches user spec
    dv: rutInfo.dv,              // "k" - also available separately
    holder_name: mov.sender_account?.holder_name || undefined,
  };
}
```

**Output:**
```json
"sender_account": {
  "holder_id": "77352453k",  // ✅ WITH DV - matches user example
  "dv": "k"
}
```

**Handles Various Input Formats:**
```
Input: "77.352.453-K"   → Output: { fullRUT: "77352453k", dv: "k" } ✅
Input: "77352453k"      → Output: { fullRUT: "77352453k", dv: "k" } ✅
Input: "77.352.453-9"   → Output: { fullRUT: "773524539", dv: "9" } ✅
Input: "77352453K"      → Output: { fullRUT: "77352453k", dv: "k" } ✅ (lowercase)
```

---

## 🔴 Critical Issue #3: Currency Type

### Current Implementation

```typescript
// Type definition
export interface NuboxMovement {
  // ...
  currency: 'CLP' | 'USD' | 'EUR' | '0';  // ❌ "0" as STRING
  // ...
}

// Normalization logic
let normalizedCurrency: 'CLP' | 'USD' | 'EUR' | '0' = 'CLP';
if (mov.currency && mov.currency.toUpperCase() === 'CLP') {
  normalizedCurrency = 'CLP';
} else if (mov.currency && ['USD', 'EUR'].includes(mov.currency.toUpperCase())) {
  normalizedCurrency = mov.currency.toUpperCase() as 'USD' | 'EUR';
} else {
  normalizedCurrency = '0';  // ❌ STRING "0"
}
```

**Output:**
```json
{
  "currency": "0"  // ❌ String zero is semantically wrong
}
```

**Problems:**
- `"0"` as string doesn't make sense semantically
- Could cause type errors: `if (currency === 0)` vs `if (currency === "0")`
- Not standard in financial APIs

### Improved Implementation

```typescript
// Type definition
export interface NuboxMovement {
  // ...
  currency: 'CLP' | null;  // ✅ null is standard
  // ...
}

// Normalization logic
const normalizedCurrency: 'CLP' | null = 
  (mov.currency?.toUpperCase() === 'CLP') ? 'CLP' : null;
```

**Output:**
```json
{
  "currency": "CLP"  // ✅ When Chilean peso
}

{
  "currency": null   // ✅ When not CLP (standard approach)
}
```

**Why `null` is Better:**
- Standard approach in APIs
- Type-safe: `if (currency === null)` works intuitively
- Clear semantic meaning: "no valid currency" vs confusing "0"
- Easier to consume in any programming language

---

## ⚠️ Minor Issue #4: Movement Types

### Current Implementation

```typescript
export type MovementType = 
  | 'transfer'        // Transferencia
  | 'deposit'         // Depósito
  | 'withdrawal'      // Retiro
  | 'payment'         // Pago
  | 'fee'             // Comisión
  | 'interest'        // Interés ← Extra
  | 'tax'             // Impuesto ← Extra
  | 'other';          // Otro
```

**Total:** 8 types

**User Said:** "5 tipos u otros" (5 types or other)

### Improved Implementation

```typescript
export type MovementType = 
  | 'transfer'        // Transferencia
  | 'deposit'         // Depósito
  | 'withdrawal'      // Retiro
  | 'payment'         // Pago
  | 'fee'             // Comisión
  | 'other';          // Otro (includes interest, tax, etc.)
```

**Total:** 6 types (5 main + other)

**Rationale:**
- Matches user specification more closely
- Simpler for most banking use cases
- `interest` and `tax` can be mapped to `other` or `fee`

---

## ⚠️ Minor Issue #5: Insights Key Naming

### Current Implementation

```typescript
export interface NuboxMovement {
  // ...
  insights: {
    errores: string[];
    calidad: string;
    banco: string;
    'cercania % de extraccion': number;  // ❌ Space + special char
  };
}
```

**Usage:**
```typescript
// Requires bracket notation
const proximity = movement.insights['cercania % de extraccion'];

// Can't use dot notation
// movement.insights.cercania % de extraccion  ← SYNTAX ERROR
```

**JSON Output:**
```json
{
  "insights": {
    "cercania % de extraccion": 95  // ❌ Awkward for APIs
  }
}
```

### Improved Implementation

```typescript
export interface MovementInsights {
  errores: string[];
  calidad: 'alta' | 'media' | 'baja';  // ✅ Typed strictly
  banco: string;
  extraction_proximity_pct: number;     // ✅ Clean naming
}

export interface NuboxMovement {
  // ...
  insights: MovementInsights;
}
```

**Usage:**
```typescript
// Clean dot notation
const proximity = movement.insights.extraction_proximity_pct;  // ✅

// Or bracket notation still works
const proximity = movement.insights['extraction_proximity_pct'];  // ✅
```

**JSON Output:**
```json
{
  "insights": {
    "errores": [],
    "calidad": "alta",
    "banco": "Banco de Chile",
    "extraction_proximity_pct": 95  // ✅ Clean and standard
  }
}
```

**Benefits:**
- Works in all programming languages
- No special characters to escape
- Standard snake_case convention for APIs
- Easier to document and use

**Alternative (CamelCase):**
```typescript
extractionProximityPct: number;  // Also good
```

---

## 📊 Complete Example Comparison

### Current Implementation Output

```json
{
  "id": "mov_abc123",
  "type": "transfer",
  "amount": 1499450,              // ❌ WRONG (14.994,50 parsed incorrectly)
  "pending": false,
  "currency": "0",                // ❌ String "0" is weird
  "post_date": "2024-04-24T00:00:00Z",
  "description": "77.352.453-K Transf. FERRETERI",
  "sender_account": {
    "holder_id": "77352453",      // ❌ Missing DV
    "dv": "k",
    "holder_name": null
  },
  "insights": {
    "errores": [],
    "calidad": "alta",
    "banco": "Banco de Chile",
    "cercania % de extraccion": 95  // ❌ Special chars in key
  }
}
```

### Improved Implementation Output

```json
{
  "id": "mov_abc123",
  "type": "transfer",
  "amount": 14994.50,             // ✅ CORRECT
  "pending": false,
  "currency": "CLP",              // ✅ Or null if not CLP
  "post_date": "2024-04-24T00:00:00Z",
  "description": "77.352.453-K Transf. FERRETERI",
  "sender_account": {
    "holder_id": "77352453k",     // ✅ Includes DV (matches user spec)
    "dv": "k",
    "holder_name": null
  },
  "insights": {
    "errores": [],
    "calidad": "alta",
    "banco": "Banco de Chile",
    "extraction_proximity_pct": 95  // ✅ Clean naming
  }
}
```

---

## 🎯 Migration Checklist

To apply the improved implementation:

- [ ] Replace `normalizedAmount` logic with `parseChileanAmount()` function
- [ ] Update `holder_id` to include DV (use `normalizeRUT().fullRUT`)
- [ ] Change `currency` type from `'0'` to `null`
- [ ] Reduce `MovementType` to 6 types (optional)
- [ ] Rename `'cercania % de extraccion'` to `extraction_proximity_pct` (optional)
- [ ] Add insights field validation (optional)
- [ ] Update TypeScript interfaces
- [ ] Update prompt to match new structure
- [ ] Add unit tests for amount parsing
- [ ] Add unit tests for RUT normalization
- [ ] Test with real bank statement PDFs
- [ ] Update API documentation

---

## 🧪 Recommended Tests

```typescript
// Amount parsing tests
describe('parseChileanAmount', () => {
  test('integers without decimals', () => {
    expect(parseChileanAmount('14.994')).toBe(14994);
    expect(parseChileanAmount('1.234.567')).toBe(1234567);
  });
  
  test('decimals with comma separator', () => {
    expect(parseChileanAmount('14.994,50')).toBe(14994.50);
    expect(parseChileanAmount('1.234.567,89')).toBe(1234567.89);
  });
  
  test('negative amounts', () => {
    expect(parseChileanAmount('-14.994')).toBe(-14994);
    expect(parseChileanAmount('-14.994,50')).toBe(-14994.50);
  });
  
  test('with currency symbols', () => {
    expect(parseChileanAmount('$14.994,50')).toBe(14994.50);
    expect(parseChileanAmount('CLP 14.994')).toBe(14994);
  });
  
  test('already numeric', () => {
    expect(parseChileanAmount(14994)).toBe(14994);
    expect(parseChileanAmount(14994.50)).toBe(14994.50);
  });
});

// RUT normalization tests
describe('normalizeRUT', () => {
  test('formatted RUT', () => {
    const result = normalizeRUT('77.352.453-K');
    expect(result?.fullRUT).toBe('77352453k');
    expect(result?.dv).toBe('k');
  });
  
  test('unformatted RUT', () => {
    const result = normalizeRUT('77352453k');
    expect(result?.fullRUT).toBe('77352453k');
  });
  
  test('numeric DV', () => {
    const result = normalizeRUT('12.345.678-9');
    expect(result?.fullRUT).toBe('123456789');
    expect(result?.dv).toBe('9');
  });
  
  test('invalid RUT', () => {
    expect(normalizeRUT('invalid')).toBeNull();
    expect(normalizeRUT('')).toBeNull();
  });
});
```

---

**Files:**
- Current: `src/lib/nubox-cartola-extraction.ts`
- Improved: `src/lib/nubox-cartola-extraction-improved.ts`
- This doc: `docs/CODE_COMPARISON_SIDE_BY_SIDE.md`


