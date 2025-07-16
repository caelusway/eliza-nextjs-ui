'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { usePrivy } from '@privy-io/react-auth';
import ChatPreviewSlider from '@/components/login/chat-preview-slider';
import LoginForm from '@/components/login/login-form';

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
  
  const [inviteCode, setInviteCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [validationResult, setValidationResult] = useState<InviteValidationResult | null>(null);
  const [error, setError] = useState('');
  const [isCheckingExistingUser, setIsCheckingExistingUser] = useState(false);
  const [showExistingUserMode, setShowExistingUserMode] = useState(false);

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
      setError('You need an invite code to access AUBRAI. Please enter your invite code below.');
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
        
        if (!existingUserId) {
          // User exists, proceed to chat
          router.push('/chat');
        } else {
          // User doesn't exist - they need an invite
          console.log('[LoginPage] User not in database, logging out');
          setError('You need an invite code to access AUBRAI. Please enter your invite code below.');
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
          setError('You need an invite code to access AUBRAI. Please enter your invite code below.');
        } else {
          setError('Error connecting to the server. Please try again.');
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
      await login();
    } catch (err) {
      setError('Authentication failed');
      setIsAuthenticating(false);
    }
  };

  const handleSignIn = async () => {
    setError('');
    setIsAuthenticating(true);
    setShowExistingUserMode(true);
    
    try {
      await login();
    } catch (err) {
      setError('Authentication failed');
      setIsAuthenticating(false);
    }
  };

  const handleInviteRedemption = async () => {
    if (!inviteCode || !user?.id || !validationResult?.valid) return;
    
    try {
      console.log('Privy user object:', user);
      const requestBody = {
        code: inviteCode,
        userId: user.id,
        email: user.email?.address
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
        
        // Small delay to ensure auth state is properly set
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Redirect to chat
        router.push('/chat');
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
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF6E71] mb-4"></div>
          <p className="text-zinc-600 dark:text-zinc-400 text-sm">Initializing...</p>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white dark:bg-black">
      {/* Left Panel - Auth Section - Full width on mobile, 50% on desktop */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6 md:p-8 lg:p-12 min-h-screen lg:min-h-auto">
        <div className="w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-md xl:max-w-lg">
          {/* Logo */}
          <div className="mb-6 sm:mb-8 md:mb-10 lg:mb-12 text-center lg:text-left">
            <Image 
              src="/assets/aubrai_logo_white.png" 
              alt="AUBRAI" 
              width={200} 
              height={50} 
              className="h-14 sm:h-16 md:h-16 lg:h-16 w-auto mx-auto lg:mx-0"
            />
          </div>

          {/* Main Content */}
          <div className="space-y-4 sm:space-y-6 md:space-y-7 lg:space-y-8">
            {/* Hero Section */}
            <div className="text-center lg:text-left">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-4xl xl:text-4xl font-bold text-zinc-900 dark:text-white mb-3 sm:mb-4 leading-tight">
                Your longevity co-pilot
              </h1>
              <p className="text-base sm:text-lg md:text-xl lg:text-xl text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Expert AI guidance from Dr. Aubrey de Grey&apos;s research.
              </p>
            </div>

            {/* Welcome Message for New Users */}
            <div className="relative bg-gradient-to-r from-[#FF6E71]/10 to-[#FF6E71]/5 dark:from-[#FF6E71]/20 dark:to-[#FF6E71]/10 border border-[#FF6E71]/30 dark:border-[#FF6E71]/40 rounded-xl p-4 sm:p-5 md:p-6 lg:p-6 overflow-hidden">
              <div className="absolute top-0 right-0 w-16 sm:w-20 h-16 sm:h-20 bg-[#FF6E71]/5 rounded-full blur-xl"></div>
              <div className="relative flex items-start gap-3 sm:gap-4">
                <div className="flex-shrink-0 w-2 h-2 bg-[#FF6E71] rounded-full mt-2 animate-pulse" />
                <div className="text-sm sm:text-base">
                  <p className="text-[#FF6E71] dark:text-[#FF6E71] font-semibold mb-1">Welcome to AUBRAI</p>
                  <p className="text-[#FF6E71]/80 dark:text-[#FF6E71]/70 leading-relaxed">
                    Join thousands exploring longevity science with AI-powered insights from cutting-edge research.
                  </p>
                </div>
              </div>
            </div>

            {/* Auth Container */}
            <div className="pt-2 sm:pt-4 md:pt-6">
              <LoginForm
                onInviteSubmit={handleInviteSubmit}
                onSignIn={handleSignIn}
                isValidating={isValidating}
                isAuthenticating={isAuthenticating}
                error={error}
                isCheckingUser={isCheckingExistingUser}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Chat Preview Slider - Hidden on mobile, 50% on desktop */}
      <div className="hidden lg:block lg:w-1/2 bg-zinc-50 dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-700">
        <ChatPreviewSlider />
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF6E71] mb-4"></div>
          <p className="text-zinc-600 dark:text-zinc-400 text-sm">Loading...</p>
        </div>
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  );
}