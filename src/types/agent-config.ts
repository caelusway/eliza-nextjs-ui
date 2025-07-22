// Agent Theme Configuration
export interface AgentTheme {
  primaryColor: string;
  secondaryColor: string;
  accentColor?: string;
  themeName: string;
}

// Agent Assets Configuration
export interface AgentAssets {
  logo: string;
  bannerLogo: string;
  loginImage?: string;
  favicon: string;
  ogImage: string;
}

// Agent Content Configuration
export interface AgentContent {
  welcomeMessage: string;
  tagline: string;
  examplePrompts: string[];
  keywords: string[];
  aboutContent?: string;
}

// Agent Social Links
export interface AgentSocial {
  x?: string;
  discord?: string;
  website?: string;
  github?: string;
}

// Agent Feature Flags
export interface AgentFeatures {
  deepResearch: boolean;
  fileUpload: boolean;
  textToSpeech: boolean;
  voiceInput: boolean;
  voting: boolean;
}

// Agent API Configuration
export interface AgentApiConfig {
  elizaServerUrl: string;
  apiKey?: string;
  worldId: string;
}

// Main Agent Configuration Interface
export interface AgentConfig {
  // Core Identity
  id: string;
  name: string;
  displayName: string;
  description: string;
  shortDescription: string;
  domain?: string;

  // Visual & Branding
  theme: AgentTheme;
  assets: AgentAssets;

  // Content & Messaging
  content: AgentContent;

  // External Links
  social: AgentSocial;

  // Feature Flags
  features: AgentFeatures;

  // API Configuration
  api: AgentApiConfig;
}

// Environment Variables Interface
export interface AgentEnvironmentVariables {
  // Core Agent Identity
  NEXT_PUBLIC_AGENT_ID?: string;
  NEXT_PUBLIC_AGENT_NAME?: string;
  NEXT_PUBLIC_AGENT_DISPLAY_NAME?: string;
  NEXT_PUBLIC_AGENT_DESCRIPTION?: string;
  NEXT_PUBLIC_AGENT_SHORT_DESCRIPTION?: string;
  NEXT_PUBLIC_AGENT_DOMAIN?: string;

  // Branding & Theme
  NEXT_PUBLIC_AGENT_THEME?: string;
  NEXT_PUBLIC_PRIMARY_COLOR?: string;
  NEXT_PUBLIC_SECONDARY_COLOR?: string;
  NEXT_PUBLIC_ACCENT_COLOR?: string;

  // Assets
  NEXT_PUBLIC_AGENT_LOGO?: string;
  NEXT_PUBLIC_AGENT_BANNER_LOGO?: string;
  NEXT_PUBLIC_AGENT_LOGIN_IMAGE?: string;
  NEXT_PUBLIC_AGENT_FAVICON?: string;
  NEXT_PUBLIC_AGENT_OG_IMAGE?: string;

  // Content
  NEXT_PUBLIC_WELCOME_MESSAGE?: string;
  NEXT_PUBLIC_AGENT_TAGLINE?: string;
  NEXT_PUBLIC_EXAMPLE_PROMPTS?: string;
  NEXT_PUBLIC_AGENT_KEYWORDS?: string;
  NEXT_PUBLIC_ABOUT_CONTENT?: string;

  // Hero Section Content
  NEXT_PUBLIC_HERO_TITLE?: string;
  NEXT_PUBLIC_HERO_SUBTITLE?: string;
  NEXT_PUBLIC_ABOUT_TITLE?: string;
  NEXT_PUBLIC_ABOUT_BUTTON_TEXT?: string;
  NEXT_PUBLIC_MAIN_CTA_TEXT?: string;

  // Login Page Content
  NEXT_PUBLIC_LOGIN_HEADLINE?: string;
  NEXT_PUBLIC_LOGIN_SUBTITLE?: string;

  // Social Links
  NEXT_PUBLIC_AGENT_X_USERNAME?: string;
  NEXT_PUBLIC_AGENT_DISCORD_SERVER?: string;
  NEXT_PUBLIC_AGENT_WEBSITE_URL?: string;
  NEXT_PUBLIC_AGENT_GITHUB_URL?: string;

  // Features
  NEXT_PUBLIC_ENABLE_DEEP_RESEARCH?: string;
  NEXT_PUBLIC_ENABLE_FILE_UPLOAD?: string;
  NEXT_PUBLIC_ENABLE_TEXT_TO_SPEECH?: string;
  NEXT_PUBLIC_ENABLE_VOICE_INPUT?: string;
  NEXT_PUBLIC_ENABLE_VOTING?: string;

  // API Configuration
  NEXT_PUBLIC_APP_URL?: string;
  NEXT_PUBLIC_SERVER_URL?: string;
  NEXT_PUBLIC_API_KEY?: string;
  NEXT_PUBLIC_WORLD_ID?: string;
}

// Validation Result Interface
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Extended Agent Configuration for Template System
export interface TemplateAgentConfig extends AgentConfig {
  // Additional template-specific properties
  heroTitle?: string;
  heroSubtitle?: string;
  aboutTitle?: string;
  aboutButtonText?: string;
  mainCtaText?: string;
  loginHeadline?: string;
  loginSubtitle?: string;
} 