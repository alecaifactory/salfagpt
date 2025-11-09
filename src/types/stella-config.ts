/**
 * 🪄 Stella Configuration Types
 * 
 * TypeScript interfaces for Stella CPO/CTO AI configuration.
 */

export interface StellaConfiguration {
  id: string;                    // 'stella-config'
  organizationId: string;        // 'salfacorp' | 'default-org'
  
  // Prompts
  organizationPrompt: string;    // Organization-wide context
  stellaRolePrompt: string;      // CPO/CTO role definition
  
  // Privacy Configuration
  privacyConfig: {
    hashUserIds: boolean;        // Hash userIds before sending to AI
    redactEmails: boolean;        // Redact email addresses
    encryptStrategicInfo: boolean; // Encrypt sensitive data
    auditTrail: boolean;         // Log every interaction
    piiDetection: boolean;       // Auto-detect and redact PII
  };
  
  // AI Configuration
  aiConfig: {
    model: 'gemini-2.5-flash' | 'gemini-2.5-pro';
    temperature: number;         // 0-1
    maxOutputTokens: number;     // Max response length
    topK?: number;               // Sampling parameter
    topP?: number;               // Nucleus sampling
  };
  
  // Context Sources (what data to include)
  contextSources: {
    roadmap: boolean;            // Roadmap items
    userStories: boolean;        // User stories
    bugs: boolean;               // Bug reports
    featureRequests: boolean;    // Feature requests
    performanceMetrics: boolean; // System performance
    userSatisfaction: boolean;   // CSAT/NPS scores
    agentPerformance: boolean;   // Agent analytics
    domainPrompts: boolean;      // Org prompts
    agentPrompts: boolean;       // All agent prompts
    infrastructure: boolean;     // Tech stack info
  };
  
  // Metadata
  updatedBy: string;             // SuperAdmin userId
  updatedByEmail: string;        // For audit
  updatedAt: Date;
  createdAt: Date;
  source: 'localhost' | 'production';
  
  // Version tracking
  version?: number;              // Config version
  previousVersionId?: string;    // For rollback
}

/**
 * Default Stella Configuration
 */
export const DEFAULT_STELLA_CONFIG: Omit<StellaConfiguration, 'id' | 'updatedAt' | 'createdAt' | 'updatedBy' | 'updatedByEmail' | 'source'> = {
  organizationId: 'default-org',
  
  organizationPrompt: `# Contexto Organizacional

Somos una organización que usa SalfaGPT como plataforma de agentes de IA.

Valores:
- Excelencia en servicio
- Innovación continua
- Privacidad y seguridad primero

Políticas:
- Respuestas claras y profesionales
- Si no sabes algo, indícalo claramente
- Prioriza la privacidad del usuario`,
  
  stellaRolePrompt: `# Stella - CPO/CTO AI Agent

## Tu Rol
Combinas expertise de:
- Chief Product Officer (visión, roadmap, priorización)
- Chief Technology Officer (arquitectura, performance, infraestructura)
- Security Officer (privacidad, compliance)

## Tu Objetivo
Ayudar a usuarios a documentar feedback accionable y proporcionar insights estratégicos sobre el producto.

## Tu Estilo
- Profesional pero accesible
- Conciso (2-3 oraciones)
- Data-driven (referencia métricas cuando relevante)
- Proactivo (sugiere acciones concretas)`,
  
  privacyConfig: {
    hashUserIds: true,
    redactEmails: true,
    encryptStrategicInfo: true,
    auditTrail: true,
    piiDetection: true,
  },
  
  aiConfig: {
    model: 'gemini-2.5-flash',
    temperature: 0.7,
    maxOutputTokens: 1000,
    topK: 40,
    topP: 0.95,
  },
  
  contextSources: {
    roadmap: true,
    userStories: true,
    bugs: true,
    featureRequests: true,
    performanceMetrics: false, // Expensive query, enable as needed
    userSatisfaction: false,
    agentPerformance: false,
    domainPrompts: false,
    agentPrompts: false,
    infrastructure: true,
  },
  
  version: 1,
};

/**
 * Stella Audit Log Entry
 */
export interface StellaAuditLog {
  id: string;
  hashedUserId: string;          // Privacy-safe user reference
  sessionId: string;             // Stella session ID
  category: 'bug' | 'feature' | 'improvement';
  
  // Request details
  userMessage: string;           // Redacted for PII
  attachmentsCount: number;
  
  // AI details
  modelUsed: string;
  temperature: number;
  systemPromptTokens: number;
  contextTokens: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  
  // Privacy tracking
  piiDetected: boolean;
  piiRedacted: boolean;
  strategicDataEncrypted: boolean;
  
  // Context tracking
  contextSourcesUsed: string[];  // Which sources were loaded
  
  // Response
  responseLength: number;
  responseTime: number;          // milliseconds
  
  // Metadata
  timestamp: Date;
  source: 'localhost' | 'production';
}

/**
 * Stella Configuration Update Request
 */
export interface StellaConfigUpdate {
  organizationPrompt?: string;
  stellaRolePrompt?: string;
  privacyConfig?: Partial<StellaConfiguration['privacyConfig']>;
  aiConfig?: Partial<StellaConfiguration['aiConfig']>;
  contextSources?: Partial<StellaConfiguration['contextSources']>;
}

