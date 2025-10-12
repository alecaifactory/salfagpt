import { BigQuery } from '@google-cloud/bigquery';

// Initialize BigQuery client
// Prioritize process.env for Cloud Run
const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT || 
  (typeof import.meta !== 'undefined' && import.meta.env 
    ? import.meta.env.GOOGLE_CLOUD_PROJECT 
    : undefined);

const bigquery = new BigQuery({
  projectId: PROJECT_ID,
});

const DATASET_ID = 'flow_analytics';

// User role types
export type UserRole = 'admin' | 'analytics' | 'user';

// Check if user has analytics access
export function hasAnalyticsAccess(userEmail: string, userRole?: UserRole): boolean {
  // Admin users and analytics users have access
  const role = userRole || getUserRole(userEmail);
  return role === 'admin' || role === 'analytics';
}

// Simple role determination (can be enhanced with database lookups)
export function getUserRole(userEmail: string): UserRole {
  // For demo purposes, you can add admin emails here
  const adminEmails = (import.meta.env.ADMIN_EMAILS || '').split(',').map((e: string) => e.trim());
  const analyticsEmails = (import.meta.env.ANALYTICS_EMAILS || '').split(',').map((e: string) => e.trim());
  
  if (adminEmails.includes(userEmail)) {
    return 'admin';
  }
  if (analyticsEmails.includes(userEmail)) {
    return 'analytics';
  }
  return 'user';
}

// Analytics data types
export interface DailyMetrics {
  date: string;
  total_users: number;
  new_users: number;
  total_sessions: number;
  total_conversations: number;
  avg_conversations_per_session: number;
  avg_messages_per_conversation: number;
}

export interface MetricsSummary {
  total_users: number;
  daily_active_users: number;
  monthly_active_users: number;
  total_sessions_today: number;
  total_conversations_today: number;
  avg_session_duration_minutes: number;
}

// Generate sample data for demonstration
export function generateSampleDailyMetrics(days: number = 30): DailyMetrics[] {
  const data: DailyMetrics[] = [];
  const today = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // Generate realistic sample data with some variance
    const baseUsers = 1000 + Math.floor(Math.random() * 200);
    const growthFactor = 1 + (days - i) / days * 0.5; // Simulate growth over time
    
    data.push({
      date: date.toISOString().split('T')[0],
      total_users: Math.floor(baseUsers * growthFactor),
      new_users: Math.floor(10 + Math.random() * 30),
      total_sessions: Math.floor((500 + Math.random() * 200) * growthFactor),
      total_conversations: Math.floor((800 + Math.random() * 300) * growthFactor),
      avg_conversations_per_session: Number((1.2 + Math.random() * 0.8).toFixed(2)),
      avg_messages_per_conversation: Number((8 + Math.random() * 6).toFixed(2)),
    });
  }
  
  return data;
}

export function generateSampleSummary(): MetricsSummary {
  return {
    total_users: 1456,
    daily_active_users: 342,
    monthly_active_users: 1089,
    total_sessions_today: 728,
    total_conversations_today: 1243,
    avg_session_duration_minutes: 12.5,
  };
}

// BigQuery table schemas
export interface TableInfo {
  name: string;
  description: string;
  row_count: number;
  size_mb: number;
  last_modified: string;
}

// Get list of tables in the dataset
export async function getDatasetTables(): Promise<TableInfo[]> {
  try {
    const dataset = bigquery.dataset(DATASET_ID);
    const [tables] = await dataset.getTables();
    
    const tableInfos: TableInfo[] = await Promise.all(
      tables.map(async (table) => {
        const [metadata] = await table.getMetadata();
        return {
          name: table.id || '',
          description: metadata.description || 'No description',
          row_count: parseInt(metadata.numRows || '0'),
          size_mb: parseFloat((parseInt(metadata.numBytes || '0') / (1024 * 1024)).toFixed(2)),
          last_modified: new Date(parseInt(metadata.lastModifiedTime)).toISOString(),
        };
      })
    );
    
    return tableInfos;
  } catch (error) {
    console.error('Error fetching tables:', error);
    // Return sample data if BigQuery is not set up
    return generateSampleTables();
  }
}

// Generate sample table metadata
export function generateSampleTables(): TableInfo[] {
  return [
    {
      name: 'users',
      description: 'User profiles and authentication data',
      row_count: 1456,
      size_mb: 2.3,
      last_modified: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      name: 'sessions',
      description: 'User session tracking data',
      row_count: 8734,
      size_mb: 12.5,
      last_modified: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      name: 'conversations',
      description: 'Conversation metadata and history',
      row_count: 15623,
      size_mb: 45.2,
      last_modified: new Date(Date.now() - 1800000).toISOString(),
    },
    {
      name: 'messages',
      description: 'Individual messages within conversations',
      row_count: 187453,
      size_mb: 523.8,
      last_modified: new Date(Date.now() - 900000).toISOString(),
    },
    {
      name: 'analytics_events',
      description: 'User interaction and behavior events',
      row_count: 342891,
      size_mb: 156.4,
      last_modified: new Date(Date.now() - 600000).toISOString(),
    },
  ];
}

// Get sample rows from a table
export async function getTableSample(tableName: string, limit: number = 10): Promise<any[]> {
  try {
    const query = `
      SELECT *
      FROM \`${PROJECT_ID}.${DATASET_ID}.${tableName}\`
      LIMIT ${limit}
    `;
    
    const [rows] = await bigquery.query({ query });
    return rows;
  } catch (error) {
    console.error(`Error fetching sample from ${tableName}:`, error);
    // Return sample data based on table name
    return generateSampleTableData(tableName, limit);
  }
}

// Generate sample table data
export function generateSampleTableData(tableName: string, limit: number = 10): any[] {
  const samples: Record<string, any[]> = {
    users: Array.from({ length: limit }, (_, i) => ({
      user_id: `user_${1000 + i}`,
      email: `user${i}@example.com`,
      name: `User ${i}`,
      created_at: new Date(Date.now() - Math.random() * 30 * 86400000).toISOString(),
      last_login: new Date(Date.now() - Math.random() * 7 * 86400000).toISOString(),
    })),
    sessions: Array.from({ length: limit }, (_, i) => ({
      session_id: `session_${Math.random().toString(36).substr(2, 9)}`,
      user_id: `user_${1000 + Math.floor(Math.random() * 100)}`,
      started_at: new Date(Date.now() - Math.random() * 24 * 3600000).toISOString(),
      ended_at: new Date(Date.now() - Math.random() * 12 * 3600000).toISOString(),
      duration_minutes: Math.floor(5 + Math.random() * 30),
    })),
    conversations: Array.from({ length: limit }, (_, i) => ({
      conversation_id: `conv_${Math.random().toString(36).substr(2, 9)}`,
      session_id: `session_${Math.random().toString(36).substr(2, 9)}`,
      user_id: `user_${1000 + Math.floor(Math.random() * 100)}`,
      started_at: new Date(Date.now() - Math.random() * 24 * 3600000).toISOString(),
      message_count: Math.floor(3 + Math.random() * 20),
      status: ['active', 'completed', 'archived'][Math.floor(Math.random() * 3)],
    })),
    messages: Array.from({ length: limit }, (_, i) => ({
      message_id: `msg_${Math.random().toString(36).substr(2, 9)}`,
      conversation_id: `conv_${Math.random().toString(36).substr(2, 9)}`,
      user_id: `user_${1000 + Math.floor(Math.random() * 100)}`,
      content: `Sample message content ${i}`,
      role: ['user', 'assistant'][Math.floor(Math.random() * 2)],
      created_at: new Date(Date.now() - Math.random() * 24 * 3600000).toISOString(),
    })),
    analytics_events: Array.from({ length: limit }, (_, i) => ({
      event_id: `evt_${Math.random().toString(36).substr(2, 9)}`,
      user_id: `user_${1000 + Math.floor(Math.random() * 100)}`,
      event_type: ['page_view', 'click', 'conversation_start', 'message_sent'][Math.floor(Math.random() * 4)],
      event_data: '{"button": "send", "location": "chat"}',
      timestamp: new Date(Date.now() - Math.random() * 24 * 3600000).toISOString(),
    })),
  };
  
  return samples[tableName] || [];
}

// Export data as CSV
export function convertToCSV(data: any[]): string {
  if (data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Handle values with commas or quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    ),
  ];
  
  return csvRows.join('\n');
}

// Export data as JSON
export function convertToJSON(data: any[]): string {
  return JSON.stringify(data, null, 2);
}

