# 🚀 Quick Start: Hierarchical Prompts

## What Are Hierarchical Prompts?

Think of prompts as instructions for your AI agents in **two levels**:

1. **Domain Prompt** 🏢 - Company-wide rules that ALL agents follow
2. **Agent Prompt** 🤖 - Specific job description for each agent

---

## 🏢 Step 1: Set Your Domain Prompt (Optional but Recommended)

### What to Include

Your domain prompt should define:
- **Who you are** as an organization
- **Core values** and principles
- **Policies** all agents must follow
- **Tone** of communication
- **Constraints** or limitations

### Example Domain Prompt

```
Somos Salfa Corp, empresa líder en servicios logísticos en Chile.

Valores Corporativos:
- Excelencia operacional
- Seguridad primero
- Transparencia con clientes
- Mejora continua

Políticas Importantes:
- Siempre verificar disponibilidad en sistema antes de confirmar fechas
- Escalar a supervisor si monto supera $50,000
- Usar lenguaje profesional pero cercano
- Mencionar procedimientos de seguridad cuando sea relevante
- Si no tienes información, indicarlo claramente y ofrecer escalamiento

Tono de Comunicación:
- Profesional pero amigable
- Claro y directo
- Empático con problemas del cliente
```

### How to Set It

1. Click **User Menu** (bottom-left, your name/email)
2. Click **"Prompt de Dominio"** (Building icon 🏢)
3. Enter your organization's guidance
4. Click **"Guardar Prompt de Dominio"**
5. Done! This now applies to ALL your agents ✅

---

## 🤖 Step 2: Customize Each Agent

### What to Include in Agent Prompts

Each agent prompt should define:
- **Role/expertise** of this specific agent
- **Main objective** or purpose
- **Response format** or structure
- **Special behaviors** for this agent
- **Limitations** specific to this role

### Example Agent Prompts

#### Customer Service Agent
```
Eres un asistente de servicio al cliente amigable y empático.

Tu objetivo es resolver consultas de clientes de manera efectiva.

Pautas:
- Escucha activamente las necesidades
- Ofrece soluciones paso a paso
- Usa emojis moderadamente (😊 ✅ 💡)
- Si no sabes algo, sé honesto

Formato:
1. Saludo personalizado
2. Confirmación de entendimiento
3. Solución o próximos pasos
4. Verificación de satisfacción
```

#### Logistics Coordinator
```
Eres un coordinador logístico experto en gestión de bodegas.

Tu objetivo es optimizar operaciones logísticas.

Áreas de experiencia:
- Gestión de inventarios
- Coordinación de transportes
- Procesos de recepción/despacho
- Trazabilidad de productos

Formato de respuesta:
1. Situación actual
2. Análisis
3. Recomendaciones
4. Seguimiento necesario
```

#### Data Analyst
```
Eres un analista de datos experto.

Tu objetivo es extraer insights accionables.

Capacidades:
- Análisis estadístico
- Identificación de tendencias
- Recomendaciones basadas en datos

Formato:
1. Resumen ejecutivo (2-3 puntos clave)
2. Análisis detallado
3. Insights (¿qué significa?)
4. Recomendaciones (¿qué hacer?)
```

### How to Set It

1. **Select an agent** from the left panel
2. Click the **gear icon** (⚙️) on the agent
3. Click **"Editar Prompt"** (green button with Sparkles ✨)
4. **Choose a template** from left panel (optional)
5. **Customize** the prompt text
6. **Preview** the combined result (Domain + Agent)
7. Click **"Guardar Prompt del Agente"**
8. Done! This agent now has custom behavior ✅

---

## 🎯 Using Templates

### Quick Start with Templates

Instead of writing from scratch, start with a template:

1. Open Agent Prompt Modal
2. Browse templates by category
3. Click a template to load it
4. Customize the text to fit your needs
5. Save

### Template Categories

- **Servicio al Cliente** - Customer support roles
- **Ventas y Negocios** - Sales and business development
- **Análisis de Datos** - Data analysis and insights
- **Creación de Contenido** - Marketing and content
- **Desarrollo** - Programming assistance
- **Educación** - Teaching and training
- **General** - All-purpose assistants
- **Logística y Operaciones** - Supply chain and operations

---

## ✨ How It Works

### When You Send a Message

```
1. You send: "¿Cuál es el estado del pedido #12345?"

2. System loads:
   - Domain Prompt (from Organization)
   - Agent Prompt (from this specific agent)

3. System combines:
   # Contexto de Dominio
   [Your organization's policies and values]
   
   # Instrucciones del Agente  
   [This agent's specific role and behavior]

4. AI responds following BOTH:
   - Organization policies (verify in system, professional tone)
   - Agent expertise (logistics knowledge, tracking format)

5. You receive accurate, on-brand response! ✅
```

---

## 💡 Best Practices

### Domain Prompt
✅ **DO:**
- Keep it concise (300-500 words)
- Focus on policies that apply to ALL agents
- Include company values and tone
- Mention critical compliance rules

❌ **DON'T:**
- Make it too specific to one role
- Include agent-specific instructions
- Make it too long (>1000 words)

### Agent Prompt
✅ **DO:**
- Be specific about this agent's role
- Define expected output format
- Include relevant examples
- Keep it focused on one expertise

❌ **DON'T:**
- Repeat domain-level policies (already inherited)
- Try to make one agent do everything
- Leave it empty (use a template!)

---

## 🔧 Troubleshooting

### "I don't see the Prompt de Dominio button"
- This is only visible for **non-user roles** (admin, expert, etc.)
- Check your user role

### "Agent prompt doesn't seem to work"
- Make sure you saved it (green "Guardar" button)
- Refresh the page
- Send a new message (old messages used old prompt)

### "Combined prompt is too long"
- Check combined preview in Agent Prompt Modal
- Shorten either domain or agent prompt
- Focus on essential guidance only

### "Existing agents lost their prompts"
- Run migration script: `npx tsx scripts/migrate-agent-prompts.ts`
- This copies `systemPrompt` → `agentPrompt`

---

## 📞 Need Help?

### Check These Resources
1. **Full Documentation:** `docs/features/hierarchical-prompts-2025-10-28.md`
2. **Implementation Details:** `docs/HIERARCHICAL_PROMPTS_SUMMARY.md`
3. **Prompt Templates:** `src/lib/promptTemplates.ts`

### Common Questions

**Q: Do I need both domain and agent prompts?**  
A: No! Both are optional. You can use:
- Just domain (all agents get same behavior)
- Just agent (each agent is independent)
- Both (recommended for organizations)
- Neither (uses default)

**Q: Can I edit domain prompt later?**  
A: Yes! Changes apply to all agents immediately.

**Q: Do old conversations use new prompts?**  
A: New messages use current prompts. Old messages keep old responses.

**Q: Can I have different domain prompts per team?**  
A: Not yet. Coming in future multi-organization update.

---

**Happy Prompting! 🎉**

