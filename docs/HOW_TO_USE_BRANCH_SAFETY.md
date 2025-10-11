# 🎓 Cómo Usar el Sistema de Seguridad de Branches

**Guía Práctica para Usuarios**  
**Fecha**: Enero 11, 2025

---

## 🚀 Inicio Rápido

### Para el Usuario (Tú)

El sistema ahora te protege automáticamente. Solo necesitas saber qué esperar.

---

## 📋 Escenarios Comunes

### Escenario 1: "Quiero cambiar de branch"

**Tú dices**:
```
"Switch to feat/chat-config-persistence"
```

**AI responde**:
```
🔄 Validando cambio de branch...

[Ejecuta validación automática]

📊 ANÁLISIS:

Branch Actual: feat/admin-analytics-sections-2025-10-11
Branch Destino: feat/chat-config-persistence-2025-10-10

Estado Detectado:
✅ 0 archivos sin commitear (todo limpio)
✅ 4/4 features protegidas presentes
⚠️  Branch destino NO está merged en main
✅ 0 conflictos potenciales

Risk Level: 🟡 MEDIUM

Recomendación: Proceder con precaución. El branch destino 
no ha sido validado (no está en main), pero tu trabajo 
actual está seguro.

¿Quieres continuar?
A) ✅ Sí, cambiar ahora
B) ℹ️  Ver qué hay en el branch destino
C) ❌ Cancelar
```

**Tú eliges**: A

**AI ejecuta**:
```bash
git checkout feat/chat-config-persistence-2025-10-10

[Verifica features]

✅ Switch completado exitosamente
✅ Todas las features verificadas
✅ No hay errores de TypeScript

Ahora estás en: feat/chat-config-persistence-2025-10-10
```

---

### Escenario 2: "Tengo cambios sin commitear"

**Tú dices**:
```
"Switch to main"
```

**AI responde**:
```
🚨 ADVERTENCIA: Cambios sin commitear detectados

Estado Actual:
- Branch: feat/admin-analytics-sections-2025-10-11
- Cambios sin commitear: 5 archivos modificados
- Archivos nuevos: 10 sin rastrear

❌ NO PUEDO cambiar de branch con cambios sin commitear.

Opciones:
A) Commitear cambios ahora
   → Te ayudo a hacer el commit
   
B) Guardar temporalmente (stash)
   → Guardo cambios para restaurar después
   
C) Ver qué archivos están modificados
   → Te muestro la lista completa
   
D) Cancelar cambio de branch
   → Quedamos donde estamos

¿Qué prefieres?
```

**Tú eliges**: A

**AI pregunta**:
```
Perfecto. ¿Qué mensaje de commit quieres usar?

Ejemplos:
- "feat: Add folders organization"
- "fix: Restore missing UI features"
- "wip: Work in progress"

Tu mensaje:
```

**Tú respondes**: "feat: Add branch safety system"

**AI ejecuta**:
```bash
git add .
git commit -m "feat: Add branch safety system"

✅ Commit creado: 6e0cfd4
✅ 46 archivos commiteados

Ahora puedo cambiar a main de forma segura.
¿Procedo?
```

---

### Escenario 3: "Riesgo CRÍTICO detectado"

**Tú dices**:
```
"Switch to feat/experimental-refactor"
```

**AI responde**:
```
🚨 RIESGO CRÍTICO DETECTADO

Estado Actual:
- Branch: feat/admin-analytics-sections-2025-10-11
- Cambios sin commitear: 38 archivos
- Features protegidas: 2/4 (faltan 2)
- Conflictos potenciales: 15 archivos

Branch Destino:
- NO está merged en main (experimental)
- Tiene cambios en 20 archivos que tú también modificaste
- Falta 1 feature protegida

Risk Level: 🔴 CRITICAL

⛔ RECOMENDACIÓN FUERTE: NO CAMBIAR AHORA

Problemas identificados:
1. Perderías 38 archivos sin commitear
2. Perderías 2 features protegidas que restauraste
3. 15 archivos tendrían conflictos
4. El branch destino no está validado

🚨 Esto podría causar:
- Pérdida de trabajo
- Features rotas
- Horas de recuperación

Acciones recomendadas:
1. ✅ Commitear tus 38 archivos primero
2. ✅ Restaurar las 2 features faltantes
3. ✅ Validar el branch destino
4. ✅ Resolver conflictos antes de cambiar

¿Qué quieres hacer?
A) Mostrarme qué archivos perderé
B) Ayúdame a commitear todo primero
C) Restaurar features faltantes
D) Cancelar el cambio
```

**Tú eliges**: B

**AI procede** con el proceso de commit seguro.

---

## 🎯 Comandos que Activan la Validación

El sistema se activa cuando dices:

### Explícitos:
- "Switch to [branch]"
- "Change to [branch]"
- "Checkout [branch]"
- "Go to [branch]"
- "Cambiar a [branch]"

### Implícitos:
- "Let's work on the chat feature" (si está en otro branch)
- "I need to fix that bug in main" (cambio implícito)
- "Show me what's in feat/X" (posible cambio)

---

## 📊 Niveles de Riesgo Explicados

### 🟢 LOW (Exit Code 0)
**Qué significa**: Todo está perfecto
- ✅ Sin cambios uncommitted
- ✅ Todas las features presentes
- ✅ Branch destino validado (en main)
- ✅ Sin conflictos

**Qué pasa**: AI cambia automáticamente (con tu aprobación)

**Ejemplo**:
```
Risk Level: 🟢 LOW - Safe to switch
Recommendation: Proceed
```

---

### 🟡 MEDIUM (Exit Code 1)
**Qué significa**: Algunos riesgos menores
- ⚠️  Branch destino no validado OR
- ⚠️  Pocos cambios uncommitted OR
- ⚠️  Conflictos menores

**Qué pasa**: AI pregunta antes de proceder

**Ejemplo**:
```
Risk Level: 🟡 MEDIUM - Proceed with caution
Recommendation: Commit changes first
```

---

### 🟠 HIGH (Exit Code 2)
**Qué significa**: Riesgos significativos
- 🚨 Cambios uncommitted Y
- 🚨 Algunas features faltantes OR
- 🚨 Múltiples conflictos

**Qué pasa**: AI recomienda fuertemente NO cambiar aún

**Ejemplo**:
```
Risk Level: 🟠 HIGH - Significant risk
Recommendation: Must commit and verify first
```

---

### 🔴 CRITICAL (Exit Code 3)
**Qué significa**: ¡PELIGRO! No cambiar
- 🚫 Muchos cambios uncommitted Y
- 🚫 Features importantes faltantes Y
- 🚫 Alto riesgo de pérdida de datos

**Qué pasa**: AI se niega a cambiar hasta que arregles

**Ejemplo**:
```
Risk Level: 🔴 CRITICAL - DO NOT SWITCH
Recommendation: Fix all issues first
```

---

## 🛠️ Comandos Manuales (Opcional)

Si quieres validar manualmente antes de pedirle a AI:

### Validar un cambio:
```bash
./scripts/validate-branch-switch.sh feat/target-branch
```

### Ver features protegidas:
```bash
grep "Sparkles" src/components/ChatInterface.tsx
grep "userConfig" src/components/ChatInterface.tsx
grep "SalfaGPT puede cometer" src/components/ChatInterface.tsx
grep "calculateLocalContext" src/components/ChatInterface.tsx
```

### Ver qué cambios tienes:
```bash
git status
```

### Ver branches disponibles:
```bash
git branch -a
```

---

## 💡 Mejores Prácticas

### 1. Commit Frecuentemente
```
✅ BIEN:
- Commit después de cada feature completa
- Commit antes de cambiar de branch
- Commit al final del día

❌ MAL:
- 50 archivos sin commitear
- Trabajo de una semana sin commit
- Cambiar branches con cambios uncommitted
```

### 2. Usa Mensajes Descriptivos
```
✅ BIEN:
"feat: Add folders organization with API endpoints"
"fix: Restore calculateLocalContext function"
"docs: Complete branch safety documentation"

❌ MAL:
"update"
"changes"
"wip"
```

### 3. Valida Antes de Grandes Cambios
```
Si vas a hacer un cambio grande:

1. Valida estado actual
   ./scripts/validate-branch-switch.sh target

2. Commit todo actual
   git add . && git commit -m "feat: X"

3. Luego cambia
   "Switch to target"
```

### 4. Mantén Features Protegidas
```
Las 4 features críticas SIEMPRE deben estar:
1. Sparkles import + uso
2. userConfig state + display
3. Disclaimer text
4. calculateLocalContext function

Si faltan, restáuralas ANTES de cambiar branches.
```

---

## 🚨 Si Algo Sale Mal

### Perdiste una feature después de cambiar:

**1. No entres en pánico**
```bash
git reflog
# Busca el commit antes del switch
# Ejemplo: 6e0cfd4 checkout: moving from feat/X to feat/Y
```

**2. Restaura el archivo**
```bash
git checkout 6e0cfd4 -- src/components/ChatInterface.tsx
```

**3. Verifica**
```bash
npm run type-check
```

### El sistema no te dejó cambiar:

**Eso es BUENO** - te está protegiendo. Sigue las recomendaciones:

1. Lee el mensaje de error
2. Sigue las acciones sugeridas
3. Pide ayuda a AI: "Ayúdame a resolver esto"

---

## 📚 Ejemplos de Interacciones Reales

### Ejemplo 1: Cambio Seguro
```
Usuario: "switch to main"

AI: "Let me validate that switch...
     
     ✅ Risk: LOW
     ✅ All safe to proceed
     
     Switching to main now..."

[git checkout main]

AI: "✅ Switch successful
     ✅ All features present
     ✅ TypeScript: 0 errors
     
     You're now on main."
```

---

### Ejemplo 2: Necesita Commit Primero
```
Usuario: "go to feat/chat-config"

AI: "⚠️  Wait! You have 5 uncommitted files.
     
     Risk: MEDIUM
     
     I recommend committing first.
     Shall I help you commit?"

Usuario: "yes"

AI: "What commit message?
     
     Suggestion: 'wip: Chat config changes'"

Usuario: "feat: Add chat persistence"

AI: [commits]
    "✅ Committed!
     Now switching to feat/chat-config..."
```

---

### Ejemplo 3: Riesgo Crítico Evitado
```
Usuario: "switch to feat/old-experimental"

AI: "🚨 CRITICAL RISK DETECTED!
     
     You have:
     - 38 uncommitted files
     - 2 missing protected features
     - 15 potential conflicts
     
     Switching would LOSE your work!
     
     I STRONGLY recommend:
     1. Commit your 38 files
     2. Restore missing features
     3. Then validate target branch
     
     What would you like to do?"

Usuario: "commit everything first"

AI: [Ayuda con el commit]
    "✅ All committed safely!
     
     Now, about those 2 missing features...
     Shall I restore them?"
```

---

## ✨ Beneficios del Sistema

### Antes (Sin Sistema):
```
Usuario: "switch to main"
[git checkout main]
Usuario: "¡Perdí las features!"
AI: "😰 Let me check git reflog..."
[30 minutos de recuperación]
```

### Ahora (Con Sistema):
```
Usuario: "switch to main"
AI: "⚠️  Wait! This would lose 2 features.
     Let me commit first..."
[Commit automático]
AI: "✅ Safe to switch now"
[git checkout main]
AI: "✅ All features intact"
```

**Resultado**:
- ✅ 0 features perdidas
- ✅ 0 trabajo perdido
- ✅ 0 tiempo en recuperación
- ✅ 100% tranquilidad

---

## 🎯 Resumen - Lo Esencial

### Para Usar el Sistema:

1. **Di naturalmente** "switch to X" o "cambiar a X"
2. **AI validará** automáticamente
3. **Sigue las recomendaciones** que AI te dé
4. **Confía en el sistema** - te está protegiendo

### Reglas de Oro:

1. ✅ Commit antes de cambiar branches
2. ✅ Mantén las 4 features protegidas
3. ✅ Lee los mensajes de riesgo
4. ✅ Sigue las recomendaciones de AI

### En Caso de Duda:

1. Pregunta a AI: "¿Es seguro cambiar a X?"
2. Pide ayuda: "Ayúdame a preparar el cambio"
3. Valida manualmente: `./scripts/validate-branch-switch.sh X`

---

## 📞 Necesitas Ayuda?

### Preguntas Comunes:

**"¿Puedo ignorar las advertencias?"**
No recomendado. El sistema detectó riesgos reales.

**"¿Qué pasa si tengo urgencia?"**
Dile a AI: "Es urgente, ayúdame a hacer esto rápido pero seguro"

**"El script dice CRITICAL pero me ves bien"**
El script detectó algo. Mejor revisar qué es.

**"¿Cómo desactivo el sistema?"**
No deberías. Pero si insistes, elimina `.cursor/rules/branch-management.mdc`

### Soporte:

Para problemas o preguntas:
1. Lee `docs/BRANCH_SAFETY_SYSTEM.md` (guía técnica)
2. Pregunta a AI: "Explícame el sistema de branches"
3. Revisa `.cursor/rules/branch-management.mdc`

---

**¡Disfruta tu desarrollo sin miedo a perder trabajo!** 🎉

---

**Última Actualización**: Enero 11, 2025  
**Versión**: 1.0  
**Status**: ✅ Sistema Activo y Protegiendo

