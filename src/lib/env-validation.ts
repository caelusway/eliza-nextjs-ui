import { AgentEnvironmentVariables, ValidationResult } from '@/types/agent-config';

export class EnvironmentValidator {
  private static instance: EnvironmentValidator;

  private constructor() {}

  public static getInstance(): EnvironmentValidator {
    if (!EnvironmentValidator.instance) {
      EnvironmentValidator.instance = new EnvironmentValidator();
    }
    return EnvironmentValidator.instance;
  }

  public validate(): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const env = process.env as unknown as AgentEnvironmentVariables;

    // Required environment variables
    const required = [
      'NEXT_PUBLIC_AGENT_ID',
      'NEXT_PUBLIC_SERVER_URL',
      'NEXT_PUBLIC_WORLD_ID',
    ];

    // Check required variables
    required.forEach(key => {
      if (!env[key as keyof AgentEnvironmentVariables]) {
        errors.push(`Missing required environment variable: ${key}`);
      }
    });

    // Recommended variables (warnings if missing)
    const recommended = [
      'NEXT_PUBLIC_AGENT_NAME',
      'NEXT_PUBLIC_AGENT_DESCRIPTION',
      'NEXT_PUBLIC_PRIMARY_COLOR',
      'NEXT_PUBLIC_EXAMPLE_PROMPTS',
    ];

    recommended.forEach(key => {
      if (!env[key as keyof AgentEnvironmentVariables]) {
        warnings.push(`Recommended environment variable missing: ${key}`);
      }
    });

    // Validate color formats
    this.validateColorFormat(env.NEXT_PUBLIC_PRIMARY_COLOR, 'NEXT_PUBLIC_PRIMARY_COLOR', errors);
    this.validateColorFormat(env.NEXT_PUBLIC_SECONDARY_COLOR, 'NEXT_PUBLIC_SECONDARY_COLOR', warnings);
    this.validateColorFormat(env.NEXT_PUBLIC_ACCENT_COLOR, 'NEXT_PUBLIC_ACCENT_COLOR', warnings);

    // Validate URLs
    this.validateUrl(env.NEXT_PUBLIC_APP_URL, 'NEXT_PUBLIC_APP_URL', warnings);
    this.validateUrl(env.NEXT_PUBLIC_SERVER_URL, 'NEXT_PUBLIC_SERVER_URL', errors);
    this.validateUrl(env.NEXT_PUBLIC_AGENT_WEBSITE_URL, 'NEXT_PUBLIC_AGENT_WEBSITE_URL', warnings);
    this.validateUrl(env.NEXT_PUBLIC_AGENT_DISCORD_SERVER, 'NEXT_PUBLIC_AGENT_DISCORD_SERVER', warnings);

    // Validate boolean flags
    const booleanFlags = [
      'NEXT_PUBLIC_ENABLE_DEEP_RESEARCH',
      'NEXT_PUBLIC_ENABLE_FILE_UPLOAD',
      'NEXT_PUBLIC_ENABLE_TEXT_TO_SPEECH',
      'NEXT_PUBLIC_ENABLE_VOICE_INPUT',
      'NEXT_PUBLIC_ENABLE_VOTING',
    ];

    booleanFlags.forEach(key => {
      const value = env[key as keyof AgentEnvironmentVariables];
      if (value && value !== 'true' && value !== 'false') {
        warnings.push(`${key} should be 'true' or 'false', got: ${value}`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  public logValidationResults(result: ValidationResult): void {
    if (result.errors.length > 0) {
      console.error('[Environment Validation] Errors:');
      result.errors.forEach(error => console.error(`  ❌ ${error}`));
    }

    if (result.warnings.length > 0) {
      console.warn('[Environment Validation] Warnings:');
      result.warnings.forEach(warning => console.warn(`  ⚠️  ${warning}`));
    }

    if (result.isValid && result.warnings.length === 0) {
      console.info('[Environment Validation] ✅ All environment variables valid');
    }
  }

  private validateColorFormat(color: string | undefined, varName: string, errors: string[]): void {
    if (!color) return;

    // Check for valid hex color format
    const hexRegex = /^#([0-9A-F]{3}){1,2}$/i;
    if (!hexRegex.test(color)) {
      errors.push(`${varName} should be a valid hex color (e.g., #FF0000), got: ${color}`);
    }
  }

  private validateUrl(url: string | undefined, varName: string, errors: string[]): void {
    if (!url) return;

    try {
      new URL(url);
    } catch {
      errors.push(`${varName} should be a valid URL, got: ${url}`);
    }
  }
}

// Export singleton instance
export const envValidator = EnvironmentValidator.getInstance(); 