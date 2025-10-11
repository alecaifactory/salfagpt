import { BigQuery } from '@google-cloud/bigquery';
import { VertexAI } from '@google-cloud/vertexai';

const PROJECT_ID = import.meta.env.GOOGLE_CLOUD_PROJECT;
const LOCATION = import.meta.env.VERTEX_AI_LOCATION || 'us-central1';
const DATASET_ID = import.meta.env.BIGQUERY_DATASET || 'openflow_dataset';

// Initialize BigQuery client
// In production (Cloud Run), uses Workload Identity automatically
// In development, uses Application Default Credentials (gcloud auth)
export const bigquery = new BigQuery({
  projectId: PROJECT_ID,
  // No keyFilename needed - uses automatic authentication
});

// Initialize Vertex AI client
// In production (Cloud Run), uses Workload Identity automatically
// In development, uses Application Default Credentials (gcloud auth)
export const vertexAI = new VertexAI({
  project: PROJECT_ID,
  location: LOCATION,
  // No credentials needed - uses automatic authentication
});

// BigQuery helper functions
export async function insertUserSession(userId: string, sessionData: any) {
  const tableId = 'user_sessions';
  const rows = [{
    user_id: userId,
    session_data: JSON.stringify(sessionData),
    created_at: new Date().toISOString(),
  }];

  try {
    await bigquery
      .dataset(DATASET_ID)
      .table(tableId)
      .insert(rows);
    console.log(`Inserted session for user: ${userId}`);
  } catch (error) {
    console.error('Error inserting session:', error);
  }
}

export async function insertChatMessage(
  userId: string,
  message: string,
  role: 'user' | 'assistant'
) {
  const tableId = 'chat_messages';
  const rows = [{
    user_id: userId,
    message,
    role,
    timestamp: new Date().toISOString(),
  }];

  try {
    await bigquery
      .dataset(DATASET_ID)
      .table(tableId)
      .insert(rows);
  } catch (error) {
    console.error('Error inserting message:', error);
  }
}

export async function getUserChatHistory(userId: string, limit: number = 50) {
  const query = `
    SELECT message, role, timestamp
    FROM \`${PROJECT_ID}.${DATASET_ID}.chat_messages\`
    WHERE user_id = @userId
    ORDER BY timestamp DESC
    LIMIT @limit
  `;

  const options = {
    query,
    params: { userId, limit },
  };

  try {
    const [rows] = await bigquery.query(options);
    return rows;
  } catch (error) {
    console.error('Error fetching chat history:', error);
    return [];
  }
}

// Vertex AI helper functions
export async function generateAIResponse(prompt: string) {
  const generativeModel = vertexAI.getGenerativeModel({
    model: 'gemini-1.5-pro',
  });

  try {
    const result = await generativeModel.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });

    const response = result.response;
    return response.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated';
  } catch (error) {
    console.error('Error generating AI response:', error);
    throw error;
  }
}

// Initialize BigQuery tables (run once during setup)
export async function initializeBigQueryTables() {
  const dataset = bigquery.dataset(DATASET_ID);

  // Create dataset if it doesn't exist
  const [datasetExists] = await dataset.exists();
  if (!datasetExists) {
    await bigquery.createDataset(DATASET_ID);
    console.log(`Dataset ${DATASET_ID} created.`);
  }

  // Create user_sessions table
  const sessionsSchema = [
    { name: 'user_id', type: 'STRING', mode: 'REQUIRED' },
    { name: 'session_data', type: 'STRING', mode: 'REQUIRED' },
    { name: 'created_at', type: 'TIMESTAMP', mode: 'REQUIRED' },
  ];

  const sessionsTable = dataset.table('user_sessions');
  const [sessionsExists] = await sessionsTable.exists();
  if (!sessionsExists) {
    await dataset.createTable('user_sessions', { schema: sessionsSchema });
    console.log('Table user_sessions created.');
  }

  // Create chat_messages table
  const messagesSchema = [
    { name: 'user_id', type: 'STRING', mode: 'REQUIRED' },
    { name: 'message', type: 'STRING', mode: 'REQUIRED' },
    { name: 'role', type: 'STRING', mode: 'REQUIRED' },
    { name: 'timestamp', type: 'TIMESTAMP', mode: 'REQUIRED' },
  ];

  const messagesTable = dataset.table('chat_messages');
  const [messagesExists] = await messagesTable.exists();
  if (!messagesExists) {
    await dataset.createTable('chat_messages', { schema: messagesSchema });
    console.log('Table chat_messages created.');
  }
}

