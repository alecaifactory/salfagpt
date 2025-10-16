// Agent Configuration Helper Functions
// Auto-categorization, difficulty assessment, and source detection

import type { InputExample, DetectedSource } from '../types/agent-config';

/**
 * Categorizes a question based on keywords
 */
export function categorizeQuestion(question: string): string {
  const q = question.toLowerCase();
  
  if (/permiso|autorización|aprobar|aprobación|otorgar/i.test(q)) {
    return 'Permisos y Autorizaciones';
  }
  if (/loteo|subdivisión|fusión de terrenos|fusión de lotes/i.test(q)) {
    return 'Loteos y Subdivisiones';
  }
  if (/condominio/i.test(q)) {
    return 'Condominios';
  }
  if (/conflicto|prevalece|contradice|restringe.*permite/i.test(q)) {
    return 'Conflictos Normativos';
  }
  if (/procedimiento|trámite|documentos.*presentar|requisitos.*presentar/i.test(q)) {
    return 'Procedimientos';
  }
  if (/cálculo|densidad|altura|rasante|impacto vial/i.test(q)) {
    return 'Cálculos Técnicos';
  }
  if (/jurisprudencia|dictámenes|dictamen/i.test(q)) {
    return 'Jurisprudencia y Dictámenes';
  }
  if (/regularizar|construcción antigua|zona no edificable/i.test(q)) {
    return 'Regularizaciones';
  }
  
  return 'General';
}

/**
 * Assesses difficulty of a question
 */
export function assessDifficulty(question: string): 'easy' | 'medium' | 'hard' {
  const q = question.toLowerCase();
  
  // Hard: Multiple conditions, conflicts, legal edge cases
  const hardSignals = [
    /qué pasa si.*y.*|qué pasa si.*pero/i,
    /cuál prevalece/i,
    /jurisprudencia.*existen/i,
    /dictámenes.*sobre/i,
    /derechos adquiridos/i,
    /\..*\..*\./  // Multiple sentences = complex
  ];
  
  if (hardSignals.some(pattern => pattern.test(q))) {
    return 'hard';
  }
  
  // Easy: Simple definitions, straightforward comparisons
  const easySignals = [
    /^qué es\b/i,
    /^cuál es la diferencia entre\b/i,
    /^qué requisitos se necesitan\b/i,
    /^es posible\b/i,
    /^puede\b/i
  ];
  
  if (easySignals.some(pattern => pattern.test(q))) {
    return 'easy';
  }
  
  // Medium: Everything else
  return 'medium';
}

/**
 * Detects required knowledge sources from question analysis
 */
export function detectRequiredSources(
  inputExamples: InputExample[]
): DetectedSource[] {
  const allText = inputExamples.map(e => e.question).join(' ').toLowerCase();
  
  const sourcesMap = [
    { 
      name: 'LGUC', 
      pattern: /lguc|ley general de urbanismo/gi,
      priority: 'critical' as const
    },
    { 
      name: 'OGUC', 
      pattern: /oguc|ordenanza general/gi,
      priority: 'critical' as const
    },
    { 
      name: 'DDU', 
      pattern: /ddu|dictámenes|dictamen.*minvu/gi,
      priority: 'critical' as const
    },
    { 
      name: 'Plan Regulador Comunal', 
      pattern: /prc|plan regulador comunal/gi,
      priority: 'recommended' as const
    },
    { 
      name: 'Plan Regulador Metropolitano', 
      pattern: /plan regulador metropolitano/gi,
      priority: 'recommended' as const
    },
    { 
      name: 'Código Civil', 
      pattern: /código civil/gi,
      priority: 'optional' as const
    }
  ];
  
  return sourcesMap
    .map(s => ({
      name: s.name,
      mentions: (allText.match(s.pattern) || []).length,
      isLoaded: false, // Will be updated by UI based on context sources
      priority: s.priority
    }))
    .filter(s => s.mentions > 0)
    .sort((a, b) => {
      // Sort by priority first, then mentions
      const priorityWeight = { critical: 3, recommended: 2, optional: 1 };
      const aPriority = priorityWeight[a.priority];
      const bPriority = priorityWeight[b.priority];
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }
      return b.mentions - a.mentions;
    });
}

/**
 * Infers domain from agent purpose text
 */
export function inferDomain(agentPurpose: string): string {
  const p = agentPurpose.toLowerCase();
  
  if (/legal|normativa|ley|regulación|jurídico/i.test(p)) {
    return 'Legal y Normativo';
  }
  if (/construcción|edificación|urbanismo|inmobiliario/i.test(p)) {
    return 'Desarrollo Inmobiliario';
  }
  if (/mantenimiento|reparación|maquinaria|equipo/i.test(p)) {
    return 'Mantenimiento y Operaciones';
  }
  if (/financiero|contable|presupuesto|costos/i.test(p)) {
    return 'Financiero';
  }
  if (/recursos humanos|rrhh|personal|talento/i.test(p)) {
    return 'Recursos Humanos';
  }
  if (/ventas|comercial|clientes/i.test(p)) {
    return 'Comercial';
  }
  if (/ti|tecnología|sistemas|software/i.test(p)) {
    return 'Tecnología';
  }
  
  return 'General';
}

/**
 * Extracts unique categories from input examples
 */
export function extractCategories(inputExamples: InputExample[]): string[] {
  const categories = new Set(inputExamples.map(e => e.category));
  return Array.from(categories).sort();
}

/**
 * Analyzes complexity distribution of input examples
 */
export function analyzeComplexityDistribution(
  inputExamples: InputExample[]
): { easy: number; medium: number; hard: number } {
  return {
    easy: inputExamples.filter(e => e.difficulty === 'easy').length,
    medium: inputExamples.filter(e => e.difficulty === 'medium').length,
    hard: inputExamples.filter(e => e.difficulty === 'hard').length,
  };
}

/**
 * Identifies departments from user list
 * Looks for common department keywords in user names/roles
 */
export function identifyDepartments(users: string[]): string[] {
  const allText = users.join(' ').toLowerCase();
  const departments = new Set<string>();
  
  const deptKeywords = [
    { pattern: /legal|fiscalía|abogado/i, name: 'Legal' },
    { pattern: /desarrollo|inmobiliario/i, name: 'Desarrollo Inmobiliario' },
    { pattern: /iaco/i, name: 'IACO' },
    { pattern: /construcción|obra/i, name: 'Construcción' },
    { pattern: /mantenimiento/i, name: 'Mantenimiento' },
    { pattern: /operaciones/i, name: 'Operaciones' },
    { pattern: /finanzas|contab/i, name: 'Finanzas' },
    { pattern: /rrhh|recursos humanos/i, name: 'Recursos Humanos' }
  ];
  
  deptKeywords.forEach(dept => {
    if (dept.pattern.test(allText)) {
      departments.add(dept.name);
    }
  });
  
  return Array.from(departments);
}

/**
 * Migration function: Convert old config format to new simplified format
 * Maintains backward compatibility
 */
export function migrateConfigToSimplified(oldConfig: any): any {
  return {
    // Core fields - direct mapping
    agentName: oldConfig.agentName,
    agentPurpose: oldConfig.agentPurpose,
    targetAudience: oldConfig.targetAudience || [],
    pilotUsers: oldConfig.pilotUsers || [], // NEW field - may not exist in old
    
    // Model & Behavior
    recommendedModel: oldConfig.recommendedModel || 'gemini-2.5-flash',
    systemPrompt: oldConfig.systemPrompt || '',
    tone: oldConfig.tone || 'professional',
    
    // Input/Output
    expectedInputTypes: oldConfig.expectedInputTypes || [],
    expectedInputExamples: oldConfig.expectedInputExamples || [],
    expectedOutputFormat: oldConfig.expectedOutputFormat || '',
    expectedOutputExamples: oldConfig.expectedOutputExamples || [],
    responseRequirements: oldConfig.responseRequirements || {
      citations: false,
      format: '',
      precision: 'approximate'
    },
    
    // Context Sources
    requiredContextSources: oldConfig.requiredContextSources || [],
    detectedSources: oldConfig.detectedSources, // NEW field - may not exist
    
    // Domain Expert
    domainExpert: oldConfig.domainExpert,
    
    // Optional/Legacy fields - preserve if they exist
    businessCase: oldConfig.businessCase,
    qualityCriteria: oldConfig.qualityCriteria,
    undesirableOutputs: oldConfig.undesirableOutputs,
    acceptanceCriteria: oldConfig.acceptanceCriteria,
    recommendedContextSources: oldConfig.recommendedContextSources,
    companyContext: oldConfig.companyContext,
    evaluationCriteria: oldConfig.evaluationCriteria,
    successMetrics: oldConfig.successMetrics,
    
    // Version control
    version: oldConfig.version,
    createdAt: oldConfig.createdAt,
    lastUpdatedAt: oldConfig.lastUpdatedAt || new Date(),
    lastUpdatedBy: oldConfig.lastUpdatedBy,
    approvedBy: oldConfig.approvedBy,
    approvedAt: oldConfig.approvedAt,
    certificationExpiresAt: oldConfig.certificationExpiresAt
  };
}

/**
 * Checks if config has all required fields for simplified format
 */
export function isConfigComplete(config: any): {
  isComplete: boolean;
  missingFields: string[];
  warnings: string[];
} {
  const missing: string[] = [];
  const warnings: string[] = [];
  
  // Required fields
  if (!config.agentName || config.agentName.trim() === '') {
    missing.push('agentName');
  }
  if (!config.agentPurpose || config.agentPurpose.length < 20) {
    missing.push('agentPurpose (debe tener al menos 20 caracteres)');
  }
  if (!config.targetAudience || config.targetAudience.length === 0) {
    missing.push('targetAudience (al menos 1 usuario)');
  }
  if (!config.expectedInputExamples || config.expectedInputExamples.length === 0) {
    missing.push('expectedInputExamples (al menos 1 pregunta)');
  }
  if (!config.systemPrompt || config.systemPrompt.trim() === '') {
    missing.push('systemPrompt');
  }
  
  // Warnings for recommended fields
  if (!config.pilotUsers || config.pilotUsers.length === 0) {
    warnings.push('pilotUsers no especificados - recomendado para testing');
  }
  if (!config.requiredContextSources || config.requiredContextSources.length === 0) {
    warnings.push('requiredContextSources vacío - agente sin conocimiento base');
  }
  if (!config.responseRequirements?.citations) {
    warnings.push('citations no requeridas - considera si el dominio requiere referencias');
  }
  if (!config.domainExpert) {
    warnings.push('domainExpert no especificado - sin responsable de validación');
  }
  
  return {
    isComplete: missing.length === 0,
    missingFields: missing,
    warnings
  };
}

