/**
 * Document Viewer Wrapper with Bug Report Integration
 * 
 * Wraps DocumentViewerModal and adds bug reporting for missing files
 */

import React, { useState, useEffect } from 'react';
import DocumentViewerModal from './DocumentViewerModal';
import MissingFileBugReportModal from './MissingFileBugReportModal';
import type { ContextSource } from '../types/context';

interface DocumentViewerWithBugReportProps {
  source: ContextSource;
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userEmail: string;
  userName: string;
  agentName?: string;
}

export default function DocumentViewerWithBugReport(props: DocumentViewerWithBugReportProps) {
  const [showBugReport, setShowBugReport] = useState(false);
  const [bugReportData, setBugReportData] = useState<any>(null);
  
  // Listen for messages from iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.action === 'reportMissingFile') {
        console.log('📨 Received bug report request:', event.data);
        setBugReportData(event.data);
        setShowBugReport(true);
      }
    };
    
    if (props.isOpen) {
      window.addEventListener('message', handleMessage);
      return () => window.removeEventListener('message', handleMessage);
    }
  }, [props.isOpen]);
  
  return (
    <>
      <DocumentViewerModal {...props} />
      
      {showBugReport && bugReportData && (
        <MissingFileBugReportModal
          isOpen={showBugReport}
          onClose={() => {
            setShowBugReport(false);
            setBugReportData(null);
          }}
          sourceId={bugReportData.sourceId}
          sourceName={bugReportData.sourceName}
          agentName={props.agentName}
          userId={props.userId}
          userEmail={props.userEmail}
          userName={props.userName}
          diagnostic={{
            hasExtractedData: bugReportData.diagnostic?.hasExtractedData,
            hasStoragePath: bugReportData.diagnostic?.hasStoragePath,
            extractedDataSize: bugReportData.diagnostic?.extractedDataSize,
            sourceUserId: bugReportData.diagnostic?.sourceUserId,
            storagePath: bugReportData.storagePath,
          }}
        />
      )}
    </>
  );
}






