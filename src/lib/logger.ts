import { Logging } from '@google-cloud/logging';

// Initialize Cloud Logging
const logging = new Logging({
  projectId: process.env.GOOGLE_CLOUD_PROJECT || process.env.VITE_GOOGLE_CLOUD_PROJECT,
});

const log = logging.log('pame-ai');

export interface LogMetadata {
  userId?: string;
  conversationId?: string;
  action?: string;
  duration_ms?: number;
  error?: string;
  [key: string]: any;
}

export interface Logger {
  info: (message: string, metadata?: LogMetadata) => Promise<void>;
  warn: (message: string, metadata?: LogMetadata) => Promise<void>;
  error: (message: string, error?: Error, metadata?: LogMetadata) => Promise<void>;
  metric: (metricName: string, value: number, metadata?: LogMetadata) => Promise<void>;
  startTimer: () => {
    end: (operation: string, metadata?: LogMetadata) => Promise<number>;
  };
}

/**
 * Structured logger for PAME.AI
 * Follows production best practices for observability
 */
export const logger: Logger = {
  /**
   * Log informational messages
   */
  info: async (message: string, metadata?: LogMetadata) => {
    console.log(`[INFO] ${message}`, metadata);
    
    // Only write to Cloud Logging in production
    if (process.env.NODE_ENV === 'production') {
      try {
        const entry = log.entry(
          { severity: 'INFO', resource: { type: 'cloud_run_revision' } },
          { 
            message, 
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV,
            ...sanitizeMetadata(metadata)
          }
        );
        await log.write(entry);
      } catch (error) {
        console.error('Failed to write log to Cloud Logging:', error);
      }
    }
  },

  /**
   * Log warning messages
   */
  warn: async (message: string, metadata?: LogMetadata) => {
    console.warn(`[WARN] ${message}`, metadata);
    
    if (process.env.NODE_ENV === 'production') {
      try {
        const entry = log.entry(
          { severity: 'WARNING', resource: { type: 'cloud_run_revision' } },
          { 
            message, 
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV,
            ...sanitizeMetadata(metadata)
          }
        );
        await log.write(entry);
      } catch (error) {
        console.error('Failed to write log to Cloud Logging:', error);
      }
    }
  },

  /**
   * Log error messages
   */
  error: async (message: string, error?: Error, metadata?: LogMetadata) => {
    console.error(`[ERROR] ${message}`, error, metadata);
    
    if (process.env.NODE_ENV === 'production') {
      try {
        const entry = log.entry(
          { severity: 'ERROR', resource: { type: 'cloud_run_revision' } },
          { 
            message,
            error: error?.message,
            stack: error?.stack,
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV,
            ...sanitizeMetadata(metadata)
          }
        );
        await log.write(entry);
      } catch (logError) {
        console.error('Failed to write error log to Cloud Logging:', logError);
      }
    }
  },

  /**
   * Log performance metrics (for latency optimization)
   */
  metric: async (metricName: string, value: number, metadata?: LogMetadata) => {
    console.log(`[METRIC] ${metricName}: ${value}ms`, metadata);
    
    if (process.env.NODE_ENV === 'production') {
      try {
        const entry = log.entry(
          { severity: 'INFO', resource: { type: 'cloud_run_revision' } },
          { 
            metric: metricName,
            value,
            unit: 'milliseconds',
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV,
            ...sanitizeMetadata(metadata)
          }
        );
        await log.write(entry);
      } catch (error) {
        console.error('Failed to write metric to Cloud Logging:', error);
      }
    }
  },

  /**
   * Performance timer utility
   * Usage:
   *   const timer = logger.startTimer();
   *   // ... do work ...
   *   await timer.end('operation_name', { userId: '123' });
   */
  startTimer: () => {
    const start = Date.now();
    return {
      end: async (operation: string, metadata?: LogMetadata) => {
        const duration = Date.now() - start;
        await logger.metric(operation, duration, metadata);
        return duration;
      }
    };
  },
};

/**
 * Sanitize metadata to avoid logging sensitive information
 */
function sanitizeMetadata(metadata?: LogMetadata): LogMetadata {
  if (!metadata) return {};
  
  const sanitized = { ...metadata };
  
  // Hash or remove sensitive fields
  const sensitiveFields = ['password', 'token', 'apiKey', 'secret', 'authorization'];
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  });
  
  // Hash user IDs for privacy
  if (sanitized.userId) {
    sanitized.userId = `user_${hashString(sanitized.userId)}`;
  }
  
  return sanitized;
}

/**
 * Simple hash function for user IDs
 */
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

