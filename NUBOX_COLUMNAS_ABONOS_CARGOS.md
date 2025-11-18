# ✅ Extracción Correcta de Columnas ABONOS/CARGOS/SALDO

**Implementado:** 2025-11-18  
**Estado:** ✅ COMPLETO Y VERIFICADO CON DATOS REALES

---

## 📋 Cambios Implementados

### 1. Interpretación Correcta de Columnas

La cartola bancaria tiene 3 columnas principales:

```
┌──────────┬─────────────────────────┬─────────────┬─────────────┬──────────────┐
│  Fecha   │     Descripción         │  CARGOS     │   ABONOS    │    SALDO     │
│          │                         │  (salida)   │  (entrada)  │  (balance)   │
├──────────┼─────────────────────────┼─────────────┼─────────────┼──────────────┤
│ 30/10    │ Traspaso A:Gino         │   50.000    │             │       0      │
│ 30/10    │ Traspaso De Cuenta      │             │   50.000    │   50.000     │
│ 10/10    │ Traspaso A:Gino         │  757.864    │             │       0      │
└──────────┴─────────────────────────┴─────────────┴─────────────┴──────────────┘
```

**Reglas de Conversión:**

1. **ABONOS** (columna) → `amount` = **POSITIVO** (+)
   - Representa dinero que ENTRA a la cuenta
   - Ejemplo: 50.000 en ABONOS → `amount: 50000`

2. **CARGOS** (columna) → `amount` = **NEGATIVO** (-)
   - Representa dinero que SALE de la cuenta
   - Ejemplo: 757.864 en CARGOS → `amount: -757864`

3. **SALDO** (columna) → `balance` = número sin separadores
   - Representa el balance después del movimiento
   - Ejemplo: 805.214 en SALDO → `balance: 805214`

---

## 🎯 Formato JSON Resultante

### Ejemplo de Movimiento Individual

```json
{
  "id": "mov_1a2b3c4d",
  "type": "transfer",
  "amount": -757864,                    // NEGATIVO = salió de la cuenta (CARGO)
  "pending": false,
  "currency": "CLP",
  "post_date": "2024-10-10T00:00:00Z",
  "description": "Traspaso A:Gino Superdigital",
  "balance": 0,                         // SALDO después del movimiento
  "insights": {
    "errores": [],
    "calidad": "alta",
    "banco": "Banco de Chile",
    "extraction_proximity_pct": 95
  }
}
```

### Nueva Sección: balance_validation

Al final del JSON, se incluye una validación automática del balance:

```json
{
  "balance_validation": {
    "saldo_inicial": 1237952,           // Saldo al inicio del período
    "total_abonos": 317000,             // Suma de todos los amounts positivos
    "total_cargos": 1554952,            // Suma de todos los amounts negativos (en valor absoluto)
    "saldo_calculado": 0,               // saldo_inicial + total_abonos - total_cargos
    "saldo_final_documento": 0,         // Saldo final extraído del documento
    "coincide": true,                   // ¿El cálculo coincide con el documento?
    "diferencia": 0                     // Diferencia absoluta (tolerancia: ±1)
  }
}
```

**Fórmula de Validación:**

```
saldo_calculado = saldo_inicial + total_abonos - total_cargos

Si |saldo_calculado - saldo_final_documento| <= 1:
  coincide = true
Sino:
  coincide = false
```

---

## ✅ Verificación con Datos Reales

**Documento:** Banco de Chile - Octubre 2024  
**Fecha de Prueba:** 2025-11-18

### Tabla de Comparación

| Fecha  | Descripción                | CARGOS  | ABONOS  | SALDO   | amount   | balance | ✅ |
|--------|----------------------------|---------|---------|---------|----------|---------|----|
| 30/10  | Traspaso A:Gino            | 50.000  |         | 0       | -50000   | 0       | ✅ |
| 30/10  | Traspaso De Cuenta         |         | 50.000  | 50.000  | 50000    | 50000   | ✅ |
| 10/10  | Traspaso A:Gino            | 757.864 |         | 0       | -757864  | 0       | ✅ |
| 07/10  | Traspaso A:Victor          | 40.000  |         | 757.864 | -40000   | 757864  | ✅ |
| 07/10  | Traspaso A:Medio De Pago   | 7.350   |         | 797.864 | -7350    | 797864  | ✅ |
| 03/10  | Traspaso De Cuenta         |         | 267.000 | 805.214 | 267000   | 805214  | ✅ |
| 30/09  | Pago Tarjeta De Credito    | 93.012  |         | 538.214 | -93012   | 538214  | ✅ |
| 30/09  | Cargo Por Pago Tc          | 389.576 |         | 631.226 | -389576  | 631226  | ✅ |
| 30/09  | Pago:las Delicias          | 2.150   |         | 1.020.802 | -2150  | 1020802 | ✅ |
| 30/09  | Traspaso A:Freddy          | 215.000 |         | 1.022.952 | -215000 | 1022952 | ✅ |

### Validación de Balance

```
Saldo Inicial:     $1.237.952
Total Abonos:      +$317.000     (2 movimientos)
Total Cargos:      -$1.554.952   (8 movimientos)
────────────────────────────────
Saldo Calculado:   $0
Saldo Final (Doc): $0

✅ BALANCE CORRECTO (diferencia: 0)
```

---

## 🔧 Cambios Técnicos en el Código

### 1. Actualización de Tipos TypeScript

```typescript
export interface NuboxMovement {
  id: string;
  type: MovementType;
  amount: number;           // POSITIVO = abono, NEGATIVO = cargo
  pending: boolean;
  currency: 'CLP' | null;
  post_date: string;
  description: string;
  balance: number;          // 🆕 NUEVO CAMPO
  sender_account?: SenderAccount;
  insights: MovementInsights;
}

export interface NuboxCartola {
  // ... campos existentes ...
  movements: NuboxMovement[];
  
  balance_validation: {     // 🆕 NUEVA SECCIÓN
    saldo_inicial: number;
    total_abonos: number;
    total_cargos: number;
    saldo_calculado: number;
    saldo_final_documento: number;
    coincide: boolean;
    diferencia: number;
  };
  
  // ... resto de campos ...
}
```

### 2. Actualización del Prompt de Gemini

Se agregaron instrucciones específicas para interpretar las columnas:

```
3. Amount (MUY IMPORTANTE - USA LAS COLUMNAS CORRECTAMENTE):
   - Busca 3 columnas: ABONOS/CRÉDITOS (incoming), CARGOS/DÉBITOS (outgoing), SALDO/BALANCE
   - Si el valor está en "ABONOS" o "CRÉDITOS": amount = POSITIVO (+)
   - Si el valor está en "CARGOS" o "DÉBITOS": amount = NEGATIVO (-)
   - Número SIN separadores (ni puntos ni comas)
   - Ejemplo: 50.000 en ABONOS → amount: 50000
   - Ejemplo: 757.864 en CARGOS → amount: -757864

4. Balance (NUEVO CAMPO OBLIGATORIO):
   - Incluir el SALDO después de cada movimiento
   - Viene de la columna "SALDO" o "BALANCE"
   - Número sin separadores
   - Ejemplo: 1.237.952 → balance: 1237952

10. Balance_validation (NUEVO - AL FINAL DEL JSON):
    - Calcular: saldo_calculado = saldo_inicial + total_abonos - total_cargos
    - Comparar con saldo_final_documento
    - coincide: true si son iguales (tolerancia ±1)
    - diferencia: diferencia absoluta
```

### 3. Lógica de Cálculo

```typescript
// Parse balance from SALDO column
const normalizedBalance = parseChileanAmount(mov.balance);

// Calculate validation
const totalAbonos = normalizedMovements
  .filter(m => m.amount > 0)
  .reduce((sum, m) => sum + m.amount, 0);

const totalCargos = Math.abs(normalizedMovements
  .filter(m => m.amount < 0)
  .reduce((sum, m) => sum + m.amount, 0));

const saldoCalculado = opening_balance + totalAbonos - totalCargos;
const coincide = Math.abs(saldoCalculado - saldoFinalDocumento) <= 1;
```

---

## 📊 Resultados

**10/10 movimientos extraídos correctamente:**

- ✅ 2 ABONOS (amounts positivos)
- ✅ 8 CARGOS (amounts negativos)
- ✅ 10 SALDOS correctos
- ✅ Balance validado matemáticamente
- ✅ Diferencia: 0 (perfecto)

**Archivos generados:**

- `TEST_OUTPUT_NEW_RULES.json` (208 líneas)
- Incluye balance_validation completo
- Todos los movimientos con campo `balance`

---

## 🎯 Próximos Pasos

1. ✅ Columnas ABONOS/CARGOS correctamente interpretadas
2. ✅ Campo `balance` agregado a cada movimiento
3. ✅ Validación de balance implementada
4. ⏳ Probar con cartolas de otros bancos
5. ⏳ Verificar con cartolas con errores/inconsistencias

---

## 🔄 Rollback

Si necesitas volver a la versión anterior:

```bash
bash scripts/rollback-nubox-extraction.sh
```

**Backup disponible en:**
- `src/lib/nubox-cartola-extraction.backup-*.ts`

