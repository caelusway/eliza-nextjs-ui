import { AgentConfig, AgentEnvironmentVariables } from '@/types/agent-config';
import { envValidator } from './env-validation';

class AgentConfigManager {
  private static instance: AgentConfigManager;
  private config: AgentConfig | null = null;

  private constructor() {}

  public static getInstance(): AgentConfigManager {
    if (!AgentConfigManager.instance) {
      AgentConfigManager.instance = new AgentConfigManager();
    }
    return AgentConfigManager.instance;
  }

  public getConfig(): AgentConfig {
    if (!this.config) {
      // Validate environment before loading config
      if (typeof window === 'undefined') {
        // Only validate on server-side to avoid client-side errors
        const validation = envValidator.validate();
        envValidator.logValidationResults(validation);
      }
      
      this.config = this.loadConfigFromEnvironment();
    }
    return this.config;
  }

  private loadConfigFromEnvironment(): AgentConfig {
    const env = process.env as unknown as AgentEnvironmentVariables;

    // Validate required environment variables
    this.validateRequiredEnvVars(env);

    // Parse arrays from comma-separated strings
    const parseCommaSeparated = (value?: string): string[] => {
      return value ? value.split(',').map(item => item.trim()).filter(Boolean) : [];
    };

    // Parse boolean from string
    const parseBoolean = (value?: string, defaultValue: boolean = false): boolean => {
      return value ? value.toLowerCase() === 'true' : defaultValue;
    };

    return {
      // Core Identity
      id: env.NEXT_PUBLIC_AGENT_ID || 'aubrai-agent',
      name: env.NEXT_PUBLIC_AGENT_NAME || 'AUBRAI',
      displayName: env.NEXT_PUBLIC_AGENT_DISPLAY_NAME || env.NEXT_PUBLIC_AGENT_NAME || 'AUBRAI',
      description: env.NEXT_PUBLIC_AGENT_DESCRIPTION || 'An AI assistant for longevity research and biological aging interventions',
      shortDescription: env.NEXT_PUBLIC_AGENT_SHORT_DESCRIPTION || 'Your longevity research companion',
      domain: env.NEXT_PUBLIC_AGENT_DOMAIN,

      // Theme & Branding
      theme: {
        primaryColor: env.NEXT_PUBLIC_PRIMARY_COLOR || '#3B82F6',
        secondaryColor: env.NEXT_PUBLIC_SECONDARY_COLOR || '#10B981',
        accentColor: env.NEXT_PUBLIC_ACCENT_COLOR,
        themeName: env.NEXT_PUBLIC_AGENT_THEME || 'default-theme',
      },

      // Assets
      assets: {
        logo: env.NEXT_PUBLIC_AGENT_LOGO || '/assets/bot.png',
        bannerLogo: env.NEXT_PUBLIC_AGENT_BANNER_LOGO || '/assets/agent-banner.png',
        loginImage: env.NEXT_PUBLIC_AGENT_LOGIN_IMAGE,
        favicon: env.NEXT_PUBLIC_AGENT_FAVICON || '/favicon.png',
        ogImage: env.NEXT_PUBLIC_AGENT_OG_IMAGE || '/og.png',
      },

      // Content
      content: {
        welcomeMessage: env.NEXT_PUBLIC_WELCOME_MESSAGE || `Hello! I'm ${env.NEXT_PUBLIC_AGENT_NAME || 'your AI assistant'}, here to help you.`,
        tagline: env.NEXT_PUBLIC_AGENT_TAGLINE || 'Your intelligent AI companion',
        examplePrompts: parseCommaSeparated(env.NEXT_PUBLIC_EXAMPLE_PROMPTS),
        keywords: parseCommaSeparated(env.NEXT_PUBLIC_AGENT_KEYWORDS),
        aboutContent: env.NEXT_PUBLIC_ABOUT_CONTENT,
      },

      // Social Links
      social: {
        x: env.NEXT_PUBLIC_AGENT_X_USERNAME,
        discord: env.NEXT_PUBLIC_AGENT_DISCORD_SERVER,
        website: env.NEXT_PUBLIC_AGENT_WEBSITE_URL,
        github: env.NEXT_PUBLIC_AGENT_GITHUB_URL,
      },

      // Features
      features: {
        deepResearch: parseBoolean(env.NEXT_PUBLIC_ENABLE_DEEP_RESEARCH, true),
        fileUpload: parseBoolean(env.NEXT_PUBLIC_ENABLE_FILE_UPLOAD, true),
        textToSpeech: parseBoolean(env.NEXT_PUBLIC_ENABLE_TEXT_TO_SPEECH, true),
        voiceInput: parseBoolean(env.NEXT_PUBLIC_ENABLE_VOICE_INPUT, true),
        voting: parseBoolean(env.NEXT_PUBLIC_ENABLE_VOTING, true),
      },

      // API Configuration
      api: {
        elizaServerUrl: env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000',
        apiKey: env.NEXT_PUBLIC_API_KEY,
        worldId: env.NEXT_PUBLIC_WORLD_ID || '00000000-0000-0000-0000-000000000000',
      },
    };
  }

  private validateRequiredEnvVars(env: AgentEnvironmentVariables): void {
    const required = [
      'NEXT_PUBLIC_AGENT_ID',
      'NEXT_PUBLIC_SERVER_URL', 
      'NEXT_PUBLIC_WORLD_ID',
    ];

    const missing = required.filter(key => !env[key as keyof AgentEnvironmentVariables]);

    if (missing.length > 0) {
      console.error('[AgentConfig] Missing environment variables:', missing);
      console.error('[AgentConfig] Available env vars:', Object.keys(process.env).filter(key => key.startsWith('NEXT_PUBLIC_')));
      
      // In development, provide defaults instead of throwing
      if (process.env.NODE_ENV === 'development') {
        console.warn('[AgentConfig] Using fallback values for missing environment variables in development');
        return;
      }
      
      throw new Error(
        `Missing required environment variables: ${missing.join(', ')}\n` +
        'Please check your .env file and ensure all required variables are set.'
      );
    }
  }

  // Utility methods for common operations
  public getThemeVariables(): Record<string, string> {
    const config = this.getConfig();
    const variables: Record<string, string> = {
      '--agent-primary': config.theme.primaryColor,
      '--agent-secondary': config.theme.secondaryColor,
    };

    if (config.theme.accentColor) {
      variables['--agent-accent'] = config.theme.accentColor;
    }

    return variables;
  }

  public isFeatureEnabled(feature: keyof AgentConfig['features']): boolean {
    return this.getConfig().features[feature];
  }

  public getAssetUrl(assetKey: keyof AgentConfig['assets']): string {
    return this.getConfig().assets[assetKey] || '';
  }

  public getSocialLinks(): Array<{ platform: string; url: string; username?: string }> {
    const social = this.getConfig().social;
    const links = [];

    if (social.x) {
      links.push({
        platform: 'x',
        url: `https://x.com/${social.x}`,
        username: social.x,
      });
    }

    if (social.discord) {
      links.push({
        platform: 'discord',
        url: social.discord,
      });
    }

    if (social.website) {
      links.push({
        platform: 'website',
        url: social.website,
      });
    }

    if (social.github) {
      links.push({
        platform: 'github',
        url: social.github,
      });
    }

    return links;
  }
}

// Export singleton instance
export const agentConfig = AgentConfigManager.getInstance();

// Export utility functions for direct use
export const getAgentConfig = () => agentConfig.getConfig();
export const isFeatureEnabled = (feature: keyof AgentConfig['features']) => 
  agentConfig.isFeatureEnabled(feature);
export const getAssetUrl = (assetKey: keyof AgentConfig['assets']) => 
  agentConfig.getAssetUrl(assetKey);
export const getThemeVariables = () => agentConfig.getThemeVariables();
export const getSocialLinks = () => agentConfig.getSocialLinks();