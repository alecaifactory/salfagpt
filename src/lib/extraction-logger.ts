/**
 * Enhanced Extraction Logger
 * 
 * Captures detailed terminal-style logs during document extraction
 * and makes them available for real-time UI display
 * 
 * Created: 2025-11-02
 */

export interface DetailedLog {
  timestamp: Date;
  level: 'info' | 'success' | 'warning' | 'error' | 'debug';
  category: 'system' | 'upload' | 'extract' | 'chunk' | 'embed' | 'vision-api' | 'gemini' | 'rag';
  message: string;
  details?: Record<string, any>;
  icon?: string; // Emoji for visual representation
}

export class ExtractionLogger {
  private logs: DetailedLog[] = [];
  private startTime: number;
  
  constructor() {
    this.startTime = Date.now();
  }
  
  // ✅ Log with automatic terminal output
  log(
    level: DetailedLog['level'],
    category: DetailedLog['category'],
    message: string,
    details?: Record<string, any>,
    icon?: string
  ) {
    const log: DetailedLog = {
      timestamp: new Date(),
      level,
      category,
      message,
      details,
      icon: icon || this.getDefaultIcon(level, category),
    };
    
    this.logs.push(log);
    
    // Also output to terminal for debugging
    const emoji = log.icon || '';
    const prefix = this.getLevelPrefix(level);
    console.log(`${emoji} ${prefix}${message}`);
    
    if (details) {
      console.log('   Details:', details);
    }
    
    return log;
  }
  
  // Convenience methods
  info(category: DetailedLog['category'], message: string, details?: Record<string, any>, icon?: string) {
    return this.log('info', category, message, details, icon);
  }
  
  success(category: DetailedLog['category'], message: string, details?: Record<string, any>, icon?: string) {
    return this.log('success', category, message, details, icon);
  }
  
  warning(category: DetailedLog['category'], message: string, details?: Record<string, any>, icon?: string) {
    return this.log('warning', category, message, details, icon);
  }
  
  error(category: DetailedLog['category'], message: string, details?: Record<string, any>, icon?: string) {
    return this.log('error', category, message, details, icon);
  }
  
  debug(category: DetailedLog['category'], message: string, details?: Record<string, any>, icon?: string) {
    return this.log('debug', category, message, details, icon);
  }
  
  // Get all logs
  getLogs(): DetailedLog[] {
    return this.logs;
  }
  
  // Get logs for specific category
  getLogsByCategory(category: DetailedLog['category']): DetailedLog[] {
    return this.logs.filter(log => log.category === category);
  }
  
  // Get elapsed time
  getElapsedTime(): number {
    return Date.now() - this.startTime;
  }
  
  // Helper: Get default icon based on level and category
  private getDefaultIcon(level: DetailedLog['level'], category: DetailedLog['category']): string {
    // Level-based icons
    if (level === 'success') return '✅';
    if (level === 'error') return '❌';
    if (level === 'warning') return '⚠️';
    
    // Category-based icons
    const categoryIcons: Record<DetailedLog['category'], string> = {
      system: '🔧',
      upload: '📤',
      extract: '📄',
      chunk: '🔪',
      embed: '🧮',
      'vision-api': '👁️',
      'gemini': '🤖',
      'rag': '🔍',
    };
    
    return categoryIcons[category] || '📋';
  }
  
  // Helper: Get level prefix for terminal output
  private getLevelPrefix(level: DetailedLog['level']): string {
    switch (level) {
      case 'success': return '';
      case 'error': return '';
      case 'warning': return '';
      case 'info': return '';
      case 'debug': return '🐛 ';
      default: return '';
    }
  }
  
  // ✅ Create summary for UI display
  getSummary() {
    const byLevel = {
      info: this.logs.filter(l => l.level === 'info').length,
      success: this.logs.filter(l => l.level === 'success').length,
      warning: this.logs.filter(l => l.level === 'warning').length,
      error: this.logs.filter(l => l.level === 'error').length,
      debug: this.logs.filter(l => l.level === 'debug').length,
    };
    
    const byCategory = {
      system: this.logs.filter(l => l.category === 'system').length,
      upload: this.logs.filter(l => l.category === 'upload').length,
      extract: this.logs.filter(l => l.category === 'extract').length,
      chunk: this.logs.filter(l => l.category === 'chunk').length,
      embed: this.logs.filter(l => l.category === 'embed').length,
      'vision-api': this.logs.filter(l => l.category === 'vision-api').length,
      gemini: this.logs.filter(l => l.category === 'gemini').length,
      rag: this.logs.filter(l => l.category === 'rag').length,
    };
    
    return {
      totalLogs: this.logs.length,
      elapsedTime: this.getElapsedTime(),
      byLevel,
      byCategory,
      hasErrors: byLevel.error > 0,
      hasWarnings: byLevel.warning > 0,
    };
  }
}

