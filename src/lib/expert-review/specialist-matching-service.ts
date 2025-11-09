// Specialist Matching Service
// Created: 2025-11-09
// Purpose: AI-powered specialist recommendation for complex reviews

import { GoogleGenAI } from '@google/genai';
import { firestore } from '../firestore';
import type { SpecialistMatch, DomainReviewConfig } from '../../types/expert-review';

const genAI = new GoogleGenAI({ 
  apiKey: process.env.GOOGLE_AI_API_KEY || '' 
});

/**
 * Find best specialist for an interaction using AI-powered matching
 * 
 * @param interaction - Interaction details
 * @param domainId - Domain to search specialists in
 * @param excludeSpecialistIds - Specialists to exclude
 * @returns Top 3 specialist matches with scores
 */
export async function findBestSpecialist(
  interaction: {
    userQuestion: string;
    aiResponse: string;
    expertNotes: string;
    category: string;
  },
  domainId: string,
  excludeSpecialistIds: string[] = []
): Promise<SpecialistMatch[]> {
  
  console.log('🎯 Finding best specialist for domain:', domainId);
  
  try {
    // 1. Get domain review config with specialists
    const config = await getDomainReviewConfig(domainId);
    
    if (!config || !config.specialists || config.specialists.length === 0) {
      console.warn('⚠️ No specialists configured for domain:', domainId);
      return [];
    }
    
    // 2. Filter by domain and exclusions
    const availableSpecialists = config.specialists.filter(s => 
      !excludeSpecialistIds.includes(s.userId)
    );
    
    if (availableSpecialists.length === 0) {
      console.warn('⚠️ No available specialists after filtering');
      return [];
    }
    
    // 3. Extract topics from interaction using AI
    const topics = await extractTopicsFromInteraction(interaction);
    
    console.log(`   Extracted topics:`, topics);
    
    // 4. Get specialist stats (workload, performance)
    const specialistStats = await Promise.all(
      availableSpecialists.map(s => getSpecialistStats(s.userId))
    );
    
    // 5. Calculate match scores
    const matches: SpecialistMatch[] = availableSpecialists.map((specialist, idx) => {
      const stats = specialistStats[idx];
      
      // Calculate topic relevance (keyword overlap)
      const topicRelevance = calculateTopicOverlap(topics, specialist.domains);
      
      // Calculate workload score (inverse of current load)
      const workloadScore = calculateWorkloadScore(
        stats.currentAssignments,
        specialist.maxConcurrentAssignments
      );
      
      // Calculate performance score
      const performanceScore = calculatePerformanceScore(
        stats.approvalRate,
        stats.avgResponseTime
      );
      
      // Weighted match score
      const matchScore = Math.round(
        (topicRelevance * 0.50) +      // Topic match most important (50%)
        (workloadScore * 0.20) +       // Workload balance (20%)
        (performanceScore * 0.30)      // Historical performance (30%)
      ) * 100;
      
      // Build match reasons
      const matchReasons = [
        {
          reason: `${Math.round(topicRelevance * 100)}% relevancia temática`,
          weight: topicRelevance * 0.50,
          description: `Expertise en: ${specialist.specialty}`
        },
        {
          reason: `${stats.currentAssignments}/${specialist.maxConcurrentAssignments} asignaciones actuales`,
          weight: workloadScore * 0.20,
          description: workloadScore > 0.7 ? 'Carga baja - disponible' : 'Carga moderada'
        },
        {
          reason: `${Math.round(stats.approvalRate * 100)}% tasa de aprobación histórica`,
          weight: performanceScore * 0.30,
          description: stats.approvalRate > 0.85 ? 'Excelente track record' : 'Buen track record'
        },
        {
          reason: `Responde en ${stats.avgResponseTime.toFixed(1)}h promedio`,
          weight: 0,
          description: stats.avgResponseTime < 6 ? 'Muy rápido' : stats.avgResponseTime < 12 ? 'Rápido' : 'Tiempo estándar'
        }
      ];
      
      return {
        specialistId: specialist.userId,
        specialistName: specialist.name,
        specialistEmail: specialist.userEmail,
        specialty: specialist.specialty,
        matchScore,
        matchReasons,
        expertise: specialist.domains,
        domains: specialist.domains,
        currentWorkload: stats.currentAssignments,
        maxWorkload: specialist.maxConcurrentAssignments,
        avgResponseTime: stats.avgResponseTime,
        approvalRate: stats.approvalRate,
        specialtyRelevance: topicRelevance,
        isAvailable: stats.currentAssignments < specialist.maxConcurrentAssignments,
        nextAvailableDate: stats.currentAssignments >= specialist.maxConcurrentAssignments 
          ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 1 week from now
          : undefined,
        estimatedResponseTime: stats.avgResponseTime
      };
    });
    
    // 6. Sort by match score (highest first)
    const sortedMatches = matches.sort((a, b) => b.matchScore - a.matchScore);
    
    // 7. Return top 3
    const top3 = sortedMatches.slice(0, 3);
    
    console.log('✅ Top specialist matches:', top3.map(m => ({
      name: m.specialistName,
      score: m.matchScore
    })));
    
    return top3;
    
  } catch (error) {
    console.error('❌ Error finding specialist:', error);
    return [];
  }
}

/**
 * Extract topics from interaction using AI
 */
async function extractTopicsFromInteraction(
  interaction: {
    userQuestion: string;
    aiResponse: string;
    expertNotes: string;
    category: string;
  }
): Promise<string[]> {
  
  const prompt = `Extrae los temas principales de esta interacción (máximo 5 temas).

PREGUNTA: "${interaction.userQuestion}"
RESPUESTA: "${interaction.aiResponse.substring(0, 200)}..."
NOTAS EXPERTO: "${interaction.expertNotes}"
CATEGORÍA: ${interaction.category}

Identifica temas específicos como: "ventas", "facturación", "LATAM", "legal", "técnico", "logística", etc.

Responde con un array JSON de temas (solo el array):
["tema1", "tema2", "tema3"]

SOLO el array JSON, sin texto antes o después.`;

  try {
    const result = await genAI.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.1,
        maxOutputTokens: 200,
        responseMimeType: 'application/json'
      }
    });
    
    const topics = JSON.parse(result.text || '[]');
    return Array.isArray(topics) ? topics : [];
    
  } catch (error) {
    console.error('❌ Error extracting topics:', error);
    
    // Fallback: Use category as single topic
    return [interaction.category];
  }
}

/**
 * Calculate topic overlap between interaction and specialist
 */
function calculateTopicOverlap(
  interactionTopics: string[],
  specialistDomains: string[]
): number {
  if (interactionTopics.length === 0 || specialistDomains.length === 0) {
    return 0;
  }
  
  // Normalize to lowercase
  const topicsLower = interactionTopics.map(t => t.toLowerCase());
  const domainsLower = specialistDomains.map(d => d.toLowerCase());
  
  // Count matches
  let matches = 0;
  for (const topic of topicsLower) {
    for (const domain of domainsLower) {
      // Exact match or substring match
      if (topic === domain || topic.includes(domain) || domain.includes(topic)) {
        matches++;
        break; // Count each topic only once
      }
    }
  }
  
  // Return as ratio
  return matches / interactionTopics.length;
}

/**
 * Calculate workload score (0-1, higher is better = less loaded)
 */
function calculateWorkloadScore(
  currentAssignments: number,
  maxAssignments: number
): number {
  if (maxAssignments === 0) return 0;
  
  const loadRatio = currentAssignments / maxAssignments;
  return Math.max(0, 1 - loadRatio); // Inverse: less load = higher score
}

/**
 * Calculate performance score based on historical data
 */
function calculatePerformanceScore(
  approvalRate: number,        // 0-1
  avgResponseTime: number       // Hours
): number {
  // Approval rate contributes 70%
  const approvalScore = approvalRate * 0.7;
  
  // Speed contributes 30% (faster = better, cap at 48h)
  const speedScore = Math.max(0, 1 - (avgResponseTime / 48)) * 0.3;
  
  return approvalScore + speedScore;
}

/**
 * Get domain review configuration
 */
async function getDomainReviewConfig(domainId: string): Promise<DomainReviewConfig | null> {
  try {
    const doc = await firestore
      .collection('domain_review_config')
      .doc(domainId)
      .get();
    
    if (!doc.exists) {
      console.warn(`⚠️ No review config for domain: ${domainId}`);
      return null;
    }
    
    const data = doc.data();
    return {
      id: doc.id,
      domainName: data?.domainName || domainId,
      priorityThresholds: data?.priorityThresholds || {
        userStarThreshold: 3,
        expertRatingThreshold: 'inaceptable',
        autoFlagInaceptable: true,
        minimumSimilarQuestions: 5
      },
      supervisors: data?.supervisors || [],
      specialists: data?.specialists || [],
      implementers: data?.implementers || [],
      notifications: data?.notifications || {},
      automation: data?.automation || {},
      customSettings: data?.customSettings || {},
      createdAt: data?.createdAt?.toDate() || new Date(),
      updatedAt: data?.updatedAt?.toDate() || new Date(),
      createdBy: data?.createdBy || '',
      source: data?.source || 'localhost'
    } as DomainReviewConfig;
    
  } catch (error) {
    console.error('❌ Error getting domain review config:', error);
    return null;
  }
}

/**
 * Get specialist performance stats
 */
async function getSpecialistStats(specialistId: string): Promise<{
  currentAssignments: number;
  approvalRate: number;
  avgResponseTime: number;
}> {
  
  try {
    // Get current assignments
    const assignmentsSnapshot = await firestore
      .collection('feedback_tickets')
      .where('expertAssignment.assignedTo', '==', specialistId)
      .where('reviewStatus', 'in', ['asignada-especialista', 'revision-especialista'])
      .get();
    
    const currentAssignments = assignmentsSnapshot.size;
    
    // Get historical performance (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const historySnapshot = await firestore
      .collection('feedback_tickets')
      .where('expertAssignment.assignedTo', '==', specialistId)
      .where('expertAssignment.completedAt', '>=', thirtyDaysAgo)
      .get();
    
    if (historySnapshot.empty) {
      // No history, return defaults
      return {
        currentAssignments,
        approvalRate: 0.80, // Assume 80% default
        avgResponseTime: 12 // Assume 12h default
      };
    }
    
    // Calculate approval rate
    const completed = historySnapshot.docs;
    const approved = completed.filter(doc => {
      const data = doc.data();
      return data.approvalWorkflow?.adminApproval !== undefined;
    });
    const approvalRate = approved.length / completed.length;
    
    // Calculate average response time
    const responseTimes = completed.map(doc => {
      const data = doc.data();
      const assignedAt = data.expertAssignment?.assignedAt?.toDate?.();
      const completedAt = data.expertAssignment?.completedAt?.toDate?.();
      
      if (assignedAt && completedAt) {
        return (completedAt.getTime() - assignedAt.getTime()) / (1000 * 60 * 60); // Hours
      }
      return null;
    }).filter(t => t !== null) as number[];
    
    const avgResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length
      : 12; // Default 12h
    
    return {
      currentAssignments,
      approvalRate: Math.min(1, Math.max(0, approvalRate)),
      avgResponseTime: Math.max(1, avgResponseTime) // Minimum 1h
    };
    
  } catch (error) {
    console.error('❌ Error getting specialist stats:', error);
    
    // Return safe defaults
    return {
      currentAssignments: 0,
      approvalRate: 0.80,
      avgResponseTime: 12
    };
  }
}

