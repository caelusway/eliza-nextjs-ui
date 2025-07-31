'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useMemo,
  useCallback,
} from 'react';
import { useUserManager } from '@/lib/user-manager';
import { getUserRowIdByPrivyId, ensureSupabaseUser } from '@/services/user-service';

interface UserDataContextType {
  userRowId: string | null;
  loading: boolean;
  error: string | null;
  refreshUserData: () => void;
}

const UserDataContext = createContext<UserDataContextType | undefined>(undefined);

interface UserDataProviderProps {
  children: ReactNode;
}

export const UserDataProvider = ({ children }: UserDataProviderProps) => {
  const [userRowId, setUserRowId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  const { getUserId, isUserAuthenticated } = useUserManager();
  const userId = getUserId();
  const authenticated = isUserAuthenticated();

  const fetchUserRowId = useCallback(
    async (force = false) => {
      if (!authenticated || !userId) {
        setUserRowId(null);
        setInitialized(true);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        console.log('[UserDataProvider] Fetching user row ID for userId:', userId);

        // Direct service call for user row ID lookup (with local caching)
        const cacheKey = `user-row-id-${userId}`;
        let rowId: string | null = null;

        if (!force) {
          // Check local cache first
          const cached = localStorage.getItem(cacheKey);
          if (cached) {
            const { data, expiry } = JSON.parse(cached);
            if (Date.now() < expiry) {
              rowId = data;
              console.log('[UserDataProvider] Using cached user row ID:', rowId);
            }
          }
        }

        if (!rowId) {
          // Get from service and cache
          rowId = await getUserRowIdByPrivyId(userId);
          if (rowId) {
            localStorage.setItem(
              cacheKey,
              JSON.stringify({
                data: rowId,
                expiry: Date.now() + 300000, // 5 minutes
              })
            );
          }
        }

        if (!rowId) {
          console.log('[UserDataProvider] No user row ID found, creating user in Supabase...');

          try {
            await ensureSupabaseUser(userId);
            console.log('[UserDataProvider] User created in Supabase, retrying rowId fetch...');

            // Retry getting the row ID after user creation
            const newRowId = await getUserRowIdByPrivyId(userId);
            console.log('[UserDataProvider] New user row ID:', newRowId);
            setUserRowId(newRowId);
          } catch (createError) {
            console.error('[UserDataProvider] Failed to create user in Supabase:', createError);
            setError('Failed to initialize user profile');
            setUserRowId(null);
          }
        } else {
          setUserRowId(rowId);
        }
      } catch (err) {
        console.error('[UserDataProvider] Failed to get user row ID:', err);
        setError(err instanceof Error ? err.message : 'Failed to load user data');
        setUserRowId(null);
      } finally {
        setLoading(false);
        setInitialized(true);
      }
    },
    [authenticated, userId]
  );

  const refreshUserData = useCallback(() => {
    if (authenticated && userId) {
      fetchUserRowId(true);
    }
  }, [fetchUserRowId, authenticated, userId]);

  // Initialize user data when auth state changes
  useEffect(() => {
    if (!initialized || (authenticated && userId && !userRowId && !loading)) {
      fetchUserRowId();
    }
  }, [authenticated, userId, initialized, userRowId, loading, fetchUserRowId]);

  // Reset when user logs out
  useEffect(() => {
    if (!authenticated) {
      setUserRowId(null);
      setError(null);
      setInitialized(true);
    }
  }, [authenticated]);

  const value: UserDataContextType = useMemo(
    () => ({
      userRowId,
      loading,
      error,
      refreshUserData,
    }),
    [userRowId, loading, error, refreshUserData]
  );

  return <UserDataContext.Provider value={value}>{children}</UserDataContext.Provider>;
};

export const useUserData = () => {
  const context = useContext(UserDataContext);
  if (context === undefined) {
    throw new Error('useUserData must be used within a UserDataProvider');
  }
  return context;
};
