/**
 * Prompt Utilities
 * Client-safe utilities for combining and formatting prompts
 */

/**
 * Combines domain-level and agent-level prompts into a single system instruction
 * @param domainPrompt - Organization/domain-level guidance
 * @param agentPrompt - Agent-specific instructions
 * @returns Combined prompt with proper formatting
 */
export function combineDomainAndAgentPrompts(
  domainPrompt: string | undefined,
  agentPrompt: string | undefined
): string {
  const parts: string[] = [];
  
  // Add domain prompt (organization-level guidance)
  if (domainPrompt && domainPrompt.trim()) {
    parts.push(`# Contexto de Dominio\n${domainPrompt.trim()}`);
  }
  
  // Add agent prompt (agent-specific behavior)
  if (agentPrompt && agentPrompt.trim()) {
    parts.push(`# Instrucciones del Agente\n${agentPrompt.trim()}`);
  }
  
  // If no prompts provided, return empty string (caller will use defaults)
  if (parts.length === 0) {
    return '';
  }
  
  // Combine with clear section separation
  return parts.join('\n\n---\n\n');
}

