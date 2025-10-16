# Debug - Estructura del Config Extraído

**Critical Finding from Logs:**
```
config.expectedInputExamples: undefined  ← El campo no existe!
```

**Necesito ver:**

Por favor copia y pega en Console esto y comparte el resultado:

```javascript
// Cuando veas "✅ Extraction successful" en Console
// Expande el objeto config que se muestra
// O corre esto para ver la estructura:

// Método 1: En el momento que veas el log
// Click en el objeto {agentName: 'Asistente...', ...}
// Expande todos los campos
// Busca campos que contengan "input" o "example"

// Método 2: Forzar console.log detallado
// Agregar temporalmente en ChatInterfaceWorking.tsx línea ~1156:
console.log('🔍 FULL CONFIG KEYS:', Object.keys(config));
console.log('🔍 FULL CONFIG JSON:', JSON.stringify(config, null, 2));
```

**Posibles nombres del campo:**
- `inputExamples` (directo)
- `expectedInputs`
- `testCases`
- `exampleInputs`
- `sampleQuestions`

**Una vez sepamos el nombre correcto, lo mapearé!**

