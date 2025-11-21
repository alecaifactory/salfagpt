/**
 * 🚀 Client-Side Performance Monitor
 * 
 * Monitors real-time performance metrics in the browser
 * Measures: FCP, LCP, CLS, FID, TTFB, and custom metrics
 * 
 * Usage: Include in chat.astro
 * <script src="/performance-monitor.js"></script>
 */

(function() {
  'use strict';
  
  // ============================================================
  // CONFIGURATION
  // ============================================================
  
  const CONFIG = {
    enabled: true,
    verbose: true,
    sendToServer: false, // Set true to log to backend
    threshold: {
      good: 50,
      moderate: 100,
      poor: 200,
    },
  };
  
  const metrics = {
    navigation: {},
    resources: [],
    interactions: [],
    custom: {},
  };
  
  // ============================================================
  // CORE WEB VITALS
  // ============================================================
  
  function measureCoreWebVitals() {
    if (!window.PerformanceObserver) {
      console.warn('⚠️ PerformanceObserver not supported');
      return;
    }
    
    // First Contentful Paint (FCP)
    try {
      const paintObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            metrics.navigation.fcp = Math.round(entry.startTime);
            logMetric('FCP', metrics.navigation.fcp, 'ms');
          }
        }
      });
      paintObserver.observe({ entryTypes: ['paint'] });
    } catch (e) {
      console.error('FCP observer error:', e);
    }
    
    // Largest Contentful Paint (LCP)
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        metrics.navigation.lcp = Math.round(lastEntry.startTime);
        logMetric('LCP', metrics.navigation.lcp, 'ms');
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (e) {
      console.error('LCP observer error:', e);
    }
    
    // Cumulative Layout Shift (CLS)
    try {
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
            metrics.navigation.cls = Math.round(clsValue * 1000) / 1000;
            logMetric('CLS', metrics.navigation.cls, '');
          }
        }
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    } catch (e) {
      console.error('CLS observer error:', e);
    }
    
    // First Input Delay (FID)
    try {
      const fidObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          metrics.navigation.fid = Math.round(entry.processingStart - entry.startTime);
          logMetric('FID', metrics.navigation.fid, 'ms');
        }
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
    } catch (e) {
      console.error('FID observer error:', e);
    }
  }
  
  // ============================================================
  // NAVIGATION TIMING
  // ============================================================
  
  function measureNavigationTiming() {
    window.addEventListener('load', () => {
      const perfData = performance.getEntriesByType('navigation')[0];
      
      if (!perfData) return;
      
      metrics.navigation.ttfb = Math.round(perfData.responseStart - perfData.requestStart);
      metrics.navigation.domContentLoaded = Math.round(perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart);
      metrics.navigation.domInteractive = Math.round(perfData.domInteractive - perfData.fetchStart);
      metrics.navigation.loadComplete = Math.round(perfData.loadEventEnd - perfData.fetchStart);
      
      logMetric('TTFB', metrics.navigation.ttfb, 'ms');
      logMetric('DOM Content Loaded', metrics.navigation.domContentLoaded, 'ms');
      logMetric('DOM Interactive', metrics.navigation.domInteractive, 'ms');
      logMetric('Load Complete', metrics.navigation.loadComplete, 'ms');
    });
  }
  
  // ============================================================
  // RESOURCE LOADING
  // ============================================================
  
  function measureResourceLoading() {
    window.addEventListener('load', () => {
      const resources = performance.getEntriesByType('resource');
      
      const summary = {
        total: resources.length,
        byType: {},
        slowest: [],
      };
      
      resources.forEach(resource => {
        const type = resource.initiatorType || 'other';
        const duration = Math.round(resource.duration);
        
        if (!summary.byType[type]) {
          summary.byType[type] = {
            count: 0,
            totalDuration: 0,
          };
        }
        
        summary.byType[type].count++;
        summary.byType[type].totalDuration += duration;
        
        metrics.resources.push({
          name: resource.name.split('/').pop(),
          type,
          duration,
          size: resource.transferSize || 0,
        });
      });
      
      // Find slowest resources
      summary.slowest = metrics.resources
        .sort((a, b) => b.duration - a.duration)
        .slice(0, 10);
      
      console.log('📦 Resource Loading Summary:', summary);
      
      // Check for slow resources (>100ms)
      const slowResources = metrics.resources.filter(r => r.duration > CONFIG.threshold.moderate);
      if (slowResources.length > 0) {
        console.warn(`⚠️ ${slowResources.length} slow resources detected (>100ms):`, slowResources);
      }
    });
  }
  
  // ============================================================
  // USER INTERACTIONS
  // ============================================================
  
  function measureInteractions() {
    // Click events
    document.addEventListener('click', (e) => {
      const start = performance.now();
      
      requestAnimationFrame(() => {
        const duration = Math.round(performance.now() - start);
        
        metrics.interactions.push({
          type: 'click',
          target: e.target.tagName,
          duration,
          timestamp: Date.now(),
        });
        
        if (duration > CONFIG.threshold.good) {
          console.warn(`⚠️ Slow click interaction: ${duration}ms on ${e.target.tagName}`);
        }
      });
    });
    
    // Input events (typing)
    let inputStart = 0;
    document.addEventListener('input', (e) => {
      if (inputStart === 0) {
        inputStart = performance.now();
      }
      
      requestAnimationFrame(() => {
        const duration = Math.round(performance.now() - inputStart);
        inputStart = 0;
        
        if (duration > CONFIG.threshold.good) {
          console.warn(`⚠️ Slow input response: ${duration}ms`);
        }
      });
    });
  }
  
  // ============================================================
  // CUSTOM METRICS
  // ============================================================
  
  window.performanceMonitor = {
    // Mark start of operation
    mark(name) {
      performance.mark(`${name}-start`);
    },
    
    // Measure operation
    measure(name) {
      try {
        performance.mark(`${name}-end`);
        performance.measure(name, `${name}-start`, `${name}-end`);
        
        const measure = performance.getEntriesByName(name)[0];
        const duration = Math.round(measure.duration);
        
        metrics.custom[name] = duration;
        logMetric(name, duration, 'ms', true);
        
        // Clean up marks
        performance.clearMarks(`${name}-start`);
        performance.clearMarks(`${name}-end`);
        performance.clearMeasures(name);
        
        return duration;
      } catch (e) {
        console.error(`Failed to measure ${name}:`, e);
        return -1;
      }
    },
    
    // Get all metrics
    getMetrics() {
      return {
        navigation: metrics.navigation,
        resources: metrics.resources,
        interactions: metrics.interactions,
        custom: metrics.custom,
        timestamp: Date.now(),
      };
    },
    
    // Print report
    report() {
      console.group('📊 Performance Report');
      
      console.log('\n🔹 Core Web Vitals:');
      console.table({
        'FCP (First Contentful Paint)': formatMetric(metrics.navigation.fcp, 'ms'),
        'LCP (Largest Contentful Paint)': formatMetric(metrics.navigation.lcp, 'ms'),
        'CLS (Cumulative Layout Shift)': metrics.navigation.cls || 'N/A',
        'FID (First Input Delay)': formatMetric(metrics.navigation.fid, 'ms'),
      });
      
      console.log('\n🔹 Navigation Timing:');
      console.table({
        'TTFB (Time to First Byte)': formatMetric(metrics.navigation.ttfb, 'ms'),
        'DOM Interactive': formatMetric(metrics.navigation.domInteractive, 'ms'),
        'DOM Content Loaded': formatMetric(metrics.navigation.domContentLoaded, 'ms'),
        'Load Complete': formatMetric(metrics.navigation.loadComplete, 'ms'),
      });
      
      console.log('\n🔹 Custom Metrics:');
      console.table(metrics.custom);
      
      console.log('\n🔹 Resources:');
      console.log(`Total: ${metrics.resources.length}`);
      console.log('Slowest 5:', metrics.resources.slice(0, 5));
      
      console.log('\n🔹 Interactions:');
      console.log(`Total: ${metrics.interactions.length}`);
      const avgInteraction = metrics.interactions.reduce((sum, i) => sum + i.duration, 0) / metrics.interactions.length;
      console.log(`Average: ${avgInteraction?.toFixed(2)}ms`);
      
      console.groupEnd();
    },
    
    // Send to server
    async send() {
      if (!CONFIG.sendToServer) return;
      
      try {
        await fetch('/api/analytics/performance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(this.getMetrics()),
        });
      } catch (e) {
        console.error('Failed to send metrics:', e);
      }
    },
  };
  
  // ============================================================
  // UTILITIES
  // ============================================================
  
  function logMetric(name, value, unit = '', custom = false) {
    if (!CONFIG.verbose) return;
    
    let icon = '📊';
    let color = '';
    
    if (unit === 'ms') {
      if (value < CONFIG.threshold.good) {
        icon = '✅';
        color = 'color: green';
      } else if (value < CONFIG.threshold.moderate) {
        icon = '⚠️';
        color = 'color: orange';
      } else {
        icon = '❌';
        color = 'color: red';
      }
    }
    
    const label = custom ? `[Custom] ${name}` : name;
    console.log(`${icon} %c${label}: ${value}${unit}`, color);
  }
  
  function formatMetric(value, unit) {
    if (!value) return 'N/A';
    
    if (unit === 'ms') {
      if (value < CONFIG.threshold.good) {
        return `✅ ${value}ms`;
      } else if (value < CONFIG.threshold.moderate) {
        return `⚠️ ${value}ms`;
      } else {
        return `❌ ${value}ms`;
      }
    }
    
    return `${value}${unit}`;
  }
  
  // ============================================================
  // REACT INTEGRATION
  // ============================================================
  
  // Measure React component renders
  window.measureReactRender = function(componentName, fn) {
    window.performanceMonitor.mark(`render-${componentName}`);
    const result = fn();
    const duration = window.performanceMonitor.measure(`render-${componentName}`);
    
    if (duration > CONFIG.threshold.moderate) {
      console.warn(`⚠️ Slow React render: ${componentName} (${duration}ms)`);
    }
    
    return result;
  };
  
  // Measure API calls
  window.measureAPI = async function(name, promise) {
    window.performanceMonitor.mark(`api-${name}`);
    try {
      const result = await promise;
      window.performanceMonitor.measure(`api-${name}`);
      return result;
    } catch (error) {
      window.performanceMonitor.measure(`api-${name}`);
      throw error;
    }
  };
  
  // ============================================================
  // AUTOMATIC REPORTING
  // ============================================================
  
  function setupAutoReporting() {
    // Report on visibility change (tab switch)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        window.performanceMonitor.report();
        window.performanceMonitor.send();
      }
    });
    
    // Report before unload
    window.addEventListener('beforeunload', () => {
      window.performanceMonitor.send();
    });
    
    // Auto-report every 5 minutes
    setInterval(() => {
      window.performanceMonitor.report();
      window.performanceMonitor.send();
    }, 5 * 60 * 1000);
  }
  
  // ============================================================
  // INITIALIZE
  // ============================================================
  
  if (CONFIG.enabled) {
    console.log('🚀 Performance Monitor initialized');
    
    measureCoreWebVitals();
    measureNavigationTiming();
    measureResourceLoading();
    measureInteractions();
    setupAutoReporting();
    
    // Expose to window for manual access
    window.metrics = metrics;
    
    // Auto-report after 30 seconds
    setTimeout(() => {
      window.performanceMonitor.report();
    }, 30000);
  }
})();


