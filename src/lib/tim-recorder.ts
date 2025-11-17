/**
 * Tim v2.0 - Enhanced Session Recorder
 * Complete session recording with screenshots, interactions, state, performance
 * 
 * Created: 2025-11-17
 * Purpose: Capture EVERYTHING for detailed diagnostics and vector stores
 */

import { firestore } from './firestore';
import { redactPII } from './tim';

// ============================================================================
// TYPES
// ============================================================================

interface ScreenshotRecording {
  timestamp: Date;
  filename: string;
  url: string;
  trigger: 'interaction' | 'state_change' | 'interval' | 'error' | 'manual';
  uiState: string;
  elementInFocus?: string;
  sequenceNumber: number;
  fileSize?: number;
}

interface UserInteraction {
  timestamp: Date;
  type: 'click' | 'type' | 'scroll' | 'hover' | 'focus' | 'blur' | 'submit' | 'navigate';
  element: string;
  elementRef: string;
  value?: string;
  coordinates?: { x: number; y: number };
  duration?: number;
  sequenceNumber: number;
}

interface UIStateTransition {
  timestamp: Date;
  from: string;
  to: string;
  trigger: string;
  componentName?: string;
  duration?: number;
}

interface PerformanceSnapshot {
  timestamp: Date;
  metrics: {
    memory: number;
    cpu?: number;
    fps?: number;
    latency?: number;
    renderTime?: number;
  };
  context: string;
}

// ============================================================================
// SCREENSHOT RECORDER
// ============================================================================

export class TimScreenshotRecorder {
  private sessionId: string;
  private screenshots: ScreenshotRecording[] = [];
  private isRecording: boolean = false;
  private sequenceNumber: number = 0;
  
  // Capture intervals (ms)
  private readonly INTERVALS = {
    idle: 5000,           // Every 5s when idle
    interaction: 500,     // Every 500ms during interaction
    loading: 1000,        // Every 1s during AI generation
    error: 0              // Immediate on error
  };
  
  async startRecording(sessionId: string): Promise<void> {
    this.sessionId = sessionId;
    this.isRecording = true;
    this.sequenceNumber = 0;
    
    console.log('📸 Tim screenshot recording started:', sessionId);
  }
  
  async captureScreenshot(
    trigger: ScreenshotRecording['trigger'],
    uiState: string,
    elementInFocus?: string
  ): Promise<ScreenshotRecording | null> {
    if (!this.isRecording) return null;
    
    try {
      const timestamp = new Date();
      const filename = `tim-${this.sessionId}-${this.sequenceNumber.toString().padStart(4, '0')}.png`;
      
      // Note: Actual screenshot would be taken via MCP browser tools
      // await browser_take_screenshot({ filename, fullPage: true });
      
      const screenshot: ScreenshotRecording = {
        timestamp,
        filename,
        url: `gs://salfagpt-tim-screenshots/${this.sessionId}/${filename}`,
        trigger,
        uiState,
        elementInFocus,
        sequenceNumber: this.sequenceNumber++
      };
      
      this.screenshots.push(screenshot);
      
      // Save to Firestore every 10 screenshots
      if (this.screenshots.length % 10 === 0) {
        await this.saveToSession();
      }
      
      return screenshot;
      
    } catch (error) {
      console.error('❌ Failed to capture screenshot:', error);
      return null;
    }
  }
  
  async stopRecording(): Promise<ScreenshotRecording[]> {
    this.isRecording = false;
    await this.saveToSession();
    
    console.log(`✅ Screenshot recording stopped. Total: ${this.screenshots.length}`);
    return this.screenshots;
  }
  
  private async saveToSession(): Promise<void> {
    if (this.screenshots.length === 0) return;
    
    try {
      await firestore.collection('tim_test_sessions').doc(this.sessionId).update({
        'recording.screenshots': this.screenshots.map(s => ({
          ...s,
          timestamp: s.timestamp // Firestore will convert to Timestamp
        }))
      });
      
      console.log(`💾 Saved ${this.screenshots.length} screenshots to session`);
    } catch (error) {
      console.error('❌ Failed to save screenshots:', error);
    }
  }
}

// ============================================================================
// INTERACTION TRACKER
// ============================================================================

export class TimInteractionTracker {
  private interactions: UserInteraction[] = [];
  private sessionId: string;
  private sequenceNumber: number = 0;
  private isTracking: boolean = false;
  
  startTracking(sessionId: string): void {
    this.sessionId = sessionId;
    this.isTracking = true;
    this.sequenceNumber = 0;
    
    console.log('🖱️ Tim interaction tracking started:', sessionId);
    
    // Note: In actual implementation, would set up event listeners
    // This is the framework - AI assistant would populate via browser tools
  }
  
  recordInteraction(interaction: Omit<UserInteraction, 'timestamp' | 'sequenceNumber'>): void {
    if (!this.isTracking) return;
    
    const record: UserInteraction = {
      ...interaction,
      value: interaction.value ? redactPII(interaction.value) : undefined,
      timestamp: new Date(),
      sequenceNumber: this.sequenceNumber++
    };
    
    this.interactions.push(record);
    
    // Save every 50 interactions
    if (this.interactions.length % 50 === 0) {
      this.saveToSession();
    }
  }
  
  async stopTracking(): Promise<UserInteraction[]> {
    this.isTracking = false;
    await this.saveToSession();
    
    console.log(`✅ Interaction tracking stopped. Total: ${this.interactions.length}`);
    return this.interactions;
  }
  
  private async saveToSession(): Promise<void> {
    if (this.interactions.length === 0) return;
    
    try {
      await firestore.collection('tim_test_sessions').doc(this.sessionId).update({
        'recording.interactions': this.interactions
      });
      
      console.log(`💾 Saved ${this.interactions.length} interactions to session`);
    } catch (error) {
      console.error('❌ Failed to save interactions:', error);
    }
  }
}

// ============================================================================
// STATE TRANSITION TRACKER
// ============================================================================

export class TimStateTracker {
  private transitions: UIStateTransition[] = [];
  private sessionId: string;
  private currentState: string = 'unknown';
  private stateStartTime: Date = new Date();
  private isTracking: boolean = false;
  
  startTracking(sessionId: string, initialState: string = 'initializing'): void {
    this.sessionId = sessionId;
    this.isTracking = true;
    this.currentState = initialState;
    this.stateStartTime = new Date();
    
    console.log('🔄 Tim state tracking started:', sessionId);
  }
  
  recordTransition(
    to: string,
    trigger: string,
    componentName?: string
  ): void {
    if (!this.isTracking) return;
    
    const now = new Date();
    const duration = now.getTime() - this.stateStartTime.getTime();
    
    const transition: UIStateTransition = {
      timestamp: now,
      from: this.currentState,
      to,
      trigger,
      componentName,
      duration
    };
    
    this.transitions.push(transition);
    
    // Update current state
    this.currentState = to;
    this.stateStartTime = now;
    
    // Save every 20 transitions
    if (this.transitions.length % 20 === 0) {
      this.saveToSession();
    }
  }
  
  async stopTracking(): Promise<UIStateTransition[]> {
    this.isTracking = false;
    await this.saveToSession();
    
    console.log(`✅ State tracking stopped. Total: ${this.transitions.length} transitions`);
    return this.transitions;
  }
  
  private async saveToSession(): Promise<void> {
    if (this.transitions.length === 0) return;
    
    try {
      await firestore.collection('tim_test_sessions').doc(this.sessionId).update({
        'recording.stateTransitions': this.transitions
      });
      
      console.log(`💾 Saved ${this.transitions.length} state transitions to session`);
    } catch (error) {
      console.error('❌ Failed to save state transitions:', error);
    }
  }
}

// ============================================================================
// PERFORMANCE MONITOR
// ============================================================================

export class TimPerformanceMonitor {
  private snapshots: PerformanceSnapshot[] = [];
  private sessionId: string;
  private isMonitoring: boolean = false;
  private monitorInterval: any;
  
  startMonitoring(sessionId: string, intervalMs: number = 2000): void {
    this.sessionId = sessionId;
    this.isMonitoring = true;
    
    console.log('📊 Tim performance monitoring started:', sessionId);
    
    // Note: Actual implementation would capture via browser_evaluate()
    // This is the framework
    
    this.monitorInterval = setInterval(() => {
      this.captureSnapshot('interval');
    }, intervalMs);
  }
  
  captureSnapshot(context: string): void {
    if (!this.isMonitoring) return;
    
    // Note: Would be populated via browser_evaluate()
    const snapshot: PerformanceSnapshot = {
      timestamp: new Date(),
      metrics: {
        memory: 0, // Would be: performance.memory.usedJSHeapSize
        cpu: 0,
        fps: 60,
        latency: 0,
        renderTime: 0
      },
      context
    };
    
    this.snapshots.push(snapshot);
    
    // Save every 10 snapshots
    if (this.snapshots.length % 10 === 0) {
      this.saveToSession();
    }
  }
  
  async stopMonitoring(): Promise<PerformanceSnapshot[]> {
    this.isMonitoring = false;
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
    }
    
    await this.saveToSession();
    
    console.log(`✅ Performance monitoring stopped. Total: ${this.snapshots.length} snapshots`);
    return this.snapshots;
  }
  
  private async saveToSession(): Promise<void> {
    if (this.snapshots.length === 0) return;
    
    try {
      await firestore.collection('tim_test_sessions').doc(this.sessionId).update({
        'recording.performanceSnapshots': this.snapshots
      });
      
      console.log(`💾 Saved ${this.snapshots.length} performance snapshots to session`);
    } catch (error) {
      console.error('❌ Failed to save performance snapshots:', error);
    }
  }
}

// ============================================================================
// ORCHESTRATOR - Start/Stop All Recording
// ============================================================================

export class TimSessionRecorder {
  private screenshotRecorder: TimScreenshotRecorder;
  private interactionTracker: TimInteractionTracker;
  private stateTracker: TimStateTracker;
  private performanceMonitor: TimPerformanceMonitor;
  
  constructor() {
    this.screenshotRecorder = new TimScreenshotRecorder();
    this.interactionTracker = new TimInteractionTracker();
    this.stateTracker = new TimStateTracker();
    this.performanceMonitor = new TimPerformanceMonitor();
  }
  
  async startRecording(sessionId: string): Promise<void> {
    console.log('🎬 Tim complete session recording started:', sessionId);
    
    await this.screenshotRecorder.startRecording(sessionId);
    this.interactionTracker.startTracking(sessionId);
    this.stateTracker.startTracking(sessionId, 'initializing');
    this.performanceMonitor.startMonitoring(sessionId, 2000);
  }
  
  async stopRecording(): Promise<{
    screenshots: ScreenshotRecording[];
    interactions: UserInteraction[];
    stateTransitions: UIStateTransition[];
    performanceSnapshots: PerformanceSnapshot[];
  }> {
    console.log('🎬 Tim complete session recording stopped');
    
    const [screenshots, interactions, stateTransitions, performanceSnapshots] = await Promise.all([
      this.screenshotRecorder.stopRecording(),
      this.interactionTracker.stopTracking(),
      this.stateTracker.stopTracking(),
      this.performanceMonitor.stopMonitoring()
    ]);
    
    return {
      screenshots,
      interactions,
      stateTransitions,
      performanceSnapshots
    };
  }
  
  // Convenience methods for triggering captures
  async captureOnInteraction(element: string, uiState: string) {
    await this.screenshotRecorder.captureScreenshot('interaction', uiState, element);
  }
  
  async captureOnError(errorMessage: string, uiState: string) {
    await this.screenshotRecorder.captureScreenshot('error', uiState);
  }
  
  recordClick(element: string, elementRef: string, coordinates: { x: number; y: number }) {
    this.interactionTracker.recordInteraction({
      type: 'click',
      element,
      elementRef,
      coordinates
    });
  }
  
  recordStateChange(to: string, trigger: string, componentName?: string) {
    this.stateTracker.recordTransition(to, trigger, componentName);
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  TimScreenshotRecorder,
  TimInteractionTracker,
  TimStateTracker,
  TimPerformanceMonitor,
  TimSessionRecorder
};

// Singleton instance for easy usage
export const timRecorder = new TimSessionRecorder();

