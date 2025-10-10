import { ErrorReporting } from '@google-cloud/error-reporting';
import { logger } from './logger';

// Initialize Error Reporting
const errors = new ErrorReporting({
  projectId: process.env.GOOGLE_CLOUD_PROJECT || process.env.VITE_GOOGLE_CLOUD_PROJECT,
  reportMode: 'production',
  serviceContext: {
    service: 'pame-ai',
    version: process.env.npm_package_version || '1.0.0',
  },
});

export interface ErrorContext {
  userId?: string;
  conversationId?: string;
  endpoint?: string;
  method?: string;
  [key: string]: any;
}

/**
 * Report errors to Google Cloud Error Reporting
 * Automatically groups similar errors and provides insights
 */
export const reportError = async (
  error: Error,
  context?: ErrorContext
): Promise<void> => {
  try {
    // Log locally first
    console.error('[ERROR REPORTING]', error.message, context);
    
    // Log to Cloud Logging
    await logger.error(error.message, error, context);
    
    // Report to Error Reporting in production
    if (process.env.NODE_ENV === 'production') {
      const errorContext: any = {
        ...sanitizeContext(context),
      };
      if (context?.userId) {
        errorContext.user = `user_${hashUserId(context.userId)}`;
      }
      errors.report(error, errorContext);
    }
  } catch (reportingError) {
    console.error('Failed to report error:', reportingError);
  }
};

/**
 * Wrap an async function with error reporting
 * Usage:
 *   export const POST = withErrorReporting(async ({ request }) => {
 *     // your code
 *   }, { endpoint: '/api/chat' });
 */
export const withErrorReporting = <T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context?: ErrorContext
): T => {
  return (async (...args: any[]) => {
    try {
      return await fn(...args);
    } catch (error) {
      await reportError(
        error instanceof Error ? error : new Error(String(error)),
        context
      );
      throw error;
    }
  }) as T;
};

/**
 * Create an error with context for better debugging
 */
export class ApplicationError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public context?: ErrorContext
  ) {
    super(message);
    this.name = 'ApplicationError';
  }
}

/**
 * Sanitize error context to avoid logging sensitive information
 */
function sanitizeContext(context?: ErrorContext): ErrorContext {
  if (!context) return {};
  
  const sanitized = { ...context };
  
  // Remove sensitive fields
  const sensitiveFields = ['password', 'token', 'apiKey', 'secret', 'authorization'];
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      delete sanitized[field];
    }
  });
  
  return sanitized;
}

/**
 * Hash user ID for privacy
 */
function hashUserId(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

/**
 * Express/Astro middleware for automatic error reporting
 */
export const errorReportingMiddleware = async <T extends (...args: any[]) => Promise<any>>(
  handler: T,
  context: { endpoint: string; method: string }
): Promise<T> => {
  return withErrorReporting(handler, context);
};

