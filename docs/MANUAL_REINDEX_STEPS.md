# 🎯 Pasos Manuales para Re-indexar S001 y M001

**Estado:** Scripts listos pero requieren permisos de Firestore  
**Alternativa:** Ejecutar manualmente via webapp

---

## ✅ MÉTODO SIMPLE: Browser Console

### **Paso 1: Abrir Webapp**
```
http://localhost:3000/chat
```

### **Paso 2: Login**
- Login con tu cuenta admin (alec@getaifactory.com o similar)

### **Paso 3: Abrir Console (F12)**
- Presiona F12
- Click en tab "Console"

### **Paso 4: Ejecutar Script de Re-indexing**

Pega este código completo en la console:

```javascript
// ============================================
// SCRIPT DE RE-INDEXING PARA S001 Y M001
// ============================================

async function reindexAgentByTitle(agentTitle) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🔄 Re-indexando: ${agentTitle}`);
  console.log(`${'='.repeat(60)}\n`);
  
  try {
    const response = await fetch('/api/admin/reindex-agent-noauth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        agentTitle: agentTitle
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      
      if (errorData.suggestions) {
        console.log('❌ Agente no encontrado. Sugerencias:');
        errorData.suggestions.forEach(s => {
          console.log(`   - ${s.title} (ID: ${s.id})`);
        });
        
        // Ask user to select
        console.log('\n💡 Copia el título exacto de arriba y ejecuta:');
        console.log('   reindexAgentByTitle("TÍTULO_EXACTO")');
        return null;
      }
      
      console.error(`❌ Error ${response.status}:`, errorData);
      return null;
    }
    
    const data = await response.json();
    
    console.log(`✅ Agente: ${data.agentTitle}`);
    console.log(`   ID: ${data.agentId}`);
    console.log(`   Documentos encontrados: ${data.documentsFound || 0}`);
    console.log(`   Documentos re-indexados: ${data.documentsReindexed || 0}`);
    console.log(`   Documentos con error: ${data.documentsFailed || 0}\n`);
    
    if (data.results && data.results.length > 0) {
      console.log(`📊 Detalle por documento:\n`);
      data.results.forEach(result => {
        if (result.success) {
          const useful = (result.chunksCount || 0) - (result.chunksFiltered || 0);
          console.log(`   ✅ ${result.sourceName}`);
          console.log(`      Total chunks: ${result.chunksCount || 'N/A'}`);
          console.log(`      Basura filtrada: ${result.chunksFiltered || 0}`);
          console.log(`      Útiles: ${useful}`);
          console.log(`      Tiempo: ${result.indexingTime || 'N/A'}ms`);
        } else {
          console.log(`   ❌ ${result.sourceName}`);
          console.log(`      Error: ${result.error}`);
        }
        console.log();
      });
    } else if (data.documentsFound === 0) {
      console.log(`⚠️ Este agente NO tiene documentos asignados`);
      console.log(`   Esto explica por qué no muestra referencias\n`);
    }
    
    return data;
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    return null;
  }
}

// ============================================
// EJECUTAR RE-INDEXING
// ============================================

async function reindexAll() {
  console.log('🚀 Iniciando re-indexing de S001 y M001...\n');
  
  // Re-index S001
  const s001Result = await reindexAgentByTitle('GESTION BODEGAS GPT (S001)');
  
  // Wait 2 seconds
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Re-index M001  
  const m001Result = await reindexAgentByTitle('Asistente Legal Territorial RDI (M001)');
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('🎉 PROCESO COMPLETO');
  console.log('='.repeat(60));
  console.log();
  
  const results = [
    { name: 'S001', data: s001Result },
    { name: 'M001', data: m001Result }
  ];
  
  results.forEach(r => {
    if (r.data && r.data.success) {
      console.log(`✅ ${r.name}: ${r.data.documentsReindexed || 0} docs re-indexados`);
    } else {
      console.log(`❌ ${r.name}: Error o sin documentos`);
    }
  });
  
  console.log('\n📝 Próximos pasos:');
  console.log('   1. Probar en M1: "¿Qué es un OGUC?"');
  console.log('   2. Verificar fragmentos son útiles (no "INTRODUCCIÓN...")');
  console.log('   3. Verificar S1 tiene documentos asignados');
  console.log('   4. Reportar resultados\n');
}

// ============================================
// AUTO-EJECUTAR
// ============================================
console.log('💡 Script cargado. Ejecuta: reindexAll()');
console.log('   O por separado:');
console.log('   - reindexAgentByTitle("GESTION BODEGAS GPT (S001)")');
console.log('   - reindexAgentByTitle("Asistente Legal Territorial RDI (M001)")\n');

// Auto-ejecutar
reindexAll();
```

**Copia todo el código de arriba** (desde `async function` hasta el final) y pégalo en la Console.

El script se auto-ejecutará y verás el progreso en la console.

---

## ⏱️ Tiempo Estimado

- **S001:** ~30 segundos - 2 minutos (depende de cuántos docs tenga)
- **M001:** ~3-5 minutos (tiene ~13 documentos PDFs)
- **Total:** ~5-7 minutos

---

## 📊 Qué Verás en la Console

### **Si el agente tiene documentos:**

```
🔄 Re-indexando: Asistente Legal Territorial RDI (M001)
============================================================

✅ Agente: Asistente Legal Territorial RDI (M001)
   ID: abc123xyz
   Documentos encontrados: 13
   Documentos re-indexados: 13
   Documentos con error: 0

📊 Detalle por documento:

   ✅ DDU-493-.pdf
      Total chunks: 147
      Basura filtrada: 43
      Útiles: 104
      Tiempo: 2340ms

   ✅ CIR-182.pdf
      Total chunks: 89
      Basura filtrada: 21
      Útiles: 68
      Tiempo: 1850ms
      
   ... (continúa para cada PDF)
```

### **Si el agente NO tiene documentos:**

```
🔄 Re-indexando: GESTION BODEGAS GPT (S001)
============================================================

✅ Agente: GESTION BODEGAS GPT (S001)
   ID: xyz789abc
   Documentos encontrados: 0
   Documentos re-indexados: 0

⚠️ Este agente NO tiene documentos asignados
   Esto explica por qué no muestra referencias
```

---

## 🚨 Si Aparece Error "Agent not found"

El script te mostrará sugerencias:

```
❌ Agente no encontrado. Sugerencias:
   - GESTION BODEGAS (S001) (ID: abc123)
   - Gestión de Bodegas GPT (ID: xyz789)

💡 Copia el título exacto de arriba y ejecuta:
   reindexAgentByTitle("TÍTULO_EXACTO")
```

Entonces ejecuta con el título exacto que te mostró.

---

## ✅ Después del Re-indexing

### **Testing en M001:**

```
1. Preguntar: "¿Qué es un OGUC?"
2. Click en badges [1][2][3][4][5]
3. Verificar contenido:
   ✅ Fragmentos útiles (texto real)
   ❌ NO "INTRODUCCIÓN ..."
   ❌ NO "Página X de Y"
```

### **Testing en S001:**

```
Si tiene docs:
1. Preguntar: "¿Cómo genero el informe de consumo de petróleo?"
2. Verificar:
   ✅ Muestra referencias clickeables
   ✅ Da información concreta (no solo "consulta doc X")

Si NO tiene docs:
❌ Problema confirmado: Necesita subir PDFs primero
```

---

## 📝 Reportar Resultados

Después de ejecutar, comparte en chat:

```
S001:
- Documentos encontrados: X
- Re-indexados: Y
- [Si 0]: Problema confirmado - sin documentos

M001:
- Documentos encontrados: X
- Re-indexados: Y
- Basura filtrada total: Z chunks

Testing:
- FB-002 (anti-alucinación): Probado Sí/No
- FB-003 (calidad fragmentos): Probado Sí/No
```

---

**¿Listo para ejecutar?** 

Abre http://localhost:3000/chat, F12, pega el script, y comparte los resultados. 🚀
