/**
 * Console Logger - Captures browser console output
 * 
 * Usage:
 * 1. Import in your main app component
 * 2. Call initConsoleLogger() on mount
 * 3. Logs are buffered and sent to /api/console-logs
 */

interface ConsoleEntry {
  timestamp: string;
  type: 'log' | 'error' | 'warn' | 'info' | 'debug';
  message: string;
  args?: any[];
  stack?: string;
  url?: string;
  userAgent?: string;
}

class ConsoleLogger {
  private buffer: ConsoleEntry[] = [];
  private maxBufferSize = 50;
  private flushInterval = 30000; // 30 seconds
  private intervalId?: NodeJS.Timeout;
  private originalConsole: {
    log: typeof console.log;
    error: typeof console.error;
    warn: typeof console.warn;
    info: typeof console.info;
    debug: typeof console.debug;
  };

  constructor() {
    // Store original console methods
    this.originalConsole = {
      log: console.log,
      error: console.error,
      warn: console.warn,
      info: console.info,
      debug: console.debug,
    };
  }

  init() {
    // Intercept console methods
    const types: Array<keyof typeof this.originalConsole> = ['log', 'error', 'warn', 'info', 'debug'];
    
    types.forEach(type => {
      console[type] = (...args: any[]) => {
        // Call original console method
        this.originalConsole[type](...args);
        
        // Capture entry
        this.captureEntry(type, args);
      };
    });

    // Start periodic flush
    this.intervalId = setInterval(() => {
      this.flush();
    }, this.flushInterval);

    // Flush on page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.flush();
      });
    }

    console.log('📊 Console logger initialized');
  }

  private captureEntry(type: ConsoleEntry['type'], args: any[]) {
    try {
      const entry: ConsoleEntry = {
        timestamp: new Date().toISOString(),
        type,
        message: args.map(arg => {
          if (typeof arg === 'object') {
            try {
              return JSON.stringify(arg, null, 2);
            } catch {
              return String(arg);
            }
          }
          return String(arg);
        }).join(' '),
        url: typeof window !== 'undefined' ? window.location.href : undefined,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      };

      // Capture stack trace for errors
      if (type === 'error' && args[0] instanceof Error) {
        entry.stack = args[0].stack;
      }

      this.buffer.push(entry);

      // Auto-flush if buffer is full
      if (this.buffer.length >= this.maxBufferSize) {
        this.flush();
      }
    } catch (error) {
      // Don't let logger break the app
      this.originalConsole.error('Console logger error:', error);
    }
  }

  private async flush() {
    if (this.buffer.length === 0) return;

    const logsToSend = [...this.buffer];
    this.buffer = [];

    try {
      // Send to server (non-blocking)
      await fetch('/api/console-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          logs: logsToSend,
          sessionId: this.getSessionId(),
        }),
      });
    } catch (error) {
      // Silent failure - don't break app for logging
      this.originalConsole.warn('Failed to flush console logs:', error);
      
      // Add back to buffer to retry
      this.buffer.unshift(...logsToSend);
      
      // Limit buffer size
      if (this.buffer.length > this.maxBufferSize * 2) {
        this.buffer = this.buffer.slice(0, this.maxBufferSize);
      }
    }
  }

  private getSessionId(): string {
    // Get or create session ID
    if (typeof window === 'undefined') return 'server';
    
    let sessionId = sessionStorage.getItem('console_session_id');
    if (!sessionId) {
      sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('console_session_id', sessionId);
    }
    return sessionId;
  }

  destroy() {
    // Restore original console
    Object.keys(this.originalConsole).forEach(key => {
      const method = key as keyof typeof this.originalConsole;
      console[method] = this.originalConsole[method];
    });

    // Clear interval
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    // Final flush
    this.flush();
  }
}

// Singleton instance
let loggerInstance: ConsoleLogger | null = null;

export function initConsoleLogger() {
  // Only run in browser
  if (typeof window === 'undefined') return;

  // Only initialize once
  if (loggerInstance) return;

  // Don't run in production (optional - remove if you want prod logging)
  if (process.env.NODE_ENV === 'production') {
    console.log('📊 Console logging disabled in production');
    return;
  }

  loggerInstance = new ConsoleLogger();
  loggerInstance.init();
}

export function destroyConsoleLogger() {
  if (loggerInstance) {
    loggerInstance.destroy();
    loggerInstance = null;
  }
}

