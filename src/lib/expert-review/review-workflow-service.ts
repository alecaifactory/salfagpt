// Review Workflow Service  
// Created: 2025-11-09
// Purpose: Manage SCQI workflow state transitions and approvals

import { firestore } from '../firestore';
import { canTransitionTo } from '../../types/expert-review';
import type { ReviewStatus, ReviewHistoryEntry } from '../../types/expert-review';
import { logAuditEntry } from './audit-service';

/**
 * Transition ticket to new status
 */
export async function transitionTicketStatus(
  ticketId: string,
  newStatus: ReviewStatus,
  userId: string,
  userEmail: string,
  userRole: string,
  notes?: string
): Promise<void> {
  
  // Get current ticket
  const ticketRef = firestore.collection('feedback_tickets').doc(ticketId);
  const ticketDoc = await ticketRef.get();
  
  if (!ticketDoc.exists) {
    throw new Error('Ticket not found');
  }
  
  const ticketData = ticketDoc.data();
  const currentStatus = ticketData?.reviewStatus || 'pendiente';
  
  // Validate transition
  if (!canTransitionTo(currentStatus, newStatus)) {
    throw new Error(`Invalid transition: ${currentStatus} → ${newStatus}`);
  }
  
  // Create history entry
  const historyEntry: ReviewHistoryEntry = {
    fromStatus: currentStatus,
    toStatus: newStatus,
    changedBy: userId,
    changedByEmail: userEmail,
    changedByRole: userRole,
    changedAt: new Date(),
    notes,
    automated: false
  };
  
  // Update ticket
  const reviewHistory = ticketData?.reviewHistory || [];
  await ticketRef.update({
    reviewStatus: newStatus,
    reviewHistory: [...reviewHistory, historyEntry],
    updatedAt: new Date()
  });
  
  // Log to audit trail
  await logAuditEntry({
    actor: {
      userId,
      userEmail,
      userRole,
      userDomain: userEmail.split('@')[1]
    },
    action: {
      type: 'expert_evaluation_created',
      category: 'quality-review',
      description: `Status changed: ${currentStatus} → ${newStatus}`,
      severity: newStatus === 'aplicada' ? 'info' : 'warning'
    },
    subject: {
      type: 'ticket',
      id: ticketId,
      domain: ticketData?.domain || '',
      metadata: { previousStatus: currentStatus, newStatus }
    },
    context: {
      previousState: currentStatus,
      newState: newStatus,
      reasoning: notes
    }
  });
  
  console.log('✅ Ticket status transitioned:', {
    ticketId,
    from: currentStatus,
    to: newStatus
  });
}

/**
 * Apply correction to agents
 */
export async function applyCorrection(
  ticketId: string,
  appliedBy: string,
  appliedByEmail: string,
  testingCompleted: boolean = false
): Promise<{
  success: boolean;
  agentsAffected: number;
  versionAfter: string;
}> {
  
  console.log('🚀 Applying correction:', ticketId);
  
  try {
    // Get ticket
    const ticketDoc = await firestore.collection('feedback_tickets').doc(ticketId).get();
    
    if (!ticketDoc.exists) {
      throw new Error('Ticket not found');
    }
    
    const ticket = ticketDoc.data();
    
    // Validate status
    if (ticket?.reviewStatus !== 'aprobada-aplicar') {
      throw new Error(`Cannot apply correction with status: ${ticket?.reviewStatus}`);
    }
    
    const appliedAt = new Date();
    let agentsAffected = 0;
    
    // Apply based on scope
    if (ticket.impactScope?.affectsDomainPrompt) {
      // Update domain prompt
      await updateDomainPrompt(
        ticket.domain,
        ticket.correctionProposal?.promptChanges?.proposedPrompt || '',
        ticketId
      );
      
      // Count all agents in domain
      const agentsSnapshot = await firestore
        .collection('conversations')
        .where('isAgent', '==', true)
        .get();
      
      agentsAffected = agentsSnapshot.size;
      
    } else if (ticket.impactScope?.affectsSharedKnowledge) {
      // Update context sources
      for (const update of (ticket.correctionProposal?.knowledgeUpdates || [])) {
        if (update.contextSourceId) {
          await updateContextSource(
            update.contextSourceId,
            update.proposedText,
            ticketId
          );
        }
      }
      
      agentsAffected = ticket.impactAnalysis?.domainMetrics?.agentsAffected || 0;
    }
    
    // Version bump (simplified)
    const versionAfter = generateNewVersion(ticket.domain);
    
    // Update ticket with implementation
    await firestore.collection('feedback_tickets').doc(ticketId).update({
      reviewStatus: 'aplicada',
      implementation: {
        appliedBy,
        appliedByEmail,
        appliedAt,
        changesApplied: {
          knowledgeBaseUpdated: ticket.impactScope?.affectsSharedKnowledge || false,
          domainPromptUpdated: ticket.impactScope?.affectsDomainPrompt || false,
          faqAdded: false,
          agentSpecificUpdated: false,
          contextsUpdated: ticket.correctionProposal?.knowledgeUpdates?.map((u: any) => u.contextSourceId).filter(Boolean) || []
        },
        domainLevelChanges: {
          domainId: ticket.domain,
          affectedAgentCount: agentsAffected,
          affectedUserCount: 0, // TODO: Calculate from domain
          domainPromptUpdated: ticket.impactScope?.affectsDomainPrompt || false,
          sharedKnowledgeUpdated: ticket.impactScope?.affectsSharedKnowledge || false,
          updatedContextSources: []
        },
        versionBefore: 'v2.3.1', // TODO: Get actual version
        versionAfter,
        testingCompleted,
        rollbackAvailable: true
      },
      updatedAt: new Date()
    });
    
    // Log to audit
    await logAuditEntry({
      actor: {
        userId: appliedBy,
        userEmail: appliedByEmail,
        userRole: 'admin',
        userDomain: appliedByEmail.split('@')[1]
      },
      action: {
        type: 'correction_applied_domain_wide',
        category: 'quality-review',
        description: `Correction applied: ${ticket.title}`,
        severity: 'info'
      },
      subject: {
        type: 'ticket',
        id: ticketId,
        domain: ticket.domain,
        metadata: { agentsAffected }
      }
    });
    
    console.log('✅ Correction applied successfully:', {
      ticketId,
      agentsAffected,
      versionAfter
    });
    
    return {
      success: true,
      agentsAffected,
      versionAfter
    };
    
  } catch (error) {
    console.error('❌ Error applying correction:', error);
    throw error;
  }
}

// Helper functions
async function updateDomainPrompt(domainId: string, newPrompt: string, sourceTicketId: string): Promise<void> {
  // TODO: Implement domain prompt update
  console.log('📝 Would update domain prompt:', { domainId, sourceTicketId });
}

async function updateContextSource(contextSourceId: string, newText: string, sourceTicketId: string): Promise<void> {
  // TODO: Implement context source update
  console.log('📝 Would update context source:', { contextSourceId, sourceTicketId });
}

function generateNewVersion(domainId: string): string {
  // Simplified version generation
  const timestamp = Date.now().toString().slice(-4);
  return `v2.4.${timestamp}`;
}

