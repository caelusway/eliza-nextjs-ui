'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { usePrivy } from '@privy-io/react-auth';
import ChatPreviewSlider from '@/components/login/chat-preview-slider';
import LoginForm from '@/components/login/login-form';
import { PostHogTracking } from '@/lib/posthog';
import { useUserManager } from '@/lib/user-manager';
import { useUIConfigSection } from '@/hooks/use-ui-config';

interface InviteValidationResult {
  valid: boolean;
  invite?: {
    id: string;
    code: string;
    is_legacy: boolean;
    expires_at: string;
  };
  error?: string;
}

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, logout, authenticated, ready, user } = usePrivy();
  const { getUserId } = useUserManager();

  const loginConfig = useUIConfigSection('login');
  const brandingConfig = useUIConfigSection('branding');
  const loginBrandingConfig = useUIConfigSection('loginBranding');

  const [inviteCode, setInviteCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [validationResult, setValidationResult] = useState<InviteValidationResult | null>(null);
  const [error, setError] = useState('');
  const [isCheckingExistingUser, setIsCheckingExistingUser] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Check for invite code in URL params on mount
  useEffect(() => {
    const urlInviteCode = searchParams.get('invite');
    if (urlInviteCode) {
      setInviteCode(urlInviteCode);
      validateInvite(urlInviteCode);
    }

    // Check for error params
    const errorParam = searchParams.get('error');
    if (errorParam === 'not-invited') {
      setError(loginConfig.inviteRequiredError);
    } else if (errorParam === 'auth-error') {
      setError('Authentication error. Please try again.');
    }
  }, [searchParams]);

  // Handle post-authentication flow
  useEffect(() => {
    const checkUserAndProceed = async () => {
      if (!authenticated || !user?.id) return;

      // If we have a valid invite, redeem it
      if (validationResult?.valid && inviteCode) {
        await handleInviteRedemption();
        return;
      }

      // Otherwise, check if user exists in database
      setIsCheckingExistingUser(true);
      try {
        const { getUserRowIdByPrivyId } = await import('@/services/user-service');
        const existingUserId = await getUserRowIdByPrivyId(user.id);

        if (existingUserId) {
          // User exists, show loading animation during redirect
          setIsRedirecting(true);
          console.log('[LoginPage] Existing user found, redirecting...');

          // Track user sign in
          PostHogTracking.getInstance().userSignIn({
            email: user.email?.address,
            userId: getUserId(),
          });

          // Check for return URL parameter
          const returnUrl = searchParams.get('returnUrl');
          if (returnUrl) {
            router.push(decodeURIComponent(returnUrl));
          } else {
            router.push('/chat');
          }
        } else {
          // User doesn't exist - they need an invite
          console.log('[LoginPage] User not in database, logging out');
          setError(loginConfig.inviteRequiredError);
          setIsAuthenticating(false);
          // Clear any cached auth data
          try {
            localStorage.removeItem('aubrai:auth');
            localStorage.removeItem('cachedUserIds');
          } catch {}
          // Log them out
          await logout();
        }
      } catch (error: any) {
        console.error('[LoginPage] Error checking user:', error);
        // More specific error handling
        if (error?.message?.includes('not found') || error?.code === 'PGRST116') {
          setError(loginConfig.inviteRequiredError);
        } else {
          setError('Error connecting to the server. Please try again.');
          PostHogTracking.getInstance().authError(
            'user_check_failed',
            error?.message || 'Unknown error'
          );
        }
        setIsAuthenticating(false);
        await logout();
      } finally {
        setIsCheckingExistingUser(false);
      }
    };

    checkUserAndProceed();
  }, [authenticated, validationResult, inviteCode, user?.id, router]);

  const validateInvite = async (code: string): Promise<boolean> => {
    if (!code) return false;

    setIsValidating(true);
    setError('');

    try {
      const response = await fetch('/api/invites/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      const result = await response.json();

      if (response.ok && result.valid) {
        setValidationResult(result);
        setError('');
        return true;
      } else {
        setError(result.error || 'Invalid invite code');
        setValidationResult({ valid: false });
        return false;
      }
    } catch (err) {
      setError('Failed to validate invite code');
      setValidationResult({ valid: false });
      return false;
    } finally {
      setIsValidating(false);
    }
  };

  const handleInviteSubmit = async (code: string) => {
    if (!code.trim()) {
      setError('Please enter an invite code');
      return;
    }

    setInviteCode(code);

    // Validate invite first
    const result = await validateInvite(code);
    if (!result) return;

    // If valid, proceed with authentication
    setIsAuthenticating(true);
    try {
      await login({
        loginMethods: ['email'],
      });
    } catch (err) {
      setError('Authentication failed');
      setIsAuthenticating(false);
      PostHogTracking.getInstance().authError(
        'invite_login_failed',
        err instanceof Error ? err.message : 'Authentication failed'
      );
    }
  };

  const handleInviteWithEmailSubmit = async (code: string, email: string) => {
    setInviteCode(code);
    setIsAuthenticating(true);
    setError('');

    try {
      // Validate invite first
      const result = await validateInvite(code);
      if (!result) {
        setIsAuthenticating(false);
        return;
      }

      // Store the email and invite code for later use during authentication
      localStorage.setItem('pending-invite-email', email);
      localStorage.setItem('pending-invite-code', code);

      // Use loginWithOAuth to create account with email
      await login({
        loginMethods: ['email'],
      });
    } catch (err) {
      setError('Authentication failed');
      setIsAuthenticating(false);
      PostHogTracking.getInstance().authError(
        'invite_email_login_failed',
        err instanceof Error ? err.message : 'Authentication failed'
      );
    }
  };

  const handleInviteRedemption = async () => {
    if (!inviteCode || !user?.id || !validationResult?.valid) return;

    try {
      console.log('Privy user object:', user);
      const requestBody = {
        code: inviteCode,
        userId: user.id,
        email: user.email?.address,
      };
      console.log('Sending redeem request:', requestBody);

      const response = await fetch('/api/invites/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      console.log('Redeem response status:', response.status, response.ok);

      // Try to get response text first
      const responseText = await response.text();
      console.log('Raw response:', responseText);

      let data;
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch (e) {
        console.error('Failed to parse response:', e);
        data = { error: 'Invalid response from server' };
      }

      if (response.ok) {
        console.log('Redeem success:', data);

        // Track invite redemption and user signup
        PostHogTracking.getInstance().inviteRedeemed(inviteCode, getUserId());
        PostHogTracking.getInstance().userSignUp({
          email: user.email?.address,
          userId: getUserId(),
          inviteCode,
        });

        // Keep loading animation during redirect process
        console.log('[LoginPage] Invite redeemed successfully, preparing redirect...');

        // Small delay to ensure auth state is properly set
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Set redirecting state for better UX
        setIsRedirecting(true);

        // Check for return URL parameter
        const returnUrl = searchParams.get('returnUrl');
        console.log('[LoginPage] Redirecting user to:', returnUrl || '/chat');

        if (returnUrl) {
          router.push(decodeURIComponent(returnUrl));
        } else {
          router.push('/chat');
        }
        // Note: Animation continues until page navigation completes
      } else {
        console.error('Redeem error:', data);
        if (data.details) {
          console.error('Error details:', data.details);
        }
        if (data.type) {
          console.error('Error type:', data.type);
        }
        setError(data.error || `Failed to redeem invite (${response.status})`);
        setIsAuthenticating(false);
      }
    } catch (err) {
      console.error('Error during invite redemption:', err);
      setError('An error occurred. Please try again.');
      setIsAuthenticating(false);
    }
  };

  // Show loading state while Privy initializes
  if (!ready) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: '#292929' }}
      >
        <div className="text-center">
          <div
            className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 mb-4"
            style={{ borderColor: brandingConfig.primaryColor }}
          ></div>
          <p className="text-zinc-400 text-sm">{loginConfig.initializingText}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Panel - Auth Section - Full width on mobile, 50% on desktop */}
      <div
        className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6 md:p-6 lg:p-8 min-h-screen lg:min-h-auto"
        style={{ backgroundColor: '#292929' }}
      >
        <div className="w-full max-w-sm sm:max-w-md md:max-w-md lg:max-w-md xl:max-w-md">
          {/* Logo */}
          <div className="mb-6 sm:mb-6 md:mb-8 lg:mb-8 text-center lg:text-left">
            <Image
              src={loginBrandingConfig.logoImage}
              alt={loginBrandingConfig.logoAlt}
              width={loginBrandingConfig.logoWidth}
              height={loginBrandingConfig.logoHeight}
              className="max-h-8 sm:max-h-10 md:max-h-12 lg:max-h-16 w-auto mx-auto lg:mx-0"
              priority
            />
          </div>

          {/* Main Content */}
          <div className="space-y-4 sm:space-y-5 md:space-y-5 lg:space-y-6">
            {/* Hero Section */}
            <div className="text-center lg:text-left">
              <h1 className="text-xl sm:text-2xl md:text-2xl lg:text-3xl xl:text-3xl font-bold text-white mb-2 sm:mb-3 leading-tight">
                {loginConfig.heroTitle}
              </h1>
              <p className="text-sm sm:text-base md:text-base lg:text-lg text-zinc-400 leading-relaxed">
                {loginConfig.heroSubtitle}
              </p>
            </div>

            {/* Auth Container */}
            <div className="pt-2 sm:pt-3 md:pt-4 relative">
              <LoginForm
                onInviteSubmit={handleInviteSubmit}
                onInviteWithEmailSubmit={handleInviteWithEmailSubmit}
                isValidating={isValidating}
                isAuthenticating={isAuthenticating}
                error={error}
                isCheckingUser={isCheckingExistingUser}
              />

              {/* Loading overlay for user authentication checks */}
              {(isAuthenticating || isCheckingExistingUser || isRedirecting) && (
                <div
                  className="absolute inset-0 backdrop-blur-sm rounded-lg flex items-center justify-center z-10"
                  style={{ backgroundColor: 'rgba(41, 41, 41, 0.8)' }}
                >
                  <div className="text-center">
                    <div
                      className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 mb-3"
                      style={{ borderColor: brandingConfig.primaryColor }}
                    ></div>
                    <p className="text-sm text-zinc-400">
                      {isRedirecting
                        ? loginConfig.redirectingText
                        : isCheckingExistingUser
                          ? loginConfig.verifyingAccountText
                          : isValidating
                            ? loginConfig.validatingInviteText
                            : loginConfig.signingInText}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Chat Preview Slider - Hidden on mobile, 50% on desktop */}
      <div className="hidden lg:block lg:w-1/2 bg-black border-l border-zinc-800">
        <ChatPreviewSlider />
      </div>
    </div>
  );
}

function LoginPageSuspenseFallback() {
  const loginConfig = useUIConfigSection('login');
  const brandingConfig = useUIConfigSection('branding');

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: '#292929' }}
    >
      <div className="text-center">
        <div
          className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 mb-4"
          style={{ borderColor: brandingConfig.primaryColor }}
        ></div>
        <p className="text-zinc-400 text-sm">{loginConfig.loadingText}</p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginPageSuspenseFallback />}>
      <LoginPageContent />
    </Suspense>
  );
}
