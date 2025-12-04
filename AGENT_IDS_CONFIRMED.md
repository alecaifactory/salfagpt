# 🔑 Agent IDs Confirmados - Sistema Completo

**Actualizado:** 22 noviembre 2025, 19:50 PST  
**Fuente:** Usuario (confirmado)  
**Status:** ✅ IDs verificados y listos para usar

---

## 📋 **AGENT IDS OFICIALES:**

| Agente | Agent ID | Status |
|--------|----------|--------|
| **S1-v2** | `iQmdg3bMSJ1AdqqlFpye` | ✅ LISTO |
| **S2-v2** | `1lgr33ywq5qed67sqCYi` | ✅ LISTO |
| **M1-v2** | `EgXezLcu4O3IUqFUJhUZ` | ⏳ TODO |
| **M3-v2** | `vStojK73ZKbjNsEnqANJ` | ⏳ TODO |

---

## 🚀 **PARA M1-v2 (USAR ESTE ID):**

**Agent ID:** `EgXezLcu4O3IUqFUJhUZ`

### **Comandos actualizados:**

```bash
# En scripts/check-m001-status.mjs (línea ~27):
const M1V2_AGENT_ID = 'EgXezLcu4O3IUqFUJhUZ';

# En scripts/assign-all-m001-to-m1v2.mjs (línea ~26):
const AGENT_ID = 'EgXezLcu4O3IUqFUJhUZ';

# En scripts/process-m1v2-chunks.mjs (línea ~17):
const M1V2_AGENT_ID = 'EgXezLcu4O3IUqFUJhUZ';

# En scripts/test-m1v2-evaluation.mjs (línea ~15):
const AGENT_ID = 'EgXezLcu4O3IUqFUJhUZ';
```

---

## 🚀 **PARA M3-v2 (USAR ESTE ID):**

**Agent ID:** `vStojK73ZKbjNsEnqANJ`

### **Comandos actualizados:**

```bash
# En scripts/check-m003-status.mjs (línea ~27):
const M3V2_AGENT_ID = 'vStojK73ZKbjNsEnqANJ';

# En scripts/assign-all-m003-to-m3v2.mjs (línea ~26):
const AGENT_ID = 'vStojK73ZKbjNsEnqANJ';

# En scripts/process-m3v2-chunks.mjs (línea ~17):
const M3V2_AGENT_ID = 'vStojK73ZKbjNsEnqANJ';

# En scripts/test-m3v2-evaluation.mjs (línea ~15):
const AGENT_ID = 'vStojK73ZKbjNsEnqANJ';
```

---

## ✅ **VERIFICACIÓN RÁPIDA:**

### **Verificar M1-v2:**
```bash
npx tsx -e "
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
initializeApp({ projectId: 'salfagpt' });
const db = getFirestore();

const doc = await db.collection('conversations').doc('EgXezLcu4O3IUqFUJhUZ').get();
if (doc.exists) {
  console.log('✅ M1-v2 encontrado:');
  console.log('   ID:', doc.id);
  console.log('   Title:', doc.data().title);
  console.log('   Sources:', (doc.data().activeContextSourceIds || []).length);
} else {
  console.log('❌ M1-v2 no encontrado con ID: EgXezLcu4O3IUqFUJhUZ');
}
process.exit(0);
"
```

---

### **Verificar M3-v2:**
```bash
npx tsx -e "
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
initializeApp({ projectId: 'salfagpt' });
const db = getFirestore();

const doc = await db.collection('conversations').doc('vStojK73ZKbjNsEnqANJ').get();
if (doc.exists) {
  console.log('✅ M3-v2 encontrado:');
  console.log('   ID:', doc.id);
  console.log('   Title:', doc.data().title);
  console.log('   Sources:', (doc.data().activeContextSourceIds || []).length);
} else {
  console.log('❌ M3-v2 no encontrado con ID: vStojK73ZKbjNsEnqANJ');
}
process.exit(0);
"
```

---

## 🔄 **PROCESO ACTUALIZADO:**

### **Para M1-v2:**

```bash
# 1. Copiar scripts de S1-v2
cp scripts/check-s001-status.mjs scripts/check-m001-status.mjs
cp scripts/assign-all-s001-to-s1v2.mjs scripts/assign-all-m001-to-m1v2.mjs
cp scripts/process-s1v2-chunks.mjs scripts/process-m1v2-chunks.mjs
cp scripts/test-s1v2-evaluation.mjs scripts/test-m1v2-evaluation.mjs

# 2. Buscar/Reemplazar en TODOS los scripts m001 y m1v2:
#    S1V2_AGENT_ID → M1V2_AGENT_ID
#    iQmdg3bMSJ1AdqqlFpye → EgXezLcu4O3IUqFUJhUZ
#    S001-20251118 → M001-20251118
#    s1v2 → m1v2
#    S1-v2 → M1-v2

# 3. Ejecutar secuencia
npx tsx scripts/check-m001-status.mjs
npx tsx scripts/assign-all-m001-to-m1v2.mjs
nohup npx tsx scripts/process-m1v2-chunks.mjs > /tmp/m1v2-chunks.log 2>&1 &
npx tsx scripts/test-m1v2-evaluation.mjs
```

---

### **Para M3-v2:**

```bash
# 1. Copiar scripts de M1-v2 (después de completar M1)
cp scripts/check-m001-status.mjs scripts/check-m003-status.mjs
cp scripts/assign-all-m001-to-m1v2.mjs scripts/assign-all-m003-to-m3v2.mjs
cp scripts/process-m1v2-chunks.mjs scripts/process-m3v2-chunks.mjs
cp scripts/test-m1v2-evaluation.mjs scripts/test-m3v2-evaluation.mjs

# 2. Buscar/Reemplazar en TODOS los scripts m003 y m3v2:
#    M1V2_AGENT_ID → M3V2_AGENT_ID
#    EgXezLcu4O3IUqFUJhUZ → vStojK73ZKbjNsEnqANJ
#    M001-20251118 → M003-20251118
#    m1v2 → m3v2
#    M1-v2 → M3-v2

# 3. Ejecutar secuencia
npx tsx scripts/check-m003-status.mjs
npx tsx scripts/assign-all-m003-to-m3v2.mjs
nohup npx tsx scripts/process-m3v2-chunks.mjs > /tmp/m3v2-chunks.log 2>&1 &
npx tsx scripts/test-m3v2-evaluation.mjs
```

---

## 📊 **TABLA COMPLETA DE AGENTES:**

| Agente | Agent ID | Carpeta | Chunks | Similarity | Status |
|--------|----------|---------|--------|------------|--------|
| **S1-v2** | iQmdg3bMSJ1AdqqlFpye | S001-20251118 | 1,217 | 79.2% | ✅ LISTO |
| **S2-v2** | 1lgr33ywq5qed67sqCYi | S002-20251118 | 12,219 | 76.3% | ✅ LISTO |
| **M1-v2** | EgXezLcu4O3IUqFUJhUZ | M001-20251118 | ~4,000 | ~75% | ⏳ TODO |
| **M3-v2** | vStojK73ZKbjNsEnqANJ | M003-20251118 | ~2,500 | ~75% | ⏳ TODO |

---

## ⚡ **INICIO RÁPIDO M1-v2:**

```bash
# Verificar que el agente existe
npx tsx -e "
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
initializeApp({ projectId: 'salfagpt' });
const db = getFirestore();

const doc = await db.collection('conversations').doc('EgXezLcu4O3IUqFUJhUZ').get();
console.log('M1-v2:', doc.exists ? '✅ Existe' : '❌ No existe');
if (doc.exists) {
  console.log('Title:', doc.data().title);
  console.log('Sources:', (doc.data().activeContextSourceIds || []).length);
}
process.exit(0);
"

# Si existe, copiar scripts y ejecutar (con ID correcto ya incluido)
```

---

## ⚡ **INICIO RÁPIDO M3-v2:**

```bash
# Verificar que el agente existe
npx tsx -e "
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
initializeApp({ projectId: 'salfagpt' });
const db = getFirestore();

const doc = await db.collection('conversations').doc('vStojK73ZKbjNsEnqANJ').get();
console.log('M3-v2:', doc.exists ? '✅ Existe' : '❌ No existe');
if (doc.exists) {
  console.log('Title:', doc.data().title);
  console.log('Sources:', (doc.data().activeContextSourceIds || []).length);
}
process.exit(0);
"

# Si existe, copiar scripts y ejecutar (con ID correcto ya incluido)
```

---

## 🎯 **PRÓXIMA ACCIÓN:**

**Ahora que tengo los IDs correctos:**

1. Puedo verificar que ambos agentes existen
2. Copiar scripts con IDs correctos
3. Ejecutar proceso completo
4. Completar sistema 4/4 agentes

**¿Quieres que:**
- A) Verifique ahora que M1-v2 y M3-v2 existen en Firestore
- B) Cree los scripts con los IDs correctos ya incluidos
- C) Ejecute el proceso completo para M1-v2 ahora mismo
- D) Solo actualice los prompts con los IDs correctos

---

**AGENT IDS CONFIRMADOS:**
- S1-v2: `iQmdg3bMSJ1AdqqlFpye` ✅
- S2-v2: `1lgr33ywq5qed67sqCYi` ✅
- M1-v2: `EgXezLcu4O3IUqFUJhUZ` ✅ NUEVO
- M3-v2: `vStojK73ZKbjNsEnqANJ` ✅ NUEVO




