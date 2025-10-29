# ⚡ Quick Start Prompt - Nueva Conversación

**Uso:** Versión concisa para retomar rápidamente.

---

## 📋 PROMPT RÁPIDO

```
Hola, necesito continuar trabajo de referencias RAG - Sebastian issues.

ESTADO ACTUAL:
✅ 5/5 issues resueltos (100%)
✅ Código commiteado (8e56783, 1811844, 2615edb)
✅ Server running en :3000
✅ Calidad: 10/10 ambos agentes (S001, M001)

FIX PERMANENTE APLICADO:
- src/lib/rag-search.ts: Consolida por documento PRIMERO
- src/lib/gemini.ts: AI recibe números finales [1,2,3] solamente
- messages-stream.ts: Mapping consolidado
- Resultado: Números en texto = Badges (perfecto)

PENDIENTE:
⏳ Validación final Sebastian (10-15 mins)

OPCIONES:
A) Testing rápido propio (5 mins) → Enviar a Sebastian
B) Enviar directo a Sebastian
C) Revisar documentación
D) Debugging (si algo falla)

ARCHIVOS CLAVE:
- @docs/FINAL_CONSISTENCY_VERIFICATION_2025-10-29.md ⭐
- @docs/MENSAJE_TESTING_SEBASTIAN_FINAL_2025-10-29.md ⭐
- @docs/TESTING_CHECKLIST_SIMPLE_2025-10-29.md

SERVIDOR:
http://localhost:3000/chat
Estado: Running
Login: alec@getaifactory.com

TESTING:
S001: "¿Cómo genero informe petróleo?"
M001: "¿Cómo hago traspaso bodega?"

Verificar en logs:
→ "CONSOLIDATED: 3 documents (from 10 chunks)"
→ Números en texto ≤ Badges

¿Con qué opción (A, B, C, D) continúo?
```

---

## 📁 Archivos para Adjuntar

**Mínimo esencial:**
- @docs/FINAL_CONSISTENCY_VERIFICATION_2025-10-29.md

**Para testing:**
- @docs/MENSAJE_TESTING_SEBASTIAN_FINAL_2025-10-29.md

**Para debugging:**
- @docs/FIX_PERMANENTE_NUMERACION_2025-10-29.md

---

## ⚡ Recovery Commands

```bash
# Ver estado
cd /Users/alec/salfagpt
git log --oneline -3
git status --short

# Verificar fix aplicado
grep "documentRefNumber" src/lib/rag-search.ts

# Iniciar servidor
npm run dev

# Testing manual
open http://localhost:3000/chat
```

---

**RESULTADO:** Contexto cargado en <1 minuto, listo para continuar.


