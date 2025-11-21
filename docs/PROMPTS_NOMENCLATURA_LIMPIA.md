# 📋 Prompts - Nomenclatura Limpia

## 🎯 Configuración de Prompts

### Organization Prompts

| Organization | Prompt |
|--------------|--------|
| **AI Factory** | "Eres el asistente de AI Factory." |
| **Salfa Corp** | "Eres el asistente del Grupo Salfacorp." |

---

### Agent Prompts (Dinámico por Agente Activo)

| Agente Activo | Nombre Limpio | Tokens | Especialidad |
|---------------|---------------|--------|--------------|
| **Ally** | Ally | ~125 | Guía, recomendaciones, onboarding |
| **M001** | Legal Territorial | ~200 | Normativa construcción, permisos |
| **M003** | Mantenimiento MAQSA | ~200 | Mantenimiento equipos, procedimientos |
| **S001** | Gestión Bodegas | ~200 | Inventarios, logística |
| **S002** | Mantenimiento | ~200 | Preventivo, órdenes trabajo |
| **SSOMA L1** | Seguridad | ~200 | Protocolos seguridad, SSOMA |
| **KAMKE L2** | Gestión | ~200 | Proyectos, coordinación |

---

## 📊 Aplicación por Usuario y Agente

### alec@getaifactory.com (SuperAdmin)

| Usa Agente | Organization | Agent | SuperPrompt |
|------------|--------------|-------|-------------|
| **Ally** | AI Factory | Ally | ✅ Platform |
| **M001** (Salfa) | Salfacorp* | Legal Territorial | ❌ No |
| **M003** (Salfa) | Salfacorp* | Mantenimiento MAQSA | ❌ No |

\*Cuando SuperAdmin usa agente de otra org, usa organization de esa org

---

### sorellanac@salfagestion.cl (Admin)

| Usa Agente | Organization | Agent | SuperPrompt |
|------------|--------------|-------|-------------|
| **Ally** | Salfacorp | Ally | ✅ Platform |
| **M001** | Salfacorp | Legal Territorial | ❌ No |
| **M003** | Salfacorp | Mantenimiento MAQSA | ❌ No |

---

### usuario@salfagestion.cl (User)

| Usa Agente | Organization | Agent | SuperPrompt |
|------------|--------------|-------|-------------|
| **Ally** | Salfacorp | Ally | ✅ Platform |
| **M001** | Salfacorp | Legal Territorial | ❌ No |

---

## 🎨 Contenido de Cada Prompt

### SuperPrompt (Solo Ally)
**Tamaño:** ~4,500 chars (~1,125 tokens)  
**Contenido:**
- Misión de Ally como asistente personal
- Arquitectura de Flow
- Capacidades de Ally
- Estilo de comunicación
- Ver: `src/lib/ally-init.ts:91-284`

---

### Organization Prompts

#### AI Factory
```
"Eres el asistente de AI Factory."
```
**Tamaño:** 37 chars (~9 tokens)

#### Salfa Corp
```
"Eres el asistente del Grupo Salfacorp."
```
**Tamaño:** 48 chars (~12 tokens)

---

### Agent Prompts

#### Ally (~125 tokens)
```
Soy Ally, tu asistente personal en Flow.
Te ayudo con la plataforma, recomendaciones de agentes y onboarding.
```

#### Legal Territorial (~200 tokens)
```
Soy el Asistente Legal Territorial RDI (M001).
Especializado en normativa de construcción, permisos y regulaciones.
```

#### Mantenimiento MAQSA (~200 tokens)
```
Soy el Asistente de Mantenimiento MAQSA (M003).
Especializado en mantenimiento de equipos y procedimientos técnicos.
```

#### Gestión Bodegas (~200 tokens)
```
Soy el Asistente de Gestión de Bodegas (S001).
Especializado en inventarios, logística y control de stock.
```

#### Mantenimiento (~200 tokens)
```
Soy el Asistente de Mantenimiento (S002).
Especializado en mantenimiento preventivo y órdenes de trabajo.
```

#### Seguridad (~200 tokens)
```
Soy el Asistente de Seguridad (SSOMA L1).
Especializado en protocolos de seguridad y prevención de riesgos.
```

#### Gestión (~200 tokens)
```
Soy el Asistente de Gestión (KAMKE L2).
Especializado en gestión de proyectos y coordinación de equipos.
```

---

## 🔄 Lógica de Combinación

### Para Ally:
```
Prompt Final = SuperPrompt + Organization + Ally
Ejemplo: 4,500 + 48 + 500 = ~5,000 chars (~1,250 tokens)
```

### Para Agentes Regulares:
```
Prompt Final = Organization + Agent
Ejemplo: 48 + 800 = ~850 chars (~213 tokens)
```

---

## 🎯 Implementación

### Script: `scripts/configure-organization-prompts.ts`

```bash
# Ejecutar para configurar:
npx tsx scripts/configure-organization-prompts.ts

# Output:
✅ AI Factory: "Eres el asistente de AI Factory."
✅ Salfa Corp: "Eres el asistente del Grupo Salfacorp."
```

---

## ✅ Status

**Organization Prompts:**
- AI Factory: Configurado ✅
- Salfa Corp: Configurado ✅

**Agent Prompts:**
- Ally: Listo para configurar
- M001-KAMKE: Usar prompts existentes o configurar

**Nomenclatura:**
- ✅ Sin palabra "prompt" en nombres
- ✅ Nombres limpios y descriptivos

---

**Last Updated:** 2025-11-18  
**Status:** ✅ Ready to implement  
**Script:** scripts/configure-organization-prompts.ts  

---

**Ejecuta el script cuando estés listo para configurar los organization prompts en Firestore.** 🚀


