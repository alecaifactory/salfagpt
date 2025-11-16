/**
 * APIs Tab Content - Delightful Developer API Experience
 * 
 * Features:
 * - Beautiful connection status display
 * - Clear getting started guide
 * - Usage metrics with visual indicators
 * - Quick actions with helpful tooltips
 * - NPS 98+ target: Every interaction delightful
 */

import React, { useState, useEffect } from 'react';
import { Key, Globe, TrendingUp, Code, CheckCircle, AlertCircle, ExternalLink, Copy, Sparkles, Zap } from 'lucide-react';

interface APIsTabContentProps {
  userEmail?: string;
  userId?: string;
}

export function APIsTabContent({ userEmail, userId }: APIsTabContentProps) {
  const [apiOrgs, setApiOrgs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  
  useEffect(() => {
    if (userId) {
      loadAPIOrganizations();
    }
  }, [userId]);
  
  async function loadAPIOrganizations() {
    setLoading(true);
    try {
      // TODO: Implement endpoint in Phase 3
      // const response = await fetch(`/api/v1/user/api-organizations?userId=${userId}`);
      // const data = await response.json();
      // setApiOrgs(data.organizations || []);
      setApiOrgs([]); // Empty for now
    } catch (error) {
      console.error('Error loading API orgs:', error);
      setApiOrgs([]);
    } finally {
      setLoading(false);
    }
  }
  
  const hasAPIAccess = apiOrgs.length > 0;
  
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }
  
  // Not connected state - Delightful onboarding
  if (!hasAPIAccess) {
    return (
      <div className="p-6 space-y-6">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-8 border-2 border-blue-200 dark:border-blue-700">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-600 rounded-xl">
              <Code className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                🚀 Flow Vision API
              </h3>
              <p className="text-slate-600 dark:text-slate-300 text-lg mb-4">
                Unlock Flow's powerful document processing in your own applications
              </p>
              
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="flex items-start gap-2">
                  <Sparkles className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">AI-Powered Extraction</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Extract text, tables, and data from any document</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Zap className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">Lightning Fast</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Process documents in seconds with Gemini AI</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Globe className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">RESTful API</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Simple, standard HTTP endpoints</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <TrendingUp className="w-5 h-5 text-purple-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">Scale Seamlessly</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">From prototype to production in minutes</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Getting Started Card */}
        <div className="bg-white dark:bg-slate-700 rounded-xl border-2 border-slate-200 dark:border-slate-600 p-6">
          <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-blue-600" />
            Getting Started
          </h4>
          
          <div className="space-y-4">
            {/* Step 1 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">Request API Access</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Contact your administrator to receive an invitation code
                </p>
              </div>
            </div>
            
            {/* Step 2 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">Install CLI</p>
                <div className="mt-2 bg-slate-900 dark:bg-slate-950 rounded-lg p-3 font-mono text-sm text-green-400 flex items-center justify-between">
                  <code>npm install -g @flow/cli</code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText('npm install -g @flow/cli');
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="ml-2 p-1.5 hover:bg-slate-800 rounded transition-colors"
                    title="Copy command"
                  >
                    {copied ? (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4 text-slate-400" />
                    )}
                  </button>
                </div>
              </div>
            </div>
            
            {/* Step 3 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">Authenticate</p>
                <div className="mt-2 bg-slate-900 dark:bg-slate-950 rounded-lg p-3 font-mono text-sm text-green-400">
                  <code>flow-cli login YOUR-INVITATION-CODE</code>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                  ⚠️ Use your business email (not gmail.com)
                </p>
              </div>
            </div>
            
            {/* Step 4 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center font-bold">
                ✓
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">Start Extracting!</p>
                <div className="mt-2 bg-slate-900 dark:bg-slate-950 rounded-lg p-3 font-mono text-sm text-green-400">
                  <code>flow-cli extract document.pdf</code>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* CTA */}
        <div className="flex items-center justify-between bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white">
          <div>
            <p className="font-bold text-lg mb-1">Ready to get started?</p>
            <p className="text-blue-100 text-sm">Request your invitation code today</p>
          </div>
          <button className="px-6 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors shadow-lg">
            Request API Access
          </button>
        </div>
      </div>
    );
  }
  
  // Connected state - Show organization info
  const org = apiOrgs[0];
  const usagePercent = (org.usage.currentMonthRequests / org.quotas.monthlyRequests * 100).toFixed(1);
  const usageColor = parseFloat(usagePercent) > 80 ? 'red' : parseFloat(usagePercent) > 50 ? 'yellow' : 'green';
  
  return (
    <div className="p-6 space-y-6">
      {/* Status Card */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-6 border-2 border-green-200 dark:border-green-700">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-600 rounded-lg">
              <Code className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Flow Vision API</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">Active and ready</p>
            </div>
          </div>
          <div className="px-4 py-2 bg-green-600 text-white rounded-full font-bold flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            Active
          </div>
        </div>
        
        {/* Organization Info */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Organization</p>
            <p className="font-bold text-slate-900 dark:text-white">{org.name}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Domain</p>
            <p className="font-bold text-slate-900 dark:text-white">{org.domain}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Tier</p>
            <p className="font-bold text-blue-600 uppercase">{org.tier}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Status</p>
            <p className="font-bold text-green-600 capitalize">{org.status}</p>
          </div>
        </div>
      </div>
      
      {/* Usage This Month */}
      <div className="bg-white dark:bg-slate-700 rounded-xl border-2 border-slate-200 dark:border-slate-600 p-6">
        <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          Usage This Month
        </h4>
        
        <div className="grid grid-cols-3 gap-6">
          {/* Requests */}
          <div>
            <div className="flex items-baseline gap-2 mb-2">
              <p className="text-3xl font-bold text-slate-900 dark:text-white">
                {org.usage.currentMonthRequests.toLocaleString()}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                / {org.quotas.monthlyRequests.toLocaleString()}
              </p>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">Requests</p>
            
            {/* Progress bar */}
            <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all ${
                  usageColor === 'red' ? 'bg-red-600' :
                  usageColor === 'yellow' ? 'bg-yellow-600' :
                  'bg-green-600'
                }`}
                style={{ width: `${Math.min(parseFloat(usagePercent), 100)}%` }}
              />
            </div>
            <p className={`text-xs font-semibold mt-1 ${
              usageColor === 'red' ? 'text-red-600' :
              usageColor === 'yellow' ? 'text-yellow-600' :
              'text-green-600'
            }`}>
              {usagePercent}% used
            </p>
          </div>
          
          {/* Documents */}
          <div>
            <p className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              {org.usage.totalDocumentsProcessed.toLocaleString()}
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400">Documents Processed</p>
          </div>
          
          {/* Cost */}
          <div>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
              ${org.usage.totalCost.toFixed(2)}
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400">Total Cost</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              ${(org.usage.totalCost / Math.max(org.usage.currentMonthRequests, 1)).toFixed(4)} per request
            </p>
          </div>
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-4">
        <button className="flex flex-col items-center gap-3 p-6 bg-white dark:bg-slate-700 rounded-xl border-2 border-slate-200 dark:border-slate-600 hover:border-blue-400 hover:shadow-lg transition-all group">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/40 rounded-xl group-hover:bg-blue-200 transition-colors">
            <TrendingUp className="w-6 h-6 text-blue-600" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-slate-900 dark:text-white">View Dashboard</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Analytics & insights</p>
          </div>
        </button>
        
        <button className="flex flex-col items-center gap-3 p-6 bg-white dark:bg-slate-700 rounded-xl border-2 border-slate-200 dark:border-slate-600 hover:border-purple-400 hover:shadow-lg transition-all group">
          <div className="p-3 bg-purple-100 dark:bg-purple-900/40 rounded-xl group-hover:bg-purple-200 transition-colors">
            <Key className="w-6 h-6 text-purple-600" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-slate-900 dark:text-white">Manage Keys</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Create, revoke, configure</p>
          </div>
        </button>
        
        <button 
          onClick={() => window.open('https://api.flow.ai/docs', '_blank')}
          className="flex flex-col items-center gap-3 p-6 bg-white dark:bg-slate-700 rounded-xl border-2 border-slate-200 dark:border-slate-600 hover:border-green-400 hover:shadow-lg transition-all group"
        >
          <div className="p-3 bg-green-100 dark:bg-green-900/40 rounded-xl group-hover:bg-green-200 transition-colors">
            <Code className="w-6 h-6 text-green-600" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-slate-900 dark:text-white flex items-center gap-1">
              Documentation
              <ExternalLink className="w-3 h-3" />
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">API reference & guides</p>
          </div>
        </button>
      </div>
      
      {/* Quick Start Code Example */}
      <div className="bg-slate-900 dark:bg-slate-950 rounded-xl p-6 border-2 border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-bold text-white flex items-center gap-2">
            <Code className="w-5 h-5" />
            Quick Start Example
          </h4>
          <button
            onClick={() => {
              const code = `const FlowAPI = require('@flow/sdk');\nconst client = new FlowAPI(process.env.FLOW_API_KEY);\nconst result = await client.extractDocument('document.pdf');\nconsole.log(result.extractedText);`;
              navigator.clipboard.writeText(code);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm text-white flex items-center gap-2 transition-colors"
          >
            {copied ? (
              <>
                <CheckCircle className="w-4 h-4 text-green-400" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy
              </>
            )}
          </button>
        </div>
        
        <pre className="text-sm text-green-400 font-mono overflow-x-auto">
{`const FlowAPI = require('@flow/sdk');

const client = new FlowAPI(process.env.FLOW_API_KEY);

const result = await client.extractDocument('document.pdf');

console.log(result.extractedText);`}
        </pre>
      </div>
      
      {/* Support */}
      <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600" />
          <div>
            <p className="font-semibold text-slate-900 dark:text-white">Need help?</p>
            <p className="text-sm text-slate-600 dark:text-slate-400">Our team is here to assist you</p>
          </div>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
          Contact Support
        </button>
      </div>
    </div>
  );
}

