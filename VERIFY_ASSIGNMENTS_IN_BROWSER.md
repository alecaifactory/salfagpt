# Verificar Asignaciones - Browser Console
**Ejecuta esto en DevTools Console**

## 🔍 **Script de Verificación Completa**

Copia y pega en la Console del browser (F12 → Console tab):

```javascript
// ========================================
// VERIFICACIÓN COMPLETA DE ASIGNACIONES
// ========================================

(async function verifyAssignments() {
  console.log('🔍 VERIFICACIÓN COMPLETA DE ASIGNACIONES');
  console.log('=========================================\n');
  
  try {
    // 1. Get ALL sources metadata
    console.log('1️⃣  Cargando metadata de todos los sources...');
    const response = await fetch('/api/context-sources/all-metadata');
    const data = await response.json();
    const allSources = data.sources || [];
    
    console.log('✅ Cargados', allSources.length, 'sources\n');
    
    // 2. Find agent M001 from conversations
    const convsResponse = await fetch('/api/conversations?userId=114671162830729001607');
    const convsData = await convsResponse.json();
    
    let agentM001 = null;
    let agentM001Id = null;
    
    // Search in all groups
    if (convsData.groups) {
      for (const group of convsData.groups) {
        const found = group.conversations.find(c => c.title === 'M001');
        if (found) {
          agentM001 = found;
          agentM001Id = found.id;
          break;
        }
      }
    }
    
    if (!agentM001Id) {
      console.log('❌ Agente M001 no encontrado');
      return;
    }
    
    console.log('2️⃣  Agente M001 encontrado:');
    console.log('   ID:', agentM001Id);
    console.log('   Title:', agentM001.title);
    console.log('');
    
    // 3. Count sources assigned to M001
    const assignedToM001 = allSources.filter(s => 
      s.assignedToAgents && s.assignedToAgents.includes(agentM001Id)
    );
    
    console.log('3️⃣  Sources asignados a M001:', assignedToM001.length);
    console.log('');
    
    // 4. Check the 4 recent documents
    console.log('4️⃣  Verificando documentos recién asignados:');
    const recentDocs = [
      'DDU-518-con-anexos.pdf',
      'D.F.L. N°458 DE 1976 Ley General de Urbanismo y Construcciones.pdf',
      'Cir110.pdf',
      'DDU-510.pdf'
    ];
    
    let recentFound = 0;
    let recentAssigned = 0;
    
    for (const docName of recentDocs) {
      const doc = allSources.find(s => s.name === docName);
      if (doc) {
        recentFound++;
        const isAssigned = doc.assignedToAgents && doc.assignedToAgents.includes(agentM001Id);
        if (isAssigned) recentAssigned++;
        
        console.log(isAssigned ? '   ✅' : '   ❌', docName);
        console.log('      assignedToAgents:', doc.assignedToAgents || []);
        console.log('      Tiene M001?', isAssigned);
      } else {
        console.log('   ⚠️  No encontrado:', docName);
      }
    }
    console.log('');
    console.log('   📊 De 4 recientes: Found', recentFound, '| Assigned', recentAssigned);
    console.log('');
    
    // 5. Check sources with M001 tag
    console.log('5️⃣  Documentos con tag M001:');
    const withM001Tag = allSources.filter(s => 
      s.labels && s.labels.includes('M001')
    );
    
    const withM001TagAndAssigned = withM001Tag.filter(s =>
      s.assignedToAgents && s.assignedToAgents.includes(agentM001Id)
    );
    
    console.log('   Total con tag M001:', withM001Tag.length);
    console.log('   De esos, asignados a agent M001:', withM001TagAndAssigned.length);
    console.log('   Porcentaje:', Math.round((withM001TagAndAssigned.length / withM001Tag.length) * 100) + '%');
    console.log('');
    
    // 6. Sample of assigned docs
    console.log('6️⃣  Muestra de documentos asignados (primeros 10):');
    assignedToM001.slice(0, 10).forEach((doc, idx) => {
      console.log('   ' + (idx + 1) + '.', doc.name);
      console.log('      Tags:', doc.labels || []);
    });
    if (assignedToM001.length > 10) {
      console.log('   ... y', assignedToM001.length - 10, 'más');
    }
    console.log('');
    
    // 7. Summary
    console.log('📊 RESUMEN FINAL');
    console.log('================');
    console.log('✅ Agente M001 ID:', agentM001Id);
    console.log('✅ Total sources en sistema:', allSources.length);
    console.log('✅ Sources asignados a M001:', assignedToM001.length);
    console.log('✅ Sources con tag M001:', withM001Tag.length);
    console.log('✅ Con tag M001 Y asignados:', withM001TagAndAssigned.length);
    console.log('✅ Documentos recientes asignados:', recentAssigned, 'de', recentFound);
    console.log('');
    
    // 8. Performance comparison
    console.log('📈 PERFORMANCE ESTIMADA');
    console.log('======================');
    console.log('Método anterior (1 request por doc):');
    console.log('   538 docs × 200ms = 107,600ms (1.8 minutos)');
    console.log('');
    console.log('Método nuevo (batch):');
    console.log('   1 request + 2 batches = ~3,400ms (3.4 segundos)');
    console.log('');
    console.log('Mejora: 31.6x más rápido ⚡');
    console.log('');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
})();
```

---

## 📊 **Output Esperado**

```
🔍 VERIFICACIÓN COMPLETA DE ASIGNACIONES
=========================================

✅ Agent M001 ID: eKUSLAQNrf2Ru96hKGeA

📊 TOTAL sources asignados a M001: 4
📋 Primeros 10:
   1. DDU-518-con-anexos.pdf
   2. D.F.L. N°458 DE 1976 Ley General de Urbanismo...
   3. Cir110.pdf
   4. DDU-510.pdf

🔍 Verificando 4 documentos recientes:
   ✅ DDU-518-con-anexos.pdf - Asignado? true
   ✅ Cir110.pdf - Asignado? true

📊 RESUMEN FINAL
================
✅ Agente M001 ID: eKUSLAQNrf2Ru96hKGeA
✅ Total sources en sistema: 539
✅ Sources asignados a M001: 4
✅ Sources con tag M001: 538
✅ Con tag M001 Y asignados: 4  ← Esto aumentará cuando uses batch
✅ Documentos recientes asignados: 4 de 4

📈 PERFORMANCE ESTIMADA
======================
Método anterior (1 request por doc):
   538 docs × 200ms = 107,600ms (1.8 minutos)

Método nuevo (batch):
   1 request + 2 batches = ~3,400ms (3.4 segundos)

Mejora: 31.6x más rápido ⚡
```

---

## 🎯 **Interpretación de Resultados**

### ✅ **Si todo está bien**:
- Sources asignados a M001: 4 (los que acabas de asignar)
- assignedToAgents contiene el ID correcto
- Los 4 documentos tienen `assignedToAgents: ['eKUSLAQNrf2Ru96hKGeA']`

### ⚠️ **Si algo está mal**:
- Sources asignados: 0 → No se guardó
- assignedToAgents: [] → No se actualizó
- Documentos no encontrados → Query problem

---

## 🧪 **Test del Nuevo Bulk Assignment**

Para probar el **método batch optimizado**:

1. **Clear selection** (si hay algo seleccionado)
2. Click tag **"M001 (538)"**
   - Debería indexar y seleccionar 538
   - Badge: "538 selected"
3. Seleccionar agente M001
4. Click **"Asignar (538)"**
5. **Console debería mostrar**:
   ```
   🚀 BULK ASSIGNMENT: 538 sources, 1 agents
   📦 Created 2 batch(es) for 538 sources
   ✅ BULK ASSIGN COMPLETE: 3.4s
   ```

6. **NO debería mostrar** 538 veces:
   ```
   ❌ NO: "Bulk assignment successful" (×538)
   ```

7. **Alert debería decir**:
   ```
   ✅ 538 documentos asignados a 1 agente(s) en 3.4s
   ```

---

**Ejecuta el script en Console del browser para verificar el estado actual!** 📊

