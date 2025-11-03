# 🚀 Quick Reference - Evaluación de Agentes

**Última Actualización:** 2025-10-29  
**Status:** ✅ Deployed to Production

---

## 📊 Estado Actual

```
┌─────────────────────────────────────────┐
│  BENCHMARK: 85 preguntas                │
│  ├─ M001: 19 preguntas                  │
│  │  ├─ Probadas: 4 (21%)                │
│  │  ├─ Pendientes: 15 (79%)             │
│  │  └─ Calidad: 9.25/10                 │
│  │                                       │
│  └─ S001: 66 preguntas                  │
│     ├─ Probadas: 1 (1.5%)               │
│     ├─ Pendientes: 65 (98.5%)           │
│     └─ Calidad: 10/10                   │
│                                          │
│  Promedio: 9.4/10 ⭐                     │
│  Phantom refs: 0/5 (0%) ✅              │
└─────────────────────────────────────────┘
```

---

## 🔗 URLs Rápidas

| Recurso | URL |
|---------|-----|
| **Producción** | https://salfagpt-production-3snj65wckq-uc.a.run.app/chat |
| **Local** | http://localhost:3000/chat |
| **Health Check** | https://salfagpt-production-3snj65wckq-uc.a.run.app/api/health/firestore |

---

## 📁 Archivos Clave

| Archivo | Propósito |
|---------|-----------|
| `docs/STATUS_FINAL_2025-10-29.md` | ⭐ Estado completo |
| `docs/evaluations/README.md` | ⭐ Guía del sistema |
| `docs/evaluations/questions/M001-questions-v1.json` | ⭐ 19 preguntas M001 |
| `docs/evaluations/questions/S001-questions-v1.json` | 66 preguntas S001 |
| `docs/PROMPT_CONTINUAR_EVALUACION_MASIVA_2025-10-29.md` | ⭐ Prompt nueva sesión |

---

## 🎯 Próximo Paso

### **PRIORIDAD: Completar M001** ⭐

```bash
# 1. Abrir producción
open https://salfagpt-production-3snj65wckq-uc.a.run.app/chat

# 2. Ver preguntas pendientes
cat docs/evaluations/questions/M001-questions-v1.json | \
  jq '.questions[] | select(.tested==false) | .question'

# 3. Probar y documentar cada una

# 4. Generar reporte final
```

**Tiempo:** 60-90 mins  
**Resultado:** M001 100% evaluado

---

## ⚡ Comandos Quick

```bash
# Ver estado evaluación
cat docs/evaluations/evaluations/EVAL-M001-2025-10-29-v1/metadata.json | jq '.scope'

# Ver preguntas críticas M001
cat docs/evaluations/questions/M001-questions-v1.json | jq '.questions[] | select(.priority=="critical")'

# Ver preguntas críticas S001  
cat docs/evaluations/questions/S001-questions-v1.json | jq '.questions[] | select(.priority=="critical")'

# Health check producción
curl https://salfagpt-production-3snj65wckq-uc.a.run.app/api/health/firestore | jq '.status'

# Ver logs producción
gcloud logging read "resource.labels.service_name=salfagpt-production" --limit 10 --project salfagpt
```

---

## 📊 Template Calificación Rápida

```
Pregunta: [copiar pregunta]
Calidad: __/10
Referencias: [N]
Phantom refs: SÍ/NO
Notas: [observaciones breves]
```

---

## ✅ Checklist Evaluación

Por cada pregunta:
- [ ] Copiar pregunta exacta
- [ ] Enviar al agente correcto
- [ ] Esperar respuesta completa
- [ ] Expandir referencias
- [ ] Contar badges disponibles
- [ ] Buscar menciones en texto
- [ ] Verificar phantom refs (números > badges)
- [ ] Calificar 1-10
- [ ] Documentar en Q00X-response.md
- [ ] Actualizar metadata.json

---

## 🎯 Objetivo Final

```
M001: 19/19 preguntas evaluadas (100%)
S001: 66/66 preguntas evaluadas (100%)  
Total: 85/85 preguntas

Calidad promedio: ≥ 8.5/10
Phantom refs: 0
Aprobación: Especialistas Salfa

→ Sistema listo para producción oficial
→ Framework para mejora continua establecido
```

---

**NEXT:** Continuar con M001 (15 preguntas pendientes) ⭐







