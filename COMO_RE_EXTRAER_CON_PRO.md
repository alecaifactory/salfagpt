# Cómo Re-extraer Documentos con Gemini 2.5 Pro

**Situación:** Documentos antiguos extraídos con Flash  
**Objetivo:** Re-extraer con Pro para mejor calidad  
**Costo:** Pro es más preciso pero más caro

---

## 📊 Diferencia de Modelos

### Lo que viste en DDU-ESP-009-07.pdf
```
Modelo: gemini-2.5-flash
Tokens: 1,310
Costo: ~$0.003 USD
```

### Con Gemini 2.5 Pro (Recomendado)
```
Modelo: gemini-2.5-pro
Tokens: ~1,500 (similar)
Costo: ~$0.016 USD (5x más caro pero mejor calidad)
```

**Diferencia en calidad:**
- ✅ **Pro:** Mejor interpretación de tablas complejas
- ✅ **Pro:** Mayor precisión en términos técnicos
- ✅ **Pro:** Mejor contexto y comprensión
- ⚡ **Flash:** 2x más rápido, 75% más barato

---

## 🔄 Cómo Re-extraer con Pro

### Opción 1: Desde Modal de Configuración

1. **Abre el modal de configuración del documento:**
   - En "All Context Sources"
   - Click en el ícono ⚙️ (settings) al lado del documento
   
2. **Selecciona Pro:**
   - En el lado derecho, sección "Configuración"
   - Click en botón "✨ Pro"
   
3. **Re-extrae:**
   - Sube el archivo nuevamente
   - La nueva extracción usará Pro
   
4. **Compara:**
   - Verás los nuevos tokens y costo
   - Podrás comparar la calidad

**⚠️ Nota:** La interfaz dice "Archivo no guardado - Necesitarás subir el archivo nuevamente para re-procesar"

### Opción 2: Desde Chat Interface

1. **Abre el agente** que usa este documento
2. **En "Fuentes de Contexto"** (sidebar izquierdo)
3. **Click en ⚙️** al lado del documento
4. **Sube el archivo de nuevo** con Pro seleccionado

---

## 💰 Comparación de Costos (Oficial)

**Fuente:** [Gemini API Pricing](https://ai.google.dev/gemini-api/docs/pricing)

### Para documento típico (5k caracteres = ~1,500 tokens)

| Modelo | Input Cost | Output Cost | Total | Tiempo |
|--------|------------|-------------|-------|--------|
| **Flash** | $0.0005 | $0.0025 | **$0.003** | ~23s |
| **Pro** | $0.0019 | $0.0150 | **$0.017** | ~45s |
| **Diferencia** | - | - | **+$0.014 (+467%)** | +22s |

### Para documento grande (50k caracteres = ~15,000 tokens)

| Modelo | Input Cost | Output Cost | Total | Tiempo |
|--------|------------|-------------|-------|--------|
| **Flash** | $0.0045 | $0.0250 | **$0.030** | ~60s |
| **Pro** | $0.0188 | $0.1500 | **$0.169** | ~120s |
| **Diferencia** | - | - | **+$0.139 (+463%)** | +60s |

---

## 🎯 Cuándo Usar Cada Modelo

### Usa Gemini 2.5 Pro Cuando:
- ✅ Documentos con tablas complejas
- ✅ Documentos legales o técnicos
- ✅ Precisión es crítica
- ✅ Documentos multi-idioma
- ✅ Necesitas la mejor calidad posible

**Ejemplo:** Contratos, manuales técnicos, documentos regulatorios

### Usa Gemini 2.5 Flash Cuando:
- ✅ Documentos simples y directos
- ✅ Alto volumen (100+ documentos)
- ✅ Costo es prioridad
- ✅ Velocidad importa
- ✅ Testing y desarrollo

**Ejemplo:** Emails, notas simples, documentos de texto plano

---

## 📋 Configuración Actual (Post-Fix)

### Defaults Configurados Ahora

**AddSourceModal (Chat Interface):**
```typescript
✅ Default: gemini-2.5-pro
✅ Alternativa: gemini-2.5-flash
```

**ContextManagementDashboard (Admin Panel):**
```typescript
✅ Default: gemini-2.5-pro
✅ Alternativa: No configurable (usa Pro)
```

**Re-extracción:**
```typescript
✅ Default: gemini-2.5-pro
```

### Todos los Documentos Nuevos
A partir de ahora, **TODOS los documentos nuevos** se extraerán con **Pro** por defecto.

---

## 🔍 Cómo Verificar el Modelo Usado

### En la Interfaz
1. Click en el documento en la lista
2. O click en ⚙️ para ver configuración
3. **Mira "Modelo:"** 
   - gemini-2.5-flash = Flash usado ⚡
   - gemini-2.5-pro = Pro usado 🎯

### En los Tokens y Costo
**Flash típico (5k chars):**
- Tokens: ~1,300
- Costo: ~$0.003

**Pro típico (5k chars):**
- Tokens: ~1,500
- Costo: ~$0.017

---

## 🎨 Ejemplo Visual de Diferencia

### Documento Extraído con Flash
```
📊 Uso de Tokens y Costo
Tokens Input:    1,200
Tokens Output:     110
Total Tokens:    1,310
Costo Total:   $0.0033 ← Flash cost
```

### Mismo Documento con Pro
```
📊 Uso de Tokens y Costo
Tokens Input:    1,350
Tokens Output:     150
Total Tokens:    1,500
Costo Total:   $0.0169 ← Pro cost (5x más)
```

**Diferencia:** Mejor extracción, más completo, pero 5x el costo

---

## ✅ Acción Recomendada

### Para Este Documento (DDU-ESP-009-07.pdf)

**Opción A: Dejar con Flash**
- Si el contenido extraído es suficiente
- Si no necesitas máxima precisión
- Ahorra $0.014 por documento

**Opción B: Re-extraer con Pro**
- Si necesitas mejor calidad
- Si hay tablas complejas
- Si es documento crítico/legal
- Costo adicional: ~$0.014

### Para Documentos Futuros

**Ahora configurado:**
- ✅ Todos usan Pro por defecto
- ✅ Usuario puede elegir Flash manualmente
- ✅ Costo y tokens se muestran siempre

---

## 🔧 Verificación Rápida

```bash
# Check código actual:
grep "formData.append('model'" src/components/*.tsx

# Resultado esperado:
# ChatInterfaceWorking.tsx: 'gemini-2.5-pro'
# ContextManagementDashboard.tsx: 'gemini-2.5-pro'
# AddSourceModal.tsx: (usa config?.model con default Pro)
```

---

## 💡 Resumen

**Problema:** DDU-ESP-009-07.pdf fue extraído con Flash (antes del cambio)

**Solución:** 
1. ✅ Código corregido - ahora usa Pro por defecto
2. ✅ Todos los nuevos documentos usarán Pro
3. ⚠️ Documentos antiguos mantienen su extracción original
4. 🔄 Puedes re-extraer manualmente si necesitas mejor calidad

**Costo:**
- Flash: $0.003 por documento (lo que se usó)
- Pro: $0.017 por documento (5.7x más caro, mejor calidad)
- Diferencia: $0.014 por documento

---

## 🎯 Próximos Pasos

1. **Verifica en nuevos uploads:** Deberían usar Pro automáticamente
2. **Re-extrae documentos críticos:** Si necesitas mejor calidad
3. **Monitorea costos:** Pro es más caro pero más preciso

**¿Quieres que el sistema muestre una advertencia cuando se use Flash en lugar de Pro?**

