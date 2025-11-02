/**
 * Console Logs API Endpoint
 * Receives browser console logs and saves to local file
 */

import type { APIRoute } from 'astro';
import fs from 'fs/promises';
import path from 'path';

interface ConsoleEntry {
  timestamp: string;
  type: 'log' | 'error' | 'warn' | 'info' | 'debug';
  message: string;
  stack?: string;
  url?: string;
  userAgent?: string;
}

interface LogRequest {
  logs: ConsoleEntry[];
  sessionId: string;
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json() as LogRequest;
    const { logs, sessionId } = body;

    if (!logs || !Array.isArray(logs)) {
      return new Response(
        JSON.stringify({ error: 'Invalid logs format' }),
        { status: 400 }
      );
    }

    // Determine log file path
    const logsDir = path.join(process.cwd(), 'docs', 'sessions');
    const logFile = path.join(logsDir, 'console.md');

    // Ensure directory exists
    await fs.mkdir(logsDir, { recursive: true });

    // Check if file exists, if not create with header
    try {
      await fs.access(logFile);
    } catch {
      await fs.writeFile(logFile, `# Browser Console Log\n\nAuto-generated log of browser console output.\n\n---\n\n`);
    }

    // Format log entries
    const formattedEntries = logs.map(entry => {
      const icon = {
        log: 'ℹ️',
        error: '❌',
        warn: '⚠️',
        info: 'ℹ️',
        debug: '🔍',
      }[entry.type];

      let content = `### ${icon} ${entry.type.toUpperCase()} - ${new Date(entry.timestamp).toLocaleString()}\n\n`;
      
      if (entry.url) {
        content += `**URL:** ${entry.url}\n\n`;
      }

      content += `**Message:**\n\`\`\`\n${entry.message}\n\`\`\`\n\n`;

      if (entry.stack) {
        content += `**Stack:**\n\`\`\`\n${entry.stack}\n\`\`\`\n\n`;
      }

      return content;
    }).join('');

    // Append to file
    const sessionHeader = `\n## Session: ${sessionId} - ${new Date().toISOString()}\n\n`;
    await fs.appendFile(logFile, sessionHeader + formattedEntries);

    console.log(`✅ Saved ${logs.length} console entries to ${logFile}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        count: logs.length,
        file: logFile,
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('❌ Failed to save console logs:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to save logs',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500 }
    );
  }
};

