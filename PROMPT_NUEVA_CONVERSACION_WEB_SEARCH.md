# 🚀 Prompt para Nueva Conversación: Web Search Contextual

**Copiar y pegar este prompt completo en nueva conversación con Cursor AI**

---

```
# Implementar Búsqueda Web Contextual en Flow Platform

## Contexto del Proyecto
Estoy trabajando en Flow Platform (multi-org AI collaboration platform).

**Ubicación:** /Users/alec/salfagpt
**Branch actual:** refactor/chat-v2-2025-11-15
**Stack:** Astro 5.1 + React 18.3 + Firestore + Gemini 2.5
**GCP Project:** salfagpt (production)
**Port:** localhost:3000

## Objetivo de esta Sesión
Implementar búsqueda web contextual con contribución ética al entrenamiento:

**Features Core:**
1. Toggle de búsqueda web en chat (default OFF)
2. Integración Google Search API
3. Clasificación automática fuentes (pública/privada)
4. Sistema contribución anónimo para reentrenamiento
5. Transparencia total para usuario

**Principios NO NEGOCIABLES:**
- 🔒 Privacy-first: Solo fuentes públicas, datos 100% anónimos
- 🤝 Consent-based: Usuario opta-in explícitamente  
- 🌐 Transparent: Usuario ve qué se comparte
- 💚 Ethical: Bien común, respeto licenses, opt-out siempre

## Plan Completo Disponible
**LEER PRIMERO:** /Users/alec/salfagpt/CONTEXT_HANDOFF_WEB_SEARCH.md

Este documento contiene:
- Plan de 10 pasos con estimaciones (1 semana total)
- Arquitectura completa con código de ejemplo
- Schema extensions diseñadas
- UI mockups detallados
- Privacy framework completo
- Testing procedures
- Comparación con estimaciones previas (factor histórico 0.7x)

## Estado Actual (Dónde lo Dejamos)
✅ Planificación completa (CONTEXT_HANDOFF_WEB_SEARCH.md creado)
✅ Estimaciones calibradas (1 semana = realista)
✅ Arquitectura diseñada
⏳ Pendiente: Comenzar implementación

## Próximos Pasos INMEDIATOS
**PASO 1: Data Schema Extensions** (2-3 horas)

1. Abrir y modificar `.cursor/rules/data.mdc`:
   - Extender `ContextSource` interface con:
     ```typescript
     sourceClassification?: {
       isPublic: boolean;
       license?: 'public-domain' | 'cc-by' | 'cc-by-sa' | 'all-rights-reserved' | 'unknown';
       url?: string;
       domain?: string;
       capturedAt?: Date;
       isWebSearch?: boolean;
     };
     
     sharedUsage?: {
       canBeSharedForTraining?: boolean;
       anonymizedForTraining?: boolean;
       contributedToTraining?: boolean;
       contributedAt?: Date;
     };
     
     derivatives?: {
       canShareDerivatives?: boolean;
       derivativeType?: 'summary' | 'extraction' | 'analysis' | 'insight';
       parentSourceId?: string;
     };
     ```

2. Crear interfaces nuevas en `src/types/web-search.ts`:
   - `WebSearchQuery`
   - `WebSearchConfig`
   - `WebSearchResult`
   - `LicenseInfo`

3. Crear interfaces en `src/types/training-contribution.ts`:
   - `TrainingContribution`
   - `AnonymizedQuery`

4. Extender `UserSettings` en `data.mdc`:
   - `webSearch` config
   - `trainingContribution` consent

5. Actualizar `firestore.indexes.json` con nuevos índices

**DESPUÉS DE PASO 1:**
- Verificar: `npm run type-check` (0 errores)
- Commit: "feat: Add web search data schema"
- Continuar con PASO 2 (User Consent UI)

## Archivos Críticos a Consultar
**Antes de empezar, leer:**
1. `/Users/alec/salfagpt/CONTEXT_HANDOFF_WEB_SEARCH.md` - Plan completo ⭐
2. `.cursor/rules/data.mdc` - Schema actual
3. `.cursor/rules/privacy.mdc` - Privacy framework
4. `.cursor/rules/alignment.mdc` - Principios core

**Durante implementación:**
- `src/components/ChatInterfaceWorking.tsx` - UI principal (4153 líneas)
- `src/lib/firestore.ts` - Database operations
- `docs/features/queue-system-2025-10-31.md` - Feature similar (reference)

## Decisiones Pendientes
Antes de continuar, necesito decidir:

1. **¿Qué API de búsqueda usar?**
   - Google Search API ($5/1K queries) - Recomendado ✅
   - SerpAPI ($50/mes unlimited)
   - Brave Search API (privacy-focused, gratis tier)

2. **¿Cuántos resultados por defecto?**
   - Recomendación: 3 resultados
   - Configurable por usuario

3. **¿Solo snippets o full scraping?**
   - Snippets: Más rápido, menos tokens
   - Full scraping: Más contexto, más costo
   - Recomendación: Snippets + opción full

4. **¿Legal review necesario antes de empezar?**
   - Privacy policy update
   - Terms of service update
   - GDPR compliance check

## Constraints Importantes
- ✅ TODO debe ser backward compatible (additive-only)
- ✅ Documentos privados NUNCA en training
- ✅ PII NUNCA almacenado (solo hashes SHA-256)
- ✅ Opt-out siempre disponible
- ✅ Transparency total (usuario ve todo)

## Git Workflow
```bash
# Verificar branch actual
git status

# Si necesario, crear nuevo branch
git checkout -b feat/web-search-contextual-2025-11-18

# Trabajo incremental
# - Commit después de cada paso completado
# - Push diariamente
# - Testing continuo
```

## Testing Strategy
Después de cada fase (1-2, 3-4, 5-6, 7-8, 9-10):
- [ ] Manual testing en localhost
- [ ] Multi-user testing (2 usuarios)
- [ ] Privacy verification (no leaks)
- [ ] Type check passes
- [ ] Build succeeds

## Success Criteria (MVP)
Al finalizar PASO 10:
- ✅ Toggle funcional en UI
- ✅ Búsqueda web retorna resultados
- ✅ Fuentes clasificadas correctamente
- ✅ AI usa fuentes web en respuestas
- ✅ Datos anonimizados verificables
- ✅ Contribution pipeline funcional
- ✅ 0 privacy incidents en testing

## Estimación Realista
- **Optimista:** 7 días (1 semana)
- **Realista:** 10 días (1.5 semanas)
- **Con contingencia:** 14 días (2 semanas)

Basado en histórico: Features similares se completan en **0.7x tiempo estimado**.

---

**ACCIÓN INMEDIATA:**
1. Leer completo: CONTEXT_HANDOFF_WEB_SEARCH.md
2. Responder decisiones pendientes (API, resultados, scraping, legal)
3. Comenzar PASO 1 (Data Schema)

**¿Empezamos con PASO 1?**
```

---

**Guardar este prompt, copiar completo en nueva conversación, y el AI tendrá todo el contexto necesario para continuar sin pérdida de información.** ✅

