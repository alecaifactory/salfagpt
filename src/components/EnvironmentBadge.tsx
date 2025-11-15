import React from 'react';

/**
 * Environment Badge Component
 * 
 * Displays a prominent banner at the top of the screen when NOT in production
 * Helps developers and testers know which environment they're using
 * 
 * Environments:
 * - LOCAL: localhost:3000 (blue badge)
 * - QA: salfagpt-qa Cloud Run (yellow badge)
 * - PRODUCTION: salfagpt Cloud Run (no badge - clean UI for users)
 */
export function EnvironmentBadge() {
  // Only run in browser
  if (typeof window === 'undefined') return null;
  
  const getEnvironment = () => {
    const hostname = window.location.hostname;
    const href = window.location.href;
    
    // Localhost detection
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return { 
        name: 'LOCAL', 
        color: 'bg-blue-500',
        message: 'Development - Safe to test'
      };
    }
    
    // QA detection (multiple patterns)
    if (
      href.includes('salfagpt-qa') || 
      href.includes('cr-salfagpt-qa') ||
      href.includes('staging')
    ) {
      return { 
        name: 'QA', 
        color: 'bg-yellow-500',
        message: 'QA Environment - Not production'
      };
    }
    
    // Production detection
    if (href.includes('salfagpt-3snj65wckq') || href.includes('cr-salfagpt-ai-ft-prod')) {
      return null; // Don't show badge in production (clean UI)
    }
    
    // Unknown - show warning
    return { 
      name: 'UNKNOWN', 
      color: 'bg-red-500',
      message: 'Unknown environment - Verify configuration'
    };
  };
  
  const env = getEnvironment();
  
  if (!env) return null; // Production - no badge
  
  return (
    <div 
      className={`fixed top-0 left-0 right-0 z-50 ${env.color} text-white px-4 py-2 text-center text-sm font-semibold shadow-lg`}
      style={{ zIndex: 9999 }}
    >
      🌍 {env.name}: {env.message}
    </div>
  );
}

