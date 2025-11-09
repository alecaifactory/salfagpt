# 🚀 Expert Review System - Steps 5-10 Implementation Guide

**Purpose:** Complete step-by-step guide to finish the remaining 60% of the Expert Review System  
**Pre-requisite:** Steps 1-4 complete ✅  
**Timeline:** 4 weeks  
**Outcome:** Production-ready expert review system with full compliance

---

## 📋 Overview of Remaining Steps

```
Progress: ███████████░░░░░░░░░░░░░░░░░░░ 40% → 100%

✅ Step 1-4: DONE (Foundation + AI + Menu)
🔄 Step 5: Enhanced Expert Panel (6h)
🔄 Step 6: Supervisor Dashboard (12h)
🔄 Step 7: Specialist Panel (8h)
🔄 Step 8: Admin Tools (10h)
🔄 Step 9: Audit & Compliance (8h)
🔄 Step 10: Metrics & Dashboards (10h)

Total Remaining: 54 hours (~7 days of work)
```

---

## 🎯 STEP 5: Enhanced Expert Feedback Panel

### Goal
Upgrade existing `ExpertFeedbackPanel.tsx` to include:
- AI-suggested corrections display
- Correction type selector
- Scope selector (agent vs domain-wide)
- Document update selector
- Routing options (direct approval vs specialist assignment)

### Implementation

**File to Modify:** `src/components/ExpertFeedbackPanel.tsx`

**Add After Existing Rating Fields (~line 150):**

```typescript
// Import at top
import { generateCorrectionSuggestion } from '../lib/expert-review/ai-correction-service';
import { Sparkles, ChevronDown, ChevronUp } from 'lucide-react';

// Add state variables
const [aiSuggestion, setAiSuggestion] = useState<any>(null);
const [isGeneratingAI, setIsGeneratingAI] = useState(false);
const [showAlternatives, setShowAlternatives] = useState(false);
const [correctionType, setCorrectionType] = useState<string>('');
const [correctionScope, setCorrectionScope] = useState<string>('single-agent');
const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);

// Add function to generate AI suggestion
const generateAISuggestion = async () => {
  setIsGeneratingAI(true);
  try {
    const suggestion = await generateCorrectionSuggestion({
      userQuestion: "Question text here", // Get from props
      originalResponse: "Response text here", // Get from props
      expertNotes: expertNotes,
      contextUsed: [], // Get from message context
      agentPrompt: "Current agent prompt", // Get from agent config
      domainContext: {
        mission: "Domain mission if available",
        okrs: [],
        kpis: []
      }
    });
    setAiSuggestion(suggestion);
  } catch (error) {
    console.error('Error generating AI suggestion:', error);
  } finally {
    setIsGeneratingAI(false);
  }
};

// Trigger AI generation when expert selects "Inaceptable"
useEffect(() => {
  if (expertRating === 'inaceptable' && !aiSuggestion) {
    generateAISuggestion();
  }
}, [expertRating]);
```

**Add UI Section:**

```tsx
{/* AI Suggestion Section - Appears when rating = Inaceptable */}
{expertRating === 'inaceptable' && (
  <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-xl">
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-blue-600" />
        <h4 className="font-semibold text-blue-900">Sugerencia de IA</h4>
      </div>
      {aiSuggestion?.confidenceScore && (
        <span className="px-3 py-1 bg-blue-600 text-white rounded-full text-xs font-bold">
          {aiSuggestion.confidenceScore}% confianza
        </span>
      )}
    </div>
    
    {isGeneratingAI ? (
      <div className="flex items-center gap-3 text-blue-700 py-4">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-sm">Generando corrección sugerida con IA...</span>
      </div>
    ) : aiSuggestion ? (
      <>
        {/* Main AI suggestion */}
        <div className="bg-white p-4 rounded-lg border border-blue-200 mb-3">
          <p className="text-sm font-semibold text-blue-900 mb-2">
            Respuesta Mejorada Sugerida:
          </p>
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
            {aiSuggestion.suggestedCorrection}
          </p>
        </div>
        
        {/* Reasoning */}
        <div className="bg-white p-3 rounded-lg border border-blue-200 mb-3">
          <p className="text-xs font-semibold text-blue-800 mb-1">💡 Razonamiento:</p>
          <p className="text-xs text-slate-600 italic">{aiSuggestion.reasoning}</p>
        </div>
        
        {/* Impact preview */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="bg-white p-2 rounded border border-blue-200">
            <p className="text-[10px] text-blue-600 font-medium">Preguntas Similares</p>
            <p className="text-lg font-bold text-blue-900">
              {aiSuggestion.affectedSimilarQuestions}
            </p>
          </div>
          <div className="bg-white p-2 rounded border border-blue-200">
            <p className="text-[10px] text-blue-600 font-medium">Mejora Estimada</p>
            <p className="text-lg font-bold text-green-600">
              +{aiSuggestion.estimatedQualityImprovement}%
            </p>
          </div>
        </div>
        
        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => {
              setExpertNotes(aiSuggestion.suggestedCorrection);
              // Also set in correction proposal field when added
            }}
            className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            Usar Sugerencia de IA
          </button>
          <button
            onClick={() => setAiSuggestion(null)}
            className="px-3 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm hover:bg-slate-300"
          >
            Descartar
          </button>
        </div>
      </>
    ) : null}
  </div>
)}

{/* Correction Type Selector */}
<div className="mt-4 space-y-2">
  <label className="text-sm font-semibold text-purple-900">
    Tipo de Corrección *
  </label>
  <select
    value={correctionType}
    onChange={(e) => setCorrectionType(e.target.value)}
    className="w-full px-3 py-2 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500"
    required
  >
    <option value="">Seleccionar...</option>
    <option value="contenido">📚 Contenido / Conocimiento</option>
    <option value="regla">⚖️ Regla / Instrucción Prompt</option>
    <option value="faq">❓ FAQ / Snippet</option>
    <option value="tono">🎭 Ajuste de Redacción / Tono</option>
    <option value="fuera-alcance">🚫 Fuera de Alcance</option>
  </select>
</div>

{/* Scope Selector */}
<div className="mt-4 space-y-2">
  <label className="text-sm font-semibold text-purple-900">
    Alcance de Aplicación *
  </label>
  <div className="space-y-2">
    <label className="flex items-center gap-2 p-3 border border-purple-200 rounded-lg cursor-pointer hover:bg-purple-50">
      <input
        type="radio"
        name="scope"
        value="single-agent"
        checked={correctionScope === 'single-agent'}
        onChange={(e) => setCorrectionScope(e.target.value)}
      />
      <div>
        <p className="text-sm font-medium">Solo este agente</p>
        <p className="text-xs text-slate-600">Corrección específica para este agente solamente</p>
      </div>
    </label>
    
    <label className="flex items-center gap-2 p-3 border border-purple-200 rounded-lg cursor-pointer hover:bg-purple-50">
      <input
        type="radio"
        name="scope"
        value="shared-knowledge"
        checked={correctionScope === 'shared-knowledge'}
        onChange={(e) => setCorrectionScope(e.target.value)}
      />
      <div>
        <p className="text-sm font-medium">Conocimiento compartido (3-5 agentes)</p>
        <p className="text-xs text-slate-600">Actualizar documento compartido por varios agentes</p>
      </div>
    </label>
    
    <label className="flex items-center gap-2 p-3 border border-orange-300 rounded-lg cursor-pointer hover:bg-orange-50">
      <input
        type="radio"
        name="scope"
        value="domain-wide"
        checked={correctionScope === 'domain-wide'}
        onChange={(e) => setCorrectionScope(e.target.value)}
      />
      <div>
        <p className="text-sm font-medium">⚠️ Domain-wide (TODOS los agentes)</p>
        <p className="text-xs text-slate-600">Afecta domain prompt - requiere aprobación cuidadosa</p>
      </div>
    </label>
  </div>
</div>
```

**Time:** 6 hours  
**Complexity:** Medium (integrates with existing panel)

---

## 🎯 STEP 6: Supervisor Expert Panel (Main Interface)

### File Structure

**Create:** `src/components/expert-review/SupervisorExpertPanel.tsx` (~800 lines)

```typescript
// SupervisorExpertPanel.tsx - Main expert dashboard
import React, { useState, useEffect } from 'react';
import { 
  Award, 
  Filter, 
  Search, 
  Star, 
  AlertTriangle,
  Clock,
  Target,
  TrendingUp,
  Sparkles,
  User,
  Calendar
} from 'lucide-react';

interface SupervisorExpertPanelProps {
  userId: string;
  userEmail: string;
  userName: string;
  userRole: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function SupervisorExpertPanel({
  userId,
  userEmail,
  userName,
  userRole,
  isOpen,
  onClose
}: SupervisorExpertPanelProps) {
  
  const [priorityInteractions, setPriorityInteractions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('pendiente');
  const [filterPriority, setFilterPriority] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Get user domain
  const userDomain = userEmail.split('@')[1];
  
  // Personal stats
  const [stats, setStats] = useState({
    evaluatedThisMonth: 0,
    approvalRate: 0,
    ranking: 0,
    avgTimePerEval: 0
  });
  
  useEffect(() => {
    if (isOpen) {
      loadPriorityInteractions();
      loadPersonalStats();
    }
  }, [isOpen, filterStatus, userDomain]);
  
  const loadPriorityInteractions = async () => {
    setLoading(true);
    try {
      // Fetch priority interactions for this domain
      const response = await fetch(
        `/api/expert-review/interactions?domain=${userDomain}&status=${filterStatus}`,
        { credentials: 'include' }
      );
      
      if (response.ok) {
        const data = await response.json();
        setPriorityInteractions(data.interactions || []);
      }
    } catch (error) {
      console.error('Error loading interactions:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const loadPersonalStats = async () => {
    try {
      const response = await fetch(
        `/api/expert-review/stats?userId=${userId}&domain=${userDomain}`,
        { credentials: 'include' }
      );
      
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats || {});
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-amber-50 to-yellow-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Award className="w-8 h-8 text-amber-600" />
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  Panel Experto Supervisor
                </h2>
                <p className="text-sm text-slate-600">
                  {userName} • Domain: {userDomain}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
        
        {/* Personal Dashboard */}
        <div className="px-6 py-4 bg-gradient-to-r from-amber-50 to-yellow-50 border-b border-amber-200">
          <p className="text-xs font-semibold text-amber-900 mb-2">
            TU IMPACTO ESTE MES
          </p>
          <div className="grid grid-cols-4 gap-3">
            <div className="bg-white rounded-lg p-3 border border-amber-200">
              <p className="text-xs text-amber-700 mb-1">Evaluadas</p>
              <p className="text-2xl font-bold text-amber-900">{stats.evaluatedThisMonth}</p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-amber-200">
              <p className="text-xs text-amber-700 mb-1">Tasa Aprobación</p>
              <p className="text-2xl font-bold text-green-600">{stats.approvalRate}%</p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-amber-200">
              <p className="text-xs text-amber-700 mb-1">Ranking</p>
              <p className="text-2xl font-bold text-purple-600">#{stats.ranking}</p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-amber-200">
              <p className="text-xs text-amber-700 mb-1">Tiempo Promedio</p>
              <p className="text-2xl font-bold text-blue-600">{stats.avgTimePerEval}min</p>
            </div>
          </div>
        </div>
        
        {/* Filters */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
          <div className="grid grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar interacciones..."
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
              />
            </div>
            
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
            >
              <option value="pendiente">Pendientes</option>
              <option value="en-revision">En Revisión</option>
              <option value="corregida-propuesta">Propuestas</option>
              <option value="all">Todas</option>
            </select>
            
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
            >
              <option value="all">Todas las prioridades</option>
              <option value="critical">Críticas</option>
              <option value="high">Altas</option>
              <option value="medium">Medias</option>
            </select>
            
            <button
              onClick={loadPriorityInteractions}
              className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-medium"
            >
              Actualizar
            </button>
          </div>
        </div>
        
        {/* Interaction List */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
              <span className="ml-3 text-slate-600">Cargando interacciones...</span>
            </div>
          ) : priorityInteractions.length === 0 ? (
            <div className="text-center py-12">
              <Award className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-700 mb-2">
                No hay interacciones pendientes
              </h3>
              <p className="text-sm text-slate-500">
                Todas las interacciones prioritarias han sido evaluadas
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {priorityInteractions.map((interaction, idx) => (
                <div
                  key={interaction.id || idx}
                  className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-mono text-slate-500">
                          #{interaction.ticketId}
                        </span>
                        {interaction.isPriority && (
                          <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded">
                            PRIORITARIO
                          </span>
                        )}
                      </div>
                      <h4 className="font-semibold text-slate-900 mb-1">
                        {interaction.title}
                      </h4>
                      <p className="text-sm text-slate-600 mb-2">
                        {interaction.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {interaction.reportedByEmail}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(interaction.createdAt).toLocaleDateString()}
                        </span>
                        {interaction.aiSuggestion && (
                          <span className="flex items-center gap-1 text-blue-600">
                            <Sparkles className="w-3 h-3" />
                            IA: {interaction.aiSuggestion.confidenceScore}% confianza
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          // TODO: Open evaluation modal
                          console.log('Evaluating:', interaction.id);
                        }}
                        className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm font-medium"
                      >
                        Evaluar
                      </button>
                      <button
                        onClick={() => {
                          // TODO: Open assign specialist modal
                          console.log('Assigning:', interaction.id);
                        }}
                        className="px-4 py-2 border border-amber-600 text-amber-700 rounded-lg hover:bg-amber-50 text-sm font-medium"
                      >
                        Asignar
                      </button>
                    </div>
                  </div>
                  
                  {/* Quick preview of AI suggestion if available */}
                  {interaction.aiSuggestion && (
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-xs font-semibold text-blue-900 mb-1">
                        ✨ AI Suggestion Preview:
                      </p>
                      <p className="text-xs text-slate-700">
                        {interaction.aiSuggestion.suggestedCorrection.substring(0, 150)}...
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

**API Endpoint Needed:** `src/pages/api/expert-review/interactions.ts`

```typescript
import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';
import { firestore } from '../../../lib/firestore';

export const GET: APIRoute = async ({ request, cookies }) => {
  const session = getSession({ cookies });
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }
  
  const url = new URL(request.url);
  const domain = url.searchParams.get('domain');
  const status = url.searchParams.get('status') || 'pendiente';
  
  // Verify user can access this domain
  const userDomain = session.email.split('@')[1];
  if (session.role !== 'superadmin' && domain !== userDomain) {
    return new Response(JSON.stringify({ error: 'Forbidden - Domain mismatch' }), { 
      status: 403 
    });
  }
  
  try {
    // Get feedback tickets for this domain
    let query = firestore
      .collection('feedback_tickets')
      .where('domain', '==', domain);
    
    if (status !== 'all') {
      query = query.where('reviewStatus', '==', status);
    }
    
    const snapshot = await query
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();
    
    const interactions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
    }));
    
    return new Response(JSON.stringify({ interactions }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Error fetching interactions:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500
    });
  }
};
```

**Time:** 12 hours  
**Complexity:** High (main interface)

---

## 🎯 STEP 7-10: Remaining Components

Due to the extensive nature of Steps 7-10, I've created **complete implementation templates** in separate guide files. Here's the summary:

### Step 7: Specialist Panel (8h)
- Filtered view (only assigned interactions)
- Evaluation form
- Return to supervisor workflow
- "No aplica" action

### Step 8: Admin Approval Tools (10h)
- Approval queue interface
- Impact visualization card
- Batch correction panel
- Visual diff viewer
- Apply functionality

### Step 9: Audit & Compliance (8h)
- Audit trail auto-logging service
- SHA-256 hash verification
- Compliance report generator
- Export formats (PDF, Excel, JSON)

### Step 10: Metrics & Dashboards (10h)
- DQS calculation service
- Domain quality dashboard
- Expert performance dashboard
- User contribution funnel
- Gamification system

---

## 📚 Complete Implementation References

All implementation details are in:
1. `docs/EXPERT_REVIEW_COMPLETE_SPEC_2025-11-09.md` - Full technical spec with code samples
2. `docs/EXPERT_REVIEW_QUICK_START_STEPS_4-10.md` - Quick start per step
3. This file - Detailed guide for Steps 5-10

---

## ✅ Ready to Implement

**Foundation:** ✅ Complete (Steps 1-4)  
**Menu:** ✅ Integrated (EVALUACIONES visible)  
**AI Services:** ✅ Working (tested)  
**Documentation:** ✅ Comprehensive (10 docs)

**Next:** Implement Steps 5-10 sequentially or request specific step implementation

---

**Total Project Status:** 40% complete, clear path to 100%  
**Recommendation:** Continue with Step 5 (Enhanced Expert Panel) next session 🚀

