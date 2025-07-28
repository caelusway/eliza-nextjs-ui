import { useMemo } from 'react';
import { uiConfig, UIConfig } from '@/config/ui-config';

/**
 * Hook to access UI configuration
 * @returns The complete UI configuration object
 */
export function useUIConfig(): UIConfig {
  return useMemo(() => uiConfig, []);
}

/**
 * Hook to access a specific section of UI configuration
 * @param section - The section name to access
 * @returns The requested section of the UI config
 */
export function useUIConfigSection<K extends keyof UIConfig>(section: K): UIConfig[K] {
  return useMemo(() => uiConfig[section], [section]);
}

/**
 * Hook to access feature flags from UI configuration
 * @returns Feature flags configuration
 */
export function useFeatureFlags() {
  return useMemo(() => uiConfig.features, []);
}

/**
 * Hook to check if a specific feature is enabled
 * @param feature - The feature flag to check
 * @returns Boolean indicating if the feature is enabled
 */
export function useFeatureFlag(feature: keyof UIConfig['features']): boolean {
  return useMemo(() => uiConfig.features[feature], [feature]);
}

/**
 * Hook to access SEO configuration
 * @returns SEO configuration
 */
export function useSEOConfig() {
  return useMemo(() => uiConfig.seo, []);
}

/**
 * Hook to access branding configuration
 * @returns Branding configuration
 */
export function useBranding() {
  return useMemo(() => uiConfig.branding, []);
}
