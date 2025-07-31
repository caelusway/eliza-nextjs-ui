/**
 * Agent Diagnostic Utility
 * Use this to test agent connectivity and message flow
 */

import SocketIOManager from './socketio-manager';
import { SocketDebugUtils } from './socket-debug-utils';

export class AgentDiagnostic {
  private socketManager = SocketIOManager.getInstance();

  /**
   * Run a comprehensive diagnostic test
   */
  public async runDiagnostic(
    agentId: string,
    userId: string
  ): Promise<{
    success: boolean;
    results: any;
    recommendations: string[];
  }> {
    console.log('🔍 Starting Agent Diagnostic...');

    const results: any = {
      timestamp: new Date().toISOString(),
      agentId,
      userId,
      steps: {},
    };

    const recommendations: string[] = [];

    try {
      // Step 1: Test server connectivity
      console.log('📡 Testing server connectivity...');
      try {
        const response = await fetch('/api/eliza/server/ping');
        const data = await response.json();
        results.steps.serverPing = { success: true, data };
        console.log('✅ Server ping successful');
      } catch (error) {
        results.steps.serverPing = { success: false, error: error.message };
        console.error('❌ Server ping failed:', error);
        recommendations.push('Check if ElizaOS server is running and accessible');
      }

      // Step 2: Test socket connection (without token for diagnostic)
      console.log('🔌 Testing socket connection...');
      this.socketManager.initialize(userId);

      await new Promise((resolve) => {
        const checkConnection = () => {
          if (this.socketManager.isSocketConnected()) {
            results.steps.socketConnection = { success: true };
            console.log('✅ Socket connection established');
            resolve(true);
          } else {
            setTimeout(checkConnection, 1000);
          }
        };
        checkConnection();

        // Timeout after 10 seconds
        setTimeout(() => {
          if (!this.socketManager.isSocketConnected()) {
            results.steps.socketConnection = { success: false, error: 'Connection timeout' };
            console.error('❌ Socket connection failed');
            recommendations.push('Check socket.io connection to ElizaOS server');
            resolve(false);
          }
        }, 10000);
      });

      // Step 3: Test agent direct communication
      console.log('🤖 Testing agent direct communication...');
      try {
        const testChannelId = `test-${Date.now()}`;

        // Create a test session
        const sessionResponse = await fetch('/api/chat-session/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            initialMessage: '🔍 Diagnostic test message - please respond',
          }),
        });

        if (sessionResponse.ok) {
          const sessionData = await sessionResponse.json();
          const channelId = sessionData.data.channelId;

          results.steps.sessionCreation = {
            success: true,
            channelId,
            sessionId: sessionData.data.sessionId,
          };

          // Join the channel and send a test message
          await this.socketManager.joinChannel(channelId);
          this.socketManager.setActiveSessionChannelId(channelId);

          // Listen for responses
          let receivedResponse = false;
          const responsePromise = new Promise((resolve) => {
            const handler = (data: any) => {
              if (data.senderId === agentId) {
                receivedResponse = true;
                results.steps.agentResponse = {
                  success: true,
                  response: data.text?.substring(0, 100) + '...',
                  responseTime: Date.now() - testStartTime,
                };
                console.log('✅ Agent responded successfully');
                this.socketManager.off('messageBroadcast', handler);
                resolve(true);
              }
            };
            this.socketManager.on('messageBroadcast', handler);

            // Timeout after 15 seconds
            setTimeout(() => {
              if (!receivedResponse) {
                results.steps.agentResponse = {
                  success: false,
                  error: 'No response received within 15 seconds',
                };
                console.error('❌ Agent did not respond');
                recommendations.push('Check if agent is running and configured correctly');
                recommendations.push('Verify agent ID matches the running agent');
                this.socketManager.off('messageBroadcast', handler);
                resolve(false);
              }
            }, 15000);
          });

          // Send test message
          const testStartTime = Date.now();
          this.socketManager.sendChannelMessage(
            '🔍 Diagnostic test message - please respond',
            channelId,
            'diagnostic_test'
          );

          await responsePromise;
        } else {
          results.steps.sessionCreation = {
            success: false,
            error: 'Failed to create test session',
          };
          recommendations.push('Check session creation API');
        }
      } catch (error) {
        results.steps.agentCommunication = {
          success: false,
          error: error.message,
        };
        recommendations.push('Check agent communication setup');
      }

      // Step 4: Get current debug metrics
      console.log('📊 Collecting debug metrics...');
      const debugInfo = SocketDebugUtils.getDetailedReport();
      results.debugMetrics = debugInfo;
    } catch (error) {
      console.error('💥 Diagnostic failed:', error);
      results.steps.error = { error: error.message };
      recommendations.push('Check console for detailed error information');
    }

    // Determine overall success
    const success = Object.values(results.steps).every((step: any) => step.success !== false);

    console.log('🏁 Diagnostic complete:', { success, results, recommendations });

    return { success, results, recommendations };
  }

  /**
   * Quick agent ping test
   */
  public async quickTest(agentId: string, userId: string, channelId: string): Promise<boolean> {
    console.log('⚡ Running quick agent test...');

    // Enable debugging for the test
    SocketDebugUtils.enableDebug(true);

    try {
      // Join channel and send test message
      await this.socketManager.joinChannel(channelId);
      this.socketManager.setActiveSessionChannelId(channelId);

      let responseReceived = false;
      const testPromise = new Promise<boolean>((resolve) => {
        const handler = (data: any) => {
          if (data.senderId === agentId) {
            console.log('✅ Quick test: Agent responded!');
            responseReceived = true;
            this.socketManager.off('messageBroadcast', handler);
            resolve(true);
          }
        };

        this.socketManager.on('messageBroadcast', handler);

        setTimeout(() => {
          if (!responseReceived) {
            console.log('❌ Quick test: No response received');
            this.socketManager.off('messageBroadcast', handler);
            resolve(false);
          }
        }, 10000);
      });

      // Send test message
      this.socketManager.sendChannelMessage('Quick test - are you there?', channelId, 'quick_test');

      const result = await testPromise;

      // Show debug info
      setTimeout(() => {
        console.log('📊 Quick test debug info:', SocketDebugUtils.getDetailedReport());
      }, 1000);

      return result;
    } catch (error) {
      console.error('💥 Quick test failed:', error);
      return false;
    }
  }

  /**
   * Get environment info for debugging
   */
  public getEnvironmentInfo(): any {
    return {
      socketUrl: process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000',
      agentId: process.env.NEXT_PUBLIC_AGENT_ID,
      userAgent: navigator.userAgent,
      socketConnected: this.socketManager.isSocketConnected(),
      activeChannels: Array.from(this.socketManager.getActiveChannels()),
      entityId: this.socketManager.getEntityId(),
      timestamp: new Date().toISOString(),
    };
  }
}

// Global access for browser console
if (typeof window !== 'undefined') {
  (window as any).AgentDiagnostic = new AgentDiagnostic();
}

export default AgentDiagnostic;
