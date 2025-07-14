'use client';

import { usePrivy } from '@privy-io/react-auth';
import { v5 as uuidv5 } from 'uuid';
import { UUID_NAMESPACE } from '@/constants';

/**
 * Generate a deterministic UUID from an email address
 * @param email - The email address to convert to UUID
 * @returns {string} UUID v5 generated from the email
 */
export const uuidFromEmail = (email: string): string => {
  return uuidv5(email, UUID_NAMESPACE);
};

/**
 * User management utility for Privy authentication
 * Provides centralized user identification and authentication state
 */

export const useUserManager = () => {
  const { authenticated, user, ready } = usePrivy();

  /**
   * Get the current user's ID as a deterministic UUID
   * @returns {string | null} User UUID generated from email or null if not authenticated
   */
  const getUserId = (): string | null => {
    if (!ready || !authenticated || !user?.email?.address) {
      return null;
    }
    return uuidFromEmail(user.email.address);
  };

  /**
   * Get the current user's email address
   * @returns {string | null} User email or null if not authenticated
   */
  const getUserEmail = (): string | null => {
    if (!ready || !authenticated || !user) {
      return null;
    }
    return user.email?.address || null;
  };

  /**
   * Get the current user's display name
   * @returns {string} User email or "User" as fallback
   */
  const getUserName = (): string => {
    const email = getUserEmail();
    return email || 'User';
  };

  /**
   * Check if user is authenticated and ready
   * @returns {boolean} True if user is logged in and Privy is ready
   */
  const isUserAuthenticated = (): boolean => {
    return ready && authenticated && !!user?.email?.address;
  };

  /**
   * Check if Privy is ready (for loading states)
   * @returns {boolean} True if Privy has finished initializing
   */
  const isReady = (): boolean => {
    return ready;
  };

  /**
   * Get user wallet address if connected
   * @returns {string | null} Wallet address or null if not connected
   */
  const getUserWallet = (): string | null => {
    if (!ready || !authenticated || !user) {
      return null;
    }
    return user.wallet?.address || null;
  };

  return {
    getUserId,
    getUserEmail,
    getUserName,
    isUserAuthenticated,
    isReady,
    getUserWallet,
    user,
    authenticated,
    ready
  };
};

// Non-hook version for use in API routes and other contexts
export const getUserIdFromPrivy = (user: any): string | null => {
  const email = user?.email?.address;
  return email ? uuidFromEmail(email) : null;
};

export const getUserEmailFromPrivy = (user: any): string | null => {
  return user?.email?.address || null;
};

export const getUserNameFromPrivy = (user: any): string => {
  return user?.email?.address || 'User';
};