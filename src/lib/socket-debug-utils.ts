import SocketIOManager from './socketio-manager';

/**
 * Utility functions for debugging SocketIO performance and behavior
 */
export class SocketDebugUtils {
  private static socketManager = SocketIOManager.getInstance();

  /**
   * Enable debug mode for SocketIO
   */
  static enableDebug(enabled: boolean = true): void {
    this.socketManager.enableDebug(enabled);
  }

  /**
   * Get current performance metrics with human-readable formatting
   */
  static getPerformanceReport(): {
    summary: string;
    metrics: ReturnType<typeof SocketIOManager.prototype.getPerformanceMetrics>;
    recommendations: string[];
  } {
    const metrics = this.socketManager.getPerformanceMetrics();
    const recommendations: string[] = [];

    // Generate recommendations based on metrics
    if (metrics.averageResponseTime > 2000) {
      recommendations.push('⚠️ High average response time detected. Check server performance.');
    }
    if (metrics.pendingRequestsDetails.length > 5) {
      recommendations.push('⚠️ Many pending requests. Possible network issues or server overload.');
    }
    if (metrics.slowestRequest > 10000) {
      recommendations.push('⚠️ Very slow requests detected. Consider request timeout handling.');
    }
    if (metrics.totalRequests > 0 && metrics.totalResponses / metrics.totalRequests < 0.8) {
      recommendations.push('⚠️ Low response rate. Many requests are not receiving responses.');
    }
    if (recommendations.length === 0) {
      recommendations.push('✅ SocketIO performance looks good!');
    }

    const summary = `
📊 SocketIO Performance Summary:
• Connection Time: ${metrics.connectionTime || 'N/A'}ms
• Average Response: ${Math.round(metrics.averageResponseTime)}ms
• Total Requests: ${metrics.totalRequests}
• Total Responses: ${metrics.totalResponses}
• Pending Requests: ${metrics.pendingRequestsDetails.length}
• Fastest Request: ${metrics.fastestRequest === Infinity ? 'N/A' : metrics.fastestRequest}ms
• Slowest Request: ${metrics.slowestRequest}ms
• Success Rate: ${metrics.totalRequests > 0 ? Math.round((metrics.totalResponses / metrics.totalRequests) * 100) : 0}%
    `.trim();

    return { summary, metrics, recommendations };
  }

  /**
   * Get recent events with optional filtering
   */
  static getRecentEvents(
    count: number = 20,
    eventType?: 'sent' | 'received' | 'connection' | 'error' | 'performance'
  ) {
    const events = this.socketManager.getDebugEvents();
    const filtered = eventType ? events.filter((e) => e.type === eventType) : events;
    return filtered.slice(-count).reverse(); // Most recent first
  }

  /**
   * Get slow requests (over a certain threshold)
   */
  static getSlowRequests(thresholdMs: number = 2000) {
    const events = this.socketManager.getDebugEvents();
    return events
      .filter((e) => e.type === 'received' && e.responseTime && e.responseTime > thresholdMs)
      .sort((a, b) => (b.responseTime || 0) - (a.responseTime || 0));
  }

  /**
   * Get pending requests that might be stuck
   */
  static getStuckRequests(timeoutMs: number = 10000) {
    const metrics = this.socketManager.getPerformanceMetrics();
    const now = Date.now();
    return metrics.pendingRequestsDetails.filter((req) => now - req.startTime > timeoutMs);
  }

  /**
   * Print a formatted report to console
   */
  static printReport(): void {
    const report = this.getPerformanceReport();

    console.group('🔍 SocketIO Debug Report');
    console.log(report.summary);

    console.group('📋 Recommendations');
    report.recommendations.forEach((rec) => console.log(rec));
    console.groupEnd();

    const slowRequests = this.getSlowRequests();
    if (slowRequests.length > 0) {
      console.group('🐌 Slow Requests (>2s)');
      slowRequests.slice(0, 5).forEach((req) => {
        console.log(`${req.event}: ${req.responseTime}ms`, req.data);
      });
      console.groupEnd();
    }

    const stuckRequests = this.getStuckRequests();
    if (stuckRequests.length > 0) {
      console.group('⏰ Stuck Requests (>10s)');
      stuckRequests.forEach((req) => {
        const age = Date.now() - req.startTime;
        console.log(`${req.type}: ${Math.round(age / 1000)}s ago`, req);
      });
      console.groupEnd();
    }

    console.groupEnd();
  }

  /**
   * Monitor performance in real-time
   */
  static startPerformanceMonitoring(intervalSeconds: number = 30): () => void {
    const interval = setInterval(() => {
      const report = this.getPerformanceReport();
      console.log(`[SocketIO Monitor] ${new Date().toLocaleTimeString()}`);
      console.log(report.summary);

      if (report.recommendations.some((r) => r.includes('⚠️'))) {
        console.warn('Performance issues detected:', report.recommendations);
      }
    }, intervalSeconds * 1000);

    console.log(`🔄 Started SocketIO performance monitoring (every ${intervalSeconds}s)`);
    console.log('Call the returned function to stop monitoring');

    return () => {
      clearInterval(interval);
      console.log('⏹️ Stopped SocketIO performance monitoring');
    };
  }

  /**
   * Export debug data for external analysis
   */
  static exportDebugData() {
    const data = {
      timestamp: new Date().toISOString(),
      metrics: this.socketManager.getPerformanceMetrics(),
      events: this.socketManager.getDebugEvents(),
      socketState: {
        isConnected: this.socketManager.isSocketConnected(),
        activeChannels: Array.from(this.socketManager.getActiveChannels()),
        activeRooms: Array.from(this.socketManager.getActiveRooms()),
        entityId: this.socketManager.getEntityId(),
        serverId: this.socketManager.getServerId(),
        activeSession: this.socketManager.getActiveSessionChannelId(),
      },
    };

    // Create downloadable file
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `socketio-debug-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log('📁 Debug data exported');
    return data;
  }

  /**
   * Clear all debug data
   */
  static clearData(): void {
    this.socketManager.clearDebugData();
    console.log('🗑️ Debug data cleared');
  }

  /**
   * Clear stuck requests older than specified time
   */
  static clearStuckRequests(olderThanMs: number = 30000): number {
    const cleared = this.socketManager.clearStuckRequests(olderThanMs);
    console.log(`🧹 Cleared ${cleared} stuck requests older than ${olderThanMs}ms`);
    return cleared;
  }

  /**
   * Clear all requests for a specific channel
   */
  static clearChannelRequests(channelId: string): number {
    const cleared = this.socketManager.clearRequestsForChannel(channelId);
    console.log(`🧹 Cleared ${cleared} requests for channel ${channelId}`);
    return cleared;
  }

  /**
   * Get detailed analysis of stuck requests
   */
  static analyzeStuckRequests(): {
    stuckRequests: any[];
    channelBreakdown: Record<string, number>;
    typeBreakdown: Record<string, number>;
    recommendations: string[];
  } {
    const stuckRequests = this.getStuckRequests(10000); // >10s
    const channelBreakdown: Record<string, number> = {};
    const typeBreakdown: Record<string, number> = {};
    const recommendations: string[] = [];

    stuckRequests.forEach((req) => {
      const channel = req.channelId || req.roomId || 'unknown';
      channelBreakdown[channel] = (channelBreakdown[channel] || 0) + 1;

      typeBreakdown[req.type] = (typeBreakdown[req.type] || 0) + 1;
    });

    // Generate recommendations
    if (stuckRequests.length > 0) {
      recommendations.push(`🚨 Found ${stuckRequests.length} stuck requests`);

      const channelWithMostStuck = Object.entries(channelBreakdown).sort(
        ([, a], [, b]) => b - a
      )[0];
      if (channelWithMostStuck) {
        recommendations.push(
          `🔍 Channel ${channelWithMostStuck[0]} has ${channelWithMostStuck[1]} stuck requests`
        );
      }

      const mostStuckType = Object.entries(typeBreakdown).sort(([, a], [, b]) => b - a)[0];
      if (mostStuckType) {
        recommendations.push(
          `🔍 Most stuck request type: ${mostStuckType[0]} (${mostStuckType[1]} requests)`
        );
      }

      recommendations.push('💡 Consider calling SocketDebug.clearStuck() to clean up');
    } else {
      recommendations.push('✅ No stuck requests found');
    }

    return {
      stuckRequests,
      channelBreakdown,
      typeBreakdown,
      recommendations,
    };
  }

  /**
   * Enhanced performance report with stuck request analysis
   */
  static getDetailedReport(): {
    performance: ReturnType<typeof SocketDebugUtils.getPerformanceReport>;
    stuckAnalysis: ReturnType<typeof SocketDebugUtils.analyzeStuckRequests>;
    connectionHealth: {
      status: string;
      activeChannels: number;
      responseRate: number;
      averageResponseTime: number;
      recommendations: string[];
    };
  } {
    const performance = this.getPerformanceReport();
    const stuckAnalysis = this.analyzeStuckRequests();

    const metrics = performance.metrics;
    const responseRate =
      metrics.totalRequests > 0 ? (metrics.totalResponses / metrics.totalRequests) * 100 : 0;

    const connectionHealth = {
      status: this.socketManager.isSocketConnected() ? 'connected' : 'disconnected',
      activeChannels: this.socketManager.getActiveChannels().size,
      responseRate: Math.round(responseRate),
      averageResponseTime: Math.round(metrics.averageResponseTime),
      recommendations: [] as string[],
    };

    // Health recommendations
    if (responseRate < 50) {
      connectionHealth.recommendations.push(
        '🚨 Very low response rate - check server connectivity'
      );
    } else if (responseRate < 80) {
      connectionHealth.recommendations.push('⚠️ Low response rate - possible network issues');
    }

    if (metrics.averageResponseTime > 3000) {
      connectionHealth.recommendations.push('🐌 High response times - check server performance');
    }

    if (metrics.pendingRequestsDetails.length > 5) {
      connectionHealth.recommendations.push(
        '⏳ Many pending requests - consider clearing stuck ones'
      );
    }

    if (connectionHealth.recommendations.length === 0) {
      connectionHealth.recommendations.push('✅ Connection health looks good');
    }

    return {
      performance,
      stuckAnalysis,
      connectionHealth,
    };
  }

  /**
   * Quick access for browser console debugging
   */
  static debug = {
    enable: () => this.enableDebug(true),
    disable: () => this.enableDebug(false),
    report: () => this.printReport(),
    detailed: () => this.getDetailedReport(),
    metrics: () => this.getPerformanceReport(),
    events: (count?: number) => this.getRecentEvents(count),
    slow: (threshold?: number) => this.getSlowRequests(threshold),
    stuck: (timeout?: number) => this.getStuckRequests(timeout),
    analyze: () => this.analyzeStuckRequests(),
    clearStuck: (timeout?: number) => this.clearStuckRequests(timeout),
    clearChannel: (channelId: string) => this.clearChannelRequests(channelId),
    monitor: (interval?: number) => this.startPerformanceMonitoring(interval),
    export: () => this.exportDebugData(),
    clear: () => this.clearData(),
  };
}

// Global debug access for browser console
if (typeof window !== 'undefined') {
  (window as any).SocketDebug = SocketDebugUtils.debug;
}

export default SocketDebugUtils;
