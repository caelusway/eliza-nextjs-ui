'use client';

import { useState } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { usePrivy } from '@privy-io/react-auth';
import { getAgentConfig } from '@/lib/agent-config';

interface LoginFormProps {
  onInviteSubmit: (code: string) => void;
  onSignIn: () => void;
  isValidating: boolean;
  isAuthenticating: boolean;
  error: string;
  isCheckingUser: boolean;
}

export default function LoginForm({
  onInviteSubmit,
  onSignIn,
  isValidating,
  isAuthenticating,
  error,
  isCheckingUser
}: LoginFormProps) {
  const [inviteCode, setInviteCode] = useState('');
  const [showExistingUserMode, setShowExistingUserMode] = useState(false);
  const { login, ready, authenticated } = usePrivy();
  const agentConfig = getAgentConfig();

  const formatInviteCode = (value: string) => {
    // Remove non-alphanumeric characters and convert to uppercase
    const formatted = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    return formatted.slice(0, 12);
  };

  const handleInviteChange = (e: { target: { value: string } }) => {
    const formatted = formatInviteCode(e.target.value);
    setInviteCode(formatted);
  };

  const handleInviteSubmit = (e: { preventDefault: () => void }) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;
    onInviteSubmit(inviteCode);
  };

  const handlePrivyLogin = async () => {
    try {
      await login();
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleExistingUserLogin = () => {
    setShowExistingUserMode(true);
    handlePrivyLogin();
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-600/50 rounded-lg p-3 sm:p-4 flex items-start gap-2 shadow-sm">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs sm:text-sm text-red-600 dark:text-red-200 leading-relaxed">{error}</p>
        </div>
      )}

      {/* Checking User State */}
      {isCheckingUser && (
        <div className="flex items-center justify-center gap-2 py-6 sm:py-8">
          <Loader2 className="w-4 h-4 animate-spin text-[#FF6E71]" 
                   style={{ color: agentConfig.theme.primaryColor }} />
          <span className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">Verifying your account...</span>
        </div>
      )}

      {/* Sign In Button for Existing Users */}
      {!isCheckingUser && ready && (
        <button
          onClick={handleExistingUserLogin}
          disabled={isAuthenticating || !ready}
          style={{ '--tw-ring-color': agentConfig.theme.primaryColor } as React.CSSProperties}
          className={cn(
            "w-full flex items-center justify-center gap-2 px-4 py-3 sm:py-4",
            "bg-zinc-900 border border-zinc-800 rounded-lg",
            "text-white font-medium",
            "hover:bg-zinc-800 transition-all duration-200",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "focus:outline-none focus:ring-2 focus:ring-[#FF6E71] focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-black",
            "min-h-[48px] sm:min-h-[52px] text-sm sm:text-base",
            "active:scale-[0.98] transform"
          )}
        >
          {isAuthenticating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Signing in...</span>
            </>
          ) : (
            <span>Already a user? Sign in</span>
          )}
        </button>
      )}

      {/* Divider */}
      <div className="flex items-center gap-3 py-3 sm:py-4">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-zinc-300 to-transparent dark:from-transparent dark:via-zinc-700 dark:to-transparent" />
        <span className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 font-medium px-2">or</span>
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-zinc-300 to-transparent dark:from-transparent dark:via-zinc-700 dark:to-transparent" />
      </div>

      {/* Invite Code Form */}
      {ready && (
        <form onSubmit={handleInviteSubmit} className="space-y-4 sm:space-y-5">
          <div>
            <label htmlFor="invite-code" className="block text-xs sm:text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Invite Code
            </label>
            <input
              id="invite-code"
              type="text"
              value={inviteCode}
              onChange={handleInviteChange}
              placeholder="Enter your invite code"
              style={{ '--tw-ring-color': agentConfig.theme.primaryColor } as React.CSSProperties}
              className={cn(
                "w-full px-3 py-3 sm:py-4 rounded-lg text-sm sm:text-base",
                "bg-white dark:bg-zinc-950 border text-zinc-900 dark:text-white",
                "placeholder:text-zinc-500 dark:placeholder:text-zinc-400",
                "focus:outline-none focus:ring-2 focus:ring-[#FF6E71] focus:border-transparent",
                "transition-all duration-200 shadow-sm",
                "hover:border-zinc-300 dark:hover:border-zinc-600",
                "min-h-[48px] sm:min-h-[52px]",
                error ? "border-red-500 bg-red-50/50 dark:bg-red-900/10" : "border-zinc-200 dark:border-zinc-700"
              )}
              autoFocus
              autoComplete="off"
              autoCapitalize="off"
              spellCheck="false"
            />
          </div>

          <button
            type="submit"
            disabled={!inviteCode || isValidating || isAuthenticating || !ready}
            style={{ backgroundColor: agentConfig.theme.primaryColor }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = agentConfig.theme.secondaryColor || agentConfig.theme.primaryColor}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = agentConfig.theme.primaryColor}
            className={cn(
              "w-full min-h-[48px] sm:min-h-[52px] text-sm sm:text-base font-semibold rounded-lg",
              "bg-[#FF6E71] hover:bg-[#E55A5D] text-white",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "transition-colors duration-200",
              "flex items-center justify-center gap-2"
            )}
          >
            {isValidating || isAuthenticating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{isValidating ? 'Validating...' : 'Authenticating...'}</span>
              </>
            ) : (
              <span>Continue with invite</span>
            )}
          </button>
        </form>
      )}

      {/* Terms */}
      <div className="pt-4 sm:pt-5">
        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 text-center leading-relaxed">
          By continuing, you acknowledge {agentConfig.name}&apos;s{' '}
          <a 
            href="/privacy" 
            className="text-[#FF6E71] hover:text-[#E55A5D] dark:hover:text-[#FF8A8D] underline underline-offset-2 font-medium transition-colors"
            style={{ color: agentConfig.theme.primaryColor }}
            onMouseEnter={(e) => e.currentTarget.style.color = agentConfig.theme.secondaryColor || agentConfig.theme.primaryColor}
            onMouseLeave={(e) => e.currentTarget.style.color = agentConfig.theme.primaryColor}
          >
            Privacy Policy
          </a>
          .
        </p>
      </div>
    </div>
  );
} 