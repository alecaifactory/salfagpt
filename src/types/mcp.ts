/**
 * MCP (Model Context Protocol) Types
 * 
 * Based on MCP specification for secure AI assistant access
 */

export interface MCPServer {
  id: string;
  name: string;
  description: string;
  type: 'usage-stats' | 'agent-management' | 'custom';
  createdBy: string; // SuperAdmin user ID
  createdAt: Date;
  updatedAt: Date;
  
  // Security
  apiKeyHash: string; // Hashed API key
  isActive: boolean;
  expiresAt?: Date;
  
  // Access Control
  assignedDomains: string[]; // Domains that can use this server
  allowedRoles: ('superadmin' | 'admin')[]; // Roles that can access
  
  // Configuration
  resources: string[]; // Available resource types
  endpoint: string; // API endpoint path
  
  // Metadata
  lastUsed?: Date;
  usageCount: number;
}

export interface MCPAPIKey {
  id: string;
  serverId: string;
  keyHash: string;
  keyPrefix: string; // First 8 chars for identification
  createdBy: string;
  createdAt: Date;
  expiresAt?: Date;
  isActive: boolean;
  lastUsed?: Date;
  usageCount: number;
  metadata?: {
    description?: string;
    environment?: 'localhost' | 'production';
  };
}

// MCP Protocol Types (Standard)
export interface MCPRequest {
  jsonrpc: '2.0';
  method: 'resources/list' | 'resources/read' | 'tools/list' | 'tools/call';
  params?: {
    uri?: string;
    name?: string;
    arguments?: Record<string, any>;
  };
  id: string | number;
}

export interface MCPResponse {
  jsonrpc: '2.0';
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
  id: string | number | null;
}

export interface MCPResource {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
  annotations?: {
    audience?: string[];
    priority?: number;
  };
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}

// Usage Stats Types
export interface UsageSummary {
  domain: string;
  period: string;
  totalAgents: number;
  totalConversations: number;
  totalMessages: number;
  activeUsers: number;
  totalCost: number;
  averageMessagesPerAgent: number;
  modelBreakdown: {
    flash: { count: number; percentage: number };
    pro: { count: number; percentage: number };
  };
  timestamp?: Date;
}

export interface AgentStats {
  agentId: string;
  agentTitle: string;
  conversationCount: number;
  messageCount: number;
  uniqueUsers: number;
  lastUsed: Date;
  model: string;
  averageResponseTime?: number;
  cost?: number;
}

export interface UserActivityStats {
  userId: string;
  email: string;
  name: string;
  role: string;
  totalAgents: number;
  totalMessages: number;
  lastActive: Date | null;
  cost?: number;
}

export interface CostBreakdown {
  domain: string;
  totalCost: number;
  byModel: {
    flash: number;
    pro: number;
  };
  byAgent: {
    flash: number;
    pro: number;
  };
  byUser?: Array<{
    userId: string;
    email: string;
    cost: number;
  }>;
}





