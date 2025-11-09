// Export Button Component
// Created: 2025-11-09
// Purpose: Export interactions and evaluations to .xlsx format

import React, { useState } from 'react';
import { Download, Loader2, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';

interface ExportButtonProps {
  userId: string;
  userRole: string;
  domainId?: string;
  agentId?: string;
  filters?: {
    dateRange?: { start: Date; end: Date };
    state?: string;
    priority?: string;
    rating?: { min: number; max: number };
  };
}

export default function ExportButton({
  userId,
  userRole,
  domainId,
  agentId,
  filters
}: ExportButtonProps) {
  
  const [exporting, setExporting] = useState(false);

  // Check permissions
  const canExport = ['admin', 'superadmin', 'supervisor'].includes(userRole);

  if (!canExport) {
    return null; // Don't show button
  }

  const handleExport = async () => {
    try {
      setExporting(true);

      // Fetch data to export
      const queryParams = new URLSearchParams({
        userId,
        ...(domainId && { domainId }),
        ...(agentId && { agentId }),
        ...(filters?.state && { state: filters.state }),
        ...(filters?.priority && { priority: filters.priority })
      });

      const response = await fetch(
        `/api/expert-review/export?${queryParams.toString()}`
      );

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const data = await response.json();
      
      // Create workbook
      const workbook = XLSX.utils.book_new();

      // Sheet 1: Interactions
      const interactionsData = data.interactions.map((interaction: any) => ({
        'Fecha': new Date(interaction.timestamp).toLocaleString('es-CL'),
        'Domain': interaction.domain,
        'Usuario': interaction.userEmail,
        'Pregunta': interaction.userQuery,
        'Respuesta': interaction.assistantResponse?.substring(0, 500),
        'Rating Usuario': interaction.userStars || 'N/A',
        'Prioridad': interaction.priority || 'N/A',
        'Estado': interaction.status || 'Pendiente'
      }));

      const ws1 = XLSX.utils.json_to_sheet(interactionsData);
      XLSX.utils.book_append_sheet(workbook, ws1, 'Interacciones');

      // Sheet 2: Evaluations (if exist)
      if (data.evaluations && data.evaluations.length > 0) {
        const evaluationsData = data.evaluations.map((evaluation: any) => ({
          'Fecha Evaluación': new Date(evaluation.evaluatedAt).toLocaleString('es-CL'),
          'Expert': evaluation.expertName,
          'Calificación': evaluation.expertRating,
          'NPS': evaluation.npsScore,
          'CSAT': evaluation.csatScore,
          'Tipo Corrección': evaluation.correctionType,
          'Propuesta': evaluation.proposedCorrection?.substring(0, 500),
          'Estado': evaluation.status,
          'Aprobado Por': evaluation.approvedBy || 'Pendiente'
        }));

        const ws2 = XLSX.utils.json_to_sheet(evaluationsData);
        XLSX.utils.book_append_sheet(workbook, ws2, 'Evaluaciones');
      }

      // Sheet 3: Stats Summary
      const statsData = [
        { 'Métrica': 'Total Interacciones', 'Valor': data.interactions.length },
        { 'Métrica': 'Con Rating', 'Valor': data.interactions.filter((i: any) => i.userStars).length },
        { 'Métrica': 'Prioritarias', 'Valor': data.interactions.filter((i: any) => i.priority === 'high').length },
        { 'Métrica': 'Evaluadas', 'Valor': data.evaluations?.length || 0 },
        { 'Métrica': 'Aprobadas', 'Valor': data.evaluations?.filter((e: any) => e.status === 'approved').length || 0 },
        { 'Métrica': 'Aplicadas', 'Valor': data.evaluations?.filter((e: any) => e.status === 'applied').length || 0 }
      ];

      const ws3 = XLSX.utils.json_to_sheet(statsData);
      XLSX.utils.book_append_sheet(workbook, ws3, 'Resumen');

      // Generate filename
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `expert-review-export-${domainId || 'all'}-${timestamp}.xlsx`;

      // Download
      XLSX.writeFile(workbook, filename);

      console.log(`✅ Exported to ${filename}`);

    } catch (error) {
      console.error('❌ Export failed:', error);
      alert('Error al exportar. Por favor intenta de nuevo.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={exporting}
      className={`
        flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm
        transition-all
        ${exporting
          ? 'bg-slate-300 text-slate-600 cursor-not-allowed'
          : 'bg-green-600 text-white hover:bg-green-700 hover:shadow-md'
        }
      `}
      title="Exportar a Excel"
    >
      {exporting ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Exportando...</span>
        </>
      ) : (
        <>
          <FileSpreadsheet className="w-4 h-4" />
          <span>Exportar .xlsx</span>
        </>
      )}
    </button>
  );
}

