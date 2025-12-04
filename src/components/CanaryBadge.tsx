/**
 * Canary Badge Component
 * 
 * Shows when user is on canary version (testing)
 * Only visible to canary users
 */

import { useEffect, useState } from 'react';
import { Beaker, AlertTriangle } from 'lucide-react';

interface CanaryInfo {
  isCanary: boolean;
  version: string;
  rolloutPercentage: number;
}

export function CanaryBadge() {
  const [canaryInfo, setCanaryInfo] = useState<CanaryInfo | null>(null);
  const [show, setShow] = useState(true);
  
  useEffect(() => {
    async function checkCanary() {
      try {
        const response = await fetch('/api/version');
        const data = await response.json();
        
        if (data.isCanary) {
          setCanaryInfo({
            isCanary: true,
            version: data.version,
            rolloutPercentage: data.rolloutPercentage || 0
          });
        }
      } catch (error) {
        console.error('Error checking canary status:', error);
      }
    }
    
    checkCanary();
  }, []);
  
  if (!canaryInfo?.isCanary || !show) {
    return null;
  }
  
  return (
    <div className="fixed top-4 right-4 z-50 animate-in fade-in slide-in-from-top duration-300">
      <div className="bg-yellow-500 text-yellow-900 px-4 py-3 rounded-lg shadow-2xl border-2 border-yellow-600 max-w-sm">
        <div className="flex items-start gap-3">
          <Beaker className="w-5 h-5 mt-0.5 flex-shrink-0" />
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-sm">CANARY v{canaryInfo.version}</h3>
              {canaryInfo.rolloutPercentage > 0 && (
                <span className="text-xs bg-yellow-600 text-white px-2 py-0.5 rounded-full font-semibold">
                  {canaryInfo.rolloutPercentage}% rollout
                </span>
              )}
            </div>
            
            <p className="text-xs text-yellow-800 leading-relaxed">
              Estás probando una nueva versión. 
              {canaryInfo.rolloutPercentage === 0 ? (
                <span> Solo tú la ves.</span>
              ) : (
                <span> {canaryInfo.rolloutPercentage}% de usuarios la están probando.</span>
              )}
            </p>
            
            <div className="mt-2 flex items-center gap-2 text-xs">
              <AlertTriangle className="w-3 h-3" />
              <span>Reporta cualquier problema inmediatamente</span>
            </div>
          </div>
          
          <button
            onClick={() => setShow(false)}
            className="text-yellow-700 hover:text-yellow-900 flex-shrink-0"
            title="Ocultar badge"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

